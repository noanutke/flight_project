// RunFlightSim.js
//
// This script runs a flight simulator session, including creating and destroying 
// objects (233s), starting and stopping the eyetracker and logger, and sending various 
// messages to the log and EEG (via the Logger/eyelink scripts).
// - This script places an object in each of the locations designated bin a text file.
// - This script creates a ControlFlight script and passes speed/control parameters to it
//   from the loader GUI.
// - This script creates an eyelink script to help log events and objects.
//
// Created 9/3/14 by DJ.
// Updated 9/15/14 by DJ - bug fixes, comments.
// Updated 10/8/14 by SS - implemented practice flight
// Updated 10/10/14 by SS - Flightperformance tracking and report, new control fn.
//
//---------------------------------------------------------------
// Copyright (C) 2014 David Jangraw, <www.nede-neuro.org>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//    
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.
//---------------------------------------------------------------

// Allow stream reading
import System.IO;

//-----------------------//
// DECLARE VARIABLES
//-----------------------//

//---DECLARE GLOBAL VARIABLES
var controlNbackScript: ControlNback;
var dataSaverScript: dataSaver;
var upArrowDirecionScript: changeUpDirectionArrow;
var downArrowDirecionScript: changeDownDirectionArrow;
var leftArrowDirecionScript: changeLeftDirectionArrow;
var rightArrowDirecionScript: changeRightDirectionArrow;
var crossScript: crossControl;


var currentRing = "UpRight";
var width = 0;

var subject = 0;
var session = 0;
var record_EDF_file = true; //set to true to tell the EyeLink to record an .edf file
var EDF_filename: String; //Filename of the EyeLink EDF file when it's transfered to Display (Unity) computer

//WHAT
var objectPrevalence = 1.0; //chance that an object placement will have no object
var categories : String[]; //the possible target/distractor categories
var categoryState : int[];
var categoryPrevalence : float[];
var nCategories = 0;
//var nObjToSee = 20;

//WHERE
// var routeFilename = "NedeConfig/TEST.txt";
var routeFilename = "NedeConfig/SSL.txt";
var ringPositions: Vector3[];
var ringPrefab: Transform;
var centerPrefab: Transform;
var ringWidths: float[];
var centerWidths: float[];
var ringDepth = 10.0;
var centerDepth = 5.0;
var areAllRingsVisible = true;
var isPractice = false;
//WHEN
var trialTime = Mathf.Infinity;
//var recordObjBox = true; //send object bounding box to eyelink every frame
var syncDelay = 1.0; //time between Eye/EEG sync signals

// PHOTODIODE variables
var isPhotodiodeUsed = true;
var photodiodeSize = 100;
private var WhiteSquare : Texture2D;
private var BlackSquare : Texture2D;

//To Dish Out to Other Scripts
var offset_x = 50; //for eyelink calibration
var offset_y = 150; //for eyelink calibration
var gain_x = 1.0; //for eyelink calibration
var gain_y = 1.0; //for eyelink calibration

// Control Parameters
var moveSpeed = 180.0; //motion speed
var pitchSpeed = 100.0; //for turning (vertically)
var lockRoll = false;
var lockXpos = false;

var driftAmplitude = 1.0; // max drift amplitude
var minDriftDelay = 3.0; //min time between brake events
var maxDriftDelay = 10.0; //max time between brake events

var filterDelay = 0.0;
var filterUpTime = 0.0;
var filterDownTime = 0.0;

// CHANGED, FJ, 20150514 --- Added closed loop (LSL) parameters
var expCondition = 0;
var LSL_BCI_Recv_FB_Enabled        = false;
var LSL_BCI_Send_Markers_Enabled   = true;
var LSL_BCI_Send_Feedback_Enabled  = true;
var LSL_BCI_Send_StickMvmt_Enabled = true;

// -------------------------------------------------------------


//Performance Variables
var loaderScript;
var courseCompleted;
var courseAccuracy;

//Sound variables
var one;
var two;
var three;
var four;
var five;
var six;
var seven;
var eight;
var alarm;
var markerPositions: float[];
var letters: String[];
var audioFiles = [];


var successInRow = 0;
var failuresInRow = 0;
// Private Variables


private var eyelinkScript; //the script that passes messages to and receives eye positions from the eyetracker
private var parallelPortScript;
private var flightScript; // the script that allows the subject to control the flight
private var portIsSync = false; //is parallel port sending Constants.SYNC?
private var syncTime = 0.0; //  the next time when the sync pulse should be sent
private var trialEndTime = Mathf.Infinity; //the time when the trial should end
private var UpperRightRingArray: Array;
private var LowerRightRingArray: Array;
private var UpperLeftRingArray: Array;
private var LowerLeftRingArray: Array;
private var nextUpperRightRingBounds: Bounds;
private var nextLowerRightRingBounds: Bounds;
private var nextUpperLeftRingBounds: Bounds;
private var nextLowerLeftRingBounds: Bounds;
private var iNextRing = 0;
private var ringAccuracy = new Array();

// CHANGED, FJ, 2015-05-11
private var lslBCIInputScript; // Online communication with the BCI, here mainly to set markers
private var nLevel;
private var blockOrdinal;
private var stroopCondition;
private var ringSize;
private var condition;
private var calibration;
private var ringsAmountForCalibrationPhase;

private var arrowsAmount = 420;
private var firstRingPassed = false;
private var arrowsArray = new Array();


function createArrowsArray(stroopCondition: String) {
	var congOptionsVertical = new Array("up_pointingUp", "down_pointingDown");
	var congOptionsHorizontal = new Array("right_pointingRight", "left_pointingLeft");
	var incongOptionsVertical = new Array("up_pointingDown", "down_pointingUp");
	var incongOptionsHorizontal = new Array("left_pointingRight", "right_pointingLeft");


	var uniqueIndices = new Array();
	var finishedRandomSelection = false;
	while (finishedRandomSelection == false) {
		var index = Mathf.Floor(Random.Range(0.0,8.9));
		if (uniqueIndices.length > 0) {
			if (uniqueIndices[0] != index) {
				uniqueIndices.Push(index);
				finishedRandomSelection = true;
			}
		}
		else {
			uniqueIndices.Push(index);
			}
	}


	uniqueIndices.Sort();
	if (stroopCondition == "cong") {
		arrowsArray = innerCreationOfArrowsArray(congOptionsVertical, congOptionsHorizontal, incongOptionsVertical,
					incongOptionsHorizontal, uniqueIndices);
	}
	else {
		arrowsArray = innerCreationOfArrowsArray(incongOptionsVertical, incongOptionsHorizontal, congOptionsVertical,
			congOptionsHorizontal, uniqueIndices);
	}

	return arrowsArray;
}

function getRingFromArrows(arrows)
{	
	var currentRing;
	if (arrows[0] == "up_pointingUp")	// show up direction arrow in up position
	{
		currentRing = "Up";
	}
	if (arrows[0] == "up_pointingDown")	// show up direction arrow in down position
	{
		currentRing = "Down";
	}
	if (arrows[0] == "down_pointingUp")	// show down direction arrow in up position
	{
		currentRing = "Up";
	}
	if (arrows[0] == "down_pointingDown")	// show down direction arrow in down position
	{
		currentRing = "Down";
	}
	if (arrows[1] == "left_pointingRight")	// show up direction arrow in up position
	{
		currentRing += "Right";
	}
	if (arrows[1] == "right_pointingRight")	// show up direction arrow in up position
	{
		currentRing += "Right";
	}
	if (arrows[1] == "right_pointingLeft")	// show up direction arrow in up position
	{
		currentRing += "Left";
	}
	if (arrows[1] == "left_pointingLeft")	// show up direction arrow in up position
	{
		currentRing += "Left";
	}

	return currentRing;
}


function innerCreationOfArrowsArray(verticalMajorityOptions, horizontalMajorityOptions, verticalMinorityOptions,
		horizontalMinorityOptions, uniqueIndices) {
			var currentUniqueIndex = 0;
			var arrowsArray = new Array();
			var currentIndex = 0;
			var horizontal = Mathf.Floor(Random.Range(0,1.9));
			var vertical = Mathf.Floor(Random.Range(0,1.9));
			if (uniqueIndices[0] == 0) {
				arrowsArray.Push(new Array(verticalMinorityOptions[vertical], horizontalMinorityOptions[horizontal]));
				currentUniqueIndex++;
			}
			else {
				arrowsArray.Push(new Array(verticalMajorityOptions[vertical], horizontalMajorityOptions[horizontal]));
			}

			for (currentIndex = 1; currentIndex < arrowsAmount ; currentIndex ++ ) {
				var randomSelectionDone = false;
				while (randomSelectionDone == false) {
					vertical = Mathf.Floor(Random.Range(0,1.9));
					horizontal = Mathf.Floor(Random.Range(0,1.9));


					if (currentUniqueIndex < uniqueIndices.length && uniqueIndices[currentUniqueIndex] == currentIndex) {

						if (arrowsArray[currentIndex-1][0] != verticalMinorityOptions[vertical]
							 || arrowsArray[currentIndex-1][1] != horizontalMinorityOptions[horizontal]) {
							randomSelectionDone = true;

							arrowsArray.Push(new Array(verticalMinorityOptions[vertical],
							horizontalMinorityOptions[horizontal]));

							currentUniqueIndex++;
						}
				
					}
					else {
						if (arrowsArray[currentIndex-1][0] != verticalMajorityOptions[vertical]
							 || arrowsArray[currentIndex-1][1] != horizontalMajorityOptions[horizontal]) {
								randomSelectionDone = true;

								arrowsArray.Push(new Array(verticalMajorityOptions[vertical],
								horizontalMajorityOptions[horizontal]));
	
						}

					}

				}

			}
			return arrowsArray;
		}


//-----------------------//
//  UP
//-----------------------//
function Start() 
{	
	firstRingPassed = false;
	var ob = GameObject.Find("dataSaver");
	dataSaverScript = ob.GetComponent(dataSaver) as dataSaver; 

	parallelPortScript = dataSaverScript.getParallelsScript();


	var audioObjects: Component[];
	audioObjects = GetComponents(AudioSource);

	controlNbackScript.setPrefabRings(ringPrefab, centerPrefab);
	controlNbackScript.Start();
	isPractice = controlNbackScript.isPractice;
	controlNbackScript.initSounds(audioObjects);
	nLevel = dataSaverScript.getN();
	blockOrdinal = dataSaverScript.getType();
	stroopCondition = dataSaverScript.getStroopCondition();
	condition = dataSaverScript.condition;
	calibration = dataSaverScript.isCalibration;
	ringsAmountForCalibrationPhase = dataSaverScript.ringsAmountForCalibrationPhase;


	moveSpeed = dataSaverScript.moveSpeed;

	var arrowsArray = createArrowsArray(stroopCondition);


	// Stop update functions from running while we start up
	this.enabled = false;
	eyelinkScript = gameObject.AddComponent(eyelink); // to interface with eye tracker
	gameObject.AddComponent(Constants); // to get constants
	flightScript = gameObject.AddComponent(ControlFlight); // to enable flight controls


	// Get eyelink script for logging	
//	eyelinkScript = gameObject.GetComponent(eyelink); //gets eye position and records messages


	// CHANGED, FJ, 2015-05-11
	//lslBCIInputScript = gameObject.AddComponent(LSL_BCI_Input); // To interface with online BCI

	lslBCIInputScript = dataSaverScript.getLslScript();

	controlNbackScript.setLSL (lslBCIInputScript);



	// Configure the LSL module according to the values received from LevelLoader

	lslBCIInputScript.LSL_BCI_Recv_FB_Enabled        = LSL_BCI_Recv_FB_Enabled;
	lslBCIInputScript.LSL_BCI_Send_Markers_Enabled   = LSL_BCI_Send_Markers_Enabled;
	lslBCIInputScript.LSL_BCI_Send_Feedback_Enabled  = LSL_BCI_Send_Feedback_Enabled;
	lslBCIInputScript.LSL_BCI_Send_StickMvmt_Enabled = LSL_BCI_Send_StickMvmt_Enabled;
			
	// ---------------------------------------------------------
	
	//Load Photodiode textures
	WhiteSquare = Resources.Load("WHITESQUARE");
	BlackSquare = Resources.Load("BLACKSQUARE");



	//------- EYELINK
	// Decide on filename
	var temp_filename;
	if (record_EDF_file) {
		temp_filename = "NEDElast.edf"; //temporary filename on EyeLink computer - must be <=8 characters (not counting .edf)!	
	} else {
		temp_filename = ""; //means "do not record an edf file"
		EDF_filename = ""; //means "do not transfer an StartTracker file to this computer"
	}
	
	//Start eye tracker
	//print("--- subject: " + subject + "  session: " + session + " ---"); //print commands act as backup to eyelink logging/commands 
	var startOut = eyelinkScript.StartTracker(dataSaverScript.subjectNumber);
	eyelinkScript.SendToEEG(Constants.START_RECORDING);

	eyelinkScript.write("getTime");
	var t = eyelinkScript.getTime();
	lslBCIInputScript.setMarker ("eyeLinkTime_" + t);



	//yield WaitForSeconds(0.2);
	
	//Log experiment parameters

	eyelinkScript.write("subject: " + subject);
	eyelinkScript.write("session: " + session);
	eyelinkScript.write("Date: " + System.DateTime.Now);

	eyelinkScript.write("EDF_filename: " + EDF_filename);
	eyelinkScript.write("level: " + Application.loadedLevelName);
	eyelinkScript.write("trialTime: " + trialTime);
	
	eyelinkScript.write("routeFilename: " + routeFilename);
	eyelinkScript.write("ringDepth: " + ringDepth);
	
	eyelinkScript.write("isPhotodiodeUsed: " + isPhotodiodeUsed);
	eyelinkScript.write("photodiodeSize: " + photodiodeSize);
	eyelinkScript.write("syncDelay: " + syncDelay);


	eyelinkScript.write("driftAmplutude: " + driftAmplitude);
	eyelinkScript.write("minDriftDelay: " + minDriftDelay);
	eyelinkScript.write("maxDriftDelay: " + maxDriftDelay);

	eyelinkScript.write("controls.moveSpeed: " + moveSpeed);
	eyelinkScript.write("controls.pitchSpeed: " + pitchSpeed);
	eyelinkScript.write("controls.lockRoll: " + lockRoll);
	eyelinkScript.write("controls.lockXpos: " + lockXpos);

	eyelinkScript.write("controls.filterDelay: " + filterDelay);	
	eyelinkScript.write("controls.filterUpTime: " + filterUpTime);	
	eyelinkScript.write("controls.filterDownTime: " + filterDownTime);	
	
		
	eyelinkScript.write("screen.width: " + Screen.width);
	eyelinkScript.write("screen.height: " + Screen.height);
	eyelinkScript.write("eyelink.offset_x: " + offset_x);
	eyelinkScript.write("eyelink.offset_y: " + offset_y);
	eyelinkScript.write("eyelink.gain_x: " + gain_x);
	eyelinkScript.write("eyelink.gain_y: " + gain_y);
	eyelinkScript.write("----- END SESSION PARAMETERS -----");


	 //------- UPPER RIGHT RING LOCATIONS 	
	// Read in ring locations from text file
 	var upperRightRingInfo = ReadInPoints(routeFilename, 50.00, 50.00);
 	upperRightRingPositions = upperRightRingInfo[0];
 	ringWidths = upperRightRingInfo[1];
 	
	// Put rings in scene 	
	var upperCenterWidths2 = new Array();
	for(i=0;i<ringWidths.length;i++)
	{	
		upperCenterWidths2.Push(10.0);
	}

 	//------- LOWER RIGHT RING LOCATIONS 	
	// Read in ring locations from text file
 	var lowerRightRingInfo = ReadInPoints(routeFilename, -50.00, 50.00);
 	lowerRightRingPositions = lowerRightRingInfo[0];
 	//lowerRingWidths = lowerRingInfo[1];

	var lowerCenterWidths2 = new Array();
	for(i=0;i<ringWidths.length;i++)
	{	
		lowerCenterWidths2.Push(10.0);
	}


	//------- UPPER LEFT RING LOCATIONS 	
	// Read in ring locations from text file
 	var upperLeftRingInfo = ReadInPoints(routeFilename, 50.00, -50.00);
 	upperLeftRingPositions = upperLeftRingInfo[0];
 	ringWidths = upperLeftRingInfo[1];
 	
	// Put rings in scene 	
	for(i=0;i<ringWidths.length;i++)
	{	
		upperCenterWidths2.Push(10.0);
	}

 	//------- LOWER LEFT RING LOCATIONS 	
	// Read in ring locations from text file
 	var lowerLeftRingInfo = ReadInPoints(routeFilename, -50.00, -50.00);
 	lowerLeftRingPositions = lowerLeftRingInfo[0];
 	//lowerRingWidths = lowerRingInfo[1];

	for(i=0;i<ringWidths.length;i++)
	{	
		lowerCenterWidths2.Push(10.0);
	}


	// Put all rings in scene 

	var centerWidths: float[] = upperCenterWidths2.ToBuiltin(float) as float[]; 

	ringSize = dataSaverScript.getRingSize();
	if (ringSize == "big") {
		width = 90;
	}
	else if (ringSize == "medium") {
		width = 60;
	}
	else {
		width = 30;
	}

 	UpperRightRingArray = PlaceRings(centerPrefab,upperRightRingPositions, width, width, ringDepth, true);
 	LowerRightRingArray = PlaceRings(ringPrefab,lowerRightRingPositions, width, width, ringDepth, true);
 	UpperLeftRingArray = PlaceRings(centerPrefab,upperLeftRingPositions, width, width, ringDepth, true);
 	LowerLeftRingArray = PlaceRings(ringPrefab,lowerLeftRingPositions, width, width, ringDepth, true);
 	// RingArray = PlaceRings(ringPrefab,ringPositions, 110, ringWidths, ringDepth, areAllRingsVisible);
 	//CenterArray = PlaceRings(centerPrefab,ringPositions, centerWidths, centerWidths, centerDepth, areAllRingsVisible);
 	// initialize nextRingBounds
 	nextUpperRightRingBounds = ObjectInfo.ObjectBounds(UpperRightRingArray[iNextRing].gameObject);
 	nextLowerRightRingBounds = ObjectInfo.ObjectBounds(LowerRightRingArray[iNextRing].gameObject);
 	nextUpperLeftRingBounds = ObjectInfo.ObjectBounds(UpperLeftRingArray[iNextRing].gameObject);
 	nextLowerLeftRingBounds = ObjectInfo.ObjectBounds(LowerLeftRingArray[iNextRing].gameObject);

 	//------- FLIGHT CONTROLS 	
 	// pass parameters to flight control script


 	flightScript.speed = moveSpeed;
 	flightScript.pitchSpeed = pitchSpeed;
 	flightScript.lockRoll = lockRoll;
 	flightScript.lockXpos = lockXpos;
 	
	flightScript.driftAmplitude = driftAmplitude;
 	flightScript.minDriftDelay = minDriftDelay;
 	flightScript.maxDriftDelay = maxDriftDelay;

	flightScript.filterDelay = filterDelay;
	flightScript.filterUpTime = filterUpTime;
	flightScript.filterDownTime = filterDownTime;

	// Try to pause to allow to start recording!
	yield WaitForSeconds(3);

	currentBlockNumber = dataSaverScript.currentBlockIndex;
	// Changed, FJ, 20160403 - Send start marker with condition
	lslBCIInputScript.setMarker ("RunStart_Condition_" + condition + "_nLevel_" + nLevel + "_ringSize_" + ringSize + 
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition + "_isPractice_" + isPractice + "_blockNumber_"
		+ currentBlockNumber + "_speed_" + moveSpeed + "_subjectNumber_" + dataSaverScript.subjectNumber + 
		"_isBaseline_"  + dataSaverScript.getIsBaseline());
	// --------------------------------------------------------
	parallelPortScript.OutputToParallel(1);
	flightScript.setSpeed(moveSpeed);
	flightScript.StartFlight(controlNbackScript);
	SwitchArrowIfNeeded(iNextRing);
	changeCrossPositionIfNeeded(nextUpperLeftRingBounds.center, nextLowerLeftRingBounds.center,
 		nextUpperRightRingBounds.center, nextLowerRightRingBounds.center);
	
	//controlNbackScript.startNback();





	// Set trial end time
	trialEndTime = Time.time + trialTime;
	
	// allow update functions to run again
	this.enabled = true;
}

function Update() {
	
	//UPDATE TIME FOR THIS FRAME
	var t = eyelinkScript.getTime();

	// When the specified trial time has elapsed, end the trial.
	if (t > trialEndTime) {
		EndLevel();
		Application.LoadLevel("Loader"); //Go back to the Loader Scene
		return; //stop executing Update (to avoid, e.g., destroying things twice)
	}
	
	//SYNC EYELINK AND EEG
	if (t>syncTime) {
		//toggle parallel port output
		portIsSync = !portIsSync; 
		if (portIsSync) {
			eyelinkScript.write("sync");
		}
		//get next sync time
		syncTime = t + syncDelay;
	}

	// var carRotation = cam.transform.rotation.eulerAngles;
	// --------------------------------------------------------

	// Changed, FJ, 2016/08/04, Send plane position, HMD orientation via LSL

	lslBCIInputScript.sendFlightParams ( transform.position.x, transform.position.y, transform.position.z, 
	nextUpperRightRingBounds.center.x, nextUpperRightRingBounds.center.y, 
	nextUpperLeftRingBounds.center.x,  nextUpperLeftRingBounds.center.y,
	nextLowerRightRingBounds.center.x, nextLowerRightRingBounds.center.y, 
	nextLowerLeftRingBounds.center.x, nextLowerLeftRingBounds.center.y);


	// Check if subject has passed the next ring
	if (transform.position.z > nextUpperRightRingBounds.center.z) 
	{
		var ringBounds = null;
		if (currentRing == "UpRight") {
			ringBounds = nextUpperRightRingBounds;
		}
		else if (currentRing == "UpLeft") {
			ringBounds = nextUpperLeftRingBounds;
		}
		else if (currentRing == "DownRight") {
			ringBounds = nextLowerRightRingBounds;
		}
		else {
			ringBounds = nextLowerLeftRingBounds;
		}

		checkIfRingFailedAndSendTrigggers(ringBounds);
		iNextRing++;

		if(dataSaverScript.getIsCalibration() && (iNextRing % ringsAmountForCalibrationPhase) == 0) {
			moveSpeed = controlNbackScript.getSpeed();
			flightScript.speed = moveSpeed;
		}

		if (iNextRing >= arrowsArray.length) {
			iNextRing = 0;
		}

		SwitchArrowIfNeeded(iNextRing);

		 // increment the ring number
		ChangeVisibility(UpperRightRingArray[iNextRing],true);
		ChangeVisibility(LowerRightRingArray[iNextRing],true);
		nextUpperRightRingBounds = ObjectInfo.ObjectBounds(UpperRightRingArray[iNextRing].gameObject); // get new ring bounds
		nextLowerRightRingBounds = ObjectInfo.ObjectBounds(LowerRightRingArray[iNextRing].gameObject); // get new ring bounds
		nextUpperLeftRingBounds = ObjectInfo.ObjectBounds(UpperLeftRingArray[iNextRing].gameObject); // get new ring bounds
		nextLowerLeftRingBounds = ObjectInfo.ObjectBounds(LowerLeftRingArray[iNextRing].gameObject);

		changeCrossPositionIfNeeded(nextUpperLeftRingBounds.center, nextLowerLeftRingBounds.center,
		 nextUpperRightRingBounds.center, nextLowerRightRingBounds.center);

		firstRingPassed = true;
	}
}

function checkIfRingFailedAndSendTrigggers(ringBounds) {
	if (transform.position.y < ringBounds.min.y || transform.position.y > ringBounds.max.y  ||
		transform.position.x < ringBounds.min.x || transform.position.x > ringBounds.max.x)
	{
		eyelinkScript.write("RingFailed");
		//lslBCIInputScript.setMarker (currentRing + "Fail_Size_" + Mathf.Abs(ringBounds.max.y - ringBounds.min.y));
		var ringSize = Mathf.Abs(ringBounds.max.y - ringBounds.min.y);
		lslBCIInputScript.setMarker("RingFailed_Condition_" + condition + "_nLevel_" + nLevel + "_ringSize_" + ringSize + 

		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition + "_isPractice_" + isPractice);	

		controlNbackScript.setRingFailure();

		return true;
	}
	else {
		eyelinkScript.write("RingPassed");
		sendTriggerRingPassed(ringBounds);
		controlNbackScript.setRingSuccess();
		return false;
	}
}

function sendTriggerRingPassed(ringBounds) {
	if (iNextRing <= ( LowerRightRingArray.length-1 ) )
	{
		var ringSize = Mathf.Abs(ringBounds.max.y - ringBounds.min.y);
		lslBCIInputScript.setMarker("RingPassed_Condition_" + condition + "_nLevel_" + nLevel + "_ringSize_" + ringSize + 
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition + "_isPractice_" + isPractice);

	}
}


// ADDED, FJ, 2015-05-11
// Inserts a specific stick movement event depending on the
// size of the next ring. This is in addition to the regular stick
// movement event triggered in ControlFlight.
function sendMarkerWithRingSize ( sMarkerName : String )
{
	// Debug.Log ("# DBG: In SendMarkerWithRingSize!!");

	// CHANGED, FJ, 2015-05-11
	// Annotate the size of the next ring to the marker string passed as argument
	// and inject the resulting marker into the data stream via the labstreaminglayer framework.
	//lslBCIInputScript.setMarker ( sMarkerName + "_Size_" + Mathf.Abs(nextUpperRightRingBounds.max.y - nextUpperRightRingBounds.min.y));
}

function setMarkerForControlFlight ( sMarkerName : String )
{
	lslBCIInputScript.setMarker(sMarkerName);
	// Debug.Log ("# DBG: In SendMarkerWithRingSize!!");

	// CHANGED, FJ, 2015-05-11
	// Annotate the size of the next ring to the marker string passed as argument
	// and inject the resulting marker into the data stream via the labstreaminglayer framework.
	//lslBCIInputScript.setMarker ( sMarkerName + "_Size_" + Mathf.Abs(nextUpperRightRingBounds.max.y - nextUpperRightRingBounds.min.y));
}

function setMarkerForPitch ( fNewPitch : double )
{
	lslBCIInputScript.sendStickMvmtPitch ( fNewPitch );
	// Debug.Log ("# DBG: In SendMarkerWithRingSize!!");

	// CHANGED, FJ, 2015-05-11
	// Annotate the size of the next ring to the marker string passed as argument
	// and inject the resulting marker into the data stream via the labstreaminglayer framework.
	//lslBCIInputScript.setMarker ( sMarkerName + "_Size_" + Mathf.Abs(nextUpperRightRingBounds.max.y - nextUpperRightRingBounds.min.y));
}

function setMarkerForYaw ( fNewPitch : double )
{
	lslBCIInputScript.sendStickMvmtYaw ( fNewPitch );
	// Debug.Log ("# DBG: In SendMarkerWithRingSize!!");

	// CHANGED, FJ, 2015-05-11
	// Annotate the size of the next ring to the marker string passed as argument
	// and inject the resulting marker into the data stream via the labstreaminglayer framework.
	//lslBCIInputScript.setMarker ( sMarkerName + "_Size_" + Mathf.Abs(nextUpperRightRingBounds.max.y - nextUpperRightRingBounds.min.y));
}

function changeCrossPositionIfNeeded(leftUpper, leftLower, rightUpper, rightLower) {
	if (!dataSaverScript.getIsBaseline()) {
		crossScript.Hide();
		return;
	}
	crossScript.Show();
	if (currentRing == "UpLeft") {
		crossScript.ChangePosition(leftUpper);
	}
	if (currentRing == "UpRight") {
		crossScript.ChangePosition(rightUpper);
	}
	if (currentRing == "DownLeft") {
		crossScript.ChangePosition(leftLower);

	}
	if (currentRing == "DownRight") {
		crossScript.ChangePosition(rightLower);
	}

}

function SwitchArrowIfNeeded(ringIndex)
{	
	if (arrowsArray.length <= ringIndex) {
		return;
	}
	currentArrow = arrowsArray[ringIndex];
	if (currentArrow[0] == "up_pointingUp")	// show up direction arrow in up position
	{
		currentRing = "Up";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,10.0,0.0);
			upArrowDirecionScript.ChangePosition(position);
			upArrowDirecionScript.Show();
			downArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("up_pointingUp_Arrow");
		}
	}
	if (currentArrow[0] == "up_pointingDown")	// show up direction arrow in down position
	{
		currentRing = "Down";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,10.0,0.0);
			downArrowDirecionScript.ChangePosition(position);
			downArrowDirecionScript.Show();
			upArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("up_pointingDown");
		}
	}
	if (currentArrow[0] == "down_pointingUp")	// show down direction arrow in up position
	{
		currentRing = "Up";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,-10.0,0.0);
			upArrowDirecionScript.ChangePosition(position);
			upArrowDirecionScript.Show();
			downArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("down_pointingUp");
		}
	}
	if (currentArrow[0] == "down_pointingDown")	// show down direction arrow in down position
	{
		currentRing = "Down";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,-10.0,0.0);
			downArrowDirecionScript.ChangePosition(position);
			upArrowDirecionScript.Hide();
			downArrowDirecionScript.Show();
			lslBCIInputScript.setMarker("down_pointingDown");
		}
	}
	if (currentArrow[1] == "left_pointingRight")	// show up direction arrow in up position
	{
		currentRing += "Right";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(-15,0,0.0);
			rightArrowDirecionScript.ChangePosition(position);
			rightArrowDirecionScript.Show();
			leftArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("left_pointingRight");
		}
	}
	if (currentArrow[1] == "right_pointingRight")	// show up direction arrow in up position
	{
		currentRing += "Right";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(15,0,0.0);
			rightArrowDirecionScript.ChangePosition(position);
			rightArrowDirecionScript.Show();
			leftArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("right_pointingRight");
		}
	}
	if (currentArrow[1] == "right_pointingLeft")	// show up direction arrow in up position
	{
		currentRing += "Left";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(15,0,0.0);
			leftArrowDirecionScript.ChangePosition(position);
			leftArrowDirecionScript.Show();
			rightArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("right_pointingLeft");
		}
	}
	if (currentArrow[1] == "left_pointingLeft")	// show up direction arrow in up position
	{
		currentRing += "Left";
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(-15,0,0.0);
			leftArrowDirecionScript.ChangePosition(position);
			leftArrowDirecionScript.Show();
			rightArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("left_pointingLeft");
		}
	}


}

//---END THE LEVEL AND DO CLEANUP
//This function is called during the Update function, or by a helper script.
function EndLevel() 
{
	// Changed, FJ, 20160403 - Send start marker with condition
	lslBCIInputScript.setMarker ("RunEnd_Condition_" + condition + "_level_" + nLevel + "_ringSize_" + ringSize +
		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition + "_isPractice_" + isPractice);
	// --------------------------------------------------------

	//Compute Performance
	courseCompleted = ((iNextRing)*100/UpperRightRingArray.length);
	
	var sum = 0;
	for (var i=0; i<ringAccuracy.length; i++) 
	{ 
		sum += ringAccuracy[i];
	}
	
	if (ringAccuracy.length>0) 
	{
		courseAccuracy = 100 - sum/ringAccuracy.length;
	} 
	else 
	{
		courseAccuracy = 0;
	}
	
	//loaderScript.courseCompleted = courseCompleted.ToString();
	//loaderScript.courseAccuracy = courseAccuracy.ToString();


	// Changed, FJ, 20160915 - Print end percentage, set marker with End Percentage!!

	//print ( "\n#########################################\n\n" );

	//print ( "\n # RESULT: Course completed >> " + loaderScript.courseCompleted + "% <<" );

	//print ( "\n#########################################\n\n" );

	//lslBCIInputScript.setMarker ("Run_End_Comp_" + loaderScript.courseCompleted );
	//lslBCIInputScript.setMarker ("Run_End_Cond_" + expCondition + "_Comp_" + loaderScript.courseCompleted );

	// --------------------------------------------------------


	// Changed, FJ, 20160915 - Write results to CSV file!

	var t: System.DateTime = System.DateTime.Now;

	//var filePath = "C:/_DATA/BF_CLoop_02_Main/Res_Times_Sub_" + subject + "_" + String.Format("{0:D4}{1:D2}{2:D2}",t.Year,t.Month,t.Day) + ".csv";

    //var sw : StreamWriter = new StreamWriter ( filePath, true );

   // sw.WriteLine ( "" + String.Format("{0:D4}_{1:D2}_{2:D2}_{3:D2}_{4:D2}_{5:D2}",t.Year,t.Month,t.Day,t.Hour,t.Minute,t.Second) + ",   Sub"  + subject + ",   Cond" + expCondition + ",   " + routeFilename + ",   " + loaderScript.courseCompleted + "%,   " + loaderScript.courseAccuracy + "%" );

    //sw.Flush ( );
    //sw.Close ( );

	// --------------------------------------------------------

																		
	//disable updates
	this.enabled=false;
	flightScript.enabled = false;
	//Log what we're doing
	eyelinkScript.write("----- END TRIAL -----");
//	yield WaitForSeconds(0.2);
	eyelinkScript.SendToEEG(Constants.END_RECORDING);
//	yield WaitForSeconds(0.2);
//	DestroyAll(); //Clean up objects
	// Close the tracker and log files (important for saving!)
	eyelinkScript.StopTracker(EDF_filename); //transfer file to current directory with given filename
	//Application.LoadLevel("Loader"); //Go back to the Loader Scene

	/*
	var canvasStress = GameObject.Find ("Canvas_stress");
	if (canvasStress) {
		var rendererStress = canvasStress.GetComponent(CanvasGroup) as CanvasGroup;
		rendererStress.alpha = 1f;
		rendererStress.blocksRaycasts = true;
		canvasStress.setActive(true);
	}
	else {
		SceneManagement.SceneManager.LoadScene ("stress_evaluation");
	}*/

	if (dataSaverScript.getIsPractice() == true) {
		dataSaverScript.updateBlockIndex();
		SceneManagement.SceneManager.LoadScene ("successRates");
	}
	else {
		dataSaverScript.updateBlockIndex();	
		SceneManagement.SceneManager.LoadScene ("stress_evaluation");
	}

}

//---END THE LEVEL MANUALLY
//This program is called if the user ends the level by pressing the play button or closing the window
function OnApplicationQuit() 
{ 
	EndLevel(); //Still do cleanup/exit script so our data is saved properly.
}


//-----------------------//
// Read in 3D points from MATLAB
//-----------------------//
function ReadInPoints(fileName: String, heightToAdd: float, horizontalToAdd: float) 
{
	// set up
	var txtPoints = new Array();
	var txtWidths = new Array();
	
	// read in all text
	var sr = new StreamReader(fileName);
 	var fileContents = sr.ReadToEnd();
 	sr.Close();
 	// split into lines
 	fileContents = fileContents.Replace("\r\n","\n"); // Resolve Mac/PC difference in carriage returns
 	var lines = fileContents.Split("\n"[0]);
 	
 	// parse out info from lines
    for (line in lines) {

 		// Parse Line
		var valSegs:String[]=line.Split("\t"[0]);
		if (valSegs.length>2) 
		{
			var xStr = valSegs[0];	
	       	var yStr = valSegs[1];
	       	var zStr = valSegs[2];

	       	var widthString = valSegs[3];
	       	// TRACING of raw (x,y,z)
//	      	Debug.Log("xStr: " + xStr + ", yStr: " + yStr + ", zStr: " + zStr);
	       	txtPoints.Push(Vector3(float.Parse(xStr)+horizontalToAdd,float.Parse(yStr)+heightToAdd,float.Parse(zStr)));
	       	txtWidths.Push(float.Parse(widthString));
		}
     }

	var vecPoints: Vector3[] = txtPoints.ToBuiltin(Vector3) as Vector3[];
	var vecWidths: float[] = txtWidths.ToBuiltin(float) as float[];
	return [vecPoints, vecWidths];
}



//-----------------------//
// Place rings at given points and log their positions
//-----------------------//
function PlaceRings(prefabObj: Transform, positions: Vector3[], ringWidth: float, ringHeight: float, ringDepthConstant: float, isVisible: boolean) {
	
	// eyelinkScript must be initialized before this function is called (TO DO: insert check for this)
	//eyelinkScript.write("----- LOAD TRIAL -----");
	AllRings = new Array();
	for (i=0;i<positions.length;i++) {
		//renderer = prefabObj.GetComponent('Renderer').material.color = color;
		//eyelinkScript.write("Created Object # " + (i+1) + " Ring Ring Ring " + positions[i] + " (" + ringWidth + ", " + ringHeight + ", " + ringDepth + ", 0)"); //"Ring Ring Ring" 
		thisRing = Instantiate(prefabObj, positions[i], Quaternion.identity); // place ring in sceneindicates name/type/tag are all "Ring"

		//renderer.material.color.r = color.r;
		//renderer.material.color.g = color.g;
		//renderer.material.color.b = color.b;
		thisRing.transform.localScale = Vector3(ringWidth,ringHeight,ringDepthConstant); // scale to match specified width/height/depth
		ChangeVisibility(thisRing,isVisible);
		AllRings.Push(thisRing); // keep track of rings in scene
	}
	//eyelinkScript.write("----- START TRIAL -----");
	return AllRings;
}

//-----------------------//
// Make an object visible or invisible
//-----------------------//
function ChangeVisibility(thisObject: Object, makeVisible: boolean)  { 
	var renderers = thisObject.GetComponentsInChildren(MeshRenderer);
	var success = 0;
	if (renderers!=null && renderers.length>0) {
		for (var thisRenderer : MeshRenderer in renderers) {
			thisRenderer.enabled = makeVisible;
		}
		success = 1;
	} 
	return success;
	
	
}

//-----------------------//
// Place photodiode square in upper right corner
//-----------------------//
function OnGUI () {
	if (isPhotodiodeUsed) { // only if subject asked for photodiode square
		//toggle color of square
		if (portIsSync) {
			GUI.DrawTexture(Rect(Screen.width-photodiodeSize,-3,photodiodeSize,photodiodeSize), WhiteSquare, ScaleMode.ScaleToFit, false);
		} else {
			GUI.DrawTexture(Rect(Screen.width-photodiodeSize,-3,photodiodeSize,photodiodeSize), BlackSquare, ScaleMode.ScaleToFit, false);
		}
	}
}



//-----------------------//
// Log Positions
//-----------------------//
function LateUpdate () {


	//Log Camera Position (truncate to 2 decimals) and rotation (don't truncate)
	eyelinkScript.write("Camera at (" + transform.position.x.ToString("F2") + ", " + transform.position.y.ToString("F2") + ", " + transform.position.z.ToString("F2") + ")  rotation (" + transform.rotation.x + ", " + transform.rotation.y + ", " + transform.rotation.z +", " + transform.rotation.w + ")");	
	
	//Log Eye Position (truncate to 2 decimals)
	eyelinkScript.UpdateEye_fixupdate();	
	eyelinkScript.write("Eye at (" + eyelinkScript.x.ToString("F2") + ", " + eyelinkScript.y.ToString("F2") + ")");
	
}