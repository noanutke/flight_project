using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class reportSuccessRates : MonoBehaviour {
	public GameObject button;
	public Button buttonComponent;
	// Use this for initialization
	void Start () {
		GameObject loadCanvas =  GameObject.Find ("Canvas_load");
		//lslBCIInputScript.LSL_BCI_Send_Markers_Enabled = true;
		if (loadCanvas) {
			loadCanvas.SetActive(false);
		}
		button = GameObject.Find ("Button");
		buttonComponent = button.GetComponent<Button> ();
		buttonComponent.onClick.AddListener (onDone);

		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		int nBackSuccess = dataSaver.nBackSuccess;
		int flightSuccess = dataSaver.flightSuccess;

		GameObject nBackValue = GameObject.Find ("nbackSuccessRateValue");
		GameObject flightValue = GameObject.Find ("flightSuccessRateValue");

		UnityEngine.UI.Text nBackValueText =  nBackValue.GetComponent<UnityEngine.UI.Text> ();
		UnityEngine.UI.Text flightValueText =  flightValue.GetComponent<UnityEngine.UI.Text> ();


		flightValueText.text = flightSuccess.ToString () + "%";

		if (dataSaver.getLastBlockNbackStatus () == true) {
			nBackValueText.text = nBackSuccess.ToString () + "%";
		} else {
			nBackValueText.text = "";
		}

	}

	void onDone() {
		SceneManager.LoadScene ("N_back_input");
	}

	// Update is called once per frame
	void Update () {
	
	}
}
