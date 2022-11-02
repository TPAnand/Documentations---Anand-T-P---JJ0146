/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/error', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/format'],
    /**
     * @param{error} error
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{task} task
     * @param{format} format
     */
    (error, record, runtime, search, task,format) => {
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
            try{

                //For restricting values of custom fields in Make a copy context
                if(scriptContext.type == 'copy'){

                    var rec = scriptContext.newRecord
                    var recType = rec.type

                    //FOR VENDOR BILL
                    if(recType == 'vendorbill'){
                        var ex = rec.getLineCount({
                            sublistId: 'expense'
                        })
                        var item = rec.getLineCount({
                            sublistId: 'item'
                        })

                        if(ex>0){
                            for(var i=0;i<ex;i++){
                                rec.setSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'custcol_far_trn_relatedasset',
                                    value: '',
                                    line: i
                                })
                            }
                        }

                        if(item>0){
                            for(var i=0;i<item;i++){
                                rec.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_far_trn_relatedasset',
                                    value: '',
                                    line: i
                                })
                            }
                        }
                    }// end of vendor section

                    //FOR JOURNAL ENTRY
                    if(recType == 'journalentry') {
                        var jLineCount = rec.getLineCount({
                            sublistId: 'line'
                        })

                        if (jLineCount > 0) {
                            for (var i=0;i<jLineCount;i++) {
                                rec.setSublistValue({
                                    sublistId: 'line',
                                    fieldId: 'custcol_far_trn_relatedasset',
                                    value: '',
                                    line: i
                                })
                            }
                        }
                    }// End of journal section
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ Before load: ",
                    details: e.name+' : '+e.message
                })
            }
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
                log.error({
                    title: "Error in Date function: ",
                    details: e.name+' : '+e.message
                })
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
                log.error({
                    title: "Error @ date Creator function: ",
                    details: e.name+' : '+e.message
                })
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
        function transactionSearch(id) {
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["internalid","anyof",id],
                        "AND",
                        ["type","anyof","VendBill","Journal"],
                        "AND",
                        ["custcol_far_trn_relatedasset","anyof","@NONE@"],
                        "AND",
                        [["custcol_far_asset_type","noneof","@NONE@"],"OR",["custcol_far_asset_types","noneof","@NONE@"]],
                        "AND",
                        // ["custcol_far_exclude_asset_type","is","F"],
                        // "AND",
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
                        })
                    ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            var cnt;
            transactionSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                cnt = result.getValue({
                    name: "lineuniquekey",
                    summary: "COUNT",
                })
                return true;
            });
            return cnt;
        }

        /**
         * Function to list vendor bills / journals which has pending FA lines.
         *
         * @param {string} id - record ID
         * @returns {string} cnt - Count of lines in each record which has no related Records. ie; lines which hasn't Fixed asset
         *
         * @since 2015.2
         */
        function transactionSearchScheduling(id) {
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["internalid","anyof",id],
                        "AND",
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
            return resArr;
        }

        function rescheduleScriptandReturn() {
            try {

                var ssTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 2094,
                    deploymentId: 'customdeploy_jj_ss_scheduled_script_fa',
                });
                var scriptTaskId = ssTask.submit();

            } catch (err) {
                log.error({
                    title: 'error on rescheduleScriptandReturn',
                    details: err.name+" : "+err.message
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
                log.debug("Context: ",scriptContext.type)
                var rec = scriptContext.newRecord
                var recId = rec.id
                var recType = rec.type
                //VENDOR BILL SECTION

                if(recType == 'vendorbill'){

                    var totalCount = transactionSearch(recId);
                    //Edit context
                    if(scriptContext.type == 'edit'){

                        var expenseCount = rec.getLineCount({
                            sublistId: 'expense'
                        });
                        var itemCount = rec.getLineCount({
                            sublistId: 'item'
                        });
                        if (totalCount<10) {
                            //EXPENSE LINE
                            if (expenseCount > 0) {

                                var subsidary = rec.getValue({
                                    fieldId: 'subsidiary'
                                })
                                var transDate = rec.getValue({
                                    fieldId: 'trandate'
                                })
                                var vendorName = rec.getValue({
                                    fieldId: 'entity'
                                })

                                var initialFormattedDateString = convertDate(transDate);
                                var parsedDateStringAsRawDateObject = format.parse({
                                    value: initialFormattedDateString,
                                    type: format.Type.DATE
                                });

                                var convertedDate = dateCreator()
                                for (var i = 0; i < expenseCount; i++) {

                                    var relRec = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_trn_relatedasset',
                                        line: i
                                    })

                                    var exAcc = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        line: i
                                    })
                                    var exAsset = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_asset_type',
                                        line: i
                                    })
                                    var excludeCheck = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_exclude_asset_type',
                                        line: i
                                    })
                                    var exMemo = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'memo',
                                        line: i
                                    })
                                    var exAmount = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        line: i
                                    })
                                    var exEmployee = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_employee',
                                        line: i
                                    })

                                    if(checkForParameter(exEmployee)==true) {
                                        var exDepartment = rec.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'custcol_assettype_department',
                                            line: i
                                        })
                                        var exClass = rec.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'custcol_assettype_class',
                                            line: i
                                        })
                                        var exLocation = rec.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'custcol_assettype_location',
                                            line: i
                                        })
                                    }
                                    var exQty = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_expense_quantity',
                                        line: i
                                    })

                                    var exPurchaseOrder = rec.getSublistValue({
                                        sublistId: 'purchaseorders',
                                        fieldId: 'poid',
                                        line: i
                                    })

                                    //Account Record
                                    var accountRec = record.load({
                                        type: record.Type.ACCOUNT,
                                        id: exAcc,
                                        isDynamic: true
                                    })

                                    var accType = accountRec.getValue({
                                        fieldId: 'accttype'
                                    })

                                    if (accType == 'FixedAsset') { //if account type is Fixed asset

                                        if (checkForParameter(exAsset)==true) { //asset type not empty

                                            // if (checkForParameter(relRec) == false && Boolean(excludeCheck) == false) { //won't have relatedRecord and not checked exclude FA checkbox
                                            if (checkForParameter(relRec) == false){
                                                //Asset type Record
                                                var assettypeRec = record.load({
                                                    type: 'customrecord_ncfar_assettype',
                                                    id: exAsset,
                                                    isDynamic: true
                                                })

                                                var assetDepreciationPeriod = assettypeRec.getValue({
                                                    fieldId: 'custrecord_assttype_dep_next_period'
                                                })
                                                var accountingMethod = assettypeRec.getValue({
                                                    fieldId: 'custrecord_assettypeaccmethod'
                                                })

                                                if (totalCount < 10) { //

                                                    //Creation of Fixed Asset
                                                    var FArecord = record.create({
                                                        type: 'customrecord_ncfar_asset',
                                                        isDynamic: true
                                                    })
                                                    //NAME
                                                    FArecord.setValue({
                                                        fieldId: 'altname',
                                                        value: exMemo ? exMemo : 'Auto Generated Asset'
                                                    })
                                                    //ASSET DESCRIPTION
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetdescr',
                                                        value: exMemo ? exMemo : 'Auto Generated Asset'
                                                    })
                                                    //ASSET TYPE
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assettype',
                                                        value: exAsset
                                                    })
                                                    //ASSET ORIGINAL COST
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetcost',
                                                        value: exAmount
                                                    })

                                                    //ASSET CURRENT COST
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetcurrentcost',
                                                        value: exAmount
                                                    })
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetbookvalue',
                                                        value: exAmount
                                                    })
                                                    //CUSTODIAN
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetcaretaker',
                                                        value: exEmployee
                                                    })
                                                    //DEPARTMENT
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_employee_department',
                                                        value: exDepartment
                                                    })
                                                    //CLASS
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_employee_class',
                                                        value: exClass
                                                    })
                                                    //LOCATION
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_employee_location',
                                                        value: exLocation
                                                    })
                                                    //QUANTITY
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_ncfar_quantity',
                                                        value: exQty ? exQty : 1
                                                    })
                                                    //SUBSIDIARY
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetsubsidiary',
                                                        value: subsidary
                                                    })
                                                    //PURCHASE DATE
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetpurchasedate',
                                                        value: parsedDateStringAsRawDateObject
                                                    })

                                                    //DEPRECIATION START DATE
                                                    if (assetDepreciationPeriod == false) {
                                                        FArecord.setValue({
                                                            fieldId: 'custrecord_assetdeprstartdate',
                                                            value: parsedDateStringAsRawDateObject
                                                        });
                                                    }

                                                    if (Boolean(assetDepreciationPeriod) == true) {
                                                        FArecord.setValue({
                                                            fieldId: 'custrecord_assetdeprstartdate',
                                                            value: convertedDate
                                                        })
                                                    }

                                                    //SUPPLIER
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetsupplier',
                                                        value: vendorName
                                                    })
                                                    //PURCHASE ORDER
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetpurchaseorder',
                                                        value: checkForParameter(exPurchaseOrder) == true ? exPurchaseOrder : ''
                                                    })
                                                    //PARENT TRANSACTION
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetsourcetrn',
                                                        value: recId
                                                    })
                                                    //PARENT TRANSACTION LINE
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetsourcetrnline',
                                                        value: i + 1
                                                    })
                                                    //RESIDUAL VALUE
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetresidualvalue',
                                                        value: 0.00
                                                    })
                                                    //DEPRECIATION METHOD
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetaccmethod',
                                                        value: accountingMethod ? accountingMethod : 3
                                                    })

                                                    //Saving Record
                                                    var saved = FArecord.save()
                                                    log.debug("Saved: ", saved)

                                                    //Setting Related Assets
                                                    const a = record.load({
                                                        type: 'vendorbill',
                                                        id: recId,
                                                        isDynamic: true
                                                    })

                                                    a.selectLine({
                                                        sublistId: 'expense',
                                                        line: i
                                                    })
                                                    a.setCurrentSublistValue({
                                                        sublistId: 'expense',
                                                        fieldId: 'custcol_far_trn_relatedasset',
                                                        value: saved,
                                                        line: i
                                                    })
                                                    a.commitLine({
                                                        sublistId: 'expense'
                                                    })
                                                    var z = a.save();
                                                }
                                            }
                                        }
                                    }

                                }
                            }

                            //ITEM LINE

                            if (itemCount > 0) {

                                for (var i = 0; i < itemCount; i++) {

                                    var itmRelRec = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_trn_relatedasset',
                                        line: i
                                    })

                                    var itmItem = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        line: i
                                    })
                                    var itmDescription = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'description',
                                        line: i
                                    })

                                    var itmAssetType = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_asset_types',
                                        line: i
                                    })

                                    var itmAmount = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        line: i
                                    })

                                    var itmExcludeCheckvalue = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_exclude_asset_type',
                                        line: i
                                    })

                                    var itmEmployee = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_employee',
                                        line: i
                                    })
                                    var itmDepartment = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_assettype_department',
                                        line: i
                                    })
                                    var itmClass = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_assettype_class',
                                        line: i
                                    })
                                    var itmLocation = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_assettype_location',
                                        line: i
                                    })
                                    var itmQty = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantity',
                                        line: i
                                    })

                                    var itmPurchaseOrder = rec.getSublistValue({
                                        sublistId: 'purchaseorders',
                                        fieldId: 'poid',
                                        line: i
                                    })

                                    if (checkForParameter(itmAssetType) == true) { // check whether the asset type is null ie; checking the account type is Fixed asset
                                        // if (Boolean(itmExcludeCheckvalue) == false && checkForParameter(itmRelRec) == false) {// check whether the exclude check is not checked and no related asset
                                        if(checkForParameter(itmRelRec) == false){
                                            //Asset Type record
                                            var assettypeRec = record.load({
                                                type: 'customrecord_ncfar_assettype',
                                                id: itmAssetType,
                                                isDynamic: true
                                            })

                                            var assetDepreciationPeriod = assettypeRec.getValue({
                                                fieldId: 'custrecord_assttype_dep_next_period'
                                            })
                                            var accountingMethod = assettypeRec.getValue({
                                                fieldId: 'custrecord_assettypeaccmethod'
                                            })

                                            //Creation of Fixed Asset
                                            var FArecord = record.create({
                                                type: 'customrecord_ncfar_asset',
                                                isDynamic: true
                                            })
                                            //NAME
                                            FArecord.setValue({
                                                fieldId: 'altname',
                                                value: itmDescription ? itmDescription : 'Auto Generated Asset'
                                            })
                                            //ASSET DESCRIPTION
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetdescr',
                                                value: itmDescription ? itmDescription : 'Auto Generated Asset'
                                            })
                                            //ASSET TYPE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assettype',
                                                value: itmAssetType
                                            })
                                            //ASSET ORIGINAL COST
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetcost',
                                                value: itmAmount
                                            })
                                            //ASSET CURRENT COST
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetcurrentcost',
                                                value: itmAmount
                                            })
                                            //CUSTODIAN
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetcaretaker',
                                                value: itmEmployee
                                            })
                                            //DEPARTMENT
                                            FArecord.setValue({
                                                fieldId: 'custrecord_employee_department',
                                                value: itmDepartment
                                            })
                                            //CLASS
                                            FArecord.setValue({
                                                fieldId: 'custrecord_employee_class',
                                                value: itmClass
                                            })
                                            //LOCATION
                                            FArecord.setValue({
                                                fieldId: 'custrecord_employee_location',
                                                value: itmLocation
                                            })
                                            //QUANTITY
                                            FArecord.setValue({
                                                fieldId: 'custrecord_ncfar_quantity',
                                                value: itmQty ? itmQty : 1
                                            })
                                            //SUBSIDIARY
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsubsidiary',
                                                value: subsidary
                                            })
                                            //PURCHASE DATE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetpurchasedate',
                                                value: parsedDateStringAsRawDateObject
                                            })

                                            //DEPRECIATION START DATE
                                            if (Boolean(assetDepreciationPeriod) == false) {
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetdeprstartdate',
                                                    value: parsedDateStringAsRawDateObject
                                                });
                                            }
                                            if (Boolean(assetDepreciationPeriod) == true) {
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetdeprstartdate',
                                                    value: convertedDate
                                                })
                                            }

                                            //SUPPLIER
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsupplier',
                                                value: vendorName
                                            })
                                            //PURCHASE ORDER
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetpurchaseorder',
                                                value: itmPurchaseOrder ? itmPurchaseOrder: ''
                                            })
                                            //PARENT TRANSACTION
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsourcetrn',
                                                value: recId
                                            })
                                            //PARENT TRANSACTION LINE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsourcetrnline',
                                                value: i + 1
                                            })
                                            //RESIDUAL VALUE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetresidualvalue',
                                                value: 0.00
                                            })
                                            //DEPRECIATION METHOD
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetaccmethod',
                                                value: accountingMethod ? accountingMethod : 3
                                            })

                                            //Saving Record
                                            var saved = FArecord.save()
                                            log.debug("Item FA Saved: ", saved)

                                            //Setting Related Assets
                                            const a = record.load({
                                                type: 'vendorbill',
                                                id: recId,
                                                isDynamic: true
                                            })

                                            a.selectLine({
                                                sublistId: 'item',
                                                line: i
                                            })
                                            a.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'custcol_far_trn_relatedasset',
                                                value: saved,
                                                line: i
                                            })
                                            a.commitLine({
                                                sublistId: 'item'
                                            })
                                            var z = a.save();

                                        }
                                    }

                                }

                            }
                        }
                    }

                    //Create Context
                    if(scriptContext.type == 'create') {

                        var ex = rec.getLineCount({
                            sublistId: 'expense'
                        })

                        var item = rec.getLineCount({
                            sublistId: 'item'
                        })

                        if (totalCount<10) {

                            var subsidary = rec.getValue({
                                fieldId: 'subsidiary'
                            })
                            var transDate = rec.getValue({
                                fieldId: 'trandate'
                            })
                            var vendorName = rec.getValue({
                                fieldId: 'entity'
                            })

                            var initialFormattedDateString = convertDate(transDate);
                            var parsedDateStringAsRawDateObject = format.parse({
                                value: initialFormattedDateString,
                                type: format.Type.DATE
                            });

                            var convertedDate = dateCreator()

                            //Sublist Section

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> EXPENSE LINE <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

                            if (ex > 0) {
                                for (var i = 0; i < ex; i++) {
                                    var exAcc = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'account',
                                        line: i
                                    })
                                    var exAsset = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_asset_type',
                                        line: i
                                    })
                                    var excludeCheck = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_exclude_asset_type',
                                        line: i
                                    })
                                    var exMemo = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'memo',
                                        line: i
                                    })
                                    var exAmount = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'amount',
                                        line: i
                                    })
                                    var exEmployee = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_employee',
                                        line: i
                                    })
                                    if(checkForParameter(exEmployee)==true) {
                                        var exDepartment = rec.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'custcol_assettype_department',
                                            line: i
                                        })
                                        var exClass = rec.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'custcol_assettype_class',
                                            line: i
                                        })
                                        var exLocation = rec.getSublistValue({
                                            sublistId: 'expense',
                                            fieldId: 'custcol_assettype_location',
                                            line: i
                                        })
                                    }
                                    var exQty = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_expense_quantity',
                                        line: i
                                    })

                                    var exPurchaseOrder = rec.getSublistValue({
                                        sublistId: 'purchaseorders',
                                        fieldId: 'poid',
                                        line: i
                                    })

                                    //Account Record
                                    var accountRec = record.load({
                                        type: record.Type.ACCOUNT,
                                        id: exAcc,
                                        isDynamic: true
                                    })

                                    var accType = accountRec.getValue({
                                        fieldId: 'accttype'
                                    })

                                    if (accType == 'FixedAsset') { // if the account type is Fixed Asset

                                        // if ((checkForParameter(exAsset)) && (Boolean(excludeCheck) == false)) { // if asset type is not null, So the check value can be either true or false. It doesn't matter for the creation of fixed asset record
                                        if(checkForParameter(exAsset) == true){
                                            //Asset type Record
                                            var assettypeRec = record.load({
                                                type: 'customrecord_ncfar_assettype',
                                                id: exAsset,
                                                isDynamic: true
                                            })
                                            var assetDepreciationPeriod = assettypeRec.getValue({
                                                fieldId: 'custrecord_assttype_dep_next_period'
                                            })
                                            var accountingMethod = assettypeRec.getValue({
                                                fieldId: 'custrecord_assettypeaccmethod'
                                            })

                                            //Creation of Fixed Asset
                                            var FArecord = record.create({
                                                type: 'customrecord_ncfar_asset',
                                                isDynamic: true
                                            })
                                            //NAME
                                            FArecord.setValue({
                                                fieldId: 'altname',
                                                value: exMemo ? exMemo : 'Auto Generated Asset'
                                            })
                                            //ASSET DESCRIPTION
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetdescr',
                                                value: exMemo ? exMemo : 'Auto Generated Asset'
                                            })
                                            //ASSET TYPE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assettype',
                                                value: exAsset
                                            })
                                            //ASSET ORIGINAL COST
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetcost',
                                                value: exAmount
                                            })
                                            //ASSET CURRENT COST
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetcurrentcost',
                                                value: exAmount
                                            })
                                            //CUSTODIAN
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetcaretaker',
                                                value: exEmployee
                                            })
                                            //DEPARTMENT
                                            FArecord.setValue({
                                                fieldId: 'custrecord_employee_department',
                                                value: exDepartment
                                            })
                                            //CLASS
                                            FArecord.setValue({
                                                fieldId: 'custrecord_employee_class',
                                                value: exClass
                                            })
                                            //LOCATION
                                            FArecord.setValue({
                                                fieldId: 'custrecord_employee_location',
                                                value: exLocation
                                            })
                                            //QUANTITY
                                            FArecord.setValue({
                                                fieldId: 'custrecord_ncfar_quantity',
                                                value: exQty ? exQty : 1
                                            })
                                            //SUBSIDIARY
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsubsidiary',
                                                value: subsidary
                                            })
                                            //PURCHASE DATE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetpurchasedate',
                                                value: parsedDateStringAsRawDateObject
                                            })

                                            //DEPRECIATION START DATE
                                            if (assetDepreciationPeriod == false) {
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetdeprstartdate',
                                                    value: parsedDateStringAsRawDateObject
                                                });
                                            }
                                            if (Boolean(assetDepreciationPeriod) == true) {
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetdeprstartdate',
                                                    value: convertedDate
                                                })
                                            }

                                            //SUPPLIER
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsupplier',
                                                value: vendorName
                                            })
                                            //PURCHASE ORDER
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetpurchaseorder',
                                                value: checkForParameter(exPurchaseOrder) == true ? exPurchaseOrder: ''
                                            })
                                            //PARENT TRANSACTION
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsourcetrn',
                                                value: recId
                                            })
                                            //PARENT TRANSACTION LINE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetsourcetrnline',
                                                value: i + 1
                                            })
                                            //RESIDUAL VALUE
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetresidualvalue',
                                                value: 0.00
                                            })
                                            //DEPRECIATION METHOD
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetaccmethod',
                                                value: accountingMethod ? accountingMethod : 3
                                            })

                                            //Saving Record
                                            var saved = FArecord.save({
                                                enableSourcing: true
                                            })
                                            log.debug("Saved: ", saved)

                                            //Setting Related Assets
                                            const a = record.load({
                                                type: 'vendorbill',
                                                id: recId,
                                                isDynamic: true
                                            })

                                            a.selectLine({
                                                sublistId: 'expense',
                                                line: i
                                            })
                                            a.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'custcol_far_trn_relatedasset',
                                                value: saved,
                                                line: i
                                            })
                                            a.commitLine({
                                                sublistId: 'expense'
                                            })
                                            var z = a.save();

                                        }

                                    }

                                }

                            }// End of if(ex>0)
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ITEM LINE <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

                            if (item > 0) {
                                for (var i = 0; i < item; i++) {

                                    var itmItem = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'item',
                                        line: i
                                    })
                                    var itmDescription = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'description',
                                        line: i
                                    })

                                    var itmAssetType = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_asset_types',
                                        line: i
                                    })

                                    var itmAmount = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'amount',
                                        line: i
                                    })

                                    var itmExcludeCheckvalue = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_exclude_asset_type',
                                        line: i
                                    })
                                    var itmEmployee = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_employee',
                                        line: i
                                    })
                                    if(checkForParameter(itmEmployee)==true) {
                                        var itmDepartment = rec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_assettype_department',
                                            line: i
                                        })
                                        var itmClass = rec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_assettype_class',
                                            line: i
                                        })
                                        var itmLocation = rec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_assettype_location',
                                            line: i
                                        })
                                        var itmQty = rec.getSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'quantity',
                                            line: i
                                        })

                                        var itmPurchaseOrder = rec.getSublistValue({
                                            sublistId: 'purchaseorders',
                                            fieldId: 'poid',
                                            line: i
                                        })
                                    }

                                    // if (checkForParameter(itmAssetType) && (Boolean(itmExcludeCheckvalue) == false)) { // check whether the asset type is null ie; checking the account type is Fixed asset
                                    if(checkForParameter(itmAssetType)){
                                        // if (Boolean(itmExcludeCheckvalue) == false) {

                                        //Asset Type record
                                        var assettypeRec = record.load({
                                            type: 'customrecord_ncfar_assettype',
                                            id: itmAssetType,
                                            isDynamic: true
                                        })

                                        var assetDepreciationPeriod = assettypeRec.getValue({
                                            fieldId: 'custrecord_assttype_dep_next_period'
                                        })
                                        var accountingMethod = assettypeRec.getValue({
                                            fieldId: 'custrecord_assettypeaccmethod'
                                        })

                                        //Creation of Fixed Asset
                                        var FArecord = record.create({
                                            type: 'customrecord_ncfar_asset',
                                            isDynamic: true
                                        })
                                        //NAME
                                        FArecord.setValue({
                                            fieldId: 'altname',
                                            value: itmDescription ? itmDescription : 'Auto Generated Asset'
                                        })
                                        //ASSET DESCRIPTION
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetdescr',
                                            value: itmDescription ? itmDescription : 'Auto Generated Asset'
                                        })
                                        //ASSET TYPE
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assettype',
                                            value: itmAssetType
                                        })
                                        //ASSET ORIGINAL COST
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetcost',
                                            value: itmAmount
                                        })
                                        //ASSET CURRENT COST
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetcurrentcost',
                                            value: itmAmount
                                        })
                                        //CUSTODIAN
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetcaretaker',
                                            value: itmEmployee
                                        })
                                        //DEPARTMENT
                                        FArecord.setValue({
                                            fieldId: 'custrecord_employee_department',
                                            value: itmDepartment
                                        })
                                        //CLASS
                                        FArecord.setValue({
                                            fieldId: 'custrecord_employee_class',
                                            value: itmClass
                                        })
                                        //LOCATION
                                        FArecord.setValue({
                                            fieldId: 'custrecord_employee_location',
                                            value: itmLocation
                                        })
                                        //QUANTITY
                                        FArecord.setValue({
                                            fieldId: 'custrecord_ncfar_quantity',
                                            value: itmQty ? itmQty : 1
                                        })
                                        //SUBSIDIARY
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetsubsidiary',
                                            value: subsidary
                                        })
                                        //PURCHASE DATE
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetpurchasedate',
                                            value: parsedDateStringAsRawDateObject
                                        })

                                        //DEPRECIATION START DATE
                                        if (Boolean(assetDepreciationPeriod) == false) {
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetdeprstartdate',
                                                value: parsedDateStringAsRawDateObject
                                            });
                                        }
                                        if (Boolean(assetDepreciationPeriod) == true) {
                                            FArecord.setValue({
                                                fieldId: 'custrecord_assetdeprstartdate',
                                                value: convertedDate
                                            })
                                        }

                                        //SUPPLIER
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetsupplier',
                                            value: vendorName
                                        })
                                        //PURCHASE ORDER
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetpurchaseorder',
                                            value: itmPurchaseOrder? itmPurchaseOrder: ''
                                        })
                                        //PARENT TRANSACTION
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetsourcetrn',
                                            value: recId
                                        })
                                        //PARENT TRANSACTION LINE
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetsourcetrnline',
                                            value: i + 1
                                        })
                                        //RESIDUAL VALUE
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetresidualvalue',
                                            value: 0.00
                                        })
                                        //DEPRECIATION METHOD
                                        FArecord.setValue({
                                            fieldId: 'custrecord_assetaccmethod',
                                            value: accountingMethod ? accountingMethod : 3
                                        })

                                        //Saving Record
                                        var saved = FArecord.save()
                                        log.debug("Item FA Saved: ", saved)

                                        //Setting Related Assets
                                        const a = record.load({
                                            type: 'vendorbill',
                                            id: recId,
                                            isDynamic: true
                                        })

                                        a.selectLine({
                                            sublistId: 'item',
                                            line: i
                                        })
                                        a.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_far_trn_relatedasset',
                                            value: saved,
                                            line: i
                                        })
                                        a.commitLine({
                                            sublistId: 'item'
                                        })
                                        var z = a.save();

                                        // }
                                    }
                                }// End of for loop
                            } // End of if(item>0)
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

                        }
                    }// End of if(context == create)
                }

                //JOURNAL SECTION
                if(recType == 'journalentry'){

                    let totalCount = transactionSearch(recId)

                    //edit context
                    if(scriptContext.type == 'edit'){

                        var journalCount = rec.getLineCount({
                            sublistId: 'line'
                        })

                        if(totalCount<10) {

                            var subsidary = rec.getValue({
                                fieldId: 'subsidiary'
                            })
                            var transDate = rec.getValue({
                                fieldId: 'trandate'
                            })

                            var initialFormattedDateString = convertDate(transDate);
                            var parsedDateStringAsRawDateObject = format.parse({
                                value: initialFormattedDateString,
                                type: format.Type.DATE
                            });

                            var convertedDate = dateCreator()

                            //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> JOURNAL LINE <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

                            if (journalCount > 0) {
                                for (var i = 0; i < journalCount; i++) {
                                    var jRelRec = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_trn_relatedasset',
                                        line: i
                                    })
                                    var jAcc = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        line: i
                                    })
                                    var jAsset = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_asset_type',
                                        line: i
                                    })
                                    var excludeCheck = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_exclude_asset_type',
                                        line: i
                                    })
                                    var jMemo = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'memo',
                                        line: i
                                    })
                                    var jAmount = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'debit',
                                        line: i
                                    })
                                    var jEmployee = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_employee',
                                        line: i
                                    })
                                    if(checkForParameter(jEmployee)==true) {
                                        var jDepartment = rec.getSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'custcol_assettype_department',
                                            line: i
                                        })
                                        var jClass = rec.getSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'custcol_assettype_class',
                                            line: i
                                        })
                                        var jLocation = rec.getSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'custcol_assettype_location',
                                            line: i
                                        })
                                    }

                                    //Account Record
                                    var accountRec = record.load({
                                        type: record.Type.ACCOUNT,
                                        id: jAcc,
                                        isDynamic: true
                                    })

                                    var accType = accountRec.getValue({
                                        fieldId: 'accttype'
                                    })


                                    if (accType == 'FixedAsset') { // if the account type is Fixed Asset

                                        if (checkForParameter(jAsset) == true && checkForParameter(jAmount)==true) { // if asset type is not null
                                            // if (Boolean(excludeCheck) == false && checkForParameter(jRelRec) == false) { // check whether exclude FA checkbox is not checked and related asset are empty
                                            if(checkForParameter(jRelRec) == false){
                                                //Asset type Record
                                                var assettypeRec = record.load({
                                                    type: 'customrecord_ncfar_assettype',
                                                    id: jAsset,
                                                    isDynamic: true
                                                })
                                                if(checkForParameter(assettypeRec)==true) {
                                                    var assetDepreciationPeriod = assettypeRec.getValue({
                                                        fieldId: 'custrecord_assttype_dep_next_period'
                                                    })
                                                    var accountingMethod = assettypeRec.getValue({
                                                        fieldId: 'custrecord_assettypeaccmethod'
                                                    })
                                                }

                                                //Creation of Fixed Asset
                                                var FArecord = record.create({
                                                    type: 'customrecord_ncfar_asset',
                                                    isDynamic: true
                                                })
                                                //NAME
                                                FArecord.setValue({
                                                    fieldId: 'altname',
                                                    value: jMemo ? jMemo : 'Auto Generated Asset'
                                                })
                                                //ASSET DESCRIPTION
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetdescr',
                                                    value: jMemo ? jMemo : 'Auto Generated Asset'
                                                })
                                                //ASSET TYPE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assettype',
                                                    value: jAsset
                                                })
                                                //ASSET ORIGINAL COST
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetcost',
                                                    value: jAmount
                                                })
                                                //ASSET CURRENT COST
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetcurrentcost',
                                                    value: jAmount
                                                })
                                                //CUSTODIAN
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetcaretaker',
                                                    value: jEmployee
                                                })
                                                //DEPARTMENT
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_employee_department',
                                                    value: jDepartment
                                                })
                                                //CLASS
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_employee_class',
                                                    value: jClass
                                                })
                                                //LOCATION
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_employee_location',
                                                    value: jLocation
                                                })
                                                //SUBSIDIARY
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetsubsidiary',
                                                    value: subsidary
                                                })
                                                //PURCHASE DATE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetpurchasedate',
                                                    value: parsedDateStringAsRawDateObject
                                                })

                                                //DEPRECIATION START DATE
                                                if (Boolean(assetDepreciationPeriod) == false) {
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetdeprstartdate',
                                                        value: parsedDateStringAsRawDateObject
                                                    });
                                                }
                                                if (Boolean(assetDepreciationPeriod) == true) {
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetdeprstartdate',
                                                        value: convertedDate
                                                    })
                                                }
                                                //PARENT TRANSACTION
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetsourcetrn',
                                                    value: recId
                                                })
                                                //PARENT TRANSACTION LINE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetsourcetrnline',
                                                    value: i + 1
                                                })
                                                //RESIDUAL VALUE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetresidualvalue',
                                                    value: 0.00
                                                })
                                                //DEPRECIATION METHOD
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetaccmethod',
                                                    value: accountingMethod ? accountingMethod : 3
                                                })

                                                //Saving Record
                                                var saved = FArecord.save()
                                                log.debug("jSaved: ", saved)

                                                //Setting Related Assets
                                                const a = record.load({
                                                    type: 'journalentry',
                                                    id: recId,
                                                    isDynamic: true
                                                })

                                                a.selectLine({
                                                    sublistId: 'line',
                                                    line: i
                                                })
                                                a.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'custcol_far_trn_relatedasset',
                                                    value: saved,
                                                    line: i
                                                })
                                                a.commitLine({
                                                    sublistId: 'line'
                                                })
                                                var z = a.save();
                                            }
                                        }
                                    }
                                }

                            }// End of if(journalCount>0)
                        }// end of count<100
                    }

                    //create context
                    if(scriptContext.type == 'create'){

                        var journalCount = rec.getLineCount({
                            sublistId: 'line'
                        })
                        if(totalCount<10) {

                            var subsidary = rec.getValue({
                                fieldId: 'subsidiary'
                            })
                            var transDate = rec.getValue({
                                fieldId: 'trandate'
                            })

                            var initialFormattedDateString = convertDate(transDate);
                            var parsedDateStringAsRawDateObject = format.parse({
                                value: initialFormattedDateString,
                                type: format.Type.DATE
                            });

                            var convertedDate = dateCreator()

                            //>>>>>>>>>>>>>>>>>>>>>>>>>>>> JOURNAL LINE <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

                            if (journalCount > 0) {
                                for (var i = 0; i < journalCount; i++) {
                                    var jAcc = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'account',
                                        line: i
                                    })
                                    var jAsset = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_asset_type',
                                        line: i
                                    })
                                    var excludeCheck = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_exclude_asset_type',
                                        line: i
                                    })
                                    var jMemo = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'memo',
                                        line: i
                                    })
                                    var jAmount = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'debit',
                                        line: i
                                    })
                                    var jEmployee = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_employee',
                                        line: i
                                    })
                                    if(checkForParameter(jEmployee)==true) {
                                        var jDepartment = rec.getSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'custcol_assettype_department',
                                            line: i
                                        })
                                        var jClass = rec.getSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'custcol_assettype_class',
                                            line: i
                                        })
                                        var jLocation = rec.getSublistValue({
                                            sublistId: 'line',
                                            fieldId: 'custcol_assettype_location',
                                            line: i
                                        })
                                    }

                                    //Account Record
                                    var accountRec = record.load({
                                        type: record.Type.ACCOUNT,
                                        id: jAcc,
                                        isDynamic: true
                                    })

                                    var accType = accountRec.getValue({
                                        fieldId: 'accttype'
                                    })

                                    if (accType == 'FixedAsset') { // if the account type is Fixed Asset
                                        if (checkForParameter(jAsset) == true && checkForParameter(jAmount)==true) { // if asset type is not null
                                            // if (Boolean(excludeCheck) == false && checkForParameter(jRelRec) == false) { // check whether exclude FA checkbox is not checked and related asset are empty
                                            if(checkForParameter(jRelRec) == false){
                                                //Asset type Record
                                                var assettypeRec = record.load({
                                                    type: 'customrecord_ncfar_assettype',
                                                    id: jAsset,
                                                    isDynamic: true
                                                })
                                                var assetDepreciationPeriod = assettypeRec.getValue({
                                                    fieldId: 'custrecord_assttype_dep_next_period'
                                                })
                                                var accountingMethod = assettypeRec.getValue({
                                                    fieldId: 'custrecord_assettypeaccmethod'
                                                })

                                                //Creation of Fixed Asset
                                                var FArecord = record.create({
                                                    type: 'customrecord_ncfar_asset',
                                                    isDynamic: true
                                                })
                                                //NAME
                                                FArecord.setValue({
                                                    fieldId: 'altname',
                                                    value: jMemo ? jMemo : 'Auto Generated Asset'
                                                })
                                                //ASSET DESCRIPTION
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetdescr',
                                                    value: jMemo ? jMemo : 'Auto Generated Asset'
                                                })
                                                //ASSET TYPE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assettype',
                                                    value: jAsset
                                                })
                                                //ASSET ORIGINAL COST
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetcost',
                                                    value: jAmount
                                                })
                                                //ASSET CURRENT COST
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetcurrentcost',
                                                    value: jAmount
                                                })
                                                //CUSTODIAN
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetcaretaker',
                                                    value: jEmployee
                                                })
                                                //DEPARTMENT
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_employee_department',
                                                    value: jDepartment
                                                })
                                                //CLASS
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_employee_class',
                                                    value: jClass
                                                })
                                                //LOCATION
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_employee_location',
                                                    value: jLocation
                                                })
                                                //SUBSIDIARY
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetsubsidiary',
                                                    value: subsidary
                                                })
                                                //PURCHASE DATE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetpurchasedate',
                                                    value: parsedDateStringAsRawDateObject
                                                })

                                                //DEPRECIATION START DATE
                                                if (Boolean(assetDepreciationPeriod) == false) {
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetdeprstartdate',
                                                        value: parsedDateStringAsRawDateObject
                                                    });
                                                }
                                                if (Boolean(assetDepreciationPeriod) == true) {
                                                    FArecord.setValue({
                                                        fieldId: 'custrecord_assetdeprstartdate',
                                                        value: convertedDate
                                                    })
                                                }

                                                //PARENT TRANSACTION
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetsourcetrn',
                                                    value: recId
                                                })
                                                //PARENT TRANSACTION LINE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetsourcetrnline',
                                                    value: i + 1
                                                })
                                                //RESIDUAL VALUE
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetresidualvalue',
                                                    value: 0.00
                                                })
                                                //DEPRECIATION METHOD
                                                FArecord.setValue({
                                                    fieldId: 'custrecord_assetaccmethod',
                                                    value: accountingMethod ? accountingMethod : 3
                                                })

                                                //Saving Record
                                                var saved = FArecord.save()
                                                log.debug("jSaved: ", saved)

                                                //Setting Related Assets
                                                const a = record.load({
                                                    type: 'journalentry',
                                                    id: recId,
                                                    isDynamic: true
                                                })

                                                a.selectLine({
                                                    sublistId: 'line',
                                                    line: i
                                                })
                                                a.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'custcol_far_trn_relatedasset',
                                                    value: saved,
                                                    line: i
                                                })
                                                a.commitLine({
                                                    sublistId: 'line'
                                                })
                                                var z = a.save();

                                            }
                                        }

                                    }

                                }

                            }// End of if(journalCount>0)
                        }
                    }
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ ",
                    details: e.name+" : "+e.message
                })
            }

            try{
                if(scriptContext.type == 'create' || 'edit'){
                    var rec = scriptContext.newRecord
                    var recId = rec.id
                    var recType = rec.type
                    log.debug("recId: ",recId)
                    log.debug("recType: ",recType)

                    var scriptObj = runtime.getCurrentScript();
                    if((recType == 'vendorbill') || (recType == 'journalentry')){

                        var resArr = transactionSearchScheduling(recId);
                        log.debug("RESULT: ",resArr)
                        log.debug("Length: ",resArr.length)
                        if(resArr.length>0){
                            var remaingUsage = scriptObj.getRemainingUsage()

                            for(var i=0;i<resArr.length;i++){
                                log.debug("LOOP: ",i)

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
                                rescheduleScriptandReturn()
                            }
                        }

                    }
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ Scheduling After submit: ",
                    details: e.name+' : '+e.message
                })
            }

        }

        return {beforeLoad, afterSubmit}

    });