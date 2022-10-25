/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
/**

 * Script Description

 * This suitelet is to load HTML and recive post request
 * HTML consists A HTML INPUTS

 */

/*******************************************************************************
 *
 * Support Files
 *
 * *****************************************************************************
 *
 *
 *
 * $Author: Jobin & Jismi IT Services LLP $
 *
 * DESCRIPTION
 * CSV Import System
 *
 *
 *
 *
 ******************************************************************************/
define(['N/file', 'N/url', 'N/search', 'N/runtime', 'N/record', 'N/https', 'N/task', 'N/email'],
    function csvsystem(file, url, search, runtime, record, https, task, email) {
        var main = {
            dopost: function (datas, type, mapfile, foldername) {
                if (type == "getfield") {
                    log.debug("datas getfield", datas);
                    var csvColumns = datas.split(",");
                    log.debug("csvColumns: ",csvColumns)
                    var fileObj = file.load({
                        id: mapfile
                    });
                    log.debug("fileObj: ",fileObj)
                    if (fileObj.size < 10485760) {
                        log.debug("Inside IF")
                        var mapping = fileObj.getContents();
                        log.debug("MAP: ",mapping)
                    }
                    var fieldmapobj = JSON.parse(mapping);
                    log.debug("PARSED: ",fieldmapobj)
                    fieldmapobj = fieldmapobj.fieldmap;
                    log.debug("fieldmapobj: ",fieldmapobj)
                    var returnobj = {}
                    var tempobj = {}
                    var mapobj = {}
                    for (var i = 0; i < csvColumns.length; i++) {
                        var currentValue = main.checkifnull(fieldmapobj[csvColumns[i]]);
                        log.debug("currentValue: ",currentValue)
                        if (currentValue == "-") {
                            log.debug("IF")
                            tempobj[csvColumns[i]] = "-";
                        } else {
                            log.debug("ELSE")
                            tempobj[csvColumns[i]] = main.checkifnull(currentValue.name);
                            mapobj[main.checkifnull(fieldmapobj[csvColumns[i]].id)] = i;

                        }
                    log.debug("tempobj[csvColumns[i]]: ",tempobj[csvColumns[i]])
                    }
                    return {
                        tempobj: tempobj,
                        mapobj: mapobj,
                        csvColumns: csvColumns
                    }
                } else {
                    var datas = JSON.parse(datas);
                    log.debug("datas", datas.length);
                    var filename = Date.now();
                    var folderid;
                    var init = main.checkforfolder(foldername);
                    if (init == true) {
                        folderid = main.createfolder(foldername, mapfile);
                    } else {
                        folderid = init;
                    }

                    /*To remove Empty Lines  */
                    var tempArray = [];
                    for (var i = 0; i < datas.length; i++) {
                        for (var k = 0; k < datas[i].length; k++) {
                            if (datas[i][k] == null || datas[i][k] == "") {} else {
                                tempArray.push(datas[i]);
                                break;
                            }
                        }
                    }

                    var processfileid = main.createfile(tempArray, filename, folderid);
                    log.debug("mapid", mapfile);
                    log.debug("type", type)

                    if (type == "endgame") {
                        log.debug("new", type)
                        main.sleep(40000);
                        log.debug('folderid',folderid)
                        log.debug('mapfile',mapfile)
                        main.scheduleanother(folderid, mapfile, "mapfileid");
                    }
                    return false;
                }
            },

            createfolder: function (argument, mapfile) {
                try{
                    var folderRec = record.create({
                        type: record.Type.FOLDER,
                        isDynamic: true
                    });
                    folderRec.setValue({
                        fieldId: 'parent',
                        value: 10188
                    });
                    folderRec.setValue({
                        fieldId: 'name',
                        value: argument
                    });
                    var folderId = folderRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    var mapfileid = main.createfile(mapfile, "scriptcontext", folderId);
    
                    return folderId;
                }catch(e){
                    log.debug("error@createfolder")
                }
            },
            sleep: function (milliseconds) {
                var date = Date.now();
                var currentDate = null;
                do {
                    currentDate = Date.now();
                } while (currentDate - date < milliseconds);
            },
            checkforfolder: function (name) {
                try{
                    var folderSearchObj = search.create({
                        type: "folder",
                        filters: [
                            ["name", "is", name]
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "foldersize",
                                label: "Size (KB)"
                            }),
                            search.createColumn({
                                name: "lastmodifieddate",
                                label: "Last Modified"
                            }),
                            search.createColumn({
                                name: "internalid",
                                label: "internalid"
                            }),
                            search.createColumn({
                                name: "numfiles",
                                label: "# of Files"
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
                }catch(e){
                    log.debug("error@checkforfolder",e)
                }

            },
            checkifnull: function (data) {
                if (data == "" || data == null || data == undefined) {
                    return "-";
                }
                return data;
            },
            /*Setup map reduce script*/
            scheduleanother: function (fileid, mapid, mapfile) {
                try {
                    log.debug('fileid', fileid)
                    log.debug('mapid', mapid)
                    log.debug('mapfile', mapfile)
                    var scheduleScrptTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: "customscript_mr_mapreducerecord",
                        deploymentId: 'customdeploy_mr_mapreducerecord',
                        params: {
                            custscript_json_fileid: fileid,
                            custscript_type: mapfile
                        }
                    });
                    log.debug("TASK: ",scheduleScrptTask)
                    scheduleScrptTask.submit();
                    var mapFileid = JSON.parse(mapid)
                    var emailaddr = mapFileid.emailaddress;
                    var operation = mapFileid.contextdetails.operation;
                    var recordtype = mapFileid.contextdetails.recordtype;
                    var recordname = mapFileid.contextdetails.recordname;
                    var mailBody = main.createResponse(recordtype, recordname);
                    if (operation == "create") {
                        email.send({
                            author: -5,
                            recipients: emailaddr,
                            //cc: ["feena@jobinandjismi.com"],
                            subject: "Import Process Succesfully Started for " + recordname,
                            body: mailBody
                        });
                    } else if (operation == "delete") {
                        email.send({
                            author: -5,
                            recipients: emailaddr,
                            //cc: ["feena@jobinandjismi.com"],
                            subject: "Delete Process Succesfully Started for " + recordname,
                            body: mailBody
                        });
                    } else if (operation == "deleteduplicate") {
                        email.send({
                            author: -5,
                            recipients: emailaddr,
                            //cc: ["feena@jobinandjismi.com"],
                            subject: "Delete Duplicate Process Succesfully Started for " + recordname,
                            body: mailBody
                        });
                    } else {
                        email.send({
                            author: -5,
                            recipients: emailaddr,
                            //cc: ["feena@jobinandjismi.com"],
                            subject: "Import Process Succesfully Started for " + recordname,
                            body: mailBody
                        });
                    }
                } catch (e) {
                    log.debug("e in scheduleanother", e);
                    var params = {
                        custscript_json_fileid: fileid,
                        custscript_type: mapfile
                    }
                    main.createfile(params, Date.now(), 26540);

                }
            },
            /*For Saving the JSON File In File Cabinet */
            createfile: function (netsuitedata, name, folderid) {
                var folderinternal;
                if (folderid > 0) {
                    folderinternal = folderid;
                } else {
                    folderinternal = 10188
                }
                if (netsuitedata == null || netsuitedata == "" || netsuitedata == undefined)
                    netsuitedata = {
                        "rambo": "always"
                    };
                var fileObj = file.create({
                    name: name + '.txt',
                    fileType: file.Type.JSON,
                    contents: JSON.stringify(netsuitedata),
                    encoding: file.Encoding.UTF8,
                    folder: folderinternal,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            },
            onRequest: function (context) {
                log.debug("Script Execution started: ",context.request.method)
                if (context.request.method === 'POST') {
                    var datas = context.request.parameters.datas;
                    log.debug("post data",datas)
                    var type = context.request.parameters.type;
                    log.debug("pots type",type)
                    var mapfile = context.request.parameters.mapfile;
                    var foldername = context.request.parameters.foldername;

                    var data = main.dopost(datas, type, mapfile, foldername);
                    context.response.write(JSON.stringify(data));
                } else {
                    var invoice = context.request.parameters.invoice;
                    var fileid = main.getfileid();
                    var newhtml = main.gethtml(fileid, invoice);
                    context.response.write({
                        output: newhtml
                    });
                }
            },
            getfileid: function () {
                var bundleurl = "MR- 107 SL CSV Import System/";
                try {
                    bundleurl = "MR- 107 SL CSV Import System/";
                    var fileObj = file.load({
                        id: bundleurl + 'CSV Import HTML.html' // '13147'
                    });
                } catch (e) {
                    bundleurl = "SuiteBundles/Bundle 189004/ESW-47 Paypal Integertion/";
                }
                return 20765;
            },
            gethtml: function (fileid, invoice) {
                var scripturl = url.resolveScript({
                    scriptId: 'customscript_mr_107_sl_csv_import_system',
                    deploymentId: 'customdeploy_mr_107_sl_csv_import_system',
                    returnExternalUrl: true
                });
                var fileObj = file.load({
                    id: fileid
                });
                if (fileObj.size < 10485760) {
                    var html = fileObj.getContents();
                }
                log.debug("scripturl: ",scripturl)
                var newhtml = html.replace("<scripturl>", scripturl);
                var today = new Date();
                var dd = today.getDate();
                var mm = today.getMonth() + 1;
                var yyyy = today.getFullYear();
                if (yyyy < 2000)
                    yyyy = yyyy + 100;
                if (dd < 10) {
                    dd = '0' + dd;
                }
                if (mm < 10) {
                    mm = '0' + mm;
                }
                var datestr = dd + '/' + mm + '/' + yyyy;
                var newhtml1 = newhtml.replace("<invoicecreateddate>", datestr);
                return newhtml1;
            },
            createResponse: function (recordtype, recordname) {
                var htmlFile = file.load({
                    id: 39539
                });
                var htmlFilecontent = htmlFile.getContents();
                var htmlFilecontent1 = htmlFilecontent.replace("<-replacewithtype->", "Import Process Successfully Started");
                var htmlFilecontent2 = htmlFilecontent1.replace("<-ReplaceWithRecord->", "For Record :  " + recordname);
                return htmlFilecontent2;
            }
        }
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