/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/runtime', 'N/search', 'N/task', 'N/ui/serverWidget','N/file'],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{task} task
     * @param{serverWidget} serverWidget
     */
    (record, runtime, search, task, serverWidget,file) => {

        // var homeURL =  'https://6687177-sb1.app.netsuite.com/app/center/card.nl?sc=-29&whence=';// SB URL
        var homeURL =  'https://6687177.app.netsuite.com/app/center/card.nl?sc=-29&whence=';// Production URL

        // var CLIENT_SCRIPT_ID = 4512; // Sandbox file ID
        var CLIENT_SCRIPT_ID = 68791; // Production File ID

        /***
         * Setting the customer data to the sublist
         * @param CustomerDetails
         */
        const setSublistValuesFromCustomerDetails = (CustomerDetails,sublistForCustomers) => {
            try{

                log.debug("---: ",CustomerDetails)

                for(var i=0;i<CustomerDetails.length; i++){

                    // internal ID
                    sublistForCustomers.setSublistValue({
                        id:'custpage_internalid',
                        line:i,
                        value:CustomerDetails[i]['internalID']
                    })
                    // customer Name
                    sublistForCustomers.setSublistValue({
                        id:'custpage_customer_name',
                        line:i,
                        value:CustomerDetails[i]['internalID']
                    })
                    sublistForCustomers.setSublistValue({
                        id:'custpage_title',
                        line:i,
                        value:CustomerDetails[i]['companyname']
                    })


                }




            }catch (e) {
                log.debug("Err@setSublistValuesFromCustomerDetails",e);
                log.error("Err@setSublistValuesFromCustomerDetails",e);

            }

        }

        /***
         * fetches the customer data
         * @param parameters
         */

        const getCustomerData = (parameters) => {
            try{
                log.debug("parameters: ",parameters)
                var  customerArray=[];
                var rectangleOptions = parameters.rectangleOptions;
                var salesRep =parameters.salesRep;
                var customerGrade = parameters.customerGrade;
                var trainingGrade = parameters.trainingGrade;
                var savedSearch =  parameters.savedSearch;
                var category =  parameters.customerCategory;


                log.debug("rectangleOptions: ",rectangleOptions)
                log.debug("salesRep: ",salesRep)
                log.debug("savedSearch: ",savedSearch)
                log.debug("category: ",category)
                log.debug("customerGrade: ",customerGrade)
                log.debug("trainingGrade: ",trainingGrade)


                var filterArray = [], rectangleOptionArray = rectangleOptions.split('|');

                filterArray.push(["isinactive","is","F"]);

                if(salesRep && salesRep!=0){
                    filterArray.push("AND");
                    filterArray.push( ["salesrep","anyof",salesRep]);
                }

                if(category && category!=0){
                    if(filterArray.length>0){
                        filterArray.push("AND");
                    }
                    filterArray.push( ["category","anyof",category]);
                }
                if(customerGrade && customerGrade!=0){
                    if(filterArray.length>0){
                        filterArray.push("AND");
                    }
                    // filterArray.push(["custrecord_jj_cust_plngrm_parent.custrecord_jj_customer_grades", "anyof",customerGrade ]);
                    filterArray.push(["custrecord_jj_cust_plngrm_parent.custrecord_jj_customer_grades_planogram", "anyof",customerGrade ]);
                }
                if(trainingGrade && trainingGrade!=0){
                    if(filterArray.length>0){
                        filterArray.push("AND");
                    }
                    filterArray.push(["custrecord_jj_cust_plngrm_parent.custrecord_jj_customer_grades","anyof",trainingGrade]);
                }
                if(rectangleOptionArray.length>0){
                    if(filterArray.length>0){
                        filterArray.push("AND");
                    }
                    var latLarge, latSmall, longLarge, longSmall;
                    if(Number(rectangleOptionArray[0])>Number(rectangleOptionArray[2])){
                        log.debug("Inn of lat if")
                        latLarge = Number(rectangleOptionArray[0]);
                        latSmall =Number(rectangleOptionArray[2]);
                    }else{
                        log.debug("Inn of lat else")
                        latLarge = Number(rectangleOptionArray[2]);
                        latSmall =Number(rectangleOptionArray[0]);
                    }
                    if(Number(rectangleOptionArray[1])>Number(rectangleOptionArray[3])){
                        log.debug("Inn of long if")
                        longLarge = Number(rectangleOptionArray[1]);
                        longSmall =Number(rectangleOptionArray[3]);
                    }else{
                        log.debug("Inn of long else")
                        longLarge = Number(rectangleOptionArray[3]);
                        longSmall =Number(rectangleOptionArray[1]);
                    }

                    filterArray.push(
                        ["formulanumeric: case when ( TO_NUMBER({custentitycustentity_ns_lat})>"+latSmall+  "AND TO_NUMBER({custentitycustentity_ns_lat})<"+latLarge+" ) then (1) else (0) end","equalto","1"],
                        "AND",
                        ["formulanumeric:case when (TO_NUMBER( {custentitycustentity_ns_long})>"+longSmall+" AND  TO_NUMBER( {custentitycustentity_ns_long})<"+longLarge+" ) then (1) else (0) end","equalto","1"]
                    );
                }

                log.debug("filterArray",filterArray)


                if(savedSearch && savedSearch!=0){

                    var customerSearchObj = search.load({
                        id: savedSearch
                    });

                    var filters = customerSearchObj.filters; //reference Search.filters object to a new variable
                    var filterOne = search.createFilter({
                        name: 'formulanumeric',
                        formula: "case when ( TO_NUMBER({custentitycustentity_ns_lat})>"+latSmall+  "AND TO_NUMBER({custentitycustentity_ns_lat})<"+latLarge+" ) then (1) else (0)  end",
                        operator: search.Operator.EQUALTO,
                        values: 1
                    });
                    var filterTwo = search.createFilter({
                        name: 'formulanumeric',
                        formula: "case when (TO_NUMBER( {custentitycustentity_ns_long})>"+longSmall+" AND  TO_NUMBER( {custentitycustentity_ns_long})<"+longLarge+" ) then (1) else (0) end",
                        operator: search.Operator.EQUALTO,
                        values: 1
                    });

                    filters.push(filterOne);
                    filters.push(filterTwo);


                    customerSearchObj.filters= filters;
                    log.debug(" customerSearchObj.filters", customerSearchObj.filters)

                    var entityID = search.createColumn({
                        name: 'entityid'
                    });

                    var internalId = search.createColumn({name: "internalid", label: "Internal ID"});
                    var altName = search.createColumn({name: "altname", label: "Name"})
                    var companyname = search.createColumn({name: "companyname", label: "Company Name"})
                    var lat = search.createColumn({name: "custentitycustentity_ns_lat", label: "Latitude"});

                    var long = search.createColumn({name: "custentitycustentity_ns_long", label: "Longitude"});
                    customerSearchObj.columns.push(internalId);
                    customerSearchObj.columns.push(altName);
                    customerSearchObj.columns.push(companyname);
                    customerSearchObj.columns.push(entityID);
                    customerSearchObj.columns.push(lat);
                    customerSearchObj.columns.push(long);


                }else {
                    log.debug("Else SEARCH")
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters:
                        filterArray,
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({name: "altname", label: "Name"}),
                                search.createColumn({name: "custentitycustentity_ns_lat", label: "Latitude"}),
                                search.createColumn({name: "custentitycustentity_ns_long", label: "Longitude"}),
                                search.createColumn({name: "companyname", label: "Company Name"})
                            ]
                    });
                }
                var searchResultCount = customerSearchObj.runPaged().count;
                log.debug("customerSearchObj result count",searchResultCount);
                customerSearchObj.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var customerObj={};

                    customerObj.internalId =  result.getValue({
                        name: "internalid", label: "Internal ID"
                    });

                    customerObj.name = result.getValue({
                        name: "altname", label: "Name"
                    });

                    customerObj.companyname = result.getValue({
                        name: "companyname", label: "Company Name"
                    });

                    customerObj.lat = result.getValue({
                        name: "custentitycustentity_ns_lat", label: "Latitude"
                    });

                    customerObj.lng =  result.getValue({
                        name: "custentitycustentity_ns_long", label: "Longitude"
                    });


                    customerArray.push({"lat": Number(customerObj.lat),"lng":Number(customerObj.lng), "internalID":customerObj.internalId, "customerName":customerObj.name, "companyname":customerObj.companyname});
                    /*customerArray.push(customerObj.name);
                    customerDataArray.push(customerArray);*/
                    return true;
                });



                return customerArray;
            }catch (e) {
                log.debug("Err@getCustomerData",e)
                log.error("Err@getCustomerData",e)
            }

        }

        function timelist(){
            try{
                var customlist_jj_nps_time_listSearchObj = search.create({
                    type: "customlist_jj_nps_time_list",
                    filters:
                        [
                        ],
                    columns:
                        [
                            search.createColumn({name: "name", label: "Name"}),
                            search.createColumn({
                                name: "internalid",
                                sort: search.Sort.ASC,
                                label: "Internal ID"
                            })
                        ]
                });
                var searchResultCount = customlist_jj_nps_time_listSearchObj.runPaged().count;
                log.debug("customlist_jj_nps_time_listSearchObj result count",searchResultCount);
                var res = []
                if(searchResultCount>0) {
                    customlist_jj_nps_time_listSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        res.push(result.getValue({name: "name"}))
                        return true;
                    });
                }
                return res;
            }
            catch (e) {
                log.debug('Error @ Time list: ',e.name+" : "+e.message)
            }
        }

        function taskTypeList(){
            try{
                var customlist_jj_task_type_listSearchObj = search.create({
                    type: "customlist1815",
                    filters:
                        [
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                sort: search.Sort.ASC,
                                label: "Internal ID"
                            }),
                            search.createColumn({name: "name", label: "Name"})
                        ]
                });
                var searchResultCount = customlist_jj_task_type_listSearchObj.runPaged().count;
                log.debug("customlist_jj_task_type_listSearchObj result count",searchResultCount);
                var res = []
                if(searchResultCount>0) {
                    customlist_jj_task_type_listSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var id = result.getValue({name: "internalid"})
                        var value = result.getValue({name: "name"})
                        res.push({
                            id: id,
                            value:value
                        })
                        return true;
                    });
                }

                return res;
            }
            catch (e) {
                log.debug("Error @ taskTypeList: ",e.name+" : "+e.message)
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
                var mode = scriptContext.request.parameters.mode;
                if(scriptContext.request.method=='GET' && mode!='page4'){

                    var CustomerDetails =  getCustomerData(scriptContext.request.parameters);
                    //create body fields
                    var form = serverWidget.createForm({
                        title: "Map Customers"
                    });
                    var taskInfo = form.addFieldGroup({
                        id : 'taskinformation_filter',
                        label : 'Add Task Information'
                    });
                    // let title = form.addField({
                    //     type:serverWidget.FieldType.TEXT,
                    //     label:"Title",
                    //     id:"title",
                    //     container: 'taskinformation_filter'
                    // });
                    //Assigned To
                    let assignedTo = form.addField({
                        type:serverWidget.FieldType.SELECT,
                        label:"Assigned To",
                        id:"assigned_to",
                        source:'employee',
                        container: 'taskinformation_filter'
                    }).isMandatory=true;
                    //Priority
                    let priority = form.addField({
                        type:serverWidget.FieldType.SELECT,
                        label:"Priority",
                        id:"priority",
                        container: 'taskinformation_filter'
                    })
                    priority.addSelectOption({
                        value:'High',
                        text:'High'
                    });
                    priority.addSelectOption({
                        value:'Medium',
                        text:'Medium',
                        isSelected:true
                    });
                    priority.addSelectOption({
                        value:'Low',
                        text:'Low'
                    })
                    priority.isMandatory = true;
                    //start date
                    let startDate = form.addField({
                        type:serverWidget.FieldType.DATE,
                        label:"Start Date",
                        id:"start_date",
                        container: 'taskinformation_filter'
                    }).isMandatory=true;
                    //end date
                    let endDate = form.addField({
                        type:serverWidget.FieldType.DATE,
                        label:"Due Date",
                        id:"end_date",
                        container: 'taskinformation_filter'
                    }).isMandatory=true;

                    // Task Type
                    var taskTypeResult = taskTypeList()
                    log.debug("taskTypeResult: ",taskTypeResult)

                    let taskType = form.addField({
                        id: 'custpage_task_type',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Task Type',
                        container: 'taskinformation_filter'
                    })
                    taskType.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })
                    if(taskTypeResult.length>0){
                        for(var i=0;i<taskTypeResult.length;i++){
                            taskType.addSelectOption({
                                value: taskTypeResult[i].id,
                                text: taskTypeResult[i].value
                            })
                        }
                    }

                    //reserve time
                    let resrveTime = form.addField({
                        type:serverWidget.FieldType.CHECKBOX,
                        label:"Reserve Time",
                        id:"reserve_time",
                        container: 'taskinformation_filter'
                    });
                    //start time
                    let startTime = form.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Start Time",
                        id:"start_time",
                        container: 'taskinformation_filter'
                    });
                    startTime.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.DISABLED
                    })
                    startTime.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW})

                    var options = timelist()
                    log.debug("options: ",options)
                    var starttimePicker = form.addField({
                        type: serverWidget.FieldType.SELECT,
                        label: ' ',
                        id: 'timepicker',
                        container: 'taskinformation_filter'
                    })
                    starttimePicker.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })
                    if(options.length>0){
                        for(var i=0;i<options.length;i++) {
                            if(options[i] == '12:00 pm'){
                                starttimePicker.addSelectOption({
                                    value: options[i],
                                    text: 'noon'
                                })
                            }
                            else {
                                starttimePicker.addSelectOption({
                                    value: options[i],
                                    text: options[i]
                                })
                            }
                        }
                    }
                    starttimePicker.updateLayoutType({layoutType: serverWidget.FieldLayoutType.MIDROW})
                    starttimePicker.updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED})

                    //End time
                    let endTime = form.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"End Time",
                        id:"end_time",
                        container: 'taskinformation_filter'
                    });
                    endTime.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.DISABLED
                    })
                    endTime.updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW})

                    var endtimePicker = form.addField({
                        type: serverWidget.FieldType.SELECT,
                        label: ' ',
                        id: 'timepicker2',
                        container: 'taskinformation_filter'
                    })
                    endtimePicker.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })
                    if(options.length>0){
                        for(var i=0;i<options.length;i++) {
                            if(options[i] == '12:00 pm'){
                                endtimePicker.addSelectOption({
                                    value: options[i],
                                    text: 'noon'
                                })
                            }
                            else {
                                endtimePicker.addSelectOption({
                                    value: options[i],
                                    text: options[i]
                                })
                            }
                        }
                    }
                    endtimePicker.updateLayoutType({layoutType: serverWidget.FieldLayoutType.MIDROW})
                    endtimePicker.updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED})

                    //End time
                    let userField = form.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Current USer",
                        id:"currentuser",

                    })
                    userField.defaultValue =  runtime.getCurrentUser().name;
                    userField.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    })


                    //create sublist
                    let sublistForCustomers =  form.addSublist({
                        id : 'customer_details',
                        type : serverWidget.SublistType.INLINEEDITOR,
                        label : 'Choose Customers To Create Task'
                    });

                    var checkboxField = sublistForCustomers.addField({
                        id: "custpage_is_selected",
                        label: 'Select',
                        type: serverWidget.FieldType.CHECKBOX
                    });
                    checkboxField.defaultValue=true;

                    //internal id
                    sublistForCustomers.addField({
                        id: "custpage_internalid",
                        label: 'Internal ID',
                        type: serverWidget.FieldType.TEXT
                    });
                    var sublistObj = form.getSublist({
                        id: 'customer_details'
                    });
                    var custInternalIdFld = sublistObj.getField({id: 'custpage_internalid'});
                    //custInternalIDField.isMandatory = true;
                    custInternalIdFld.updateDisplayType({
                        displayType : serverWidget.FieldDisplayType.DISABLED
                    });
                    custInternalIdFld.isMandatory = true;
                    //Customer name
                    sublistForCustomers.addField({
                        id: "custpage_customer_name",
                        label: 'Customer Name',
                        type: serverWidget.FieldType.SELECT,
                        source: record.Type.CUSTOMER
                    })
                    var customerNameField = sublistObj.getField({id: 'custpage_customer_name'});

                    // customerNameField.updateDisplayType({
                    //     displayType : serverWidget.FieldDisplayType.DISABLED
                    // });
                    customerNameField.isMandatory = true;

                    //assigned to
                    sublistForCustomers.addField({
                        id: "custpage_title",
                        label: 'Title',
                        type: serverWidget.FieldType.TEXT,

                    }).isMandatory=true;
                    //assigned to
                    sublistForCustomers.addField({
                        id: "custpage_assigned_to",
                        label: 'Assigned To',
                        type: serverWidget.FieldType.SELECT,
                        source: 'employee'
                    });
                    //priority
                    //Customer name
                    var prioritySublist= sublistForCustomers.addField({
                        id: "custpage_priority",
                        label: 'Priority',
                        type: serverWidget.FieldType.SELECT
                    });
                    prioritySublist.addSelectOption({
                        value:'High',
                        text:'High'
                    });
                    prioritySublist.addSelectOption({
                        value:'Medium',
                        text:'Medium',
                        isSelected:true
                    });
                    prioritySublist.addSelectOption({
                        value:'Low',
                        text:'Low'
                    });
                    //start date
                    sublistForCustomers.addField({
                        id: "custpage_startdate",
                        label: 'Start Date',
                        type: serverWidget.FieldType.DATE
                    });
                    //end date
                    sublistForCustomers.addField({
                        id: "custpage_enddate",
                        label: 'End Date',
                        type: serverWidget.FieldType.DATE
                    });
                    //taskType
                    let taskList = sublistForCustomers.addField({
                        id: 'custpage_task_type_sublist',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Task Type'
                    })
                    taskList.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })
                    if(taskTypeResult.length>0){
                        for(var i=0;i<taskTypeResult.length;i++){
                            taskList.addSelectOption({
                                value: taskTypeResult[i].id,
                                text: taskTypeResult[i].value
                            })
                        }
                    }
                    //Reserve time
                    sublistForCustomers.addField({
                        id: "custpage_reserve_time",
                        label: 'Reserve Time',
                        type: serverWidget.FieldType.CHECKBOX
                    });
                    //Start Time
                    sublistForCustomers.addField({
                        id: "custpage_start_time",
                        label: 'Start Time',
                        type: serverWidget.FieldType.TEXT
                    });

                    var options = timelist()
                    log.debug("options: ",options)
                    var starttimePickerSublist = sublistForCustomers.addField({
                        type: serverWidget.FieldType.SELECT,
                        label: ' ',
                        id: 'timepicker_sublist'
                    })
                    starttimePickerSublist.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })
                    if(options.length>0){
                        for(var i=0;i<options.length;i++) {
                            if(options[i] == '12:00 pm'){
                                starttimePickerSublist.addSelectOption({
                                    value: options[i],
                                    text: 'noon'
                                })
                            }
                            else {
                                starttimePickerSublist.addSelectOption({
                                    value: options[i],
                                    text: options[i]
                                })
                            }
                        }
                    }

                    //end time
                    sublistForCustomers.addField({
                        id: "custpage_end_time",
                        label: 'End Time',
                        type: serverWidget.FieldType.TEXT
                    });

                    var endtimePickerSublist = sublistForCustomers.addField({
                        type: serverWidget.FieldType.SELECT,
                        label: ' ',
                        id: 'timepicker2_sublist'
                    })
                    endtimePickerSublist.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })
                    if(options.length>0){
                        for(var i=0;i<options.length;i++) {
                            if(options[i] == '12:00 pm'){
                                endtimePickerSublist.addSelectOption({
                                    value: options[i],
                                    text: 'noon'
                                })
                            }
                            else {
                                endtimePickerSublist.addSelectOption({
                                    value: options[i],
                                    text: options[i]
                                })
                            }
                        }
                    }

                    //add data to the sublist
                    setSublistValuesFromCustomerDetails(CustomerDetails,sublistForCustomers);

                    //button to create task
                    form.addButton({
                        label: 'Mark All Customers',
                        id:'markAll',
                        functionName:'markAllFunction'
                    })
                    form.addButton({
                        label: 'Unmark All Customers',
                        id:'unmarkAll',
                        functionName:'unmarkAllFunction'
                    })
                    form.addSubmitButton({
                        label: 'Create Task'
                    })
                    form.clientScriptFileId = CLIENT_SCRIPT_ID;

                    scriptContext.response.writePage(form);

                }
                else{
                    var custID = scriptContext.request.parameters.custID;

                    var lineCount = scriptContext.request.getLineCount({
                        group: 'customer_details'
                    })
                    log.debug("lineCOunt: ",lineCount)
                    if(custID) {
                        // trigger mapreduce script
                        var mapReduceTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_jj_mr_create_task_hgpl13',
                            deploymentId: 'customdeploy_jj_mr_create_task_hgpl13',
                            params: {
                                'custscript_jj_fileid': custID
                            }
                        });
                        mapReduceTask.submit();
                    }
                }
            }catch (e) {
                log.debug("Error@ onRequest",e)
                log.error("Error@ onRequest",e)
            }

        }

        return {onRequest}

    });
