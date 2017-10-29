#pragma strict

var n;

//Sound variables
var one: AudioSource;
var two: AudioSource;
var three: AudioSource;
var four: AudioSource;
var five: AudioSource;
var six: AudioSource;
var seven: AudioSource;
var eight: AudioSource;
var alarm: AudioSource;
var markerPositions: float[];
var letters: String[];
var nBackFilename = "NedeConfig/1-back.txt";
var audioFiles = [];
var currentLetter = 0;

function Start () {
	var resultNback = ReadInPointsForNback(nBackFilename);
	letters = resultNback[0];
	markerPositions = resultNback[1];
}

function Update () {

}


function getAudioObjectForFileName(objects: Component[], name: String) {
	for (var audioSource: AudioSource in objects) {
		if (audioSource.clip.name == name) {
			return audioSource;
		}
	}	
}

function initSounds(audioObjects) {
	one = getAudioObjectForFileName(audioObjects, '1');
	two = getAudioObjectForFileName(audioObjects, '2');	
	three = getAudioObjectForFileName(audioObjects, '3');
	four = getAudioObjectForFileName(audioObjects, '4');
	five = getAudioObjectForFileName(audioObjects, '5');
	six = getAudioObjectForFileName(audioObjects, '6');
	seven = getAudioObjectForFileName(audioObjects, '7');
	eight = getAudioObjectForFileName(audioObjects, '8');
	alarm = getAudioObjectForFileName(audioObjects, 'alarm');
}

function ReadInPointsForNback(fileName: String) 
{
	// set up
	var txtLetters = new Array();
	var txtMarkerPosition = new Array();
	
	// read in all text
	var sr = new StreamReader(fileName);
 	var fileContents = sr.ReadToEnd();
 	sr.Close();
 	// split into lines
 	fileContents = fileContents.Replace("\r\n","\n"); // Resolve Mac/PC difference in carriage returns
 	var lines = fileContents.Split("\n"[0]);

 	var i = 0;
 	while (lines[i] != "") {

 		var line = lines[i];
 		//var valSegs2:String[]=line.Split("\t");
 		// Parse Line
		var valSegs:String[]=line.Split("\t"[0]);
		if (valSegs.length>2) 
		{
			var letter = valSegs[0];	
	       	var markerLocation = valSegs[1];

	       	// TRACING of raw (x,y,z)
//	      	Debug.Log("xStr: " + xStr + ", yStr: " + yStr + ", zStr: " + zStr);
	       	txtLetters.Push(letter);
	       	if (markerLocation != "") {
	       		txtMarkerPosition.Push(float.Parse(markerLocation));
	       	}
		}
		i++;
     }

	var letters: String[] = txtLetters.ToBuiltin(String) as String[];
	var positions: float[] = txtMarkerPosition.ToBuiltin(float) as float[];
	return [letters, positions];
}

function startNback(){
	InvokeRepeating("readLetter", 0, 2.5);
}

function readLetter() {
	var letter = letters[currentLetter];
	if (letter == "1") {
		one.Play();
	}
	else if (letter == "2") {
		two.Play();
	}
	else if (letter == "3") {
		three.Play();
	}
	else if (letter == "4") {
		four.Play();
	}
	else if (letter == "5") {
		five.Play();
	}
	else if (letter == "6") {
		six.Play();
	}
	else if (letter == "7") {
		seven.Play();
	}
	else if (letter == "8") {
		eight.Play();
	}
	currentLetter += 1;
}