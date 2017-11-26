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
	public static List<string> levels = new List<string>();
	public static List<string> stressStatus = new List<string>();
	private int stressValue;
	private int unpleasentValue;
	//private static bool firstTime = true;
	private static StreamWriter stressFile;


	// Use this for initialization
	void Start () {		
		GameObject canvas =  GameObject.Find ("Canvas_stress");
		CanvasGroup renderer = canvas.GetComponent<CanvasGroup>();
		renderer.alpha = 1f;
		renderer.blocksRaycasts = true;
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
		buttonComponent.onClick.AddListener (onDone);
	}

	void onDone() {
		GameObject useNbackObj =  GameObject.Find ("TextNback");
		Text useNbackInput = useNbackObj.GetComponent<Text>();
		GameObject levelInputObj =  GameObject.Find ("TextLevel");
		Text levelInput = levelInputObj.GetComponent<Text>();
		string levelText = levelInput.text;
		string stressText = useNbackInput.text;

		stressValues.Add(stressValue);
		unpleasentValues.Add(unpleasentValue);
		levels.Add (levelText);
		stressStatus.Add (stressText);


		GameObject canvas =  GameObject.Find ("Canvas_load");
		if (canvas) {
			CanvasGroup renderer = canvas.GetComponent<CanvasGroup> ();
			renderer.alpha = 1f;
			renderer.blocksRaycasts = true;
			canvas.SetActive (false);
		}
		SceneManager.LoadScene ("load_evaluation");
	}
		
	public void writeValuesToFile() {
		string path = Application.dataPath;
		path = path + "/" + "stress_data";
		stressFile = File.CreateText (path);
		StringBuilder stringRow;
		string[] values = new string[4];
		values [0] = "stressful";
		values [1] = "unpleasent";
		values [2] = "level";
		values [3] = "stressStatus";
		//stressFile.WriteLine (values);
		stringRow = getStringFromArray (values);
		stressFile.WriteLine (stringRow);

		for (int i = 0; i < stressValues.Count; i++) {
			values [0] = stressValues[i].ToString ();
			values [1] = unpleasentValues[i].ToString ();
			values [2] = levels[i].ToString ();
			values [3] = stressStatus[i].ToString ();
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

	void stressValueChanged() {
		stressValue = (int)sliderStressComponent.value;
		stressMarkerMoved = true;
	}

	void unpleasentValueChanged() {
		unpleasentValue = (int)sliderUnpleasentComponent.value;
		unpleasentMarkerMoved = true;
	}

	void Awake() {
		 DontDestroyOnLoad(this.gameObject);
	}
	// Update is called once per frame
	void Update () {
		if (stressMarkerMoved && unpleasentMarkerMoved) {
			button.SetActive (true);
		}
	}

}
