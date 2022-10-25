/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/url', 'N/currentRecord', 'N/runtime', 'N/format'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{url} url
     */
    function (record, search, url, currentRecord, runtime, format) {

        function pageInit(scriptContext) {
            console.log("connect")

            //jQuery("#custpage_category_popup_link").prop("onclick", null).off("click");

        }

        function salestaxSearch() {

            var salestaxitemSearchObj = search.create({
                type: "salestaxitem",
                filters:
                    [
                        ["subsidiary", "anyof", "91"],
                        "AND",
                        ["country", "anyof", "IN"],
                        "AND",
                        ["availableon", "anyof", "SALE", "BOTH"],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({ name: "internalid", label: "InternalID" }),
                        search.createColumn({ name: "rate", label: "Rate" })
                    ]
            });
            var searchResultCounttax = salestaxitemSearchObj.runPaged().count;
            log.debug("salestaxitemSearchObj result count", searchResultCounttax);


            var taxrateArray = [];
            salestaxitemSearchObj.run().each(function (result) {
                var taxcodeValue = result.getValue(salestaxitemSearchObj.columns[1]);
                var taxrateValue = result.getValue(salestaxitemSearchObj.columns[2]);
                var taxObj = { id: taxcodeValue, value: taxrateValue };
                taxrateArray.push(taxObj)
                return true;
            });
            return taxrateArray;
        }

        function fieldChanged(scriptContext) {
            try {

                console.log("scriptContext", runtime.executionContext);
                if (scriptContext.sublistId == 'custpage_expenseanditems') {
                    console.log("enter if sublist", " enter if sublist");
                    if (scriptContext.fieldId == 'custpage_taxcode' || scriptContext.fieldId == 'custpage_amount1') {
                        console.log("enter if field", " enter if field");
                        var currentRecord = scriptContext.currentRecord;
                        var userId = runtime.getCurrentUser().id;
                        console.log("userId", userId);
                        var lineCount = currentRecord.getLineCount({
                            sublistId: 'custpage_expenseanditems'
                        })
                        console.log("lineCount", lineCount);

                        // var taxRateValue = salestaxSearch();
                        // console.log("taxratevalue", taxRateValue);

                        var taxRate_from_sl = currentRecord.getValue({ fieldId: 'custpage_taxcoderate_hidden' });
                        console.log("taxRate_from_sl", taxRate_from_sl);
                        if (taxRate_from_sl != null && taxRate_from_sl != undefined && taxRate_from_sl != "") {
                            var taxcodeRateParsed = JSON.parse(taxRate_from_sl);

                            console.log("taxcodeRateParsed", taxcodeRateParsed);
                            console.log("taxcodeval", taxcodeRateParsed[0].value);
                            console.log(" taxcodeRateParsed.length", taxcodeRateParsed.length);
                            //  if(gettaxCode != null ||  gettaxCode != undefined || gettaxCode != "" ){
                            console.log("enter if loop", "enter if loop");

                            for (var i = 0; i < taxcodeRateParsed.length; i++) {
                                var gettaxCode = currentRecord.getCurrentSublistValue({
                                    sublistId: 'custpage_expenseanditems',
                                    fieldId: 'custpage_taxcode'
                                });
                                console.log("gettaxCode", gettaxCode);
                                console.log("taxRateValue[i].value", taxcodeRateParsed[i].value);
                                console.log("taxRateValue[i].id", taxcodeRateParsed[i].id);

                                // if(taxcodeRateParsed[i].value)
                                //    for (var j = 0; j < taxRateValue.length; j++) {
                                // if(taxRate_from_sl == null &&  taxRate_from_sl == undefined && taxRate_from_sl == "" ){

                                if (gettaxCode == taxcodeRateParsed[i].id) {
                                    console.log("taxRate_from_sl[i].id inside", taxcodeRateParsed[i].value);
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_taxrate',
                                        value: taxcodeRateParsed[i].value
                                    });
                                    // break;
                                }
                                //  }

                                var getAmount = currentRecord.getCurrentSublistValue({
                                    sublistId: 'custpage_expenseanditems',
                                    fieldId: 'custpage_amount1'
                                });

                                var gettaxrate = currentRecord.getCurrentSublistValue({
                                    sublistId: 'custpage_expenseanditems',
                                    fieldId: 'custpage_taxrate'
                                });
                                // console.log("getAmount", getAmount);
                                //  console.log("gettaxrate", gettaxrate);
                                var index = gettaxrate.split('%');
                                // console.log("index", index[0]);
                                var taxamtCalculated = (getAmount * index[0]) / 100;
                                // console.log("taxamtCalculated", taxamtCalculated);
                                var taxamtCalculatedFixed = taxamtCalculated.toFixed(2);
                                // console.log("taxamtCalculatedFixed", taxamtCalculatedFixed);
                                var setTaxamt = currentRecord.setCurrentSublistValue({
                                    sublistId: 'custpage_expenseanditems',
                                    fieldId: 'custpage_taxamt',
                                    value: taxamtCalculatedFixed
                                });

                                var grossAmt = Number(getAmount) + Number(taxamtCalculatedFixed);
                                var grossAmtFixed = grossAmt.toFixed(2);
                                var setGrossAmt = currentRecord.setCurrentSublistValue({
                                    sublistId: 'custpage_expenseanditems',
                                    fieldId: 'custpage_grossamt',
                                    value: grossAmtFixed
                                });
                            }

                        }

                    }
                }
                else if (scriptContext.fieldId == 'custpage_clientproject') {

                    var currentRecord = scriptContext.currentRecord;
                    var dateOld = currentRecord.getText({ fieldId: 'custpage_date1' });


                    console.log("dateOld", dateOld)
                    //  dateOld = format.parse({
                    //     value: dateOld,
                    //     type: format.Type.DATE,
                    //     timezone: format.Timezone.EUROPE_LONDON
                    // });
                    // console.log("dateNew",dateOld)
                    var dateNew = JSON.stringify(dateOld);
                    //var dateNew = dateOld

                    console.log("dateNew", dateNew);
                    var projectId = currentRecord.getValue({
                        fieldId: 'custpage_clientproject'
                    })
                    var refNo = currentRecord.getValue({
                        fieldId: 'custpage_referenceno'
                    })
                    var memoNo = currentRecord.getValue({
                        fieldId: 'custpage_memo'
                    })
                    if (projectId) {
                        var salesRepPartner = ''
                        var refVal = ''
                        var memoVal = ''
                        var dateval = ''
                        if (projectId) {
                            salesRepPartner = "&projectId=" + projectId;
                            if (refNo) {
                                refVal = "&refNo=" + refNo
                            }
                            if (memoNo) {
                                memoVal = "&memoNo=" + memoNo
                            }
                            if (dateOld) {
                                dateval = "&datevalue=" + dateNew
                            }
                        }
                        var oldUrl = window.location.href;
                        oldUrl = oldUrl.split('&deploy=' + 1);
                        var newUrl = oldUrl[0] + "&deploy=1" + salesRepPartner + refVal + memoVal + dateval

                        window.location.href = newUrl;
                    }

                }
                else if (scriptContext.fieldId == 'custpage_attachments') {
                    var rec = scriptContext.currentRecord
                    var attach = rec.getValue({
                        fieldId: 'custpage_attachments'
                    });
                    console.log("attach", attach)
                }
            } catch (e) {
                console.log("Error @ fieldChanged", e);
            }
        }

        function sublistChanged(scriptContext) {
            try {
                var currentRecord = scriptContext.currentRecord;

                var lineCount = currentRecord.getLineCount({
                    sublistId: 'custpage_expenseanditems'
                });
                console.log("LineCountttt", lineCount);
                var sublistName = scriptContext.sublistId;
                if (sublistName == 'custpage_expenseanditems') {
                    var totalAmount = totalSumOfExpenseAndItems(currentRecord)
                    console.log("totalAmount", totalAmount);

                    if (lineCount == 0) {
                        currentRecord.setValue({
                            fieldId: "custpage_amount",
                            value: "0.00"
                        });
                    }
                    currentRecord.setValue({
                        fieldId: "custpage_amount",
                        value: totalAmount
                    });
                }
            } catch (err) {
                console.log("Error @ sublistChanged", err);
            }
        }

        function lineInit(scriptContext) {
            try {

                if (scriptContext.sublistId == 'custpage_expenseanditems') {
                    if (scriptContext.fieldId == 'custpage_taxcode' || scriptContext.fieldId == 'custpage_amount1') {

                        var currentRecord = scriptContext.currentRecord;

                        var lineCount = currentRecord.getLineCount({
                            sublistId: 'custpage_expenseanditems'
                        })
                        console.log("lineCount", lineCount);
                        var taxRateValue = salestaxSearch();
                        console.log("taxratevalue", taxRateValue);
                        for (var i = 0; i < taxRateValue.length; i++) {
                            var gettaxCode = currentRecord.getCurrentSublistValue({
                                sublistId: 'custpage_expenseanditems',
                                fieldId: 'custpage_taxcode'
                            });
                            console.log("gettaxCode", gettaxCode);
                            console.log("taxRateValue[i].id", taxRateValue[i].id);
                            //    for (var j = 0; j < taxRateValue.length; j++) {
                            if (gettaxCode == taxRateValue[i].id) {
                                console.log("gettaxCode Inside", gettaxCode);
                                console.log("taxRateValue[i].id inside", taxRateValue[i].id);
                                currentRecord.setCurrentSublistValue({
                                    sublistId: 'custpage_expenseanditems',
                                    fieldId: 'custpage_taxrate',
                                    value: taxRateValue[i].value
                                });
                                // break;
                            }
                            //  }

                            var getAmount = currentRecord.getCurrentSublistValue({
                                sublistId: 'custpage_expenseanditems',
                                fieldId: 'custpage_amount1'
                            });

                            var gettaxrate = currentRecord.getCurrentSublistValue({
                                sublistId: 'custpage_expenseanditems',
                                fieldId: 'custpage_taxrate'
                            });
                            console.log("getAmount", getAmount);
                            console.log("gettaxrate", gettaxrate);
                            var index = gettaxrate.split('%');
                            console.log("index", index[0]);
                            var taxamtCalculated = (getAmount * index[0]) / 100;
                            console.log("taxamtCalculated", taxamtCalculated);
                            var taxamtCalculatedFixed = taxamtCalculated.toFixed(2);
                            console.log("taxamtCalculatedFixed", taxamtCalculatedFixed);
                            var setTaxamt = currentRecord.setCurrentSublistValue({
                                sublistId: 'custpage_expenseanditems',
                                fieldId: 'custpage_taxamt',
                                value: taxamtCalculatedFixed
                            });

                            var grossAmt = Number(getAmount) + Number(taxamtCalculatedFixed);
                            var grossAmtFixed = grossAmt.toFixed(2);
                            var setGrossAmt = currentRecord.setCurrentSublistValue({
                                sublistId: 'custpage_expenseanditems',
                                fieldId: 'custpage_grossamt',
                                value: grossAmtFixed
                            });

                        }
                    }
                }
            } catch (e) {
                console.log("Error @ lineInit", e);
            }

        }

        function totalSumOfExpenseAndItems(currentRecord) {
            var totalAmount = 0.00;
            var numLinesItem = currentRecord.getLineCount({
                sublistId: 'custpage_expenseanditems'
            })
            for (var m = 0; m < numLinesItem; m++) {
                var grossAmountforItem = currentRecord.getSublistValue({
                    sublistId: 'custpage_expenseanditems',
                    fieldId: 'custpage_grossamt',
                    line: m
                });
                totalAmount += Number(grossAmountforItem);
                var tot = totalAmount.toFixed(2)

            }

            return tot;
        }

        function valuefetch(scriptContext) {
            try {
                jQuery("#custpage_load_img_new").css("display", "block");
                var userId = runtime.getCurrentUser().id;
                console.log("userId", userId);

                var lineArray = []
                console.log("connected")

                var currentRec = currentRecord.get();

                var fieldIds = currentRec.getValue({ fieldId: "custpage_hidden_id" })
                console.log("fieldIds", fieldIds)
                var checkHidden = currentRec.getValue({ fieldId: "custpage_validate_multiples" })
                if (checkHidden == true || checkHidden == "T") {
                    alert("Record is already saved")
                    jQuery("#custpage_load_img_new").css("display", "none");
                } else {


                    var projectValue = currentRec.getValue({ fieldId: "custpage_clientproject" })
                    console.log("projectValue", projectValue)

                    var referanceNum = currentRec.getValue({ fieldId: "custpage_referenceno" })
                    console.log("referanceNum", referanceNum)

                    if (projectValue) {

                        if (referanceNum) {

                            if (!fieldIds) {
                                var counts = checkTheReferance(referanceNum)
                                console.log("counts", counts)
                            } else {
                                var counts = 0
                            }

                            if (counts == 0) {

                                currentRec.setValue({
                                    fieldId: "custpage_validate_multiples",
                                    value: true
                                })

                                var customRecId = currentRec.getValue({
                                    fieldId: 'custpage_hidden_id'
                                });

                                var supplier = currentRec.getValue({
                                    fieldId: 'custpage_supplier'
                                });
                                var date = currentRec.getValue({
                                    fieldId: 'custpage_date1'
                                });
                                console.log('date', date)
                                var reference_no = currentRec.getValue({
                                    fieldId: 'custpage_referenceno'
                                });
                                var currency = currentRec.getValue({
                                    fieldId: 'custpage_currency'
                                });
                                var memo = currentRec.getValue({
                                    fieldId: 'custpage_memo'
                                });
                                var amount = currentRec.getValue({
                                    fieldId: 'custpage_amount'
                                });
                                var status = currentRec.getValue({
                                    fieldId: 'custpage_status'
                                });
                                var project = currentRec.getValue({
                                    fieldId: 'custpage_clientproject'
                                });
                                var attachments = currentRec.getValue({
                                    fieldId: 'custpage_attachments'
                                });

                                console.log("supplier", supplier)
                                console.log("reference_no", reference_no)
                                console.log("currency", currency)
                                console.log("memo", memo)
                                console.log("amount", amount)
                                console.log("status", status)
                                console.log("project", project)
                                console.log("attachments", attachments)

                                if (customRecId) {
                                    var objRecord = record.load({
                                        type: 'customrecord430',
                                        id: customRecId,
                                        isDynamic: true,
                                    });
                                } else {
                                    var objRecord = record.create({
                                        type: "customrecord430",
                                        isDynamic: true,

                                    });
                                }

                                if (supplier) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_vendor_bill_supplier",
                                        value: supplier
                                    });
                                }
                                if (date) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_vendor_bill_date",
                                        value: date
                                    });
                                }
                                if (reference_no) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_vendor_bill_referenceno",
                                        value: reference_no
                                    });
                                }
                                if (currency) {
                                    objRecord.setText({
                                        fieldId: "custrecord_vendor_bill_currency",
                                        text: currency
                                    });
                                }
                                if (memo) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_vendor_bill_memo",
                                        value: memo
                                    });
                                }
                                if (amount) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_vendor_bill_amount",
                                        value: amount
                                    });
                                }
                                if (status) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_vendor_bill_status",
                                        value: status
                                    });
                                }
                                if (project) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_vendor_bill_cli",
                                        value: project
                                    });
                                }
                                if (userId) {
                                    objRecord.setValue({
                                        fieldId: "custrecord_jj_bill_user",
                                        value: userId
                                    });
                                }

                                var numLines = currentRec.getLineCount({
                                    sublistId: 'custpage_expenseanditems'
                                });
                                console.log("numLines", numLines)

                                for (var i = 0; i < numLines; i++) {
                                    var tempObj = {}

                                    tempObj.category = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_category',
                                        line: i
                                    });

                                    tempObj.billable = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_billablebills',
                                        line: i
                                    });

                                    tempObj.projectTask = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_projecttask',
                                        line: i
                                    });

                                    tempObj.net = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_amount1',
                                        line: i
                                    });

                                    tempObj.taxcode = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_taxcode',
                                        line: i
                                    });

                                    tempObj.taxrate = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_taxrate',
                                        line: i
                                    });

                                    tempObj.tax = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_taxamt',
                                        line: i
                                    });

                                    tempObj.gross = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_grossamt',
                                        line: i
                                    });

                                    tempObj.lineMemo = currentRec.getSublistValue({
                                        sublistId: 'custpage_expenseanditems',
                                        fieldId: 'custpage_memo',
                                        line: i
                                    });


                                    lineArray.push(tempObj)
                                    console.log("tempObj", tempObj)
                                }
                                console.log("lineArray", lineArray)
                                lineArray = JSON.stringify(lineArray)

                                objRecord.setValue({
                                    fieldId: "custrecord_jj_bill_category",
                                    value: lineArray
                                });


                                objRecord.save();

                                jQuery("#custpage_load_img_new").css("display", "none");
                                alert("Record is updated");
                                window.location.href = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=644&deploy=1"

                            }

                            else {
                                alert("Record is already added.")
                                jQuery("#custpage_load_img_new").css("display", "none");
                            }

                        } else {
                            alert("Please Enter Reference Number")
                            jQuery("#custpage_load_img_new").css("display", "none");
                        }

                    } else {
                        alert("Please Select Project")
                        jQuery("#custpage_load_img_new").css("display", "none");
                    }
                }

            } catch (e) {
                console.log("error@valueFetch", e)
            }
        }

        function deleteRecord() {

            var currentRec = currentRecord.get();

            var customRecId = currentRec.getValue({
                fieldId: 'custpage_hidden_delete'
            });
            console.log("customRecId", customRecId);

            var testFlag = 0;
            var featureRecord = record.delete({
                type: 'customrecord430',
                id: customRecId,
            });
            testFlag++;

            if (testFlag > 0) {
                alert("The record deleted successfully");
                var url = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=644&deploy=1"

                window.location.href = url;
            }
        }

        function saveRecord(scriptContext) {
            var currentrec = currentRecord.get();
            var rec = scriptContext.currentRecord
            var attach = rec.getValue({
                fieldId: 'custpage_attachments'
            });
            console.log("attach", attach)
            // var fileObj = file.load({
            //    id: attach
            //});
            //fileObj.folder = 15312;
            //var fileId = fileObj.save();
            var NumLine = currentrec.getLineCount({
                sublistId: 'custpage_expenseanditems'
            });
            console.log("NumLine", NumLine)
            // if(NumLine==0){
            //     alert("please enter atleast single line")
            //     return false
            // }else{
            //     return true
            // }
            return true
        }

        function checkTheReferance(referanceNum) {
            var customrecord430SearchObj = search.create({
                type: "customrecord430",
                filters:
                    [
                        ["custrecord_vendor_bill_referenceno", "is", referanceNum]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "custrecord_vendor_bill_referenceno", label: "REFERENCE NO" })
                    ]
            });
            var searchResultCount = customrecord430SearchObj.runPaged().count;
            log.debug("customrecord430SearchObj result count", searchResultCount);
            return searchResultCount;
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            sublistChanged: sublistChanged,
            lineInit: lineInit,
            valuefetch: valuefetch,
            deleteRecord: deleteRecord,
            saveRecord: saveRecord
            //  validateLine:validateLine

        };

    });