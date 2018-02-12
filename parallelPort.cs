using UnityEngine;
using System.Collections;
using System.IO; // for writing to file (when tracker isn't used)
using System; //important for DLLs (see Unity manual page on Plugins)
using System.Runtime.InteropServices; //important for DLLs

public class parallelPort : MonoBehaviour {
	
	[DllImport("inpoutx64.dll", EntryPoint = "Out32")]
	public static extern void Output(int address, int value); // decimal
	// Use this for initialization


	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {

	}

	// Tracker initialization
	public void OutputToParallel (int data) {

		parallelPort.Output (0xE010, data);

	}
}
