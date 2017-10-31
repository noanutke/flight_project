#pragma strict

var movements = new Array();
var index: int = 0;
var lastLocation: float = 0;
var stepSize = 0.25;

function Start () {
	//movements = ReadMarkerLocations("NedeConfig/markerLocations.txt");
	//yield WaitForSeconds(10);
	//InvokeRepeating("ChangePosition", 0, 2);
}

function Update () {
	
}

function isInBounderies(location: float) {
	if (location > 2 || location < -2) {
		return false;
	}
	return true;
}

function changePosition(sign: int) {
	var a = transform as RectTransform;
	if (isInBounderies(lastLocation + sign * stepSize)) {
		lastLocation += sign * stepSize;
		a.anchoredPosition3D = Vector3(-0.30,lastLocation,0.00);
	}
}


function ReadMarkerLocations(fileName: String) 
{
	// set up
	var movements = new Array();
	
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
		var location = valSegs[0];	
       	// TRACING of raw (x,y,z)
//	      	Debug.Log("xStr: " + xStr + ", yStr: " + yStr + ", zStr: " + zStr);
       	movements.Push(Vector3(-0.30,float.Parse(location),0.00));
     }

	return movements;
}
