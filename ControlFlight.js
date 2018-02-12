// Created 9/4/14 by DJ.

//N back params
var nBackScript;
 
// MAIN CONTROL PARAMETERS
var rollSpeed : float = 10.0; //rolling rotation speed
var pitchSpeed : float = 100.0; //vertical rotation speed
var yawSpeed : float = 100.0; //horizontal rotation speed

// MAIN CONTROLS
//var roll : float = 0;
var pitch : float = 0.0;
var yaw : float = 0.0;
var roll : float = 0.0;
var speed : float = 200.0; 

// FILTER PARAMETERS 
var filterDelay: float = 0.15; // in s
var intFilterDelay: int; // in frames
var filterUpTime: float = 0.3; // in s
var intFilterUpTime: int; // in frames
var filterDownTime: float = 0.3; // in s
var intFilterDownTime: int; // in frames
var IFI: float; // inter-frame interval for conversion to integer
static var FILTER_SIZE = 200;
var filter: Array;


// DRIFT PARAMETERS
var driftAmplitude = 1.0; // in degrees/s
var minDriftDelay = 3.0; // min allowable, in s
var maxDriftDelay = 5.0; // max allowable, in s
var driftChangeInterval = 3.0; // current interval in s
var lastDriftChange = 0.0; // in s
var drift = 0.0;

// BUFFERS
static var BUFFER_SIZE = 1000;
var pitchBuffer: float[];
var yawBuffer: float[];
var bufferPos = 0;

// CONTROL LOCKS
var lockXpos = false;
var lockRoll = true;

// TAKEOFF PARAMS
var initialPos = Vector3(0.0, 1000.0, -1000.0);
//var initialPosArrows: Vector3;
var firstRingPos = Vector3(0.0, 1000.0, 0.0);

// PRIVATE VARIABLES
private var eyelinkScript; //gets eye position and records messages
private var runFlightScript; // to end session
private var doWindow = false; // opens GUI to set filter params
private var isInFlight = false; // in flight (controls enabled), or in takeoff?
private var maxAltitude = 15000.0; // max altitude allowed before flight is aborted.

// CHANGED, FJ, 2015-05-11
private var lslBCIInputScript; // Online communication with the BCI, here mainly to set markers
private var fLastPitch = 0.0;
private var fLastYaw = 0.0;

private var arrows: GameObject;
//private var transform_Arrows: Transform;

// Use this for initialization
function Start ()
{
	if (!isInFlight) {
		// Pause updates until StartFlight has been called
		this.enabled = false;
	}

}




function StartFlight(controlNbackScript) 
{
	 
	//arrows = GameObject.Find("arrows_canvas");
	//transform_Arrows =  arrows.GetComponent(Transform) as Transform;
	//initialPosArrows = transform_Arrows.position;
	nBackScript = controlNbackScript;
	// Get eyelink script for logging	
	eyelinkScript = gameObject.GetComponent(eyelink); //gets eye position and records messages
	runFlightScript = gameObject.GetComponent(RunFlightSim); //gets eye position and records messages
	
	// CHANGED, FJ, 2015-05-11
	lslBCIInputScript = gameObject.GetComponent(LSL_BCI_Input); // To interface with online BCI

	
	// Initialize buffers
	pitchBuffer = new Array(BUFFER_SIZE);
	yawBuffer = new Array(BUFFER_SIZE);
	//initialize to zero
	for (i=0;i<BUFFER_SIZE;i++) {
		pitchBuffer[i] = 0;
		yawBuffer[i] = 0;
	}
	
	//initialize filter
	IFI = Time.deltaTime;
//	Debug.Log("IFI = " + IFI);
	intFilterDelay = Mathf.Round(filterDelay/IFI);	
	intFilterUpTime = Mathf.Round(filterUpTime/IFI);	
	intFilterDownTime = Mathf.Round(filterDownTime/IFI);	
	filter = MakeFilter(intFilterDelay,intFilterUpTime,intFilterDownTime,FILTER_SIZE);
	
	//initialize drift
	drift = 0.0;//GetNewDrift(driftAmplitude);
	lastDriftChange = 0.0;
	// log new drift
//	eyelinkScript.write("Drift = " + drift);

	// Set initial plane position
	transform.position = initialPos;
	// transform_Arrows.position = initialPos;
	
	// Set roll speed
	rollSpeed = yawSpeed / 10;
	
	// Start updates
	isInFlight = true;
	this.enabled = true;
}

function setSpeed(moveSpeed) {
	speed = moveSpeed;
}

function Update()
{	
	if (this.enabled == false) {
		return;
	}
	var input = Input.touches;
	var names = Input.GetJoystickNames();

    if(Input.GetKeyDown(KeyCode.JoystickButton0)){
    	nBackScript.nbackButtonPressed();
    }
    else if(Input.GetKeyDown(KeyCode.JoystickButton1)){
    	nBackScript.bipButtonPressed();
    }
	// Move forward	
	transform.Translate(Vector3.forward*Time.deltaTime*speed);
	//transform_Arrows.Translate(Vector3.forward*Time.deltaTime*speed);
	

	if (transform.position.z<-2000.0) {
		// Implement sigmoid takeoff pattern that ends at (x=0, y=firstRingYpos, z=0)
		transform.position.y = initialPos.y + (firstRingPos.y-initialPos.y)/(1.0 + Mathf.Exp( (transform.position.z-initialPos.z/2) / (initialPos.z/10) ) );
		//transform_Arrows.position.y = initialPosArrows.y + (firstRingPos.y-initialPosArrows.y)/(1.0 + Mathf.Exp( (transform.position.z-initialPosArrows.z/2) / (initialPosArrows.z/10) ) );
	// MAIN FLIGHT (Enable controls, inputs, filters, etc.)
	} else {
		
	
	//Update drift
	if ( (Time.time-lastDriftChange) > driftChangeInterval ) {
		lastDriftChange = Time.time;
		drift = GetNewDrift(driftAmplitude);
		// calculate new drift time
		driftChangeInterval = Random.Range(minDriftDelay,maxDriftDelay);						

	}
	
	// increment bufferPos;
	bufferPos++;
	bufferPos = bufferPos % BUFFER_SIZE;	
	
	// Get new inputs
	var newPitch = -Input.GetAxis("Vertical") * (Time.deltaTime * pitchSpeed);
	var newYaw = Input.GetAxis("Horizontal") * (Time.deltaTime * yawSpeed);
	// Add to buffer
	pitchBuffer[bufferPos] = newPitch;
	yawBuffer[bufferPos] = newYaw;	
		
	var fNewPitch : float = newPitch;
	var fNewYaw : float = newYaw;
		
		
	// CHANGED, FJ, 2015-05-11 --------------------
	// Detect stick movement: A stick event is detected if the PITCH input in 
	// the previous sample was 0.0 and in the current sample is != 0.0 
	if ( fLastPitch == 0.0f )
	{
		// Is the current pitch input other than 0?
		if ( fNewPitch != 0.0f )
		{
			// Set a general stick-movement marker into the data stream via LSL
			// This marker will be the same for every stick movement.
			runFlightScript.setMarkerForControlFlight ("StickMvmtPitch_All");

			// Add a marker to indicate movement of the stick in pitch direction as
			// defined by a change of the pitch value from 0 to non 0. RunFlightSim
			// annotates the string of this marker with the size of the next ring.
			runFlightScript.sendMarkerWithRingSize ( "StickMvmtPitch" );
		}
	}

	if ( fLastYaw == 0.0f )
	{
		// Is the current pitch input other than 0?
		if ( fNewYaw != 0.0f )
		{
			// Set a general stick-movement marker into the data stream via LSL
			// This marker will be the same for every stick movement.
			runFlightScript.setMarkerForControlFlight ("StickMvmtYaw_All");

			// Add a marker to indicate movement of the stick in pitch direction as
			// defined by a change of the pitch value from 0 to non 0. RunFlightSim
			// annotates the string of this marker with the size of the next ring.
			runFlightScript.sendMarkerWithRingSize ( "StickMvmYaw" );
		}
	}

	
	// Save current PITCH input for use in next sample!
	fLastPitch = fNewPitch;
	fLastYaw = fNewYaw;
	
	// Always attempt to send current pitch input status via LSL
	runFlightScript.setMarkerForPitch ( fNewPitch );
	runFlightScript.setMarkerForYaw ( fNewYaw );

	// END-CHANGES FJ ----------------------------
	
	

	//Apply filter to get current pitch & yaw
	pitch = 0;
	yaw = 0;/*
	var iBuffer = 0;
	for (i=0; i<FILTER_SIZE; i++) 
	{
		iBuffer = (((bufferPos-i) % BUFFER_SIZE) + BUFFER_SIZE) % BUFFER_SIZE; // to prevent negative numbers in modulo output
		pitch += filter[i]*pitchBuffer[iBuffer];
		yaw += filter[i]*yawBuffer[iBuffer];
	}
	*/
	yaw =newYaw;
	pitch = newPitch;
	// Retrieve old inputs from buffer (uncomment for simple delayed control)
	//	pitch = pitchBuffer[(bufferPos-intFilterDelay) % BUFFER_SIZE];
	//	yaw = yawBuffer[(bufferPos-intFilterDelay) % BUFFER_SIZE];

	// print ("Pitch:" + newPitch + " / " + pitch );

	// Apply Pitch & Yaw
	transform.Rotate(Vector3.up * yaw);
	transform.Rotate(Vector3.right * pitch);
	//Apply drift
	//transform.Rotate(Vector3.right * drift * Time.deltaTime);

	//transform_Arrows.Rotate(Vector3.up * yaw);
	//transform_Arrows.Rotate(Vector3.right * pitch);
	//Apply drift
	//transform_Arrows.Rotate(Vector3.right * drift * Time.deltaTime);

	//} 
	}
	//IMPLEMENT CONTROL LOCKS
    if (lockXpos) { // allow only control in y position
    	transform.position.x = 0;
    	transform.rotation.y = 0;
    	//transform_Arrows.position.x = 0;
    	//transform_Arrows.rotation.y = 0;
    }
    if (lockRoll) { // turning in x direction means yaw only
    	transform.rotation.z = 0;
    	//transform_Arrows.rotation.z = 0;
    } else { // implement roll that's 1/10 of yaw strength
    	//transform.rotation.z = -yaw * rollSpeed/yawSpeed; //Roll
    	//transform_Arrows.rotation.z = -yaw * rollSpeed/yawSpeed; //Roll
    }
    
    // CHECK ELEVATION
    //if (transform.position.y <= 0.0 || transform.position.y >= maxAltitude) {
    //	runFlightScript.EndLevel();
    //}
}


// SAMPLE DRIFT FROM RANDOM DISTRIBUTION
function GetNewDrift(driftAmp: float) 
{
	newDrift = driftAmp*(Random.value-0.5); // uniform distribution
	// log new drift
	if (eyelinkScript) {
		eyelinkScript.write("Drift = " + newDrift);
	}
	return newDrift;
}

// CREATE THE FILTER TO BE APPLIED
function MakeFilter(iFilterDelay: int, iFilterUp: int, iFilterDown: int, filterSize: int) 
{
	var newFilter = new Array();
	var filterSum = 0.0;
	// Make zeros for initial delay
	for (i=0; i<iFilterDelay; i++) {
		newFilter.Push(0);
	}
	// Make Linear Filter	
	var filterMax = 1.0;
	var filterMin = 0.4;
	var filterLevel = 0.6;
	
	var upShift = filterMax/iFilterUp;
	var downShift = (filterMin-filterMax)/iFilterDown;
	var levelShift = (filterLevel - filterMin)/(iFilterUp + iFilterDown);
	
	for (i=0;i<(filterSize-iFilterDelay); i++) {
		if (i<iFilterUp) { // Upward line
			newFilter.Push(upShift); 		
			filterSum += (upShift);
		} else if (i < (iFilterUp+iFilterDown)) { // Downward line
			newFilter.Push(downShift);
			filterSum += (downShift);
		} else if (i < 2*(iFilterUp+iFilterDown)) { // Upward line
			newFilter.Push(levelShift);
			filterSum += (levelShift);
		} else { // Pad remainder with zeros (this could probably be removed)
			newFilter.Push(0);
		}
	}	
	var filterVec: float[] = newFilter.ToBuiltin(float);			
	
	// normalize
//	for (i=0;i<filterSize; i++) {
//		filterVec[i] = filterVec[i]/filterSum;
//	}
	return filterVec;
}



// Make the contents of the Filter Control window.
function DoWindow (windowID : int) 
{
	//--- filterDelay control
	var oldDelay = filterDelay;
	filterDelay = GUILayout.HorizontalSlider(filterDelay,0.0,1.0); // use to slow down or speed up
	//re-calculate filter
	if (filterDelay!=oldDelay) {
		intFilterDelay = Mathf.Round(filterDelay/IFI);		
		filter = MakeFilter(intFilterDelay,intFilterUpTime,intFilterDownTime,FILTER_SIZE);
	}
	// display number in GUI
	GUILayout.BeginHorizontal();
		GUILayout.Label("filterDelay = " + Mathf.Round(filterDelay*100)/100);
	GUILayout.EndHorizontal();		
	
	//--- filterUpTime control
	var oldUpTime = filterUpTime;
	filterUpTime = GUILayout.HorizontalSlider(filterUpTime,0.0,1.0); // use to slow down or speed up
	//re-calculate filter
	if (filterUpTime!=oldUpTime) {
		intFilterUpTime = Mathf.Round(filterUpTime/IFI);
		if (intFilterUpTime==0) {
			intFilterUpTime=1; // to avoid dividing by zero, impost limit
			filterUpTime = intFilterUpTime*IFI;
		}			
		filter = MakeFilter(intFilterDelay,intFilterUpTime,intFilterDownTime,FILTER_SIZE);
	}
	// display number in GUI
	GUILayout.BeginHorizontal();
		GUILayout.Label("filterUpTime = " + Mathf.Round(filterUpTime*100)/100);
	GUILayout.EndHorizontal();		
	
	//--- filterDownTime control
	var oldDownTime = filterDownTime;
	filterDownTime = GUILayout.HorizontalSlider(filterDownTime,0.0,1.0); // use to slow down or speed up
	//re-calculate filter
	if (filterDownTime!=oldDownTime) {
		intFilterDownTime = Mathf.Round(filterDownTime/IFI);
		if (intFilterDownTime==0) {
			intFilterDownTime=1; // to avoid dividing by zero, impose limit
			filterDownTime = intFilterDownTime*IFI;
		}
		filter = MakeFilter(intFilterDelay,intFilterUpTime,intFilterDownTime,FILTER_SIZE);
	}
	// display number in GUI
	GUILayout.BeginHorizontal();
		GUILayout.Label("filterDownTime = " + Mathf.Round(filterDownTime*100)/100);
	GUILayout.EndHorizontal();		

	//---speed control
	speed = GUILayout.HorizontalSlider(speed,0.0,1000.0); // use to slow down or speed up
	// display number in GUI
	GUILayout.BeginHorizontal();
		GUILayout.Label("speed = " + Mathf.Round(speed));
	GUILayout.EndHorizontal();	

	//--- Pause/run buttons
	GUILayout.BeginHorizontal();
		if(GUILayout.Button("Pause")) Time.timeScale=0;
		if(GUILayout.Button("Run")) Time.timeScale=1; 
		if(GUILayout.Button("END")) runFlightScript.EndLevel();
	GUILayout.EndHorizontal();


}

// Display GUI elements (runs every time the GUI is displayed on the screen)
function OnGUI () 
{ 
	// Make a toggle button for hiding and showing the window
	doWindow = GUILayout.Toggle (doWindow, "");
	
	//When the user clicks the toggle button, doWindow is set to true.
	//Then create the trial type window with GUILayout and specify the contents with function DoWindow
	if (doWindow)
	GUILayout.Window (0, Rect (0,20,200,120), DoWindow, "Filter Controls");
}

//-----------------------//
// Log Controls
//-----------------------//
function LateUpdate() {
	//Log latest control
	eyelinkScript.write("Controls = (" + pitchBuffer[bufferPos] + "," + yawBuffer[bufferPos] + ")"); 
}