/*Aidan Lincoln Fowler
  Connected Devices
  BLE Central which connects to rpi peripheral and gets wifi status / gives you ability to update wpa supplicant with your wifi router information
  Boilerplate from https://itp.nyu.edu/physcomp/labs/lab-bluetooth-le-and-p5-ble/
*/

const serviceUuid = "12634d99-d598-4874-8e86-7d042ee07ba7";
let wifiStatus;
let wifiName;
let wifiPassword;
let updateAndReboot;

let myBLE;

function setup() {
  myBLE = new p5ble();
}

function connectToBle() {
  // Connect to a device by passing the service UUID
  myBLE.connect(serviceUuid, gotCharacteristics);
}

function test(){
  document.getElementById("connected").removeAttribute("hidden");
  document.getElementById("p1").innerHTML = "Status: Connected!";
  document.getElementById("connectButton").style.display="none";
}

function gotCharacteristics(error, characteristics) {
  if (error) {
    console.log('error: ', error);
  }
  else{
    document.getElementById("connected").removeAttribute("hidden");
    document.getElementById("p1").innerHTML = "Bluetooth Status: Connected!";
    document.getElementById("p1").style.color="rgb(148, 255, 110)";
    document.getElementById("connectButton").style.display="none";
  }
  console.log('characteristics: ', characteristics);
  if(characteristics.length == 4){
    wifiStatus = characteristics[0];
    myBLE.read(wifiStatus);
    console.log('wifistatus after read:',wifiStatus)
    wifiName = characteristics[1];
    wifiPassword = characteristics[2];
    updateAndReboot = characteristics[3];
  }

}

function writeToWifiName() {
  var wifiName = document.getElementById("wifiName").value;
  myBLE.write(wifiName, wifiName);
}

function writeToWifiPassword() {
  var wifiPass = document.getElementById("wifiPass").value;
  myBLE.write(wifiPassword, wifiPass);
}

function saveAndReboot() {
  writeToWifiName()
  writeToWifiPassword()
  var reboot = '1';
  myBLE.write(wifiPassword, reboot);
}

// add a listener for the page to load:
window.addEventListener('DOMContentLoaded', setup);