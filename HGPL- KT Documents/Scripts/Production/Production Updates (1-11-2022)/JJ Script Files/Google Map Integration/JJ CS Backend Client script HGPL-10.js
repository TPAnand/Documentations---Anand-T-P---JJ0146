/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url','N/currentRecord','N/https'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{url} url
     */
    function(record, search, url,currentRecord,https) {
        // var headerLink = 'https://6687177-sb1.app.netsuite.com'; // SB
        var headerLink = 'https://6687177.app.netsuite.com';//Production

        // const homeURL =  'https://6687177-sb1.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=1206';

        function checkForParameter(parameter, parameterName) {
            if (parameter != "" && parameter != null && parameter != undefined && parameter != "null" && parameter != "undefined" && parameter != " ") {
                return false;
            } else {
                if (parameterName)
                    console.log('Empty Value found', 'Empty Value for parameter ' + parameterName);
                return true;
            }
        }

        function taskSearch(assignedId,companyId){
            try {
                console.log("assignedId: ",assignedId)
                console.log("companyId: ",companyId)
                if ((assignedId && assignedId!=0) && (companyId&&companyId!=0)) {
                    var taskSearchObj = search.create({
                        type: "task",
                        filters:
                            [
                                ["status", "anyof", "NOTSTART"],
                                "AND",
                                ["assigned", "anyof", assignedId],
                                "AND",
                                ["company", "anyof", companyId]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "internalid",
                                    sort: search.Sort.ASC,
                                    label: "Internal ID"
                                }),
                                search.createColumn({name: "title", label: "Task Title"}),
                                search.createColumn({name: "priority", label: "Priority"}),
                                search.createColumn({name: "status", label: "Status"}),
                                search.createColumn({name: "startdate", label: "Start Date"}),
                                search.createColumn({name: "duedate", label: "Due Date"}),
                                search.createColumn({name: "assigned", label: "Assigned To"}),
                                search.createColumn({name: "company", label: "Company"}),
                                search.createColumn({name: "accesslevel", label: "Private"})
                            ]
                    });
                    console.log("BEFORE SEARCH COUNT")
                    var searchResultCount = taskSearchObj.runPaged().count;
                    console.log("taskSearchObj result count",searchResultCount);

                    if(searchResultCount>0) {
                        return searchResultCount;
                    }

                }
            }
            catch (e) {
                console.log("Error @ taskSearch: ",e.name+" : "+e.message)
            }
        }

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *@since 2015.2
         */
        function pageInit(scriptContext) {
            if (window.onbeforeunload) {
                window.onbeforeunload = function() {
                    null;
                };
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

                //assigned to
                if(scriptContext.fieldId=='assigned_to'){
                    console.log("inn of assigned to")
                    var assignedTo = scriptContext.currentRecord.getValue({
                        fieldId:'assigned_to'
                    })
                    //get the all lines in sublist
                    var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                    for(var i=0;i<lineCount;i++) {
                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_assigned_to',
                            value:assignedTo,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });
                    }
                    return true;

                }
                //title
                // if(scriptContext.fieldId=='title'){
                //
                //     var title = scriptContext.currentRecord.getValue({
                //         fieldId:'title'
                //     })
                //     //get the all lines in sublist
                //
                //     var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                //     for(var i=0;i<lineCount;i++) {
                //         scriptContext.currentRecord.selectLine({
                //             sublistId: 'customer_details',
                //             line: i
                //         });
                //         scriptContext.currentRecord.setCurrentSublistValue({
                //             sublistId: 'customer_details',
                //             fieldId: 'custpage_title',
                //             value:title,
                //             line: i
                //         });
                //         scriptContext.currentRecord.commitLine({
                //             sublistId: 'customer_details'
                //         });
                //     }
                //
                //     return true;
                //
                // }

                //priority
                if(scriptContext.fieldId=='priority'){

                    var priority = scriptContext.currentRecord.getValue({
                        fieldId:'priority'
                    })
                    //get the all lines in sublist
                    var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                    for(var i=0;i<lineCount;i++) {

                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_priority',
                            value:priority,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });
                    }
                    return true;

                }
                //start date

                if(scriptContext.fieldId=='start_date'){

                    var startDate = scriptContext.currentRecord.getText({
                        fieldId:'start_date'
                    })
                    scriptContext.currentRecord.setText({
                        fieldId: 'end_date',
                        text: startDate
                    })
                    //get the all lines in sublist
                    var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                    for(var i=0;i<lineCount;i++) {


                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistText({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_startdate',
                            text:startDate,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });



                    }
                    return true;

                }

                //end date

                if(scriptContext.fieldId=='end_date'){
                    console.log("inside end date")
                    var startDate = scriptContext.currentRecord.getValue({
                        fieldId:'start_date'
                    })
                    console.log("Start Date: ",startDate)
                    var endDate = scriptContext.currentRecord.getValue({
                        fieldId:'end_date'
                    })
                    console.log("End Date: ",endDate)
                    var sDate = new Date(startDate).getTime();
                    var dDate = new Date(endDate).getTime();

                    console.log("sDate: ",sDate);
                    console.log("dDate: ",dDate)
                    if(sDate>dDate){
                        alert("Due date should be greater than start date")
                        return false;
                    }
                    if(startDate == '' || startDate == null || startDate == undefined || startDate == NaN){
                        alert("Please Enter Start date first")
                        return false;
                    }



                    //get the all lines in sublist
                    var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                    for(var i=0;i<lineCount;i++) {


                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_enddate',
                            value:endDate,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });
                    }
                    return true;

                }

                //Task Type
                if(scriptContext.fieldId == 'custpage_task_type'){
                    var taskType = scriptContext.currentRecord.getValue({fieldId: 'custpage_task_type'})
                    if(!checkForParameter(taskType)){
                        var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                        for(var i=0;i<lineCount;i++) {
                            scriptContext.currentRecord.selectLine({
                                sublistId: 'customer_details',
                                line: i
                            });
                            scriptContext.currentRecord.setCurrentSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_task_type_sublist',
                                value:taskType,
                                line: i
                            });
                            scriptContext.currentRecord.commitLine({
                                sublistId: 'customer_details'
                            });
                        }
                    }
                }

                //Reserve time

                if(scriptContext.fieldId=='reserve_time'){

                    var reserveTime = scriptContext.currentRecord.getValue({
                        fieldId:'reserve_time'
                    });
                    if(reserveTime==true || reserveTime=='T' || reserveTime =='true'){

                        var selectedStartDate = scriptContext.currentRecord.getField({fieldId: 'timepicker'})
                        selectedStartDate.isDisabled = false;

                        var selectedEndDate = scriptContext.currentRecord.getField({fieldId: 'timepicker2'})
                        selectedEndDate.isDisabled = false;
                        var start_timeFld = scriptContext.currentRecord.getField({
                            fieldId: 'start_time'
                        });
                        start_timeFld.isDisabled = false;
                        var end_timeFld = scriptContext.currentRecord.getField({
                            fieldId: 'end_time'
                        });
                        end_timeFld.isDisabled = false;
                    }
                    if(reserveTime==false || reserveTime=='F'){

                        var selectedStartDate = scriptContext.currentRecord.getField({fieldId: 'timepicker'})
                        selectedStartDate.isDisabled = true;

                        var selectedEndDate = scriptContext.currentRecord.getField({fieldId: 'timepicker2'})
                        selectedEndDate.isDisabled = true;

                        var start_timeFld = scriptContext.currentRecord.getField({
                            fieldId: 'start_time'
                        });
                        start_timeFld.isDisabled = true;
                        var end_timeFld = scriptContext.currentRecord.getField({
                            fieldId: 'end_time'
                        });
                        end_timeFld.isDisabled = true;
                    }
                    //get the all lines in sublist
                    var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                    for(var i=0;i<lineCount;i++) {


                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_reserve_time',
                            value:reserveTime,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });

                    }
                    return true;

                }

                //start time picker
                if(scriptContext.fieldId=='timepicker'){
                    var selectedStart = scriptContext.currentRecord.getValue({
                        fieldId: 'timepicker'
                    })
                    console.log('selectedStart: ',selectedStart)
                    scriptContext.currentRecord.setValue({ fieldId: 'start_time',value: selectedStart})

                    var lineCount = scriptContext.currentRecord.getLineCount({sublistId: 'customer_details'})
                    for(var i=0;i<lineCount;i++) {
                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'timepicker_sublist',
                            value:selectedStart,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });
                    }

                    return true
                    // if(checkForParameter(selectedStart)){
                    //
                    // }
                }

                //Start time

                if(scriptContext.fieldId=='start_time'){

                    var startTime = scriptContext.currentRecord.getValue({
                        fieldId:'start_time'
                    })
                    //get the all lines in sublist
                    var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                    for(var i=0;i<lineCount;i++) {


                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_start_time',
                            value:startTime,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });



                    }
                    return true;

                }

                //end time picker
                if(scriptContext.fieldId=='timepicker2'){
                    var selectedEnd = scriptContext.currentRecord.getValue({
                        fieldId: 'timepicker2'
                    })
                    console.log('selectedEnd: ',selectedEnd)
                    scriptContext.currentRecord.setValue({ fieldId: 'end_time',value: selectedEnd})


                    var lineCount = scriptContext.currentRecord.getLineCount({sublistId: 'customer_details'})
                    for(var i=0;i<lineCount;i++) {
                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'timepicker2_sublist',
                            value:selectedEnd,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });
                    }

                    return true
                    // if(checkForParameter(selectedStart)){
                    //
                    // }
                }

                //End time

                if(scriptContext.fieldId=='end_time'){

                    var endTime = scriptContext.currentRecord.getValue({
                        fieldId:'end_time'
                    })
                    //get the all lines in sublist
                    var lineCount =  scriptContext.currentRecord.getLineCount({ sublistId: "customer_details" });
                    for(var i=0;i<lineCount;i++) {


                        scriptContext.currentRecord.selectLine({
                            sublistId: 'customer_details',
                            line: i
                        });
                        scriptContext.currentRecord.setCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_end_time',
                            value:endTime,
                            line: i
                        });
                        scriptContext.currentRecord.commitLine({
                            sublistId: 'customer_details'
                        });



                    }
                    return true;

                }

                if(scriptContext.sublistId == 'customer_details'){
                    if(scriptContext.fieldId == 'custpage_customer_name'){
                        var custName = scriptContext.currentRecord.getCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_customer_name'
                        })
                        var assigned = scriptContext.currentRecord.getValue({
                            fieldId: 'assigned_to'
                        })
                        var priority = scriptContext.currentRecord.getValue({
                            fieldId: 'priority'
                        })
                        var startDate = scriptContext.currentRecord.getValue({
                            fieldId: 'start_date'
                        })
                        var endDate = scriptContext.currentRecord.getValue({
                            fieldId: 'end_date'
                        })
                        var isReserveTime = scriptContext.currentRecord.getValue({
                            fieldId: 'reserve_time'
                        })
                        var startTime = scriptContext.currentRecord.getValue({
                            fieldId: 'start_time'
                        })
                        var endTime = scriptContext.currentRecord.getValue({
                            fieldId: 'end_time'
                        })
                        console.log('assigned: ',assigned)
                        console.log('priority: ',priority)
                        console.log('startDate: ',startDate)
                        console.log('endDate: ',endDate)
                        console.log('isReserveTime: ',isReserveTime)
                        console.log('startTime: ',startTime)
                        console.log('endTime: ',endTime)
                        console.log("custName GHJ: ",custName)
                        if(!checkForParameter(assigned)){
                            scriptContext.currentRecord.setCurrentSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_assigned_to',
                                value: assigned
                            })
                        }
                        if(!checkForParameter(priority)){
                            scriptContext.currentRecord.setCurrentSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_priority',
                                value: priority
                            })
                        }
                        if(!checkForParameter(custName)) {
                            var company = search.lookupFields({
                                type: record.Type.CUSTOMER,
                                id: custName,
                                columns: ['companyname']
                            })
                            console.log("company: ",company.companyname)
                            scriptContext.currentRecord.setCurrentSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_internalid',
                                value: custName
                            })
                            if(!checkForParameter(startDate)){
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'custpage_startdate',
                                    value: startDate
                                })
                            }
                            if(!checkForParameter(endDate)){
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'custpage_enddate',
                                    value: endDate
                                })
                            }
                            if(isReserveTime){
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'custpage_reserve_time',
                                    value: isReserveTime
                                })
                            }
                            if(!checkForParameter(startTime)){
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'timepicker_sublist',
                                    value: startTime
                                })
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'custpage_start_time',
                                    value: startTime
                                })
                            }
                            if(!checkForParameter(endTime)){
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'custpage_end_time',
                                    value: endTime
                                })
                            }
                            if(!checkForParameter(company)&&!checkForParameter(company.companyname)){
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'custpage_title',
                                    value: company.companyname
                                })
                            }
                        }
                    }
                }


                else{
                    return true;
                }



            }catch (e) {
                console.log("Err@fld changed",e)

            }

        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }

        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {

        }

        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {

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
        function validateLine(scriptContext) {
            try{
                var curentRec = scriptContext.currentRecord;
                if(scriptContext.sublistId == 'customer_details'){
                    const lineCount = curentRec.getLineCount({sublistId: "customer_details"});

                    if(lineCount>0) {

                        var isSelectedToCreateTask = curentRec.getCurrentSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_is_selected'
                        });
                        if (isSelectedToCreateTask) {
                            var internalID = curentRec.getCurrentSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_internalid'
                            });

                            var assignedTo = curentRec.getCurrentSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_assigned_to'
                            });

                            var title = curentRec.getCurrentSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_title'
                            });

                            var taskSearchResult = taskSearch(assignedTo, internalID)
                            console.log("taskSearchResult: ", taskSearchResult)

                            if (taskSearchResult > 0) {
                                alert("There is already " + taskSearchResult + " Open task(s) for " + title+ "\n Please exclude the current line")
                                return false
                            } else {
                                return true
                            }
                        }
                    }
                }

            }
            catch (e) {
                console.log("Error @ validateLine: ",e.name+" : "+e.message)
            }
        }

        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {

        }

        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {

        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            try{
                var fileContentArray=[];
                var curentRec = scriptContext.currentRecord;
                var assignedTo =  curentRec.getValue({
                    fieldId:'assigned_to'
                });
                var currentUser =  curentRec.getValue({
                    fieldId:'currentuser'
                });
                // var title =  curentRec.getValue({
                //     fieldId:'title'
                // });

                var startDate =  curentRec.getText({
                    fieldId:'start_date'
                });
                console.log("START: ",startDate)
                var endDate =  curentRec.getText({
                    fieldId:'end_date'
                });
                var priority =  curentRec.getValue({
                    fieldId:'priority'
                });

                var sDate = new Date(startDate).getTime();
                var dDate = new Date(endDate).getTime();

                console.log("sDate: ",sDate);
                console.log("dDate: ",dDate)
                if(sDate>dDate){
                    alert("Due date should be a Date After Start Date")
                    return false;
                }

                if(startDate == NaN){
                    alert("Please Provide a Start Date")
                    return false;
                }


                if(checkForParameter(assignedTo)
                    // || checkForParameter(title)
                    || checkForParameter(startDate)
                    || checkForParameter(endDate)
                    || checkForParameter(priority)){
                    alert("Please select the Assigned To, Title, Start Date, End Date, Priority to create task")

                    return false;
                }
                else {
                    var duplicateTask = []
                    var duplicateLines = []

                    const lineCount = curentRec.getLineCount({sublistId: "customer_details"});


                    //get the details from the sublist
                    for (var i = 0; i < lineCount; i++) {

                        var customerObj = {};

                        var isSelectedToCreateTask = curentRec.getSublistValue({
                            sublistId: 'customer_details',
                            fieldId: 'custpage_is_selected',
                            line: i
                        });
                        console.log("isSelectedToCreateTask==>", isSelectedToCreateTask)

                        if (isSelectedToCreateTask) {
                            //internal id
                            customerObj.internalID = curentRec.getSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_internalid',
                                line: i
                            });
                            //customerName
                            customerObj.customerName = curentRec.getSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_customer_name',
                                line: i
                            });
                            //Title
                            customerObj.title = curentRec.getSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_title',
                                line: i
                            });
                            if(checkForParameter(customerObj.title)){
                                customerObj.title= title;
                            }
                            //assignedTo
                            customerObj.assignedTo = curentRec.getSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_assigned_to',
                                line: i
                            });
                            if(checkForParameter(customerObj.assignedTo)){
                                customerObj.assignedTo= assignedTo;
                            }
                            //priority
                            customerObj.priority = curentRec.getSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_priority',
                                line: i
                            });
                            if(checkForParameter(customerObj.priority)){
                                customerObj.priority= priority;
                            }
                            //startDate
                            customerObj.startDate = curentRec.getSublistText({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_startdate',
                                line: i
                            });
                            if(checkForParameter(customerObj.startDate)){
                                customerObj.startDate= startDate;
                            }
                            //endDate
                            customerObj.endDate = curentRec.getSublistText({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_enddate',
                                line: i
                            });
                            if(checkForParameter(customerObj.endDate)){
                                customerObj.endDate= endDate;
                            }

                            //taskType
                            customerObj.taskType = curentRec.getSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_task_type_sublist',
                                line: i
                            })

                            //reserved time
                            customerObj.isReservedTime = curentRec.getSublistValue({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_reserve_time',
                                line: i
                            });
                            //start time
                            customerObj.startTime = curentRec.getSublistText({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_start_time',
                                line: i
                            });
                            //end time
                            customerObj.endTime = curentRec.getSublistText({
                                sublistId: 'customer_details',
                                fieldId: 'custpage_end_time',
                                line: i
                            });

                            var taskSearchResult = taskSearch(customerObj.assignedTo,customerObj.internalID)
                            console.log("taskSearchResult: ",taskSearchResult)
                            if(taskSearchResult>0) {
                                duplicateTask.push(customerObj.title);
                                duplicateLines.push(Number(i)+Number(1))
                            }
                            else {
                                fileContentArray.push(customerObj);
                            }
                        }
                    }
                    console.log("fileContentArray", fileContentArray);

                    if(duplicateTask.length>0 && duplicateLines.length>0){
                        if(duplicateTask.length == duplicateLines.length){
                            var msg = 'Open tasks existing for the task(s) \n';
                            for(var k=0;k<duplicateTask.length;k++){
                                msg +=(Number(k)+Number(1))+'. '+duplicateTask[k]+" at line Number "+duplicateLines[k]+"\n"
                            }
                            msg += " Task won't be created for these tasks"
                            alert(msg)
                            console.log('duplicateLines.length: ',duplicateLines.length)
                            for(var j=0;j<duplicateLines.length;j++){
                                scriptContext.currentRecord.selectLine({
                                    sublistId: 'customer_details',
                                    line: Number(duplicateLines[j])-Number(1)
                                })
                                scriptContext.currentRecord.setCurrentSublistValue({
                                    sublistId: 'customer_details',
                                    fieldId: 'custpage_is_selected',
                                    value: false,
                                    line: Number(duplicateLines[j])-Number(1)
                                })
                                scriptContext.currentRecord.commitLine({
                                    sublistId: 'customer_details',
                                    line: Number(duplicateLines[j])-Number(1)
                                })
                            }
                            console.log("fileContentArray: ",fileContentArray)
                            if (fileContentArray.length > 0) {
                                //creating record
                                var customRecord = record.create({
                                    type: 'customrecord_jj_task_records_hgpl_13'
                                });
                                customRecord.setText({
                                    fieldId: 'custrecord_created_by',
                                    text: currentUser
                                })
                                customRecord.setValue({
                                    fieldId: 'custrecord_jj_data_to_prcss',
                                    value: JSON.stringify(fileContentArray)
                                })
                                customRecord.setValue({
                                    fieldId: 'custrecord_status_of_task',
                                    value: 1
                                });
                                try {
                                    var custID = customRecord.save({
                                        ignoreMandatoryFields: true
                                    });
                                } catch (e) {
                                    console.log("e at save", e.name + " : " + e.message)
                                    log.debug("e at save", e.name + " : " + e.message)
                                }
                                var URL = url.resolveScript({
                                    scriptId: 'customscript_jj_sl_create_task_hgpl13',
                                    deploymentId: 'customdeploy_jj_sl_create_task_hgpl13',
                                    params: {
                                        'mode': 'page4',
                                        'custID': custID
                                    }
                                });
                                var response = https.get({
                                    url: URL
                                });
                                alert("Your tasks will be created in the background. Please check the task list");
                                var customRecURL = url.resolveRecord({
                                    recordType: 'customrecord_jj_task_records_hgpl_13',
                                    recordId: custID,
                                    isEditMode: false
                                })
                                window.location.href = customRecURL;
                            }
                        }
                    }
                    else {
                        if (fileContentArray.length > 0) {
                            //creating record
                            var customRecord = record.create({
                                type: 'customrecord_jj_task_records_hgpl_13'
                            });
                            customRecord.setText({
                                fieldId: 'custrecord_created_by',
                                text: currentUser
                            })
                            customRecord.setValue({
                                fieldId: 'custrecord_jj_data_to_prcss',
                                value: JSON.stringify(fileContentArray)
                            })
                            customRecord.setValue({
                                fieldId: 'custrecord_status_of_task',
                                value: 1
                            });
                            try {
                                var custID = customRecord.save({
                                    ignoreMandatoryFields: true
                                });
                            } catch (e) {
                                console.log("e at save", e.name + " : " + e.message)
                                log.debug("e at save", e.name + " : " + e.message)
                            }
                            var URL = url.resolveScript({
                                scriptId: 'customscript_jj_sl_create_task_hgpl13',
                                deploymentId: 'customdeploy_jj_sl_create_task_hgpl13',
                                params: {
                                    'mode': 'page4',
                                    'custID': custID
                                }
                            });
                            var response = https.get({
                                url: URL
                            });
                            alert("Your tasks will be created in the background. Please check the task list");
                            var customRecURL = url.resolveRecord({
                                recordType: 'customrecord_jj_task_records_hgpl_13',
                                recordId: custID,
                                isEditMode: false
                            })
                            window.location.href = customRecURL;
                        } else {
                            alert("You have to select atleast one customer entry to create task")
                            return false;
                        }
                    }
                }
            }catch (e) {
                console.log("Err@save ",e.name+" : "+e.message)
                log.debug("Err@save ",e.name+" : "+e.message)
            }

        }

        /***
         *
         */
        function nextToCustomerList(){
            try{
                //get the lat- long parameter
                var curRecord =  currentRecord.get();
                console.log("curRecord: ",curRecord)

                //
                var rectangleOptions = curRecord.getValue({
                    fieldId:'rectangle_cordinates'
                });
                console.log("rectangleOptions: ",rectangleOptions)
                var savedSearch = curRecord.getValue({
                    fieldId:'savedsearchfield'
                });
                console.log("savedSearch: ",savedSearch)
                var customerCategory = curRecord.getValue({
                    fieldId:'categoryfield'

                });
                console.log("customerCategory: ",customerCategory)
                var customerGrade = curRecord.getValue({
                    fieldId: 'cgradefield'
                })
                console.log("customerGrade: ",customerGrade)
                var trainingGrade = curRecord.getValue({
                    fieldId: 'tgradefield'
                })
                console.log("trainingGrade: ",trainingGrade)
                var salesRep = curRecord.getValue({
                    fieldId:'salesrepfield'
                });
                console.log("salesRep: ",salesRep)

                if(rectangleOptions){

                    var goTOsuiteletPageURL = url.resolveScript({
                        scriptId:'customscript_jj_sl_create_task_hgpl13',
                        deploymentId:'customdeploy_jj_sl_create_task_hgpl13',
                        params:{
                            'savedSearch':savedSearch,
                            'customerCategory':customerCategory,
                            'salesRep':salesRep,
                            'trainingGrade': trainingGrade,
                            'customerGrade':customerGrade,
                            'rectangleOptions':rectangleOptions
                        }
                    });


                    window.location.href = headerLink+goTOsuiteletPageURL

                }else{
                    alert("Please choose the customers to create task by drawing the rectangle. The rectangle can be drawn on the map only once")
                }


            }catch (e) {
                console.log("Err@nextToCustomerList",e)

            }

        }

        /***
         *
         */
        function showOnMapFunction() {
            try {
                var currentRec =  currentRecord.get();

                //saved search id
                var savedSearch =  currentRec.getValue({
                    fieldId:'searchfield'
                });
                // customer category
                var customercategory  = currentRec.getValue({
                    fieldId:'customercategory'
                });

                //sales rep
                var salesRep = currentRec.getValue({
                    fieldId:'salesrepfield'
                });

                //customer Grade
                var customerGrade = currentRec.getValue({
                    fieldId: 'customergrade'
                })

                //training Grade
                var trainingGrade = currentRec.getValue({
                    fieldId: 'traininggrade'
                })
                console.log(checkForParameter(savedSearch))
                console.log(checkForParameter(customercategory))
                console.log("salesRep: ",salesRep)
                console.log("customerGrade: ",customerGrade)
                console.log("trainingGrade: ",trainingGrade)

                /* if(!checkForParameter(savedSearch) || !checkForParameter(customercategory) || !checkForParameter(salesRep)){
                     alert("Please select atleast one filter to select the customers...")

                 }*/
                if((savedSearch && savedSearch!=0) || (customercategory!=0 && customercategory) || (salesRep && salesRep!=0) || (customerGrade && customerGrade!=0) || (trainingGrade && trainingGrade!=0)){
                    var goTOsuiteletPageURL = url.resolveScript({
                        scriptId:'customscript_jj_sl_filter_custome_hgpl10',
                        deploymentId:'customdeploy_jj_sl_filter_custome_hgpl10',
                        params:{
                            'savedSearch':savedSearch,
                            'customercategory':customercategory,
                            'customerGrade': customerGrade,
                            'trainingGrade':trainingGrade,
                            'mode':'page2',
                            'salesRep':salesRep
                        }
                    });

                    console.log("goTOsuiteletPageURL==>",goTOsuiteletPageURL)
                    window.location.href = headerLink+goTOsuiteletPageURL;

                }else{
                    alert("Please select atleast one filter to select the customers")

                }







            }catch (e) {
                console.log("Err@showOnMapFunction",e)
            }

        }
        /***
         *
         */
        function markAllFunction(){
            try {
                var curRec=  currentRecord.get();

                var lineCount =  curRec.getLineCount({ sublistId: "customer_details" });
                for(var i=0;i<lineCount;i++) {
                    curRec.selectLine({
                        sublistId: 'customer_details',
                        line: i
                    });
                    curRec.setCurrentSublistValue({
                        sublistId: 'customer_details',
                        fieldId: 'custpage_is_selected',
                        value: true,
                        line: i
                    });
                    curRec.commitLine({
                        sublistId: 'customer_details'
                    });
                }

            }catch (e) {
                console.log("Err@markAllFunction",e)
            }
        }

        /***
         *
         */

        function unmarkAllFunction(){
            try {
                var curRec=  currentRecord.get();

                var lineCount =  curRec.getLineCount({ sublistId: "customer_details" });
                for(var i=0;i<lineCount;i++) {
                    curRec.selectLine({
                        sublistId: 'customer_details',
                        line: i
                    });
                    curRec.setCurrentSublistValue({
                        sublistId: 'customer_details',
                        fieldId: 'custpage_is_selected',
                        value: false,
                        line: i
                    });
                    curRec.commitLine({
                        sublistId: 'customer_details'
                    });
                }

            }catch (e) {
                console.log("Err@unmarkAllFunction",e)
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            // validateLine: validateLine,
            /* postSourcing: postSourcing,
             sublistChanged: sublistChanged,
             lineInit: lineInit,
             validateField: validateField,
             validateLine: validateLine,
             validateInsert: validateInsert,
             validateDelete: validateDelete,*/
            saveRecord: saveRecord,
            nextToCustomerList:nextToCustomerList,
            showOnMapFunction:showOnMapFunction,
            markAllFunction:markAllFunction,
            unmarkAllFunction:unmarkAllFunction
        };

    });
