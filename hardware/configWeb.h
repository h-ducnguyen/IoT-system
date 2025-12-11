#ifndef CONFIG_WEB_H
#define CONFIG_WEB_H

#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

Preferences prefWeb;
WebServer server(80);

// ===========================================================
// HÀM LƯU WIFI
// ===========================================================
void saveWifiConfig(String ssid, String pass) {
    prefWeb.begin("wifi", false);
    prefWeb.putString("ssid", ssid);
    prefWeb.putString("password", pass);
    prefWeb.end();

    Serial.println("💾 Đã lưu WiFi:");
    Serial.println(" - SSID: " + ssid);
    Serial.println(" - PASS: " + pass);
}

// ===========================================================
// HÀM ĐỌC WIFI
// ===========================================================
void getSavedWifi(String &ssid, String &pass) {
    prefWeb.begin("wifi", true);
    ssid = prefWeb.getString("ssid", "");
    pass = prefWeb.getString("password", "");
    prefWeb.end();
}

// ===========================================================
// HÀM LƯU MQTT
// ===========================================================
void saveMQTTConfig(String ip, String port, String user, String pass) {
    prefWeb.begin("mqtt", false);
    prefWeb.putString("ip", ip);
    prefWeb.putString("port", port);
    prefWeb.putString("user", user);
    prefWeb.putString("pass", pass);
    prefWeb.end();

    Serial.println("💾 Đã lưu MQTT:");
    Serial.println(" - IP: " + ip);
    Serial.println(" - PORT: " + port);
    Serial.println(" - USER: " + user);
    Serial.println(" - PASS: " + pass);
}

// ===========================================================
// ĐỌC MQTT
// ===========================================================
void getSavedMQTT(String &ip, String &port, String &user, String &pass) {
    prefWeb.begin("mqtt", true);
    ip   = prefWeb.getString("ip", "");
    port = prefWeb.getString("port", "1883");
    user = prefWeb.getString("user", "");
    pass = prefWeb.getString("pass", "");
    prefWeb.end();
}

// ===========================================================
// XÓA TOÀN BỘ CẤU HÌNH (WiFi + MQTT)
// ===========================================================
void resetAllConfig() {
    prefWeb.begin("wifi", false); prefWeb.clear(); prefWeb.end();
    prefWeb.begin("mqtt", false); prefWeb.clear(); prefWeb.end();
    Serial.println("🗑️ Đã xóa toàn bộ cấu hình WiFi và MQTT!");
}

// ===========================================================
// TRANG WEB CẤU HÌNH
// ===========================================================
String buildConfigPage() {
  String page = R"rawliteral(
<!DOCTYPE html>
<html lang='vi'>
<head>
<meta charset='UTF-8'>
<title>Hệ thống tưới tiêu - cấu hình</title>
<style>
  body { font-family: Arial; background:#e0f7f1; margin:0; padding:0; }
  .container { width:90%; max-width:600px; margin:30px auto; background:#fff; padding:25px; border-radius:12px; box-shadow:0 0 12px #7fcfc0; }
  h2 { text-align:center; color:#2c7a5e; }
  .box { background:#d1f0e0; padding:15px; border-radius:8px; margin-bottom:20px; border-left:6px solid #2c7a5e; color:#145c44; }
  .tabs { display:flex; margin-top:20px; }
  .tab { flex:1; padding:12px; text-align:center; background:#a8e6cf; cursor:pointer; font-weight:bold; color:#064635; border-radius:5px 5px 0 0; }
  .tab.active { background:#2c7a5e; color:white; }
  .form { display:none; margin-top:20px; }
  .form.active { display:block; }
  input { width:100%; padding:10px; margin:8px 0; border:1px solid #aaa; border-radius:5px; }
  button { width:100%; padding:12px; background:#2c7a5e; color:white; border:none; border-radius:5px; font-size:16px; cursor:pointer; }
  button:hover { background:#145c44; }
</style>
<script>
function showTab(tab) {
    document.getElementById("wifiTab").classList.remove("active");
    document.getElementById("mqttTab").classList.remove("active");
    document.getElementById("wifiForm").classList.remove("active");
    document.getElementById("mqttForm").classList.remove("active");
    document.getElementById(tab+"Tab").classList.add("active");
    document.getElementById(tab+"Form").classList.add("active");
}
function saveWifi() {
    var ssid=document.getElementById('ssid').value;
    var pass=document.getElementById('pass').value;
    fetch(`/save_wifi?ssid=${ssid}&pass=${pass}`).then(()=>alert('✅ WiFi saved'));
}
function saveMQTT() {
    var ip=document.getElementById('mqtt_ip').value;
    var port=document.getElementById('mqtt_port').value;
    var user=document.getElementById('mqtt_user').value;
    var pass=document.getElementById('mqtt_pass').value;
    fetch(`/save_mqtt?ip=${ip}&port=${port}&user=${user}&pass=${pass}`).then(()=>alert('✅ MQTT saved'));
}
</script>
</head>
<body>
<div class='container'>
<h2>Hệ thống tưới tiêu - cấu hình</h2>
<div class='box'>
  <b>Chế độ cấu hình</b><br>
  WIFI AP: <b>NgHDuc_ESP32Conf</b><br>
  Truy cập: <b>http://192.168.4.1</b>
</div>
<div class='tabs'>
  <div id='wifiTab' class='tab active' onclick="showTab('wifi')">WiFi</div>
  <div id='mqttTab' class='tab' onclick="showTab('mqtt')">MQTT</div>
</div>
<div id='wifiForm' class='form active'>
  SSID:<input type='text' id='ssid'><br>
  Password:<input type='password' id='pass'><br>
  <button onclick='saveWifi()'>Lưu WiFi</button>
</div>
<div id='mqttForm' class='form'>
  Broker IP:<input type='text' id='mqtt_ip'><br>
  Port:<input type='number' id='mqtt_port'><br>
  Username:<input type='text' id='mqtt_user'><br>
  Password:<input type='password' id='mqtt_pass'><br>
  <button onclick='saveMQTT()'>Lưu MQTT</button>
</div>
</div>
</body>
</html>
)rawliteral";
  return page;
}

// ===========================================================
// KHỞI TẠO WEB SERVER
// ===========================================================
void startConfigAP() {
    WiFi.mode(WIFI_AP);
    WiFi.softAP("ESP32_Conf", "12345678");

    Serial.println("🌐 AP Mode ON: ESP32_Conf");
    Serial.print("IP: ");
    Serial.println(WiFi.softAPIP());

    server.on("/", []() { server.send(200, "text/html", buildConfigPage()); });

    server.on("/save_wifi", HTTP_GET, []() {
        saveWifiConfig(server.arg("ssid"), server.arg("pass"));
        server.send(200, "text/html",
            "<h3>✅ Đã lưu WiFi! Tiếp tục cấu hình MQTT.</h3><a href='/'>Quay lại</a>");
    });

    server.on("/save_mqtt", HTTP_GET, []() {
        saveMQTTConfig(server.arg("ip"), server.arg("port"),
                       server.arg("user"), server.arg("pass"));
        server.send(200, "text/html", "<h3>✅ Đã lưu MQTT! ESP32 sẽ khởi động lại...</h3>");
        delay(1000);
        ESP.restart();
    });

    server.begin();
    Serial.println("HTTP Server Started!");
}

void handleWebServer() {
    server.handleClient();
}

#endif
