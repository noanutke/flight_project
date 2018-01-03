using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;



public class loadEvaluation : MonoBehaviour {

	public GameObject sliderPhysicalObj;
	public GameObject sliderMentalObj;
	public GameObject sliderTemporalObj;
	public GameObject sliderPerformanceObj;
	public GameObject sliderFrustrationObj;
	public GameObject sliderEffortObj;
	public GameObject button;
	public Button buttonComponent;
	private bool physicalMarkerMoved;
	private bool mentalMarkerMoved;
	private bool temporalMarkerMoved;
	private bool performanceMarkerMoved;
	private bool frustrationMarkerMoved;
	private bool effortMarkerMoved;
	private Slider sliderPhysicalComponent;
	private Slider sliderMentalComponent;
	private Slider sliderTemporalComponent;
	private Slider sliderFrustrationComponent;
	private Slider sliderEffortComponent;
	private Slider sliderPerformanceComponent;
	public static List<int> physicalValues  = new List<int>();
	public static List<int> mentalValues  = new List<int>();
	public static List<int> temporalValues  = new List<int>();
	public static List<int> frustrationValues  = new List<int>();
	public static List<int> performanceValues  = new List<int>();
	public static List<int> effortValues  = new List<int>();

	public static List<float> physicalValuesTimes  = new List<float>();
	public static List<float> mentalValuesTimes  = new List<float>();
	public static List<float> temporalValuesTimes  = new List<float>();
	public static List<float> frustrationValuesTimes  = new List<float>();
	public static List<float> performanceValuesTimes  = new List<float>();
	public static List<float> effortValuesTimes  = new List<float>();

	public static List<string> levels = new List<string>();
	public static List<string> stressStatus = new List<string>();
	public static int physicalValue = 50;
	public static int mentalValue = 50;
	public static int temporalValue = 50;
	public static int frustrationValue = 50;
	public static int performanceValue = 50;
	public static int effortValue = 50;
	public static float physicalValueTime = 0.0f;
	public static float mentalValueTime = 0.0f;
	public static float temporalValueTime = 0.0f;
	public static float frustrationValueTime = 0.0f;
	public static float performanceValueTime = 0.0f;
	public static float effortValueTime = 0.0f;
	//private static bool firstTime = true;
	private static StreamWriter stressFile;
	private int currentItemIndex;
	private int itemsNumber;
	private Slider[] items;
	private int updatesNumber;
	private float startTime = 0;
	private float timeLimit = 25;
	private static string createdFileName = "";
	private static int nextDataIndexToSave = 0;

	void setMarkerMoved(bool status) {
		this.effortMarkerMoved = status;
		this.frustrationMarkerMoved = status;
		this.mentalMarkerMoved = status;
		this.physicalMarkerMoved = status;
		this.performanceMarkerMoved = status;
		this.temporalMarkerMoved = status;
	}

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

	// Use this for initialization
	void Start () {
		GameObject stressCanvas =  GameObject.Find ("Canvas_stress");
		if (stressCanvas) {
			//renderer = stressCanvas.GetComponent<CanvasGroup> ();
			//renderer.alpha = 0f;
			//renderer.blocksRaycasts = false;
			stressCanvas.SetActive(false);
		}
		GameObject emptyObject =  GameObject.Find("dataSaver");
		if (emptyObject) {
			dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();

			if (dataSaver) {
				if (dataSaver.shouldSaveData) {
					enabled = false;
					this.writeValuesToFile ();
					this.gameObject.SetActive (false);
					Application.Quit ();
					return;
				}
			}
		}
			
		startTime = 0;
		timeLimit = 25;
		updatesNumber = 0;
		itemsNumber = 6;
		currentItemIndex = 0;
		GameObject canvas =  GameObject.Find ("Canvas_stress");
		if (canvas) {
			CanvasGroup renderer = canvas.GetComponent<CanvasGroup> ();
			renderer.alpha = 0f;
			renderer.blocksRaycasts = false;
			renderer.interactable = false;
		}
		GameObject canvasLoad =  GameObject.Find ("Canvas_load");
		CanvasGroup rendererLoad = canvasLoad.GetComponent<CanvasGroup>();
		rendererLoad.alpha = 1f;
		rendererLoad.blocksRaycasts = true;
		rendererLoad.interactable = true;
		setMarkerMoved (false);
		findAllObjects ();
		findAllComponents ();
		button = GameObject.Find ("Button_load");
		buttonComponent = button.GetComponent<Button> ();
		button.SetActive (false);
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
		//buttonComponent.onClick.AddListener (onDone);
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
		this.startTime = Time.time;
	}

	// Update is called once per frame
	void Update () {
		float currrentTime = Time.time;
		if (currrentTime - this.startTime > this.timeLimit) {
			this.timeLimit = 999999999;
			this.onDone ();
		}
		/*
		if (mentalMarkerMoved && physicalMarkerMoved && temporalMarkerMoved &&
			effortMarkerMoved && performanceMarkerMoved && frustrationMarkerMoved) {
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

		performanceValues.Add(performanceValue);
		temporalValues.Add(temporalValue);
		mentalValues.Add(mentalValue);
		physicalValues.Add(physicalValue);
		frustrationValues.Add(frustrationValue);
		effortValues.Add(effortValue);

		performanceValuesTimes.Add(performanceValueTime);
		temporalValuesTimes.Add(temporalValueTime);
		mentalValuesTimes.Add(mentalValueTime);
		physicalValuesTimes.Add(physicalValueTime);
		frustrationValuesTimes.Add(frustrationValueTime);
		effortValuesTimes.Add(effortValueTime);

		levels.Add (levelText);
		stressStatus.Add (stressText);
		this.writeValuesToFile ();

		if (dataSaver && dataSaver.currentBlockIndex < dataSaver.getBlockLength()) {

			SceneManager.LoadScene ("Instructions");
		}
		else{
			//canvas =  GameObject.Find ("openning canvas");
			//renderer = canvas.GetComponent<CanvasGroup>();
			//renderer.alpha = 1f;
			//renderer.blocksRaycasts = true;
			if (dataSaver.showSuccessRate == true) {
				SceneManager.LoadScene ("successRates");
			} else {
				SceneManager.LoadScene ("N_back_input");
			}
		}

	}

	public void writeValuesToFile() {
		StreamWriter stream = null;
		StringBuilder stringRow;
		string path = Application.dataPath;
		string[] values = new string[14];

		if (createdFileName == "") {
			float time = Time.time;
			path = path + "/" + "load_data_" + time.ToString ();
			stream = File.CreateText (path);
			createdFileName = path;

			values [0] = "mental";
			values [1] = "physical";
			values [2] = "temporal";
			values [3] = "performance";
			values [4] = "effort";
			values [5] = "frustration";

			values [6] = "mental_rt";
			values [7] = "physical_rt";
			values [8] = "temporal_rt";
			values [9] = "performance_rt";
			values [10] = "effort_rt";
			values [11] = "frustration_rt";

			values [12] = "level";
			values [13] = "stressStatus";
			//stressFile.WriteLine (values);
			stringRow = getStringFromArray (values);
			stream.WriteLine (stringRow);
		} else {
			stream = new StreamWriter (createdFileName, true);
		}
			
		values [0] = mentalValues[nextDataIndexToSave].ToString ();
		values [1] = physicalValues[nextDataIndexToSave].ToString ();
		values [2] = temporalValues[nextDataIndexToSave].ToString ();
		values [3] = performanceValues[nextDataIndexToSave].ToString ();
		values [4] = effortValues[nextDataIndexToSave].ToString ();
		values [5] = frustrationValues[nextDataIndexToSave].ToString ();

		values [6] = ((int)mentalValuesTimes[nextDataIndexToSave]).ToString ();
		values [7] = ((int)physicalValuesTimes[nextDataIndexToSave]).ToString ();
		values [8] = ((int)temporalValuesTimes[nextDataIndexToSave]).ToString ();
		values [9] = ((int)performanceValuesTimes[nextDataIndexToSave]).ToString ();
		values [10] = ((int)effortValuesTimes[nextDataIndexToSave]).ToString ();
		values [11] = ((int)frustrationValuesTimes[nextDataIndexToSave]).ToString ();

		values [12] = levels[nextDataIndexToSave].ToString ();
		values [13] = stressStatus[nextDataIndexToSave].ToString ();
		//stressFile.WriteLine (values);
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

	void mentalValueChanged() {
		mentalValue = (int)sliderMentalComponent.value;
		mentalMarkerMoved = true;
		mentalValueTime = Time.time - startTime;
	}

	void physicalValueChanged() {
		physicalValue = (int)sliderPhysicalComponent.value;
		physicalMarkerMoved = true;
		physicalValueTime = Time.time - startTime;
	}

	void temporalValueChanged() {
		temporalValue = (int)sliderTemporalComponent.value;
		temporalMarkerMoved = true;
		temporalValueTime = Time.time - startTime;
	}

	void performaceValueChanged() {
		performanceValue = (int)sliderPerformanceComponent.value;
		performanceMarkerMoved = true;
		performanceValueTime = Time.time - startTime;
	}

	void effortValueChanged() {
		effortValue = (int)sliderEffortComponent.value;
		effortMarkerMoved = true;
		effortValueTime = Time.time - startTime;
	}

	void frustrationValueChanged() {
		frustrationValue = (int)sliderFrustrationComponent.value;
		frustrationMarkerMoved = true;
		frustrationValueTime = Time.time - startTime;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}

}
