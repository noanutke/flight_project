using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using System.IO;
using System.Text;
using System.Linq;



public class dataSaver : MonoBehaviour {
	public int[] histogramColumns; // Array that holds that values for each column in the current block histogram
	public List<int> fixationsArray;	// Array that holds fixation lengths for each block in the condition
	public List<int> precentileInHistogram;	// Array that holds the precentile of the player in the histogram 
											// for each block

	public bool inSecondSession = false;	// True if we are in the second session of the BAT task (after the break)
	public string blockOrderNumber = "";	// Order of the blocks in the condition (1-4)
	public int currentBlockIndex = -1;	// Index of current block (0-25 because we have 26 blocks)

	public string condition;	// stress/no stress
	public int moveSpeed;	// speed of plain movement

	public int flightSuccess;	// Success percent in flight task for current block (#ring passed / #all rings) 
	public int nBackSuccess;	// Success score in nBack task (#HIT/#targets - #FA/#non targets)
	public LSL_BCI_Input LSLScript;
	public parallelPort parallelScript;
	public string subjectNumber;
	public int columnInHistogram;	// Column in current block histogram
	public int ringsFailuresForCalibrationTarget;	// Amount of ring failures (out of 10 rings) required for 
													// finishing the calibration block

	public List<string> soundsTypes;	// List of sound types for the 5 blocks in which we play
	// aversive sounds (blocks "a"). This list is shuffeled 
	// for each subject

	public static int indexInBlocksWithAlarms = 0;	// Value used for initiation of block orders
	public static int maximumNumberOfSameLettersInARow = 3;
	public static int maximumNumberOfTargetsInARow = 2;
	public static int redAmountInBBlocks = 5;
	public static int redAmountInABlocks = 6;
	public static int targetAmountRequired = 4;
	public static int targetAmountRequiredForBaseline = 2;
	public static int halfConditionIndex = 12;
	public static int fullConditionIndex = 25;
	public static int ringsAmountForCalibrationPhase = 10;

	public static int trialsAmountTestblocks = 12;
	public static int trialsAmountBaselineBlocks = 6;
	public static int trialsAmountPracticeblocks = 12;
	public static int numberOfInitialGreenRings = 2;
	public static int maximumNumberOfIsolatedRedRings = 2;
	public static string targetLetterForABlock = "1";
	public static string targetLetterForBBlock = "2";
	public static float distanceBetweenColumnInHistogram = 0.35f;

	private List<Block> blocksOrder;

	// Class that holds all properties of a block
	public class Block {
		public List<string> letters = new List<string>();
		public List<string> colors = new List<string>();
		public List<string> sounds = new List<string>();

		public List<bool> isTragetList = new List<bool>();	// A boolean list with the length of the stimuli in the block
															// Has "true" for a target stimulus and "false" otherwise

		public bool withFlight;
		public bool withNback;	// is this block with nback (practice blocks and paseline blocks maight be without...)
		public string nLevel;	// nLevel: 0-3
		public string blockType;	// a/b - in the stress condition a has aversive sound and b doesn't. In no stress 
									// condition the block type has no effect
		public string ringSize;		// ring sizs in this block (big/medium/small)
		public bool isPractice;		// true if practice block
		public bool isCalibration;	// true if calibration block
	
		public string targetLetter = "";	//Traget letter - relevant for nLevel=0
		public bool isBaseline = false;	// True if it's a baseline block
		public string fileName = "";	// File name for the block stimuli


		/* Methods for creating blocks order and stimuli order - used only for creating the order files.
		 * after the files created - we read the blocks order and stimuli order from the files*/

		/* This method gets a list of targets indices in a block and checks if the following demands are satisfied:
		 * 1. No more than 3 targets in a row */
		private bool checkTargetsDemands(List<int> indices) {
			indices.Sort ();
			int sequenceLength = 1;
			int i = 0;
			for (i=0; i< indices.Count; i++) {
				if (i == 0) {
					continue;
				} else if (indices [i - 1] == indices [i] - 1 ) {
					sequenceLength++;
					if (sequenceLength == dataSaver.maximumNumberOfTargetsInARow + 1) {
						return false;
					}
				} else {
					sequenceLength = 1;
				}
			}
			return true;
		}

		/* This method generates letters order for the block with a length of trialsAmount and targets amount of
		 * targetAmount */
		public void generateLetters(int trialsAmount, int targetAmount) 
		{
			int targetAmountRequired = targetAmount;
			int lettersAmount = trialsAmount;
			int index = 0;
			int n = int.Parse (this.nLevel);
			bool targetsDemandsSatisfied = false;

			// Choose indices for targets
			List<int> targetIndices = new List<int> ();
			while (targetsDemandsSatisfied != true) {
				index = 0;
				targetIndices = new List<int> ();
				while (index < targetAmountRequired) {
					int indexForTarge = Random.Range (n, lettersAmount);
					// If this target index already exists - continue
					if (targetIndices.Exists (x => x == indexForTarge)) {
						continue;
					}
					targetIndices.Insert (0, indexForTarge);
					index++;
				}
				targetIndices.Sort ();
				targetsDemandsSatisfied = checkTargetsDemands (targetIndices);
			}

			// order letters for the block

			int indexOfTargets = 0;	// index for targets
			int exclusiveLetter = 10;	// Letter that is not allowed for next trial
			bool letterInserted = false;	// True if we inserted a letter to the list in the current iteration
			bool notSatisfied = true;	// True if demands for letters list are not satisfied
			while (notSatisfied) {	
				index = 0;	// index for trials
				indexOfTargets = 0;
				exclusiveLetter = 10;
				letterInserted = false;
				this.isTragetList = new List<bool> ();
				this.letters = new List<string> ();
				while (index < lettersAmount) {
					// check if the current index is one of the target indices
					if (indexOfTargets < targetAmountRequired && index == targetIndices [indexOfTargets]) {
						this.isTragetList.Insert (index, true);
					} else {
						this.isTragetList.Insert (index, false);
					}

					if (this.nLevel == "0") {
						// check if the current index is one of the target indices
						if (indexOfTargets < targetAmountRequired && index == targetIndices [indexOfTargets]) {
							letterInserted = true;
							this.letters.Insert (index, this.targetLetter);
							indexOfTargets++;
						} else {
							// This index isn't a target index - so define the "target letter" of this 0 back task
							// to be the exclusive letter for this block (we shouldn't insert this letter for this 
							// trial since this trial is not a target trial
							exclusiveLetter = int.Parse (this.targetLetter);
						}

					} else {	// nLevel is not 0
						if (indexOfTargets < targetAmountRequired && index == targetIndices [indexOfTargets]) {
							// this is a target trial
							if (index - n >= 0) {
								letterInserted = true;
								this.letters.Insert (index, this.letters [index - n]);
								indexOfTargets++;

							}
						}
						// this is not a target trial
						else if (index - n >= 0) {
							// make sure that we don't insert a letter that makes thia trial a target trial - so define
							// an exclusive letter as the letter that appeared n letter before
							exclusiveLetter = int.Parse (this.letters [index - n]);
						}
					}
					if (letterInserted == false) {
						// we didn't insert a letter yet (this is not a target letter)
						int letter = Random.Range (1, 8);
						if (letter >= exclusiveLetter) {
							letter++;	// if our letter is the exclusive letter - increase it by one
							if (letter > 8) {
								letter = 1;
							}						
						}
						letters.Insert (index, letter.ToString ());
					}
					index++;
					letterInserted = false;
				}

				// make sure that the new letters list staisfies the demands 
				// (no more that 3 identiccal letters in a row)
				index = 0;
				int sameLettersInRow = 1;
				notSatisfied = false;
				while (index < lettersAmount) {
					if (index > 0 && this.letters [index - 1] == this.letters [index]) {
						sameLettersInRow++;
					if (sameLettersInRow > maximumNumberOfSameLettersInARow) {
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
			

		// Generate list of sounds for block
		public void generateAversiveSound(int trialsAmount, List<string> soundsTypes) {

			this.sounds = new List<string> ();
			int lettersAmount = trialsAmount;
			if (this.isBaseline || this.blockType == "b") {
				// we have zero aversive sounds in block "b" and in baseline blocks so all sounds in list are "no"
				int i=0;
				for (i = 0; i < lettersAmount; i++) {
					this.sounds.Insert (0, "no");
				}
			} else {
				// find out amount of possible indices for inserting aversive sound
				// The demand is that the color of the ring in the index is red, and that the color
				// of the ring before was also red
				int i = 0;
				int possibleRedAmount = 0;
				for (i = 0; i < lettersAmount; i++) {
					if (this.colors [i] == "red" && i > 0 && this.colors [i - 1] == "red") {
						possibleRedAmount++;
					}
				}
				// choose the index for the aversive sound out of all possible indices
				int randomIndex = Random.Range (0, possibleRedAmount);
				int possibleRedIndex = 0;
				i = 0;

				for (i = 0; i < lettersAmount; i++) {
					if (this.colors [i] == "red" && i > 0 && this.colors [i-1] == "red") {
						if (possibleRedIndex == randomIndex) {
							this.sounds.Insert (i, soundsTypes[dataSaver.indexInBlocksWithAlarms]);
							dataSaver.indexInBlocksWithAlarms++;

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


		// A method that generates the list of ring colors for the block
		public void generateColors(int trialsAmount) {
			int targetRedRingsAmount;

			if (this.blockType == "a") {
				targetRedRingsAmount = dataSaver.redAmountInABlocks;
			} else {
				targetRedRingsAmount = dataSaver.redAmountInBBlocks;
			}

			// create a list that contains the required number from each color (not including the numberOfInitialGreenRings)
			List<string> colorsTemp = new List<string> ();
			int i = 0;
			for (i=0; i< trialsAmount - targetRedRingsAmount - dataSaver.numberOfInitialGreenRings; i++) {
				colorsTemp.Insert(0,"green");
			}
			for (i=0; i< targetRedRingsAmount; i++) {
				colorsTemp.Insert(0,"red");
			}


			bool demandsSatisfied = false;
			int singleRedCount = 0;	// Count of isolated red rings (a red ring that the ring before and after are green)
			while (demandsSatisfied != true) {
				// shuffle the colors' list and check if the demands for colors order are satisfied.
				// The demand is that there will be no more than 'maximumNumberOfIsolatedRedRings' 
				// amount of isolated red rings
				// (a red ring where the eing before and after are green)
				demandsSatisfied = true;
				singleRedCount = 0;
				colorsTemp = dataSaver.shuffle (colorsTemp);
				for (i=0; i< colorsTemp.Count; i++) {
					// check if this is an isolated red ring
					if (isIsolatedRedRing (i, colorsTemp)) {
						if (singleRedCount == dataSaver.maximumNumberOfIsolatedRedRings) {
							demandsSatisfied = false;
							break;
						} else {
							singleRedCount++;
						}
					}
				}
			}

			i = 0;
			// Insert the first rings as green rings
			while (i < dataSaver.numberOfInitialGreenRings) {
				colorsTemp.Insert(i ,"green");
				i++;
			}
			this.colors = colorsTemp;
		}

		private bool isIsolatedRedRing(int i, List<string> colorsTemp) {
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


		// This method reads the stimuli list for this block from the appropriate file
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
	} // End of 'block' class

	// util method for shuffeling string list
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

	// util method for shuffeling int list
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

	// Initialize a single block for practice or calibration
	public void initSingleNonTestBlock(string stressCondition, int speed, string nLevel, string ringSize, bool withNBack,
		bool isPractice, bool isCalibration, int ringsFailuresForCalibrationTarget) {
		this.blocksOrder = new List<Block> ();
		this.currentBlockIndex = 0;
		this.condition = stressCondition;
		this.moveSpeed = speed;
		this.ringsFailuresForCalibrationTarget = ringsFailuresForCalibrationTarget;
		Block block = new Block ();
		block.nLevel = nLevel;
		block.ringSize = ringSize;
		block.blockType = "a";	// When initializing a single practice/calibration block we will always use type "a"
		block.isPractice = isPractice;
		block.isCalibration = isCalibration;
		block.withNback = withNBack;
		block.withFlight = true;
		if (isCalibration) {
			// calibration blocks include only flight task - so no need for the lists initializations
			this.blocksOrder.Insert (0, block);
			return;
		}

		if (block.nLevel == "0") {
			block.targetLetter = dataSaver.targetLetterForABlock;
		}
			
		block.generateLetters (dataSaver.trialsAmountPracticeblocks, dataSaver.targetAmountRequired);
		block.generateColors (dataSaver.trialsAmountPracticeblocks);

		this.soundsTypes = new List<string> (new string[] 
			{"alarm", "alarm", "scream", "scream", "scream"});
		this.soundsTypes = dataSaver.shuffle (this.soundsTypes);
		block.generateAversiveSound (dataSaver.trialsAmountPracticeblocks, this.soundsTypes);

		this.blocksOrder.Insert (0, block);
	}


	// Init condition - initialize blocks list from files according to the "order" input parameter
	public void initCondition(string stressCondition, int speed, string subjectNumber, string order) {

		//this.blocksOrder = this.initBlocksOrder (order);
		this.blocksOrder = this.getBlocksFromFile (order);
		this.currentBlockIndex = 0;
		this.subjectNumber = subjectNumber;
		this.condition = stressCondition;
		this.moveSpeed = speed;
		this.blockOrderNumber = order;	

		if (this.condition == "noStress") {
			return;
		}

		// If we are in stress condition - initialize the histograms list for this block
		this.initHistogramsForStressCondition();
	}

	// Initializse histograms properties for stress condition
	private void initHistogramsForStressCondition() {
		this.precentileInHistogram = new List<int> (new int[]{ 2, 2, 2, 2, 3, 3, 3, 3, 3, 4 });
		this.precentileInHistogram = dataSaver.shuffleInt (this.precentileInHistogram);

		List<int> easyBlocks = new List<int>();	// saves the easy blocks (1 back) indices for which we can 
												// localize the subject in the 60th percentile
		int blockIndex = 0;
		foreach (Block block in this.blocksOrder) {
			if (block.nLevel == "1") {
				easyBlocks.Insert (0, blockIndex);
			}
			if (block.isBaseline == true) {	// If this is a baseline block - we don't show histogram so the percentile 
				// won't be in use
				this.precentileInHistogram.Insert (blockIndex, -1);
			}
			blockIndex++;
		}

		// Shuffle the easy blocks and choose a block for which the subject will be localized in the 60th percentile
		// (in the 6th column of the histogram)
		easyBlocks = dataSaver.shuffleInt (easyBlocks);
		foreach (int blockNumber in easyBlocks) {
			if (this.precentileInHistogram[blockNumber] != 4) {	// we have only one block in which the subject's score is
				// in the 40th percentile so we don't want to keep it
				this.precentileInHistogram [blockNumber] = 6;
				break;
			}
		}
	}

	public int getFixationLength() {
		return this.fixationsArray [this.currentBlockIndex];
	}

	public int getAmountInColumn(int columnNumber) {
		return this.histogramColumns [columnNumber];
	}

	// This function reads the blocks' order and the stimuli for each block from the appropriate file
	public List<Block> getBlocksFromFile(string order = "1") {
		string path = Application.dataPath + "/orders/order" + order + "/" + "blockOrder.txt";
		StreamReader stream = new StreamReader(path);
		string blocksOrder = stream.ReadLine ();
		string[] blocks = blocksOrder.Split (',');
		stream.Close ();

		List<Block> allBlocks = new List<Block> ();

		// The blocks in the blockOrder file have this format: <nlevel>_<ringSize>_<blockType>
		foreach (string currentBlock in blocks) {			
			Block block = this.initBlockPropertiesFromBlockName (currentBlock);
			if (block.withNback) {
				block.readInputPropertiesForBlock (order);
			}
			allBlocks.Insert (allBlocks.Count, block);
		}

		return allBlocks;
	}

	private Block initBlockPropertiesFromBlockName(string currentBlock) {
		// The block is not practice and not calibration since we read blocks from file
		// only for the full test condition
		Block block = new Block ();
		string[] parts = currentBlock.Split ('_');
		block.isPractice = false;
		block.isCalibration = false;
		block.withFlight = true;

		block.fileName = currentBlock;
		block.ringSize = parts [1];
		block.blockType = parts [2];

		if (parts [0] == "baseline") {
			block.isBaseline = true;
			block.withNback = false;
			block.nLevel = "";
			return block;
		}

		block.isBaseline = false;
		block.nLevel = parts [0];
		block.withNback = true;

		if (block.nLevel == "0") {
			block.withFlight = false;
			block.isBaseline = true;
			if (block.blockType == "a" || block.blockType == "c") {
				block.targetLetter = dataSaver.targetLetterForABlock;
			} else {
				block.targetLetter = dataSaver.targetLetterForBBlock;
			}
		}
		return block;
	}

	// This method initializes blocks order and blocks properties files for a specific order
	// It is not used regularly - only once before the whole experiment to generate the orders files
	public List<Block> initBlocksOrder(string order) {
		List<Block> allBlocks = new List<Block> ();

		List<string> testBlocks1 = new List<string> ();	// test blocks for the first run (before the break)
		List<string> baselineBlocks1_start = new List<string> (); // basline blocks for the beginning of 
		// the first run (before the break)
		List<string> baselineBlocks1_end = new List<string> (); // basline blocks for the end of 
		// the first run (before the break)
		List<string> testBlocks2 = new List<string> (); // test blocks for the second run (before the break)
		List<string> baselineBlocks2_start = new List<string> (); // basline blocks for the beginning of 
			// the seccond run (before the break)
		List<string> baselineBlocks2_end = new List<string> (); // basline blocks for the end of 
			// the second run (before the break)
		List<string> allBlocksOrder = new List<string> ();

		// Generate blocks order
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

		// We have our blocks order - now we need to generate the stimuli for each block in the order
		int i = 0;
		for (i = 0; i < allBlocksOrder.Count; i++) {

			Block block = this.initBlockPropertiesFromBlockName (allBlocksOrder [i]);
			allBlocks.Insert (i, block);

			// If this is a baseline block without nBack - no need to initiate a stimuli file so continue
			if (block.isBaseline && block.withNback == false) {
				continue;
			}

			int trialsAmount = dataSaver.trialsAmountTestblocks;
			int targetsAmount = dataSaver.targetAmountRequired;
			if (block.isBaseline) {
				trialsAmount = dataSaver.trialsAmountBaselineBlocks;
				targetsAmount = dataSaver.targetAmountRequiredForBaseline;
			}
			block.generateLetters (trialsAmount,targetsAmount);
			block.generateColors (trialsAmount);

			this.soundsTypes = new List<string> (new string[] 
				{"alarm", "alarm", "scream", "scream", "scream"});
			this.soundsTypes = dataSaver.shuffle (this.soundsTypes);
			block.generateAversiveSound (trialsAmount, this.soundsTypes);


			// Create file with stimuli lists
			string path = Application.dataPath + "/orders/order" + order + "/" + block.nLevel + "_"
				+ block.ringSize + "_" + block.blockType + ".txt";
			
			StreamWriter stream = File.CreateText (path);
			stream.WriteLine (getStringFromArray(block.letters));
			stream.WriteLine (getStringFromArray(block.colors));
			stream.WriteLine (getStringFromArray(block.sounds));
			stream.Close ();
		}

		// Create file with blocks names list for the specific order given as parameter
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

		// Initialize fixation array for the experiment - the average for the fixations in each run
		// must be 6 seconds
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
		if (n == "0" || n == "") {
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

	public LSL_BCI_Input getLslScript() {
		return this.LSLScript;
	}

	public parallelPort getParallelsScript() {
		return this.parallelScript;
	}

	public bool getLastBlockNbackStatus() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].withNback;
	}

	public string getRingSize() {
		return this.blocksOrder [this.currentBlockIndex].ringSize;
	}

	public string getLastRingSize() {
		return this.blocksOrder [this.currentBlockIndex == 0? 0 : this.currentBlockIndex-1].ringSize;
	}

	public bool getWithFlight() {
		return this.blocksOrder [this.currentBlockIndex].withFlight;
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
		
	void Awake() {
		DontDestroyOnLoad(this.gameObject);
	}

	// This method builds the histogram aound a specific subject's score
	public void buildHistogram(int scoreInColumn) {
		this.columnInHistogram = scoreInColumn - 1; // histogramColumns Array starts from index zero 
		this.histogramColumns = new int[]{0,0,0,0,0,0,0,0,0,0};

		int precentileInHistogram = this.precentileInHistogram [this.currentBlockIndex];

		// Create columns smaller or equal to the subject score's column
		int minValue = columnInHistogram - (precentileInHistogram > 2 ? 2: 1);
		minValue = minValue < 0 ? 0 : minValue;
		int randomMinValue = Random.Range (minValue, columnInHistogram - 1 > minValue ? columnInHistogram - 1  : minValue);
		// add one occurrence for each column between the subject'precentileInHistograms column to the min column
		// to satisfy demand that there won't be an empty column between the max and the min column
		int index;
		int valuesAdded = 0;
		for (index = randomMinValue; index <= columnInHistogram; index++) {
			this.histogramColumns [index]++;
			valuesAdded ++;
		}

		index = 0;
		for (index = 0; index < precentileInHistogram - valuesAdded; index++) {
			int currentColumn = Random.Range(randomMinValue, columnInHistogram);
			if (currentColumn == columnInHistogram && this.histogramColumns [currentColumn] >= 3 && columnInHistogram != 0) {
				index--;
				continue;
			}
			this.histogramColumns [currentColumn]++;
		}

		// Create columns higher than the subject score's column
		int maxValue = columnInHistogram <= 5 ? columnInHistogram + 4 : 9;
		maxValue = Random.Range (columnInHistogram + 2 > maxValue? maxValue : columnInHistogram + 2, maxValue);

		valuesAdded = 0;
		for (index = columnInHistogram + 1; index <= maxValue ; index++) {
			this.histogramColumns [index]++;
			valuesAdded++;
		}

		index = 0;
		for (index = 0; index < 10 - precentileInHistogram - valuesAdded; index++) {
			int currentColumn = Random.Range(columnInHistogram + 1, maxValue);
			this.histogramColumns [currentColumn]++;
		}
	}

}
