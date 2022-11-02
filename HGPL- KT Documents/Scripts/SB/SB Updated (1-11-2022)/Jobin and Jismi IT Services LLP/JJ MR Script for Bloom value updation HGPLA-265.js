/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/currentRecord', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/url'],
    /**
     * @param{currentRecord} currentRecord
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{task} task
     * @param{url} url
     */
    (currentRecord, record, runtime, search, task, url) => {

        /**
         * @description Check whether the given parameter argument has value on it or is it empty.
         * ie, To check whether a value exists in parameter
         * @param {*} parameter parameter which contains/references some values
         * @param {*} parameterName name of the parameter, not mandatory
         * @returns {Boolean} true if there exist a value, else false
         */
        function checkForParameter(parameter, parameterName) {
            if (parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false && parameter !== "null" && parameter !== "undefined" && parameter !== " " && parameter !== 'false') {
                return true;
            } else {
                if (parameterName)
                    log.debug('Empty Value found', 'Empty Value for parameter ' + parameterName);
                return false;
            }
        }

        function taskSearch(){
            try{
                var taskSearchObj = search.create({
                    type: "task",
                    filters:
                        [
                            ["status","anyof","NOTSTART"],
                            "AND",
                            ["company","noneof","@NONE@"],
                            "AND",
                            ["custevent_jj_bloom_group","noneof","@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "title", label: "Task Title"}),
                            search.createColumn({name: "custevent_jj_bloom_group", label: "Banner Group"}),
                            search.createColumn({name: "company", label: "Company"}),
                            search.createColumn({name: "status", label: "Status"})
                        ]
                });
                var searchResultCount = taskSearchObj.runPaged().count;
                log.debug("taskSearchObj result count",searchResultCount);
                var res = []
                if(searchResultCount> 0) {
                    taskSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var taskId = result.getValue({name: "internalid"})
                        var company = result.getValue({name: "company"})
                        var bannerGroup = result.getValue({name: "custevent_jj_bloom_group"})
                        res.push({
                            taskId: taskId,
                            company: company,
                            bannerGroup: bannerGroup
                        })
                        return true;
                    });
                }
                log.debug("Res: ",res)
                return res;
            }
            catch (e) {
                log.debug("Errror @ taskSearch: ",e.name+" : "+e.message)
            }
        }

        /**
         * @description function for fetching the bloom data based on the banner group
         * @param ids {Number} Internal ID of  the banner group.
         * @returns {[]|Object[]}
         */
        function fetchBloomData(ids){
            var customrecord_jj_mst_sit_visitSearchObj = search.create({
                type: "customrecord_jj_mst_sit_visit",
                filters:
                    [
                        ["custrecord_jj_mkt_flg_master","anyof",ids]
                    ],
                columns:
                    [
                        search.createColumn({name: "custrecord_jj_mkt_flg_master", label: "BANNER GROUP"}),
                        search.createColumn({name: "custrecord_jj_monthly_info_store", label: "Monthly Information"}),
                        search.createColumn({name: "custrecord_jj_std_ans_store", label: "Standard Answers"}),
                        search.createColumn({name: "custrecord_jj_std_ques_store", label: "Standard Questions"})
                    ]
            });
            var searchResultCount = customrecord_jj_mst_sit_visitSearchObj.runPaged().count;
            log.debug("customrecord_jj_mst_sit_visitSearchObj result count",searchResultCount);
            var res = []
            if(searchResultCount>0){
                customrecord_jj_mst_sit_visitSearchObj.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var bannerGroup = result.getText({name: "custrecord_jj_mkt_flg_master"})
                    var monthlyInfo = result.getValue({name: "custrecord_jj_monthly_info_store"})
                    var stdQues = result.getValue({name: "custrecord_jj_std_ques_store"})
                    var stdAns = result.getValue({name: "custrecord_jj_std_ques_store"})
                    res.push({
                        bannerGroup: bannerGroup,
                        monthlyInfo: monthlyInfo,
                        stdQues: stdQues,
                        stdAns: stdAns
                    })
                    return true;
                });
            }
            log.debug("RESSSSS: ",res)
            return res;
        }

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            try{
                var taskArray = taskSearch()
                log.debug("taskArrayLength: ",taskArray.length)
                if(taskArray.length>0){
                    return taskArray
                }
            }
            catch (e) {
                log.debug("Error @ getInputData: ",e.name+" : "+e.message)
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            try{
                var json_result = JSON.parse(reduceContext.values[0])
                var taskId = json_result.taskId
                var bloomId = json_result.bannerGroup
                log.debug("bloomId: ",bloomId)
                if(checkForParameter(bloomId)) {
                    var bloomData = fetchBloomData(bloomId)
                    log.debug("bloomData: ", bloomData)
                    if(checkForParameter(taskId)){
                        var taskRec =  record.load({
                            type:record.Type.TASK,
                            id: taskId,
                            isDynamic: true
                        });
                        taskRec.setValue({
                            fieldId:'custevent_jj_monthly_information',
                            value:bloomData[0].monthlyInfo
                        });
                        taskRec.setValue({
                            fieldId:'custevent_jj_std_quetions',
                            value:bloomData[0].stdQues
                        });
                        taskRec.setValue({
                            fieldId:'custevent_jj_std_answers',
                            value:bloomData[0].stdAns
                        });
                        var saved = taskRec.save()
                        log.debug("saved: ",saved)
                    }
                }
            }
            catch (e) {
                log.debug("Errror @ Reduce: ",e.name+" : "+e.message)
            }
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

        return {getInputData,reduce, summarize}

    });
