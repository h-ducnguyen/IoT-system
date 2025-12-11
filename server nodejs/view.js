// ======================== GIAO DIỆN WEB ========================
// File: views.js
// Mục đích: Chứa tất cả HTML/CSS/JavaScript cho giao diện

// CSS dùng chung cho tất cả trang
const commonStyles = `
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: "Segoe UI", sans-serif; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0d1b2a; color: #e0e0e0; padding: 20px; }
    .form-container, .page-container { background: #1e2f47; padding: 40px 50px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); width: 90%; max-width: 900px; text-align: center; } 
    h1, h2 { color: #a9d6e5; margin-bottom: 25px; }
    input { width: 100%; padding: 12px; margin: 10px 0; border: none; border-radius: 8px; outline: none; }
    button { width: 100%; padding: 12px; margin-top: 10px; border: none; border-radius: 8px; cursor: pointer; background: #0077b6; color: white; font-weight: 600; transition: all 0.3s; }
    button:hover { background: #00b4d8; transform: translateY(-2px); box-shadow: 0 0 12px rgba(0,180,216,0.6); }
    .error { color: #ff6b6b; margin-top: 10px; }
    .success { color: #80ed99; margin-top: 10px; }
    .switch-form { margin-top: 15px; font-size: 14px; }
    a { color: #00b4d8; text-decoration: none; }
    
    .sensor-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 25px; }
    .gauge-box { background: #243b55; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 3px 10px rgba(0,0,0,0.3); display: flex; flex-direction: column; align-items: center; }
    .gauge-title { color: #89c2d9; margin-bottom: 15px; font-size: 1.1em; font-weight: 600; }
    .gauge-canvas { width: 120px; height: 120px; margin: 0 auto; }
    
    .gauge-info { width: 100%; margin-top: 15px; font-size: 0.9em; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 3px; }
    .info-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .val-text { font-weight: bold; color: #fff; }
    
    .status-good { color: #00e676; font-weight: bold; }
    .status-warn { color: #ff3d00; font-weight: bold; }
    .status-normal { color: #29b6f6; font-weight: bold; }
    
    .pump-section, .control-section { background: #243b55; padding: 20px; border-radius: 10px; margin-top: 20px; box-shadow: 0 3px 10px rgba(0,0,0,0.3); }
    .pump-btn { width: 48%; margin: 5px 1%; display: inline-block; }
    .pump-stop { background: #d00000 !important; }
    .btn-group { display: flex; justify-content: space-between; }
    
    input[type=range] { width: 100%; margin: 15px 0; height: 8px; border-radius: 5px; background: #1e2f47; -webkit-appearance: none; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #00b4d8; cursor: pointer; }
    
    .hidden-box { display: none; margin-top: 15px; border-top: 1px solid #455a64; padding-top: 15px; }
`;

// ======================== TRANG ĐĂNG NHẬP ========================
exports.loginPage = (msg = '') => {
    const message = msg ? `<p class="${msg.includes('thành công') ? 'success' : 'error'}">${msg}</p>` : '';
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Đăng nhập</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${commonStyles}</style>
        </head>
        <body>
            <div class="form-container">
                <h1>🔐 Đăng Nhập</h1>
                <form action="/login" method="POST">
                    <input type="text" name="username" placeholder="Tên đăng nhập" required>
                    <input type="password" name="password" placeholder="Mật khẩu" required>
                    <button type="submit">Đăng nhập</button>
                </form>
                ${message}
                <p class="switch-form">Chưa có tài khoản? <a href="/register">Đăng ký</a></p>
            </div>
        </body>
        </html>
    `;
};

// ======================== TRANG ĐĂNG KÝ ========================
exports.registerPage = (msg = '') => {
    const message = msg ? `<p class="${msg.includes('thành công') ? 'success' : 'error'}">${msg}</p>` : '';
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Đăng ký</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${commonStyles}</style>
        </head>
        <body>
            <div class="form-container">
                <h1>📝 Đăng Ký</h1>
                <form action="/register" method="POST">
                    <input type="text" name="username" placeholder="Tên đăng nhập" required>
                    <input type="password" name="password" placeholder="Mật khẩu" required>
                    <button type="submit">Đăng ký</button>
                </form>
                ${message}
                <p class="switch-form">Đã có tài khoản? <a href="/login">Đăng nhập</a></p>
            </div>
        </body>
        </html>
    `;
};

// ======================== TRANG DASHBOARD ========================
exports.dashboardPage = (username) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Dashboard</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${commonStyles}</style>
        </head>
        <body>
            <div class="page-container">
                <h1>👋 Xin chào, <strong>${username}</strong>!</h1>
                <button onclick="location.href='/control'">📊 Giám sát & Điều khiển</button>
                <button style="background:#d00000;margin-top:15px;" onclick="location.href='/logout'">🚪 Đăng xuất</button>
            </div>
        </body>
        </html>
    `;
};

// ======================== TRANG GIÁM SÁT & ĐIỀU KHIỂN ========================
exports.controlPage = () => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Giám Sát Hệ Thống</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>${commonStyles}</style>
            <script src="https://bernii.github.io/gauge.js/dist/gauge.min.js"></script>
        </head>
        <body>
            <div class="page-container">
                <h2>📊 Thông Số Môi Trường</h2>
                
                <div class="sensor-grid">
                    <!-- Nhiệt độ -->
                    <div class="gauge-box">
                        <div class="gauge-title">Nhiệt độ (°C)</div>
                        <canvas id="tempGauge" class="gauge-canvas"></canvas>
                        <div class="gauge-info">
                            <div class="info-row">
                                <span>Giá trị:</span> <span id="tempVal" class="val-text">--</span>
                            </div>
                            <div class="info-row">
                                <span>Trạng thái:</span> <span id="tempStatus" class="status-normal">--</span>
                            </div>
                        </div>
                    </div>

                    <!-- Độ ẩm không khí -->
                    <div class="gauge-box">
                        <div class="gauge-title">Độ ẩm KK (%)</div>
                        <canvas id="humiGauge" class="gauge-canvas"></canvas>
                        <div class="gauge-info">
                            <div class="info-row">
                                <span>Giá trị:</span> <span id="humiVal" class="val-text">--</span>
                            </div>
                            <div class="info-row">
                                <span>Trạng thái:</span> <span id="humiStatus" class="status-normal">--</span>
                            </div>
                        </div>
                    </div>

                    <!-- Độ ẩm đất -->
                    <div class="gauge-box">
                        <div class="gauge-title">Độ ẩm Đất (%)</div>
                        <canvas id="soilGauge" class="gauge-canvas"></canvas>
                        <div class="gauge-info">
                            <div class="info-row">
                                <span>Giá trị:</span> <span id="soilVal" class="val-text">--</span>
                            </div>
                            <div class="info-row">
                                <span>Trạng thái:</span> <span id="soilStatus" class="status-normal">--</span>
                            </div>
                        </div>
                    </div>

                    <!-- Ánh sáng -->
                    <div class="gauge-box">
                        <div class="gauge-title">Ánh Sáng (%)</div>
                        <canvas id="lightGauge" class="gauge-canvas"></canvas>
                        <div class="gauge-info">
                            <div class="info-row">
                                <span>Giá trị:</span> <span id="lightVal" class="val-text">--</span>
                            </div>
                            <div class="info-row">
                                <span>Trạng thái:</span> <span id="lightStatus" class="status-normal">--</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Điều khiển LED -->
                <div class="control-section">
                    <h2>💡 Điều khiển Đèn LED</h2>
                    <div class="btn-group">
                        <button class="pump-btn" onclick="controlLED('ON')">BẬT ĐÈN</button>
                        <button class="pump-btn pump-stop" onclick="controlLED('OFF')">TẮT ĐÈN</button>
                    </div>
                </div>

                <!-- Điều khiển Bơm -->
                <div class="pump-section">
                    <h2>⚙️ Hệ Thống Tưới (Máy Bơm)</h2>
                    
                    <div style="margin-bottom: 15px;">
                        <label>Chế độ:</label>
                        <button style="width: 100px; margin-right: 10px;" onclick="setMode('MANUAL')">Thủ công</button>
                        <button style="width: 100px;" onclick="setMode('AUTO')">Tự động</button>
                    </div>

                    <div id="manualPanel" class="hidden-box" style="display:block;">
                        <h3>Chế độ Thủ Công</h3>
                        <div class="btn-group">
                            <button class="pump-btn" onclick="controlPump('ON')">BẬT BƠM</button>
                            <button class="pump-btn pump-stop" onclick="controlPump('OFF')">TẮT BƠM</button>
                        </div>
                    </div>

                    <div id="autoPanel" class="hidden-box">
                        <h3>Cấu hình Tự Động</h3>
                        <label>Ngưỡng bật bơm (%): <span id="onVal">30</span>%</label>
                        <input type="range" id="thresholdOn" min="0" max="100" value="30" oninput="document.getElementById('onVal').innerText=this.value">
                        
                        <label>Ngưỡng tắt bơm (%): <span id="offVal">80</span>%</label>
                        <input type="range" id="thresholdOff" min="0" max="100" value="80" oninput="document.getElementById('offVal').innerText=this.value">
                        
                        <button onclick="updateThreshold()">Cập nhật Ngưỡng</button>
                    </div>

                    <div style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top:10px;">
                        <label>Tốc độ bơm (PWM): <span id="speedVal">255</span></label>
                        <input type="range" id="pumpSpeed" min="0" max="255" value="255" onchange="updateSpeed(this.value)" oninput="document.getElementById('speedVal').innerText=this.value">
                    </div>
                </div>

                <button style="margin-top: 20px; background: #607d8b;" onclick="location.href='/dashboard'">⬅️ Quay lại</button>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                // --- 1. CẤU HÌNH GAUGE ---
                var opts = {
                    angle: 0, 
                    lineWidth: 0.2, 
                    radiusScale: 0.9, 
                    pointer: { length: 0.6, strokeWidth: 0.035, color: '#ffffff' },
                    limitMax: false, limitMin: false,
                    colorStart: '#6FADCF', colorStop: '#8FC0DA', strokeColor: '#E0E0E0',
                    generateGradient: true, highDpiSupport: true,
                    percentColors: [[0.0, "#ff0000"], [0.5, "#f9c802"], [1.0, "#00ff00"]]
                };

                function initGauge(canvasId, maxVal, initialValue = 0) {
                    var target = document.getElementById(canvasId); 
                    var gauge = new Gauge(target).setOptions(opts); 
                    gauge.maxValue = maxVal; 
                    gauge.setMinValue(0);  
                    gauge.animationSpeed = 32; 
                    gauge.set(initialValue); 
                    return gauge;
                }

                var gTemp = initGauge('tempGauge', 50, 25.5);
                var gHumi = initGauge('humiGauge', 100, 65);
                var gSoil = initGauge('soilGauge', 100, 45);
                var gLight = initGauge('lightGauge', 100, 70);

                document.getElementById('tempVal').innerText = '25.5 °C';
                document.getElementById('humiVal').innerText = '65 %';
                document.getElementById('soilVal').innerText = '45 %';
                document.getElementById('lightVal').innerText = '70 %';

                // --- 2. XỬ LÝ TRẠNG THÁI ---
                function updateStatus(elementId, value, type) {
                    const el = document.getElementById(elementId);
                    let status = "Bình thường";
                    let cssClass = "status-normal";
                    value = parseFloat(value);

                    if (type === 'temp') {
                        if (value > 35) { status = "Nóng quá!"; cssClass = "status-warn"; }
                        else if (value < 15) { status = "Lạnh"; cssClass = "status-normal"; }
                        else { status = "Ổn định"; cssClass = "status-good"; }
                    } 
                    else if (type === 'humi') { 
                        if (value < 40) { status = "Hanh khô"; cssClass = "status-warn"; }
                        else if (value > 90) { status = "Ẩm ướt"; cssClass = "status-normal"; }
                        else { status = "Tốt"; cssClass = "status-good"; }
                    }
                    else if (type === 'soil') { 
                        if (value < 30) { status = "Đất khô"; cssClass = "status-warn"; }
                        else if (value > 80) { status = "Đất ướt"; cssClass = "status-normal"; }
                        else { status = "Đủ nước"; cssClass = "status-good"; }
                    }
                    else if (type === 'light') {
                        if (value === 100) { status = "Thiếu sáng"; cssClass = "status-warn"; }
                        else { status = "Đủ sáng"; cssClass = "status-good"; }
                    }

                    el.innerText = status;
                    el.className = cssClass; 
                }

                updateStatus('tempStatus', 25.5, 'temp');
                updateStatus('humiStatus', 65, 'humi');
                updateStatus('soilStatus', 45, 'soil');
                updateStatus('lightStatus', 70, 'light');

                // --- 3. SOCKET IO ---
                const socket = io();
                
                socket.on('connect', () => console.log('✅ Kết nối Socket.IO'));
                socket.on('disconnect', () => console.log('❌ Mất kết nối Socket.IO'));

                socket.on('sensorData', (data) => {
                    console.log("📊 Nhận dữ liệu:", data);

                    if(data.temp !== undefined) {
                        const tempValue = parseFloat(data.temp);
                        gTemp.set(tempValue);
                        document.getElementById('tempVal').innerText = tempValue.toFixed(1) + ' °C';
                        updateStatus('tempStatus', tempValue, 'temp');
                    }

                    if(data.humi !== undefined) {
                        const humiValue = parseFloat(data.humi);
                        gHumi.set(humiValue);
                        document.getElementById('humiVal').innerText = humiValue.toFixed(1) + ' %';
                        updateStatus('humiStatus', humiValue, 'humi');
                    }

                    if(data.soilHumi !== undefined) {
                        const soilValue = parseFloat(data.soilHumi);
                        gSoil.set(soilValue);
                        document.getElementById('soilVal').innerText = soilValue.toFixed(1) + ' %';
                        updateStatus('soilStatus', soilValue, 'soil');
                    }

                    if (data.lightVal !== undefined) {
                        const rawLight = parseInt(data.lightVal);
                        const lightValue = rawLight === 1 ? 100 : 0;
                        gLight.set(lightValue);
                        document.getElementById('lightVal').innerText = lightValue + ' %';
                        updateStatus('lightStatus', lightValue, 'light');
                    }
                });

                // --- 4. CÁC HÀM ĐIỀU KHIỂN ---
                function controlLED(state) {
                    fetch('/light/' + state.toLowerCase())
                        .then(() => console.log('LED:', state))
                        .catch(err => console.error('Lỗi LED:', err));
                }

                function controlPump(state) {
                    fetch('/pump/manual/' + state.toLowerCase())
                        .then(() => console.log('Bơm:', state))
                        .catch(err => console.error('Lỗi bơm:', err));
                }

                function setMode(mode) {
                    if(mode === 'MANUAL') {
                        document.getElementById('manualPanel').style.display = 'block';
                        document.getElementById('autoPanel').style.display = 'none';
                        fetch('/pump/mode/manual');
                    } else {
                        document.getElementById('manualPanel').style.display = 'none';
                        document.getElementById('autoPanel').style.display = 'block';
                        fetch('/pump/mode/auto');
                    }
                }

                function updateThreshold() {
                    const on = document.getElementById('thresholdOn').value;
                    const off = document.getElementById('thresholdOff').value;
                    fetch('/pump/auto/threshold', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ threshold_on: on, threshold_off: off })
                    }).then(() => alert('Đã cập nhật ngưỡng!'));
                }

                function updateSpeed(val) {
                    fetch('/pump/speed', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ speed: val })
                    });
                }
            </script>
        </body>
        </html>
    `;
};