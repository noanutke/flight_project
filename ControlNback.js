#pragma strict
import System.IO;
import System.Collections.Generic;


var moveMarkerScript: NewBehaviourScript;
var dataSaverScript: dataSaver;
var parallelPortScript: parallelPort;

public static var finishedBlocksInCondition: boolean;
public static var n: String = '1';
public static var blockOrdinal = "a";
public static var targetLetter = "1";
public static var ringSize = "big";
public static var stroopCondition = "incong";
public var isPractice = false;

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
var bip: AudioSource;
var alarm2: AudioSource;
//var markerPositions: float[];
var letters: String[];
var colors: String[];
var sounds: String[];
var bips: String[];

var audioFiles = [];
var currentLetter: int = -1;
var nbackButtonPressedForTrial = false;
var bipButtonPressedForTrial = false;
var nbackButtonPressedForLastTrial = false;
var bipButtonPressedForLastTrial = false;
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
var nBackHits = 0;
var nBackFA = 0;
var prefab1: Transform;
var prefab2: Transform;
var nBackTrialsAmount = 12;
var bipAppeared = false;

public static var withStress: boolean;
public static var withNback: boolean;
public static var order: int;

public static var condition: String;
var maxFailuresInRow = 1;
var nBackFailure = false;
var ringFailure = true;



var speedInput: UI.Text;

var nBackFilename = "";
var invoked = false;

var ringsCountForCalibration = 0;
var ringsFailuresCountForCalibration = 0;
var calibration: boolean;
var targetFailuresForCalibration = 3;
var targetRingsCountForCalibration = 10;
public static var moveSpeed :int;
var isUpdating = false;



private var lslBCIInputScript: LSL_BCI_Input;

function getLevel() {
	return n;
}

function getCalibration() {
	return calibration;
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

	currentLetter = -1;
	flightFailures = 0;
	nBackFailures = 0;
	flightSuccess = 0;
	var ob = GameObject.Find("dataSaver");
	dataSaverScript = ob.GetComponent(dataSaver) as dataSaver;

	parallelPortScript = dataSaverScript.getParallelsScript();

	targetFailuresForCalibration = dataSaverScript.ringsFailuresForCalibrationTarget;
	targetRingsCountForCalibration = dataSaverScript.ringsAmountForCalibrationPhase;
	calibration = dataSaverScript.getIsCalibration();


	initilaizeCurrentBlockProperties();
	var mash: MeshRenderer;
	var renderers = prefab1.GetComponentsInChildren(MeshRenderer);
	mash = renderers[0];
	mash.sharedMaterials[0].color = perf1;

	yield WaitForSeconds(3);
	if (invoked == false) { 
		InvokeRepeating("readNextLetter", 0, 3);
		InvokeRepeating("setPerformanceLevel", 0.49999, 3);
		invoked = true;
	}
}



function initilaizeCurrentBlockProperties() {
	this.letters = dataSaverScript.getLetters();
	this.colors = dataSaverScript.getColors();
	this.sounds = dataSaverScript.getAlarms();

	withStress = dataSaverScript.condition == "stress"? true: false;
	n = dataSaverScript.getN();
	stroopCondition = dataSaverScript.getStroopCondition();
	blockOrdinal = dataSaverScript.getType();
	targetLetter = dataSaverScript.getTargetLetter();
	withNback = dataSaverScript.getWithNBack();
	ringSize = dataSaverScript.getRingSize();
	moveSpeed = dataSaverScript.moveSpeed;
	if (dataSaverScript.getIsBaseline() || withNback == false) {
		withStress = false;
	}


}

function setRingFailure() {
	if (isUpdating) {
		return;
	}
	failuresInRow += 1;
	flightFailures += 1;
	successInRow = 0;

	if (dataSaverScript.getIsCalibration()) {
		ringsFailuresCountForCalibration += 1;
		ringsCountForCalibration += 1;
		updateSpeedIfNeeded();
	}
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
	if (isUpdating) {
		return;
	}
	flightSuccess += 1;
	successInRow += 1;
	failuresInRow = 0;
	ringFailure = false;
	if (dataSaverScript.getIsCalibration()) {
		ringsCountForCalibration += 1;
		updateSpeedIfNeeded();
	}
}

function setStartMarker() {
	lslBCIInputScript.setMarker ("RunStart_Condition_" + dataSaverScript.condition + "_nLevel_" + n + "_ringSize_" + ringSize + 
	"_blockOrdinal_" + dataSaverScript.getType() + "_stroopCondition_" + dataSaverScript.getStroopCondition() + 
	"_isPractice_" + isPractice + "_blockNumber_"
	+ dataSaverScript.currentBlockIndex + "_speed_" + dataSaverScript.moveSpeed + "_subjectNumber_" + dataSaverScript.subjectNumber + 
	"_isBaseline_"  + dataSaverScript.getIsBaseline() + "_order_" + dataSaverScript.blockOrderNumber);
}

function updateSpeedIfNeeded() {
	if (isUpdating) {
		return;
	}
	isUpdating = true;
	if (ringsCountForCalibration >= targetRingsCountForCalibration) {
		
		if (targetFailuresForCalibration > 0) {
			if(ringsFailuresCountForCalibration >= targetFailuresForCalibration) {
				dataSaverScript.moveSpeed =  moveSpeed;
				EndLevel();
			}
			else {
				if ( targetFailuresForCalibration != targetRingsCountForCalibration) {
					moveSpeed += 20;
				}
				ringsCountForCalibration = 0;
				ringsFailuresCountForCalibration = 0;

			}


		}
		else if (targetFailuresForCalibration == 0) {
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
	isUpdating = false;	
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
		var nBackHitsFloat: float = nBackHits + 0.0f;
		var nBackFAFloat: float =  nBackHits + 0.0f;
		nBackSuccessRate = ((nBackHitsFloat / 4 ) - (nBackFAFloat / 36 ))* 100;
		if (nBackSuccessRate < 0) {
			nBackSuccessRate = 0;
		}
	}
	dataSaverScript.updateSuccessRate(flightSuccessRate, nBackSuccessRate);

	// Changed, FJ, 20160403 - Send start marker with condition
	lslBCIInputScript.setMarker ("RunEnd_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize +
	"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);

	parallelPortScript.OutputToParallel(2);
	if (dataSaverScript.getIsCalibration() == true) {
		SceneManagement.SceneManager.LoadScene ("calibrationResults");
	}
	else if (dataSaverScript.getIsLastPractice()) {
			SceneManagement.SceneManager.LoadScene ("successRates");
	}
	else if (dataSaverScript.condition == "stress" && dataSaverScript.getIsBaseline() == false) {
		dataSaverScript.updateBlockIndex();
		SceneManagement.SceneManager.LoadScene ("histogram");
	}
	else if (dataSaverScript.currentBlockIndex == dataSaverScript.halfConditionIndex ||
	dataSaverScript.currentBlockIndex == dataSaverScript.halfConditionIndex + 1 ||
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
	var startTime = Time.time;
	print('readLetter');
	print(startTime);
	targetPresentedLastTrial = targetPresented;
	nbackButtonPressedForLastTrial = nbackButtonPressedForTrial;

	if (currentLetter != -1) {
		setFailureIfLastTrialMissed();
	}

	currentLetter += 1;


	if (!calibration && currentLetter >= 12) {
		EndLevel();
		return;
	}
	if (dataSaverScript.getIsBaseline() || withNback == false) {
		return;
	}



	tooSlowLastTrial = tooSlow;
	nbackButtonPressedForTrial = false;

	tooSlow = false;

	var letter = letters[currentLetter];
	lslBCIInputScript.setMarker ("Letter_" + letter + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize +
	"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
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
	alarm = getAudioObjectForFileName(audioObjects, 'scream');
	bip = getAudioObjectForFileName(audioObjects, 'beep1');
	alarm2 = getAudioObjectForFileName(audioObjects, 'alarm');
}


function nbackButtonPressed() {
	lslBCIInputScript.setMarker("nbackButtonPressed");
	if (withNback == false) {
		return;
	}
	if(nbackButtonPressedForTrial) {
		return;
	}
	nbackButtonPressedForTrial = true;
	var currentTime = Time.time;
	var rt = currentTime - lastLetterTime - 0.5;
	if (isTarget() ) {		
			setNbackSuccess();
			nBackHits += 1;
			lslBCIInputScript.setMarker ("nBackHIT" + "_Condition_" + getCondition() + "_level_" + n + "_ringSize_" + ringSize + 
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition);
	}
	else {
		setNbackFailure();
		nBackFA += 1;
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

	if (withStress == false || dataSaverScript.getIsBaseline()) {
		return;
	}
	var renderers: Component[];
	var mash: MeshRenderer;
	var currentColor = colors[currentLetter];
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
	if (currentLetter >= 12) {
		return;
	}
	var rand = Random.Range(1, 3);
	if (sounds[currentLetter] == "alarm") {
		parallelPortScript.OutputToParallel(3);
		alarm2.Play();

		lslBCIInputScript.setMarker ("Alarm" + "_type_alarm");
	}
	else if(sounds[currentLetter] == "scream") {
		parallelPortScript.OutputToParallel(3);
		alarm.Play();

		lslBCIInputScript.setMarker ("Alarm" + "_type_scream");
	}
}

function setFailureIfLastTrialMissed() {
	if (!nbackButtonPressedForLastTrial) {
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