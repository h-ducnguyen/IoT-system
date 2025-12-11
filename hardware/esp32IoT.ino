#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"
#include "configWeb.h" // Đảm bảo bạn có file này để cấu hình Wifi/MQTT
#include <ArduinoJson.h>

// ================== CẤU HÌNH PHẦN CỨNG ==================
#define DHTPIN 15
#define DHTTYPE DHT11
#define LDR_DO 4            // Cảm biến ánh sáng (Digital)
#define SOIL_MOISTURE_AO 34 // Cảm biến độ ẩm đất (Analog)
#define LED_PIN 2           // Đèn LED tích hợp
#define IN1 26              // Điều khiển động cơ L298N
#define IN2 27
#define ENA_BOM 25

// ================== BIẾN LƯU CẤU HÌNH ==================
String wifi_ssid = "";
String wifi_password = "";
String mqtt_server_ip = "";
int mqtt_port = 1883;
String mqtt_user = "";
String mqtt_pass = "";

// ================== MQTT TOPICS ==================
const char* mqtt_sensor_topic = "esp32/dht11";
const char* mqtt_led_topic = "esp32/led/state";
const char* mqtt_pump_mode_control = "esp32/pump/mode";
const char* mqtt_pump_manual_state = "esp32/pump/manual/state";
const char* mqtt_pump_speed_topic = "esp32/pump/speed";
const char* mqtt_pump_threshold_topic = "esp32/pump/auto/threshold";

// ================== BIẾN CHẠY & TRẠNG THÁI ==================
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
unsigned long lastMsg = 0;

// Trạng thái bơm
int currentPumpSpeed = 0;
bool isPumpOn = false;
int currentMode = 0;    // 0 = MANUAL, 1 = AUTO
const char* modeNames[] = {"MANUAL", "AUTO"};

// Ngưỡng AUTO mặc định
int soilMoistureThresholdLow = 30; // Dưới 30% thì bơm
int soilMoistureThresholdHigh = 80; // Trên 80% thì tắt

// ================== PWM WRAPPER ==================
void setupPWM() {
  // Cấu hình PWM cho ESP32 (Core v2.x)
  ledcAttach(ENA_BOM, 5000, 8); 
}

// ================== MÁY BƠM ==================
void setPumpSpeed(int speed) {
  if (speed < 0) speed = 0;
  if (speed > 255) speed = 255;

  currentPumpSpeed = speed;

  if (speed == 0) {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    ledcWrite(ENA_BOM, 0);
    isPumpOn = false;
    Serial.println("💧 Máy bơm TẮT");
  } else {
    digitalWrite(IN1, HIGH);
    digitalWrite(IN2, LOW);
    ledcWrite(ENA_BOM, currentPumpSpeed);
    isPumpOn = true;
    Serial.printf("💧 Máy bơm BẬT | Tốc độ: %d/255\n", currentPumpSpeed);
  }
}

// ================== WIFI SETUP ==================
void setup_wifi() {
  getSavedWifi(wifi_ssid, wifi_password);
  
  if (wifi_ssid == "") {
    Serial.println("⚠️ Chưa cấu hình WiFi! Vào chế độ AP...");
    startConfigAP();
    while(true) { handleWebServer(); delay(10); }
  }
  
  Serial.printf("🔌 Kết nối WiFi: %s\n", wifi_ssid.c_str());
  WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\n❌ Lỗi WiFi! Vào chế độ AP...");
    startConfigAP();
    while(true) { handleWebServer(); delay(10); }
  }
  
  Serial.println("\n✅ WiFi đã kết nối!");
  Serial.print("🌐 IP: "); Serial.println(WiFi.localIP());
}

// ================== MQTT CALLBACK ==================
void callback(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
    msg.trim();

    Serial.printf("📩 [%s]: %s\n", topic, msg.c_str());

    // 1. CHUYỂN CHẾ ĐỘ (MANUAL / AUTO)
    if (String(topic) == mqtt_pump_mode_control) {
        if (msg == "MANUAL") {
            currentMode = 0;
            setPumpSpeed(0); // Tắt bơm khi chuyển chế độ cho an toàn
            Serial.println("⚙️ Chế độ: THỦ CÔNG (MANUAL)");
        } else if (msg == "AUTO") {
            currentMode = 1;
            Serial.println("⚙️ Chế độ: TỰ ĐỘNG (AUTO)");
        }
    }

    // 2. MANUAL CONTROL (Chỉ nhận lệnh khi đang ở Mode MANUAL)
    else if (String(topic) == mqtt_pump_manual_state) {
        if (currentMode == 0) {
            if (msg == "ON") {
                // Nếu chưa đặt tốc độ thì mặc định chạy Max (255) hoặc tốc độ cũ
                setPumpSpeed(currentPumpSpeed == 0 ? 255 : currentPumpSpeed);
            } else if (msg == "OFF") {
                setPumpSpeed(0);
            }
        } else {
            Serial.println("⚠️ Bỏ qua lệnh Manual vì đang ở chế độ AUTO");
        }
    }

    // 3. TỐC ĐỘ BƠM
    else if (String(topic) == mqtt_pump_speed_topic) {
        int speed = msg.toInt();
        if (speed >= 0 && speed <= 255) {
            currentPumpSpeed = speed;
            Serial.printf("⚙️ Đã lưu tốc độ mới: %d\n", speed);
            // Nếu bơm đang bật thì cập nhật ngay lực bơm
            if (isPumpOn) {
                setPumpSpeed(currentPumpSpeed);
            }
        }
    }

    // 4. CÀI ĐẶT NGƯỠNG AUTO (Nhận JSON)
    else if (String(topic) == mqtt_pump_threshold_topic) {
        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, msg);

        if (!error) {
            soilMoistureThresholdLow = doc["on"];
            soilMoistureThresholdHigh = doc["off"];
            Serial.printf("🌱 Cập nhật ngưỡng Auto: Bật <%d%%, Tắt >%d%%\n", 
                          soilMoistureThresholdLow, soilMoistureThresholdHigh);
        }
    }

    // 5. ĐIỀU KHIỂN ĐÈN
    else if (String(topic) == mqtt_led_topic) {
        if (msg == "ON") digitalWrite(LED_PIN, HIGH);
        else if (msg == "OFF") digitalWrite(LED_PIN, LOW);
    }
}

// ================== KẾT NỐI MQTT ==================
void reconnect() {
    String ip, port, user, pw;
    getSavedMQTT(ip, port, user, pw);

    if (ip == "") return;

    mqtt_server_ip = ip;
    mqtt_port = port.toInt();
    mqtt_user = user;
    mqtt_pass = pw;

    client.setServer(mqtt_server_ip.c_str(), mqtt_port);

    while (!client.connected()) {
        Serial.print("🔄 Kết nối MQTT...");
        String id = "ESP32_Client_" + String(random(0xffff), HEX);
        
        bool ok = (mqtt_user != "") ? client.connect(id.c_str(), mqtt_user.c_str(), mqtt_pass.c_str()) 
                                    : client.connect(id.c_str());

        if (ok) {
            Serial.println("✅ OK!");
            // Đăng ký nhận tin từ các topic điều khiển
            client.subscribe(mqtt_pump_manual_state);
            client.subscribe(mqtt_pump_speed_topic);
            client.subscribe(mqtt_pump_threshold_topic);
            client.subscribe(mqtt_pump_mode_control);
            client.subscribe(mqtt_led_topic);
        } else {
            Serial.print("Lỗi rc="); Serial.print(client.state());
            Serial.println(" thử lại sau 2s");
            delay(2000);
        }
    }
}

// ================== SETUP ==================
void setup() {
    Serial.begin(115200);
    
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW); 

    pinMode(LDR_DO, INPUT);
    pinMode(SOIL_MOISTURE_AO, INPUT);
    pinMode(IN1, OUTPUT);
    pinMode(IN2, OUTPUT);
    pinMode(ENA_BOM, OUTPUT);

    setupPWM();
    setPumpSpeed(0);

    dht.begin();
    setup_wifi();
    client.setCallback(callback);
}

// ================== LOOP ==================
void loop() {
    handleWebServer(); // Xử lý web config

    if (!client.connected()) reconnect();
    client.loop();

    unsigned long now = millis();
    if (now - lastMsg > 3000) { // Gửi dữ liệu mỗi 3 giây
        lastMsg = now;

        float h = dht.readHumidity();
        float t = dht.readTemperature();
        
        // Đọc ánh sáng (Module Digital: HIGH=Tối hoặc Sáng tuỳ loại, giả định HIGH=100%)
        int lightVal = digitalRead(LDR_DO);
        int lightPercentage = (lightVal == HIGH) ? 100 : 0; 

        // Đọc độ ẩm đất và map về %
        int soilRaw = analogRead(SOIL_MOISTURE_AO);
        float soilHumi = map(soilRaw, 4095, 0, 0, 100); 
        soilHumi = constrain(soilHumi, 0, 100); // Đảm bảo không âm hoặc >100

        // Kiểm tra lỗi DHT
        if (isnan(h) || isnan(t)) {
            h = 0; t = 0;
            Serial.println("⚠️ Lỗi DHT11!");
        }

        // ============ LOGIC TỰ ĐỘNG (AUTO MODE) ============
        if (currentMode == 1) { // AUTO
            if (soilHumi < soilMoistureThresholdLow && !isPumpOn) {
                // Đất khô -> Bật bơm
                int autoSpeed = (currentPumpSpeed < 100) ? 200 : currentPumpSpeed;
                setPumpSpeed(autoSpeed);
                Serial.println("🤖 AUTO: Đất khô -> BẬT BƠM");
            } 
            else if (soilHumi > soilMoistureThresholdHigh && isPumpOn) {
                // Đất ẩm -> Tắt bơm
                setPumpSpeed(0);
                Serial.println("🤖 AUTO: Đất đủ ẩm -> TẮT BƠM");
            }
        }

        // ============ GỬI JSON LÊN SERVER (QUAN TRỌNG) ============
        char payload[300];
snprintf(payload, sizeof(payload),
    "{\"temp\":%.1f,\"humi\":%.1f,\"soilHumi\":%.1f,\"lightVal\":%d,\"lightPercentage\":%d,\"mode\":\"%s\"}",
    t, h, soilHumi, lightVal, lightPercentage, modeNames[currentMode]);


        client.publish(mqtt_sensor_topic, payload);
        
        Serial.printf("📤 Gửi: %s\n", payload);
    }
}