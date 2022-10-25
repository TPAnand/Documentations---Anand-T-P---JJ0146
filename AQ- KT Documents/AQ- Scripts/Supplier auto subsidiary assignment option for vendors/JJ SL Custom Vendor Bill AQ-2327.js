/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/runtime', 'N/redirect', 'N/ui/message', 'N/file', 'N/format'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{dialog} serverWidget
     * @param{url} url
     */
    (record, search, serverWidget, url, runtime, redirect, message, file, format) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {

            if (scriptContext.request.method === 'GET') {
                try {
                    var dateOld = scriptContext.request.parameters.datevalue
                    var existingProjectId = scriptContext.request.parameters.projectId
                    var existingRefNo = scriptContext.request.parameters.refNo
                    var existingMemo = scriptContext.request.parameters.memoNo

                    log.debug("dateOld", dateOld);

                    /*var dateString = JSON.stringify(dateOld);
                    log.debug("dateString",dateString);*/


                    if (dateOld) {

                        //log("var update = new Date(JSON.parse(date))",new Date(JSON.parse(dateOld)))

                        // var datenew = new Date(dateOld)
                        var datenew = (JSON.parse((dateOld)))
                        // datenew = format.parse({
                        //     value: datenew,
                        //     type: format.Type.DATE,
                        //     timezone: format.Timezone.EUROPE_LONDON
                        // });
                        // log.debug("datenew", datenew);
                        // var hours = datenew.getHours();
                        // hours = Number(hours) + 7
                        // datenew = datenew.setHours(hours)
                        // var datenew1 = new Date(datenew)
                        //var datenew = dateOld
                        //  log.debug("datenew1", datenew);
                        //  log.debug("datenew1", datenew.getDate());
                        //  //log.debug("date Type", typeof (datenew1));
                        //  var dateno = datenew.getDate();
                        //  log.debug("dateno", dateno);
                        //  var monthno = datenew.getMonth() + 1;
                        //  log.debug("monthno", monthno);
                        //  var fullyear = datenew.getFullYear();
                        //  log.debug("fullyear", fullyear);
                        //  var formattedDate = dateno + "/" + monthno + "/" + fullyear;
                        var formattedDate = datenew
                        log.debug("formattedDate inside", formattedDate);
                    }
                    log.debug("formattedDate", formattedDate);

                    var form = serverWidget.createForm({
                        title: 'Vendor Bill'
                    });
                    form.clientScriptFileId = 249057
                    // form.clientScriptFileId = 159229;
                    var progressBarField = form.addField({
                        id: 'custpage_progress_bar',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Progress bar'
                    });
                    var loadingUrl = "https://3689903.app.netsuite.com/core/media/media.nl?id=32305&c=3689903&h=dcec0a9dd4c1943ff816";
                    var htmlCode = "<div><img id='custpage_load_img_new' style='height:60px;width:100px;top: 175px;left: 800px;float: right;position: absolute;display: none;' src='" + loadingUrl + "'/></div>";
                    progressBarField.defaultValue = htmlCode;

                    var hidden = form.addField({
                        id: 'custpage_validate_multiples',
                        type: serverWidget.FieldType.CHECKBOX,
                        label: 'validatemultiples',
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    var supplier = form.addField({
                        id: 'custpage_supplier',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Supplier',
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    supplier.isMandatory = true;

                    var user = runtime.getCurrentUser().name;
                    var userId = runtime.getCurrentUser().id;
                    log.debug("userValue", user);
                    log.debug("userID", userId);
                    supplier.defaultValue = user;
                    var date = form.addField({
                        id: 'custpage_date1',
                        type: serverWidget.FieldType.DATE,
                        label: 'Date',
                    });
                    date.isMandatory = true;

                    var today = new Date();
                    date.defaultValue = today;

                    if (dateOld) {
                        date.defaultValue = formattedDate;
                    }
                    var referenceNo = form.addField({
                        id: 'custpage_referenceno',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Reference No',
                    });
                    referenceNo.isMandatory = true;
                    if (existingRefNo) {
                        referenceNo.defaultValue = existingRefNo
                    }
                    var currency = form.addField({
                        id: 'custpage_currency',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Currency'
                        //    source: 'customlist_currency_new'
                    })
                    var supplierRec1 = record.load({
                        type: record.Type.VENDOR,
                        id: userId,
                        isDynamic: true
                    });

                    var currencyCount = supplierRec1.getLineCount({
                        sublistId: 'currency'
                    });
                    log.debug('Currency Count', currencyCount);


                    var vendorSearchObj = search.create({
                        type: "vendor",
                        filters: [
                            ["internalid", "anyof", userId]
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
                            search.createColumn({ name: "internalid", label: "InternalID" }),
                            search.createColumn({ name: "subsidiary", label: "Primary Subsidiary" }),
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
                        var currencyObj = { id: idValue, value: currencyValue };
                        var subsidiaryId = result.getValue(vendorSearchObj.columns[4]);
                        var countryId = result.getValue(vendorSearchObj.columns[5]);
                        subsidiaryObj.subsidiaryId = subsidiaryId
                        subsidiaryObj.countryId = countryId
                        searcharray1.push(currencyValue);
                        return true;
                    });
                    //  return subsidiaryObj;
                    log.debug('searcharray1', searcharray1);
                    log.debug('subsidiaryObj', subsidiaryObj);

                    var jobSearchObj = search.create({
                        type: "job",
                        filters: [
                            ["allowexpenses", "is", "T"],
                            "AND", ["jobresource", "anyof", userId],
                            "AND",
                            ["status", "anyof", "2"],
                            "AND",
                            ["isinactive", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({ name: "internalid", label: "InternalID" })
                        ]
                    });
                    var searchResultCountjob = jobSearchObj.runPaged().count;
                    log.debug("jobSearchObj result count", searchResultCountjob);

                    var clientsearcharray = [];
                    jobSearchObj.run().each(function (result) {
                        var clientValue = result.getValue(jobSearchObj.columns[0]);
                        var clientId = result.getValue(jobSearchObj.columns[1]);
                        var clientObj = { id: clientId, value: clientValue };
                        clientsearcharray.push(clientObj);
                        return true;
                    });



                    log.debug("clientsearcharray", clientsearcharray);

                    //    var sub = supplierRec1.getValue({fieldId: 'subsidiary'});
                    //     var country = supplierRec1.getValue({fieldId: 'country'});
                    //   log.debug("sub",sub);
                    //    log.debug("country", country);


                    var vendorSearchObj1 = search.create({
                        type: "vendor",
                        filters:
                            [
                                ["internalid", "anyof", userId]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "subsidiary", label: "Primary Subsidiary" }),
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

                    log.debug("subcountryArray", subcountryArray);

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
                            search.createColumn({ name: "internalid", label: "InternalID" }),
                            search.createColumn({ name: "rate", label: "Rate" })
                        ]
                    });
                    var searchResultCounttax = salestaxitemSearchObj.runPaged().count;
                    log.debug("salestaxitemSearchObj result count", searchResultCount);


                    var taxsearcharray = [];
                    var taxratearray = [];
                    var taxcodeRateArray = [];

                    salestaxitemSearchObj.run().each(function (result) {
                        var taxcodeValue = result.getValue(salestaxitemSearchObj.columns[0]);
                        //  taxsearcharray.push(taxcodeValue);
                        var taxrateValue = result.getValue(salestaxitemSearchObj.columns[2]);
                        taxratearray.push(taxrateValue);
                        var internalId = result.getValue(salestaxitemSearchObj.columns[1]);
                        var taxcodeObj = { id: internalId, value: taxcodeValue };
                        taxsearcharray.push(taxcodeObj);
                        var taxcoderateObj = { id: internalId, value: taxrateValue };
                        taxcodeRateArray.push(taxcoderateObj);
                        return true;
                    });



                    for (var i = 0; i < searchResultCount; i++) {
                        currency.addSelectOption({
                            value: searcharray1[i],
                            text: searcharray1[i]
                        });
                    }

                    var amount = form.addField({
                        id: 'custpage_amount',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'Amount',
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    var status = form.addField({
                        id: 'custpage_status',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Status'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                    status.defaultValue = 'Pending Approval'

                    var clientproject = form.addField({
                        id: 'custpage_clientproject',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Client/Project'
                    });
                    clientproject.isMandatory = true;
                    if (existingProjectId) {
                        clientproject.defaultValue = existingProjectId
                    }

                    clientproject.addSelectOption({
                        value: '',
                        text: ""
                    });

                    for (var k = 0; k < searchResultCountjob; k++) {
                        clientproject.addSelectOption({
                            value: clientsearcharray[k].id,
                            text: clientsearcharray[k].value
                        });
                    }

                    var memo = form.addField({
                        id: 'custpage_memo',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Memo',
                    });


                    if (existingMemo) {
                        memo.defaultValue = existingMemo
                    }

                    var attachments = form.addField({
                        id: 'custpage_attachments',
                        type: serverWidget.FieldType.FILE,
                        label: 'Attachments'
                    });
                    var taxCodeRateHidden = form.addField({
                        id: 'custpage_taxcoderate_hidden',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'TaxCode & Taxrate'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    var taxcoderateString = JSON.stringify(taxcodeRateArray);

                    taxCodeRateHidden.defaultValue = taxcoderateString;
                    log.debug("taxcodeRateArray", taxcodeRateArray);
                    log.debug("taxcoderateString", taxcoderateString);

                    // attachments.folder = 15312;
                    // var fileId = attachments.save();

                    if (existingProjectId) {
                        var jobTaskSearchObj = search.create({
                            type: "job",
                            filters:
                                [
                                    ["internalid", "anyof", existingProjectId], "AND",
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
                            var jobtaskObj = { id: projecttaskid, value: projecttask };
                            jobtaskArray.push(jobtaskObj);
                            return true;
                        });
                        log.debug("Job task array", jobtaskArray);
                    }


                    var expenseandItems = form.addSublist({
                        id: 'custpage_expenseanditems',
                        type: serverWidget.SublistType.INLINEEDITOR,
                        label: 'Expenses'
                    });
                    var lineCategory = expenseandItems.addField({
                        id: 'custpage_category',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Category',
                        source: 'expensecategory'
                    });
                    lineCategory.defaultValue = 15;

                    var billable = expenseandItems.addField({
                        id: 'custpage_billablebills',
                        type: serverWidget.FieldType.CHECKBOX,
                        label: 'Billable'
                    });
                    billable.defaultValue = 'T';

                    var project = expenseandItems.addField({
                        id: 'custpage_projecttask',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Project Task'
                    });
                    project.addSelectOption({
                        value: '',
                        text: ""
                    });

                    if (existingProjectId)
                        for (var m = 0; m < searchResultCountjojtask; m++) {
                            project.addSelectOption({
                                value: jobtaskArray[m].id,
                                text: jobtaskArray[m].value
                            });
                        }
                    //changed
                    var lineMemo = expenseandItems.addField({
                        id: 'custpage_memo',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Memo'
                    });
                    lineMemo.isMandatory = true;

                    var amt = expenseandItems.addField({
                        id: 'custpage_amount1',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'Amount'
                    });
                    var taxCode = expenseandItems.addField({
                        id: 'custpage_taxcode',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Tax Code'
                    });

                    taxCode.isMandatory = true;
                    var taxRate = expenseandItems.addField({
                        id: 'custpage_taxrate',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Tax Rate'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
                    //taxRate.isDisabled = true
                    taxCode.addSelectOption({
                        value: '',
                        text: ""
                    });
                    //  var taxList = salesTaxCodeSearch(subsidiaryObj.subsidiaryId, subsidiaryObj.countryId)
                    for (var j = 0; j < searchResultCounttax; j++) {
                        taxCode.addSelectOption({
                            value: taxsearcharray[j].id,
                            text: taxsearcharray[j].value
                        });

                    }


                    var taxAmt = expenseandItems.addField({
                        id: 'custpage_taxamt',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'Tax Amt'
                    });

                    taxAmt.isDisabled = true
                    var grossAmt = expenseandItems.addField({
                        id: 'custpage_grossamt',
                        type: serverWidget.FieldType.CURRENCY,
                        label: 'Gross Amt'
                    });
                    grossAmt.isDisabled = true
                    amt.isMandatory = true;
                    /*var taxcodeHidden = expenseandItems.addField({
                        id: 'custpage_taxcode_hidden',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Tax Code Hidden'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    var taxrateHidden = expenseandItems.addField({
                        id: 'custpage_taxrate_hidden',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Tax Rate Hidden'
                    }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });*/

                    form.addSubmitButton({
                        label: 'Submit'
                    });
                    //var thisURL = request.getParameter('custpage_supplier');
                    form.addButton({
                        id: 'custpage_savebutton',
                        label: 'Save',
                        functionName: 'valuefetch'
                    });

                    //form.clientScriptFileId = 159225;

                } catch (e) {
                    log.debug("Err@ onRequest", e);
                }
                scriptContext.response.writePage(form);
            }
            if (scriptContext.request.method === 'POST') {
                try {
                    var response = scriptContext.response;
                    var request = scriptContext.request;

                    var getSupplier = request.parameters.custpage_supplier;
                    var getDate = request.parameters.custpage_date1;
                    log.debug("getDateeeee", getDate);
                    var getRefno = request.parameters.custpage_referenceno;
                    var getMemo = request.parameters.custpage_memo;
                    var getAmount = request.parameters.custpage_amount;
                    var getClient = request.parameters.custpage_clientproject;
                    var attach = scriptContext.request.files.custpage_attachments;
                    log.debug("attach", attach)
                    if (attach) {
                        attach.folder = 15318;
                        var fileId = attach.save();
                    }
                    var getCurrency = request.parameters.custpage_currency;
                    var userId1 = runtime.getCurrentUser().id;

                    function searchTaxcode(subsidiary_country, subsidiaryFrm) {
                        try {
                            var salestaxitemSearchObj = search.create({
                                type: "salestaxitem",
                                filters: [
                                    ["subsidiary", "anyof", subsidiaryFrm],
                                    "AND",
                                    ["country", "anyof", subsidiary_country],
                                    "AND",
                                    ["availableon", "anyof", "PURCHASE", "BOTH"],
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

                    var vendorSearchObjforsub = search.create({
                        type: "vendor",
                        filters:
                            [
                                ["internalid", "anyof", userId1]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "Internal ID" }),
                                search.createColumn({ name: "subsidiary", label: "Primary Subsidiary" })
                            ]
                    });
                    var searchResultCountforsub = vendorSearchObjforsub.runPaged().count;
                    log.debug("vendorSearchObj result count", searchResultCountforsub);

                    var vendorssubArray = [];
                    vendorSearchObjforsub.run().each(function (result) {
                        var vendorsubIdvalue = result.getValue(vendorSearchObjforsub.columns[0]);
                        var vendorsubNamevalue = result.getValue(vendorSearchObjforsub.columns[1]);
                        vendorssubArray.push(vendorsubNamevalue);
                        return true;
                    });

                    log.debug("vendorssubArray", vendorssubArray);

                    var supplierRec = record.load({
                        type: record.Type.VENDOR,
                        id: userId1,
                        isDynamic: true
                    });
                    var getTerms = supplierRec.getValue({ fieldId: 'terms' });
                    log.debug('getTerms', getTerms);
                    log.debug("getClientttt", getClient);
                    var projectRec = record.load({
                        type: record.Type.JOB,
                        id: getClient,
                        isDynamic: true
                    });
                    log.debug("projectReccc", projectRec);
                    var department = projectRec.getValue({ fieldId: 'custentitydepartment' });
                    var businessLine = projectRec.getValue({ fieldId: 'custentity_bussiness_line' });
                    var office = projectRec.getValue({ fieldId: 'custentity_office' });
                    var subsidiary = projectRec.getValue({ fieldId: 'subsidiary' });
                    log.debug("dept", department);
                    log.debug("businessLine", businessLine);
                    log.debug("office", office);
                    log.debug("subsidiary", subsidiary);


                    log.debug("getSupplier", getSupplier);
                    log.debug("getDate", getDate);
                    log.debug("getRefno", getRefno);
                    log.debug("getMemo", getMemo);
                    log.debug("getAmount", getAmount);
                    log.debug("getClient", getClient);
                    log.debug("getCurrency", getCurrency);

                    var count = request.getLineCount({
                        group: 'custpage_expenseanditems'
                    });
                    log.debug("Count", count);
                    var billRecord = record.create({
                        type: record.Type.VENDOR_BILL,
                        isDynamic: false
                    });

                    log.debug("Created", "Created");
                    var setSupplier = billRecord.setValue({
                        fieldId: 'entity',
                        value: userId1
                    });
                    log.debug("setSupplier", setSupplier);

                    //      var getsub = billRecord.getValue({ fieldId: 'subsidiary' });
                    //      log.debug("Subsidiary body field",getsub);

                    var setDate = billRecord.setText({
                        fieldId: 'trandate',
                        text: getDate
                    });
                    log.debug("setDate", setDate);
                    var setRefno = billRecord.setValue({
                        fieldId: 'tranid',
                        value: getRefno
                    });
                    log.debug("setRefno", setRefno);
                    var setMemo = billRecord.setText({
                        fieldId: 'memo',
                        text: getMemo
                    });
                    log.debug("setMemobody", setMemo);
                    var setAmount = billRecord.setText({
                        fieldId: 'usertotal',
                        text: getAmount
                    });
                    log.debug("setAmountbody", setAmount);
                    var setTerms = billRecord.setValue({
                        fieldId: 'terms',
                        value: getTerms
                    });
                    var setBusinessLine = billRecord.setValue({
                        fieldId: 'class',
                        value: businessLine
                    });
                    var setDepartment = billRecord.setValue({
                        fieldId: 'department',
                        value: department
                    });
                    var setproject = billRecord.setValue({
                        fieldId: 'custbody_jj_body_project',
                        value: getClient
                    });
                    log.debug("setproject", setproject);
                    var setStatus = billRecord.setValue({
                        fieldId: 'approvalstatus',
                        value: 1
                    });
                    var setOffice = billRecord.setValue({
                        fieldId: 'location',
                        value: ""
                    });
                    var setCurrency = billRecord.setText({
                        fieldId: 'currency',
                        text: getCurrency
                    });
                    var setCreated = billRecord.setValue({
                        fieldId: 'custbody_jj_created_from',
                        value: userId1
                    });

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
                        log.debug("setCategory ", setCategory);

                        var setBill = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_jj_billable',
                            line: i,
                            value: billValue
                        });
                        log.debug("setBill ", setBill);
                        var setTaxcode = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'taxcode',
                            line: i,
                            value: gettaxcode
                        });

                        var setAmount = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            line: i,
                            value: getAmount
                        });
                        log.debug("setAmount ", setAmount);

                        var setTaxRate = billRecord.setSublistText({
                            sublistId: 'expense',
                            fieldId: 'taxrate1',
                            line: i,
                            text: getTaxRate
                        });

                        var setTaxAmt = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'tax1amt',
                            line: i,
                            value: getTaxAmt
                        });

                        var setGrossAmt = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'grossamt',
                            line: i,
                            value: getGrossAmt
                        });

                        var setMemo = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_jj_client_bill',
                            line: i,
                            value: getClient
                        });

                        var setSubsidiary = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_jj_subsidiary_project',
                            line: i,
                            value: subsidiary
                        });

                        var setMemo = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'memo',
                            line: i,
                            value: getMemo
                        });
                        log.debug("setMemo", setMemo);

                        var setDept = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'department',
                            line: i,
                            value: department
                        });
                        var setBusiness = billRecord.setSublistValue({
                            sublistId: 'expense',
                            fieldId: 'class',
                            line: i,
                            value: businessLine
                        });

                        log.debug("getprojectTask", getprojectTask);

                        if (getprojectTask != 0) {
                            var setbillValue = billRecord.setSublistValue({
                                sublistId: 'expense',
                                fieldId: 'custcol_jj_project_task',
                                line: i,
                                value: getprojectTask,
                            });
                        }

                        if (subsidiary == vendorssubArray[0]) {
                            log.debug("Sub Equal", "Equal");
                            var setbillValue = billRecord.setSublistValue({
                                sublistId: 'expense',
                                fieldId: 'isbillable',
                                line: i,
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
                    log.debug("Saved", "saved");

                    var billCount = fetchRefId(getRefno)
                    log.debug("billCount", billCount)
                    if (billCount == 0) {
                        var saveBill = billRecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        log.debug("saveBill", saveBill)
                        if (attach) {
                            record.attach({
                                record: {
                                    type: 'file',
                                    id: fileId
                                },
                                to: {
                                    type: record.Type.VENDOR_BILL,
                                    id: saveBill
                                },

                            });
                        }
                        log.debug("After Save", "After Save");
                        var reBill = redirect.toSuitelet({
                            scriptId: '645',
                            deploymentId: '1'
                        });


                        log.debug("After Redirect", "After Redirect");
                    } else {
                        let resp = '<html><head></head><body><script>window.alert("Already have a vendor bill with same referance number.Please change the referance number");window.location.href = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=643&deploy=1"</script></body></html>'
                        response.write(resp);
                    }



                } catch (e) {
                    log.debug("Err@ onRequest", e);

                    let resp = '<html><head></head><body><script>window.alert("Unable to Create Bill \\n ' + e.message + ' ");window.location.href = "https://3689903.app.netsuite.com/app/site/hosting/scriptlet.nl?script=643&deploy=1"</script></body></html>'
                    response.write(resp);

                }
            }
        }

        function fetchRefId(refNo) {
            var count
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["formulatext: {tranid}", "is", refNo]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            summary: "COUNT",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        })
                    ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count", searchResultCount);
            transactionSearchObj.run().each(function (result) {
                if (searchResultCount > 0) {
                    count = result.getValue({
                        name: "internalid",
                        summary: "COUNT",
                        sort: search.Sort.ASC,
                        label: "Internal ID"
                    })
                }
                return true;
            });
            return count;
        }

        return { onRequest }

    });