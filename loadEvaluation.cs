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
	public static List<string> levels = new List<string>();
	public static List<string> stressStatus = new List<string>();
	public static int physicalValue;
	public static int mentalValue;
	public static int temporalValue;
	public static int frustrationValue;
	public static int performanceValue;
	public static int effortValue;
	//private static bool firstTime = true;
	private static StreamWriter stressFile;

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
		
		GameObject canvas =  GameObject.Find ("Canvas_stress");
		if (canvas) {
			CanvasGroup renderer = canvas.GetComponent<CanvasGroup> ();
			renderer.alpha = 0f;
			renderer.blocksRaycasts = false;
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
		buttonComponent.onClick.AddListener (onDone);
	}

	void onDone() {
		GameObject useNbackObj =  GameObject.Find ("TextNback");
		Text useNbackInput = useNbackObj.GetComponent<Text>();
		GameObject levelInputObj =  GameObject.Find ("TextLevel");
		Text levelInput = levelInputObj.GetComponent<Text>();
		string levelText = levelInput.text;
		string stressText = useNbackInput.text;

		performanceValues.Add(performanceValue);
		temporalValues.Add(temporalValue);
		mentalValues.Add(mentalValue);
		physicalValues.Add(physicalValue);
		frustrationValues.Add(frustrationValue);
		effortValues.Add(effortValue);
		levels.Add (levelText);
		stressStatus.Add (stressText);


		GameObject canvas =  GameObject.Find ("openning canvas");
		CanvasGroup renderer = canvas.GetComponent<CanvasGroup>();
		renderer.alpha = 1f;
		renderer.blocksRaycasts = true;
		canvas.SetActive (false);
		SceneManager.LoadScene ("N_back_input");
	}

	public void writeValuesToFile() {
		string path = Application.dataPath;
		path = path + "/" + "load_data";
		stressFile = File.CreateText (path);
		StringBuilder stringRow;
		string[] values = new string[8];
		values [0] = "mental";
		values [1] = "physical";
		values [2] = "temporal";
		values [3] = "performance";
		values [4] = "effort";
		values [5] = "frustration";
		values [6] = "level";
		values [7] = "stressStatus";
		//stressFile.WriteLine (values);
		stringRow = getStringFromArray (values);
		stressFile.WriteLine (stringRow);

		for (int i = 0; i < mentalValues.Count; i++) {
			values [0] = mentalValues[i].ToString ();
			values [1] = physicalValues[i].ToString ();
			values [2] = temporalValues[i].ToString ();
			values [3] = performanceValues[i].ToString ();
			values [4] = effortValues[i].ToString ();
			values [5] = frustrationValues[i].ToString ();
			values [6] = levels[i].ToString ();
			values [7] = stressStatus[i].ToString ();
			//stressFile.WriteLine (values);
			stringRow = getStringFromArray (values);
			stressFile.WriteLine (stringRow);
		}
		stressFile.Close ();
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
	}

	void physicalValueChanged() {
		physicalValue = (int)sliderPhysicalComponent.value;
		physicalMarkerMoved = true;
	}

	void temporalValueChanged() {
		temporalValue = (int)sliderTemporalComponent.value;
		temporalMarkerMoved = true;
	}

	void performaceValueChanged() {
		performanceValue = (int)sliderPerformanceComponent.value;
		performanceMarkerMoved = true;
	}

	void effortValueChanged() {
		effortValue = (int)sliderEffortComponent.value;
		effortMarkerMoved = true;
	}

	void frustrationValueChanged() {
		frustrationValue = (int)sliderFrustrationComponent.value;
		frustrationMarkerMoved = true;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}
	// Update is called once per frame
	void Update () { 
		if (mentalMarkerMoved && physicalMarkerMoved && temporalMarkerMoved &&
		effortMarkerMoved && performanceMarkerMoved && frustrationMarkerMoved) {
			button.SetActive (true);
		}
	}

}
