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
var upArrowDirecionScript: changeUpDirectionArrow;
var downArrowDirecionScript: changeDownDirectionArrow;
var arrowsArrayLong = ["up_pointingUp","up_pointingUp", "up_pointingDown", "up_pointingUp", "up_pointingUp", "down_pointingUp",
"down_pointingUp","down_pointingUp","down_pointingUp", "up_pointingUp","up_pointingUp", "down_pointingDown","down_pointingUp",
"down_pointingUp","up_pointingDown","up_pointingDown","down_pointingUp","down_pointingUp","up_pointingUp","down_pointingUp",
"up_pointingUp","up_pointingUp", "up_pointingDown", "up_pointingUp", "up_pointingUp", "down_pointingUp",
"down_pointingUp","down_pointingUp","down_pointingUp", "up_pointingUp","up_pointingUp", "down_pointingDown","down_pointingUp",
"down_pointingUp","up_pointingDown","up_pointingDown","down_pointingUp","down_pointingUp","up_pointingUp","down_pointingUp",
"up_pointingUp","up_pointingUp", "up_pointingDown", "up_pointingUp", "up_pointingUp", "down_pointingUp",
"down_pointingUp","down_pointingUp","down_pointingUp", "up_pointingUp","up_pointingUp", "down_pointingDown","down_pointingUp",
"down_pointingUp","up_pointingDown","up_pointingDown","down_pointingUp","down_pointingUp","up_pointingUp","down_pointingUp",
"up_pointingUp","up_pointingUp", "up_pointingDown", "up_pointingUp", "up_pointingUp", "down_pointingUp",
"down_pointingUp","down_pointingUp","down_pointingUp", "up_pointingUp","up_pointingUp", "down_pointingDown","down_pointingUp",
"down_pointingUp","up_pointingDown","up_pointingDown","down_pointingUp","down_pointingUp","up_pointingUp","down_pointingUp"];

var currentRing = "Up";

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
var moveSpeed = 200.0; //motion speed
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
var nBackFilename = "NedeConfig/1-back.txt";
var audioFiles = [];


var successInRow = 0;
// Private Variables


private var eyelinkScript; //the script that passes messages to and receives eye positions from the eyetracker
private var flightScript; // the script that allows the subject to control the flight
private var portIsSync = false; //is parallel port sending Constants.SYNC?
private var syncTime = 0.0; //  the next time when the sync pulse should be sent
private var trialEndTime = Mathf.Infinity; //the time when the trial should end
private var UpperRingArray: Array;
private var LowerRingArray: Array;
private var nextUpperRingBounds: Bounds;
private var nextLowerRingBounds: Bounds;
private var iNextRing = 0;
private var ringAccuracy = new Array();

// CHANGED, FJ, 2015-05-11
private var lslBCIInputScript; // Online communication with the BCI, here mainly to set markers

//-----------------------//
// SET UP
//-----------------------//
function Start() 
{	
	var audioObjects: Component[];
	audioObjects = GetComponents(AudioSource);
	controlNbackScript.initSounds(audioObjects);


	// Stop update functions from running while we start up
	this.enabled = false;
	eyelinkScript = gameObject.AddComponent(eyelink); // to interface with eye tracker
	gameObject.AddComponent(Constants); // to get constants
	flightScript = gameObject.AddComponent(ControlFlight); // to enable flight controls
	// Get eyelink script for logging	
//	eyelinkScript = gameObject.GetComponent(eyelink); //gets eye position and records messages


	// CHANGED, FJ, 2015-05-11
	lslBCIInputScript = gameObject.AddComponent(LSL_BCI_Input); // To interface with online BCI

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
		EDF_filename = ""; //means "do not transfer an edf file to this computer"
	}
	
	//Start eye tracker
	//print("--- subject: " + subject + "  session: " + session + " ---"); //print commands act as backup to eyelink logging/commands 
	var startOut = eyelinkScript.StartTracker(temp_filename); 
	eyelinkScript.SendToEEG(Constants.START_RECORDING);
	//yield WaitForSeconds(0.2);
	
	//Log experiment parameters
	eyelinkScript.write("----- SESSION PARAMETERS -----");
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


	 //------- UPPER RING LOCATIONS 	
	// Read in ring locations from text file
 	var upperRingInfo = ReadInPoints(routeFilename, 50.00);
 	upperRingPositions = upperRingInfo[0];
 	ringWidths = upperRingInfo[1];
 	
	// Put rings in scene 	
	var upperCenterWidths2 = new Array();
	for(i=0;i<ringWidths.length;i++)
	{	
		upperCenterWidths2.Push(10.0);
	}

 	//------- LOWER RING LOCATIONS 	
	// Read in ring locations from text file
 	var lowerRingInfo = ReadInPoints(routeFilename, -50.00);
 	lowerRingPositions = lowerRingInfo[0];
 	//lowerRingWidths = lowerRingInfo[1];
 	
	// Put rings in scene 	
	var lowerCenterWidths2 = new Array();
	for(i=0;i<ringWidths.length;i++)
	{	
		lowerCenterWidths2.Push(10.0);
	}

	var centerWidths: float[] = upperCenterWidths2.ToBuiltin(float) as float[]; 
 	UpperRingArray = PlaceRings(centerPrefab,upperRingPositions, ringWidths, ringWidths, ringDepth, true);
 	LowerRingArray = PlaceRings(ringPrefab,lowerRingPositions, ringWidths, ringWidths, ringDepth, true);
 	// RingArray = PlaceRings(ringPrefab,ringPositions, 110, ringWidths, ringDepth, areAllRingsVisible);
 	//CenterArray = PlaceRings(centerPrefab,ringPositions, centerWidths, centerWidths, centerDepth, areAllRingsVisible);
 	// initialize nextRingBounds
 	nextUpperRingBounds = ObjectInfo.ObjectBounds(UpperRingArray[iNextRing].gameObject);
 	nextLowerRingBounds = ObjectInfo.ObjectBounds(LowerRingArray[iNextRing].gameObject);

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
	yield WaitForSeconds(10);

	// Changed, FJ, 20160403 - Send start marker with condition
	lslBCIInputScript.setMarker ("Run_Start" );
	lslBCIInputScript.setMarker ("Run_Start_Cond_" + expCondition );
	// --------------------------------------------------------

	flightScript.StartFlight(controlNbackScript);
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
			eyelinkScript.SendToEEG(Constants.SYNC);
		} else {
			eyelinkScript.SendToEEG(0);
		}
		//get next sync time
		syncTime = t + syncDelay;
	}


	// --- Extract HMD orientation ----------------------------
	// Credit to original author: Neil Weiss

	var VRcamObject = GameObject.Find ( "Camera" );
	VRcam = VRcamObject.GetComponent.<Camera> ( );
	var VRRotation: Vector3;
	VRRotation = VRcam.transform.rotation.eulerAngles;

	// var carRotation = cam.transform.rotation.eulerAngles;
	// --------------------------------------------------------

	// Changed, FJ, 2016/08/04, Send plane position, HMD orientation via LSL
	lslBCIInputScript.sendFlightParams ( transform.position.z, transform.position.y, nextUpperRingBounds.center.z, nextUpperRingBounds.min.y, nextUpperRingBounds.max.y, VRRotation[0], VRRotation[1], VRRotation[2] );

	// Check if subject has passed the next ring
	if (transform.position.z > nextUpperRingBounds.center.z) 
	{
		if (currentRing == "Up" && iNextRing <= ( UpperRingArray.length-1 ) )
		{
			// CHANGED, FJ, 2015-05-11
			// Inject Marker into the data stream whenever the plane passes a ring.
			// Markers are written via LSL_BCI_Input, which uses the framework labstreaminglayer.
			lslBCIInputScript.setMarker ("UpRingPassed_Size_" + Mathf.Abs(nextUpperRingBounds.max.y - nextUpperRingBounds.min.y));

			lslBCIInputScript.setMarker ("UpRingPassed_Size_" + Mathf.Abs(nextUpperRingBounds.max.y - nextUpperRingBounds.min.y) + "_Cond_" + expCondition );

			lslBCIInputScript.setMarker ("UpRingPassed_Cond_" + expCondition );
			successInRow += 1;
			if (successInRow >= 7) {
				controlNbackScript.moveMarkerScript.changePosition(1);
				successInRow = 0;
			}
		}

		if (currentRing == "Down" && iNextRing <= ( UpperRingArray.length-1 ) )
		{
			// CHANGED, FJ, 2015-05-11
			// Inject Marker into the data stream whenever the plane passes a ring.
			// Markers are written via LSL_BCI_Input, which uses the framework labstreaminglayer.
			lslBCIInputScript.setMarker ("DownRingPassed_Size_" + Mathf.Abs(nextLowerRingBounds.max.y - nextLowerRingBounds.min.y));

			lslBCIInputScript.setMarker ("DownRingPassed_Size_" + Mathf.Abs(nextLowerRingBounds.max.y - nextLowerRingBounds.min.y) + "_Cond_" + expCondition );

			lslBCIInputScript.setMarker ("DownRingPassed_Cond_" + expCondition );
			successInRow += 1;
			if (successInRow >= 3) {
				controlNbackScript.moveMarkerScript.changePosition(1);
				successInRow = 0;
			}
		}

		// ADDED, FJ, 2016-08-10
		if (currentRing == "Up" && (transform.position.y < nextUpperRingBounds.min.y || transform.position.y > nextUpperRingBounds.max.y ) )
		{
			lslBCIInputScript.setMarker ("UpFail_Size_" + Mathf.Abs(nextUpperRingBounds.max.y - nextUpperRingBounds.min.y));

			lslBCIInputScript.setMarker ("UpFail_Size_" + Mathf.Abs(nextUpperRingBounds.max.y - nextUpperRingBounds.min.y) + "_Cond_" + expCondition );

			lslBCIInputScript.setMarker ("UpFail_Cond_" + expCondition );
			controlNbackScript.moveMarkerScript.changePosition(-1);
			controlNbackScript.setFailedToPassRing();
			successInRow = 0;
		}

		if (currentRing == "Down" && (transform.position.y < nextLowerRingBounds.min.y || transform.position.y > nextLowerRingBounds.max.y ) )
		{
			lslBCIInputScript.setMarker ("DownFail_Size_" + Mathf.Abs(nextLowerRingBounds.max.y - nextLowerRingBounds.min.y));

			lslBCIInputScript.setMarker ("DownFail_Size_" + Mathf.Abs(nextLowerRingBounds.max.y - nextLowerRingBounds.min.y) + "_Cond_" + expCondition );

			lslBCIInputScript.setMarker ("DownFail_Cond_" + expCondition );
		}

		SwitchArrowIfNeeded(iNextRing);
		if (currentRing == "Up")
		{
			ringAccuracy.push(Mathf.Abs(transform.position.y - nextUpperRingBounds.center.y)*200/ringWidths[iNextRing]);
		}
		else
		{
			ringAccuracy.push(Mathf.Abs(transform.position.y - nextLowerRingBounds.center.y)*200/ringWidths[iNextRing]);
		}
		iNextRing++; // increment the ring number
		ChangeVisibility(UpperRingArray[iNextRing],true);
		ChangeVisibility(LowerRingArray[iNextRing],true);
		nextUpperRingBounds = ObjectInfo.ObjectBounds(UpperRingArray[iNextRing].gameObject); // get new ring bounds
		nextLowerRingBounds = ObjectInfo.ObjectBounds(LowerRingArray[iNextRing].gameObject); // get new ring bounds
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
	lslBCIInputScript.setMarker ( sMarkerName + "_Size_" + Mathf.Abs(nextUpperRingBounds.max.y - nextUpperRingBounds.min.y));
}


function SwitchArrowIfNeeded(ringIndex)
{	
	if (arrowsArrayLong.length <= ringIndex) {
		print (ringIndex);
	}
	currentArrow = arrowsArrayLong[ringIndex];
	if (currentArrow == "up_pointingUp")	// show up direction arrow in up position
	{
		currentRing = "Up";
		position = Vector3(0.0,1.0,0.0);
		upArrowDirecionScript.ChangePosition(position);
		upArrowDirecionScript.Show();
		downArrowDirecionScript.Hide();
	}
	if (currentArrow == "up_pointingDown")	// show up direction arrow in down position
	{
		currentRing = "Down";
		position = Vector3(0.0,1.0,0.0);
		downArrowDirecionScript.ChangePosition(position);
		downArrowDirecionScript.Show();
		upArrowDirecionScript.Hide();
	}
	if (currentArrow == "down_pointingUp")	// show down direction arrow in up position
	{
		currentRing = "Up";
		position = Vector3(0.0,-4.0,0.0);
		upArrowDirecionScript.ChangePosition(position);
		upArrowDirecionScript.Show();
		downArrowDirecionScript.Hide();
	}
	if (currentArrow == "down_pointingDown")	// show down direction arrow in down position
	{
		currentRing = "Down";
		position = Vector3(0.0,-4.0,0.0);
		downArrowDirecionScript.ChangePosition(position);
		upArrowDirecionScript.Hide();
		downArrowDirecionScript.Show();
	}

}

//---END THE LEVEL AND DO CLEANUP
//This function is called during the Update function, or by a helper script.
function EndLevel() 
{
	// Changed, FJ, 20160403 - Send start marker with condition
	lslBCIInputScript.setMarker ("Run_End" );
	lslBCIInputScript.setMarker ("Run_End_Cond_" + expCondition );
	// --------------------------------------------------------

	//Compute Performance
	courseCompleted = ((iNextRing)*100/UpperRingArray.length);
	
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
	
	loaderScript.courseCompleted = courseCompleted.ToString();
	loaderScript.courseAccuracy = courseAccuracy.ToString();


	// Changed, FJ, 20160915 - Print end percentage, set marker with End Percentage!!

	print ( "\n#########################################\n\n" );

	print ( "\n # RESULT: Course completed >> " + loaderScript.courseCompleted + "% <<" );

	print ( "\n#########################################\n\n" );

	lslBCIInputScript.setMarker ("Run_End_Comp_" + loaderScript.courseCompleted );
	lslBCIInputScript.setMarker ("Run_End_Cond_" + expCondition + "_Comp_" + loaderScript.courseCompleted );

	// --------------------------------------------------------


	// Changed, FJ, 20160915 - Write results to CSV file!

	var t: System.DateTime = System.DateTime.Now;

	var filePath = "C:/_DATA/BF_CLoop_02_Main/Res_Times_Sub_" + subject + "_" + String.Format("{0:D4}{1:D2}{2:D2}",t.Year,t.Month,t.Day) + ".csv";

    var sw : StreamWriter = new StreamWriter ( filePath, true );

    sw.WriteLine ( "" + String.Format("{0:D4}_{1:D2}_{2:D2}_{3:D2}_{4:D2}_{5:D2}",t.Year,t.Month,t.Day,t.Hour,t.Minute,t.Second) + ",   Sub"  + subject + ",   Cond" + expCondition + ",   " + routeFilename + ",   " + loaderScript.courseCompleted + "%,   " + loaderScript.courseAccuracy + "%" );

    sw.Flush ( );
    sw.Close ( );

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
	Application.LoadLevel("Loader"); //Go back to the Loader Scene
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
function ReadInPoints(fileName: String, heightToAdd: float) 
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
		var valSegs:String[]=line.Split(","[0]);
		if (valSegs.length>2) 
		{
			var xStr = valSegs[0];	
	       	var yStr = valSegs[1];
	       	var zStr = valSegs[2];
	       	var widthString = valSegs[3];
	       	// TRACING of raw (x,y,z)
//	      	Debug.Log("xStr: " + xStr + ", yStr: " + yStr + ", zStr: " + zStr);
	       	txtPoints.Push(Vector3(float.Parse(xStr),float.Parse(yStr)+heightToAdd,float.Parse(zStr)));
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
function PlaceRings(prefabObj: Transform, positions: Vector3[], ringWidth: float[], ringHeight: float[], ringDepthConstant: float, isVisible: boolean) {
	
	// eyelinkScript must be initialized before this function is called (TO DO: insert check for this)
	eyelinkScript.write("----- LOAD TRIAL -----");
	AllRings = new Array();
	for (i=0;i<positions.length;i++) {
		//renderer = prefabObj.GetComponent('Renderer').material.color = color;
		eyelinkScript.write("Created Object # " + (i+1) + " Ring Ring Ring " + positions[i] + " (" + ringWidths[i] + ", " + ringHeight[i] + ", " + ringDepth + ", 0)"); //"Ring Ring Ring" 
		thisRing = Instantiate(prefabObj, positions[i], Quaternion.identity); // place ring in sceneindicates name/type/tag are all "Ring"

		//renderer.material.color.r = color.r;
		//renderer.material.color.g = color.g;
		//renderer.material.color.b = color.b;
		thisRing.transform.localScale = Vector3(ringWidth[i],ringHeight[i],ringDepthConstant); // scale to match specified width/height/depth
		ChangeVisibility(thisRing,isVisible);
		AllRings.Push(thisRing); // keep track of rings in scene
	}
	eyelinkScript.write("----- START TRIAL -----");
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