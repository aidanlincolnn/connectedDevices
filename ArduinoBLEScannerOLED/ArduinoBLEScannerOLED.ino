/*
 * Aidan Lincoln Fowler
 * Connected Devices Bluetooth Scanner
 */
#include <ArduinoBLE.h>
#include <Adafruit_SSD1306.h>
#include<Fonts/FreeSans9pt7b.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET    0  // Reset pin for display (0 or -1 if no reset pin)

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

BLEDevice devicesWithNames[10]; 
boolean scanning = false;
int counter = 0;
int deviceIndex = 0;

void setup() {
  Serial.begin(9600);
  pinMode(A0,INPUT_PULLUP); //button
  pinMode(A1,INPUT); //joystick x
  pinMode(A6,INPUT); //joystick y
  pinMode(A7,OUTPUT); //joystick power
  digitalWrite(A7,HIGH); //turn on power
  // when reading serial input set a 10ms timeout:
  Serial.setTimeout(10);
  // wait 3 sec. for serial monitor to open:
  while (!Serial) delay(3000);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {  //turn on display
    Serial.println("Display setup failed");
    while (true);
  }
  // set fonts botforh display:
  display.setFont(&FreeSans9pt7b);
  Serial.println("Display is good to go");
  display.setRotation(2);
  
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1);
  }

  Serial.println("BLE Started");
  updateDisplay("Click To Scan");
}

void loop(){
  int x = analogRead(A1);
  delay(1);
  int y = analogRead(A6);
  x = map(x, 0, 1023, 0, 3) - 1;
  y = map(y, 0, 1023, 0, 3) -1;

  //Right and left on joystick cycle through ble device names
  if((x == 1 || x == -1) && counter != 0){
    if(x == 1){
      deviceIndex += 1;
    }
    if(x == -1){
      deviceIndex -= 1;
    }
    if(deviceIndex < 1){
      deviceIndex = 1;
    }
    else if (deviceIndex > counter){
      deviceIndex = counter;
    }
    Serial.println(deviceIndex-1);
    printDeviceName(devicesWithNames[deviceIndex-1]);
    delay(500);
  }

  //down arrow shows UUID
  if(y == -1 && counter != 0){
    Serial.println("here");
    printDeviceUUID(devicesWithNames[deviceIndex-1]);
    delay(500);
  }
  
  int button = !digitalRead(A0);  
  //if button is clicked, start / stop scanning for BLE devices
  if(button){
    delay(500);
    if(scanning){
      Serial.println("Stop Scanning");
      Serial.print("Found ");
      Serial.print(counter);
      Serial.println(" devices");
      scanning = false;
      updateDisplay("Done Scanning");
      BLE.stopScan();
      delay(1000);
      updateDisplay("right arrow to see ble names, down for UUID");
    }
    else{
      scanning = true;
      memset(devicesWithNames, 0, sizeof(devicesWithNames));
      Serial.println("Scanning");
      updateDisplay("Scanning");
      BLE.scan();
    }
  }
  //only look for up to 10 named ble devices 
  if(counter < 10){
    BLEDevice peripheral = BLE.available();
    if (peripheral) {
      //only save devices that are named because there are a million unnambed ble devices 
      if(peripheral.hasLocalName()){
        Serial.println("found ble device with name");
        devicesWithNames[counter] = peripheral;
        counter++;
      }
    }
  }
}

//show text on display (Wrapped)
void updateDisplay(String text){
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 12);
  display.print(text);
  display.display();
}

//show BLE device name
void printDeviceName(BLEDevice device){
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 12);
  display.print("Name: ");
  display.print(device.localName());
  display.display();
}

//show ble device UUID
void printDeviceUUID(BLEDevice device){
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 12);
  display.print("UUID: ");
  display.print(device.advertisedServiceUuid(0));
  display.display();
}
