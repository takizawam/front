URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording
var recvocal;
var guitar_filename;

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var functions = [
	startGuitarRecording,
	stopGuitarRecording,
	startVocalRecording,
	stopVocalRecording,
]
var cnt = 0;

// ボタンの要素を取得
var controls = document.getElementById("controls");
controls.addEventListener("click", function() {
		functions[cnt++ % functions.length]();
});

/////////////////////////////////////////////// startGuitarRecordingを定義 ///////////////////////////////////////////////
function startGuitarRecording() {
	console.log("recordGuitarButton clicked");

    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia()
	*/

	////////////////////////// CSS styleの変更 //////////////////////////
	document.getElementById("recStopText").innerHTML = "STOP";
	var element1 = document.getElementById('controls');
	element1.classList.remove("buttonRec");
	// console.log(element1);
	element1.classList.add("buttonStop");

	var element2 = document.getElementById('recStopText');
	element2.classList.remove("innerTextRec");
	element2.classList.add("innerTextStop");
	////////////////////////////////////////////////////////////////////

	//　これで音声録音許可され、開始される
	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		audioContext = new AudioContext();

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);
		/*
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	})
}

// /////////////////////////////////////////////// stopGuitarRecordingを定義 ///////////////////////////////////////////////

function stopGuitarRecording() {
	console.log("stopGuitarButton clicked");

	rec.stop();

	////////////////////////// CSS styleの変更 //////////////////////////
	document.getElementById("recStopText").innerHTML = "Recording<br>Vocal";
	var element1 = document.getElementById('controls');
	element1.classList.remove("buttonStop");
	// console.log(element1);
	element1.classList.add("buttonRec");

	var element2 = document.getElementById('recStopText');
	element2.classList.remove("innerTextStop");
	element2.classList.add("innerTextRec");
	////////////////////////////////////////////////////////////////////

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();
	//create the wav blob and pass it on to createDownloadLink

	// tomiyama created
	rec.exportWAV(saveToServer);
}

// /////////////////////////////////////////////// startVocalRecordingを定義 ///////////////////////////////////////////////
function startVocalRecording() {
	console.log("recordVocalButton clicked");

    var constraints = { audio: true, video:false }

		////////////////////////// CSS styleの変更 //////////////////////////
		document.getElementById("recStopText").innerHTML = "STOP";
		var element1 = document.getElementById('controls');
		element1.classList.remove("buttonRec");
		element1.classList.add("buttonStop");
		var element2 = document.getElementById('recStopText');
		element2.classList.remove("innerTextRec");
		element2.classList.add("innerTextStop");
		////////////////////////////////////////////////////////////////////

		//　これで音声録音許可され、開始される
	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		audioContext = new AudioContext();

		/*  assign to gumStream for later use  */
		gumStream = stream;

		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

			// Create the Recorder object and configure to record mono sound (1 channel)
			// Recording 2 channels  will double the file size

		recvocal = new Recorder(input,{numChannels:1})

		//start the recording process
		recvocal.record()
		//play guitar sound
		rec.exportWAV(playGuitarSound);

		console.log("Recording started");

	})
	// .catch(function(err) {
	// });
}

// /////////////////////////////////////////////// stopVocalRecordingを定義 ///////////////////////////////////////////////
function stopVocalRecording() {
	console.log("stopVocalButton clicked");
	// console.log(2);
	////////////////////////// CSS styleの変更 //////////////////////////
	document.getElementById("recStopText").innerHTML = "Loading...";
	var element1 = document.getElementById('controls');
	element1.classList.remove("buttonStop");
	element1.classList.add("buttonLoading");
	var element2 = document.getElementById('recStopText');
	element2.classList.remove("innerTextStop");
	element2.classList.add("innerTextLoading");
	////////////////////////////////////////////////////////////////////

	//tell the recorder to stop the recording
	recvocal.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	recvocal.exportWAV(createDownloadLink);

	// Added by Takizawa
	setTimeout(() => {
		document.getElementById("recStopText").innerHTML = "Complete";
		var element1 = document.getElementById('controls');
		element1.classList.remove("buttonStop");
		element1.classList.add("buttonLoading");
		var element2 = document.getElementById('recStopText');
		element2.classList.remove("innerTextStop");
		element2.classList.add("innerTextLoading");
  }, 5000)

	//To stop the button
	window.addEventListener('click', e => { e.stopImmediatePropagation(); }, true);
}

//////////////////////////////////////////////////////////// saveToServer ////////////////////////////////////////////////////////////

function saveToServer(blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var filename = new Date().toISOString();
	filename = filename.replace( ':', '-' ).replace( ':', '-' );

  var xhr=new XMLHttpRequest();
  xhr.onload=function(e) {
      if(this.readyState === 4) {
          console.log("Server returned: ",e.target.responseText);
      }
  };
  var fd=new FormData();
  fd.append("audio_data",blob, filename);

	xhr.open("POST","http://localhost/upload.php",true);
	xhr.send(fd);

	guitar_filename = filename;
}

//////////////////////////////////////////////////////////// playGuitarSound ////////////////////////////////////////////////////////////
function playGuitarSound(blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	// var li = document.createElement('li');
	// var link = document.createElement('a');

	au.controls = true;
	au.src = url;

	au.play();
}

//////////////////////////////////////////////////////////// createDownloadLink ////////////////////////////////////////////////////////////
function createDownloadLink(blob) {

	var url = URL.createObjectURL(blob);
	var au = document.createElement('audio');
	var li = document.createElement('li');
	var link = document.createElement('a');

	//name of .wav file to use during upload and download (without extendion)
	var vocal_filename = new Date().toISOString();
	vocal_filename = vocal_filename.replace( ':', '-' ).replace( ':', '-' );

	var downloadname = guitar_filename+".wav_"+vocal_filename+".wav";

	//add controls to the <audio> element
	au.controls = true;
	au.src = url;

	//save to disk link
	link.href = url;
	link.download = vocal_filename+".wav"; //download forces the browser to donwload the file using the  filename

	//the new audio elementをliに追加
	li.appendChild(au);

	//add the filename to the li
	// li.appendChild(document.createTextNode("hello"+".wav "))
	li.appendChild(document.createTextNode(downloadname+".wav "))

	//add the save to disk link to li
	li.appendChild(link);

	//upload link(wavファイルをXHRを用いてアップロードする)
	var upload = document.createElement('a');

  var xhr2=new XMLHttpRequest();
  xhr2.onload=function(e) {
      if(this.readyState === 4) {
          console.log("Server returned: ",e.target.responseText);
      }
  };
  var fd=new FormData();
  fd.append("audio_data",blob, vocal_filename);
	xhr2.open("POST","http://localhost/upload.php",true);
	xhr2.send(fd);

	var xhr3=new XMLHttpRequest();
	xhr3.onload=function(e) {
      if(this.readyState === 4) {
          console.log("Server returned: ",e.target.responseText);
      }
  };

	//Added by Takizawa
	// var downloadname = guitar_filename+".wav_"+vocal_filename+".wav";
	console.log(downloadname);

	xhr3.open("POST","http://localhost:5000/",true);
	// xhr3.send(guitar_filename+".wav_"+vocal_filename+".wav");
	xhr3.send(downloadname);

	li.appendChild(document.createTextNode (" "))//add a space in between
	li.appendChild(upload)//add the upload link to li
	// 【これは取っておこう】add the li element to the ol(vocalを下に挿入する)
	recordingsList.appendChild(li);
}
