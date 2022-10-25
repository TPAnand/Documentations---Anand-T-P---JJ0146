/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/url', 'N/runtime', 'N/format', 'moment.js'],
    /**
     * @param{currentRecord} currentRecord
     * @param{record} record
     * @param{url} url
     */
    function(currentRecord, record, url, runtime, format, moment) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        var initialDateFormat

        function pageInit(scriptContext) {
            var userObj = runtime.getCurrentUser();
            initialDateFormat = userObj.getPreference({
                name: 'DATEFORMAT'
            });

            var salesRep = scriptContext.currentRecord.getValue({
                fieldId: 'custpage_sales_rep_partner'
            })
            console.log("salesRep: ",salesRep)

            // if(checkForParameter(salesRep)){
            // //     var fieldLookUp = search.lookupFields({
            // //         type: 'partner',
            // //         id: salesRep,
            // //         columns: ['custentity51']
            // //     });
            // //     console.log('fieldLookUp', fieldLookUp)
            // //     // var profile = fieldLookUp.custentity51
            // //     // console.log("PROF: ",profile)
            //
            //     var rec = record.load({
            //         id: salesRep,
            //         type: 'partner',
            //         isDynamic: true
            //     })
            //
            //     var profile = rec.getValue({
            //         fieldId: 'custentity51'
            //     })
            //     console.log("PROF: ",profile)
            //     if(!checkForParameter(profile)){
            //         // alert("Selected Sales Rep Partner has no Commission Profile")
            //         window.location.href = 'https://3815745.app.netsuite.com/app/site/hosting/scriptlet.nl?script=537&deploy=1'
            //     }
            // }

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
                if (window.onbeforeunload) {
                    window.onbeforeunload = function() {
                        null;
                    };
                }
                var salesRepPartner = '';
                var formFieldsObj = {
                    custpage_sales_rep_partner: 'custpage_sales_rep_partner',
                    custpage_from_date: 'custpage_from_date',
                    custpage_to_date: 'custpage_to_date'
                };



                if (formFieldsObj[scriptContext.fieldId] == 'custpage_sales_rep_partner') {
                    var oldUrl = window.location.href;
                    var salesRepPartnerValue = scriptContext.currentRecord.getValue({
                        fieldId: 'custpage_sales_rep_partner'
                    });
                    if (checkForParameter(salesRepPartnerValue)) {
                        salesRepPartner = "&salesRepPartner=" + salesRepPartnerValue;
                    }
                    oldUrl = oldUrl.split('&deploy=' + 1);
                    var newUrl = oldUrl[0] + "&deploy=1" + salesRepPartner
                    window.location.href = newUrl;
                } else if (formFieldsObj[scriptContext.fieldId] == 'custpage_from_date') {

                    var userObj = runtime.getCurrentUser();
                    var userPref = userObj.getPreference({
                        name: 'DATEFORMAT'
                    });
                    console.log('userPref', userPref)

                    if (initialDateFormat != userPref) {
                        //window.reload();
                        scriptContext.currentRecord.setValue({
                            fieldId: 'custpage_from_date',
                            value: "",
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        });

                        scriptContext.currentRecord.setValue({
                            fieldId: 'custpage_to_date',
                            value: "",
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        });
                    } else {

                        var oldUrl = window.location.href;

                        var startDate = scriptContext.currentRecord.getText({
                            fieldId: 'custpage_from_date'
                        });
                        //startDate = startDate.getDate()+"/"+(Number(startDate.getMonth()) + Number(1))+"/"+startDate.getFullYear()
                        //var requestTimeStamp = moment(startDate).format(userPref)

                        var endDate = scriptContext.currentRecord.getText({
                            fieldId: 'custpage_to_date'
                        });

                        if (checkForParameter(endDate) && checkForParameter(startDate)) {


                            //endDate = endDate.getDate()+"/"+(Number(endDate.getMonth()) + Number(1))+"/"+endDate.getFullYear()
                            console.log('start Date ', startDate + '  ' + 'end Date ' + endDate)
                            oldUrl = oldUrl.split('&startDate=');
                            var newUrl = oldUrl[0] + "&startDate=" + startDate + "&endDate=" + endDate
                            window.location.href = encodeURI(newUrl);

                        }
                    }
                } else if (formFieldsObj[scriptContext.fieldId] == 'custpage_to_date') {

                    var userObj = runtime.getCurrentUser();
                    var userPref = userObj.getPreference({
                        name: 'DATEFORMAT'
                    });
                    console.log('userPref', userPref)

                    if (initialDateFormat != userPref) {
                        //window.reload();
                        scriptContext.currentRecord.setValue({
                            fieldId: 'custpage_from_date',
                            value: "",
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        });

                        scriptContext.currentRecord.setValue({
                            fieldId: 'custpage_to_date',
                            value: "",
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        });
                    } else {

                        var oldUrl = window.location.href;
                        console.log('end date')
                        var startDate = scriptContext.currentRecord.getText({
                            fieldId: 'custpage_from_date'
                        });
                        //startDate = startDate.getDate()+"/"+(Number(startDate.getMonth()) + Number(1))+"/"+startDate.getFullYear()
                        //var requestTimeStamp = moment(startDate).format(userPref)

                        var endDate = scriptContext.currentRecord.getText({
                            fieldId: 'custpage_to_date'
                        });
                        //endDate = endDate.getDate()+"/"+(Number(endDate.getMonth()) + Number(1))+"/"+endDate.getFullYear()
                        console.log('start Date ', startDate + '  ' + 'end Date ' + endDate)
                        oldUrl = oldUrl.split('&startDate=');
                        var newUrl = oldUrl[0] + "&startDate=" + startDate + "&endDate=" + endDate
                        window.location.href = encodeURI(newUrl);

                    }
                }


            } catch (err) {
                console.log("Err@ fieldChanged record", err)
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

        function downloadCsv() {
            try {
                var tracfoneArray = []
                var currentRec = currentRecord.get();
                var tracfoneObj = currentRec.getValue({ fieldId: 'custpage_tracfone' })
                tracfoneArray.push(tracfoneObj)
                tracfoneArray = JSON.parse(tracfoneArray)
                console.log('test new', tracfoneArray)

                var FeeHeaders = {
                    salesRep: "MARKET MANAGER",
                    mmProfile: "MM COMMISSION PROFILE ",
                    tier: "TRACFONE TIER ",
                    quantity: "TOTAL SOLD ITEMS",
                    commissionRate: "COMMISSION RATE ",
                    totalAmount: "COMMISSION AMOUNT ",
                }
                var DateVAl = new Date()
                var fileName = 'Tracfone CSV File' + ' ' + DateVAl
                var extension = 'csv';
                var data = convertToCSV(tracfoneArray, FeeHeaders);
                downloadFile(data, fileName, extension);

            } catch (e) {
                console.log('error@downloadCsv', e)
            }
        }

        function downloadCsvSim() {
            try {
                var simSaleArray = []
                var currentRec = currentRecord.get();
                var simSaleObj = currentRec.getValue({ fieldId: 'custpage_simsale' })
                simSaleArray.push(simSaleObj)
                simSaleArray = JSON.parse(simSaleArray)
                console.log('test new', simSaleObj)

                var FeeHeaders = {
                    salesRep: "SALES REP PARTNERS",
                    mmProfile: "MM COMMISSION PROFILE ",
                    quantity: "TOTAL SOLD ITEMS",
                    commissionRate: "COMMISSION RATE ",
                    totalAmount: "COMMISSION AMOUNT",
                }
                var DateVAl = new Date()
                var fileName = 'SimSale CSV File' + ' ' + DateVAl
                var extension = 'csv';
                var data = convertToCSV(simSaleArray, FeeHeaders);
                downloadFile(data, fileName, extension);
            } catch (e) {
                console.log("error@downloadCsvSim", e)
            }
        }

        function downloadCsvBranded() {
            try {
                var brandedArray = [];
                var currentRec = currentRecord.get();
                var brandedObj = currentRec.getValue({ fieldId: 'custpage_branded' })
                brandedArray.push(brandedObj)
                brandedArray = JSON.parse(brandedObj)
                var FeeHeaders = {
                    salesRep: "SALES REP PARTNERS",
                    mmProfile: "MM COMMISSION PROFILE",
                    quantity: "TOTAL SOLD ITEMS",
                    profit: "PROFIT",
                    rate: "COMMISSION PERCENTAGE",
                    totalAmount: "COMMISSION AMOUNT"
                }
                var DateVAl = new Date()
                var fileName = 'WareHouse CSV File' + ' ' + DateVAl 
                var extension = 'csv';
                var data = convertToCSV(brandedArray, FeeHeaders);
                downloadFile(data, fileName, extension);
            } catch (e) {
                console.log("error@downloadCsvBranded", e)
            }

        }

        function downloadCsvMarket() {
            try {
                var marketPlaceArray = [];
                var currentRec = currentRecord.get();
                var marketPlaceObj = currentRec.getValue({ fieldId: 'custpage_market_place' })
                marketPlaceArray.push(marketPlaceObj)
                marketPlaceArray = JSON.parse(marketPlaceArray)
                var FeeHeaders = {
                    salesRep: "SALES REP PARTNERS",
                    mmProfile: "MM COMMISSION PROFILE",
                    actualSaleRep: "Sales Rep",
                    quantity: "TOTAL SOLD ITEMS",
                    profit: "TOTAL SUM OF PROFIT",
                    rate: "COMMISSION RATE",
                    totalAmount: "COMMISSION AMOUNT",


                }
                var DateVAl = new Date()
                var fileName = 'Handset CSV File' + ' ' + DateVAl
                var extension = 'csv';
                var data = convertToCSV(marketPlaceArray, FeeHeaders);
                downloadFile(data, fileName, extension);
            } catch (e) {
                console.log("error@downloadCsvMarket", e)
            }
        }

        function downloadCsvMarketSim() {
            try {
                var marketPlaceSimArray = [];
                var currentRec = currentRecord.get();
                var marketPlaceSimObj = currentRec.getValue({ fieldId: 'custpage_marketplacesim' })
                marketPlaceSimArray.push(marketPlaceSimObj)
                marketPlaceSimArray = JSON.parse(marketPlaceSimArray)
                var FeeHeaders = {
                    salesRep: "SALES REP PARTNER",
                    marketManager: "MARKET MANAGER",
                    quantity: "TOTAL SOLD ITEMS",
                    rate: "COMMISSION RATE",
                    totalAmount: "COMMISSION AMOUNT",


                }
                var DateVAl = new Date()
                var fileName = 'MarketSIM CSV File' + ' ' + DateVAl
                var extension = 'csv';
                var data = convertToCSV(marketPlaceSimArray, FeeHeaders);
                downloadFile(data, fileName, extension);
            } catch (e) {
                console.log("error@downloadCsvMarketSim", e)
            }
        }

        function downloadCsvTotal() {
            var totalArray = [];
            var currentRec = currentRecord.get();
            var totalObj = currentRec.getValue({ fieldId: 'custpage_total_array' })
            console.log('totalObj', totalObj)
            totalArray.push(totalObj)
            totalArray = JSON.parse(totalArray)
            var FeeHeaders = {
                salesRep: "SALES REP PARTNERS",
                tracfoneTotal: "TRACFONE TOTAL",
                simTotal: "SIMSALE TOTAL",
                brandedTotal: "WAREHOUSE TOTAL",
                warehouseTotal: "BRANDED TOTAL",
                airtimeTotal: "AIRTIME TOTAL",
                activationTotal: "ACTIVATION TOTAL",
                extraTotal: " MISCELLANEOUS ADDITIONS",
                totalAmount: "COMMISSION AMOUNT",
            }
            var DateVAl = new Date()
            var fileName = 'Total CSV File' + ' ' + DateVAl
            var extension = 'csv';
            var data = convertToCSV(totalArray, FeeHeaders);
            downloadFile(data, fileName, extension);
        }

        function downloadCsvAirTime() {
            var airTimeArray = [];
            var currentRec = currentRecord.get();
            var airTimeObj = currentRec.getValue({ fieldId: 'custpage_air_time_array' })
            console.log('airTimeObj', airTimeObj)
            airTimeArray.push(airTimeObj)
            airTimeArray = JSON.parse(airTimeArray)
            var FeeHeaders = {
                salesRep: "Market Manager",
                SalesRepPartner: "SALES REP PARTNERS",
                airTimePM: "PM AIRTIME SUM",
                bonusPercentage: "AIR TIME BONUS PERCENTAGE",
                airTimeBonus: "AIR TIME BONUS",
                creditCardBonus: "CREDIT CARD BONUS",
                newDoorBonus: "NEW DOOR BONUS",
                totalAmount: "TOTAL BONUS",
            }
            var DateVAl = new Date()
            var fileName = 'Air Time Bonus CSV File' + ' ' + DateVAl
            var extension = 'csv';
            var data = convertToCSV(airTimeArray, FeeHeaders);
            downloadFile(data, fileName, extension);
        }

        function downloadCsvActivation() {
            console.log('test')
            var activationArray = [];
            var currentRec = currentRecord.get();
            var activationObj = currentRec.getValue({ fieldId: 'custpage_activation_array' })
            console.log('activationObj', activationObj)
            activationArray.push(activationObj)
            activationArray = JSON.parse(activationArray)
            log.debug('activationArray', activationArray)

            var FeeHeaders = {
                MarketManager: "Market Manager",
                salesRep: "SALES REP PARTNERS",
                MMCommissionProfile: "MM COMMISSION PROFILE ",
                totalSold: "TOTAL ITEM SOLD",
                bonusSold: "PRO & ELITE SOLD",
                activationPercentage: "BONUS PERCENTAGE",
                totalAmount: "ACTIVATION BONUS",

            }
            var DateVAl = new Date()
            var fileName = 'Activation Bonus CSV File' + ' ' + DateVAl
            var extension = 'csv';
            var data = convertToCSV(activationArray, FeeHeaders);
            downloadFile(data, fileName, extension);
        }

        function downloadCsvExtraBonus() {
            var extraBonusArray = [];
            var currentRec = currentRecord.get();
            var extrabonusObj = currentRec.getValue({ fieldId: 'custpage_extra_bonus_field' })
            console.log('activationObj', extrabonusObj)
            extraBonusArray.push(extrabonusObj)
            extraBonusArray = JSON.parse(extraBonusArray)
            log.debug('extraBonusArray', extraBonusArray)

            var FeeHeaders = {
                MarketManager: "Market Manager",
                totalAmount: "ACTIVATION BONUS",
            }
            var DateVAl = new Date()
            var fileName = 'Miscellaneous Additions CSV File' + ' ' + DateVAl
            var extension = 'csv';
            var data = convertToCSV(extraBonusArray, FeeHeaders);
            downloadFile(data, fileName, extension);

        }

        function convertToCSV(tracfoneArray, FeeHeaders) {
            var str = '';
            /*str += ReportTitle + '\r\n';*/


            //FeeHeaders = JSON.stringify(FeeHeaders);
            tracfoneArray.unshift(FeeHeaders);

            var objArray = tracfoneArray;

            var array = ((typeof(objArray) != 'object') ? (JSON.parse(objArray)) : (objArray));

            for (var i = 0; i < array.length; i++) {
                var line = '';
                for (var index in array[i]) {
                    if (line != '') {
                        line += ',';
                    }
                    line += '"' + array[i][index] + '"';
                }
                str += line + "\r\n"
            }
            return str;
        }

        function downloadFile(data, fileName, extension) {
            /* //Generate a file name*/
            fileName = (fileName) ? (fileName) : ("export"); /* //this will remove the blank-spaces from the title and replace it with an underscore*/
            fileName = fileName.replace(/ /g, "_") + '.' + extension; /* //Initialize file format you want csv or xls*/
            // var uri = data; // Now the little tricky part. // you can use either>> window.open(uri); // but this will not work in some browsers // or you will not get the correct file extension
            var uri = 'data:text/csv;charset=utf-8,' + escape(data);
            var link = document.createElement("a"); //this trick will generate a temp <a /> tag /
            link.href = uri;
            link.style = "visibility:hidden"; //set the visibility hidden so it will not effect on your web - layout /
            link.download = fileName;
            console.log("link", link);
            document.body.appendChild(link); // this part will append the anchor tag and remove it after automatic click /
            link.click();
            document.body.removeChild(link);
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            downloadCsv: downloadCsv,
            downloadCsvSim: downloadCsvSim,
            downloadCsvBranded: downloadCsvBranded,
            downloadCsvMarket: downloadCsvMarket,
            downloadCsvMarketSim: downloadCsvMarketSim,
            downloadCsvTotal: downloadCsvTotal,
            downloadCsvAirTime: downloadCsvAirTime,
            downloadCsvActivation: downloadCsvActivation,
            downloadCsvExtraBonus: downloadCsvExtraBonus
        };
    });