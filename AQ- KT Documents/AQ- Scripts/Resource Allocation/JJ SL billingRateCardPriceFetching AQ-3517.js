/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/currentRecord', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/ui/serverWidget', 'N/url'],
    /**
 * @param{currentRecord} currentRecord
 * @param{https} https
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 * @param{serverWidget} serverWidget
 * @param{url} url
 */
    (currentRecord, https, record, runtime, search, task, serverWidget, url) => {

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
         * Function to check the price of the rate card.
         *
         * @param {genericBillingClass} genericBillingClass - fieldValue
         * @param {rateCardId} rateCardId - fieldValue
         * @param {prjCurrency} prjCurrency - fieldValue
         * @returns {res} res - result
         *
         * @since 2015.2
         */
        function rateCardSearch(genericBillingClass,rateCardId,prjCurrency){
            try{
                log.debug("genericBillingClass search: ",genericBillingClass)
                log.debug("rateCardId search: ",rateCardId)
                log.debug("prjCurrency search: ",prjCurrency)
                if(checkForParameter(genericBillingClass)==true&&checkForParameter(rateCardId)==true&&checkForParameter(prjCurrency)==true){
                    var billingratecardSearchObj = search.create({
                        type: "billingratecard",
                        filters:
                            [
                                ["currency","anyof",prjCurrency],
                                "AND",
                                ["internalid","anyof",rateCardId],
                                "AND",
                                ["billingclass","anyof",genericBillingClass],
                                "AND",
                                ["effectivedate","onorbefore","today"],
                                "AND",
                                [["enddate","onorafter","today"],"OR",["formuladate: {enddate}","isempty",""]]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    summary: "MAX",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({
                                    name: "price",
                                    summary: "MAX",
                                    label: "Price"
                                })
                            ]
                    });
                    var searchResultCount = billingratecardSearchObj.runPaged().count;
                    var res= []
                    billingratecardSearchObj.run().each(function(result){
                        // .run().each has a limit of 4,000 results
                        var name = result.getValue({
                            name: "name",
                            summary: "MAX",
                            sort: search.Sort.ASC
                        })
                        var price = result.getValue({
                            name: "price",
                            summary: "MAX"
                        })
                        res.push({
                            name: name,
                            price: price
                        })
                        return true;
                    });
                }
                log.debug("res: ",res)
                return res
            }
            catch (e) {
                log.debug("Error @ ratecard Search: ",e.name+": "+e.message)
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
                if(scriptContext.request.method === 'POST') {
                    var genericBillingClass = scriptContext.request.parameters.genericBillingClass
                    var rateCardId = scriptContext.request.parameters.rateCardId
                    var prjCurrency = scriptContext.request.parameters.prjCurrency
                    log.debug("genericBillingClass: ",genericBillingClass)
                    log.debug("rateCardId: ",rateCardId)
                    log.debug("prjCurrency: ",prjCurrency)
                    var rateCardResult = rateCardSearch(genericBillingClass,rateCardId,prjCurrency)
                    log.debug("rateCardResult: ",rateCardResult)
                    scriptContext.response.write(JSON.stringify({
                        status: "SUCCESS",
                        message: rateCardResult
                    }));
                }
            }
            catch (e) {
                log.debug("Error @ BillingRate Card Price Fetching: ",e.name+" : "+e.message)
            }
        }

        return {onRequest}

    });
