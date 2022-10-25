/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
 define(['N/currentRecord', 'N/record', 'N/runtime', 'N/search', 'N/url','N/https'],
 /**
  * @param{currentRecord} currentRecord
  * @param{record} record
  * @param{runtime} runtime
  * @param{search} search
  * @param{url} url
  */
 function(currentRecord, record, runtime, search, url,https) {
 
 
 
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
             if (scriptContext.fieldId == 'custpage_status1') {
                 var currentRecord = scriptContext.currentRecord;
                 var statusValue = currentRecord.getValue({fieldId: 'custpage_status1'});
                 console.log("statusValue", statusValue);

                 var paymentStatus = currentRecord.getValue({fieldId: 'custpage_payment_status'});
                 /*var oldUrl = window.location.href;
                 window.location.href(oldUrl + "&idval" + statusValue);
                   */
                 var output = url.resolveScript({
                     scriptId: "customscript_jj_view_vendorbill",
                     deploymentId: "customdeploy_jj_view_vendorbill",
                     params: {
                         statusValue: statusValue,
                         paymentStatus: paymentStatus
                     }
                 });
 
                log.debug('url', output);
                 window.location.href = output;
 
 
             }
         }catch (e) {
             console.log("Error@ fieldChange",e);
         }
     }
 
 
     return {
 
         fieldChanged: fieldChanged
 
     };
     
 });