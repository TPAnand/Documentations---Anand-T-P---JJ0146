/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/email', 'N/error', 'N/record', 'N/search','N/runtime','N/currentRecord','N/format'],
    /**
     * @param{email} email
     * @param{error} error
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     * @param{currentRecord} currentRecord
     * @param{format} format
     */
    (email, error, record, search,runtime,currentRecord, format) => {

        /**
         * Function to check whether the field has an empty value or not.
         * @param {parameter} parameter - fieldValue
         * @returns {boolean} true - if the value is not empty
         * @returns {boolean} false - if the value is empty
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
         * Function to convert date to dateString format.
         * @param {Date} iDate - Date fieldValue
         * @returns {string} res - converted DateString
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
                log.debug("Error in Date function: ",e.name+': ',e.message)
            }
        }

        /**
         * Function to list vendor bills / journals which has pending FA lines.
         * @param {string} id - record ID
         * @returns [{obj}] resArr - array of Object, which contains Count of lines, record Id and Record type of each record which has no related Records. ie; lines which hasn't Fixed asset
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
            log.debug("TRANSACTION SEARCH count",searchResultCount);
            var resArr = [];
            transactionSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var recType = result.getValue({
                    name: "type",
                    summary: "GROUP"
                })
                var recId = result.getValue({
                    name: "internalid",
                    summary: "GROUP"
                })
                var lCount = result.getValue({
                    name: "lineuniquekey",
                    summary: "COUNT"
                })
                resArr.push({
                    recType: recType,
                    recId: recId,
                    lCount: lCount
                })
                return true;
            });
            log.debug("RES ARR: ",resArr)
            return resArr
        }

        function FAtraversal(FAlist) {
            try{
                if(FAlist.length>0){
                    FAlist.forEach((res)=>{
                        log.debug("EACH: ",res+"\n");
                        return res+"\n"
                    })
                }
            }
            catch (e) {
                log.debug("Error @ FA traversal: ",e.name+" : "+e.message)
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
                var param = runtime.getCurrentScript();
                var k = param.getParameter({name: 'custscript_email_param'});
                log.debug("PARAM: ",k)
                FACreation(k)
            }
            catch (e) {
                log.debug("Error @ Scheduled : ",e.name+" : "+e.message)
            }
        }

        /**
         * The function calls functions for Fixed Asset creation in journal and Vendor Bill.
         * @param {string} param - ScriptParameter which contains the internal ID of the Email Recipient
         */
        function FACreation(param) {
            try{
                var paramContext = param
                journalFACreation(paramContext)
                vendorFACreation(paramContext)
            }
            catch (e) {
                log.debug("Error @ FACreation: ",e.name+" : "+e.message)
            }
        }

        /**
         * The function creates Fixed Asset for journals.
         */
        function journalFACreation(paramContext) {
            try{
                var jRes = transactionSearch()
                var journalRes = jRes.filter(res => res.recType == 'Journal');
                if(journalRes.length>0){
                    for(var j=0;j<journalRes.length;j++) {
                        var recId = journalRes[j].recId
                        log.debug("Item in " + j + " th line: ", recId)
                        var journalCount = journalRes[j].lCount;
                        log.debug("Journal AC LineCount: ", journalCount)
                        if (journalCount >= 10) {
                            var rec = record.load({
                                type: 'journalentry',
                                id: recId,
                                isDynamic: true
                            })

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

                            var lineCount = rec.getLineCount({
                                sublistId: 'line'
                            })
                            log.debug("Journal lineCount: ", lineCount)

                            var journalFA = [];

                            if (lineCount > 0) {
                                for (var i = 0; i < lineCount; i++) {
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
                                    var jRelRec = rec.getSublistValue({
                                        sublistId: 'line',
                                        fieldId: 'custcol_far_trn_relatedasset',
                                        line: i
                                    })

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
                                        if (checkForParameter(jAsset) == true) { // if asset type is not null
                                            // if ((checkForParameter(jRelRec) == false) && (Boolean(excludeCheck) == false)) { // if related record is null and exclude check is false
                                            if ((checkForParameter(jRelRec) == false)){
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
                                                journalFA.push(saved)

                                                //Setting Related Assets
                                                const updateRec = record.load({
                                                    type: 'journalentry',
                                                    id: recId,
                                                    isDynamic: true
                                                })

                                                updateRec.selectLine({
                                                    sublistId: 'line',
                                                    line: i
                                                })
                                                updateRec.setCurrentSublistValue({
                                                    sublistId: 'line',
                                                    fieldId: 'custcol_far_trn_relatedasset',
                                                    value: saved,
                                                    line: i
                                                })
                                                updateRec.commitLine({
                                                    sublistId: 'line'
                                                })
                                                var saved = updateRec.save();
                                                log.debug("saved: ", saved)

                                            }
                                        }
                                    }
                                }
                                log.debug("SENDING EMAIL",journalFA)
                                if(journalFA.length>0) {
                                    email.send({
                                        author: paramContext,
                                        recipients: paramContext,
                                        subject: 'Fixed Asset Created from Journal',
                                        body: 'Hi,' + '\n' + " Fixed Assets are created from Journal " + '\n'
                                        //     + journalFA.forEach((res)=>{
                                        //     return res+'\n'
                                        // })
                                    })
                                    log.debug("SEND EMAIL")
                                }

                            }// End of if(journalCount>0)
                        }
                    }
                }
            }
            catch (e) {
                log.debug("Error @ journalFACreation: ", e.name+": "+e.message)
            }
        }

        /**
         * The function creates Fixed Asset for Vendor Bills.
         */
        function vendorFACreation(paramContext){
            try{
                var vRes = transactionSearch()
                var vendorRes = vRes.filter(res => res.recType == 'VendBill')
                log.debug("vendorRes: ",vendorRes)

                if(vendorRes.length>0){
                    for(var j=0;j<vendorRes.length;j++) {
                        log.debug("EXECUTING LINE: ", j)

                        var totalCount = vendorRes[j].lCount
                        log.debug("TOT COunt: ", totalCount)

                        if (totalCount >= 10) {
                            var rec = record.load({
                                type: 'vendorbill',
                                id: vendorRes[j].recId,
                                isDynamic: true
                            })

                            var recId = vendorRes[j].recId
                            var ex = rec.getLineCount({
                                sublistId: 'expense'
                            })
                            var item = rec.getLineCount({
                                sublistId: 'item'
                            })

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

                            //EXPENSE
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
                                    var relRec = rec.getSublistValue({
                                        sublistId: 'expense',
                                        fieldId: 'custcol_far_trn_relatedasset',
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

                                        // if ((checkForParameter(relRec)==false) && (Boolean(excludeCheck) == false)) { // if asset type is not null, So the check value can be either true or false. It doesn't matter for the creation of fixed asset record
                                        if ((checkForParameter(relRec)==false)){
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
                                                value: ''
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
                                            const vendRec = record.load({
                                                type: 'vendorbill',
                                                id: recId,
                                                isDynamic: true
                                            })

                                            vendRec.selectLine({
                                                sublistId: 'expense',
                                                line: i
                                            })
                                            vendRec.setCurrentSublistValue({
                                                sublistId: 'expense',
                                                fieldId: 'custcol_far_trn_relatedasset',
                                                value: saved,
                                                line: i
                                            })
                                            vendRec.commitLine({
                                                sublistId: 'expense'
                                            })
                                            var z = vendRec.save();
                                            log.debug("sd: ", z)
                                        }
                                    }
                                }
                            }// End of if(ex>0)

                            //ITEM
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
                                    var itmRelRec = rec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_far_trn_relatedasset',
                                        line: i
                                    })

                                    // if (checkForParameter(itmRelRec) == false && (Boolean(itmExcludeCheckvalue) == false)) { // check whether the asset type is null ie; checking the account type is Fixed asset
                                    if (checkForParameter(itmRelRec) == false){
                                        //Asset Type record
                                        var assettypeRec = record.load({
                                            type: 'customrecord_ncfar_assettype',
                                            id: itmAssetType,
                                            isDynamic: true
                                        })

                                        var assetDepreciationPeriod = assettypeRec.getValue({
                                            fieldId: 'custrecord_assttype_dep_next_period'
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
                                            value: ''
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
                                            value: 3
                                        })

                                        //Saving Record
                                        var saved = FArecord.save()
                                        log.debug("Item FA Saved: ", saved)

                                        //Setting Related Assets
                                        const vendRec = record.load({
                                            type: 'vendorbill',
                                            id: recId,
                                            isDynamic: true
                                        })

                                        vendRec.selectLine({
                                            sublistId: 'item',
                                            line: i
                                        })
                                        vendRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_far_trn_relatedasset',
                                            value: saved,
                                            line: i
                                        })
                                        vendRec.commitLine({
                                            sublistId: 'item'
                                        })
                                        var z = vendRec.save();
                                        log.debug("Linesd: ", z)
                                    }

                                }// End of for loop
                            } // End of if(item>0)
                        }

                    }
                }
                log.debug("SENDING EMAIL")
                email.send({
                    author: 3154881,
                    recipients: 3154881,
                    subject: 'Fixed Assets created from Vendor Bill',
                    body: 'Hi,' + '\n' + " Fixed Assets are created from Vendor Bill "
                })
                log.debug("SEND EMAIL")
            }
            catch (e) {
                log.debug("Error @ vendorFACreation: ",e.name+": "+e.message)
            }
        }

        return {execute}

    });
