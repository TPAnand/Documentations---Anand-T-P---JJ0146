/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/currentRecord','N/record', 'N/search'],
    /**
 * @param{currentRecord} currentRecord
 * @param{record} record
 * @param{search} search
 */
    (currentRecord,record, search) => {

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
                log.debug("Error @ empty check Function: ",e.name+' : '+e.message)
            }
        }

        function soSearch(id){
            try {
                var res = []
                if(checkForParameter(id))
                {
                    var workorderSearchObj = search.create({
                        type: "workorder",
                        filters:
                            [
                                ["type", "anyof", "WorkOrd"],
                                "AND",
                                ["internalidnumber", "equalto", id]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "createdfrom",
                                    summary: "GROUP",
                                    label: "Created From"
                                })
                            ]
                    });
                    var searchResultCount = workorderSearchObj.runPaged().count;
                    log.debug("workorderSearchObj result count", searchResultCount);
                    if(searchResultCount>0) {
                        workorderSearchObj.run().each(function (result) {
                            // .run().each has a limit of 4,000 results
                            var created = result.getValue({
                                name: "createdfrom",
                                summary: "GROUP"
                            })
                            if (checkForParameter(created)) {
                                res.push(created)
                            }
                            return true;
                        });
                    }
                }
                log.debug("RES: ",res)
                return res
            }
            catch (e) {
                log.debug("Error @ Serach: ",e.name+": "+e.message)
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
                if(scriptContext.type != 'delete') {
                    var rec = scriptContext.newRecord
                    var recId = rec.id
                    if (checkForParameter(recId)) {
                        var createdFrom = soSearch(recId)
                        if (checkForParameter(createdFrom)) {
                            var soRec = record.load({
                                type: record.Type.SALES_ORDER,
                                id: createdFrom
                            })
                            var itemCount = soRec.getLineCount({
                                sublistId: 'item'
                            })
                            if (itemCount > 0) {
                                var lineNumber = soRec.findSublistLineWithValue({
                                    sublistId: 'item',
                                    fieldId: 'woid',
                                    value: recId
                                });
                                log.debug("lineNumber: ", lineNumber)
                                var woid = soRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'woid',
                                    line: lineNumber
                                })
                                var productionEndLine = soRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_wo_production_end_date',
                                    line: lineNumber
                                })
                                if (checkForParameter(woid) && checkForParameter(productionEndLine)) {
                                    if (woid == recId) {
                                        var saved = record.submitFields({
                                            type: record.Type.WORK_ORDER,
                                            id: woid,
                                            values: {
                                                'enddate': productionEndLine
                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (e) {
                log.debug("Error @ afterSubmit: ", e.name + " : " + e.message)
            }
        }
        return {
            afterSubmit : afterSubmit
        }
    });
