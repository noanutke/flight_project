#pragma strict

var movements = new Array();
var index = 0;

function Start () {
	//movements = ReadMarkerLocations("NedeConfig/markerLocations.txt");
	//yield WaitForSeconds(10);
	//InvokeRepeating("ChangePosition", 0, 2);
}

function Update () {
	
}

function ChangePosition() {
	//if (index < 8) {
	//	index ++;
	//	return;
	//}
	var a = transform as RectTransform;
	a.anchoredPosition3D = movements[index-8];
	// transform.anchoredPosition3D = movements[index];
	index++;
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