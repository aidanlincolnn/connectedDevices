let body;
let lastButtonState = 0;
let lastXState=0;
let lastYState=0;


function setup(event){
    serial = new p5.SerialPort();
    serial.on('list',printList);
    serial.on('data',serialEvent);
    serial.list();
}

function printList(portList){
    portSelector = document.getElementById('portSelector');
    // portList is an array of serial port names
    for (var i = 0; i < portList.length; i++) {
        // add this port name to the select object:
        var option = document.createElement("option");
        option.text = portList[i];
        portSelector.add(option);
    }
    // set an event listener for when the port is changed:
    portSelector.addEventListener('change', openPort);
}
function openPort() {
    let item = portSelector.value;
    // if there's a port open, close it:
    if (serial.serialport != null) {
      serial.close();
    }
    // open the new port:
    serial.open(item);
  }
  
  
  function serialEvent() {
    // read a line of incoming data:
    var inData = serial.readLine();
    // if the line is not empty, parse it to JSON:
    if (inData) {
        var sensors = JSON.parse(inData);
        if (sensors.button !== lastButtonState) {
            if (sensors.button === 1) {
                changeColor();
                lastButtonState = 1;
            }
            else{
                lastButtonState = 0;
            }
        }

            lastXState = sensors.joyX;
            if(sensors.joyX != 0){
                movePacX(sensors.joyX);
            }



            lastYState = sensors.joyY;
            if(sensors.joyY != 0){
                movePacY(sensors.joyY);
            }
      
    }
  }
  
  function movePacX(xVal){
      console.log("move x");
      const element = document.getElementById("pacManZone");
      const style = getComputedStyle(element).left;
      let left = parseInt(style,10);
      if(xVal === -1){
          left -= 1;
      }
      if(xVal === 1){
        left += 1;
      }
      if(left < 10){
        left = 10;
      }
      if(left > 700){
          left = 700;
      }
      let newLeft = left +'px';
      element.style.left = newLeft;
  }

  function movePacY(yVal){
      console.log("moveY");
      const element = document.getElementById("pacManZone");
      const style = getComputedStyle(element).top;
      let top = parseInt(style,10);
      if(yVal === 1){
        top -= 1;
      }
      if(yVal === -1){
        top += 1;
      }
      if(top < 30){
        top = 30;
      }
      if(top > 700){
        top = 700;
      }
      let newTop = top +'px';
      element.style.top = newTop;
}

  function changeColor(){
    console.log("change color");
    let a = getRandomInt(255);
    let b = getRandomInt(255);
    let c = getRandomInt(255);
    document.body.style.backgroundColor = 'rgb(' + a + ',' + b + ',' + c + ')';
  }

  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  
  // add a listener for the page to load:
  window.addEventListener('DOMContentLoaded', setup);