/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/currentRecord', 'N/record', 'N/runtime', 'N/search', 'N/task'],
    /**
 * @param{currentRecord} currentRecord
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 */
    (currentRecord, record, runtime, search, task) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Function to convert date to dateString format.
         * @param {Date} iDate - Date fieldValue
         * @returns {string} res - converted DateString
         * @since 2015.2
         */
        function convertDate(iDate){
            try {
                var d = new Date(iDate).getDate()
                switch (d) {
                    case '01' : d = '1'; break;
                    case '02' : d = '2'; break;
                    case '03' : d = '3'; break;
                    case '04' : d = '4'; break;
                    case '05' : d = '5'; break;
                    case '06' : d = '6'; break;
                    case '07' : d = '7'; break;
                    case '08' : d = '8'; break;
                    case '09' : d = '9'; break;
                    default: break;
                }
                var m = new Date(iDate).getMonth()+1
                var y = new Date(iDate).getFullYear()
                var res = d+'/'+m+'/'+y
                return res;
            }
            catch (e) {
                log.debug("Error in Date function: ",e.name+': '+e.message)
            }
        }

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
                    log.debug("Empty Value found");
                    return false;
                }
            }
            catch (e) {
                log.debug("Error @ empty check Function: ",e.name+' : '+e.message)
            }
        }

        /**
         * Function to convert dateString to date 'd/m/yyyy' format.
         * @returns {Date} convertedDate - converted Date
         * @since 2015.2
         */
        function dateCreator(){
            try{

                //Date operations
                var d= new Date();
                var m;
                if(d.getMonth() == 11){
                    m= '1'
                }
                else{
                    m= d.getMonth()+2
                }
                var y = (d.getMonth()==11) ? (d.getFullYear()+1) : d.getFullYear()
                var dt = '1'+'/'+m+'/'+y
                var convertedDate = format.parse({
                    value: dt,
                    type: format.Type.DATE
                });
                return convertedDate

            }
            catch (e) {
                log.debug("Error @ date Creator function: ",e.name+' : '+e.message)
            }
        }

        /**
         * Function to list vendor bills / journals which has pending FA lines.
         *
         * @param {string} id - record ID
         * @returns {string} cnt - Count of lines in each record which has no related Records. ie; lines which hasn't Fixed asset
         *
         * @since 2015.2
         */
        function transactionSearch() {
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["type","anyof","VendBill","Journal"],
                        "AND",
                        ["custcol_far_trn_relatedasset","anyof","@NONE@"],
                        "AND",
                        [["custcol_far_asset_type","noneof","@NONE@"],"OR",["custcol_far_asset_types","noneof","@NONE@"]],
                        // "AND",
                        // ["custcol_far_exclude_asset_type","is","F"],
                        "AND",
                        ["creditamount","isempty",""]

                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "lineuniquekey",
                            summary: "COUNT",
                            label: "Line Unique Key"
                        }),
                        search.createColumn({
                            name: "type",
                            summary: "GROUP",
                            label: "Record Type"
                        })
                    ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearch result count",searchResultCount);
            var resArr = [];
            transactionSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var id = result.getValue({
                    name: "internalid",
                    summary: "GROUP"
                })
                var cnt = result.getValue({
                    name: "lineuniquekey",
                    summary: "COUNT",
                })
                var type = result.getValue({
                    name: "type",
                    summary: "GROUP"
                })
                resArr.push({
                    recId: id,
                    recType: type,
                    lCount: cnt
                })
                return true;
            });
            log.debug("resArr: ",resArr)
            return resArr;
        }

        function rescheduleScriptandReturn() {
            try {
                //endrange is the last range of the just finished search.
                //Next search range when rescheduled will start from this endRange
                log.debug("RESCHEDULING STARTS")
                // log.debug("ID: ",id)
                var ssTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 2109,
                    deploymentId: "customdeploy_jj_ss_scheduled_script_fa",
                    // params: {
                    //     custscript_rec_id: id
                    //     // custscript_endrange: endRange
                    //     // custscript_tot_count: n
                    // }
                });
                var scriptTaskId = ssTask.submit();
                log.debug("RESCHEDULED SCRIPT TASK ID: ", scriptTaskId)

            } catch (err) {
                log.debug("Error @ rescheduling: ",err.name+": "+err.message)
                log.error({
                    title: 'error on rescheduleScriptandReturn',
                    details: err
                });
            }

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try{
                if(scriptContext.type == 'create' || 'edit'){
                    var rec = scriptContext.newRecord
                    var recId = rec.id
                    var recType = rec.type
                    log.debug("recId: ",recId)
                    log.debug("recType: ",recType)

                    var scriptObj = runtime.getCurrentScript();
                    log.debug('SCRIPT: ' + scriptObj);

                    if((recType == 'vendorbill') || (recType == 'journalentry')){

                        var resArr = transactionSearch();
                        log.debug("RESULT: ",resArr)
                        log.debug("Length: ",resArr.length)
                        if(resArr.length>0){
                            var remaingUsage = scriptObj.getRemainingUsage()

                            for(var i=0;i<resArr.length;i++){

                                log.debug('Remaining governance units: ' , remaingUsage);
                                if (remaingUsage < 500) {
                                    rescheduleScriptandReturn()
                                }
                                else {
                                    if (resArr[i].lCount >= 10) {
                                        var faScheduleRec = record.create({
                                            type: 'customrecord_fa_scheduling',
                                            isDynamic: true
                                        })
                                        faScheduleRec.setValue({
                                            fieldId: 'custrecord_fa_schedule_rec_id',
                                            value: resArr[i].recId
                                        })
                                        faScheduleRec.setValue({
                                            fieldId: 'custrecord_fa_schedule_rec_type',
                                            value: resArr[i].recType
                                        })
                                        faScheduleRec.setValue({
                                            fieldId: 'custrecord_fa_schedule_line_count',
                                            value: resArr[i].lCount
                                        })
                                        var savedRecId = faScheduleRec.save()
                                        log.debug("savedRecId: ", savedRecId)

                                    }
                                }
                            }
                        }

                    }
                }
            }
            catch (e) {
                log.debug("Error @ Scheduling After submit: ",e.name+" : "+e.message)
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
