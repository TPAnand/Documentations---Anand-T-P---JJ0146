/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/email', 'N/file', 'N/record', 'N/search','N/runtime','N/task'],
    /**
 * @param{email} email
 * @param{file} file
 * @param{record} record
 * @param{search} search
 */
    (email, file, record, search,runtime,task) => {
        var fileIDTOSend;

        /**
         * Function to check whether the field has an empty value or not.
         *
         * @param {parameter} parameter - fieldValue
         * @returns {boolean} true - if the value is not empty
         * @returns {boolean} false - if the value is empty
         *
         * @since 2015.2
         */
        function checkForParameter(parameter) {
            try{
                if (parameter != "" && parameter != null && parameter != undefined && parameter != "null" && parameter != "undefined" && parameter != " " && parameter != false) {
                    return true;
                }
                else {
                    return false;
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ empty check Function: ",
                    details: e.name+' : '+e.message
                })
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
                    var monthlyInfo = result.getValue({name: "custrecord_jj_monthly_info_store"})
                    var stdQues = result.getValue({name: "custrecord_jj_std_ques_store"})
                    var stdAns = result.getValue({name: "custrecord_jj_std_ques_store"})
                    res.push({
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
                log.debug("in Get input Data")
                var fileID =  runtime.getCurrentScript().getParameter("custscript_jj_fileid");
                log.debug("fileID",fileID)

               // fileID =4;

                if(fileID){
                    var fileContent=[];
                    //get the contents
                    var recData = record.load({
                        type:'customrecord_jj_task_records_hgpl_13',
                        id:fileID
                    });
                    var data =  recData.getValue({
                        fieldId:'custrecord_jj_data_to_prcss'
                    });
                    //set status value as Inprogress
                    recData.setValue({
                        fieldId:'custrecord_status_of_task',
                        value:2
                    });
                    var id =  recData.save({
                        ignoreMandatoryFields:true
                    })
                }
                else{
                    var searchForInProgress = search.create({
                        type: "customrecord_jj_task_records_hgpl_13",
                        filters:
                            [
                                ["custrecord_status_of_task","anyof","2"]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({
                                    name: "created",
                                    sort: search.Sort.ASC,
                                    label: "Date Created"
                                })
                            ]
                    });
                    var searchResultCount = searchForInProgress.runPaged().count;
                    log.debug("searchForInProgress result count",searchResultCount);
                    if(searchResultCount>0){
                        return false;
                    }else{

                        var customrecord_jj_task_records_hgpl_13SearchObj = search.create({
                            type: "customrecord_jj_task_records_hgpl_13",
                            filters:
                                [
                                    ["custrecord_status_of_task","anyof","1"]
                                ],
                            columns:
                                [
                                    search.createColumn({name: "internalid", label: "Internal ID"}),
                                    search.createColumn({
                                        name: "created",
                                        sort: search.Sort.ASC,
                                        label: "Date Created"
                                    })
                                ]
                        });
                        var searchResultCount = customrecord_jj_task_records_hgpl_13SearchObj.runPaged().count;
                        log.debug("searchForInProgress result count",searchResultCount);

                        if(searchResultCount>0) {
                            customrecord_jj_task_records_hgpl_13SearchObj.run().each(function (result) {
                                fileIDTOSend = result.getValue({
                                    name: "internalid", label: "Internal ID"
                                })
                                // .run().each has a limit of 4,000 results
                                return false;
                            });
                            log.debug("fileIDTOSend I/P", fileIDTOSend)

                            var recData = record.load({
                                type: 'customrecord_jj_task_records_hgpl_13',
                                id: fileIDTOSend
                            });
                            var data = recData.getValue({
                                fieldId: 'custrecord_jj_data_to_prcss'
                            });
                            //set status value as Inprogress
                            recData.setValue({
                                fieldId: 'custrecord_status_of_task',
                                value: 2
                            });
                            var id = recData.save({
                                ignoreMandatoryFields: true
                            })
                        }

                    }
                }

                log.debug("data",data)
                if(checkForParameter(data)==true){
                    return JSON.parse(data);
                }


            }catch (e) {
                log.debug("Err@getInputData",e)
                log.error("Err@getInputData",e)


            }

        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {

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
                log.debug("In Reduce")
                var taskObj =  JSON.parse(reduceContext.values[0]);
                log.debug("JSON: ",taskObj)
                //craete task
                var taskRec =  record.create({
                    type:record.Type.TASK,
                });

                //set title
                taskRec.setValue({
                    fieldId:'title',
                    value:taskObj["title"]
                })

                //set Assigned To
                taskRec.setValue({
                    fieldId:'assigned',
                    value:taskObj["assignedTo"]
                })

                //set priority
                taskRec.setText({
                    fieldId:'priority',
                    text:taskObj["priority"]
                })

                //set startDate
                taskRec.setText({
                    fieldId:'startdate',
                    text:taskObj["startDate"]
                })
                //set duedate
                taskRec.setText({
                    fieldId:'duedate',
                    text:taskObj["endDate"]
                });
                taskObj["isReservedTime"]= taskObj["isReservedTime"] ? true : false
                // taskObj["isReservedTime"]=((taskObj["isReservedTime"])=='T')?true:false
                //set reserve time
                taskRec.setValue({
                    fieldId:'timedevent',
                    value:taskObj["isReservedTime"]
                })
                //set start time
                taskRec.setText({
                    fieldId:'starttime',
                    text:taskObj["startTime"]
                })
                //set end time
                taskRec.setText({
                    fieldId:'endtime',
                    text:taskObj["endTime"]
                });
                //link customer
                taskRec.setValue({
                    fieldId:'company',
                    value:taskObj["internalID"]
                });

                if(checkForParameter(taskObj["internalID"])){
                    var bloomId = search.lookupFields({id: taskObj["internalID"],type: record.Type.CUSTOMER,columns:['custentity_jj_crm_form']})
                    log.debug("bloomId: ",bloomId)
                    if(checkForParameter(bloomId)&&checkForParameter(bloomId.custentity_jj_crm_form)&&bloomId.custentity_jj_crm_form.length>0){
                        var bloomData = fetchBloomData(bloomId.custentity_jj_crm_form[0].value)
                        if(bloomData.length>0){
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
                        }
                    }
                }

                //link custom record
                var custRecID = runtime.getCurrentScript().getParameter("custscript_jj_fileid");
                taskRec.setValue({
                    fieldId: 'custevent_jj_bulk_pa_ref',
                    value: custRecID
                });
                taskRec.setValue({
                    fieldId:'sendemail',
                    value: false
                })
                var taskID = taskRec.save({
                    ignoreMandatoryFields: true
                });
                if(taskID){
                    reduceContext.write({
                        key: taskObj["customerName"],
                        value: true
                    });
                }else{
                    reduceContext.write({
                        key: taskObj["customerName"],
                        value: false
                    });
                }



            }catch (e) {
                reduceContext.write({
                    key: taskObj["customerName"],
                    value: e.message
                });
                log.debug("Err@reduce",e)
                log.error("Err@reduce",e)

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
            try{
                log.debug("in Summarize")
                var text = '';
                var errorCount = 0;
                var errorMsg='Failed Task creation : Reason\n';
                summaryContext.output.iterator().each(function(key, value) {
                    if(value!=true && value!='true'){
                        errorMsg =errorMsg+  (key + ' : ' + value + '\n');
                        errorCount++

                    }

                    return true;
                });
                var custRecID = runtime.getCurrentScript().getParameter("custscript_jj_fileid");
                log.debug("custRecID",custRecID)
                log.debug("fileID in summary",fileIDTOSend);

                var customrecord_jj_task_records_hgpl_13SearchObj = search.create({
                    type: "customrecord_jj_task_records_hgpl_13",
                    filters:
                        [
                            ["custrecord_status_of_task","anyof","2"] //  //task status == Pending
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({
                                name: "created",
                                sort: search.Sort.ASC,
                                label: "Date Created"
                            })
                        ]
                });
                var searchResultCount = customrecord_jj_task_records_hgpl_13SearchObj.runPaged().count;
                log.debug("customrecord_jj_task_records_hgpl_13SearchObj result count",searchResultCount);
                customrecord_jj_task_records_hgpl_13SearchObj.run().each(function(result){
                    fileIDTOSend =  result.getValue({
                        name: "internalid", label: "Internal ID"
                    })
                    // .run().each has a limit of 4,000 results
                    return false;
                });

                if(errorCount>0){

                    if(custRecID){
                        log.debug("errorMsg",errorMsg)
                        var id =  record.submitFields({
                            id:custRecID,
                            type:'customrecord_jj_task_records_hgpl_13',
                            values:{
                                'custrecord_error_to_create_task':errorMsg,
                                //task status == failed
                                'custrecord_status_of_task':4
                            }
                        })
                    }else{
                        var id =  record.submitFields({
                            id:fileIDTOSend,
                            type:'customrecord_jj_task_records_hgpl_13',
                            values:{
                                'custrecord_error_to_create_task':errorMsg,
                                //task status == failed
                                'custrecord_status_of_task':4
                            }
                        })
                    }

                }else{
                    if(custRecID) {
                        var id = record.submitFields({
                            id: custRecID,
                            type: 'customrecord_jj_task_records_hgpl_13',
                            values: {
                                //task status == Success
                                'custrecord_status_of_task': 3
                            }
                        })
                    }else{
                        var id = record.submitFields({
                            id: fileIDTOSend,
                            type: 'customrecord_jj_task_records_hgpl_13',
                            values: {
                                //task status == Success
                                'custrecord_status_of_task': 3
                            }
                        })
                    }

                }

                if(searchResultCount>0){
                    var mapReduceTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_jj_mr_create_task_hgpl13',
                        deploymentId: 'customdeploy_jj_mr_create_task_hgpl13',
                        /*params: {
                            'custscript_jj_fileid': fileIDTOSend
                        }*/
                    });
                    mapReduceTask.submit();
                }

            }catch (e) {

                log.debug("Err@summarize",e)
                log.error("Err@summarize",e)


            }

        }

        return {getInputData, /*map,*/ reduce, summarize}

    });
