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
		float nBackSuccess = dataSaver.nBackSuccess;
		float flightSuccess = dataSaver.flightSuccess;
		float order = (nBackSuccess + flightSuccess) / 2.0f;
		order = Mathf.Ceil (order / 10);

		order = order - 1;
		Vector3 vec = new Vector3(0.0f, -3.0f, 0.0f);
		if (order <= 0) {
			order = 1;
		}

		vec.x = 7.9f - 1.6f * (10f - order);
		transform.localPosition = vec;

		yield return new WaitForSeconds (5);
		int blockIndex = dataSaver.currentBlockIndex - 1;
		if (blockIndex == dataSaver.halfConditionIndex ||
			blockIndex == dataSaver.halfConditionIndex + 1 ||
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
