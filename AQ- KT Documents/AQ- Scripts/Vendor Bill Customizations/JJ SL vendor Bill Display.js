/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
 define(['N/currentRecord', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
 /**
  * @param{currentRecord} currentRecord
  * @param{record} record
  * @param{redirect} redirect
  * @param{runtime} runtime
  * @param{search} search
  * @param{serverWidget} serverWidget
  */
 (currentRecord, record, redirect, runtime, search, serverWidget) => {
     /**
      * Defines the Suitelet script trigger point.
      * @param {Object} scriptContext
      * @param {ServerRequest} scriptContext.request - Incoming request
      * @param {ServerResponse} scriptContext.response - Suitelet response
      * @since 2015.2
      */

     function setValuesinSublist(subArray, expenseandItems) {
         try {
             var count = subArray.length;
             log.debug("Count", count);
             for (var i = 0; i < subArray.length; i++) {

                 expenseandItems.setSublistValue({
                     id: 'custpage_category',
                     line: i,
                     value: subArray[i].getCategory
                 });

                 log.debug('subArray[i].getBill', subArray[i].getBill)

                 var flag = "F"
                 if (subArray[i].getBill == true) {
                     flag = "T"
                 }
                 expenseandItems.setSublistValue({
                     id: 'custpage_billablebills',
                     line: i,
                     value: flag
                 });
                 //  viewbill.link = "/app/site/hosting/scriptlet.nl?script=612&deploy=1" ;
                 if (subArray[i].getProjectTask)
                     expenseandItems.setSublistValue({
                         id: 'custpage_projecttask',
                         line: i,
                         value: subArray[i].getProjectTask
                     });
                 if (subArray[i].getAmount)
                     expenseandItems.setSublistValue({
                         id: 'custpage_amount1',
                         line: i,
                         value: subArray[i].getAmount
                     });
                     log.debug("subArray[i].getTaxrate",subArray[i].getTaxrate)
                 if (subArray[i].getTaxrate.toString())
                     expenseandItems.setSublistValue({
                         id: 'custpage_taxrate',
                         line: i,
                         value: (subArray[i].getTaxrate)
                     });

                     log.debug("subArray[i].getTaxamt",subArray[i].getTaxamt)
                 if ((subArray[i].getTaxamt).toString()){
                     log.debug("enter",subArray[i].getTaxamt)
                     expenseandItems.setSublistValue({
                         id: 'custpage_taxamt',
                         line: i,
                         value: (subArray[i].getTaxamt)
                     });
                    }
                 if (subArray[i].getgrossAmt)
                     expenseandItems.setSublistValue({
                         id: 'custpage_grossamt',
                         line: i,
                         value: subArray[i].getgrossAmt
                     });
                 if (subArray[i].getMemo)
                     expenseandItems.setSublistValue({
                         id: 'custpage_memo',
                         line: i,
                         value: subArray[i].getMemo
                     });
                 if (subArray[i].getTaxcode)
                     expenseandItems.setSublistValue({
                         id: 'custpage_taxcode',
                         line: i,
                         value: subArray[i].getTaxcode
                     });
             }

         } catch (e) {
             log.debug("Err@  setValuesinSublist", e);
         }
     }

     function setValuesinSublistRealted(relatedArray, relatedTransaction, currencyVal) {
         try {
             var countlink = relatedArray.length;
             for (var j = 0; j < relatedArray.length; i++) {

                 if (relatedArray[j].dateVal)
                     relatedTransaction.setSublistValue({
                         id: 'custpage_related_date',
                         line: j,
                         value: relatedArray[j].dateVal
                     });
                 if (relatedArray[j].typeVal)
                     relatedTransaction.setSublistValue({
                         id: 'custpage_related_type',
                         line: j,
                         value: relatedArray[j].typeVal
                     });
                 if (relatedArray[j].docNumVal)
                     relatedTransaction.setSublistValue({
                         id: 'custpage_related_docnumber',
                         line: j,
                         value: relatedArray[j].docNumVal
                     });
                 if (relatedArray[j].amtVal)
                     relatedTransaction.setSublistValue({
                         id: 'custpage_related_amount',
                         line: j,
                         value: relatedArray[j].amtVal
                     });
                 if (currencyVal)
                     relatedTransaction.setSublistValue({
                         id: 'custpage_related_currency',
                         line: j,
                         value: currencyVal
                     });

             }
         } catch (e) {
             log.debug("Err@  setValuesinSublist", e);
         }
     }

     function checkif(singleitem) {
         if (singleitem == "" || singleitem == null || singleitem == undefined || singleitem == '- None -' || singleitem == " ") {
             return "_";
         } else if (singleitem == "true") {
             return "yes";
         } else if (singleitem == "false") {
             return "No"
         } else {
             return singleitem;
         }
     }

     const onRequest = (scriptContext) => {
         if (scriptContext.request.method === 'GET') {
             try {

                 var request = scriptContext.request;

                 var action = scriptContext.request.parameters.actionType;
                 log.debug("action type", action)
                 if (action == "savedEdit") {

                     var form = serverWidget.createForm({
                         title: 'Vendor Bill'
                     });
                     //form.clientScriptFileId = 249057

                     var internalId = scriptContext.request.parameters.idnum;
                     log.debug("internalId", internalId);


                     var billRec = record.load({
                         type: record.Type.VENDOR_BILL,
                         id: internalId,
                         isDynamic: true
                     });
                     var suppliervalue = billRec.getText({fieldId: 'entity'});
                     var datevalue = billRec.getValue({fieldId: 'trandate'});
                     var refNo = billRec.getValue({fieldId: 'tranid'});
                     var currencyValue = billRec.getText({fieldId: 'currency'});
                     var memoValue = billRec.getValue({fieldId: 'memo'});
                     var amountValue = billRec.getValue({fieldId: 'usertotal'});
                     var statusValue = billRec.getText({fieldId: 'approvalstatus'});
                     var projectValue = billRec.getValue({fieldId: 'custbody_jj_body_project'});

                     var count = billRec.getLineCount({
                         sublistId: 'expense'
                     });


                     var supplier = form.addField({
                         id: 'custpage_bill_id',
                         type: serverWidget.FieldType.TEXT,
                         label: 'VendorBillID',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                     supplier.defaultValue = internalId;

                     var supplier = form.addField({
                         id: 'custpage_supplier',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Supplier',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     supplier.defaultValue = suppliervalue;

                     var date = form.addField({
                         id: 'custpage_date',
                         type: serverWidget.FieldType.DATE,
                         label: 'Date',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     date.defaultValue = datevalue;
                     var referenceNo = form.addField({
                         id: 'custpage_referenceno',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Reference No',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     referenceNo.defaultValue = refNo;
                     var currency = form.addField({
                         id: 'custpage_currency',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Currency',
                         //source: 'currency'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     currency.defaultValue = currencyValue;
                     var memo = form.addField({
                         id: 'custpage_memo',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Memo',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     memo.defaultValue = memoValue;
                     var amount = form.addField({
                         id: 'custpage_amount',
                         type: serverWidget.FieldType.CURRENCY,
                         label: 'Amount',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     amount.defaultValue = amountValue;
                     var status = form.addField({
                         id: 'custpage_status',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Status'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     status.defaultValue = statusValue;

                     var clientproject = form.addField({
                         id: 'custpage_clientproject',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Client/Project',
                         source: 'job'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     clientproject.defaultValue = projectValue;
                     var expenseandItems = form.addSublist({
                         id: 'custpage_expenseanditems',
                         type: serverWidget.SublistType.LIST,
                         label: 'Expenses'
                     });
                     expenseandItems.addField({
                         id: 'custpage_category',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Category',
                         source: 'expensecategory'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     expenseandItems.addField({
                         id: 'custpage_billablebills',
                         type: serverWidget.FieldType.CHECKBOX,
                         label: 'Billable'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     var project = expenseandItems.addField({
                         id: 'custpage_projecttask',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Project Task',
                         source: 'projecttask'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     expenseandItems.addField({
                         id: 'custpage_memo',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Memo'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     var amt = expenseandItems.addField({
                         id: 'custpage_amount1',
                         type: serverWidget.FieldType.CURRENCY,
                         label: 'Amount'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     var taxCode = expenseandItems.addField({
                         id: 'custpage_taxcode',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Tax Code',
                         source: 'salestaxitem'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

                     taxCode.isMandatory = true;
                     var taxRate = expenseandItems.addField({
                         id: 'custpage_taxrate',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Tax Rate'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     //taxRate.isDisabled = true;
                     var taxAmt = expenseandItems.addField({
                         id: 'custpage_taxamt',
                         type: serverWidget.FieldType.CURRENCY,
                         label: 'Tax Amt'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     var grossAmt = expenseandItems.addField({
                         id: 'custpage_grossamt',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Gross Amt'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

                     amt.isMandatory = true;

                     var relatedTransaction = form.addSublist({
                         id: 'custpage_related_transaction',
                         type: serverWidget.SublistType.LIST,
                         label: 'Related Transaction'
                     });
                     relatedTransaction.addField({
                         id: 'custpage_related_date',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Date'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

                     relatedTransaction.addField({
                         id: 'custpage_related_type',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Type'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     relatedTransaction.addField({
                         id: 'custpage_related_docnumber',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Document Number'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     relatedTransaction.addField({
                         id: 'custpage_related_currency',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Currency'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     relatedTransaction.addField({
                         id: 'custpage_related_amount',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Amount'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});


                     var countlink = billRec.getLineCount({
                         sublistId: 'links'
                     });
                     var relatedArray = [];

                     var currencyVal = billRec.getText({fieldId: 'currency'});
                     for (var i = 0; i < countlink; i++) {
                         // var currencyVal = billRec.getValue({fieldId: 'currency'});
                         var dateVal = billRec.getSublistText({
                             sublistId: 'links',
                             fieldId: 'trandate',
                             line: i
                         });
                         /*log.debug("Date",dateVal);
                         log.debug("type of date",typeof (dateVal));*/
                         //dateVal = new Date(dateVal);
                         /* var StringDate = String(dateVal);
                          dateVal = new Date(StringDate);*/
                         /*var dateValpst = new Date(Date.UTC(dateVal));
                           log.debug("dateValpst",dateValpst);
                           dateVal = dateValpst.toUTCString();*/
                         var typeVal = billRec.getSublistValue({
                             sublistId: 'links',
                             fieldId: 'type',
                             line: i
                         });
                         var docNumVal = billRec.getSublistValue({
                             sublistId: 'links',
                             fieldId: 'tranid',
                             line: i
                         });

                         /*var currencyVal = billRec.getSublistValue({
                             sublistId: 'links',
                             fieldId: 'total',
                             line: i
                         });*/

                         var amtVal = billRec.getSublistValue({
                             sublistId: 'links',
                             fieldId: 'total',
                             line: i
                         });

                         var relatedObj = {
                             dateVal: dateVal,
                             typeVal: typeVal,
                             docNumVal: docNumVal,
                             getAmount: getAmount,
                             amtVal: amtVal
                         };
                         relatedArray.push(relatedObj);

                     }
                     log.debug("RelatedArray", relatedArray);


                     /*form.addSubtab({
                         id : 'custpage_related_record',
                         label : 'Related Transaction'
                     });*/

                     if (statusValue == "Pending Approval") {
                         form.addSubmitButton({
                             label: 'Edit'
                         });
                     }

                     var subArray = [];
                     for (var i = 0; i < count; i++) {

                         var getCategory = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'category',
                             line: i
                         });
                         var getBill = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'custcol_jj_billable',
                             line: i
                         });
                         var getProjectTask = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'custcol_jj_project_task',
                             line: i
                         });

                         var getTaxcode = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'taxcode',
                             line: i
                         });
                         var getAmount = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'amount',
                             line: i
                         });
                         var getTaxrate = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'taxrate1',
                             line: i
                         });
                         var getTaxamt = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'tax1amt',
                             line: i
                         });
                         var getgrossAmt = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'grossamt',
                             line: i
                         });
                         var getMemo = billRec.getSublistValue({
                             sublistId: 'expense',
                             fieldId: 'memo',
                             line: i
                         });
                         var Obj = {
                             getCategory: getCategory,
                             getBill: getBill,
                             getProjectTask: getProjectTask,
                             getAmount: getAmount,
                             getTaxcode: getTaxcode,
                             getTaxrate: getTaxrate,
                             getTaxamt: getTaxamt,
                             getgrossAmt: getgrossAmt,
                             getMemo: getMemo
                         };
                         subArray.push(Obj);
                         log.debug("SubArray", subArray);

                     }
                     var setSublist = setValuesinSublist(subArray, expenseandItems);
                     var resultRelated = setValuesinSublistRealted(relatedArray, relatedTransaction, currencyVal);
                 } else if (action == "normalEdit") {
                     var form = serverWidget.createForm({
                         title: 'Vendor Bill'
                     });
                     // form.clientScriptFileId = 249057

                     var Hidden_delete = scriptContext.request.parameters.idnum;
                     log.debug("Hidden_delete", Hidden_delete);


                     var userId = runtime.getCurrentUser().id;
                     var vendorSearchObj1 = search.create({
                         type: "vendor",
                         filters:
                             [
                                 ["internalid", "anyof", userId]
                             ],
                         columns:
                             [
                                 search.createColumn({name: "subsidiary", label: "Primary Subsidiary"}),
                                 search.createColumn({
                                     name: "country",
                                     join: "mseSubsidiary",
                                     label: "Country"
                                 })
                             ]
                     });
                     var searchResultCountcountry = vendorSearchObj1.runPaged().count;
                     log.debug("vendorSearchObj1 result count", searchResultCountcountry);

                     var subcountryArray = [];
                     vendorSearchObj1.run().each(function (result) {
                         var primarysub = result.getValue(vendorSearchObj1.columns[0]);
                         var countrysub = result.getValue(vendorSearchObj1.columns[1]);
                         subcountryArray.push(primarysub, countrysub);
                         return true;
                     });

                     var salestaxitemSearchObj = search.create({
                         type: "salestaxitem",
                         filters: [
                             ["subsidiary", "anyof", subcountryArray[0]],
                             "AND", ["country", "anyof", subcountryArray[1]],
                             "AND", ["availableon", "anyof", "PURCHASE", "BOTH"],
                             "AND", ["isinactive", "is", "F"]
                         ],
                         columns: [
                             search.createColumn({
                                 name: "name",
                                 sort: search.Sort.ASC,
                                 label: "Name"
                             }),
                             search.createColumn({name: "internalid", label: "InternalID"}),
                             search.createColumn({name: "rate", label: "Rate"})
                         ]
                     });
                     var searchResultCounttax = salestaxitemSearchObj.runPaged().count;
                     log.debug("salestaxitemSearchObj result count", searchResultCounttax);


                     var taxsearcharray = [];
                     var taxratearray = [];
                     var taxcodeRateArray = [];

                     salestaxitemSearchObj.run().each(function (result) {
                         var taxcodeValue = result.getValue(salestaxitemSearchObj.columns[0]);
                         //  taxsearcharray.push(taxcodeValue);
                         var taxrateValue = result.getValue(salestaxitemSearchObj.columns[2]);
                         taxratearray.push(taxrateValue);
                         var internalId = result.getValue(salestaxitemSearchObj.columns[1]);
                         var taxcodeObj = {id: internalId, value: taxcodeValue};
                         taxsearcharray.push(taxcodeObj);
                         var taxcoderateObj = {id: internalId, value: taxrateValue};
                         taxcodeRateArray.push(taxcoderateObj);
                         return true;
                     });

                     log.debug("taxcoderateArray", taxcodeRateArray);

                     var taxCodeRateHidden = form.addField({
                         id: 'custpage_taxcoderate_hidden',
                         type: serverWidget.FieldType.TEXTAREA,
                         label: 'TaxCode & Taxrate'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                     var taxcoderateString = JSON.stringify(taxcodeRateArray);

                     log.debug("taxcoderateString", taxcoderateString);
                     taxCodeRateHidden.defaultValue = taxcoderateString;


                     var hiddenfor_delete = form.addField({
                         id: 'custpage_hidden_delete',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Hidden ID For Delete',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                     hiddenfor_delete.defaultValue = Hidden_delete;

                     form.clientScriptFileId = 249057;
                     form.addSubmitButton({
                         label: 'Edit'
                     });
                     form.addButton({
                         id: 'custpage_delete_record',
                         label: 'Delete',
                         functionName: 'deleteRecord'
                     });


                     var internalId = scriptContext.request.parameters.idnum;
                     log.debug("internalId", internalId);

                     var custRec = record.load({
                         type: "customrecord430",
                         id: internalId,
                         isDynamic: true
                     });

                     log.debug("custRec", custRec)

                     var dateVal = custRec.getValue({fieldId: 'custrecord_vendor_bill_date'})
                     var refNum = custRec.getValue({fieldId: 'custrecord_vendor_bill_referenceno'})
                     var currencyVal = custRec.getValue({fieldId: 'custrecord_vendor_bill_currency'})
                     var amnt = custRec.getValue({fieldId: 'custrecord_vendor_bill_amount'})
                     var project = custRec.getValue({fieldId: 'custrecord_vendor_bill_cli'})
                     var statusVal = custRec.getValue({fieldId: 'custrecord_vendor_bill_status'})
                     var memoVal = custRec.getValue({fieldId: 'custrecord_vendor_bill_memo'})
                     var supplierVal = custRec.getValue({fieldId: 'custrecord_vendor_bill_supplier'})
                     var lineDetails = custRec.getValue({fieldId: 'custrecord_jj_bill_category'})

                     var supplier = form.addField({
                         id: 'custpage_supplier',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Supplier',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     log.debug("supplierVal", supplierVal)
                     supplier.defaultValue = supplierVal;

                     var date = form.addField({
                         id: 'custpage_date',
                         type: serverWidget.FieldType.DATE,
                         label: 'Date',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     date.defaultValue = dateVal;

                     var referenceNo = form.addField({
                         id: 'custpage_referenceno',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Reference No',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     referenceNo.defaultValue = refNum;

                     var currency = form.addField({
                         id: 'custpage_currency',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Currency',
                         source: 'currency'
                         //    source: 'customlist_currency_new'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     currency.defaultValue = currencyVal;

                     var memo = form.addField({
                         id: 'custpage_memo',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Memo',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     memo.defaultValue = memoVal;

                     var amount = form.addField({
                         id: 'custpage_amount',
                         type: serverWidget.FieldType.CURRENCY,
                         label: 'Amount',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     amount.defaultValue = amnt;

                     var status = form.addField({
                         id: 'custpage_status',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Status'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     status.defaultValue = statusVal;

                     var clientproject = form.addField({
                         id: 'custpage_clientproject',
                         type: serverWidget.FieldType.SELECT,
                         label: 'Client/Project',
                         source: 'job'
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                     log.debug("project", project)
                     clientproject.defaultValue = project;

                     var actionField = form.addField({
                         id: 'custpage_hidden',
                         type: serverWidget.FieldType.TEXT,
                         label: 'Action',
                     }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                     actionField.defaultValue = internalId

                     exports.suiblistPageDesign(form, lineDetails)

                 }
             } catch (e) {
                 log.debug("Err@ onRequest", e);
             }
             scriptContext.response.writePage(form);
         }

         if (scriptContext.request.method === 'POST') {
             try {
                 var request = scriptContext.request;

                 var hiddenAction = request.parameters.custpage_hidden
                 var savedBillSave = request.parameters.custpage_hidden_id2
                 log.debug('savedBillSavenew', savedBillSave)
                 log.debug("hiddenAction", hiddenAction)

                 if (hiddenAction) {
                     try {
                         log.debug('savedBillSavenewif')
                         var billId
                         var supplier2 = request.parameters.custpage_supplier;
                         var date2 = request.parameters.custpage_date;
                         var refNo2 = request.parameters.custpage_referenceno;
                         var currency2 = request.parameters.custpage_currency;
                         var memo2 = request.parameters.custpage_memo;
                         var amt2 = request.parameters.custpage_amount;
                         var status2 = request.parameters.custpage_status;
                         var cproject2 = request.parameters.custpage_clientproject;

                         var form = exports.setSublistInEditMode(supplier2, date2, refNo2, currency2, memo2, status2, cproject2, amt2, request, hiddenAction, billId)

                         scriptContext.response.writePage(form);
                     } catch (e) {
                         log.debug("Err@ onRequest hiddenAction", e);
                         //"https://3689903-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=612&deploy=1&idnum="+hiddenAction"104&actionType=normalEdit"
                         let resp = '<html><head></head><body><script>window.alert("Unable to Create Bill \\n ' + e.message + ' ");window.location.href = "https://3689903.app.netsuite.com/app/center/card.nl?sc=-66&whence=" </script></body></html>'
                         scriptContext.response.writePage(resp);
                     }

                 } else if (savedBillSave == "SavedBillSave") {

                     try {
                         log.debug('savedBillSavenewelseif')
                         log.debug("enter vendor bill saving part.")
                         // var hiddenAction = request.parameters.custpage_hidden_id
                         var hiddenAction = request.parameters.custpage_hidden_id
                         log.debug('hiddenAction', hiddenAction)

                         var billId = request.parameters.custpage_hidden_bill_id
                         var getSupplier = request.parameters.custpage_supplier1;
                         // changed date
                         var getDate = request.parameters.custpage_date1;
                         var getRefno = request.parameters.custpage_referenceno;
                         var getMemo = request.parameters.custpage_memo;
                         var getAmount = request.parameters.custpage_amount;
                         var getClient = request.parameters.custpage_clientproject;
                         var getCurrency = request.parameters.custpage_currency1;
                         log.debug("getSupplier", getSupplier)
                         log.debug("getDate", getDate)
                         log.debug("getRefno", getRefno)
                         log.debug("getMemo", getMemo)
                         log.debug("getAmount", getAmount)
                         log.debug("getClient", getClient)
                         log.debug("getCurrency", getCurrency)

                         exports.createVendorBill(getSupplier, getDate, getRefno, getMemo, getAmount, getClient, getCurrency, request, hiddenAction, scriptContext, billId)
                     } catch (e) {
                         var hiddenAction = request.parameters.custpage_hidden_id
                         log.debug('hiddenAction', hiddenAction)
                         log.debug('error@createVendorBill 11', e)
                         var linkVal = "https://3689903-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=612&deploy=1&idnum=" + hiddenAction + "&actionType=normalEdit"
                         log.debug("link", linkVal)
                         if (hiddenAction) {
                             var msg = '<html><head></head><body><script>window.alert("Unable to Create Bill \\n ' + e.message + ' ");window.location.href = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=644&deploy=1"</script></body></html>'
                         } else {
                             var msg = '<html><head></head><body><script>window.alert("Unable to Create Bill \\n ' + e.message + ' ");window.location.href = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=645&deploy=1&deploy=1"</script></body></html>'
                         }
                         scriptContext.response.write(msg);
                     }
                 } else {
                     try {
                         log.debug('savedBillSavenewelse')
                         var supplier2 = request.parameters.custpage_supplier;
                         var date2 = request.parameters.custpage_date;
                         var refNo2 = request.parameters.custpage_referenceno;
                         var currency2 = request.parameters.custpage_currency;
                         var memo2 = request.parameters.custpage_memo;
                         var amt2 = request.parameters.custpage_amount;
                         var status2 = request.parameters.custpage_status;
                         var cproject2 = request.parameters.custpage_clientproject;
                         var billId = request.parameters.custpage_bill_id

                         log.debug('supplier2', supplier2)
                         log.debug('date2', date2)
                         log.debug('refNo2', refNo2)
                         log.debug('currency2', currency2)
                         log.debug('memo2', memo2)
                         log.debug('amt2', amt2)
                         log.debug('status2', status2)
                         log.debug('cproject2', cproject2)


                         var form = exports.setSublistInEditMode(supplier2, date2, refNo2, currency2, memo2, status2, cproject2, amt2, request, hiddenAction, billId)

                         log.debug("enter else loop")
                         scriptContext.response.writePage(form);
                     } catch (e) {
                         log.debug("error@submit else", e)
                         // var msg = '<html><head></head><body><script>window.alert("Unable to Create Bill \\n ' + e.message + ' ");window.location.href = "https://3689903-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=611&deploy=1"</script></body></html>'
                         // scriptContext.response.write(msg);
                     }
                 }

             } catch (e) {
                 log.debug("Err@ onRequestPOST", e);
             }
         }
     }

     var exports = {

         suiblistPageDesign(form, lineDetails) {
             try {
                 lineDetails = JSON.parse(lineDetails)
                 log.debug("lineDetails", lineDetails)
                 log.debug("lineDetails", lineDetails.length)


                 var expenseandItems = form.addSublist({
                     id: 'custpage_expenseanditems',
                     type: serverWidget.SublistType.LIST,
                     label: 'Expenses'
                 });
                 var catList = expenseandItems.addField({
                     id: 'custpage_category',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Category',
                     source: 'expensecategory'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 expenseandItems.addField({
                     id: 'custpage_billablebills',
                     type: serverWidget.FieldType.CHECKBOX,
                     label: 'Billable'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 var project = expenseandItems.addField({
                     id: 'custpage_projecttask',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Project Task',
                     source: 'projecttask'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 var linememo = expenseandItems.addField({
                     id: 'custpage_memo',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Memo'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 //  linememo.isMandatory = true;
                 var amt = expenseandItems.addField({
                     id: 'custpage_amount1',
                     type: serverWidget.FieldType.CURRENCY,
                     label: 'Amount'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 var taxCode = expenseandItems.addField({
                     id: 'custpage_taxcode',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Tax Code',
                     source: 'salestaxitem'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});

                 var taxRate = expenseandItems.addField({
                     id: 'custpage_taxrate',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Tax Rate'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 taxRate.isDisabled = true;
                 var taxAmt = expenseandItems.addField({
                     id: 'custpage_taxamt',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Tax Amt'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 var grossAmt = expenseandItems.addField({
                     id: 'custpage_grossamt',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Gross Amt'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});


                 /*form.addSubtab({
                     id : 'custpage_related_record',
                     label : 'Related Transaction'
                 });*/
                 /*var ccselect = form.addField({
                     id: 'custpage_cctypefield',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Credit Card',
                     container: 'custpage_related_record'
                 });*/

                 for (var i = 0; i < lineDetails.length; i++) {
                     expenseandItems.setSublistValue({
                         id: 'custpage_category',
                         line: i,
                         value: lineDetails[i].category
                     });
                     var flag = "F"
                     if (lineDetails[i].billable) {
                         flag = "T"
                     }
                     log.debug('lineDetails[i].billable', lineDetails[i].billable)
                     expenseandItems.setSublistValue({
                         id: 'custpage_billablebills',
                         line: i,
                         value: flag
                     });

                     if (lineDetails[i].projectTask) {

                         expenseandItems.setSublistValue({
                             id: 'custpage_projecttask',
                             line: i,
                             value: lineDetails[i].projectTask
                         });
                     }
                     expenseandItems.setSublistValue({
                         id: 'custpage_amount1',
                         line: i,
                         value: lineDetails[i].net
                     });
                     expenseandItems.setSublistValue({
                         id: 'custpage_taxcode',
                         line: i,
                         value: lineDetails[i].taxcode
                     });
                     expenseandItems.setSublistValue({
                         id: 'custpage_taxrate',
                         line: i,
                         value: lineDetails[i].taxrate
                     });
                     expenseandItems.setSublistValue({
                         id: 'custpage_taxamt',
                         line: i,
                         value: lineDetails[i].tax
                     });
                     expenseandItems.setSublistValue({
                         id: 'custpage_grossamt',
                         line: i,
                         value: lineDetails[i].gross
                     });


                     if (lineDetails[i].lineMemo) {
                         expenseandItems.setSublistValue({
                             id: 'custpage_memo',
                             line: i,
                             value: lineDetails[i].lineMemo
                         });
                     }
                 }


             } catch (e) {
                 log.debug("error@suiblistPageDesign", e)
             }
         },

         setSublistInEditMode(supplier2, date2, refNo2, currency2, memo2, status2, cproject2, amt2, request, hiddenAction, billId) {
             try {

                 log.debug('hiddenAction', hiddenAction)
                 var form = serverWidget.createForm({
                     title: 'Vendor Bill'
                 });

                 form.clientScriptFileId = 249057

                 var count = request.getLineCount({
                     group: 'expenseandItems'
                 });

                 var hiddenField = form.addField({
                     id: 'custpage_hidden_id',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Hidden ID',
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                 hiddenField.defaultValue = hiddenAction

                 log.debug("Hidden ID", hiddenAction);

                 var hiddenField = form.addField({
                     id: 'custpage_hidden_bill_id',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Bill Hidden ID',
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
                 hiddenField.defaultValue = billId

                 var contextField = form.addField({
                     id: 'custpage_hidden_id2',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Context Check',
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

                 contextField.defaultValue = "SavedBillSave"

                 var progressBarField = form.addField({
                     id: 'custpage_progress_bar',
                     type: serverWidget.FieldType.INLINEHTML,
                     label: 'Progress bar'
                 });
                 var loadingUrl = "https://3689903.app.netsuite.com/core/media/media.nl?id=32305&c=3689903&h=dcec0a9dd4c1943ff816";
                 var htmlCode = "<div><img id='custpage_load_img_new' style='height:60px;width:100px;top: 175px;left: 800px;float: right;position: absolute;display: none;' src='" + loadingUrl + "'/></div>";
                 progressBarField.defaultValue = htmlCode;

                 var supplier = form.addField({
                     id: 'custpage_supplier1',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Supplier',
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 supplier.isMandatory = true;
                 supplier.defaultValue = supplier2;

                 var date = form.addField({
                     id: 'custpage_date1',
                     type: serverWidget.FieldType.DATE,
                     label: 'Date',
                 });
                 date.isMandatory = true;
                 date.defaultValue = date2;
                 var referenceNo = form.addField({
                     id: 'custpage_referenceno',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Reference No',
                 });
                 referenceNo.isMandatory = true;
                 referenceNo.defaultValue = refNo2;
                 var currency = form.addField({
                     id: 'custpage_currency1',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Currency',
                     //source: 'currency'
                 });

                 var subsidiaryObj = exports.vendorCurrencySearch(supplier2)
                 var currencyList = subsidiaryObj.searcharray1
                 for (var i = 0; i < currencyList.length; i++) {
                     currency.addSelectOption({
                         value: currencyList[i],
                         text: currencyList[i]
                     });
                 }
                 currency.defaultValue = currency2;


                 var memo = form.addField({
                     id: 'custpage_memo',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Memo',
                 });
                 memo.defaultValue = memo2;
                 var amount = form.addField({
                     id: 'custpage_amount',
                     type: serverWidget.FieldType.CURRENCY,
                     label: 'Amount',
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 amount.defaultValue = amt2;
                 var status = form.addField({
                     id: 'custpage_status',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Status'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 status.defaultValue = status2;

                 var clientproject = form.addField({
                     id: 'custpage_clientproject',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Client/Project',
                     /*source: 'job'*/
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
                 clientproject.isMandatory = true;

                 clientproject.addSelectOption({
                     value: " ",
                     text: " "
                 });

                 var searchResultCountjob = exports.fetchProjectList(supplier2)
                 log.debug('searchResultCountjob', searchResultCountjob)

                 for (var k = 0; k < searchResultCountjob.length; k++) {
                     clientproject.addSelectOption({
                         value: searchResultCountjob[k].id,
                         text: searchResultCountjob[k].value
                     });
                 }
                 clientproject.defaultValue = cproject2;


                 var taxList = exports.salesTaxCodeSearch(subsidiaryObj.subsidiaryId, subsidiaryObj.countryId)
                 log.debug("taxList", taxList)

                 var taxWithRate = exports.salesTaxWithRate(subsidiaryObj.subsidiaryId, subsidiaryObj.countryId)

                 var taxCodeRateHidden = form.addField({
                     id: 'custpage_taxcoderate_hidden',
                     type: serverWidget.FieldType.TEXTAREA,
                     label: 'TaxCode & Taxrate'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});

                 var taxcoderateString = JSON.stringify(taxWithRate);

                 taxCodeRateHidden.defaultValue = taxcoderateString;
                 log.debug("taxWithRate", taxWithRate);
                 log.debug("taxcoderateString", taxcoderateString);

                 //Setup the sublist items
                 var expenseandItems = form.addSublist({
                     id: 'custpage_expenseanditems',
                     type: serverWidget.SublistType.INLINEEDITOR,
                     label: 'Expenses'
                 });
                 var categoryList = expenseandItems.addField({
                     id: 'custpage_category',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Category',
                     //source: 'expensecategory'
                 });
                 var catelyst = exports.expenseCategorySearch(subsidiaryObj.subsidiaryId)
                 log.debug('catelyst', catelyst)

                 categoryList.addSelectOption({
                     value: ' ',
                     text: ' '
                 });
                 for (var j = 0; j < catelyst.length; j++) {
                     categoryList.addSelectOption({
                         value: catelyst[j].id,
                         text: catelyst[j].value
                     });

                 }
                 categoryList.defaultValue = 15;

                var billable= expenseandItems.addField({
                     id: 'custpage_billablebills',
                     type: serverWidget.FieldType.CHECKBOX,
                     label: 'Billable'
                 });
                 billable.defaultValue = 'T';


                 var projectTask = expenseandItems.addField({
                     id: 'custpage_projecttask',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Project Task',
                     //source: 'projecttask'
                 });
                 var projectTaskList = []
                 if (cproject2) {
                     projectTaskList = exports.projectTaskSearchList(cproject2)
                 }

                 projectTask.addSelectOption({
                     value: '',
                     text: ''
                 });
                 for (var m = 0; m < projectTaskList.length; m++) {
                     projectTask.addSelectOption({
                         value: projectTaskList[m].id,
                         text: projectTaskList[m].value
                     });
                 }

                 var memos= expenseandItems.addField({
                     id: 'custpage_memo',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Memo'
                 });
                 memos.isMandatory = true;

                 var amt = expenseandItems.addField({
                     id: 'custpage_amount1',
                     type: serverWidget.FieldType.CURRENCY,
                     label: 'Amount'
                 });
                 amt.isMandatory = true;
                 var taxCode = expenseandItems.addField({
                     id: 'custpage_taxcode',
                     type: serverWidget.FieldType.SELECT,
                     label: 'Tax Code',
                     //source:'salestaxitem'
                 });
                 taxCode.isMandatory = true;


                 taxCode.addSelectOption({
                     value: ' ',
                     text: ' '
                 });
                 for (var j = 0; j < taxList.length; j++) {
                     taxCode.addSelectOption({
                         value: taxList[j].id,
                         text: taxList[j].value
                     });

                 }


                 var taxRate = expenseandItems.addField({
                     id: 'custpage_taxrate',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Tax Rate'
                 }).updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
                 //taxRate.isDisabled = true;
                 var taxAmt = expenseandItems.addField({
                     id: 'custpage_taxamt',
                     type: serverWidget.FieldType.CURRENCY,
                     label: 'Tax Amt'
                 });
                 var grossAmt = expenseandItems.addField({
                     id: 'custpage_grossamt',
                     type: serverWidget.FieldType.CURRENCY,
                     label: 'Gross Amt'
                 });

                 /*var related = form.addSubtab({
                     id: 'custpage_related',
                     label: 'Related Record'
                 });
             var ccselect = form.addField({
                 id: 'custpage_cctypefield',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Credit Card',
                 container: 'custpage_related'
             });*/


                 var lineCount = request.getLineCount({
                     group: 'custpage_expenseanditems'
                 });
                 log.debug("lineCount", lineCount)

                 for (var i = 0; i < lineCount; i++) {

                     log.debug('Tax Code', request.getSublistValue({
                         group: 'custpage_expenseanditems',
                         name: 'custpage_taxcode',
                         line: i
                     }))
                     expenseandItems.setSublistValue({
                         id: 'custpage_category',
                         line: i,
                         value: request.getSublistValue({
                             group: 'custpage_expenseanditems',
                             name: 'custpage_category',
                             line: i
                         })
                     });
                     var flag = 'F'
                     if (request.getSublistValue({
                         group: 'custpage_expenseanditems',
                         name: 'custpage_billablebills',
                         line: i
                     }) == 'T') {
                         flag = 'T'
                     }

                     expenseandItems.setSublistValue({
                         id: 'custpage_billablebills',
                         line: i,
                         value: flag
                     });
                     expenseandItems.setSublistValue({
                         id: 'custpage_projecttask',
                         line: i,
                         value: request.getSublistValue({
                             group: 'custpage_expenseanditems',
                             name: 'custpage_projecttask',
                             line: i
                         })
                     });
                     expenseandItems.setSublistValue({
                         id: 'custpage_amount1',
                         line: i,
                         value: request.getSublistValue({
                             group: 'custpage_expenseanditems',
                             name: 'custpage_amount1',
                             line: i
                         })
                     });

                     expenseandItems.setSublistValue({
                         id: 'custpage_taxcode',
                         line: i,
                         value: request.getSublistValue({
                             group: 'custpage_expenseanditems',
                             name: 'custpage_taxcode',
                             line: i
                         })
                     });

                     if (request.getSublistValue({
                         group: 'custpage_expenseanditems',
                         name: 'custpage_taxrate',
                         line: i
                     })) {
                         var taxRate = request.getSublistValue({
                             group: 'custpage_expenseanditems',
                             name: 'custpage_taxrate',
                             line: i
                         })
                     } else {
                         var taxRate = 0
                     }
                     expenseandItems.setSublistValue({
                         id: 'custpage_taxrate',
                         line: i,
                         value: taxRate
                     });


                     if (request.getSublistValue({
                         group: 'custpage_expenseanditems',
                         name: 'custpage_taxamt',
                         line: i
                     })) {
                         var taxAmnt = request.getSublistValue({
                             group: 'custpage_expenseanditems',
                             name: 'custpage_taxamt',
                             line: i
                         })
                     } else {
                         var taxAmnt = 0
                     }


                     expenseandItems.setSublistValue({
                         id: 'custpage_taxamt',
                         line: i,
                         value: taxAmnt
                     });

                     expenseandItems.setSublistValue({
                         id: 'custpage_grossamt',
                         line: i,
                         value: request.getSublistValue({
                             group: 'custpage_expenseanditems',
                             name: 'custpage_grossamt',
                             line: i
                         })
                     });


                     var newmemo = request.getSublistValue({
                         group: 'custpage_expenseanditems',
                         name: 'custpage_memo',
                         line: i
                     });
                     if (newmemo) {

                         expenseandItems.setSublistValue({
                             id: 'custpage_memo',
                             line: i,
                             value: newmemo
                         });

                     }
                 }


                 form.addSubmitButton({
                     label: 'Submit'
                 })

                 if (hiddenAction) {
                     form.addButton({
                         id: 'custpage_savebutton',
                         label: 'Save',
                         functionName: 'valuefetch'
                     });

                     /*var hiddencheck = form.addField({
                         id: 'custpage_save_hidden',
                         type: serverWidget.FieldType.CHECKBOX,
                         label: 'hiddencheck',
                     });*/
                 }

                 return form;
             } catch (e) {
                 log.debug("error@setSublistInEditMode", e)
             }
         },

         fetchProjectList(supplier2) {
             var userId1 = runtime.getCurrentUser().id;
             var jobSearchObj = search.create({
                 type: "job",
                 filters: [
                     ["allowexpenses", "is", "T"],
                     "AND", ["jobresource", "anyof", userId1]
                 ],
                 columns: [
                     search.createColumn({
                         name: "entityid",
                         sort: search.Sort.ASC,
                         label: "Name"
                     }),
                     search.createColumn({name: "internalid", label: "InternalID"})
                 ]
             });
             var searchResultCountjob = jobSearchObj.runPaged().count;
             log.debug("jobSearchObj result count", searchResultCountjob);

             var clientsearcharray = [];
             jobSearchObj.run().each(function (result) {
                 var clientValue = result.getValue(jobSearchObj.columns[0]);
                 var clientId = result.getValue(jobSearchObj.columns[1]);
                 var clientObj = {id: clientId, value: clientValue};
                 clientsearcharray.push(clientObj);
                 return true;
             });
             return clientsearcharray;
         },

         vendorCurrencySearch(supplier2) {
             var userId1 = runtime.getCurrentUser().id;
             var vendorSearchObj = search.create({
                 type: "vendor",
                 filters: [
                     ["internalid", "anyof", userId1]
                 ],
                 columns: [
                     search.createColumn({
                         name: "entityid",
                         sort: search.Sort.ASC,
                         label: "Name"
                     }),
                     search.createColumn({
                         name: "currency",
                         join: "VendorCurrencyBalance",
                         label: "Currency"
                     }),
                     search.createColumn({
                         name: "fxbalance",
                         join: "VendorCurrencyBalance",
                         label: "Balance (Foreign Currency)"
                     }),
                     search.createColumn({name: "internalid", label: "InternalID"}),
                     search.createColumn({name: "subsidiary", label: "Primary Subsidiary"}),
                     search.createColumn({
                         name: "country",
                         join: "mseSubsidiary",
                         label: "Country"
                     })
                 ]
             });
             var searchResultCount = vendorSearchObj.runPaged().count;
             log.debug("vendorSearchObj result count", searchResultCount);

             var subsidiaryObj = {}
             var searcharray1 = [];
             vendorSearchObj.run().each(function (result) {
                 var currencyValue = result.getValue(vendorSearchObj.columns[1]);
                 var idValue = result.getValue(vendorSearchObj.columns[3]);
                 var subsidiaryId = result.getValue(vendorSearchObj.columns[4]);
                 var countryId = result.getValue(vendorSearchObj.columns[5]);
                 var currencyObj = {id: idValue, value: currencyValue};
                 searcharray1.push(currencyValue);
                 subsidiaryObj.countryId = countryId
                 subsidiaryObj.subsidiaryId = subsidiaryId
                 subsidiaryObj.searcharray1 = searcharray1
                 return true;
             });
             return subsidiaryObj;
         },

         projectTaskSearchList(cproject2) {
             var jobTaskSearchObj = search.create({
                 type: "job",
                 filters:
                     [
                         ["internalid", "anyof", cproject2], "AND",
                         ["projecttask.ismilestone", "is", "F"]
                     ],
                 columns:
                     [
                         search.createColumn({
                             name: "title",
                             join: "projectTask",
                             summary: "GROUP",
                             sort: search.Sort.ASC,
                             label: "Name"
                         }),
                         search.createColumn({
                             name: "internalid",
                             join: "projectTask",
                             summary: "GROUP",
                             label: "Internal ID"
                         })
                     ]
             });
             var searchResultCountjojtask = jobTaskSearchObj.runPaged().count;
             log.debug("jobSearchObj result count", searchResultCountjojtask);

             var jobtaskArray = [];
             jobTaskSearchObj.run().each(function (result) {
                 var projecttask = result.getValue(jobTaskSearchObj.columns[0]);
                 var projecttaskid = result.getValue(jobTaskSearchObj.columns[1]);
                 var jobtaskObj = {id: projecttaskid, value: projecttask};
                 jobtaskArray.push(jobtaskObj);
                 return true;
             });
             return jobtaskArray
         },

         salesTaxCodeSearch(subsidiaryVal, countryVal) {
             var salestaxitemSearchObj = search.create({
                 type: "salestaxitem",
                 filters: [
                     ["subsidiary", "anyof", subsidiaryVal],
                     "AND", ["country", "anyof", countryVal],
                     "AND", ["availableon", "anyof", "PURCHASE", "BOTH"],
                     "AND", ["isinactive", "is", "F"]
                 ],
                 columns: [
                     search.createColumn({
                         name: "name",
                         sort: search.Sort.ASC,
                         label: "Name"
                     }),
                     search.createColumn({name: "internalid", label: "InternalID"}),
                     search.createColumn({name: "rate", label: "Rate"})
                 ]
             });
             var searchResultCounttax = salestaxitemSearchObj.runPaged().count;
             log.debug("salestaxitemSearchObj result count", searchResultCounttax);


             var taxsearcharray = [];
             var taxratearray = [];

             salestaxitemSearchObj.run().each(function (result) {
                 var taxcodeValue = result.getValue(salestaxitemSearchObj.columns[0]);
                 //  taxsearcharray.push(taxcodeValue);
                 var taxrateValue = result.getValue(salestaxitemSearchObj.columns[2]);
                 taxratearray.push(taxrateValue);
                 var internalId = result.getValue(salestaxitemSearchObj.columns[1]);
                 var taxcodeObj = {id: internalId, value: taxcodeValue};
                 taxsearcharray.push(taxcodeObj);

                 return true;
             });
             return taxsearcharray;
         },

         salesTaxWithRate(subsidiaryVal, countryVal) {
             var salestaxitemSearchObj = search.create({
                 type: "salestaxitem",
                 filters: [
                     ["subsidiary", "anyof", subsidiaryVal],
                     "AND", ["country", "anyof", countryVal],
                     "AND", ["availableon", "anyof", "PURCHASE", "BOTH"],
                     "AND", ["isinactive", "is", "F"]
                 ],
                 columns: [
                     search.createColumn({
                         name: "name",
                         sort: search.Sort.ASC,
                         label: "Name"
                     }),
                     search.createColumn({name: "internalid", label: "InternalID"}),
                     search.createColumn({name: "rate", label: "Rate"})
                 ]
             });
             var searchResultCounttax = salestaxitemSearchObj.runPaged().count;
             log.debug("salestaxitemSearchObj result count", searchResultCounttax);


             var taxsearcharray = [];
             var taxratearray = [];
             var taxcodeRateArray = [];

             salestaxitemSearchObj.run().each(function (result) {
                 var taxcodeValue = result.getValue(salestaxitemSearchObj.columns[0]);
                 //  taxsearcharray.push(taxcodeValue);
                 var taxrateValue = result.getValue(salestaxitemSearchObj.columns[2]);
                 taxratearray.push(taxrateValue);
                 var internalId = result.getValue(salestaxitemSearchObj.columns[1]);
                 var taxcodeObj = {id: internalId, value: taxcodeValue};
                 taxsearcharray.push(taxcodeObj);
                 var taxcoderateObj = {id: internalId, value: taxrateValue};
                 taxcodeRateArray.push(taxcoderateObj);
                 return true;
             });
             return taxcodeRateArray;
         },

         expenseCategorySearch(subsidiaryVal) {
             var expensecategorySearchObj = search.create({
                 type: "expensecategory",
                 filters:
                     [
                         ["subsidiary", "anyof", subsidiaryVal]
                     ],
                 columns:
                     [
                         search.createColumn({name: "internalid", label: "Internal ID"}),
                         search.createColumn({
                             name: "name",
                             sort: search.Sort.ASC,
                             label: "Name"
                         })
                     ]
             });
             var searchResultCount = expensecategorySearchObj.runPaged().count;
             log.debug("expensecategorySearchObj result count", searchResultCount);
             var categoryArray = []
             expensecategorySearchObj.run().each(function (result) {
                 var intenalID = result.getValue(expensecategorySearchObj.columns[0]);
                 var name = result.getValue(expensecategorySearchObj.columns[1]);
                 var cateObj = {id: intenalID, value: name};
                 categoryArray.push(cateObj)
                 return true;
             });
             return categoryArray;
         },

         createVendorBill(getSupplier, getDate, getRefno, getMemo, getAmount, getClient, getCurrency, request, hiddenAction, scriptContext, billId) {

             /* try {*/
             var userId1 = runtime.getCurrentUser().id;
             var supplierRec = record.load({
                 type: record.Type.VENDOR,
                 id: userId1,
                 isDynamic: true
             });
             var getTerms = supplierRec.getValue({fieldId: 'terms'});
             log.debug('getTerms', getTerms);
             log.debug("getClientttt", getClient);
             var projectRec = record.load({
                 type: record.Type.JOB,
                 id: getClient,
                 isDynamic: true
             });
             log.debug("projectReccc", projectRec);
             var department = projectRec.getValue({fieldId: 'custentitydepartment'});
             var businessLine = projectRec.getValue({fieldId: 'custentity_bussiness_line'});
             var office = projectRec.getValue({fieldId: 'custentity_office'});
             var subsidiary = projectRec.getValue({fieldId: 'subsidiary'});
             log.debug("dept", department);
             log.debug("businessLine", businessLine);
             log.debug("office", office);
             log.debug("subsidiary", subsidiary);

             if (billId) {
                 log.debug('hiddenAction', hiddenAction)
                 var billRecord = record.load({
                     type: record.Type.VENDOR_BILL,
                     id: billId,
                     isDynamic: false,
                 });
             } else {
                 log.debug("enter creation")
                 log.debug('hiddenAction', hiddenAction)
                 var billRecord = record.create({
                     type: record.Type.VENDOR_BILL,
                     isDynamic: false
                 });
             }

             log.debug("Created", "Created");
             var setSupplier = billRecord.setValue({
                 fieldId: 'entity',
                 value: userId1
             });
             log.debug("userId1", userId1);


             var setDate = billRecord.setText({
                 fieldId: 'trandate',
                 text: getDate
             });
             log.debug("getDate", getDate);
             var setRefno = billRecord.setText({
                 fieldId: 'tranid',
                 text: getRefno
             });
             log.debug("getRefno", getRefno);
             var setMemo = billRecord.setText({
                 fieldId: 'memo',
                 text: getMemo
             });
             log.debug("setMemo", setMemo);
             var setAmount = billRecord.setText({
                 fieldId: 'usertotal',
                 text: getAmount
             });
             log.debug("setAmount", getAmount);
             var setTerms = billRecord.setValue({
                 fieldId: 'terms',
                 value: getTerms
             });
             log.debug("getTerms", getTerms);
             var setBusinessLine = billRecord.setValue({
                 fieldId: 'class',
                 value: businessLine
             });
             log.debug("businessLine", businessLine);
             var setDepartment = billRecord.setValue({
                 fieldId: 'department',
                 value: department
             });
             log.debug("department", department);
             var setproject = billRecord.setValue({
                 fieldId: 'custbody_jj_body_project',
                 value: getClient
             });
             log.debug("getClient", getClient);
             var setStatus = billRecord.setValue({
                 fieldId: 'approvalstatus',
                 value: 1
             });
             var setOffice = billRecord.setValue({
                 fieldId: 'location',
                 value: " "
             });
             var setCurrency = billRecord.setText({
                 fieldId: 'currency',
                 text: getCurrency
             });
             log.debug("getCurrency", getCurrency);
             var setCreated = billRecord.setValue({
                 fieldId: 'custbody_jj_created_from',
                 value: userId1
             });
             log.debug("userId1", userId1);

             var count = request.getLineCount({
                 group: 'custpage_expenseanditems'
             });
             log.debug("Count", count);

             for (var i = 0; i < count; i++) {
                 var getCategory = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_category',
                     line: i
                 });
                 log.debug("getCategory ", getCategory);
                 var getBill = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_billablebills',
                     line: i
                 });
                 log.debug("getBill ", getBill);
                 if (getBill == 'T') {
                     var billValue = true;
                 } else {
                     var billValue = false;
                 }
                 var gettaxcode = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_taxcode',
                     line: i
                 });

                 var getAmount = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_amount1',
                     line: i
                 });
                 log.debug("getAmount ", getAmount);

                 var getTaxRate = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_taxrate',
                     line: i
                 });
                 log.debug("getTaxRate ", getTaxRate);
                 var getTaxAmt = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_taxamt',
                     line: i
                 });
                 log.debug("getTaxAmt ", getTaxAmt);
                 var getGrossAmt = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_grossamt',
                     line: i
                 });
                 log.debug("getGrossAmt ", getGrossAmt);

                 var getMemo = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_memo',
                     line: i
                 });
                 log.debug("getMemo ", getMemo);

                 var getprojectTask = request.getSublistValue({
                     group: 'custpage_expenseanditems',
                     name: 'custpage_projecttask',
                     line: i
                 });

                 var setCategory = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'category',
                     line: i,
                     value: getCategory
                 });
                 log.debug("getCategory ", getCategory);

                 var setBill = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'custcol_jj_billable',
                     line: i,
                     value: billValue
                 });
                 log.debug("billValue ", billValue);
                 var setTaxcode = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'taxcode',
                     line: i,
                     value: gettaxcode
                 });
                 log.debug("gettaxcode ", gettaxcode);

                 var setAmount = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'amount',
                     line: i,
                     value: getAmount
                 });
                 log.debug("getAmount ", getAmount);

                 var setTaxRate = billRecord.setSublistText({
                     sublistId: 'expense',
                     fieldId: 'taxrate1',
                     line: i,
                     text: getTaxRate
                 });
                 log.debug("getTaxRate ", getTaxRate);

                 var setTaxAmt = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'tax1amt',
                     line: i,
                     value: getTaxAmt
                 });
                 log.debug("getTaxAmt ", getTaxAmt);

                 var setGrossAmt = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'grossamt',
                     line: i,
                     value: getGrossAmt
                 });
                 log.debug("getGrossAmt ", getGrossAmt);

                 var setMemo = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'custcol_jj_client_bill',
                     line: i,
                     value: getClient
                 });
                 log.debug("getClient ", getClient);

                 var setSubsidiary = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'custcol_jj_subsidiary_project',
                     line: i,
                     value: subsidiary
                 });
                 log.debug("subsidiary ", subsidiary);

                 if (!getMemo) {
                     getMemo = " "
                 }
                 var setMemo = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'memo',
                     line: i,
                     value: getMemo
                 });
                 log.debug("getMemo", getMemo);

                 var setDept = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'department',
                     line: i,
                     value: department
                 });
                 log.debug("department", department);

                 var setBusiness = billRecord.setSublistValue({
                     sublistId: 'expense',
                     fieldId: 'class',
                     line: i,
                     value: businessLine
                 });
                 log.debug("businessLine", businessLine);


                 if (getprojectTask != null || getprojectTask != "" || getprojectTask != undefined) {


                     var setbillValue = billRecord.setSublistValue({
                         sublistId: 'expense',
                         fieldId: 'custcol_jj_project_task',
                         line: i,
                         value: getprojectTask,
                     });
                 } else {
                     var setbillValue = billRecord.setSublistValue({
                         sublistId: 'expense',
                         fieldId: 'custcol_jj_project_task',
                         line: i,
                         value: "",
                     });
                 }

                 var vendorArray = exports.vendorCurrencySearch()
                 var vendorSub = vendorArray.subsidiaryId
                 log.debug('vendorSub', vendorSub)

                 if (subsidiary == vendorSub) {
                     log.debug("Sub Equal", "Equal");
                     var setbillValue = billRecord.setSublistValue({
                         sublistId: 'expense',
                         fieldId: 'isbillable',
                         line: i,
                         value: billValue
                     });
                     var setcustomer = billRecord.setSublistValue({
                         sublistId: 'expense',
                         fieldId: 'customer',
                         line: i,
                         value: getClient,
                     });
                 }
             }
             var saveBill = billRecord.save();
             //     enableSourcing: true,
             //     ignoreMandatoryFields: true
             // });

             if (saveBill && hiddenAction) {
                 var id = record.submitFields({
                     type: 'customrecord430',
                     id: hiddenAction,
                     values: {
                         custrecord_jj_is_process_completed: true,
                         custrecord_jj_vendor_bill_id: saveBill
                     }
                 });
                 log.debug('id', id)

             }
             if (billId) {
                 var resp = '<html><head></head><body><script>window.alert("Successfully Updated The Vendor Bill");window.location.href = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=645&deploy=1"</script></body></html>'
             } else {
                 var resp = '<html><head></head><body><script>window.alert("Successfully Created The Vendor Bill");window.location.href = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=645&deploy=1"</script></body></html>'
             }
             scriptContext.response.write(resp);

             /*  }*/
             /*catch (e) {
                 log.debug('error@createVendorBill', e)
                 var msg = '<html><head></head><body><script>window.alert("Unable to Create Bill \\n ' + e.message + ' ");window.location.href = "https://3689903-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=612&deploy=1"</script></body></html>'
                 scriptContext.response.write(msg);
             }*/


         }


     }
     return {onRequest}

 });