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

let wifiStatusDisplay;

let myBLE;

function setup() {
  myBLE = new p5ble();
}

function connectToBle() {
  // Connect to a device by passing the service UUID
  myBLE.connect(serviceUuid, gotCharacteristics);
}

function gotCharacteristics(error, characteristics) {
  if (error) {
    console.log('error: ', error);
  }
  else if(myBLE.isConnected()){
    document.getElementById("connected").removeAttribute("hidden");
    document.getElementById("p1").innerHTML = "Bluetooth Status: Connected!";
    document.getElementById("p1").style.color="rgb(148, 255, 110)";
    document.getElementById("connectButton").style.display="none";
  
    if(characteristics.length == 4){
      wifiName = characteristics[0];
      wifiPassword = characteristics[1];
      updateAndReboot = characteristics[2];
      wifiStatus = characteristics[3];
      myBLE.read(wifiStatus,'string',gotWifiStatus);
      myBLE.read(wifiName,'string',gotValue);
      myBLE.read(wifiPassword,'string',gotValue);
      myBLE.read(updateAndReboot,'string',gotValue);
      
    }
    else{
      console.log('received an unexpected number of characteristics');
    }
  }

}

function gotValue(error, value) {
  if (error) {
    console.log('error: ', error);
  }
  else{
    console.log('characteristic value: ', value);
  }
}

function gotWifiStatus(error, value) {
  if (error) {
    console.log('error: ', error);
    wifiStatusDisplay = 'Error Retrieving Wifi Status'
  }
  else{
    console.log('wifi status: ', value);
    wifiStatusDisplay = value;
    if(wifiStatusDisplay == 'Connected'){
      document.getElementById("wifiNotConnected").style.display="none"
    }
    else{
      document.getElementById("wifiConnected").style.display="none"
    }
  }
}

function writeToWifiName() {
  var newWifiName = document.getElementById("wifiName").value;
  console.log('setting wifi name to',newWifiName);
  myBLE.write(wifiName, newWifiName);
}

function writeToWifiPassword() {
  var newWifiPass = document.getElementById("wifiPass").value;
  console.log('setting wifi pass to',newWifiPass);
  myBLE.write(wifiPassword, newWifiPass);
}

function saveAndReboot() {
  writeToWifiName()
  writeToWifiPassword()
  myBLE.write(updateAndReboot, "1");
}

// add a listener for the page to load:
window.addEventListener('DOMContentLoaded', setup);