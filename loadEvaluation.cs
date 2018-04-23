using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;



public class loadEvaluation : MonoBehaviour {

	private GameObject sliderPhysicalObj;
	private GameObject sliderMentalObj;
	private GameObject sliderTemporalObj;
	private GameObject sliderPerformanceObj;
	private GameObject sliderFrustrationObj;
	private GameObject sliderEffortObj;

	private Slider sliderPhysicalComponent;
	private Slider sliderMentalComponent;
	private Slider sliderTemporalComponent;
	private Slider sliderFrustrationComponent;
	private Slider sliderEffortComponent;
	private Slider sliderPerformanceComponent;
	private bool inSecondSession = false;

	private int physicalValue = 50;
	private int mentalValue = 50;
	private int temporalValue = 50;
	private int frustrationValue = 50;
	private int performanceValue = 50;
	private int effortValue = 50;

	private int currentItemIndex;
	private Slider[] items;
	private float startTime = 0;
	private float timeLimit = 21;
	private LSL_BCI_Input lslScript;
	private dataSaver dataSaverScript;

	private static int itemsNumber = 6;
	private static StreamWriter stressFile;
	private static string createdFileName = "";

	void findAllObjects() {
		this.sliderMentalObj = GameObject.Find ("Slider_mentalDemand");
		this.sliderPhysicalObj = GameObject.Find ("Slider_physicalDemand");
		this.sliderTemporalObj = GameObject.Find ("Slider_temporal");
		this.sliderPerformanceObj = GameObject.Find ("Slider_performance");
		this.sliderEffortObj = GameObject.Find ("Slider_effort");
		this.sliderFrustrationObj = GameObject.Find ("Slider_frustration");
	}

	void findAllComponents() {
		this.sliderMentalComponent = sliderMentalObj.GetComponent<Slider> ();
		this.sliderPhysicalComponent = sliderPhysicalObj.GetComponent<Slider> ();
		this.sliderPerformanceComponent = sliderPerformanceObj.GetComponent<Slider> ();
		this.sliderFrustrationComponent = sliderFrustrationObj.GetComponent<Slider> ();
		this.sliderTemporalComponent = sliderTemporalObj.GetComponent<Slider> ();
		this.sliderEffortComponent = sliderEffortObj.GetComponent<Slider> ();
	}

	void addListeners() {
		this.sliderTemporalComponent.onValueChanged.AddListener (delegate {
			temporalValueChanged ();
		});
		this.sliderPhysicalComponent.onValueChanged.AddListener (delegate {
			physicalValueChanged ();
		});
		this.sliderMentalComponent.onValueChanged.AddListener (delegate {
			mentalValueChanged ();
		});
		this.sliderEffortComponent.onValueChanged.AddListener (delegate {
			effortValueChanged ();
		});
		this.sliderFrustrationComponent.onValueChanged.AddListener (delegate {
			frustrationValueChanged ();
		});
		this.sliderPerformanceComponent.onValueChanged.AddListener (delegate {
			performaceValueChanged ();
		});
	}


	void Start () {
		GameObject stressCanvas =  GameObject.Find ("Canvas_stress");
		if (stressCanvas) {
			stressCanvas.SetActive(false);
		}
			
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaverScript = emptyObject.GetComponent<dataSaver> ();
		if (dataSaverScript.getIsLastPractice()) {
			timeLimit = int.MaxValue;
		}
		this.lslScript = dataSaverScript.getLslScript ();
		currentItemIndex = 0;

		findAllObjects ();
		findAllComponents ();

		this.sliderTemporalComponent.onValueChanged.AddListener (delegate {
			temporalValueChanged ();
		});
		this.sliderPhysicalComponent.onValueChanged.AddListener (delegate {
			physicalValueChanged ();
		});
		this.sliderMentalComponent.onValueChanged.AddListener (delegate {
			mentalValueChanged ();
		});
		this.sliderEffortComponent.onValueChanged.AddListener (delegate {
			effortValueChanged ();
		});
		this.sliderFrustrationComponent.onValueChanged.AddListener (delegate {
			frustrationValueChanged ();
		});
		this.sliderPerformanceComponent.onValueChanged.AddListener (delegate {
			performaceValueChanged ();
		});

		// paint in green the active slider (the first one), and the rest in black
		items = new Slider[] {sliderMentalComponent, sliderPhysicalComponent, sliderTemporalComponent,
			sliderPerformanceComponent, sliderEffortComponent, sliderFrustrationComponent};
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
		this.lslScript.setMarker ("eval_start_1_load_1");

		this.startTime = Time.time;
	}


	void Update () {
		// If we are in a practice block - we wait until space is pressed
		if (dataSaverScript.getIsLastPractice()) {
			if(Input.GetKeyDown(KeyCode.Space)){
				SceneManager.LoadScene ("Instructions");
				return;
			}
		}

		// check if time limit has passed
		float currrentTime = Time.time;
		if (currrentTime - this.startTime > this.timeLimit) {
			this.onDone ();
		}

		if(Input.anyKeyDown) {
			// key is down so we need to make the next scale active (paint the next scale in green)
			this.updateActiveScale();
		}

		// If get here if no key was pressed, so we check for change in joystick horizontal axis
		var movement = Input.GetAxis ("Horizontal");
		if (currentItemIndex < itemsNumber) {
			items[currentItemIndex].value += movement/8;// we devide the movement by half to make the movement more delecate
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
		string nlevelText = dataSaverScript.getLastN ();
		string ringSizeText = dataSaverScript.getLastRingSize();
		string isPractice = dataSaverScript.getIsLastPractice().ToString ();
		string isBaseline = dataSaverScript.getLastIsBaseline().ToString ();
		string speed = dataSaverScript.moveSpeed.ToString ();

		this.writeValuesToFile (stressText, nlevelText, ringSizeText, isPractice, isBaseline, speed);
		this.lslScript.setMarker ("eval_end_1_load_1");

		float currrentTime = Time.time;
		SceneManager.LoadScene ("N_back_input");
		dataSaverScript.inSecondSession = true;
	}

	public void writeValuesToFile(string stressText, string levelText, string ringSizeText, string isPractice, 
		string speed, string isBaseline) {
		StreamWriter stream = null;
		StringBuilder stringRow;
		string path = Application.dataPath;
		string[] values = new string[13];

		if (createdFileName == "") {// create the file and print the headers
			float time = Time.time;
			path = path + "/" + "load_data_sub_" + this.dataSaverScript.subjectNumber + "_time_" + time.ToString ();
			stream = File.CreateText (path);
			createdFileName = path;

			values [0] = "mental";
			values [1] = "physical";
			values [2] = "temporal";
			values [3] = "performance";
			values [4] = "effort";
			values [5] = "frustration";

			values [6] = "nlevel";
			values [7] = "stressStatus";
			values [8] = "ringSize";
			values [9] = "isPractice";
			values [10] = "speed";
			values [11] = "difficultLevel";
			values [12] =  "isBaseline";

			stringRow = getStringFromArray (values);
			stream.WriteLine (stringRow);
		} else {	// file was already created so just open the stream
			stream = new StreamWriter (createdFileName, true);
		}
			
		values [0] = mentalValue.ToString();
		values [1] = physicalValue.ToString ();
		values [2] = temporalValue.ToString ();
		values [3] = performanceValue.ToString ();
		values [4] = effortValue.ToString ();
		values [5] = frustrationValue.ToString ();

		values [6] = levelText.ToString ();
		values [7] = stressText.ToString ();
		values [8] = ringSizeText.ToString ();
		values [9] = isPractice.ToString ();
		values [10] = speed.ToString ();
		values [11] = this.dataSaverScript.getDifficultLevel (levelText.ToString (), ringSizeText);
		values [12] = isBaseline.ToString ();

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

	void mentalValueChanged() {
		mentalValue = (int)sliderMentalComponent.value;
	}

	void physicalValueChanged() {
		physicalValue = (int)sliderPhysicalComponent.value;
	}

	void temporalValueChanged() {
		temporalValue = (int)sliderTemporalComponent.value;
	}

	void performaceValueChanged() {
		performanceValue = (int)sliderPerformanceComponent.value;
	}

	void effortValueChanged() {
		effortValue = (int)sliderEffortComponent.value;
	}

	void frustrationValueChanged() {
		frustrationValue = (int)sliderFrustrationComponent.value;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}
}
