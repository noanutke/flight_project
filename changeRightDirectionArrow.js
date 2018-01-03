#pragma strict

function Start () {
	this.Hide();
}

function Update () {

}

function ChangePosition(position) {
	transform.localPosition = position;
}

function Hide() {
	gameObject.SetActive(false);
}

function Show() {
	gameObject.SetActive(true);
}