using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;
using System.Linq;



public class dataSaver : MonoBehaviour {
	public int[] histogramColumns = new int[10];
	public List<int> fixationsArray = new List<int>(new int[]{3,3,3,3,3,6,6,6,6,6,9,9,9,9});
	public List<int> precentileInHistogram = new List<int> (new int[]{ 2, 2, 2, 2, 3, 3, 3, 3, 3, 4 });
	public bool withEyeTracker = false;
	public bool inSecondSession = false;
	public string blockOrderNumber = "";
	public int currentBlockIndex = -1;
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
	public int columnInHistogram;

	public static int redAmountInBBlocks = 5;
	public static int redAmountInABlocks = 6;
	public static int targetAmountRequired = 4;
	public static int targetAmountRequiredForBaseline = 2;
	public static int halfConditionIndex = 12;
	public static int fullConditionIndex = 25;

	public static int ringsAmountForCalibrationPhase = 10;
	public static int ringsFailuresForCalibrationTarget = 2;
	public static int trialsAmountTestblocks = 12;
	public static int trialsAmountBaselineBlocks = 6;


	public class Block {
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
		public string fileName = "";

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

		public void generateLetters(int trialsAmount, int targetAmount) 
		{
			int targetAmountRequired = targetAmount;
			int lettersAmount = trialsAmount;
			int index = 0;
			int n = int.Parse (this.nLevel);
			bool targetsDemandsSatisfied = false;
			List<int> targetIndices = new List<int> ();
			while (targetsDemandsSatisfied != true) {
				index = 0;
				targetIndices = new List<int> ();
				while (index < targetAmountRequired) {
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
					if (indexOfTargets < targetAmountRequired && index == targetIndices [indexOfTargets]) {
						this.isTragetList.Insert (index, true);
					} else {
						this.isTragetList.Insert (index, false);
					}

					if (this.nLevel == "0") {
						if (indexOfTargets < targetAmountRequired && index == targetIndices [indexOfTargets]) {
							letterInserted = true;
							this.letters.Insert (index, this.targetLetter);
							indexOfTargets++;
						} else {
							exclusiveLetter = int.Parse (this.targetLetter);
						}

					} else {
						if (indexOfTargets < targetAmountRequired && index == targetIndices [indexOfTargets]) {
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
			int lettersAmount = trialsAmountTestblocks;
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

		public void generateAversiveSound(int trialsAmount) {
			List<string> soundsTypes = new List<string> (new string[] {"alarm", "alarm", "scream", "scream", "scream"});
			soundsTypes = dataSaver.shuffle (soundsTypes);

			this.sounds = new List<string> ();
			int lettersAmount = trialsAmount;
			if (this.blockType == "b") { // we have zero alarms
				int i=0;
				for (i = 0; i < lettersAmount; i++) {
					this.sounds.Insert (0, "no");
				}
			} else {
				int i = 0;
				int possibleRedAmount = 0;
				for (i = 0; i < lettersAmount; i++) {
					if (this.colors [i] == "red" && i > 0 && this.colors [i - 1] == "red") {
						possibleRedAmount++;
					}
				}
				int randomIndex = Random.Range (0, possibleRedAmount);
				int possibleRedIndex = 0;
				i = 0;
				int indexInSoundsTypes = 0;
				for (i = 0; i < lettersAmount; i++) {
					if (this.colors [i] == "red" && i > 0 && this.colors [i-1] == "red") {
						if (possibleRedIndex == randomIndex) {
							this.sounds.Insert (i, soundsTypes[indexInSoundsTypes]);
							indexInSoundsTypes++;
						} else {
							this.sounds.Insert (i, "no");
						}
						possibleRedIndex++;
						continue;
					}
					this.sounds.Insert (i, "no");
				}

			}
		}



		public void readInputPropertiesForBlock(string order = "1") {
			string path = Application.dataPath + "/orders/order" + order + "/" + this.fileName + ".txt";
			StreamReader stream = new StreamReader (path);

			string[] lettersArray = stream.ReadLine ().Split (',');
			this.letters = new List<string> (lettersArray);
			stream.ReadLine ();
			string[] colorsArray = stream.ReadLine ().Split (',');
			this.colors = new List<string> (colorsArray);
			stream.ReadLine ();
			string[] soundsArray = stream.ReadLine ().Split (',');
			this.sounds = new List<string> (soundsArray);

		}

		public void generateColors(int trialsAmount) {
			int lettersAmount = trialsAmount;
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

	public static List<int> shuffleInt(List<int> list)  
	{  
		int n = list.Count;  
		while (n > 1) {  
			n--;  
			int k = Random.Range (0, n+1);
			int value = list[k];  
			list[k] = list[n];  
			list[n] = value;  
		}
		return list;
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


		block.generateLetters (dataSaver.trialsAmountTestblocks, dataSaver.targetAmountRequired);
		block.generateColors (dataSaver.trialsAmountTestblocks);
		block.generateAversiveSound (dataSaver.trialsAmountTestblocks);

		this.blocksOrder = new List<Block> ();
		this.blocksOrder.Insert (0, block);
		return true;
	}



	public bool initCondition(string stressCondition, int speed, string subjectNumber, string order) {
		this.precentileInHistogram = dataSaver.shuffleInt (this.precentileInHistogram);
		this.blockOrderNumber = order;

		this.currentBlockIndex = 0;
		this.subjectNumber = subjectNumber;
		this.condition = stressCondition;
		this.moveSpeed = speed;
		//this.blocksOrder = this.initBlocksOrder (order);
		this.blocksOrder = this.getBlocksFromFile (order);
		List<int> easyBlocks = new List<int>();
		int blockIndex = 0;
		foreach (Block block in this.blocksOrder) {
			if (block.nLevel == "1") {
				easyBlocks.Insert (0, blockIndex);
			}
			if (block.isBaseline == true) {
				this.precentileInHistogram.Insert (blockIndex, 0);
			}
			blockIndex++;
		}
		easyBlocks = dataSaver.shuffleInt (easyBlocks);
		foreach (int blockNumber in easyBlocks) {
			if (this.precentileInHistogram[blockNumber] != 4) {
				this.precentileInHistogram [blockNumber] = 6;
				break;
			}
		}
		return true;
	}

	public List<Block> getBlocksFromFile(string order = "1") {
		string path = Application.dataPath + "/orders/order" + order + "/" + "blockOrder.txt";
		StreamReader stream =new StreamReader(path);
		string blocksOrder = stream.ReadLine ();
		string[] blocks = blocksOrder.Split (',');
		stream.Close ();

		List<Block> allBlocks = new List<Block> ();

		foreach (string currentBlock in blocks) {
			string[] parts = currentBlock.Split ('_');

			Block block = new Block ();
			block.fileName = currentBlock;
			block.ringSize = parts [1];
			block.blockType = parts [2];
			if (parts [0] == "baseline") {
				block.isBaseline = true;
				block.isPractice = false;
				block.isCalibration = false;
				block.withNback = false;
				block.nLevel = "";
				allBlocks.Insert (allBlocks.Count, block);

				continue;
			}
			block.isBaseline = false;
			block.nLevel = parts [0];
			block.isPractice = false;
			block.isCalibration = false;
			block.withNback = true;


			if (block.nLevel == "0") {
				block.isBaseline = true;
				if (block.blockType == "a" || block.blockType == "c") {
					block.targetLetter = "1";
				} else {
					block.targetLetter = "2";
				}
			}

			block.readInputPropertiesForBlock (order);
			allBlocks.Insert (allBlocks.Count, block);
		}

		return allBlocks;
	}


	public List<Block> initBlocksOrder(string order) {
		List<Block> allBlocks = new List<Block> ();
		List<string> testBlocks1 = new List<string> ();
		List<string> baselineBlocks1_start = new List<string> ();
		List<string> baselineBlocks1_end = new List<string> ();
		List<string> testBlocks2 = new List<string> ();
		List<string> baselineBlocks2_start = new List<string> ();
		List<string> baselineBlocks2_end = new List<string> ();
		List<string> allBlocksOrder = new List<string> ();

		int rand = Random.Range (1, 3);
		testBlocks1.Insert (0, "1_big_"  + (rand == 1? "a" : "b")); testBlocks2.Insert (0, "1_big_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		testBlocks1.Insert (0, "1_medium_" + (rand == 1? "a" : "b")); testBlocks2.Insert (0, "1_medium_"  + (rand == 2? "a" : "b")); 
		rand = Random.Range (1, 3);
		testBlocks1.Insert (0, "2_medium_" + (rand == 1? "a" : "b")); testBlocks2.Insert (0, "2_medium_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		testBlocks1.Insert (0, "2_small_" + (rand == 1? "a" : "b")); testBlocks2.Insert (0, "2_small_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		testBlocks1.Insert (0, "3_small_" + (rand == 1? "a" : "b")); testBlocks2.Insert(0, "3_small_" + (rand == 2? "a" : "b"));

		rand = Random.Range (1, 3);
		baselineBlocks1_start.Insert (0, "baseline_small_" + (rand == 1? "a" : "b")); baselineBlocks1_end.Insert(0, "baseline_small_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		baselineBlocks1_start.Insert (0, "baseline_medium_" + (rand == 1? "a" : "b")); baselineBlocks1_end.Insert(0, "baseline_medium_" + (rand == 2? "a" : "b"));
		rand = Random.Range (1, 3);
		baselineBlocks1_start.Insert (0, "baseline_big_" + (rand == 1? "a" : "b")); baselineBlocks1_end.Insert(0, "baseline_big_" + (rand == 2? "a" : "b"));

		rand = Random.Range (1, 3);
		baselineBlocks1_start.Insert (0, "0_no_" + (rand == 1? "a" : "b")); baselineBlocks1_end.Insert(0, "0_no_" + (rand == 2? "a" : "b"));

		rand = Random.Range (1, 3);
		baselineBlocks2_start.Insert (0, "baseline_small_" + (rand == 1? "c" : "d")); baselineBlocks2_end.Insert(0, "baseline_small_" + (rand == 2? "c" : "d"));
		rand = Random.Range (1, 3);
		baselineBlocks2_start.Insert (0, "baseline_medium_" + (rand == 1? "c" : "d")); baselineBlocks2_end.Insert(0, "baseline_medium_" + (rand == 2? "c" : "d"));
		rand = Random.Range (1, 3);
		baselineBlocks2_start.Insert (0, "baseline_big_" + (rand == 1? "c" : "d")); baselineBlocks2_end.Insert(0, "baseline_big_" + (rand == 2? "c" : "d"));

		rand = Random.Range (1, 3);
		baselineBlocks2_start.Insert (0, "0_no_" + (rand == 1? "c" : "d")); baselineBlocks2_end.Insert(0, "0_no_" + (rand == 2? "c" : "d"));

		testBlocks1 = dataSaver.shuffle (testBlocks1);
		testBlocks2 = dataSaver.shuffle (testBlocks2);
		baselineBlocks1_start = dataSaver.shuffle (baselineBlocks1_start);
		baselineBlocks1_end = dataSaver.shuffle (baselineBlocks1_end);
		baselineBlocks2_start = dataSaver.shuffle (baselineBlocks2_start);
		baselineBlocks2_end = dataSaver.shuffle (baselineBlocks2_end);

		allBlocksOrder.AddRange (baselineBlocks1_start);
		allBlocksOrder.AddRange (testBlocks1);
		allBlocksOrder.AddRange (baselineBlocks1_end);
		allBlocksOrder.AddRange (baselineBlocks2_start);
		allBlocksOrder.AddRange (testBlocks2);
		allBlocksOrder.AddRange (baselineBlocks2_end);

		blocksOrder = new List<Block> ();
		Block blockBaseline = new Block ();
		int i = 0;

		for (i = 0; i < allBlocksOrder.Count; i++) {
			
			string[] parts = allBlocksOrder [i].Split ('_');

			Block block = new Block ();
			block.fileName = allBlocksOrder [i];
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

			string path = Application.dataPath + "/orders/order" + order + "/" + block.nLevel + "_"
				+ block.ringSize + "_" + block.blockType + ".txt";
			StreamWriter stream = File.CreateText (path);


			if (block.nLevel == "0") {
				block.isBaseline = true;
				if (block.blockType == "a" || block.blockType == "c") {
					block.targetLetter = "1";
				} else {
					block.targetLetter = "2";
				}
			}

			int trialsAmount = dataSaver.trialsAmountTestblocks;
			int targetsAmount = dataSaver.targetAmountRequired;
			if (block.nLevel == "0" || block.isBaseline) {
				trialsAmount = dataSaver.trialsAmountBaselineBlocks;
				targetsAmount = dataSaver.targetAmountRequiredForBaseline;
			}
			block.generateLetters (trialsAmount,targetsAmount);
			block.generateColors (trialsAmount);
			block.generateAversiveSound (trialsAmount);

			allBlocks.Insert (i, block);

			stream.WriteLine (getStringFromArray(block.letters));
			stream.WriteLine (getStringFromArray(block.colors));
			stream.WriteLine (getStringFromArray(block.sounds));
			stream.Close ();
		}
		string path2 = Application.dataPath + "/orders/order" + order + "/blockOrder.txt";
		StreamWriter stream2 = File.CreateText (path2);
		stream2.WriteLine (getStringFromArray(allBlocksOrder));
		stream2.Close ();
		return allBlocks;
	}

	StringBuilder getStringFromArray(List<string> arrayInputList) {
		string[] arrayInput = arrayInputList.ToArray ();
		string delimiter = ",";
		int length = arrayInput.Length;
		StringBuilder stringOutput = new StringBuilder ();

		stringOutput.AppendLine (string.Join (delimiter, arrayInput));

		return stringOutput;
	}

	// Use this for initialization
	public void Start () {
		List<int> fixationsArray1 = new List<int>(new int[]{3,3,3,3,6,6,6,6,6,9,9,9,9});
		List<int> fixationsArray2= new List<int>(new int[] {3,3,3,3,6,6,6,6,6,9,9,9,9});
		fixationsArray1 = dataSaver.shuffleInt (fixationsArray1);
		fixationsArray2 = dataSaver.shuffleInt (fixationsArray2);
		this.fixationsArray = new List<int>(fixationsArray1.Concat (fixationsArray2));

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

	public string getN() {
		return this.blocksOrder [this.currentBlockIndex].nLevel;
	}

	public string getLastN() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].nLevel;
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

	public void buildHistogram(int column) {
		this.columnInHistogram = column;
		this.histogramColumns = new int[]{0,0,0,0,0,0,0,0,0,0};

		int minValue = column >= 2 ? column - 2 : 0;
		minValue = Random.Range (minValue, column);
		// choose 3 low scores locations
		int index = 0;
		for (index = 0; index <= column - minValue; index++) {
			this.histogramColumns [minValue+index]++;
		}

		index = 0;
		for (index = 0; index < this.precentileInHistogram [this.currentBlockIndex] - (column - minValue + 1); index++) {
			int currentColumn = Random.Range(minValue, column);
			if (currentColumn == column && this.histogramColumns [currentColumn] >= 3 && column != 0) {
				index--;
				continue;
			}
			this.histogramColumns [currentColumn]++;
		}
			
		int maxValue = column <= 5 ? column + 4 : 9;

		maxValue = Random.Range (column + 2, maxValue);
		// choose 3 low scores locations
		index = 0;
		for (index = 0; index < maxValue-column; index++) {
			this.histogramColumns [maxValue-index]++;
		}

		index = 0;
		for (index = 0; index < 10 - this.precentileInHistogram [this.currentBlockIndex] - (maxValue-column)
			; index++) {
			int currentColumn = Random.Range(column + 1, maxValue);
			this.histogramColumns [currentColumn]++;
		}
			
	}

}
