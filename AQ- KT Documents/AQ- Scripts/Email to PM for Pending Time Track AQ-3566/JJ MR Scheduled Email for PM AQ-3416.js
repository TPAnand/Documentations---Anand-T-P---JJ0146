/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/email', 'N/error', 'N/record', 'N/runtime', 'N/search', 'N/task'],
    /**
     * @param{email} email
     * @param{error} error
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{task} task
     */
    (email, error, record, runtime, search, task) => {

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
                console.log("Error @ empty check Function: ",e.name+' : '+e.message)
            }
        }

        /**
         * Function to create the search of Pending Time Records
         * @returns [{res}] res - searchResult of AO Obj
         */
        function timeSearch(project_Search_Result) {
            try{
                var filterArr = [];
                if(project_Search_Result.length>0){
                    for(var i=0;i<project_Search_Result.length;i++){
                        filterArr.push(project_Search_Result[i].prjId)
                    }
                }
                log.debug("filterArr: ",filterArr)
                var res = []
                if(filterArr.length>0) {
                    var timebillSearchObj = search.create({
                        type: "timebill",
                        filters:
                            [
                                ["approvalstatus", "anyof", "2"],
                                "AND",
                                ["internalid", "anyof", filterArr]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({
                                    name: "date",
                                    sort: search.Sort.ASC,
                                    label: "Date"
                                }),
                                search.createColumn({name: "employee", label: "Employee"})
                            ]
                    });
                    var searchResultCount = timebillSearchObj.runPaged().count;
                    log.debug("timebillSearchObj result count", searchResultCount);
                    if (searchResultCount > 0) {
                        timebillSearchObj.run().each(function (result) {
                            // .run().each has a limit of 4,000 results
                            var timeId = result.getValue({name: "internalid"})
                            var timeDate = result.getValue({name: "date", sort: search.Sort.ASC})
                            var employee = result.getValue({name: "employee"})
                            var employeeTxt = result.getText({name: "employee"})
                            res.push({
                                timeId: timeId,
                                timeDate: timeDate,
                                employee: employee,
                                employeeTxt: employeeTxt
                            })
                            return true;
                        });
                    }
                }
                return res
            }
            catch (e) {
                log.error({
                    title: "Error @ Timesheet Search: ",
                    details: e.name+" : "+e.message
                })
            }
        }

        /**
         * Function to list the projects where the logged user is either a body level or line level project manager.
         *
         * @param {user} user - loggedUser'd ID
         * @returns [{res}] Array of Objects of Project IDs
         *
         */
        function projectSearch(user) {
            try {
                log.debug("user: ",user)
                if(checkForParameter(user)==true) {
                    var jobSearchObj = search.create({
                        type: "job",
                        filters:
                            [
                                ["isinactive", "is", "F"],
                                "AND",
                                ["time.approvalstatus", "anyof", "2"],
                                "AND",
                                [[["jobresource", "anyof", user], "AND", ["jobresourcerole", "anyof", "-2"]], "OR", ["projectmanager", "anyof", user]]
                            ],
                        columns:
                            [
                                search.createColumn({name: "internalid", join: "time", label: "TIME: Internal ID"})
                            ]
                    });
                    var searchResultCount = jobSearchObj.runPaged().count;
                    var res = []
                    if(searchResultCount>0) {
                        jobSearchObj.run().each(function (result) {
                            // .run().each has a limit of 4,000 results
                            var prjId = result.getValue({name: "internalid", join: "time"})
                            res.push({
                                prjId: prjId
                            })
                            return true;
                        });
                    }
                    return res
                }
                else {
                    log.debug("Timsheet Search with empty result")
                }
            }
            catch (e) {
                log.error({
                    title: 'Error @ timesheet SEARCH: ',
                    details: e.name + ' : ' + e.message
                });
            }
        }

        /**
         * Function to create the search of Employees who is a Project resource.
         * @returns [{res}] res - searchArray of object
         */
        function prjManagerSearch(){
            try{
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters:
                        [
                            ["isinactive","is","F"],
                            "AND",
                            ["isjobresource","is","T"],
                            "AND",
                            [["releasedate","isempty",""],"OR",["releasedate","notonorbefore","today"]]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "email", label: "Email"})
                        ]
                });
                var searchResultCount = employeeSearchObj.runPaged().count;
                var res = []
                employeeSearchObj.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var emp = result.getValue({name: "internalid"})
                    var empTxt = result.getValue({name: "entityid"})
                    var empMail = result.getValue({name: "email"})
                    res.push({
                        Employee: emp,
                        EmployeeTxt: empTxt,
                        EmployeeMail: empMail
                    })
                    return true;
                });
                return res;
            }
            catch (e) {
                log.error({
                    title: 'Error @ Prj Manager Search: ',
                    details: e.name + ' : ' + e.message
                });
            }
        }

        /**
         * Function to create Mail Body template for adding as Mail Body in Sending Timesheet details to each project managers.
         * @param {tableContents} tableContents - Timesheet details to be included in Mail body
         * @param {length} length - total number of pending timesheets of a project manager
         * @param {user} user - Name of the Project Manager
         * @returns {emailBody} - Email Body Template as String
         */
        function mailTemplate(tableContents,length ,user){
            try{
                const emailBody = [];
                emailBody.push(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                            <html xmlns="http://www.w3.org/1999/xhtml">`);
                emailBody.push(`<head>
                                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                                    <title></title>
                                </head>`);
                emailBody.push(`<body>`);
                emailBody.push(`Dear ${user},<br><p>You have ${length} Pending Timetrack to Approve. Kindly approve the pending Time Track records listed below.<p><br/>`);
                emailBody.push(
                    `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">`
                );
                emailBody.push(`<tr>`);
                emailBody.push(`<td align="center" valign="top">`);
                emailBody.push(`<table border="0" cellpadding="20" cellspacing="0" width="600" id="customers" style="font-family: Arial, Helvetica, sans-serif;border-collapse: collapse;width: 50%;">`);
                emailBody.push(`<tr>    </tr>`);

                emailBody.push(`<tr>`);
                emailBody.push(`<th style="border: 1px solid #ddd;padding: 8px;padding-top: 12px;padding-bottom: 12px;text-align: left;"> DATE</th>`);
                emailBody.push(`<th style="border: 1px solid #ddd;padding: 8px;padding-top: 12px;padding-bottom: 12px;text-align: left;"> Time Track ID</th>`);
                emailBody.push(`<th style="border: 1px solid #ddd;padding: 8px;padding-top: 12px;padding-bottom: 12px;text-align: left;"> Employee</th>`);
                emailBody.push(`<tr/>`);

                emailBody.push(
                    tableContents.map((el) => {
                        let temp = [];
                        temp.push(`<tr>`)
                        temp.push(` <td style="border: 1px solid #ddd;padding: 8px;">${el.startDate}</td>`);
                        temp.push(` <td style="border: 1px solid #ddd;padding: 8px;"><a href=" ${'https://3689903.app.netsuite.com/app/accounting/transactions/timebill.nl?id='+el.timeId}" />${el.timeId}</td>`);
                        temp.push(` <td style="border: 1px solid #ddd;padding: 8px;">${el.employeeTxt}</td>`);
                        temp.push(`</tr>`);
                        return temp.join("");
                    }).join("")
                );
                emailBody.push(`</table>`);
                emailBody.push(`</td>`);
                emailBody.push(`</tr>`);
                emailBody.push(`</table>`);
                emailBody.push(`<b>Thank You</b>`);
                emailBody.push(`</body>`);
                emailBody.push(`</html>`);

                return emailBody.join("");
            }
            catch (e) {
                log.error({
                    title: 'Error @ Template: ',
                    details: e.name + ' : ' + e.message
                });
            }
        }

        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            try{
                var projManagerList = prjManagerSearch()
                log.debug("prjManagerSearch: ",projManagerList)
                log.debug("prjManagerSearch LENGTH: ",projManagerList.length)
                return projManagerList
            }
            catch (e) {
                log.error({
                    title: "ERROR @ REDUCE",
                    details: e.name+" : "+e.message
                })
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
            try{
                var json_Result = JSON.parse(reduceContext.values)// Each Project Manger's Value
                log.debug("json_Result: ",json_Result)

                var project_Search_Result = projectSearch(json_Result.Employee)// List of Projects which has logged user as project Manager
                log.debug("project_Search_Result: ",project_Search_Result)

                var time_Id_Array = []
                var final_Array = []
                if(project_Search_Result.length>0){
                    var time_Search_Result = timeSearch(project_Search_Result)
                    if(time_Search_Result.length>0){
                        for(var j=0;j<time_Search_Result.length>0;j++){
                            if(!time_Id_Array.includes(time_Search_Result[j].timeId)) {
                                time_Id_Array.push(time_Search_Result[j].timeId)
                                final_Array.push({
                                    timeId: time_Search_Result[j].timeId,
                                    employee: time_Search_Result[j].employee,
                                    employeeTxt: time_Search_Result[j].employeeTxt,
                                    startDate: time_Search_Result[j].timeDate
                                })
                            }
                        }
                    }
                }

                log.debug("final_Array: ",final_Array)
                log.debug("final_Array_Lenght: ",final_Array.length)
                if(final_Array.length>0) {
                    var emailBody = mailTemplate(final_Array, final_Array.length, json_Result.EmployeeTxt)
                    log.debug("emailBody: ", emailBody)
                    email.send({
                        author: 22938,
                        recipients: json_Result.Employee,
                        subject: "PENDING TIMETRACK DETAILS",
                        body: emailBody
                    })
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ Reduce: ",
                    details: e.name+" : "+e.message
                })
            }
        }

        return {getInputData, reduce}

    });