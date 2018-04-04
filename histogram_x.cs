using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class histogram_x : MonoBehaviour {

	void Start () {
		StartCoroutine(ChangePosition());
	}

	void Update () {

	}

	IEnumerator ChangePosition() {
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		int orderInt = dataSaver.columnInHistogram;
		LSL_BCI_Input lslScript = dataSaver.getLslScript ();

		lslScript.setMarker ("score_score_" + orderInt.ToString ());

		Vector3 vec = new Vector3(0.0f, -2.0f, 0.0f);
		vec.x = 5.3f - 1.08f * (10f - orderInt - 1);
		transform.localPosition = vec;

		yield return new WaitForSeconds (9);
		int blockIndex = dataSaver.currentBlockIndex - 1;
		if (blockIndex == dataSaver.halfConditionIndex ||
			blockIndex == dataSaver.fullConditionIndex){
	
				SceneManager.LoadScene ("stress_evaluation");
		}
		else {
			SceneManager.LoadScene("Instructions");
		}
	}

	void Hide() {
		gameObject.SetActive(false);
	}

	void Show() {
		gameObject.SetActive(true);
	}
}
