function y = generateExcelFile(fileName1, fileName2)
    files = dir('*.xdf');
    dataTable = {'subId', 'time', 'letter', 'rt', 'responseType',...
    'condition', 'isPractice', 'n', 'ringPassedStatusIndex',...
    'isSuccessNback', 'stroopCondition', 'ringSize', 'blockNumber',...
    'speed', 'difficultLevel', 'isBaseline', 'blockType'};
    blockTimes = {'nLevel', 'ringSize', 'isPractice', 'blockType'...
       'condition', 'blockNumber' ,'isBaseline', 'startTime', 'endTime',...
       'instructionsLength', 'fixationLength', 'beforeInstructionsLength',...
       'afterFixationLength', 'joystickMovements','subId','difficultLevel',...
       'pitchDirectionChanges', 'yawDirectionChanges'};
    for file = files'
        data = load_xdf(file.name);
        
        times = [];
        markers = {};
        titles = {};
        
        for n = 1:numel(data)
            if string(data{1,n}.info.hostname) == "fmri-stim-6"
                if string(data{1,n}.info.name) == "NEDE_StickMvmtPitch"
                    times = [times, data{1,n}.time_stamps];
                    markers = [markers, num2cell(data{1,n}.time_series)];
                    amount = size(data{1,n}.time_series);
                    pitchTitle = cell(1,amount(2));
                    pitchTitle(:) = {'pitch'};
                    titles = [titles, pitchTitle];
                end
                if string(data{1,n}.info.name) == "NEDE_StickMvmtYaw"
                    times = [times, data{1,n}.time_stamps];
                    markers = [markers, num2cell(data{1,n}.time_series)]; 
                    amount = size(data{1,n}.time_stamps);
                    yawTitle = cell(1,amount(2));
                    yawTitle(:) = {'yaw'};
                    titles = [titles, yawTitle];
                end
                if string(data{1,n}.info.name) == "NEDE_Markers"
                    times = [times, data{1,n}.time_stamps];
                    markers = [markers, num2cell(data{1,n}.time_series)];
                    amount = size(data{1,n}.time_stamps);
                    taskMarkersTitle = cell(1,amount(2));
                    taskMarkersTitle(:) = {'taskMarkers'};
                    titles = [titles, taskMarkersTitle];
                end
            end
        end
        
        [a,sortedIndices] = sort(times);
        %[y x] = organize_data_with_bip...
         %  (times, markers, extractBefore(string(file.name), "."));
       
        [y x] = organize_data_new...
           (times, markers,titles,sortedIndices, extractBefore(string(file.name), "."));
        dataTable = [dataTable;y];
        blockTimes = [blockTimes;x];

    end
    y = dataTable;
    xlswrite(fileName1,dataTable);
    xlswrite(fileName2,blockTimes);

end