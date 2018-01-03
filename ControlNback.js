#pragma strict
import System.IO;
import System.Collections.Generic;


var moveMarkerScript: NewBehaviourScript;
var dataSaverScript: dataSaver;

public static var finishedBlocksInCondition: boolean;
public static var n: String = '1';
public static var blockOrdinal = "a";
public static var targetLetter = "1";
public static var ringSize = "big";
public static var stroopCondition = "cong";
public var isPractice = false;

var trialNumber = 0;

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
var colors: String[];
var sounds: String[];

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
var flightFailures = 0;
var flightSuccess = 0;
var nBackFailures = 0;
var prefab1: Transform;
var prefab2: Transform;
var nBackTrialsAmount = 12;

public static var withStress: boolean;
public static var withNback: boolean;
public static var order: int;
var calibration: boolean;
public static var condition: String;
var maxFailuresInRow = 1;
var nBackFailure = false;
var ringFailure = true;
public static var moveSpeed :int;
var ringsCountForCalibration = 0;
var ringsFailuresCountForCalibration = 0;
var speedInput: UI.Text;

var nBackFilename = "";
var invoked = false;



private var lslBCIInputScript: LSL_BCI_Input;

function getLevel() {
	return n;
}

function getCalibration() {
	return calibration;
}

function getCondition() {
	if (withStress == true) {
		condition = "stress";
		return  "stress";
	}
	condition = "noStress";
	return "noStress";
}

function getOpenningParameters () {
	var useNbackObj =  GameObject.Find ("TextNback");
	var useNbackInput = useNbackObj.GetComponent(UI.Text) as UI.Text;
	var levelInputObj =  GameObject.Find ("TextLevel");
	var levelInput = levelInputObj.GetComponent(UI.Text) as UI.Text;
	var calibrationInputObj =  GameObject.Find ("TextCalibration");
	var calibrationInput = calibrationInputObj.GetComponent(UI.Text) as UI.Text;
	var speedInputObj =  GameObject.Find ("TextSpeed");
	speedInput = speedInputObj.GetComponent(UI.Text) as UI.Text;

	var conditionObj =  GameObject.Find ("TextBaseCondition");
	var conditionInput = conditionObj.GetComponent(UI.Text) as UI.Text;

	var orderObj =  GameObject.Find ("TextOrder");
	var orderInput = orderObj.GetComponent(UI.Text) as UI.Text;

	var speedPlaceHolderObj =  GameObject.Find ("Placeholder use speed");
	var speedPlaceHolderInput = speedPlaceHolderObj.GetComponent(UI.Text) as UI.Text;
	var levelText = levelInput.text;
	var useNbackText = useNbackInput.text;
	var calibrationText = calibrationInput.text;
	var speedText = speedInput.text;
	var speedPlaceHolderText = speedPlaceHolderInput.text;

	var baseConditionText = conditionInput.text;
	var orderText = orderInput.text;


	if (baseConditionText == "yes") {
		withStress = false;
	}
	else {
		withStress = true;
	}
	moveSpeed = parseInt(speedText);

	dataSaverScript.restartBlocks();
	if (orderText == "1") {
		withNback = true;
		order = 1;
		createBlocksOrderFromFile("n-back files/" + "order" + orderText + ".txt");
	}
	else if (orderText == "2") {
		withNback = true;
		order = 2;
		createBlocksOrderFromFile("n-back files/" + "order" + orderText + ".txt");
		
	}
	else {
		isPractice = true;
		dataSaverScript.showSuccessRate = true;
		nBackFilename = "n-back files/" + levelText+ "-back-cong-a-big.txt";

		var nBackStatus = "";
		if (useNbackText == "yes") {
			withNback = true;
			nBackStatus = "withNback";
		}
		else {
			withNback = false;
			nBackStatus = "withoutNback";
		}
		if(calibrationText == "yes") {
			calibration = true;
		}
		else {
			calibration = false;

		}

		dataSaverScript.addBlock(levelText, 'big', nBackFilename, "a", "cong", nBackStatus);
       	n = levelText;


	}
	//dataSaver.blocksArray = blocks;
	dataSaverScript.condition = getCondition();
	dataSaverScript.moveSpeed = moveSpeed;
	dataSaverScript.currentBlockIndex = 0;

	var canvas = GameObject.Find ("openning canvas");
	canvas.SetActive(false);
}

function getSpeed() {
	return moveSpeed;
}


function updateSpeedIfNeeded() {
	if(calibration == false) {
		return;
	}
	if(ringsFailuresCountForCalibration > 1) {
		moveSpeed = moveSpeed - 20;
		ringsFailuresCountForCalibration = 0;
		ringsCountForCalibration = 0;
	}
	else if (ringsCountForCalibration >= 6) {
		EndLevel();
	}
}

function Awake() {
}

function Start () {
	flightFailures = 0;
	nBackFailures = 0;
	flightSuccess = 0;
	var ob = GameObject.Find("dataSaver");
	dataSaverScript = ob.GetComponent(dataSaver) as dataSaver; 
	//dataSaver = gameObject.AddComponent(dataSaver); 
	if (dataSaverScript && dataSaverScript.getBlocksCount()) {
		if (dataSaverScript.currentBlockIndex > dataSaverScript.getBlocksCount()-1) {
			getOpenningParameters();
		 } 
	}
	else {
		getOpenningParameters();
	}
	var mash: MeshRenderer;
	var renderers = prefab1.GetComponentsInChildren(MeshRenderer);
	mash = renderers[0];
	mash.sharedMaterials[0].color = perf1;
	//mash.sharedMaterials[0].SetColor("_Color", perf1);
	ReadInPointsForNback(dataSaverScript.getFileName());

	yield WaitForSeconds(8);
	if (invoked == false) { 
		InvokeRepeating("readNextLetter", 0, 3);
		invoked = true;
	}
	//lslBCIInputScript = gameObject.GetComponent(LSL_BCI_Input); 
}


function setRingFailure() {
	failuresInRow += 1;
	flightFailures += 1;
	successInRow = 0;
	ringsFailuresCountForCalibration += 1;
	ringsCountForCalibration += 1;
	updateSpeedIfNeeded();
}

function setNbackFailure() {
	failuresInRow = maxFailuresInRow;
	nBackFailures += 1;
	successInRow = 0;
	nBackFailure = true;
}

function setNbackSuccess() {
	successInRow += 1;
	failuresInRow = 0;
	nBackFailure = false;
}

function setRingSuccess() {
	flightSuccess += 1;
	successInRow += 1;
	failuresInRow = 0;
	ringFailure = false;
	ringsCountForCalibration += 1;
	updateSpeedIfNeeded();
}

function setPrefabRings(_prefab1, _prefab2) {

	prefab1 = _prefab1;
	prefab2 = _prefab2;
	//lslBCIInputScript = gameObject.GetComponent(LSL_BCI_Input); 
}

function setLSL(lslObject: LSL_BCI_Input) {
	lslBCIInputScript = lslObject;
}

function EndLevel() 
{
	var flightAmount: float = flightSuccess + flightFailures + 0.0f;
	var flightSuccessRate: float = flightSuccess / flightAmount * 100;

	var nBackSuccessRate: float = 0.0;
	if (withNback == true) {
		var nBackSuccessAmount: float = nBackTrialsAmount - nBackFailures + 0.0f;
		nBackSuccessRate = nBackSuccessAmount / nBackTrialsAmount * 100;
	}
	dataSaverScript.updateSuccessRate(flightSuccessRate, nBackSuccessRate);
	if (calibration == true) {

		var placeHolder =  GameObject.Find ("Placeholder use speed");

		speedInput.text = moveSpeed.ToString();
		speedInput.text = "160";
		var placeHolderTextInput = placeHolder.GetComponent(UI.Text) as UI.Text;
		placeHolderTextInput.text = moveSpeed.ToString();
		placeHolderTextInput.text = "160";

		//SceneManagement.SceneManager.LoadScene ("N_back_input");
	}	
	else {
		// Changed, FJ, 20160403 - Send start marker with condition
		lslBCIInputScript.setMarker ("RunEnd_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize +
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
		SceneManagement.SceneManager.LoadScene ("stress_evaluation");
	}
}

function readNextLetter() {
	targetPresentedLastTrial = targetPresented;


	if (trialNumber >= 12) {
		EndLevel();
		return;
	}
	if (withNback == false) {
		trialNumber += 1;
		return;
	}
	buttonPressedForLastTrial = buttonPressedForTrial;
	if (trialNumber != 0) {
		setFailureIfLastTrialMissed();
	}


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
	lslBCIInputScript.setMarker ("Letter_" + letter + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize +
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
	targetPresented = isTarget();
	trialNumber++;
	currentLetter += 1;
	lastLetterTime = Time.time;
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
	if (withNback == false) {
		return;
	}
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


function createBlocksOrderFromFile(fileName: String) {
	// read in all text
	var sr = new StreamReader(fileName);
 	var fileContents = sr.ReadToEnd();
 	sr.Close();
 	// split into lines
 	fileContents = fileContents.Replace("\r\n","\n"); // Resolve Mac/PC difference in carriage returns
 	var lines = fileContents.Split("\n"[0]);

 	var i = 0;
 	while (lines[i] != "") {

 		var blockName = lines[i];

		
		var blockProperties:String[]=blockName.Split("-"[0]);
		n = blockProperties[0];
		stroopCondition = blockProperties[2];
		blockOrdinal = blockProperties[3];
		if (blockOrdinal == "a") {
			targetLetter = "1";
		}
		else {
			targetLetter = "2";
		}
		ringSize = blockProperties[4];

		var blockFile = "n-back files/" + blockName + ".txt";

       	dataSaverScript.addBlock(n, ringSize, blockFile, blockOrdinal, stroopCondition, "withNback");
		
		i++;
     }
}

function ReadInPointsForNback(fileName: String) 
{
	if (withNback == false) {
		return;
	}
	// set up
	var txtLetters = new Array();
	var txtMarkerPosition = new Array();

	var txtColors = new Array();
	var txtSounds = new Array();
	
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

		var letter = valSegs[0];
		var color = valSegs[2];
		var sound = valSegs[3];

       	// TRACING of raw (x,y,z)
//	      	Debug.Log("xStr: " + xStr + ", yStr: " + yStr + ", zStr: " + zStr);
       	txtLetters.Push(letter);
       	txtColors.Push(color);
       	txtSounds.Push(sound);
		
		i++;
     }

	letters = txtLetters.ToBuiltin(String) as String[];
	colors = txtColors.ToBuiltin(String) as String[];
	sounds = txtSounds.ToBuiltin(String) as String[];
}

function buttonPressed() {
	if (withNback == false) {
		return;
	}
	if(buttonPressedForTrial) {
		return;
	}
	buttonPressedForTrial = true;
	var currentTime = Time.time;
	var rt = currentTime - lastLetterTime - 0.5;
	if (targetPresented) {		
		if (rt * 1000 > expectedRT) {
			tooSlow = true;

			lslBCIInputScript.setMarker ("nBackHIT" + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize + 
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
		}
		else {
			setNbackSuccess();
			lslBCIInputScript.setMarker ("nBackHIT" + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize + 
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
		}
	}
	else {
		setNbackFailure();
		lslBCIInputScript.setMarker ("nBackFA" + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize +
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
	}
}

function isTarget() {
	if (currentLetter - parseInt(n) < 0 ) {
		return false;
	}
	var perviousLetterIndex: int = currentLetter-parseInt(n);
	if (n == "0") {		
		if (letters[currentLetter] == targetLetter) {
			return true;
		}
	}

	else if (letters[currentLetter] == letters[perviousLetterIndex]) {
		return true;
	}
	else {
		return false;
	}	
}

function setPerformanceLevel() {
	if (withStress == false ) {
		return;
	}
	var renderers: Component[];
	var mash: MeshRenderer;
	var currentColor = colors[trialNumber-1];
	var colorRGB = getRingsColor(currentColor);
	renderers = prefab1.GetComponentsInChildren(MeshRenderer);
	mash = renderers[0];
	mash.sharedMaterials[0].color = colorRGB;

	playAlarmInNeeded();
	if (withStress == false) {
		return;
	}
	lslBCIInputScript.setMarker ("RingColor_" + currentColor + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize +
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);

	/*
	setFailureIfLastTrialMissed();
	var renderers: Component[];
	var mash: MeshRenderer;
	var color: Color32; ;
	var lastPrefLevel = currentPerfLevel;

	if (failuresInRow >= maxFailuresInRow) {
		failuresInRow = 0;
		if (currentPerfLevel < 5) {
			currentPerfLevel += 1;
			lslBCIInputScript.setMarker ("PerfChanged_" + currentPerfLevel);
		}

		color = getRingsColor();
		renderers = prefab1.GetComponentsInChildren(MeshRenderer);
		mash = renderers[0];
		mash.sharedMaterials[0].color = color;
		//mash.sharedMaterials[0].SetColor("_Color", color);
	}
	else if (successInRow >= 2 && nBackFailure != true && ringFailure != true) {
		if (currentPerfLevel > 1) {
			currentPerfLevel -= 1;
			lslBCIInputScript.setMarker ("PerfChanged_" + currentPerfLevel);
		}
		color = getRingsColor();
		renderers = prefab1.GetComponentsInChildren(MeshRenderer);
		mash = renderers[0];
		mash.sharedMaterials[0].color = color;
		successInRow=0;
	}
	*/

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


function getRingsColor(color) {
	if (color =="red") {
		return perf5;
	}
	else {
		return perf1;
	}
}

function getPerfLevel() {
	return currentPerfLevel;
}

function playAlarmInNeeded() {
	if (trialNumber >= 12) {
		return;
	}
	if (sounds[trialNumber] == "sound") {
		alarm.Play();
		lslBCIInputScript.setMarker ("Alarm" + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize +

		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
	}	
}

function setFailureIfLastTrialMissed() {
	if (!buttonPressedForLastTrial) {
		if (targetPresentedLastTrial) {
			setNbackFailure();
			lslBCIInputScript.setMarker ("nBackMISS" + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize + 

		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
		}
		else {
			lslBCIInputScript.setMarker ("nBackCorrectRejection" + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize + 
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
		}
	}
}