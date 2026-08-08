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
        drawBox3DSharp(cx, cy, l, w, h, `L=${L}`, `W=${W}`, `H=${H}`);
    } else if (ORI === "X") {
        drawBox3DSharp(cx, cy, h, w, l, `H=${H}`, `W=${W}`, `L=${L}`);
    } else if (ORI === "Y") {
        drawBox3DSharp(cx, cy, l, h, w, `L=${L}`, `H=${H}`, `W=${W}`);
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

/* 3. VẼ HÌNH HỘP CHỮ NHẬT 3D PHẲNG KHÔNG BO GÓC */
function drawBox3DSharp(cx, cy, d1, d2, d3, lbl1, lbl2, lbl3) {
    ctx.lineWidth = 1.8;
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

    ctx.strokeStyle = "#0000ff";
    ctx.fillStyle = "rgba(59, 130, 246, 0.12)";

    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.lineTo(b1.x, b1.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    let bEdges = [b0, b1, b2, b3];
    let tEdges = [t0, t1, t2, t3];
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(bEdges[i].x, bEdges[i].y);
        ctx.lineTo(tEdges[i].x, tEdges[i].y);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(t0.x, t0.y);
    ctx.lineTo(t1.x, t1.y);
    ctx.lineTo(t2.x, t2.y);
    ctx.lineTo(t3.x, t3.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = "#1e293b";
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

    let startMsg = "Xin chào, tôi có thể giúp gì cho bạn";
    log("🤖 " + startMsg);

    window.speechSynthesis.cancel();
    let u = new SpeechSynthesisUtterance(startMsg);
    u.lang = "vi-VN";
    u.rate = 0.95;

    // ĐẢM BẢO CHỈ BẬT MIC SAU KHI NÓI XONG CÂU XIN CHÀO
    u.onend = () => {
        log("🔴 <i>Đang nghe...</i>");
        let r = new SR();
        r.lang = "vi-VN"; 
        r.continuous = true; // Cho phép nói dài không bị ngắt giữa chừng
        r.interimResults = false;

        let silenceTimer = null;

        r.onresult = e => {
            let text = e.results[e.results.length - 1][0].transcript;
            
            // TĂNG THỜI GIAN CHỜ: Đợi 2.5s không có tiếng nói mới tắt mic để xử lý
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
                r.stop();
                processFullVoiceNLP(text);
            }, 2500);
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

    // 1. CHUẨN HÓA VĂN BẢN
    let str = t.toLowerCase()
               .replace(/\b(âm|trừ)\b/g, "-")
               .replace(/\bphẩy\b/g, ",")
               .replace(/\bchấm\b/g, "");

    // 2. LOẠI BỎ TOÀN BỘ DẤU CHẤM HÀNG NGHÌN (VD: "5.007,5" -> "5007,5")
    str = str.replace(/(\d+)\.(\d+)/g, '$1$2');

    let updatedCount = 0;

    // Hàm làm sạch và chuyển đổi dấu phẩy duy nhất thành dấu chấm thập phân tiêu chuẩn HTML
    const cleanNumberString = (numStr) => {
        if (!numStr) return "0";
        numStr = numStr.trim().replace(/\s+/g, '');
        return numStr.replace(',', '.');
    };

    const findVal = (keywords) => {
        for (let kw of keywords) {
            // Regex nhận diện chính xác số âm, số nguyên và số thập phân có dấu phẩy
            let regex = new RegExp(`${kw}(?:\\s+là|\\s+bằng|\\s*[:=])?\\s*(-?\\s*\\d+(?:,\\d+)?)`, "i");
            let match = str.match(regex);
            if (match) {
                return cleanNumberString(match[1]);
            }
        }
        return null;
    };

    // 1. Nhận diện Orientation
    if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?x\b/i.test(str)) { setOri('X'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?y\b/i.test(str)) { setOri('Y'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?(z|zét|zed)\b/i.test(str)) { setOri('Z'); updatedCount++; }

    // 2. Nhận diện Position (X, Y, Z - Bắt chuẩn từ đồng âm)
    let posX = findVal(["tọa độ x", "vị trí x", "pos x", "position x", "đồ ít", "tọa độ ít", "tọa độ xy", "x"]);
    let posY = findVal(["tọa độ y", "vị trí y", "pos y", "position y", "y"]);
    let posZ = findVal(["tọa độ zét", "tọa độ zed", "tọa độ z", "vị trí z", "pos z", "position z", "z"]);

    if (posX !== null) { document.getElementById("px").value = posX; updatedCount++; }
    if (posY !== null) { document.getElementById("py").value = posY; updatedCount++; }
    if (posZ !== null) { document.getElementById("pz").value = posZ; updatedCount++; }

    // 3. Nhận diện Dimension (L, W, H)
    let len = findVal(["chiều dài", "độ dài", "dài", "length", "l"]);
    let wid = findVal(["chiều rộng", "độ rộng", "rộng", "width", "w"]);
    let hei = findVal(["chiều cao", "độ cao", "cao", "height", "h"]);

    if (len !== null) { document.getElementById("dx").value = len; updatedCount++; }
    if (wid !== null) { document.getElementById("dy").value = wid; updatedCount++; }
    if (hei !== null) { document.getElementById("dz").value = hei; updatedCount++; }

    // 4. Nhận diện Corner Radius (R1, R2, R3, R4)
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

    // 5. Nếu nói chuỗi số tự do (Không có từ khóa định danh)
    if (updatedCount === 0) {
        let rawNums = str.match(/-?\d+(,\d+)?/g);
        if (rawNums && rawNums.length >= 3) {
            document.getElementById("dx").value = cleanNumberString(rawNums[0]);
            document.getElementById("dy").value = cleanNumberString(rawNums[1]);
            document.getElementById("dz").value = cleanNumberString(rawNums[2]);
            updatedCount = 3;
        }
    }

    // Phản hồi kết quả
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

function help() {
    window.open("https://drive.google.com/file/d/14NNDzXSCG63m1yQZb51tZhrZfd5k8KPf/view?usp=sharing");
}

document.querySelectorAll("input").forEach(i => {
    i.addEventListener("input", draw);
});

window.addEventListener("resize", draw);
draw();
