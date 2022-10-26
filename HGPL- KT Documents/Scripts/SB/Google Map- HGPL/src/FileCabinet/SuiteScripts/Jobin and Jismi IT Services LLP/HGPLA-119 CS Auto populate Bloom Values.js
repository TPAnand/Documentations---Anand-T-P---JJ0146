/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/****************************************************************************
 * Herbs of Gold Pty Ltd |HGPLA-119 | Autopopulate the store visit fields based on the banner group
 * **************************************************************************
 *
 * Date: 06/06/2022 // Prodc 05/07/2022
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Revision
 *
 * Description: The client script is used for autopopulates the store visit fields based on the banner group
 *
 ******************************************************************************/
define(['N/currentRecord', 'N/runtime', 'N/search','N/record'],
    /**
     * @param{currentRecord} currentRecord
     * @param{runtime} runtime
     * @param{search} search
     * @param{record} record
     */
    function(currentRecord, runtime, search, record) {

        function pageInit(scriptContext){
            try{
                log.debug("PAGE INIIIIIITTTTT")
                console.log("PAGE INIIIIIITTTTT")
                if(scriptContext.mode == "create" || scriptContext.mode == "copy") {
                    console.log("url", (window.location.href).split("&company=")[1])
                    let entityId = (window.location.href).split("&company=")[1] //fetch company id

                    if(checkForParameter(entityId)){
                        let bloomId = scriptContext.currentRecord.getValue({fieldId:"custevent_jj_bloom_group"})
                        console.log("bloomId",bloomId)
                        if(bloomId) {
                            let bloomValues = dataSets.fetchBloomData(bloomId)
                            console.log("bloomValues", bloomValues)

                            if(checkForParameter(bloomValues[0]["Standard Questions"].value))
                                scriptContext.currentRecord.setValue({fieldId:"custevent_jj_std_quetions",value:bloomValues[0]["Standard Questions"].value})

                            if(checkForParameter(bloomValues[0]["Standard Answers"].value))
                                scriptContext.currentRecord.setValue({fieldId:"custevent_jj_std_answers",value:bloomValues[0]["Standard Answers"].value})

                            if(checkForParameter(bloomValues[0]["Monthly Information"].value))
                                scriptContext.currentRecord.setValue({fieldId:"custevent_jj_monthly_information",value:bloomValues[0]["Monthly Information"].value})

                            return true
                        }
                    }
                }


            }catch (e) {
                console.log("error@pageInit",e)
            }
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            try{
                var currentRecord = scriptContext.currentRecord;
                var fieldName = scriptContext.fieldId;
                if (fieldName == 'custevent_jj_bloom_group'){
                    log.debug("enter loop")
                    console.log("enter loop")
                    let bloomId = currentRecord.getValue({fieldId:fieldName})
                    log.debug("bloomId: ",bloomId)
                    console.log("bloomId",bloomId)

                    if(bloomId) {
                        let bloomValues = dataSets.fetchBloomData(bloomId)
                        console.log("bloomValues", bloomValues)

                        if(checkForParameter(bloomValues[0]["Standard Questions"].value))
                            currentRecord.setValue({fieldId:"custevent_jj_std_quetions",value:bloomValues[0]["Standard Questions"].value})

                        if(checkForParameter(bloomValues[0]["Standard Answers"].value))
                            currentRecord.setValue({fieldId:"custevent_jj_std_answers",value:bloomValues[0]["Standard Answers"].value})

                        if(checkForParameter(bloomValues[0]["Monthly Information"].value))
                            currentRecord.setValue({fieldId:"custevent_jj_monthly_information",value:bloomValues[0]["Monthly Information"].value})
                    }

                return true
                }
            }catch (e) {
                console.log("error@fieldChanged",e)
            }
        }

        /**
         * Function to update Master data details on Task record.
         */
        function updateMasterdata(){
            try{
                var curRec=  currentRecord.get();
                var curRecId = curRec.id
                console.log("curRecId: ",curRecId)

                let companyId = search.lookupFields({
                    type: search.Type.TASK,
                    id: curRecId,
                    columns: ['company']
                })
                console.log("companyId: ",companyId)

                if(companyId){

                    if(checkForParameter(companyId.company)&& companyId.company.length>0) {

                        let bloomId = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: companyId.company[0].value,
                            columns: ['custentity_jj_crm_form']
                        })
                        log.debug("bloomId: ", bloomId)
                        console.log("bloomId", bloomId)

                        if (bloomId) {

                            if (checkForParameter(bloomId.custentity_jj_crm_form) && bloomId.custentity_jj_crm_form.length > 0) {

                                curRec.setValue({
                                    fieldId: 'custevent_jj_bloom_group',
                                    value: bloomId.custentity_jj_crm_form[0].value
                                })
                                let bloomValues = dataSets.fetchBloomData(bloomId.custentity_jj_crm_form[0].value)
                                console.log("bloomValues", bloomValues)

                                if (checkForParameter(bloomValues[0]["Standard Questions"].value))
                                    curRec.setValue({
                                        fieldId: "custevent_jj_std_quetions",
                                        value: bloomValues[0]["Standard Questions"].value
                                    })

                                if (checkForParameter(bloomValues[0]["Standard Answers"].value))
                                    curRec.setValue({
                                        fieldId: "custevent_jj_std_answers",
                                        value: bloomValues[0]["Standard Answers"].value
                                    })

                                if (checkForParameter(bloomValues[0]["Monthly Information"].value))
                                    curRec.setValue({
                                        fieldId: "custevent_jj_monthly_information",
                                        value: bloomValues[0]["Monthly Information"].value
                                    })
                            }
                        }
                    }
                }
                return true
            }
            catch (e) {
                console.log("Error @ updateMasterdata: ",e.name+" : "+e.message)
            }
        }

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
                //log.debug('pageRangeLength', pageRangeLength);

                for (let pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                    searchPageRanges.fetch({
                        index: pageIndex
                    }).data.forEach(function (result) {
                        response.push(dataSets.formatSingleSavedSearchResult(result, columns));
                    });

                return response;
            },
            /**
             * @description function for fetching the bloom data based on the banner group
             * @param ids {Number} Internal ID of  the banner group.
             * @returns {[]|Object[]}
             */
            fetchBloomData(ids){
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
                return dataSets.iterateSavedSearch(customrecord_jj_mst_sit_visitSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_mst_sit_visitSearchObj, 'label'));
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
                    log.debug('Empty Value found', 'Empty Value for parameter ' + parameterName);
                return false;
            }
        }



        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            updateMasterdata: updateMasterdata
        };

    });
