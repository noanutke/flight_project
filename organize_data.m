function y = organize_data(timeVector, triggersVector)
    dataTable = {'subId', 'time', 'letter', 'rt', 'responseType',...
        'condition', 'isPractice', 'n', 'ringPassedStatusIndex',...
        'isSuccess', 'prefLevel', 'ringSize'};
    
    subIdIndex = 1;
    timeIndex = 2;
    letterIndex = 3;
    rtIndex = 4;
    responseTypeIndex = 5;
    conditionIndex = 6;
    isPracticeIndex = 7;
    nIndex = 8;
    ringPassedStatusIndex = 9;
    isSuccessIndex = 10;
    prefLevelIndex = 11;
    ringSizeIndex = 12;
    
    
    currentRowIndex = 2;
    currentNbackRow = -1;
    currentRingRow = -1;
    startTime = -1;
    condition = "";
    level = "";
    perfLevel = '1';
    lastLetterTime = 0;
    lastLetter = "";
    
    for n = 1:numel(triggersVector)
        trigger = triggersVector(1,n);
        conditionLevel = checkIfStartTrigger(trigger);
        resSize = size(conditionLevel);
        if resSize(1) > 0
            startTime = timeVector(n);
            condition = conditionLevel{1,1};
            level = conditionLevel{1,2};
        end
        
        letter = checkIfLetter(trigger);
        if letter ~= ""
            lastLetter = letter;
            lastLetterTime = timeVector(n) - startTime;
        end
        
        perfLevelTemp = checkIfLevelChanged(trigger);
        if size(perfLevelTemp) > 0
            perfLevel = perfLevelTemp
        end
        
        nBackResponse = isNbackResponse(trigger);
        if nBackResponse ~= ""
            newRowsIndices = progressRowsNumbersIfNeeded(currentRowIndex, currentNbackRow,...
                currentRingRow, "nBack");
            currentRowIndex = newRowsIndices(1);
            currentNbackRow = newRowsIndices(2);
            currentRingRow = newRowsIndices(3);
            dataTable{currentNbackRow,nIndex} = level;
            dataTable{currentNbackRow,conditionIndex} = condition;
            dataTable{currentNbackRow,responseTypeIndex} = nBackResponse;
            dataTable{currentNbackRow,prefLevelIndex} = perfLevel;
            dataTable{currentNbackRow,timeIndex} = timeVector(n) - startTime;
            dataTable{currentNbackRow,letterIndex} = lastLetter;
            dataTable{currentNbackRow,letterIndex} = lastLetter;
            dataTable{currentNbackRow,rtIndex} = timeVector(n) - startTime - lastLetterTime;
            if nBackResponse == "HIT" || nBackResponse == "CorrectRejection"
                dataTable{currentNbackRow,isSuccessIndex} = 1;
            end
        end
        ringResponse = isRingResponse(trigger);
        if size(ringResponse) ~= 0
            newRowsIndices = progressRowsNumbersIfNeeded(currentRowIndex, currentNbackRow,...
                currentRingRow, "ring");
            currentRowIndex = newRowsIndices(1);
            currentNbackRow = newRowsIndices(2);
            currentRingRow = newRowsIndices(3);
            ringSize = ringResponse(2);
            status = ringResponse(1);
            dataTable{currentRingRow,conditionIndex} = condition;
            dataTable{currentRingRow,ringPassedStatusIndex} = status;
            dataTable{currentRingRow,prefLevelIndex} = perfLevel;
            dataTable{currentRingRow,ringSizeIndex} = ringSize;
            dataTable{currentRingRow,timeIndex} = timeVector(n) - startTime;
        end
    end
    y = dataTable;
end

function result = checkIfLetter(trigger)
     letter = strfind(trigger, 'Letter');
     appearance = size(letter{1,1});
     if appearance(1) == 0
         result = "";
     else 
         result = '1'; %extractAfter(trigger, "_");               
     end
end

function result = checkIfLevelChanged(trigger)
     levelChangedIndex = strfind(trigger, 'PerfChanged_');
     appearance = size(levelChangedIndex{1,1});
     if appearance(1) == 0
         result = [];
     else 
         result = extractAfter(trigger, "_");               
     end         
end
    
function result = progressRowsNumbersIfNeeded(currentRowIndex, currentNbackRow,...
    currentRingRow, currentTrialType)
    if currentTrialType == 'nBack'
        currentNbackRow = currentRowIndex;
        currentRowIndex = currentRowIndex + 1;

    else
        currentRingRow = currentRowIndex;
        currentRowIndex = currentRowIndex + 1;
    end
    result = [currentRowIndex, currentNbackRow, currentRingRow];
end

function result = isNbackResponse(trigger)
     FA = strfind(trigger, 'FA');
     appearanceFA = size(FA{1,1});
     correctRejection = strfind(trigger, 'CorrectRejection');
     appearanceCorrectRejection = size(correctRejection{1,1});
     HIT = strfind(trigger, 'HIT');
     appearanceHIT = size(HIT{1,1});
     miss = strfind(trigger, 'MISS');
     appearanceMISS = size(miss{1,1});
     if appearanceFA(1) > 0
         result = "FA";
     elseif appearanceCorrectRejection(1) > 0
         result = "CorrectRejection";
     elseif appearanceHIT(1) > 0
         result = "HIT";
     elseif appearanceMISS(1) > 0
         result ="MISS";
     else
         result = "";
     end
end

function result = isRingResponse(trigger)
     ring = strfind(trigger, 'Ring');
     appearanceRing = size(ring{1,1});
     if appearanceRing(1) > 0
         ringSize = extractAfter(trigger, "Size_");
         status = strfind(trigger, 'Failed');
         appearanceStatus = size(status{1,1});
         if appearanceStatus(1) > 0
             result = ['0', ringSize];
         else
             result = ['1', ringSize];
         end
     else
         result = [];
     end
end

function result = checkIfStartTrigger(trigger)
     startIndices = strfind(trigger, 'Start');
     appearance = size(startIndices{1,1});
     if appearance(1) == 0
         result = [];
     else 
         condition = "";
         level = "";   
         noStress = strfind(trigger, 'noStress');
         appearance = size(noStress{1,1});
         if appearance(1) > 0
             condition = 'noStress';
         else
             condition = 'stress';
         end
         level1 = strfind(trigger, '1');
         appearance1 = size(level1{1,1});
         level2 = strfind(trigger, '2');
         appearance2 = size(level2{1,1});
         if appearance1(1) > 0
             level = 1;
         elseif appearance2(1) > 0
             level = 2;
         else
             level = 3;
         end
         result = {condition, level};
            
     end         
end




