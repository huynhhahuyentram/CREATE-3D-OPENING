(function() {
    "use strict";
    
    var c = document.getElementById("view");
    var ctx = c.getContext("2d");

    var ORI = "Z";

    function setOri(o) {
        ORI = o;
        var buttons = document.querySelectorAll(".ori button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove("active");
        }
        var activeBtn = document.getElementById("o" + o.toLowerCase());
        if (activeBtn) {
            activeBtn.classList.add("active");
        }
        draw();
    }

    function parseInputValue(id) {
        var el = document.getElementById(id);
        var raw = (el ? el.value : "").toString().trim();
        if (!raw) return 0;
        raw = raw.replace(/\./g, '').replace(',', '.');
        var val = parseFloat(raw);
        return isNaN(val) ? 0 : val;
    }

    function draw() {
        if (!c || !ctx) return;
        
        c.width = c.offsetWidth || 800;
        c.height = 280;

        var L = parseInputValue("dx");
        var W = parseInputValue("dy");
        var H = parseInputValue("dz");

        ctx.clearRect(0, 0, c.width, c.height);

        drawAxis();

        if (L === 0 && W === 0 && H === 0) return;

        var maxDim = Math.max(Math.abs(L), Math.abs(W), Math.abs(H), 100);
        var scale = 110 / maxDim;

        var l = L * scale;
        var w = W * scale;
        var h = H * scale;

        var cx = c.width / 2 - 20;
        var cy = c.height / 2 + 30;

        if (ORI === "Z") {
            drawBox3DSharp(cx, cy, l, w, h, "L=" + L, "W=" + W, "H=" + H, 'Z');
        } else if (ORI === "X") {
            drawBox3DSharp(cx, cy, h, w, l, "H=" + H, "W=" + W, "L=" + L, 'X');
        } else if (ORI === "Y") {
            drawBox3DSharp(cx, cy, l, h, w, "L=" + L, "H=" + H, "W=" + W, 'Y');
        }
    }

    /* 1. TRỤC TỌA ĐỘ CHUẨN */
    function drawAxis() {
        if (!ctx) return;
        
        ctx.lineWidth = 2.5;
        ctx.font = "bold 13px Segoe UI, sans-serif";

        var x0 = 50, y0 = 220;

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
        var kY = 0.55; 
        return {
            x: cx + x + y * kY,
            y: cy - z - y * kY
        };
    }

    /* 3. VẼ HÌNH HỘP 3D BO GÓC */
    function drawBox3DSharp(cx, cy, d1, d2, d3, lbl1, lbl2, lbl3, ori) {
        if (!ctx) return;
        
        var r1 = parseInputValue("r1");
        var r2 = parseInputValue("r2");
        var r3 = parseInputValue("r3");
        var r4 = parseInputValue("r4");
        
        var maxR = Math.min(d1, d2) / 2;
        r1 = Math.min(r1, maxR);
        r2 = Math.min(r2, maxR);
        r3 = Math.min(r3, maxR);
        r4 = Math.min(r4, maxR);
        
        var scaleR = Math.min(d1, d2) / Math.max(Math.abs(parseInputValue("dx")), Math.abs(parseInputValue("dy")), 1);
        var r1s = r1 * scaleR;
        var r2s = r2 * scaleR;
        var r3s = r3 * scaleR;
        var r4s = r4 * scaleR;
        
        ctx.lineWidth = 2;
        var offsetX = cx - d1 / 2;
        var offsetY = cy + d3 / 2;

        var labelColors = {
            'X': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' },
            'Y': { l1: '#e74c3c', l2: '#27ae60', l3: '#2980b9' },
            'Z': { l1: '#e74c3c', l2: '#2980b9', l3: '#27ae60' }
        };
        
        var colorMap = labelColors[ori] || labelColors['Z'];
        var labelColor1 = colorMap.l1;
        var labelColor2 = colorMap.l2;
        var labelColor3 = colorMap.l3;

        var colors = {
            border: "#4a9eff",
            fill: "rgba(74, 158, 255, 0.18)",
            borderTop: "#6ab0ff",
            fillTop: "rgba(74, 158, 255, 0.10)",
            label: "#e8edf5",
            shadow: "rgba(74, 158, 255, 0.08)"
        };

        // Shadow - check if supported
        try {
            ctx.shadowColor = "rgba(74, 158, 255, 0.15)";
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 10;
        } catch(e) {
            // Shadow not supported
        }

        function drawRoundedRect(ox, oy, w, h, rTL, rTR, rBR, rBL, isTop) {
            var pts = [];
            var segments = 12;
            
            function arcPoint(cx, cy, r, startAngle, endAngle, numSeg) {
                var pts = [];
                for (var i = 0; i <= numSeg; i++) {
                    var t = startAngle + (endAngle - startAngle) * (i / numSeg);
                    var px = cx + r * Math.cos(t);
                    var py = cy + r * Math.sin(t);
                    pts.push({x: px, y: py});
                }
                return pts;
            }
            
            var pTL = {x: ox + rTL, y: oy};
            var pTR = {x: ox + w - rTR, y: oy};
            var pBR = {x: ox + w, y: oy + h - rBR};
            var pBL = {x: ox + rBL, y: oy + h};
            
            var arcTL = arcPoint(ox + rTL, oy + rTL, rTL, Math.PI, 3*Math.PI/2, segments);
            var arcTR = arcPoint(ox + w - rTR, oy + rTR, rTR, 3*Math.PI/2, 2*Math.PI, segments);
            var arcBR = arcPoint(ox + w - rBR, oy + h - rBR, rBR, 0, Math.PI/2, segments);
            var arcBL = arcPoint(ox + rBL, oy + h - rBL, rBL, Math.PI/2, Math.PI, segments);
            
            var allPoints = [
                {x: pTL.x, y: pTL.y}
            ];
            for (var i = 0; i < arcTL.length; i++) {
                allPoints.push(arcTL[i]);
            }
            allPoints.push({x: pTR.x, y: pTR.y});
            for (var i = 0; i < arcTR.length; i++) {
                allPoints.push(arcTR[i]);
            }
            allPoints.push({x: pBR.x, y: pBR.y});
            for (var i = 0; i < arcBR.length; i++) {
                allPoints.push(arcBR[i]);
            }
            allPoints.push({x: pBL.x, y: pBL.y});
            for (var i = 0; i < arcBL.length; i++) {
                allPoints.push(arcBL[i]);
            }
            
            var result = [];
            for (var i = 0; i < allPoints.length; i++) {
                var p = allPoints[i];
                var proj = projectISO(p.x, p.y, 0, offsetX, offsetY);
                result.push(proj);
            }
            return result;
        }
        
        // Vẽ đáy
        var bottomPoints = drawRoundedRect(0, 0, d1, d2, r1s, r2s, r3s, r4s, false);
        
        try {
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 8;
            ctx.shadowOffsetY = 12;
        } catch(e) {}
        
        ctx.strokeStyle = colors.border;
        ctx.fillStyle = colors.fill;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(bottomPoints[0].x, bottomPoints[0].y);
        for (var i = 1; i < bottomPoints.length; i++) {
            ctx.lineTo(bottomPoints[i].x, bottomPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // Vẽ mặt trên
        var topPoints = drawRoundedRect(0, 0, d1, d2, r1s, r2s, r3s, r4s, true);
        var topPointsOffset = [];
        for (var i = 0; i < topPoints.length; i++) {
            var p = topPoints[i];
            topPointsOffset.push({x: p.x, y: p.y - d3});
        }
        
        try {
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 5;
        } catch(e) {}
        
        ctx.strokeStyle = colors.borderTop;
        ctx.fillStyle = colors.fillTop;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(topPointsOffset[0].x, topPointsOffset[0].y);
        for (var i = 1; i < topPointsOffset.length; i++) {
            ctx.lineTo(topPointsOffset[i].x, topPointsOffset[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        
        // Reset shadow
        try {
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } catch(e) {}
        
        // Vẽ cạnh đứng
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.6;
        
        var corners = [
            {x: 0, y: 0},
            {x: d1, y: 0},
            {x: d1, y: d2},
            {x: 0, y: d2}
        ];
        
        var cornerOffsets = [
            {x: r1s, y: r1s},
            {x: -r2s, y: r2s},
            {x: -r3s, y: -r3s},
            {x: r4s, y: -r4s}
        ];
        
        for (var i = 0; i < 4; i++) {
            var cxCorner = corners[i].x + cornerOffsets[i].x;
            var cyCorner = corners[i].y + cornerOffsets[i].y;
            
            var bottom = projectISO(cxCorner, cyCorner, 0, offsetX, offsetY);
            var top = projectISO(cxCorner, cyCorner, d3, offsetX, offsetY);
            
            ctx.beginPath();
            ctx.moveTo(bottom.x, bottom.y);
            ctx.lineTo(top.x, top.y);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
        
        // Vẽ nét đứt
        ctx.strokeStyle = "rgba(74, 158, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        var hiddenCorners = [
            {x: 0, y: d2, ox: r4s, oy: -r4s},
            {x: d1, y: d2, ox: -r3s, oy: -r3s}
        ];
        for (var i = 0; i < hiddenCorners.length; i++) {
            var cxCorner = hiddenCorners[i].x + hiddenCorners[i].ox;
            var cyCorner = hiddenCorners[i].y + hiddenCorners[i].oy;
            var bottom = projectISO(cxCorner, cyCorner, 0, offsetX, offsetY);
            var top = projectISO(cxCorner, cyCorner, d3, offsetX, offsetY);
            ctx.beginPath();
            ctx.moveTo(bottom.x, bottom.y);
            ctx.lineTo(top.x, top.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // Vẽ nhãn
        ctx.font = "bold 14px Segoe UI, sans-serif";
        try {
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
        } catch(e) {}
        
        var labelPositions = [
            {x: d1/2, y: 0, z: 0, color: labelColor1},
            {x: d1, y: d2/2, z: d3, color: labelColor2},
            {x: 0, y: 0, z: d3/2, color: labelColor3}
        ];
        
        var labels = [lbl1, lbl2, lbl3];
        var labelOffsets = [
            {x: 0, y: -15},
            {x: 12, y: -5},
            {x: -50, y: 5}
        ];
        
        for (var i = 0; i < 3; i++) {
            var lx = labelPositions[i].x;
            var ly = labelPositions[i].y;
            var lz = labelPositions[i].z;
            var p = projectISO(lx, ly, lz, offsetX, offsetY);
            ctx.fillStyle = labelPositions[i].color;
            ctx.fillText(labels[i], p.x + labelOffsets[i].x, p.y + labelOffsets[i].y);
        }
        
        try {
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } catch(e) {}
    }

    function log(t) {
        var chatBox = document.getElementById("chat");
        if (!chatBox) return;
        chatBox.innerHTML += "<div>" + t + "</div>";
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function voice() {
        // Kiểm tra hỗ trợ Speech Recognition
        var SR = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;
        if (!SR) {
            alert("Trình duyệt của bạn chưa hỗ trợ Voice! Vui lòng sử dụng Chrome hoặc Edge.");
            log("❌ Trình duyệt không hỗ trợ Voice");
            return;
        }

        // Kiểm tra Speech Synthesis
        if (!window.speechSynthesis) {
            alert("Trình duyệt của bạn chưa hỗ trợ Voice!");
            log("❌ Trình duyệt không hỗ trợ Speech Synthesis");
            return;
        }

        var startMsg = "Xin chào, tôi có thể giúp gì cho bạn";
        log("🤖 " + startMsg);

        try {
            window.speechSynthesis.cancel();
        } catch(e) {}
        
        var u = new SpeechSynthesisUtterance(startMsg);
        u.lang = "vi-VN";
        u.rate = 0.95;

        u.onend = function() {
            log("🔴 <i>Đang nghe...</i>");
            var r = new SR();
            r.lang = "vi-VN";
            r.continuous = true;
            r.interimResults = false;

            var silenceTimer = null;

            r.onresult = function(e) {
                var results = e.results;
                if (!results || results.length === 0) return;
                var lastResult = results[results.length - 1];
                if (!lastResult) return;
                var text = lastResult[0].transcript || "";
                
                clearTimeout(silenceTimer);
                silenceTimer = setTimeout(function() {
                    try {
                        r.stop();
                    } catch(e) {}
                    processFullVoiceNLP(text);
                }, 2500);
            };

            r.onerror = function(e) {
                var errorMsg = "Chưa nhận diện được thông số, vui lòng thử lại!";
                log("🤖 " + errorMsg);
                speak(errorMsg);
            };

            try {
                r.start();
            } catch(e) {
                var errorMsg = "Không thể truy cập microphone! Vui lòng kiểm tra quyền.";
                log("🤖 " + errorMsg);
                speak(errorMsg);
            }
        };

        try {
            window.speechSynthesis.speak(u);
        } catch(e) {
            log("❌ Lỗi phát âm thanh!");
        }
    }

    function processFullVoiceNLP(t) {
        log("👤 " + t);

        var str = t.toLowerCase()
                   .replace(/\b(âm|trừ)\b/g, "-")
                   .replace(/\bphẩy\b/g, ",")
                   .replace(/\bchấm\b/g, "");

        str = str.replace(/(\d+)\.(\d+)/g, '$1$2');

        var updatedCount = 0;

        function cleanNumberString(numStr) {
            if (!numStr) return "0";
            numStr = numStr.trim().replace(/\s+/g, '');
            return numStr.replace(',', '.');
        }

        function findVal(keywords) {
            for (var k = 0; k < keywords.length; k++) {
                var kw = keywords[k];
                var regex = new RegExp(kw + "(?:\\s+là|\\s+bằng|\\s*[:=])?\\s*(-?\\s*\\d+(?:,\\d+)?)", "i");
                var match = str.match(regex);
                if (match) {
                    return cleanNumberString(match[1]);
                }
            }
            return null;
        }

        // Orientation
        if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?x\b/i.test(str)) { setOri('X'); updatedCount++; }
        else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?y\b/i.test(str)) { setOri('Y'); updatedCount++; }
        else if (/(trục|hướng|ori|trục tọa độ)\s*(theo\s*trục\s*)?(z|zét|zed)\b/i.test(str)) { setOri('Z'); updatedCount++; }

        // Position
        var posX = findVal(["tọa độ x", "vị trí x", "pos x", "position x", "đồ ít", "tọa độ ít", "tọa độ xy", "x"]);
        var posY = findVal(["tọa độ y", "vị trí y", "pos y", "position y", "y"]);
        var posZ = findVal(["tọa độ zét", "tọa độ zed", "tọa độ z", "vị trí z", "pos z", "position z", "z"]);

        if (posX !== null) { document.getElementById("px").value = posX; updatedCount++; }
        if (posY !== null) { document.getElementById("py").value = posY; updatedCount++; }
        if (posZ !== null) { document.getElementById("pz").value = posZ; updatedCount++; }

        // Dimension
        var len = findVal(["chiều dài", "độ dài", "dài", "length", "l"]);
        var wid = findVal(["chiều rộng", "độ rộng", "rộng", "width", "w"]);
        var hei = findVal(["chiều cao", "độ cao", "cao", "height", "h"]);

        if (len !== null) { document.getElementById("dx").value = len; updatedCount++; }
        if (wid !== null) { document.getElementById("dy").value = wid; updatedCount++; }
        if (hei !== null) { document.getElementById("dz").value = hei; updatedCount++; }

        // Corner Radius
        var rad1 = findVal(["r1", "radius 1", "bo góc 1", "bán kính 1"]);
        var rad2 = findVal(["r2", "radius 2", "bo góc 2", "bán kính 2"]);
        var rad3 = findVal(["r3", "radius 3", "bo góc 3", "bán kính 3"]);
        var rad4 = findVal(["r4", "radius 4", "bo góc 4", "bán kính 4"]);
        var radAll = findVal(["bo góc", "bán kính", "radius", "r"]);

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
            var rawNums = str.match(/-?\d+(,\d+)?/g);
            if (rawNums && rawNums.length >= 3) {
                document.getElementById("dx").value = cleanNumberString(rawNums[0]);
                document.getElementById("dy").value = cleanNumberString(rawNums[1]);
                document.getElementById("dz").value = cleanNumberString(rawNums[2]);
                updatedCount = 3;
            }
        }

        if (updatedCount > 0) {
            draw();
            var successMsg = "✅ Đã cập nhật thông số!";
            log("🤖 " + successMsg);
            speak(successMsg);
        } else {
            var failMsg = "❌ Chưa nhận diện được thông số, vui lòng thử lại!";
            log("🤖 " + failMsg);
            speak(failMsg);
        }
    }

    function speak(t) {
        try {
            window.speechSynthesis.cancel();
        } catch(e) {}
        
        try {
            var u = new SpeechSynthesisUtterance(t);
            u.lang = "vi-VN";
            u.rate = 0.95;
            window.speechSynthesis.speak(u);
        } catch(e) {
            log("❌ Lỗi phát âm thanh!");
        }
    }

    /* 4. XUẤT FILE .MAC */
    function saveFile() {
        var px = parseInputValue("px");
        var py = parseInputValue("py");
        var pz = parseInputValue("pz");

        var L = parseInputValue("dx");
        var W = parseInputValue("dy");
        var H = parseInputValue("dz");

        var r1 = parseInputValue("r1");
        var r2 = parseInputValue("r2");
        var r3 = parseInputValue("r3");
        var r4 = parseInputValue("r4");

        var oriStr = "ORI Y is Y and Z is Z";
        if (ORI === "X") {
            oriStr = "ORI Y is Y and Z is X";
        } else if (ORI === "Y") {
            oriStr = "ORI Y is -X and Z is Y";
        } else if (ORI === "Z") {
            oriStr = "ORI Y is Y and Z is Z";
        }

        var data = "NEW EQUIPMENT\n" +
"USRCOG ( X ( 0 ) Y ( 0 ) Z ( 0 ) )\n" +
"USRWCO ( X ( 0 ) Y ( 0 ) Z ( 0 ) )\n" +
"POS X " + px + "mm Y " + py + "mm Z " + pz + "mm\n" +
oriStr + "\n" +
"BUIL false\n" +
"DSCO unset\n" +
"PTSP unset\n" +
"INSC unset\n" +
"\n" +
"NEW EXTRUSION\n" +
"ORI Y is -Y and Z is Z\n" +
"LEVE 0 2\n" +
"HEIG " + H + "mm\n" +
"\n" +
"NEW LOOP\n" +
"\n" +
"NEW VERTEX\n" +
"FRAD " + r1 + "mm\n" +
"\n" +
"END\n" +
"NEW VERTEX\n" +
"POS X 0mm Y " + W + "mm Z 0mm\n" +
"FRAD " + r2 + "mm\n" +
"\n" +
"END\n" +
"NEW VERTEX\n" +
"POS X " + L + "mm Y " + W + "mm Z 0mm\n" +
"FRAD " + r3 + "mm\n" +
"\n" +
"END\n" +
"NEW VERTEX\n" +
"POS X " + L + "mm Y 0mm Z 0mm\n" +
"FRAD " + r4 + "mm\n" +
"\n" +
"END\n" +
"END\n" +
"END\n" +
"END";

        try {
            var blob = new Blob([data], { type: "text/plain;charset=utf-8" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "Opening.mac";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function() {
                URL.revokeObjectURL(a.href);
            }, 100);
            log("📁 Đã xuất file Opening.mac");
        } catch(e) {
            // Fallback cho trình duyệt cũ
            try {
                var blob = new Blob([data], { type: "text/plain;charset=utf-8" });
                var a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "Opening.mac";
                a.click();
            } catch(e2) {
                alert("Không thể xuất file! Vui lòng sử dụng trình duyệt hiện đại hơn.");
            }
        }
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
        log("🔄 Đã reset tất cả thông số về mặc định");
    }

    function help() {
        window.open("https://drive.google.com/file/d/14NNDzXSCG63m1yQZb51tZhrZfd5k8KPf/view?usp=sharing");
    }

    // Hàm Library
    function library() {
        log("📚 Đang mở thư viện...");
        alert("Chức năng Library đang được phát triển!");
    }

    // Gán hàm ra global
    window.setOri = setOri;
    window.voice = voice;
    window.saveFile = saveFile;
    window.reset = reset;
    window.help = help;
    window.library = library;
    window.draw = draw;

    // Sự kiện
    var inputs = document.querySelectorAll("input");
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener("input", draw);
    }

    window.addEventListener("resize", draw);
    
    // Vẽ lần đầu
    draw();

})();
