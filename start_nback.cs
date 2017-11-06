using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;



public class start_nback : MonoBehaviour {

	public GameObject level;
	public GameObject useNback;
	public GameObject button;
	public Button start;

	// Use this for initialization
	void Start () {
		level = GameObject.Find ("Placeholder level");
		useNback = GameObject.Find ("Placeholder use nBack");
		button = GameObject.Find ("Button");
		start = button.GetComponent<Button> ();
		start.onClick.AddListener (onStart);
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


}
