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
     function setValuesinSublist(searchResult, displayBill) {
         try {
             var count = searchResult.length;
             log.debug("Count",count);
             for (var i = 0; i < searchResult.length; i++) {

                 displayBill.setSublistValue({
                     id: 'custpage_internalid',
                     line: i,
                     value: checkif(searchResult[i].internalid[0].value)
                 });

                 var print_url = '<A href="/app/site/hosting/scriptlet.nl?script=646&deploy=1' + "&idnum=" + searchResult[i].internalid[0].value + "&actionType=" + "savedEdit" +'"  target="_blank">View</A>'
                 displayBill.setSublistValue({
                     id: 'custpage_view',
                     line: i,
                     value: print_url
                 });
                 //  viewbill.link = "/app/site/hosting/scriptlet.nl?script=612&deploy=1" ;
                 displayBill.setSublistValue({
                     id: 'custpage_documentnumber',
                     line: i,
                     value: checkif(searchResult[i].tranid)
                 });
                 displayBill.setSublistValue({
                     id: 'custpage_date',
                     line: i,
                     value: checkif(searchResult[i].trandate)
                 });
                 if(checkif(searchResult[i].custbody_jj_body_project) != '_'){
                     displayBill.setSublistValue({
                         id: 'custpage_clientorproject',
                         line: i,
                         value: checkif(searchResult[i].custbody_jj_body_project[0].text)
                     });
                 }else{
                     displayBill.setSublistValue({
                         id: 'custpage_clientorproject',
                         line: i,
                         value: "_"
                     });
                 }
                 displayBill.setSublistValue({
                     id: 'custpage_totalamount',
                     line: i,
                     value:checkif(searchResult[i].fxamount)
                 });
                 displayBill.setSublistValue({
                     id: 'custpage_memo',
                     line: i,
                     value:checkif(searchResult[i].memo)
                 });
                 displayBill.setSublistValue({
                     id: 'custpage_status',
                     line: i,
                     value:checkif(searchResult[i].approvalstatus[0].text)
                 });


                 displayBill.setSublistValue({
                     id: 'custpage_currency',
                     line: i,
                     value:checkif(searchResult[i].currency[0].text)
                 });
                 displayBill.setSublistValue({
                     id: 'custpage_payment_status',
                     line: i,
                     value:checkif(searchResult[i].statusref[0].text)
                 });
                 if(checkif(searchResult[i]["applyingTransaction.trandate"]) != '_') {
                     displayBill.setSublistValue({
                         id: 'custpage_payment_date',
                         line: i,
                         value: checkif(searchResult[i]["applyingTransaction.trandate"])
                     });
                 }else{
                     displayBill.setSublistValue({
                         id: 'custpage_payment_date',
                         line: i,
                         value: null
                     });
                 }

                 var remaining = Number(searchResult[i].fxamount) - Number(searchResult[i].fxamountpaid)
                 displayBill.setSublistValue({
                     id: 'custpage_amount_paid',
                     line: i,
                     value:checkif(searchResult[i].fxamountpaid)
                 });
                 displayBill.setSublistValue({
                     id: 'custpage_amount_remianing',
                     line: i,
                     value:Number(remaining)
                 });

             }
         } catch (e) {
             log.debug("Err@  setValuesinSublist", e);
         }
     }
     function checkif(singleitem) {
         if (singleitem == "" || singleitem == null || singleitem == undefined || singleitem == '- None -' || singleitem == " ") {
             return "_";
         } else {
             return singleitem;
         }
     }

     function createSearch(status) {
         try {
             log.debug("status",status);
             var userId1 = runtime.getCurrentUser().id;
             if (status == "" || status == null ||  status == 0) {
                 var statusArray = ["approvalstatus", "anyof", "1", "2", "3"];
             }else{
                 /*  if(status == 2){
                       var statusArray = ["approvalstatus", "anyof", "VendBill:A,VendBill:B"];
                   }else{*/
                 var statusArray = ["approvalstatus", "anyof", status];
                 //}

             }


             /*if(paymentStatus == "" || paymentStatus == null || paymentStatus == 0){

               var  paymentStatusArray = ["applyingtransaction.status","noneof","@NONE@"]

             }else{
                 var  paymentStatusArray =  ["applyingtransaction.status","anyof",paymentStatus]
             }*/



             log.debug("statusArray",statusArray);
             var vendorbillSearchObj = search.create({
                 type: "vendorbill",
                 filters:
                     [
                         ["type", "anyof", "VendBill"],
                         "AND",
                         ["vendor.internalid", "anyof", userId1],
                         "AND",
                         ["mainline", "is", "T"],
                         "AND",
                         statusArray,
                         "AND",
                         ["formulatext: {custbody_jj_created_from}","isnotempty",""],
                         /*"AND",
                         paymentStatusArray,*/


                     ],
                 /*settings: [
                     search.createSetting({
                         name: 'consolidationtype',
                         value: 'NONE'
                     })],*/
                 columns:
                     [
                         search.createColumn({name: "entity", label: "Name"}),
                         search.createColumn({name: "internalid", label: "Internal ID"}),
                         search.createColumn({name: "trandate", label: "Date"}),
                         search.createColumn({name: "tranid", label: "Document Number"}),
                         search.createColumn({name: "custbody_jj_body_project", label: "Client/Project"}),
                         search.createColumn({name: "amount", label: "Amount"}),
                         search.createColumn({name: "fxamount", label: "Actual Amount"}),
                         search.createColumn({name: "memo", label: "Memo"}),
                         search.createColumn({name: "approvalstatus", label: "Status"}),
                         search.createColumn({name: "currency", label: "Currency"}),
                         search.createColumn({name: "fxamountpaid", label: "Amount Paid (Foreign Currency)"}),
                         search.createColumn({name: "amountremaining", label: "Amount Remaining"}),
                         search.createColumn({name: "statusref", label: "Status"}),
                         search.createColumn({name: "fxamount", label: "Amount (Foreign Currency)"}),
                         search.createColumn({
                             name: "trandate",
                             join: "applyingTransaction",
                             label: "Date"
                         }),
                         search.createColumn({
                             name: "datecreated",
                             sort: search.Sort.DESC,
                             label: "Date Created"
                         })
                     ]
             });
             var searchResultCount = vendorbillSearchObj.runPaged().count;
             log.debug("vendorbillSearchObj result count", searchResultCount);

             // if()

             var vendorBillArray = [];
             vendorbillSearchObj.run().each(function (result) {
                 /*      var idValue = result.getValue(vendorbillSearchObj.columns[1]);
                       var date = result.getValue(vendorbillSearchObj.columns[2]);
                       var docNum = result.getValue(vendorbillSearchObj.columns[3]);
                       var refNum = result.getValue(vendorbillSearchObj.columns[4]);
                       var project = result.getValue(vendorbillSearchObj.columns[5]);
                       var totalAmt = result.getValue(vendorbillSearchObj.columns[6]);
                       var billObj = {id: idValue, value: date};
                       var billObj1 = {id: docNum, value: refNum};
                       var billObj2 = {id: project, value: totalAmt};
                       vendorBillArray.push(billObj,billObj1,billObj2);  */
                 var allValues = result.getAllValues();
                 vendorBillArray.push(allValues);
                 return true;
             });
             return vendorBillArray;
         } catch (e) {
             log.debug("Err@ createSearch", e);
             return []
         }
     }
     const onRequest = (scriptContext) => {

         try {
             var statusparam = scriptContext.request.parameters.statusValue;
           //  var paymentStatus = scriptContext.request.parameters.paymentStatus;
             log.debug("status", statusparam);
             var form = serverWidget.createForm({
                 title: 'Submitted Bill List'
             });
             form.clientScriptFileId = 249043;
             var userId = runtime.getCurrentUser().id;
             log.debug("userId", userId);

             var status = form.addField({
                 id: 'custpage_status1',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Status'
             });
             status.addSelectOption({
                 value: 0,
                 text: ""
             });

             status.addSelectOption({
                 value: 1,
                 text: "Pending Approval"
             });
             status.addSelectOption({
                 value: 2,
                 text: "Approved"
             });
             status.addSelectOption({
                 value: 3,
                 text: "Rejected"
             });

             if(statusparam){
                 status.defaultValue = statusparam
             }
             var paymentStatusfield = form.addField({
                 id: 'custpage_payment_status',
                 type: serverWidget.FieldType.SELECT,
                 label: 'Payment Status'
             });
             paymentStatusfield.addSelectOption({
                 value: 0,
                 text: ""
             });
             paymentStatusfield.addSelectOption({
                 value: 1,
                 text: "Cancelled"
             });
             paymentStatusfield.addSelectOption({
                 value: 2,
                 text: "Open"
             });
             paymentStatusfield.addSelectOption({
                 value: 3,
                 text: "Paid In Full"
             });
             paymentStatusfield.addSelectOption({
                 value: 4,
                 text: "Pending Approval"
             });
             paymentStatusfield.addSelectOption({
                 value: 5,
                 text: "Rejected"
             });
             /*if(paymentStatus){
                 paymentStatusfield.defaultValue = paymentStatus
             }*/

             var displayBill = form.addSublist({
                 id: 'custpage_displaybill',
                 type: serverWidget.SublistType.LIST,
                 label: 'Bills'
             });
             displayBill.addField({
                 id: 'custpage_internalid',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Internal ID'
             }).updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
             var urlfield = displayBill.addField({
                 id: 'custpage_view',
                 type: serverWidget.FieldType.TEXT,
                 label: 'View'
             }).updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});


             //      urlfield.linkText = 'View';
             //        urlfield.defautValue = "/app/site/hosting/scriptlet.nl?script=612&deploy=1"


             displayBill.addField({
                 id: 'custpage_date',
                 type: serverWidget.FieldType.DATE,
                 label: 'Date'
             });
             displayBill.addField({
                 id: 'custpage_documentnumber',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Document Number'
             });

             displayBill.addField({
                 id: 'custpage_clientorproject',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Client/Project'
             });
             displayBill.addField({
                 id: 'custpage_memo',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Memo'
             });
             displayBill.addField({
                 id: 'custpage_currency',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Currency'
             });
             displayBill.addField({
                 id: 'custpage_payment_status',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Payment Status'
             });
             displayBill.addField({
                 id: 'custpage_payment_date',
                 type: serverWidget.FieldType.DATE,
                 label: 'Payment Date'
             });
             displayBill.addField({
                 id: 'custpage_totalamount',
                 type: serverWidget.FieldType.CURRENCY,
                 label: 'Amount'
             });
             displayBill.addField({
                 id: 'custpage_amount_paid',
                 type: serverWidget.FieldType.CURRENCY,
                 label: 'Amount Paid'
             });
             displayBill.addField({
                 id: 'custpage_amount_remianing',
                 type: serverWidget.FieldType.CURRENCY,
                 label: 'Amount Remaining'
             });


             displayBill.addField({
                 id: 'custpage_status',
                 type: serverWidget.FieldType.TEXT,
                 label: 'Status'
             });

         } catch (e) {
             log.debug("Err@ onRequest", e);
         }

         log.debug("statusparam", statusparam);
         var searchResult = createSearch(statusparam);

         /*    for (var j=0; j < searchResult.length;j++){
                 displayBill.setSublistValue({
                     id: 'custpage_view',
                     line: i,
                     value: checkif(searchResult[i].subsidiary[0].text)
                 })
             }  */

         log.debug("Search Result",searchResult);
         var setSublist = setValuesinSublist(searchResult, displayBill);
         scriptContext.response.writePage(form);
     }

     return {onRequest}

 });