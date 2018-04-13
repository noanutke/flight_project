using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class instructions : MonoBehaviour {
	public Sprite one;
	public Sprite two;
	public Sprite three;
	public Sprite zero_a;
	public Sprite zero_b;
	public Sprite no_n;
	public Sprite calibration;
	public Sprite fixation;

	private float startTimeInstructions = -1;
	private float timeLimitInstructions = 9;
	private float startTimeFixation = -1;
	private float timeLimitFixation = 1;
	private LSL_BCI_Input lslScript;
	private dataSaver dataSaver;

	private static int fixationSizeDelta = 60;

	void Update () {
		if (this.dataSaver.getIsCalibration () || this.dataSaver.getIsPractice ()) {
			// if we are in a non test condition - we move on when space is pressed
			if (Input.GetKeyDown (KeyCode.Space)) {
				SceneManager.LoadScene ("FlightSimTest");
				return;
			}
		}

		float currrentTime = Time.time;
		// check if we are already in fixation phase, and if we are - check if time limit passed
		if (startTimeFixation > -1 && currrentTime - this.startTimeFixation > this.timeLimitFixation) {
			this.lslScript.setMarker ("fixation_end_1");
			SceneManager.LoadScene ("FlightSimTest");
			return;
		}

		// check if we are in instructions phase, and if we are - check if time limit passed
		if (startTimeInstructions > -1 && currrentTime - this.startTimeInstructions > this.timeLimitInstructions) {
			startTimeFixation = Time.time;
			this.lslScript.setMarker ("instructions_end_1");
			if (this.dataSaver.getIsCalibration () || this.dataSaver.getIsPractice ()) { 
				SceneManager.LoadScene ("FlightSimTest");
				return;
			}
			this.lslScript.setMarker ("fixation_start_1");
			this.showFixation ();
		}
	}

	void showFixation() {
		this.timeLimitFixation = this.dataSaver.getFixationLength ();
		startTimeInstructions = -1;
		startTimeFixation = Time.time;
		Image image = GetComponent<Image> ();

		RectTransform trans = GetComponent<RectTransform> ();
		trans.sizeDelta = new Vector2 (instructions.fixationSizeDelta, instructions.fixationSizeDelta);
		image.sprite = this.fixation;
	}
		
	void Start () {		
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		if (loadCanvas) {
			loadCanvas.SetActive(false);
		}

		GameObject stressCanvas =  GameObject.Find ("Canvas_stress");
		if (stressCanvas) {
			stressCanvas.SetActive(false);
		}

		Image image = GetComponent<Image> ();
		startTimeInstructions = Time.time;

		GameObject dataSaverObject =  GameObject.Find("dataSaver");
		this.dataSaver = dataSaverObject.GetComponent<dataSaver> ();
		this.lslScript = this.dataSaver.getLslScript();

		this.lslScript.setMarker ("instructions_start_1");
		int currentBlockIndex = this.dataSaver.currentBlockIndex;

		if (this.dataSaver.getIsCalibration () == true) {
			image.sprite = this.calibration;
		}
		else if (this.dataSaver.getWithNBack() == false) {
			image.sprite = this.no_n;
		} else {
			string n = this.dataSaver.getN();
			if (n == "1") {
				image.sprite = this.one;
			} else if (n == "2") {
				image.sprite = this.two;
			} else if (n == "3") {
				image.sprite = this.three;
			} else {
				string type = this.dataSaver.getType ();
				if (type == "a" || type == "c") {
					image.sprite = this.zero_a;
				} else {
					image.sprite = this.zero_b;
				}
			}
		}
		return;
	}
}
