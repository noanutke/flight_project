#pragma strict
import System.IO;
import System.Collections.Generic;


var moveMarkerScript: NewBehaviourScript;
var dataSaverScript: dataSaver;
var parallelPortScript: parallelPort;

var runEndParallelMarker = 100;
var finishedBlocksInCondition: boolean;
var n = "1";
var blockOrdinal = "a";
var targetLetter = "1";
var ringSize = "big";
var isPractice = false;
var currentBlockTrialsAmount = 0;

//Sound variables
var one: AudioSource;
var two: AudioSource;
var three: AudioSource;
var four: AudioSource;
var five: AudioSource;
var six: AudioSource;
var seven: AudioSource;
var eight: AudioSource;
var scream: AudioSource;
var alarm: AudioSource;

var letters: String[];
var colors: String[];
var sounds: String[];

var currentLetter: int = -1;
var nbackButtonPressedForTrial = false;
var nbackButtonPressedForLastTrial = false;
var targetPresented = false;
var targetPresentedLastTrial = false;
var lastLetterTime = 0;

var flightFailures = 0;
var flightSuccess = 0;
var nBackFailures = 0;
var nBackHits = 0;
var nBackFA = 0;
var prefab1: Transform;
var prefab2: Transform;
var greenColor = Color32(0,255,0,1);
var redColor = Color32(255,0,0,1);

var withStress: boolean;
var withNback: boolean;
var order: int;
var condition: String;

var speedInput: UI.Text;

var nBackFilename = "";
var invoked = false;

var ringsCountForCalibration: int;
var ringsFailuresCountForCalibration: int;
var isCalibration: boolean;
var targetFailuresForCalibration: int;
var targetRingsCountForCalibration: int;
var moveSpeed :int;
var isUpdatingSpeed = false; // True if we are currently updating the speed (relevant for calibration)

private var lslBCIInputScript: LSL_BCI_Input;

function getLevel() {
	return n;
}

function getCondition() {
	return dataSaverScript.condition;
}

function getSpeed() {
	return moveSpeed;
}

function Awake() {
}

function Start () {
	ringsFailuresCountForCalibration = 0;
	ringsCountForCalibration = 0;
	currentLetter = -1;
	flightFailures = 0;
	nBackFailures = 0;
	flightSuccess = 0;

	var ob = GameObject.Find("dataSaver");
	dataSaverScript = ob.GetComponent(dataSaver) as dataSaver;
	parallelPortScript = dataSaverScript.getParallelsScript();

	initilaizeCurrentBlockProperties();

	var mash: MeshRenderer;
	var renderers = prefab1.GetComponentsInChildren(MeshRenderer);
	mash = renderers[0];
	mash.sharedMaterials[0].color = greenColor;

	yield WaitForSeconds(3);
	if (invoked == false) {
		// read a letter every 3 seconds starting now
		InvokeRepeating("readNextLetter", 0, 3);
		// change the ring color and play alarm if needed after letter stimulus ends (letter stimulus lasts 500ms)
		InvokeRepeating("changeRingsColorAndPlayAlarmIfNeeded", 0.49999, 3);	
		invoked = true;
	}
}


// This function initialize the properties and stimuli of the current block from dataSaver 
function initilaizeCurrentBlockProperties() {

	isCalibration = dataSaverScript.getIsCalibration();
	if (isCalibration) {
		targetFailuresForCalibration = dataSaverScript.ringsFailuresForCalibrationTarget;
		targetRingsCountForCalibration = dataSaverScript.ringsAmountForCalibrationPhase;
	}
	letters = dataSaverScript.getLetters();
	colors = dataSaverScript.getColors();
	sounds = dataSaverScript.getAlarms();

	isPractice = dataSaverScript.getIsPractice();
	withStress = dataSaverScript.condition == "stress"? true: false;
	n = dataSaverScript.getN();
	blockOrdinal = dataSaverScript.getType();
	targetLetter = dataSaverScript.getTargetLetter();
	withNback = dataSaverScript.getWithNBack();
	ringSize = dataSaverScript.getRingSize();
	moveSpeed = dataSaverScript.moveSpeed;
	currentBlockTrialsAmount = dataSaverScript.trialsAmountTestblocks;
	if (dataSaverScript.getIsBaseline()) {
		withStress = false;
		currentBlockTrialsAmount = dataSaverScript.trialsAmountBaselineBlocks;
	}

}

function setRingFailure() {
	if (isUpdatingSpeed) {
		return;
	}
	flightFailures += 1;
	if (isCalibration) {
		ringsFailuresCountForCalibration += 1;
		ringsCountForCalibration += 1;
		updateSpeedIfNeeded();
	}
}

function setNbackFailure() {
	nBackFailures += 1;
}

function setRingSuccess() {
	
	if (isUpdatingSpeed) {
		return;
	}
	flightSuccess += 1;
	if (isCalibration) {
		ringsCountForCalibration += 1;
		updateSpeedIfNeeded();
	}
}

function setStartMarker() {
	parallelPortScript.OutputToParallel(dataSaverScript.currentBlockIndex+1);

	lslBCIInputScript.setMarker (
	"runStart_condition_" + dataSaverScript.condition + 
	"_nLevel_" + n + 
	"_ringSize_" + ringSize + 
	"_blockOrdinal_" + dataSaverScript.getType() + 
	"_isPractice_" + isPractice +
	"_blockNumber_" + dataSaverScript.currentBlockIndex + 
	"_speed_" + dataSaverScript.moveSpeed + 
	"_subjectNumber_" + dataSaverScript.subjectNumber + 
	"_isBaseline_"  + dataSaverScript.getIsBaseline() + 
	"_order_" + dataSaverScript.blockOrderNumber);
}

function updateSpeedIfNeeded() {
	if (isUpdatingSpeed) {
		return;
	}
	isUpdatingSpeed = true;
	// We are updating speed only if player passed through targetRingsCountForCalibration amount of rings
	if (ringsCountForCalibration >= targetRingsCountForCalibration) {	
		if (targetFailuresForCalibration > 0) {
			if(ringsFailuresCountForCalibration >= targetFailuresForCalibration) {
				dataSaverScript.moveSpeed =  moveSpeed;
				EndLevel();
			}
			else {
				// if the input value for calibration is 0 - we don't want to raise the speed
				// just keep goint until we decide to stop - to enable a long practice woth the same speed
				if ( targetFailuresForCalibration != targetRingsCountForCalibration) {
					moveSpeed += 20;
				}
				ringsCountForCalibration = 0;
				ringsFailuresCountForCalibration = 0;
			}
		}

		else {	// If we demand 100% success (0 failures) - we don't raise the speed - just keep 
				// going until 100% success and then end the level.
			if (ringsFailuresCountForCalibration == 0) {
				dataSaverScript.moveSpeed =  moveSpeed;
				EndLevel();
			}
			else {
				ringsCountForCalibration = 0;
				ringsFailuresCountForCalibration = 0;
			}
		}
	}
	isUpdatingSpeed = false;	
}

function setPrefabRings(_prefab1, _prefab2) {
	prefab1 = _prefab1;
	prefab2 = _prefab2;
}

function setLSL(lslObject: LSL_BCI_Input) {
	lslBCIInputScript = lslObject;
}

function calculatePerformanceAndUpdateDataSaver() {
	var flightAmount: float = flightSuccess + flightFailures + 0.0f;
	var flightSuccessRate: float = flightSuccess / flightAmount * 100;

	var nBackSuccessRate: float = 0.0;
	if (withNback == true) {
		var nBackHitsFloat: float = nBackHits + 0.0f;
		var nBackFAFloat: float =  nBackFA + 0.0f;
		nBackSuccessRate = ((nBackHitsFloat / 4 ) - (nBackFAFloat / 8 ))* 100;
		if (nBackSuccessRate < 0) {
			nBackSuccessRate = 0;
		}
	}

	dataSaverScript.updateSuccessRate(flightSuccessRate, nBackSuccessRate);
}

function calculateColumnForScoreInHistogram() {
	var flightSuccessPercent = dataSaverScript.flightSuccess;
	var nBackSuccessPercent = dataSaverScript.nBackSuccess;
	var combinedSuccessPercent = 0.3*nBackSuccessPercent + 0.7*flightSuccessPercent;

	// change scale from 1-100 to 1-10 and round up (9.2 becomes 10)
	var scoreInHistogram = Mathf.Ceil (combinedSuccessPercent / 10);

	// Lower location of score in histogram by one
	scoreInHistogram = scoreInHistogram - 1;
	if (scoreInHistogram <= 1) {
		scoreInHistogram = 1;
	}
	return scoreInHistogram;
}

function EndLevel() 
{
	calculatePerformanceAndUpdateDataSaver();

	// send LSL and parallel port triggers for block end
	lslBCIInputScript.setMarker ("runEnd");
	parallelPortScript.OutputToParallel(runEndParallelMarker);

	// Decide which scene to load next
	if (isCalibration == true) {
		SceneManagement.SceneManager.LoadScene ("calibrationResults");
	}
	else if (isPractice) {
			SceneManagement.SceneManager.LoadScene ("successRates");
	}
	else if (withStress) {
		dataSaverScript.buildHistogram(calculateColumnForScoreInHistogram());
		dataSaverScript.updateBlockIndex();
		SceneManagement.SceneManager.LoadScene ("histogramBuilder");
	}
	else if (dataSaverScript.currentBlockIndex == dataSaverScript.halfConditionIndex ||
	dataSaverScript.currentBlockIndex == dataSaverScript.fullConditionIndex){
		
		dataSaverScript.updateBlockIndex();
		SceneManagement.SceneManager.LoadScene ("stress_evaluation");
	}
	else {
		dataSaverScript.updateBlockIndex();
		SceneManagement.SceneManager.LoadScene("Instructions");
	}
	
}

function readNextLetter() {
	targetPresentedLastTrial = targetPresented;
	nbackButtonPressedForLastTrial = nbackButtonPressedForTrial;
	currentLetter += 1;

	// check if we need to check for missed trial
	if (currentLetter != 0 && withNback != false) {
		// this is not the first trial and we are "withNback" so we need to check for missed trial
		setFailureIfLastTrialMissed();
	}

	// Only during calibration blocks we allow task to continue beyond the the letter amount
	if (!isCalibration && currentLetter >= currentBlockTrialsAmount) {
		EndLevel();
		return;
	}
	if (withNback == false) {
		// we should not read any letter if the current block is without nBack
		return;
	}

	nbackButtonPressedForTrial = false;

	var letter = letters[currentLetter];
	lslBCIInputScript.setMarker ("letter_letter_" + letter);

	targetPresented = isTarget();

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
}


function Update () {
    if(Input.GetKeyDown(KeyCode.JoystickButton0)){
    	nbackButtonPressed(0);
    }
    else if(Input.GetKeyDown(KeyCode.JoystickButton1)){
    	nbackButtonPressed(1);
    }
    else if(Input.GetKeyDown(KeyCode.JoystickButton2)){
    	nbackButtonPressed(2);
    }
    else if(Input.GetKeyDown(KeyCode.JoystickButton3)){
    	nbackButtonPressed(3);
    }
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
	scream = getAudioObjectForFileName(audioObjects, 'scream');
	alarm = getAudioObjectForFileName(audioObjects, 'alarm');
}


function nbackButtonPressed(key) {	
	lslBCIInputScript.setMarker ("keyPressed_key" + key);
	if (withNback == false) {
		return;
	}
	if(nbackButtonPressedForTrial) {
		return;
	}
	nbackButtonPressedForTrial = true;
	if (isTarget()) {		
			nBackHits += 1;
			lslBCIInputScript.setMarker ("nBack_expected_1_actual_1");

	}
	else {
		setNbackFailure();
		nBackFA += 1;
		lslBCIInputScript.setMarker ("nBack_expected_0_actual_1");
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

function changeRingsColorAndPlayAlarmIfNeeded() {
	if (withStress == false) {
		return;
	}
	var renderers: Component[];
	var mash: MeshRenderer;
	var currentColor = colors[currentLetter];
	var colorRGB = getRingsColor(currentColor);
	renderers = prefab1.GetComponentsInChildren(MeshRenderer);
	mash = renderers[0];
	mash.sharedMaterials[0].color = colorRGB;

	if (currentLetter == 0 || currentColor != colors[currentLetter-1]) {
		lslBCIInputScript.setMarker ("colorChanged_color_" + currentColor);
	}
	playAlarmInNeeded();
}

function playAlarmInNeeded() {
	if (currentLetter >= currentBlockTrialsAmount) {
		return;
	}
	var rand = Random.Range(1, 3);
	if (sounds[currentLetter] == "alarm") {
		alarm.Play();
		lslBCIInputScript.setMarker ("aversive_type" + "_alarm");
	}
	else if(sounds[currentLetter] == "scream") {
		scream.Play();
		lslBCIInputScript.setMarker ("aversive_type" + "_scream");
	}
}

function getRingsColor(color) {
	if (color =="red") {
		return redColor;
	}
	else {
		return greenColor;
	}
}

function setFailureIfLastTrialMissed() {
	if (!nbackButtonPressedForLastTrial) {
		if (targetPresentedLastTrial) {
			setNbackFailure();
			lslBCIInputScript.setMarker ("nBack_expected_1_actual_0");

		}
		else {
			lslBCIInputScript.setMarker ("nBack_expected_0_actual_0");
		}
	}
}