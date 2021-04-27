/*
	Aidan Lincoln Fowler
	Connected Devices Final Project & Thesis
	Express server for infinite content that allows for local playback of gifs on led screens as well as ability to download new gifs from a glitch server (need to run the server since not paying for pro)
*/
var fs = require('fs'); //file system read write
var fetch = require('node-fetch');//http requests
var interfaces = require('os').networkInterfaces();//access ip information for display to user on screens
var kill  = require('tree-kill');//os level kill for pythons script for led screen player
var spawn = require('child_process').spawn//os level spawn for running bash programs command line
var express = require('express');// include express.js
var server = express();	// a local instance of express
var textProgram;//scroll text program python 
var gifPlayer;//led image viewer script
var gifList = [];//store local file names to manage which are shown as available to download

//called when server.listen is called when program runs 
function serverStart() {
  var port = this.address().port;
  var addresses = [];
	for (var k in interfaces) {
		for (var k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			if (address.family === 'IPv4' && address.address !== '127.0.0.1' && !address.internal){
				addresses.push(address.address);
			}
		}
	}
	console.log("Ip:",addresses[0]);
	console.log("Port:",port);
	console.log("Scrolling IP Address")
	textProgram = spawn("python3",["/home/aidan/nodeServer/textScroller.py","Go to "+addresses[0]+":"+port]);             
	textProgram.on('error', (error) => {
		console.log(`error: ${error.message}`);
	});

	textProgram.on("close", code => {
		console.log('IP Scroller Closed');
	});
}

//get available gif names from glitch database
function getFileList(req,res){
	let requestPath = "https://infinitecontent.glitch.me/fileList/";
	const params = new URLSearchParams();
	//todo store this on pi and grab it to authenticate
	params.append('uid', '0123FAF16D37AF36EE');

	fetch(requestPath, {
		method: 'POST',
		body:params,
		
	}).then( async function (res2){
		const data = await res2.json();
		let cleanedData = [];
		for(i = 0; i< data.length; i++){
			//only show files that aren't already downloaded to the pi
			if(!gifList.includes(data[i])){
				cleanedData.push(data[i]);
			}
		}
		res.status(200).json({result: cleanedData}).end();
	},(error) => {
		onsole.log(error);
	});
}

//download gif thumbnail, send file path back to UI, then download gif locally
function downloadGif(req,res){
	let file = req.params.gifName;
	let thumbnail = file.replace('.gif','-thumbnail.png');
	let filePath = "/home/aidan/nodeServer/content/"+file;
	let thumbNailPath = "/home/aidan/nodeServer/content/"+thumbnail;
	const gifStream = fs.createWriteStream(filePath);
	const thumbStream = fs.createWriteStream(thumbNailPath);
 
	let requestPath = "https://infinitecontent.glitch.me/download/"+req.params.gifName;
	let params = {
		uid: '0123FAF16D37AF36EE',
		downloadType: 'thumbnail',
	};

	fetch(requestPath, {
		method: 'POST',
		body:JSON.stringify(params),
		headers: { 'Content-Type': 'application/json' }
	}).then( function (thumbnailResponse){
		thumbnailResponse.body.pipe(thumbStream);
		res.status(200).json({gifName: req.params.gifName, filePath: '/content/'+thumbnail}).end();
		
		params.downloadType = 'gif';
		
		fetch(requestPath, {
			method: 'POST',
			body:JSON.stringify(params),
			headers: { 'Content-Type': 'application/json' }
		}).then( function (gifResponse){
			gifResponse.body.pipe(gifStream);
		},(error)=>{
			console.log(error);
		});
	},(error) => {
		console.log(error);
	});
}

function loadLocalGifs(req,res){
	//this function gets called when the page loads and kills the text telling you to navigate to the page 
	//for some reason it seems to stop playing after 15 minutes
	if(textProgram.pid != null){
		kill(textProgram.pid);
	}

	gifList = [];
	const contentFolder = '/home/aidan/nodeServer/content/';

	//todo learn how to handle errors properly 
	fs.readdir(contentFolder, (err, files) => {
		files.forEach(file => {
			if(file.includes('.gif')){
				gifList.push(file);
			}
		});
		res.status(200).json({gifList: gifList}).end();
	});
}

//calls hzeller led image viewer for gif playback on led matrices through bash script 
function playGif(req,res){
	//shutoff any gif that is already playing 
	stopGif();
	console.log(req.params.gifName);
	gifPlayer = spawn("sudo",["bash", "/home/aidan/nodeServer/playGifLocal.sh","/home/aidan/nodeServer/content/"+req.params.gifName]);             
	gifPlayer.on('error', (error) => {
		console.log(`error: ${error.message}`);
	});

	gifPlayer.on("close", code => {
		console.log('gif player closed in play gif'); 
	});
	res.status(200).json({gifName: req.params.gifName, message: "loading gif"}).end();
}

//stop any gif that is playing
async function stopGif(){
	console.log('stop gif called');
	if(gifPlayer &&  gifPlayer.pid != null){
		kill(gifPlayer.pid);
	}
	await new Promise(r => setTimeout(r, 2000));
}

//serve up public folder with index.html
server.use(express.static("public"));
//where the gifs and thumbnails are saved
server.use('/content',express.static("content"));
//show gifs on the rpi
server.get('/loadLocalFiles', loadLocalGifs);
server.get('/playGif/:gifName',playGif);
server.get('/stopGif/:gifName',stopGif);

let glitch = express.Router();
server.use('/glitch',glitch);
//check cloud server for available files 
glitch.get('/fileList',getFileList);
//download a spefici gif
glitch.get('/downloadGif/:gifName', downloadGif)
//start server
server.listen(process.env.PORT || 5555, serverStart);

