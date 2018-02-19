using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;



public class stressEvaluation : MonoBehaviour {

	public GameObject sliderUnpleasentObj;
	public GameObject sliderStressObj;
	public GameObject button;
	public Button buttonComponent;

	private Slider sliderUnpleasentComponent;
	private Slider sliderStressComponent;
	public static List<string> stressValues  = new List<string>();
	public static List<string> unpleasentValues  = new List<string>();
	public static List<float> stressValuesTimes  = new List<float>();
	public static List<float> unpleasentValuesTimes  = new List<float>();
	public static List<string> levels = new List<string>();
	public static List<string> stressStatus = new List<string>();
	public static List<string> ringSizes = new List<string>();
	public static List<string> stroopConditions = new List<string>();
	public static List<string> isPracticeList = new List<string>();
	public static List<string> isBaselineList = new List<string>();
	public static List<string> speeds = new List<string>();
	private int stressValue = 50;
	private int unpleasentValue = 50;
	private float stressValueTime = 0.0f;
	private float unpleasentValueTime = 0.0f;
	//private static bool firstTime = true;
	private static StreamWriter stressFile;
	private int currentItemIndex;
	private int itemsNumber;
	private Slider[] items;
	private float startTime = 0;
	private float timeLimit = 1;
	private int updatesNumber = 0;
	private static string createdFileName = "";
	private static int nextDataIndexToSave = 0;
	private LSL_BCI_Input lslScript;
	private dataSaver dataSaverScript;



	// Use this for initialization
	void Start () {
		
		GameObject emptyObject =  GameObject.Find("dataSaver");
		if (emptyObject) {
			dataSaverScript = emptyObject.GetComponent<dataSaver> ();

			if (dataSaverScript) {
				this.lslScript = dataSaverScript.getLslScript ();
			}
		}

		if (dataSaverScript.getIsLastPractice()) {
			timeLimit = int.MaxValue;
		}
		itemsNumber = 2;

		currentItemIndex = 0;

		sliderUnpleasentObj = GameObject.Find ("Slider_unPleasent");
		sliderStressObj = GameObject.Find ("Slider_stress");
		sliderUnpleasentComponent = sliderUnpleasentObj.GetComponent<Slider> ();
		sliderStressComponent = sliderStressObj.GetComponent<Slider> ();
		button = GameObject.Find ("Button");
		buttonComponent = button.GetComponent<Button> ();
		button.SetActive (false);
		sliderStressComponent.onValueChanged.AddListener (delegate {
			stressValueChanged ();
		});
		sliderUnpleasentComponent.onValueChanged.AddListener (delegate {
			unpleasentValueChanged ();
		});
		//buttonComponent.onClick.AddListener (onDone);
		items = new Slider[] {sliderStressComponent, sliderUnpleasentComponent};

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
		this.lslScript.setMarker ("startStressEvaluation");
		this.startTime = Time.time;
	}

	// Update is called once per frame
	void Update () {
		if (dataSaverScript.getIsLastPractice()) {
			if(Input.GetKeyDown(KeyCode.Space)){
				SceneManager.LoadScene ("load_evaluation");
				return;
			}
		}
		float currrentTime = Time.time;
		if (currrentTime - this.startTime > this.timeLimit) {
			this.onDone ();
		}/*
		if (stressMarkerMoved && unpleasentMarkerMoved) {
			button.SetActive (true);
		}*/
		if(Input.anyKeyDown){
			UnityEngine.UI.Image[] images = items [currentItemIndex].GetComponentsInChildren<UnityEngine.UI.Image> ();
			int i = 0;
			for (i = 0; i < images.Length; i++) {
				if (images [i].name == "Background") {
					images [i].color = Color.black;
				}
			}
			if (currentItemIndex == itemsNumber - 1) {
				currentItemIndex = 0;
			} else {
				currentItemIndex++;
			}
			images = items [currentItemIndex].GetComponentsInChildren<UnityEngine.UI.Image> ();
			for (i = 0; i < images.Length; i++) {
				if (images [i].name == "Background") {
					images [i].color = Color.green;
				}
			}
			return;
		}
		var movement = Input.GetAxis ("Horizontal");
		if (currentItemIndex < itemsNumber) {
			items[currentItemIndex].value += movement/2;
		}

	}

	void onDone() {
		string levelText = "";
		string stressText = "";
		string ringSizeText = "";
		string stroopCondition = "";
		string isPractice = "";
		string speed = "";
		string isBaseline = ""; 

		stressText = dataSaverScript.condition;
		levelText = dataSaverScript.getLastN ().ToString ();
		ringSizeText = dataSaverScript.getLastRingSize();
		stroopCondition = dataSaverScript.getStroopCondition ().ToString ();
		isPractice = dataSaverScript.getIsLastPractice().ToString ();
		speed = dataSaverScript.moveSpeed.ToString ();
		isBaseline = dataSaverScript.getLastIsBaseline().ToString ();

		stressValues.Add(stressValueTime > 0 ? stressValue.ToString() : "");
		unpleasentValues.Add(unpleasentValueTime > 0? unpleasentValue.ToString() : ""	);
		stressValuesTimes.Add(stressValueTime);
		unpleasentValuesTimes.Add(unpleasentValueTime);
		levels.Add (levelText);
		stressStatus.Add (stressText);
		ringSizes.Add (ringSizeText);
		stroopConditions.Add (stroopCondition);
		isPracticeList.Add (isPractice);
		isBaselineList.Add (isBaseline);
		speeds.Add (speed);

		this.writeValuesToFile ();
		this.lslScript.setMarker ("endStressEvaluation");
		if (dataSaverScript.currentBlockIndex == 0) {
			SceneManager.LoadScene ("Instructions");
		} else {
			SceneManager.LoadScene ("load_evaluation");
		}
	}

	public void writeValuesToFile() {
		StreamWriter stream = null;
		StringBuilder stringRow;
		string path = Application.dataPath;
		string[] values = new string[12];
		if (createdFileName == "") {
			float time = Time.time;
			path = path + "/" + "stress_data_sub_" + this.dataSaverScript.subjectNumber + "_time_" + time.ToString ();
			stream = File.CreateText (path);
			createdFileName = path;


			values [0] = "stressful";
			values [1] = "unpleasent";
			values [2] = "stressful_rt";
			values [3] = "unpleasent_rt";
			values [4] = "level";
			values [5] = "stressStatus";
			values [6] = "ringSize";
			values [7] = "stroopCondition";
			values [8] = "isPractice";
			values [9] = "speed";
			values [10] = "difficultLevel";
			values [11] = "isBaseline";
			//stressFile.WriteLine (values);
			stringRow = getStringFromArray (values);
			stream.WriteLine (stringRow);
		} else {
			stream = new StreamWriter (createdFileName, true);
		}



		values [0] = stressValues[nextDataIndexToSave].ToString ();
		values [1] = unpleasentValues[nextDataIndexToSave].ToString ();
		values [2] = ((int)stressValuesTimes[nextDataIndexToSave]).ToString ();
		values [3] = ((int)unpleasentValuesTimes[nextDataIndexToSave]).ToString ();
		values [4] = levels[nextDataIndexToSave].ToString ();
		values [5] = stressStatus[nextDataIndexToSave].ToString ();

		values [6] = ringSizes[nextDataIndexToSave].ToString ();
		values [7] = stroopConditions[nextDataIndexToSave].ToString ();
		values [8] = isPracticeList[nextDataIndexToSave].ToString ();
		values [9] = speeds[nextDataIndexToSave].ToString ();
		values [10] = this.dataSaverScript.getDifficultLevel (levels [nextDataIndexToSave].ToString (),
		ringSizes [nextDataIndexToSave].ToString ());
		values [11] = isBaselineList [nextDataIndexToSave].ToString ();

		stringRow = getStringFromArray (values);
		stream.WriteLine (stringRow);
		nextDataIndexToSave++;

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
		stressValueTime = Time.time - startTime;
	}

	void unpleasentValueChanged() {
		unpleasentValue = (int)sliderUnpleasentComponent.value;
		unpleasentValueTime = Time.time - startTime;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}


}
