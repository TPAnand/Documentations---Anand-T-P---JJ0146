/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-765
 * Combined scripts for Project Record
 * **************************************************************************
 * Date : 20-07-2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description :
 * The combined client scripts that are deployed for project record
 * Date created :20-07-2020
 *
 * REVISION HISTORY
 * Revision 1.0 ${20-07-2020} Febin : created
 *
 ******************************************************************************/

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-60
 * Task 4: Custom invoice button in project record
 *************************************************************************
 * Date : 22-01-2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description : This script is to call the suitelet on the button click
 * Date created :22-01-2020
 *
 * REVISION HISTORY
 *
 * Revision 1.0 ${22-01-2020} Navia : created
 * Revision 1.1 ${28-02-2020} Navia : updated (AQ-145)
 * Revision 1.2 ${29-04-2020} Navia : updated (AQ-300)
 * Revision 1.3 $(29-04-2020) Febin: Updated (AQ-227)
 * Revision 1.4 $(01-05-2020) Navia: Updated (AQ-313)
 * Revision 1.5 $(07-05-2020) Gloria: Updated (AQ-299)
 * Revision 1.6 $(08-06-2020) Navia: Updated (AQ-481)
 ******************************************************************************/

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-224
 * AQ-224 CS Attach or Detach Policy Button
 *************************************************************************
 *
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description : This script is for the Client script for Attach Policy and Detach Policy page
 *
 *
 ******************************************************************************/
/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-415
 * Add label
 * **************************************************************************
 * Date : 02-06-2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description :
 * add label based address in ucr
 *
 * REVISION HISTORY
 *
 *
 ******************************************************************************/

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-318
 * Populate the tax rate in UCR from tax code field
 * **************************************************************************
 * Date : 07-05-2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description :
 * Populate the tax rate in UCR from tax code field
 *
 * REVISION HISTORY
 *
 *
 ******************************************************************************/

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-3561
 * Production Movement of Resource Allocation
 * **************************************************************************
 * Date : 26-04-2022
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description :
 * Redirect to the resource Allocation page from the Button click
 * Date created :26-04-2020
 *
 * Created By: Anand T P
 *
 * REVISION HISTORY
 *
 ******************************************************************************/

define(['N/currentRecord', 'N/url', 'N/search', 'N/https', 'N/record', 'N/currency'],

    function (currentRecord, url, search, https, record, currency) {

        // ----------------------> For Resource Allocation <----------------------- //
        var curRec = currentRecord.get().id;
        // --------------------------------------------------------------------- //

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */

        function pageInit(scriptContext) {
            try {
                console.log('pageInit cs Invoice button ORIGINAL')
                scriptContext.currentRecord.setValue({
                    fieldId: 'jobbillingtype',
                    value: 'TM'
                });

                //To enable the ProjectID field when creating a new record
                if (scriptContext.mode == 'create') {
                    scriptContext.currentRecord.setValue({
                        fieldId: 'autoname',
                        value: true
                    });
                    scriptContext.currentRecord.setValue({
                        fieldId: 'autoname',
                        value: false
                    });
                } else if (scriptContext.mode == 'edit') {

                    var projectid = scriptContext.currentRecord.getValue({
                        fieldId: 'entityid'
                    });
                    console.log('projectid', projectid)
                    scriptContext.currentRecord.setValue({
                        fieldId: 'autoname',
                        value: true
                    });
                    scriptContext.currentRecord.setValue({
                        fieldId: 'autoname',
                        value: false
                    });
                    scriptContext.currentRecord.setValue({
                        fieldId: 'entityid',
                        value: projectid
                    });


                }


                var invoice_type = scriptContext.currentRecord.getValue({
                    fieldId: 'custentity_jj_invoice_type'
                });

                var field = scriptContext.currentRecord.getField({
                    fieldId: 'custentity_jj_third_party_customer'
                });
                console.log('field', field)
                var bill_currency = scriptContext.currentRecord.getField({
                    fieldId: 'custpage_billingcurrencyfiltered'
                });
                console.log('bill_currency', bill_currency)
                var taxField_virtual = scriptContext.currentRecord.getField({
                    fieldId: 'custpage_taxcodebodyfiltered'
                });

                console.log('taxField_virtual', taxField_virtual)
                var addressBody = scriptContext.currentRecord.getField({
                    fieldId: 'custentity_jj_address'
                });

                var ucr_body = scriptContext.currentRecord.getField({
                    fieldId: 'custentity_jj_ucr_number'
                });
                console.log('ucr_body', ucr_body)
                bill_currency.isMandatory = true;
                if (invoice_type == 1) { //yes
                    field.isDisabled = true; //TO DISABLE THE 'THIRD PARTY CUSTOMER' FIELD IF INVOICE TYPE IS 'MUTTI PARTY INVOICE'(YES)
                    // taxField_virtual.isDisabled = true;
                    taxField_virtual.isMandatory = false;
                    addressBody.isDisabled = true;
                    ucr_body.isDisabled = true;
                    document.getElementById("custom83lnk").style.display = "";

                } else { //no
                    field.isDisabled = false;
                    // taxField_virtual.isDisabled = false;
                    taxField_virtual.isMandatory = true;
                    addressBody.isDisabled = false;
                    ucr_body.isDisabled = false;
                    document.getElementById("custom83lnk").style.display = "none"; //TO HIDE THE 'POLICY DETAILS' SUBTAB
                }
            } catch (err) {
                console.log("Error @ pageInit", err);
            }
        }

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
                // if (window.onbeforeunload) {
                //     window.onbeforeunload = function () {
                //         null;
                //     };
                // }

                var check = scriptContext.currentRecord.getValue({
                    fieldId: 'autoname'
                });
                console.log('check', check)

                var project_description = scriptContext.currentRecord.getValue({
                    fieldId: 'companyname'
                });
                console.log('project_descriptiotn', project_description)

                if (scriptContext.fieldId == 'autoname' && check == true) {


                    scriptContext.currentRecord.setValue({
                        fieldId: 'entityid',
                        value: project_description
                    });
                }

                //CALCULATE EST. COST BASE CURRENCY ON TE FIELD CHANGE OF EST. COST(USD)
                if (scriptContext.fieldId == 'custentity_jj_agreed_costs') {

                    var estCost_usd = scriptContext.currentRecord.getValue({
                        fieldId: 'custentity_jj_agreed_costs'
                    });
                    console.log('estCost_usd', estCost_usd)

                    var subsidiary = scriptContext.currentRecord.getValue({
                        fieldId: 'subsidiary'
                    });
                    console.log('subsidiary', subsidiary)

                    var fieldLookUp = search.lookupFields({
                        type: 'subsidiary',
                        id: subsidiary,
                        columns: ['currency']
                    });
                    console.log('fieldLookUp', fieldLookUp)

                    var rate = currency.exchangeRate({
                        source: 'USD',
                        target: fieldLookUp.currency[0].value,
                        date: new Date()
                    });
                    console.log('rate', rate)

                    var est_amount = estCost_usd * rate;
                    console.log('est_amount', est_amount)

                    scriptContext.currentRecord.setValue({
                        fieldId: 'custentity_jj_est_fees_base_curr',
                        value: est_amount //yes
                    });
                }
                //SET 'ATTACH POLICY SECURITY' AS 'YES' ON FIELD CHANGE OF 'ASSURED NAME'
                if (scriptContext.fieldId == 'custentity_jj_assured_name') {

                    var assuredName = scriptContext.currentRecord.getValue({
                        fieldId: 'custentity_jj_assured_name'
                    });

                    if (assuredName) {
                        scriptContext.currentRecord.setValue({
                            fieldId: 'custentity_jj_invoice_type',
                            value: 1 //yes
                        });
                    } else {
                        scriptContext.currentRecord.setValue({
                            fieldId: 'custentity_jj_invoice_type',
                            value: 2 //no
                        });
                    }

                }

                if (scriptContext.fieldId == 'custentity_jj_third_party_customer') {
                    scriptContext.currentRecord.setValue({
                        fieldId: 'custentity_jj_address',
                        value: null
                    });
                }

                //FIELD CHANGE OF PRIMARY CURRENCY --> SET THE BILLING CURRENCY
                if (scriptContext.fieldId == 'currency') {
                    var prim_currency = scriptContext.currentRecord.getValue({
                        fieldId: 'currency'
                    });
                    console.log('prim_currency', prim_currency)

                    scriptContext.currentRecord.setValue({
                        fieldId: 'custpage_billingcurrencyfiltered',
                        value: prim_currency
                    });
                }
                //FIELD CHANGE OF SUBSIDIARY TO SET THE TAX CODE FILTERED FIELD
                if (scriptContext.fieldId == 'subsidiary') {
                    //setting the taxcode(body field) select options

                    //to fetch the subsidiary and country
                    //get the subsidiary
                    var subsidiaryV = scriptContext.currentRecord.getValue({
                        fieldId: 'subsidiary'
                    });
                    console.log('subsidiaryV', subsidiaryV)
                    var subsidiary_country = searchSubs_country(subsidiaryV)
                    console.log('subsidiary_country', subsidiary_country)

                    //to fetch the tax codes
                    var taxcodelist = searchTaxcode(subsidiary_country, subsidiaryV)
                    console.log('taxcodelist', taxcodelist)

                    //get the field added using script
                    var field = scriptContext.currentRecord.getField({
                        fieldId: 'custpage_taxcodebodyfiltered'
                    });
                    // Insert a new option.



                    //to remove the existing options
                    RemoveSelectValue(field)
                    //to set the select options
                    // field.insertSelectOption({
                    //     value: 0,
                    //     text: null
                    // });
                    setSelectvalues(taxcodelist, field)
                }

                if (scriptContext.fieldId == 'custentity_jj_invoice_type') {
                    var invoice_type = scriptContext.currentRecord.getValue({
                        fieldId: 'custentity_jj_invoice_type'
                    });
                    console.log('invoice_type', invoice_type)

                    var field = scriptContext.currentRecord.getField({
                        fieldId: 'custentity_jj_third_party_customer'
                    });

                    var taxField_virtual = scriptContext.currentRecord.getField({
                        fieldId: 'custpage_taxcodebodyfiltered'
                    });

                    var addressBody = scriptContext.currentRecord.getField({
                        fieldId: 'custentity_jj_address'
                    });

                    var ucr_body = scriptContext.currentRecord.getField({
                        fieldId: 'custentity_jj_ucr_number'
                    });

                    if (invoice_type == 1) {
                        field.isDisabled = true; //TO DISABLE THE 'THIRD PARTY CUSTOMER' FIELD IF INVOICE TYPE IS 'MUTTI PARTY INVOICE'(YES)
                        //taxField_virtual.isDisabled = true;
                        taxField_virtual.isMandatory = false;
                        addressBody.isDisabled = true;
                        ucr_body.isDisabled = true;
                        document.getElementById("custom83lnk").style.display = "";

                    } else {
                        field.isDisabled = false;
                        //taxField_virtual.isDisabled = false;
                        taxField_virtual.isMandatory = true;
                        addressBody.isDisabled = false;
                        ucr_body.isDisabled = false;
                        document.getElementById("custom83lnk").style.display = "none"; //TO HIDE THE 'POLICY DETAILS' SUBTAB
                    }

                }
                if (scriptContext.fieldId == 'parent') {
                    console.log('scriptContext.fieldId', scriptContext.fieldId)
                    var client = scriptContext.currentRecord.getValue({
                        fieldId: 'parent'
                    });

                    scriptContext.currentRecord.setValue({
                        fieldId: 'custentity_jj_third_party_customer',
                        value: client
                    });
                }
                //on Field change of status set values to Allow time and Allow Expense
                if (scriptContext.fieldId == 'entitystatus') {
                    var status = scriptContext.currentRecord.getValue({
                        fieldId: 'entitystatus'
                    });
                    // console.log("status", status);
                    if (status != 2) {
                        scriptContext.currentRecord.setValue({
                            fieldId: 'allowtime',
                            value: false
                        });
                        scriptContext.currentRecord.setValue({
                            fieldId: 'allowexpenses',
                            value: false
                        });
                    } else {
                        scriptContext.currentRecord.setValue({
                            fieldId: 'allowtime',
                            value: true
                        });
                        scriptContext.currentRecord.setValue({
                            fieldId: 'allowexpenses',
                            value: true
                        });
                    }
                }

                //FIELD CHANGE OF 'TAX CODE' IN UCR SUBLIST -->SET TAX RATE IN UCR RECORD
                if (scriptContext.sublistId === 'recmachcustrecord_jj_aq_227_projects' && scriptContext.fieldId === 'custpage_taxcodefiltered_ucr') {

                    //fetching the tax rate according to the selected tax code in project record
                    var taxcode = scriptContext.currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects',
                        fieldId: 'custpage_taxcodefiltered_ucr'
                    });
                    log.debug("taxcode", taxcode);
                    var lookup_val = search.lookupFields({
                        type: search.Type.SALES_TAX_ITEM,
                        id: taxcode,
                        columns: ['rate']
                    });
                    var rate = lookup_val.rate;
                    log.debug("rate", rate);
                    //Set tax rate in ucr sublist
                    scriptContext.currentRecord.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects',
                        fieldId: 'custrecord_jj_tax_rate',
                        value: parseFloat(rate.replace("%", "")),
                        ignoreFieldChange: true
                    });
                }

                if (scriptContext.fieldId.indexOf('custpage_label_') != -1) {
                    var number = scriptContext.fieldId.substr(15, 15);
                    // console.log('number', number);
                    var label = scriptContext.currentRecord.getValue({ fieldId: scriptContext.fieldId });
                    var client = scriptContext.currentRecord.getValue({ fieldId: 'custpage_clientid_' + number });
                    // console.log('label', label);
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters: [
                            ["stage", "anyof", "CUSTOMER"],
                            "AND",
                            ["internalid", "anyof", client]
                        ],
                        columns: [
                            search.createColumn({ name: "addresslabel", label: "Address Label" }),
                            search.createColumn({ name: "addressinternalid", label: "Address Internal ID" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({ name: "address", label: "Address" })
                        ]
                    });
                    var address;
                    customerSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var addressid = result.getValue({ name: "addressinternalid", label: "Address Internal ID" });
                        if (label == addressid) {
                            address = result.getValue({ name: "address", label: "Address" });
                        }
                        return true;
                    });
                    // console.log('address', address);
                    scriptContext.currentRecord.setValue({
                        fieldId: 'custpage_address_' + number,
                        value: address
                    });
                }
            } catch (er) {
                console.log('error @ fieldChanged', er)
            }

        }

        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {
            try {

                var project_id = scriptContext.currentRecord;
                console.log('project_id.id', project_id.id)

                if (scriptContext.fieldId == 'custentity_jj_invoice_type') {
                    var invoice_type = scriptContext.currentRecord.getValue({
                        fieldId: 'custentity_jj_invoice_type'
                    });
                    console.log('invoice_type', invoice_type)

                    if (invoice_type == 2) { //NO
                        var policycount = searchPolicy(project_id.id)
                        console.log('policycount', policycount)
                        if (policycount > 0) {
                            alert('Please detach the policy securities to make the project type change to a single party!!')
                            return false;
                        } else {
                            return true;
                        }
                    } else {
                        return true;
                    }

                }

                //TO RESTRICT THE SETIING OF ic CLIENT
                if (scriptContext.fieldId == 'parent') {
                    var client = scriptContext.currentRecord.getValue({
                        fieldId: 'parent'
                    });
                    var clientRepres = searchRepresentSubs(client)
                    console.log('clientRepres', clientRepres)

                    if (clientRepres == 0) {
                        return true;
                    } else if (clientRepres == 1) {
                        alert('The selected customer/client is an intercompany entity. Please choose a different one.')
                        return false;
                    }

                    return true;
                }

                //TO RESTRICT THE SETIING OF ic CLIENT
                if (scriptContext.fieldId == 'custentity_jj_third_party_customer') {
                    var client = scriptContext.currentRecord.getValue({
                        fieldId: 'custentity_jj_third_party_customer'
                    });
                    var clientRepres = searchRepresentSubs(client)
                    console.log('clientRepres', clientRepres)

                    if (clientRepres == 0) {
                        return true;
                    } else if (clientRepres == 1) {
                        alert('The selected customer/client is an intercompany entity. Please choose a different one.')
                        return false;
                    }

                    return true;
                }
                //FIELD CHANGE OD OFFICE TO ALERT IF IT BELONGS TO A DIFFERENT SUBSIDIARY
                if (scriptContext.fieldId == 'custentity_office') {
                    var office = scriptContext.currentRecord.getValue({
                        fieldId: 'custentity_office'
                    });
                    console.log('office', office)
                    var subsidiary_off = scriptContext.currentRecord.getValue({
                        fieldId: 'subsidiary'
                    });

                    var locationSearchObj = search.create({
                        type: "location",
                        filters: [
                            ["subsidiary", "anyof", subsidiary_off]
                        ],
                        columns: [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })
                        ]
                    });
                    var searchResult = locationSearchObj.run().getRange({
                        start: 0,
                        end: 1000
                    });
                    console.log('searchResult.length', searchResult.length)
                    var count = 0;
                    for (var j = 0; j < searchResult.length; j++) {

                        var office_id = searchResult[j].getValue({
                            name: "internalid"
                        });
                        console.log('office_id', office_id)
                        if (office_id != office) {
                            count++;
                        }
                    }
                    console.log('count', count)
                    if (count == searchResult.length) {
                        alert('The selected office is of a different subsidiary!!');

                        return false;
                    } else {
                        return true;
                    }


                } else {
                    return true;
                }


            } catch (er) {
                console.log('error @ validateField', er)
            }
        }


        function validateLine(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            var sublistName = scriptContext.sublistId;
            if (sublistName == 'recmachcustrecord_jj_aq_227_projects') {
                var underwriterName = currentRecord.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_jj_aq_227_projects',
                    fieldId: 'custrecord_jj_aq_224_policy_name'
                });
                var proportion = currentRecord.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_jj_aq_227_projects',
                    fieldId: 'custrecord_jj_ucr_proportion'
                });
                var policySecurity = currentRecord.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_jj_aq_227_projects',
                    fieldId: 'custrecord_jj_policy_security_aq_227'
                });
                if (checkif(underwriterName) || checkif(proportion) || checkif(policySecurity)) {
                    return true;
                } else {
                    alert("Cannot add UCR here")
                    return false;
                }
            } else {
                return true
            }
        }

        function validateDelete(scriptContext) {
            var currentRecord = scriptContext.currentRecord;
            var sublistName = scriptContext.sublistId;
            if (sublistName == 'recmachcustrecord_jj_aq_227_projects') {
                alert("Cannot remove UCR here")
                return false;
            } else {
                return true;
            }
        }

        function saveRecord(scriptContext) {
            var billingCurrency = scriptContext.currentRecord.getValue({
                fieldId: 'custpage_billingcurrencyfiltered'
            });
            console.log('billingCurrency', billingCurrency)

            var tax_code = scriptContext.currentRecord.getValue({
                fieldId: 'custpage_taxcodebodyfiltered'
            });
            console.log('tax_code', tax_code)

            var invoiceType = scriptContext.currentRecord.getValue({
                fieldId: 'custentity_jj_invoice_type'
            });
            console.log('invoiceType', invoiceType)

            if ((!billingCurrency) || (!tax_code)) {
                console.log('invoiceType', invoiceType)
                if ((!tax_code) && (billingCurrency) && (invoiceType == 2)) { //tax: no & billing curerncy: yes & single-party
                    alert('Please enter the Tax code!!')
                    return false;
                } else if (((tax_code) && (!billingCurrency)) || ((!billingCurrency) && (invoiceType == 1))) { //tax: yes & billing curerncy: no
                    alert('Please enter the Billing currency!!')
                    return false;
                } else if ((!tax_code) && (!billingCurrency) && (invoiceType == 2)) { //tax: no & billing curerncy: no & single-party
                    alert('Please enter the Billing currency & Tax code!!')
                    return false;
                }
            }

            var status = scriptContext.currentRecord.getValue({
                fieldId: 'entitystatus'
            });
            if (status != 2) {
                scriptContext.currentRecord.setValue({
                    fieldId: 'allowtime',
                    value: false
                });
                scriptContext.currentRecord.setValue({
                    fieldId: 'allowexpenses',
                    value: false
                });
            }
            return true;
        }

        //to remove the existing options of the list
        function RemoveSelectValue(fieldname) {
            try {

                fieldname.removeSelectOption({
                    value: null,
                });

            } catch (error) {
                console.log('error @ getSelectValue', err)
            }
        }
        //to set the select values
        function setSelectvalues(list_array, fieldname) {
            try {
                for (var i = 0; i < list_array.length; i++) {

                    console.log('taxcodelist name', list_array[i].Name.value)

                    fieldname.insertSelectOption({
                        value: list_array[i].InternalID.value,
                        text: list_array[i].Name.value
                    });


                }
            } catch (err) {
                console.log('error @ setSelectvalues', err)
            }

        }
        //To list the filtered tax code
        function searchTaxcode(subsidiary_country, subsidiary) {
            try {
                console.log('----subsidiary_country-----', subsidiary_country)
                console.log('----subsidiary-----', subsidiary)

                // if (subsidiary == 120) {
                //     var filterArray = [
                //         ["subsidiary", "anyof", subsidiary],
                //         "AND",
                //         ["country", "anyof", subsidiary_country],
                //         "AND",
                //         ["availableon", "noneof", "PURCHASE"],
                //         "AND",
                //         ["isinactive", "is", "F"]
                //     ]
                // } else {
                //     var filterArray = [
                //         ["subsidiary", "anyof", subsidiary],
                //         "AND",
                //         ["country", "anyof", subsidiary_country],
                //         "AND",
                //         ["availableon", "anyof", "SALE", "BOTH"],
                //         "AND",
                //         ["isinactive", "is", "F"]
                //     ]
                // }

                var salestaxitemSearchObj = search.create({
                    type: "salestaxitem",
                    filters: [
                        ["subsidiary", "anyof", subsidiary],
                        "AND",
                        ["country", "anyof", subsidiary_country],
                        "AND",
                        ["availableon", "noneof", "PURCHASE"],
                        "AND",
                        ["isinactive", "is", "F"]
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({ name: "internalid", label: "InternalID" })
                    ]
                });

                var searchResultCount = salestaxitemSearchObj.runPaged().count;
                console.log(" result count", searchResultCount);
                return iterateSavedSearch(salestaxitemSearchObj, fetchSavedSearchColumn(salestaxitemSearchObj, 'label'));
            } catch (err) {
                console.log('error @ searchTaxcode', err)
            }

        }


        /********************************************************/
        //to fetch the subsidiary and country for taxcode list
        /*******************************************************/
        function searchSubs_country(subsidiary) {
            try {


                //lookup the country value from subsidiary record
                var lookup_val = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subsidiary,
                    columns: ['country']
                });
                console.log("lookup_val", lookup_val)
                var country = lookup_val.country[0].value
                console.log('country', country)
                return country;
            } catch (error) {
                console.log('error @ searchSubs_country', error)
            }
        }

        function fetchSavedSearchColumn(savedSearchObj, priorityKey) { //to format saved search column to key-value pair
            try {
                var columns = savedSearchObj.columns;
                var columnsData = {},
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
                // console.log('columnsData', columnsData)
                return columnsData;
            } catch (err) {
                console.log('error @ fetchSavedSearchColumn', err)
            }

        }


        //to fetch and format the single saved search result
        function formatSingleSavedSearchResult(searchResult, columns) {
            try {
                var responseObj = {};
                for (var column in columns)
                    responseObj[column] = {
                        value: searchResult.getValue(columns[column]),
                        text: searchResult.getText(columns[column])
                    };
                return responseObj;
            } catch (err) {
                console.log('error @ formatSingleSavedSearchResult', err)
            }

        }

        //to iterate over and initiate format of each saved search result
        function iterateSavedSearch(searchObj, columns) {
            try {
                if (!checkForParameter(searchObj))
                    return false;
                if (!checkForParameter(columns))
                    columns = fetchSavedSearchColumn(searchObj);

                var response = [];
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
                // console.log('pageRangeLength', pageRangeLength);

                for (var pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                    searchPageRanges.fetch({
                        index: pageIndex
                    }).data.forEach(function (result) {
                        response.push(formatSingleSavedSearchResult(result, columns));
                    });

                return response;
            } catch (err) {
                console.log('error @ iterateSavedSearch', err)
            }

        }

        /*****************************************************************************************
         To check whether a value exists in parameter
         *****************************************************************************************/
        function checkForParameter(parameter, parameterName) {
            try {
                if (parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false && parameter !== "null" && parameter !== "undefined" && parameter !== " " && parameter !== 'false') {
                    return true;
                } else {
                    if (parameterName)
                        console.log('Empty Value found', 'Empty Value for parameter ' + parameterName);
                    return false;
                }
            } catch (err) {
                console.log('error @ checkForParameter', err)
            }

        }
        //submit Button action
        function submitAction(scriptContext) {
            try {

                var apply;
                var internalId;
                var mpcr;
                var addedInvoice;
                var type;
                var record = currentRecord.get();

                var mpcr_intid = record.getValue({
                    fieldId: 'custpage_mpcr'
                });
                console.log('mpcr_intid', mpcr_intid)

                var numLinesExp = record.getLineCount({
                    sublistId: 'sublistid1'
                });
                console.log('numLinesExp', numLinesExp)
                sublist = 'sublistid1';
                apply = 'fieldid_apply';
                internalId = 'fieldid_inteid';
                mpcr = 'custrecord_jj_billexp_parent_mpcr';
                addedInvoice = 'custrecord_jj_added_to_invoice_billexp';
                type = 'customrecord_jj_billable_expense'
                var array1 = fetchSelectedWIP(numLinesExp, apply, record, internalId, mpcr, addedInvoice, sublist, mpcr_intid, type)
                console.log('array1', array1)
                var numLinesTime = record.getLineCount({
                    sublistId: 'sublistid2'
                });
                console.log('numLinesTime', numLinesTime)
                sublist = 'sublistid2';
                apply = 'fieldid_apply2';
                internalId = 'fieldid_inteid2';
                mpcr = 'custrecord_jj_billable_time_parent_mpcr';
                addedInvoice = 'custrecord_jj_added_to_invoice_billtime';
                type = 'customrecord_jj_billable_time'
                var array2 = fetchSelectedWIP(numLinesTime, apply, record, internalId, mpcr, addedInvoice, sublist, mpcr_intid, type)
                console.log('array2', array2)
                var numLinesItem = record.getLineCount({
                    sublistId: 'sublistid3'
                });
                console.log('numLinesItem', numLinesItem)
                sublist = 'sublistid3';
                apply = 'fieldid_apply3';
                internalId = 'fieldid_inteid3';
                mpcr = 'custrecord_jj_billitm_parent_mpcr';
                addedInvoice = 'custrecord_jj_added_to_invoice_billitem';
                type = 'customrecord_jj_billable_item'
                var array3 = fetchSelectedWIP(numLinesItem, apply, record, internalId, mpcr, addedInvoice, sublist, mpcr_intid, type)
                console.log('array3', array3)
                var finalArray = array3.concat(array2.concat(array1));
                console.log('finalArray', finalArray)



                var chunnkedArray = finalArray.chunk(30);

                console.log('chunnkedArray', chunnkedArray)

                var output = url.resolveScript({
                    scriptId: 'customscript_jj_sl_insrtline_mpcr_aq_204',
                    deploymentId: 'customdeploy_jj_sl_insrtline_mpcr_aq_204',
                    // returnExternalUrl: true,
                    // params: {
                    //     recid: mpcr_intid
                    // }
                });
                console.log('output', output)
                var responseArray = [];
                for (var i = 0; i < chunnkedArray.length; i++)
                    responseArray.push(https.post.promise({
                        url: output,
                        body: JSON.stringify(chunnkedArray[i]),
                        headers: { "Content-Type": "application/json" }
                    }))
                console.log('responseArray', responseArray)

                Promise.all(responseArray).then(function (values) {
                    // window.open(output)
                    console.log('values', values)
                });
                //to redirect to MPCR record created
                // redirect.toRecord({
                //     type: 'customrecord_jj_invoice_mpcr',
                //     id: mpcr_intid,
                //     isEditMode: true
                // });

                window.location.href = "/app/common/custom/custrecordentry.nl?rectype=184&id=" + mpcr_intid + "&e=T";
            } catch (err) {
                console.log('error @ submitAction', err)
            }
        }
        /************************************/
        //function to fetch the seletec WIP
        /************************************/
        function fetchSelectedWIP(linecount, apply, record, internalId, mpcr, addedInvoice, sublist, mpcr_intid, type) {
            try {
                var array = [];
                var obj = {};
                for (var i = 0; i < linecount; i++) {
                    obj = {}
                    var applycheck = record.getSublistValue({
                        sublistId: sublist,
                        fieldId: apply,
                        line: i
                    });
                    console.log('apply', apply)
                    console.log('applycheck', applycheck)
                    if (applycheck == true) {

                        var record_id = record.getSublistValue({
                            sublistId: sublist,
                            fieldId: internalId,
                            line: i
                        });
                        console.log('record_id', record_id)
                        obj.recId = record_id
                        obj.mpcrid = mpcr_intid;
                        obj.typeid = type;
                        obj.parentmpcrid = mpcr;
                        obj.addInvoice = addedInvoice;
                        console.log('array', array)
                        console.log('obj', obj)
                        array.push(obj)
                        console.log('array', array)
                    }


                }
                console.log('array', array)
                return array;
            } catch (err) {
                console.log('error @ fetchSelectedWIP', err)
            }
        }
        //add label button to select address based on label
        function addLabel() {
            try {
                var rec = currentRecord.get();
                console.log('id', rec.id)
                var objRecord = record.load({
                    type: record.Type.JOB,
                    id: rec.id,
                    isDynamic: true
                });
                var attach_policy = objRecord.getValue({ fieldId: "custentity_jj_invoice_type" })
                if (attach_policy == '1') {
                    var linenum = objRecord.getLineCount({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects'
                    })
                    if (linenum <= 0) {
                        alert("The UCR lines don't exist in this project.")
                        return false;
                    }
                }
                var myWindow = window.open("/app/site/hosting/scriptlet.nl?script=488&deploy=1&internalId=" + rec.id, "", "width=700,height=600");
            } catch (e) {
                console.log('erraor@addLabel', e);
            }
        }

        // Invoice button action
        function invoiceButton() {
            try {
                var check;
                var rec = currentRecord.get();
                console.log('rec', rec)
                var recordId = rec.id
                console.log('recordId', recordId)
                var client = rec.getValue({
                    fieldId: 'parent'
                });
                console.log('client', client)

                var fieldlookup = search.lookupFields({
                    type: 'job',
                    id: recordId,
                    columns: ['custentity_jj_taxcode', 'custentity_jj_invoice_type', 'custentity_jj_invoice_in_process', 'currency', 'custentity_jj_billing_currency', 'subsidiary', 'custentitydepartment', 'custentity_bussiness_line', 'custentity_office', 'projectmanager']
                });
                console.log('fieldlookup', fieldlookup)
                if (fieldlookup.custentity_jj_invoice_type.length) {
                    var invoiceType = fieldlookup.custentity_jj_invoice_type[0].value;
                }

                var checkbox = fieldlookup.custentity_jj_invoice_in_process;

                var bill_currency;
                if (fieldlookup.custentity_jj_billing_currency.length) {
                    bill_currency = fieldlookup.custentity_jj_billing_currency[0].value;
                }

                var primary_currency;
                if (fieldlookup.currency.length) {
                    primary_currency = fieldlookup.currency[0].value;
                }

                var subsidiary;
                if (fieldlookup.subsidiary.length) {
                    subsidiary = fieldlookup.subsidiary[0].value;
                }

                var office;
                if (fieldlookup.custentity_office.length) {
                    office = fieldlookup.custentity_office[0].value;
                }

                var deptmnt;
                if (fieldlookup.custentitydepartment.length) {
                    deptmnt = fieldlookup.custentitydepartment[0].value;
                }

                var bussLine;
                if (fieldlookup.custentity_bussiness_line.length) {
                    bussLine = fieldlookup.custentity_bussiness_line[0].value;
                }

                var taxCode_body;
                if (fieldlookup.custentity_jj_taxcode.length) {
                    taxCode_body = fieldlookup.custentity_jj_taxcode[0].value;
                }
                console.log('taxCode_body', taxCode_body)



                var projectManagerVal;
                if (fieldlookup.projectmanager.length) {
                    projectManagerVal = fieldlookup.projectmanager[0].value;
                }
                console.log('projectManagerVal', projectManagerVal)

                //
                var fieldlookupProManager = search.lookupFields({
                    type: 'employee',
                    id: projectManagerVal,
                    columns: ['isinactive']
                });
                console.log('fieldlookupProManager', fieldlookupProManager)


                //TO LOOKUP IF BUSINESS LINE IS ACTIVE
                var fieldlookupBusLine = search.lookupFields({
                    type: 'classification',
                    id: bussLine,
                    columns: ['isinactive']
                });
                console.log('fieldlookupBusLine', fieldlookupBusLine)

                //TO LOOKUP IF DEPARTMENT IS ACTIVE
                var fieldlookupDept = search.lookupFields({
                    type: 'department',
                    id: deptmnt,
                    columns: ['isinactive']
                });

                //TO LOOKUP IF OFFICE IS ACTIVE
                var fieldlookupOffice = search.lookupFields({
                    type: 'location',
                    id: office,
                    columns: ['isinactive']
                });

                //TO LOOKUP THE CURRENCY OF SUBSIDIARY
                var fieldlookup2 = search.lookupFields({
                    type: 'subsidiary',
                    id: subsidiary,
                    columns: ['currency']
                });

                var subsi_currency;
                if (fieldlookup2.currency.length) {
                    subsi_currency = fieldlookup2.currency[0].value;
                }

                // var invoiceType = rec.getValue({
                //     fieldId: 'custentity_jj_invoice_type'
                // });


                //New code to check office and subsidiary validation

                var locationSearchObj = search.create({
                    type: "location",
                    filters:
                        [
                            ["internalid", "anyof", office]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({ name: "subsidiary", label: "Subsidiary" })
                        ]
                });

                var location_resut = locationSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (location_resut.length > 0) {
                    for (var l = 0; l < location_resut.length; l++) {
                        var subsidiary_off = location_resut[l].getValue({
                            name: 'subsidiary'
                        })
                    }

                    var sub_aaray = [];

                    var split_subsidiary = subsidiary_off.split(', ');

                }
                var jobSearchObj = search.create({
                    type: "job",
                    filters:
                        [
                            ["internalid", "anyof", recordId]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "subsidiarynohierarchy", label: "Subsidiary (no hierarchy)" })
                        ]
                });

                var job_resut = jobSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });

                if (job_resut.length > 0) {
                    for (var jb = 0; jb < job_resut.length; jb++) {
                        var subsidiary_Name = job_resut[jb].getText({
                            name: 'subsidiarynohierarchy'
                        })
                    }

                }

                var sub_count = 0;
                for (var s = 0; s < split_subsidiary.length; s++) {
                    if (split_subsidiary[s] === subsidiary_Name) {
                        sub_count++;
                    }

                }



                if ((fieldlookupDept.isinactive == true) || (fieldlookupOffice.isinactive == true) || (fieldlookupBusLine.isinactive == true) || fieldlookupProManager.isinactive == true) {
                    alert('The selected Department/Office/Business Line/Project Managers is inactive!!Please edit the Project and update it.')
                } else if (checkbox == false) {

                    if (sub_count === 0) {
                        alert('Mismatch in Billing Subsidiary and Office. To proceed with Invoice creation, please choose an Office available in the given Subsidiary.')
                    }
                    else {
                        var prop_sum = 0;

                        if (invoiceType == 1) { //multi-party

                            var customrecord_jj_policy_securitySearchObj = search.create({
                                type: "customrecord_jj_policy_security",
                                filters: [
                                    ["custrecord_jj_ps_project", "anyof", recordId]
                                ],
                                columns: [
                                    search.createColumn({
                                        name: "internalid",
                                        sort: search.Sort.ASC,
                                        label: "Internal ID"
                                    }),
                                    search.createColumn({ name: "custrecord_jj_ps_name", label: "Name" }),
                                    search.createColumn({ name: "isinactive", label: "Inactive" }),
                                    search.createColumn({ name: "custrecord_jj_proportion", label: "Proportion" })
                                ]
                            });
                            var searchResult = customrecord_jj_policy_securitySearchObj.run().getRange({
                                start: 0,
                                end: 1000
                            });

                            console.log('searchResult.length', searchResult.length)
                            if (searchResult.length > 0) {
                                for (var j = 0; j < searchResult.length; j++) {

                                    var inactive = searchResult[j].getValue({
                                        name: "isinactive"
                                    });
                                    console.log('inactive', inactive)
                                    if (inactive) {
                                        var psName = searchResult[j].getValue({
                                            name: "custrecord_jj_ps_name"
                                        });
                                        alert('There is an inactive Policy Security (' + psName + ') related to this project. Please detach it using the Detach Policy functionality!')
                                        return false;
                                    }
                                    /*else {
        var proportion = searchResult[j].getValue({
            name: "custrecord_jj_proportion"
        });

        console.log('proportion', proportion)

        prop_sum = parseFloat(prop_sum) + parseFloat(proportion)
       }*/


                                }

                                var customrecord_jj_policy_securitySearchObj2 = search.create({
                                    type: "customrecord_jj_policy_security",
                                    filters: [
                                        ["custrecord_jj_ps_project", "anyof", recordId]
                                    ],
                                    columns: [

                                        search.createColumn({
                                            name: "custrecord_jj_proportion",
                                            summary: "SUM",
                                            label: "Proportion"
                                        })
                                    ]
                                });
                                var searchResult = customrecord_jj_policy_securitySearchObj2.run().getRange({
                                    start: 0,
                                    end: 1
                                });
                                var proportion
                                for (var j = 0; j < searchResult.length; j++) {

                                    proportion = searchResult[j].getValue({
                                        name: "custrecord_jj_proportion",
                                        summary: "SUM"
                                    });

                                }
                                console.log('proportion', proportion)

                                if (getNum(parseFloat(fixFloat(proportion, 4))) == 100) {

                                    //search for tax code in UCR
                                    var customrecord_jj_ucr_aq_227SearchObj = search.create({
                                        type: "customrecord_jj_ucr_aq_227",
                                        filters: [
                                            ["custrecord_jj_aq_227_projects", "anyof", recordId]
                                        ],
                                        columns: [
                                            search.createColumn({ name: "custrecord_jj_ucr_taxcode", label: "Taxcode" })
                                        ]
                                    });
                                    var searchResult = customrecord_jj_ucr_aq_227SearchObj.run().getRange({
                                        start: 0,
                                        end: 1000
                                    });
                                    var taxCodeFlag = 0;
                                    if (searchResult.length > 0) {
                                        for (var j = 0; j < searchResult.length; j++) {

                                            var ucr_taxCode = searchResult[j].getValue({
                                                name: "custrecord_jj_ucr_taxcode"
                                            });
                                            if (ucr_taxCode) {
                                            } else {
                                                taxCodeFlag++;
                                            }
                                        }
                                    }


                                    console.log('taxCodeFlag', taxCodeFlag)

                                    // if (((!taxCode_body) && (searchResult.length == taxCodeFlag)) || ((searchResult.length != taxCodeFlag) && (taxCodeFlag > 0))) {
                                    //     if (!taxCode_body) {
                                    //         alert('Please enter a tax for the project!!')
                                    //     } else /*if ((searchResult.length == taxCodeFlag) || (searchResult.length != taxCodeFlag) || (taxCodeFlag > 0))*/ {
                                    //         alert('Please ensure that all the Underwriters have tax code associated to it!')
                                    //     }

                                    // }
                                    if (!taxCode_body) {
                                        alert('Please enter a tax for the project!!')
                                    } else {
                                        check = 'yes'
                                        checkBoxTrue(recordId, check);
                                        var output = url.resolveScript({
                                            scriptId: 'customscript_jj_sl_invoicebutn_aq_60',
                                            deploymentId: 'customdeploy_jj_sl_invoicebutn_aq_60',
                                            // returnExternalUrl: true,
                                            params: {
                                                recid: recordId,
                                                billCurrency: bill_currency,
                                                projectCurrency: primary_currency,
                                                subsidiaryCurrency: subsi_currency
                                            }
                                        });
                                        var obj = window.open(output /*, "", "width = 900, height = 600"*/);
                                        console.log('obj.closed ', obj.closed)
                                        setInterval(function () {
                                            console.log('obj.closed ', obj.closed)
                                            if (obj.closed == true) {

                                                check = 'no'
                                                checkBoxTrue(recordId, check);


                                            }
                                        }, 1000);
                                    }
                                } else {
                                    alert('The contribution percentage is not 100')
                                }
                            } else {
                                alert('Please attach the Policy security record')
                            }


                        } else if (invoiceType == 2) { //single-[party]

                            check = 'yes'
                            checkBoxTrue(recordId, check);
                            var output = url.resolveScript({
                                scriptId: 'customscript_jj_sl_invoicebutn_aq_60',
                                deploymentId: 'customdeploy_jj_sl_invoicebutn_aq_60',
                                // returnExternalUrl: true,
                                params: {
                                    recid: recordId,
                                    billCurrency: bill_currency,
                                    projectCurrency: primary_currency,
                                    subsidiaryCurrency: subsi_currency

                                }
                            });
                            var obj = window.open(output /*, "", "width = 900, height = 600"*/);
                            setInterval(function () {
                                console.log('obj.closed ', obj.closed)
                                if (obj.closed == true) {
                                    check = 'no'
                                    checkBoxTrue(recordId, check);

                                }
                            }, 1000);
                            // window.location.reload()
                            // setTimeout(function() {
                            //     window.location.reload(); // you can pass true to reload function to ignore the client cache and reload from the server
                            //}, 8000); ////delayTime should be written in milliseconds e.g. 1000 which equals 1 second
                        }
                    }
                } else if (checkbox == true) {
                    alert('There is already an Invoice in process!!')
                }



            } catch (error) {
                console.log('error @ invoiceButton', error)
            }
        }
        //attach Policy Button funtion
        function attachPolicy() {
            try {
                //console.log('IN');
                currentRecID = currentRecord.get().id;
                //console.log('currentRecID', currentRecID);
                var fieldlookup = search.lookupFields({
                    type: 'job',
                    id: currentRecID,
                    columns: ['custentity_jj_assured_name']
                });
                var assuredName;
                if (fieldlookup.custentity_jj_assured_name.length) {
                    assuredName = fieldlookup.custentity_jj_assured_name[0].value;
                }
                var output = url.resolveScript({
                    scriptId: 'customscript_aq_224_sl_attach_policy',
                    deploymentId: 'customdeploy_aq_224_sl_attach_policy',
                    returnExternalUrl: false,
                }) + '&recId=' + currentRecID + '&assuredName=' + assuredName;
                //console.log('SL1:', output);
                window.open(output);
                if (jQuery('#tdbody_custpage_attach_policy').length == 1) {
                    jQuery('#tdbody_custpage_attach_policy').css('pointer-events', 'none');
                    jQuery('#tdbody_custpage_attach_policy').css('opacity', '0.6');
                }
            } catch (err) {
                console.log("ERROR @ Attach Policy Function", JSON.stringify(err));
            }
        }
        //detach policy button function
        function detachPolicy() {
            try {
                //console.log('IN');
                var currentRecID = currentRecord.get().id;
                // console.log('currentRecID', currentRecID);
                var fieldlookup = search.lookupFields({
                    type: 'job',
                    id: currentRecID,
                    columns: ['custentity_jj_assured_name']
                });
                var assuredName;
                if (fieldlookup.custentity_jj_assured_name.length) {
                    assuredName = fieldlookup.custentity_jj_assured_name[0].value;
                }
                var output = url.resolveScript({
                    scriptId: 'customscript_aq_224_sl_detach_policy',
                    deploymentId: 'customdeployaq_224_sl_detach_policy',
                    returnExternalUrl: false,
                }) + '&recId=' + currentRecID + '&assuredName=' + assuredName;
                //console.log('SL2:', output);
                window.open(output);
                if (jQuery('#tdbody_custpage_detach_policy').length == 1) {
                    jQuery('#tdbody_custpage_detach_policy').css('pointer-events', 'none');
                    jQuery('#tdbody_custpage_detach_policy').css('opacity', '0.6');
                }
            } catch (err) {
                console.log("ERROR @ Detach Policy Function", JSON.stringify(err));
            }
        }

        function checkif(param) {
            try {
                if (param == undefined || param == null || param == "" || param == " " || param == 0)
                    return false;
                else
                    return true;

            } catch (e) {
                console.log("err@ checkif", e)
            }
        }
        //Retrieve parameter from URL
        function getParameterByName(name, url) {
            if (!url)
                url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex
                    .exec(url);
            if (!results)
                return null;
            if (!results[2])
                return ' ';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }


        function checkBoxTrue(recordId, check) {
            try {
                console.log('check', check)
                if (check == 'yes') {
                    var id = record.submitFields({
                        type: record.Type.JOB,
                        id: recordId,
                        values: {
                            custentity_jj_invoice_in_process: true
                        }
                    });
                } else if (check == 'no') {
                    var id = record.submitFields({
                        type: record.Type.JOB,
                        id: recordId,
                        values: {
                            custentity_jj_invoice_in_process: false
                        }
                    });
                }
            } catch (err) {
                console.log('error @ checkBoxTrue', err)
            }
        }

        function checkif(param) {
            try {
                if (param == undefined || param == null || param == "" || param == " ")
                    return false;
                else
                    return true;

            } catch (e) {
                log.debug("err@ checkif", e)
            }
        }

        //SEARCH FOR POLICY DETAILS ATACHED TO PROJECT
        function searchPolicy(project) {
            try {
                var customrecord_jj_policy_securitySearchObj = search.create({
                    type: "customrecord_jj_policy_security",
                    filters: [
                        ["custrecord_jj_ps_project", "anyof", project]
                    ],
                    columns: [
                        search.createColumn({ name: "custrecord_jj_ps_name", label: "Name" }),
                        search.createColumn({ name: "custrecord_jj_policy_number", label: "Policy Number" })
                    ]
                });
                var searchResultCount = customrecord_jj_policy_securitySearchObj.runPaged().count;

                console.log('searchResultCount ', searchResultCount)
                return searchResultCount;
            } catch (er) {
                console.log('error @ searchPolicy', er)
            }
        }
        //search to find if the client has represents subsisidiary
        function searchRepresentSubs(client) {
            try {
                var lookup_val = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: client,
                    columns: ['representingsubsidiary']
                });
                console.log('lookup_val', lookup_val)
                console.log('Object.keys(obj).length;', Object.keys(lookup_val).length)
                if (Object.keys(lookup_val).length) {
                    console.log('lookup_val.representingsubsidiary.length', lookup_val.representingsubsidiary.length)
                    var icrep;
                    if (lookup_val.representingsubsidiary.length) {
                        icrep = lookup_val.representingsubsidiary
                    }
                }


                console.log('icrep', icrep)
                if (icrep) {

                    return 1;
                } else {
                    return 0;
                }

            } catch (er) {
                console.log('error @ searchRepresentSubs', er)
            }
        }
        /************************************/
        //To change NaN to 0
        /***********************************/
        function getNum(val) {
            if (isNaN(val)) {
                return 0.00;
            }
            return val;
        }

        /************************************/
        //To round a float number
        /***********************************/
        function roundFloat(value, decimals) {
            decimals = (decimals) ? decimals : 2;
            return Number(Math.round(parseFloat(value) + 'e' + parseInt(decimals)) + 'e-' + parseInt(decimals));
        }

        /***************************************************/
        //To fix a float number to specified decimal parts
        /*************************************************/
        function fixFloat(value, decimals) {
            decimals = (decimals) ? decimals : 2;
            return roundFloat(parseFloat(value), parseInt(decimals)).toFixed(parseInt(decimals));
        }

        // ----------------------> For Resource Allocation <----------------------- //
        /**
         * Function to redirect to Resource alllocation suitelet page.
         *
         */
        function allocation_test() {
            try {
                if (checkForParameter(curRec) == true) {
                    if (window.onbeforeunload) {
                        window.onbeforeunload = function () {
                            null;
                        };
                    }
                    var oldUrl = 'https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=812&deploy=1';// Production URL
                    var newUrl = oldUrl + "&prjId=" + curRec;
                    window.location.href = newUrl;
                }
            }
            catch (e) {
                console.log("Error @ Allocation: ", e.name + " : " + e.message)
            }
        }
        // --------------------------------------------------------------------- //


        return {
            pageInit: pageInit,
            invoiceButton: invoiceButton,
            fieldChanged: fieldChanged,
            submitAction: submitAction,
            validateLine: validateLine,
            validateDelete: validateDelete,
            validateField: validateField,
            saveRecord: saveRecord,
            addLabel: addLabel,
            attachPolicy: attachPolicy,
            detachPolicy: detachPolicy,
            allocation_test: allocation_test
        };

    });

Object.defineProperty(Array.prototype, 'chunk', {
    value: function (chunkSize) {
        var R = [];
        for (var i = 0; i < this.length; i += chunkSize)
            R.push(this.slice(i, i + chunkSize));
        return R;
    }
});