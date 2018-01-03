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
	private bool stressMarkerMoved;
	private bool unpleasentMarkerMoved;
	private Slider sliderUnpleasentComponent;
	private Slider sliderStressComponent;
	public static List<int> stressValues  = new List<int>();
	public static List<int> unpleasentValues  = new List<int>();
	public static List<float> stressValuesTimes  = new List<float>();
	public static List<float> unpleasentValuesTimes  = new List<float>();
	public static List<string> levels = new List<string>();
	public static List<string> stressStatus = new List<string>();
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
	private float timeLimit = 8;
	private int updatesNumber = 0;
	private static string createdFileName = "";
	private static int nextDataIndexToSave = 0;





	// Use this for initialization
	void Start () {	
		GameObject emptyObject =  GameObject.Find("dataSaver");
		if (emptyObject) {
			dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();

			if (dataSaver) {
				if (dataSaver.shouldSaveData) {
					enabled = false;
					this.writeValuesToFile ();
					SceneManager.LoadScene ("load_evaluation");
					return;
				}
			}
		}


		itemsNumber = 2;

		currentItemIndex = 0;
		/*
		GameObject canvas =  GameObject.Find ("Canvas_stress");
		CanvasGroup renderer = canvas.GetComponent<CanvasGroup>();
		renderer.alpha = 1f;
		renderer.blocksRaycasts = true;
		renderer.interactable = true;
		*/
		stressMarkerMoved = false;
		unpleasentMarkerMoved = false;
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

		this.startTime = Time.time;
	}

	// Update is called once per frame
	void Update () {
		float currrentTime = Time.time;
		if (currrentTime - this.startTime > this.timeLimit) {
			this.onDone ();
		}/*
		if (stressMarkerMoved && unpleasentMarkerMoved) {
			button.SetActive (true);
		}*/
		if(Input.anyKey){
			if (updatesNumber > 0) {
				if (updatesNumber == 15) {
					updatesNumber = 0;
					return;
				}
				updatesNumber++;
				return;
			}
			updatesNumber++;


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
			items[currentItemIndex].value += movement;
		}

	}

	void onDone() {
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		string levelText = "";
		string stressText = "";

		if (dataSaver) {
			stressText = dataSaver.condition;
			levelText = dataSaver.getLastN ().ToString ();
		}
		stressValues.Add(stressValue);
		unpleasentValues.Add(unpleasentValue);
		stressValuesTimes.Add(stressValueTime);
		unpleasentValuesTimes.Add(unpleasentValueTime);
		levels.Add (levelText);
		stressStatus.Add (stressText);
		this.writeValuesToFile ();
		SceneManager.LoadScene ("load_evaluation");
	}

	public void writeValuesToFile() {
		StreamWriter stream = null;
		StringBuilder stringRow;
		string path = Application.dataPath;
		string[] values = new string[6];
		if (createdFileName == "") {
			float time = Time.time;
			path = path + "/" + "stress_data_" + time.ToString ();
			stream = File.CreateText (path);
			createdFileName = path;


			values [0] = "stressful";
			values [1] = "unpleasent";
			values [2] = "stressful_rt";
			values [3] = "unpleasent_rt";
			values [4] = "level";
			values [5] = "stressStatus";
			//stressFile.WriteLine (values);
			stringRow = getStringFromArray (values);
			stream.WriteLine (stringRow);
		} else {
			stream = new StreamWriter (createdFileName, true);
		}

		/*
		for (int i = 0; i < stressValues.Count; i++) {
			values [0] = stressValues[i].ToString ();
			values [1] = unpleasentValues[i].ToString ();
			values [2] = ((int)stressValuesTimes[i]).ToString ();
			values [3] = ((int)unpleasentValuesTimes[i]).ToString ();
			values [4] = levels[i].ToString ();
			values [5] = stressStatus[i].ToString ();
			//stressFile.WriteLine (values);
			stringRow = getStringFromArray (values);
			stream.WriteLine (stringRow);
		}*/

		values [0] = stressValues[nextDataIndexToSave].ToString ();
		values [1] = unpleasentValues[nextDataIndexToSave].ToString ();
		values [2] = ((int)stressValuesTimes[nextDataIndexToSave]).ToString ();
		values [3] = ((int)unpleasentValuesTimes[nextDataIndexToSave]).ToString ();
		values [4] = levels[nextDataIndexToSave].ToString ();
		values [5] = stressStatus[nextDataIndexToSave].ToString ();
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
		stressMarkerMoved = true;
		stressValueTime = Time.time - startTime;
	}

	void unpleasentValueChanged() {
		unpleasentValue = (int)sliderUnpleasentComponent.value;
		unpleasentMarkerMoved = true;
		unpleasentValueTime = Time.time - startTime;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}


}
