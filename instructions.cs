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

	void Update () {
		float currrentTime = Time.time;
		if (startTimeFixation > -1 && currrentTime - this.startTimeFixation > this.timeLimitFixation) {
			this.lslScript.setMarker ("eFixation");
			float startTime = Time.time;
			print("endFixation");
			print(startTime);
			SceneManager.LoadScene ("FlightSimTest");
			return;
		}
		if (startTimeInstructions > -1 && currrentTime - this.startTimeInstructions > this.timeLimitInstructions) {
			startTimeFixation = Time.time;
			this.lslScript.setMarker ("eInstructions");
			this.lslScript.setMarker ("sFixation");
			this.showFixation ();
		}
	}

	void showFixation() {
		this.timeLimitFixation = this.dataSaver.fixationsArray [this.dataSaver.currentBlockIndex];
		startTimeInstructions = -1;
		startTimeFixation = Time.time;
		Image image = GetComponent<Image> ();

		RectTransform trans = GetComponent<RectTransform> ();
		trans.sizeDelta = new Vector2 (60, 60);
		image.sprite = this.fixation;
	}

	// Use this for initialization
	void Start () {
		
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		if (loadCanvas) {
			//renderer = stressCanvas.GetComponent<CanvasGroup> ();
			//renderer.alpha = 0f;
			//renderer.blocksRaycasts = false;
			loadCanvas.SetActive(false);
		}
		GameObject stressCanvas =  GameObject.Find ("Canvas_stress");
		if (stressCanvas) {
			//renderer = stressCanvas.GetComponent<CanvasGroup> ();
			//renderer.alpha = 0f;
			//renderer.blocksRaycasts = false;
			stressCanvas.SetActive(false);
		}
		Image image = GetComponent<Image> ();

		startTimeInstructions = Time.time;


		GameObject dataSaverObject =  GameObject.Find("dataSaver");
		if (dataSaverObject) {
			this.dataSaver = dataSaverObject.GetComponent<dataSaver> ();
			this.lslScript = this.dataSaver.getLslScript();

			this.lslScript.setMarker ("sInstructions");
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

}
