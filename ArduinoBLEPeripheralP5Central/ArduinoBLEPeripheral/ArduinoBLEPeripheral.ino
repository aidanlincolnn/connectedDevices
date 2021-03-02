#include "ArduinoBLE.h"
 
BLEService ledService("19B10000-E8F2-537E-4F6C-D104768A1214"); // BLE LED Service
 
// BLE LED Switch Characteristic - custom 128-bit UUID, read and writable by central
BLEByteCharacteristic switchCharacteristic("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite);
 
const int ledPin = LED_BUILTIN; // pin to use for the LED

void setup() {
  // initialize serial and wait for serial monitor to be opened:
  Serial.begin(9600);
  while (!Serial);
 
  // set LED pin to output mode:
  pinMode(ledPin, OUTPUT);
 
  // begin initialization:
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (true);
  }
 
  // set advertised local name and service UUID:
  BLE.setLocalName("LED");
  BLE.setAdvertisedService(ledService);
 
  // add the characteristic to the service
  ledService.addCharacteristic(switchCharacteristic);
 
  // add service:
  BLE.addService(ledService);
 
  // set the initial value for the characteristic:
  switchCharacteristic.writeValue(0);
 
  // start advertising
  BLE.advertise();
 
  Serial.println("BLE LED Peripheral");
}

void loop() {
  // listen for BLE peripherals to connect:
  BLEDevice central = BLE.central();
 
  // if a central is connected:
  if (central) {
    Serial.print("Connected to central: ");
    // print the central's MAC address:
    Serial.println(central.address());
 
    // while the central is still connected to peripheral:
    while (central.connected()) {
      // if the central device wrote to the characteristic,
      // use the value to control the LED:
      if (switchCharacteristic.written()) {
        if (switchCharacteristic.value()) {   // any value other than 0
          Serial.println("LED on");
          digitalWrite(ledPin, HIGH);         // will turn the LED on
        } else {                              // a 0 value
          Serial.println("LED off");
          digitalWrite(ledPin, LOW);          // will turn the LED off
        }
      }
    }
 
    // when the central disconnects, print it out:
    Serial.print("Disconnected from central: ");
    Serial.println(central.address());
  }
}
