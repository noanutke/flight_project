using UnityEngine;
using System.Collections;
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
	private float stressValue ;
	private float unpleasentValue;
	private static bool firstTime = true;
	private static StreamWriter stressFile;


	// Use this for initialization
	void Start () {		
		string path = Application.dataPath;
		path = path + "/" + "stress_data";
		stressFile = File.CreateText (path);
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
		SceneManager.LoadScene ("N_back_input");
		GameObject.Find ("Canvas").SetActive (false);
	}

	void writeValuesToFile() {
		StringBuilder stringRow;
		string[] values = new string[2];
		if (firstTime) {
			values [0] = "stressful";
			values [1] = "unpleasent";
			stressFile.WriteLine (values);
			stringRow = getStringFromArray (values);
			stressFile.WriteLine (stringRow);
		}
		values [0] = stressValue.ToString();
		values [1] = unpleasentValue.ToString();
		stressFile.WriteLine (values);
		stringRow = getStringFromArray (values);
		stressFile.WriteLine (stringRow);
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
