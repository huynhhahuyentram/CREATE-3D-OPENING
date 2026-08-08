const c = document.getElementById("view");
const ctx = c.getContext("2d");
const voiceBtn = document.getElementById("voiceBtn");

let ORI = "Z";
let isListening = false;

function setOri(o) {
    ORI = o;
    document.querySelectorAll(".ori button").forEach(b => b.classList.remove("active"));
    document.getElementById("o" + o.toLowerCase()).classList.add("active");
    draw();
}

function parseInputValue(id) {
    let raw = (document.getElementById(id).value || "").toString().trim();
    if (!raw) return 0;
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

    // Vẽ background gradient
    let grad = ctx.createLinearGradient(0, 0, 0, c.height);
    grad.addColorStop(0, 'rgba(26, 140, 255, 0.03)');
    grad.addColorStop(1, 'rgba(124, 77, 255, 0.03)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);

    drawAxis();

    if (L === 0 && W === 0 && H === 0) return;

    let maxDim = Math.max(Math.abs(L), Math.abs(W), Math.abs(H), 100);
    let scale = 110 / maxDim;

    let l = L * scale;
    let w = W * scale;
    let h = H * scale;

    let cx = c.width / 2 - 20;
    let cy = c.height / 2 + 30;

    // Chọn màu theo orientation
    let colors = {
        border: '#1a8cff',
        fill: 'rgba(26, 140, 255, 0.12)',
        label: '#e8edf5'
    };
    if (ORI === 'X') {
        colors.border = '#ff6d00';
        colors.fill = 'rgba(255, 109, 0, 0.12)';
    } else if (ORI === 'Y') {
        colors.border = '#00c853';
        colors.fill = 'rgba(0, 200, 83, 0.12)';
    }

    if (ORI === "Z") {
        drawBox3DSharp(cx, cy, l, w, h, `L=${L}`, `W=${W}`, `H=${H}`, colors);
    } else if (ORI === "X") {
        drawBox3DSharp(cx, cy, h, w, l, `H=${H}`, `W=${W}`, `L=${L}`, colors);
    } else if (ORI === "Y") {
        drawBox3DSharp(cx, cy, l, h, w, `L=${L}`, `H=${H}`, `W=${W}`, colors);
    }
}

function drawAxis() {
    ctx.lineWidth = 2.5;
    ctx.font = "bold 13px Segoe UI";

    let x0 = 50, y0 = 220;

    ctx.strokeStyle = "#ff1744";
    ctx.fillStyle = "#ff1744";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 50, y0);
    ctx.stroke();
    ctx.fillText("X", x0 + 55, y0 + 4);

    ctx.strokeStyle = "#00c853";
    ctx.fillStyle = "#00c853";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 35, y0 - 35);
    ctx.stroke();
    ctx.fillText("Y", x0 + 40, y0 - 38);

    ctx.strokeStyle = "#1a8cff";
    ctx.fillStyle = "#1a8cff";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y0 - 50);
    ctx.stroke();
    ctx.fillText("Z", x0 - 4, y0 - 55);
}

function projectISO(x, y, z, cx, cy) {
    let kY = 0.55;
    return {
        x: cx + x + y * kY,
        y: cy - z - y * kY
    };
}

function drawBox3DSharp(cx, cy, d1, d2, d3, lbl1, lbl2, lbl3, colors) {
    ctx.lineWidth = 2;
    let offsetX = cx - d1 / 2;
    let offsetY = cy + d3 / 2;

    let b0 = projectISO(0, 0, 0, offsetX, offsetY);
    let b1 = projectISO(d1, 0, 0, offsetX, offsetY);
    let b2 = projectISO(d1, d2, 0, offsetX, offsetY);
    let b3 = projectISO(0, d2, 0, offsetX, offsetY);

    let t0 = projectISO(0, 0, d3, offsetX, offsetY);
    let t1 = projectISO(d1, 0, d3, offsetX, offsetY);
    let t2 = projectISO(d1, d2, d3, offsetX, offsetY);
    let t3 = projectISO(0, d2, d3, offsetX, offsetY);

    // Với màu sắc từ param
    ctx.strokeStyle = colors.border || "#1a8cff";
    ctx.fillStyle = colors.fill || "rgba(26, 140, 255, 0.12)";

    // Đáy
    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.lineTo(b1.x, b1.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Cạnh đứng
    let bEdges = [b0, b1, b2, b3];
    let tEdges = [t0, t1, t2, t3];
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(bEdges[i].x, bEdges[i].y);
        ctx.lineTo(tEdges[i].x, tEdges[i].y);
        ctx.stroke();
    }

    // Mặt trên
    ctx.beginPath();
    ctx.moveTo(t0.x, t0.y);
    ctx.lineTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    // Labels
    ctx.fillStyle = colors.label || "#e8edf5";
    ctx.font = "bold 13px Segoe UI";

    let c1 = projectISO(d1 / 2, 0, 0, offsetX, offsetY);
    let c2 = projectISO(d1, d2 / 2, d3, offsetX, offsetY);
    let c3 = projectISO(0, 0, d3 / 2, offsetX, offsetY);

    ctx.fillText(lbl1, c1.x - 20, c1.y + 18);
    ctx.fillText(lbl2, c2.x - 15, c2.y - 8);
    ctx.fillText(lbl3, c3.x - 55, c3.y + 4);
}

function log(t) {
    const chatBox = document.getElementById("chat");
    chatBox.innerHTML += `<div>${t}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
}

function voice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        alert("Trình duyệt của bạn chưa hỗ trợ Voice!");
        return;
    }

    // Thêm class listening cho nút
    if (voiceBtn) voiceBtn.classList.add('listening');
    isListening = true;

    let startMsg = "Xin chào, tôi có thể giúp gì cho bạn";
    log("🤖 " + startMsg);

    window.speechSynthesis.cancel();
    let u = new SpeechSynthesisUtterance(startMsg);
    u.lang = "vi-VN";
    u.rate = 0.95;

    u.onend = () => {
        log("🔴 Đang nghe...");
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
                // Xóa class listening khi xong
                if (voiceBtn) voiceBtn.classList.remove('listening');
                isListening = false;
            }, 2500);
        };

        r.onerror = () => {
            let errorMsg = "Chưa nhận diện được thông số, vui lòng thử lại!";
            log("🤖 " + errorMsg);
            speak(errorMsg);
            if (voiceBtn) voiceBtn.classList.remove('listening');
            isListening = false;
        };

        r.start();
    };

    window.speechSynthesis.speak(u);
}

function processFullVoiceNLP(t) {
    log("👤 " + t);

    let str = t.toLowerCase()
               .replace(/\b(âm|trừ)\b/g, "-")
               .replace(/\bphẩy\b/g, ",")
               .replace(/\bchấm\b/g, "");

    str = str.replace(/(\d+)\.(\d+)/g, '$1$2');

    let updatedCount = 0;

    const cleanNumberString = (numStr) => {
        if (!numStr) return "0";
        numStr = numStr.trim().replace(/\s+/g, '');
        return numStr.replace(',', '.');
    };

    const findVal = (keywords) => {
        for (let kw of keywords) {
            let regex = new RegExp(`${kw}(?:\\s+là|\\s+bằng|\\s*[:=])?\\s*(-?\\s*\\d+(?:,\\d+)?)`, "i");
            let match = str.match(regex);
            if (match) {
                return cleanNumberString(match[1]);
            }
        }
        return null;
    };

    // Orientation
    if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?x\b/i.test(str)) { setOri('X'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?y\b/i.test(str)) { setOri('Y'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?(z|zét|zed)\b/i.test(str)) { setOri('Z'); updatedCount++; }

    // Position
    let posX = findVal(["tọa độ x", "vị trí x", "pos x", "position x", "đồ ít", "tọa độ ít", "tọa độ xy", "x"]);
    let posY = findVal(["tọa độ y", "vị trí y", "pos y", "position y", "y"]);
    let posZ = findVal(["tọa độ zét", "tọa độ zed", "tọa độ z", "vị trí z", "pos z", "position z", "z"]);

    if (posX !== null) { document.getElementById("px").value = posX; updatedCount++; }
    if (posY !== null) { document.getElementById("py").value = posY; updatedCount++; }
    if (posZ !== null) { document.getElementById("pz").value = posZ; updatedCount++; }

    // Dimension
    let len = findVal(["chiều dài", "độ dài", "dài", "length", "l"]);
    let wid = findVal(["chiều rộng", "độ rộng", "rộng", "width", "w"]);
    let hei = findVal(["chiều cao", "độ cao", "cao", "height", "h"]);

    if (len !== null) { document.getElementById("dx").value = len; updatedCount++; }
    if (wid !== null) { document.getElementById("dy").value = wid; updatedCount++; }
    if (hei !== null) { document.getElementById("dz").value = hei; updatedCount++; }

    // Corner Radius
    let rad1 = findVal(["r1", "radius 1", "bo góc 1", "bán kính 1"]);
    let rad2 = findVal(["r2", "radius 2", "bo góc 2", "bán kính 2"]);
    let rad3 = findVal(["r3", "radius 3", "bo góc 3", "bán kính 3"]);
    let rad4 = findVal(["r4", "radius 4", "bo góc 4", "bán kính 4"]);
    let radAll = findVal(["bo góc", "bán kính", "radius", "r"]);

    if (rad1 !== null) { document.getElementById("r1").value = rad1; updatedCount++; }
    if (rad2 !== null) { document.getElementById("r2").value = rad2; updatedCount++; }
    if (rad3 !== null) { document.getElementById("r3").value = rad3; updatedCount++; }
    if (rad4 !== null) { document.getElementById("r4").value = rad4; updatedCount++; }
    
    if (radAll !== null && rad1 === null && rad2 === null && rad3 === null && rad4 === null) {
        document.getElementById("r1").value = radAll;
        document.getElementById("r2").value = radAll;
        document.getElementById("r3").value = radAll;
        document.getElementById("r4").value = radAll;
        updatedCount++;
    }

    // Số tự do
    if (updatedCount === 0) {
        let rawNums = str.match(/-?\d+(,\d+)?/g);
        if (rawNums && rawNums.length >= 3) {
            document.getElementById("dx").value = cleanNumberString(rawNums[0]);
            document.getElementById("dy").value = cleanNumberString(rawNums[1]);
            document.getElementById("dz").value = cleanNumberString(rawNums[2]);
            updatedCount = 3;
        }
    }

    if (updatedCount > 0) {
        draw();
        let successMsg = "✅ Đã cập nhật thông số!";
        log("🤖 " + successMsg);
        speak(successMsg);
    } else {
        let failMsg = "❌ Chưa nhận diện được thông số, vui lòng thử lại!";
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
    
    log("📁 Đã xuất file Opening.mac");
}

function reset() {
    document.getElementById("px").value = 0;
    document.getElementById("py").value = 0
