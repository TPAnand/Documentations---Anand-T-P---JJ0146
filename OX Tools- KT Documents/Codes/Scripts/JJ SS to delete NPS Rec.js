/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/task'],

    /**
 * @param{currentRecord} currentRecord
 * @param{record} record
 * @param{search} search
 * @param{task} task
 */
    (currentRecord, record, search, task) => {

        function npsSearch(){
            try{
                var customrecord_jj_nps_survey_responseSearchObj = search.create({
                    type: "customrecord_jj_nps_survey_response",
                    filters:
                        [
                            ["isinactive","is","F"],
                            "AND",
                            ["custrecord_jj_nps_mail_status","anyof","1","@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "id",
                                sort: search.Sort.ASC,
                                label: "ID"
                            }),
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "custrecord_jj_customer_name", label: "Customer"}),
                            search.createColumn({name: "custrecord_jj_response", label: "Response"}),
                            search.createColumn({name: "custrecord_jj_survey_date", label: "Survey Date"}),
                            search.createColumn({name: "custrecord_jj_nps_mail_status", label: "NPS Status"})
                        ]
                });

                var searchResultCount = customrecord_jj_nps_survey_responseSearchObj.runPaged().count;
                log.debug("customrecord_jj_nps_survey_responseSearchObj result count",searchResultCount);
                customrecord_jj_nps_survey_responseSearchObj.run().each(function(result){
                    var id = result.getValue({name: "internalid"})
                    var customer = result.getValue({name: "custrecord_jj_customer_name", label: "Customer"})
                    if(checkForParameter(customer)){
                        record.submitFields({
                            type: record.Type.CUSTOMER,
                            id: customer,
                            values: {
                                'custentity_jj_last_survey_send_date': ''
                            }
                        })
                    }
                    if(checkForParameter(id)){
                        record.delete({
                            type:'customrecord_jj_nps_survey_response',
                            id: id
                        })
                        log.debug("Deleted: ",id)
                    }
                    return true;
                });

            }
            catch (e) {
             log.debug("Error: ",e.name+" : "+e.message)
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
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            try{
                npsSearch()
            }
            catch (e) {
                log.debug("Error @ execute: ",e.name+" : "+e.message)
            }
        }

        return {execute}

    });
