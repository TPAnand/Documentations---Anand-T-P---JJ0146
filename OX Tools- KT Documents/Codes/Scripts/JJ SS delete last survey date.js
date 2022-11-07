/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {

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

        function customerSearch() {
            try{
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                        [
                            ["isinactive","is","F"],
                            "AND",
                            ["contactprimary.email","isnotempty",""],
                            "AND",
                            ["custentity_jj_last_survey_send_date","isnotempty",""]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "custentity_jj_last_survey_send_date", label: "Last Survey Send Date"})
                        ]
                });
                var searchResultCount = customerSearchObj.runPaged().count;
                log.debug("customerSearchObj result count",searchResultCount);
                var res = []
                if(searchResultCount>0) {
                    customerSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var customerId = result.getValue({name: "internalid"})
                        // var survayDate = result.getValue({name: "custentity_jj_last_survey_send_date"})
                        res.push(customerId)
                        return true;
                    });
                }
                return res;
            }
            catch (e) {
                log.debug("Error: ",e.name+" : "+e.message)
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
                var list = customerSearch()
                log.debug("list: ",list)
                if(list.length>0){
                    for(var i =0;i<list.length;i++){
                        if(checkForParameter(list[i])){
                            record.submitFields({
                                type: record.Type.CUSTOMER,
                                id: list[i],
                                values: {
                                    'custentity_jj_last_survey_send_date': ''
                                }
                            })
                        }
                    }
                }
            }
            catch (e) {
                log.debug("Error: ",e.name+" : "+e.message)
            }
        }

        return {execute}

    });
