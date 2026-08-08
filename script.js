const c = document.getElementById("view");
const ctx = c.getContext("2d");

let ORI = "Z";

function setOri(o) {
    ORI = o;
    document.querySelectorAll(".ori button").forEach(b => b.classList.remove("active"));
    document.getElementById("o" + o.toLowerCase()).classList.add("active");
    draw();
}

function parseInputValue(id) {
    let raw = (document.getElementById(id).value || "").toString().trim();
    if (!raw) return 0;
    
    // Loại bỏ hoàn toàn dấu chấm (nếu có) và xử lý dấu phẩy làm phần thập phân
    raw = raw.replace(/\./g, '').replace(',', '.');
    return parseFloat(raw) || 0;
}

function draw() {
    c.width = c.offsetWidth;
    c.height = 280;

    let L = parseInputValue("dx");
    let W = parseInputValue("dy");
    let H = parseInputValue("dz");

    ctx.clearRect(0, 0, c.width, c.height);

    drawAxis();

    if (L === 0 && W === 0 && H === 0) return;

    let maxDim = Math.max(Math.abs(L), Math.abs(W), Math.abs(H), 100);
    let scale = 110 / maxDim;

    let l = L * scale;
    let w = W * scale;
    let h = H * scale;

    let cx = c.width / 2 - 20;
    let cy = c.height / 2 + 30;

    if (ORI === "Z") {
        drawBox3DSharp(cx, cy, l, w, h, `L=${L}`, `W=${W}`, `H=${H}`, 'Z');
    } else if (ORI === "X") {
        drawBox3DSharp(cx, cy, h, w, l, `H=${H}`, `W=${W}`, `L=${L}`, 'X');
    } else if (ORI === "Y") {
        drawBox3DSharp(cx, cy, l, h, w, `L=${L}`, `H=${H}`, `W=${W}`, 'Y');
    }
}

/* 1. TRỤC TỌA ĐỘ CHUẨN */
function drawAxis() {
    ctx.lineWidth = 2.5;
    ctx.font = "bold 13px Segoe UI";

    let x0 = 50, y0 = 220;

    ctx.strokeStyle = "#e74c3c";
    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 50, y0);
    ctx.stroke();
    ctx.fillText("X", x0 + 55, y0 + 4);

    ctx.strokeStyle = "#2980b9";
    ctx.fillStyle = "#2980b9";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 35, y0 - 35);
    ctx.stroke();
    ctx.fillText("Y", x0 + 40, y0 - 38);

    ctx.strokeStyle = "#27ae60";
    ctx.fillStyle = "#27ae60";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y0 - 50);
    ctx.stroke();
    ctx.fillText("Z", x0 - 4, y0 - 55);
}

/* 2. CHUYỂN ĐỔI TỌA ĐỘ ISOMETRIC CHUẨN */
function projectISO(x, y, z, cx, cy) {
    let kY = 0.55; 
    return {
        x: cx + x + y * kY,
        y: cy - z - y * kY
    };
}

/* 3. VẼ HÌNH HỘP 3D BO GÓC VỚI MÀU SÁNG HƠN NỀN */
function drawBox3DSharp(cx, cy, d1, d2, d3, lbl1, lbl2, lbl3, ori) {
    // Lấy giá trị bo góc từ input
    let r1 = parseInputValue("r1");
    let r2 = parseInputValue("r2");
    let r3 = parseInputValue("r3");
    let r4 = parseInputValue("r4");
    
    // Giới hạn bo góc không vượt quá kích thước
    let maxR = Math.min(d1, d2) / 2;
    r1 = Math.min(r1, maxR);
    r2 = Math.min(r2, maxR);
    r3 = Math.min(r3, maxR);
    r4 = Math.min(r4, maxR);
    
    // Tỷ lệ bo góc theo scale
    let scaleR = Math.min(d1, d2) / Math.max(Math.abs(parseInputValue("dx")), Math.abs(parseInputValue("dy")), 1);
    let r1s = r1 * scaleR;
    let r2s = r2 * scaleR;
    let r3s = r3 * scaleR;
    let r4s = r4 * scaleR;
    
    ctx.lineWidth = 2;
    let offsetX = cx - d1 / 2;
    let offsetY = cy + d3 / 2;

    // Màu sắc cho nhãn theo Orientation (trùng với màu trục tọa độ)
    // X = đỏ (#e74c3c), Y = xanh dương (#2980b9), Z = xanh lá (#27ae60)
    const labelColors = {
        'X': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' },
        'Y': { l1: '#e74c3c', l2: '#27ae60', l3: '#2980b9' },
        'Z': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' }
    };
    
    let colorMap = labelColors[ori] || labelColors['Z'];
    let labelColor1 = colorMap.l1;
    let labelColor2 = colorMap.l2;
    let labelColor3 = colorMap.l3;

    // Màu sắc khung 3D
    const colors = {
        border: "#4a9eff",
        fill: "rgba(74, 158, 255, 0.18)",
        borderTop: "#6ab0ff",
        fillTop: "rgba(74, 158, 255, 0.10)",
        label: "#e8edf5",
        shadow: "rgba(74, 158, 255, 0.08)"
    };

    // Vẽ bóng đổ
    ctx.shadowColor = "rgba(74, 158, 255, 0.15)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 10;

    // Hàm vẽ góc bo tròn trên mặt phẳng XY (đáy và mặt trên)
    function drawRoundedRect(ox, oy, w, h, rTL, rTR, rBR, rBL, isTop) {
        // Chuyển sang tọa độ isometric
        const pts = [];
        const segments = 12;
        
        // Hàm tạo điểm trên cung tròn
        function arcPoint(cx, cy, r, startAngle, endAngle, numSeg) {
            const pts = [];
            for (let i = 0; i <= numSeg; i++) {
                const t = startAngle + (endAngle - startAngle) * (i / numSeg);
                const px = cx + r * Math.cos(t);
                const py = cy + r * Math.sin(t);
                pts.push({x: px, y: py});
            }
            return pts;
        }
        
        // Điểm góc trên mặt phẳng XY
        // Góc TL (trên trái)
        let pTL = {x: ox + rTL, y: oy};
        let pTR = {x: ox + w - rTR, y: oy};
        let pBR = {x: ox + w, y: oy + h - rBR};
        let pBL = {x: ox + rBL, y: oy + h};
        
        // Các cung bo góc
        let arcTL = arcPoint(ox + rTL, oy + rTL, rTL, Math.PI, 3*Math.PI/2, segments);
        let arcTR = arcPoint(ox + w - rTR, oy + rTR, rTR, 3*Math.PI/2, 2*Math.PI, segments);
        let arcBR = arcPoint(ox + w - rBR, oy + h - rBR, rBR, 0, Math.PI/2, segments);
        let arcBL = arcPoint(ox + rBL, oy + h - rBL, rBL, Math.PI/2, Math.PI, segments);
        
        // Gom tất cả điểm theo thứ tự
        const allPoints = [
            {x: pTL.x, y: pTL.y},
            ...arcTL,
            {x: pTR.x, y: pTR.y},
            ...arcTR,
            {x: pBR.x, y: pBR.y},
            ...arcBR,
            {x: pBL.x, y: pBL.y},
            ...arcBL
        ];
        
        // Chuyển sang isometric
        return allPoints.map(p => projectISO(p.x, p.y, 0, offsetX, offsetY));
    }
    
    // Vẽ đáy (mặt dưới)
    let bottomPoints = drawRoundedRect(0, 0, d1, d2, r1s, r2s, r3s, r4s, false);
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 12;
    ctx.strokeStyle = colors.border;
    ctx.fillStyle = colors.fill;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bottomPoints[0].x, bottomPoints[0].y);
    for (let i = 1; i < bottomPoints.length; i++) {
        ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    
    // Vẽ mặt trên
    let topPoints = drawRoundedRect(0, 0, d1, d2, r1s, r2s, r3s, r4s, true);
    // Dịch lên theo chiều Z
    let topPointsOffset = topPoints.map(p => {
        let zOffset = projectISO(0, 0, d3, 0, 0);
        return {x: p.x, y: p.y - d3};
    });
    
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;
    ctx.strokeStyle = colors.borderTop;
    ctx.fillStyle = colors.fillTop;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(topPointsOffset[0].x, topPointsOffset[0].y);
    for (let i = 1; i < topPointsOffset.length; i++) {
        ctx.lineTo(topPointsOffset[i].x, topPointsOffset[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Vẽ các cạnh đứng nối từ đáy lên mặt trên
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    
    // Lấy các điểm góc của đáy và mặt trên
    const corners = [
        {x: 0, y: 0},           // TL
        {x: d1, y: 0},          // TR
        {x: d1, y: d2},         // BR
        {x: 0, y: d2}           // BL
    ];
    
    // Điều chỉnh vị trí góc theo bo góc
    const cornerOffsets = [
        {x: r1s, y: r1s},       // TL
        {x: -r2s, y: r2s},      // TR
        {x: -r3s, y: -r3s},     // BR
        {x: r4s, y: -r4s}       // BL
    ];
    
    for (let i = 0; i < 4; i++) {
        let cxCorner = corners[i].x + cornerOffsets[i].x;
        let cyCorner = corners[i].y + cornerOffsets[i].y;
        
        let bottom = projectISO(cxCorner, cyCorner, 0, offsetX, offsetY);
        let top = projectISO(cxCorner, cyCorner, d3, offsetX, offsetY);
        
        ctx.beginPath();
        ctx.moveTo(bottom.x, bottom.y);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
    
    // Vẽ các đường nét mờ cho các cạnh khuất
    ctx.strokeStyle = "rgba(74, 158, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    // Cạnh khuất phía sau
    const hiddenCorners = [
        {x: 0, y: d2, ox: r4s, oy: -r4s},
        {x: d1, y: d2, ox: -r3s, oy: -r3s}
    ];
    for (let i = 0; i < hiddenCorners.length; i++) {
        let cxCorner = hiddenCorners[i].x + hiddenCorners[i].ox;
        let cyCorner = hiddenCorners[i].y + hiddenCorners[i].oy;
        let bottom = projectISO(cxCorner, cyCorner, 0, offsetX, offsetY);
        let top = projectISO(cxCorner, cyCorner, d3, offsetX, offsetY);
        ctx.beginPath();
        ctx.moveTo(bottom.x, bottom.y);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Vẽ nhãn kích thước với màu theo Orientation
    ctx.font = "bold 14px Segoe UI";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Vị trí và màu sắc cho từng nhãn
    let labelPositions = [
        {x: d1/2, y: 0, z: 0, color: labelColor1},    // L - màu đỏ
        {x: d1, y: d2/2, z: d3, color: labelColor2},   // W - màu xanh dương
        {x: 0, y: 0, z: d3/2, color: labelColor3}      // H - màu xanh lá
    ];
    
    let labels = [lbl1, lbl2, lbl3];
    let labelOffsets = [
        {x: 0, y: -15},  // Length - phía trên
        {x: 12, y: -5},  // Width - bên phải
        {x: -50, y: 5}   // Height - bên trái
    ];
    
    for (let i = 0; i < 3; i++) {
        let lx = labelPositions[i].x;
        let ly = labelPositions[i].y;
        let lz = labelPositions[i].z;
        let p = projectISO(lx, ly, lz, offsetX, offsetY);
        
        // Đặt màu cho từng nhãn
        ctx.fillStyle = labelPositions[i].color;
        ctx.fillText(labels[i], p.x + labelOffsets[i].x, p.y + labelOffsets[i].y);
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function log(t) {
    const chatBox = document.getElementById("chat");
    chatBox.innerHTML += `<div>${t}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== VOICE RECOGNITION CẢI TIẾN - NHẬN DIỆN TẤT CẢ CÁC LOẠI SỐ =====
function voice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        alert("Trình duyệt của bạn chưa hỗ trợ Voice!");
        return;
    }

    let startMsg = "Xin chào, tôi có thể giúp gì cho bạn";
    log("🤖 " + startMsg);

    window.speechSynthesis.cancel();
    let u = new SpeechSynthesisUtterance(startMsg);
    u.lang = "vi-VN";
    u.rate = 0.95;

    let hasReceivedResult = false;

    u.onend = () => {
        log("🔴 <i>Đang nghe...</i>");
        
        let r = new SR();
        r.lang = "vi-VN";
        r.continuous = true;
        r.interimResults = true;
        r.maxAlternatives = 5;

        let silenceTimer = null;
        let finalText = "";
        let isProcessing = false;

        r.onstart = () => {
            hasReceivedResult = false;
        };

        r.onresult = (e) => {
            hasReceivedResult = true;
            let final = "";
            
            for (let i = e.resultIndex; i < e.results.length; i++) {
                if (e.results[i].isFinal) {
                    final += e.results[i][0].transcript;
                }
            }
            
            if (final) {
                finalText = final;
            }
            
            clearTimeout(silenceTimer);
            
            if (finalText && !isProcessing) {
                isProcessing = true;
                silenceTimer = setTimeout(() => {
                    try {
                        r.stop();
                    } catch(e) {}
                    processFullVoiceNLP(finalText);
                    isProcessing = false;
                }, 1000);
            }
        };

        r.onerror = (e) => {
            if (e.error === 'no-speech') {
                return;
            }
            
            if (e.error === 'not-allowed') {
                let errorMsg = "Vui lòng cho phép truy cập microphone!";
                log("🤖 " + errorMsg);
                speak(errorMsg);
                return;
            }
            
            if (hasReceivedResult && finalText && !isProcessing) {
                isProcessing = true;
                processFullVoiceNLP(finalText);
                isProcessing = false;
            }
        };

        r.onend = () => {
            if (finalText && !isProcessing) {
                isProcessing = true;
                processFullVoiceNLP(finalText);
                isProcessing = false;
            }
        };

        try {
            r.start();
        } catch(e) {
            let errorMsg = "Không thể truy cập microphone!";
            log("🤖 " + errorMsg);
            speak(errorMsg);
        }
    };

    window.speechSynthesis.speak(u);
}

// HÀM CHUYỂN ĐỔI SỐ TỪ CHỮ SANG SỐ
function convertVietnameseNumberToNumber(text) {
    // Xử lý các trường hợp đặc biệt: "một" -> "1", "hai" -> "2", ...
    const numberMap = {
        'không': '0', 'một': '1', 'hai': '2', 'ba': '3', 'bốn': '4',
        'năm': '5', 'sáu': '6', 'bảy': '7', 'tám': '8', 'chín': '9',
        'mười': '10', 'trăm': '100', 'ngàn': '1000', 'nghìn': '1000',
        'triệu': '1000000', 'tỷ': '1000000000', 'tỉ': '1000000000',
        'âm': '-', 'trừ': '-', 'rưỡi': '.5', 'phẩy': '.'
    };
    
    // Xử lý số âm
    let isNegative = false;
    let processedText = text;
    
    // Kiểm tra từ "âm" hoặc "trừ" ở đầu
    if (/^(âm|trừ)\s+/i.test(processedText)) {
        isNegative = true;
        processedText = processedText.replace(/^(âm|trừ)\s+/i, '');
    }
    
    // Thay thế từng từ bằng số
    let result = processedText;
    for (let [word, num] of Object.entries(numberMap)) {
        // Chỉ thay thế khi từ đứng riêng
        let regex = new RegExp('\\b' + word + '\\b', 'gi');
        result = result.replace(regex, num);
    }
    
    // Xử lý dấu phẩy và dấu chấm
    result = result.replace(/\s*,\s*/g, ',');
    result = result.replace(/\s*\.\s*/g, '.');
    
    // Xóa khoảng trắng thừa
    result = result.replace(/\s+/g, ' ');
    result = result.trim();
    
    // Nếu có dấu trừ
    if (isNegative && !result.startsWith('-')) {
        result = '-' + result;
    }
    
    return result;
}

function processFullVoiceNLP(t) {
    log("👤 " + t);

    // 1. CHUẨN HÓA VĂN BẢN - XỬ LÝ SỐ TỰ NHIÊN
    let str = t.toLowerCase()
               .replace(/\b(âm|trừ)\b/g, "-")
               .replace(/\bphẩy\b/g, ",")
               .replace(/\bchấm\b/g, "")
               .replace(/\b(độ|dộ)\b/g, "")
               .replace(/\b(milimét|mm|li|milimet)\b/g, "")
               .replace(/\b(khoảng|khoang|khoản)\b/g, "")
               .replace(/\b(và|với|vơi)\b/g, " ");

    // 2. XỬ LÝ SỐ HÀNG TRĂM, NGHÌN, TRIỆU, TỶ
    // Ví dụ: "một trăm hai mươi ba" -> "123"
    // "hai nghìn ba trăm bốn mươi lăm" -> "2345"
    // "một triệu hai trăm ba mươi tư nghìn năm trăm sáu mươi bảy" -> "1234567"
    
    // Chuyển đổi số từ chữ sang số
    let numberStr = convertVietnameseNumberToNumber(str);
    
    // Tìm tất cả số trong câu (bao gồm số âm, số thập phân)
    let allNumbers = numberStr.match(/-?\d+[.,]?\d*/g) || [];
    
    // Làm sạch số
    let cleanNumbers = allNumbers.map(n => {
        // Loại bỏ dấu chấm hàng nghìn
        n = n.replace(/\./g, '');
        // Chuyển dấu phẩy thành dấu chấm cho parseFloat
        n = n.replace(',', '.');
        return n;
    });

    let updatedCount = 0;
    let detectedInfo = [];

    const cleanNumberString = (numStr) => {
        if (!numStr) return "0";
        numStr = numStr.trim().replace(/\s+/g, '');
        // Loại bỏ dấu chấm hàng nghìn
        numStr = numStr.replace(/\./g, '');
        // Chuyển dấu phẩy thành dấu chấm
        numStr = numStr.replace(',', '.');
        return numStr;
    };

    // Hàm tìm số gần nhất với từ khóa
    const findVal = (keywords) => {
        for (let kw of keywords) {
            // Tìm từ khóa và số đằng sau
            let regex = new RegExp(`${kw}(?:\\s*(?:là|bằng|:|\\s))?\\s*(-?\\s*[\\d.,]+)`, "i");
            let match = str.match(regex);
            if (match) {
                let val = cleanNumberString(match[1]);
                if (val) return val;
            }
            
            // Tìm từ khóa và số đằng trước
            regex = new RegExp(`(-?\\s*[\\d.,]+)\\s*(?:\\s*(?:là|bằng|:|\\s))?\\s*${kw}`, "i");
            match = str.match(regex);
            if (match) {
                let val = cleanNumberString(match[1]);
                if (val) return val;
            }
        }
        return null;
    };

    // 1. NHẬN DIỆN ORIENTATION
    if (/(trục|hướng|ori)\s*(theo\s*trục\s*)?x\b/i.test(str) || 
        /\bx\b/i.test(str) && !/(trục|hướng|ori)\s*(theo\s*trục\s*)?(y|z)/i.test(str)) { 
        setOri('X'); 
        updatedCount++; 
        detectedInfo.push("Orientation: X");
    }
    else if (/(trục|hướng|ori)\s*(theo\s*trục\s*)?y\b/i.test(str) || 
             /\by\b/i.test(str) && !/(trục|hướng|ori)\s*(theo\s*trục\s*)?(x|z)/i.test(str)) { 
        setOri('Y'); 
        updatedCount++; 
        detectedInfo.push("Orientation: Y");
    }
    else if (/(trục|hướng|ori)\s*(theo\s*trục\s*)?(z|zét|zed|dét)\b/i.test(str) || 
             /\b(z|zét|zed)\b/i.test(str) && !/(trục|hướng|ori)\s*(theo\s*trục\s*)?(x|y)/i.test(str)) { 
        setOri('Z'); 
        updatedCount++; 
        detectedInfo.push("Orientation: Z");
    }

    // 2. NHẬN DIỆN POSITION (X, Y, Z)
    let posX = findVal(["tọa độ x", "vị trí x", "pos x", "position x", "đồ ít", "tọa độ ít", "x"]);
    let posY = findVal(["tọa độ y", "vị trí y", "pos y", "position y", "y"]);
    let posZ = findVal(["tọa độ zét", "tọa độ zed", "tọa độ z", "vị trí z", "pos z", "position z", "zét", "zed", "z"]);

    if (posX !== null) { 
        document.getElementById("px").value = posX; 
        updatedCount++; 
        detectedInfo.push(`X: ${posX}mm`);
    }
    if (posY !== null) { 
        document.getElementById("py").value = posY; 
        updatedCount++; 
        detectedInfo.push(`Y: ${posY}mm`);
    }
    if (posZ !== null) { 
        document.getElementById("pz").value = posZ; 
        updatedCount++; 
        detectedInfo.push(`Z: ${posZ}mm`);
    }

    // 3. NHẬN DIỆN DIMENSION (L, W, H)
    let len = findVal(["chiều dài", "độ dài", "dài", "length", "l"]);
    let wid = findVal(["chiều rộng", "độ rộng", "rộng", "width", "w"]);
    let hei = findVal(["chiều cao", "độ cao", "cao", "height", "h"]);

    if (len !== null) { 
        document.getElementById("dx").value = len; 
        updatedCount++; 
        detectedInfo.push(`Length: ${len}mm`);
    }
    if (wid !== null) { 
        document.getElementById("dy").value = wid; 
        updatedCount++; 
        detectedInfo.push(`Width: ${wid}mm`);
    }
    if (hei !== null) { 
        document.getElementById("dz").value = hei; 
        updatedCount++; 
        detectedInfo.push(`Height: ${hei}mm`);
    }

    // 4. NHẬN DIỆN CORNER RADIUS (R1, R2, R3, R4)
    let rad1 = findVal(["r1", "radius 1", "bo góc 1", "bán kính 1", "góc 1"]);
    let rad2 = findVal(["r2", "radius 2", "bo góc 2", "bán kính 2", "góc 2"]);
    let rad3 = findVal(["r3", "radius 3", "bo góc 3", "bán kính 3", "góc 3"]);
    let rad4 = findVal(["r4", "radius 4", "bo góc 4", "bán kính 4", "góc 4"]);
    let radAll = findVal(["bo góc", "bán kính", "radius", "r"]);

    if (rad1 !== null) { 
        document.getElementById("r1").value = rad1; 
        updatedCount++; 
        detectedInfo.push(`R1: ${rad1}mm`);
    }
    if (rad2 !== null) { 
        document.getElementById("r2").value = rad2; 
        updatedCount++; 
        detectedInfo.push(`R2: ${rad2}mm`);
    }
    if (rad3 !== null) { 
        document.getElementById("r3").value = rad3; 
        updatedCount++; 
        detectedInfo.push(`R3: ${rad3}mm`);
    }
    if (rad4 !== null) { 
        document.getElementById("r4").value = rad4; 
        updatedCount++; 
        detectedInfo.push(`R4: ${rad4}mm`);
    }
    
    if (radAll !== null && rad1 === null && rad2 === null && rad3 === null && rad4 === null) {
        document.getElementById("r1").value = radAll;
        document.getElementById("r2").value = radAll;
        document.getElementById("r3").value = radAll;
        document.getElementById("r4").value = radAll;
        updatedCount++;
        detectedInfo.push(`All Radius: ${radAll}mm`);
    }

    // 5. NHẬN DIỆN LỆNH CHO CÁC NÚT CHỨC NĂNG
    if (/(export|save|lưu|tạo|tạo file|xuất|xuất file)/i.test(str) && updatedCount === 0) {
        saveFile();
        log("📁 Đã xuất file theo yêu cầu!");
        speak("Đã xuất file thành công!");
        return;
    }
    
    if (/(reset|làm mới|đặt lại|mặc định)/i.test(str) && updatedCount === 0) {
        reset();
        log("🔄 Đã reset tất cả thông số!");
        speak("Đã reset thành công!");
        return;
    }
    
    if (/(help|hướng dẫn|giúp|trợ giúp)/i.test(str) && updatedCount === 0) {
        help();
        log("❓ Đang mở hướng dẫn!");
        speak("Đang mở hướng dẫn!");
        return;
    }
    
    if (/(library|thư viện|kho|mở thư viện)/i.test(str) && updatedCount === 0) {
        library();
        return;
    }

    // 6. NẾU KHÔNG CÓ TỪ KHÓA, THỬ NHẬN DIỆN CHUỖI SỐ
    if (updatedCount === 0) {
        // Lấy tất cả số từ text đã chuẩn hóa
        let rawNums = str.match(/-?\d+[.,]?\d*/g);
        if (!rawNums || rawNums.length === 0) {
            // Thử lấy từ chuỗi đã chuyển đổi số từ chữ
            rawNums = numberStr.match(/-?\d+[.,]?\d*/g);
        }
        
        if (rawNums && rawNums.length >= 3) {
            let cleanNums = rawNums.map(n => cleanNumberString(n));
            // Lấy 3 số đầu tiên cho L, W, H
            let vals = cleanNums.filter(n => n !== '0' && n !== '');
            while (vals.length < 3) {
                vals.push('0');
            }
            document.getElementById("dx").value = vals[0] || 0;
            document.getElementById("dy").value = vals[1] || 0;
            document.getElementById("dz").value = vals[2] || 0;
            updatedCount = 3;
            detectedInfo.push(`Length: ${vals[0]}mm, Width: ${vals[1]}mm, Height: ${vals[2]}mm`);
        }
    }

    // 7. PHẢN HỒI KẾT QUẢ
    if (updatedCount > 0) {
        draw();
        let detailMsg = "✅ Đã nhận diện: " + detectedInfo.join(", ");
        log("🤖 " + detailMsg);
        let successMsg = "File của bạn đã được tạo xong";
        log("🤖 " + successMsg);
        speak(successMsg);
    } else {
        let failMsg = "Chưa nhận diện được thông số, vui lòng thử lại!";
        log("🤖 " + failMsg);
        speak(failMsg);
    }
}

function speak(t) {
    window.speechSynthesis.cancel();
    let u = new SpeechSynthesisUtterance(t);
    u.lang = "vi-VN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
}

/* 4. CHỈNH SỬA CHUẨN ORI KHI XUẤT FILE .MAC THEO ĐÚNG HƯỚNG ĐƯỢC CHỌN */
function saveFile() {
    let px = parseInputValue("px");
    let py = parseInputValue("py");
    let pz = parseInputValue("pz");

    let
