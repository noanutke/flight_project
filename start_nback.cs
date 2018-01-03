using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;



public class start_nback : MonoBehaviour {

	public GameObject level;
	public GameObject useNback;
	public GameObject button;
	public GameObject calibration;
	public Button buttonStart;
	public Button buttonStartCondition;
	public Button buttonQuit;
	public Button buttonSave;
	public static int speed = 170;
	private LSL_BCI_Input lslBCIInputScript;

	// Use this for initialization
	void Start () {

		//lslBCIInputScript = gameObject.AddComponent(typeof(LSL_BCI_Input)) as LSL_BCI_Input; 
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		//lslBCIInputScript.LSL_BCI_Send_Markers_Enabled = true;
		if (loadCanvas) {
			//renderer = stressCanvas.GetComponent<CanvasGroup> ();
			//renderer.alpha = 0f;
			//renderer.blocksRaycasts = false;
			loadCanvas.SetActive(false);
		}
		Time.timeScale = 1;
		/*
		GameObject canvas =  GameObject.Find ("Canvas_load");
		if (canvas) {
			CanvasGroup renderer = canvas.GetComponent<CanvasGroup> ();
			renderer.alpha = 0f;
			renderer.blocksRaycasts = false;
		}*/
		level = GameObject.Find ("Placeholder level");
		useNback = GameObject.Find ("Placeholder use nBack");
		calibration = GameObject.Find ("Placeholder use calibration");
		//GameObject speed = GameObject.Find ("Placeholder use speed");
		//Text speedInput = speed.GetComponent (Text);
		//speedInput.text = speed;

		var buttonStartObj = GameObject.Find ("Button_start");
		var buttonStartConditionObj = GameObject.Find ("Button_startCondition");
		var buttonQuitObj = GameObject.Find ("Button_quit");
		var buttonSaveObj = GameObject.Find ("Button_save");
		buttonStart = buttonStartObj.GetComponent<Button> ();
		buttonStartCondition = buttonStartConditionObj.GetComponent<Button> ();
		buttonStart.onClick.AddListener (onStart);
		buttonStartCondition.onClick.AddListener (onStart);
		buttonQuit = buttonQuitObj.GetComponent<Button> ();
		buttonQuit.onClick.AddListener (onQuit);

		buttonSave = buttonSaveObj.GetComponent<Button> ();
		buttonSave.onClick.AddListener (onSave);
		//DontDestroyOnLoad(level);
		//DontDestroyOnLoad(useNback);
	}

	public void setSpeed(int speedToSet) {
		speed = speedToSet;
	}

	public int getSpeed(int speedToSet) {
		return speed;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}
	// Update is called once per frame
	void Update () {

	}

	void onStart() {
		GameObject stressCanvas =  GameObject.Find ("Canvas_stress");
		if (stressCanvas) {
			stressCanvas.SetActive (false);
		}
		GameObject canvas = GameObject.Find ("openning canvas");
		CanvasGroup renderer = canvas.GetComponent<CanvasGroup>();
		renderer.alpha = 0f;
		renderer.blocksRaycasts = false;
		SceneManager.LoadScene ("Instructions");
	}

	void onSave() {
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();

		if (dataSaver) {
			dataSaver.saveData ();
		}
		SceneManager.LoadScene ("stress_evaluation");

	}

	void onQuit() {
		this.onSave ();
		SceneManager.LoadScene ("stress_evaluation");
	}


}
