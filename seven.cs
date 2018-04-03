using UnityEngine;
using System.Collections;

public class seven : MonoBehaviour {

	// Use this for initialization
	void Start () {
		GameObject emptyObject =  GameObject.Find("dataSaver");
		dataSaver dataSaver = emptyObject.GetComponent<dataSaver> ();
		int amountInColumn = dataSaver.histogramColumns [6];
		Vector3 scale = new Vector3 (transform.localScale.x, transform.localScale.y * amountInColumn, transform.localScale.z);
		transform.localScale = scale;

		Vector3 position = new Vector3 (transform.localPosition.x, transform.localPosition.y + (float)	0.35f * (amountInColumn - 1),
			transform.localPosition.z);

		transform.localPosition = position;
	}
	
	// Update is called once per frame
	void Update () {
	
	}
}
