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
		InputField levelText = level.GetComponent<InputField> ();
		InputField useNbackText = useNback.GetComponent<InputField> ();
		GameObject canvas = GameObject.Find ("openning canvas");
		SceneManager.LoadScene ("FlightSimTest");

	}

	void onQuit() {
		Application.Quit ();
	}


}
