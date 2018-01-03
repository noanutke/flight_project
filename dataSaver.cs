using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;



public class dataSaver : MonoBehaviour {

	public int currentBlockIndex;
	public List<Dictionary<string, string>> blocksArray  = new List<Dictionary<string, string>>();
	public string condition;
	public int moveSpeed;
	public int blocksCount;
	public bool shouldSaveData;
	public bool showSuccessRate;
	public int flightSuccess;
	public int nBackSuccess;


	// Use this for initialization
	public void Start () {	
		this.showSuccessRate = false;
		this.moveSpeed = 170; 
		this.blocksCount = 0;
		this.shouldSaveData = false;
	}

	// Update is called once per frame
	void Update () {
	}

	public void restartBlocks() {
		this.blocksArray = new List<Dictionary<string, string>>();
		this.blocksCount = 0;
	}

	public void addBlock(string n, string size, string file, string type, string stroopCondition, string nbackStatus) {
		Dictionary<string, string> dict = new Dictionary<string,string> ();
		dict.Add ("n", n);
		dict.Add ("ringSize", size);
		dict.Add ("blockFile", file);
		dict.Add ("type", type);
		dict.Add ("stroopCondition", stroopCondition);
		dict.Add ("nbackStatus", nbackStatus);
		this.blocksArray.Add (dict);
		this.blocksCount++;
	}

	public void updateSuccessRate(float flightSuccess, float nbackSucess) {
		this.flightSuccess = (int)flightSuccess;
		this.nBackSuccess = (int)nbackSucess;
	}

	public int getBlockLength() {
		return this.blocksArray.Count;
	}

	public string getNbackStatus() {
		return blocksArray [this.currentBlockIndex] ["nbackStatus"];
	}

	public string getLastBlockNbackStatus() {
		return blocksArray [this.currentBlockIndex-1] ["nbackStatus"];
	}

	public string getStroopCondition() {
		return this.blocksArray [this.currentBlockIndex] ["stroopCondition"];
	}

	public string getRingSize() {
		return this.blocksArray [this.currentBlockIndex] ["ringSize"];
	}

	public int getN() {
		string n = this.blocksArray [this.currentBlockIndex]["n"];
		return int.Parse (n);
	}

	public int getLastN() {
		string n = this.blocksArray [this.currentBlockIndex-1]["n"];
		return int.Parse (n);
	}

	public string getType() {
		return this.blocksArray [this.currentBlockIndex]["type"];
	}

	public int getBlocksCount() {
		return this.blocksCount;
	}

	public string getFileName() {
		return  this.blocksArray [this.currentBlockIndex]["blockFile"];
	}

	public void saveData() {
		this.shouldSaveData = true;
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}


}
