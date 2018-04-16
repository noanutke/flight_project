// RunFlightSim.js
//
// - This script places an object in each of the locations designated bin a text file.
// - This script creates a ControlFlight script and passes speed/control parameters to it
//   from the loader GUI.

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


import System.IO;

//-----------------------//
// DECLARE VARIABLES
//-----------------------//

//---DECLARE GLOBAL VARIABLES

// Declare scripts used by this script
var controlNbackScript: ControlNback;
var dataSaverScript: dataSaver;
var upArrowDirecionScript: changeUpDirectionArrow;
var downArrowDirecionScript: changeDownDirectionArrow;
var leftArrowDirecionScript: changeLeftDirectionArrow;
var rightArrowDirecionScript: changeRightDirectionArrow;
var crossScript: crossControl;
var flightScript; // the script that allows the subject to control the flight
var lslBCIInputScript; // Online communication with the BCI, here mainly to set markers

var currentRing = "";	// current ring to pass through
var width = 0;	// rings width
var positivePosition = 50.00; // position for "positive" rings in both axes (y position for upper rings and x position for right rings)
var negativePosition = -50.00; // position for "negative" rings in both axes (y position for lower rings and x position for left rings)
var bigRingSize = 90;
var mediumRingSize = 60;
var smallRingSize = 30;
var routeFilename = "";

var prefabUpperRings: Transform;
var prefabLowerRings: Transform;

var ringDepth = 10.0;
var areAllRingsVisible = true;

// Control flight Parameters
var moveSpeed = 180.0; //motion speed
var pitchSpeed = 100.0; //for turning (vertically)
var lockRoll = true;
var lockXpos = false;

var driftAmplitude = 1.0; // max drift amplitude
var minDriftDelay = 3.0; //min time between brake events
var maxDriftDelay = 10.0; //max time between brake events

var filterDelay = 0.0;
var filterUpTime = 0.0;
var filterDownTime = 0.0;

private var UpperRightRingArray: Array;
private var LowerRightRingArray: Array;
private var UpperLeftRingArray: Array;
private var LowerLeftRingArray: Array;
private var nextUpperRightRingBounds: Bounds;
private var nextLowerRightRingBounds: Bounds;
private var nextUpperLeftRingBounds: Bounds;
private var nextLowerLeftRingBounds: Bounds;
private var iNextRing = 0;


private var withFlight;
private var ringSize;
private var isCalibration;
private var ringsAmountForCalibrationPhase;

private var arrowsAmount = 420;
private var arrowsArray = new Array();

// This method creates the arrows array
function createArrowsArray() {
	var congOptionsVertical = new Array("up_pointingUp", "down_pointingDown");
	var congOptionsHorizontal = new Array("right_pointingRight", "left_pointingLeft");
	var incongOptionsVertical = new Array("up_pointingDown", "down_pointingUp");
	var incongOptionsHorizontal = new Array("left_pointingRight", "right_pointingLeft");

	// choose 2 indices in the arrows array to contain the congruent trials
	var uniqueIndices = new Array();
	var finishedRandomSelection = false;
	while (finishedRandomSelection == false) {
		// choose indices only in the range of 0-8 so that even subjects that fly in low speed will 
		// experience 2 congruent trials (the minimum flight speed is assumed to be 170 - which guarantees above 9 rings)
		var index = Mathf.Floor(Random.Range(0.0,10));
		if (uniqueIndices.length > 0) {
			// make sure that we haven't chose this index already
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

	arrowsArray = innerCreationOfArrowsArray(incongOptionsVertical, incongOptionsHorizontal, congOptionsVertical,
		congOptionsHorizontal, uniqueIndices);

	return arrowsArray;
}


// The majority and minority parameters to this function are related to congruent and incongruent blocks.
// If we are in an incongruent block (all of our blocks are incongruent in this version of the task) then
// the minority of the rings will be congruent and vise versa.
function innerCreationOfArrowsArray(verticalMajorityOptions, horizontalMajorityOptions, verticalMinorityOptions,
		horizontalMinorityOptions, uniqueIndices) {
		var arrowsArray = new Array();
		var currentUniqueIndex = 0;
		var currentIndexInArrowsArray= 0;

		// Randomaly choose an arrow out of the 2 options we have for each axis
		var horizontal = Mathf.Floor(Random.Range(0,2));
		var vertical = Mathf.Floor(Random.Range(0,2));
		if (uniqueIndices[0] == 0) {
			arrowsArray.Push(new Array(verticalMinorityOptions[vertical], horizontalMinorityOptions[horizontal]));
			currentUniqueIndex++;
		}
		else {
			arrowsArray.Push(new Array(verticalMajorityOptions[vertical], horizontalMajorityOptions[horizontal]));
		}

		for (currentIndexInArrowsArray = 1; currentIndexInArrowsArray < arrowsAmount ; currentIndexInArrowsArray ++ ) {
			var randomSelectionDone = false;
			while (randomSelectionDone == false) {
				// Randomaly choose an arrow out of the 2 options we have for each axis
				vertical = Mathf.Floor(Random.Range(0,2));
				horizontal = Mathf.Floor(Random.Range(0,2));

				// check if this ring is a minority ring (in our version of the task - that means that this ring is congruent)
				if (currentUniqueIndex < uniqueIndices.length && uniqueIndices[currentUniqueIndex] == currentIndexInArrowsArray) {
					// We must not use the same 2 arrows in 2 consecutive rings
					if (updateRingFromArrow(arrowsArray[currentIndexInArrowsArray-1]) != 
						updateRingFromArrow(new Array(verticalMinorityOptions[vertical],
						horizontalMinorityOptions[horizontal]))) {
							randomSelectionDone = true;
							arrowsArray.Push(new Array(verticalMinorityOptions[vertical],
							horizontalMinorityOptions[horizontal]));
							currentUniqueIndex++;
					}
			
				}
				else {	// this ring is not a minority ring (so in our version of the task - it is incongruent)
					// We must not use the same 2 arrows in 2 consecutive rings
					if (updateRingFromArrow(arrowsArray[currentIndexInArrowsArray-1]) != 
						updateRingFromArrow(new Array(verticalMajorityOptions[vertical],
						horizontalMajorityOptions[horizontal]))) {
							randomSelectionDone = true;						
							arrowsArray.Push(new Array(verticalMajorityOptions[vertical],
							horizontalMajorityOptions[horizontal]));
					}					
				}
			}
		}
		return arrowsArray;
}


function Start() 
{	
	routeFilename = Application.dataPath + "/SSL.txt";
	// Stop update functions from running while we start up
	this.enabled = false;

	var ob = GameObject.Find("dataSaver");
	dataSaverScript = ob.GetComponent(dataSaver) as dataSaver; 

	// initialize nBack script
	var audioObjects: Component[];
	audioObjects = GetComponents(AudioSource);
	controlNbackScript.setPrefabRings(prefabLowerRings, prefabUpperRings);
	controlNbackScript.Start();
	controlNbackScript.initSounds(audioObjects);
	lslBCIInputScript = dataSaverScript.getLslScript();
	controlNbackScript.setLSL (lslBCIInputScript);

	// get this block parameters from dataSaver
	withFlight = dataSaverScript.getWithFlight();
	isCalibration = dataSaverScript.isCalibration;
	ringsAmountForCalibrationPhase = dataSaverScript.ringsAmountForCalibrationPhase;
	moveSpeed = dataSaverScript.moveSpeed;
	ringSize = dataSaverScript.getRingSize();
	currentBlockNumber = dataSaverScript.currentBlockIndex;

	arrowsArray = createArrowsArray();

	if (withFlight == true) {
		flightScript = gameObject.AddComponent(ControlFlight); // to enable flight controls
	}

	if (withFlight == true) {
		/*START - Initialize rings*/

		//------- UPPER RIGHT RING LOCATIONS 	
		// Read in ring locations from text file
	 	var upperRightRingInfo = ReadInPoints(routeFilename, positivePosition, positivePosition);
	 	upperRightRingPositions = upperRightRingInfo[0];

	 	//------- LOWER RIGHT RING LOCATIONS 	
		// Read in ring locations from text file
	 	var lowerRightRingInfo = ReadInPoints(routeFilename, negativePosition, positivePosition);
	 	lowerRightRingPositions = lowerRightRingInfo[0];

		//------- UPPER LEFT RING LOCATIONS 	
		// Read in ring locations from text file
	 	var upperLeftRingInfo = ReadInPoints(routeFilename, positivePosition, negativePosition);
	 	upperLeftRingPositions = upperLeftRingInfo[0];

	 	//------- LOWER LEFT RING LOCATIONS 	
		// Read in ring locations from text file
	 	var lowerLeftRingInfo = ReadInPoints(routeFilename, negativePosition, negativePosition);
	 	lowerLeftRingPositions = lowerLeftRingInfo[0];

		if (ringSize == "big") {
			width = bigRingSize;
		}
		else if (ringSize == "medium") {
			width = mediumRingSize;
		}
		else {
			width = smallRingSize;
		}

	 	UpperRightRingArray = PlaceRings(prefabUpperRings,upperRightRingPositions, width, width, ringDepth, true);
	 	LowerRightRingArray = PlaceRings(prefabLowerRings,lowerRightRingPositions, width, width, ringDepth, true);
	 	UpperLeftRingArray = PlaceRings(prefabUpperRings,upperLeftRingPositions, width, width, ringDepth, true);
	 	LowerLeftRingArray = PlaceRings(prefabLowerRings,lowerLeftRingPositions, width, width, ringDepth, true);

	 	nextUpperRightRingBounds = ObjectInfo.ObjectBounds(UpperRightRingArray[iNextRing].gameObject);
	 	nextLowerRightRingBounds = ObjectInfo.ObjectBounds(LowerRightRingArray[iNextRing].gameObject);
	 	nextUpperLeftRingBounds = ObjectInfo.ObjectBounds(UpperLeftRingArray[iNextRing].gameObject);
	 	nextLowerLeftRingBounds = ObjectInfo.ObjectBounds(LowerLeftRingArray[iNextRing].gameObject);

	 	/*END - Initialize rings*/


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

	if (withFlight == false) {
		crossScript.Show();
		return;
	}
	else {
		crossScript.Hide();
	}
	flightScript.setSpeed(moveSpeed);
	flightScript.StartFlight(controlNbackScript);

	// Place first ring's arrows
	updateRingFromArrow(arrowsArray[iNextRing]);
	SwitchArrowIfNeeded(iNextRing);
	changeCrossPositionIfNeeded(nextUpperLeftRingBounds.center, nextLowerLeftRingBounds.center,
 		nextUpperRightRingBounds.center, nextLowerRightRingBounds.center);

	// Enable update functions again
	this.enabled = true;
}

function Update() {
	if (withFlight == false) {
		return;
	}

	// send locations of plane and rings to lsl stream
	lslBCIInputScript.sendFlightParams ( transform.position.x, transform.position.y, transform.position.z, 
	nextUpperRightRingBounds.center.x, nextUpperRightRingBounds.center.y, 
	nextUpperLeftRingBounds.center.x,  nextUpperLeftRingBounds.center.y,
	nextLowerRightRingBounds.center.x, nextLowerRightRingBounds.center.y, 
	nextLowerLeftRingBounds.center.x, nextLowerLeftRingBounds.center.y);

	// Check if subject has passed the next ring
	if (transform.position.z > nextUpperRightRingBounds.center.z) 
	{
		var ringBounds = getCurrentRingBounds();
		checkIfRingFailedAndSendTrigggers(ringBounds);
		iNextRing++;

		// Update speed if needed
		if(dataSaverScript.getIsCalibration() && (iNextRing % ringsAmountForCalibrationPhase) == 0) {
			moveSpeed = controlNbackScript.getSpeed();
			flightScript.speed = moveSpeed;
		}

		nextUpperRightRingBounds = ObjectInfo.ObjectBounds(UpperRightRingArray[iNextRing].gameObject); // get new ring bounds
		nextLowerRightRingBounds = ObjectInfo.ObjectBounds(LowerRightRingArray[iNextRing].gameObject); // get new ring bounds
		nextUpperLeftRingBounds = ObjectInfo.ObjectBounds(UpperLeftRingArray[iNextRing].gameObject); // get new ring bounds
		nextLowerLeftRingBounds = ObjectInfo.ObjectBounds(LowerLeftRingArray[iNextRing].gameObject);

		updateRingFromArrow(arrowsArray[iNextRing]);
		SwitchArrowIfNeeded(iNextRing);
		changeCrossPositionIfNeeded(nextUpperLeftRingBounds.center, nextLowerLeftRingBounds.center,
		 nextUpperRightRingBounds.center, nextLowerRightRingBounds.center);

		
	}
}

function getCurrentRingBounds() {
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
	return ringBounds;
}

function checkIfRingFailedAndSendTrigggers(ringBounds) {
	if (transform.position.y < ringBounds.min.y || transform.position.y > ringBounds.max.y  ||
		transform.position.x < ringBounds.min.x || transform.position.x > ringBounds.max.x)
	{
		lslBCIInputScript.setMarker("ring_passed_0");	
		controlNbackScript.setRingFailure();
	}
	else {
		lslBCIInputScript.setMarker("ring_passed_1");
		controlNbackScript.setRingSuccess();
	}
}

function setMarkerForControlFlight ( sMarkerName : String )
{
	lslBCIInputScript.setMarker(sMarkerName);
}

function setMarkerForPitch ( fNewPitch : double )
{
	lslBCIInputScript.sendStickMvmtPitch ( fNewPitch );

}

function setMarkerForYaw ( fNewPitch : double )
{
	lslBCIInputScript.sendStickMvmtYaw ( fNewPitch );

}

// Show cross in the correct ring if we are in a baseline condition
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

function updateRingFromArrow(currentArrow) {
	if (currentArrow[0] == "up_pointingUp")	// show up direction arrow in up position
	{
		currentRing = "Up";
	}
	if (currentArrow[0] == "up_pointingDown")	// show up direction arrow in down position
	{
		currentRing = "Down";
	}
	if (currentArrow[0] == "down_pointingUp")	// show down direction arrow in up position
	{
		currentRing = "Up";
	}
	if (currentArrow[0] == "down_pointingDown")	// show down direction arrow in down position
	{
		currentRing = "Down";
	}
	if (currentArrow[1] == "left_pointingRight")	// show up direction arrow in up position
	{
		currentRing += "Right";
	}
	if (currentArrow[1] == "right_pointingRight")	// show up direction arrow in up position
	{
		currentRing += "Right";
	}
	if (currentArrow[1] == "right_pointingLeft")	// show up direction arrow in up position
	{
		currentRing += "Left";
	}
	if (currentArrow[1] == "left_pointingLeft")	// show up direction arrow in up position
	{
		currentRing += "Left";
	}
	return currentRing;
}

function SwitchArrowIfNeeded(ringIndex)
{	
	if (arrowsArray.length <= ringIndex) {
		return;
	}
	currentArrow = arrowsArray[ringIndex];
	if (currentArrow[0] == "up_pointingUp")	// show up direction arrow in up position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,10.0,0.0);
			upArrowDirecionScript.ChangePosition(position);
			upArrowDirecionScript.Show();
			downArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("arrow_location_u_direction_u");
		}
	}
	if (currentArrow[0] == "up_pointingDown")	// show up direction arrow in down position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,10.0,0.0);
			downArrowDirecionScript.ChangePosition(position);
			downArrowDirecionScript.Show();
			upArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("arrow_location_u_direction_d");
		}
	}
	if (currentArrow[0] == "down_pointingUp")	// show down direction arrow in up position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,-10.0,0.0);
			upArrowDirecionScript.ChangePosition(position);
			upArrowDirecionScript.Show();
			downArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("arrow_location_d_direction_u");
		}
	}
	if (currentArrow[0] == "down_pointingDown")	// show down direction arrow in down position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(0.0,-10.0,0.0);
			downArrowDirecionScript.ChangePosition(position);
			upArrowDirecionScript.Hide();
			downArrowDirecionScript.Show();
			lslBCIInputScript.setMarker("arrow_location_d_direction_d");
		}
	}
	if (currentArrow[1] == "left_pointingRight")	// show up direction arrow in up position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(-15,0,0.0);
			rightArrowDirecionScript.ChangePosition(position);
			rightArrowDirecionScript.Show();
			leftArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("arrow_location_l_direction_r");
		}
	}
	if (currentArrow[1] == "right_pointingRight")	// show up direction arrow in up position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(15,0,0.0);
			rightArrowDirecionScript.ChangePosition(position);
			rightArrowDirecionScript.Show();
			leftArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("arrow_location_r_direction_r");
		}
	}
	if (currentArrow[1] == "right_pointingLeft")	// show up direction arrow in up position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(15,0,0.0);
			leftArrowDirecionScript.ChangePosition(position);
			leftArrowDirecionScript.Show();
			rightArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("arrow_location_r_direction_l");
		}
	}
	if (currentArrow[1] == "left_pointingLeft")	// show up direction arrow in up position
	{
		if (!dataSaverScript.getIsBaseline()) {
			position = Vector3(-15,0,0.0);
			leftArrowDirecionScript.ChangePosition(position);
			leftArrowDirecionScript.Show();
			rightArrowDirecionScript.Hide();
			lslBCIInputScript.setMarker("arrow_location_l_direction_l");
		}
	}
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
	       	txtPoints.Push(Vector3(float.Parse(xStr)+horizontalToAdd,float.Parse(yStr)+heightToAdd,float.Parse(zStr)));
	       	txtWidths.Push(float.Parse(widthString));
		}
     }

	var vecPoints: Vector3[] = txtPoints.ToBuiltin(Vector3) as Vector3[];
	var vecWidths: float[] = txtWidths.ToBuiltin(float) as float[];
	return [vecPoints, vecWidths];
}


//-----------------------//
// Place rings at given points
//-----------------------//
function PlaceRings(prefabObj: Transform, positions: Vector3[], ringWidth: float, ringHeight: float, ringDepthConstant: float, isVisible: boolean) {
	AllRings = new Array();
	for (i=0;i<positions.length;i++) {
		thisRing = Instantiate(prefabObj, positions[i], Quaternion.identity);
		thisRing.transform.localScale = Vector3(ringWidth,ringHeight,ringDepthConstant);
		AllRings.Push(thisRing);
	}
	return AllRings;
}

function LateUpdate () {

}