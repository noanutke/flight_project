using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class instructions : MonoBehaviour {
	public Sprite one;
	public Sprite two;
	public Sprite zero_a;
	public Sprite zero_b;
	public Sprite no_n;
	public Sprite fixation;
	private float startTimeInstructions = -1;
	private float timeLimitInstructions = 1;
	private float startTimeFixation = -1;
	private float timeLimitFixation = 1;

	void Update () {
		float currrentTime = Time.time;
		if (startTimeFixation > -1 && currrentTime - this.startTimeFixation > this.timeLimitFixation) {
			SceneManager.LoadScene ("FlightSimTest");
			return;
		}
		if (startTimeInstructions > -1 && currrentTime - this.startTimeInstructions > this.timeLimitInstructions) {
			startTimeFixation = Time.time;
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
			int currentBlockIndex = dataSaver.currentBlockIndex;
			int length = dataSaver.getBlockLength ();
			if (currentBlockIndex < length) {
				if (dataSaver.getNbackStatus () != "withNback") {
					image.sprite = this.no_n;
				} else {
					int n = dataSaver.getN ();
					if (n == 1) {
						image.sprite = this.one;
					} else if (n == 2) {
						image.sprite = this.two;
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
		GameObject useNbackObj =  GameObject.Find ("TextNback");
		Text useNbackInput = useNbackObj.GetComponent<Text> ();
		string useNbackText = useNbackInput.text;
		GameObject levelInputObj =  GameObject.Find ("TextLevel");
		Text levelInput = levelInputObj.GetComponent<Text> ();
		string levelText = levelInput.text;
		GameObject orderObj =  GameObject.Find ("TextOrder");
		Text orderInput = orderObj.GetComponent<Text>();
		string orderText = orderInput.text;
		if (useNbackText == "no") {
			Texture2D tex = Resources.Load ("no") as Texture2D;
			image.sprite = this.no_n;
		} else if (levelText == "0") {
			image.sprite = this.zero_a;

		} else if (levelText == "1") {
			image.sprite = this.one;

		} else if (levelText == "2") {
			image.sprite = this.two;

		} else if (orderText == "1") {
			image.sprite = this.zero_a;
			
		} else {
			image.sprite = this.zero_b;
		}
	
	}

}
