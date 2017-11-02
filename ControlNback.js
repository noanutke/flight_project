﻿#pragma strict

var moveMarkerScript: NewBehaviourScript;

var n: int = 1;

var perf1 = Color32(0,255,0,1);
var perf2 = Color32(128,255,0,1);
var perf3 = Color32(255,255,0,1);
var perf4 = Color32(255,128,0,1);
var perf5 = Color32(255,0,0,1);

var alarmChancePerf1 = 10;
var alarmChancePerf2 = 8;
var alarmChancePerf3 = 6;
var alarmChancePerf4 = 4;
var alarmChancePerf5 = 2;

var currentPerfLevel = 1;

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
var successInRow = 0;
var failuresInRow = 0;
var prefab1: Transform;
var prefab2: Transform;



function setFailure() {
	failuresInRow += 1;
	successInRow = 0;
}

function setSuccess() {
	successInRow += 1;
	failuresInRow = 0;
}

function setPrefabRings(_prefab1, _prefab2) {
	prefab1 = _prefab1;
	prefab2 = _prefab2;
}

function readNextLetter() {
	
	buttonPressedForLastTrial = buttonPressedForTrial;
	targetPresentedLastTrial = targetPresented;
	tooSlowLastTrial = tooSlow;
	buttonPressedForTrial = false;
	tooSlow = false;

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
	var mash: MeshRenderer;
	var renderers = prefab1.GetComponentsInChildren(MeshRenderer);
	mash = renderers[0];
	mash.sharedMaterials[0].color = perf1;
	//mash.sharedMaterials[0].SetColor("_Color", perf1);
	var resultNback = ReadInPointsForNback(nBackFilename);
	letters = resultNback[0];
	yield WaitForSeconds(2);
	InvokeRepeating("readNextLetter", 0, 2.5);
	InvokeRepeating("setPerformanceLevel", 0.5, 2.5);

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
			setFailure();
		}
		else {
			setSuccess();
		}
	}
	else {
		setFailure();
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

function setPerformanceLevel() {
	setFailureIfLastTrialMissed();
	var renderers: Component[];
	var mash: MeshRenderer;
	var color: Color32; ;


	if (failuresInRow >= 2) {
		failuresInRow = 0;
		if (currentPerfLevel < 5) {
			currentPerfLevel += 1;
		}

		color = getRingsColor();
		renderers = prefab1.GetComponentsInChildren(MeshRenderer);
		mash = renderers[0];
		mash.sharedMaterials[0].color = color;
		//mash.sharedMaterials[0].SetColor("_Color", color);
	}
	else if (successInRow >= 2) {
		if (currentPerfLevel > 1) {
			currentPerfLevel -= 1;
		}
		color = getRingsColor();
		renderers = prefab1.GetComponentsInChildren(MeshRenderer);
		mash = renderers[0];
		mash.sharedMaterials[0].color = color;
		successInRow=0;
	}
	playAlarmInNeeded();

}

function shouldShowAlarmBasedOnPerfLevel() {
	var chance = getAlarmChanceForPerfLevel();
	var rand = Random.Range(1, chance+1);
	return rand == 1;
}

function getAlarmChanceForPerfLevel(){
	if (currentPerfLevel == 1) {
		return alarmChancePerf1;
	}
	else if (currentPerfLevel == 2) {
		return alarmChancePerf2;
	}
	else if (currentPerfLevel == 3) {
		return alarmChancePerf3;
	}
	else if (currentPerfLevel == 4) {
		return alarmChancePerf4;
	}
	return alarmChancePerf5;
}


function getRingsColor() {
	if (currentPerfLevel == 1) {
		return perf1;
	}
	else if (currentPerfLevel == 2) {
		return perf2;
	}
	else if (currentPerfLevel == 3) {
		return perf3;
	}
	else if (currentPerfLevel == 4) {
		return perf4;
	}
	return perf5;
}

function playAlarmInNeeded() {
	if (shouldShowAlarmBasedOnPerfLevel()) {
		alarm.Play();
	}	
}

function setFailureIfLastTrialMissed() {
	if (!buttonPressedForLastTrial && targetPresentedLastTrial) {
		setFailure();
	}
}