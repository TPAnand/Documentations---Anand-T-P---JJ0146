/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/currentRecord', 'N/error', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/ui/message'],
    /**
 * @param{currentRecord} currentRecord
 * @param{error} error
 * @param{https} https
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{url} url
     * @param{message} message
 */
    (currentRecord, error, https, record, runtime, search, serverWidget, url, message) => {

        var dataSets = {
            iterateSavedSearch: function (searchObj) {
                var items = [];
                var searchPageRanges;
                try {
                    searchPageRanges = searchObj.runPaged({
                        pageSize: 1000
                    });
                } catch (err) {
                    return [];
                }
                if (searchPageRanges.pageRanges.length < 1)
                    return [];
                var pageRangeLength = searchPageRanges.pageRanges.length;
                // log.debug('pageRangeLength', pageRangeLength);

                for (var pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                    searchPageRanges.fetch({
                        index: pageIndex
                    }).data.forEach(function (result) {
                        items.push(result);
                    });

                return items;
            },
            listItems: function (searchObj) {
                var searchResultCount = searchObj.runPaged().count;
                // log.debug("searchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(searchObj);
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

        /**
         * Function to list subsidiaries supported by the logged user role.
         *
         * @param {role} role - Role ID
         *@returns [roleSubsidiaries] - Array of supported subsidiary internal IDs
         */
        function roleSubsidiarySearch(role) {
            try {

                var roleSubsidiaries = [];

                var roleSearchObj = search.create({
                    type: "role",
                    filters: [
                        ["internalid", "anyof", role]
                    ],
                    columns: [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "subsidiaryoption", label: "Accessible Subsidiaries Option" }),
                        search.createColumn({ name: "subsidiarynohierarchy", join: "user", label: "Subsidiary (no hierarchy)" }),
                        search.createColumn({ name: "subsidiaries", label: "Accessible Subsidiaries" })
                    ]
                });
                var searchResults = dataSets.listItems(roleSearchObj);
                searchResults.forEach(function(result) {
                    var subsidairyOption = result.getValue(roleSearchObj.columns[1]);
                    if (subsidairyOption == "OWN") {
                        var userSubsidiary = result.getValue(roleSearchObj.columns[2]);
                        roleSubsidiaries.push(userSubsidiary);
                    } else {
                        var subsidiaries = result.getValue(roleSearchObj.columns[3]);
                        roleSubsidiaries.push(subsidiaries);
                        return true;
                    }
                });
                log.debug("roleSubsidiaries: ",roleSubsidiaries)
                return roleSubsidiaries;

            } catch (err) {
                log.debug('error @ roleSubsidiarySearch', err)
            }
        }


        /**
         * Function to list projects.
         *
         * @param {user} user - loggedUser's ID
         * @param {userSubsidary} userSubsidary - Logged user's subsidiary ID
         * @param {roleCenter} roleCenter - Logged User's role center
         *@returns [{res}] - Array of objects of project details
         */

        function projectSearch(user,userSubsidary,roleCenter){
            try{
                if(checkForParameter(roleCenter)==true) {
                    var filterArr = []
                    if (roleCenter == "ACCOUNTCENTER") {
                        if(checkForParameter(userSubsidary)==true) {
                            filterArr = [
                                ["isinactive", "is", "F"],
                                "AND",
                                ["status", "anyof", "2"],
                                "AND",
                                ["subsidiary", "anyof", userSubsidary],
                                "AND",
                                ["custentity_jj_proj_billing_type","noneof","@NONE@"]
                            ]
                        }
                    }
                    else if(roleCenter == "EMPLOYEE"){
                        if(checkForParameter(user)==true) {
                            filterArr = [
                                ["isinactive", "is", "F"],
                                "AND",
                                [[["jobresource", "anyof", user], "AND", ["jobresourcerole", "anyof", "-2"]], "OR", ["projectmanager", "anyof", user]],
                                "AND",
                                ["status", "anyof", "2"],
                                "AND",
                                ["custentity_jj_proj_billing_type","noneof","@NONE@"]
                            ]
                        }
                    }
                    else{
                        filterArr = [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["status", "anyof", "2"],
                            "AND",
                            ["custentity_jj_proj_billing_type","noneof","@NONE@"]
                        ]
                    }
                    log.debug("filterArr: ",filterArr)

                        var jobSearchObj = search.create({
                            type: "job",
                            filters: filterArr,
                            columns:
                                [
                                    search.createColumn({
                                        name: "internalid",
                                        sort: search.Sort.ASC,
                                        label: "Internal ID"
                                    }),
                                    search.createColumn({name: "entityid", label: "Name"}),
                                    search.createColumn({name: "customer", label: "Client"}),
                                    search.createColumn({name: "subsidiary", label: "Subsidiary"}),
                                    search.createColumn({name: "calculatedwork", label: "Calculated Work"}),
                                    search.createColumn({name: "plannedwork", label: "Planned Work"}),
                                    search.createColumn({name: "actualtime", label: "Actual Work"}),
                                    search.createColumn({name: "timeremaining", label: "Remaining Work"}),
                                    search.createColumn({name: "entitystatus", label: "Status"})
                                ]
                        });
                        var searchResultCount = jobSearchObj.runPaged().count;
                        log.debug("searchResultCount: ",searchResultCount)
                        var res = []
                        if (searchResultCount > 0) {
                            var searchResults = dataSets.listItems(jobSearchObj);
                            searchResults.forEach(function (result) {
                                // .run().each has a limit of 4,000 results
                                var prjId = result.getValue({name: "internalid", sort: search.Sort.ASC})
                                var prjName = result.getValue({name: "entityid"})
                                var client = result.getValue({name: "customer"})
                                var subsidiary = result.getValue({name: "subsidiary"})
                                var calculatedWork = result.getValue({name: "calculatedwork"})
                                var plannedWork = result.getValue({name: "plannedwork"})
                                var actualWork = result.getValue({name: "actualtime"})
                                var remainingWork = result.getValue({name: "timeremaining"})
                                var status = result.getValue({name: "entitystatus"})
                                res.push({
                                    prjId: prjId,
                                    prjName: prjName,
                                    client: client,
                                    subsidiary: subsidiary,
                                    calculatedWork: calculatedWork,
                                    plannedWork: plannedWork,
                                    actualWork: actualWork,
                                    remainingWork: remainingWork,
                                    status: status
                                })
                                return true;
                            });
                        }
                        return res;

                }
            }
            catch (e) {
                log.error({
                    title: "Error @ Project Search: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        function projectTaskSearch(prjId){
            try{
                if(checkForParameter(prjId)==true) {
                    var projecttaskSearchObj = search.create({
                        type: "projecttask",
                        filters:
                            [
                                ["project", "anyof", prjId],
                                "AND",
                                ["status","anyof","PROGRESS","NOTSTART"],
                                "AND",
                                ["ismilestone","is","F"],
                                "AND",
                                ["custevent_jj_billing_type","noneof","@NONE@"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "internalid",
                                    sort: search.Sort.ASC,
                                    label: "Internal ID"
                                }),
                                search.createColumn({name: "title", label: "Name"}),
                                search.createColumn({name: "company", label: "Project"})
                            ]
                    });
                    var searchResultCount = projecttaskSearchObj.runPaged().count;
                    var res = [];

                    if(searchResultCount>0) {
                        var searchResults = dataSets.listItems(projecttaskSearchObj);
                        searchResults.forEach(function (result) {
                            // .run().each has a limit of 4,000 results
                            var taskId = result.getValue({
                                name: "internalid",
                                sort: search.Sort.ASC
                            })
                            var taskName = result.getValue({
                                name: "title"
                            })
                            res.push({
                                taskId: taskId,
                                taskName: taskName
                            })
                            return true;
                        });
                    }
                    return res;
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ Project Task Search: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        function genericResourceSearch(subs){
            try{
                var genericresourceSearchObj = search.create({
                    type: "genericresource",
                    filters:
                        [
                            ["isinactive","is","F"],
                            "AND",
                            ["subsidiary","anyof",subs]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                sort: search.Sort.ASC,
                                label: "Internal ID"
                            }),
                            search.createColumn({name: "entityid", label: "Name"}),
                            search.createColumn({name: "billingclass", label: "Billing Business Line"}),
                            search.createColumn({name: "subsidiary", label: "Subsidiary"}),
                            search.createColumn({name: "laborcost", label: "Cost"})
                        ]
                });
                var searchResultCount = genericresourceSearchObj.runPaged().count;
                var res = [];
                if(searchResultCount>0) {
                    var searchResults = dataSets.listItems(genericresourceSearchObj);
                    searchResults.forEach(function (result) {
                        // .run().each has a limit of 4,000 results
                        var genericId = result.getValue({name: "internalid", sort: search.Sort.ASC})
                        var genericName = result.getValue({name: "entityid"})
                        var genericBillingClass = result.getValue({name: "billingclass"})
                        var genericBillingClassName = result.getText({name: "billingclass"})
                        var genericSubsidiary = result.getValue({name: "subsidiary"})
                        var genericLaborCost = result.getValue({ name: "laborcost" })
                        res.push({
                            genericId: genericId,
                            genericName: genericName,
                            genericBillingClass: genericBillingClass,
                            genericBillingClassName: genericBillingClassName,
                            genericSubsidiary: genericSubsidiary,
                            genericLaborCost: genericLaborCost
                        })
                        return true;
                    });
                }
                return res;
            }
            catch (e) {
                log.error({
                    title: "Error @ genericManagerSearch: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        function billingCardSearch(subsidary){
            try{
                var billingratecardSearchObj = search.create({
                    type: "billingratecard",
                    filters:
                        [
                            ["isinactive","is","F"],
                            "AND",
                            ["custrecord23","anyof",subsidary]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                sort: search.Sort.ASC,
                                label: "Internal ID"
                            }),
                            search.createColumn({name: "name", label: "Name"}),
                            search.createColumn({name: "custrecord23", label: "Subsidary"})
                        ]
                });
                var searchResultCount = billingratecardSearchObj.runPaged().count;
                var res = [];
                if(searchResultCount>0) {
                    var searchResults = dataSets.listItems(billingratecardSearchObj);
                    searchResults.forEach(function (result) {
                        // .run().each has a limit of 4,000 results
                        var cardId = result.getValue({name: "internalid", sort: search.Sort.ASC})
                        var cardName = result.getValue({name: "name"})
                        res.push({
                            cardId: cardId,
                            cardName: cardName
                        })
                        return true;
                    });
                }
                return res;
            }
            catch (e) {
                log.error({
                    title: "Error @ Billing rate card search: ",
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
                var prjIdParam = scriptContext.request.parameters.prjId

                var userObj = runtime.getCurrentUser();
                log.debug("userObj: ",userObj.roleCenter)
                var currUser = userObj.id
                var roleCenter = userObj.roleCenter;
                log.debug('String value of current user center type (role center): ' + roleCenter);
                var roleId = userObj.role
                log.debug("roleId: ",roleId)

                var userSubsidary = roleSubsidiarySearch(roleId)
                log.debug("userSubsidary: ",userSubsidary)
                var prjList = projectSearch(currUser,userSubsidary,roleCenter)
                var projectTaskList = projectTaskSearch(prjIdParam)

                var form = serverWidget.createForm({
                    title: 'Resource Allocation'
                });
                // form.clientScriptFileId = 180706//SB Client script
                form.clientScriptFileId = 535595//Production Client script
                var progressBarField = form.addField({
                    id: 'custpage_progress_bar',
                    type: 'INLINEHTML',
                    label: 'Progress bar'
                });

                var loadingUrl = "https://3689903.app.netsuite.com/core/media/media.nl?id=32305&c=3689903&h=dcec0a9dd4c1943ff816";
                var html = "<div><img id='custpage_load_img' style='height:60px;width:100px;top: 305px;left: 693px;float: right;position: absolute;display: none;' src='" + loadingUrl + "'/></div>";
                progressBarField.defaultValue = html;

                if(scriptContext.request.method === 'GET') {
                    var projectList = form.addField({
                        id: 'custpage_project',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Project Name'
                    })
                    projectList.addSelectOption({
                        value: " ",
                        text: "SELECT",
                        isSelected: true
                    })
                    if(prjList.length>0){
                        for(var i=0;i<prjList.length;i++) {
                            projectList.addSelectOption({
                                value: prjList[i].prjId,
                                text: prjList[i].prjName
                            })
                        }
                    }
                    projectList.isMandatory = true
                    projectList.defaultValue = prjIdParam

                    if(checkForParameter(prjIdParam)==true) {
                        var fieldLookUp = search.lookupFields({
                            type: search.Type.JOB,
                            id: prjIdParam,
                            columns: ['customer', 'subsidiarynohierarchy', 'calculatedwork', 'plannedwork', 'actualtime', 'timeremaining', 'entitystatus','custentity3','currency','allowallresourcesfortasks']
                        });
                        log.debug("fieldLookUp: ",fieldLookUp)

                        // var pref = fieldLookUp&&fieldLookUp.allowallresourcesfortasks
                        var subs = fieldLookUp.subsidiarynohierarchy[0].value
                        var genericResources = genericResourceSearch(subs)
                        log.debug("genericResources: ",genericResources)
                        var genericList = JSON.stringify(genericResources)
                        var genericEmployeeList = form.addField({
                            id: 'custpage_generic_employee_list',
                            type: serverWidget.FieldType.LONGTEXT,
                            label: 'Generic Employee List'
                        })
                        genericEmployeeList.defaultValue = genericList
                        genericEmployeeList.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })

                        var taskArray = []
                        for(var x=0;x<projectTaskList.length;x++){
                            taskArray.push(projectTaskList[x].taskId)
                        }
                        log.debug("taskArray: ",taskArray)

                        var taskList = form.addField({
                            id: 'custpage_task_list',
                            type: serverWidget.FieldType.LONGTEXT,
                            label: 'Task List'
                        })
                        taskList.defaultValue = JSON.stringify(taskArray)
                        taskList.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })

                        var ratecardSearch = billingCardSearch(fieldLookUp.subsidiarynohierarchy[0].value)

                        var prjRec = record.load({
                            type: record.Type.JOB,
                            id: prjIdParam,
                            isDynamic: true
                        })
                        var pref = prjRec.getValue({
                            fieldId: 'allowallresourcesfortasks'
                        })
                        log.debug("PREFERENCE: ",pref)

                        var client = form.addField({
                            id: 'custpage_client',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Client'
                        })
                        client.defaultValue = fieldLookUp.customer.length>0 && fieldLookUp.customer[0].text;
                        client.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var subsidiary = form.addField({
                            id: 'custpage_subsidiary',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Subsidiary'
                        })
                        subsidiary.defaultValue = fieldLookUp.subsidiarynohierarchy.length>0 && fieldLookUp.subsidiarynohierarchy[0].text
                        subsidiary.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var subsidiaryId = form.addField({
                            id: 'custpage_subsidiaryid',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Subsidiary ID'
                        })
                        subsidiaryId.defaultValue = fieldLookUp.subsidiarynohierarchy.length>0 && fieldLookUp.subsidiarynohierarchy[0].value
                        subsidiaryId.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })
                        var calculatedWork = form.addField({
                            id: 'custpage_calculated_work',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Calculated Work'
                        })
                        calculatedWork.defaultValue = Number(fieldLookUp.calculatedwork).toFixed(2)
                        calculatedWork.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var plannedWork = form.addField({
                            id: 'custpage_planned_work',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Planned Work'
                        })
                        plannedWork.defaultValue = Number(fieldLookUp.plannedwork).toFixed(2)
                        plannedWork.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var actualWork = form.addField({
                            id: 'custpage_actual_work',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Actual Work'
                        })
                        actualWork.defaultValue = Number(fieldLookUp.actualtime).toFixed(2)
                        actualWork.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var remainingWork = form.addField({
                            id: 'custpage_remaining_work',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Remaining Work'
                        })
                        remainingWork.defaultValue = Number(fieldLookUp.timeremaining).toFixed(2)
                        remainingWork.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var currency = form.addField({
                            id: 'custpage_currency',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Currency'
                        })
                        currency.defaultValue = fieldLookUp.currency.length>0 && fieldLookUp.currency[0].text
                        currency.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var currencyId = form.addField({
                            id: 'custpage_currencyid',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Currency ID'
                        })
                        currencyId.defaultValue = fieldLookUp.currency.length>0 && fieldLookUp.currency[0].value
                        currencyId.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })
                        var status = form.addField({
                            id: 'custpage_status',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Status'
                        })
                        status.defaultValue = fieldLookUp.entitystatus.length>0 && fieldLookUp.entitystatus[0].text
                        status.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var rateCards = form.addField({
                            id: 'custpage_billing_rate_card',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Rate Card'
                        })
                        rateCards.defaultValue = fieldLookUp.custentity3.length>0 ? fieldLookUp.custentity3[0].text : ''
                        rateCards.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        })
                        var rateCardsId = form.addField({
                            id: 'custpage_billing_rate_card_id',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Rate Card ID'
                        })
                        rateCardsId.defaultValue = fieldLookUp.custentity3.length>0 ? fieldLookUp.custentity3[0].value : ''
                        rateCardsId.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })

                        //SUBLIST
                        var sublist = form.addSublist({
                            id: 'custpage_allocation_details',
                            type: serverWidget.SublistType.INLINEEDITOR,
                            label: 'Allocation Details'
                        })
                        var taskList = sublist.addField({
                            id: 'custpage_project_task',
                            type: serverWidget.FieldType.SELECT,
                            label: 'Project Task'
                        })
                        taskList.addSelectOption({
                            value: " ",
                            text: "SELECT TASK",
                            isSelected: true
                        })
                        if (projectTaskList.length > 0) {
                            for (var j = 0; j < projectTaskList.length; j++) {
                                taskList.addSelectOption({
                                    value: projectTaskList[j].taskId,
                                    text: projectTaskList[j].taskName
                                })
                            }
                        }
                        taskList.isMandatory = true

                        var taskBillingRateCard = sublist.addField({
                            id: 'custpage_project_task_billing_rate_card',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Project Task Billing Rate Card'
                        })

                        taskBillingRateCard.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })

                        var estimatedFee = sublist.addField({
                            id: 'custpage_estimated_fee',
                            type:serverWidget.FieldType.TEXT,
                            label: 'Estimated Fee'
                        })
                        estimatedFee.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        })
                        var totalFee = sublist.addField({
                            id: 'custpage_total_fee',
                            type:serverWidget.FieldType.TEXT,
                            label: 'Total Fee'
                        })
                        totalFee.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        })

                        var billingType = sublist.addField({
                            id: 'custpage_billing_type',
                            type:serverWidget.FieldType.TEXT,
                            label: 'Billing Type'
                        })
                        billingType.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        })

                        var genericEmployee = sublist.addField({
                            id: 'custpage_generic_employee',
                            type: serverWidget.FieldType.SELECT,
                            label: 'Generic Employee'
                        })
                        genericEmployee.addSelectOption({
                            value: "",
                            text: "SELECT",
                            isSelected: true
                        })
                        if(genericResources.length>0){
                            for(var k=0;k<genericResources.length;k++){
                                genericEmployee.addSelectOption({
                                    value: genericResources[k].genericId,
                                    text: genericResources[k].genericName
                                })
                            }
                        }
                        genericEmployee.isMandatory = true
                        var genericEmployeeCost = sublist.addField({
                            id: 'custpage_generic_cost',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Generic Employee Cost'
                        })
                        genericEmployeeCost.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })
                        var genericBillingClass = sublist.addField({
                            id: 'custpage_generic_billingclass',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Generic Billing Class'
                        })
                        genericBillingClass.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        })
                        var genericBillingClassId = sublist.addField({
                            id: 'custpage_generic_billingclassid',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Generic Billing Class ID'
                        })
                        genericBillingClassId.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        })
                        var vendorCheck = sublist.addField({
                            id: 'custpage_is_vendor',
                            type: serverWidget.FieldType.CHECKBOX,
                            label: 'Add Vendors'
                        })
                        vendorCheck.defaultValue = false

                        var rateCard = sublist.addField({
                            id: 'custpage_rate_card',
                            type: serverWidget.FieldType.SELECT,
                            label: 'Rate Card'
                        })
                        rateCard.addSelectOption({
                            value: " ",
                            text: "SELECT",
                            isSelected: true
                        })

                        if(ratecardSearch.length>0){
                            for(var k=0;k<ratecardSearch.length;k++){
                                rateCard.addSelectOption({
                                    value: ratecardSearch[k].cardId,
                                    text: ratecardSearch[k].cardName,
                                })
                            }
                        }

                        var checkVal = sublist.addField({
                            id: 'custpage_is_project_rate_card',
                            type: serverWidget.FieldType.CHECKBOX,
                            label: 'Use Project/Task Rate Card'
                        })
                        checkVal.defaultValue = false

                        var prjTaskRateCard = sublist.addField({
                            id: 'custpage_project_task_rate_card',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Project Task Rate Card'
                        })
                        prjTaskRateCard.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        })

                        var plannedHrs = sublist.addField({
                            id: 'custpage_planned_hours',
                            type: serverWidget.FieldType.FLOAT,
                            label: 'Planned Hours'
                        })
                        plannedHrs.isMandatory = true

                        var unitPrice = sublist.addField({
                            id: 'custpage_rate',
                            type: serverWidget.FieldType.FLOAT,
                            label: 'Unit Price'
                        })
                        unitPrice.isMandatory =true

                        var totalPrice = sublist.addField({
                            id: 'custpage_value',
                            type: serverWidget.FieldType.FLOAT,
                            label: 'Price'
                        })
                        totalPrice.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        })

                        form.addButton({
                            id: 'custpage_add_btn',
                            label: 'SUBMIT',
                            functionName: 'addRec'
                        })

                        // form.addSubmitButton({
                        //     label: 'SUBMIT'
                        // })
                    }
                    scriptContext.response.writePage(form);
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ onRequest: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        return {onRequest}

    });
