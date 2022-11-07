/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/currentRecord', 'N/email', 'N/error', 'N/format', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/url','N/file','N/render'],
    /**
     * @param{currentRecord} currentRecord
     * @param{email} email
     * @param{error} error
     * @param{format} format
     * @param{https} https
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{task} task
     * @param{url} url
     * @param{file} file
     * @param{render} render
     */
    (currentRecord, email, error, format, https, record, runtime, search, task, url,file,render) => {

        const dataSets = {
            /**
             * @description Object referencing NetSuite Saved Search
             * @typedef {Object} SearchObj
             * @property {Object[]} filters - Filters Array in Search
             * @property {Object[]} columns - Columns Array in Search
             */
            /**
             * @description to format Saved Search column to key-value pair where each key represents each columns in Saved Search
             * @param {SearchObj} savedSearchObj
             * @param {void|String} priorityKey
             * @returns {Object.<String,SearchObj.columns>}
             */
            fetchSavedSearchColumn(savedSearchObj, priorityKey) {
                let columns = savedSearchObj.columns;
                let columnsData = {},
                    columnName = '';
                columns.forEach(function (result, counter) {
                    columnName = '';
                    if (result[priorityKey]) {
                        columnName += result[priorityKey];
                    } else {
                        if (result.summary)
                            columnName += result.summary + '__';
                        if (result.formula)
                            columnName += result.formula + '__';
                        if (result.join)
                            columnName += result.join + '__';
                        columnName += result.name;
                    }
                    columnsData[columnName] = result;
                });
                return columnsData;
            },

            /**
             * @description Representing each result in Final Saved Search Format
             * @typedef formattedEachSearchResult
             * @type {{value:any,text:any}}
             */
            /**
             * @description to fetch and format the single saved search result. ie, Search result of a single row containing both text and value for each columns
             * @param {Object[]} searchResult contains search result of a single row
             * @param {Object.<String,SearchObj.columns>} columns
             * @returns {Object.<String,formattedEachSearchResult>|{}}
             */
            formatSingleSavedSearchResult(searchResult, columns) {
                let responseObj = {};
                for (let column in columns)
                    responseObj[column] = {
                        value: searchResult.getValue(columns[column]),
                        text: searchResult.getText(columns[column])
                    };
                return responseObj;
            },

            /**
             * @description to iterate over and initiate format of each saved search result
             * @param {SearchObj} searchObj
             * @param {void|Object.<String,SearchObj.columns>} columns
             * @returns {[]|Object[]}
             */
            iterateSavedSearch(searchObj, columns) {
                if (!checkForParameter(searchObj))
                    return false;
                if (!checkForParameter(columns))
                    columns = dataSets.fetchSavedSearchColumn(searchObj);

                let response = [];
                let searchPageRanges;
                try {
                    searchPageRanges = searchObj.runPaged({
                        pageSize: 1000
                    });
                } catch (err) {
                    return [];
                }
                if (searchPageRanges.pageRanges.length < 1)
                    return [];

                let pageRangeLength = searchPageRanges.pageRanges.length;

                for (let pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                    searchPageRanges.fetch({
                        index: pageIndex
                    }).data.forEach(function (result) {
                        response.push(dataSets.formatSingleSavedSearchResult(result, columns));
                    });

                return response;
            }
        }

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
                    log.error('Empty Value found', 'Empty Value for parameter ' + parameterName);
                return false;
            }
        }

        /**
         * @description Function for listing customers who has no survey send or survey send before 90 days.
         * @returns {Object} object of result
         */
        function customerSearch(){
            try{
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                        [
                            ["isinactive","is","F"],
                            "AND",
                            ["stage","anyof","CUSTOMER"],
                            // ["internalid","is",41502],
                            "AND",
                            ["contactprimary.email","isnotempty",""],
                            "AND",
                            ["custentity_exclude_from_nps_survey","is","F"],
                            "AND",
                            ["subsidiary","anyof","1"],
                            "AND",
                            [["custentity_jj_last_survey_send_date","isempty",""],"OR",["custentity_jj_last_survey_send_date","within","ninetydaysago"]]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal_ID"}),
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "email",
                                join: "contactPrimary",
                                label: "Email"
                            }),
                            search.createColumn({name: "custentity_jj_last_survey_send_date", label: "Last_Survey_Send_Date"}),
                            search.createColumn({name: "subsidiarynohierarchy", label: "Subsidiary"})
                        ]
                });
                var searchResultCount = customerSearchObj.runPaged().count;
                log.debug("customerSearchObj result count",searchResultCount);
                return dataSets.iterateSavedSearch(customerSearchObj, dataSets.fetchSavedSearchColumn(customerSearchObj, 'label'));
            }
            catch (e) {
                log.debug("Error @ customer Search: ",e.name+" : "+e.message)
            }
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
                var customerList = customerSearch()
                log.debug("customerList: ",customerList)

                var survayedCustomers = []
                var unsurvayedCustomers = []
                for(var i=0;i<customerList.length;i++){
                    var last = customerList[i].Last_Survey_Send_Date.value //value of last survey send date from customer record

                    if(!checkForParameter(last)){
                        unsurvayedCustomers.push(customerList[i]) //array of customers who hasn't get any survey
                    }
                    else {
                        survayedCustomers.push(customerList[i]) // array of customers who got survey before 90 days
                    }
                }

                var filteredCustomers = []
                var unsurvayedCustomersLength = 0
                var survayedCustomersLength = 0
                if(unsurvayedCustomers.length>0){
                    unsurvayedCustomersLength = unsurvayedCustomers.length
                    if(unsurvayedCustomersLength > 7) {
                        for (var i = 0; i < 7; i++) {
                            filteredCustomers.push({
                                internalId: unsurvayedCustomers[i].Internal_ID.value,
                                name: unsurvayedCustomers[i].Name.value,
                                email: unsurvayedCustomers[i].Email.value,
                                lastsurvayedDate: unsurvayedCustomers[i].Last_Survey_Send_Date.value,
                                subsidiary: unsurvayedCustomers[i].Subsidiary.value
                            })
                        }
                    }
                    else {
                        for (var i = 0; i < unsurvayedCustomersLength; i++) {
                            filteredCustomers.push({
                                internalId: unsurvayedCustomers[i].Internal_ID.value,
                                name: unsurvayedCustomers[i].Name.value,
                                email: unsurvayedCustomers[i].Email.value,
                                lastsurvayedDate: unsurvayedCustomers[i].Last_Survey_Send_Date.value,
                                subsidiary: unsurvayedCustomers[i].Subsidiary.value
                            })
                        }
                    }
                }

                log.debug("BEFORE filteredCustomers: ",filteredCustomers)
                log.debug("BEFORE filteredCustomers Length: ",filteredCustomers.length)
                log.debug("BEFORE survayedCustomers.length: ",survayedCustomers.length)

                if(survayedCustomers.length>0){
                    if(filteredCustomers.length<7){
                        log.debug("IF SURVEYED")
                        survayedCustomersLength = Number(7) - Number(filteredCustomers.length) // available/ remaining slots for already surveyed customers
                        if(survayedCustomers.length>survayedCustomersLength) { // if already surveyed customer array's length is greater than or equal to the available/ remaining slots for already surveyed customers
                            for (var j = 0; j < survayedCustomersLength; j++) {
                                filteredCustomers.push({
                                    internalId: survayedCustomers[j].Internal_ID.value,
                                    name: survayedCustomers[j].Name.value,
                                    email: survayedCustomers[j].Email.value,
                                    lastsurvayedDate: survayedCustomers[j].Last_Survey_Send_Date.value,
                                    subsidiary: survayedCustomers[i].Subsidiary.value
                                })
                            }
                        }
                        else{ // if already surveyed customer array's length is lesser than the available/ remaining slots for already surveyed customers, already surveyed customer array's length will be the total index for the looping
                            log.debug("ELSE SURVEYED")
                            for (var j = 0; j < survayedCustomers.length; j++) {
                                filteredCustomers.push({
                                    internalId: survayedCustomers[j].Internal_ID.value,
                                    name: survayedCustomers[j].Name.value,
                                    email: survayedCustomers[j].Email.value,
                                    lastsurvayedDate: survayedCustomers[j].Last_Survey_Send_Date.value,
                                    subsidiary: survayedCustomers[i].Subsidiary.value
                                })
                            }
                        }
                    }
                }

                log.debug("unsurvayedCustomersLength: ",unsurvayedCustomersLength)
                log.debug("survayedCustomersLength: ",survayedCustomersLength)
                log.debug("filteredCustomers LENGTH: ",filteredCustomers.length)
                log.debug("filteredCustomers: ",filteredCustomers)

                return filteredCustomers;
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

                var json_result = JSON.parse(reduceContext.values)
                log.debug("json_Result: ",json_result)

                var curScript = runtime.getCurrentScript();
                var authorParam = curScript.getParameter({
                    name: 'custscript_jj_mail_author'
                })
                log.debug("authorParam: ",authorParam)

                if(checkForParameter(authorParam)) {
                    var curDate = new Date()

                    var npsRec = record.create({
                        type: 'customrecord_jj_nps_survey_response',
                        isDynamic: true
                    })
                    npsRec.setValue({
                        fieldId: 'custrecord_jj_customer_name',
                        value: json_result.internalId
                    })
                    npsRec.setValue({
                        fieldId: 'custrecord_jj_survey_date',
                        value: curDate
                    })
                    npsRec.setValue({
                        fieldId: 'custrecord_jj_nps_mail_status',
                        value: 1
                    })
                    var saved = npsRec.save()
                    log.debug("saved: ", saved)

                    if (checkForParameter(saved)) {

                        let newEmailTempl = render.mergeEmail({
                            templateId: 808,
                            customRecord: {
                                id: saved,
                                type: 'customrecord_jj_nps_survey_response'
                            }
                        });
                        let emailBody = newEmailTempl.body;
                        let emailSubject = newEmailTempl.subject

                        var objParam = {
                            recId: saved,
                            response: ''
                        }

                        var extURL = url.resolveScript({ // getting External URL of the suitelet of Feedback
                            deploymentId: 'customdeploy_jj_sl_nps_survey_otga1515',
                            scriptId: 'customscript_jj_sl_nps_survey_otga1515',
                            params: objParam,
                            returnExternalUrl: true
                        })
                        if (checkForParameter(json_result.email)) {
                            if (checkForParameter(extURL)) {
                                emailBody = emailBody.replaceAll('url=', extURL);// replacing the URL provided on the email template with the external URL except witht he value of the response

                                if (checkForParameter(emailBody)) {
                                    email.send({
                                        author: authorParam,
                                        recipients: json_result.email,
                                        subject: checkForParameter(emailSubject) ? emailSubject : 'NPS Survey',
                                        body: emailBody
                                    })

                                    var updated = record.submitFields({
                                        id: saved,
                                        type: 'customrecord_jj_nps_survey_response',
                                        values: {
                                            'custrecord_jj_nps_mail_status': 2
                                        }
                                    })
                                    log.debug("UPDATED: ", updated)

                                    var updatedCustomer = record.submitFields({
                                        id: json_result.internalId,
                                        type: record.Type.CUSTOMER,
                                        values: {
                                            'custentity_jj_last_survey_send_date': checkForParameter(curDate) ? curDate : ''
                                        }
                                    })
                                    log.debug("updatedCustomer: ", updatedCustomer)
                                }
                            }
                        }
                    }
                }
            }
            catch (e) {
                log.debug("Error @ Reduce: ",e.name+" : "+e.message)
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
            try {
                var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                log.debug("GOVRNANCE: ", remainingUsage);

                if(remainingUsage<500) {
                    let mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: "customscript_jj_mr_email_survey_otga1515",
                        deploymentId: "customdeploy_jj_mr_email_survey_otga1515",
                    });
                    log.debug("Task Created: ", mrTask);
                    mrTask.submit();
                }

            } catch (e) {
                log.debug("Error @ Summarize: ", e.name + " : " + e.message);
            }
        }
        return {getInputData, reduce, summarize}
    });

// https://3425005-sb1.app.netsuite.com/core/media/media.nl?id=44&amp;c=3425005_SB1&amp;h=t86CsY4XXYGWFLOTBt8TFKvhG2OJ1a586X_ntljL924nOnQ-