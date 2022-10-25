/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
/**

 * Script Description

 * This Map Reduce to create and delete the records
 *
 */

/*******************************************************************************
 *
 * Support Files
 *
 * *****************************************************************************
 *
 *
 * $Author: Jobin & Jismi IT Services LLP $
 *
 * DESCRIPTION
 * CSV Import System
 *
 ******************************************************************************/
define(['N/record', 'N/file', 'N/email', 'N/runtime', 'N/search', 'N/email', 'N/encode', 'N/task', 'N/format'],
    function (record, file, email, runtime, search, email, encode, task, format) {
        var main = {
            /*Get inputData for Processing */
            getInputData: function (context) {
                //log.debug('context', context)
                var processfolderid = runtime.getCurrentScript().getParameter("custscript_json_fileid");

                main.sleep(40000);
                var mapinternal = main.findprocessfiles(processfolderid, false);
                var contextfile = file.load({
                    id: mapinternal
                });
                var contextContent = contextfile.getContents();
                var contextContent = JSON.parse(contextContent);
                //log.debug('contextContent', contextContent)
                var contextobj = JSON.parse(contextContent)
                var operation = contextobj.contextdetails.operation;
                var recordtype = contextobj.contextdetails.recordtype;
                if (operation == "create" || operation == "update") {
                    //                      log.debug('enter create')
                    var processFilles = main.findprocessfiles(processfolderid, true);
                    //log.debug("processFilles", processFilles);
                    var fileContent = main.setupProccessfiles(processFilles);

                } else if (operation == "delete") {
                    //log.debug("contextobj.contextdetails.deletedetail", contextobj.deletedetail)
                    var fileContent = main.searchRecord(contextobj.contextdetails.recordtype, contextobj.deletedetail);
                } else if (operation == "deleteduplicate") {
                    // log.debug("contextobj.contextdetails.deletedetail", contextobj.deletedetail)
                    //  log.debug("contextobj.contextdetails.recordtype", contextobj.contextdetails.recordtype)
                    var fileContent = main.searchDuplicateRecord(contextobj.contextdetails.recordtype, contextobj.deletedetail);
                }
                try {
                    //  log.debug("fileContent", fileContent.length);
                } catch (e) {
                    log.debug('error', e)
                }
                //log.debug("fileContent", fileContent)
                return fileContent;
            },
            sleep: function (milliseconds) {
                var date = Date.now();
                var currentDate = null;
                do {
                    currentDate = Date.now();
                } while (currentDate - date < milliseconds);
            },
            /*Concatnate the Arrays from Chunks Folder  */
            setupProccessfiles: function (filefolder) {
                var len = filefolder.length;
                var array = [];
                for (var i = 0; i < len; i++) {
                    if (filefolder[i].name != "scriptcontext.txt") {
                        var processFile = file.load({
                            id: filefolder[i].internalid
                        });
                        var fileContent = processFile.getContents();
                        var temparray = JSON.parse(fileContent);
                        array.push(temparray);
                    }
                }
                var fullarray = [].concat.apply([], array);
                return fullarray;
            },
            /*If the process is delete duplicates, then use the ESN number to find the internalid*/
            searchDuplicateRecord: function (recordtype, date) {
                //log.debug('date', date);
                var filterarry = []
                if (date == "all") {

                } else {
                    filterarry.push(["created", "within", date])
                }

                var SearchObj = search.create({
                    type: recordtype,
                    columns: [
                        search.createColumn({
                            name: "custrecord_jj_esn",
                            label: "ESN"
                        }),
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        })
                    ],
                    filters: filterarry

                });
                var searchPageRanges = SearchObj.runPaged({
                    pageSize: 1000
                });
                var internalids = [];
                var esnNum = { };

                for (var i = 0; i < searchPageRanges.pageRanges.length; i++) {
                    searchPageRanges.fetch({
                        index: i
                    }).data.forEach(function (result) {
                        var esn_number = result.getValue("custrecord_jj_esn");
                        var internal_id = result.getValue("internalid");


                        try {
                            esnNum[esn_number].push(internal_id);
                        } catch (e) {
                            esnNum[esn_number] = []
                            esnNum[esn_number].push(internal_id);
                        }

                        return true;
                    });
                }
                Object.keys(esnNum).forEach(function (key) {

                    for (var i = 0; i < esnNum[key].length; i++) {
                        if (esnNum[key][i + 1]) {
                            internalids.push(esnNum[key][i + 1])
                        }
                    }

                });
                // log.debug('internalids', internalids)
                // log.debug("esnNum", esnNum);
                // log.debug("duplciatearray length", internalids.length);
                return internalids;
            },

            /*If Process is Delete then get the internalids */
            searchRecord: function (recordtype, date) {
                var filterarry = []
                if (date == "all") {

                } else {
                    filterarry.push(["created", "within", date])
                }
                //                    log.debug("date", date);
                var SearchObj = search.create({
                    type: recordtype,
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        })
                    ],
                    filters: filterarry

                });
                var searchPageRanges = SearchObj.runPaged({
                    pageSize: 1000
                });
                var internalids = [];
                for (var i = 0; i < searchPageRanges.pageRanges.length; i++) {
                    searchPageRanges.fetch({
                        index: i
                    }).data.forEach(function (result) {
                        internalids.push(result.getValue("internalid"));
                        return true;
                    });
                }
                //log.debug("deletearray length", internalids.length);
                return internalids;
            },
            /*Find JSON chunks From the Folder For Processing */
            findprocessfiles: function (folderid, flag) {

                var fileSearchObj = search.create({
                    type: "file",
                    filters: [
                        ["folder", "anyof", folderid]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
                });
                var searchResultCount = fileSearchObj.runPaged().count;
                if (flag == true) {
                    var processarray = [];
                    fileSearchObj.run().each(function (result) {
                        var tempobj = { };
                        tempobj.internalid = result.getValue("internalid");
                        tempobj.name = result.getValue("name");
                        processarray.push(tempobj);
                        return true;
                    });
                    return processarray;
                } else {
                    var mapinternal;
                    fileSearchObj.run().each(function (result) {
                        if (result.getValue("name") == "scriptcontext.txt") {
                            mapinternal = result.getValue("internalid");
                        }
                        return true;
                    });
                    return mapinternal;
                }
            },
            /*Reduce Function of map Reduce */
            reduce: function (context) {
                var processfolderid = runtime.getCurrentScript().getParameter("custscript_json_fileid");
                var mapinternal = main.findprocessfiles(processfolderid, false);
                //log.debug('mapinternal',mapinternal)
                var contextfile = file.load({
                    id: mapinternal
                });
                var contextContent = contextfile.getContents();
                // log.debug("contextContent", contextContent)
                var contextContent = JSON.parse(contextContent);
                var contextobj = JSON.parse(contextContent)
                var operation = contextobj.contextdetails.operation;
                var recordtype = contextobj.contextdetails.recordtype;
                var recordname = contextobj.contextdetails.recordname;
                var mapobj = contextobj.mapobj;
                //log.debug("mapobj", mapobj)
                var currentobj = context.values;
                // log.debug("currentobj", currentobj)
                var convertedfile = JSON.parse(currentobj[0]);
                if (convertedfile.length == 1) { //1 if the input file is CSV one.
                    convertedfile = convertedfile[0].split(',')
                }
                // log.debug("convertedfile", convertedfile)
                // log.debug('recordname', recordname)

                if (operation == "create") {
                    if (recordname != "Spiff Amount") {
                        if (recordname != "Residual Monthly") {
                            var intrId;
                            if (recordtype == "customrecord_jj_tracfone_activations") {

                                var tracfone_record = true;
                                var simno_tracfone = convertedfile[mapobj['custrecordjj_tra_sim']]
                                // log.debug('simno_tracfone', simno_tracfone)
                                var customrecord_jj_tracfone_activationsSearchObj = search.create({
                                    type: "customrecord_jj_tracfone_activations",
                                    filters: [
                                        ["custrecordjj_tra_sim", "is", simno_tracfone]
                                    ],
                                    columns: [
                                        search.createColumn({
                                            name: "internalid",
                                            label: "Internal ID"
                                        })
                                    ]
                                });
                                var searchResult = customrecord_jj_tracfone_activationsSearchObj.run().getRange({
                                    start: 0,
                                    end: 1
                                });
                                for (var j = 0; j < searchResult.length; j++) {
                                    intrId = searchResult[j].getValue({
                                        name: "internalid"
                                    });
                                }
                            }
                            // log.debug('tracfone_record', tracfone_record)
                            // log.debug('intrId', intrId)
                            if (intrId && tracfone_record) {
                                //log.debug('duplicate record')
                            } else {

                                main.createrecord(recordtype, mapobj, convertedfile, processfolderid);
                            }
                        } else {
                            //log.debug("testing loop residual amount")
                        }
                    } else {
                        //log.debug("testing loop spiff amount")
                    }
                } else if (operation == "delete") {
                    //     log.debug("convertedfile", convertedfile);
                    main.deleteRecord(recordtype, convertedfile);
                } else if (operation == "deleteduplicate") {
                    // log.debug("convertedfile duplicate", convertedfile);
                    main.deleteRecord(recordtype, convertedfile);
                } else if (operation == "update") {
                    var intrId;

                    if (recordtype == "customrecord_jj_tracfone_activations") {
                        var tracfone_record = true;
                        var simno_tracfone = convertedfile[mapobj['custrecordjj_tra_sim']]

                        var customrecord_jj_tracfone_activationsSearchObj = search.create({
                            type: "customrecord_jj_tracfone_activations",
                            filters: [
                                ["custrecordjj_tra_sim", "is", simno_tracfone]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "internalid",
                                    label: "Internal ID"
                                })
                            ]
                        });

                        var searchResult = customrecord_jj_tracfone_activationsSearchObj.run().getRange({
                            start: 0,
                            end: 1
                        });

                        for (var j = 0; j < searchResult.length; j++) {
                            intrId = searchResult[j].getValue({
                                name: "internalid"
                            });

                        }
                        if (searchResult.length <= 0) {
                            convertedfile.push("SIM Number is not present");
                            var folderid;
                            var init = main.checkforfolder(processfolderid);
                            if (init == true) {
                                folderid = main.createfolder(processfolderid);
                            } else {
                                folderid = init;

                            }
                            main.errorlog(processfolderid, convertedfile, folderid);
                            //                            log.debug("duplicate ESN ", esnno)
                            return true;
                        }

                    }
                    if (intrId && tracfone_record) {

                        // log.debug('simno_tracfone : ' + simno_tracfone, 'intrId: ' + intrId);
                        main.updateRecord(recordtype, mapobj, convertedfile, processfolderid, intrId, recordname);
                    }

                }
            },
            /*To Find Error Files */
            finderrorfiles: function (errorfolderid) {
                // log.debug("errorfolderid", errorfolderid)
                var fileSearchObj = search.create({
                    type: "folder",
                    filters: [
                        ["name", "is", errorfolderid]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
                });
                var resultSet = fileSearchObj.run();
                var firstResult = resultSet.getRange({
                    start: 0,
                    end: 1
                })[0];
                //                    log.debug('firstResult',firstResult)
                var value = firstResult.getValue(resultSet.columns[0]);
                var fileError = search.create({
                    type: "file",
                    filters: [
                        ["folder", "anyof", value]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
                })
                var processarray = [];
                fileError.run().each(function (result) {
                    var tempobj = { };
                    tempobj.internalid = result.getValue("internalid");
                    tempobj.name = result.getValue("name");
                    processarray.push(tempobj);
                    return true;
                });
                var len = processarray.length;
                var array = [];
                for (var i = 0; i < len; i++) {
                    if (processarray[i].name != "scriptcontext.txt") {
                        var processFile = file.load({
                            id: processarray[i].internalid
                        });
                        var fileContent = processFile.getContents();
                        array.push(fileContent);
                    }
                }
                //     var fullarray = [].concat.apply([], array);
                return array;

            },
            /*Error Folder For Logging and send Email*/
            createfolder: function (data) {
                var folderRec = record.create({
                    type: record.Type.FOLDER,
                    isDynamic: true
                });
                folderRec.setValue({
                    fieldId: 'parent',
                    value: 10189
                });
                folderRec.setValue({
                    fieldId: 'name',
                    value: data
                });
                var folderId = folderRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return folderId;
            },
            /*To check whether there is any folder existing for error log*/
            checkforfolder: function (name) {
                var folderSearchObj = search.create({
                    type: "folder",
                    filters: [
                        ["name", "is", name]
                    ],
                    columns: [

                        search.createColumn({
                            name: "internalid",
                            label: "internalid"
                        })
                    ]
                });
                var searchResultCount = folderSearchObj.runPaged().count;
                if (searchResultCount < 1) {
                    return true
                } else {
                    var internalid;
                    folderSearchObj.run().each(function (result) {
                        internalid = result.getValue("internalid");
                        return true;
                    });
                    return internalid;
                }
            },
            /* Create the error file in the error error log */
            createfile: function (name, folderid, convertedfile) {
                var folderinternal;
                if (folderid > 0) {
                    folderinternal = folderid;
                } else {
                    folderinternal = 10189
                }
                var fileObj = file.create({
                    name: name + '.txt',
                    fileType: file.Type.PLAINTEXT,
                    contents: convertedfile.toString(),
                    folder: folderinternal,
                    isOnline: true
                });

                var fileid = fileObj.save();
                return fileid;
            },
            /*Delete Process Actions */
            deleteRecord: function (type, internalid) {
                record.delete({
                    type: type,
                    id: internalid
                });
            },
            /*Update record actions Process */
            updateRecord: function (recordtype, mapobj, convertedfile, processfolderid, intrId, recordname) {
                if (recordtype == "customrecord_jj_tracfone_activations") {

                    if (recordname != "Spiff Amount") {

                        if (recordname != "Residual Monthly") {

                            var value_xl = convertedfile[mapobj['custrecord_jj_plan']]

                            //log.debug('convertedfile[mapobj[custrecord_ao_spiff_paid_date]]', convertedfile[mapobj['custrecord_ao_spiff_paid_date']])
                            var activationMonth_xl = main.doValidations(convertedfile[mapobj['custrecord_ao_spiff_paid_date']], recordtype)
                            // log.debug('activationMonth_xl', activationMonth_xl)

                            if (activationMonth_xl) {
                                var formattedDateString = activationMonth_xl

                            }
                            var commission = convertedfile[mapobj['custrecord_ao_last_resid_amount']]
                            var usedDate = convertedfile[mapobj['custrecord_ao_last_paid_resid']]
                            if (usedDate) {

                                var formattedDateStringResidue = main.doValidations(usedDate, recordtype)

                            }
                            var cust_load = record.load({
                                type: 'customrecord_jj_tracfone_activations',
                                id: intrId
                                /*,
                                isDynamic: true */
                            });

                            cust_load.setValue({
                                fieldId: "custrecord_jj_plan",
                                value: value_xl
                            });

                            if (activationMonth_xl) {
                                cust_load.setValue({
                                    fieldId: "custrecord_ao_spiff_paid_amouunt",
                                    value: commission
                                });
                                cust_load.setText({
                                    fieldId: "custrecord_ao_spiff_paid_date",
                                    text: formattedDateString
                                });
                            }
                            if (usedDate) {
                                cust_load.setValue({
                                    fieldId: "custrecord_ao_last_resid_amount",
                                    value: commission
                                });
                                cust_load.setText({
                                    fieldId: "custrecord_ao_last_paid_resid",
                                    text: formattedDateStringResidue
                                });
                            }
                            var id = cust_load.save({
                                enableSourcing: true
                            });
                            log.debug("Record updated ", id);

                        } else {
                            //log.debug('enter resid loop')

                            var objRecord = record.load({
                                type: 'customrecord_jj_tracfone_activations',
                                id: intrId
                            });
                            for (var key in mapobj) {
                                if (key != "-") {
                                    var currentValue = main.doValidations(convertedfile[mapobj[key]], recordtype);
                                    // log.debug('currentValue', currentValue)
                                    if (currentValue.indexOf("$") > -1) {
                                        var temp = currentValue.split('$')
                                        currentValue = temp[1]
                                    }
                                    //  log.debug('Updated currentValue', currentValue)
                                    try {
                                        //log.debug('enter try key', key)
                                        objRecord.setText({
                                            fieldId: key,
                                            text: currentValue.toString().trim()
                                        });

                                        var simEarning = objRecord.getValue({
                                            fieldId: 'custrecord23'
                                        })
                                        if (key == 'custrecord_ao_last_resid_amount') {


                                            simEarning = simEarning + Number(currentValue)
                                            objRecord.setValue({
                                                fieldId: 'custrecord23',
                                                value: simEarning.toString().trim()
                                            });
                                        }



                                    } catch (e) {
                                        try {
                                            objRecord.setValue({
                                                fieldId: key,
                                                value: currentValue.toString().trim()
                                            });

                                        } catch (error) {
                                            // log.debug("Error for creating record", error.message)
                                            convertedfile.push(error.message);
                                            //                                        log.debug("Econvertedfile", convertedfile)
                                            var folderid;
                                            var init = main.checkforfolder(processfolderid);
                                            if (init == true) {
                                                folderid = main.createfolder(processfolderid);
                                            } else {
                                                folderid = init;

                                            }
                                            main.errorlog(processfolderid, convertedfile);
                                            return error;
                                        }
                                    }
                                }
                            }
                            var id = objRecord.save({
                                enableSourcing: false
                            });
                            log.debug("Record updated ", id);


                        }
                    } else {
                        log.debug('testing update another')

                        var objRecord = record.load({
                            type: 'customrecord_jj_tracfone_activations',
                            id: intrId
                            /*,
                            isDynamic: true */
                        });

                        for (var key in mapobj) {
                            if (key != "-") {
                                var currentValue = main.doValidations(convertedfile[mapobj[key]], recordtype);
                                log.debug('currentValue', currentValue)
                                if (currentValue.indexOf("$") > -1) {
                                    var temp = currentValue.split('$')
                                    currentValue = temp[1]
                                }
                                log.debug('Updated currentValue', currentValue)
                                /*var currentDate = main.doValidations(convertedfile[mapobj['custrecord_ao_spiff_paid_date']], recordtype);*/

                                try {
                                    log.debug('enter try key', key)
                                    /*objRecord.setValue({
                                        fieldId: 'custrecord_ao_spiff_paid_amouunt',
                                        value: currentValue.toString().trim()
                                    });

                                    objRecord.setText({
                                        fieldId: 'custrecord_ao_spiff_paid_date',
                                        text: currentDate
                                    });*/


                                    objRecord.setText({
                                        fieldId: key,
                                        text: currentValue.toString().trim()
                                    });


                                } catch (e) {

                                    try {
                                        objRecord.setValue({
                                            fieldId: key,
                                            value: currentValue.toString().trim()
                                        });

                                    } catch (error) {
                                        // log.debug("Error for creating record", error.message)
                                        convertedfile.push(error.message);
                                        //                                        log.debug("Econvertedfile", convertedfile)
                                        var folderid;
                                        var init = main.checkforfolder(processfolderid);
                                        if (init == true) {
                                            folderid = main.createfolder(processfolderid);
                                        } else {
                                            folderid = init;

                                        }
                                        main.errorlog(processfolderid, convertedfile);
                                        return error;
                                    }

                                    /*  }*/
                                }
                            }
                        }
                        var id = objRecord.save({
                            enableSourcing: false
                        });
                        log.debug("Record updated ", id);

                    }

                }
            },
            /*Create record actions Process */
            createrecord: function (recordtype, mapobj, convertedfile, processfolderid) {
                log.debug("enter create fun")
                log.debug("mapobj", mapobj)

                var duplicate = false;
                if (convertedfile.length > 0) {
                    var objRecord = record.create({
                        type: recordtype,
                        isDynamic: true
                    });
                    for (var key in mapobj) {
                        if (key != "-") {
                            log.debug('key', key)
                            log.debug('convertedfile[mapobj[key]]', convertedfile[mapobj[key]])
                            var currentValue = main.doValidations(convertedfile[mapobj[key]], recordtype);
                            try {
                                objRecord.setValue({
                                    fieldId: key,
                                    value: currentValue.toString().trim()
                                });
                            } catch (e) {
                                try {
                                    objRecord.setText({
                                        fieldId: key,
                                        text: currentValue.toString().trim()
                                    });
                                } catch (error) {
                                    // log.debug("Error for creating record", error.message)
                                    convertedfile.push(error.message);
                                    //                                        log.debug("Econvertedfile", convertedfile)
                                    var folderid;
                                    var init = main.checkforfolder(processfolderid);
                                    if (init == true) {
                                        folderid = main.createfolder(processfolderid);
                                    } else {
                                        folderid = init;

                                    }
                                    main.errorlog(processfolderid, convertedfile);
                                    return error;
                                }
                            }
                        }
                    };
                    log.debug('testing record type', recordtype)
                    if (recordtype == "customrecord_jj_branded_handset") {
                        var simno = convertedfile[mapobj['custrecord_jj_sim']]

                        var esnno = convertedfile[mapobj['custrecord_jj_esn']]

                        duplicate = main.checksim(simno, esnno, processfolderid, convertedfile);
                        var tectraId = objRecord.getValue({
                            fieldId: 'custrecord_jj_branded_tcetraid'
                        });

                        var customerDetails = main.findCustomerdetails(tectraId, "custentity1");

                        objRecord.setValue({
                            fieldId: "custrecord_jj_customer",
                            value: customerDetails.customerId
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_sales_rep",
                            value: customerDetails.salesreppartner
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_subof_sales_partner",
                            value: customerDetails.subof
                        });
                    }
                    else if (recordtype == "customrecord_jj_route_run") {

                        var tectraId = objRecord.getValue({
                            fieldId: 'custrecord_jj_tcetraid'
                        });
                        var customerDetails = main.findCustomerdetails(tectraId, "custentity1");
                        objRecord.setValue({
                            fieldId: "custrecord_jj_customerid",
                            value: customerDetails.customerId
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_sales_rep_route",
                            value: customerDetails.salesreppartner
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_subof_route",
                            value: customerDetails.subof
                        });
                    }
                    else if (recordtype == "customrecord_jj_qpay_marketplace_details") {

                        var incommId = objRecord.getValue({
                            fieldId: 'custrecord_jj_branchid'
                        });
                        var customerDetails = main.findCustomerdetails(incommId, "custentityincomeexclusiveid");
                        objRecord.setValue({
                            fieldId: "custrecord_qpay_customerid",
                            value: customerDetails.customerId
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_sales_rep_maeket",
                            value: customerDetails.salesreppartner
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_subof_market",
                            value: customerDetails.subof
                        });
                    }
                    else if (recordtype == "customrecord_jj_qpaydetail_transaction") {
                        /*as per discusions on 07-07 parent id and parent name need not to be set*/
                        var incommId = objRecord.getValue({
                            fieldId: 'custrecord_jj_qpaydetail_incommid'
                        });
                        var parentId = objRecord.getValue({
                            fieldId: 'custrecord_jj_details_parentid'
                        });
                        //getting the parent name
                        var parentName = objRecord.getValue({
                            fieldId: 'custrecord_jj_qpaydetail_parent_nm'
                        });
                        var customerDetails = main.findCustomerdetails(incommId, "custentityincomeexclusiveid");
                        objRecord.setValue({
                            fieldId: "custrecord_jj_qpaydetail_custid",
                            value: customerDetails.customerId
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_sales_rep_qpay",
                            value: customerDetails.salesreppartner
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_subof_salesrep",
                            value: customerDetails.subof
                        });

                        // set the parent id id in the customer record
                        /*            var parId = record.submitFields({
                        type: record.Type.CUSTOMER,
                        id: customerDetails.customerId,
                        values: {
                        custentity_jj_parentaccountid: parentId,
                        custentity_jj_parentname: parentName
                        }
                        });*/

                    }
                    else if (recordtype == "customrecord223") {
                        var tectraId = objRecord.getValue({
                            fieldId: 'custrecord6'
                        });
                        var customerDetails = main.findCustomerdetails(tectraId, "custentity1");
                        //                            log.debug(tectraId, customerDetails);
                        objRecord.setValue({
                            fieldId: "custrecord_jj_customer_vidapay",
                            value: customerDetails.customerId
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_salesrep_vidapay",
                            value: customerDetails.salesreppartner
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_subof_vidapay",
                            value: customerDetails.subof
                        });
                    }
                    else if (recordtype == "customrecord_jj_tracfone_activations") {
                        log.debug('recordtype checksim', recordtype)

                        var tectraId = objRecord.getValue({
                            fieldId: 'custrecord_jj_trc_tsp_id'
                        });

                        var partnetID = objRecord.getValue({
                            fieldId:"custrecord_jj_tra_partner_id"
                        })
                        log.debug("partnetID",partnetID)
                       

                        if(partnetID == "IAS"){
                            var searchField =  "custentityincomeexclusiveid"
                        }else{
                            var searchField =  "custentity1"
                        }
                        log.debug("searchField",searchField)
                        log.debug("tectraId",tectraId)

                        var customerDetails = main.findCustomerdetails(tectraId, searchField);
                        log.debug("customerDetails",customerDetails)

                        objRecord.setValue({
                            fieldId: "custrecord_jj_tracfone_activa_cusid",
                            value: customerDetails.customerId
                        });
                        objRecord.setValue({
                            fieldId: "custrecord_jj_sales_rep_tracfone",
                            value: customerDetails.salesreppartner
                        });
                        /*  objRecord.setValue({
                              fieldId: "custrecord_jj_subof_sales_partner",
                              value: customerDetails.subof
                          });*/
                    }
                    else if (recordtype == "customrecord_jj_marketplace_sales_order") {
                        /* MTW-252 This else if part is done for the record creation for the marketplace integration*/

                        var simNumber = convertedfile[7];
                        duplicate = main.detectDuplicateSim(recordtype, simNumber);
                        log.debug("duplicate", duplicate)

                        if (duplicate != false) {
                            log.debug("reach leve2")
                            main.updateMarketPlaceRec(convertedfile, duplicate, recordtype)
                        } else {
                            log.debug("reach level")
                            log.debug("convertedfile[0]: ",convertedfile[0])
                            // var convertedDate = main.dateValidation(JSON.stringify(convertedfile[0]))
                            // log.debug("convertedDate: ",convertedDate)
                            // var orderedDate = format.format({
                            //     value: convertedDate,
                            //     type:format.Type.DATE
                            // })
                            // log.debug("orderedDate: ",orderedDate)
                            objRecord.setText({
                                fieldId: "custrecord_jj_date_ordered",
                                text: convertedfile[0]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_order",
                                value: convertedfile[1]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_product_id",
                                value: convertedfile[2]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_marketplace_product_name",
                                value: convertedfile[3]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_marketplace_dealer_cost",
                                value: convertedfile[7]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_current_parent_commission",
                                value: convertedfile[8]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_sum_of_sub_parent_commissi",
                                value: convertedfile[9]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_marketplace_sim_esn",
                                value: convertedfile[12]
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_part_number",
                                value: convertedfile[13]
                            });

                            log.debug("convertedfile[15]", convertedfile[13])
                            objRecord.setValue({
                                fieldId: "custrecord_jj_merchant_account_id",
                                value: convertedfile[20]
                            });

                            var customerDetails = main.findCustomerdetails(convertedfile[20], "custentity1");

                            log.debug("customerDetails", customerDetails)

                            objRecord.setValue({
                                fieldId: "custrecord_jj_merchant_name",
                                value: customerDetails.customerId
                            });

                            log.debug("convertedfile[24]", convertedfile[29])
                            objRecord.setText({
                                fieldId: "custrecord_jj_marketplace_date_shipped",
                                text: convertedfile[29]//new Date(main.dateValidation(convertedfile[22]))
                            });

                            objRecord.setValue({
                                fieldId: "custrecord_jj_marketplace_tracking_numbe",
                                value: convertedfile[30]
                            });

                            log.debug("convertedfile[10]", convertedfile[16])
                            objRecord.setValue({
                                fieldId: "custrecord_jj_marketplace_active_status",
                                value: convertedfile[16]
                            });

                        }


                    }
                    else if (recordtype == "customrecord_mw_tracfone_residual_month") {
                        var sim = objRecord.getValue({
                            fieldId: 'custrecord_jj_trc_mnthly_sim'
                        });
                        //                            log.debug("sim", sim)
                        try {
                            var activationsSearchObj = search.create({
                                type: 'customrecord_jj_tracfone_activations',
                                columns: [{
                                    name: "custrecord_jj_tracfone_activa_cusid"
                                }, {
                                    name: 'custrecord_jj_sales_rep_tracfone'
                                }, {
                                    name: 'custrecord_jj_city'
                                }, {
                                    name: 'custrecord_jj_state'
                                }],
                                filters: ["custrecordjj_tra_sim", "is", sim]
                            });
                            var activationsResultCount = activationsSearchObj.runPaged().count;
                            if (activationsResultCount == 1) {
                                //then there will be 1 sim in tracfone activation record
                                var searchResult = activationsSearchObj.run().getRange({
                                    start: 0,
                                    end: 1
                                });
                                //                                    log.debug("searchResult", searchResult);
                                var custID = searchResult[0].getValue({
                                    name: 'custrecord_jj_tracfone_activa_cusid'
                                });
                                //                                    log.debug("custID from Tracfone", custID);
                                if (custID != '') {
                                    var searchResultForCustomer = main.searchForCustomer(custID);
                                    objRecord.setValue({
                                        fieldId: "custrecord_mw_tracfone_customer",
                                        value: custID
                                    });
                                }
                                //                                    log.debug("searchResultForCustomer", searchResultForCustomer);
                                var salesRepTrcMnthly = searchResult[0].getText({
                                    name: 'custrecord_jj_sales_rep_tracfone'
                                });
                                var cityTrcMnthly = searchResult[0].getValue({
                                    name: 'custrecord_jj_city'
                                });
                                var stateTrcMnthly = searchResult[0].getValue({
                                    name: 'custrecord_jj_state'
                                });
                            }

                            objRecord.setValue({
                                fieldId: "custrecord_jj_sales_name",
                                value: salesRepTrcMnthly
                            });
                            objRecord.setValue({
                                fieldId: "custrecord_jj_trc_mnthly_city",
                                value: cityTrcMnthly
                            });
                            objRecord.setValue({
                                fieldId: "custrecord_jj_trc_mnthly_state",
                                value: stateTrcMnthly
                            });
                            objRecord.setValue({
                                fieldId: "custrecord_jj_parent_name",
                                value: searchResultForCustomer.parentName
                            });
                            objRecord.setValue({
                                fieldId: "custrecord_jj_parent_id",
                                value: searchResultForCustomer.parentID
                            });
                            objRecord.setValue({
                                fieldId: "custrecord_incomm_id",
                                value: searchResultForCustomer.incommId
                            });
                            objRecord.setValue({
                                fieldId: "custrecordcustrecord_tcetra_id",
                                value: searchResultForCustomer.tectraId
                            });
                        } catch (e) {
                            log.debug("e", e);
                        }
                    }
                }
                if (duplicate == false || duplicate == null) {
                    var id = objRecord.save({
                        enableSourcing: true
                    });
                    log.debug("Record Created ", id);
                } else {
                    log.debug("duplicate ", duplicate);
                }

            },
            /* MTW-252 The function for check duplicate sim number */
            detectDuplicateSim: function (recordtype, simNumber) {
                var customrecord_jj_marketplace_sales_orderSearchObj = search.create({
                    type: recordtype,
                    filters:
                        [
                            ["custrecord_jj_marketplace_sim_esn", "is", simNumber]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var searchResultCount = customrecord_jj_marketplace_sales_orderSearchObj.runPaged().count;
                var recordIdVal = null;
                if (searchResultCount > 0) {
                    customrecord_jj_marketplace_sales_orderSearchObj.run().each(function (result) {
                        recordIdVal = result.getValue({ name: "internalid", label: "Internal ID" })
                        return false;
                    });
                    return recordIdVal;
                } else {
                    return false;
                }

            },
            /* MTW-252 The function for update marketplace record */
            updateMarketPlaceRec: function (convertedfile, marketPlaceDuplicate, recordtype) {
                var updateRecord = record.load({
                    type: recordtype,
                    id: marketPlaceDuplicate,
                    isDynamic: true
                });

                updateRecord.setText({
                    fieldId: "custrecord_jj_date_ordered",
                    text: convertedfile[0]//new Date(main.dateValidation(convertedfile[0]))
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_order",
                    value: convertedfile[1]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_product_id",
                    value: convertedfile[2]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_marketplace_product_name",
                    value: convertedfile[3]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_marketplace_dealer_cost",
                    value: convertedfile[7]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_current_parent_commission",
                    value: convertedfile[8]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_sum_of_sub_parent_commissi",
                    value: convertedfile[9]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_marketplace_sim_esn",
                    value: convertedfile[12]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_part_number",
                    value: convertedfile[13]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_merchant_account_id",
                    value: convertedfile[14]
                });

                var customerDetails = main.findCustomerdetails(convertedfile[14], "custentity1");

                log.debug("customerDetails", customerDetails)

                updateRecord.setValue({
                    fieldId: "custrecord_jj_merchant_name",
                    value: customerDetails.customerId
                });

                updateRecord.setText({
                    fieldId: "custrecord_jj_marketplace_date_shipped",
                    text: convertedfile[29]//new Date(main.dateValidation(convertedfile[22]))
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_marketplace_tracking_numbe",
                    value: convertedfile[30]
                });

                updateRecord.setValue({
                    fieldId: "custrecord_jj_marketplace_active_status",
                    value: convertedfile[16]
                });
                var recid = updateRecord.save({
                    enableSourcing: true
                });
                log.debug("Record updated ", id);
            },
            /* MTW-252 The function for validating date field for date field setvalue maketplace integration */
            dateValidation: function (datevalue) {
                var dd = new Date(datevalue).getDate()
                var mm = new Date(datevalue).getMonth()
                var yy = new Date(datevalue).getFullYear()
                var datestrVal = dd + '/' + mm + '/' + yy;
                log.debug("datestrVal: ",datestrVal)
                return datestrVal;
            },
            /* create a search in customer record to find the corresponding  customer according to the tcetra id*/
            /*Route Run  and Branded Handset*/
            findCustomerdetails: function (tectraId, searchField) {
                var customerSearchObj = search.create({
                    type: "customer",
                    filters: [
                        [searchField, "contains", tectraId], "AND", ["subsidiary", "anyof", "2"]
                    ],
                    columns: [searchField, "internalid"]
                });
                var searchResultCount = customerSearchObj.runPaged().count;
                log.debug("searchResultCount",searchResultCount)
                if (searchResultCount <= 0) {

                    customerSearchObj = search.create({
                        type: "customer",
                        filters: [
                            [searchField, "contains", tectraId]
                        ],
                        columns: [searchField, "internalid"]
                    });
                    searchResultCount = customerSearchObj.runPaged().count;
                    //                        log.debug("searchResultCount insidfa", searchResultCount);

                }
                // var searchResultCount = customerSearchObj.runPaged().count;
                var returnObj = { };
                customerSearchObj.run().each(function (result) {
                    // get the customer id
                    returnObj.customerId = result.getValue('internalid');
                    // To get the sales rep partner id from the customer record
                    var lookupfieldofpartner = search.lookupFields({
                        type: 'customer',
                        id: returnObj.customerId,
                        columns: ['partner']
                    });
                    if (lookupfieldofpartner.partner[0]) {
                        returnObj.salesreppartner = lookupfieldofpartner.partner[0].value;
                    }
                    // to get parent id from partner record
                    var lookupfieldofsub = search.lookupFields({
                        type: 'partner',
                        id: returnObj.salesreppartner,
                        columns: ['parent']
                    });
                    if (lookupfieldofsub.parent[0]) {
                        returnObj.subof = lookupfieldofsub.parent[0].value;
                    }
                });
                return returnObj;
            },
            checksim: function (simno, esnno, processfolderid, convertedfile) {
                var branded_handset_search_sim = search.create({
                    type: "customrecord_jj_branded_handset",
                    filters: [
                        ["custrecord_jj_sim", "is", simno]
                    ],
                    columns: [
                        search.createColumn({
                            name: "id",
                            sort: search.Sort.ASC,
                            label: "ID"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_customer",
                            label: "Customer"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_sim",
                            label: "SIM"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_esn",
                            label: "ESN"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_branded_tcetraid",
                            label: "Tcetra Id"
                        })
                    ]
                });
                var searchResultCountSim = branded_handset_search_sim.runPaged().count;
                //                                    log.debug("Brandend Handset Sim Search Count", searchResultCountSim);
                if (searchResultCountSim > 0) {
                    convertedfile.push("Duplicate Sim Number");
                    var folderid;
                    var init = main.checkforfolder(processfolderid);
                    if (init == true) {
                        folderid = main.createfolder(processfolderid);
                    } else {
                        folderid = init;

                    }
                    main.errorlog(processfolderid, convertedfile);
                    //                        log.debug("duplicate SIM ", simno)
                    return true;
                } else {
                    var branded_handset_search_esn = search.create({
                        type: "customrecord_jj_branded_handset",
                        filters: [
                            ["custrecord_jj_esn", "is", esnno]
                        ],
                        columns: [
                            // search.createColumn({
                            // name: "id",
                            // sort: search.Sort.ASC,
                            // label: "ID"
                            // }),
                            search.createColumn({
                                name: "custrecord_jj_customer",
                                label: "Customer"
                            }),
                            search.createColumn({
                                name: "custrecord_jj_sim",
                                label: "SIM"
                            }),
                            search.createColumn({
                                name: "custrecord_jj_esn",
                                label: "ESN"
                            }),
                            search.createColumn({
                                name: "custrecord_jj_branded_tcetraid",
                                label: "Tcetra Id"
                            })
                        ]
                    });
                    var searchResultCountESN = branded_handset_search_esn.runPaged().count;

                    //                        log.debug("Brandend Handset ESN Search Count", searchResultCountESN);
                    //  customrecord_jj_branded_handsetSearchObj.run().each(function(result){
                    //     // .run().each has a limit of 4,000 results
                    //     return true;
                    //  });
                    if (searchResultCountESN > 0) {
                        convertedfile.push("Duplicate ESN Number");
                        var folderid;
                        var init = main.checkforfolder(processfolderid);
                        if (init == true) {
                            folderid = main.createfolder(processfolderid);
                        } else {
                            folderid = init;

                        }
                        main.errorlog(processfolderid, convertedfile);
                        //                            log.debug("duplicate ESN ", esnno)

                        return true;
                    }
                }
                return false
            },
            searchForCustomer: function (custID) {
                var obj = { };
                var customerSearchObj = search.create({
                    type: "customer",
                    filters: [
                        ["internalidnumber", "equalto", custID]
                    ],
                    columns: [{
                        name: "custentity_jj_parentname"
                    }, {
                        name: "custentity_jj_parentaccountid"
                    }, {
                        name: "custentity1"
                    }, {
                        name: "custentityincomeexclusiveid"
                    }]
                });
                var searchResultCount = customerSearchObj.runPaged().count;
                if (searchResultCount > 0) {

                    var searchResult1 = customerSearchObj.run().getRange({
                        start: 0,
                        end: 1
                    });
                    //      log.debug("searchResult1",searchResult1);


                    obj.parentName = searchResult1[0].getValue({
                        name: 'custentity_jj_parentname'
                    });
                    //      log.debug("parentName",obj.parentName);

                    obj.parentID = searchResult1[0].getValue({
                        name: 'custentity_jj_parentaccountid'
                    });
                    obj.incommId = searchResult1[0].getValue({
                        name: 'custentityincomeexclusiveid'
                    });
                    obj.tectraId = searchResult1[0].getValue({
                        name: 'custentity1'
                    });
                    //  log.debug("parentID",obj.parentID);

                }
                //  log.debug("obj",obj);

                return obj;

            },
            /*Delete JSON chunks Folder after the Import Process */
            folderdelete: function (mapinternal) {
                var processfolderid = runtime.getCurrentScript().getParameter("custscript_json_fileid");
                var processarray = main.findprocessfiles(processfolderid, true);
                for (i = 0; i < processarray.length; i++) {
                    file.delete({
                        id: processarray[i].internalid
                    });
                }
                file.delete({
                    id: mapinternal
                });
                var folderdelete = record.delete({
                    type: "folder",
                    id: processfolderid
                });
            },
            /*To create an folder that contain all the errors */
            errorlog: function (processfolderid, convertedfile, folderid) {
                var filename = Date.now();
                // var folderid;
                //                var init = main.checkforfolder(processfolderid);
                //                if (init == true) {
                //                    folderid = main.createfolder(processfolderid);
                //                } else {
                //                    folderid = init;
                //
                //                }
                var processfileid = main.createfile(filename, folderid, convertedfile);
            },
            /*Check whether the input string is Date or number or String */
            /*if date format is mm/dd/yyy*/
            doValidations: function (string, recordtype) {
                /*check whether inputed data is date*/
                //log.debug("string date in dovalidation", string);
                var inputString = main.isDate(string);
                //log.debug("inputString", inputString)
                if (inputString == false) {
                    if (isNaN(string)) {
                        return string;
                    } else {
                        if (string == null || string == "") {
                            return "";
                        } else {
                            return Number(string);
                        }
                    }
                }
                else {
                    if (recordtype == "customrecord_mw_tracfone_residual_month") {
                        if (string.indexOf("-") > 0) {
                            var dateArray = string.split("-");
                            var datestr = dateArray[1] + '/' + dateArray[0] + '/' + dateArray[2];
                            //                                log.debug("date last of do validation", datestr);
                            return datestr;

                        } else {
                            return string

                        }

                    }
                    else if (recordtype == "customrecord_jj_tracfone_activations") {
                        if (string.indexOf("-") > 0) {
                            var dateArray = string.split("-");
                            var datestr = dateArray[1] + '/' + dateArray[0] + '/' + dateArray[2];
                            //                                log.debug("date last of do validation", datestr);
                            return datestr;

                        } else {
                            return string
                        }
                    }
                    var string = string.replace(/-/g, "/");
                    if (new Date(string.toString()) == "Invalid Date") {
                        return string;
                    } else {
                        var today = new Date(string);
                        //                            log.debug("today", today)
                        var dd = today.getDate();
                        var mm = today.getMonth() + 1;
                        var yyyy = today.getFullYear();
                        if (yyyy < 2000)
                            yyyy = yyyy + 100;
                        // if (mm < 10) {
                        //     mm = mm;
                        // }
                        var datestr = mm + '/' + dd + '/' + yyyy;
                        //                            log.debug("date last of do validation", datestr)
                        return datestr;
                    }
                }
            },
            /*To find whether the input string is date or not */
            isDate: function (value) {
                var dateFormat;
                if (toString.call(value) === '[object Date]') {
                    return true;
                }
                if (typeof value.replace === 'function') {
                    value.replace(/^\s+|\s+$/gm, '');
                }
                dateFormat = /(^\d{1,4}[\.|\\/|-]\d{1,2}[\.|\\/|-]\d{1,4})?$/;
                return dateFormat.test(value);
            },
            /*Summary function Of map reduce */
            summarize: function (summary) {
                var errorfolderid = runtime.getCurrentScript().getParameter("custscript_json_fileid");
                var errorfolder = main.finderrorfiles(errorfolderid);
                var processfolderid = runtime.getCurrentScript().getParameter("custscript_json_fileid");
                var mapinternal = main.findprocessfiles(processfolderid, false);
                var contextfile = file.load({
                    id: mapinternal
                });
                var contextContent = contextfile.getContents();
                var contextContent = JSON.parse(contextContent);

                var contextobj = JSON.parse(contextContent);
                var operation = contextobj.contextdetails.operation;
                var emailaddr = contextobj.emailaddress;
                var recordtype = contextobj.contextdetails.recordtype;
                var recordname = contextobj.contextdetails.recordname;

                if (operation == "create") {
                    if (errorfolder == null || errorfolder == "" || errorfolder == undefined) {
                        var mailBody = main.createResponse(recordtype, recordname, "success");
                        email.send({
                            author: -5,
                            recipients: emailaddr,
                            //cc: ["feena@jobinandjismi.com"],
                            subject: "IMPORT Completed For  " + recordname,
                            body: mailBody
                        });
                    } else {
                        main.errortocsv(contextobj, errorfolder);
                    }
                } else if (operation == "delete") {
                    var mailBody = main.createResponse(recordtype, recordname, "delete");
                    email.send({
                        author: -5,
                        recipients: emailaddr,
                        //cc: ["feena@jobinandjismi.com"],
                        subject: "Succesfully Deleted the  " + recordname,
                        body: mailBody
                    });
                } else if (operation == "deleteduplicate") {
                    var mailBody = main.createResponse(recordtype, recordname, "deleteduplicate");
                    email.send({
                        author: -5,
                        recipients: emailaddr,
                        //cc: ["feena@jobinandjismi.com"],
                        subject: "Succesfully Deleted the Duplicate " + recordname,
                        body: mailBody
                    });
                } else {
                    if (errorfolder == null || errorfolder == "" || errorfolder == undefined) {
                        var mailBody = main.createResponse(recordtype, recordname, "success");
                        email.send({
                            author: -5,
                            recipients: emailaddr,
                            //cc: ["feena@jobinandjismi.com"],
                            subject: "IMPORT Completed For  " + recordname,
                            body: mailBody
                        });
                    } else {
                        main.errortocsv(contextobj, errorfolder);
                    }
                }
                main.folderdelete(mapinternal);
                var pendingId = main.findPending();
                //                    log.debug("pendingId", pendingId)
                if (pendingId != false) {
                    var pendingFile = file.load({
                        id: pendingId
                    });
                    var pendingContent = pendingFile.getContents();
                    var pendingContent = JSON.parse(pendingContent);
                    //                        log.debug("pendingContent", pendingContent);
                    //                        log.debug("pendingContent", pendingContent.custscript_json_fileid);
                    main.scheduleanother(pendingContent.custscript_json_fileid, "", "", pendingContent);
                    file.delete({
                        id: pendingId
                    });
                }
            },
            /*Setup map reduce script*/
            scheduleanother: function (fileid, mapid, mapfile, catchFile) {
                try {
                    var scheduleScrptTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: "customscript_mr_mapreducerecord",
                        deploymentId: 'customdeploy_mr_mapreducerecord',
                        params: {
                            custscript_json_fileid: fileid,
                            custscript_type: mapfile
                        }
                    });
                    scheduleScrptTask.submit();
                    /*            var mapFileid = JSON.parse(mapid)
                    var emailaddr = mapFileid.emailaddress;
                    var recordtype = mapFileid.contextdetails.recordtype;
                    var recordname = mapFileid.contextdetails.recordname;
                    var mailBody = main.createResponse(recordtype, recordname);
                    email.send({
                    author: -5,
                    recipients: emailaddr,
                    subject: "Import Process Succesfully Started for " + recordname,
                    body: mailBody
                    });*/
                } catch (e) {
                    log.debug("e in scheduleanother", e);
                    var params = {
                        custscript_json_fileid: fileid,
                        custscript_type: mapfile
                    }
                    main.createfile(Date.now(), 26540, params);

                }
            },
            findPending: function () {
                var fileSearchObj = search.create({
                    type: "file",
                    filters: [
                        ["folder", "anyof", 26540]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
                });
                var searchResultCount = fileSearchObj.runPaged().count;
                if (searchResultCount < 1) {
                    return false
                } else {
                    var internalid;
                    fileSearchObj.run().each(function (result) {
                        internalid = result.getValue("internalid");
                        return true;
                    });
                    return internalid;
                }
            },

            createResponse: function (recordtype, recordname, flag) {
                var htmlFile = file.load({
                    id: 39539
                });
                var htmlFilecontent = htmlFile.getContents();
                if (flag == "success") {
                    var htmlFilecontent1 = htmlFilecontent.replace("<-replacewithtype->", "Import Completed Successfully");
                    var htmlFilecontent2 = htmlFilecontent1.replace("<-ReplaceWithRecord->", "For Record :  " + recordname);
                } else if (flag == "unsuccess") {
                    var htmlFilecontent1 = htmlFilecontent.replace("<-replacewithtype->", "Import Completed With Some issues ");
                    var htmlFilecontent2 = htmlFilecontent1.replace("<-ReplaceWithRecord->", "For Record   " + recordname);
                } else if (flag == "delete") {
                    var htmlFilecontent1 = htmlFilecontent.replace("<-replacewithtype->", "Succesfully Deleted The Record  ");
                    var htmlFilecontent2 = htmlFilecontent1.replace("<-ReplaceWithRecord->", "For Record   " + recordname);
                } else if (flag == "deleteduplicate") {
                    var htmlFilecontent1 = htmlFilecontent.replace("<-replacewithtype->", "Succesfully Deleted The Duplicate Record  ");
                    var htmlFilecontent2 = htmlFilecontent1.replace("<-ReplaceWithRecord->", "For Record   " + recordname);
                }
                return htmlFilecontent2;
            },
            errortocsv: function (contextobj, errorfolder) {
                try {
                    // to get the data
                    //To create the CSV file
                    var XML_TO_PRINT = main.getXMLDataExcel(file, contextobj, errorfolder);
                    var strXmlEncoded = encode.convert({
                        string: XML_TO_PRINT,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64
                    });
                    var fileObj = file.create({
                        name: 'report.xls',
                        fileType: file.Type.EXCEL,
                        contents: strXmlEncoded
                    });

                    var id = fileObj.save();
                    log.debug('id Of newly created CSV', id);
                    var emailaddr = contextobj.emailaddress;
                    var recordtype = contextobj.contextdetails.recordtype;
                    var recordname = contextobj.contextdetails.recordname;
                    var mailBody = main.createResponse(recordtype, recordname, "unsuccess");
                    email.send({
                        author: -5,
                        recipients: emailaddr,
                        //cc: ["feena@jobinandjismi.com"],
                        subject: "CSV IMPORT Completed For  Record",
                        attachments: [fileObj],
                        body: mailBody
                    });
                } catch (e) {
                    log.debug("Err @ errortocsv", e.message);
                }
            },
            getXMLDataExcel: function (file, contextobj, errorfolder) {
                var XML = "";
                var TABLE = "";
                var HEADING = "";
                var x = 0,
                    errArray = [],
                    headingArray = [],
                    i, contents, j;
                var myXMLFile = file.load({
                    id: '39548'
                });
                var myXMLFile_value = myXMLFile.getContents();

                headingArray = contextobj.csvColumns;

                errArray = errorfolder;

                headingArray.push("Error Message");
                errArray.unshift(headingArray.toString());
                // to get the total no.of err entries
                var errLength = errArray.length;
                var headingLength = headingArray.length;
                var strVar = "";
                var headVar = "";
                log.debug('errArray', errArray)
                log.debug('errLength', errLength)
                for (i = 0; i < errLength; i++) {
                    var temparray = errArray[i].split(',');
                    strVar += "<Row ss:AutoFitHeight=\"0\">";
                    for (j = 0; j < temparray.length; j++) {
                        strVar += "<Cell><Data ss:Type=\"String\">" + temparray[j] + "<\/Data><\/Cell>";
                    }
                    strVar += "<\/Row>";
                }
                TABLE = TABLE + strVar;
                // HEADING = HEADING +headVar;
                XML = myXMLFile_value.replace('<!-- REPLACEWITHTABLEBODY -->', TABLE);
                return XML;
            }
        };


        for (var key in main) {
            if (typeof main[key] === 'function') {
                main[key] = trycatch(main[key], key);
            }
        }

        function trycatch(myfunction, key) {
            return function () {
                try {
                    return myfunction.apply(this, arguments);
                } catch (e) {
                    log.debug("e in  " + key, e);
                }
            }
        };
        return main;
    });