// ======================== IMPORT CÁC MODULE ========================
const express = require('express');
const mqtt = require('mqtt');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');

// Import cấu hình và giao diện
const config = require('./config');
const views = require('./views');

// ======================== KHỞI TẠO SERVER ========================
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ======================== KẾT NỐI DATABASE ========================
const db = mysql.createConnection(config.database);

db.connect(err => {
    if (err) {
        console.error('❌ Lỗi kết nối Database:', err);
    } else {
        console.log('✅ Kết nối Database thành công!');
    }
});

// ======================== KẾT NỐI MQTT ========================
let latestSensorData = { 
    temp: 25.5, 
    humi: 65, 
    soilHumi: 45, 
    lightVal: 70 
};

let deviceStates = {
    led: 'OFF',
    pumpManual: 'OFF',
    pumpMode: 'MANUAL'
};

const mqttClient = mqtt.connect(config.mqtt.server, {
    clientId: 'Nodejs_WebApp_' + Math.random().toString(16).substr(2, 8),
    username: config.mqtt.username,
    password: config.mqtt.password
});

mqttClient.on('connect', () => {
    console.log('✅ Đã kết nối MQTT Broker!');
    
    // Subscribe các topics
    Object.values(config.mqtt.topics).forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (!err) console.log(`📡 Lắng nghe: ${topic}`);
        });
    });
});

mqttClient.on('error', (error) => {
    console.error('❌ Lỗi MQTT:', error);
});

// ======================== XỬ LÝ MQTT MESSAGE ========================
mqttClient.on('message', (topic, message) => {
    const msg = message.toString();
    console.log(`📨 MQTT [${topic}]: ${msg}`);

    // Dữ liệu cảm biến
    if (topic === config.mqtt.topics.sensor) {
        try {
            const data = JSON.parse(msg);
            
            latestSensorData = {
                temp: data.temperature || data.temp || 0,
                humi: data.humidity || data.humi || 0,
                soilHumi: data.soilMoisture || data.soil || data.soilHumi || 0,
                lightVal: data.light || data.lightValue || data.lightVal || 0
            };

            console.log("-----------------------------------------");
            console.log(`🌡️  Nhiệt độ: ${latestSensorData.temp}°C`);
            console.log(`💧 Độ ẩm KK: ${latestSensorData.humi}%`);
            console.log(`🌱 Độ ẩm Đất: ${latestSensorData.soilHumi}%`);
            console.log(`☀️  Ánh sáng: ${latestSensorData.lightVal}%`);
            console.log("-----------------------------------------");
            
            io.emit('sensorData', latestSensorData);

            // Lưu vào Database
            const sql = 'INSERT INTO sensor_data (temperature, humidity, soil_moisture, light_value) VALUES (?, ?, ?, ?)';
            db.query(sql, [
                latestSensorData.temp, 
                latestSensorData.humi, 
                latestSensorData.soilHumi, 
                latestSensorData.lightVal
            ], (err) => {
                if (err) console.error("⚠️  Lỗi lưu DB:", err.message);
            });

        } catch (e) {
            console.error("❌ Lỗi parse JSON:", e);
        }
    } 
    // Trạng thái thiết bị
    else if (topic === config.mqtt.topics.led_control) {
        deviceStates.led = msg;
        console.log(`💡 LED: ${msg}`);
    }
    else if (topic === config.mqtt.topics.pump_state) {
        deviceStates.pumpManual = msg;
        console.log(`💧 Bơm: ${msg}`);
    }
    else if (topic === config.mqtt.topics.pump_mode) {
        deviceStates.pumpMode = msg;
        console.log(`⚙️  Chế độ: ${msg}`);
    }

    io.emit('deviceStates', deviceStates);
});

// ======================== SOCKET.IO ========================
io.on('connection', (socket) => {
    console.log('✅ Client kết nối Socket.IO');
    
    socket.emit('sensorData', latestSensorData);
    socket.emit('deviceStates', deviceStates);
    
    socket.on('disconnect', () => {
        console.log('❌ Client ngắt kết nối');
    });
});

// ======================== XỬ LÝ NGƯỜI DÙNG ========================
const registerUser = async (username, password) => {
    const hashed = bcrypt.hashSync(password, config.session.saltRounds);
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

const findUser = (username) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
            if (err) reject(err);
            else resolve(results[0]);
        });
    });
};

// ======================== ROUTES - AUTHENTICATION ========================
app.get('/', (req, res) => {
    res.redirect(req.session.loggedin ? '/dashboard' : '/login');
});

app.get('/login', (req, res) => {
    res.send(views.loginPage(req.query.msg || ''));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await findUser(username);
    
    if (!user) {
        return res.redirect('/login?msg=Người dùng không tồn tại!');
    }
    
    if (bcrypt.compareSync(password, user.password)) {
        req.session.loggedin = true;
        req.session.username = username;
        console.log(`🔑 ${username} đã đăng nhập`);
        res.redirect('/dashboard');
    } else {
        res.redirect('/login?msg=Mật khẩu sai!');
    }
});

app.get('/register', (req, res) => {
    res.send(views.registerPage(req.query.msg || ''));
});

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existing = await findUser(username);
        
        if (existing) {
            return res.redirect('/register?msg=Tên đăng nhập đã tồn tại!');
        }
        
        await registerUser(username, password);
        console.log(`✨ Tạo user mới: ${username}`);
        res.redirect('/login?msg=Đăng ký thành công! Vui lòng đăng nhập.');
    } catch (e) {
        res.redirect('/register?msg=Đăng ký thất bại!');
    }
});

app.get('/dashboard', (req, res) => {
    if (!req.session.loggedin) return res.redirect('/login');
    res.send(views.dashboardPage(req.session.username));
});

app.get('/control', (req, res) => {
    if (!req.session.loggedin) return res.redirect('/login');
    res.send(views.controlPage());
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// ======================== API ĐIỀU KHIỂN THIẾT BỊ ========================

// LED Control
app.get('/light/on', (req, res) => {
    mqttClient.publish(config.mqtt.topics.led_control, 'ON');
    console.log('💡 Bật đèn LED');
    res.sendStatus(200);
});

app.get('/light/off', (req, res) => {
    mqttClient.publish(config.mqtt.topics.led_control, 'OFF');
    console.log('💡 Tắt đèn LED');
    res.sendStatus(200);
});

// Pump Mode Control
app.get('/pump/mode/manual', (req, res) => {
    mqttClient.publish(config.mqtt.topics.pump_mode, 'MANUAL');
    console.log('⚙️  Chế độ THỦ CÔNG');
    res.sendStatus(200);
});

app.get('/pump/mode/auto', (req, res) => {
    mqttClient.publish(config.mqtt.topics.pump_mode, 'AUTO');
    console.log('⚙️  Chế độ TỰ ĐỘNG');
    res.sendStatus(200);
});

// Pump Manual Control
app.get('/pump/manual/on', (req, res) => {
    mqttClient.publish(config.mqtt.topics.pump_state, 'ON');
    console.log('💧 Bật máy bơm');
    res.sendStatus(200);
});

app.get('/pump/manual/off', (req, res) => {
    mqttClient.publish(config.mqtt.topics.pump_state, 'OFF');
    console.log('💧 Tắt máy bơm');
    res.sendStatus(200);
});

// Pump Auto Threshold
app.post('/pump/auto/threshold', (req, res) => {
    const { threshold_on, threshold_off } = req.body;
    mqttClient.publish(
        config.mqtt.topics.pump_threshold, 
        JSON.stringify({ on: threshold_on, off: threshold_off })
    );
    console.log(`📐 Ngưỡng bơm: Bật ${threshold_on}%, Tắt ${threshold_off}%`);
    res.sendStatus(200);
});

// Pump Speed
app.post('/pump/speed', (req, res) => {
    const { speed } = req.body;
    mqttClient.publish(config.mqtt.topics.pump_speed, speed.toString());
    console.log(`💨 Tốc độ bơm: ${speed}/255`);
    res.sendStatus(200);
});

// ======================== KHỞI CHẠY SERVER ========================
server.listen(config.server.port, config.server.host, () => {
    console.log('========================================');
    console.log(`🚀 Server chạy tại: http://localhost:${config.server.port}`);
    console.log(`🌐 Truy cập: http://${config.database.host}:${config.server.port}`);
});