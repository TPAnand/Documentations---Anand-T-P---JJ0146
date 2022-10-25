/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/**
 * The Script used to setup the megatal commission report
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/format', './moment.js'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{serverWidget} serverWidget
     */
    (record, search, serverWidget, runtime, format, moment) => {
        /**
         * @description Global variable for storing errors ----> for debugging purposes
         * @type {Array.<Error>}
         * @constant
         */
        const ERROR_STACK = [];

        /**
         * @description Common Try-Catch function, applies to Object contains methods/function
         * @param {Object.<string,Function|any>} DATA_OBJ Object contains methods/function
         * @param {String} OBJECT_NAME  Name of the Object
         * @returns {void}
         */
        const applyTryCatch = (DATA_OBJ, OBJECT_NAME) => {
            /**
             * @description  Try-Catch function
             * @param {Function} myfunction - reference to a function
             * @param {String} key - name of the function
             * @returns {Function|false}
             */
            const tryCatch = function tryCatch(myfunction, key) {
                return function () {
                    try {
                        return myfunction.apply(this, arguments);
                    } catch (e) {
                        log.error("error in " + key, e);
                        ERROR_STACK.push(e);
                        return false;
                    }
                };
            }
            //Iterate over keys in Object. If the values are function, then apply Try-Catch over them
            for (let key in DATA_OBJ)
                if (typeof DATA_OBJ[key] === "function")
                    DATA_OBJ[key] = tryCatch(DATA_OBJ[key], OBJECT_NAME + "." + key);
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

        /**
         * @description To fix a float number to specified decimal parts
         * @param {Number|String} value
         * @param {Number|String} decimals
         * @returns {Number|String}
         */
        function fixFloat(value, decimals) {
            decimals = (decimals) ? decimals : 2;
            // return roundFloat(parseFloat(value), parseInt(decimals)).toFixed(parseInt(decimals));
            return parseFloat(value).toFixed(decimals);
        }


        const dataProcess = {
            groupSalesRepbyMMProfile(salesRepResults) {
                let groupedSalesRepObject = {}
                for (let m = 0; m < salesRepResults.length; m++) {
                    if (!groupedSalesRepObject[salesRepResults[m].MMCommissionProfile.text]) {
                        groupedSalesRepObject[salesRepResults[m].MMCommissionProfile.text] = {};
                        groupedSalesRepObject[salesRepResults[m].MMCommissionProfile.text][salesRepResults[m].InternalID.value] = salesRepResults[m].Name.value;
                    } else {
                        groupedSalesRepObject[salesRepResults[m].MMCommissionProfile.text][salesRepResults[m].InternalID.value] = salesRepResults[m].Name.value;
                    }
                }
                //log.debug("groupedSalesRepObject", groupedSalesRepObject);
                return groupedSalesRepObject;
            }
        }
        applyTryCatch(dataProcess, "dataProcess");

        const dataSets = {
            /**
             * @description Object referencing NetSuite Saved Search
             * @typedef {Object} SearchObj
             * @property {Object[]} filters - Filters Array in Search
             * @property {Object[]} columns - Columns Array in Search
             */
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
             * @description Representing each result in Final Saved Search Format
             * @typedef formattedEachSearchResult
             * @type {{value:any,text:any}}
             */
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
            /**
             * Tracfone activation search grouped by the tiers type and sales rep partner
             * @param salesPartnerValue
             * @param startDate
             * @param endDate
             * @param profile
             * @returns {*[]|Object[]}
             */
            tracfoneCommissionRateSearch(salesPartnerValue, startDate, endDate, profile) {

                //To filter in a specific Item if Item Internal Id is feeded


                var filterArray = [];
                //adding filter in search
                if (!checkForParameter(startDate) && !checkForParameter(endDate)) {

                    /* ["custrecord_jj_tra_activation_date", "within", "lastmonth"])*/
                    filterArray.push(
                        /* ["custrecord_jj_tra_activation_date","within",startDate,endDate])*/
                        ["custrecord_jj_tra_activation_date", "within", "lastmonth"])
                } else {
                    filterArray.push(
                        ["custrecord_jj_tra_activation_date", "within", startDate, endDate])
                }

                if (profile == 3) {
                    filterArray.push("AND", ["custrecord_jj_sales_rep_tracfone", "anyof", salesPartnerValue])
                }

                //log.debug('filterArray', filterArray)

                let customrecord_jj_tracfone_activationsSearchObj = search.create({
                    type: "customrecord_jj_tracfone_activations",
                    filters: filterArray,
                    /*[

                   /!* ['AND'],
                    ["custrecord_jj_tra_activation_date","within","2/4/2021","2/13/2021"]*!/
                ],*/
                    columns: [
                        search.createColumn({
                            name: "custrecord_jj_sales_rep_tracfone",
                            summary: "GROUP",
                            label: "salesreppartner"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_mkt_manager",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "MarketManager"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_tracfone_teir",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "TracFoneTeir"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "COUNT",
                            label: "countInternalID"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_tra_activation_date",
                            summary: "MAX",
                            label: "ActivationDate"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "MAX",
                            formula: "CASE WHEN {custrecord_jj_tracfone_teir} = 'AR' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity52} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity52} END WHEN {custrecord_jj_tracfone_teir} = 'ELITE' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity61} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity61} END WHEN {custrecord_jj_tracfone_teir} = 'MEMBER' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity53}  IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity53} END WHEN {custrecord_jj_tracfone_teir} = 'PRO' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity54} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity54} END WHEN {custrecord_jj_tracfone_teir} = 'VIP' THEN  CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity62} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity62} END WHEN {custrecord_jj_tracfone_teir} = 'EXCLUSIVE' THEN  CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity_jj_trac_exclusive_rate} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity_jj_trac_exclusive_rate} END ELSE 0 END",
                            label: "CommissionRate"
                        }),
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CASE WHEN {custrecord_jj_sales_rep_tracfone.parent} IS NOT NULL THEN {custrecord_jj_sales_rep_tracfone.parent} ELSE {custrecord_jj_sales_rep_tracfone} END",
                            label: "SalesRepParent"
                        }),
                        search.createColumn({
                            name: "classnohierarchy",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "custentity51",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({
                            name: "companyname",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "CompanyName"
                        })
                    ]
                });
                let searchResultCount = customrecord_jj_tracfone_activationsSearchObj.runPaged().count;
                // log.debug("customrecord_jj_tracfone_activationsSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(customrecord_jj_tracfone_activationsSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_tracfone_activationsSearchObj, 'label'));

            },
            salesRepSearchBasedMMProfile() {
                var partnerSearchObj = search.create({
                    type: "partner",
                    filters: [
                        ["custentity51", "noneof", "@NONE@"]
                    ],
                    columns: [
                        search.createColumn({ name: "altname", label: "Name" }),
                        // search.createColumn({name: "companyname", label: "CompanyName"}),
                        search.createColumn({ name: "custentity51", label: "MMCommissionProfile" }),
                        search.createColumn({ name: "internalid", label: "InternalID" })
                    ]
                });
                let searchResultCount = partnerSearchObj.runPaged().count;
                log.debug("partnerSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(partnerSearchObj, dataSets.fetchSavedSearchColumn(partnerSearchObj, 'label'));
            },
            /**
             * Regional Managers Search
             * @returns {*[]|Object[]}
             */
            tracfoneReginalManegerSearch() {
                let partnerSearchObj1 = search.create({
                    type: "partner",
                    filters: [
                        ["custentity51", "anyof", "1", "2", "4", "5", "6"],
                        // ["custentity51","anyof","1"],
                        "AND", ["internalidnumber", "notequalto", "18152"]
                    ],
                    columns: [
                        search.createColumn({ name: "companyname", label: "CompanyName" }),
                        search.createColumn({ name: "altname", label: "Name" }),
                        search.createColumn({ name: "class", label: "Class" }),
                        search.createColumn({
                            name: "custentity51",
                            sort: search.Sort.ASC,
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({ name: "custentity52", label: "AR" }),
                        search.createColumn({ name: "custentity_jj_trac_exclusive_rate", label: "EXCLUSIVE" }),
                        search.createColumn({ name: "custentity61", label: "ELITE" }),
                        search.createColumn({ name: "custentity53", label: "MEMBER" }),
                        search.createColumn({ name: "custentity54", label: "PRO" }),
                        search.createColumn({ name: "custentity62", label: "VIP" }),
                        search.createColumn({ name: "custentity_sim_cards_teir_1", label: "SimCardstier1" }),
                        search.createColumn({ name: "custentity70", label: "SimCardstier2" }),
                        search.createColumn({ name: "custentity81", label: "SimTier1rate" }),
                        search.createColumn({ name: "custentity82", label: "SimTier2Rate" }),
                        search.createColumn({ name: "custentity_jj_branded_handset_count", label: "BrandedHSTier1" }),
                        search.createColumn({ name: "custentity57", label: "BrandedHSTier1rate" }),
                        search.createColumn({ name: "custentity64", label: "BrandedHSTier2" }),
                        search.createColumn({ name: "custentity63", label: "BrandedHSTier2rate" }),
                        search.createColumn({ name: "custentity58", label: "MarketPlaceTier1" }),
                        search.createColumn({ name: "custentity66", label: "MarketPlaceTier1Rate" }),
                        search.createColumn({ name: "custentity65", label: "MarketPlaceTier2" }),
                        search.createColumn({ name: "custentity60", label: "MarketPlaceTier2Rate" }),
                        search.createColumn({
                            name: "custentity_jj_total_credit_card_per_mont",
                            label: "TOTALCREDITCARD"
                        }),
                        search.createColumn({ name: "custentity_jj_air_bonus_tier_1", label: "AirBonusTier1" }),
                        search.createColumn({ name: "custentity_jj_air_bonus_tier_2", label: "AirBonusTier2" }),
                        search.createColumn({ name: "custentity_jj_air_bonus_tier_3", label: "AirBonusTier3" }),
                        search.createColumn({ name: "custentity80", label: "Airtimetier1" }),
                        search.createColumn({ name: "custentity73", label: "Airtimetier15" }),
                        search.createColumn({ name: "custentity71", label: "Airtimetier2" }),
                        search.createColumn({ name: "custentity74", label: "Airtimetier25" }),
                        search.createColumn({ name: "custentity72", label: "Airtimetier3" }),
                        search.createColumn({ name: "custentity75", label: "Airtimetier35" }),
                        search.createColumn({ name: "custentity76", label: "MerchantSVCTeir1" }),
                        search.createColumn({ name: "custentity77", label: "MerchantSVCTeir10" }),
                        search.createColumn({
                            name: "custentity_jj_warehouse_payout_rate_2",
                            label: "WAREHOUSEPAYOUTRATE2"
                        }),
                        search.createColumn({ name: "custentity87", label: "WarehousePayoutRate1" }),
                        search.createColumn({ name: "custentity86", label: "WarehouseHSTier1" }),
                        search.createColumn({
                            name: "custentity_jj_warehouse_qty_gt_600",
                            label: "WarehouseQtygt600"
                        }),
                        search.createColumn({
                            name: "custentity_jj_credit_card_bonus_tier",
                            label: "CreditCardBonusTier"
                        }),
                        search.createColumn({ name: "custentity78", label: "NewDoorAdd1" }),
                        search.createColumn({ name: "custentity79", label: "NewDoorAdd4" }),
                        search.createColumn({
                            name: "custentity_jj_total_new_doors_added",
                            label: "TOTALNEWDOORSADDED"
                        }),
                        search.createColumn({ name: "custentity_jj_activation_bonus_25", label: "ActivationBonus25" }),
                        search.createColumn({ name: "custentity_jj_activation_bonus_50", label: "ActivationBonus50" }),
                        search.createColumn({ name: "custentity_jj_activation_bonus_75", label: "ActivationBonus70" })
                    ]
                });
                let searchResultCount = partnerSearchObj1.runPaged().count;
                //log.debug("partnerSearchObj result count 22222", searchResultCount);
                return dataSets.iterateSavedSearch(partnerSearchObj1, dataSets.fetchSavedSearchColumn(partnerSearchObj1, 'label'));
            },
            /**
             * Lookup for fetching the sales rep partners mm commission profile
             * @param id
             * @returns {*}
             */
            salesRepLookup(id) {
                var fieldLookUp = search.lookupFields({
                    type: 'partner',
                    id: id,
                    columns: ['custentity51']
                });
                log.debug('fieldLookUp', fieldLookUp)
                var profile = fieldLookUp.custentity51
                return profile;
            },
            /**
             * Sim Sale Commission Report Search
             * @param salesPartnerValue
             * @param profile
             * @param startDate
             * @param endDate
             * @returns {*[]|Object[]}
             */
            simSaleSearchBasedMMProfile(salesPartnerValue, profile, startDate, endDate) {

                var filterArray = [
                    //["closedate", "within", "lastmonth"],
                    //["closedate","within","1/6/2021","1/29/2021"],

                    ["type", "anyof", "CashSale", "CustInvc", "CustCred"],
                    "AND", ["custcol_commitemgroup", "anyof", "2", "3"],
                    "AND", ["partner", "noneof", "10456", "11940", "8739", "9260", "4868", "9566", "4870", "9623", "14117", "14352", "4985", "14402", "14482", "15016", "16261", "15676", "16419", "8049"],
                    "AND", ["mainline", "is", "F"],
                    "AND", ["shipping", "is", "F"],
                    "AND", ["taxline", "is", "F"],
                    "AND", ["cogs", "is", "F"],
                    "AND", ["subsidiary", "anyof", "@ALL@"],
                ]

                if (!checkForParameter(startDate) && !checkForParameter(endDate)) {
                    filterArray.push(
                        "AND", ["closedate", "within", "lastmonth"])
                } else {
                    filterArray.push(
                        "AND", ["closedate", "within", startDate, endDate])
                }

                if (checkForParameter(salesPartnerValue)) {
                    if (profile == 3) {
                        filterArray.push("AND", ["partner", "anyof", salesPartnerValue])
                    }
                }
                //log.debug('filterArray', filterArray)
                var transactionSearchObj = search.create({
                    type: "transaction",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "companyname",
                            join: "partner",
                            summary: "GROUP",
                            label: "Salerep"
                        }),
                        search.createColumn({
                            name: "quantity",
                            summary: "SUM",
                            label: "Quantity"
                        }),
                        search.createColumn({
                            name: "amount",
                            summary: "SUM",
                            label: "Amount"
                        }),
                        search.createColumn({
                            name: "classnohierarchy",
                            join: "partner",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "custentity51",
                            join: "partner",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({
                            name: "custentity_sim_cards_teir_1",
                            join: "partner",
                            summary: "GROUP",
                            label: "SimCardstier1"
                        }),
                        search.createColumn({
                            name: "custentity81",
                            join: "partner",
                            summary: "GROUP",
                            label: "SimTier1rate"
                        }),
                        search.createColumn({
                            name: "custentity70",
                            join: "partner",
                            summary: "GROUP",
                            label: "SimCardstier2"
                        }),
                        search.createColumn({
                            name: "custentity82",
                            join: "partner",
                            summary: "GROUP",
                            label: "SimTier2Rate"
                        })
                    ]
                });
                var searchResultCount = transactionSearchObj.runPaged().count;
                //log.debug("transactionSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(transactionSearchObj, dataSets.fetchSavedSearchColumn(transactionSearchObj, 'label'));
            },
            /**
             *Function for initiates the Branded Handset Search
             * @returns {*[]|Object[]}
             */
            brandedHandsetSearch(salesPartnerValue, profile, startDate, endDate) {

                var filterArray = [
                    ["custrecord_jj_sales_rep.class", "noneof", "@NONE@"],
                    /* "AND",
                 ["custrecord_jj_sales_rep.custentity51", "noneof", "@NONE@"]*/
                ]

                if (!checkForParameter(startDate) && !checkForParameter(endDate)) {
                    filterArray.push(
                        "AND", ["custrecord_jj_date_filled", "within", "lastmonth"])
                } else {
                    filterArray.push(
                        "AND", ["custrecord_jj_date_filled", "within", startDate, endDate])
                }

                if (checkForParameter(salesPartnerValue)) {
                    if (profile == 3) {
                        filterArray.push("AND", ["custrecord_jj_sales_rep", "anyof", salesPartnerValue])
                    }
                }

                var customrecord_jj_branded_handsetSearchObj = search.create({
                    type: "customrecord_jj_branded_handset",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "custrecord_jj_brd_handset_mkt_manager",
                            summary: "GROUP",
                            label: "MarketManager"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "COUNT",
                            label: "InternalID"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_dealer_cost",
                            summary: "SUM",
                            label: "Dealercost"
                        }),
                        search.createColumn({
                            name: "custrecordmacommission",
                            summary: "SUM",
                            label: "MACommission"
                        }),
                        search.createColumn({
                            name: "class",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "custentity51",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({
                            name: "custentity_jj_branded_handset_count",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "BrandedHSTier1"
                        }),
                        search.createColumn({
                            name: "custentity57",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "BrandedHSTier1rate"
                        }),
                        search.createColumn({
                            name: "custentity64",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "BrandedHSTier2"
                        }),
                        search.createColumn({
                            name: "custentity63",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "BrandedHSTier2rate"
                        }), search.createColumn({
                            name: "custentity58",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "MarketPlaceTier1"
                        }),
                        search.createColumn({
                            name: "custentity66",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "MarketPlaceTier1Rate"
                        }),
                        search.createColumn({
                            name: "custentity65",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "MarketPlaceTier2"
                        }),
                        search.createColumn({
                            name: "custentity60",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "MarketPlaceTier2Rate"
                        })
                    ]
                });
                var searchResultCount = customrecord_jj_branded_handsetSearchObj.runPaged().count;
                log.debug("customrecord_jj_branded_handsetSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(customrecord_jj_branded_handsetSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_branded_handsetSearchObj, 'label'));
            },
            /**
             *Function for defines the market place search
             * @returns {*[]|Object[]}
             */
            marketwithBrandedHandsetSearch(salesPartnerValue, profile, startDate, endDate) {
                var filterArray = [
                    ["custrecord_jj_marketplace_salesrep_partr", "noneof", "@NONE@"],
                    /*"AND",
                ["custrecord_jj_marketplace_salesrep_partr.custentity51", "noneof", "@NONE@"]*/
                ]
                filterArray.push( "AND", ["custrecord_jj_marketplace_subcategory","anyof","@NONE@","1"])

                if (!checkForParameter(startDate) && !checkForParameter(endDate)) {
                    filterArray.push(
                        "AND", ["custrecord_jj_marketplace_date_shipped", "within", "lastmonth"])
                } else {
                    filterArray.push(
                        "AND", ["custrecord_jj_marketplace_date_shipped", "within", startDate, endDate])
                }

                if (checkForParameter(salesPartnerValue)) {
                    if (profile == 3) {
                        filterArray.push("AND", ["custrecord_jj_marketplace_salesrep_partr", "anyof", salesPartnerValue])
                    }
                }

                log.debug('-----------filterArray-------------',filterArray)
                var customrecord_jj_marketplace_sales_orderSearchObj = search.create({
                    type: "customrecord_jj_marketplace_sales_order",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "custrecord_jj_mkt_so_mkt_manager",
                            summary: "GROUP",
                            label: "MarketManager"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "COUNT",
                            label: "InternalID"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_marketplace_dealer_cost",
                            summary: "SUM",
                            label: "DealerCost"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_current_parent_commission",
                            summary: "SUM",
                            label: "CurrentParentCommission"
                        }),
                        search.createColumn({
                            name: "class",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "custentity51",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP",
                            label: "MMCommissionProfile"
                        })
                    ]
                });
                var searchResultCount = customrecord_jj_marketplace_sales_orderSearchObj.runPaged().count;
                log.debug("customrecord_jj_marketplace_sales_orderSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(customrecord_jj_marketplace_sales_orderSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_marketplace_sales_orderSearchObj, 'label'));
            },
            marketplaceSimSearch(salesPartnerValue,startDate,endDate,sublistMarketPlaceSim){
                try{
                    var filterArray = [["custrecord_jj_marketplace_subcategory","anyof","2","3"]]
                    filterArray.push("AND", ["custrecord_jj_marketplace_salesrep_partr","noneof","@NONE@"])
                    filterArray.push("AND", [["custrecord_jj_marketplace_salesrep_partr.custentity_sim_cards_teir_1","isnotempty",""],"OR",["custrecord_jj_marketplace_salesrep_partr.custentity70","isnotempty",""]])
                    if(checkForParameter(salesPartnerValue)){
                        filterArray.push("AND", ["custrecord_jj_marketplace_salesrep_partr","anyof",salesPartnerValue])
                    }
                    if(checkForParameter(startDate) && checkForParameter(endDate)){
                        filterArray.push("AND", ["custrecord_jj_date_ordered","within",startDate,endDate])
                    }
                    else {
                        filterArray.push("AND", ["custrecord_jj_date_ordered","within","lastmonth"])
                    }
                    log.debug("filterArray: ",filterArray)
                    var customrecord_jj_marketplace_sales_orderSearchObj = search.create({
                        type: "customrecord_jj_marketplace_sales_order",
                        filters: filterArray,
                        columns:
                            [
                                search.createColumn({
                                    name: "custrecord_jj_marketplace_salesrep_partr",
                                    summary: "GROUP",
                                    label: "SalesRepPartner"
                                }),
                                search.createColumn({
                                    name: "custrecord_jj_mkt_so_mkt_manager",
                                    summary: "GROUP",
                                    label: "MarketManager"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    summary: "COUNT",
                                    label: "InternalID"
                                }),
                                search.createColumn({
                                    name: "custentity_sim_cards_teir_1",
                                    join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                    summary: "GROUP",
                                    label: "SimCardstier1"
                                }),
                                search.createColumn({
                                    name: "custentity81",
                                    join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                    summary: "GROUP",
                                    label: "SimTier1rate"
                                }),
                                search.createColumn({
                                    name: "custentity70",
                                    join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                    summary: "GROUP",
                                    label: "SimCardstier2"
                                }),
                                search.createColumn({
                                    name: "custentity82",
                                    join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                    summary: "GROUP",
                                    label: "SimTier2Rate"
                                })
                            ]
                    });
                    var searchResultCount = customrecord_jj_marketplace_sales_orderSearchObj.runPaged().count;
                    log.debug("customrecord_jj_marketplace_sales_orderSearchObj result count",searchResultCount);

                    return dataSets.iterateSavedSearch(customrecord_jj_marketplace_sales_orderSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_marketplace_sales_orderSearchObj, 'label'));

                    return res;
                }
                catch (e) {
                    log.debug("Error @ marketplaceSimSearch: ",e.name+" : "+e.message)
                }
            },
            /**
             * Function for defines the warehouse commission report search
             * @param salesPartnerValue
             * @param profile
             * @param startDate
             * @param endDate
             * @returns {*[]|Object[]}
             */
            marketPlaceSearch(salesPartnerValue, profile, startDate, endDate) {
                var filterArray = [
                    ["type", "anyof", "CustInvc", "CustCred"],
                    "AND", ["status", "anyof", "CustInvc:B"],
                    "AND", ["cogs", "is", "F"],
                    "AND", ["shipping", "is", "F"],
                    "AND", ["taxline", "is", "F"],
                    "AND", ["item.type", "anyof", "InvtPart"],
                    "AND", ["class", "noneof", "@NONE@"],
                    /*"AND",
                ["custbody_jj_actual_sales_person.custentity51", "noneof", "@NONE@"],*/
                    "AND", ["custcol_commitemgroup", "anyof", "8", "1"],
                    "AND", ["custbody_jj_actual_sales_person.custentity_jj_is_commissionable", "is", "T"]
                ]

                if (!checkForParameter(startDate) && !checkForParameter(endDate)) {
                    filterArray.push(
                        "AND", ["closedate", "within", "lastmonth"])
                } else {
                    filterArray.push(
                        "AND", ["closedate", "within", startDate, endDate])
                }

                if (checkForParameter(salesPartnerValue)) {
                    if (profile == 3) {
                        filterArray.push("AND", ["custbody_jj_actual_sales_person", "anyof", salesPartnerValue,])
                    }
                }


                var marketPlaceSearchObj = search.create({
                    type: "transaction",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "class",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "custbody_jj_actual_sales_person",
                            summary: "GROUP",
                            label: "ActualSalesPerson"
                        }),
                        search.createColumn({
                            name: "companyname",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "CompanyName"
                        }),
                        search.createColumn({
                            name: "quantity",
                            summary: "SUM",
                            label: "Quantity"
                        }),
                        search.createColumn({
                            name: "amount",
                            summary: "SUM",
                            label: "Amount"
                        }),
                        search.createColumn({
                            name: "estgrossprofit",
                            summary: "SUM",
                            label: "EstGrossProfit"
                        }),
                        search.createColumn({
                            name: "custentity51",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({
                            name: "custentity86",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "MarketPlacetier1"
                        }),
                        search.createColumn({
                            name: "custentity87",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "MarketPlaceTier1Rate"
                        }),
                        search.createColumn({
                            name: "custentity_jj_warehouse_qty_gt_600",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "MarketPlaceTier2"
                        }),
                        search.createColumn({
                            name: "custentity_jj_warehouse_payout_rate_2",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "MarketPlaceTier2Rate"
                        })
                    ]
                });
                var searchResultCount = marketPlaceSearchObj.runPaged().count;
                log.debug("transactionSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(marketPlaceSearchObj, dataSets.fetchSavedSearchColumn(marketPlaceSearchObj, 'label'));
            },
            /**
             * Search used to fetch the air time bonus details
             * @param salesPartnerValue
             * @param profile
             * @returns {*[]|Object[]}
             */
            airTimeBonusSearch(salesPartnerValue, profile) {
                var filterArray = [
                    ["partner", "noneof", "@NONE@", "12191", "14638", "14224", "14747", "14848", "15073", "15265", "14426", "15522", "11939", "14117", "14142", "14219", "14352", "14402", "4854", "14427", "14482", "14640", "14708", "14758", "14759", "14986", "15016", "15107", "15161", "15206", "16603", "17474", "18315", "8760", "10284", "15425", "15449", "15571", "15572", "15676", "16261", "16419", "4857", "4993", "17402", "17408", "4858", "18414", "4865", "4866", "4867", "4870", "4977", "4982", "4985", "4987", "4988", "4989", "4990", "4991", "4992", "8034", "4853", "14649", "14979", "17367", "10136", "4851", "11404", "4852", "11818", "12093", "8049", "8048", "8050", "8051", "8353", "4847", "8425", "8559", "8627", "8688", "8757", "8758", "8755", "8756", "9371", "9372", "9960", "8759", "8761", "9271", "9282", "4849", "9463", "9566", "9623", "14223", "15134", "9852", "10093", "7595", "10370", "10393", "10456", "10516", "10551", "10599", "11030", "11096", "11214", "11235", "11271", "11314", "11315", "11421", "11432", "11449", "11594", "11781", "11917", "11921", "11935", "11940", "12003", "18422"],
                    "AND", ["category", "noneof", "5"],
                    "AND", ["isinactive", "is", "F"],
                    "AND", ["custentity3", "noneof", "@NONE@"],
                ]
                if (checkForParameter(salesPartnerValue)) {
                    if (profile == 3) {
                        filterArray.push("AND", ["partner", "anyof", salesPartnerValue])
                    }
                }

                var customerSearchObj = search.create({
                    type: "customer",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "custentity3",
                            summary: "GROUP",
                            label: "MarketManager"
                        }),
                        search.createColumn({
                            name: "custentity_jj_monthtodate_airtime_sum",
                            summary: "SUM",
                            sort: search.Sort.ASC,
                            label: "VIDAPAYMTDAIRTIMESUM"
                        }),
                        search.createColumn({
                            name: "custentity_jj_previous_month_airtime_sum",
                            summary: "SUM",
                            label: "PMAIRTIMESUM"
                        }),
                        /*  search.createColumn({
                              name: "formulapercent",
                              summary: "SUM",
                              formula: "round(Sum((CASE WHEN ({custentity_jj_previous_month_airtime_sum} > 1) OR ({custentity_jj_previous_month_airtime_sum} = 1) THEN {custentity_jj_previous_month_airtime_sum} ELSE 0 END)-(CASE WHEN ({custentity_jj_monthtodate_airtime_sum} > 1) OR ({custentity_jj_monthtodate_airtime_sum} = 1) THEN {custentity_jj_monthtodate_airtime_sum} ELSE 0 END))/Sum(CASE WHEN {custentity_jj_previous_month_airtime_sum} != 0 THEN {custentity_jj_previous_month_airtime_sum} END),4)",
                              label: "Change"
                          }),*/
                        search.createColumn({
                            name: "formulanumeric",
                            summary: "SUM",
                            formula: "TO_NUMBER(TO_NUMBER({custentity_jj_monthtodate_airtime_sum})/TO_NUMBER(TO_CHAR({today},'DD')))*TO_NUMBER(TO_CHAR(last_day({today}),'DD'))",
                            label: "Trending"
                        }),
                        search.createColumn({
                            name: "partner",
                            summary: "GROUP",
                            label: "SalesRepPartner"
                        }),
                        search.createColumn({
                            name: "class",
                            join: "partner",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "custentity51",
                            join: "partner",
                            summary: "GROUP",
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({
                            name: "custentity_jj_air_bonus_tier_1",
                            join: "partner",
                            summary: "GROUP",
                            label: "AirBonusTier1"
                        }),
                        search.createColumn({
                            name: "custentity_jj_air_bonus_tier_2",
                            join: "partner",
                            summary: "GROUP",
                            label: "AirBonusTier2"
                        }),
                        search.createColumn({
                            name: "custentity_jj_air_bonus_tier_3",
                            join: "partner",
                            summary: "GROUP",
                            label: "AirBonusTier3"
                        }),
                        search.createColumn({
                            name: "custentity80",
                            join: "partner",
                            summary: "GROUP",
                            label: "Airtimetier1"
                        }),
                        search.createColumn({
                            name: "custentity73",
                            join: "partner",
                            summary: "GROUP",
                            label: "Airtimetier15"
                        }),
                        search.createColumn({
                            name: "custentity71",
                            join: "partner",
                            summary: "GROUP",
                            label: "Airtimetier2"
                        }),
                        search.createColumn({
                            name: "custentity74",
                            join: "partner",
                            summary: "GROUP",
                            label: "Airtimetier25"
                        }),
                        search.createColumn({
                            name: "custentity72",
                            join: "partner",
                            summary: "GROUP",
                            label: "Airtimetier3"
                        }),
                        search.createColumn({
                            name: "custentity75",
                            join: "partner",
                            summary: "GROUP",
                            label: "Airtimetier35"
                        }),
                        search.createColumn({
                            name: "custentity_jj_total_credit_card_per_mont",
                            join: "partner",
                            summary: "GROUP",
                            label: "TOTALCREDITCARD"
                        }),
                        search.createColumn({
                            name: "custentity76",
                            join: "partner",
                            summary: "GROUP",
                            label: "MerchantSVCTeir1"
                        }),
                        search.createColumn({
                            name: "custentity77",
                            join: "partner",
                            summary: "GROUP",
                            label: "MerchantSVCTeir10"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            summary: "GROUP",
                            formula: "{partner.custentity_jj_credit_card_bonus_tier}",
                            label: "CreditCardTier"
                        }),
                        search.createColumn({
                            name: "custentity78",
                            join: "partner",
                            summary: "GROUP",
                            label: "NewDoorAdd1"
                        }),
                        search.createColumn({
                            name: "custentity79",
                            join: "partner",
                            summary: "GROUP",
                            label: "NewDoorAdd4"
                        }),
                        search.createColumn({
                            name: "custentity_jj_total_new_doors_added",
                            join: "partner",
                            summary: "GROUP",
                            label: "TOTALNEWDOORSADDED"
                        })
                    ]
                });
                var searchResultCount = customerSearchObj.runPaged().count;
                log.debug("customerSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(customerSearchObj, dataSets.fetchSavedSearchColumn(customerSearchObj, 'label'));
            },
            /**
             * Function used to initiate the search for the trancfone activations bonus report.
             * @param salesPartnerValue
             * @param startDate
             * @param endDate
             * @param profile
             * @returns {*[]|Object[]}
             */
            activationBonusSearch(salesPartnerValue, startDate, endDate, profile) {

                var filterArray = [

                ];
                //adding filter in search
                if (!checkForParameter(startDate) && !checkForParameter(endDate)) {

                    /* ["custrecord_jj_tra_activation_date", "within", "lastmonth"])*/
                    filterArray.push(
                        /* ["custrecord_jj_tra_activation_date","within",startDate,endDate])*/
                        ["custrecord_jj_tra_activation_date", "within", "lastmonth"])
                } else {
                    filterArray.push(
                        ["custrecord_jj_tra_activation_date", "within", startDate, endDate])
                }

                if (profile == 3) {
                    filterArray.push("AND", ["custrecord_jj_sales_rep_tracfone", "anyof", salesPartnerValue])
                }

                log.debug('filterArray', filterArray)
                var customrecord_jj_tracfone_activationsSearchObj = search.create({
                    type: "customrecord_jj_tracfone_activations",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "custrecord_jj_sales_rep_tracfone",
                            summary: "GROUP",
                            label: "salesreppartner"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_mkt_manager",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "MarketManager"
                        }),
                        search.createColumn({
                            name: "custentity51",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({
                            name: "class",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "COUNT",
                            label: "InternalID"
                        }),
                        search.createColumn({
                            name: "companyname",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "CompanyName"
                        }),
                        search.createColumn({
                            name: "custentity_jj_activation_bonus_25",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "ActivationBonus25"
                        }),
                        search.createColumn({
                            name: "custentity_jj_activation_bonus_50",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "ActivationBonus50"
                        }),
                        search.createColumn({
                            name: "custentity_jj_activation_bonus_75",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "ActivationBonus70"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            summary: "COUNT",
                            formula: "CASE WHEN {custrecord_jj_tracfone_teir} = 'ELITE' OR  {custrecord_jj_tracfone_teir} = 'PRO'  OR  {custrecord_jj_tracfone_teir} = 'VIP' OR  {custrecord_jj_tracfone_teir} = 'VIP+'  THEN  {internalid} END",
                            label: "FormulaBonus"
                        })
                    ]
                });
                var searchResultCount = customrecord_jj_tracfone_activationsSearchObj.runPaged().count;
                log.debug("customrecord_jj_tracfone_activationsSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(customrecord_jj_tracfone_activationsSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_tracfone_activationsSearchObj, 'label'));
            },
            /**
             * The search is used to fetch qpay branded search details
             * @returns {*[]|Object[]}
             * @constructor
             */
            QPayBrandedSearch(salesPartnerValue, profile, startDate, endDate) {

                var filterArray = [];

                if (!checkForParameter(startDate) && !checkForParameter(endDate)) {

                    /* ["custrecord_jj_tra_activation_date", "within", "lastmonth"])*/
                    filterArray.push(
                        /* ["custrecord_jj_tra_activation_date","within",startDate,endDate])*/
                        ["custrecord_jj_order_date", "within", "lastmonth"])
                } else {
                    filterArray.push(
                        ["custrecord_jj_order_date", "within", startDate, endDate])
                }
                if (checkForParameter(salesPartnerValue)) {
                    if (profile == 3) {
                        filterArray.push("AND", ["custrecord_jj_sales_rep_maeket", "anyof", salesPartnerValue])
                    }
                }

                var customrecord_jj_qpay_marketplace_detailsSearchObj = search.create({
                    type: "customrecord_jj_qpay_marketplace_details",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "custrecord_jj_qpay_mktplace_mkt_manager",
                            summary: "GROUP",
                            label: "MarketManager"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "COUNT",
                            label: "InternalID"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_retailcost",
                            summary: "SUM",
                            label: "Retailcost"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_ma_commission",
                            summary: "SUM",
                            label: "MACommission"
                        })
                    ]
                });
                var searchResultCount = customrecord_jj_qpay_marketplace_detailsSearchObj.runPaged().count;
                log.debug("customrecord_jj_qpay_marketplace_detailsSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(customrecord_jj_qpay_marketplace_detailsSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_qpay_marketplace_detailsSearchObj, 'label'));
            },
            /**
             * Fetch Details for Additional QPay Seach for air time bonus.
             * @param salesPartnerValue
             * @param profile
             * @param startDate
             * @param endDate
             * @returns {*[]|Object[]}
             * @constructor
             */
            QpayAirtimeBonusSearch(salesPartnerValue, profile, startDate, endDate) {


                var filterArray = [

                    ["custrecord_jj_sales_rep_qpay", "noneof", "@NONE@"],
                    "AND", ["custrecord_jj_sales_rep_qpay.custentity51", "noneof", "@NONE@"],
                    "AND", ["custrecord_jj_qpaydetail_date", "within", "lastmonth"]
                ]

                if (checkForParameter(salesPartnerValue)) {
                    if (profile == 3) {
                        filterArray.push("AND", ["custrecord_jj_sales_rep_qpay", "anyof", salesPartnerValue])
                    }
                }

                var customrecord_jj_qpaydetail_transactionSearchObj = search.create({

                    type: "customrecord_jj_qpaydetail_transaction",
                    filters: filterArray,
                    columns: [
                        search.createColumn({
                            name: "companyname",
                            join: "CUSTRECORD_JJ_SALES_REP_QPAY",
                            summary: "GROUP",
                            label: "CompanyName"
                        }),
                        search.createColumn({
                            name: "altname",
                            join: "CUSTRECORD_JJ_SALES_REP_QPAY",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_qpaydetail_retailcost",
                            summary: "SUM",
                            label: "Retail"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_detail_master",
                            summary: "SUM",
                            label: "Master"
                        }),
                        search.createColumn({
                            name: "internalid",
                            summary: "COUNT",
                            label: "InternalID"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_qpaydetail_date",
                            summary: "MAX",
                            label: "Date"
                        })
                    ]
                });
                var searchResultCount = customrecord_jj_qpaydetail_transactionSearchObj.runPaged().count;
                log.debug("customrecord_jj_qpaydetail_transactionSearchObj result count new val", searchResultCount);
                return dataSets.iterateSavedSearch(customrecord_jj_qpaydetail_transactionSearchObj, dataSets.fetchSavedSearchColumn(customrecord_jj_qpaydetail_transactionSearchObj, 'label'));
            },
            miscellaneousAdditionsSearch(salesPartnerValue, profile) {

                var filterObj = [
                    ["custentity94", "isnotempty", ""],
                ]
                if (checkForParameter(salesPartnerValue)) {
                    filterObj.push("AND", ["internalidnumber", "equalto", salesPartnerValue])

                }


                var partnerSearchObjVal = search.create({
                    type: "partner",
                    filters: filterObj,
                    columns: [
                        search.createColumn({ name: "altname", label: "Name" }),
                        search.createColumn({ name: "companyname", label: "CompanyName" }),
                        search.createColumn({ name: "custentity94", label: "MiscellaneousAdditions" }),
                        search.createColumn({ name: "custentity51", sort: search.Sort.DESC, label: "MM Commission Profile" })
                    ]
                });
                var searchResultCount = partnerSearchObjVal.runPaged().count;
                log.debug("partnerSearchObj result count", searchResultCount);
                return dataSets.iterateSavedSearch(partnerSearchObjVal, dataSets.fetchSavedSearchColumn(partnerSearchObjVal, 'label'));
            }


        };
        applyTryCatch(dataSets, "dataSets");

        const exports = {
            /**
             * Defines the Suitelet script trigger point.
             * @param {Object} scriptContext
             * @param {ServerRequest} scriptContext.request - Incoming request
             * @param {ServerResponse} scriptContext.response - Suitelet response
             * @since 2015.2
             */
            onRequest(scriptContext) {
                if (scriptContext.request.method === 'GET') {
                    var scriptObj = runtime.getCurrentScript();
                    var userObj = runtime.getCurrentUser();
                    var DateFormat = userObj.getPreference({
                        name: 'DATEFORMAT'
                    });
                    if (DateFormat) {
                        DateFormat = DateFormat.split("Mon").join("MMM")
                        DateFormat = DateFormat.split("MONTH").join("MMMM")
                    }
                    let salesPartnerValue = scriptContext.request.parameters.salesRepPartner;
                    //log.debug('salesPartnerValue', salesPartnerValue)
                    if (checkForParameter(salesPartnerValue)) {
                        var profile = dataSets.salesRepLookup(salesPartnerValue)
                        if (checkForParameter(profile[0])) {
                            profile = profile[0].value
                        }
                    }
                    let startDate = scriptContext.request.parameters.startDate;
                    let endDate = scriptContext.request.parameters.endDate;
                    if (checkForParameter(endDate)) {

                        startDate = decodeURI(startDate)

                        var newStartDate = moment(startDate).format(DateFormat)
                        var newEndDate = moment(endDate).format(DateFormat)


                        var parsedDate = format.parse({
                            value: startDate,
                            type: format.Type.DATE
                        });


                    }

                    if (newStartDate > newEndDate) {
                        profile = -1
                    }

                    let form = serverWidget.createForm({
                        title: "Commission Report"
                    });
                    form.clientScriptFileId = 772841;

                    let filterGrid = form.addFieldGroup({
                        id: '_filter',
                        label: 'Filters'
                    });

                    log.debug("--salesPartnerValue: ",salesPartnerValue)
                    if(checkForParameter(salesPartnerValue)){
                        let partner = form.addField({
                            id: 'custpage_sales_partner',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Sales Rep Partner',
                        })
                        partner.defaultValue = salesPartnerValue
                        partner.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });

                        let partnerProf = form.addField({
                            id: 'custpage_sales_partner_profile',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Sales Rep Partner Profile',
                        })

                        var partnerProfile = dataSets.salesRepLookup(salesPartnerValue)
                        log.debug("PR partnerProfile: ",partnerProfile)
                        if (partnerProfile.length>0) {
                            partnerProfile = partnerProfile[0].value
                            if(checkForParameter(partnerProfile)){
                                partnerProf.defaultValue = partnerProfile
                                partnerProf.updateDisplayType({
                                    displayType: serverWidget.FieldDisplayType.HIDDEN
                                })
                            }
                        }
                        log.debug("partnerProfile: ",partnerProfile)
                    }

                    let tracfoneArrayField = form.addField({
                        id: 'custpage_tracfone',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'trancFone array',
                        container: '_filter'
                    });
                    tracfoneArrayField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let simSaleArrayField = form.addField({
                        id: 'custpage_simsale',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'simsale array',
                        container: '_filter'
                    });
                    simSaleArrayField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let brandedArrayField = form.addField({
                        id: 'custpage_branded',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'branded array',
                        container: '_filter'
                    });
                    brandedArrayField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let marketArrayField = form.addField({
                        id: 'custpage_market_place',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'market array',
                        container: '_filter'
                    });
                    marketArrayField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let marketplaceSimField = form.addField({
                        id: 'custpage_marketplacesim',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'marketplace sim',
                        container: '_filter'
                    });
                    marketplaceSimField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let extrabonus = form.addField({
                        id: 'custpage_extra_bonus_field',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'extra bonus array',
                        container: '_filter'
                    })
                    extrabonus.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let totalArrayField = form.addField({
                        id: 'custpage_total_array',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'total array',
                        container: '_filter'
                    });
                    totalArrayField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let airTimeArrayField = form.addField({
                        id: 'custpage_air_time_array',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'Air Time Array',
                        container: '_filter'
                    });
                    airTimeArrayField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let activationArrayField = form.addField({
                        id: 'custpage_activation_array',
                        type: serverWidget.FieldType.LONGTEXT,
                        label: 'activation array',
                        container: '_filter'
                    });
                    activationArrayField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                    let partnerField = form.addField({
                        id: 'custpage_sales_rep_partner',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Sales Rep Partners',
                        source: 'partner',
                        container: '_filter'
                    });
                    partnerField.defaultValue = salesPartnerValue

                    let fromDate = form.addField({
                        id: 'custpage_from_date',
                        type: serverWidget.FieldType.DATE,
                        label: 'From Date',
                        source: 'partner',
                        container: '_filter'
                    });
                    if (checkForParameter(newStartDate))
                        fromDate.defaultValue = newStartDate


                    let toDate = form.addField({
                        id: 'custpage_to_date',
                        type: serverWidget.FieldType.DATE,
                        label: 'To Date',
                        source: 'partner',
                        container: '_filter'
                    });
                    if (checkForParameter(newEndDate))
                        toDate.defaultValue = newEndDate

                    let sublistTracfone = form.addSublist({
                        id: 'custpage_tracfone_sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'Tracfone Activation Commission'
                    });
                    exports.sublistTracfoneStructure(sublistTracfone);
                    let sublistSimsale = form.addSublist({
                        id: 'custpage_sim_sale_sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'Sim Sale Commission'
                    });
                    exports.sublistSimsaleStructure(sublistSimsale);
                    let sublistBrandedHandset = form.addSublist({
                        id: 'custpage_branded_handset_sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'Handsets Commission'
                    });
                    exports.sublistBrandedStructure(sublistBrandedHandset);

                    let sublistMarketPlace = form.addSublist({
                        id: 'custpage_branded_market_place_sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'WareHouse Commission'
                    });
                    exports.sublistMarketPlaceStructure(sublistMarketPlace)

                    let sublistMarketPlaceSim = form.addSublist({
                        id: 'custpage_branded_market_place_sim_sublist',
                        type: serverWidget.SublistType.LIST,
                        label: ' Market Place Sim Card Commission'
                    });
                    exports.sublistMarketPlaceSimStructure(sublistMarketPlaceSim)

                    let sublistAirTime = form.addSublist({
                        id: 'custpage_air_time',
                        type: serverWidget.SublistType.LIST,
                        label: 'Air Time Bonus'
                    });
                    exports.sublistAirtimeBonusStructure(sublistAirTime)

                    let sublistActivationBonus = form.addSublist({
                        id: 'custpage_activation_bonus',
                        type: serverWidget.SublistType.LIST,
                        label: 'Activation Bonus'
                    });
                    exports.sublistActivationBonusStrucutre(sublistActivationBonus)

                    let sublistExtraBonus = form.addSublist({
                        id: 'custpage_extra_bonus',
                        type: serverWidget.SublistType.LIST,
                        label: 'Miscellaneous Additions'
                    });
                    exports.sublistExtraBonusStrucutre(sublistExtraBonus)

                    let sublistMarketplaceHandset = form.addSublist({
                        id: 'custpage_marketplace_handset_sublist',
                        type: serverWidget.SublistType.LIST,
                        label: 'Total Commission'
                    });
                    exports.sublisTotalStructure(sublistMarketplaceHandset);

                    let salesRepResults = dataSets.salesRepSearchBasedMMProfile()

                    let groupedSalesReps = dataProcess.groupSalesRepbyMMProfile(salesRepResults);


                    let tracFoneSearchResults = dataSets.tracfoneCommissionRateSearch(salesPartnerValue, startDate, endDate, profile);


                    let tracFoneMangersSearchResults = dataSets.tracfoneReginalManegerSearch();

                    let simSaleSearchResults = dataSets.simSaleSearchBasedMMProfile(salesPartnerValue, profile, startDate, endDate);


                    var tracFoneArray = exports.setsublistTracfone(sublistTracfone, tracFoneSearchResults, tracFoneMangersSearchResults, profile)
                    var simSaleObj = exports.setSublistSimScale(sublistSimsale, simSaleSearchResults, profile)
                    simSaleArrayField.defaultValue = JSON.stringify(simSaleObj)

                    //branded and market place handsets
                    var handsetResult = dataSets.brandedHandsetSearch(salesPartnerValue, profile, startDate, endDate)
                    log.debug('handsetResult now', handsetResult)
                    var marketPlaceResult = dataSets.marketwithBrandedHandsetSearch(salesPartnerValue, profile, startDate, endDate)
                    log.debug('--------------marketPlaceResult--------------',marketPlaceResult)

                    var wareHouseResult = dataSets.marketPlaceSearch(salesPartnerValue, profile, startDate, endDate)

                    var QpayBHSearchResult = dataSets.QPayBrandedSearch(salesPartnerValue, profile, startDate, endDate)


                    var brandedAndMarketPlace = exports.fetchTotalPercetage(marketPlaceResult, handsetResult, wareHouseResult, QpayBHSearchResult)
                    log.debug("ZZZZZZ: ",brandedAndMarketPlace)
                    var handSetArray = exports.setHandsetSublist(sublistBrandedHandset, marketPlaceResult, brandedAndMarketPlace, profile, tracFoneMangersSearchResults, wareHouseResult, brandedAndMarketPlace)

                    brandedArrayField.defaultValue = JSON.stringify(handSetArray)

                    //marketplacesim
                    var marketplaceSimResult = dataSets.marketplaceSimSearch(salesPartnerValue,startDate,endDate,sublistMarketPlaceSim)
                    log.debug("marketplaceSimResult: ",marketplaceSimResult)

                    var marketplaceSimArray = exports.setHandsetSimSublist(sublistMarketPlaceSim,marketplaceSimResult)
                    log.debug("marketplaceSimArray: ",marketplaceSimArray)
                    marketplaceSimField.defaultValue = JSON.stringify(marketplaceSimArray)

                    //Set Warehouse sublist
                    var wareHouseCombined = exports.fetchWareHouseTotalPercentage(marketPlaceResult, handsetResult, wareHouseResult)
                    var marketResult = exports.setMarketPlaceSublist(sublistMarketPlace, wareHouseResult, profile, tracFoneMangersSearchResults, wareHouseCombined,salesPartnerValue)
                    marketArrayField.defaultValue = JSON.stringify(marketResult)



                    //setting hidden field

                    tracfoneArrayField.defaultValue = JSON.stringify(tracFoneArray)

                    //setting air time bonus
                    var airTimeBonusSearch = dataSets.airTimeBonusSearch(salesPartnerValue, profile)
                    var qpayAirTimeBonusSearchval = dataSets.QpayAirtimeBonusSearch(salesPartnerValue, profile, startDate, endDate)
                    let airTimeArray = exports.setAirTimeBonusSublist(sublistAirTime, airTimeBonusSearch, profile, tracFoneMangersSearchResults, qpayAirTimeBonusSearchval)
                    //log.debug('airTimeArray', airTimeArray)
                    airTimeArrayField.defaultValue = JSON.stringify(airTimeArray)

                    var activationBonusSearchval = dataSets.activationBonusSearch(salesPartnerValue, startDate, endDate, profile)

                    var activationArray = exports.setActivationBonusList(sublistActivationBonus, activationBonusSearchval, profile, tracFoneMangersSearchResults)
                    activationArrayField.defaultValue = JSON.stringify(activationArray)
                    var simSaleObj1 = simSaleObj

                    //extra bonus
                    var extraBonusSearch = dataSets.miscellaneousAdditionsSearch(salesPartnerValue, profile)

                    var extraObj = exports.setsublistExtraBonusList(sublistExtraBonus, extraBonusSearch)
                    // extrabonus.defaultValue = JSON.stringify(extraObj)

                    //total sublist
                    var totalArray = exports.setTotalSublist(tracFoneArray, simSaleObj, sublistMarketplaceHandset, marketResult, handSetArray, simSaleObj1, activationArray, airTimeArray, extraObj,marketplaceSimArray)
                    log.debug("TOTAL ARRAY FINAL: ",totalArray)

                    totalArrayField.defaultValue = JSON.stringify(totalArray)

                    scriptContext.response.writePage(form);
                }
            },
            /**
             * Design the tracfone sublist structure
             * @param {Object} sublistTracfone
             */
            sublistTracfoneStructure(sublistTracfone) {

                sublistTracfone.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsv'
                });

                sublistTracfone.addField({
                    id: 'custpage_tracfone_sales_rep',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });
                sublistTracfone.addField({
                    id: 'custpage_tracfone_mkt_manager',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Market Manager'
                });
                sublistTracfone.addField({
                    id: 'custpage_tracfone_mm_profile',
                    type: serverWidget.FieldType.TEXT,
                    label: 'MM Commission Profile'
                });
                sublistTracfone.addField({
                    id: 'custpage_tracfone_tier',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Tracfone Tier'
                });
                sublistTracfone.addField({
                    id: 'custpage_tracfone_sold_items',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Total Sold Items'
                });
                sublistTracfone.addField({
                    id: 'custpage_tracfone_commission_rate',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commission Rate'
                });
                sublistTracfone.addField({
                    id: 'custpage_tracfone_commission_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commission Amount'
                });
            },
            /**
             * Design the simsale sublist structure
             * @param {Object} sublistSimsale
             */
            sublistSimsaleStructure(sublistSimsale) {
                sublistSimsale.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvSim'
                });
                sublistSimsale.addField({
                    id: 'custpage_simsale_sales_rep',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });
                /* sublistSimsale.addField({
             id: 'custpage_simsale_item_type',
             type: serverWidget.FieldType.TEXT,
             label: 'Item Type'
         });*/
                sublistSimsale.addField({
                    id: 'custpage_simsale_sold_items',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Total Sold Items'
                });
                sublistSimsale.addField({
                    id: 'custpage_simsale_commission_rate',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commission Rate'
                });
                sublistSimsale.addField({
                    id: 'custpage_simsale_commission_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commission Amount'
                });
            },
            /**
             * Design the handset Sublist Structure
             * @param {Object} sublistBrandedHandset
             */
            sublistBrandedStructure(sublistBrandedHandset) {
                sublistBrandedHandset.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvBranded'
                });
                sublistBrandedHandset.addField({
                    id: 'custpage_branded_sales_rep',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });
                sublistBrandedHandset.addField({
                    id: 'custpage_branded_sold_items',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Total Sold Items'
                });
                sublistBrandedHandset.addField({
                    id: 'custpage_branded_sum_profit',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Total Sum of Profit'
                });
                sublistBrandedHandset.addField({
                    id: 'custpage_branded_commission_rate',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commission Rate'
                });
                sublistBrandedHandset.addField({
                    id: 'custpage_branded_commission_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commission Amount'
                });
            },
            /**
             * Design the total sublist structure
             * @param {Object} sublistMarketplaceHandset
             */
            sublistMarketPlaceStructure(sublistMarketPlace) {
                sublistMarketPlace.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvMarket'
                });
                sublistMarketPlace.addField({
                    id: 'custpage_marketplace_sales_rep',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });
                sublistMarketPlace.addField({
                    id: 'custpage_marketplace_manegers',
                    type: serverWidget.FieldType.TEXT,
                    label: 'MARKET MANAGER '
                });
                sublistMarketPlace.addField({
                    id: 'custpage_qnty_marketplace',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'TOTAL SOLD ITEMS '
                });
                sublistMarketPlace.addField({
                    id: 'custpage_profit_sum',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TOTAL SUM OF PROFIT'
                });
                sublistMarketPlace.addField({
                    id: 'custpage_profit_commission_rate',
                    type: serverWidget.FieldType.TEXT,
                    label: 'COMMISSION RATE'
                });
                sublistMarketPlace.addField({
                    id: 'custpage_profit_commission_amnt',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'COMMISSION AMOUNT'
                });

            },
            /**
             * Design the total sublist structure of Marketplace SIM Commission
             * @param {Object} sublistMarketPlaceSim
             */
            sublistMarketPlaceSimStructure(sublistMarketPlaceSim){
                sublistMarketPlaceSim.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvMarketSim'
                });
                sublistMarketPlaceSim.addField({
                    id: 'custpage_marketplace_sim_manegers',
                    type: serverWidget.FieldType.TEXT,
                    label: 'MARKET MANAGER '
                });
                sublistMarketPlaceSim.addField({
                    id: 'custpage_marketplace_sim_sales_rep',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });
                sublistMarketPlaceSim.addField({
                    id: 'custpage_qnty_marketplace_sim',
                    type: serverWidget.FieldType.TEXT,
                    label: 'TOTAL SOLD ITEMS '
                });
                sublistMarketPlaceSim.addField({
                    id: 'custpage_marketplace_sim_tier_rate',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Commission Rate'
                });
                sublistMarketPlaceSim.addField({
                    id: 'custpage_marketplace_sim_profit_commission_amnt',
                    type: serverWidget.FieldType.TEXT,
                    label: 'COMMISSION AMOUNT'
                });
            },
            /**
             * Defines the air time bonus structure
             * @param sublistAirTime
             */
            sublistAirtimeBonusStructure(sublistAirTime) {
                sublistAirTime.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvAirTime'
                });
                sublistAirTime.addField({
                    id: 'custpage_airtime_market_maneger',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Market Manager'
                });

                sublistAirTime.addField({
                    id: 'custpage_airtime_sales_rep_',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });

                sublistAirTime.addField({
                    id: 'custpage_pm_air_time',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'PM AIRTIME SUM'
                });
                sublistAirTime.addField({
                    id: 'custpage_air_time_percentage',
                    type: serverWidget.FieldType.PERCENT,
                    label: 'Air Time Bonus Percentage'
                });
                sublistAirTime.addField({
                    id: 'custpage_air_time_bonus',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Air Time Bonus'
                });
                sublistAirTime.addField({
                    id: 'custpage_credit_card_bonus',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Credit Card Bonus'
                });
                sublistAirTime.addField({
                    id: 'custpage_new_door_bonus',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'New Door Bonus'
                });
                sublistAirTime.addField({
                    id: 'custpage_total_bonus',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Total Bonus'
                });
            },
            /**
             * Design the activation bonus sublist structure
             * @param {Object} sublistActivationBonus
             */
            sublistActivationBonusStrucutre(sublistActivationBonus) {
                sublistActivationBonus.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvActivation'
                });
                sublistActivationBonus.addField({
                    id: 'custpage_activation_market_maneger',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });

                sublistActivationBonus.addField({
                    id: 'custpage_activation_sales_rep_',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Market Manager'
                });

                sublistActivationBonus.addField({
                    id: 'custpage_activation_mm_profile',
                    type: serverWidget.FieldType.TEXT,
                    label: 'MM Commission Profile'
                });

                sublistActivationBonus.addField({
                    id: 'custpage_activation_total_sold',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Total Activations'
                });

                sublistActivationBonus.addField({
                    id: 'custpage_activation_proelite_sold',
                    type: serverWidget.FieldType.TEXT,
                    label: 'pro elite & vip activation'
                });

                sublistActivationBonus.addField({
                    id: 'custpage_activation_percentage',
                    type: serverWidget.FieldType.PERCENT,
                    label: 'Activation Percentage'
                });

                sublistActivationBonus.addField({
                    id: 'custpage_activation_bonusval',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Activation Bonus'
                });



            },
            sublistExtraBonusStrucutre(sublistExtraBonus) {
                sublistExtraBonus.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvExtraBonus'
                });
                sublistExtraBonus.addField({
                    id: 'custpage_bonus_sales_rep',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });
                sublistExtraBonus.addField({
                    id: 'custpage_bonus_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Miscellaneous Additions'
                });
            },
            /**
             * Defines the Total subtab strucuture.
             * @param sublistMarketplaceHandset
             */
            sublisTotalStructure(sublistMarketplaceHandset) {
                sublistMarketplaceHandset.addButton({
                    id: 'buttonid',
                    label: 'Download',
                    functionName: 'downloadCsvTotal'
                });
                sublistMarketplaceHandset.addField({
                    id: 'custpage_marketplace_sales_rep',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Sales Rep Partners'
                });
                /*   sublistMarketplaceHandset.addField({
                       id: 'custpage_mm_profile',
                       type: serverWidget.FieldType.TEXT,
                       label: 'MM COMMISSION PROFILE'
                   });*/

                sublistMarketplaceHandset.addField({
                    id: 'custpage_tracfone_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'TRACFONE ACTIVATIONS TOTAL'
                });

                sublistMarketplaceHandset.addField({
                    id: 'custpage_simsale_commission_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'SIMSALE TOTAL'
                });

                sublistMarketplaceHandset.addField({
                    id: 'custpage_branded_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'HANDSET TOTAL'
                });
                sublistMarketplaceHandset.addField({
                    id: 'custpage_warehouse_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'WAREHOUSE TOTAL'
                });

                sublistMarketplaceHandset.addField({
                    id: 'custpage_marketplace_sim_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Market Place SIM Total'
                });
                // sublistMarketplaceHandset.addField({
                //     id: 'custpage_total_sim_commission',
                //     type: serverWidget.FieldType.FLOAT,
                //     label: 'Total SIM Commission'
                // });

                sublistMarketplaceHandset.addField({
                    id: 'custpage_airtime_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'AIR TIME BONUS'
                });

                sublistMarketplaceHandset.addField({
                    id: 'custpage_tracfone_activation_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'ACTIVATION BONUS'
                });

                sublistMarketplaceHandset.addField({
                    id: 'custpage_extra_bonus_total',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Miscellaneous Additions'
                });

                sublistMarketplaceHandset.addField({
                    id: 'custpage_total_profit',
                    type: serverWidget.FieldType.FLOAT,
                    label: 'Total Profit'
                });
            },
            /**
             * Set the trackfone sublist value based on the sales rep's
             * @param {Object} sublistTracfone
             * @param {Object}tracFoneSearchResults
             * @param {Object} tracFoneMangersSearchResults
             * @param {Number} profile
             * @returns {[Array]} tracFoneArray
             */
            setsublistTracfone(sublistTracfone, tracFoneSearchResults, tracFoneMangersSearchResults, profile) {
                if (!checkForParameter(profile)) {
                    profile = 0
                }
                // log.debug('tracFoneSearchResults', tracFoneSearchResults)
                let lineNumber = 0;
                let totalQuantity = 0;
                let northCarolineQuantity = 0;
                let northCarolineQuantityAR = 0;
                let northCarolineQuantityMember = 0;
                let northCarolineQuantityPro = 0;
                let northCarolineQuantityElite = 0;
                let northCarolineQuantityVipPlus = 0;
                let northCarolineQuantityVip = 0;
                let northCarolineQuantityTier = 0;
                let northCarolineQuantityNone = 0
                let northCarolineQuantityExclusive = 0;
                let virginaQuantity = 0;
                let virginaQuantityAR = 0;
                let virginaQuantityMember = 0;
                let virginaQuantityElite = 0;
                let virginaQuantityPro = 0;
                let virginaQuantityVipPlus = 0;
                let virginaQuantityVip = 0;
                let virginaQuantityTier = 0;
                let virginaQuantityNone = 0;
                let virginaQuantityExclusive = 0;
                let IllinoisQuantity = 0;
                let IllinoisQuantityAR = 0;
                let IllinoisQuantityMember = 0;
                let IllinoisQuantityPro = 0;
                let IllinoisQuantityElite = 0;
                let IllinoisQuantityVipPlus = 0;
                let IllinoisQuantityVip = 0;
                let IllinoisQuantityTier = 0;
                let IllinoisQuantityNone = 0;
                let IllinoisQuantityExclusive = 0;
                let NewYorkQuantity = 0;
                let NewYorkQuantityAR = 0;
                let NewYorkQuantityMember = 0;
                let NewYorkQuantityPro = 0;
                let NewYorkQuantityElite = 0;
                let NewYorkQuantityVipPlus = 0;
                let NewYorkQuantityVip = 0;
                let NewYorkQuantityTier = 0;
                let NewYorkQuantityNone = 0;
                let NewYorkQuantityExclusive = 0;
                let txQuantity = 0;
                let txQuantityAR = 0;
                let txQuantityMember = 0;
                let txQuantityPro = 0;
                let txQuantityElite = 0;
                let txQuantityVipPlus = 0;
                let txQuantityVip = 0;
                let txQuantityTier = 0;
                let txQuantityNone = 0;
                let txQuantityExclusive = 0;
                var Chi_Regional_Manager_obj = {};
                let IllinoisQuantity_obj = {};
                let NY_Regional_Mrg = {};
                let NewYorkQuantity_obj = {}
                let TX_Regional_Manager = {}
                let txQuantity_obj = {}
                let NC_Regional_Manager = {}
                let northCarolineQuantity_obj = {}
                let national_Manager_obj = {}
                let national_total = {}
                var prototal = 0
                var arTotal = 0
                var memberTotal = 0
                var eliteTotal = 0
                var vipTotal = 0
                var vipPlusTotal = 0
                var tierTotal = 0
                var tracFoneArray = []
                var noneTotal = 0
                var exclusiveTotal = 0

                var testObj = {}
                var tierArray = exports.testFunction()
                log.debug("tierArray", tierArray)
                for (var i = 0; i < tierArray.length; i++) {
                    testObj[tierArray[i]] = 0
                }
                log.debug("testObj", testObj)


                var itrationArray = ["PRO", "AR", "ELITE", "MEMBER", "EXCLUSIVE", "VIP", "TWER-PIP3", "- None -"];

                for (let k = 0; k < tracFoneSearchResults.length; k++) {
                    var trancFoneObj = {}
                    if (tracFoneSearchResults[k].MMCommissionProfile.value != 1 && tracFoneSearchResults[k].MMCommissionProfile.value != 2 && tracFoneSearchResults[k].MMCommissionProfile.value != 4 && tracFoneSearchResults[k].MMCommissionProfile.value != 5 && tracFoneSearchResults[k].MMCommissionProfile.value != 6) {

                        if (tracFoneSearchResults[k].MarketManager.text != '- None -') {
                            if (profile == 3 || profile == 0) {
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_sales_rep',
                                    line: lineNumber,
                                    value: tracFoneSearchResults[k].salesreppartner.text
                                });

                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_mkt_manager',
                                    line: lineNumber,
                                    value: tracFoneSearchResults[k].MarketManager.text
                                });
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_mm_profile',
                                    line: lineNumber,
                                    value: tracFoneSearchResults[k].MMCommissionProfile.text
                                });
                                trancFoneObj.salesRep = tracFoneSearchResults[k].CompanyName.value
                                trancFoneObj.mmProfile = tracFoneSearchResults[k].MMCommissionProfile.text
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_tier',
                                    line: lineNumber,
                                    value: tracFoneSearchResults[k].TracFoneTeir.text
                                });
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_sold_items',
                                    line: lineNumber,
                                    value: tracFoneSearchResults[k].countInternalID.value
                                });
                                let commissionRate = fixFloat(tracFoneSearchResults[k].CommissionRate.value)
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_commission_rate',
                                    line: lineNumber,
                                    value: commissionRate
                                });
                                let commissionAmount = fixFloat(commissionRate * Number(parseInt(tracFoneSearchResults[k].countInternalID.value)))
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_commission_amount',
                                    line: lineNumber,
                                    value: commissionAmount
                                });
                                trancFoneObj.tier = tracFoneSearchResults[k].TracFoneTeir.text
                                trancFoneObj.quantity = tracFoneSearchResults[k].countInternalID.value
                                trancFoneObj.commissionRate = commissionRate
                                trancFoneObj.totalAmount = commissionAmount
                                tracFoneArray.push(trancFoneObj)
                                // log.debug('tracFoneArray123', tracFoneArray)
                                lineNumber++;
                            }
                            //Class North Carolina
                            if (tracFoneSearchResults[k].Class.value == "North Carolina") {
                                northCarolineQuantity += Number(tracFoneSearchResults[k].countInternalID.value)
                                if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                                    northCarolineQuantityPro += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                                    northCarolineQuantityAR += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                                    northCarolineQuantityElite += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                                    northCarolineQuantityMember += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                                    northCarolineQuantityVipPlus += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                                    northCarolineQuantityVip += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                                    northCarolineQuantityTier += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                                    northCarolineQuantityNone += Number(tracFoneSearchResults[k].countInternalID.value)
                                }


                                for (var i = 0; i < tierArray.length; i++) {
                                    if (tracFoneSearchResults[k].TracFoneTeir.text == tierArray[i]) {
                                        testObj[tierArray[i]] += Number(tracFoneSearchResults[k].countInternalID.value)
                                    }
                                }

                                log.debug("testObj", testObj)

                                log.debug("northCarolineQuantityElite", northCarolineQuantityElite)
                            }

                            //Class Virgina
                            else if (tracFoneSearchResults[k].Class.value == "Virginia") {
                                virginaQuantity += Number(tracFoneSearchResults[k].countInternalID.value)
                                if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                                    virginaQuantityPro += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                                    virginaQuantityAR += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                                    virginaQuantityElite += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                                    virginaQuantityMember += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                                    virginaQuantityVipPlus += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                                    virginaQuantityVip += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                                    virginaQuantityTier += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                                    virginaQuantityNone += Number(tracFoneSearchResults[k].countInternalID.value)
                                }

                            }
                            //Class Illinois
                            else if (tracFoneSearchResults[k].Class.value == "Illinois") {
                                IllinoisQuantity += Number(tracFoneSearchResults[k].countInternalID.value)
                                if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                                    IllinoisQuantityPro += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                                    IllinoisQuantityAR += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                                    IllinoisQuantityElite += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                                    IllinoisQuantityMember += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                                    IllinoisQuantityVipPlus += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                                    IllinoisQuantityVip += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                                    IllinoisQuantityTier += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                                    IllinoisQuantityNone += Number(tracFoneSearchResults[k].countInternalID.value)
                                }
                            }

                            //Class New York
                            else if (tracFoneSearchResults[k].Class.value == "New York") {
                                NewYorkQuantity += Number(tracFoneSearchResults[k].countInternalID.value)
                                if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                                    NewYorkQuantityPro += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                                    NewYorkQuantityAR += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                                    NewYorkQuantityElite += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                                    NewYorkQuantityMember += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                                    NewYorkQuantityVipPlus += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                                    NewYorkQuantityVip += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                                    NewYorkQuantityTier += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                                    NewYorkQuantityNone += Number(tracFoneSearchResults[k].countInternalID.value)
                                }
                            }

                            //Class TX
                            else if (tracFoneSearchResults[k].Class.value == "TX") {
                                txQuantity += Number(tracFoneSearchResults[k].countInternalID.value)
                                if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                                    txQuantityPro += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                                    txQuantityAR += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                                    txQuantityElite += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                                    txQuantityMember += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                                    txQuantityVipPlus += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                                    txQuantityVip += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                                    txQuantityTier += Number(tracFoneSearchResults[k].countInternalID.value)
                                } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                                    txQuantityNone += Number(tracFoneSearchResults[k].countInternalID.value)
                                }
                            } else {

                            }


                        }
                    }

                    /*IllinoisQuantity_obj[]*/
                    else if (tracFoneSearchResults[k].MMCommissionProfile.value == 5) {

                        if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                            Chi_Regional_Manager_obj["PRO"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                prototal = Number(prototal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                            Chi_Regional_Manager_obj["AR"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                arTotal = Number(arTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                            Chi_Regional_Manager_obj["MEMBER"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                memberTotal = Number(memberTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                            Chi_Regional_Manager_obj["EXCLUSIVE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipPlusTotal = Number(vipPlusTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                            Chi_Regional_Manager_obj["ELITE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                eliteTotal = Number(eliteTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                            Chi_Regional_Manager_obj["VIP"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                            Chi_Regional_Manager_obj["TWER-PIP3"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                tierTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                            Chi_Regional_Manager_obj["- None -"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                noneTotal = Number(noneTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        }
                    } else if (tracFoneSearchResults[k].MMCommissionProfile.value == 1) {
                        if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                            NY_Regional_Mrg["PRO"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                prototal = Number(prototal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                            NY_Regional_Mrg["AR"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                arTotal = Number(arTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                            NY_Regional_Mrg["MEMBER"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                memberTotal = Number(memberTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                            NY_Regional_Mrg["EXCLUSIVE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipPlusTotal = Number(vipPlusTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                            NY_Regional_Mrg["ELITE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                eliteTotal = Number(eliteTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                            NY_Regional_Mrg["VIP"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                            NY_Regional_Mrg["TWER-PIP3"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                tierTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                            NY_Regional_Mrg["- None -"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                noneTotal = Number(noneTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        }
                    } else if (tracFoneSearchResults[k].MMCommissionProfile.value == 4) {
                        if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                            TX_Regional_Manager["PRO"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                prototal = Number(prototal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                            TX_Regional_Manager["AR"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                arTotal = Number(arTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                            TX_Regional_Manager["MEMBER"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                memberTotal = Number(memberTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                            TX_Regional_Manager["EXCLUSIVE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipPlusTotal = Number(vipPlusTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                            TX_Regional_Manager["ELITE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                eliteTotal = Number(eliteTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                            TX_Regional_Manager["VIP"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                            TX_Regional_Manager["TWER-PIP3"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                tierTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                            TX_Regional_Manager["- None -"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                noneTotal = Number(noneTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        }
                    } else if (tracFoneSearchResults[k].MMCommissionProfile.value == 6) {
                        if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                            NC_Regional_Manager["PRO"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                prototal = Number(prototal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                            NC_Regional_Manager["AR"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                arTotal = Number(arTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                            NC_Regional_Manager["MEMBER"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                memberTotal = Number(memberTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                            NC_Regional_Manager["EXCLUSIVE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipPlusTotal = Number(vipPlusTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                            NC_Regional_Manager["ELITE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                eliteTotal = Number(eliteTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                            NC_Regional_Manager["VIP"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                            NC_Regional_Manager["TWER-PIP3"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                tierTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                            NC_Regional_Manager["- None -"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                noneTotal = Number(noneTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        }
                    } else if (tracFoneSearchResults[k].MMCommissionProfile.value == 2) {
                        if (tracFoneSearchResults[k].TracFoneTeir.text == "PRO") {
                            national_Manager_obj["PRO"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                prototal = Number(prototal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "AR") {
                            national_Manager_obj["AR"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                arTotal = Number(arTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "MEMBER") {
                            national_Manager_obj["MEMBER"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                memberTotal = Number(memberTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "EXCLUSIVE") {
                            national_Manager_obj["EXCLUSIVE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipPlusTotal = Number(vipPlusTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "ELITE") {
                            national_Manager_obj["ELITE"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                eliteTotal = Number(eliteTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "VIP") {
                            national_Manager_obj["VIP"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                vipTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "TWER-PIP3") {
                            national_Manager_obj["TWER-PIP3"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                tierTotal = Number(vipTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        } else if (tracFoneSearchResults[k].TracFoneTeir.text == "- None -") {
                            national_Manager_obj["- None -"] = tracFoneSearchResults[k].countInternalID.value
                            if (tracFoneSearchResults[k].countInternalID.value) {
                                noneTotal = Number(noneTotal) + Number(tracFoneSearchResults[k].countInternalID.value)
                            }
                        }
                    }


                }





                IllinoisQuantity_obj["PRO"] = IllinoisQuantityPro
                IllinoisQuantity_obj["AR"] = IllinoisQuantityAR
                IllinoisQuantity_obj["MEMBER"] = IllinoisQuantityMember
                IllinoisQuantity_obj["EXCLUSIVE"] = IllinoisQuantityVipPlus
                IllinoisQuantity_obj["ELITE"] = IllinoisQuantityElite
                IllinoisQuantity_obj["VIP"] = IllinoisQuantityVip
                IllinoisQuantity_obj["TWER-PIP3"] = IllinoisQuantityTier
                IllinoisQuantity_obj["- None -"] = IllinoisQuantityNone
                NewYorkQuantity_obj["PRO"] = NewYorkQuantityPro
                NewYorkQuantity_obj["AR"] = NewYorkQuantityAR
                NewYorkQuantity_obj["MEMBER"] = NewYorkQuantityMember
                NewYorkQuantity_obj["EXCLUSIVE"] = NewYorkQuantityVipPlus
                NewYorkQuantity_obj["ELITE"] = NewYorkQuantityElite
                NewYorkQuantity_obj["VIP"] = NewYorkQuantityVip
                NewYorkQuantity_obj["TWER-PIP3"] = NewYorkQuantityTier
                NewYorkQuantity_obj["- None -"] = NewYorkQuantityNone
                txQuantity_obj["PRO"] = txQuantityPro
                txQuantity_obj["AR"] = txQuantityAR
                txQuantity_obj["MEMBER"] = txQuantityMember
                txQuantity_obj["EXCLUSIVE"] = txQuantityVipPlus
                txQuantity_obj["ELITE"] = txQuantityElite
                txQuantity_obj["VIP"] = txQuantityVip
                txQuantity_obj["TWER-PIP3"] = txQuantityTier
                txQuantity_obj["- None -"] = txQuantityNone
                northCarolineQuantity_obj["PRO"] = northCarolineQuantityPro
                northCarolineQuantity_obj["AR"] = northCarolineQuantityAR
                northCarolineQuantity_obj["MEMBER"] = northCarolineQuantityMember
                northCarolineQuantity_obj["EXCLUSIVE"] = northCarolineQuantityVipPlus
                northCarolineQuantity_obj["ELITE"] = northCarolineQuantityElite
                northCarolineQuantity_obj["VIP"] = northCarolineQuantityVip
                northCarolineQuantity_obj["TWER-PIP3"] = northCarolineQuantityTier
                northCarolineQuantity_obj["- None -"] = northCarolineQuantityNone


                prototal = Number(prototal) + Number(IllinoisQuantityPro) + Number(NewYorkQuantityPro) + Number(txQuantityPro) + Number(northCarolineQuantityPro) + Number(virginaQuantityPro)
                arTotal = Number(arTotal) + Number(IllinoisQuantityAR) + Number(NewYorkQuantityAR) + Number(txQuantityAR) + Number(northCarolineQuantityAR) + Number(virginaQuantityAR)
                memberTotal = Number(memberTotal) + Number(IllinoisQuantityMember) + Number(NewYorkQuantityMember) + Number(txQuantityMember) + Number(northCarolineQuantityMember) + Number(virginaQuantityMember)
                eliteTotal = Number(eliteTotal) + Number(NewYorkQuantityElite) + Number(IllinoisQuantityElite) + Number(txQuantityElite) + Number(northCarolineQuantityElite) + Number(virginaQuantityElite)
                vipPlusTotal = Number(vipPlusTotal) + Number(IllinoisQuantityVipPlus) + Number(NewYorkQuantityVipPlus) + Number(txQuantityVipPlus) + Number(northCarolineQuantityVipPlus) + Number(virginaQuantityVipPlus)
                vipTotal = Number(vipTotal) + Number(IllinoisQuantityVip) + Number(NewYorkQuantityVip) + Number(txQuantityVip) + Number(northCarolineQuantityVip) + Number(virginaQuantityVip)
                tierTotal = Number(tierTotal) + Number(IllinoisQuantityTier) + Number(NewYorkQuantityTier) + Number(txQuantityTier) + Number(northCarolineQuantityTier) + Number(virginaQuantityTier)
                noneTotal = Number(noneTotal) + Number(IllinoisQuantityNone) + Number(NewYorkQuantityNone) + Number(txQuantityNone) + Number(northCarolineQuantityNone) + Number(virginaQuantityNone)
                national_total["PRO"] = prototal
                national_total["AR"] = arTotal
                national_total["MEMBER"] = memberTotal
                national_total["ELITE"] = eliteTotal
                national_total["EXCLUSIVE"] = vipPlusTotal
                national_total["VIP"] = vipTotal
                national_total["TWER-PIP3"] = tierTotal
                national_total["- None -"] = noneTotal
                var test;


                if (profile != 3 && profile == 0) {

                    for (var j = 0; j < tracFoneMangersSearchResults.length; j++) {
                        if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 5) { //IllinoisQuantity_obj Chi_Regional_Manager_obj
                            test = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, lineNumber, IllinoisQuantity_obj, Chi_Regional_Manager_obj, j, tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 2) { //national_total national_Manager_obj
                            test = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, test.lineNumber, national_total, national_Manager_obj, j, test.tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 6) { //northCarolineQuantity_obj NC_Regional_Manager
                            test = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, test.lineNumber, northCarolineQuantity_obj, NC_Regional_Manager, j, test.tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 1) { //NewYorkQuantity_obj NY_Regional_Mrg
                            test = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, test.lineNumber, NewYorkQuantity_obj, NY_Regional_Mrg, j, test.tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 4) { //txQuantity_obj  TX_Regional_Manager
                            test = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, test.lineNumber, txQuantity_obj, TX_Regional_Manager, j, test.tracFoneArray)
                        }
                    }
                } else {
                    for (var j = 0; j < tracFoneMangersSearchResults.length; j++) {
                        if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 5 && profile == 5) {
                            test = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, lineNumber, IllinoisQuantity_obj, Chi_Regional_Manager_obj, j, tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 2 && profile == 2) {
                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                tracFoneArray = test.tracFoneArray
                            } else {
                                lineNumber = lineNumber
                                tracFoneArray = tracFoneArray
                            }
                            lineNumber = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, lineNumber, national_total, national_Manager_obj, j, tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 6 && profile == 6) {
                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                tracFoneArray = test.tracFoneArray
                            } else {
                                lineNumber = lineNumber
                                tracFoneArray = tracFoneArray
                            }
                            lineNumber = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, lineNumber, northCarolineQuantity_obj, NC_Regional_Manager, j, tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 1 && profile == 1) {
                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                tracFoneArray = test.tracFoneArray
                            } else {
                                lineNumber = lineNumber
                                tracFoneArray = tracFoneArray
                            }
                            lineNumber = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, lineNumber, NewYorkQuantity_obj, NY_Regional_Mrg, j, tracFoneArray)
                        } else if (tracFoneMangersSearchResults[j].MMCommissionProfile.value == 4 && profile == 4) {
                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                tracFoneArray = test.tracFoneArray
                            } else {
                                lineNumber = lineNumber
                                tracFoneArray = tracFoneArray
                            }
                            lineNumber = exports.sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, lineNumber, txQuantity_obj, TX_Regional_Manager, j, tracFoneArray)
                        }
                    }
                }
                //log.debug('tracFoneArray', tracFoneArray)
                return tracFoneArray;
            },
            setHandsetSimSublist(sublistMarketPlaceSim,marketplaceSimResult){
                try{
                    var marketplaceSimRes = [];
                    var resultArr = [];
                    var marketsimObj = {}
                    var lineNumber = 0
                    if(checkForParameter(marketplaceSimResult)==true){
                        log.debug("marketplaceSimResult.length: ",marketplaceSimResult.length)
                        if(marketplaceSimResult.length>0){
                            for(var i=0;i<marketplaceSimResult.length;i++){

                                var rate = Number(0)
                                // var tierRate;
                                var commission = Number(0)
                                log.debug("marketplaceSimResult[i]: ",marketplaceSimResult[i])

                                if(checkForParameter(marketplaceSimResult[i].InternalID) && checkForParameter(marketplaceSimResult[i].SimCardstier1) && checkForParameter(marketplaceSimResult[i].SimCardstier2)) {
                                    log.debug("INTERNAL 1: ",marketplaceSimResult[i].InternalID.value)
                                    log.debug("TIER1: ",marketplaceSimResult[i].SimCardstier1.value)
                                    if ((Number(marketplaceSimResult[i].InternalID.value) >= Number(marketplaceSimResult[i].SimCardstier1.value)) && (Number(marketplaceSimResult[i].InternalID.value) <= Number(marketplaceSimResult[i].SimCardstier2.value))) {
                                        if(checkForParameter(marketplaceSimResult[i].SimTier1rate)) {
                                            log.debug("AAA: ",marketplaceSimResult[i].SimTier1rate.value)
                                            var tierRate = (marketplaceSimResult[i].SimTier1rate.value).split('%')
                                            log.debug("TT 1: ",tierRate)
                                            if (tierRate.length > 0) {
                                                rate = Number(tierRate[0]) / Number(100)
                                                log.debug("rate 1: ", tierRate[0])
                                                commission = Number(marketplaceSimResult[i].InternalID.value) * Number(tierRate[0])
                                            }
                                            log.debug("Tier1: ",tierRate)
                                        }
                                    }
                                }
                                if(checkForParameter(marketplaceSimResult[i].InternalID) && checkForParameter(marketplaceSimResult[i].SimCardstier2)) {
                                    log.debug("INTERNAL: ",marketplaceSimResult[i].InternalID.value)
                                    log.debug("TIER2: ",marketplaceSimResult[i].SimCardstier2.value)
                                    if (Number(marketplaceSimResult[i].InternalID.value) > Number(marketplaceSimResult[i].SimCardstier2.value)) {
                                        if(checkForParameter(marketplaceSimResult[i].SimTier2Rate)) {
                                            log.debug("AAAA: ",marketplaceSimResult[i].SimTier2Rate)
                                            var tierRate = (marketplaceSimResult[i].SimTier2Rate.value).split('%')
                                            log.debug("TT 2: ",tierRate)
                                            if (tierRate.length > 0) {
                                                rate = Number(tierRate[0])
                                                log.debug("rate 2: ", tierRate[0])
                                                commission = Number(marketplaceSimResult[i].InternalID.value) * Number(tierRate[0])
                                            }
                                            log.debug("Tier2: ",tierRate)
                                        }
                                    }
                                }
                                log.debug("tierRate: ", tierRate)
                                log.debug("commission: ",commission)

                                if(checkForParameter(marketplaceSimResult[i].InternalID)) {
                                    sublistMarketPlaceSim.setSublistValue({
                                        id: 'custpage_qnty_marketplace_sim',
                                        value: marketplaceSimResult[i].InternalID.value,
                                        line: lineNumber
                                    })
                                }
                                if(checkForParameter(marketplaceSimResult[i].SalesRepPartner)){
                                    sublistMarketPlaceSim.setSublistValue({
                                        id: 'custpage_marketplace_sim_sales_rep',
                                        value: marketplaceSimResult[i].SalesRepPartner.text,
                                        line: lineNumber
                                    })
                                }
                                if(checkForParameter(marketplaceSimResult[i].MarketManager)){
                                    sublistMarketPlaceSim.setSublistValue({
                                        id: 'custpage_marketplace_sim_manegers',
                                        value: marketplaceSimResult[i].MarketManager.value,
                                        line: lineNumber
                                    })
                                }

                                sublistMarketPlaceSim.setSublistValue({
                                    id: 'custpage_marketplace_sim_tier_rate',
                                    value: (checkForParameter(tierRate) && tierRate.length>0) ? Number(tierRate[0]).toFixed(2) : Number(0).toFixed(2),
                                    line: lineNumber
                                })
                                sublistMarketPlaceSim.setSublistValue({
                                    id: 'custpage_marketplace_sim_profit_commission_amnt',
                                    value: checkForParameter(commission) ? Number(commission).toFixed(2): Number(0).toFixed(2),
                                    line: lineNumber
                                })

                                marketplaceSimRes.push({
                                    salesRep: marketplaceSimResult[i].SalesRepPartner.text,
                                    marketManager: marketplaceSimResult[i].MarketManager.value,
                                    quantity: marketplaceSimResult[i].InternalID.value,
                                    tier1: marketplaceSimResult[i].SimCardstier1.value,
                                    tier2: marketplaceSimResult[i].SimCardstier2.value,
                                    tier1Rate: marketplaceSimResult[i].SimTier1rate.value,
                                    tier2Rate: marketplaceSimResult[i].SimTier2Rate.value,
                                    rate: (checkForParameter(tierRate) && tierRate.length>0) ? Number(tierRate[0]).toFixed(2) : Number(0).toFixed(2),
                                    commission: checkForParameter(commission) ? Number(commission).toFixed(2): Number(0).toFixed(2)
                                })
                                lineNumber++;
                                marketsimObj.marketplaceSimRes = marketplaceSimRes
                                marketsimObj.lineNumber = lineNumber
                                resultArr.push(marketsimObj)
                            }
                        }
                    }
                    log.debug("marketplaceSimRes: ",resultArr)
                    return resultArr;
                }
                catch (e) {
                    log.debug("Error @ setHandsetSimSublist: ",e.name+" : "+e.message)
                }
            },
            /**
             *
             * @param sublistTracfone
             * @param tracFoneMangersSearchResults
             * @param itrationArray
             * @param lineNumber
             * @param {Object} IllinoisQuantity_obj
             * @param {Object} Chi_Regional_Manager_obj
             * @param {Number} j
             * @param {Array} tracFoneArray
             * @returns {{Array}} tracArray
             */
            sublistTracFoneExtraLine(sublistTracfone, tracFoneMangersSearchResults, itrationArray, lineNumber, IllinoisQuantity_obj, Chi_Regional_Manager_obj, j, tracFoneArray) {

                log.debug("tracFoneMangersSearchResults", tracFoneMangersSearchResults)
                let tracArray = {}

                //log.debug('lineNumber', lineNumber)
                for (var i = 0; i < itrationArray.length; i++) {
                    let tracObj = {}
                    var itrate = itrationArray[i]


                    if (IllinoisQuantity_obj[itrate] > 0 || Chi_Regional_Manager_obj[itrate] > 0) {

                        sublistTracfone.setSublistValue({
                            id: 'custpage_tracfone_sales_rep',
                            line: lineNumber,
                            value: tracFoneMangersSearchResults[j].Name.value
                        });
                        sublistTracfone.setSublistValue({
                            id: 'custpage_tracfone_mkt_manager',
                            line: lineNumber,
                            value: tracFoneMangersSearchResults[j].CompanyName.value
                        });
                        sublistTracfone.setSublistValue({
                            id: 'custpage_tracfone_mm_profile',
                            line: lineNumber,
                            value: tracFoneMangersSearchResults[j].MMCommissionProfile.text
                        });
                        tracObj.salesRep = tracFoneMangersSearchResults[j].CompanyName.value
                        tracObj.mmProfile = tracFoneMangersSearchResults[j].MMCommissionProfile.text

                        if (tracFoneMangersSearchResults[j].MMCommissionProfile.text == 2) {
                            var finalTotal = Number(Chi_Regional_Manager_obj[itrate]) + Number(IllinoisQuantity_obj[itrate])

                            sublistTracfone.setSublistValue({
                                id: 'custpage_tracfone_sold_items',
                                line: lineNumber,
                                value: finalTotal
                            });

                            if (checkForParameter(tracFoneMangersSearchResults[j][itrate])) {
                                var rate = tracFoneMangersSearchResults[j][itrate].value
                            } else {
                                var rate = 0
                            }

                            sublistTracfone.setSublistValue({
                                id: 'custpage_tracfone_commission_rate',
                                line: lineNumber,
                                value: rate
                            });

                            if (checkForParameter(tracFoneMangersSearchResults[j][itrate])) {
                                var totalAmount = fixFloat(Number(finalTotal) * Number(rate))
                            } else {
                                var totalAmount = 0
                            }

                            sublistTracfone.setSublistValue({
                                id: 'custpage_tracfone_commission_amount',
                                line: lineNumber,
                                value: totalAmount
                            });


                            lineNumber++;

                        } else {
                            sublistTracfone.setSublistValue({
                                id: 'custpage_tracfone_tier',
                                line: lineNumber,
                                value: itrate
                            });
                            if (!Chi_Regional_Manager_obj[itrate]) {
                                Chi_Regional_Manager_obj[itrate] = 0
                            } else if (!IllinoisQuantity_obj[itrate]) {
                                IllinoisQuantity_obj[itrate] = 0
                            }
                            var totalQnty = Number(Chi_Regional_Manager_obj[itrate]) + Number(IllinoisQuantity_obj[itrate])
                            //log.debug("totalQnty",totalQnty)
                            sublistTracfone.setSublistValue({
                                id: 'custpage_tracfone_sold_items',
                                line: lineNumber,
                                value: totalQnty
                            });

                            if (checkForParameter(tracFoneMangersSearchResults[j][itrate])) {
                                var rate = tracFoneMangersSearchResults[j][itrate].value
                            } else {
                                var rate = 0
                            }

                            if (rate) {
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_commission_rate',
                                    line: lineNumber,
                                    value: rate
                                });
                            }
                            else {
                                sublistTracfone.setSublistValue({
                                    id: 'custpage_tracfone_commission_rate',
                                    line: lineNumber,
                                    value: 0
                                });
                            }

                            if (checkForParameter(tracFoneMangersSearchResults[j][itrate])) {
                                var totalAmount = fixFloat(Number(totalQnty) * Number(tracFoneMangersSearchResults[j][itrate].value))
                            } else {
                                var totalAmount = 0
                            }

                            sublistTracfone.setSublistValue({
                                id: 'custpage_tracfone_commission_amount',
                                line: lineNumber,
                                value: totalAmount
                            });

                            lineNumber++;
                        }
                        tracObj.tier = itrate
                        tracObj.quantity = totalQnty
                        if (checkForParameter(tracFoneMangersSearchResults[j][itrate])) {
                            tracObj.commissionRate = tracFoneMangersSearchResults[j][itrate].value
                        } else {
                            tracObj.commissionRate = 0
                        }

                        tracObj.totalAmount = totalAmount
                        tracFoneArray.push(tracObj)
                        tracArray.lineNumber = lineNumber
                        tracArray.tracFoneArray = tracFoneArray

                    }

                }
                return tracArray;
            },
            /**
             * Function for setting simscale sublist
             * @param sublistSimsale
             * @param simSaleSearchResults
             * @param profile
             * @returns {[Object]|*}
             */
            setSublistSimScale(sublistSimsale, simSaleSearchResults, profile) {
                let lineNumber = 0
                let NCQuantity = 0
                let NewYorkQuantity = 0
                let TXquantity = 0
                let IllinoisQuantity = 0
                let virginiaQuantity = 0
                let totalFinalQuantity = 0
                let NCQuantityOwn = 0
                let NewYorkQuantityOwn = 0
                let TXquantityOwn = 0
                let IllinoisQuantityOwn = 0
                let virginiaQuantityOwn = 0
                let simSaleArray = []


                if (!checkForParameter(profile)) {
                    profile = 0
                }

                //log.debug('simSaleSearchResults', simSaleSearchResults)
                for (var k = 0; k < simSaleSearchResults.length; k++) {
                    let simSaleObj = {}
                    var rate = 0
                    var simCardTier;

                    if (simSaleSearchResults[k].MMCommissionProfile.value != 1 && simSaleSearchResults[k].MMCommissionProfile.value != 2 && simSaleSearchResults[k].MMCommissionProfile.value != 4 && simSaleSearchResults[k].MMCommissionProfile.value != 5 && simSaleSearchResults[k].MMCommissionProfile.value != 6) {

                        if (profile == 3 || profile == 0) {
                            sublistSimsale.setSublistValue({
                                id: 'custpage_simsale_sales_rep',
                                line: lineNumber,
                                value: simSaleSearchResults[k].Salerep.value
                            });
                            /*  sublistSimsale.setSublistValue({
                          id: 'custpage_simsale_item_type',
                          line: lineNumber,
                          value: simSaleSearchResults[k].ItemType.text
                      });*/

                            sublistSimsale.setSublistValue({
                                id: 'custpage_simsale_sold_items',
                                line: lineNumber,
                                value: simSaleSearchResults[k].Quantity.value
                            });

                            //log.debug('simSaleSearchResults[k].Quantity.value', JSON.parse(simSaleSearchResults[k].Quantity.value))
                            if (checkForParameter(simSaleSearchResults[k].SimCardstier1.value) && checkForParameter(simSaleSearchResults[k].SimCardstier2.value)) {
                                if (Number(simSaleSearchResults[k].Quantity.value) > Number(simSaleSearchResults[k].SimCardstier1.value) && Number(simSaleSearchResults[k].Quantity.value) < Number(simSaleSearchResults[k].SimCardstier2.value)) {
                                    rate = simSaleSearchResults[k].SimTier1rate.value
                                    simCardTier = simSaleSearchResults[k].SimCardstier1.value
                                } else if (Number(simSaleSearchResults[k].Quantity.value) > Number(simSaleSearchResults[k].SimCardstier2.value)) {
                                    rate = simSaleSearchResults[k].SimTier2Rate.value
                                    simCardTier = simSaleSearchResults[k].SimCardstier2.value
                                } else {
                                    rate = 0
                                }
                            }

                            sublistSimsale.setSublistValue({
                                id: 'custpage_simsale_commission_rate',
                                line: lineNumber,
                                value: parseFloat(rate).toFixed(2)
                            });

                            var totalAmount = fixFloat(Number(rate) * Number(parseInt(simSaleSearchResults[k].Quantity.value)))

                            sublistSimsale.setSublistValue({
                                id: 'custpage_simsale_commission_amount',
                                line: lineNumber,
                                value: totalAmount
                            });

                            simSaleObj.salesRep = simSaleSearchResults[k].Salerep.value
                            simSaleObj.mmProfile = simSaleSearchResults[k].MMCommissionProfile.text
                            simSaleObj.quantity = simSaleSearchResults[k].Quantity.value
                            simSaleObj.commissionRate = parseFloat(rate).toFixed(2)
                            simSaleObj.simTier1 = simSaleSearchResults[k].SimCardstier1.value
                            simSaleObj.simTier2 = simSaleSearchResults[k].SimCardstier2.value
                            simSaleObj.simTier1Rate = simSaleSearchResults[k].SimTier1rate.value
                            simSaleObj.simTier2Rate = simSaleSearchResults[k].SimTier2Rate.value
                            simSaleObj.totalAmount = totalAmount

                            simSaleArray.push(simSaleObj)
                            lineNumber++

                        }

                        if (simSaleSearchResults[k].Class.value == "North Carolina") {
                            if (simSaleSearchResults[k].Quantity.value != "" || simSaleSearchResults[k].Quantity.value != " " || simSaleSearchResults[k].Quantity.value != NaN) {
                                NCQuantity = Number(NCQuantity) + Number(simSaleSearchResults[k].Quantity.value)
                            }
                        } else if (simSaleSearchResults[k].Class.value == "Virginia") {
                            if (simSaleSearchResults[k].Quantity.value != "" || simSaleSearchResults[k].Quantity.value != " " || simSaleSearchResults[k].Quantity.value != NaN) {
                                virginiaQuantity = Number(virginiaQuantity) + Number(simSaleSearchResults[k].Quantity.value)
                            }
                        } else if (simSaleSearchResults[k].Class.value == "Illinois") {
                            if (simSaleSearchResults[k].Quantity.value != "" || simSaleSearchResults[k].Quantity.value != " " || simSaleSearchResults[k].Quantity.value != NaN) {
                                IllinoisQuantity = Number(IllinoisQuantity) + Number(simSaleSearchResults[k].Quantity.value)
                            }
                        } else if (simSaleSearchResults[k].Class.value == "New York") {

                            if (simSaleSearchResults[k].Quantity.value != "" || simSaleSearchResults[k].Quantity.value != " " || simSaleSearchResults[k].Quantity.value != NaN) {
                                NewYorkQuantity = Number(NewYorkQuantity) + Number(simSaleSearchResults[k].Quantity.value)
                            }
                        } else if (simSaleSearchResults[k].Class.value == "TX") {
                            if (simSaleSearchResults[k].Quantity.value != "" || simSaleSearchResults[k].Quantity.value != " " || simSaleSearchResults[k].Quantity.value != NaN) {
                                TXquantity = Number(TXquantity) + Number(simSaleSearchResults[k].Quantity.value)
                            }
                        }
                    } else if (simSaleSearchResults[k].MMCommissionProfile.value == 1) {
                        if (checkForParameter(simSaleSearchResults[k].Quantity.value)) {
                            NewYorkQuantityOwn = (NewYorkQuantityOwn) + Number(simSaleSearchResults[k].Quantity.value)
                        }
                    } else if (simSaleSearchResults[k].MMCommissionProfile.value == 6) {
                        if (checkForParameter(simSaleSearchResults[k].Quantity.value)) {
                            NCQuantityOwn = NCQuantityOwn + Number(simSaleSearchResults[k].Quantity.value)
                        }
                    } else if (simSaleSearchResults[k].MMCommissionProfile.value == 4) {
                        if (checkForParameter(simSaleSearchResults[k].Quantity.value)) {
                            TXquantityOwn = simSaleSearchResults[k].Quantity.value
                        }
                    } else if (simSaleSearchResults[k].MMCommissionProfile.value == 5) {
                        if (checkForParameter(simSaleSearchResults[k].Quantity.value)) {
                            IllinoisQuantityOwn = IllinoisQuantityOwn + Number(simSaleSearchResults[k].Quantity.value)
                        }
                    } else if (simSaleSearchResults[k].MMCommissionProfile.value == 2) {
                        if (checkForParameter(simSaleSearchResults[k].Quantity.value)) {
                            virginiaQuantityOwn = virginiaQuantityOwn + Number(simSaleSearchResults[k].Quantity.value)
                        }
                    }

                    /*  }*/

                }


                NCQuantity = Number(NCQuantity) + Number(NCQuantityOwn)
                TXquantity = Number(TXquantity) + Number(TXquantityOwn)
                IllinoisQuantity = Number(IllinoisQuantity) + Number(IllinoisQuantityOwn)
                NewYorkQuantity = Number(NewYorkQuantity) + Number(NewYorkQuantityOwn)
                virginiaQuantity = Number(virginiaQuantity) + Number(virginiaQuantityOwn)
                var test

                totalFinalQuantity = Number(totalFinalQuantity) + Number(NCQuantity) + Number(TXquantity) + Number(IllinoisQuantity) + Number(NewYorkQuantity) + Number(virginiaQuantity)

                var manegerSearch = dataSets.tracfoneReginalManegerSearch()



                if (profile != 3 && profile == 0) {

                    for (var k = 0; k < manegerSearch.length; k++) {
                        var simSaleObj = {}

                        if (checkForParameter(manegerSearch[k].MMCommissionProfile.value)) {

                            if (manegerSearch[k].MMCommissionProfile.value == 5) { //1 IllinoisQuantity
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, IllinoisQuantity, lineNumber, k, simSaleArray)

                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 2) { //6 totalFinalQuantity
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, totalFinalQuantity, test.lineNumber, k, test.simSaleArray)

                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 6) { //4 NCQuantity
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, NCQuantity, test.lineNumber, k, test.simSaleArray)

                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 1) { //5 NewYorkQuantity
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, NewYorkQuantity, test.lineNumber, k, test.simSaleArray)

                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 4) { //2 TXquantity
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, TXquantity, test.lineNumber, k, test.simSaleArray)

                            }
                            //}
                        }
                    }
                } else {
                    for (var k = 0; k < manegerSearch.length; k++) {


                        if (checkForParameter(manegerSearch[k].MMCommissionProfile.value)) {

                            //log.debug('simSaleSearchResults[k].MMCommissionProfile.value', simSaleSearchResults[k].MMCommissionProfile.value)
                            if (manegerSearch[k].MMCommissionProfile.value == 5 && profile == 5) { //1
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, IllinoisQuantity, lineNumber, k, simSaleArray)

                            }
                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                simSaleArray = test.simSaleArray
                            } else {
                                lineNumber = lineNumber
                                simSaleArray = simSaleArray
                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 2 && profile == 2) { //6
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, totalFinalQuantity, lineNumber, k, simSaleArray)

                            }

                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                simSaleArray = test.simSaleArray
                            } else {
                                lineNumber = lineNumber
                                simSaleArray = simSaleArray
                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 6 && profile == 6) { //4
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, NCQuantity, lineNumber, k, simSaleArray)

                            }

                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                simSaleArray = test.simSaleArray
                            } else {
                                lineNumber = lineNumber
                                simSaleArray = simSaleArray
                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 1 && profile == 1) { //5
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, NewYorkQuantity, lineNumber, k, simSaleArray)

                            }

                            if (checkForParameter(test)) {
                                lineNumber = test.lineNumber
                                simSaleArray = test.simSaleArray
                            } else {
                                lineNumber = lineNumber
                                simSaleArray = simSaleArray
                            }
                            if (manegerSearch[k].MMCommissionProfile.value == 4 && profile == 4) { //2
                                test = exports.setManegerSimScale(sublistSimsale, manegerSearch, TXquantity, lineNumber, k, simSaleArray)

                            }


                        }
                    }
                }

                if (checkForParameter(test)) {
                    return test.simSaleArray;
                } else {
                    return simSaleArray;
                }

            },
            /**
             * Function for setting reginal and national managers in simscale sublist
             * @param sublistSimsale
             * @param simSaleSearchResults
             * @param quantity
             * @param lineNumber
             * @param {Number }k
             * @param {Array} simSaleArray
             * @returns {{Object}}
             */
            setManegerSimScale(sublistSimsale, simSaleSearchResults, quantity, lineNumber, k, simSaleArray) {
                var rate = 0
                let newQuantity = 0
                let simArray = {}
                let simObj = {}
                sublistSimsale.setSublistValue({
                    id: 'custpage_simsale_sales_rep',
                    line: lineNumber,
                    value: simSaleSearchResults[k].CompanyName.value
                });
                simObj.salesRep = simSaleSearchResults[k].CompanyName.value
                simObj.mmProfile = simSaleSearchResults[k].MMCommissionProfile.text
                if (checkForParameter(quantity)) {
                    newQuantity = Number(quantity)
                }

                sublistSimsale.setSublistValue({
                    id: 'custpage_simsale_sold_items',
                    line: lineNumber,
                    value: newQuantity
                });

                if (checkForParameter(simSaleSearchResults[k].SimCardstier1.value) && checkForParameter(simSaleSearchResults[k].SimCardstier2.value)) {
                    if (Number(newQuantity) > Number(simSaleSearchResults[k].SimCardstier1.value) && Number(newQuantity) < Number(simSaleSearchResults[k].SimCardstier2.value)) {
                        rate = simSaleSearchResults[k].SimTier1rate.value
                    } else if (Number(newQuantity) > Number(simSaleSearchResults[k].SimCardstier2.value)) {
                        rate = simSaleSearchResults[k].SimTier2Rate.value
                    } else {
                        rate = 0
                    }
                }

                sublistSimsale.setSublistValue({
                    id: 'custpage_simsale_commission_rate',
                    line: lineNumber,
                    value: rate
                });

                var totalAmount = fixFloat(Number(rate) * Number(parseInt(newQuantity)))

                sublistSimsale.setSublistValue({
                    id: 'custpage_simsale_commission_amount',
                    line: lineNumber,
                    value: totalAmount
                });
                simObj.quantity = newQuantity
                simObj.commissionRate = parseFloat(rate).toFixed(2)
                simObj.totalAmount = totalAmount
                simSaleArray.push(simObj)
                lineNumber++
                simArray.lineNumber = lineNumber
                simArray.simSaleArray = simSaleArray

                return simArray;

            },
            /**
             * Function for branded handset commission setup.
             * @param sublistBrandedHandset
             * @param marketPlaceResult
             * @param handsetResult1
             * @param profile
             * @param manegerSearch
             * @param wareHouseResult
             * @param handsetResult
             * @returns {[]}
             */
            setHandsetSublist(sublistBrandedHandset, marketPlaceResult, handsetResult1, profile, manegerSearch, wareHouseResult, handsetResult) {
                try {
                    let testArray = []
                    for (var i = 0; i < marketPlaceResult.length; i++) {
                        let flagChecker = false
                        for (var j = 0; j < handsetResult1.length; j++) {
                            if (checkForParameter(handsetResult1[j].MarketManager) && (marketPlaceResult[i].MarketManager)) {
                                if (handsetResult1[j].MarketManager.value == marketPlaceResult[i].MarketManager.value) {
                                    handsetResult1[j].marketQuantity = marketPlaceResult[i].InternalID
                                    handsetResult1[j].marketCommsion = marketPlaceResult[i].CurrentParentCommission
                                    flagChecker = true
                                    break;
                                }
                            }
                        }


                        if (flagChecker == false) {
                            testArray.push(i)
                        }
                    }


                    let lineNumber = 0
                    let testval = []
                    let NChandsetQuantity = 0
                    let NChandsetCommision = 0
                    let NYhandsetQuantity = 0
                    let NYhandsetCommision = 0
                    let CHIhandsetQuantity = 0
                    let CHIhandsetCommision = 0
                    let TXhandsetQuantity = 0
                    let TXhandsetCommision = 0
                    let nationalQuantity = 0
                    let nationalCommision = 0
                    let NYOwn = 0;
                    let NCOwn = 0;
                    let TXOwn = 0;
                    let CHIOwn = 0;
                    let NationalOwn = 0;
                    let NYOwnCommision = 0;
                    let NCOwnCommision = 0
                    let CHIOwnCommision = 0
                    let TXOwnCommision = 0
                    let NationalOwnCommision = 0;
                    let nationalTotal = 0;
                    let txCombinedTotal = 0;
                    let nyCombinedTotal = 0;
                    let ncCombinedTotal = 0;
                    let chiCombinedTotal = 0;
                    let virginaCombinedTotal = 0;
                    let nationCombinedTotal = 0;
                    var handSetArray = []
                    var test
                    let virginiaQnty = 0;
                    let virginiaCommission = 0;

                    if (!checkForParameter(profile)) {
                        profile = 0
                    }

                    // log.debug('handsetResult',handsetResult+" , " + handsetResult.length)
                    log.debug('!!!!!!!!!!!!!handsetResult!!!!!!!!!!!',handsetResult)

                    for (var i = 0; i < handsetResult.length; i++) {
                        // log.debug('handsetResult',handsetResult[i])
                        let handsetQuantity = 0
                        let handsetCommision = 0
                        let totalCombinedAmnt = 0
                        var handsetObj = {}
                        if (handsetResult[i].MMCommissionProfile.value != 1 && handsetResult[i].MMCommissionProfile.value != 2 && handsetResult[i].MMCommissionProfile.value != 4 && handsetResult[i].MMCommissionProfile.value != 5 && handsetResult[i].MMCommissionProfile.value != 6) {


                            /*if (handsetResult[i].Class.text == "New York") {
                                log.debug('test newyork', handsetResult[i])
                            }*/
                            //calculate handset qunatity

                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else if (checkForParameter(handsetResult[i].qpayQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else {
                                handsetQuantity = Number(handsetResult[i].InternalID.value)
                            }
                            log.debug("handsetQuantity", handsetQuantity)
                            log.debug("handsetResult[i]", handsetResult[i])

                            //calculate handset commission
                            if (checkForParameter(handsetResult[i].MACommission)) {
                                if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                                    handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value) + Number(handsetResult[i].qpayCommsion.value)
                                } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                                    log.debug("handsetResult[i].marketCommsion", handsetResult[i].marketCommsion)
                                    handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value)
                                } else if (checkForParameter(handsetResult[i].qpayCommsion)) {
                                    handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].qpayCommsion.value)
                                } else {
                                    handsetCommision = Number(handsetResult[i].MACommission.value)
                                }
                            }
                            log.debug("handsetCommision", handsetCommision)

                            //set the combined (warehouse total) to find the percentage
                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                totalCombinedAmnt = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                                totalCombinedAmnt = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                totalCombinedAmnt = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].qpayQuantity.value)

                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                totalCombinedAmnt = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                totalCombinedAmnt = Number(handsetResult[i].InternalID.value)
                            }
                            log.debug("totalCombinedAmnt", totalCombinedAmnt)


                            if (profile == 3 || profile == 0) {
                                //log.debug('checkForParameter(handsetResult[i].qpayQuantity)',checkForParameter(handsetResult[i].MarketManager))

                                sublistBrandedHandset.setSublistValue({
                                    id: 'custpage_branded_sales_rep',
                                    line: lineNumber,
                                    value: handsetResult[i].MarketManager.value
                                });
                                if (handsetResult[i].MarketManager.value == "SolomonS") {
                                    let temp = (handsetResult[i].MarketManager.value).toUpperCase();
                                    handsetObj.salesRep = temp
                                } else {
                                    handsetObj.salesRep = handsetResult[i].MarketManager.value
                                }

                                handsetObj.mmProfile = handsetResult[i].MMCommissionProfile.text


                                sublistBrandedHandset.setSublistValue({
                                    id: 'custpage_branded_sold_items',
                                    line: lineNumber,
                                    value: handsetQuantity
                                });


                                sublistBrandedHandset.setSublistValue({
                                    id: 'custpage_branded_sum_profit',
                                    line: lineNumber,
                                    value: fixFloat(handsetCommision)
                                });
                                log.debug("test loop1")

                                var percentage = "0.00"
                                if (checkForParameter(handsetResult[i].BrandedHSTier1) && checkForParameter(handsetResult[i].BrandedHSTier2)) {
                                    if (totalCombinedAmnt <= handsetResult[i].BrandedHSTier1.value) {
                                        percentage = handsetResult[i].BrandedHSTier1rate.value
                                    } else if (totalCombinedAmnt > handsetResult[i].BrandedHSTier2.value) {
                                        percentage = handsetResult[i].BrandedHSTier2rate.value
                                    }
                                    log.debug("enter percentage")
                                }
                                if (!checkForParameter(percentage)) {
                                    percentage = "0.00%"
                                }

                                log.debug("percentage", percentage)
                                sublistBrandedHandset.setSublistValue({
                                    id: 'custpage_branded_commission_rate',
                                    line: lineNumber,
                                    value: percentage
                                });
                                log.debug("test loop2.5")
                                percentage = percentage.split("%")
                                percentage = percentage[0]
                                let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100

                                sublistBrandedHandset.setSublistValue({
                                    id: 'custpage_branded_commission_amount',
                                    line: lineNumber,
                                    value: fixFloat(totalCommision)
                                });
                                log.debug("test loop3")
                                handsetObj.quantity = handsetQuantity
                                handsetObj.profit = handsetCommision
                                handsetObj.rate = percentage
                                handsetObj.totalAmount = totalCommision
                                lineNumber++;
                                handSetArray.push(handsetObj)

                            }

                            if (handsetResult[i].Class.text == "TX") {
                                TXhandsetQuantity = Number(TXhandsetQuantity) + Number(handsetQuantity)
                                TXhandsetCommision = Number(TXhandsetCommision) + Number(handsetCommision)
                                txCombinedTotal = Number(txCombinedTotal) + Number(totalCombinedAmnt)
                            } else if (handsetResult[i].Class.text == "New York") {
                                NYhandsetQuantity = Number(NYhandsetQuantity) + Number(handsetQuantity)
                                NYhandsetCommision = Number(NYhandsetCommision) + Number(handsetCommision)
                                nyCombinedTotal = Number(nyCombinedTotal) + Number(totalCombinedAmnt)
                            } else if (handsetResult[i].Class.text == "North Carolina") {
                                NChandsetQuantity = Number(NChandsetQuantity) + Number(handsetQuantity)
                                NChandsetCommision = Number(NChandsetCommision) + Number(handsetCommision)
                                ncCombinedTotal = Number(ncCombinedTotal) + Number(totalCombinedAmnt)
                            } else if (handsetResult[i].Class.text == "Illinois") {
                                CHIhandsetQuantity = Number(CHIhandsetQuantity) + Number(handsetQuantity)
                                CHIhandsetCommision = Number(CHIhandsetCommision) + Number(handsetCommision)
                                chiCombinedTotal = Number(chiCombinedTotal) + Number(totalCombinedAmnt)
                            } else if (handsetResult[i].Class.text == "Virginia") {
                                virginiaQnty = Number(virginiaQnty) + Number(handsetQuantity)
                                virginiaCommission = Number(virginiaCommission) + Number(handsetCommision)
                                virginaCombinedTotal = Number(virginaCombinedTotal) + Number(totalCombinedAmnt)
                            }

                        } else if (handsetResult[i].MMCommissionProfile.value == 1) {
                            log.debug('new york', handsetResult[i])
                            let handsetQuantity = 0

                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                handsetQuantity = Number(handsetResult[i].InternalID.value)
                            }

                            //////////
                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                                nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].InternalID.value)
                            }

                            //
                            let handsetCommision = 0
                            if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value) + Number(handsetResult[i].qpayCommsion.value)
                            } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value)
                            } else {
                                handsetCommision = Number(handsetResult[i].MACommission.value)
                            }


                            NYOwn = Number(NYOwn) + Number(handsetQuantity)
                            NYOwnCommision = Number(NYOwnCommision) + Number(handsetCommision)

                        } else if (handsetResult[i].MMCommissionProfile.value == 6) {
                            let handsetQuantity = 0
                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                handsetQuantity = Number(handsetResult[i].InternalID.value)
                            }

                            ///////

                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                                ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].InternalID.value)
                            }

                            let handsetCommision = 0
                            if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value) + Number(handsetResult[i].qpayCommsion.value)
                            } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value)
                            } else {
                                handsetCommision = Number(handsetResult[i].MACommission.value)
                            }
                            /////


                            NCOwn = Number(NCOwn) + Number(handsetQuantity)
                            NCOwnCommision = Number(NCOwnCommision) + Number(handsetCommision)

                        } else if (handsetResult[i].MMCommissionProfile.value == 4) {
                            let handsetQuantity = 0
                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                handsetQuantity = Number(handsetResult[i].InternalID.value)
                            }

                            ///////

                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                                txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].InternalID.value)
                            }

                            //
                            let handsetCommision = 0
                            if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value) + Number(handsetResult[i].qpayCommsion.value)
                            } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value)
                            } else {
                                handsetCommision = Number(handsetResult[i].MACommission.value)
                            }


                            TXOwn = Number(TXOwn) + Number(handsetQuantity)
                            TXOwnCommision = Number(TXOwnCommision) + Number(handsetCommision)

                        } else if (handsetResult[i].MMCommissionProfile.value == 5) {
                            let handsetQuantity = 0
                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                handsetQuantity = Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                handsetQuantity = Number(handsetResult[i].InternalID.value)
                            }

                            //////////
                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                                chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].InternalID.value)
                            }

                            //
                            let handsetCommision = 0
                            if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value) + Number(handsetResult[i].qpayCommsion.value)
                            } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                                handsetCommision = Number(handsetResult[i].MACommission.value) + Number(handsetResult[i].marketCommsion.value)
                            } else {
                                handsetCommision = Number(handsetResult[i].MACommission.value)
                            }
                            ////


                            CHIOwn = Number(CHIOwn) + Number(handsetQuantity)
                            CHIOwnCommision = Number(CHIhandsetCommision) + Number(handsetCommision)

                        } else if (handsetResult[i].MMCommissionProfile.value == 2) {

                            if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                                NationalOwn = Number(NationalOwn) + Number(handsetResult[i].marketCommsion.value) + Number(handsetResult[i].qpayCommsion.value)
                                NationalOwnCommision = Number(NationalOwnCommision) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].qpayQuantity.value)

                            } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                                NationalOwn = Number(NationalOwn) + Number(handsetResult[i].marketCommsion.value)
                                NationalOwnCommision = Number(NationalOwnCommision) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)

                            }
                            //
                            if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                                nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value) + Number(handsetResult[i].qpayQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                                nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value) + Number(handsetResult[i].warehouseQuantity.value)
                            } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                                nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].InternalID.value) + Number(handsetResult[i].marketQuantity.value)
                            } else {
                                nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].InternalID.value)
                            }

                            // }
                        }

                    }
                    //log.debug("test loop4")
                    nationalTotal = Number(NationalOwn) + Number(CHIOwn) + Number(TXOwn) + Number(NCOwn) + Number(NYOwn)
                    nationalQuantity = Number(CHIhandsetQuantity) + Number(NChandsetQuantity) + Number(NYhandsetQuantity) + Number(TXhandsetQuantity) + Number(virginiaQnty)
                    nationalCommision = Number(CHIhandsetCommision) + Number(NChandsetCommision) + Number(NYhandsetCommision) + Number(TXhandsetCommision) + Number(virginiaCommission)
                    NationalOwnCommision = Number(NationalOwnCommision) + Number(CHIOwnCommision) + Number(TXOwnCommision) + Number(NCOwnCommision) + Number(NYOwnCommision)
                    nationCombinedTotal = Number(nationCombinedTotal) + Number(CHIhandsetQuantity) + Number(NChandsetQuantity) + Number(NYhandsetQuantity) + Number(TXhandsetQuantity) + Number(virginiaQnty)


                    // log.debug('TXOwn', TXOwn)
                    // log.debug('TXhandsetQuantity', TXhandsetQuantity)
                    // log.debug('TXhandsetCommision', TXhandsetCommision)
                    // log.debug('TXOwnCommision', TXOwnCommision)


                    if (profile != 3 && profile == 0) {

                        for (var j = 0; j < manegerSearch.length; j++) {

                            if (checkForParameter(manegerSearch[j].MMCommissionProfile)) {
                                if (manegerSearch[j].MMCommissionProfile.value == 5) {
                                    test = exports.setBrandedManager(sublistBrandedHandset, lineNumber, CHIOwn, CHIhandsetQuantity, CHIhandsetCommision, CHIOwnCommision, j, handsetResult, manegerSearch, handSetArray, chiCombinedTotal)
                                } else if (manegerSearch[j].MMCommissionProfile.value == 2) {
                                    test = exports.setBrandedManager(sublistBrandedHandset, test.lineNumber, nationalTotal, nationalQuantity, nationalCommision, NationalOwnCommision, j, handsetResult, manegerSearch, test.handSetArray, nationCombinedTotal)
                                } else if (manegerSearch[j].MMCommissionProfile.value == 6) {
                                    test = exports.setBrandedManager(sublistBrandedHandset, test.lineNumber, NCOwn, NChandsetQuantity, NChandsetCommision, NCOwnCommision, j, handsetResult, manegerSearch, test.handSetArray, ncCombinedTotal)
                                } else if (manegerSearch[j].MMCommissionProfile.value == 1) {
                                    test = exports.setBrandedManager(sublistBrandedHandset, test.lineNumber, NYOwn, NYhandsetQuantity, NYhandsetCommision, NYOwnCommision, j, handsetResult, manegerSearch, test.handSetArray, nyCombinedTotal)
                                } else if (manegerSearch[j].MMCommissionProfile.value == 4) {
                                    test = exports.setBrandedManager(sublistBrandedHandset, test.lineNumber, TXOwn, TXhandsetQuantity, TXhandsetCommision, TXOwnCommision, j, handsetResult, manegerSearch, test.handSetArray, txCombinedTotal)
                                }
                            }

                        }
                    } else {

                        for (var j = 0; j < manegerSearch.length; j++) {

                            if (checkForParameter(manegerSearch[j].MMCommissionProfile.value)) {
                                if (manegerSearch[j].MMCommissionProfile.value == 5 && profile == 5) {
                                    var interObj = exports.setBrandedManager(sublistBrandedHandset, lineNumber, CHIOwn, CHIhandsetQuantity, CHIhandsetCommision, CHIOwnCommision, j, handsetResult, manegerSearch, handSetArray, chiCombinedTotal)
                                    if (checkForParameter(interObj)) {
                                        lineNumber = interObj.lineNumber
                                        handSetArray = interObj["handSetArray"]
                                    } else {
                                        lineNumber = lineNumber
                                        handSetArray = simSaleArray
                                    }
                                } else if (manegerSearch[j].MMCommissionProfile.value == 2 && profile == 2) {
                                    var interObj = exports.setBrandedManager(sublistBrandedHandset, lineNumber, nationalTotal, nationalQuantity, nationalCommision, NationalOwnCommision, j, handsetResult, manegerSearch, handSetArray, nationCombinedTotal)
                                    log.debug('interObj', interObj)
                                    if (checkForParameter(interObj)) {
                                        lineNumber = interObj.lineNumber
                                        handSetArray = interObj["handSetArray"]
                                    } else {
                                        lineNumber = lineNumber
                                        handSetArray = handSetArray
                                    }
                                } else if (manegerSearch[j].MMCommissionProfile.value == 6 && profile == 6) {
                                    var interObj = exports.setBrandedManager(sublistBrandedHandset, lineNumber, NCOwn, NChandsetQuantity, NChandsetCommision, NCOwnCommision, j, handsetResult, manegerSearch, handSetArray, ncCombinedTotal)
                                    if (checkForParameter(interObj)) {
                                        lineNumber = interObj.lineNumber
                                        handSetArray = interObj["handSetArray"]
                                    } else {
                                        lineNumber = lineNumber
                                        handSetArray = handSetArray
                                    }
                                } else if (manegerSearch[j].MMCommissionProfile.value == 1 && profile == 1) {
                                    var interObj = exports.setBrandedManager(sublistBrandedHandset, lineNumber, NYOwn, NYhandsetQuantity, NYhandsetCommision, NYOwnCommision, j, handsetResult, manegerSearch, handSetArray, nyCombinedTotal)
                                    if (checkForParameter(interObj)) {
                                        lineNumber = interObj.lineNumber
                                        handSetArray = interObj["handSetArray"]
                                    } else {
                                        lineNumber = lineNumber
                                        handSetArray = handSetArray
                                    }
                                } else if (manegerSearch[j].MMCommissionProfile.value == 4 && profile == 4) {
                                    var interObj = exports.setBrandedManager(sublistBrandedHandset, lineNumber, TXOwn, TXhandsetQuantity, TXhandsetCommision, TXOwnCommision, j, handsetResult, manegerSearch, handSetArray, txCombinedTotal)
                                    if (checkForParameter(interObj)) {
                                        lineNumber = interObj.lineNumber
                                        handSetArray = interObj["handSetArray"]
                                    } else {
                                        lineNumber = lineNumber
                                        handSetArray = handSetArray
                                    }
                                }
                            }

                        }

                    }
                    return handSetArray;
                }
                catch (e) {
                    log.debug("error@setHandset", e)
                }
            },
            setBrandedManager(sublistBrandedHandset, lineNumber, CHIOwn, CHIhandsetQuantity, CHIhandsetCommision, CHIOwnCommision, j, handsetResult, manegerSearch, handSetArray, combinedTotal) {

                let handArray = {}
                let handObj = {}

                sublistBrandedHandset.setSublistValue({
                    id: 'custpage_branded_sales_rep',
                    line: lineNumber,
                    value: manegerSearch[j].CompanyName.value
                });

                handObj.salesRep = manegerSearch[j].CompanyName.value
                handObj.mmProfile = manegerSearch[j].MMCommissionProfile.text

                let handsetQuantity = 0
                handsetQuantity = Number(CHIOwn) + Number(CHIhandsetQuantity)

                sublistBrandedHandset.setSublistValue({
                    id: 'custpage_branded_sold_items',
                    line: lineNumber,
                    value: handsetQuantity
                });

                let handsetCommision = 0

                handsetCommision = Number(CHIhandsetCommision) + Number(CHIOwnCommision)

                sublistBrandedHandset.setSublistValue({
                    id: 'custpage_branded_sum_profit',
                    line: lineNumber,
                    value: fixFloat(handsetCommision)
                });

                let percentage = "0.00%"
                if (checkForParameter(manegerSearch[j].BrandedHSTier1.value) && checkForParameter(manegerSearch[j].BrandedHSTier2.value)) {
                    if (combinedTotal <= manegerSearch[j].BrandedHSTier1.value) {
                        percentage = manegerSearch[j].BrandedHSTier1rate.value
                    } else if (combinedTotal > manegerSearch[j].BrandedHSTier2.value) {
                        percentage = manegerSearch[j].BrandedHSTier2rate.value
                    }
                }


                sublistBrandedHandset.setSublistValue({
                    id: 'custpage_branded_commission_rate',
                    line: lineNumber,
                    value: percentage
                });

                percentage = percentage.split("%")
                percentage = percentage[0]
                let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100

                sublistBrandedHandset.setSublistValue({
                    id: 'custpage_branded_commission_amount',
                    line: lineNumber,
                    value: fixFloat(totalCommision)
                });
                handObj.quantity = handsetQuantity
                handObj.profit = handsetCommision
                handObj.rate = percentage
                handObj.totalAmount = totalCommision
                handSetArray.push(handObj)
                lineNumber++
                handArray.lineNumber = lineNumber
                handArray.handSetArray = handSetArray


                log.debug('handArray', handArray)
                return handArray;
            },
            /**
             * Defines the branded handset subtab and set the commission values for all the market managers.
             * @param sublistMarketPlace
             * @param wareHouseCombined
             * @param profile
             * @param manegerSearch
             * @param marketPlaceResult
             * @returns {[]|*}
             */
            setMarketPlaceSublist(sublistMarketPlace, wareHouseCombined, profile, manegerSearch, marketPlaceResult,salesPartnerValue) {
                let lineNumber = 0;

                let NYRegularManegerTotal = 0
                let NCRegularManegerTotal = 0
                let TXRegularManegerTotal = 0
                let CHIRegularManegerTotal = 0
                let NationalMangerTotal = 0
                let NYOwnTotal = 0
                let NCOwnTotal = 0
                let TXOwnTotal = 0
                let CHIOwnTotal = 0
                let NationalOwnTotal = 0
                let NYRegularManegerQnty = 0
                let NCRegularManegerQnty = 0
                let TXRegularManegerQnty = 0
                let CHIRegularManegerQnty = 0
                let NatioanlManegerQnty = 0
                let NYOwnQnty = 0
                let NCOwnQnty = 0
                let TXOwnQnty = 0
                let CHIOwnQnty = 0
                let NationalOwnQnty = 0
                let marketPlaceArray = []
                var test
                let virginiaqnty = 0
                let virginiaCommission = 0
                let nonQnty = 0
                let nonCommission = 0
                let totalCombinedAmnt = 0
                let nyCombinedTotal = 0
                let ncCombinedTotal = 0
                let chiCombinedTotal = 0
                let txCombinedTotal = 0
                let virginiaCombinedTotal = 0
                let NationalCombinedTotal = 0
                let nonCombinedTotal = 0

                if (!checkForParameter(profile)) {
                    profile = 0
                }

                log.debug("----------marketPlaceResult------------",marketPlaceResult)

                for (var i = 0; i < marketPlaceResult.length; i++) {
                    log.debug("----Market Each: ",marketPlaceResult[i])

                    let marketObj = {}
                    if (marketPlaceResult[i].MMCommissionProfile.value != 1 && marketPlaceResult[i].MMCommissionProfile.value != 2 && marketPlaceResult[i].MMCommissionProfile.value != 4 && marketPlaceResult[i].MMCommissionProfile.value != 5 && marketPlaceResult[i].MMCommissionProfile.value != 6) {
                        log.debug("PROF: ",profile)
                        if (profile == 3 || profile == 0) {

                            if (checkForParameter(marketPlaceResult[i].marketQuantity) && checkForParameter(marketPlaceResult[i].handsetQuantity)) {
                                totalCombinedAmnt = Number(marketPlaceResult[i].Quantity.value) + Number(marketPlaceResult[i].marketQuantity.value) + marketPlaceResult[i].handsetQuantity.value
                            } else if (checkForParameter(marketPlaceResult[i].marketQuantity)) {
                                totalCombinedAmnt = Number(marketPlaceResult[i].Quantity.value) + Number(marketPlaceResult[i].marketQuantity.value)
                            } else {
                                totalCombinedAmnt = Number(marketPlaceResult[i].Quantity.value)
                            }
                            //log.debug('totalCombinedAmnt',totalCombinedAmnt)

                            sublistMarketPlace.setSublistValue({
                                id: 'custpage_marketplace_sales_rep',
                                line: lineNumber,
                                value: marketPlaceResult[i].ActualSalesPerson.text
                            });

                            sublistMarketPlace.setSublistValue({
                                id: 'custpage_marketplace_manegers',
                                line: lineNumber,
                                value: marketPlaceResult[i].CompanyName.value
                            });

                            sublistMarketPlace.setSublistValue({
                                id: 'custpage_qnty_marketplace',
                                line: lineNumber,
                                value: marketPlaceResult[i].Quantity.value
                            });

                            sublistMarketPlace.setSublistValue({
                                id: 'custpage_profit_sum',
                                line: lineNumber,
                                value: marketPlaceResult[i].EstGrossProfit.value
                            });
                            let commissionRate2 = "0%"
                            if (checkForParameter(marketPlaceResult[i].MarketPlacetier1.value) && checkForParameter(marketPlaceResult[i].MarketPlaceTier2.value)) {
                                if (marketPlaceResult[i].MarketPlacetier1.value >= totalCombinedAmnt) {
                                    commissionRate2 = marketPlaceResult[i].MarketPlaceTier1Rate.value
                                } else if (totalCombinedAmnt > marketPlaceResult[i].MarketPlaceTier2.value) {
                                    commissionRate2 = marketPlaceResult[i].MarketPlaceTier2Rate.value
                                }
                            }

                            if (marketPlaceResult[i].CompanyName.value == "VARINIAV") {

                            }

                            sublistMarketPlace.setSublistValue({
                                id: 'custpage_profit_commission_rate',
                                line: lineNumber,
                                value: commissionRate2
                            });

                            let commissionRate1 = commissionRate2.split("%")
                            commissionRate = commissionRate1[0]
                            totalCommission = (Number(marketPlaceResult[i].EstGrossProfit.value) * Number(commissionRate)) / 100

                            sublistMarketPlace.setSublistValue({
                                id: 'custpage_profit_commission_amnt',
                                line: lineNumber,
                                value: fixFloat(totalCommission)
                            });


                            marketObj.salesRep = marketPlaceResult[i].CompanyName.value
                            marketObj.mmProfile = marketPlaceResult[i].MMCommissionProfile.text
                            marketObj.actualSaleRep = marketPlaceResult[i].ActualSalesPerson.text
                            marketObj.quantity = marketPlaceResult[i].Quantity.value
                            marketObj.profit = marketPlaceResult[i].EstGrossProfit.value
                            marketObj.rate = commissionRate
                            marketObj.totalAmount = fixFloat(totalCommission)
                            marketPlaceArray.push(marketObj)

                            lineNumber++

                        }
                        if(profile == 7){
                            if(checkForParameter(salesPartnerValue) && checkForParameter(marketPlaceResult)){
                                if(salesPartnerValue == marketPlaceResult[i].ActualSalesPerson.value){
                                    if (checkForParameter(marketPlaceResult[i].marketQuantity) && checkForParameter(marketPlaceResult[i].handsetQuantity)) {
                                        totalCombinedAmnt = Number(marketPlaceResult[i].Quantity.value) + Number(marketPlaceResult[i].marketQuantity.value) + marketPlaceResult[i].handsetQuantity.value
                                    } else if (checkForParameter(marketPlaceResult[i].marketQuantity)) {
                                        totalCombinedAmnt = Number(marketPlaceResult[i].Quantity.value) + Number(marketPlaceResult[i].marketQuantity.value)
                                    } else {
                                        totalCombinedAmnt = Number(marketPlaceResult[i].Quantity.value)
                                    }
                                    //log.debug('totalCombinedAmnt',totalCombinedAmnt)

                                    sublistMarketPlace.setSublistValue({
                                        id: 'custpage_marketplace_sales_rep',
                                        line: lineNumber,
                                        value: marketPlaceResult[i].ActualSalesPerson.text
                                    });

                                    sublistMarketPlace.setSublistValue({
                                        id: 'custpage_marketplace_manegers',
                                        line: lineNumber,
                                        value: marketPlaceResult[i].CompanyName.value
                                    });

                                    sublistMarketPlace.setSublistValue({
                                        id: 'custpage_qnty_marketplace',
                                        line: lineNumber,
                                        value: marketPlaceResult[i].Quantity.value
                                    });

                                    sublistMarketPlace.setSublistValue({
                                        id: 'custpage_profit_sum',
                                        line: lineNumber,
                                        value: marketPlaceResult[i].EstGrossProfit.value
                                    });
                                    let commissionRate2 = "0%"
                                    if (checkForParameter(marketPlaceResult[i].MarketPlacetier1.value) && checkForParameter(marketPlaceResult[i].MarketPlaceTier2.value)) {
                                        if (marketPlaceResult[i].MarketPlacetier1.value >= totalCombinedAmnt) {
                                            commissionRate2 = marketPlaceResult[i].MarketPlaceTier1Rate.value
                                        } else if (totalCombinedAmnt > marketPlaceResult[i].MarketPlaceTier2.value) {
                                            commissionRate2 = marketPlaceResult[i].MarketPlaceTier2Rate.value
                                        }
                                    }

                                    if (marketPlaceResult[i].CompanyName.value == "VARINIAV") {

                                    }

                                    sublistMarketPlace.setSublistValue({
                                        id: 'custpage_profit_commission_rate',
                                        line: lineNumber,
                                        value: commissionRate2
                                    });

                                    let commissionRate1 = commissionRate2.split("%")
                                    commissionRate = commissionRate1[0]
                                    totalCommission = (Number(marketPlaceResult[i].EstGrossProfit.value) * Number(commissionRate)) / 100

                                    sublistMarketPlace.setSublistValue({
                                        id: 'custpage_profit_commission_amnt',
                                        line: lineNumber,
                                        value: fixFloat(totalCommission)
                                    });

                                    marketObj.salesRep = marketPlaceResult[i].CompanyName.value
                                    marketObj.mmProfile = marketPlaceResult[i].MMCommissionProfile.text
                                    marketObj.actualSaleRep = marketPlaceResult[i].ActualSalesPerson.text
                                    marketObj.quantity = marketPlaceResult[i].Quantity.value
                                    marketObj.profit = marketPlaceResult[i].EstGrossProfit.value
                                    marketObj.rate = commissionRate
                                    marketObj.totalAmount = fixFloat(totalCommission)
                                    marketPlaceArray.push(marketObj)

                                    lineNumber++

                                }
                            }
                        }

                        if (marketPlaceResult[i].Class.text == "TX") {
                            TXRegularManegerQnty = Number(TXRegularManegerQnty) + Number(marketPlaceResult[i].Quantity.value)
                            TXRegularManegerTotal = Number(TXRegularManegerTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                            txCombinedTotal = Number(txCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                        } else if (marketPlaceResult[i].Class.text == "North Carolina") {
                            NCRegularManegerQnty = Number(NCRegularManegerQnty) + Number(marketPlaceResult[i].Quantity.value)
                            NCRegularManegerTotal = Number(NCRegularManegerTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                            ncCombinedTotal = Number(ncCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                        } else if (marketPlaceResult[i].Class.text == "New York") {
                            NYRegularManegerQnty = Number(NYRegularManegerQnty) + Number(marketPlaceResult[i].Quantity.value)
                            NYRegularManegerTotal = Number(NYRegularManegerTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                            nyCombinedTotal = Number(nyCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                        } else if (marketPlaceResult[i].Class.text == "Illinois") {
                            CHIRegularManegerQnty = Number(CHIRegularManegerQnty) + Number(marketPlaceResult[i].Quantity.value)
                            CHIRegularManegerTotal = Number(CHIRegularManegerTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                            chiCombinedTotal = Number(chiCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                        } else if (marketPlaceResult[i].Class.text == "Virginia") {
                            virginiaqnty = Number(virginiaqnty) + Number(marketPlaceResult[i].Quantity.value)
                            virginiaCommission = Number(virginiaCommission) + Number(marketPlaceResult[i].EstGrossProfit.value)
                            virginiaCombinedTotal = Number(virginiaCombinedTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                        } else if (marketPlaceResult[i].Class.text == "- None -") {
                            nonQnty = Number(nonQnty) + Number(marketPlaceResult[i].Quantity.value)
                            nonCommission = Number(nonCommission) + Number(marketPlaceResult[i].EstGrossProfit.value)
                            nonCombinedTotal = Number(nonCombinedTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                        }

                    } else if (marketPlaceResult[i].MMCommissionProfile.value == 5) {
                        CHIOwnQnty = Number(CHIOwnQnty) + Number(marketPlaceResult[i].Quantity.value)
                        CHIOwnTotal = Number(CHIOwnTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                        chiCombinedTotal = Number(chiCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                    } else if (marketPlaceResult[i].MMCommissionProfile.value == 2) {
                        NationalOwnQnty = Number(NationalOwnQnty) + Number(marketPlaceResult[i].Quantity.value)
                        NationalOwnTotal = Number(NationalOwnTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                        NationalCombinedTotal = Number(NationalCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                    } else if (marketPlaceResult[i].MMCommissionProfile.value == 6) {
                        NCOwnQnty = Number(NCOwnQnty) + Number(marketPlaceResult[i].Quantity.value)
                        NCOwnTotal = Number(NCOwnTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                        ncCombinedTotal = Number(ncCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                    } else if (marketPlaceResult[i].MMCommissionProfile.value == 1 || marketPlaceResult[i].MMCommissionProfile.value == 7) {

                        NYOwnQnty = Number(NYOwnQnty) + Number(marketPlaceResult[i].Quantity.value)
                        NYOwnTotal = Number(NYOwnTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                        nyCombinedTotal = Number(nyCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                    } else if (marketPlaceResult[i].MMCommissionProfile.value == 4) {
                        TXOwnQnty = Number(TXOwnQnty) + Number(marketPlaceResult[i].Quantity.value)
                        log.debug("TXOwnQnty: ",TXOwnQnty)
                        TXOwnTotal = Number(TXOwnTotal) + Number(marketPlaceResult[i].EstGrossProfit.value)
                        log.debug("TXOwnTotal: ",TXOwnTotal)
                        txCombinedTotal = Number(txCombinedTotal) + Number(marketPlaceResult[i].Quantity.value)
                        log.debug("txCombinedTotal: ",txCombinedTotal)
                    }
                }



                NatioanlManegerQnty = Number(CHIRegularManegerQnty) + Number(TXRegularManegerQnty) + Number(NCRegularManegerQnty) + Number(NYRegularManegerQnty) + Number(virginiaqnty) + Number(nonQnty)
                NationalMangerTotal = Number(CHIRegularManegerTotal) + Number(TXRegularManegerTotal) + Number(NCRegularManegerTotal) + Number(NYRegularManegerTotal) + Number(virginiaCommission) + Number(nonCommission)
                NationalOwnQnty = Number(NationalOwnQnty) + Number(CHIOwnQnty) + Number(TXOwnQnty) + Number(NCOwnQnty) + Number(NYOwnQnty)
                NationalOwnTotal = Number(NationalOwnTotal) + Number(CHIOwnTotal) + Number(TXOwnTotal) + Number(NCOwnTotal) + Number(NYOwnTotal)
                NationalCombinedTotal = Number(NationalCombinedTotal) + Number(txCombinedTotal) + Number(chiCombinedTotal) + Number(virginiaCombinedTotal) + Number(ncCombinedTotal) + Number(nyCombinedTotal) + Number(nonCombinedTotal)
                log.debug("ELSE PROF: ",profile)
                if (profile != 3 && profile == 0) {
                    for (var j = 0; j < manegerSearch.length; j++) {
                        if (checkForParameter(manegerSearch[j].MMCommissionProfile.value)) {
                            if (manegerSearch[j].MMCommissionProfile.value == 5) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, lineNumber, CHIOwnTotal, CHIRegularManegerTotal, CHIOwnQnty, CHIRegularManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, chiCombinedTotal)

                            } else if (manegerSearch[j].MMCommissionProfile.value == 2) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, test.lineNumber, NationalOwnTotal, NationalMangerTotal, NationalOwnQnty, NatioanlManegerQnty, j, marketPlaceResult, manegerSearch, test.marketPlaceArray, NationalCombinedTotal)

                            } else if (manegerSearch[j].MMCommissionProfile.value == 6) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, test.lineNumber, NCOwnTotal, NCRegularManegerTotal, NCOwnQnty, NCRegularManegerQnty, j, marketPlaceResult, manegerSearch, test.marketPlaceArray, ncCombinedTotal)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 1) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, test.lineNumber, NYOwnTotal, NYRegularManegerTotal, NYOwnQnty, NYRegularManegerQnty, j, marketPlaceResult, manegerSearch, test.marketPlaceArray, nyCombinedTotal)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 4) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, test.lineNumber, TXOwnTotal, TXRegularManegerTotal, TXOwnQnty, TXRegularManegerQnty, j, marketPlaceResult, manegerSearch, test.marketPlaceArray, txCombinedTotal)
                            }
                        }
                    }
                } else {
                    for (var j = 0; j < manegerSearch.length; j++) {
                        log.debug("MAN EACH: ",manegerSearch[j])
                        if (checkForParameter(manegerSearch[j].MMCommissionProfile.value)) {
                            //class Illinois
                            if (manegerSearch[j].MMCommissionProfile.value == 5 && profile == 5) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, lineNumber, CHIOwnTotal, CHIRegularManegerTotal, CHIOwnQnty, CHIRegularManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, chiCombinedTotal)
                                if (checkForParameter(test)) {
                                    lineNumber = test.lineNumber
                                    marketPlaceArray = test.marketPlaceArray
                                } else {
                                    lineNumber = lineNumber
                                    marketPlaceArray = marketPlaceArray
                                }
                            }
                            // class national
                            else if (manegerSearch[j].MMCommissionProfile.value == 2 && profile == 2) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, lineNumber, NationalOwnTotal, NationalMangerTotal, NationalOwnQnty, NatioanlManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, NationalCombinedTotal)
                                if (checkForParameter(test)) {
                                    lineNumber = test.lineNumber
                                    marketPlaceArray = test.marketPlaceArray
                                } else {
                                    lineNumber = lineNumber
                                    marketPlaceArray = marketPlaceArray
                                }
                            }
                            // class north carolina
                            else if (manegerSearch[j].MMCommissionProfile.value == 6 && profile == 6) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, lineNumber, NCOwnTotal, NCRegularManegerTotal, NCOwnQnty, NCRegularManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, ncCombinedTotal)
                                if (checkForParameter(test)) {
                                    lineNumber = test.lineNumber
                                    marketPlaceArray = test.marketPlaceArray
                                } else {
                                    lineNumber = lineNumber
                                    marketPlaceArray = marketPlaceArray
                                }
                            }
                            // class new york
                            else if (manegerSearch[j].MMCommissionProfile.value == 1 && profile == 1) {
                                log.debug("INSI")
                                test = exports.setMarketPlaceManager(sublistMarketPlace, lineNumber, NYOwnTotal, NYRegularManegerTotal, NYOwnQnty, NYRegularManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, nyCombinedTotal)
                                log.debug("INSIDE test: ",test)
                                if (checkForParameter(test)) {
                                    lineNumber = test.lineNumber
                                    marketPlaceArray = test.marketPlaceArray
                                } else {
                                    lineNumber = lineNumber
                                    marketPlaceArray = marketPlaceArray
                                }
                            }
                            else if (manegerSearch[j].MMCommissionProfile.value == 7 && profile == 7) {
                                log.debug("INSID 7")
                                test = exports.setMarketPlaceManager(sublistMarketPlace, lineNumber, NYOwnTotal, NYRegularManegerTotal, NYOwnQnty, NYRegularManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, nyCombinedTotal)
                                log.debug("INSIDE test 7: ",test)
                                if (checkForParameter(test)) {
                                    lineNumber = test.lineNumber
                                    marketPlaceArray = test.marketPlaceArray
                                } else {
                                    lineNumber = lineNumber
                                    marketPlaceArray = marketPlaceArray
                                }
                            }
                            // class tx
                            else if (manegerSearch[j].MMCommissionProfile.value == 4 && profile == 4) {
                                test = exports.setMarketPlaceManager(sublistMarketPlace, lineNumber, TXOwnTotal, TXRegularManegerTotal, TXOwnQnty, TXRegularManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, txCombinedTotal)
                                if (checkForParameter(test)) {
                                    lineNumber = test.lineNumber
                                    marketPlaceArray = test.marketPlaceArray
                                } else {
                                    lineNumber = lineNumber
                                    marketPlaceArray = marketPlaceArray
                                }
                            }
                        }
                    }
                }

                if (checkForParameter(test)) {
                    log.debug("TEST.marketPlaceArray: ",test.marketPlaceArray)
                    return test.marketPlaceArray;
                } else {
                    log.debug("TEST marketPlaceArray: ",marketPlaceArray)
                    return marketPlaceArray;
                }
            },
            /**
             * Function used to set the branded handset subtab for the reginal managers.
             * @param sublistMarketPlace
             * @param lineNumber
             * @param OwnTotal
             * @param RegularManegerTotal
             * @param OwnQnty
             * @param RegularManegerQnty
             * @param j
             * @param marketPlaceResult
             * @param manegerSearch
             * @param marketPlaceArray
             * @param combinedTotal
             * @returns {{}}
             */
            setMarketPlaceManager(sublistMarketPlace, lineNumber, OwnTotal, RegularManegerTotal, OwnQnty, RegularManegerQnty, j, marketPlaceResult, manegerSearch, marketPlaceArray, combinedTotal) {

                let markArray = {}
                let markObj = {}

                sublistMarketPlace.setSublistValue({
                    id: 'custpage_marketplace_sales_rep',
                    line: lineNumber,
                    value: manegerSearch[j].Name.value
                });

                sublistMarketPlace.setSublistValue({
                    id: 'custpage_marketplace_manegers',
                    line: lineNumber,
                    value: manegerSearch[j].CompanyName.value
                });

                markObj.salesRep = manegerSearch[j].CompanyName.value
                markObj.mmProfile = manegerSearch[j].MMCommissionProfile.text

                let totalQnty = Number(OwnQnty) + Number(RegularManegerQnty)
                sublistMarketPlace.setSublistValue({
                    id: 'custpage_qnty_marketplace',
                    line: lineNumber,
                    value: totalQnty
                });

                let totalCommision = Number(OwnTotal) + Number(RegularManegerTotal)
                sublistMarketPlace.setSublistValue({
                    id: 'custpage_profit_sum',
                    line: lineNumber,
                    value: fixFloat(totalCommision)
                });

                let commissionRate = "0%"
                if (checkForParameter(manegerSearch[j].WarehouseHSTier1.value && manegerSearch[j].WarehouseQtygt600.value)) {
                    if (combinedTotal <= manegerSearch[j].WarehouseHSTier1.value) {
                        commissionRate = manegerSearch[j].WarehousePayoutRate1.value
                    } else if (combinedTotal > manegerSearch[j].WarehouseQtygt600.value) {
                        commissionRate = manegerSearch[j].WAREHOUSEPAYOUTRATE2.value
                    }
                }
                sublistMarketPlace.setSublistValue({
                    id: 'custpage_profit_commission_rate',
                    line: lineNumber,
                    value: commissionRate
                });

                let commissionRate1 = commissionRate.split("%")
                commissionRate = commissionRate1[0]

                totalCommission = (Number(totalCommision) * Number(commissionRate)) / 100

                sublistMarketPlace.setSublistValue({
                    id: 'custpage_profit_commission_amnt',
                    line: lineNumber,
                    value: fixFloat(totalCommission)
                });

                markObj.actualSaleRep = manegerSearch[j].CompanyName.value
                markObj.quantity = totalQnty
                markObj.profit = fixFloat(totalCommision)
                markObj.rate = commissionRate
                markObj.totalAmount = fixFloat(totalCommission)
                marketPlaceArray.push(markObj)
                lineNumber++
                markArray.lineNumber = lineNumber
                markArray.marketPlaceArray = marketPlaceArray


                log.debug("-----markArray--------",markArray)
                return markArray;
            },
            /**
             *
             * @param sublistAirTime {Object}  Air time sublist object
             * @param airTimeBonusSearch {JSON} contains the air time search result values
             * @param profile {Number} Sales Rep filter value
             * @param manegerSearch {Object} The saved search used for list all the reginal managers
             * @returns {[arrayOfObject]} airTImeArray contains the air time sales rep values.
             */
            setAirTimeBonusSublist(sublistAirTime, airTimeBonusSearch, profile, manegerSearch, qpayAirTimeBonusSearch) {
                // log.debug('airtime profile', profile)

                log.debug("PARAM 1- sublistAirTime: ",sublistAirTime)
                log.debug("PARAM 2- airTimeBonusSearch: ",airTimeBonusSearch)
                log.debug("PARAM 3- profile: ",profile)
                log.debug("PARAM 4- manegerSearch: ",manegerSearch)
                log.debug("PARAM 5- qpayAirTimeBonusSearch: ",qpayAirTimeBonusSearch)

                /*  log.debug('qpayAirTimeBonusSearch',qpayAirTimeBonusSearch)
                  log.debug('airTimeBonusSearch',airTimeBonusSearch)*/
                for (var i = 0; i < qpayAirTimeBonusSearch.length; i++) {
                    let flagChecker = false
                    for (var j = 0; j < airTimeBonusSearch.length; j++) {
                        if (airTimeBonusSearch[j].MarketManager.text == "SolomonS") {
                            //log.debug('airTimeBonusSearch[i].MarketManager.text',airTimeBonusSearch[j].MarketManager.text)
                            airTimeBonusSearch[j].MarketManager.text = ("SolomonS").toUpperCase();
                        }
                        //log.debug('enter first loop')
                        if (checkForParameter(qpayAirTimeBonusSearch[i].CompanyName)) {

                            if (airTimeBonusSearch[j].MarketManager.text == qpayAirTimeBonusSearch[i].CompanyName.value) {
                                //log.debug('enter loop',qpayAirTimeBonusSearch[i].CompanyName.value)
                                //airTimeBonusSearch[j].qpayAirtimeQuantity = qpayAirTimeBonusSearch[i].InternalID
                                airTimeBonusSearch[j].qpayAirtimeCommsion = qpayAirTimeBonusSearch[i].Retail
                                flagChecker = true
                                break;
                            }
                        }
                    }


                    /*   if (flagChecker == false) {
                           testArray.push(i)
                       }*/
                }
                //log.debug('airTimeBonusSearch',airTimeBonusSearch)
                log.debug("PROFILEE: ",profile)
                if (!checkForParameter(profile)) {
                    profile = 0
                }

                let lineNumber = 0
                let NYRegularAirtimePM = 0
                let VirginiaRegularAirtimePM = 0
                let NCRegularAirtimePM = 0
                let CHIRegularAirtimePM = 0
                let TXRegularAirtimePM = 0
                let noneRegulartAirtimePM = 0
                let NYownAirTime = 0
                let VirginiaownAirTime = 0
                let NCownAirTime = 0
                let CHIownAirTime = 0
                let TXownAirTime = 0
                let NationalAirTime = 0
                let NationalTotal = 0
                var airTImeArray = []

                for (var i = 0; i < airTimeBonusSearch.length; i++) {
                    log.debug("LOOP")
                    if (airTimeBonusSearch[i].MMCommissionProfile.value != 1 && airTimeBonusSearch[i].MMCommissionProfile.value != 2 && airTimeBonusSearch[i].MMCommissionProfile.value != 4 && airTimeBonusSearch[i].MMCommissionProfile.value != 5 && airTimeBonusSearch[i].MMCommissionProfile.value != 6) {

                        if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                            log.debug("IF")
                            var partnerSum = Number(airTimeBonusSearch[i].PMAIRTIMESUM.value) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion.value)
                        } else if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)) {
                            log.debug("ELSE IF")
                            var partnerSum = airTimeBonusSearch[i].PMAIRTIMESUM.value
                        } else {
                            log.debug("ELSE")
                            var partnerSum = 0
                        }
                        log.debug("PARTNER SUM: ",partnerSum)
                        if (profile == 3 || profile == 0) {

                            if (airTimeBonusSearch[i].MarketManager.text == "VARINIAV") {
                                log.debug('test airTimeBonusSearch[i] VARINIAV', airTimeBonusSearch[i])
                            }



                            var airTimeObj = {}
                            sublistAirTime.setSublistValue({
                                id: 'custpage_airtime_market_maneger',
                                line: lineNumber,
                                value: airTimeBonusSearch[i].MarketManager.text
                            });

                            sublistAirTime.setSublistValue({
                                id: 'custpage_airtime_sales_rep_',
                                line: lineNumber,
                                value: airTimeBonusSearch[i].SalesRepPartner.text
                            });


                            sublistAirTime.setSublistValue({
                                id: 'custpage_pm_air_time',
                                line: lineNumber,
                                value: parseFloat(partnerSum).toFixed(2)
                            });
                            log.debug("airTimeObj: ",airTimeObj)

                            var bonusPercentage
                            if (checkForParameter(airTimeBonusSearch[i].TOTALCREDITCARD.value && airTimeBonusSearch[i].CreditCardTier.value)) {
                                if ((airTimeBonusSearch[i].TOTALCREDITCARD.value) > airTimeBonusSearch[i].CreditCardTier.value) {
                                    bonusPercentage = 100
                                } else {
                                    bonusPercentage = 50
                                }
                            } else {
                                bonusPercentage = 0
                            }
                            log.debug("bonusPercentage: ",bonusPercentage)
                            sublistAirTime.setSublistValue({
                                id: 'custpage_air_time_percentage',
                                line: lineNumber,
                                value: bonusPercentage
                            });

                            //check the air time bonus is in which tier based on the previous month total.
                            var airTimeBonus = 0

                            if (checkForParameter(airTimeBonusSearch[i].AirBonusTier1.value) && checkForParameter(airTimeBonusSearch[i].AirBonusTier2.value) && checkForParameter(airTimeBonusSearch[i].AirBonusTier3.value)) {
                                if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)) {
                                    if (parseFloat(airTimeBonusSearch[i].PMAIRTIMESUM.value) > parseFloat(airTimeBonusSearch[i].AirBonusTier1.value) && parseFloat(airTimeBonusSearch[i].PMAIRTIMESUM.value) < parseFloat(airTimeBonusSearch[i].AirBonusTier2.value)) {
                                        if (bonusPercentage == 100) {
                                            airTimeBonus = airTimeBonusSearch[i].Airtimetier1.value

                                        } else if (bonusPercentage == 50) {
                                            airTimeBonus = airTimeBonusSearch[i].Airtimetier15.value

                                        }
                                    } else if (parseFloat(airTimeBonusSearch[i].PMAIRTIMESUM.value) > parseFloat(airTimeBonusSearch[i].AirBonusTier2.value) && parseFloat(airTimeBonusSearch[i].PMAIRTIMESUM.value) < parseFloat(airTimeBonusSearch[i].AirBonusTier3.value)) {
                                        if (bonusPercentage == 100) {
                                            airTimeBonus = airTimeBonusSearch[i].Airtimetier2.value
                                        } else if (bonusPercentage == 50) {
                                            airTimeBonus = airTimeBonusSearch[i].Airtimetier25.value
                                        }
                                    } else if (parseFloat(airTimeBonusSearch[i].PMAIRTIMESUM.value) > parseFloat(airTimeBonusSearch[i].AirBonusTier3.value)) {
                                        if (bonusPercentage == 100) {
                                            airTimeBonus = airTimeBonusSearch[i].Airtimetier3.value
                                        } else if (bonusPercentage == 50) {

                                            airTimeBonus = airTimeBonusSearch[i].Airtimetier35.value
                                        }
                                    } else {
                                        airTimeBonus = 0
                                    }
                                }
                            } else {
                                airTimeBonus = 0
                            }


                            sublistAirTime.setSublistValue({
                                id: 'custpage_air_time_bonus',
                                line: lineNumber,
                                value: fixFloat(airTimeBonus)
                            });
                            var creditCardBonus = 0
                            if (checkForParameter(airTimeBonusSearch[i].TOTALCREDITCARD)) {
                                if (airTimeBonusSearch[i].TOTALCREDITCARD.value < 10 && airTimeBonusSearch[i].TOTALCREDITCARD.value > 0) {
                                    creditCardBonus = airTimeBonusSearch[i].MerchantSVCTeir1.value * Number(airTimeBonusSearch[i].TOTALCREDITCARD.value)
                                } else if (airTimeBonusSearch[i].TOTALCREDITCARD.value >= 10) {
                                    creditCardBonus = airTimeBonusSearch[i].MerchantSVCTeir10.value * Number(airTimeBonusSearch[i].TOTALCREDITCARD.value)
                                }
                            }

                            sublistAirTime.setSublistValue({
                                id: 'custpage_credit_card_bonus',
                                line: lineNumber,
                                value: creditCardBonus
                            });

                            var newDoorBonus = 0;
                            if (checkForParameter(airTimeBonusSearch[i].TOTALNEWDOORSADDED.value)) {
                                if (airTimeBonusSearch[i].TOTALNEWDOORSADDED.value > 3) {
                                    if (checkForParameter(airTimeBonusSearch[i].NewDoorAdd4.value)) {
                                        newDoorBonus = Number(airTimeBonusSearch[i].NewDoorAdd4.value) * Number(airTimeBonusSearch[i].TOTALNEWDOORSADDED.value)
                                    }
                                } else if (airTimeBonusSearch[i].TOTALNEWDOORSADDED.value <= 3 && airTimeBonusSearch[i].TOTALNEWDOORSADDED.value > 0) {
                                    if (checkForParameter(airTimeBonusSearch[i].NewDoorAdd1.value)) {
                                        newDoorBonus = Number(airTimeBonusSearch[i].NewDoorAdd1.value) * Number(airTimeBonusSearch[i].TOTALNEWDOORSADDED.value)
                                    }
                                }
                            }
                            sublistAirTime.setSublistValue({
                                id: 'custpage_new_door_bonus',
                                line: lineNumber,
                                value: newDoorBonus
                            })

                            var totalBonus = 0
                            if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                                totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                            }
                            sublistAirTime.setSublistValue({
                                id: 'custpage_total_bonus',
                                line: lineNumber,
                                value: fixFloat(totalBonus)
                            });

                            if (airTimeBonusSearch[i].MarketManager.text == "SolomonS") {
                                log.debug("TEMP")
                                let temp = (airTimeBonusSearch[i].MarketManager.text).toUpperCase();
                                airTimeObj.salesRep = temp
                            } else {
                                log.debug("ELSE TEMP")
                                airTimeObj.salesRep = airTimeBonusSearch[i].MarketManager.text
                            }
                            log.debug("airTimeObj.salesRep: ",airTimeObj.salesRep)


                            airTimeObj.SalesRepPartner = airTimeBonusSearch[i].SalesRepPartner.text
                            airTimeObj.airTimePM = airTimeBonusSearch[i].PMAIRTIMESUM.value
                            airTimeObj.bonusPercentage = bonusPercentage
                            airTimeObj.airTimeBonus = airTimeBonus
                            airTimeObj.creditCardBonus = creditCardBonus
                            airTimeObj.newDoorBonus = newDoorBonus
                            airTimeObj.totalAmount = totalBonus
                            log.debug("Final airTimeObj: ",airTimeObj)
                            airTImeArray.push(airTimeObj)
                            log.debug("airTImeArray: ",airTImeArray)
                            lineNumber++
                        }
                        log.debug("AIRTIME BONUS CLASS "+i+": ",airTimeBonusSearch[i].Class.value)
                        //Adding total amount to the each reginal class
                        if (airTimeBonusSearch[i].Class.value == 168) {

                            TXRegularAirtimePM = Number(TXRegularAirtimePM) + Number(partnerSum)
                        } else if (airTimeBonusSearch[i].Class.value == 10) {
                            log.debug('partnerSum', partnerSum)
                            NCRegularAirtimePM = Number(NCRegularAirtimePM) + Number(partnerSum)
                        } else if (airTimeBonusSearch[i].Class.value == 6) {
                            NYRegularAirtimePM = Number(NYRegularAirtimePM) + Number(partnerSum)
                        } else if (airTimeBonusSearch[i].Class.value == 3) {
                            CHIRegularAirtimePM = Number(CHIRegularAirtimePM) + Number(partnerSum)
                        } else if (airTimeBonusSearch[i].Class.value == 1) {
                            VirginiaRegularAirtimePM = Number(VirginiaRegularAirtimePM) + Number(partnerSum)
                        } else if (airTimeBonusSearch[i].Class.text == "- None -") {
                            noneRegulartAirtimePM = Number(noneRegulartAirtimePM) + Number(partnerSum)
                        }


                    }

                    //setting the reginal maneger lines
                    else if (airTimeBonusSearch[i].MMCommissionProfile.value == 5) {
                        log.debug("AB IF")
                        if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                            var partnerSum = Number(airTimeBonusSearch[i].PMAIRTIMESUM.value) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion.value)
                        } else if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)) {
                            var partnerSum = airTimeBonusSearch[i].PMAIRTIMESUM.value
                        } else {
                            var partnerSum = 0
                        }
                        CHIownAirTime = Number(CHIownAirTime) + Number(partnerSum)
                        log.debug("CHIownAirTime: ",CHIownAirTime)
                    } else if (airTimeBonusSearch[i].MMCommissionProfile.value == 2) {
                        log.debug("AB IFF")
                        if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                            var partnerSum = Number(airTimeBonusSearch[i].PMAIRTIMESUM.value) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion.value)
                        } else if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)) {
                            var partnerSum = airTimeBonusSearch[i].PMAIRTIMESUM.value
                        } else {
                            var partnerSum = 0
                        }
                        NationalAirTime = Number(NationalAirTime) + Number(partnerSum)
                        log.debug("NationalAirTime: ",NationalAirTime)
                    } else if (airTimeBonusSearch[i].MMCommissionProfile.value == 6) {
                        log.debug("IFFF")
                        if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                            log.debug("ISSUES IF")
                            var partnerSum = Number(airTimeBonusSearch[i].PMAIRTIMESUM.value) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion.value)
                        } else if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)) {
                            log.debug("ISSUE ELSE IF")
                            log.debug("ISSUE "+i+" : ",airTimeBonusSearch[i].PMAIRTIMESUM.value)
                            var partnerSum = airTimeBonusSearch[i].PMAIRTIMESUM.value
                        } else {
                            log.debug("ISSUE ELSE")
                            var partnerSum = 0
                        }
                        log.debug("NCownAirTime: ",NCownAirTime)
                        log.debug("airTimeBonusSearch[i].PMAIRTIMESUM.value: ",airTimeBonusSearch[i].PMAIRTIMESUM.value)
                        if(checkForParameter(NCownAirTime)==true && checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)== true){
                            NCownAirTime = Number(NCownAirTime) + Number(airTimeBonusSearch[i].PMAIRTIMESUM.value)
                        }
                        if(checkForParameter(NCownAirTime)==true && (checkForParameter(airTimeBonusSearch)&& checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion.value)== true)){
                            NCownAirTime = Number(NCownAirTime) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion.value)
                        }
                        // NCownAirTime = Number(NCownAirTime) + Number(partnerSum)
                        log.debug("NCownAirTime: ",NCownAirTime)
                    } else if (airTimeBonusSearch[i].MMCommissionProfile.value == 1) {
                        log.debug("IFFFF")
                        if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                            var partnerSum = Number(airTimeBonusSearch[i].PMAIRTIMESUM.value) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion.value)
                        } else if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)) {
                            var partnerSum = airTimeBonusSearch[i].PMAIRTIMESUM.value
                        } else {
                            var partnerSum = 0
                        }
                        NYownAirTime = Number(NYownAirTime) + Number(partnerSum)
                        log.debug("NYownAirTime: ",NYownAirTime)
                    } else if (airTimeBonusSearch[i].MMCommissionProfile.value == 4) {
                        log.debug("IFFFFF")
                        if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                            var partnerSum = Number(airTimeBonusSearch[i].PMAIRTIMESUM.value) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion.value)
                        } else if (checkForParameter(airTimeBonusSearch[i].PMAIRTIMESUM.value)) {
                            var partnerSum = airTimeBonusSearch[i].PMAIRTIMESUM.value
                        } else {
                            var partnerSum = 0
                        }
                        log.debug("TXownAirTime: ",TXownAirTime)
                        TXownAirTime = Number(TXownAirTime) + Number(partnerSum)
                    }
                }
                log.debug('NCownAirTime', NCownAirTime)

                NationalTotal = Number(TXRegularAirtimePM) + Number(NCRegularAirtimePM) + Number(NYRegularAirtimePM) + Number(CHIRegularAirtimePM) + Number(VirginiaRegularAirtimePM) + Number(noneRegulartAirtimePM)
                //log.debug('NationalTotal',NationalTotal)
                NationalAirTime = Number(NationalAirTime) + Number(CHIownAirTime) + Number(NCownAirTime) + Number(NYownAirTime) + Number(TXownAirTime)
                //log.debug('NationalAirTime',NationalAirTime)

                // log.debug('profile', profile)

                if (profile != 3 && profile == 0) {
                    for (var j = 0; j < manegerSearch.length; j++) {
                        if (checkForParameter(manegerSearch[j].MMCommissionProfile)) {
                            if (manegerSearch[j].MMCommissionProfile.value == 5) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, CHIownAirTime, CHIRegularAirtimePM, lineNumber, airTImeArray)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 2) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, NationalAirTime, NationalTotal, interObj.lineNumber, interObj.airTImeArray)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 6) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, NCownAirTime, NCRegularAirtimePM, interObj.lineNumber, interObj.airTImeArray)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 1) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, NYownAirTime, NYRegularAirtimePM, interObj.lineNumber, interObj.airTImeArray)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 4) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, TXownAirTime, TXRegularAirtimePM, interObj.lineNumber, interObj.airTImeArray)
                            }
                        }
                    }
                } else {

                    for (var j = 0; j < manegerSearch.length; j++) {

                        if (checkForParameter(manegerSearch[j].MMCommissionProfile)) {
                            // class Illinois
                            if (manegerSearch[j].MMCommissionProfile.value == 5 && profile == 5) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, CHIownAirTime, CHIRegularAirtimePM, lineNumber, airTImeArray)

                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    airTImeArray = interObj["airTImeArray"]
                                } else {
                                    lineNumber = lineNumber
                                    airTImeArray = airTImeArray
                                }
                            }
                            // class national
                            else if (manegerSearch[j].MMCommissionProfile.value == 2 && profile == 2) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, NationalAirTime, NationalTotal, lineNumber, airTImeArray)

                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    airTImeArray = interObj["airTImeArray"]
                                } else {
                                    lineNumber = lineNumber
                                    airTImeArray = airTImeArray
                                }
                            }
                            // class north carolina
                            else if (manegerSearch[j].MMCommissionProfile.value == 6 && profile == 6) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, NCownAirTime, NCRegularAirtimePM, lineNumber, airTImeArray)

                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    airTImeArray = interObj["airTImeArray"]
                                } else {
                                    lineNumber = lineNumber
                                    airTImeArray = airTImeArray
                                }
                            }
                            // class newyork
                            else if (manegerSearch[j].MMCommissionProfile.value == 1 && profile == 1) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, NYownAirTime, NYRegularAirtimePM, lineNumber, airTImeArray)

                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    airTImeArray = interObj["airTImeArray"]
                                } else {
                                    lineNumber = lineNumber
                                    airTImeArray = airTImeArray
                                }
                            }
                            //class TX
                            else if (manegerSearch[j].MMCommissionProfile.value == 4 && profile == 4) {
                                var interObj = exports.setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, TXownAirTime, TXRegularAirtimePM, lineNumber, airTImeArray)
                                log.debug('interObj', interObj)
                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    airTImeArray = interObj["airTImeArray"]
                                } else {
                                    lineNumber = lineNumber
                                    airTImeArray = airTImeArray
                                }
                            }

                        }
                    }
                }

                return airTImeArray;
            },
            /**
             *
             * @param sublistAirTime {Object} Air time sublist object
             * @param profile {Number} Sales rep mm profile values
             * @param manegerSearch {Object} Managers search result
             * @param j {Number} Itrator
             * @param ownTotal {Number} Total bonus for managers
             * @param TotalBonus {Number} Total bonus amount for that class
             * @param lineNumber {Number} Line Number
             * @param airTImeArray {Object}
             * @returns {{JSON}} Contains the line number and reginal managers data.
             */
            setAirtimeManegerList(sublistAirTime, profile, manegerSearch, j, ownTotal, TotalBonus, lineNumber, airTImeArray) {

                let timeArray = {}
                let airTimeObj = {}

                sublistAirTime.setSublistValue({
                    id: 'custpage_airtime_market_maneger',
                    line: lineNumber,
                    value: manegerSearch[j].CompanyName.value
                });

                sublistAirTime.setSublistValue({
                    id: 'custpage_airtime_sales_rep_',
                    line: lineNumber,
                    value: manegerSearch[j].Name.value
                });
                var airTimeVal = 0
                if (checkForParameter(ownTotal) || checkForParameter(TotalBonus)) {
                    airTimeVal = Number(airTimeVal) + Number(ownTotal) + Number(TotalBonus)
                }
                sublistAirTime.setSublistValue({
                    id: 'custpage_pm_air_time',
                    line: lineNumber,
                    value: fixFloat(airTimeVal)
                });

                //check percentage
                var bonusPercentage = 0
                if (checkForParameter(manegerSearch[j].TOTALCREDITCARD.value && manegerSearch[j].CreditCardBonusTier.value)) {
                    if ((manegerSearch[j].TOTALCREDITCARD.value) > manegerSearch[j].CreditCardBonusTier.value) {
                        bonusPercentage = 100
                    } else {
                        bonusPercentage = 50
                    }
                }
                sublistAirTime.setSublistValue({
                    id: 'custpage_air_time_percentage',
                    line: lineNumber,
                    value: bonusPercentage
                });

                //check the air time bonus is in which tier based on the previous month total.
                var airTimeBonus = 0
                if (checkForParameter(manegerSearch[j].AirBonusTier1.value) && checkForParameter(manegerSearch[j].AirBonusTier2.value) && checkForParameter(manegerSearch[j].AirBonusTier3.value)) {
                    if (airTimeVal > manegerSearch[j].AirBonusTier1.value && airTimeVal < manegerSearch[j].AirBonusTier2.value) {
                        if (bonusPercentage == 100) {
                            airTimeBonus = manegerSearch[j].Airtimetier1.value
                        } else if (bonusPercentage == 50) {
                            airTimeBonus = manegerSearch[j].Airtimetier15.value
                        }
                    } else if (airTimeVal > manegerSearch[j].AirBonusTier2.value && airTimeVal < manegerSearch[j].AirBonusTier3.value) {
                        if (bonusPercentage == 100) {
                            airTimeBonus = manegerSearch[j].Airtimetier2.value
                        } else if (bonusPercentage == 50) {
                            airTimeBonus = manegerSearch[j].Airtimetier25.value
                        }
                    } else if (airTimeVal > manegerSearch[j].AirBonusTier3.value) {
                        if (bonusPercentage == 100) {
                            airTimeBonus = manegerSearch[j].Airtimetier3.value
                        } else if (bonusPercentage == 50) {
                            airTimeBonus = manegerSearch[j].Airtimetier35.value
                        }
                    } else {
                        airTimeBonus = 0
                    }
                } else {
                    airTimeBonus = 0
                }

                sublistAirTime.setSublistValue({
                    id: 'custpage_air_time_bonus',
                    line: lineNumber,
                    value: airTimeBonus
                });

                var creditCardBonus = 0
                if (checkForParameter(manegerSearch[j].TOTALCREDITCARD)) {
                    if (manegerSearch[j].TOTALCREDITCARD.value < 10 && manegerSearch[j].TOTALCREDITCARD.value > 0) {
                        creditCardBonus = Number(manegerSearch[j].MerchantSVCTeir1.value) * Number(manegerSearch[j].TOTALCREDITCARD.value)
                    } else if (manegerSearch[j].TOTALCREDITCARD.value >= 10) {
                        creditCardBonus = Number(manegerSearch[j].MerchantSVCTeir10.value) * Number(manegerSearch[j].TOTALCREDITCARD.value)
                    }
                }

                sublistAirTime.setSublistValue({
                    id: 'custpage_credit_card_bonus',
                    line: lineNumber,
                    value: creditCardBonus
                });

                var newDoorBonus = 0;
                if (checkForParameter(manegerSearch[j].TOTALNEWDOORSADDED.value)) {
                    if (manegerSearch[j].TOTALNEWDOORSADDED.value > 3) {
                        if (checkForParameter(manegerSearch[j].NewDoorAdd4.value)) {
                            newDoorBonus = Number(manegerSearch[j].NewDoorAdd4.value) * Number(manegerSearch[j].TOTALNEWDOORSADDED.value)
                        }
                    } else if (manegerSearch[j].TOTALNEWDOORSADDED.value <= 3 && manegerSearch[j].TOTALNEWDOORSADDED.value > 0) {
                        if (checkForParameter(manegerSearch[j].NewDoorAdd1.value)) {
                            newDoorBonus = Number(manegerSearch[j].NewDoorAdd1.value) * Number(manegerSearch[j].TOTALNEWDOORSADDED.value)
                        }
                    }
                }

                sublistAirTime.setSublistValue({
                    id: 'custpage_new_door_bonus',
                    line: lineNumber,
                    value: newDoorBonus
                });

                var totalBonus = 0
                if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                    totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                }
                sublistAirTime.setSublistValue({
                    id: 'custpage_total_bonus',
                    line: lineNumber,
                    value: fixFloat(totalBonus)
                });

                lineNumber++
                timeArray.salesRep = manegerSearch[j].CompanyName.value
                timeArray.SalesRepPartner = manegerSearch[j].Name.value
                timeArray.airTimePM = airTimeVal
                timeArray.bonusPercentage = bonusPercentage
                timeArray.airTimeBonus = airTimeBonus
                timeArray.creditCardBonus = creditCardBonus
                timeArray.newDoorBonus = newDoorBonus
                timeArray.totalAmount = totalBonus
                airTImeArray.push(timeArray)

                airTimeObj.lineNumber = lineNumber
                airTimeObj.airTImeArray = airTImeArray
                return airTimeObj;
            },
            /**
             * Function for setting the trancfone activation bonus sub tab.
             * @param sublistActivationBonus
             * @param activationBonusSearchval
             * @param profile
             * @param manegerSearch
             * @returns {[Object Array]}
             */
            setActivationBonusList(sublistActivationBonus, activationBonusSearchval, profile, manegerSearch) {
                var lineNumber = 0
                var NYtotalSold = 0
                var NYbonusSold = 0
                var NYtotalOwn = 0
                var NybonusOwn = 0
                var virginiaTotalSold = 0
                var virginiaBonusSold = 0
                var virginiaTotalOwn = 0
                var virginiaBonusOwn = 0
                var TXtotalSold = 0
                var TXBonusSold = 0
                var TXtotalOwn = 0
                var TXbonusOwn = 0
                var NCtotalSold = 0
                var NCBonusSold = 0
                var NCtotalOwn = 0
                var NCBonusOwn = 0
                var CHItotalSold = 0
                var CHIBonusSold = 0
                var CHItotalOwn = 0
                var CHIBonusOwn = 0
                var activationArray = []


                if (!checkForParameter(profile)) {
                    profile = 0
                }

                for (var k = 0; k < activationBonusSearchval.length; k++) {
                    var trancFoneObj = {}

                    if (activationBonusSearchval[k].MMCommissionProfile.value != 1 && activationBonusSearchval[k].MMCommissionProfile.value != 2 && activationBonusSearchval[k].MMCommissionProfile.value != 4 && activationBonusSearchval[k].MMCommissionProfile.value != 5 && activationBonusSearchval[k].MMCommissionProfile.value != 6) {

                        if (activationBonusSearchval[k].MarketManager.text != '- None -') {
                            var activationObj = {}
                            if (profile == 3 || profile == 0) {


                                sublistActivationBonus.setSublistValue({
                                    id: 'custpage_activation_market_maneger',
                                    line: lineNumber,
                                    value: activationBonusSearchval[k].salesreppartner.text
                                });

                                sublistActivationBonus.setSublistValue({
                                    id: 'custpage_activation_sales_rep_',
                                    line: lineNumber,
                                    value: activationBonusSearchval[k].MarketManager.text
                                });

                                sublistActivationBonus.setSublistValue({
                                    id: 'custpage_activation_mm_profile',
                                    line: lineNumber,
                                    value: activationBonusSearchval[k].MMCommissionProfile.text
                                });
                                var totalSold = activationBonusSearchval[k].InternalID.value
                                sublistActivationBonus.setSublistValue({
                                    id: 'custpage_activation_total_sold',
                                    line: lineNumber,
                                    value: totalSold
                                });

                                var bonusSold = activationBonusSearchval[k].FormulaBonus.value
                                sublistActivationBonus.setSublistValue({
                                    id: 'custpage_activation_proelite_sold',
                                    line: lineNumber,
                                    value: bonusSold
                                });
                                let activationPercentage = 0
                                if (checkForParameter(activationBonusSearchval[k].InternalID.value) && checkForParameter(activationBonusSearchval[k].FormulaBonus.value)) {
                                    if (parseInt(activationBonusSearchval[k].InternalID.value) > 0) {
                                        activationPercentage = (Number(activationBonusSearchval[k].FormulaBonus.value) * 100) / Number(activationBonusSearchval[k].InternalID.value)
                                    }
                                }

                                sublistActivationBonus.setSublistValue({
                                    id: 'custpage_activation_percentage',
                                    line: lineNumber,
                                    value: parseFloat(activationPercentage).toFixed(2)
                                });

                                let activationBonusTotal = 0
                                if (activationPercentage >= 25 && activationPercentage < 50) {
                                    if (checkForParameter(activationBonusSearchval[k].ActivationBonus25.value)) {
                                        activationBonusTotal = activationBonusSearchval[k].ActivationBonus25.value
                                    }
                                } else if (activationPercentage >= 50 && activationPercentage < 70) {
                                    if (checkForParameter(activationBonusSearchval[k].ActivationBonus50.value)) {
                                        activationBonusTotal = activationBonusSearchval[k].ActivationBonus50.value
                                    }
                                } else if (activationPercentage > 70) {
                                    if (checkForParameter(activationBonusSearchval[k].ActivationBonus70.value)) {
                                        activationBonusTotal = activationBonusSearchval[k].ActivationBonus70.value
                                    }
                                }

                                sublistActivationBonus.setSublistValue({
                                    id: 'custpage_activation_bonusval',
                                    line: lineNumber,
                                    value: parseFloat(activationBonusTotal).toFixed(2)
                                });


                                lineNumber++
                                activationObj.MarketManager = activationBonusSearchval[k].salesreppartner.text
                                activationObj.companyName = activationBonusSearchval[k].CompanyName.value

                                if (activationBonusSearchval[k].MarketManager.text == "SolomonS") {
                                    let temp = (activationBonusSearchval[k].MarketManager.text).toUpperCase();
                                    activationObj.salesRep = temp
                                } else {
                                    activationObj.salesRep = activationBonusSearchval[k].MarketManager.text
                                }

                                //activationObj.salesRep = activationBonusSearchval[k].MarketManager.text
                                activationObj.MMCommissionProfile = activationBonusSearchval[k].MMCommissionProfile.text
                                activationObj.totalSold = activationBonusSearchval[k].InternalID.value
                                activationObj.bonusSold = activationBonusSearchval[k].FormulaBonus.value
                                activationObj.activationPercentage = parseFloat(activationPercentage).toFixed(2)
                                activationObj.totalAmount = parseFloat(activationBonusTotal).toFixed(2)
                                activationArray.push(activationObj)
                            }

                            if (activationBonusSearchval[k].Class.text == "TX") {
                                TXtotalSold = Number(TXtotalSold) + Number(activationBonusSearchval[k].InternalID.value)
                                TXBonusSold = Number(TXBonusSold) + Number(activationBonusSearchval[k].FormulaBonus.value)
                            } else if (activationBonusSearchval[k].Class.text == "North Carolina") {
                                NCtotalSold = Number(NCtotalSold) + Number(activationBonusSearchval[k].InternalID.value)
                                NCBonusSold = Number(NCBonusSold) + Number(activationBonusSearchval[k].FormulaBonus.value)
                            } else if (activationBonusSearchval[k].Class.text == "New York") {
                                NYtotalSold = Number(NYtotalSold) + Number(activationBonusSearchval[k].InternalID.value)
                                NYbonusSold = Number(NYbonusSold) + Number(activationBonusSearchval[k].FormulaBonus.value)
                            } else if (activationBonusSearchval[k].Class.text == "Illinois") {
                                CHItotalSold = Number(CHItotalSold) + Number(activationBonusSearchval[k].InternalID.value)
                                CHIBonusSold = Number(CHIBonusSold) + Number(activationBonusSearchval[k].FormulaBonus.value)
                            } else if (activationBonusSearchval[k].Class.text == "Virginia") {
                                virginiaTotalSold = Number(virginiaTotalSold) + Number(activationBonusSearchval[k].InternalID.value)
                                virginiaBonusSold = Number(virginiaBonusSold) + Number(activationBonusSearchval[k].FormulaBonus.value)
                            }



                        }
                    } else if (activationBonusSearchval[k].MMCommissionProfile.value == 5) {

                        CHItotalOwn = activationBonusSearchval[k].InternalID.value
                        CHIBonusOwn = activationBonusSearchval[k].FormulaBonus.value
                    } else if (activationBonusSearchval[k].MMCommissionProfile.value == 2) {
                        virginiaTotalOwn = activationBonusSearchval[k].InternalID.value
                        virginiaBonusOwn = activationBonusSearchval[k].FormulaBonus.value
                    } else if (activationBonusSearchval[k].MMCommissionProfile.value == 6) {
                        NCtotalOwn = activationBonusSearchval[k].InternalID.value
                        NCBonusOwn = activationBonusSearchval[k].FormulaBonus.value
                    } else if (activationBonusSearchval[k].MMCommissionProfile.value == 1) {
                        NYtotalOwn = activationBonusSearchval[k].InternalID.value
                        NybonusOwn = activationBonusSearchval[k].FormulaBonus.value
                    } else if (activationBonusSearchval[k].MMCommissionProfile.value == 4) {
                        TXtotalOwn = activationBonusSearchval[k].InternalID.value
                        TXbonusOwn = activationBonusSearchval[k].FormulaBonus.value
                    }

                }

                virginiaBonusSold = Number(virginiaBonusSold) + Number(virginiaBonusOwn) + Number(CHIBonusSold) + Number(CHIBonusOwn) + Number(NCBonusSold) + Number(NCBonusOwn) + Number(NYbonusSold) + Number(NybonusOwn) + Number(TXBonusSold) + Number(TXbonusOwn)
                virginiaTotalSold = Number(virginiaTotalSold) + Number(virginiaTotalOwn) + Number(CHItotalSold) + Number(CHItotalOwn) + Number(NCtotalSold) + Number(NCtotalOwn) + Number(NYtotalSold) + Number(NYtotalOwn) + Number(TXtotalSold) + Number(TXtotalOwn)

                if (profile != 3 && profile == 0) {
                    for (var j = 0; j < manegerSearch.length; j++) {
                        if (checkForParameter(manegerSearch[j].MMCommissionProfile)) {
                            if (manegerSearch[j].MMCommissionProfile.value == 5) {
                                CHIBonusSold = Number(CHIBonusSold) + Number(CHIBonusOwn)
                                CHItotalSold = Number(CHItotalSold) + Number(CHItotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, CHItotalSold, CHIBonusSold, lineNumber, activationArray)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 2) {


                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, virginiaTotalSold, virginiaBonusSold, interObj.lineNumber, interObj.trancFoneObj)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 6) {
                                NCBonusSold = Number(NCBonusSold) + Number(NCBonusOwn)
                                NCtotalSold = Number(NCtotalSold) + Number(NCtotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, NCtotalSold, NCBonusSold, interObj.lineNumber, interObj.trancFoneObj)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 1) {
                                NYbonusSold = Number(NYbonusSold) + Number(NybonusOwn)
                                NYtotalSold = Number(NYtotalSold) + Number(NYtotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, NYtotalSold, NYbonusSold, interObj.lineNumber, interObj.trancFoneObj)
                            } else if (manegerSearch[j].MMCommissionProfile.value == 4) {
                                TXBonusSold = Number(TXBonusSold) + Number(TXbonusOwn)
                                TXtotalSold = Number(TXtotalSold) + Number(TXtotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, TXtotalSold, TXBonusSold, interObj.lineNumber, interObj.trancFoneObj)
                            }
                        }
                    }
                } else {

                    for (var j = 0; j < manegerSearch.length; j++) {
                        if (checkForParameter(manegerSearch[j].MMCommissionProfile)) {
                            if (manegerSearch[j].MMCommissionProfile.value == 5 && profile == 5) {
                                CHIBonusSold = Number(CHIBonusSold) + Number(CHIBonusOwn)
                                CHItotalSold = Number(CHItotalSold) + Number(CHItotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, CHItotalSold, CHIBonusSold, lineNumber, activationArray)
                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    activationArray = interObj.trancFoneObj
                                } else {
                                    lineNumber = lineNumber
                                    activationArray = activationArray
                                }
                            } else if (manegerSearch[j].MMCommissionProfile.value == 2 && profile == 2) {


                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, virginiaTotalSold, virginiaBonusSold, lineNumber, activationArray)
                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    activationArray = interObj.trancFoneObj
                                } else {
                                    lineNumber = lineNumber
                                    activationArray = activationArray
                                }
                            } else if (manegerSearch[j].MMCommissionProfile.value == 6 && profile == 6) {
                                NCBonusSold = Number(NCBonusSold) + Number(NCBonusOwn)
                                NCtotalSold = Number(NCtotalSold) + Number(NCtotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, NCtotalSold, NCBonusSold, lineNumber, activationArray)
                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    activationArray = interObj.trancFoneObj
                                } else {
                                    lineNumber = lineNumber
                                    activationArray = activationArray
                                }
                            } else if (manegerSearch[j].MMCommissionProfile.value == 1 && profile == 1) {

                                NYbonusSold = Number(NYbonusSold) + Number(NybonusOwn)
                                NYtotalSold = Number(NYtotalSold) + Number(NYtotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, NYtotalSold, NYbonusSold, lineNumber, activationArray)
                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    activationArray = interObj.trancFoneObj
                                } else {
                                    lineNumber = lineNumber
                                    activationArray = activationArray
                                }
                            } else if (manegerSearch[j].MMCommissionProfile.value == 4 && profile == 4) {

                                TXBonusSold = Number(TXBonusSold) + Number(TXbonusOwn)
                                TXtotalSold = Number(TXtotalSold) + Number(TXtotalOwn)

                                var interObj = exports.setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, TXtotalSold, TXBonusSold, lineNumber, activationArray)
                                if (checkForParameter(interObj)) {
                                    lineNumber = interObj.lineNumber
                                    activationArray = interObj.trancFoneObj
                                } else {
                                    lineNumber = lineNumber
                                    activationArray = activationArray
                                }
                            }
                        }
                    }
                }

                return activationArray;
            },
            /**
             * Function for setting the regions managers trancfone activation bonus in the bonus sub tab
             * @param sublistActivationBonus
             * @param profile
             * @param manegerSearch
             * @param j
             * @param totalSold
             * @param BonusSold
             * @param lineNumber
             * @param trancFoneObj
             * @returns {{Onject Array}}
             */
            setActivayionManagerList(sublistActivationBonus, profile, manegerSearch, j, totalSold, BonusSold, lineNumber, trancFoneObj) {

                var interObj = {}
                var activationObj = {}
                sublistActivationBonus.setSublistValue({
                    id: 'custpage_activation_market_maneger',
                    line: lineNumber,
                    value: manegerSearch[j].Name.value
                });
                activationObj.MarketManager = manegerSearch[j].Name.value

                sublistActivationBonus.setSublistValue({
                    id: 'custpage_activation_sales_rep_',
                    line: lineNumber,
                    value: manegerSearch[j].CompanyName.value
                });
                activationObj.salesRep = manegerSearch[j].CompanyName.value

                sublistActivationBonus.setSublistValue({
                    id: 'custpage_activation_mm_profile',
                    line: lineNumber,
                    value: manegerSearch[j].MMCommissionProfile.text
                });
                activationObj.MMCommissionProfile = manegerSearch[j].MMCommissionProfile.text

                sublistActivationBonus.setSublistValue({
                    id: 'custpage_activation_total_sold',
                    line: lineNumber,
                    value: totalSold
                });
                activationObj.totalSold = totalSold

                if (BonusSold == "" || BonusSold == " " || BonusSold == null || BonusSold == undefined) {
                    BonusSold = 0
                }
                sublistActivationBonus.setSublistValue({
                    id: 'custpage_activation_proelite_sold',
                    line: lineNumber,
                    value: BonusSold
                });
                activationObj.bonusSold = BonusSold

                var activationPercentage = 0
                if (checkForParameter(totalSold) && checkForParameter(BonusSold)) {
                    if (BonusSold > 0) {
                        activationPercentage = (Number(BonusSold) * 100) / Number(totalSold)
                    }
                }

                sublistActivationBonus.setSublistValue({
                    id: 'custpage_activation_percentage',
                    line: lineNumber,
                    value: parseFloat(activationPercentage).toFixed(2)
                });
                activationObj.activationPercentage = parseFloat(activationPercentage).toFixed(2)

                let activationBonusTotal = 0
                if (activationPercentage >= 25 && activationPercentage < 50) {
                    if (checkForParameter(manegerSearch[j].ActivationBonus25.value)) {
                        activationBonusTotal = manegerSearch[j].ActivationBonus25.value
                    }
                } else if (activationPercentage >= 50 && activationPercentage < 70) {
                    if (checkForParameter(manegerSearch[j].ActivationBonus50.value)) {
                        activationBonusTotal = manegerSearch[j].ActivationBonus50.value
                    }
                } else if (activationPercentage > 70) {
                    if (checkForParameter(manegerSearch[j].ActivationBonus70.value)) {
                        activationBonusTotal = manegerSearch[j].ActivationBonus70.value
                    }
                }

                sublistActivationBonus.setSublistValue({
                    id: 'custpage_activation_bonusval',
                    line: lineNumber,
                    value: parseFloat(activationBonusTotal).toFixed(2)
                });
                activationObj.totalAmount = parseFloat(activationBonusTotal).toFixed(2)
                trancFoneObj.push(activationObj)

                lineNumber++;


                interObj.lineNumber = lineNumber
                interObj.trancFoneObj = trancFoneObj
                return interObj;

            },
            setsublistExtraBonusList(sublistExtraBonus, extraBonusSearch) {

                //log.debug('extraBonusSearch', extraBonusSearch)

                var lineNumber = 0
                var extraBonusArray = []

                log.debug("extraBonusSearch", extraBonusSearch)
                log.debug("extraBonusSearch", extraBonusSearch.length)
                if (extraBonusSearch.length > 0) {
                    for (var i = 0; i < extraBonusSearch.length; i++) {
                        log.debug("extraBonusSearch for i " + i, extraBonusSearch[i])
                        var extraBonusObj = {}
                        if (checkForParameter(extraBonusSearch[i].CompanyName.value)) {
                            sublistExtraBonus.setSublistValue({
                                id: 'custpage_bonus_sales_rep',
                                line: lineNumber,
                                value: extraBonusSearch[i].CompanyName.value
                            });
                            extraBonusObj.salesRep = extraBonusSearch[i].CompanyName.value


                            //log.debug('parseFloat(extraBonusSearch[i].MiscellaneousAdditions.value).toFixed(2)', extraBonusSearch[i])

                            if (checkForParameter(extraBonusSearch[i].MiscellaneousAdditions.value)) {
                                var boundTtl = extraBonusSearch[i].MiscellaneousAdditions.value
                            } else {
                                var boundTtl = 0
                            }

                            if (checkForParameter(extraBonusSearch[i].CompanyName.value)) {
                                sublistExtraBonus.setSublistValue({
                                    id: 'custpage_bonus_total',
                                    line: lineNumber,
                                    value: parseFloat(extraBonusSearch[i].MiscellaneousAdditions.value).toFixed(2)
                                });
                                extraBonusObj.totalAmount = parseFloat(boundTtl).toFixed(2)
                            }

                            extraBonusArray.push(extraBonusObj)
                            log.debug("lineNumber", lineNumber)
                            lineNumber++
                        }
                    }
                }

                return extraBonusArray;
            },
            /**
             * Function defines the total subtab and all the commission values
             * @param tracFoneArray
             * @param simSaleObj
             * @param sublistMarketplaceHandset
             * @param marketResult
             * @param handSetArray
             * @param newObj
             * @param activationArray
             * @param airTimeArray
             * @param marketplaceSimArray
             * @returns {[]}
             */
            setTotalSublist(tracFoneArray, simSaleObjval, sublistMarketplaceHandset, marketResult, handSetArray, newObj, activationArray, airTimeArray, extraObj,marketplaceSimArray) {
                var simSaleObj = []
                log.debug("marketResult LAST: ",marketResult)
                let lineNumber = 0;
                //combine both sim sale and trancfone array
                log.debug('extraObj', extraObj)

                Array.prototype.push.apply(simSaleObj, simSaleObjval);
                Array.prototype.push.apply(simSaleObj, tracFoneArray);
                Array.prototype.push.apply(simSaleObj, marketResult);
                Array.prototype.push.apply(simSaleObj, handSetArray);
                Array.prototype.push.apply(simSaleObj, airTimeArray);
                Array.prototype.push.apply(simSaleObj, activationArray);
                Array.prototype.push.apply(simSaleObj, extraObj)
                Array.prototype.push.apply(simSaleObj,marketplaceSimArray);
                log.debug("8")

                log.debug('simSaleObj', simSaleObj)

                var totalArray = []

                var holder = {};
                var simsaleCom = Number(0)

                //calculate total for each sales rep on the array of object
                simSaleObj.forEach(function (d) {
                    log.debug("EACH: : ",d)
                    if(checkForParameter(d.marketplaceSimRes) && d.marketplaceSimRes.length>0) {
                        log.debug("EACH 1: : ", d.marketplaceSimRes[0].commission)
                    }
                    if (holder.hasOwnProperty(d.salesRep)) {
                        holder[d.salesRep] = Number(holder[d.salesRep]) + Number(d.totalAmount);
                    }
                    else if(checkForParameter(d.marketplaceSimRes) && d.marketplaceSimRes.length>0) {
                        log.debug("else iF: ",d.marketplaceSimRes[0].marketManager)
                        if (holder.hasOwnProperty(d.marketplaceSimRes[0].marketManager)) {
                            simsaleCom = Number(simsaleCom)+Number(Number(d.marketplaceSimRes[0].commission))
                            // holder[d.marketplaceSimRes[0].marketManager] = Number(d.marketplaceSimRes[0].salesRep)+Number(d.marketplaceSimRes[0].commission);
                        }
                    }
                    else {
                        holder[d.salesRep] = d.totalAmount;
                    }

                });
                var combinedObj = [];

                for (var prop in holder) {
                    combinedObj.push({ name: prop, value: holder[prop]+Number(simsaleCom) });
                }


                var holder1 = {};
                simSaleObj.forEach(function (d) {
                    if (holder.hasOwnProperty(d.salesRep)) {
                        holder[d.salesRep] = d.mmProfile
                    } else {
                        holder[d.salesRep] = d.mmProfile
                    }

                });
                var combinedObj1 = {};

                for (var prop in holder) {
                    //combinedObj1.push({name: prop, value: holder[prop]});
                    combinedObj1[prop] = holder[prop]
                }

                //log.debug('combinedObj',combinedObj)
                var tracfoneintrim = {};
                tracFoneArray.forEach(function (d) {
                    if (tracfoneintrim.hasOwnProperty(d.salesRep)) {
                        tracfoneintrim[d.salesRep] = Number(tracfoneintrim[d.salesRep]) + Number(d.totalAmount);
                    } else {
                        tracfoneintrim[d.salesRep] = d.totalAmount;
                    }

                });

                //log.debug('tracfoneintrim',tracfoneintrim)


                //setting sublist value
                for (var i = 0; i < combinedObj.length; i++) {

                    let totalObj = {}
                    var simTotal = 0
                    var brandedTotal = 0
                    var warehouseTotal = 0
                    var activationTotal = 0
                    var airtimeTotal = 0
                    var marketplacesimTotal = 0
                    var activationTotal = 0
                    var tracfoneTotal = 0
                    var extraTotal = 0
                    var totalQty = Number(0)
                    var totalSum = Number(0)
                    var sTier1,sTier2;
                    var sTier1Rate = Number(0)
                    var sTier2Rate = Number(0)
                    var grandTotalCommission = Number(0)
                    tracfoneTotal = parseFloat(tracfoneintrim[combinedObj[i].name])
                    log.debug("tracfoneTotal: LAST "+i,tracfoneTotal)
                    log.debug("--",combinedObj[i].name)
                    // if (tracfoneTotal > 0) {
                    if (combinedObj[i].name != "- None -") {
                        log.debug("COMED: ",combinedObj[i])
                        sublistMarketplaceHandset.setSublistValue({
                            id: 'custpage_marketplace_sales_rep',
                            line: lineNumber,
                            value: combinedObj[i].name
                        });

                        /* sublistMarketplaceHandset.setSublistValue({
                             id: 'custpage_mm_profile',
                             line: lineNumber,
                             value: combinedObj1[combinedObj[i].name]
                         });*/

                        for (var a = 0; a < simSaleObjval.length; a++) {
                            if (simSaleObjval[a].salesRep == combinedObj[i].name) {
                                // if (checkForParameter(simSaleObjval[a].totalAmount)) {
                                sTier1 = simSaleObjval[a].simTier1
                                sTier1Rate = Number(simSaleObjval[a].simTier1Rate)
                                sTier2 = simSaleObjval[a].simTier2
                                sTier2Rate = Number(simSaleObjval[a].simTier2Rate)
                                totalQty+=Number(simSaleObjval[a].quantity)
                                simTotal = parseFloat(simSaleObjval[a].totalAmount)
                                log.debug("totalQty: ",totalQty)
                                log.debug("totalQty 3: ",simSaleObjval[a])
                                // totalSum = Number(totalSum).toFixed(2) + Number(simTotal).toFixed(2)
                                totalSum += parseFloat(simTotal)
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_simsale_commission_total',
                                    line: lineNumber,
                                    value: parseFloat(simSaleObjval[a].totalAmount)
                                });
                                break;
                                // }
                            } else {
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_simsale_commission_total',
                                    line: lineNumber,
                                    value: Number(0).toFixed(2)
                                });
                            }
                        }

                        log.debug("marketResult.length: ",marketResult.length)

                        for (var b = 0; b < marketResult.length; b++) {
                            log.debug("-",marketResult[b].salesRep)

                            if ((marketResult[b].salesRep).toString() == (combinedObj[i].name).toString()) {
                                brandedTotal = marketResult[b].totalAmount
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_warehouse_total',
                                    line: lineNumber,
                                    value: (marketResult.length>0 && checkForParameter(marketResult[b].totalAmount)) ? parseFloat(marketResult[b].totalAmount).toFixed(2) : parseFloat(0).toFixed(2)
                                });
                                break;
                            } else {
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_warehouse_total',
                                    line: lineNumber,
                                    value: parseFloat(0).toFixed(2)
                                });
                            }
                        }

                        for (var c = 0; c < handSetArray.length; c++) {
                            log.debug("handSetArray[c].salesRep: ",handSetArray[c].salesRep)
                            log.debug("combinedObj[i].name: ",combinedObj[i].name)
                            log.debug("BEFORE 1: ",(handSetArray[c].salesRep).toString())
                            log.debug("BEFORE 2: ",(combinedObj[i].name).toString())
                            if ((handSetArray[c].salesRep).toLowerCase() == (combinedObj[i].name).toLowerCase()) {
                                // if (handSetArray[c].salesRep == combinedObj[i].name) {
                                warehouseTotal = parseFloat(handSetArray[c].totalAmount).toFixed(2)
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_branded_total',
                                    line: lineNumber,
                                    value: parseFloat(handSetArray[c].totalAmount).toFixed(2)
                                });
                                break;
                            } else {
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_branded_total',
                                    line: lineNumber,
                                    value: "0.00"
                                });
                            }
                        }

                        for (var d = 0; d < activationArray.length; d++) {
                            log.debug("AA: ",activationArray[d].salesRep)
                            log.debug("AAA: ",combinedObj[i].name)
                            if ((activationArray[d].salesRep).toLowerCase() == (combinedObj[i].name).toLowerCase()) {
                                // if((activationArray[d].companyName) == (combinedObj[i].name)){
                                log.debug("IF ACT")
                                activationTotal = parseFloat(activationArray[d].totalAmount).toFixed(2)
                                log.debug("activationTotal: ",activationTotal)
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_tracfone_activation_total',
                                    line: lineNumber,
                                    value: parseFloat(activationArray[d].totalAmount).toFixed(2)
                                });
                                break;
                            } else {
                                log.debug("ELSE ACT")
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_tracfone_activation_total',
                                    line: lineNumber,
                                    value: "0.00"
                                });
                            }
                        }

                        for (var e = 0; e < airTimeArray.length; e++) {
                            log.debug("airTimeArray[e].salesRep: ",airTimeArray[e].salesRep)
                            log.debug("aircombinedObj[i].name: ",combinedObj[i].name)
                            if ((airTimeArray[e].salesRep).toLowerCase() == (combinedObj[i].name).toLowerCase()) {
                                airtimeTotal = parseFloat(airtimeTotal) + parseFloat(airTimeArray[e].totalAmount).toFixed(2)
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_airtime_total',
                                    line: lineNumber,
                                    value: (airTimeArray.length>0 && checkForParameter(airTimeArray[e].totalAmount)) ? parseFloat(airTimeArray[e].totalAmount).toFixed(2) : parseFloat(0).toFixed(2)
                                });
                                break;
                            } else {
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_airtime_total',
                                    line: lineNumber,
                                    value: "0.00"
                                });
                            }
                        }
                        log.debug("AIR TOTAL: ",airtimeTotal)

                        for (var f = 0; f < extraObj.length; f++) {
                            // if (combinedObj[i].name == "NICKB") {
                            //     log.debug('enter loop', combinedObj[i].name)
                            // }

                            if (extraObj[f].salesRep == combinedObj[i].name) {
                                log.debug('enter loop 2')
                                extraTotal = parseFloat(extraObj[f].totalAmount).toFixed(2)
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_extra_bonus_total',
                                    line: lineNumber,
                                    value: extraTotal
                                });
                                break;
                            } else {
                                sublistMarketplaceHandset.setSublistValue({
                                    id: 'custpage_extra_bonus_total',
                                    line: lineNumber,
                                    value: "0.00"
                                });
                            }
                        }

                        //log.debug("tracfoneintrim.combinedObj[i].name",tracfoneintrim[combinedObj[i].name])

                        if(checkForParameter(marketplaceSimArray) && marketplaceSimArray.length>0) {
                            for (var g = 0; g < marketplaceSimArray[0].marketplaceSimRes.length; g++) {
                                log.debug("marketplaceSimArray[g]: ", marketplaceSimArray[g])
                                if ((marketplaceSimArray[0].marketplaceSimRes[g].marketManager).toLowerCase() == (combinedObj[i].name).toLowerCase()) {
                                    sTier1 = marketplaceSimArray[0].marketplaceSimRes[g].tier1
                                    sTier1Rate = Number(marketplaceSimArray[0].marketplaceSimRes[g].tier1Rate)
                                    sTier2 = marketplaceSimArray[0].marketplaceSimRes[g].tier2
                                    sTier2Rate = Number(marketplaceSimArray[0].marketplaceSimRes[g].tier2Rate)
                                    marketplacesimTotal = marketplaceSimArray[0].marketplaceSimRes[g].commission
                                    totalQty += Number(marketplaceSimArray[0].marketplaceSimRes[g].quantity)
                                    log.debug("totalQty 2: ", totalQty)
                                    log.debug("totalQty 4", marketplaceSimArray[0].marketplaceSimRes[g])
                                    totalSum = Number(totalSum) + Number(marketplacesimTotal)
                                    sublistMarketplaceHandset.setSublistValue({
                                        id: 'custpage_marketplace_sim_total',
                                        line: lineNumber,
                                        value: parseFloat(marketplaceSimArray[0].marketplaceSimRes[g].commission).toFixed(2)
                                    });
                                    break;
                                } else {
                                    sublistMarketplaceHandset.setSublistValue({
                                        id: 'custpage_marketplace_sim_total',
                                        line: lineNumber,
                                        value: Number(0).toFixed(2)
                                    });
                                }
                            }
                        }

                        if(checkForParameter(totalQty) && checkForParameter(sTier1) && checkForParameter(sTier2)) {
                            if(totalQty >= sTier1 && totalQty<sTier2){
                                totalSum = Number(totalQty) * Number(sTier1Rate)
                            }
                            if(totalQty > sTier2){
                                totalSum = Number(totalQty) * Number(sTier2Rate)
                            }
                            // sublistMarketplaceHandset.setSublistValue({
                            //     id: 'custpage_total_sim_commission',
                            //     line: lineNumber,
                            //     value: totalSum ? Number(totalSum).toFixed(2) : Number(0).toFixed(2)
                            // });
                        }

                        log.debug("tracfoneintrim.combinedObj[i].name",tracfoneintrim[combinedObj[i].name])
                        log.debug("BEFORE CHECK")

                        if (checkForParameter(tracfoneintrim[combinedObj[i].name])) {

                            sublistMarketplaceHandset.setSublistValue({
                                id: 'custpage_tracfone_total',
                                line: lineNumber,
                                value: parseFloat(tracfoneintrim[combinedObj[i].name]).toFixed(2)
                            });
                        } else {
                            sublistMarketplaceHandset.setSublistValue({
                                id: 'custpage_tracfone_total',
                                line: lineNumber,
                                value: parseFloat(0).toFixed(2)
                            });
                        }


                        grandTotalCommission+=Number(combinedObj[i].value)
                        log.debug("LAST grandTotalCommission: ",grandTotalCommission)

                        log.debug("activationTotal: LAST ",activationTotal)
                        if((totalObj.salesRep != 'Bryan_Ware') || (totalObj.salesRep != 'N/A')) {
                            totalObj.salesRep = combinedObj[i].name
                            //totalObj.mmProfile = combinedObj1[combinedObj[i].name]
                            totalObj.tracfoneTotal = parseFloat(tracfoneTotal)
                            totalObj.simTotal = parseFloat(simTotal)
                            totalObj.brandedTotal = parseFloat(brandedTotal)
                            totalObj.warehouseTotal = parseFloat(warehouseTotal)
                            totalObj.airtimeTotal = parseFloat(airtimeTotal)
                            totalObj.activationTotal = parseFloat(activationTotal)
                            totalObj.extraTotal = parseFloat(extraTotal)
                            totalObj.marketplacesimTotal = parseFloat(marketplacesimTotal)
                            totalObj.totalAmount = (tracfoneTotal ? parseFloat(tracfoneTotal) : parseFloat(0)) + (simTotal ? parseFloat(simTotal) : parseFloat(0)) + (brandedTotal ? parseFloat(brandedTotal) : parseFloat(0)) + (warehouseTotal ? parseFloat(warehouseTotal) : parseFloat(0)) + (airtimeTotal ? parseFloat(airtimeTotal) : parseFloat(0)) + (activationTotal ? parseFloat(activationTotal) : parseFloat(0)) + (extraTotal ? parseFloat(extraTotal) : parseFloat(0)) + (marketplacesimTotal ? parseFloat(marketplacesimTotal) : parseFloat(0))
                            totalArray.push(totalObj)
                            log.debug("TOTAL OBJ: ", totalObj)
                            log.debug("Z: ", combinedObj[i].name)
                            log.debug("ZZ: ", totalObj.salesRep)


                            sublistMarketplaceHandset.setSublistValue({
                                id: 'custpage_total_profit',
                                line: lineNumber,
                                value: (checkForParameter(totalObj) && checkForParameter(totalObj.totalAmount)) ? Number(totalObj.totalAmount).toFixed(2) : Number(0).toFixed(2)
                            });
                            lineNumber++;
                        }

                    }
                    // }

                }
                log.debug("totalArray: ",totalArray)
                return totalArray;
            },
            /**
             * Function used for combine the marketplace,handset,qpay and warehouse qunatities to fetch the total percetage.
             * @param marketPlaceResult
             * @param handsetResult
             * @param wareHouseResult
             * @param QpayBHSearchResult
             * @returns {*}
             */
            fetchTotalPercetage(marketPlaceResult, handsetResult, wareHouseResult, QpayBHSearchResult) {

                let testArray = []
                let testArrayVal = []
                for (var i = 0; i < marketPlaceResult.length; i++) {
                    let flagChecker = false
                    for (var j = 0; j < handsetResult.length; j++) {
                        if (handsetResult[j].MarketManager.value == marketPlaceResult[i].MarketManager.value) {
                            handsetResult[j].marketQuantity = marketPlaceResult[i].InternalID
                            handsetResult[j].marketCommsion = marketPlaceResult[i].CurrentParentCommission
                            flagChecker = true
                            break;
                        }
                    }
                    if (flagChecker == false) {
                        testArray.push(i)
                        testArrayVal.push(j)
                    }
                }


                let testArray1 = []
                for (var i = 0; i < wareHouseResult.length; i++) {
                    let flagChecker = false
                    for (var j = 0; j < handsetResult.length; j++) {
                        if (handsetResult[j].MarketManager.value == wareHouseResult[i].CompanyName.value) {
                            handsetResult[j].warehouseQuantity = wareHouseResult[i].Quantity
                            handsetResult[j].warehouseCommsion = wareHouseResult[i].EstGrossProfit
                            flagChecker = true
                            break;
                        }
                    }
                    if (flagChecker == false) {
                        testArray1.push(i)
                    }
                }

                let testArray2 = []
                for (var i = 0; i < QpayBHSearchResult.length; i++) {
                    let flagChecker = false
                    for (var j = 0; j < handsetResult.length; j++) {
                        if (handsetResult[j].MarketManager.value == QpayBHSearchResult[i].MarketManager.value) {
                            handsetResult[j].qpayQuantity = QpayBHSearchResult[i].InternalID
                            handsetResult[j].qpayCommsion = QpayBHSearchResult[i].MACommission
                            flagChecker = true
                            break;
                        }
                    }
                    if (flagChecker == false) {
                        testArray2.push(i)
                    }
                }




                if (testArray.length > 0) {
                    for (let k = 0; k < testArray.length; k++)
                         var intrm = testArray[k]
                    handsetResult.push(marketPlaceResult[intrm])
                }


                return handsetResult;
            },
            /**
             * Function used for combine the marketplace,handset,qpay and warehouse qunatities to fetch the total percetage for the warwhouse commission report.
             * @param marketPlaceResult
             * @param handsetResult
             * @param wareHouseResult
             * @returns {*}
             */
            fetchWareHouseTotalPercentage(marketPlaceResult, handsetResult, wareHouseResult) {


                let testArray = []
                let testArrayVal = []
                for (var i = 0; i < marketPlaceResult.length; i++) {
                    let flagChecker = false
                    for (var j = 0; j < wareHouseResult.length; j++) {
                        if (wareHouseResult[j].CompanyName.value == marketPlaceResult[i].MarketManager.value) {
                            wareHouseResult[j].marketQuantity = marketPlaceResult[i].InternalID
                            wareHouseResult[j].marketCommsion = marketPlaceResult[i].CurrentParentCommission
                            flagChecker = true
                            break;
                        }
                    }
                    if (flagChecker == false) {
                        testArray.push(i)
                        testArrayVal.push(j)
                    }
                }


                let testArray1 = []
                for (var i = 0; i < handsetResult.length; i++) {
                    let flagChecker = false
                    for (var j = 0; j < wareHouseResult.length; j++) {
                        if (wareHouseResult[j].CompanyName.value == handsetResult[i].MarketManager.value) {
                            wareHouseResult[j].handsetQuantity = handsetResult[i].InternalID
                            wareHouseResult[j].handsetCommsion = handsetResult[i].MACommission
                            flagChecker = true
                            break;
                        }
                    }
                    if (flagChecker == false) {
                        testArray1.push(i)
                    }
                }

                if (testArray.length > 0) {
                    for (let k = 0; k < testArray.length; k++)
                         var intrm = testArray[k]
                    handsetResult.push(marketPlaceResult[intrm])
                }


                return wareHouseResult;
            },
            //
            testFunction() {
                var tierArray = []
                var customrecord_jj_commision_tierSearchObj = search.create({
                    type: "customrecord_jj_commision_tier",
                    filters:
                        [
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_jj_used_tiers", label: "Used Tiers" })
                        ]
                });
                var searchResultCount = customrecord_jj_commision_tierSearchObj.runPaged().count;
                log.debug("customrecord_jj_commision_tierSearchObj result count", searchResultCount);
                customrecord_jj_commision_tierSearchObj.run().each(function (result) {
                    if (searchResultCount > 0) {
                        var tiername = result.getText({ name: "custrecord_jj_used_tiers", label: "Used Tiers" })
                        tierArray.push(tiername)
                    }
                    return true;
                });
                return tierArray;
            }
        };
        applyTryCatch(exports, "exports");
        return exports;
    });