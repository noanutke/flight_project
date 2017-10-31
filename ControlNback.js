#pragma strict

var moveMarkerScript: NewBehaviourScript;

var n: int = 1;

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
//var markerPositions: float[];
var letters: String[];
var nBackFilename = "NedeConfig/1-back.txt";
var audioFiles = [];
var currentLetter: int = 0;
var buttonPressedForTrial = false;
var buttonPressedForLastTrial = false;
var expectedRT = 1000; //ms
var targetPresented = false;
var targetPresentedLastTrial = false;
var tooSlow = false;
var tooSlowLastTrial = false;
var lastLetterTime = 0;
var failedToPassRing = false;

function setFailedToPassRing() {
	failedToPassRing = true;
}

function readNextLetter() {
	
	buttonPressedForLastTrial = buttonPressedForTrial;
	targetPresentedLastTrial = targetPresented;
	tooSlowLastTrial = tooSlow;
	buttonPressedForTrial = false;
	tooSlow = false;
	if (wasLastTrialError() && !buttonPressedForLastTrial) {
		moveMarkerScript.changePosition(-1);
	}
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
	targetPresented = isTarget();
	currentLetter += 1;
	lastLetterTime = Time.time;
}

function Start () {
	var resultNback = ReadInPointsForNback(nBackFilename);
	letters = resultNback[0];
	yield WaitForSeconds(10);
	InvokeRepeating("readNextLetter", 0, 2.5);
	InvokeRepeating("playAlarmIfNeeded", 0.5, 2.5);

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

function buttonPressed() {
	if(buttonPressedForTrial) {
		return;
	}
	buttonPressedForTrial = true;
	var currentTime = Time.time;
	var rt = currentTime - lastLetterTime - 0.5;
	if (targetPresented) {		
		if (rt * 1000 > expectedRT) {
			tooSlow = true;
			moveMarkerScript.changePosition(-1);
		}
		else {
			moveMarkerScript.changePosition(1);
		}
	}
	else {
		moveMarkerScript.changePosition(-1);
	}
}

function isTarget() {
	if (currentLetter - n < 0 ) {
		return false;
	}
	else if (letters[currentLetter] == letters[currentLetter-n]) {
		return true;
	}
	else {
		return false;
	}	
}

function playAlarmIfNeeded() {
	if (wasLastTrialError() || failedToPassRing) {
		alarm.Play();	// false alarm
	}
	failedToPassRing = false;
}

function wasLastTrialError() {
	if (buttonPressedForLastTrial && !targetPresentedLastTrial) {
		return true;	// false alarm
	}
	else if (!buttonPressedForLastTrial && targetPresentedLastTrial) {
		return true;	// miss
	}
	else if (tooSlowLastTrial) {
		return true;
	}
	return false;
}