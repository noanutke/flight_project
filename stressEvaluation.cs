using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;
using System;

public class stressEvaluation : MonoBehaviour {

	private GameObject sliderUnpleasentObj;
	private GameObject sliderStressObj;

	private Slider sliderUnpleasentComponent;
	private Slider sliderStressComponent;
	private bool inSecondSession = false;
	private int stressValue = 50;
	private int unpleasentValue = 50;

	private int currentItemIndex;
	private Slider[] items;
	private float startTime;
	private float timeLimit = 9;

	private static StreamWriter stressFile;
	private static int itemsNumber = 2;

	private static string createdFileName = "";

	private LSL_BCI_Input lslScript;
	private dataSaver dataSaverScript;

	void Start () {		
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaverScript = emptyObject.GetComponent<dataSaver> ();
		this.lslScript = dataSaverScript.getLslScript ();

		if (dataSaverScript.getIsLastPractice()) {
			timeLimit = int.MaxValue;
		}
		currentItemIndex = 0;

		// Find sliders objects and initialize their methods
		sliderUnpleasentObj = GameObject.Find ("Slider_unPleasent");
		sliderStressObj = GameObject.Find ("Slider_stress");
		sliderUnpleasentComponent = sliderUnpleasentObj.GetComponent<Slider> ();
		sliderStressComponent = sliderStressObj.GetComponent<Slider> ();

		sliderStressComponent.onValueChanged.AddListener (delegate {
			stressValueChanged ();
		});
		sliderUnpleasentComponent.onValueChanged.AddListener (delegate {
			unpleasentValueChanged ();
		});

		items = new Slider[] {sliderStressComponent, sliderUnpleasentComponent};

		// paint in green the active slider (the first one), and the rest in black
		int index = 0;
		for (index = 0; index < items.Length ; index++){
			UnityEngine.UI.Image[] images = items [index].GetComponentsInChildren<UnityEngine.UI.Image> ();
			for (int i = 0; i < images.Length; i++) {				
				if (images [i].name == "Background") {
					if (index == 0) {
						images [i].color = Color.green;
					} else {
						images [i].color = Color.black;
					}
				}
			}
		}

		this.lslScript.setMarker ("eval_start_1_stress_1");
		this.startTime = Time.time;
	}


	void Update () {
		// If we are in a practice block - we wait until space is pressed
		if (dataSaverScript.getIsLastPractice()) {
			if(Input.GetKeyDown(KeyCode.Space)){
				SceneManager.LoadScene ("load_evaluation");
				return;
			}
		}

		// check if time limit has passed
		float currrentTime = Time.time;
		if (currrentTime - this.startTime > this.timeLimit) {
			this.onDone ();
		}

		if(Input.anyKeyDown){
			// key is down so we need to make the next scale active (paint the next scale in green)
			this.updateActiveScale();
		}

		// If get here if no key was pressed, so we check for change in joystick horizontal axis
		var movement = Input.GetAxis ("Horizontal");
		if (currentItemIndex < itemsNumber) {
			items[currentItemIndex].value += movement/2; // we devide the movement by half to make the movement more delecate
		}
	}

	void updateActiveScale() {
		// first we paint the last active scale in black
		UnityEngine.UI.Image[] images = items [currentItemIndex].GetComponentsInChildren<UnityEngine.UI.Image> ();
		int i = 0;
		for (i = 0; i < images.Length; i++) {
			if (images [i].name == "Background") {
				images [i].color = Color.black;
			}
		}

		// now we change the current active scale (update currentItemIndex)
		if (currentItemIndex == itemsNumber - 1) {
			currentItemIndex = 0;
		} else {
			currentItemIndex++;
		}

		// now we paint the new active scale in green
		images = items [currentItemIndex].GetComponentsInChildren<UnityEngine.UI.Image> ();
		for (i = 0; i < images.Length; i++) {
			if (images [i].name == "Background") {
				images [i].color = Color.green;
			}
		}
		return;
	}

	void onDone() {

		string stressText = dataSaverScript.condition;
		string levelText = dataSaverScript.getLastN ();
		string ringSizeText = dataSaverScript.getLastRingSize();
		string isPractice = dataSaverScript.getIsLastPractice().ToString ();
		string speed = dataSaverScript.moveSpeed.ToString ();
		string isBaseline = dataSaverScript.getLastIsBaseline().ToString ();

		this.writeValuesToFile (stressText, levelText, ringSizeText, isPractice, speed, isBaseline);
		this.lslScript.setMarker ("eval_end_1_stress_1");

		if (dataSaverScript.currentBlockIndex == 0 || (
			dataSaverScript.currentBlockIndex == dataSaver.halfConditionIndex + 1 && dataSaverScript.inSecondSession == true)) {
			SceneManager.LoadScene ("Instructions");
		} else {
			//  wre are not at the beginning of the first session and not at the beginning of the second 
			// session so we need to show the show the load valuation now
			SceneManager.LoadScene ("load_evaluation");
		}
	}

	public void writeValuesToFile(string stressText, string levelText, string ringSizeText, string isPractice, 
		string speed, string isBaseline) {
		StreamWriter stream = null;
		StringBuilder stringRow;
		string path = Application.dataPath;
		string[] values = new string[9];

		if (createdFileName == "") {	// create the file and print the headers
			float time = Time.time;
			path = path + "/" + "stress_data_sub_" + this.dataSaverScript.subjectNumber + "_time_" + time.ToString ();
			stream = File.CreateText (path);
			createdFileName = path;

			values [0] = "stressful";
			values [1] = "unpleasent";
			values [2] = "level";
			values [3] = "stressStatus";
			values [4] = "ringSize";
			values [5] = "isPractice";
			values [6] = "speed";
			values [7] = "difficultLevel";
			values [8] = "isBaseline";

			stringRow = getStringFromArray (values);
			stream.WriteLine (stringRow);
		} else {	// file was already created so just open the stream
			stream = new StreamWriter (createdFileName, true);
		}


		values [0] = stressValue.ToString();
		values [1] = unpleasentValue.ToString();
		values [2] = levelText;
		values [3] = stressText;
		values [4] = ringSizeText;
		values [5] = isPractice;
		values [6] = speed;
		values [7] = this.dataSaverScript.getDifficultLevel (levelText, ringSizeText);
		values [8] = isBaseline;

		stringRow = getStringFromArray (values);
		stream.WriteLine (stringRow);

		stream.Close ();
	}

	StringBuilder getStringFromArray(string[] arrayInput) {
		string delimiter = ",";
		int length = arrayInput.Length;
		StringBuilder stringOutput = new StringBuilder ();

		stringOutput.AppendLine (string.Join (delimiter, arrayInput));

		return stringOutput;
	}

	void stressValueChanged() {
		stressValue = (int)sliderStressComponent.value;
	}

	void unpleasentValueChanged() {
		unpleasentValue = (int)sliderUnpleasentComponent.value;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}
}
