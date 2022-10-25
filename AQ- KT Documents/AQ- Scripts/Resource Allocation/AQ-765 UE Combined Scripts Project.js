/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
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
 * The combined user event scripts that are deployed for project record
 * Date created :20-07-2020
 *
 * REVISION HISTORY
 * Revision 1.0 ${20-07-2020} Febin : created
 *
 ******************************************************************************/

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-60,AQ-170,AQ-318
 * Task 4: Custom invoice button in project record,Expense report or bill could be created for Project records based on checkbox
 * **************************************************************************
 * Date : 21-01-2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description : This script is to add Invoice button in the project record based on conditions. This also unchecks the 'allow expenses' & 'allow time entry' when the project is saved with status 'closed'

 * Date created :21-01-2020
 *
 * REVISION HISTORY
 *
 * Revision 1.0 ${21-01-2020} Navia : created
 * Revision 1.1 ${11-03-2020} Navia : updated--> AQ-170
 * Revision 1.2 ${05-05-2020} Gloria : updated--> AQ-318
 * Revision 1.3 ${09-06-2020} Navia : updated--> AQ-
 * Revision 1.5 ${05-10-2020} Navia : updated--> AQ-1435
 ******************************************************************************/

/*************************************************************************************************************************
 * CLIENTNAME:AQUALISBRAEMAR
 * AQ-332
 * **********************************************************************************************************************
 * Date :11/05/2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description : This Script is  to do a POST request on creation of new Project.
 * Date created : 11/05/2020
 *
 * REVISION HISTORY
 *
 * Revision 1.0 ${11/05/2020} GEORDY: created
 *
 **************************************************************************************************************************/

/************************************************************************************************
 * * Aqualis Braemar| AQ-593 |AQ-593 UE Resource Project IC  *
 * **********************************************************************************************
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Date Created : 25-06-2020
 *
 * Created By: Febin Antony, Renjith
 *
 * REVISION HISTORY
 *
 *
 ***********************************************************************************************/

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-299
 * Set tax code in each line if the UCR sublist of the project
 * **************************************************************************
 * Date : 29-04-2020
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description :
 * Set the taxcode based the project subsidiary.
 * Make the TAX CODE field in UCR sublist mandatory.
 * Disabling the TAX CODE body field if it is a multi party.
 * Date created :29-04-2020
 *
 * REVISION HISTORY
 *
 *
 ******************************************************************************/

/************************************************************************************************
 * * Aqualis Braemar| AQ-593 |AQ-593 UE Resource Project IC  *
 * **********************************************************************************************
 *
 * Author: Jobin & Jismi IT Services LLP
 *
 * Date Created : 25-06-2020
 *
 * Created By: Febin Antony, Renjith
 *
 * REVISION HISTORY
 *
 *
 ***********************************************************************************************/

/*******************************************************************************
 * CLIENTNAME:AQUALIS
 * AQ-3561
 * Production Movement of Resource Allocation
 * **************************************************************************
 * Date : 26-04-2022
 *
 * Author: Jobin & Jismi IT Services LLP
 * Script Description :
 * Adding a button for redirecting to Resource allocation button from the project record
 * Button will be shown in only view Context
 * Button will be available for those project which has the same subsidiary of logged user in Financial center -AB Role
 * Button will be available for those project where the logged user is either a body level or line level project manager in Administrator role
 * Date created :26-04-2020
 *
 * Created By: Anand T P
 *
 * REVISION HISTORY
 *
 *
 ******************************************************************************/

define(['N/search', 'N/record', 'N/ui/serverWidget', 'N/format', 'N/https', 'N/url','N/runtime'],

    function (search, record, serverWidget, format, https, url, runtime) {

    // ----------------------> For Resource Allocation <-------------------------------------------------------------------------------------- //
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
         * Function to list projects.
         *
         * @param {id} id - Project ID
         * @param {user} user - loggedUser's ID
         * @param {userSubsidary} userSubsidary - Logged user's subsidiary ID
         * @param {roleCenter} roleCenter - Logged User's role center
         *@returns searchResultCount - Count of search result
         */

        function projectSearch(id,user,userSubsidary,roleCenter){
            try{
                if(checkForParameter(roleCenter)==true) {
                    var filterArr = []
                    if (roleCenter == "ACCOUNTCENTER") {
                        if(checkForParameter(userSubsidary)==true && checkForParameter(id)==true) {
                            filterArr = [
                                ["internalid","anyof",id],
                                "AND",
                                ["isinactive", "is", "F"],
                                "AND",
                                ["status", "anyof", "2"],
                                "AND",
                                ["subsidiary", "anyof", userSubsidary],
                                "AND",
                                ["custentity_jj_proj_billing_type","noneof","@NONE@"]
                            ]
                        }
                    }
                    if (roleCenter == "BASIC"){
                        if(checkForParameter(user)==true && checkForParameter(id)==true) {
                            filterArr = [
                                ["internalid","anyof",id],
                                "AND",
                                ["isinactive", "is", "F"],
                                "AND",
                                ["status", "anyof", "2"],
                                "AND",
                                ["custentity_jj_proj_billing_type","noneof","@NONE@"]
                            ]
                        }
                    }
                    log.debug("filterArr: ",filterArr)

                    var jobSearchObj = search.create({
                        type: "job",
                        filters: filterArr,
                        columns:
                            [
                                search.createColumn({
                                    name: "internalid",
                                    sort: search.Sort.ASC,
                                    label: "Internal ID"
                                }),
                                search.createColumn({name: "entityid", label: "Name"})
                            ]
                    });
                    var searchResultCount = jobSearchObj.runPaged().count;
                    return searchResultCount;
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ Project Search: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        /**
         * Function to list subsidiaries supported by the logged user role.
         *
         * @param {role} role - Role ID
         *@returns [roleSubsidiaries] - Array of supported subsidiary internal IDs
         */
        function roleSubsidiarySearch(role) {
            try {

                var roleSubsidiaries = [];
                var subsidiaryFilterArray = [];

                var roleSearchObj = search.create({
                    type: "role",
                    filters: [
                        ["internalid", "anyof", role]
                    ],
                    columns: [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "subsidiaryoption", label: "Accessible Subsidiaries Option" }),
                        search.createColumn({ name: "subsidiarynohierarchy", join: "user", label: "Subsidiary (no hierarchy)" }),
                        search.createColumn({ name: "subsidiaries", label: "Accessible Subsidiaries" })
                    ]
                });
                // var subsidiaryFilters = {};

                roleSearchObj.run().each(function(result) {
                    var subsidairyOption = result.getValue(roleSearchObj.columns[1]);
                    if (subsidairyOption == "OWN") {
                        var userSubsidiary = result.getValue(roleSearchObj.columns[2]);
                        roleSubsidiaries.push(userSubsidiary);
                        // subsidiaryFilters[userSubsidiary] = result.getText(roleSearchObj.columns[2]);
                    } else {
                        var subsidiaries = result.getValue(roleSearchObj.columns[3]);
                        roleSubsidiaries.push(subsidiaries);
                        // subsidiaryFilters[subsidiaries] = result.getText(roleSearchObj.columns[3]);
                        return true;
                    }
                });

                // subsidiaryFilterArray.push(roleSubsidiaries);
                // subsidiaryFilterArray.push(subsidiaryFilters);
                log.debug("roleSubsidiaries: ",roleSubsidiaries)
                return roleSubsidiaries;

            } catch (err) {
                log.debug('error @ roleSubsidiarySearch', err)
            }
        }

    // -------------------------------------------------------------------------------------------------------------------------------------------------------- //

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            try {
        // ----------------------> For Resource Allocation <----------------------- //
                log.debug("CONTEXT: ",scriptContext.type)
                var userObj = runtime.getCurrentUser();
                log.debug('userObj', userObj)
                var currUser = userObj.id
                var roleCenter = userObj.roleCenter;
                var roleId = userObj.role
                log.debug("roleId: ",roleId)

                var userSubsidary = roleSubsidiarySearch(roleId)
                log.debug("userSubsidary: ",userSubsidary)
                var rec = scriptContext.newRecord
                var recId = rec.id
                log.debug("RECORD ID: ",recId)
        // --------------------------------------------------------------------- //

                var form = scriptContext.form;
                // form.clientScriptFileId = 48213; //sandbox
                form.clientScriptFileId = 39286; //production
                // var rec = scriptContext.newRecord;

                var client = rec.getValue({
                    fieldId: 'parent'
                });

                var billingTypeField = rec.getField({
                    fieldId: 'jobbillingtype'
                });
                // log.debug('billingTypeField', billingTypeField)
                billingTypeField.defaultValue = 'TM';
                var invoiceType = scriptContext.newRecord.getValue({
                    fieldId: 'custentity_jj_invoice_type'
                })

                if (scriptContext.type == 'view') {
        // ----------------------> For Resource Allocation <----------------------- //
                    //add button

                    var prjList = projectSearch(recId,currUser,userSubsidary,roleCenter)
                    log.debug("prjList: ",prjList)
                    if(prjList>0) {
                        if (roleCenter == 'ACCOUNTCENTER' || roleCenter == 'BASIC') {
                            form.addButton({
                                id: 'custpage_allocation_btn',
                                label: 'Resource Allocation',
                                functionName: 'allocation_test'
                            })
                        }
                    }
        // --------------------------------------------------------------------- //

                    var button = form.addButton({
                        id: 'custpage_invoice',
                        functionName: 'invoiceButton',
                        label: 'Invoice'
                    });
                    var newFieldview2 = form.addField({
                        id: 'custpage_at',
                        type: 'INLINEHTML',
                        label: 'Atta'
                    });

                    var html2 = "<script>jQuery( document ).ready(function() {if(document.querySelector('#recmachcustrecord24__div'))document.querySelector('#recmachcustrecord24__div').remove();});</script>";
                    // log.debug("html ississ", html2);

                    newFieldview2.defaultValue = html2;
                    log.debug("field after ississ", newFieldview2);

                    var newFieldview4 = form.addField({
                        id: 'custpage_attached',
                        type: 'INLINEHTML',
                        label: 'Attach Remove'
                    });

                    var disable_icrlink = form.addField({
                        id: 'custpage_editremove',
                        type: 'INLINEHTML',
                        label: 'edit Remove'
                    });
                    // This is used to disable the Intercompany Invoice reosurces link
                    var html_icr = "<script></script><style>div#recmachcustrecord_resource_project__div table#recmachcustrecord_resource_project__tab tbody tr>td:nth-child(1) {visibility: hidden}div#recmachcustrecord_resource_project__div table#recmachcustrecord_resource_project__tab tbody tr>td:nth-child(12) {visibility: hidden}</style>";
                    disable_icrlink.defaultValue = html_icr;

                    //This is used to disable the whole Policy details subtab in project record
                    var html4 = "<script>jQuery( document ).ready(function() { if(document.querySelector('#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_main_form #tbl_attach')) document.querySelector('#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_main_form #tbl_attach').remove(); if(document.querySelector('#recmachcustrecord_jj_ps_project_layer form#recmachcustrecord_jj_ps_project_main_form .uir-list-control-bar table#tbl_attach td#tdbody_attach')) document.querySelector('#recmachcustrecord_jj_ps_project_layer form#recmachcustrecord_jj_ps_project_main_form .uir-list-control-bar table#tbl_attach td#tdbody_attach').remove(); if(document.querySelector('table.uir-table-block div#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_main_form div.uir-list-control-bar table#tbl_newrecrecmachcustrecord_jj_aq_227_projects td#tdbody_newrecrecmachcustrecord_jj_aq_227_projects'))document.querySelector('table.uir-table-block div#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_main_form div.uir-list-control-bar table#tbl_newrecrecmachcustrecord_jj_aq_227_projects td#tdbody_newrecrecmachcustrecord_jj_aq_227_projects').remove();  jQuery('div#custom83_wrapper tr.ns-subtab-border').css('pointer-events', 'none');});</script>";
                    newFieldview4.defaultValue = html4;
                    var attach_policy = rec.getValue({ fieldId: 'custentity_jj_invoice_type' });
                    if (attach_policy == 1 || attach_policy == 2) {
                        form.addButton({
                            id: 'custpage_addlabel',
                            functionName: 'addLabel',
                            label: 'Add Address',
                        });
                    }
                    if (checkif(invoiceType) && invoiceType == 1) {
                        var attachPolicyButton = form.addButton({
                            id: 'custpage_attach_policy',
                            label: 'Attach Policy',
                            functionName: 'attachPolicy'
                        });
                        // log.debug("attachPolicyButton", attachPolicyButton);
                        var detachPolicyButton = form.addButton({
                            id: 'custpage_detach_policy',
                            label: 'Detach Policy',
                            functionName: 'detachPolicy'
                        });
                        log.debug("detachPolicyButton", detachPolicyButton);
                    }
                }
                if (scriptContext.type != 'view') {
                    // var attach_policy = rec.getValue({ fieldId: 'custentity_jj_invoice_type' });
                    // log.debug('attach_policy', attach_policy)
                    if (invoiceType == 1) {
                        var tax_codeBodyField = form.getField({ id: 'custentity_jj_taxcode' });
                        tax_codeBodyField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                        var sublist = form.getSublist({
                            id: 'recmachcustrecord_jj_aq_227_projects'
                        });
                        // log.debug('sublist', sublist)
                        var tax_codeOriginalField = sublist.getField({ id: 'custrecord_jj_ucr_taxcode' });
                        tax_codeOriginalField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                        //to fetch the subsidiary and country
                        var subsidiary_country = searchSubs_country(rec)

                        //to fetch the tax codes
                        var taxcodelist = searchTaxcode(subsidiary_country)
                        log.debug('........taxcodelist.......', taxcodelist)

                        //to add extra column
                        var tax_codeField = addExtraColumn(sublist, scriptContext.type, 'recmachcustrecord_jj_aq_227_projects', 'custrecord_jj_ucr_taxcode', rec)
                        //var tax_codeField = sublist.getField({ id: 'custrecord_jj_ucr_taxcode' });

                        tax_codeField.addSelectOption({
                            value: '',
                            text: ''
                        });
                        //to set the select options
                        var type = 'taxcode'
                        setSelectvalues(taxcodelist, tax_codeField, type);
                    }
                    //adding extra columns to record
                    var currency_field = form.addField({
                        id: 'custpage_billingcurrencyfiltered',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Billing Currency'
                    });
                    log.debug("currency_field", currency_field);
                    var taxcode_body = form.addField({
                        id: 'custpage_taxcodebodyfiltered',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Tax Code'
                    });

                    //edit mode
                    if (scriptContext.type == 'edit') {

                        //disabling billing currency field once  the invoice (MPCR) is approved or in open status

                        var jobSearchObj = search.create({
                            type: "job",
                            filters: [
                                ["internalidnumber", "equalto", rec.id]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "custrecord_jj_status",
                                    join: "CUSTRECORD_JJ_PROTECT_NAME",
                                    label: "Status"
                                })
                            ]
                        });
                        var searchResultCount = jobSearchObj.runPaged().count;
                        // log.debug("jobSearchObj result count", searchResultCount);
                        var status = [];
                        jobSearchObj.run().each(function (result) {
                            // .run().each has a limit of 4,000 results
                            status.push(result.getValue({ name: "custrecord_jj_status", join: "CUSTRECORD_JJ_PROTECT_NAME", label: "Status" }));
                            return true;
                        });
                        // log.debug("status", status);
                        if (status.indexOf('4') > -1 || status.indexOf('1') > -1) {
                            log.debug("inn....");
                            currency_field.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.DISABLED
                            });
                        }

                        //tax code
                        var tax_body = rec.getValue({
                            fieldId: 'custentity_jj_taxcode'
                        });
                        // log.debug('tax_body', tax_body)

                        if (tax_body) {

                            taxcode_body.defaultValue = tax_body
                        }

                        //billing currency
                        // log.debug('mode', scriptContext.type)

                        var currency_body = rec.getValue({
                            fieldId: 'custentity_jj_billing_currency'
                        });
                        log.debug('currency_body', currency_body)

                        if (currency_body) {
                            currency_field.defaultValue = currency_body
                        }
                        var newFieldview5 = form.addField({
                            id: 'custpage_hide_sublist',
                            type: 'INLINEHTML',
                            label: 'Disable sublist'
                        });
                        var html5 = "<script>jQuery( document ).ready(function() { if(document.querySelector('#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_main_form #tbl_attach')) document.querySelector('#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_main_form #tbl_attach').remove(); if(document.querySelector('#recmachcustrecord_jj_ps_project_layer form#recmachcustrecord_jj_ps_project_main_form .uir-list-control-bar table#tbl_attach td#tdbody_attach')) document.querySelector('#recmachcustrecord_jj_ps_project_layer form#recmachcustrecord_jj_ps_project_main_form .uir-list-control-bar table#tbl_attach td#tdbody_attach').remove(); if (document.querySelector('div#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_form table.uir-listheader-button-table table#tbl_newrec212 tr#tr_newrec212 td#tdbody_newrec212')) document.querySelector('div#recmachcustrecord_jj_aq_227_projects_layer form#recmachcustrecord_jj_aq_227_projects_form table.uir-listheader-button-table table#tbl_newrec212 tr#tr_newrec212 td#tdbody_newrec212').remove();  });</script>";

                        newFieldview5.defaultValue = html5;
                    }
                    //setting default values
                    if (scriptContext.type == 'create') {
                        var objRecord = scriptContext.newRecord
                        objRecord.setValue({
                            fieldId: 'entitystatus',
                            value: 2
                        });
                        objRecord.setValue({
                            fieldId: 'jobbillingtype',
                            value: 'TM'
                        });
                        objRecord.setValue({
                            fieldId: 'autoname',
                            value: false
                        });
                        objRecord.setValue({
                            fieldId: 'materializetime',
                            value: false
                        });
                        objRecord.setValue({
                            fieldId: 'applyprojectexpensetypetoall',
                            value: true
                        });
                        objRecord.setValue({
                            fieldId: 'projectexpensetype',
                            value: -2
                        });
                        objRecord.setValue({
                            fieldId: 'allowtime',
                            value: true
                        });
                        objRecord.setValue({
                            fieldId: 'allowexpenses',
                            value: true
                        });
                    }

                    //setting the taxcode(body field) select options

                    //to fetch the subsidiary and country
                    var subsidiary_country = searchSubs_country(rec)

                    //to fetch the tax codes
                    var taxcodelist = searchTaxcode(subsidiary_country)
                    log.debug('---------taxcodelist-----------', taxcodelist)

                    //to set the initial select value of tax code to null so that the user has to choose a value
                    taxcode_body.addSelectOption({
                        value: '',
                        text: ''
                    });
                    //to set the select options
                    var type = 'taxcode'
                    setSelectvalues(taxcodelist, taxcode_body, type)


                    var currencyListFromClient = customerCurrencies(client)
                    log.debug("currencyListFromClient", currencyListFromClient)

                    var currency_list = searchCurrency()
                    log.debug('currency_list', currency_list)

                    currency_field.addSelectOption({
                        value: '',
                        text: ''
                    });


                    var type = 'currency'
                    setSelectvalues(currencyListFromClient, currency_field, type)
                }
                if (scriptContext.type == 'edit') {

                    var objRecordNew = scriptContext.newRecord

                    //setting auto name as null
                    objRecordNew.setValue({
                        fieldId: 'autoname',
                        value: false
                    });

                    var newFieldview4 = form.addField({
                        id: 'custpage_disable_policy_edit',
                        type: 'INLINEHTML',
                        label: 'Policy Security Edit mode'
                    });
                    //This is used to disable the whole Policy details subtab in project record in edit mode
                    var html5 = "<script>jQuery( document ).ready(function() { jQuery('div#custom83_wrapper tr.ns-subtab-border div.subtabblock div#recmachcustrecord_jj_ps_project_layer div.subtabblock').css('pointer-events', 'none');})</script>";
                    newFieldview4.defaultValue = html5;
                }
                var project = scriptContext.newRecord.id;
                // log.debug('project', project)

                var invoiceType = rec.getValue({
                    fieldId: 'custentity_jj_invoice_type'
                });

                //TO REMOVE TH EPOLICY DETAILS SUBTAB
                if (invoiceType == 2) {
                    log.debug("tesying invoice type");
                    var newFieldview3 = form.addField({
                        id: 'custpage_disabletable2',
                        type: 'INLINEHTML',
                        label: 'remove policy details'
                    });

                    var html3 = "<script>jQuery( document ).ready(function() { document.getElementById('custom83lnk').style.display = 'none';});</script>";
                    newFieldview3.defaultValue = html3;
                }
                var client = rec.getValue({
                    fieldId: 'parent'
                });
                //log.debug('client', client)

            } catch (err) {
                log.debug('error @ beforeLoad', err)
                log.error("ERROR @ Before Load", err);
            }

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            try {
                log.debug('beforeSubmit', scriptContext.type)

                var rec = scriptContext.newRecord;
                var oldRec = scriptContext.oldRecord;

                if (scriptContext.type != 'xedit') {
                    //for billing currency

                    var currency_body = rec.getValue({
                        fieldId: 'custpage_billingcurrencyfiltered'
                    });
                    log.debug('currency_body current', currency_body) // considered as new currency

                    //FETCH THE OLD CURRENCY (before setting the virtual field value. Hence old)
                    var oldCurrency = scriptContext.newRecord.getValue({
                        fieldId: 'custentity_jj_billing_currency'
                    });
                    // log.debug('oldCurrency', oldCurrency)

                    rec.setValue({
                        fieldId: 'custentity_jj_billing_currency',
                        value: currency_body,
                        ignoreFieldChange: true
                    });
                    //to fetch the value from virtual fields(BODY)
                    var tax_body = rec.getValue({
                        fieldId: 'custpage_taxcodebodyfiltered'
                    });
                    // log.debug('tax_body beforeSubmit', tax_body)

                    //to set values in original fields(BODY)
                    //  if (scriptContext.type != 'create') {

                    rec.setValue({
                        fieldId: 'custentity_jj_taxcode',
                        value: tax_body,
                        ignoreFieldChange: true
                    });




                    //  }

                    /********************************************************/
                    //AQ-170 UNCHECKING 'ALLOW EXPENSES' & 'ALLOW TIME ENTRY'
                    /*******************************************************/
                    var status = rec.getValue({
                        fieldId: 'entitystatus'
                    });
                    // log.debug('status', status)

                    if (status == 1) {

                        rec.setValue({
                            fieldId: 'allowtime',
                            value: false
                        });

                        rec.setValue({
                            fieldId: 'allowexpenses',
                            value: false
                        });
                    }

                    var project = scriptContext.newRecord.id;
                    //  log.debug('project', project)

                    var client = rec.getValue({
                        fieldId: 'parent'
                    });
                    // log.debug('client', client)

                    var thirdParty = rec.getValue({
                        fieldId: 'custentity_jj_third_party_customer'
                    });
                    //  log.debug('thirdParty edit/view', thirdParty)
                    if (thirdParty) {

                    } else {
                        rec.setValue({
                            fieldId: 'custentity_jj_third_party_customer',
                            value: client
                        });
                    }
                }

                if (scriptContext.type == 'create' || scriptContext.type == 'edit') {
                    var department = rec.getValue({ fieldId: 'custentitydepartment' });
                    if (department != 23) {
                        rec.setValue({
                            fieldId: 'timeapproval',
                            value: 2
                        });
                    }
                }
                if (scriptContext.type != 'create') {
                    var attach_policy = rec.getValue({ fieldId: 'custentity_jj_invoice_type' });
                    if (attach_policy == 1) {
                        //to set the value in line field
                        //to fetch the linecount of sublist
                        var linecount = rec.getLineCount({
                            sublistId: 'recmachcustrecord_jj_aq_227_projects'
                        });
                        // log.debug('linecount', linecount);
                        for (var j = 0; j < linecount; j++) {
                            //fetch data from virtual column field
                            var taxcode_virtual = rec.getSublistValue({
                                sublistId: 'recmachcustrecord_jj_aq_227_projects',
                                fieldId: 'custpage_taxcodefiltered_ucr',
                                line: j
                            });
                            //log.debug('taxcode_virtual', taxcode_virtual)

                            //set data to original column field
                            rec.setSublistValue({
                                sublistId: 'recmachcustrecord_jj_aq_227_projects',
                                fieldId: 'custrecord_jj_ucr_taxcode',
                                line: j,
                                value: taxcode_virtual
                            });
                        }
                    }
                }
            } catch (err) {
                log.debug('error @ beforeSubmit', err);
                log.error("ERROR @ Before Submit", err);
            }

        }

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
                var newRecord = scriptContext.newRecord;
                var oldRecord = scriptContext.oldRecord;
                var id = newRecord.id;
                if (scriptContext.type == 'create') {
                    // var projectid = id;
                    // // log.debug('projectid', projectid)
                    // var projectrec = record.load({
                    //     type: record.Type.JOB,
                    //     id: projectid
                    // });
                    // var project = encodeURIComponent(projectrec.getValue({ fieldId: "entityid" }));
                    // // log.debug('project', project)
                    // var client = encodeURIComponent(projectrec.getText({ fieldId: "parent" }));
                    // // log.debug('client', client)
                    // var description = encodeURIComponent(projectrec.getValue({ fieldId: "companyname" }));
                    // // log.debug('description', description)

                    // var proj_response = https.post({
                    //     url: url.format({
                    //         domain: 'https://aqualisbraemar.azurewebsites.net/api/Create',
                    //         params: {
                    //             code: 'rTtRoAuYOookuEd3LiuiOeTgxmR2esORs83SJPBvWsRtg3r8buWPKw==',
                    //             project: project,
                    //             client: client,
                    //             description: description
                    //         }
                    //     }),
                    //     body: null,
                    //     // body: ''
                    //     // body: JSON.stringify({})
                    // });
                    // log.debug('proj_response', proj_response)
                }

                if (scriptContext.type != 'xedit') {
                    var numLinesNew = newRecord.getLineCount({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects'
                    });
                    log.debug('numLinesNew', numLinesNew)

                    var numLinesOld = oldRecord.getLineCount({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects'
                    });
                    log.debug('numLinesOld', numLinesOld)

                    var thirdPartyNew = newRecord.getValue({
                        fieldId: 'custentity_jj_third_party_customer'
                    });

                    var thirdPartyOld = oldRecord.getValue({
                        fieldId: 'custentity_jj_third_party_customer'
                    });

                    var taxNew = newRecord.getValue({
                        fieldId: 'custentity_jj_taxcode'
                    });

                    var taxOld = oldRecord.getValue({
                        fieldId: 'custentity_jj_taxcode'
                    });

                    var ucrNew = newRecord.getValue({
                        fieldId: 'custentity_jj_ucr_number'
                    });

                    var ucrOld = oldRecord.getValue({
                        fieldId: 'custentity_jj_ucr_number'
                    });

                    var mpcrList = openMPCR(id);
                    // log.debug('mpcrList', mpcrList.length)

                    // log.debug('thirdPartyNew', thirdPartyNew)
                    // log.debug('thirdPartyOld', thirdPartyOld)
                    // log.debug('taxNew', taxNew)
                    // log.debug('taxOld', taxOld)
                    // log.debug('ucrNew', ucrNew)
                    // log.debug('ucrOld', ucrOld)

                    if ((thirdPartyNew != thirdPartyOld) || (taxNew != taxOld) || (ucrNew != ucrOld)) {
                        setInvoiceField(mpcrList);
                    }

                    if (mpcrList.length > 0) {
                        if (numLinesNew != numLinesOld) {

                            setInvoiceField(mpcrList);

                        } else if (numLinesNew == numLinesOld) {

                            var isUcrNumberChanges = ucrNumberChange(oldRecord, newRecord, numLinesNew, numLinesOld);
                            // log.debug("isUcrNumberChanges", isUcrNumberChanges);

                            var isTaxCodeChanges = taxCodeChange(oldRecord, newRecord, numLinesNew, numLinesOld);
                            // log.debug("isTaxCodeChanges", isTaxCodeChanges);

                            if (isUcrNumberChanges == true || isTaxCodeChanges == true) {
                                setInvoiceField(mpcrList);
                            }


                        }
                    }

                }

                // if (scriptContext.type == "edit") {
                //     // var store = newRecord.getValue({ fieldId: 'custentityjj_store' });
                //     var numLines = newRecord.getLineCount({
                //         sublistId: 'recmachcustrecord24'
                //     });
                //     // log.debug("numLines", numLines);
                //     var resourceArrayText = [];
                //     var resourceArrayValues = [];
                //     for (var i = 0; i < numLines; i++) {
                //         var tempObject = {};
                //         var tempObject1 = {};
                //         tempObject.cost = newRecord.getSublistText({
                //             sublistId: 'recmachcustrecord24',
                //             fieldId: 'custrecord25',
                //             line: i
                //         });
                //         tempObject1.cost = newRecord.getSublistValue({
                //             sublistId: 'recmachcustrecord24',
                //             fieldId: 'custrecord25',
                //             line: i
                //         });
                //         tempObject.role = newRecord.getSublistText({
                //             sublistId: 'recmachcustrecord24',
                //             fieldId: 'custrecordjj_role',
                //             line: i
                //         });
                //         tempObject1.role = newRecord.getSublistValue({
                //             sublistId: 'recmachcustrecord24',
                //             fieldId: 'custrecordjj_role',
                //             line: i
                //         });
                //         tempObject.name = newRecord.getSublistText({
                //             sublistId: 'recmachcustrecord24',
                //             fieldId: 'custrecordjj_resourcenames',
                //             line: i
                //         });
                //         tempObject1.name = newRecord.getSublistValue({
                //             sublistId: 'recmachcustrecord24',
                //             fieldId: 'custrecordjj_resourcenames',
                //             line: i
                //         });
                //         resourceArrayText.push(tempObject);
                //         resourceArrayValues.push(tempObject1);
                //     }
                //     var objRecord = record.load({
                //         type: record.Type.JOB,
                //         id: newRecord.id,
                //         isDynamic: true
                //     });
                //     var totalLines = objRecord.getLineCount({
                //         sublistId: 'jobresources'
                //     });
                //     // log.debug("totalLines", totalLines);
                //     for (var j = 0; j < totalLines; j++) {
                //         objRecord.removeLine({
                //             sublistId: 'jobresources',
                //             line: j,
                //             ignoreRecalc: true
                //         });
                //         j--;
                //         totalLines--;
                //     }
                //     var totalLine = objRecord.getLineCount({
                //         sublistId: 'jobresources'
                //     });
                //     // log.debug("totalLine", totalLine);
                //     for (var k = 0; k < numLines; k++) {
                //         var roles = resourceArrayText[k].role;
                //         if (roles.length == 1) {
                //             var line = objRecord.selectNewLine({
                //                 sublistId: 'jobresources'
                //             });
                //             objRecord.setCurrentSublistText({
                //                 sublistId: 'jobresources',
                //                 fieldId: 'jobresource',
                //                 text: resourceArrayText[k].name,
                //                 ignoreFieldChange: true
                //             });
                //             objRecord.setCurrentSublistText({
                //                 sublistId: 'jobresources',
                //                 fieldId: 'role',
                //                 text: roles,
                //                 ignoreFieldChange: true
                //             });
                //             objRecord.setCurrentSublistText({
                //                 sublistId: 'jobresources',
                //                 fieldId: 'overridencost',
                //                 text: resourceArrayText[k].cost,
                //                 ignoreFieldChange: true
                //             });
                //             objRecord.commitLine({
                //                 sublistId: 'jobresources'
                //             });
                //         } else if (roles.length > 1) {
                //             for (var m = 0; m < roles.length; m++) {
                //                 var line = objRecord.selectNewLine({
                //                     sublistId: 'jobresources'
                //                 });
                //                 objRecord.setCurrentSublistText({
                //                     sublistId: 'jobresources',
                //                     fieldId: 'jobresource',
                //                     text: resourceArrayText[k].name,
                //                     ignoreFieldChange: true
                //                 });
                //                 objRecord.setCurrentSublistText({
                //                     sublistId: 'jobresources',
                //                     fieldId: 'role',
                //                     text: roles[m],
                //                     ignoreFieldChange: true
                //                 });
                //                 objRecord.setCurrentSublistText({
                //                     sublistId: 'jobresources',
                //                     fieldId: 'overridencost',
                //                     text: resourceArrayText[k].cost,
                //                     ignoreFieldChange: true
                //                 });
                //                 objRecord.commitLine({
                //                     sublistId: 'jobresources'
                //                 });
                //             }
                //         } else { }
                //     }
                //     objRecord.save();
                // }

            } catch (err) {
                log.debug('error @ afterSubmit', err);
                log.error("ERROR @ After Submit", err);
            }

        }

        //function for find the whether UCR number  field changes
        function ucrNumberChange(oldRecord, newRecord, numLinesNew, numLinesOld) {
            try {
                flagUCR = 0;
                for (var i = 0; i < numLinesNew; i++) {
                    var oldUCR = oldRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects',
                        fieldId: 'custrecord_jj_ucr_number',
                        line: i
                    });
                    var newUCR = newRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects',
                        fieldId: 'custrecord_jj_ucr_number',
                        line: i
                    });

                    if (oldUCR != newUCR) {
                        flagUCR = 1;
                    }
                }
                return flagUCR;
            } catch (err) {
                log.debug('error @ ucrNumberChange', err)
            }

        }

        //function for find the whether UCR number  field changes
        function taxCodeChange(oldRecord, newRecord, numLinesNew, numLinesOld) {
            try {
                flagTaxcode = 0;
                for (var i = 0; i < numLinesNew; i++) {
                    var oldTaxcode = oldRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects',
                        fieldId: 'custrecord_jj_ucr_taxcode',
                        line: i
                    });
                    var newTaxcode = newRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_jj_aq_227_projects',
                        fieldId: 'custrecord_jj_ucr_taxcode',
                        line: i
                    });

                    if (oldTaxcode != newTaxcode) {
                        flagTaxcode = 1;
                    }
                }
                return flagTaxcode;
            } catch (err) {
                log.debug('error @ taxCodeChange', err)
            }

        }

        function openMPCR(project) {
            try {
                var mpcr = [];
                var customrecord_jj_invoice_mpcrSearchObj = search.create({
                    type: "customrecord_jj_invoice_mpcr",
                    filters: [
                        ["custrecord_jj_protect_name.internalid", "anyof", project],
                        "AND",
                        ["custrecord_jj_status", "anyof", "1"]
                    ],
                    columns: [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
                });

                var searchResult = customrecord_jj_invoice_mpcrSearchObj.run().getRange({
                    start: 0,
                    end: 1000
                });
                var searchResultCount = customrecord_jj_invoice_mpcrSearchObj.runPaged().count;
                log.debug("searchResult result count", searchResult.length);

                if (searchResult.length > 0) {
                    for (var j = 0; j < searchResult.length; j++) {
                        var mpcrId = searchResult[j].getValue({
                            name: "internalid"
                        });
                        mpcr.push(mpcrId);
                    }
                }

                return mpcr;
            } catch (err) {
                log.debug('error @ openMPCR', err)
            }
        }

        //function for set the value for Refreshed Date field
        function setInvoiceField(invoices) {
            try {
                var d = new Date();
                log.debug("invoices", invoices);
                var formattedDate = format.format({
                    value: d,
                    type: format.Type.DATETIME,
                    timezone: format.Timezone.EUROPE_LONDON
                });
                log.debug("formattedDate", formattedDate);
                for (var i = 0; i < invoices.length; i++) {
                    record.submitFields({
                        type: 'customrecord_jj_invoice_mpcr',
                        id: invoices[i],
                        values: {
                            'custrecord_jj_refreshed_date': formattedDate
                        }
                    });
                }
            } catch (err) {
                log.debug('error @ setInvoiceField', err)
            }

        }


        //to set the select values
        function setSelectvalues(list_array, fieldname, type) {
            try {
                for (var i = 0; i < list_array.length; i++) {

                    if (type == 'taxcode') {
                        fieldname.addSelectOption({
                            value: list_array[i].InternalID.value,
                            text: list_array[i].Name.value
                        });
                    } else if (type == 'currency') {
                        fieldname.addSelectOption({
                            value: list_array[i].InternalID.value,
                            text: list_array[i].Name.value,
                        });
                    }


                }
            } catch (err) {
                log.debug('error @ setSelectvalues', err)
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
                        log.debug('Empty Value found', 'Empty Value for parameter ' + parameterName);
                    return false;
                }
            } catch (err) {
                log.debug('error @ checkForParameter', err)
            }

        }

        /********************************************************/
        //to fetch the subsidiary and country for taxcode list
        /*******************************************************/
        function searchSubs_country(rec) {
            try {
                //to fetch the subsidiary from the invoice record
                var subsidiary = rec.getValue({
                    fieldId: 'subsidiary'
                });
                log.debug('subsidiary', subsidiary)

                //lookup the country value from subsidiary record
                var lookup_val = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subsidiary,
                    columns: ['country']
                });
                log.debug("lookup_val",lookup_val)
                var country = lookup_val.country[0].value
                // log.debug('country', country)
                return [subsidiary, country];
            } catch (error) {
                log.debug('error @ searchSubs_country', error)
            }
        }
        //To list the filtered tax code
        function searchTaxcode(subsidiary_country) {
            try {
                var salestaxitemSearchObj = search.create({
                    type: "salestaxitem",
                    filters: [
                        ["subsidiary", "anyof", subsidiary_country[0]],
                        "AND",
                        ["country", "anyof", subsidiary_country[1]],
                        "AND",
                        ["availableon", "noneof", "PURCHASE"],
                        // ["availableon", "anyof", "SALE", "BOTH"],
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
                //  log.debug(" result count", searchResultCount);
                return iterateSavedSearch(salestaxitemSearchObj, fetchSavedSearchColumn(salestaxitemSearchObj, 'label'));
            } catch (err) {
                log.debug('error @ searchTaxcode', err)
            }

        }

        //to filter the currency
        function searchCurrency() {
            try {
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters: [],
                    columns: [
                        search.createColumn({
                            name: "currency",
                            summary: "GROUP",
                            label: "Currency"
                        })
                    ]
                });
                var searchResultCount2 = subsidiarySearchObj.runPaged().count;
                //log.debug("result count", searchResultCount2);
                return iterateSavedSearch(subsidiarySearchObj, fetchSavedSearchColumn(subsidiarySearchObj, 'label'));
            } catch (error) {
                log.debug('error @ searchCurrency', error)
            }
        }

        function fetchSavedSearchColumn(savedSearchObj, priorityKey) { //to format saved search column to key-value pair
            try {
                var columns = savedSearchObj.columns;
                var columnsData = { },
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
                // log.debug('columnsData', columnsData)
                return columnsData;
            } catch (err) {
                log.debug('error @ fetchSavedSearchColumn', err)
            }

        }


        //to fetch and format the single saved search result
        function formatSingleSavedSearchResult(searchResult, columns) {
            try {
                var responseObj = { };
                for (var column in columns)
                    responseObj[column] = {
                        value: searchResult.getValue(columns[column]),
                        text: searchResult.getText(columns[column])
                    };
                return responseObj;
            } catch (err) {
                log.debug('error @ formatSingleSavedSearchResult', err)
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
                // log.debug('pageRangeLength', pageRangeLength);

                for (var pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                    searchPageRanges.fetch({
                        index: pageIndex
                    }).data.forEach(function (result) {
                        response.push(formatSingleSavedSearchResult(result, columns));
                    });

                return response;
            } catch (err) {
                log.debug('error @ iterateSavedSearch', err)
            }

        }

        function fetchSavedSearchColumn(savedSearchObj, priorityKey) { //to format saved search column to key-value pair
            try {
                var columns = savedSearchObj.columns;
                var columnsData = { },
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
                // log.debug('columnsData', columnsData)
                return columnsData;
            } catch (err) {
                log.debug('error @ fetchSavedSearchColumn', err)
            }

        }
        //to fetch and format the single saved search result
        function formatSingleSavedSearchResult(searchResult, columns) {
            try {
                var responseObj = { };
                for (var column in columns)
                    responseObj[column] = {
                        value: searchResult.getValue(columns[column]),
                        text: searchResult.getText(columns[column])
                    };
                return responseObj;
            } catch (err) {
                log.debug('error @ formatSingleSavedSearchResult', err)
            }

        }
        //to add the column field
        function addExtraColumn(sublist, type, sublist_id, sublist_fieldid, rec) {
            try {
                //to add the tax code column to list the filtered tax codes
                var tax_codeField = sublist.addField({
                    id: 'custpage_taxcodefiltered_ucr',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Tax code'
                });
                // tax_codeField.isMandatory = true;

                if (type == 'edit') {
                    // tax_codeField.isMandatory = true;
                    //to fetch the linecount of sublist
                    var linecount = rec.getLineCount({
                        sublistId: sublist_id
                    });
                    // log.debug('linecount', linecount);
                    for (var j = 0; j < linecount; j++) {

                        var taxcode_original = rec.getSublistValue({
                            sublistId: sublist_id,
                            fieldId: sublist_fieldid,
                            line: j
                        });
                        // log.debug('taxcode_original', taxcode_original)
                        if (taxcode_original) {


                            rec.setSublistValue({
                                sublistId: sublist_id,
                                fieldId: 'custpage_taxcodefiltered_ucr',
                                line: j,
                                value: taxcode_original
                            });


                        }
                    }


                }
                return tax_codeField;
            } catch (error) {
                log.debug('error @ addExtraColumn', error)
            }
        }

        function checkif(param) {
            try {
                if (param == undefined || param == null || param == "" || param == " ")
                    return false;
                else
                    return true;

            } catch (e) {
                console.log("err@ checkif", e)
            }
        }

        function customerCurrencies(id) {
            try {
                var currentArray = []
                var currencySearchObj = search.create({
                    type: "currency",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "InternalID" }),
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })
                        ]
                });
                var searchResultCount = currencySearchObj.runPaged().count;
                log.debug("currencySearchObj result count", searchResultCount);
                return iterateSavedSearch(currencySearchObj, fetchSavedSearchColumn(currencySearchObj, 'label'));
            } catch (e) {
                log.debug("error@customerCurrencies", e)
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        };

    });