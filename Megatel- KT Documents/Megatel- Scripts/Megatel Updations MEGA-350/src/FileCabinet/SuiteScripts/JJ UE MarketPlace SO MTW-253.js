/****************************************************************************
 * Mega Tel Wireless
 * MTW-253 KPI for the newly created custom record
 * **************************************************************************
 * Date: 04/05/2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description : Set sales rep partner, regional manager, marketing manager in the custom record Marketplace Sales order.
 * Date created : 04 May 2019
 *
 * REVISION HISTORY
 *
 * Revision 1.0 04/05/2020 md: Create
 *
 ****************************************************************************/
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],

    function (record, search) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {
            try {
                if (scriptContext.type != 'delete') {
                    // get Current Marketplace Sales order record
                    var rec = scriptContext.newRecord;
                    // get current id
                    var recId = scriptContext.newRecord.id;
                    // get the value of tcetra id
                    var tectraId = rec.getValue({
                        fieldId: 'custrecord_jj_merchant_account_id'
                    });
                    if (tectraId) {
                        var customerSearchObj = search.create({
                            type: "customer",
                            filters: [
                                ["custentity1", "is", tectraId],
                                "AND",
                                ["isinactive", "is", "F"]
                            ],
                            columns: [
                                search.createColumn({name: "altname", label: "Name"}),
                                search.createColumn({name: "internalid", label: "Internal ID"})
                            ]
                        });
                        var searchResultCount = customerSearchObj.runPaged().count;
                        log.debug("customerSearchObj result count", searchResultCount);

                        if (searchResultCount == 1) {
                            customerSearchObj.run().each(function (result) {
                                // get the customer id
                                var customerId = result.getValue({
                                    name: 'internalid'
                                });
                                log.debug("customerId", customerId);
                                // To get the sales rep partner id from the customer record
                                var lookupfieldofpartner = search.lookupFields({
                                    type: 'customer',
                                    id: customerId,
                                    columns: ['partner']
                                });
                                if (lookupfieldofpartner.partner[0]) {
                                    var salesreppartner = lookupfieldofpartner.partner[0].value;
                                }
                                var routerunId = record.submitFields({
                                    type: 'customrecord_jj_marketplace_sales_order',
                                    id: recId,
                                    values: {
                                        custrecord_jj_marketplace_salesrep_partr: salesreppartner
                                    },
                                    options: {
                                        enableSourcing: true
                                    }
                                });
                            });

                        }
                    } else {
                        var customerId = rec.getValue({
                            fieldId: 'custrecord_jj_merchant_name'
                        });
                        if (customerId) {
                            // To get the sales rep partner id from the customer record
                            var lookupfieldofpartner = search.lookupFields({
                                type: 'customer',
                                id: customerId,
                                columns: ['partner']
                            });
                            if (lookupfieldofpartner.partner[0]) {
                                var salesreppartner = lookupfieldofpartner.partner[0].value;
                            }

                            var routerunId = record.submitFields({
                                type: 'customrecord_jj_marketplace_sales_order',
                                id: recId,
                                values: {
                                    custrecord_jj_marketplace_salesrep_partr: salesreppartner
                                },
                                options: {
                                    enableSourcing: true
                                }
                            });
                        }
                    }
                }

            } catch (err) {
                log.debug("ERROR_ON_SUBMIT", err);
            }

        }

        return {
            afterSubmit: afterSubmit
        };

    });