/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/************************************************************************************************
 * * Aqualis Braemar| AQ-2498 |AQ-2498 vendor bill customizations   *
 * **********************************************************************************************
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Date Created : 07-July-2021
 *
 * Created By: ABIN JJ0067, Jobin & Jismi IT Services LLP
 *
 * REVISION HISTORY
 *
 *
 ***********************************************************************************************/
 define(['N/https', 'N/record', 'N/render', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
 /**
  * @param{https} https
  * @param{record} record
  * @param{render} render
  * @param{runtime} runtime
  * @param{search} search
  * @param{serverWidget} serverWidget
  */
 (https, record, render, runtime, search, serverWidget) => {
     /**
      * Defines the Suitelet script trigger point.
      * @param {Object} scriptContext
      * @param {ServerRequest} scriptContext.request - Incoming request
      * @param {ServerResponse} scriptContext.response - Suitelet response
      * @since 2015.2
      */
     const onRequest = (scriptContext) => {
         try{
             if (scriptContext.request.method == 'GET'){
                 var savedBills = dataSets.searchCustomRecord()
                 log.debug("savedBills",savedBills)

                 var form = serverWidget.createForm({
                     title: "Unsubmitted Bill List"
                 });
                 exports.designSublistStructure(form,savedBills)

                 scriptContext.response.writePage(form);

             }
         }catch (e) {
             log.debug("error@onRequest",e)
         }
     }

     var dataSets = {

         /**
          * @description to format Saved Search column to key-value pair where each key represents each columns in Saved Search
          * @param {SearchObj} savedSearchObj
          * @param {void|String} priorityKey
          * @returns {Object.<String,SearchObj.columns>}
          */
         fetchSavedSearchColumn(savedSearchObj, priorityKey) {
             let columns = savedSearchObj.columns;
             let columnsData = {},
                 columnName = '';
             columns.forEach(function (result, counter) {
                 columnName = '';
                 if (result[priorityKey]) {
                     columnName += result[priorityKey];
                 } else {
                     if (result.summary)
                         columnName += result.summary + '__';
                     if (result.formula)
                         columnName += result.formula + '__';
                     if (result.join)
                         columnName += result.join + '__';
                     columnName += result.name;
                 }
                 columnsData[columnName] = result;
             });
             return columnsData;
         },

         /**
          * @description to fetch and format the single saved search result. ie, Search result of a single row containing both text and value for each columns
          * @param {Object[]} searchResult contains search result of a single row
          * @param {Object.<String,SearchObj.columns>} columns
          * @returns {Object.<String,formattedEachSearchResult>|{}}
          */
         formatSingleSavedSearchResult(searchResult, columns) {
             let responseObj = {};
             for (let column in columns)
                 responseObj[column] = {
                     value: searchResult.getValue(columns[column]),
                     text: searchResult.getText(columns[column])
                 };
             return responseObj;
         },

         /**
          * @description to iterate over and initiate format of each saved search result
          * @param {SearchObj} searchObj
          * @param {void|Object.<String,SearchObj.columns>} columns
          * @returns {[]|Object[]}
          */
         iterateSavedSearch(searchObj, columns) {
             if (!checkForParameter(searchObj))
                 return false;
             if (!checkForParameter(columns))
                 columns = dataSets.fetchSavedSearchColumn(searchObj);

             let response = [];
             let searchPageRanges;
             try {
                 searchPageRanges = searchObj.runPaged({
                     pageSize: 1000
                 });
             } catch (err) {
                 return [];
             }
             if (searchPageRanges.pageRanges.length < 1)
                 return [];

             let pageRangeLength = searchPageRanges.pageRanges.length;
             //log.debug('pageRangeLength', pageRangeLength);

             for (let pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                 searchPageRanges.fetch({
                     index: pageIndex
                 }).data.forEach(function (result) {
                     response.push(dataSets.formatSingleSavedSearchResult(result, columns));
                 });

             return response;
         },

         searchCustomRecord(){
             var customrecord430SearchObj = search.create({
                 type: "customrecord430",
                 filters:
                     [
                         ["formulanumeric: CASE  WHEN {custrecord_jj_bill_user.id} = {user.id} THEN 1 ELSE 0 END","equalto","1"],
                         "AND",
                         ["custrecord_jj_is_process_completed","is","F"]
                     ],
                 columns:
                     [
                         search.createColumn({name: "internalid", label: "Internal ID"}),
                         search.createColumn({name: "custrecord_vendor_bill_supplier", label: "SUPPLIER"}),
                         search.createColumn({name: "custrecord_vendor_bill_date", label: "DATE"}),
                         search.createColumn({name: "custrecord_vendor_bill_amount", label: "AMOUNT"}),
                         search.createColumn({name: "custrecord_vendor_bill_cli", label: "PROJECT"}),
                         search.createColumn({name: "custrecord_vendor_bill_status", label: "STATUS"}),
                         search.createColumn({name: "custrecord_vendor_bill_referenceno", label: "REFERENCENO"}),
                         search.createColumn({name: "custrecord_vendor_bill_memo", label: "MEMO"}),
                         
                     ]
             });
             var searchResultCount = customrecord430SearchObj.runPaged().count;
             log.debug("customrecord430SearchObj result count",searchResultCount);
             return dataSets.iterateSavedSearch(customrecord430SearchObj, dataSets.fetchSavedSearchColumn(customrecord430SearchObj, 'label'));
         },


     }

     var exports = {
         designSublistStructure(form,savedBills){
             try{

                 var pageSublist = form.addSublist({
                     id: 'custpage_remove_resource_sublist',
                     type: serverWidget.SublistType.LIST,
                     label: 'Bills'
                 });

                 var resourceField = pageSublist.addField({
                     id: 'custpage_page_link',
                     type: serverWidget.FieldType.TEXT,
                     label: 'LINK'
                 });

                 /*var resourceField = pageSublist.addField({
                     id: 'custpage_supplier_name',
                     type: serverWidget.FieldType.TEXT,
                     label: 'SUPPLIER NAME'
                 });*/
                 var roleField = pageSublist.addField({
                     id: 'custpage_date_',
                     type: serverWidget.FieldType.DATE,
                     label: 'DATE'
                 });
                 var resourceIdField = pageSublist.addField({
                     id: 'custpage_doc_id',
                     type: serverWidget.FieldType.TEXT,
                     label: 'DOCUMENT NUMBER'
                 });

                 var roleField = pageSublist.addField({
                     id: 'custpage_project_',
                     type: serverWidget.FieldType.TEXT,
                     label: 'Client/Project'
                 });
                 var roleField = pageSublist.addField({
                     id: 'custpage_amount_',
                     type: serverWidget.FieldType.CURRENCY,
                     label: 'Total'
                 });

                 var roleField = pageSublist.addField({
                     id: 'custpage_memo_',
                     type: serverWidget.FieldType.TEXTAREA,
                     label: 'Memo'
                 });
                 /*var resourceField = pageSublist.addField({
                     id: 'custpage_supplier_currency',
                     type: serverWidget.FieldType.CURRENCY,
                     label: 'STATUS'
                 });*/



                 exports.setUpSublistValues(pageSublist,savedBills)

                log.debug("SAVED bILLS",savedBills);
             }catch (e) {
                 log.debug("error@design",e)
             }
         },

         setUpSublistValues(pageSublist,savedBills){
             try{
                 for(var i=0;i<savedBills.length;i++){


                     var print_url = '<A href="/app/site/hosting/scriptlet.nl?script=646&deploy=1' + "&idnum=" + savedBills[i]["Internal ID"].value + "&actionType=" + "normalEdit" + '"  target="_blank">View</A>'

                     pageSublist.setSublistValue({
                         id: 'custpage_page_link',
                         line: i,
                         value: print_url
                     });

                     /*if(savedBills[i]["SUPPLIER"].value)
                         pageSublist.setSublistValue({
                             id: 'custpage_supplier_name',
                             line: i,
                             value: savedBills[i]["SUPPLIER"].value
                         });*/

                     if(savedBills[i]["REFERENCENO"].value)
                         pageSublist.setSublistValue({
                             id: 'custpage_doc_id',
                             line: i,
                             value: savedBills[i]["REFERENCENO"].value
                         });

                     if(savedBills[i]["DATE"].value)
                         pageSublist.setSublistValue({
                             id: 'custpage_date_',
                             line: i,
                             value: savedBills[i]["DATE"].value
                         });

                     if(savedBills[i]["PROJECT"].text)
                         pageSublist.setSublistValue({
                             id: 'custpage_project_',
                             line: i,
                             value: savedBills[i]["PROJECT"].text
                         });

                     if(savedBills[i]["AMOUNT"].value)
                         pageSublist.setSublistValue({
                             id: 'custpage_amount_',
                             line: i,
                             value: savedBills[i]["AMOUNT"].value
                         });

                     if(savedBills[i]["MEMO"].value)
                         pageSublist.setSublistValue({
                             id: 'custpage_memo_',
                             line: i,
                             value: savedBills[i]["MEMO"].value
                         });
                    /* if(savedBills[i]["MEMO"].value)
                         pageSublist.setSublistValue({
                             id: 'custpage_memo_',
                             line: i,
                             value: savedBills[i]["MEMO"].value
                         });*/

                 }

             }catch (e) {
                 log.debug("setUpSublistValues",e)
             }
         }
     }

     /**
      * @description Check whether the given parameter argument has value on it or is it empty.
      * ie, To check whether a value exists in parameter
      * @param {*} parameter parameter which contains/references some values
      * @param {*} parameterName name of the parameter, not mandatory
      * @returns {Boolean} true if there exist a value, else false
      */
     function checkForParameter(parameter, parameterName) {
         if (parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false && parameter !== "null" && parameter !== "undefined" && parameter !== " " && parameter !== 'false') {
             return true;
         } else {
             if (parameterName)
                 log.debug('Empty Value found', 'Empty Value for parameter ' + parameterName);
             return false;
         }
     }

     return {onRequest}

 });