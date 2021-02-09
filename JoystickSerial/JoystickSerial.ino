/*
 * Aidan Fowler
 * Connected Devices, boilerplate code from Tom Igoe
 * Read Joystick, package as json, send serial
*/
#include <Arduino_JSON.h>
JSONVar outboundInfo;
 
void setup() {
  Serial.begin(9600);
  pinMode(A0,INPUT_PULLUP);
  pinMode(A1,INPUT);
  pinMode(A2,INPUT);
  pinMode(A3,OUTPUT);
  digitalWrite(A3,HIGH);
  outboundInfo["button"]=0;
  outboundInfo["joyX"]=0;
  outboundInfo["joyY"]=0;
}

void loop() {
  int x = analogRead(A1);
  delay(1);
  int y = analogRead(A2);
  int button = !digitalRead(A0);
  x = map(x, 0, 1023, 0, 3) - 1;
  y = map(y, 0, 1023, 0, 3) -1;
  
  outboundInfo["button"]=button;
  outboundInfo["joyX"]=x;
  outboundInfo["joyY"]=y;
  Serial.println(outboundInfo);
  delay(10);
  
}
