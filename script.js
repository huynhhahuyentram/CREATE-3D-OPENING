const c = document.getElementById("view");
const ctx = c.getContext("2d");

let ORI = "Z";

function setOri(o) {
    ORI = o;
    document.querySelectorAll(".ori button").forEach(b => b.classList.remove("active"));
    const btn = document.getElementById("o" + o.toLowerCase());
    if (btn) btn.classList.add("active");
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
    let r1 = parseInputValue("r1");
    let r2 = parseInputValue("r2");
    let r3 = parseInputValue("r3");
    let r4 = parseInputValue("r4");
    
    let maxR = Math.min(d1, d2) / 2;
    r1 = Math.min(r1, maxR);
    r2 = Math.min(r2, maxR);
    r3 = Math.min(r3, maxR);
    r4 = Math.min(r4, maxR);
    
    let scaleR = Math.min(d1, d2) / Math.max(Math.abs(parseInputValue("dx")), Math.abs(parseInputValue("dy")), 1);
    let r1s = r1 * scaleR;
    let r2s = r2 * scaleR;
    let r3s = r3 * scaleR;
    let r4s = r4 * scaleR;
    
    ctx.lineWidth = 2;
    let offsetX = cx - d1 / 2;
    let offsetY = cy + d3 / 2;

    const labelColors = {
        'X': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' },
        'Y': { l1: '#e74c3c', l2: '#27ae60', l3: '#2980b9' },
        'Z': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' }
    };
    
    let colorMap = labelColors[ori] || labelColors['Z'];
    let labelColor1 = colorMap.l1;
    let labelColor2 = colorMap.l2;
    let labelColor3 = colorMap.l3;

    const colors = {
        border: "#4a9eff",
        fill: "rgba(74, 158, 255, 0.18)",
        borderTop: "#6ab0ff",
        fillTop: "rgba(74, 158, 255, 0.10)",
        label: "#e8edf5",
        shadow: "rgba(74, 158, 255, 0.08)"
    };

    ctx.shadowColor = "rgba(74, 158, 255, 0.15)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 10;

    function drawRoundedRect(ox, oy, w, h, rTL, rTR, rBR, rBL, isTop) {
        const segments = 12;
        
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
        
        let pTL = {x: ox + rTL, y: oy};
        let pTR = {x: ox + w - rTR, y: oy};
        let pBR = {x: ox + w, y: oy + h - rBR};
        let pBL = {x: ox + rBL, y: oy + h};
        
        let arcTL = arcPoint(ox + rTL, oy + rTL, rTL, Math.PI, 3*Math.PI/2, segments);
        let arcTR = arcPoint(ox + w - rTR, oy + rTR, rTR, 3*Math.PI/2, 2*Math.PI, segments);
        let arcBR = arcPoint(ox + w - rBR, oy + h - rBR, rBR, 0, Math.PI/2, segments);
        let arcBL = arcPoint(ox + rBL, oy + h - rBL, rBL, Math.PI/2, Math.PI, segments);
        
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
        
        return allPoints.map(p => projectISO(p.x, p.y, 0, offsetX, offsetY));
    }
    
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
    
    let topPoints = drawRoundedRect(0, 0, d1, d2, r1s, r2s, r3s, r4s, true);
    let topPointsOffset = topPoints.map(p => {
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
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    
    const corners = [
        {x: 0, y: 0},
        {x: d1, y: 0},
        {x: d1, y: d2},
        {x: 0, y: d2}
    ];
    
    const cornerOffsets = [
        {x: r1s, y: r1s},
        {x: -r2s, y: r2s},
        {x: -r3s, y: -r3s},
        {x: r4s, y: -r4s}
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
    
    ctx.strokeStyle = "rgba(74, 158, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
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
    
    ctx.font = "bold 14px Segoe UI";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    let labelPositions = [
        {x: d1/2, y: 0, z: 0, color: labelColor1},
        {x: d1, y: d2/2, z: d3, color: labelColor2},
        {x: 0, y: 0, z: d3/2, color: labelColor3}
    ];
    
    let labels = [lbl1, lbl2, lbl3];
    let labelOffsets = [
        {x: 0, y: -15},
        {x: 12, y: -5},
        {x: -50, y: 5}
    ];
    
    for (let i = 0; i < 3; i++) {
        let lx = labelPositions[i].x;
        let ly = labelPositions[i].y;
        let lz = labelPositions[i].z;
        let p = projectISO(lx, ly, lz, offsetX, offsetY);
        
        ctx.fillStyle = labelPositions[i].color;
        ctx.fillText(labels[i], p.x + labelOffsets[i].x, p.y + labelOffsets[i].y);
    }
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function log(t) {
    const chatBox = document.getElementById("chat");
    if (chatBox) {
        chatBox.innerHTML += `<div>${t}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

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

    u.onend = () => {
        log("🔴 <i>Đang nghe...</i>");
        let r = new SR();
        r.lang = "vi-VN"; 
        r.continuous = true;
        r.interimResults = false;

        let silenceTimer = null;

        r.onresult = e => {
            let text = e.results[e.results.length - 1][0].transcript;
            
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                r.stop();
                processFullVoiceNLP(text);
            }, 2000);
        };

        r.onerror = () => {
            let errorMsg = "Chưa nhận diện được thông số, vui lòng thử lại!";
            log("🤖 " + errorMsg);
            speak(errorMsg);
        };

        r.start();
    };

    window.speechSynthesis.speak(u);
}

function processFullVoiceNLP(t) {
    log("👤 " + t);

    // 1. Chuẩn hóa giọng nói tự nhiên, đổi các từ chỉ số âm & dấu thập phân
    let str = t.toLowerCase()
               .replace(/\b(âm|trừ)\b/g, "-")
               .replace(/\bphẩy\b/g, ",")
               .replace(/\bchấm\b/g, "");

    // 2. Xóa các dấu chấm phân cách hàng nghìn (VD: 5.000 -> 5000)
    str = str.replace(/(\d+)\.(\d+)/g, '$1$2');

    let updatedCount = 0;

    const cleanNumberString = (numStr) => {
        if (!numStr) return "0";
        numStr = numStr.trim().replace(/\s+/g, '');
        return numStr.replace(',', '.');
    };

    // Hàm nhận diện số đứng TRƯỚC hoặc SAU từ khóa
    const findVal = (keywords) => {
        for (let kw of keywords) {
            // Trường hợp 1: Số nằm SAU từ khóa (VD: chiều cao 2000, r1 là 150)
            let regAfter = new RegExp(`${kw}(?:\\s+là|\\s+bằng|\\s*[:=])?\\s*(-?\\s*\\d+(?:,\\d+)?)`, "i");
            let matchAfter = str.match(regAfter);
            if (matchAfter) {
                return cleanNumberString(matchAfter[1]);
            }
            
            // Trường hợp 2: Số nằm TRƯỚC từ khóa (VD: 2000 chiều cao, -500 vị trí x)
            let regBefore = new RegExp(`(-?\\s*\\d+(?:,\\d+)?)\\s*(?:mm)?\\s*${kw}`, "i");
            let matchBefore = str.match(regBefore);
            if (matchBefore) {
                return cleanNumberString(matchBefore[1]);
            }
        }
        return null;
    };

    // 3. NHẬN DIỆN LỆNH NÚT BẤM BÊN DƯỚI
    if (/(xuất mac|export|tải file|tạo file|lưu file|ok)/i.test(str)) {
        saveFile();
        updatedCount++;
    } else if (/(trợ giúp|hướng dẫn|help)/i.test(str)) {
        help();
        updatedCount++;
    } else if (/(thư viện|library)/i.test(str)) {
        library();
        updatedCount++;
    } else if (/(đặt lại|reset|làm mới|xóa hết)/i.test(str)) {
        reset();
        updatedCount++;
    }

    // 4. NHẬN DIỆN ORIENTATION
    if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?x\b/i.test(str)) { setOri('X'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?y\b/i.test(str)) { setOri('Y'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?(z|zét|zed)\b/i.test(str)) { setOri('Z'); updatedCount++; }

    // 5. NHẬN DIỆN POSITION (X, Y, Z)
    let posX = findVal(["tọa độ x", "vị trí x", "pos x", "position x", "đồ ít", "tọa độ ít", "tọa độ xy", "x"]);
    let posY = findVal(["tọa độ y", "vị trí y", "pos y", "position y", "y"]);
    let posZ = findVal(["tọa độ zét", "tọa độ zed", "tọa độ z", "vị trí z", "pos z", "position z", "z"]);

    if (posX !== null) { document.getElementById("px").value = posX; updatedCount++; }
    if (posY !== null) { document.getElementById("py").value = posY; updatedCount++; }
    if (posZ !== null) { document.getElementById("pz").value = posZ; updatedCount++; }

    // 6. NHẬN DIỆN KÍCH THƯỚC (L, W, H)
    let len = findVal(["chiều dài", "độ dài", "dài", "length", "l"]);
    let wid = findVal(["chiều rộng", "độ rộng", "rộng", "width", "w"]);
    let hei = findVal(["chiều cao", "độ cao", "cao", "height", "h"]);

    if (len !== null) { document.getElementById("dx").value = len; updatedCount++; }
    if (wid !== null) { document.getElementById("dy").value = wid; updatedCount++; }
    if (hei !== null) { document.getElementById("dz").value = hei; updatedCount++; }

    // 7. NHẬN DIỆN BO GÓC (R1, R2, R3, R4)
    let rad1 = findVal(["r1", "radius 1", "bo góc 1", "bán kính 1"]);
    let rad2 = findVal(["r2", "radius 2", "bo góc 2", "bán kính 2"]);
    let rad3 = findVal(["r3", "radius 3", "bo góc 3", "bán kính 3"]);
    let rad4 = findVal(["r4", "radius 4", "bo góc 4", "bán kính 4"]);
    let radAll = findVal(["bo góc tất cả", "bo cả 4 góc", "tất cả góc bo", "bán kính bo", "bo góc"]);

    if (rad1 !== null) { document.getElementById("r1").value = rad1; updatedCount++; }
    if (rad2 !== null) { document.getElementById("r2").value = rad2; updatedCount++; }
    if (rad3 !== null) { document.getElementById("r3").value = rad3; updatedCount++; }
    if (rad4 !== null) { document.getElementById("r4").value = rad4; updatedCount++; }
    
    // Chỉ cập nhật bo góc chung khi không có thông số kích thước/tọa độ đè vào
    if (radAll !== null && rad1 === null && rad2 === null && rad3 === null && rad4 === null && len === null && wid === null && hei === null) {
        document.getElementById("r1").value = radAll;
        document.getElementById("r2").value = radAll;
        document.getElementById("r3").value = radAll;
        document.getElementById("r4").value = radAll;
        updatedCount++;
    }

    // 8. Nếu đọc chuỗi 3 số liên tiếp tự do (VD: "-200,5 3000 -4500")
    if (updatedCount === 0) {
        let rawNums = str.match(/-?\d+(,\d+)?/g);
        if (rawNums && rawNums.length >= 3) {
            document.getElementById("dx").value = cleanNumberString(rawNums[0]);
            document.getElementById("dy").value = cleanNumberString(rawNums[1]);
            document.getElementById("dz").value = cleanNumberString(rawNums[2]);
            updatedCount = 3;
        }
    }

    // PHẢN HỒI LẠI TRÊN BÀN HÌNH VÀ PHÁT ÂM
    if (updatedCount > 0) {
        draw();
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

    let L = parseInputValue("dx");
    let W = parseInputValue("dy");
    let H = parseInputValue("dz");

    let r1 = parseInputValue("r1");
    let r2 = parseInputValue("r2");
    let r3 = parseInputValue("r3");
    let r4 = parseInputValue("r4");

    let oriStr = "ORI Y is Y and Z is Z";
    if (ORI === "X") {
        oriStr = "ORI Y is Y and Z is X";
    } else if (ORI === "Y") {
        oriStr = "ORI Y is -X and Z is Y";
    } else if (ORI === "Z") {
        oriStr = "ORI Y is Y and Z is Z";
    }

    let data = `NEW EQUIPMENT
USRCOG ( X ( 0 ) Y ( 0 ) Z ( 0 ) )
USRWCO ( X ( 0 ) Y ( 0 ) Z ( 0 ) )
POS X ${px}mm Y ${py}mm Z ${pz}mm
${oriStr}
BUIL false
DSCO unset
PTSP unset
INSC unset

NEW EXTRUSION
ORI Y is -Y and Z is Z
LEVE 0 2
HEIG ${H}mm

NEW LOOP

NEW VERTEX
FRAD ${r1}mm

END
NEW VERTEX
POS X 0mm Y ${W}mm Z 0mm
FRAD ${r2}mm

END
NEW VERTEX
POS X ${L}mm Y ${W}mm Z 0mm
FRAD ${r3}mm

END
NEW VERTEX
POS X ${L}mm Y 0mm Z 0mm
FRAD ${r4}mm

END
END
END
END`;

    let blob = new Blob([data], { type: "text/plain" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "Opening.mac";
    a.click();
}

function reset() {
    document.getElementById("px").value = 0;
    document.getElementById("py").value = 0;
    document.getElementById("pz").value = 0;
    document.getElementById("dx").value = 0;
    document.getElementById("dy").value = 0;
    document.getElementById("dz").value = 0;
    document.getElementById("r1").value = 150;
    document.getElementById("r2").value = 150;
    document.getElementById("r3").value = 150;
    document.getElementById("r4").value = 150;
    setOri('Z');
}


function library() {
    log("📚 Đang mở thư viện...");
    alert("Chức năng Library đang được phát triển!");
}

document.querySelectorAll("input").forEach(i => {
    i.addEventListener("input", draw);
});

window.addEventListener("resize", draw);
draw();

function help() {
    window.open('help.html', '_blank');
}






// 1. Khởi tạo mảng trống (Ban đầu chưa có tài liệu nào)
// Tự động tải dữ liệu lưu trữ từ LocalStorage nếu có
let documents = JSON.parse(localStorage.getItem('shared_documents')) || [];

// Mở và đóng Modal
function openLibraryModal() {
    document.getElementById('libraryModal').classList.add('active');
    renderDocuments(documents);
}

function closeLibraryModal() {
    document.getElementById('libraryModal').classList.remove('active');
    cancelEdit();
}

// Render danh sách tài liệu
function renderDocuments(list) {
    const docListContainer = document.getElementById('docList');
    document.getElementById('docCount').innerText = list ? list.length : 0;
    
    if (!docListContainer) return;
    docListContainer.innerHTML = '';

    // Khi chưa có tài liệu
    if (!list || list.length === 0) {
        docListContainer.innerHTML = '<div class="doc-empty">Chưa có tài liệu nào trong thư viện.</div>';
        return;
    }

    list.forEach(doc => {
        const item = document.createElement('div');
        item.className = 'doc-item';
        item.innerHTML = `
            <div class="doc-info" title="${doc.name}">
                <span>📄</span>
                <span>${doc.name}</span>
            </div>
            <div class="doc-actions">
                <button class="btn btn-purple" onclick="openDocLink('${doc.link}')">📁 Open</button>
                <button class="btn btn-amber" onclick="editDoc(${doc.id})">✏️ Edit</button>
                <button class="btn btn-delete" onclick="deleteDoc(${doc.id})">✕</button>
            </div>
        `;
        docListContainer.appendChild(item);
    });
}

// Mở link tài liệu
function openDocLink(url) {
    if (!url || url === '#') {
        alert('Đường dẫn không hợp lệ!');
        return;
    }
    window.open(url, '_blank');
}

// Thêm mới hoặc Cập nhật tài liệu
function addDocument() {
    const editingId = document.getElementById('editingDocId').value;
    const nameInput = document.getElementById('docNameInput');
    const linkInput = document.getElementById('docLinkInput');
    const tagsInput = document.getElementById('docTagsInput');

    const name = nameInput.value.trim();
    const link = linkInput.value.trim();
    const tags = tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()) : [];

    if (!name || !link) {
        alert('Vui lòng nhập tên tài liệu và link!');
        return;
    }

    if (editingId) {
        // Cập nhật tài liệu cũ
        const index = documents.findIndex(d => d.id == editingId);
        if (index !== -1) {
            documents[index].name = name;
            documents[index].link = link;
            documents[index].tags = tags;
        }
    } else {
        // Thêm tài liệu mới vào mảng dùng chung
        const newDoc = {
            id: Date.now(),
            name: name,
            link: link,
            tags: tags
        };
        documents.push(newDoc);
    }

    saveAndRefresh();
    cancelEdit();
}

// Chỉnh sửa (Edit) tài liệu
function editDoc(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    // Đưa dữ liệu lên form
    document.getElementById('editingDocId').value = doc.id;
    document.getElementById('docNameInput').value = doc.name;
    document.getElementById('docLinkInput').value = doc.link;
    document.getElementById('docTagsInput').value = doc.tags ? doc.tags.join(', ') : '';

    // Đổi nút "➕ Add" thành "💾 Save" và hiện nút Cancel
    const saveBtn = document.getElementById('saveDocBtn');
    saveBtn.innerText = '💾 Save';
    saveBtn.className = 'btn btn-amber';
    
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
}

// Hủy chế độ Edit
function cancelEdit() {
    document.getElementById('editingDocId').value = '';
    document.getElementById('docNameInput').value = '';
    document.getElementById('docLinkInput').value = '';
    document.getElementById('docTagsInput').value = '';

    const saveBtn = document.getElementById('saveDocBtn');
    saveBtn.innerText = '➕ Add';
    saveBtn.className = 'btn btn-purple';

    document.getElementById('cancelEditBtn').style.display = 'none';
}

// Xóa 1 tài liệu
function deleteDoc(id) {
    documents = documents.filter(doc => doc.id !== id);
    saveAndRefresh();
}

// Xóa tất cả tài liệu (Clear All)
function clearAllDocs() {
    if (documents.length === 0) {
        alert('Thư viện đang trống!');
        return;
    }
    
    if (confirm('Bạn có chắc chắn muốn xóa tất cả tài liệu trong thư viện không?')) {
        documents = [];
        saveAndRefresh();
        cancelEdit();
    }
}

// Tìm kiếm tài liệu
function filterDocs() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = documents.filter(doc => 
        (doc.name && doc.name.toLowerCase().includes(query)) || 
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(query)))
    );
    renderDocuments(filtered);
}

// Lưu dữ liệu vào LocalStorage và Render lại UI
function saveAndRefresh() {
    localStorage.setItem('shared_documents', JSON.stringify(documents));
    renderDocuments(documents);
}

// Tìm kiếm bằng giọng nói (Giả lập)
function startVoiceSearch() {
    alert("Đang lắng nghe... Hãy nói tên tài liệu!");
}

// Tìm kiếm bằng giọng nói (Giả lập)
function startVoiceSearch() {
    alert("Đang lắng nghe... Hãy nói tên tài liệu!");
}
