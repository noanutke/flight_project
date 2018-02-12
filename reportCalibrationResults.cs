using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class reportCalibrationResults : MonoBehaviour {
	public GameObject button;
	public Button buttonComponent;
	// Use this for initialization
	void Start () {
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		if (loadCanvas) {
			loadCanvas.SetActive(false);
		}
		button = GameObject.Find ("ButtonFinish");
		buttonComponent = button.GetComponent<Button> ();
		buttonComponent.onClick.AddListener (onDone);

		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		int speed = dataSaver.moveSpeed;

		GameObject speedValue = GameObject.Find ("speedValue");

		UnityEngine.UI.Text speedValueText =  speedValue.GetComponent<UnityEngine.UI.Text> ();


		speedValueText.text = speed.ToString ();

	}
		
	void onDone() {
		SceneManager.LoadScene ("N_back_input");
	}

	// Update is called once per frame
	void Update () {

	}
}
