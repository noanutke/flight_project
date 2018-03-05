using UnityEngine;
using System.Collections;

public class histogram_3Small : MonoBehaviour {

	void Start () {
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		string n = dataSaver.getLastN ();
		string size = dataSaver.getLastRingSize ();
		if (n == "3" && size == "small") {
			this.Show ();
		} else {
			this.Hide ();
		}
	}

	void Update () {

	}

	void ChangePosition(Vector3 position) {
		transform.localPosition = position;
	}

	void Hide() {
		gameObject.SetActive(false);
	}

	void Show() {
		gameObject.SetActive(true);
	}
}
