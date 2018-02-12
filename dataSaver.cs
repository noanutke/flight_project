using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;



public class dataSaver : MonoBehaviour {

	public bool withEyeTracker = false;
	public int halfConditionIndex = 8;
	public int fullConditionIndex = 17;
	public int currentBlockIndex;
	public List<Dictionary<string, string>> blocksArray  = new List<Dictionary<string, string>>();
	public string condition;
	public int moveSpeed;
	public int blocksCount;
	public bool showSuccessRate;
	public int flightSuccess;
	public int nBackSuccess;
	public LSL_BCI_Input LSLScript;
	public parallelPort parallelScript;
	public string subjectNumber;

	public static int redAmountInBBlocks = 5;
	public static int redAmountInABlocks = 6;
	public static int targetAmountRequired = 4;


	public static int ringsAmountForCalibrationPhase = 10;
	public static int ringsFailuresForCalibrationTarget = 2;


	private class Block {
		public List<string> letters = new List<string>();
		public List<string> colors = new List<string>();
		public List<string> sounds = new List<string>();
		public List<string> bips = new List<string>();
		public List<bool> isTragetList = new List<bool>();
		public bool withNback;
		public string nLevel;
		public string blockType;
		public string ringSize;
		public bool isPractice;
		public bool isCalibration;
		public string subjectNumber;
		public string targetLetter = "";
		public bool isBaseline = false;

		private bool checkTargetsDemands(List<int> indices) {
			indices.Sort ();
			int sequenceLength = 1;
			int i = 0;
			for (i=0; i< indices.Count; i++) {
				if (i == 0) {
					continue;
				} else if (indices [i - 1] == indices [i] - 1 ) {
					sequenceLength++;
					if (sequenceLength == 3) {
						return false;
					}
				} else {
					sequenceLength = 1;
				}
			}
			return true;
		}

		public void generateLetters() 
		{
			int lettersAmount = 12;
			int index = 0;
			int n = int.Parse (this.nLevel);
			bool targetsDemandsSatisfied = false;
			List<int> targetIndices = new List<int> ();
			while (targetsDemandsSatisfied != true) {
				index = 0;
				targetIndices = new List<int> ();
				while (index < dataSaver.targetAmountRequired) {
					int indexForTarge = Random.Range (n, lettersAmount);
					if (targetIndices.Exists (x => x == indexForTarge)) {
						continue;
					}
					targetIndices.Insert (0, indexForTarge);
					index++;
				}
				targetIndices.Sort ();
				targetsDemandsSatisfied = checkTargetsDemands (targetIndices);
			}

			index = 0;	
			int indexOfTargets = 0;
			int exclusiveLetter = 10;
			bool letterInserted = false;
			bool notSatisfied = true;
			while (notSatisfied) {
				index = 0;
				indexOfTargets = 0;
				exclusiveLetter = 10;
				letterInserted = false;
				this.isTragetList = new List<bool> ();
				this.letters = new List<string> ();
				while (index < lettersAmount) {
					if (indexOfTargets < dataSaver.targetAmountRequired && index == targetIndices [indexOfTargets]) {
						this.isTragetList.Insert (index, true);
					} else {
						this.isTragetList.Insert (index, false);
					}

					if (this.nLevel == "0") {
						if (indexOfTargets < dataSaver.targetAmountRequired && index == targetIndices [indexOfTargets]) {
							letterInserted = true;
							this.letters.Insert (index, this.targetLetter);
							indexOfTargets++;
						} else {
							exclusiveLetter = int.Parse (this.targetLetter);
						}

					} else {
						if (indexOfTargets < dataSaver.targetAmountRequired && index == targetIndices [indexOfTargets]) {
							if (index - n >= 0) {
								letterInserted = true;
								this.letters.Insert (index, this.letters [index - n]);
								indexOfTargets++;

							}
						}
						else if (index - n >= 0) {
							exclusiveLetter = int.Parse (this.letters [index - n]);
						}
					}
					if (letterInserted == false) {
						int letter = Random.Range (1, 8);
						if (letter >= exclusiveLetter) {
							letter++;
						}
						letters.Insert (index, letter.ToString ());
					}

					index++;
					exclusiveLetter = 10;
					letterInserted = false;

				}
				index = 0;
				int sameLettersInRow = 1;
				notSatisfied = false;
				while (index < lettersAmount) {
					if (index > 0 && this.letters [index - 1] == this.letters [index]) {
						sameLettersInRow++;
						if (sameLettersInRow >= 4) {
							notSatisfied = true;
							index++;
							break;
						}
					} else {
						sameLettersInRow = 1;
					}
					index++;
				}
			}
		}


		public void generateBips() 
		{
			this.bips = new List<string> ();
			int lettersAmount = 12;
			int alarmsAmount = 1;
			if (this.blockType == "b") {
				alarmsAmount = 0;
			}

			int possibleBipsIndices = lettersAmount - dataSaver.targetAmountRequired - alarmsAmount;

			int firstBipIndex = Random.Range (0, possibleBipsIndices);
			int secondBipIndex = firstBipIndex;
			while (firstBipIndex == secondBipIndex) {
				secondBipIndex = Random.Range (0, possibleBipsIndices);
			}

			int currentBipsIndex = 0;
			int i = 0;
			for (i = 0; i < lettersAmount; i++) {
				if (this.isTragetList [i] == false && this.sounds [i] == "no") {
					if (currentBipsIndex == firstBipIndex || currentBipsIndex == secondBipIndex) {
						this.bips.Insert (i, "bip");
					} else {
						this.bips.Insert (i, "no");
					}
					currentBipsIndex++;
				} else {
					this.bips.Insert (i, "no");
				}
			}

		}

		public void generateAversiveSound() {
			this.sounds = new List<string> ();
			int lettersAmount = 12;
			if (this.blockType == "b") { // we have zero alarms
				int i=0;
				for (i = 0; i < lettersAmount; i++) {
					this.sounds.Insert (0, "no");
				}
			} else {
				int randomIndex = Random.Range (0, dataSaver.redAmountInABlocks);
				int redIndex = 0;
				int i = 0;
				for (i = 0; i < lettersAmount; i++) {
					if (this.colors [i] == "red") {
						if (redIndex == randomIndex) {
							this.sounds.Insert (i, "sound");
						} else {
							this.sounds.Insert (i, "no");
						}
						redIndex++;
						continue;
					}
					this.sounds.Insert (i, "no");
				}

			}
		}

		public void generateColors() {
			int lettersAmount = 12;
			int targetRedRingsAmount;
			int numberOfInitialGreenRings = 2;
			int singleRedCount = 0;
			if (this.blockType == "a") {
				targetRedRingsAmount = 6;
			} else {
				targetRedRingsAmount = 5;
			}

			List<string> colorsTemp = new List<string> ();
			int i = 0;
			for (i=0; i< lettersAmount - targetRedRingsAmount - numberOfInitialGreenRings; i++) {
				colorsTemp.Insert(0,"green");
			}
			for (i=0; i< targetRedRingsAmount; i++) {
				colorsTemp.Insert(0,"red");
			}

			bool demandsSatisfied = false;

			while (demandsSatisfied != true) {
				this.colors = new List<string> ();
				demandsSatisfied = true;
				singleRedCount = 0;
				colorsTemp = dataSaver.shuffle (colorsTemp);
				for (i=0; i< colorsTemp.Count; i++) {
					if (isCurrentLocationSingleRed (i, colorsTemp)) {
						if (singleRedCount == 2) {
							demandsSatisfied = false;
							break;
						} else {
							singleRedCount++;
						}
					}
				}
			}

			i = 0;
			while (i < numberOfInitialGreenRings) {
				colorsTemp.Insert(i ,"green");
				i++;
			}
			this.colors = colorsTemp;
		}

		private bool isCurrentLocationSingleRed(int i, List<string> colorsTemp) {
			bool singleRedExist = false;
			if (i == 0 && colorsTemp [i] == "red" && colorsTemp [i + 1] == "green") {
				singleRedExist = true;
			}
			else if (i == colorsTemp.Count-1 && colorsTemp [i] == "red" && colorsTemp [i - 1] == "green") {
				singleRedExist = true;
			}
			else if  (i < colorsTemp.Count-1 && i > 0 && colorsTemp[i] == "red") {
				if (colorsTemp [i - 1] == "green" && colorsTemp [i + 1] == "green") {
					singleRedExist = true;
				}
			}
			return singleRedExist;
		}
	}


	private List<Block> blocksOrder;


	public static List<string> shuffle(List<string> list)  
	{  
		int n = list.Count;  
		while (n > 1) {  
			n--;  
			int k = Random.Range (0, n+1);
			string value = list[k];  
			list[k] = list[n];  
			list[n] = value;  
		}
		return list;
	}

	public bool initCondition(string stressCondition, int speed, string subjectNumber) {
		this.blocksCount = 12;
		this.currentBlockIndex = 0;
		this.subjectNumber = subjectNumber;
		this.condition = stressCondition;
		this.moveSpeed = speed;
		this.blocksOrder = this.initBlocksOrder ();
		return true;
	}

	public bool initBlock(string stressCondition, int speed, string subjectNumber, string nLevel, string ringSize, bool withNBack,
		bool isPractice, bool isCalibration, int ringsFailuresForCalibrationTarget) {
		this.blocksCount = 1;
		this.currentBlockIndex = 0;
		this.subjectNumber = subjectNumber;
		this.condition = stressCondition;
		this.moveSpeed = speed;
		dataSaver.ringsFailuresForCalibrationTarget = ringsFailuresForCalibrationTarget;
		Block block = new Block ();
		block.nLevel = nLevel;
		block.ringSize = ringSize;
		block.blockType = "a";
		block.isPractice = isPractice;
		block.isCalibration = isCalibration;
		block.withNback = withNBack;

		if (block.nLevel == "0") {
			if (block.blockType == "a") {
				block.targetLetter = "1";
			} else {
				block.targetLetter = "2";
			}
		}

		block.generateLetters ();
		block.generateColors ();
		block.generateAversiveSound ();
		block.generateBips ();
		this.blocksOrder = new List<Block> ();
		this.blocksOrder.Insert (0, block);
		return true;
	}


	private List<Block> initBlocksOrder() {
		List<Block> allBlocks = new List<Block> ();
		List<string> blocks1 = new List<string> ();
		List<string> blocks2 = new List<string> ();

		int rand = Random.Range (1, 3);
		blocks1.Insert (0, "0_big_" + (rand == 1? "a" : "b")); blocks2.Insert (0, "0_big_"  + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		blocks1.Insert (0, "1_big_"  + (rand == 1? "a" : "b")); blocks2.Insert (0, "1_big_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		blocks1.Insert (0, "1_medium_" + (rand == 1? "a" : "b")); blocks2.Insert (0, "1_medium_"  + (rand == 2? "a" : "b")); 
		rand = Random.Range (1, 3);
		blocks1.Insert (0, "2_medium_" + (rand == 1? "a" : "b")); blocks2.Insert (0, "2_medium_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		blocks1.Insert (0, "2_small_" + (rand == 1? "a" : "b")); blocks2.Insert (0, "2_small_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		blocks1.Insert (0, "3_small_" + (rand == 1? "a" : "b")); blocks2.Insert(0, "3_small_" + (rand == 2? "a" : "b"));

		rand = Random.Range (1, 3);
		blocks1.Insert (0, "baseline_small_" + (rand == 1? "a" : "b")); blocks2.Insert(0, "baseline_small_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		blocks1.Insert (0, "baseline_medium_" + (rand == 1? "a" : "b")); blocks2.Insert(0, "baseline_medium_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		blocks1.Insert (0, "baseline_big_" + (rand == 1? "a" : "b")); blocks2.Insert(0, "baseline_big_" + (rand == 2? "a" : "b"));

		blocks1 = dataSaver.shuffle (blocks1);
		blocks2 = dataSaver.shuffle (blocks2);

		blocks1.AddRange (blocks2);

		blocksOrder = new List<Block> ();
		Block blockBaseline = new Block ();
		int i = 0;
		for (i = 0; i < blocks1.Count; i++) {
			string[] parts = blocks1 [i].Split ('_');

			Block block = new Block ();
			block.ringSize = parts [1];
			block.blockType = parts [2];
			if (parts [0] == "baseline") {
				block.isBaseline = true;
				block.isPractice = false;
				block.isCalibration = false;
				block.withNback = false;
				block.nLevel = "1";
				allBlocks.Insert (i, block);
				blockBaseline = block;
				continue;
			}
			block.isBaseline = false;
			block.nLevel = parts [0];
			block.isPractice = false;
			block.isCalibration = false;
			block.withNback = true;

			if (block.nLevel == "0") {
				if (block.blockType == "a") {
					block.targetLetter = "1";
				} else {
					block.targetLetter = "2";
				}
			}

			block.generateLetters ();
			block.generateColors ();
			block.generateAversiveSound ();
			block.generateBips ();
			allBlocks.Insert (i, block);
		}
		allBlocks.Insert (0, blockBaseline);
		return allBlocks;
	}

	// Use this for initialization
	public void Start () {	
		this.showSuccessRate = false;
		this.LSLScript = gameObject.AddComponent<LSL_BCI_Input>(); // To interface with online BCI

		this.parallelScript = gameObject.AddComponent<parallelPort>(); // To interface with online BCI
	}

	// Update is called once per frame
	void Update () {
	}

	public void updateBlockIndex() {
		this.currentBlockIndex++;
	}

	public string getDifficultLevel(string n, string size) {
		if (n == "0") {
			return "1";
		} else if (n == "1") {
			if (size == "big") {
				return "4";
			}
			else {
				return "5";
			}
		}
		else if (n == "2") {
			if (size == "medium") {
				return "6";
			}
			else {
				return "7";
			}
		}
		else {
			return "8";
		}
	}

	public void updateSuccessRate(float flightSuccess, float nbackSucess) {
		this.flightSuccess = (int)flightSuccess;
		this.nBackSuccess = (int)nbackSucess;
	}

	public int getBlockLength() {
		return this.blocksCount;
	}

	public LSL_BCI_Input getLslScript() {
		return this.LSLScript;
	}

	public parallelPort getParallelsScript() {
		return this.parallelScript;
	}

	public bool getLastBlockNbackStatus() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].withNback;
	}


	public string getStroopCondition() {
		return "incong";
	}

	public string getRingSize() {
		return this.blocksOrder [this.currentBlockIndex].ringSize;
	}

	public string getLastRingSize() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].ringSize;
	}

	public int getN() {
		return int.Parse(this.blocksOrder [this.currentBlockIndex].nLevel);
	}

	public int getLastN() {
		return int.Parse(this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].nLevel);
	}

	public string getType() {
		return this.blocksOrder [this.currentBlockIndex].blockType;
	}

	public string getLastType() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].blockType;
	}

	public bool getIsCalibration() {
		return this.blocksOrder [this.currentBlockIndex].isCalibration;
	}

	public bool getLastIsCalibration() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].isCalibration;
	}

	public bool getIsBaseline() {
		return this.blocksOrder [this.currentBlockIndex].isBaseline;
	}

	public bool getLastIsBaseline() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].isBaseline;
	}

	public bool getIsPractice() {
		return this.blocksOrder [this.currentBlockIndex].isPractice;
	}

	public bool getIsLastPractice() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].isPractice;
	}


	public bool getWithNBack() {
		return this.blocksOrder [this.currentBlockIndex].withNback;
	}

	public int getBlocksCount() {
		return this.blocksCount;
	}
		
	public string getTargetLetter() {
		return this.blocksOrder [this.currentBlockIndex].targetLetter;
	}

	public string[] getLetters() {
		return this.blocksOrder [this.currentBlockIndex].letters.ToArray ();
	}

	public string[] getColors() {
		return this.blocksOrder [this.currentBlockIndex].colors.ToArray ();
	}

	public string[] getAlarms() {
		return this.blocksOrder [this.currentBlockIndex].sounds.ToArray ();
	}

	public string[] getBips() {
		return this.blocksOrder [this.currentBlockIndex].bips.ToArray ();
	}

	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}

}
