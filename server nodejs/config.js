// ======================== CẤU HÌNH HỆ THỐNG ========================
// File: config.js
// Mục đích: Tập trung tất cả cấu hình để dễ quản lý

module.exports = {
    // Cấu hình Server
    server: {
        port: 3000,
        host: '0.0.0.0'
    },

    // Cấu hình Database MySQL
    database: {
        host: '192.168.1.238', //Dynamic IP
        user: 'root',
        password: 'root14771404',
        database: 'du_an_IoT2025'
    },

    // Cấu hình MQTT Broker
    mqtt: {
        server: 'mqtt://192.168.1.238',
        username: 'serverBroker',
        password: 'Duc//14779683',
        topics: {
            sensor: 'esp32/dht11',
            led_control: 'esp32/led/state',
            pump_state: 'esp32/pump/manual/state',
            pump_speed: 'esp32/pump/speed',
            pump_threshold: 'esp32/pump/auto/threshold',
            pump_mode: 'esp32/pump/mode'
        }
    },

    // Cấu hình Session & Bảo mật
    session: {
        secret: 'my-super-secret-key-!@#$%^&*',
        saltRounds: 10
    }
};