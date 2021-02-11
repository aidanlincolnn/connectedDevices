/*
  Generates QR code for current url to pass to phone. Uses 
  https://github.com/kazuhikoarase/qrcode-generator
  as the QR Code generator library. It's hosted at this CDN:
  https://unpkg.com/qrcode-generator@1.4.4/qrcode.js
  created 11 Feb 2021
  Aidan Fowler
  boilerplate code from Tom Igoe
*/

function setQrCode() {
    // get the div element for the QR code image:
    let qrDiv = document.getElementById('qrCode');
    // set qr code to current url
    let url = window.location.href;
    // make the QR code:
    let qr = qrcode(0, 'L');
    console.log('url:'+url);
    qr.addData(url);
    qr.make();
    // create an image from it:
    let qrImg = qr.createImgTag(4, 8, "qr code of " + url);
    // add it to the div:
    qrDiv.innerHTML = qrImg;
  }

  // add a listener for the page to load:
window.addEventListener('DOMContentLoaded', setQrCode);