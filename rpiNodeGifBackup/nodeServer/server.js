/*
	Express server for infinite content that will eventually let people download gifs, select a gif to play, to the rpi from aws / glitch
*/
var fs = require('fs');
var fetch = require('node-fetch');
var path = require('path');
var express = require('express');// include express.js
var server = express();	// a local instance of it

var interfaces = require('os').networkInterfaces();//access ip information for display for user on screens
var kill  = require('tree-kill');//os level kill for pythons script for screen text
var spawn = require('child_process').spawn//os level spawn for running text
var textProgram

//let downloader = express.Router();
//server.use('/download',downloader);
//const awsWorker = require('./app/controllers/s3.controller.js');

let glitch = express.Router();
server.use('/glitch',glitch);
server.use(express.static("public"));
server.use('/content',express.static("content"));
//seems to be the same result with the below line (gif freezes first time through)
//server.use('/content/',express.static(path.join(__dirname, "content")));

// this runs after the server successfully starts:
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
	console.log("IP:",addresses[0]);
	console.log("PORT:",port);

	textProgram = spawn("python3",["/home/aidan/nodeServer/textScroller.py","Go To "+addresses[0]+":"+port]);      
	textProgram.on('error', (error) => {
		console.log(`error: ${error.message}`);
	});

	textProgram.on("close", code => {
		console.log(`text scroller closed ${code}\n`);
	});
}

function getFileList(req,res){
	let requestPath = "https://infinitecontent.glitch.me/fileList/";
	const params = new URLSearchParams();
	params.append('uid', '0123FAF16D37AF36EE');

	console.log('retrieving file list: ',requestPath);
	fetch(requestPath, {
		method: 'POST',
		body:params,
		
	}).then( async function (res2){
		const data = await res2.json();
		console.log('file list retrieved');
		res.status(200).json({result: data}).send();
	},(error) => {
		console.log(error);
	});
}

async function downloadGif(req,res){
	let filePath = "/home/aidan/nodeServer/content/"+req.params.gifName;
	const fileStream = fs.createWriteStream(filePath);
	let requestPath = "https://infinitecontent.glitch.me/download/"+req.params.gifName;
	let auth = {
		uid: '0123FAF16D37AF36EE',
	};
	
	console.log('donwloading file: ',requestPath);
	fetch(requestPath, {
		method: 'POST',
		body:JSON.stringify(auth),
		headers: { 'Content-Type': 'application/json' }
	}).then( function (res2){
		res2.body.pipe(fileStream);
		console.log('gif downloaded');
		res.status(200).json({gifName: req.params.gifName, filePath: '/content/'+req.params.gifName}).send();
	},(error) => {
		console.log(error);
	});
}

// start the server:
server.listen(process.env.PORT || 5555, serverStart);
//downloader.get('/:filename',awsWorker.doDownload);
glitch.get('/fileList',getFileList);
glitch.get('/downloadGif/:gifName', downloadGif)
