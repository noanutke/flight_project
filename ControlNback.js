#pragma strict
import System.IO;

var moveMarkerScript: NewBehaviourScript;

var n: int = 1;
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
var level: int;
var withStress: boolean;
var condition: String;

private var lslBCIInputScript: LSL_BCI_Input;

function getLevel() {
	return level;
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
	var levelText = levelInput.text;
	var stressText = useNbackInput.text;

	if (levelText == '1') {
		n=1;
		level=1;
		nBackFilename = "NedeConfig/" + levelText + "-back.txt";
	}
	else if (levelText == '2') {
		n=2;
		level=2;
		nBackFilename = "NedeConfig/" + levelText + "-back.txt";
	}
	else {
		n=3;
		level=3;
		nBackFilename = "NedeConfig/" + levelText + "-back.txt";
	}

	if (stressText == "yes") {
		withStress = true;
	}
	else {
		withStress = false;
	}
	var canvas = GameObject.Find ("openning canvas");
	var renderer = canvas.GetComponent(CanvasGroup) as CanvasGroup;
	renderer.alpha = 0f;
	renderer.blocksRaycasts = false;
}

function Awake() {
	getOpenningParameters();
}

function Start () {
	if (!withStress) {
		GameObject.Find("arrows_canvas").SetActive(false);
		return;
	}
	var mash: MeshRenderer;
	var renderers = prefab1.GetComponentsInChildren(MeshRenderer);
	mash = renderers[0];
	mash.sharedMaterials[0].color = perf1;
	//mash.sharedMaterials[0].SetColor("_Color", perf1);
	letters = ReadInPointsForNback(nBackFilename);
	yield WaitForSeconds(2);
	InvokeRepeating("readNextLetter", 0, 2.5);
	InvokeRepeating("setPerformanceLevel", 0.49999, 2.5);
	//lslBCIInputScript = gameObject.GetComponent(LSL_BCI_Input); 
}


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
	//lslBCIInputScript = gameObject.GetComponent(LSL_BCI_Input); 
}

function setLSL(lslObject: LSL_BCI_Input) {
	lslBCIInputScript = lslObject;
}

function EndLevel() 
{
	// Changed, FJ, 20160403 - Send start marker with condition
	lslBCIInputScript.setMarker ("RunEnd_Condition_" + condition + "_Level_" + level);
	SceneManagement.SceneManager.LoadScene ("N_back_input");
}

function readNextLetter() {
	trialNumber++;
	if (trialNumber > 40) {
		EndLevel();
	}
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
	lslBCIInputScript.setMarker ("Letter_" + letter);
	targetPresented = isTarget();
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

		var letter = valSegs[0];	

       	// TRACING of raw (x,y,z)
//	      	Debug.Log("xStr: " + xStr + ", yStr: " + yStr + ", zStr: " + zStr);
       	txtLetters.Push(letter);
		
		i++;
     }

	var letters: String[] = txtLetters.ToBuiltin(String) as String[];
	return letters;
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
			lslBCIInputScript.setMarker ("nBackHIT");
		}
		else {
			setSuccess();
			lslBCIInputScript.setMarker ("nBackHIT");
		}
	}
	else {
		setFailure();
		lslBCIInputScript.setMarker ("nBackFA");
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
	var lastPrefLevel = currentPerfLevel;

	if (failuresInRow >= 2) {
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
	else if (successInRow >= 2) {
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
	playAlarmInNeeded();
	if (lastPrefLevel != currentPerfLevel) {
		lslBCIInputScript.setMarker ("PrefLevel_" + currentPerfLevel);
	}
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

function getPerfLevel() {
	return currentPerfLevel;
}

function playAlarmInNeeded() {
	if (shouldShowAlarmBasedOnPerfLevel()) {
		alarm.Play();
		lslBCIInputScript.setMarker ("Alarm");
	}	
}

function setFailureIfLastTrialMissed() {
	if (!buttonPressedForLastTrial) {
		if (targetPresentedLastTrial) {
			setFailure();
			lslBCIInputScript.setMarker ("nBackMISS");
		}
		else {
			lslBCIInputScript.setMarker ("nBackCorrectRejection");
		}
	}
}