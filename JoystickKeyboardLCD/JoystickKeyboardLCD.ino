/*
 * Aidan Fowler
 * Connected Devices, boilerplate code from Tom Igoe
 * Read Joystick, send as keyboard action, print to lcd display
*/
#include <Keyboard.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include<Fonts/FreeSans9pt7b.h>

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET    0  // Reset pin for display (0 or -1 if no reset pin)

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

volatile bool HIDEnabled = false;
int loopCount = 10;

void setup() {
  Serial.begin(9600);
  pinMode(A0,INPUT_PULLUP); //button
  pinMode(A1,INPUT); //joystick x
  pinMode(A6,INPUT); //joystick y
  pinMode(A7,OUTPUT); //joystick power
  digitalWrite(A7,HIGH); //turn on power
  if (!Serial) delay(3000);
  // I2C address is 0x3C, or 3D for some 128x64 modules: 
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {  //turn on display
    Serial.println("Display setup failed");
    while (true);
  }
    // set fonts botforh display:
  display.setFont(&FreeSans9pt7b);
  Serial.println("Display is good to go");
  display.setRotation(2);
}

void loop() {
    int x = analogRead(A1);
    delay(1);
    int y = analogRead(A6);
    int button = !digitalRead(A0);
    x = map(x, 0, 1023, 0, 3) - 1;
    y = map(y, 0, 1023, 0, 3) -1;
    //dont waste resources updating the display every loop
    if(loopCount % 50 == 0 || button == 1){
      updateDisplay(x,y,button);
    }
    loopCount ++;
    if (HIDEnabled) {
      if(x==1){
        Keyboard.press(KEY_RIGHT_ARROW); 
      }
      else if(x==-1){
        Keyboard.press(KEY_LEFT_ARROW);
      }
      else if(x==0){
        Keyboard.release(KEY_RIGHT_ARROW);
        Keyboard.release(KEY_LEFT_ARROW);
      }
      if(y==1){
        Keyboard.press(KEY_UP_ARROW);
      }
      if(y==-1){
        Keyboard.press(KEY_DOWN_ARROW);
      }
      else if(y==0){
        Keyboard.release(KEY_UP_ARROW);
        Keyboard.release(KEY_DOWN_ARROW);
      }
    }
    if(button == 1){
      HIDChange();
      delay(1000);
    }
}

void updateDisplay(int x, int y, int button){
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 12);
  display.print("X: ");
  display.print(x);
  display.setCursor(50, 12);
  display.print("Y: ");
  display.print(y);
  display.setCursor(0, 32);
  display.print("Button: ");
  if(button == 0){
    display.print("OFF");
  }
  else{
    display.print("Clicked");
  }
  display.setCursor(0,52);
  display.print("HID: ");
  if(HIDEnabled){
    display.print("ON");
  }
  else{
    display.print("OFF");
  }
  display.display();
}

void HIDChange() {
  HIDEnabled = !HIDEnabled;
  if (HIDEnabled) {
    Keyboard.begin();
  } else {
    Keyboard.end();
  }
}
