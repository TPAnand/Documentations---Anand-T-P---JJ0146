/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/https', 'N/record', 'N/search', 'N/runtime', 'N/url','N/ui/message'],
/**
 * @param{currentRecord} currentRecord
 * @param{https} https
 * @param{record} record
 * @param{search} search
 * @param{runtime} runtime
 * @param{url} url
 * @param{message} message
 */
function(currentRecord, https, record, search, runtime, url,message) {
    var currentRec = currentRecord.get()
    var project,projectSub;
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
            console.log("Error @ empty check Function: ",e.name+' : '+e.message)
        }
    }

    /**
     * Function to get the total fee value from project task record.
     *
     * @param {id} id - project task ID
     * @returns [{res}] res - array contains the total fee of a particular project task
     *
     * @since 2015.2
     */
    function getCalculatedValue(id) {
        try{
            if(checkForParameter(id)){
                var projecttaskSearchObj = search.create({
                    type: "projecttask",
                    filters:
                        [
                            ["internalidnumber","equalto",id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                sort: search.Sort.ASC,
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "price",
                                join: "projectTaskAssignment",
                                summary: "SUM",
                                label: "Estimated Revenue"
                            })
                        ]
                });
                var searchResultCount = projecttaskSearchObj.runPaged().count;
                log.debug("projecttaskSearchObj result count",searchResultCount);
                var res = []
                if(searchResultCount>0) {
                    projecttaskSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var total = result.getValue({
                            name: "price",
                            join: "projectTaskAssignment",
                            summary: "SUM"
                        })
                        res.push(total)
                        return true;
                    });
                }
                return res
            }
        }
        catch (e) {
            log.debug("Error @ getCalculatedValue: ",e.name+" : "+e.message)
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
        try {
            if (window.onbeforeunload) {
                window.onbeforeunload = function () {
                    null;
                };
            }
            var oldUrl = window.location.href;
            var curRec = scriptContext.currentRecord

            var prjId = curRec.getValue({
                fieldId: 'custpage_project'
            })
            console.log("prjId 2 : ",prjId)
            project = prjId
            if(checkForParameter(prjId)==true) {
                var prjCurrency = curRec.getValue({
                    fieldId: 'custpage_currencyid'
                })
                projectSub = curRec.getValue({
                    fieldId: 'custpage_subsidiaryid'
                })

                if (scriptContext.fieldId == 'custpage_project') {
                    var promise = new Promise(function (resolve, reject) {
                        jQuery("#custpage_load_img").css("display", "block");
                        setTimeout(function () {
                            oldUrl = oldUrl.split('&deploy=' + 1);
                            if (checkForParameter(prjId) == true) {
                                var newUrl = oldUrl[0] + "&deploy=1&prjId=" + prjId;
                                window.location.href = newUrl;
                            } else {
                                jQuery("#custpage_load_img").css("display", "none");
                                window.location.href = oldUrl;
                            }
                        }, 5000)
                    })

                }

                var prjTaskId = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_project_task'
                })
                var prjTaskBillingRateCard, prjTaskBillingRateCardId, estimatedFee, totalFee, billingType;
                if (checkForParameter(prjTaskId) == true) {
                    var fieldLookup = search.lookupFields({
                        type: search.Type.PROJECT_TASK,
                        id: prjTaskId,
                        columns: ['custevent3', 'custevent_jj_billing_type', 'custevent_jj_total_estimated','custevent_jj_budgeted_revenue']
                    });
                    console.log("fieldLookup: ",fieldLookup)
                    prjTaskBillingRateCardId = (fieldLookup && fieldLookup.custevent3.length > 0) ? fieldLookup.custevent3[0].value : " "
                    prjTaskBillingRateCard = (fieldLookup && fieldLookup.custevent3.length > 0) ? fieldLookup.custevent3[0].text : " "
                    estimatedFee = (fieldLookup && fieldLookup.custevent_jj_budgeted_revenue) ? fieldLookup.custevent_jj_budgeted_revenue : " "
                    // totalFee = (fieldLookup && fieldLookup.custevent_jj_total_estimated) ? fieldLookup.custevent_jj_total_estimated : " "
                    billingType = (fieldLookup && fieldLookup.custevent_jj_billing_type.length > 0) ? fieldLookup.custevent_jj_billing_type[0].text : " "

                    var calculatedValue = getCalculatedValue(prjTaskId)
                    console.log("calculatedValue: ",calculatedValue)
                    totalFee = (calculatedValue && calculatedValue.length>0) ? Number(calculatedValue[0]).toFixed(2) : " "
                }

                var genericResource = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_generic_employee'
                })
                var manualRateCard = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_rate_card'
                })
                console.log("manualRateCard: ",manualRateCard)

                var checkboxValue = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_is_project_rate_card'
                })
                var autoRateCard = curRec.getValue({
                    fieldId: 'custpage_billing_rate_card'
                })
                console.log("autoRateCard 1.0: ",autoRateCard)

                var autoRateCardId = curRec.getValue({
                    fieldId: 'custpage_billing_rate_card_id'
                })
                console.log("autoRateCardId 1.0: ",autoRateCardId)

                var plannedHours = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_planned_hours'
                })
                var rate = curRec.getCurrentSublistValue({ //unit price
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_rate'
                })

                var autoUnitPrice = []

                var genericEmpList,genericEmployeeList;

                if (scriptContext.fieldId == 'custpage_project_task') {

                    if (checkForParameter(estimatedFee) == true) {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_estimated_fee',
                            value: estimatedFee ? Number(estimatedFee).toFixed(2) : Number(0).toFixed(2)
                        })
                    }
                    else {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_estimated_fee',
                            value: ''
                        })
                    }
                    if(checkForParameter(totalFee)==true){
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_total_fee',
                            value: totalFee ? Number(totalFee).toFixed(2) : Number(0).toFixed(2)
                        })
                    }
                    else {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_total_fee',
                            value: ''
                        })
                    }
                    if (checkForParameter(billingType) == true) {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_billing_type',
                            value: billingType ? billingType : " "
                        })
                    }
                    else {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_billing_type',
                            value: ''
                        })
                    }

                    if (checkForParameter(prjTaskId) == false) {

                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_estimated_fee',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_total_fee',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_billing_type',
                            value: ''
                        })
                    }
                }

                var genericBillingClass, genericBillingClassId,filteredGenericEmployee,genericCost;
                if (scriptContext.fieldId == 'custpage_generic_employee') {
                    genericEmpList = curRec.getValue({
                        fieldId: 'custpage_generic_employee_list'
                    })
                    genericEmployeeList = JSON.parse(genericEmpList)
                    console.log("genericEmpList: ",genericEmpList)
                    console.log("type: ",typeof genericEmpList)

                    console.log("genericEmployeeList: ",genericEmployeeList)
                    console.log("type 2 :", typeof genericEmployeeList)
                    if (checkForParameter(genericResource) == true) {
                        if(checkForParameter(genericEmployeeList)==true && genericEmployeeList.length>0){
                            filteredGenericEmployee = genericEmployeeList.filter(res => res.genericId == genericResource);
                            console.log("filteredGenericEmployee: ",filteredGenericEmployee)
                            genericCost = (filteredGenericEmployee && filteredGenericEmployee.length > 0) ? filteredGenericEmployee[0].genericLaborCost : Number(0)
                            genericBillingClass = (filteredGenericEmployee && filteredGenericEmployee.length > 0) ? filteredGenericEmployee[0].genericBillingClassName : " "
                            genericBillingClassId = (filteredGenericEmployee && filteredGenericEmployee.length > 0) ? filteredGenericEmployee[0].genericBillingClass : " "
                        }
                        console.log("genericBillingClassId: ",genericBillingClassId)
                        console.log("genericBillingClass: ",genericBillingClass)
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_generic_cost',
                            value: genericCost ? genericCost : ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_generic_billingclass',
                            value: genericBillingClass ? genericBillingClass : ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_generic_billingclassid',
                            value: genericBillingClassId ? genericBillingClassId : ''
                        })
                    }
                    else {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_generic_billingclass',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_generic_billingclassid',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_is_vendor',
                            value: false
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_rate_card',
                            value: ' '
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_is_project_rate_card',
                            value: false
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_project_task_rate_card',
                            value: ' '
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_planned_hours',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_rate',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_value',
                            value: ''
                        })
                    }
                }

                if (scriptContext.fieldId == 'custpage_planned_hours' || scriptContext.fieldId == 'custpage_rate') {

                    if (checkForParameter(plannedHours) == true && checkForParameter(rate) == true) {
                        var total = Number(plannedHours) * Number(rate)
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_value',
                            value: Number(total).toFixed(2)
                        })
                        return true
                    }
                    else {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_value',
                            value: ''
                        })
                        return false
                    }
                }

                if (scriptContext.fieldId == 'custpage_is_project_rate_card') {
                    if (checkForParameter(manualRateCard) == true) {
                        if (checkboxValue == true) {
                            curRec.setCurrentSublistValue({
                                sublistId: 'custpage_allocation_details',
                                fieldId: 'custpage_is_project_rate_card',
                                value: false
                            })
                            alert("You can't perform this operation Now. You have already selected the Rate card Manually")
                            return false
                        } else {
                            return true
                        }
                    }

                    if (checkForParameter(checkboxValue) == true && checkForParameter(prjTaskBillingRateCard) == true) {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_project_task_rate_card',
                            value: prjTaskBillingRateCard
                        })
                        var genericBillingClassID = curRec.getCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_generic_billingclassid'
                        })

                        console.log("genericBillingClassID: ",genericBillingClassID)
                        console.log("prjTaskBillingRateCardId: ",prjTaskBillingRateCardId)
                        console.log("prjCurrency: ",prjCurrency)

                        var objParam = {
                            genericBillingClass: genericBillingClassID,
                            rateCardId: prjTaskBillingRateCardId,
                            prjCurrency: prjCurrency
                        }
                        console.log("objParam: ",objParam)

                        var output = url.resolveScript({
                            scriptId: 'customscript_jj_sl_billingratecardfetch',
                            deploymentId: 'customdeploy_jj_sl_billingratecardfetch',
                            params: objParam
                        });
                        console.log("output: ",output)
                        var response = https.post({
                            url: output,
                            body: 'BillingRateCard Price Fetching Background Processing'
                        });
                        console.log("response: ",response)

                        var body = JSON.parse(response.body)
                        console.log("body: ",body)

                        var responseStatus = body.status;
                        console.log("responseStatus: ",responseStatus)

                        autoUnitPrice = body.message
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_rate',
                            value: (autoUnitPrice && autoUnitPrice.length > 0) && Number(autoUnitPrice[0].price).toFixed(2)
                        })
                    }
                     else if (checkForParameter(checkboxValue) == true && checkForParameter(prjTaskBillingRateCard) == false && checkForParameter(autoRateCard) == true) {
                        console.log("in ELSE IF")
                        console.log("autoRateCard: ",autoRateCard)
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_project_task_rate_card',
                            value: autoRateCard
                        })
                        var genericBillingClassID = curRec.getCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_generic_billingclassid'
                        })

                        console.log("genericBillingClassID: ",genericBillingClassID)
                        console.log("autoRateCardId: ",autoRateCardId)
                        console.log("prjCurrency: ",prjCurrency)

                        var objParam = {
                            genericBillingClass: genericBillingClassID,
                            rateCardId: autoRateCardId,
                            prjCurrency: prjCurrency
                        }
                        console.log("objParam: ",objParam)

                        var output = url.resolveScript({
                            scriptId: 'customscript_jj_sl_billingratecardfetch',
                            deploymentId: 'customdeploy_jj_sl_billingratecardfetch',
                            params: objParam
                        });
                        console.log("output: ",output)
                        var response = https.post({
                            url: output,
                            body: 'BillingRateCard Price Fetching Background Processing'
                        });
                        console.log("response: ",response)

                        var body = JSON.parse(response.body)
                        console.log("body: ",body)

                        var responseStatus = body.status;
                        console.log("responseStatus: ",responseStatus)

                        var autoUnitPrice = body.message
                        console.log("autoUnitPrice: ",autoUnitPrice)
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_rate',
                            value: (autoUnitPrice && autoUnitPrice.length > 0) && Number(autoUnitPrice[0].price).toFixed(2)
                        })

                    } else {
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_project_task_rate_card',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_rate',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_planned_hours',
                            value: ''
                        })
                        curRec.setCurrentSublistValue({
                            sublistId: 'custpage_allocation_details',
                            fieldId: 'custpage_value',
                            value: ''
                        })
                    }
                }
                if (scriptContext.fieldId == 'custpage_rate_card') {

                    if (checkboxValue == true) {
                        if (checkForParameter(manualRateCard) == true) {
                            curRec.setCurrentSublistValue({
                                sublistId: 'custpage_allocation_details',
                                fieldId: 'custpage_rate_card',
                                value: " "
                            })
                            alert("You can't perform this operation Now. You have already selected the Rate card Automatically")
                            return false
                        }
                    }
                    if (checkboxValue == false) {
                        if (checkForParameter(manualRateCard) == true) {
                            var genericBillingClassID = curRec.getCurrentSublistValue({
                                sublistId: 'custpage_allocation_details',
                                fieldId: 'custpage_generic_billingclassid'
                            })
                            console.log("genericBillingClassID: ",genericBillingClassID)
                            console.log("manualRateCard: ",manualRateCard)
                            console.log("prjCurrency: ",prjCurrency)

                            var objParam = {
                                genericBillingClass: genericBillingClassID,
                                rateCardId: manualRateCard,
                                prjCurrency: prjCurrency
                            }
                            console.log("objParam: ",objParam)

                            var output = url.resolveScript({
                                scriptId: 'customscript_jj_sl_billingratecardfetch',
                                deploymentId: 'customdeploy_jj_sl_billingratecardfetch',
                                params: objParam
                            });
                            console.log("output: ",output)
                            var response = https.post({
                                url: output,
                                body: 'BillingRateCard Price Fetching Background Processing'
                            });
                            console.log("response: ",response)

                            var body = JSON.parse(response.body)
                            console.log("body: ",body)

                            var responseStatus = body.status;
                            console.log("responseStatus: ",responseStatus)

                            var manualUnitPrice = body.message;
                            console.log("manualUnitPrice: ",manualUnitPrice)
                            curRec.setCurrentSublistValue({
                                sublistId: 'custpage_allocation_details',
                                fieldId: 'custpage_rate',
                                value: (manualUnitPrice && manualUnitPrice.length > 0) ? Number(manualUnitPrice[0].price).toFixed(2) : ''
                            })
                        }
                        if (checkForParameter(manualRateCard) == false) {
                            curRec.setCurrentSublistValue({
                                sublistId: 'custpage_allocation_details',
                                fieldId: 'custpage_rate',
                                value: ''
                            })
                            curRec.setCurrentSublistValue({
                                sublistId: 'custpage_allocation_details',
                                fieldId: 'custpage_planned_hours',
                                value: ''
                            })
                            curRec.setCurrentSublistValue({
                                sublistId: 'custpage_allocation_details',
                                fieldId: 'custpage_value',
                                value: ''
                            })
                        }
                    }
                }
            }
            if(checkForParameter(prjId)==false) {
                oldUrl = oldUrl.split('&deploy=' + 1);
                var newUrl = oldUrl[0] + "&deploy=1";
                window.location.href = newUrl;
                return true
            }
        }
        catch (e) {
            console.log("Error @ Field Changed: ",e.name+" : "+e.message)
        }
    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext){
        try{
            if(scriptContext.sublistId == 'custpage_allocation_details') {
                var curRec = scriptContext.currentRecord
                var prjTaskId = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_project_task'
                })
                var genericResource = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_generic_employee'
                })
                var plannedHrs = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_planned_hours'
                })
                var rate = curRec.getCurrentSublistValue({ //unit price
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_rate'
                })
                var price = curRec.getCurrentSublistValue({
                    sublistId: 'custpage_allocation_details',
                    fieldId: 'custpage_value'
                })
                if(checkForParameter(prjTaskId)==false&&checkForParameter(genericResource)==false&&checkForParameter(plannedHrs)==false&&checkForParameter(rate)==false){
                    alert("Please enter values for Project Task, Generic Employee, Planned Hours, Unit Price")
                    return false
                }
                if(checkForParameter(rate)==true) {
                    if (Number(rate) <= 0) {
                        alert("Unit Price should be greater than Zero")
                        return false
                    }
                }
                else {
                    alert("Unit Price should not be Empty")
                    return false
                }
                if(checkForParameter(plannedHrs)==true) {
                    if (Number(plannedHrs) <= 0) {
                        alert("Planned Hours should be greater than Zero")
                        return false
                    }
                }
                else {
                    alert("Planned Hours should not be Empty")
                    return false
                }
                if(checkForParameter(rate)==false || checkForParameter(plannedHrs)==false){
                    alert("Planned Hours and Unit Price should have a value")
                    return false
                }
                if(checkForParameter(price)==false || Number(price)<0){
                    alert("Price should have a value. Values for Unit Price should be a Non Zero or Positive number")
                    return false
                }
                else {
                    return true
                }
            }
        }
        catch (e) {
            console.log("Error @ Validate Line: ",e.name+" : "+e.message)
        }
    }

    // /**
    //  * Validation function to be executed when record is saved.
    //  *
    //  * @param {Object} scriptContext
    //  * @param {Record} scriptContext.currentRecord - Current form record
    //  * @returns {boolean} Return true if record is valid
    //  *
    //  * @since 2015.2
    //  */
/**
    * Validation function to be executed when record is saved.
    *
 */
    function addRec() {
        try{
            // jQuery("#custpage_load_img").css("display", "block");
            console.log("clicked")
            var count = currentRec.getLineCount({
                sublistId: 'custpage_allocation_details'
            })
            console.log("CNT: ",count)
            if(count<=0){
                alert("Please provide Allocation Details")
                return false
            }
            else {
                var promise = new Promise(function (resolve, reject) {
                    jQuery("#custpage_load_img").css("display", "block");
                    setTimeout(function () {
                        var projectId = project
                        var projectSubsidiary = projectSub

                        console.log("projectId: ", projectId)
                        console.log("projectSubsidiary: ", projectSubsidiary)

                        var taskListArray = currentRec.getValue({
                            fieldId: 'custpage_task_list'
                        })
                        console.log("taskListArray: ", taskListArray)
                        var parsed = JSON.parse(taskListArray)
                        console.log("parsed: ", parsed)
                        var filtered = []
                        var taskArr = []
                        if (count > 0) {

                            for (var i = 0; i < count; i++) {
                                var taskId = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_project_task',
                                    line: i
                                })
                                var taskName = currentRec.getSublistText({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_project_task',
                                    line: i
                                })
                                var genericEmp = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_generic_employee',
                                    line: i
                                })
                                var genericCost = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_generic_cost',
                                    line: i
                                })
                                var plannedHrs = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_planned_hours',
                                    line: i
                                })
                                var unitPrice = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_rate',
                                    line: i
                                })
                                var billingClass = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_generic_billingclassid',
                                    line: i
                                })
                                var isVendor = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_is_vendor',
                                    line: i
                                })
                                var estimatedFee = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_estimated_fee',
                                    line: i
                                })
                                console.log("estimatedFee: ", Number(estimatedFee))
                                var totalFee = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_total_fee',
                                    line: i
                                })
                                var price = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_value',
                                    line: i
                                })
                                var billingType = currentRec.getSublistValue({
                                    sublistId: 'custpage_allocation_details',
                                    fieldId: 'custpage_billing_type',
                                    line: i
                                })
                                if(checkForParameter(taskId)==false){
                                    alert("Please Provide value for Project Task")
                                    return false
                                }
                                taskArr.push({
                                    taskId: taskId,
                                    taskName: taskName,
                                    billingType: billingType,
                                    genericEmp: genericEmp,
                                    genericCost: genericCost,
                                    plannedHrs: plannedHrs,
                                    estimatedFee: estimatedFee,
                                    totalFee: totalFee,
                                    unitPrice: unitPrice,
                                    billingClass: billingClass,
                                    isVendor: isVendor,
                                    price: price
                                })
                            }

                            for (var j = 0; j < parsed.length; j++) {
                                var totalUnitPrice = Number(0)
                                var filteredTaskArr = taskArr.filter(res => res.taskId == parsed[j])
                                console.log("filteredTaskArr: ", filteredTaskArr)
                                if (filteredTaskArr.length > 0) {
                                    for (var a = 0; a < filteredTaskArr.length; a++) {
                                        totalUnitPrice += Number(filteredTaskArr[a].price)
                                    }
                                    filtered.push({
                                        taskId: parsed[j],
                                        taskName: filteredTaskArr[0].taskName,
                                        estimatedFee: Number(filteredTaskArr[0].estimatedFee),
                                        billingType: filteredTaskArr[0].billingType,
                                        totalUnitPrice: Number(totalUnitPrice) + Number(filteredTaskArr[0].totalFee)
                                    })
                                }
                            }
                        }
                        console.log("filtered: ", filtered)
                        console.log("taskArr: ", JSON.stringify(taskArr))
                        var flag = 0 // Variable to check whether any project task has a Total price which exceeds it's estimated fee
                        var flagTaskArray = []
                        var flagTaskNameArray = []
                        for (var l = 0; l < filtered.length; l++) {
                            console.log("EACH: ", filtered[l])
                            if(filtered[l].billingType == 'Lump Sum') {
                                console.log("LUMP SUM")
                                if (checkForParameter(filtered[l].estimatedFee) == true) {
                                    console.log("Estimated Fee")
                                    if (filtered[l].estimatedFee < filtered[l].totalUnitPrice) {
                                        console.log("Conditioned")
                                        flag += 1
                                        flagTaskArray.push(filtered[l].taskId)
                                        flagTaskNameArray.push(filtered[l].taskName)
                                    }
                                }
                            }
                            else{
                                console.log("ELSE: ",flag)
                            }
                        }
                        console.log("flag: ", flag)
                        console.log("flagTaskNameArray: ",flagTaskNameArray)
                        if (flag > 0 && flagTaskNameArray.length>0) {
                            jQuery("#custpage_load_img").css("display", "none");
                            alert("Sum of Total Fee and Price of the task "+'\n' + flagTaskNameArray +'\n'+ " is greater than it's Estimated Fee")
                            return false
                        }
                        else {
                            var strTaskArr = JSON.stringify(taskArr)

                            var objParam = {
                                projectId: projectId,
                                projectSubsidiary: projectSubsidiary,
                                taskArr: strTaskArr
                            }
                            console.log("objParam: ", objParam)

                            var output = url.resolveScript({
                                scriptId: 'customscript_jj_sl_suitelet_for_msg_aq',
                                deploymentId: 'customdeploy_jj_sl_suitelet_for_msg_aq',
                                params: objParam
                            });
                            console.log("output: ", output)

                            var response = https.post({
                                url: output,
                                body: 'Background Processing'
                            });
                            console.log("response: ", response)

                            var body = JSON.parse(response.body)
                            console.log("body: ", body)

                            var responseStatus = body.status;
                            console.log("responseStatus: ", responseStatus)

                            if (responseStatus == "SUCCESS") {
                                jQuery("#custpage_load_img").css("display", "none");
                                resolve();
                                // var redirectUrl = 'https://3689903-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=788&deploy=1'//SB URL
                                var redirectUrl = 'https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=812&deploy=1&compid=3689903&whence=' // Production URL
                                window.location.href = redirectUrl
                                return true

                            } else {
                                jQuery("#custpage_load_img").css("display", "none");
                                reject();
                                var msg = message.create({
                                    title: "Error Occurred",
                                    message: "An Error Occurred during the Process. Allocation Failed",
                                    type: message.Type.ERROR,
                                    duration: 10000
                                })
                                msg.show()
                                return false

                            }
                        }

                    }, 5000)
                });
                console.log("promise: ", promise)
            }
        }
        catch (e) {
            console.log("ERROR @ addRec: ",e.name+" : "+e.message)
        }
    }

    return {
        fieldChanged: fieldChanged,
        validateLine: validateLine,
        addRec: addRec
    };

});
