using UnityEngine;
using System.Collections;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

public class histogram_x : MonoBehaviour {
	
	float right_column_x_position = 5.3f;
	float distance_between_columns = 1.08f;
	int highest_column_index = 9;
	float y_position_for_x_marker = -2.0f;
	float z_position_for_x_marker = 0.0f;
		
	void Start () {
		StartCoroutine(ChangePosition());
	}

	void Update () {

	}

	IEnumerator ChangePosition() {
		
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		int columnInHistogram = dataSaver.columnInHistogram;
		LSL_BCI_Input lslScript = dataSaver.getLslScript ();

		lslScript.setMarker ("score_score_" + columnInHistogram.ToString ());

		float x_position = this.right_column_x_position - this.distance_between_columns * (this.highest_column_index -
			columnInHistogram );
		Vector3 vec = new Vector3(x_position, this.y_position_for_x_marker, this.z_position_for_x_marker);
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
