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
	public Sprite fixation;
	private float startTimeInstructions = -1;
	private float timeLimitInstructions = 1;
	private float startTimeFixation = -1;
	private float timeLimitFixation = 1;
	private LSL_BCI_Input lslScript;

	void Update () {
		float currrentTime = Time.time;
		if (startTimeFixation > -1 && currrentTime - this.startTimeFixation > this.timeLimitFixation) {
			this.lslScript.setMarker ("endFixation");
			SceneManager.LoadScene ("FlightSimTest");
			return;
		}
		if (startTimeInstructions > -1 && currrentTime - this.startTimeInstructions > this.timeLimitInstructions) {
			startTimeFixation = Time.time;
			this.lslScript.setMarker ("endInstructions");
			this.lslScript.setMarker ("startFixation");
			this.showFixation ();
		}
	}

	void showFixation() {
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
		Image image = GetComponent<Image> ();

		startTimeInstructions = Time.time;


		GameObject dataSaverObject =  GameObject.Find("dataSaver");
		if (dataSaverObject) {
			dataSaver dataSaver = dataSaverObject.GetComponent<dataSaver> ();
			this.lslScript = dataSaver.getLslScript();

			this.lslScript.setMarker ("startInstructions");
			int currentBlockIndex = dataSaver.currentBlockIndex;

			if (dataSaver.getWithNBack() == false) {
				image.sprite = this.no_n;
			} else {
				int n = dataSaver.getN();
				if (n == 1) {
					image.sprite = this.one;
				} else if (n == 2) {
					image.sprite = this.two;
				} else if (n == 3) {
					image.sprite = this.three;
				} else {
					string type = dataSaver.getType ();
					if (type == "a") {
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
