// ==========================================================================
// 1. GLOBAL STATE & FIRESTORE REALTIME LISTENER
// ==========================================================================
let documents = [];
let unsubscribeListener = null;

let currentFilter = {
    type: 'cat',
    val: 'all'
};

// Mật khẩu bảo mật cho các thao tác Thêm/Sửa/Xóa
const ADMIN_PASSWORD = "kttt1234";

// Link Google Drive tải phần mềm Tool 3D
const GOOGLE_DRIVE_TOOL_LINK = "https://drive.google.com/"; // Thay bằng URL Google Drive thực tế của bạn

function verifyAdmin() {
    let password = prompt("Vui lòng nhập mật khẩu quản trị để thực hiện thao tác này:");
    if (password === null) return false;
    if (password === ADMIN_PASSWORD) {
        return true;
    } else {
        alert("Mật khẩu không chính xác!");
        return false;
    }
}

function initFirebaseListener() {
    if (!window.db || !window.fs) {
        setTimeout(initFirebaseListener, 200);
        return;
    }

    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
    }

    try {
        const docsRef = window.fs.collection(window.db, "documents");
        unsubscribeListener = window.fs.onSnapshot(docsRef, (snapshot) => {
            documents = [];
            snapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });
            updateBadges();
            renderDocuments(getFilteredDocs());
        }, (error) => {
            console.warn("Firestore listener warning:", error.message);
        });
    } catch (err) {
        console.error("Firebase init error:", err);
    }
}

initFirebaseListener();

function refreshDocs() {
    initFirebaseListener();
    log("🔄 Synced documents from cloud.");
}

// ==========================================================================
// 2. CANVAS 3D MODELING & RENDERING (ISOMETRIC & ROUNDED CORNERS)
// ==========================================================================
const c = document.getElementById("view");
const ctx = c ? c.getContext("2d") : null;
let ORI = "Z";

function setOri(o) {
    ORI = o;
    document.querySelectorAll(".ori button").forEach(b => b.classList.remove("active"));
    const btn = document.getElementById("o" + o.toLowerCase());
    if (btn) btn.classList.add("active");
    draw();
}

function parseInputValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    let raw = (el.value || "").toString().trim();
    if (!raw) return 0;
    raw = raw.replace(/\./g, '').replace(',', '.');
    return parseFloat(raw) || 0;
}

function draw() {
    if (!c || !ctx) return;
    
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

function drawAxis() {
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.font = "bold 13px Segoe UI";
    let x0 = 50, y0 = 220;

    ctx.strokeStyle = "#e74c3c"; ctx.fillStyle = "#e74c3c";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 50, y0); ctx.stroke();
    ctx.fillText("X", x0 + 55, y0 + 4);

    ctx.strokeStyle = "#2980b9"; ctx.fillStyle = "#2980b9";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 35, y0 - 35); ctx.stroke();
    ctx.fillText("Y", x0 + 40, y0 - 38);

    ctx.strokeStyle = "#27ae60"; ctx.fillStyle = "#27ae60";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 - 50); ctx.stroke();
    ctx.fillText("Z", x0 - 4, y0 - 55);
}

function projectISO(x, y, z, cx, cy) {
    let kY = 0.55; 
    return { x: cx + x + y * kY, y: cy - z - y * kY };
}

function drawBox3DSharp(cx, cy, d1, d2, d3, lbl1, lbl2, lbl3, ori) {
    if (!ctx) return;
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
    let r1s = r1 * scaleR, r2s = r2 * scaleR, r3s = r3 * scaleR, r4s = r4 * scaleR;
    
    ctx.lineWidth = 2;
    let offsetX = cx - d1 / 2;
    let offsetY = cy + d3 / 2;

    const labelColors = {
        'X': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' },
        'Y': { l1: '#e74c3c', l2: '#27ae60', l3: '#2980b9' },
        'Z': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' }
    };
    
    let colorMap = labelColors[ori] || labelColors['Z'];

    const colors = {
        border: "#4a9eff",
        fill: "rgba(74, 158, 255, 0.18)",
        borderTop: "#6ab0ff",
        fillTop: "rgba(74, 158, 255, 0.10)"
    };

    function drawRoundedRect(ox, oy, w, h, rTL, rTR, rBR, rBL) {
        const segments = 12;
        function arcPoint(cxP, cyP, r, startAngle, endAngle) {
            const pts = [];
            for (let i = 0; i <= segments; i++) {
                const t = startAngle + (endAngle - startAngle) * (i / segments);
                pts.push({x: cxP + r * Math.cos(t), y: cyP + r * Math.sin(t)});
            }
            return pts;
        }
        let pTL = {x: ox + rTL, y: oy};
        let pTR = {x: ox + w - rTR, y: oy};
        let pBR = {x: ox + w, y: oy + h - rBR};
        let pBL = {x: ox + rBL, y: oy + h};
        
        let arcTL = arcPoint(ox + rTL, oy + rTL, rTL, Math.PI, 3*Math.PI/2);
        let arcTR = arcPoint(ox + w - rTR, oy + rTR, rTR, 3*Math.PI/2, 2*Math.PI);
        let arcBR = arcPoint(ox + w - rBR, oy + h - rBR, rBR, 0, Math.PI/2);
        let arcBL = arcPoint(ox + rBL, oy + h - rBL, rBL, Math.PI/2, Math.PI);
        
        return [
            {x: pTL.x, y: pTL.y}, ...arcTL,
            {x: pTR.x, y: pTR.y}, ...arcTR,
            {x: pBR.x, y: pBR.y}, ...arcBR,
            {x: pBL.x, y: pBL.y}, ...arcBL
        ].map(p => projectISO(p.x, p.y, 0, offsetX, offsetY));
    }
    
    let bottomPoints = drawRoundedRect(0, 0, d1, d2, r1s, r2s, r3s, r4s);
    ctx.shadowBlur = 25; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 12;
    ctx.shadowColor = "rgba(74, 158, 255, 0.15)";
    ctx.strokeStyle = colors.border; ctx.fillStyle = colors.fill; ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bottomPoints[0].x, bottomPoints[0].y);
    for (let i = 1; i < bottomPoints.length; i++) ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
    ctx.closePath(); ctx.stroke(); ctx.fill();
    
    let topPointsOffset = drawRoundedRect(0, 0, d1, d2, r1s, r2s, r3s, r4s).map(p => ({x: p.x, y: p.y - d3}));
    ctx.shadowBlur = 15; ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 5;
    ctx.strokeStyle = colors.borderTop; ctx.fillStyle = colors.fillTop; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(topPointsOffset[0].x, topPointsOffset[0].y);
    for (let i = 1; i < topPointsOffset.length; i++) ctx.lineTo(topPointsOffset[i].x, topPointsOffset[i].y);
    ctx.closePath(); ctx.stroke(); ctx.fill();
    
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    
    ctx.strokeStyle = colors.border; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
    const corners = [{x: 0, y: 0}, {x: d1, y: 0}, {x: d1, y: d2}, {x: 0, y: d2}];
    const cornerOffsets = [{x: r1s, y: r1s}, {x: -r2s, y: r2s}, {x: -r3s, y: -r3s}, {x: r4s, y: -r4s}];
    
    for (let i = 0; i < 4; i++) {
        let bottom = projectISO(corners[i].x + cornerOffsets[i].x, corners[i].y + cornerOffsets[i].y, 0, offsetX, offsetY);
        let top = projectISO(corners[i].x + cornerOffsets[i].x, corners[i].y + cornerOffsets[i].y, d3, offsetX, offsetY);
        ctx.beginPath(); ctx.moveTo(bottom.x, bottom.y); ctx.lineTo(top.x, top.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    ctx.font = "bold 14px Segoe UI";
    let labelPositions = [
        {x: d1/2, y: 0, z: 0, color: colorMap.l1},
        {x: d1, y: d2/2, z: d3, color: colorMap.l2},
        {x: 0, y: 0, z: d3/2, color: colorMap.l3}
    ];
    let labels = [lbl1, lbl2, lbl3];
    let labelOffsets = [{x: 0, y: -15}, {x: 12, y: -5}, {x: -50, y: 5}];
    
    for (let i = 0; i < 3; i++) {
        let p = projectISO(labelPositions[i].x, labelPositions[i].y, labelPositions[i].z, offsetX, offsetY);
        ctx.fillStyle = labelPositions[i].color;
        ctx.fillText(labels[i], p.x + labelOffsets[i].x, p.y + labelOffsets[i].y);
    }
}

function log(t) {
    const chatBox = document.getElementById("chat");
    if (chatBox) {
        const div = document.createElement("div");
        div.innerHTML = t;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

document.querySelectorAll("input").forEach(i => i.addEventListener("input", draw));
window.addEventListener("resize", draw);
draw();

// ==========================================================================
// 3. VOICE RECOGNITION & ADVANCED VOICE NLP PROCESSING
// ==========================================================================
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

    let str = t.toLowerCase()
               .replace(/\b(âm|trừ)\b/g, "-")
               .replace(/\bphẩy\b/g, ",")
               .replace(/\bchấm\b/g, "");

    str = str.replace(/(\d+)\.(\d+)/g, '$1$2');
    let updatedCount = 0;

    const cleanNumberString = (numStr) => {
        if (!numStr) return "0";
        return numStr.trim().replace(/\s+/g, '').replace(',', '.');
    };

    const findVal = (keywords) => {
        for (let kw of keywords) {
            let regAfter = new RegExp(`${kw}(?:\\s+là|\\s+bằng|\\s*[:=])?\\s*(-?\\s*\\d+(?:,\\d+)?)`, "i");
            let matchAfter = str.match(regAfter);
            if (matchAfter) return cleanNumberString(matchAfter[1]);
            
            let regBefore = new RegExp(`(-?\\s*\\d+(?:,\\d+)?)\\s*(?:mm)?\\s*${kw}`, "i");
            let matchBefore = str.match(regBefore);
            if (matchBefore) return cleanNumberString(matchBefore[1]);
        }
        return null;
    };

    if (/(xuất mac|export|tải file|tạo file|lưu file|ok)/i.test(str)) {
        saveFile();
        updatedCount++;
    } else if (/(trợ giúp|hướng dẫn|help)/i.test(str)) {
        help();
        updatedCount++;
    } else if (/(thư viện|library)/i.test(str)) {
        openLibraryModal();
        updatedCount++;
    } else if (/(đặt lại|reset|làm mới|xóa hết)/i.test(str)) {
        reset();
        updatedCount++;
    }

    if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?x\b/i.test(str)) { setOri('X'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?y\b/i.test(str)) { setOri('Y'); updatedCount++; }
    else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?(z|zét|zed)\b/i.test(str)) { setOri('Z'); updatedCount++; }

    let posX = findVal(["tọa độ x", "vị trí x", "pos x", "position x", "đồ ít", "tọa độ ít", "tọa độ xy", "x"]);
    let posY = findVal(["tọa độ y", "vị trí y", "pos y", "position y", "y"]);
    let posZ = findVal(["tọa độ zét", "tọa độ zed", "tọa độ z", "vị trí z", "pos z", "position z", "z"]);

    if (posX !== null) { setInputValue("px", posX); updatedCount++; }
    if (posY !== null) { setInputValue("py", posY); updatedCount++; }
    if (posZ !== null) { setInputValue("pz", posZ); updatedCount++; }

    let len = findVal(["chiều dài", "độ dài", "dài", "length", "l"]);
    let wid = findVal(["chiều rộng", "độ rộng", "rộng", "width", "w"]);
    let hei = findVal(["chiều cao", "độ cao", "cao", "height", "h"]);

    if (len !== null) { setInputValue("dx", len); updatedCount++; }
    if (wid !== null) { setInputValue("dy", wid); updatedCount++; }
    if (hei !== null) { setInputValue("dz", hei); updatedCount++; }

    let rad1 = findVal(["r1", "radius 1", "bo góc 1", "bán kính 1"]);
    let rad2 = findVal(["r2", "radius 2", "bo góc 2", "bán kính 2"]);
    let rad3 = findVal(["r3", "radius 3", "bo góc 3", "bán kính 3"]);
    let rad4 = findVal(["r4", "radius 4", "bo góc 4", "bán kính 4"]);
    let radAll = findVal(["bo góc tất cả", "bo cả 4 góc", "tất cả góc bo", "bán kính bo", "bo góc"]);

    if (rad1 !== null) { setInputValue("r1", rad1); updatedCount++; }
    if (rad2 !== null) { setInputValue("r2", rad2); updatedCount++; }
    if (rad3 !== null) { setInputValue("r3", rad3); updatedCount++; }
    if (rad4 !== null) { setInputValue("r4", rad4); updatedCount++; }
    
    if (radAll !== null && rad1 === null && rad2 === null && rad3 === null && rad4 === null && len === null && wid === null && hei === null) {
        ["r1", "r2", "r3", "r4"].forEach(id => setInputValue(id, radAll));
        updatedCount++;
    }

    if (updatedCount === 0) {
        let rawNums = str.match(/-?\d+(,\d+)?/g);
        if (rawNums && rawNums.length >= 3) {
            setInputValue("dx", cleanNumberString(rawNums[0]));
            setInputValue("dy", cleanNumberString(rawNums[1]));
            setInputValue("dz", cleanNumberString(rawNums[2]));
            updatedCount = 3;
        }
    }

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

function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

function speak(t) {
    window.speechSynthesis.cancel();
    let u = new SpeechSynthesisUtterance(t);
    u.lang = "vi-VN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
}

// ==========================================================================
// 4. EXPORT MAC FILE, RESET & HELP
// ==========================================================================
function saveFile() {
    let px = parseInputValue("px"), py = parseInputValue("py"), pz = parseInputValue("pz");
    let L = parseInputValue("dx"), W = parseInputValue("dy"), H = parseInputValue("dz");
    let r1 = parseInputValue("r1"), r2 = parseInputValue("r2"), r3 = parseInputValue("r3"), r4 = parseInputValue("r4");

    let oriStr = "ORI Y is Y and Z is Z";
    if (ORI === "X") oriStr = "ORI Y is Y and Z is X";
    else if (ORI === "Y") oriStr = "ORI Y is -X and Z is Y";

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
    ["px","py","pz","dx","dy","dz"].forEach(id => setInputValue(id, 0));
    ["r1","r2","r3","r4"].forEach(id => setInputValue(id, 150));
    setOri('Z');
    log("🔄 Reset parameters.");
}

function help() { window.open('help.html', '_blank'); }
function library() { openLibraryModal(); }

// ==========================================================================
// 5. LIBRARY MANAGEMENT & TOOLS (DOWNLOAD, SECURITY & FILTERS)
// ==========================================================================
function downloadTool() {
    window.open(GOOGLE_DRIVE_TOOL_LINK, '_blank');
}

function openLibraryModal() {
    const modal = document.getElementById('libraryModal');
    if (modal) modal.classList.add('active');
    renderDocuments(getFilteredDocs());
}

function closeLibraryModal() {
    const modal = document.getElementById('libraryModal');
    if (modal) modal.classList.remove('active');
    cancelEdit();
}

function toggleAddForm() {
    if (!verifyAdmin()) return;
    const card = document.getElementById('addFormCard');
    if (card) card.style.display = card.style.display === 'none' ? 'flex' : 'none';
}

function setFilter(type, val, el) {
    currentFilter = { type, val };
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    renderDocuments(getFilteredDocs());
}

function getFilteredDocs() {
    const searchInput = document.getElementById('searchInput');
    const query = (searchInput ? searchInput.value : "").toLowerCase();
    return documents.filter(doc => {
        const matchesQuery = (doc.name && doc.name.toLowerCase().includes(query)) ||
                             (doc.tags && doc.tags.some(t => t.toLowerCase().includes(query)));
        
        let matchesFilter = true;
        if (currentFilter.type === 'cat' && currentFilter.val !== 'all') {
            matchesFilter = (doc.category || 'others') === currentFilter.val;
        } else if (currentFilter.type === 'dept') {
            matchesFilter = (doc.department || 'others') === currentFilter.val;
        }
        return matchesQuery && matchesFilter;
    });
}

function updateBadges() {
    const count = (type, val) => documents.filter(d => {
        if (type === 'cat') return val === 'all' ? true : (d.category || 'others') === val;
        if (type === 'dept') return (d.department || 'others') === val;
        return false;
    }).length;

    const elCount = document.getElementById('docCountText') || document.getElementById('docCount');
    if (elCount) elCount.textContent = `Loaded ${documents.length} documents`;

    const setBadge = (id, val) => {
        const b = document.getElementById(id);
        if (b) b.textContent = val;
    };

    setBadge('badge-cat-all', count('cat', 'all'));
    setBadge('badge-cat-standards', count('cat', 'standards'));
    setBadge('badge-cat-methods', count('cat', 'methods'));
    setBadge('badge-cat-experience', count('cat', 'experience'));

    setBadge('badge-dept-hull', count('dept', 'hull'));
    setBadge('badge-dept-piping', count('dept', 'piping'));
    setBadge('badge-dept-electrical', count('dept', 'electrical'));
    setBadge('badge-dept-outfitting', count('dept', 'outfitting'));
    setBadge('badge-dept-others', count('dept', 'others'));
}

function renderDocuments(list) {
    const container = document.getElementById('docList');
    if (!container) return;
    container.innerHTML = '';

    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 50px 20px; background: #161b2e; border: 2px dashed #232a45; border-radius: 14px; margin-top: 10px;">
                <div class="empty-icon" style="font-size: 42px; margin-bottom: 10px; opacity: 0.8;">📁</div>
                <div class="empty-title" style="font-size: 18px; font-weight: 600; color: #cbd5e1;">Thư mục trống</div>
                <div class="empty-sub" style="font-size: 13px; color: #64748b; margin-top: 6px;">Chưa có tài liệu nào thuộc danh mục này. Phím "<b>+ Add</b>" để thêm mới!</div>
            </div>
        `;
        return;
    }

    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'doc-card-item doc-item';

        const left = document.createElement('div');
        left.className = 'doc-left doc-info';

        const icon = document.createElement('div');
        icon.className = 'doc-file-icon';
        icon.textContent = '📄';

        const details = document.createElement('div');
        details.className = 'doc-details';

        const title = document.createElement('div');
        title.className = 'doc-title';
        title.innerHTML = `<strong>${item.name || 'Untitled'}</strong>`;

        const meta = document.createElement('div');
        meta.className = 'doc-meta';
        meta.textContent = `${item.category || 'others'} • ${item.department || 'others'}`;

        details.appendChild(title);
        details.appendChild(meta);
        left.appendChild(icon);
        left.appendChild(details);

        const actions = document.createElement('div');
        actions.className = 'doc-right-actions doc-actions';

        const openBtn = document.createElement('button');
        openBtn.className = 'btn btn-purple btn-open-purple';
        openBtn.innerHTML = '📁 Open';
        openBtn.onclick = () => openDocLink(item.link);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-delete btn-delete-red';
        delBtn.textContent = '✕';
        delBtn.onclick = () => deleteDoc(item.id);

        actions.appendChild(openBtn);
        actions.appendChild(delBtn);

        card.appendChild(left);
        card.appendChild(actions);
        container.appendChild(card);
    });
}

function openDocLink(urlStr) {
    if (!urlStr || urlStr === '#') {
        alert("Đường dẫn không hợp lệ!");
        return;
    }
    try {
        const parsed = new URL(urlStr);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            window.open(parsed.href, '_blank');
        } else {
            alert("Protocol không an toàn!");
        }
    } catch (_) {
        alert("Đường dẫn URL không hợp lệ!");
    }
}

async function addDocument() {
    const editingIdEl = document.getElementById('editingDocId');
    const editingId = editingIdEl ? editingIdEl.value : '';
    
    const nameInput = document.getElementById('docNameInput');
    const linkInput = document.getElementById('docLinkInput');
    const tagsInput = document.getElementById('docTagsInput');
    const catSelect = document.getElementById('docCategorySelect');
    const deptSelect = document.getElementById('docDepartmentSelect');

    const name = nameInput ? nameInput.value.trim() : '';
    const link = linkInput ? linkInput.value.trim() : '';
    const tags = tagsInput && tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()) : [];
    const category = catSelect ? catSelect.value : 'standards';
    const department = deptSelect ? deptSelect.value : 'hull';

    if (!name || !link) {
        alert('Vui lòng nhập đầy đủ Tên tài liệu và Link!');
        return;
    }

    try {
        if (editingId) {
            const docRef = window.fs.doc(window.db, "documents", editingId);
            await window.fs.updateDoc(docRef, { name, link, tags, category, department });
        } else {
            const docsRef = window.fs.collection(window.db, "documents");
            await window.fs.addDoc(docsRef, { name, link, tags, category, department });
        }
        cancelEdit();
    } catch (error) {
        console.error("Lỗi khi lưu Firebase:", error);
        alert("Lỗi khi lưu dữ liệu!");
    }
}

function editDoc(id) {
    if (!verifyAdmin()) return;

    const docItem = documents.find(d => d.id === id);
    if (!docItem) return;

    toggleAddForm();

    setInputValue('editingDocId', docItem.id);
    setInputValue('docNameInput', docItem.name || '');
    setInputValue('docLinkInput', docItem.link || '');
    setInputValue('docTagsInput', docItem.tags ? docItem.tags.join(', ') : '');
    if (document.getElementById('docCategorySelect') && docItem.category) document.getElementById('docCategorySelect').value = docItem.category;
    if (document.getElementById('docDepartmentSelect') && docItem.department) document.getElementById('docDepartmentSelect').value = docItem.department;

    const saveBtn = document.getElementById('saveDocBtn');
    if (saveBtn) {
        saveBtn.innerText = '💾 Save';
        saveBtn.className = 'btn btn-amber';
    }
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-flex';
}

function cancelEdit() {
    setInputValue('editingDocId', '');
    setInputValue('docNameInput', '');
    setInputValue('docLinkInput', '');
    setInputValue('docTagsInput', '');

    const saveBtn = document.getElementById('saveDocBtn');
    if (saveBtn) {
        saveBtn.innerText = '➕ Add';
        saveBtn.className = 'btn btn-purple';
    }

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';

    const card = document.getElementById('addFormCard');
    if (card) card.style.display = 'none';
}

async function deleteDoc(id) {
    if (!verifyAdmin()) return;

    if (confirm('Bạn có chắc muốn xóa tài liệu này?')) {
        try {
            await window.fs.deleteDoc(window.fs.doc(window.db, "documents", id));
        } catch (error) {
            console.error("Lỗi xóa document:", error);
            alert("Lỗi xóa tài liệu!");
        }
    }
}

async function clearAllDocs() {
    if (!verifyAdmin()) return;

    if (documents.length === 0) {
        alert('Thư viện đang trống!');
        return;
    }
    
    if (confirm('Bạn có chắc chắn muốn xóa tất cả tài liệu không?')) {
        try {
            for (let item of documents) {
                await window.fs.deleteDoc(window.fs.doc(window.db, "documents", item.id));
            }
            cancelEdit();
        } catch (err) {
            console.error("Clear all error:", err);
        }
    }
}

function filterDocs() {
    renderDocuments(getFilteredDocs());
}

function startVoiceSearch() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
        alert("Trình duyệt không hỗ trợ nhận diện giọng nói!");
        return;
    }
    let r = new SR(); r.lang = "vi-VN";
    r.onresult = e => {
        let q = e.results[0][0].transcript;
        setInputValue('searchInput', q);
        filterDocsAndOpenBestMatch(q);
    };
    r.start();
}

function filterDocsAndOpenBestMatch(query) {
    const matches = getFilteredDocs();
    renderDocuments(matches);
    if (matches.length > 0) {
        openDocLink(matches[0].link);
    }
}
