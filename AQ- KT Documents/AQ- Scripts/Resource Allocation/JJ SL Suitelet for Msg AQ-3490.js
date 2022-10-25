/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/currentRecord', 'N/error', 'N/record', 'N/runtime', 'N/ui/message', 'N/ui/serverWidget', 'N/url', 'N/search'],
    /**
 * @param{currentRecord} currentRecord
 * @param{error} error
 * @param{record} record
 * @param{runtime} runtime
 * @param{message} message
     * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{url} url
 */
    (currentRecord, error, record, runtime, message, serverWidget, url, search) => {

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

        function employeeSearch(subsidiary,billingClass){
            try{
                if(checkForParameter(subsidiary)==true&&checkForParameter(billingClass)==true) {
                    var employeeSearchObj = search.create({
                        type: "employee",
                        filters:
                            [
                                ["isinactive", "is", "F"],
                                "AND",
                                ["isjobresource", "is", "T"],
                                "AND",
                                [["releasedate", "isempty", ""], "OR", ["releasedate", "after", "today"]],
                                "AND",
                                ["subsidiary", "anyof", subsidiary],
                                "AND",
                                ["billingclass", "anyof", billingClass]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({
                                    name: "entityid",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "custentity_laborcost", label: "Labor Cost (Employee Subsidiary's Currency)"})
                            ]
                    });
                    var searchResultCount = employeeSearchObj.runPaged().count;
                    var res = []
                    employeeSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var empId = result.getValue({
                            name: "internalid"
                        })
                        var empName = result.getValue({
                            name: "entityid",
                            sort: search.Sort.ASC
                        })
                        var empLaborCost = result.getValue({
                            name: "custentity_laborcost"
                        })
                        res.push({
                            empId: empId,
                            empName:empName,
                            empLaborCost: empLaborCost
                        })
                        return true;
                    });
                    return res
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ Employee Search: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        function vendorSearch(subsidiary,billingClass){
            try{
                if(checkForParameter(subsidiary)==true&&checkForParameter(billingClass)==true){
                    var vendorSearchObj = search.create({
                        type: "vendor",
                        filters:
                            [
                                ["isinactive","is","F"],
                                "AND",
                                ["isjobresourcevend","is","T"],
                                "AND",
                                ["msesubsidiary.internalid","anyof",subsidiary],
                                "AND",
                                ["billingclass","anyof",billingClass]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({
                                    name: "entityid",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "custentity_laborcost", label: "Labor Cost"})
                            ]
                    });
                    var searchResultCount = vendorSearchObj.runPaged().count;
                    var res = [];
                    vendorSearchObj.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        var empId = result.getValue({
                            name: "internalid"
                        })
                        var empName = result.getValue({
                            name: "entityid",
                            sort: search.Sort.ASC
                        })
                        var empLaborCost = result.getValue({
                            name: "custentity_laborcost"
                        })
                        res.push({
                            empId: empId,
                            empName:empName,
                            empLaborCost: empLaborCost
                        })
                        return true;
                    });
                    return res
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ vendorSearch: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try{
                if(scriptContext.request.method == 'POST') {
                    var projectId = scriptContext.request.parameters.projectId
                    var projectSubsidiary = scriptContext.request.parameters.projectSubsidiary
                    var prjFieldLookUp = search.lookupFields({
                        type: search.Type.JOB,
                        id: projectId,
                        columns: ['allowallresourcesfortasks']
                    });
                    var prjPref = prjFieldLookUp && prjFieldLookUp.allowallresourcesfortasks
                    var taskArr = scriptContext.request.parameters.taskArr
                    var count = JSON.parse(taskArr)
                    log.debug("projectId: ",projectId)
                    log.debug("projectSubsidiary: ",projectSubsidiary)
                    log.debug("taskArr: ",taskArr)
                    log.debug("count: ",count)
                    log.debug("prjPref: ",prjPref)
                    var prjRec = record.load({
                        type: record.Type.JOB,
                        id: projectId,
                        isDynamic: true
                    })
                    prjRec.setValue({
                        fieldId: 'allowallresourcesfortasks',
                        value: true
                    })
                    prjRec.save()
                    var prjPrefUpdated = prjRec.getValue({
                        fieldId: 'allowallresourcesfortasks'
                    })
                    log.debug("prjPref- Updated: ",prjPrefUpdated)
                    if(prjPrefUpdated == true) {
                        if (count.length > 0) {
                            for (var i = 0; i < count.length; i++) {
                                var taskId = count[i].taskId
                                var genericEmp = count[i].genericEmp
                                var plannedHrs = count[i].plannedHrs
                                var unitPrice = count[i].unitPrice
                                var unitCost = count[i].genericCost
                                var billingClass = count[i].billingClass
                                var isVendor = count[i].isVendor

                                var allocationList = []
                                var allocationEmpList = []
                                var vendorList = [];
                                var filteredList = []
                                allocationEmpList.push(genericEmp)
                                allocationList.push({
                                    empId: genericEmp,
                                    empLaborCost: Number(unitCost),
                                    empType: 'Generic Resource'
                                })
                                log.debug("isVendor: ", isVendor)
                                if (isVendor == true) {
                                    vendorList = vendorSearch(projectSubsidiary, billingClass)
                                    log.debug("vendorList: ", vendorList)
                                    if (vendorList.length > 0) {
                                        for (var j = 0; j < vendorList.length; j++) {
                                            allocationEmpList.push(vendorList[j].empId)
                                            allocationList.push({
                                                empId: vendorList[j].empId,
                                                empLaborCost: vendorList[j].empLaborCost,
                                                empType: 'Vendor'
                                            })
                                        }
                                    }
                                }

                                var employeeList = employeeSearch(projectSubsidiary, billingClass)
                                log.debug("employeeList: ",employeeList)
                                if (employeeList.length > 0) {
                                    for (var j = 0; j < employeeList.length; j++) {
                                        allocationEmpList.push(employeeList[j].empId)
                                        allocationList.push({
                                            empId: employeeList[j].empId,
                                            empLaborCost: employeeList[j].empLaborCost,
                                            empType: 'Employee'
                                        })
                                    }
                                }

                                if (checkForParameter(taskId) == true) {
                                    if (allocationEmpList.length > 0) {
                                        var rec = record.load({
                                            type: record.Type.PROJECT_TASK,
                                            id: taskId,
                                            isDynamic: true
                                        })
                                        var gLine = rec.getLineCount({
                                            sublistId: 'assignee'
                                        })

                                        var resourceList = []
                                        for (var l = 0; l < gLine; l++) {
                                            var res = rec.getSublistValue({
                                                sublistId: 'assignee',
                                                fieldId: 'resource',
                                                line: l
                                            })
                                            resourceList.push(res)
                                        }
                                        log.debug("resourceList: ", resourceList)

                                        for (var x = 0; x < allocationEmpList.length; x++) {
                                            if (!resourceList.includes(allocationEmpList[x])) {
                                                filteredList.push({
                                                    empId: allocationList[x].empId,
                                                    empType: allocationList[x].empType,
                                                    empLaborCost: Number(allocationList[x].empLaborCost)
                                                })
                                            }
                                        }
                                        log.debug("filteredList: ", filteredList)
                                        if (filteredList.length > 0) {
                                            for (var k = 0; k < filteredList.length; k++) {
                                                rec.selectNewLine({
                                                    sublistId: 'assignee'
                                                })

                                                rec.setCurrentSublistValue({
                                                    sublistId: 'assignee',
                                                    fieldId: 'resource',
                                                    value: filteredList.length > 0 ? filteredList[k].empId : ''
                                                })
                                                rec.setCurrentSublistValue({
                                                    sublistId: 'assignee',
                                                    fieldId: 'plannedwork',
                                                    value: ((filteredList && filteredList.length > 0) && (filteredList[k].empType == 'Generic Resource')) ? Number(plannedHrs) : Number(0)
                                                })

                                                rec.setCurrentSublistValue({
                                                    sublistId: 'assignee',
                                                    fieldId: 'unitcost',
                                                    value: filteredList.length > 0 ? filteredList[k].empLaborCost : Number(0)
                                                })
                                                rec.setCurrentSublistValue({
                                                    sublistId: 'assignee',
                                                    fieldId: 'units',
                                                    value: 100.0
                                                })
                                                rec.setCurrentSublistValue({
                                                    sublistId: 'assignee',
                                                    fieldId: 'serviceitem',
                                                    value: 57
                                                })
                                                rec.setCurrentSublistValue({
                                                    sublistId: 'assignee',
                                                    fieldId: 'unitprice',
                                                    value: Number(unitPrice)
                                                })
                                                rec.commitLine({
                                                    sublistId: 'assignee'
                                                })
                                            }
                                            rec.save()
                                        }
                                    }
                                }
                            }
                            if(checkForParameter(projectId)==true){
                                var PrjoectRec = record.load({
                                    type: record.Type.JOB,
                                    id: projectId,
                                    isDynamic: true
                                })
                                PrjoectRec.setValue({
                                    fieldId: 'allowallresourcesfortasks',
                                    value: false
                                })
                                PrjoectRec.save()
                                prjPref = PrjoectRec.getValue({
                                    fieldId: 'allowallresourcesfortasks'
                                })
                                log.debug("prjPref After Last: ", prjPref)
                            }

                            scriptContext.response.write(JSON.stringify({
                                status: "SUCCESS",
                                message: prjPref
                            }));
                        }
                    }
                }
            }
            catch (e) {
                log.debug("Error: ",e.name+" : "+e.message)
            }
        }

        return {onRequest}

    });
