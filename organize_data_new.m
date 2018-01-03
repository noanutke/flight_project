function y = organize_data(timeVector, triggersVector)
    dataTable = {'subId', 'time', 'letter', 'rt', 'responseType',...
        'condition', 'isPractice', 'n', 'ringPassedStatusIndex',...
        'isSuccessNback', 'stroopCondition', 'ringSize'};
    
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
    stroopConditionIndex = 11;
    ringSizeIndex = 12;
    
    
    currentRowIndex = 2;
    currentNbackRow = -1;
    currentRingRow = -1;
    startTime = -1;
    condition = '';
    level = '';
    ringSize = '';
    stroopCondition = '';
    isPractice = '';
    lastLetterTime = 0;
    lastLetter = '';
    
    for n = 1:numel(triggersVector)
        trigger = triggersVector(1,n);
        conditionLevel = checkIfStartTrigger(trigger);
        resSize = size(conditionLevel);
        if resSize(1) > 0
            startTime = timeVector(n);
            condition = conditionLevel{1,1};
            level = conditionLevel{1,2};
            ringSize = conditionLevel{1,3};
            stroopCondition = conditionLevel{1,4};
            isPractice = conditionLevel{1,5};           
        end
        
        letter = checkIfLetter(trigger);
        if string(letter) ~= ""
            lastLetter = letter;
            lastLetterTime = timeVector(n) - startTime;
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
            dataTable{currentNbackRow,stroopConditionIndex} = stroopCondition;
            dataTable{currentNbackRow,timeIndex} = timeVector(n) - startTime;
            dataTable{currentNbackRow,letterIndex} = lastLetter;
            dataTable{currentNbackRow,ringSizeIndex} = ringSize;
            rt = timeVector(n) - startTime - lastLetterTime;
            if rt > 0
                dataTable{currentNbackRow,rtIndex} = timeVector(n) - startTime - lastLetterTime;
            end
            if string(nBackResponse) == "HIT" || string(nBackResponse) == "CorrectRejection"
                dataTable{currentNbackRow,isSuccessIndex} = 1;
            else
                dataTable{currentNbackRow,isSuccessIndex} = 0;
            end
        end
        ringResponse = isRingResponse(trigger);
        ringResponseSize = size(ringResponse);
        if ringResponseSize(1) > 0
            newRowsIndices = progressRowsNumbersIfNeeded(currentRowIndex, currentNbackRow,...
                currentRingRow, "ring");
            currentRowIndex = newRowsIndices(1);
            currentNbackRow = newRowsIndices(2);
            currentRingRow = newRowsIndices(3);
            status = ringResponse{1,1};
            isSuccess = 0;
            if status == '1'
                isSuccess = 1;
            end
            dataTable{currentRingRow,conditionIndex} = condition;
            dataTable{currentRingRow,ringPassedStatusIndex} = status;
            dataTable{currentRingRow,stroopConditionIndex} = stroopCondition;
            dataTable{currentRingRow,ringSizeIndex} = ringSize;
            dataTable{currentRingRow,timeIndex} = timeVector(n) - startTime;
            dataTable{currentRingRow,letterIndex} = lastLetter;
            dataTable{currentRingRow,nIndex} = level;
        end
    end
    
    y = dataTable;
end

function result = checkIfLetter(trigger)
     letter = strfind(trigger, 'Letter');
     appearance = size(letter{1,1});
     if appearance(1) == 0
         result = '';
     else 
         letter_string = extractAfter(trigger, "_");
         result = extractBefore(letter_string, 2);               
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
         result = 'FA';
     elseif appearanceCorrectRejection(1) > 0
         result = 'CorrectRejection';
     elseif appearanceHIT(1) > 0
         result = 'HIT';
     elseif appearanceMISS(1) > 0
         result ='MISS';
     else
         result = '';
     end
end

function result = isRingResponse(trigger)
     ring = strfind(trigger, 'Ring');
     appearanceRing = size(ring{1,1});
     statusFirst= strfind(trigger, 'First');
     appearanceStatusFirst = size(statusFirst{1,1});
     if appearanceRing(1) > 0 && appearanceStatusFirst(1) <= 0
         
         statusFailed = strfind(trigger, 'Failed');
         statusPassed = strfind(trigger, 'Passed');
         
         appearanceStatusFailed = size(statusFailed{1,1});
         appearanceStatusPassed= size(statusPassed{1,1});
         if appearanceStatusFailed(1) > 0
             result = {'0'};
         elseif appearanceStatusPassed(1) > 0
             result = {'1'};
         else
             result = {};
         end
     else
         result = {};
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
         ringSize = "";
         stroopCondition = "";
         isPractice = "";
         
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
             level = 0;
         end
         
         small = strfind(trigger, 'small');
         big = strfind(trigger, 'big');
         appearanceSmall = size(small{1,1});
         appearanceBig = size(big{1,1});
         if appearanceSmall(1) > 0
             ringSize = 'small';
         elseif appearanceBig(1) > 0
             ringSize = 'big';
         else
             ringSize = 'medium';
         end
         
         isPractice = strfind(trigger, 'true');
         appearance = size(isPractice{1,1});
         if appearance(1) > 0
             isPractice = 'true';
         else
             isPractice = 'false';
         end
         
         stroopCondition = strfind(trigger, 'incong');
         appearance = size(stroopCondition{1,1});
         if appearance(1) > 0
             stroopCondition = 'incong';
         else
             stroopCondition = 'cong';
         end
         
         result = {condition, level, ringSize, stroopCondition, isPractice};
            
     end         
end




