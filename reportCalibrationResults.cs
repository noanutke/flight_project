using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class reportCalibrationResults : MonoBehaviour {

	// Use this for initialization
	void Start () {
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		if (loadCanvas) {
			loadCanvas.SetActive(false);
		}
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		int speed = dataSaver.moveSpeed;

		GameObject speedValue = GameObject.Find ("speedValue");

		UnityEngine.UI.Text speedValueText =  speedValue.GetComponent<UnityEngine.UI.Text> ();
		speedValueText.text = speed.ToString ();

	}


	// Update is called once per frame
	void Update () {
		if(Input.GetKeyDown(KeyCode.Space)){
			SceneManager.LoadScene ("N_back_input");
			return;
		}
	}
}
