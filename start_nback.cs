using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;



public class start_nback : MonoBehaviour {

	public GameObject level;
	public GameObject useNback;
	public GameObject button;
	public GameObject calibration;
	public GameObject subjectNumber;
	public Button buttonStart;
	public Button buttonStartCondition;
	public Button buttonQuit;
	public Button buttonSave;
	public static int speed = 170;
	private Text useNbackInput;
	private Text levelInput;
	private Text calibrationInput;
	private Text subjectNumberInput;
	private Text speedInput;
	private Text conditionInput;
	private Text orderInput;
	private Text speedPlaceHolderInput;

	// Use this for initialization
	void Start () {
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		if (loadCanvas) {
			loadCanvas.SetActive(false);
		}
		Time.timeScale = 1;

		level = GameObject.Find ("Placeholder level");
		useNback = GameObject.Find ("Placeholder use nBack");
		calibration = GameObject.Find ("Placeholder use calibration");


		var buttonStartObj = GameObject.Find ("Button_start");
		var buttonStartConditionObj = GameObject.Find ("Button_startCondition");
		var buttonQuitObj = GameObject.Find ("Button_quit");
		var buttonSaveObj = GameObject.Find ("Button_save");
		buttonStart = buttonStartObj.GetComponent<Button> ();
		buttonStartCondition = buttonStartConditionObj.GetComponent<Button> ();
		buttonStart.onClick.AddListener (onStartBlock);
		buttonStartCondition.onClick.AddListener (onStartCondition);
		buttonQuit = buttonQuitObj.GetComponent<Button> ();
		buttonQuit.onClick.AddListener (onQuit);

		buttonSave = buttonSaveObj.GetComponent<Button> ();

		GameObject useNbackObj =  GameObject.Find ("TextNback");
		this.useNbackInput = useNbackObj.GetComponent<Text>();
		GameObject levelInputObj =  GameObject.Find ("TextLevel");
		this.levelInput = levelInputObj.GetComponent<Text> ();
		GameObject calibrationInputObj =  GameObject.Find ("TextCalibration");
		this.calibrationInput = calibrationInputObj.GetComponent<Text>();
		GameObject subjectNumberInputObj =  GameObject.Find ("TextSubjectNumber");
		this.subjectNumberInput = subjectNumberInputObj.GetComponent<Text>();
		GameObject speedInputObj =  GameObject.Find ("TextSpeed");
		this.speedInput = speedInputObj.GetComponent<Text> ();

		GameObject conditionObj =  GameObject.Find ("TextBaseCondition");
		this.conditionInput = conditionObj.GetComponent<Text> ();

		GameObject orderObj =  GameObject.Find ("TextOrder");
		this.orderInput = orderObj.GetComponent<Text> ();

		GameObject speedPlaceHolderObj =  GameObject.Find ("Placeholder use speed");
		this.speedPlaceHolderInput = speedPlaceHolderObj.GetComponent<Text> ();

	}

	public void setSpeed(int speedToSet) {
		speed = speedToSet;
	}

	public int getSpeed(int speedToSet) {
		return speed;
	}

	void Awake() {
	}
	// Update is called once per frame
	void Update () {

	}

	string initStressCondition() {
		if (this.conditionInput.text == "") {
			return "noStress";
		}
		else {
			return this.conditionInput.text == "yes" ? "noStress" : "stress";
		}
	}

	int initSpeed() {
		if (this.speedInput.text == "") {
			return 170;
		} else {
			return int.Parse (this.speedInput.text);
		}
	}

	void onStartBlock() {
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();


		if (dataSaver) {

			string subjectNumber = this.subjectNumberInput.text;
			int speed = this.initSpeed ();
			string condition = this.initStressCondition ();
			bool withNBack;
			if (this.useNbackInput.text == "") {
				withNBack = false;
			} else {
				withNBack = this.useNbackInput.text == "yes" ? true : false;
			}

			bool isCalibration;
			int ringsFailuresForCalibrationTarget = 0;
			if (this.calibrationInput.text == "") {
				isCalibration = false;
			} else {
				isCalibration = true;
				float percentSuccessToPass = float.Parse (calibrationInput.text);

				ringsFailuresForCalibrationTarget =  dataSaver.ringsAmountForCalibrationPhase 
					- (int)(percentSuccessToPass / 
					100.0 * dataSaver.ringsAmountForCalibrationPhase);

	
			}

			string ringSize = "big";
			string nLevel = this.levelInput.text == ""? "1" : this.levelInput.text;
			bool isPractice = true;

			dataSaver.initBlock (condition, speed, subjectNumber, nLevel, ringSize, withNBack, isPractice, isCalibration,
				ringsFailuresForCalibrationTarget);

		}
		this.loadInstructions ();

	}

	void onStartCondition() {
		GameObject emptyObject = GameObject.Find ("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		if (dataSaver) {

			string subjectNumber = this.subjectNumberInput.text;	
			int speed = this.initSpeed ();
			string condition = this.initStressCondition ();
			string order = this.orderInput.text;

			dataSaver.initCondition (condition, speed, subjectNumber, order);
		}
		this.loadInstructions ();
	}

	void loadInstructions() {
		SceneManager.LoadScene ("stress_evaluation");
	}


	void onQuit() {
		SceneManager.LoadScene ("stress_evaluation");
	}


}
