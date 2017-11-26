using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;



public class start_nback : MonoBehaviour {

	public GameObject level;
	public GameObject useNback;
	public GameObject button;
	public Button buttonStart;
	public Button buttonQuit;

	// Use this for initialization
	void Start () {
		Time.timeScale = 1;
		GameObject canvas =  GameObject.Find ("Canvas_load");
		if (canvas) {
			CanvasGroup renderer = canvas.GetComponent<CanvasGroup> ();
			renderer.alpha = 0f;
			renderer.blocksRaycasts = false;
		}
		level = GameObject.Find ("Placeholder level");
		useNback = GameObject.Find ("Placeholder use nBack");
		var buttonStartObj = GameObject.Find ("Button_start");
		var buttonQuitObj = GameObject.Find ("Button_quit");
		buttonStart = buttonStartObj.GetComponent<Button> ();
		buttonStart.onClick.AddListener (onStart);
		buttonQuit = buttonQuitObj.GetComponent<Button> ();
		buttonQuit.onClick.AddListener (onQuit);
		//DontDestroyOnLoad(level);
		//DontDestroyOnLoad(useNback);
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
		SceneManager.LoadScene ("FlightSimTest");
	}

	void onQuit() {
		GameObject stressCanvas =  GameObject.Find ("Canvas_stress");
		if (stressCanvas) {
			stressEvaluation stressEvaluationClass = stressCanvas.GetComponent<stressEvaluation> ();

			stressEvaluationClass.writeValuesToFile ();
		}
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		if (loadCanvas) {
			loadEvaluation loadEvaluationClass = loadCanvas.GetComponent<loadEvaluation> ();

			loadEvaluationClass.writeValuesToFile ();
		}
		Application.Quit ();
	}


}
