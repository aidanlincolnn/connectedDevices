/*
Aidan Lincoln Fowler
Connected Devices
Infinite Content Gif Server - sends list of available gif names and lets users download by file name
Requires an authentication key for all requests which is stored in the known clients list and internally on the raspberry pi
*/

var LineByLineReader = require('line-by-line');
var assets = require('./assets');

const express = require("express");
const app = express();

app.use("/assets", assets);
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// an array to hold the ids of valid clients
let knownClients = new Array();
loadKnownClients();

//if this was a real app there would be a database and we wouldn't load every client into memory
function loadKnownClients(){
  lr = new LineByLineReader('.data/knownClients.txt');
  lr.on('error', function (err) {
    console.log('error loading client list');
  });
  lr.on('line', function (line) {
    line = line.replace(/(\r\n|\n|\r)/gm, "");
    console.log('reading client '+line);
    knownClients.push(line);
  });
  lr.on('end', function () {
    console.log("done loading known clients");
  });
}

//checks that body contains uid which matches someone in the known clients list
function authenticate (request){
  let authenticationTest = request.body;
  if (authenticationTest && knownClients.includes(authenticationTest.uid)) {
      return true;
  }
  return false;
}

function setRequestImageType(request){
  request.authenticationKey = process.env.SECRET;
  if(request.body.downloadType && request.body.downloadType == 'thumbnail'){
    request.imageType = 'thumbnail';
  }
  else{
    request.imageType = 'gif';
  }
}

//sends a rejection response
function reject(response){
  response.json({ status: "rejected" });
  response.end();
}

//return array of gif file names available for download
app.post('/fileList',(request, response) => {
  if(authenticate(request)){
    console.log('file list');
    sendFileList(response);
  }
  else{
    console.log(request.body);
    console.log('rejected');
    reject(response);
  }
});

//loads gif names from data/gifs.txt
function sendFileList(response){
  let availableGifs = new Array();
  lr = new LineByLineReader('.data/gifs.txt');
  lr.on('error', function (err) {
    console.log('error');
  });
  lr.on('line', function (line) {
    console.log('reading ilne');
    line = line.replace(/(\r\n|\n|\r)/gm, "");
    console.log(line);
    availableGifs.push(line);
  });
  lr.on('end', function () {
    console.log('end');
    console.log("sending gif names:"+availableGifs);
    response.send(availableGifs);
  });
}

app.post("/download/:gifName", downloadGif)

//routes asset download request through authentication then to assets.js 
//we set a secret key as part of the request so you cant just hit the /assets endpoint if you know the file name
function downloadGif (request,response){
  console.log(request);
  if(authenticate(request)){
    setRequestImageType(request);
    
    console.log('trying to download and send gif / thumbnail: '+request.params.gifName);
    request.url = '/assets/'+request.params.gifName;
    return app._router.handle(request, response);
  }
  else{
    console.log('rejected');
    reject(response);
  }
};

// listen for requests :)
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


