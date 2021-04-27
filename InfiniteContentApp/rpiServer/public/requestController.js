/*
	Aidan Lincoln Fowler
	Connected Devices Final Project & Thesis
	Express server for infinite content that allows for local playback of gifs on led screens as well as ability to download new gifs from a glitch server (need to run the server since not paying for pro)
*/
function setup() {
    httpGet('/loadLocalFiles',displayLocalFiles);
}

//dynamic list of gifs that are stored locally with a preview button to play gif on browser, a play button and stop button for the mirror
function displayLocalFiles(response){
    var gifNameList= document.getElementById("localGifs");
    var obj = JSON.parse(response);
    for(i=0; i<obj.gifList.length;i++){
        var gifName = obj.gifList[i];
        var thumbnail = gifName.replace('.gif','-thumbnail.png');
        gifNameList.innerHTML += "<li style='margin-bottom: 20px' id='"+gifName+"'>" + gifName
        +"  <button class='button'  id='"+gifName+"player'  style='' type='button' onclick=\"previewGif('"+gifName+"')\">Preview</button>"	
        +"  <button class='button'  id='"+gifName+"playerLed'  style='' type='button' onclick=\"playGif('"+gifName+"')\">Play</button>"	
        +"  <button class='button'  id='"+gifName+"playerLedStop'  style='' type='button' onclick=\"stopGif('"+gifName+"')\">Stop</button>"	
        +"  <div id='"+gifName+"playMessage'  style='display:none'>Loading Gif For Playback</div>"
        +"<br/><img id='"+gifName+"viewer' src='/content/"+thumbnail+"' />"+ "</li>" ;
    }
}

//download list of available gifs from glitch
//todo load the thumbnails in this call after crosschecking with local list of files 
function downloadFileList(response){
    httpGet('/glitch/filelist', displayFileList);
}

//dynamicly populate a list of gifs that are available to download 
//todo move most of this into the show available content button move download gif callout
function displayFileList(response){
    var obj = JSON.parse(response);
    var gifNameList= document.getElementById("gifNames");
    gifNameList.innerHTML = "";
    if(obj.result.length >0){
        for(i=0;i<obj.result.length;i++){
            gifNameList.innerHTML += "<li style='margin-bottom: 20px' id='"+obj.result[i]+"'>" + obj.result[i] 
                +"  <button class='button' id='"+obj.result[i]+"downloader'  style=''  type='button' onclick=\"downloadGif('"+obj.result[i]+"')\">Download</button>"
                +"  <button class='button'  id='"+obj.result[i]+"player'  style='display:none' type='button' onclick=\"previewGif('"+obj.result[i]+"')\">Preview</button>"
                +"  <button class='button'  id='"+obj.result[i]+"playerLed'  style='display:none' type='button' onclick=\"playGif('"+obj.result[i]+"')\">Play</button>"
                +"  <button class='button'  id='"+obj.result[i]+"playerLedStop'  style='display:none' type='button' onclick=\"stopGif('"+obj.result[i]+"')\">Stop</button>"	
                +"  <div id='"+obj.result[i]+"playMessage'  style='display:none'>Loading Gif For Playback</div>"
                +"<br/><img id='"+obj.result[i]+"viewer' src='' />"+ "</li>" ;
        }
    }
    else{
        var noContent = document.getElementById('noContent');
        noContent.style.display="";
    }
    var showContentButton = document.getElementById('showContent');
    showContentButton.style.display="none";
}

//download specifc gif
function downloadGif(gifName){
    httpGet('/glitch/downloadGif/'+gifName, displayGif);
}

//make the relevant buttons visible
function displayGif(response){
    var obj = JSON.parse(response);
    var gifId = document.getElementById(obj.gifName+'viewer');
    gifId.src=obj.filePath;
    var playButton = document.getElementById(obj.gifName+'player');
    playButton.style.display="";
    var playLEDButton = document.getElementById(obj.gifName+'playerLed');
    playLEDButton.style.display="";
    var playLEDButton = document.getElementById(obj.gifName+'playerLedStop');
    playLEDButton.style.display="";
    var downloadButton = document.getElementById(obj.gifName+'downloader');
    downloadButton.style.display="none";
}

//play gif locally
function previewGif(gifName){
    var gifId = document.getElementById(gifName+'viewer');
    var myanim = new Image();
    gifId.src = gifId.src.replace('-thumbnail.png','.gif');
    myanim.src = gifId.src;
    myanim.onload = function() {
        document.getElementById(gifName+'viewer').src = myanim.src;
    };
}

function playGif(gifName){
    httpGet('/playGif/'+gifName, showLoadingMessage);
}

function stopGif(gifName){
    var playMessage = document.getElementById(gifName+'playMessage');
    playMessage.style.display="none";
    httpGet('/stopGif/'+gifName);
}
//message that the gif is loading 
//try to figure out if there is some way to see if the gif script has run 
//so the message can be removed
//not so sure its possible bc it is running and then loading the gif into memory
function showLoadingMessage(response){
    var obj = JSON.parse(response);
    var playMessage = document.getElementById(obj.gifName+'playMessage');
    playMessage.style.display="";
}