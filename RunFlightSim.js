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
var fixation: Sprite;


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
	startTime = Time.time;
	print('startBlock4');
	print(startTime);
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

	 // to get constants
	if (nLevel != "0") {
		gameObject.AddComponent(Constants);
		flightScript = gameObject.AddComponent(ControlFlight); // to enable flight controls
	}


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
	
	ringSize = dataSaverScript.getRingSize();
	if (nLevel != "0") {
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
	}
	// Try to pause to allow to start recording!
	crossScript.Show();
	yield WaitForSeconds(3);
	controlNbackScript.setStartMarker ();
	currentBlockNumber = dataSaverScript.currentBlockIndex;
	// Changed, FJ, 20160403 - Send start marker with condition

	// --------------------------------------------------------
	parallelPortScript.OutputToParallel(1);
	if (nLevel == "0") {
		crossScript.Show();
		return;
	}
	else {
		crossScript.Hide();
	}
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
	if (nLevel == "0") {
		return;
	}

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
		endTime = Time.time;
		print('EndBlock4');
		print(endTime);
		startTrialTime = Time.time;
	}
}

function checkIfRingFailedAndSendTrigggers(ringBounds) {
	if (transform.position.y < ringBounds.min.y || transform.position.y > ringBounds.max.y  ||
		transform.position.x < ringBounds.min.x || transform.position.x > ringBounds.max.x)
	{

		//lslBCIInputScript.setMarker (currentRing + "Fail_Size_" + Mathf.Abs(ringBounds.max.y - ringBounds.min.y));
		var ringSize = Mathf.Abs(ringBounds.max.y - ringBounds.min.y);
		lslBCIInputScript.setMarker("RingFailed_Condition_" + condition + "_nLevel_" + nLevel + "_ringSize_" + ringSize + 

		"_blockOrdinal_" + blockOrdinal + "_stroopCondition_" + stroopCondition + "_isPractice_" + isPractice);	

		controlNbackScript.setRingFailure();

		return true;
	}
	else {

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

	if(UpperRightRingArray && UpperRightRingArray.length > 0) {
	//Compute Performance
		courseCompleted = ((iNextRing)*100/UpperRightRingArray.length);
	}

	if (ringAccuracy) {
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
	}

																		
	//disable updates
	this.enabled=false;
	if(flightScript) {
		flightScript.enabled = false;
	}

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

	if (nLevel == "0") {
		
		return;
	}

	
}