/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/error', 'N/record', 'N/search'],
    /**
     * @param{error} error
     * @param{record} record
     * @param{search} search
     */
    (error, record, search) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            try{
                getSums();
            }
            catch (e) {
                log.error("Error: ",e.name);
            }
        }

        /**
         * Function to get Sums of each commision and Grand Total of Commisions of a Sales Rep Partner
         */
        function getSums(){
            try {
                var commissionRecord = commisionRecordSearch();//getting results of commisionRecord search
                log.debug("commissionRecord: ",commissionRecord)
                var tracfoneCommision = tracfoneSearch();// getting results of tracfone Commission search
                log.debug("tracfoneCommision: ",tracfoneCommision)
                var simsaleCommision = simsaleSearch();// getting results of simsale Commision search
                log.debug("simsaleCommision: ",simsaleCommision)
                var activationBonus = activationBonusSearch();// getting results of activationBonus Commision search
                log.debug("activationBonus: ",activationBonus)
                var airtimeBonus = airtimeBonusSearch();// getting results of airtimeBonus Commision search
                log.debug("airtimeBonus: ",airtimeBonus)
                var miscellaniousCommision = miscellaniousSearch();// getting results of miscellanious Commision search
                var handsetWarehouseCommision = handsetSearch();// getting results of branded handset and warehouse Commision searches
                log.debug("-------------------: ",handsetWarehouseCommision)
                var marketplaceSimCommission = marketplaceSimSearch()// getting results of marketplace SIM Commission
                log.debug("----M-----",marketplaceSimCommission)
                var handsetCommision = handsetWarehouseCommision.handsetCommission//Branded handset commision search result extracted from handsetWarehouseCommision search
                log.debug("handsetCommision: ",handsetCommision)
                var warehouseCommision = handsetWarehouseCommision.warehouseCommission//Warehouse commision search result extracted from handsetWarehouseCommision search
                log.debug("warehouseCommision: ",warehouseCommision)

                //Other commision calculations and Total commision calculation and saving of records
                var d = new Date();
                var mnt = d.getMonth()
                var month = mnt ==0 ? 11 : mnt-1
                var monthTxt;
                switch (month) {
                    case 0: monthTxt = "January"; break;
                    case 1: monthTxt = "February"; break;
                    case 2: monthTxt = "March"; break;
                    case 3: monthTxt = "April"; break;
                    case 4: monthTxt = "May"; break;
                    case 5: monthTxt = "June"; break;
                    case 6: monthTxt = "July"; break;
                    case 7: monthTxt = "August"; break;
                    case 8: monthTxt = "September"; break;
                    case 9: monthTxt = "October"; break;
                    case 10: monthTxt = "November"; break;
                    case 11: monthTxt = "December"; break;
                    default: return false; break;
                }
                var customRec;
                if(commissionRecord.length>0){
                    commissionRecord.forEach(function(res){
                        if(res.salesRepId){
                            var totalQty = Number(0)
                            var airTot = Number(0)
                            var marketplaceSimTot = Number(0)
                            var totalSum = Number(0)
                            var sTier1,sTier2;
                            var sTier1Rate = Number(0)
                            var sTier2Rate = Number(0)

                            var commissionMonth = monthTxt
                            var tracfone = tracfoneCommision.filter(trac=>trac.salesRep == res.salesRepId)
                            var simsale = simsaleCommision.filter(sim=>sim.salesRep == res.salesRepId)
                            log.debug("SIMMM: ",simsale)
                            var activation = activationBonus.filter(act=>act.salesRep == res.salesRepId)
                            var airtime = airtimeBonus.filter(air=>air.SalesRepPartnerValue == res.salesRepId)
                            log.debug("AIR: ",airtime)
                            log.debug("AIR RES: ",res.salesRepId)
                            var handset = handsetCommision.filter(handWh=>handWh.actualSaleRepId == res.salesRepId)
                            var marketplaceSim = marketplaceSimCommission.filter(mrktSim=>mrktSim.marketplaceSimSalesRepId == res.salesRepId)
                            log.debug("marketplaceSim: ",marketplaceSim)
                            var warehouse = warehouseCommision.filter(wh=>wh.salesRepId == res.salesRepId)
                            var miscellanious = miscellaniousCommision.filter(misc=>misc.salesRepId == res.salesRepId)

                            if(simsale.length>0){
                                totalQty+= Number(simsale[0].quantity)
                            }
                            if(marketplaceSim.length>0){
                                for(var x=0;x<marketplaceSim.length;x++) {
                                    var marketmngr = search.lookupFields({
                                        type: 'partner',
                                        id: marketplaceSim[x].marketplaceSimSalesRepId,
                                        columns: ['companyname']
                                    })
                                    log.debug("---------------------X---",marketmngr)
                                    log.debug("---------------------XM---",marketmngr.companyname.toLowerCase())
                                    if((marketmngr.companyname).toLowerCase() == (marketplaceSim[x].marketplaceSimMarketManager).toLowerCase()) {
                                        log.debug("Ok Qty: ",Number(marketplaceSim[x].marketplaceSimInternalId))
                                        marketplaceSimTot += Number(marketplaceSim[x].marketplaceSimCommission)
                                    }
                                }
                            }
                            log.debug("TOTAL QTY: ",totalQty)
                            log.debug("--A: ",marketplaceSimTot)
                            if(airtime.length>0){
                                for(var x=0;x<airtime.length;x++){
                                    airTot+=parseFloat(airtime[x].totalAmount)
                                }
                            }
                            log.debug("AIR 2: ",airTot)
                            if(simsale.length>0){
                                sTier1 = simsale[0].tier1
                                sTier2 = simsale[0].tier2
                                sTier1Rate = simsale[0].tier1Rate
                                sTier2Rate = simsale[0].tier2Rate
                            }
                            else if(marketplaceSim.length>0){
                                sTier1 = marketplaceSim[0].marketplaceTier1
                                sTier2 = marketplaceSim[0].marketplaceTier2
                                sTier1Rate = marketplaceSim[0].marketplaceTier1Rate
                                sTier2Rate = marketplaceSim[0].marketplaceTier2Rate
                            }
                            log.debug("sTier1: ",sTier1)
                            log.debug("sTier2: ",sTier2)
                            log.debug("sTier1Rate: ",sTier1Rate)
                            log.debug("sTier2Rate: ",sTier2Rate)
                            if(Number(totalQty)>=Number(sTier1) && Number(totalQty)<=Number(sTier2)){
                                totalSum= Number(totalQty) * Number(sTier1Rate)
                            }
                            if(Number(totalQty)>Number(sTier2)){
                                totalSum= Number(totalQty) * Number(sTier2Rate)
                            }

                            log.debug("TOTAL SUM: ",totalSum)

                            var total = Number(0).toFixed(2)
                            total = Number(total)+
                                (tracfone.length>0 ? Number(tracfone[0].tracfone) : Number(0))+
                                (simsale.length>0 ? Number(simsale[0].simsaleSum) : Number(0))+
                                (checkForParameter(marketplaceSimTot) ? marketplaceSimTot : Number(0))+
                                (activation.length>0 ? Number(activation[0].totalAmount) : Number(0))+
                                (checkForParameter(airTot) ? Number(airTot) : Number(0))+
                                (handset.length>0 ? Number(handset[0].warehouseCommission) : Number(0))+
                                (warehouse.length>0 ? Number(warehouse[0].handsetCommission) : Number(0))+
                                (miscellanious.length>0 ? Number(miscellanious[0].miscellaniousCommision) : Number(0))
                            log.debug("total: ",total)

                            customRec = record.load({
                                type: 'customrecord_jj_commision_report',
                                isDynamic: true,
                                id: res.recordId
                            });
                            customRec.setValue({
                                fieldId: 'custrecord_jj_month',
                                value: commissionMonth
                            });
                            customRec.setValue({
                                fieldId: 'custrecord_jj_tracfone',
                                value: tracfone.length>0 ? Number(tracfone[0].tracfone).toFixed(2) : Number(0)
                            });
                            customRec.setValue({
                                fieldId: 'custrecord_jj_sim_sales',
                                value: simsale.length>0 ? Number(simsale[0].simsaleSum) : Number(0)
                            });
                            customRec.setValue({
                                fieldId: 'custrecord_jj_warehouse_commission',
                                value: handset.length>0 ? Number(handset[0].warehouseCommission) : Number(0)
                            })
                            customRec.setValue({
                                fieldId:'custrecord_jj_hand_set_commision',
                                value: warehouse.length>0 ? Number(warehouse[0].handsetCommission) : Number(0)
                            })
                            customRec.setValue({
                                fieldId:'custrecord_jj_marketplace_sim_commission',
                                value: checkForParameter(marketplaceSimTot) ? marketplaceSimTot : Number(0)
                            })
                            customRec.setValue({
                                fieldId: 'custrecord_jj_total_sim_card_commission',
                                value: checkForParameter(totalSum) ? Number(totalSum).toFixed(2) : Number(0)
                            })
                            customRec.setValue({
                                fieldId: 'custrecord_jj_air_time_bonus',
                                value: checkForParameter(airTot) ? Number(airTot) : Number(0)
                            })
                            customRec.setValue({
                                fieldId: 'custrecord_jj_activation_bonus',
                                value: activation.length>0 ? Number(activation[0].totalAmount) : Number(0)
                            });
                            customRec.setValue({
                                fieldId: 'custrecord_jj_miscellaneous_additions',
                                value: miscellanious.length>0 ? Number(miscellanious[0].miscellaniousCommision) : Number(0)
                            });
                            customRec.setValue({
                                fieldId:'custrecord_jj_total_commission' ,
                                value:Number(total).toFixed(2)
                            })
                            var saved = customRec.save();
                        }
                    })
                }
            }
            catch (e) {
                log.error("  Error Not In Execute: ",e.name+"   :   "+ e.message);
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
                    log.error('Empty Value found', 'Empty Value for parameter ' + parameterName);
                return false;
            }
        }

        /**
         * function for commission record search
         * @returns {commisionRecordArray[]} commission record search result Array
         */
        function commisionRecordSearch(){
            var customrecord_jj_commision_reportSearchObj = search.create({
                type: "customrecord_jj_commision_report",
                filters:
                    [
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_JJ_SALESREP_PARTNER",
                            label: "SalesRepPartner ID"
                        }),
                        search.createColumn({
                            name: "custrecord_jj_salesrep_partner",
                            sort: search.Sort.ASC,
                            label: "Sales Rep Partner"
                        }),
                        search.createColumn({name: "custrecord_jj_tracfone", label: "Tracfone"}),
                        search.createColumn({name: "custrecord_jj_sim_sales", label: "Sim Sales"}),
                        search.createColumn({name: "custrecord_jj_warehouse_commission", label: "Warehouse Commission"}),
                        search.createColumn({name: "custrecord_jj_hand_set_commision", label: "Handset Commision"}),
                        search.createColumn({name: "custrecord_jj_marketplace_sim_commission", label: "Marketplace SIM Commission"}),
                        search.createColumn({name: "custrecord_jj_air_time_bonus", label: "Air Time Bonus"}),
                        search.createColumn({name: "custrecord_jj_activation_bonus", label: "Activation Bonus"}),
                        search.createColumn({name: "custrecord_jj_miscellaneous_additions", label: "Miscellaneous Additions"}),
                        search.createColumn({name: "custrecord_jj_total_commission", label: "Total Commision"}),
                        search.createColumn({name: "custrecord_jj_is_show_dashboard", label: "Show In Dashboard"})
                    ]
            });
            var searchResultCount = customrecord_jj_commision_reportSearchObj.runPaged().count;
            log.debug("searchResultCount: ",searchResultCount)
            var commisionRecordArray = []
            if(searchResultCount>0) {
                customrecord_jj_commision_reportSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    var salesRepId = result.getValue({
                        name: "internalid",
                        join: "CUSTRECORD_JJ_SALESREP_PARTNER"
                    });
                    var salesRep = result.getText({
                        name: "custrecord_jj_salesrep_partner",
                        sort: search.Sort.ASC
                    });
                    var recordId = result.getValue({
                        name: "internalid"
                    });

                    commisionRecordArray.push({
                        recordId: recordId,
                        salesRepId: salesRepId,
                        salesRep: salesRep
                    })
                    return true;
                });
            }
            return commisionRecordArray
        }

        /**
         * Search for Tracfone Commisions
         * @returns {unsortedArr[]} Tracfone commision search result array
         */
        function tracfoneSearch(){
            var customrecord_jj_tracfone_activationsSearchObj = search.create({
                type: "customrecord_jj_tracfone_activations",
                filters:
                    [
                        ["custrecord_jj_tra_activation_date","within","lastmonth"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "SalesRepPartner ID"
                        }),
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
            var searchResultCount = customrecord_jj_tracfone_activationsSearchObj.runPaged().count;
            var unsortedArr = [];

            customrecord_jj_tracfone_activationsSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results

                var salesrepPartnerId = result.getValue({
                    name: "internalid",
                    join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                    summary: "GROUP"
                });
                var salesrepPartner = result.getText({
                    name: "custrecord_jj_sales_rep_tracfone",
                    summary: "GROUP"
                });
                var mmProfile = result.getValue({
                    name: "custentity51",
                    join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                    summary: "GROUP"
                });
                var mmProfileTxt = result.getText({
                    name: "custentity51",
                    join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                    summary: "GROUP"
                });
                var tracfoneClass = result.getValue({
                    name: "classnohierarchy",
                    join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                    summary: "GROUP"
                });
                var tier = result.getValue({
                    name: "custrecord_jj_tracfone_teir",
                    summary: "GROUP"
                });
                var tierTxt = result.getText({
                    name: "custrecord_jj_tracfone_teir",
                    summary: "GROUP"
                });
                var qty = result.getValue({
                    name: "internalid",
                    summary: "COUNT"
                });
                var amt = result.getValue({
                    name: "formulatext",
                    summary: "MAX",
                    formula: "CASE WHEN {custrecord_jj_tracfone_teir} = 'AR' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity52} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity52} END WHEN {custrecord_jj_tracfone_teir} = 'ELITE' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity61} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity61} END WHEN {custrecord_jj_tracfone_teir} = 'MEMBER' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity563}  IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity53} END WHEN {custrecord_jj_tracfone_teir} = 'PRO' THEN CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity54} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity54} END WHEN {custrecord_jj_tracfone_teir} = 'VIP' THEN  CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity62} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity62} END WHEN {custrecord_jj_tracfone_teir} = 'EXCLUSIVE' THEN  CASE WHEN {custrecord_jj_sales_rep_tracfone.custentity_jj_trac_exclusive_rate} IS NULL THEN 0 ELSE {custrecord_jj_sales_rep_tracfone.custentity_jj_trac_exclusive_rate} END ELSE 0 END"
                });

                var objSum = 0;

                unsortedArr.push({
                    salesrepPartnerId: salesrepPartnerId,
                    salesrepPartner: salesrepPartner,
                    mmProfile: mmProfile,
                    mmProfileTxt: mmProfileTxt,
                    tracfoneClass: tracfoneClass,
                    tier: tier,
                    tierTxt: tierTxt,
                    qty: Number(qty),
                    amt: Number(amt)
                });
                return true;

            });
            var tracArray = setsublistTracfone(unsortedArr)
            return tracArray;
        }

        /**
         * Set the trackfone sublist value based on the sales rep's
         * @param {Object} unsortedArr
         * @returns {[Array]} tracFoneArray
         */
        function setsublistTracfone(unsortedArr) {
            try{
                //Chi Regional Manager
                var chiARqty = Number(0);
                var chiEliteqty = Number(0);
                var chiMemberqty = Number(0);
                var chiExecutiveqty = Number(0);
                var chiProqty = Number(0);
                var chiExclusiveqty = Number(0);

                var finalChiARqty = Number(0);
                var finalChiEliteqty = Number(0);
                var finalChiMemberqty = Number(0);
                var finalChiExecutiveqty = Number(0);
                var finalChiProqty = Number(0);
                var finalChiExclusiveqty = Number(0);

                //NC
                var NCARqty = Number(0);
                var NCEliteqty = Number(0);
                var NCMemberqty = Number(0);
                var NCExecutiveqty = Number(0);
                var NCProqty = Number(0);
                var NCExclusiveqty = Number(0);

                var finalNCARqty = Number(0);
                var finalNCEliteqty = Number(0);
                var finalNCMemberqty = Number(0);
                var finalNCExecutiveqty = Number(0);
                var finalNCProqty = Number(0);
                var finalNCExclusiveqty = Number(0);

                //NY
                var NYARqty = Number(0);
                var NYEliteqty = Number(0);
                var NYMemberqty = Number(0);
                var NYExecutiveqty = Number(0);
                var NYProqty = Number(0);
                var NYExclusiveqty = Number(0);

                var finalNYARqty = Number(0);
                var finalNYEliteqty = Number(0);
                var finalNYMemberqty = Number(0);
                var finalNYExecutiveqty = Number(0);
                var finalNYProqty = Number(0);
                var finalNYExclusiveqty = Number(0);

                //TX
                var TXARqty = Number(0);
                var TXEliteqty = Number(0);
                var TXMemberqty = Number(0);
                var TXExecutiveqty = Number(0);
                var TXProqty = Number(0);
                var TXExclusiveqty = Number(0);

                var finalTXARqty = Number(0);
                var finalTXEliteqty = Number(0);
                var finalTXMemberqty = Number(0);
                var finalTXExecutiveqty = Number(0);
                var finalTXProqty = Number(0);
                var finalTXExclusiveqty = Number(0);

                //National
                var nationalARqty = Number(0);
                var nationalEliteqty = Number(0);
                var nationalMemberqty = Number(0);
                var nationalExecutiveqty = Number(0);
                var nationalProqty = Number(0);
                var nationalExclusiveqty = Number(0);

                var finalNationalARqty = Number(0);
                var finalNationalEliteqty = Number(0);
                var finalNationalMemberqty = Number(0);
                var finalNationalExecutiveqty = Number(0);
                var finalNationalProqty = Number(0);
                var finalNationalExclusiveqty = Number(0);

                var tracfoneArray = [] //racfone Result Array

                var regularManager = unsortedArr.filter(reg=> (reg.mmProfile !=1 && reg.mmProfile !=2 && reg.mmProfile != 4 && reg.mmProfile !=5 && reg.mmProfile !=6))
                var ncManager = unsortedArr.filter(reg=> reg.mmProfile ==6)
                var chiManager = unsortedArr.filter(reg=> reg.mmProfile ==5)
                var txManager = unsortedArr.filter(reg=> reg.mmProfile ==4)
                var nationalManager = unsortedArr.filter(reg=> reg.mmProfile ==2)
                var nyManager = unsortedArr.filter(reg=> reg.mmProfile ==1)

                //REGULAR MANAGER SECTION
                if(regularManager.length>0) {
                    for (var i = 0; i < regularManager.length; i++) {
                        //Calculating Quantity of NC Regular managers
                        if(regularManager[i].tracfoneClass == 'North Carolina'){
                            if(regularManager[i].tier == 2){
                                NCARqty = Number(NCARqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 3){
                                NCMemberqty = Number(NCMemberqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 4){
                                NCEliteqty = Number(NCEliteqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 5){
                                NCProqty = Number(NCProqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tierTxt == 'EXECUTIVE'){
                                NCExecutiveqty = Number(NCExecutiveqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 10){
                                NCExclusiveqty = Number(NCExclusiveqty)+Number(regularManager[i].qty)
                            }
                        }
                        //Calculating Quantity of NY Regular managers
                        if(regularManager[i].tracfoneClass == 'New York'){
                            if(regularManager[i].tier == 2){
                                NYARqty = Number(NYARqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 3){
                                NYMemberqty = Number(NYMemberqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 4){
                                NYEliteqty = Number(NYEliteqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 5){
                                NYProqty = Number(NYProqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tierTxt == 'EXECUTIVE'){
                                NYExecutiveqty = Number(NYExecutiveqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 10){
                                NYExclusiveqty = Number(NYExclusiveqty)+Number(regularManager[i].qty)
                            }
                        }
                        //Calculating Quantity of Chi Regular managers
                        if(regularManager[i].tracfoneClass == 'Illinois'){

                            if(regularManager[i].tier == 2){
                                chiARqty = Number(chiARqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 3){
                                chiMemberqty = Number(chiMemberqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 4){
                                chiEliteqty = Number(chiEliteqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 5){
                                chiProqty = Number(chiProqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tierTxt == 'EXECUTIVE'){
                                chiExecutiveqty = Number(chiExecutiveqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 10){
                                chiExclusiveqty = Number(chiExclusiveqty)+Number(regularManager[i].qty)
                            }
                        }
                        //Calculating Quantity of Virginia Regular managers
                        if(regularManager[i].tracfoneClass == 'Virginia'){
                            if(regularManager[i].tier == 2){
                                nationalARqty = Number(nationalARqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 3){
                                nationalMemberqty = Number(nationalMemberqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 4){
                                nationalEliteqty = Number(nationalEliteqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 5){
                                nationalProqty = Number(nationalProqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tierTxt == 'EXECUTIVE'){
                                nationalExecutiveqty = Number(nationalExecutiveqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 10){
                                nationalExclusiveqty = Number(nationalExclusiveqty)+Number(regularManager[i].qty)
                            }
                        }

                        if(regularManager[i].tracfoneClass == 'TX'){
                            if(regularManager[i].tier == 2){
                                TXARqty = Number(TXARqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 3){
                                TXMemberqty = Number(TXMemberqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 4){
                                TXEliteqty = Number(TXEliteqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 5){
                                TXProqty = Number(TXProqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tierTxt == 'EXECUTIVE'){
                                TXExecutiveqty = Number(TXExecutiveqty)+Number(regularManager[i].qty)
                            }

                            if(regularManager[i].tier == 10){
                                TXExclusiveqty = Number(TXExclusiveqty)+Number(regularManager[i].qty)
                            }
                        }
                    }
                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    if(commissionRecord.length>0){
                        var k;
                        //For Regular Marketting Managers
                        for(var j=0;j<commissionRecord.length;j++){
                            k = regularManager.filter(reg=>reg.salesrepPartnerId == commissionRecord[j].salesRepId)

                            if(k.length>0){
                                var repSum = Number(0).toFixed(2)
                                for(var x=0;x<k.length;x++){
                                    repSum = Number(repSum) + (Number(k[x].qty) * Number(k[x].amt));
                                }
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }
                    }
                }

                //NY REGIONAL MANAGER SECTION
                if(nyManager.length>0) {
                    finalNYARqty = Number(finalNYARqty)+Number(NYARqty)
                    finalNYEliteqty = Number(finalNYEliteqty)+Number(NYEliteqty)
                    finalNYMemberqty = Number(finalNYMemberqty)+Number(NYMemberqty)
                    finalNYProqty = Number(finalNYProqty)+Number(NYProqty)
                    finalNYExclusiveqty = Number(finalNYExclusiveqty)+Number(NYExclusiveqty)
                    finalNYExecutiveqty = Number(finalNYExecutiveqty)+Number(NYExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var k;
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            k =nyManager.filter(reg=>reg.salesrepPartnerId == commissionRecord[j].salesRepId)
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(k.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)
                                for(var x=0;x<k.length;x++){

                                    if(k[x].tier == 2){//AR
                                        finalNYARqty = Number(finalNYARqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 3){//Member
                                        finalNYMemberqty = Number(finalNYMemberqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 4){//Elite
                                        finalNYEliteqty = Number(finalNYEliteqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 5){//PRO
                                        finalNYProqty = Number(finalNYProqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 10){//Exclusive
                                        finalNYExclusiveqty = Number(finalNYExclusiveqty)+Number(k[x].qty)
                                    }

                                    if(k[x].tierTxt == 'EXECUTIVE'){//Executive
                                        finalNYExecutiveqty = Number(finalNYExecutiveqty)+Number(k[x].qty)
                                    }

                                }
                                nationalARqty = Number(nationalARqty)+Number(finalNYARqty)
                                nationalEliteqty = Number(nationalEliteqty)+Number(finalNYEliteqty)
                                nationalMemberqty = Number(nationalMemberqty)+Number(finalNYMemberqty)
                                nationalExecutiveqty = Number(nationalExecutiveqty)+Number(finalNYExecutiveqty)
                                nationalProqty = Number(nationalProqty)+Number(finalNYProqty)
                                nationalExclusiveqty = Number(nationalExclusiveqty)+Number(finalNYExclusiveqty)

                                ARRate = Number(finalNYARqty)*Number(r[0].AR);
                                EliteRate = Number(finalNYEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalNYMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalNYProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalNYExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalNYExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }

                if(chiManager.length == 0){
                    finalNYARqty = Number(finalNYARqty)+Number(NYARqty)
                    finalNYEliteqty = Number(finalNYEliteqty)+Number(NYEliteqty)
                    finalNYMemberqty = Number(finalNYMemberqty)+Number(NYMemberqty)
                    finalNYProqty = Number(finalNYProqty)+Number(NYProqty)
                    finalNYExclusiveqty = Number(finalNYExclusiveqty)+Number(NYExclusiveqty)
                    finalNYExecutiveqty = Number(finalNYExecutiveqty)+Number(NYExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(r.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)

                                ARRate = Number(finalNYARqty)*Number(r[0].AR);
                                EliteRate = Number(finalNYEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalNYMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalNYProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalNYExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalNYExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }
                    }
                }

                //CHI REGIONAL MANAGER SECTION
                if(chiManager.length>0) {
                    finalChiARqty = Number(finalChiARqty)+Number(chiARqty)
                    finalChiEliteqty = Number(finalChiEliteqty)+Number(chiEliteqty)
                    finalChiMemberqty = Number(finalChiMemberqty)+Number(chiMemberqty)
                    finalChiProqty = Number(finalChiProqty)+Number(chiProqty)
                    finalChiExclusiveqty = Number(finalChiExclusiveqty)+Number(chiExclusiveqty)
                    finalChiExecutiveqty = Number(finalChiExecutiveqty)+Number(chiExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var k;
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            k =chiManager.filter(reg=>reg.salesrepPartnerId == commissionRecord[j].salesRepId)
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(k.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)
                                for(var x=0;x<k.length;x++){

                                    if(k[x].tier == 2){//AR
                                        finalChiARqty = Number(finalChiARqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 3){//Member
                                        finalChiMemberqty = Number(finalChiMemberqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 4){//Elite
                                        finalChiEliteqty = Number(finalChiEliteqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 5){//PRO
                                        finalChiProqty = Number(finalChiProqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 10){//Exclusive
                                        finalChiExclusiveqty = Number(finalChiExclusiveqty)+Number(k[x].qty)
                                    }

                                    if(k[x].tierTxt == 'EXECUTIVE'){//Executive
                                        finalChiExecutiveqty = Number(finalChiExecutiveqty)+Number(k[x].qty)
                                    }

                                }
                                nationalARqty = Number(nationalARqty)+Number(finalChiARqty)
                                nationalEliteqty = Number(nationalEliteqty)+Number(finalChiEliteqty)
                                nationalMemberqty = Number(nationalMemberqty)+Number(finalChiMemberqty)
                                nationalExecutiveqty = Number(nationalExecutiveqty)+Number(finalChiExecutiveqty)
                                nationalProqty = Number(nationalProqty)+Number(finalChiProqty)
                                nationalExclusiveqty = Number(nationalExclusiveqty)+Number(finalChiExclusiveqty)

                                ARRate = Number(finalChiARqty)*Number(r[0].AR);
                                EliteRate = Number(finalChiEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalChiMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalChiProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalChiExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalChiExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }

                if(chiManager.length == 0){
                    finalChiARqty = Number(finalChiARqty)+Number(chiARqty)
                    finalChiEliteqty = Number(finalChiEliteqty)+Number(chiEliteqty)
                    finalChiMemberqty = Number(finalChiMemberqty)+Number(chiMemberqty)
                    finalChiProqty = Number(finalChiProqty)+Number(chiProqty)
                    finalChiExclusiveqty = Number(finalChiExclusiveqty)+Number(chiExclusiveqty)
                    finalChiExecutiveqty = Number(finalChiExecutiveqty)+Number(chiExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(r.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)

                                ARRate = Number(finalChiARqty)*Number(r[0].AR);
                                EliteRate = Number(finalChiEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalChiMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalChiProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalChiExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalChiExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }

                //NC REGIONAL MANAGER SECTION
                if(ncManager.length>0) {
                    finalNCARqty = Number(finalNCARqty)+Number(NCARqty)
                    finalNCEliteqty = Number(finalNCEliteqty)+Number(NCEliteqty)
                    finalNCMemberqty = Number(finalNCMemberqty)+Number(NCMemberqty)
                    finalNCProqty = Number(finalNCProqty)+Number(NCProqty)
                    finalNCExclusiveqty = Number(finalNCExclusiveqty)+Number(NCExclusiveqty)
                    finalNCExecutiveqty = Number(finalNCExecutiveqty)+Number(NCExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var k;
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            k =ncManager.filter(reg=>reg.salesrepPartnerId == commissionRecord[j].salesRepId)
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(k.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)
                                for(var x=0;x<k.length;x++){

                                    if(k[x].tier == 2){//AR
                                        finalNCARqty = Number(finalNCARqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 3){//Member
                                        finalNCMemberqty = Number(finalNCMemberqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 4){//Elite
                                        finalNCEliteqty = Number(finalNCEliteqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 5){//PRO
                                        finalNCProqty = Number(finalNCProqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 10){//Exclusive
                                        finalNCExclusiveqty = Number(finalNCExclusiveqty)+Number(k[x].qty)
                                    }

                                    if(k[x].tierTxt == 'EXECUTIVE'){//Executive
                                        finalNCExecutiveqty = Number(finalNCExecutiveqty)+Number(k[x].qty)
                                    }

                                }
                                nationalARqty = Number(nationalARqty)+Number(finalNCARqty)
                                nationalEliteqty = Number(nationalEliteqty)+Number(finalNCEliteqty)
                                nationalMemberqty = Number(nationalMemberqty)+Number(finalNCMemberqty)
                                nationalExecutiveqty = Number(nationalExecutiveqty)+Number(finalNCExecutiveqty)
                                nationalProqty = Number(nationalProqty)+Number(finalNCProqty)
                                nationalExclusiveqty = Number(nationalExclusiveqty)+Number(finalNCExclusiveqty)

                                ARRate = Number(finalNCARqty)*Number(r[0].AR);
                                EliteRate = Number(finalNCEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalNCMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalNCProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalNCExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalNCExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }

                if(ncManager.length == 0){
                    finalNCARqty = Number(finalNCARqty)+Number(NCARqty)
                    finalNCEliteqty = Number(finalNCEliteqty)+Number(NCEliteqty)
                    finalNCMemberqty = Number(finalNCMemberqty)+Number(NCMemberqty)
                    finalNCProqty = Number(finalNCProqty)+Number(NCProqty)
                    finalNCExclusiveqty = Number(finalNCExclusiveqty)+Number(NCExclusiveqty)
                    finalNCExecutiveqty = Number(finalNCExecutiveqty)+Number(NCExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(r.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)

                                ARRate = Number(finalNCARqty)*Number(r[0].AR);
                                EliteRate = Number(finalNCEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalNCMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalNCProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalNCExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalNCExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }

                //TX REGIONAL MANAGER SECTION
                if(txManager.length>0) {
                    finalTXARqty = Number(finalTXARqty)+Number(TXARqty)
                    finalTXEliteqty = Number(finalTXEliteqty)+Number(TXEliteqty)
                    finalTXMemberqty = Number(finalTXMemberqty)+Number(TXMemberqty)
                    finalTXProqty = Number(finalTXProqty)+Number(TXProqty)
                    finalTXExclusiveqty = Number(finalTXExclusiveqty)+Number(TXExclusiveqty)
                    finalTXExecutiveqty = Number(finalTXExecutiveqty)+Number(TXExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var k;
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            k =txManager.filter(reg=>reg.salesrepPartnerId == commissionRecord[j].salesRepId)
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(k.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)
                                for(var x=0;x<k.length;x++){

                                    if(k[x].tier == 2){//AR
                                        finalTXARqty = Number(finalTXARqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 3){//Member
                                        finalTXMemberqty = Number(finalTXMemberqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 4){//Elite
                                        finalTXEliteqty = Number(finalTXEliteqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 5){//PRO
                                        finalTXProqty = Number(finalTXProqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 10){//Exclusive
                                        finalTXExclusiveqty = Number(finalTXExclusiveqty)+Number(k[x].qty)
                                    }

                                    if(k[x].tierTxt == 'EXECUTIVE'){//Executive
                                        finalTXExecutiveqty = Number(finalTXExecutiveqty)+Number(k[x].qty)
                                    }

                                }
                                nationalARqty = Number(nationalARqty)+Number(finalTXARqty)
                                nationalEliteqty = Number(nationalEliteqty)+Number(finalTXEliteqty)
                                nationalMemberqty = Number(nationalMemberqty)+Number(finalTXMemberqty)
                                nationalExecutiveqty = Number(nationalExecutiveqty)+Number(finalTXExecutiveqty)
                                nationalProqty = Number(nationalProqty)+Number(finalTXProqty)
                                nationalExclusiveqty = Number(nationalExclusiveqty)+Number(finalTXExclusiveqty)

                                ARRate = Number(finalTXARqty)*Number(r[0].AR);
                                EliteRate = Number(finalTXEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalTXMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalTXProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalTXExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalTXExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }

                if(txManager.length == 0){
                    finalTXARqty = Number(finalTXARqty)+Number(TXARqty)
                    finalTXEliteqty = Number(finalTXEliteqty)+Number(TXEliteqty)
                    finalTXMemberqty = Number(finalTXMemberqty)+Number(TXMemberqty)
                    finalTXProqty = Number(finalTXProqty)+Number(TXProqty)
                    finalTXExclusiveqty = Number(finalTXExclusiveqty)+Number(TXExclusiveqty)
                    finalTXExecutiveqty = Number(finalTXExecutiveqty)+Number(TXExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var k;
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(r.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)

                                ARRate = Number(finalTXARqty)*Number(r[0].AR);
                                EliteRate = Number(finalTXEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalTXMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalTXProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalTXExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalTXExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }

                }

                //NATIONAL MANAGER SECTION
                if(nationalManager.length>0) {
                    finalNationalARqty = Number(finalNationalARqty)+Number(nationalARqty)
                    finalNationalEliteqty = Number(finalNationalEliteqty)+Number(nationalEliteqty)
                    finalNationalMemberqty = Number(finalNationalMemberqty)+Number(nationalMemberqty)
                    finalNationalProqty = Number(finalNationalProqty)+Number(nationalProqty)
                    finalNationalExclusiveqty = Number(finalTXExclusiveqty)+Number(nationalExclusiveqty)
                    finalNationalExecutiveqty = Number(finalTXExecutiveqty)+Number(nationalExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var k;
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            k =nationalManager.filter(reg=>reg.salesrepPartnerId == commissionRecord[j].salesRepId)
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(k.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)
                                for(var x=0;x<k.length;x++){

                                    if(k[x].tier == 2){//AR
                                        finalNationalARqty = Number(finalNationalARqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 3){//Member
                                        finalNationalMemberqty = Number(finalNationalMemberqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 4){//Elite
                                        finalNationalEliteqty = Number(finalNationalEliteqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 5){//PRO
                                        finalNationalProqty = Number(finalNationalProqty)+Number(k[x].qty)
                                    }
                                    if(k[x].tier == 10){//Exclusive
                                        finalNationalExclusiveqty = Number(finalNationalExclusiveqty)+Number(k[x].qty)
                                    }

                                    if(k[x].tierTxt == 'EXECUTIVE'){//Executive
                                        finalNationalExecutiveqty = Number(finalNationalExecutiveqty)+Number(k[x].qty)
                                    }

                                }
                                ARRate = Number(finalNationalARqty)*Number(r[0].AR);
                                EliteRate = Number(finalNationalEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalNationalMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalNationalProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalNationalExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalNationalExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }

                if(nationalManager.length == 0){
                    finalNationalARqty = Number(finalNationalARqty)+Number(nationalARqty)
                    finalNationalEliteqty = Number(finalNationalEliteqty)+Number(nationalEliteqty)
                    finalNationalMemberqty = Number(finalNationalMemberqty)+Number(nationalMemberqty)
                    finalNationalProqty = Number(finalNationalProqty)+Number(nationalProqty)
                    finalNationalExclusiveqty = Number(finalNationalExclusiveqty)+Number(nationalExclusiveqty)
                    finalNationalExecutiveqty = Number(finalNationalExecutiveqty)+Number(nationalExecutiveqty)

                    //Calculations of Commision
                    var commissionRecord = commisionRecordSearch()
                    var regionalManagers = tracfoneReginalManegerSearch()
                    if(commissionRecord.length>0){
                        var k;
                        var r;
                        for(var j=0;j<commissionRecord.length;j++){
                            r = regionalManagers.filter(reg=>reg.salesRep == commissionRecord[j].salesRepId)
                            if(r.length>0){
                                var ARRate = Number(0).toFixed(2)
                                var EliteRate = Number(0).toFixed(2)
                                var MemberRate = Number(0).toFixed(2)
                                var ProRate = Number(0).toFixed(2)
                                var ExlusiveRate = Number(0).toFixed(2)
                                var ExecutiveRate = Number(0).toFixed(2)

                                ARRate = Number(finalNationalARqty)*Number(r[0].AR);
                                EliteRate = Number(finalNationalEliteqty)*Number(r[0].Elite)
                                MemberRate = Number(finalNationalMemberqty)*Number(r[0].Member)
                                ProRate = Number(finalNationalProqty)*Number(r[0].Pro)
                                ExecutiveRate = Number(finalNationalExecutiveqty)*Number(r[0].Executive)
                                ExlusiveRate = Number(finalNationalExclusiveqty)*Number(r[0].Exclusive)
                                var repSum =Number(ARRate) + Number(MemberRate) + Number(EliteRate) + Number(ProRate) + Number(ExlusiveRate) + Number(ExecutiveRate)
                                tracfoneArray.push({
                                    salesRep: commissionRecord[j].salesRepId,
                                    salesrepPartner: commissionRecord[j].salesRep,
                                    tracfone: repSum
                                });
                            }
                        }

                    }
                }
                return tracfoneArray
            }
            catch (e) {
                log.error("Error @ Tracfone Calculation: "+e.name+"    ====>    "+e.message);
            }
        }

        /**
         * Search for Handset Commisions
         * @returns {marketPlace[{}]} Handset search result (Array of Objects)
         */
        function handsetSearch(){
            var customrecord_jj_branded_handsetSearchObj = search.create({
                type: "customrecord_jj_branded_handset",
                filters:
                    [
                        ["custrecord_jj_sales_rep.class", "noneof", "@NONE@"],"AND",
                        ["custrecord_jj_date_filled","within","lastmonth"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_JJ_SALES_REP",
                            summary: "GROUP",
                            label: "Sales Rep ID"
                        }),
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
            var handsetArr = [];
            customrecord_jj_branded_handsetSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var handsetSalesRepId = result.getValue({
                    name: "internalid",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetMarketManager = result.getValue({
                    name: "custrecord_jj_brd_handset_mkt_manager",
                    summary: "GROUP"
                });
                var handsetInternalId = result.getValue({
                    name: "internalid",
                    summary: "COUNT"
                })
                var handsetMACommision = result.getValue({
                    name: "custrecordmacommission",
                    summary: "SUM"
                })
                var handsetMMProfile = result.getText({
                    name: "custentity51",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetMMProfileVal = result.getValue({
                    name: "custentity51",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetBrandedHSTier1 = result.getValue({
                    name: "custentity_jj_branded_handset_count",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetBrandedHSTierRate1 = result.getValue({
                    name: "custentity57",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetBrandedHSTier2 = result.getValue({
                    name: "custentity64",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetBrandedHSTierRate2 = result.getValue({
                    name: "custentity63",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetClass =  result.getValue({
                    name: "class",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })
                var handsetClassTxt =  result.getText({
                    name: "class",
                    join: "CUSTRECORD_JJ_SALES_REP",
                    summary: "GROUP"
                })

                handsetArr.push({
                    handsetSalesRepId: handsetSalesRepId,
                    handsetMarketManager: handsetMarketManager,
                    handsetInternalId: handsetInternalId,
                    handsetMACommision: handsetMACommision,
                    handsetMMProfile: handsetMMProfile,
                    handsetMMProfileVal: handsetMMProfileVal,
                    handsetClass: handsetClass,
                    handsetClassTxt: handsetClassTxt,
                    handsetBrandedHSTier1: handsetBrandedHSTier1,
                    handsetBrandedHSTierRate1: handsetBrandedHSTierRate1,
                    handsetBrandedHSTier2: handsetBrandedHSTier2,
                    handsetBrandedHSTierRate2: handsetBrandedHSTierRate2
                })
                log.debug("handsetArr: ",handsetArr)
                return true;
            });
            var marketPlace = marketPlaceSearch(handsetArr)
            return marketPlace;
        }

        /**
         * Search for Marketplace SIM Commisions
         * @returns {marketPlace[{}]} Marketplace SIM search result (Array of Objects)
         */
        function marketplaceSimSearch(){
            try{
                var customrecord_jj_marketplace_sales_orderSearchObj = search.create({
                    type: "customrecord_jj_marketplace_sales_order",
                    filters:
                        [
                            ["custrecord_jj_date_ordered","within","lastmonth"],
                            "AND",
                            ["custrecord_jj_marketplace_salesrep_partr","noneof","@NONE@"],
                            "AND",
                            ["custrecord_jj_marketplace_subcategory","anyof","2","3"],
                            "AND",
                            [[["custrecord_jj_marketplace_salesrep_partr.custentity_sim_cards_teir_1","isnotempty",""]],"OR",[["custrecord_jj_marketplace_salesrep_partr.custentity70","isnotempty",""]]]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                summary: "GROUP",
                                label: "Sales Rep Partner ID"
                            }),
                            search.createColumn({
                                name: "altname",
                                join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                summary: "GROUP",
                                label: "Sales Rep Partner"
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
                                label: "Sim Tier 1"
                            }),
                            search.createColumn({
                                name: "custentity81",
                                join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                summary: "GROUP",
                                label: "Sim Tier 1 Rate"
                            }),
                            search.createColumn({
                                name: "custentity70",
                                join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                summary: "GROUP",
                                label: "Sim Tier 2"
                            }),
                            search.createColumn({
                                name: "custentity82",
                                join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                                summary: "GROUP",
                                label: "Sim Tier 2 Rate"
                            })
                        ]
                });
                var searchResultCount = customrecord_jj_marketplace_sales_orderSearchObj.runPaged().count;
                log.debug("customrecord_jj_marketplace_sales_orderSearchObj result count",searchResultCount);
                var res = [];
                if(searchResultCount>0) {
                    customrecord_jj_marketplace_sales_orderSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var marketplaceSimSalesRepId = result.getValue({
                            name: "internalid",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP"
                        })
                        var marketplaceSimSalesRep = result.getValue({
                            name: "altname",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP"
                        })
                        var marketplaceMarketManager = result.getValue({
                            name: "custrecord_jj_mkt_so_mkt_manager",
                            summary: "GROUP"
                        })
                        var marketplaceInternalId = result.getValue({
                            name: "internalid",
                            summary: "COUNT"
                        })
                        var marketplaceTier1 = result.getValue({
                            name: "custentity_sim_cards_teir_1",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP"
                        })
                        var marketplaceTier1Rate = result.getValue({
                            name: "custentity81",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP"
                        })
                        var marketplaceTier2 = result.getValue({
                            name: "custentity70",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP"
                        })
                        var marketplaceTier2Rate = result.getValue({
                            name: "custentity82",
                            join: "CUSTRECORD_JJ_MARKETPLACE_SALESREP_PARTR",
                            summary: "GROUP"
                        })

                        var tierRate = 0

                        log.debug("marketplaceInternalId: ",marketplaceInternalId)
                        var commission = Number(0)
                        if((Number(marketplaceInternalId)>=Number(marketplaceTier1)) && (Number(marketplaceInternalId)<=Number(marketplaceTier2))){
                            tierRate = marketplaceTier1Rate.split('%')
                            log.debug("tierRate: ",tierRate)
                            if(tierRate.length>0) {
                                var rate = Number(rate) / Number(100)
                                log.debug("rate: ", rate)
                                commission = Number(marketplaceInternalId) * Number(tierRate[0])
                            }
                        }
                        if(Number(marketplaceInternalId)>Number(marketplaceTier2)){
                            tierRate = marketplaceTier2Rate.split('%')
                            log.debug("tierRate: ",tierRate)
                            if(tierRate.length>0) {
                                var rate = Number(rate) / Number(100)
                                log.debug("rate: ", rate)
                                commission = Number(marketplaceInternalId) * Number(tierRate[0])
                            }
                        }
                        log.debug("tierRate: ",tierRate)
                        log.debug("commission: ",commission)
                        res.push({
                            marketplaceSimSalesRepId: marketplaceSimSalesRepId,
                            marketplaceSimSalesRep: marketplaceSimSalesRep,
                            marketplaceSimMarketManager: marketplaceMarketManager,
                            marketplaceSimInternalId: marketplaceInternalId,
                            marketplaceTier1: marketplaceTier1,
                            marketplaceTier1Rate: marketplaceTier1Rate,
                            marketplaceTier2: marketplaceTier2,
                            marketplaceTier2Rate: marketplaceTier2Rate,
                            marketplaceSimTierRate: tierRate.length>0 ? tierRate[0] : Number(0),
                            marketplaceSimCommission: commission.toFixed(2)
                        })

                        return true;
                    });
                }
                log.debug("MArketplace SIM Result: ",res)
                return res;
            }
            catch (e) {
                log.debug("Error @ marketplaceSimSearch: ",e.name+" : "+e.message)
            }
        }

        /**
         * Search for Marketplace
         * @param {*} handsetArr - results from the function handsetSearch
         * @returns {warehouse[{}]} Marketplace search results
         */
        function marketPlaceSearch(handsetArr){
            var customrecord_jj_marketplace_sales_orderSearchObj = search.create({
                type: "customrecord_jj_marketplace_sales_order",
                filters:
                    [
                        ["custrecord_jj_marketplace_date_shipped","within","lastmonth"],
                        "AND",
                        ["custrecord_jj_marketplace_salesrep_partr","noneof","@NONE@"],
                        "AND",
                        ["custrecord_jj_marketplace_subcategory","anyof","@NONE@","1"]
                    ],
                columns:
                    [
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
            var marketplaceSArr = [];
            customrecord_jj_marketplace_sales_orderSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var marketplaceMarketManager = result.getValue({
                    name: "custrecord_jj_mkt_so_mkt_manager",
                    summary: "GROUP"
                });
                var marketplaceInternalId = result.getValue({
                    name: "internalid",
                    summary: "COUNT"
                });
                var marketplaceCurrentParentCommission = result.getValue({
                    name: "custrecord_jj_current_parent_commission",
                    summary: "SUM"
                });

                marketplaceSArr.push({
                    marketplaceMarketManager: marketplaceMarketManager,
                    marketplaceInternalId: marketplaceInternalId,
                    marketplaceCurrentParentCommission: marketplaceCurrentParentCommission
                })
                return true;
            });
            var warehouse = warehouseCommisionSearch(handsetArr,marketplaceSArr);
            return warehouse;
        }

        /**
         * Function for defines the warehouse commission report search
         * @param {*} handsetArr - results from handset commission search
         * @param {*} marketplaceArr - results from marketplace search
         * @returns {qpayBrand[{}]} warehousecommission search result
         */
        function warehouseCommisionSearch(handsetArr,marketplaceSArr){
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["closedate","within","lastmonth"],
                        "AND",["type", "anyof", "CustInvc", "CustCred"],
                        "AND", ["status", "anyof", "CustInvc:B"],
                        "AND", ["cogs", "is", "F"],
                        "AND", ["shipping", "is", "F"],
                        "AND", ["taxline", "is", "F"],
                        "AND", ["item.type", "anyof", "InvtPart"],
                        "AND", ["class", "noneof", "@NONE@"],
                        "AND", ["custcol_commitemgroup", "anyof", "8", "1"],
                        "AND", ["custbody_jj_actual_sales_person.custentity_jj_is_commissionable", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "class",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "Class"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                            summary: "GROUP",
                            label: "Actual SalesPerson ID"
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
            var searchResultCount = transactionSearchObj.runPaged().count;
            var warehouseArr = [];
            transactionSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var warehouseCompanyName = result.getValue({
                    name: "companyname",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                });
                var warehouseQuantity = result.getValue({
                    name: "quantity",
                    summary: "SUM"
                });
                var warehouseEstGrossProfit = result.getValue({
                    name: "estgrossprofit",
                    summary: "SUM"
                });
                var warehouseMarketPlaceTier1 = result.getValue({
                    name: "custentity86",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                });
                var warehouseMarketPlaceTier1Rate = result.getValue({
                    name: "custentity87",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                });
                var warehouseMarketPlaceTier2 = result.getValue({
                    name: "custentity_jj_warehouse_qty_gt_600",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                });
                var warehouseMarketPlaceTier2Rate = result.getValue({
                    name: "custentity_jj_warehouse_payout_rate_2",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                })
                var warehouseActualSalesPerson = result.getText({
                    name: "custbody_jj_actual_sales_person",
                    summary: "GROUP"
                });
                var warehouseActualSalesPersonId = result.getValue({
                    name: "internalid",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                });
                var warehouseMMProfile = result.getText({
                    name: "custentity51",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                })
                var warehouseMMProfileVal = result.getValue({
                    name: "custentity51",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                })
                var warehouseClass = result.getText({
                    name: "class",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                })
                var warehouseClassVal = result.getValue({
                    name: "class",
                    join: "CUSTBODY_JJ_ACTUAL_SALES_PERSON",
                    summary: "GROUP"
                })
                warehouseArr.push({
                    warehouseCompanyName: warehouseCompanyName,
                    warehouseQuantity: warehouseQuantity,
                    warehouseEstGrossProfit: warehouseEstGrossProfit,
                    warehouseMarketPlaceTier1: warehouseMarketPlaceTier1,
                    warehouseMarketPlaceTier1Rate: warehouseMarketPlaceTier1Rate,
                    warehouseMarketPlaceTier2: warehouseMarketPlaceTier2,
                    warehouseMarketPlaceTier2Rate: warehouseMarketPlaceTier2Rate,
                    warehouseActualSalesPerson: warehouseActualSalesPerson,
                    warehouseActualSalesPersonId: warehouseActualSalesPersonId,
                    warehouseMMProfile: warehouseMMProfile,
                    warehouseMMProfileVal: warehouseMMProfileVal,
                    warehouseClass: warehouseClass,
                    warehouseClassVal: warehouseClassVal
                });
                return true;
            });
            var qpayBrand = qpayBrandedSearch(handsetArr,marketplaceSArr,warehouseArr);
            return qpayBrand;
        }

        /**
         * The search is used to fetch qpay branded search details
         * @param {*} handsetArr - results from handset commission search
         * @param {*} marketplaceArr - results from marketplace search
         * @param {*} warehouseArr - results from warehouse commission search
         * @returns {totalPercentage[{}]} qpayBranded handset search results
         */
        function qpayBrandedSearch(handsetArr,marketplaceSArr,warehouseArr){
            var qpayArr = [];
            var customrecord_jj_qpay_marketplace_detailsSearchObj = search.create({
                type: "customrecord_jj_qpay_marketplace_details",
                filters:
                    [
                        ["custrecord_jj_order_date","within","lastmonth"]
                    ],
                columns:
                    [
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
            customrecord_jj_qpay_marketplace_detailsSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var qpaybrandMarketmanager = result.getValue({
                    name: "custrecord_jj_qpay_mktplace_mkt_manager",
                    summary: "GROUP"
                });
                var qpaybrandInternalId = result.getValue({
                    name: "internalid",
                    summary: "COUNT"
                });
                var qpaybrandMACommission = result.getValue({
                    name: "custrecord_jj_ma_commission",
                    summary: "SUM"
                });
                qpayArr.push({
                    qpaybrandMarketmanager: qpaybrandMarketmanager,
                    qpaybrandInternalId: qpaybrandInternalId,
                    qpaybrandMACommission: qpaybrandMACommission
                });
                return true;
            });
            var totalPercentage = fetchTotalPercetage(handsetArr,marketplaceSArr,warehouseArr,qpayArr);
            return totalPercentage;
        }

        /**
         * Function used for combine the marketplace,handset,qpay and warehouse qunatities to fetch the total percetage.
         * @param marketPlaceResult
         * @param handsetResult
         * @param wareHouseResult
         * @param QpayBHSearchResult
         * @returns {handset[{}]} handset commision results and warehouse commision results
         */
        function fetchTotalPercetage(handsetResult, marketPlaceResult, wareHouseResult, QpayBHSearchResult) {
            // For warehouse
            let testArray = []
            let testArrayVal = []
            for (var i = 0; i < marketPlaceResult.length; i++) {
                let flagChecker = false
                for (var j = 0; j < handsetResult.length; j++) {
                    if (handsetResult[j].handsetMarketManager == marketPlaceResult[i].marketplaceMarketManager) {
                        handsetResult[j].marketQuantity = marketPlaceResult[i].marketplaceInternalId
                        handsetResult[j].marketCommsion = marketPlaceResult[i].marketplaceCurrentParentCommission
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
                    if (handsetResult[j].handsetMarketManager == wareHouseResult[i].warehouseCompanyName) {
                        handsetResult[j].warehouseQuantity = wareHouseResult[i].warehouseQuantity
                        handsetResult[j].warehouseCommsion = wareHouseResult[i].warehouseEstGrossProfit
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
                    if (handsetResult[j].handsetMarketManager == QpayBHSearchResult[i].qpaybrandMarketmanager) {
                        handsetResult[j].qpayQuantity = QpayBHSearchResult[i].qpaybrandInternalId
                        handsetResult[j].qpayCommsion = QpayBHSearchResult[i].qpaybrandMACommission
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

            //for Handset
            let warehousetestArray = []
            let warehousetestArrayVal = []
            for (var i = 0; i < marketPlaceResult.length; i++) {
                log.debug("------- A EACH: ",marketPlaceResult[i])
                let flagChecker = false
                for (var j = 0; j < wareHouseResult.length; j++) {
                    log.debug("------- B EACH: ",wareHouseResult[j])
                    log.debug("======wareHouseResult[j].warehouseCompanyName: ",wareHouseResult[j].warehouseCompanyName)
                    log.debug("======marketPlaceResult[i].marketplaceMarketManager: ",marketPlaceResult[i].marketplaceMarketManager)
                    if (wareHouseResult[j].warehouseCompanyName == marketPlaceResult[i].marketplaceMarketManager) {
                        wareHouseResult[j].marketQuantity = marketPlaceResult[i].marketplaceInternalId
                        wareHouseResult[j].marketCommsion = marketPlaceResult[i].marketplaceCurrentParentCommission
                        flagChecker = true
                        break;
                    }
                }
                if (flagChecker == false) {
                    warehousetestArray.push(i)
                    warehousetestArrayVal.push(j)
                }
            }


            let warehousetestArray1 = []
            for (var i = 0; i < handsetResult.length; i++) {
                let flagChecker = false
                for (var j = 0; j < wareHouseResult.length; j++) {
                    if (wareHouseResult[j].warehouseCompanyName == handsetResult[i].handsetMarketManager) {
                        wareHouseResult[j].handsetQuantity = handsetResult[i].handsetInternalId
                        wareHouseResult[j].handsetCommsion = handsetResult[i].handsetMACommision
                        flagChecker = true
                        break;
                    }
                }
                if (flagChecker == false) {
                    warehousetestArray1.push(i)
                }
            }

            if (warehousetestArray.length > 0) {
                for (let k = 0; k < warehousetestArray.length; k++)
                     var intrm = warehousetestArray[k]
                handsetResult.push(marketPlaceResult[intrm])
            }
            var handset = setHandsetSublist(marketPlaceResult,handsetResult, wareHouseResult, handsetResult)

            return handset;
        }

        /**
         * Function for branded handset and warehouse commission setup.
         * @param marketPlaceResult
         * @param handsetResult
         * @param wareHouseResult
         * @param handsetResult
         * @returns {finalObj{[]}} Total warehouse commisions and Branded handset search results of sales rep partners (Object of Array)
         */
        function setHandsetSublist( marketPlaceResult, handsetResult1, wareHouseResult, handsetResult){
            var finalArray = [];

            //For Handset Commission
            let testArray = []
            for (var i = 0; i < marketPlaceResult.length; i++) {
                log.debug("1. i: ",marketPlaceResult[i])
                let flagChecker = false
                for (var j = 0; j < handsetResult1.length; j++) {
                    log.debug("1. j: ",handsetResult1[j])
                    if (checkForParameter(handsetResult1[j].handsetMarketManager) && (marketPlaceResult[i].handsetMarketManager)) {
                        if (handsetResult1[j].handsetMarketManager == marketPlaceResult[i].marketplaceMarketManager) {
                            handsetResult1[j].marketQuantity = marketPlaceResult[i].marketplaceInternalId
                            handsetResult1[j].marketCommsion = marketPlaceResult[i].marketplaceCurrentParentCommission
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

            var handSetArray = []
            var test
            for (var i = 0; i < handsetResult.length; i++) {
                let handsetQuantity = 0
                let handsetCommision = 0
                let totalCombinedAmnt = 0
                var handsetObj = {};

                if (handsetResult[i].handsetMMProfileVal != 1 && handsetResult[i].handsetMMProfileVal != 2 && handsetResult[i].handsetMMProfileVal != 4 && handsetResult[i].handsetMMProfileVal != 5 && handsetResult[i].handsetMMProfileVal != 6) {

                    //calculate handset quantity
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].qpayQuantity)
                    } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    } else if (checkForParameter(handsetResult[i].qpayQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].qpayQuantity)
                    } else {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId)
                    }

                    //calculate handset commission
                    if(checkForParameter(handsetResult[i].handsetMACommision)) {
                        if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                            handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion) + Number(handsetResult[i].qpayCommsion)
                        } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                            handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion)
                        } else if (checkForParameter(handsetResult[i].qpayCommsion)) {
                            handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].qpayCommsion)
                        } else {
                            handsetCommision = Number(handsetResult[i].handsetMACommision)
                        }
                    }

                    //set the combined (warehouse total) to find the percentage
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        totalCombinedAmnt = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity) + Number(handsetResult[i].qpayQuantity)
                    } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                        totalCombinedAmnt = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity)
                    } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        totalCombinedAmnt = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].qpayQuantity)

                    } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        totalCombinedAmnt = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    } else {
                        totalCombinedAmnt = Number(handsetResult[i].handsetInternalId)
                    }

                    if(handsetResult[i].handsetMMProfileVal == 3 || handsetResult[i].handsetMMProfileVal == 0){

                        if (handsetResult[i].handsetMarketManager == "SolomonS") {
                            let temp = (handsetResult[i].handsetMarketManager).toUpperCase();
                            handsetObj.salesRep = temp
                        } else {
                            handsetObj.salesRep = handsetResult[i].handsetMarketManager
                        }

                        handsetObj.salesRepId = handsetResult[i].handsetSalesRepId
                        handsetObj.mmProfile = handsetResult[i].handsetMMProfile


                        var percentage = "0.00"
                        if (checkForParameter(handsetResult[i].handsetBrandedHSTier1) && checkForParameter(handsetResult[i].handsetBrandedHSTier2)) {
                            if (totalCombinedAmnt <= handsetResult[i].handsetBrandedHSTier1) {
                                percentage = handsetResult[i].handsetBrandedHSTierRate1
                            } else if (totalCombinedAmnt > handsetResult[i].handsetBrandedHSTier2) {
                                percentage = handsetResult[i].handsetBrandedHSTierRate2
                            }
                        }
                        if(!checkForParameter(percentage)){
                            percentage = "0.00%"
                        }

                        percentage = percentage.split("%")
                        percentage = percentage[0]
                        let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100
                        handsetObj.quantity = handsetQuantity
                        handsetObj.profit = handsetCommision
                        handsetObj.rate = percentage
                        handsetObj.handsetCommission = Number(totalCommision).toFixed(2)
                        // lineNumber++;
                        handSetArray.push(handsetObj)
                    }

                    if (handsetResult[i].handsetClassTxt == "TX") {
                        TXhandsetQuantity = Number(TXhandsetQuantity) + Number(handsetQuantity)
                        TXhandsetCommision = Number(TXhandsetCommision) + Number(handsetCommision)
                        txCombinedTotal = Number(txCombinedTotal) + Number(totalCombinedAmnt)
                    } else if (handsetResult[i].handsetClassTxt == "New York") {
                        NYhandsetQuantity = Number(NYhandsetQuantity) + Number(handsetQuantity)
                        NYhandsetCommision = Number(NYhandsetCommision) + Number(handsetCommision)
                        nyCombinedTotal = Number(nyCombinedTotal) + Number(totalCombinedAmnt)
                    } else if (handsetResult[i].handsetClassTxt == "North Carolina") {
                        NChandsetQuantity = Number(NChandsetQuantity) + Number(handsetQuantity)
                        NChandsetCommision = Number(NChandsetCommision) + Number(handsetCommision)
                        ncCombinedTotal = Number(ncCombinedTotal) + Number(totalCombinedAmnt)
                    } else if (handsetResult[i].handsetClassTxt == "Illinois") {
                        CHIhandsetQuantity = Number(CHIhandsetQuantity) + Number(handsetQuantity)
                        CHIhandsetCommision = Number(CHIhandsetCommision) + Number(handsetCommision)
                        chiCombinedTotal = Number(chiCombinedTotal) + Number(totalCombinedAmnt)
                    } else if (handsetResult[i].handsetClassTxt == "Virginia") {
                        virginiaQnty = Number(virginiaQnty) + Number(handsetQuantity)
                        virginiaCommission = Number(virginiaCommission) + Number(handsetCommision)
                        virginaCombinedTotal = Number(virginaCombinedTotal) + Number(totalCombinedAmnt)
                    }

                }
                else if (handsetResult[i].handsetMMProfileVal == 1) {
                    let handsetQuantity = 0

                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].qpayCommsion)
                    }
                    else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    }
                    else {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId)
                    }

                    //////////
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity) + Number(handsetResult[i].qpayCommsion)
                    }
                    else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                        nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity)
                    }
                    else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    }
                    else {
                        nyCombinedTotal = Number(nyCombinedTotal) + Number(handsetResult[i].handsetInternalId)
                    }

                    //
                    let handsetCommision = 0
                    if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion) + Number(handsetResult[i].qpayCommsion)
                    }
                    else if (checkForParameter(handsetResult[i].marketCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion)
                    }
                    else {
                        handsetCommision = Number(handsetResult[i].handsetMACommision)
                    }


                    NYOwn = Number(NYOwn) + Number(handsetQuantity)
                    NYOwnCommision = Number(NYOwnCommision) + Number(handsetCommision)

                }
                else if (handsetResult[i].handsetMMProfileVal == 6) {
                    let handsetQuantity = 0
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].qpayCommsion)
                    }
                    else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    }
                    else {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId)
                    }

                    ///////

                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity) + Number(handsetResult[i].qpayCommsion)
                    }
                    else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                        ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity)
                    }
                    else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    }
                    else {
                        ncCombinedTotal = Number(ncCombinedTotal) + Number(handsetResult[i].handsetInternalId)
                    }

                    let handsetCommision = 0
                    if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion) + Number(handsetResult[i].qpayCommsion)
                    }
                    else if (checkForParameter(handsetResult[i].marketCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion)
                    }
                    else {
                        handsetCommision = Number(handsetResult[i].handsetMACommision)
                    }
                    /////


                    NCOwn = Number(NCOwn) + Number(handsetQuantity)
                    NCOwnCommision = Number(NCOwnCommision) + Number(handsetCommision)

                }
                else if (handsetResult[i].handsetMMProfileVal == 4) {
                    let handsetQuantity = 0
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].qpayCommsion)
                    } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    } else {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId)
                    }

                    ///////

                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity) + Number(handsetResult[i].qpayCommsion)
                    } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                        txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity)
                    } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    } else {
                        txCombinedTotal = Number(txCombinedTotal) + Number(handsetResult[i].handsetInternalId)
                    }

                    //
                    let handsetCommision = 0
                    if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion) + Number(handsetResult[i].qpayCommsion)
                    } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion)
                    } else {
                        handsetCommision = Number(handsetResult[i].handsetMACommision)
                    }


                    TXOwn = Number(TXOwn) + Number(handsetQuantity)
                    TXOwnCommision = Number(TXOwnCommision) + Number(handsetCommision)

                }
                else if (handsetResult[i].handsetMMProfileVal == 5) {
                    let handsetQuantity = 0
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].qpayCommsion)
                    } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    } else {
                        handsetQuantity = Number(handsetResult[i].handsetInternalId)
                    }

                    //////////
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity) + Number(handsetResult[i].qpayCommsion)
                    } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                        chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity)
                    } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    } else {
                        chiCombinedTotal = Number(chiCombinedTotal) + Number(handsetResult[i].handsetInternalId)
                    }

                    //
                    let handsetCommision = 0
                    if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion) + Number(handsetResult[i].qpayCommsion)
                    } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                        handsetCommision = Number(handsetResult[i].handsetMACommision) + Number(handsetResult[i].marketCommsion)
                    } else {
                        handsetCommision = Number(handsetResult[i].handsetMACommision)
                    }
                    ////


                    CHIOwn = Number(CHIOwn) + Number(handsetQuantity)
                    CHIOwnCommision = Number(CHIhandsetCommision) + Number(handsetCommision)

                }
                else if (handsetResult[i].handsetMMProfileVal == 2) {

                    if (checkForParameter(handsetResult[i].marketCommsion) && checkForParameter(handsetResult[i].qpayCommsion)) {
                        NationalOwn = Number(NationalOwn) + Number(handsetResult[i].marketCommsion) + Number(handsetResult[i].qpayCommsion)
                        NationalOwnCommision = Number(NationalOwnCommision) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].qpayCommsion)

                    } else if (checkForParameter(handsetResult[i].marketCommsion)) {
                        NationalOwn = Number(NationalOwn) + Number(handsetResult[i].marketCommsion)
                        NationalOwnCommision = Number(NationalOwnCommision) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)

                    }
                    //
                    if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity) && checkForParameter(handsetResult[i].qpayQuantity)) {
                        nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity) + Number(handsetResult[i].qpayCommsion)
                    } else if (checkForParameter(handsetResult[i].marketQuantity) && checkForParameter(handsetResult[i].warehouseQuantity)) {
                        nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity) + Number(handsetResult[i].warehouseQuantity)
                    } else if (checkForParameter(handsetResult[i].marketQuantity)) {
                        nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].handsetInternalId) + Number(handsetResult[i].marketQuantity)
                    } else {
                        nationCombinedTotal = Number(nationCombinedTotal) + Number(handsetResult[i].handsetInternalId)
                    }

                    // }
                }
            }
            nationalTotal = Number(NationalOwn) + Number(CHIOwn) + Number(TXOwn) + Number(NCOwn) + Number(NYOwn)
            nationalQuantity = Number(CHIhandsetQuantity) + Number(NChandsetQuantity) + Number(NYhandsetQuantity) + Number(TXhandsetQuantity) + Number(virginiaQnty)
            nationalCommision = Number(CHIhandsetCommision) + Number(NChandsetCommision) + Number(NYhandsetCommision) + Number(TXhandsetCommision) + Number(virginiaCommission)
            NationalOwnCommision = Number(NationalOwnCommision) + Number(CHIOwnCommision) + Number(TXOwnCommision) + Number(NCOwnCommision) + Number(NYOwnCommision)
            nationCombinedTotal = Number(nationCombinedTotal) + Number(CHIhandsetQuantity) + Number(NChandsetQuantity) + Number(NYhandsetQuantity) + Number(TXhandsetQuantity) + Number(virginiaQnty)

            var manegerSearch = tracfoneReginalManegerSearch()

            for (var j = 0; j < manegerSearch.length; j++) {
                if(manegerSearch[j].mmProfile !=3 && manegerSearch[j].mmProfile != 0) {
                    if (checkForParameter(manegerSearch[j].mmProfile)) {
                        if (manegerSearch[j].mmProfile == 5) {
                            let handObj = {}
                            handObj.salesRep = manegerSearch[j].salesRepName
                            handObj.salesRepId = manegerSearch[j].salesRep
                            handObj.mmProfile = manegerSearch[j].mmProfileTxt

                            let handsetQuantity = 0
                            handsetQuantity = Number(CHIOwn) + Number(CHIhandsetQuantity)

                            let handsetCommision = 0
                            handsetCommision = Number(CHIhandsetCommision) + Number(CHIOwnCommision)

                            let percentage = "0.00%"
                            if (checkForParameter(manegerSearch[j].brandedHSTier1) && checkForParameter(manegerSearch[j].brandedHSTier2)) {
                                if (chiCombinedTotal <= manegerSearch[j].brandedHSTier1) {
                                    percentage = manegerSearch[j].brandedHSTier1Rate
                                } else if (chiCombinedTotal > manegerSearch[j].brandedHSTier2) {
                                    percentage = manegerSearch[j].brandedHSTier2Rate
                                }
                            }
                            percentage = percentage.split("%")
                            percentage = percentage[0]
                            let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100
                            handObj.quantity = Number(handsetQuantity)
                            handObj.profit = Number(handsetCommision).toFixed(2)
                            handObj.rate = percentage
                            handObj.handsetCommission = Number(totalCommision).toFixed(2)
                            handSetArray.push(handObj)

                        }

                        else if (manegerSearch[j].mmProfile == 2) {
                            let handObj = {}
                            handObj.salesRep = manegerSearch[j].salesRepName
                            handObj.salesRepId = manegerSearch[j].salesRep
                            handObj.mmProfile = manegerSearch[j].mmProfileTxt

                            let handsetQuantity = 0
                            handsetQuantity = Number(nationalTotal) + Number(nationalQuantity)

                            let handsetCommision = 0
                            handsetCommision = Number(nationalCommision) + Number(NationalOwnCommision)

                            let percentage = "0.00%"
                            if (checkForParameter(manegerSearch[j].brandedHSTier1) && checkForParameter(manegerSearch[j].brandedHSTier2)) {
                                if (nationCombinedTotal <= manegerSearch[j].brandedHSTier1) {
                                    percentage = manegerSearch[j].brandedHSTier1Rate
                                } else if (nationCombinedTotal > manegerSearch[j].brandedHSTier2) {
                                    percentage = manegerSearch[j].brandedHSTier2Rate
                                }
                            }
                            percentage = percentage.split("%")
                            percentage = percentage[0]
                            let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100
                            handObj.quantity = Number(handsetQuantity)
                            handObj.profit = Number(handsetCommision).toFixed(2)
                            handObj.rate = percentage
                            handObj.handsetCommission = Number(totalCommision).toFixed(2)
                            handSetArray.push(handObj)

                        }

                        else if (manegerSearch[j].mmProfile == 6) {
                            let handObj = {}
                            handObj.salesRep = manegerSearch[j].salesRepName
                            handObj.salesRepId = manegerSearch[j].salesRep
                            handObj.mmProfile = manegerSearch[j].mmProfileTxt

                            let handsetQuantity = 0
                            handsetQuantity = Number(NCOwn) + Number(NChandsetQuantity)

                            let handsetCommision = 0
                            handsetCommision = Number(NChandsetCommision) + Number(NCOwnCommision)

                            let percentage = "0.00%"
                            if (checkForParameter(manegerSearch[j].brandedHSTier1) && checkForParameter(manegerSearch[j].brandedHSTier2)) {
                                if (ncCombinedTotal <= manegerSearch[j].brandedHSTier1) {
                                    percentage = manegerSearch[j].brandedHSTier1Rate
                                } else if (ncCombinedTotal > manegerSearch[j].brandedHSTier2) {
                                    percentage = manegerSearch[j].brandedHSTier2Rate
                                }
                            }
                            percentage = percentage.split("%")
                            percentage = percentage[0]
                            let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100
                            handObj.quantity = Number(handsetQuantity)
                            handObj.profit = Number(handsetCommision).toFixed(2)
                            handObj.rate = percentage
                            handObj.handsetCommission = Number(totalCommision).toFixed(2)
                            handSetArray.push(handObj)

                        }

                        else if (manegerSearch[j].mmProfile== 1) {
                            let handObj = {}
                            handObj.salesRep = manegerSearch[j].salesRepName
                            handObj.salesRepId = manegerSearch[j].salesRep
                            handObj.mmProfile = manegerSearch[j].mmProfileTxt

                            let handsetQuantity = 0
                            handsetQuantity = Number(NYOwn) + Number(NYhandsetQuantity)

                            let handsetCommision = 0
                            handsetCommision = Number(NYhandsetCommision) + Number(NYOwnCommision)

                            let percentage = "0.00%"
                            if (checkForParameter(manegerSearch[j].brandedHSTier1) && checkForParameter(manegerSearch[j].brandedHSTier2)) {
                                if (nyCombinedTotal <= manegerSearch[j].brandedHSTier1) {
                                    percentage = manegerSearch[j].brandedHSTier1Rate
                                } else if (nyCombinedTotal > manegerSearch[j].brandedHSTier2) {
                                    percentage = manegerSearch[j].brandedHSTier2Rate
                                }
                            }
                            percentage = percentage.split("%")
                            percentage = percentage[0]
                            let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100
                            handObj.quantity = Number(handsetQuantity)
                            handObj.profit = Number(handsetCommision).toFixed(2)
                            handObj.rate = percentage
                            handObj.handsetCommission = Number(totalCommision).toFixed(2)
                            handSetArray.push(handObj)

                        }

                        else if (manegerSearch[j].mmProfile == 4) {
                            let handObj = {}
                            handObj.salesRep = manegerSearch[j].salesRepName
                            handObj.salesRepId = manegerSearch[j].salesRep
                            handObj.mmProfile = manegerSearch[j].mmProfileTxt

                            let handsetQuantity = 0
                            handsetQuantity = Number(TXOwn) + Number(TXhandsetQuantity)

                            let handsetCommision = 0
                            handsetCommision = Number(TXhandsetCommision) + Number(TXOwnCommision)

                            let percentage = "0.00%"
                            if (checkForParameter(manegerSearch[j].brandedHSTier1) && checkForParameter(manegerSearch[j].brandedHSTier2)) {
                                if (txCombinedTotal <= manegerSearch[j].brandedHSTier1) {
                                    percentage = manegerSearch[j].brandedHSTier1Rate
                                } else if (txCombinedTotal > manegerSearch[j].brandedHSTier2) {
                                    percentage = manegerSearch[j].brandedHSTier2Rate
                                }
                            }
                            percentage = percentage.split("%")
                            percentage = percentage[0]
                            let totalCommision = (Number(percentage) * Number(handsetCommision)) / 100
                            handObj.quantity = Number(handsetQuantity)
                            handObj.profit = Number(handsetCommision).toFixed(2)
                            handObj.rate = percentage
                            handObj.handsetCommission = Number(totalCommision).toFixed(2)
                            handSetArray.push(handObj)

                        }

                    }
                }
            }

            //For Warehouse Commission
            let lineNumber2 = 0
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
            var test
            let virginiaqnty = 0
            let WhvirginiaCommission = 0
            let nonQnty = 0
            let nonCommission = 0
            let totalCombinedAmnt = 0
            let WhnyCombinedTotal = 0
            let WhncCombinedTotal = 0
            let WhchiCombinedTotal = 0
            let WhtxCombinedTotal = 0
            let WhvirginiaCombinedTotal = 0
            let WhNationalCombinedTotal = 0
            let nonCombinedTotal = 0
            var whArray = [];
            for (var i = 0; i < wareHouseResult.length; i++) {
                let warehouseObj = {}
                if (wareHouseResult[i].warehouseMMProfileVal != 1 && wareHouseResult[i].warehouseMMProfileVal != 2 && wareHouseResult[i].warehouseMMProfileVal != 4 && wareHouseResult[i].warehouseMMProfileVal != 5 && wareHouseResult[i].warehouseMMProfileVal != 6) {
                    if (wareHouseResult[i].warehouseMMProfileVal == 3 || wareHouseResult[i].warehouseMMProfileVal == 0 || wareHouseResult[i].warehouseMMProfileVal == 7) {
                        if (checkForParameter(wareHouseResult[i].marketQuantity) && checkForParameter(wareHouseResult[i].handsetQuantity)) {
                            totalCombinedAmnt = Number(wareHouseResult[i].warehouseQuantity) + Number(wareHouseResult[i].marketQuantity) + wareHouseResult[i].handsetQuantity
                        } else if (checkForParameter(wareHouseResult[i].marketQuantity)) {
                            totalCombinedAmnt = Number(wareHouseResult[i].warehouseQuantity) + Number(wareHouseResult[i].marketQuantity)
                        } else {
                            totalCombinedAmnt = Number(wareHouseResult[i].warehouseQuantity)
                        }

                        let commissionRate2 = "0%"
                        if (checkForParameter(wareHouseResult[i].warehouseMarketPlaceTier1 && wareHouseResult[i].warehouseMarketPlaceTier2)) {
                            if (wareHouseResult[i].warehouseMarketPlaceTier1 >= totalCombinedAmnt) {
                                commissionRate2 = wareHouseResult[i].warehouseMarketPlaceTier1Rate
                            } else if (totalCombinedAmnt > wareHouseResult[i].warehouseMarketPlaceTier2) {
                                commissionRate2 = wareHouseResult[i].warehouseMarketPlaceTier2Rate
                            }
                        }

                        let commissionRate1 = commissionRate2.split("%")
                        var commissionRate = commissionRate1[0]
                        var totalCommission = Number((Number(wareHouseResult[i].warehouseEstGrossProfit).toFixed(2) * Number(commissionRate)) / 100).toFixed(2)

                        warehouseObj.salesRep = wareHouseResult[i].warehouseCompanyName
                        warehouseObj.mmProfile = wareHouseResult[i].warehouseMMProfile
                        warehouseObj.actualSaleRep = wareHouseResult[i].warehouseActualSalesPerson
                        warehouseObj.actualSaleRepId = wareHouseResult[i].warehouseActualSalesPersonId
                        warehouseObj.quantity = Number(wareHouseResult[i].warehouseQuantity)
                        warehouseObj.profit = Number(wareHouseResult[i].warehouseEstGrossProfit).toFixed(2)
                        warehouseObj.rate = Number(commissionRate).toFixed(2)
                        warehouseObj.warehouseCommission = Number(totalCommission)
                        whArray.push(warehouseObj)
                        lineNumber2++
                    }
                    if (wareHouseResult[i].warehouseClass == "TX") {
                        TXRegularManegerQnty = Number(TXRegularManegerQnty) + Number(wareHouseResult[i].warehouseQuantity)
                        TXRegularManegerTotal = Number(TXRegularManegerTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                        WhtxCombinedTotal = Number(WhtxCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                    }
                    else if (wareHouseResult[i].warehouseClass == "North Carolina") {
                        NCRegularManegerQnty = Number(NCRegularManegerQnty) + Number(wareHouseResult[i].warehouseQuantity)
                        NCRegularManegerTotal = Number(NCRegularManegerTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                        WhncCombinedTotal = Number(WhncCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                    }
                    else if (wareHouseResult[i].warehouseClass == "New York") {
                        NYRegularManegerQnty = Number(NYRegularManegerQnty) + Number(wareHouseResult[i].warehouseQuantity)
                        NYRegularManegerTotal = Number(NYRegularManegerTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                        WhnyCombinedTotal = Number(WhnyCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                    }
                    else if (wareHouseResult[i].warehouseClass == "Illinois") {
                        CHIRegularManegerQnty = Number(CHIRegularManegerQnty) + Number(wareHouseResult[i].warehouseQuantity)
                        CHIRegularManegerTotal = Number(CHIRegularManegerTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                        WhchiCombinedTotal = Number(WhchiCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                    }
                    else if (wareHouseResult[i].warehouseClass == "Virginia") {
                        virginiaqnty = Number(virginiaqnty) + Number(wareHouseResult[i].warehouseQuantity)
                        virginiaCommission = Number(virginiaCommission) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                        WhvirginiaCombinedTotal = Number(WhvirginiaCombinedTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                    }
                    else if (wareHouseResult[i].warehouseClass == "- None -") {
                        nonQnty = Number(nonQnty) + Number(wareHouseResult[i].warehouseQuantity)
                        nonCommission = Number(nonCommission) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                        nonCombinedTotal = Number(nonCombinedTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                    }
                }

                else if (wareHouseResult[i].warehouseMMProfileVal == 5) {
                    CHIOwnQnty = Number(CHIOwnQnty) + Number(wareHouseResult[i].warehouseQuantity)
                    CHIOwnTotal = Number(CHIOwnTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                    WhchiCombinedTotal = Number(WhchiCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                }
                else if (wareHouseResult[i].warehouseMMProfileVal == 2) {
                    NationalOwnQnty = Number(NationalOwnQnty) + Number(wareHouseResult[i].warehouseQuantity)
                    NationalOwnTotal = Number(NationalOwnTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                    WhNationalCombinedTotal = Number(WhNationalCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                }
                else if (wareHouseResult[i].warehouseMMProfileVal == 6) {
                    NCOwnQnty = Number(NCOwnQnty) + Number(wareHouseResult[i].warehouseQuantity)
                    NCOwnTotal = Number(NCOwnTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                    WhncCombinedTotal = Number(WhncCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                }
                else if (wareHouseResult[i].warehouseMMProfileVal == 1) {
                    NYOwnQnty = Number(NYOwnQnty) + Number(wareHouseResult[i].warehouseQuantity)
                    NYOwnTotal = Number(NYOwnTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                    WhnyCombinedTotal = Number(WhnyCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                }
                else if (wareHouseResult[i].warehouseMMProfileVal == 4) {
                    TXOwnQnty = Number(TXOwnQnty) + Number(wareHouseResult[i].warehouseQuantity)
                    TXOwnTotal = Number(TXOwnTotal) + Number(wareHouseResult[i].warehouseEstGrossProfit)
                    WhtxCombinedTotal = Number(WhtxCombinedTotal) + Number(wareHouseResult[i].warehouseQuantity)
                }
            }

            NatioanlManegerQnty = Number(CHIRegularManegerQnty) + Number(TXRegularManegerQnty) + Number(NCRegularManegerQnty) + Number(NYRegularManegerQnty) + Number(virginiaqnty) + Number(nonQnty)
            NationalMangerTotal = Number(CHIRegularManegerTotal) + Number(TXRegularManegerTotal) + Number(NCRegularManegerTotal) + Number(NYRegularManegerTotal) + Number(virginiaCommission) + Number(nonCommission)
            NationalOwnQnty = Number(NationalOwnQnty) + Number(CHIOwnQnty) + Number(TXOwnQnty) + Number(NCOwnQnty) + Number(NYOwnQnty)
            NationalOwnTotal = Number(NationalOwnTotal) + Number(CHIOwnTotal) + Number(TXOwnTotal) + Number(NCOwnTotal) + Number(NYOwnTotal)
            WhNationalCombinedTotal = Number(WhNationalCombinedTotal) + Number(WhtxCombinedTotal) + Number(WhchiCombinedTotal) + Number(WhvirginiaCombinedTotal) + Number(WhncCombinedTotal) + Number(WhnyCombinedTotal) + Number(nonCombinedTotal)

            var manegerSearch = tracfoneReginalManegerSearch()
            for (var j = 0; j < manegerSearch.length; j++) {
                // if (manegerSearch[j].mmProfile != 3 && manegerSearch[j].mmProfile == 0) {
                if (checkForParameter(manegerSearch[j].mmProfile)) {

                    if (manegerSearch[j].mmProfile == 5) {
                        test = setMarketPlaceManager(lineNumber2,CHIOwnTotal,CHIRegularManegerTotal, CHIOwnQnty, CHIRegularManegerQnty, j, wareHouseResult, manegerSearch, whArray, WhchiCombinedTotal)
                    } else if (manegerSearch[j].mmProfile == 2) {
                        test = setMarketPlaceManager(lineNumber2,NationalOwnTotal, NationalMangerTotal, NationalOwnQnty, NatioanlManegerQnty, j, wareHouseResult, manegerSearch, test.whArray, WhNationalCombinedTotal)
                    } else if (manegerSearch[j].mmProfile == 6) {
                        test = setMarketPlaceManager(lineNumber2,NCOwnTotal, NCRegularManegerTotal, NCOwnQnty, NCRegularManegerQnty, j, wareHouseResult, manegerSearch, test.whArray, WhncCombinedTotal)
                    } else if (manegerSearch[j].mmProfile == 1 || 7) {
                        test = setMarketPlaceManager(lineNumber2,NYOwnTotal, NYRegularManegerTotal, NYOwnQnty, NYRegularManegerQnty, j, wareHouseResult, manegerSearch, test.whArray, WhnyCombinedTotal)
                    } else if (manegerSearch[j].mmProfile == 4) {
                        test = setMarketPlaceManager(lineNumber2,TXOwnTotal, TXRegularManegerTotal, TXOwnQnty, TXRegularManegerQnty, j, wareHouseResult, manegerSearch, test.whArray, WhtxCombinedTotal)
                    }


                    //  if (manegerSearch[j].mmProfile == 5) {
                    //      let markArray = {}
                    //      let markObj = {}
                    //
                    //      markObj.salesRep = manegerSearch[j].salesRepName
                    //      markObj.mmProfile = manegerSearch[j].mmProfileTxt
                    //
                    //      let totalQnty = Number(CHIOwnQnty) + Number(CHIRegularManegerQnty)
                    //      let totalCommision = Number(CHIOwnTotal) + Number(CHIRegularManegerTotal)
                    //
                    //      let commissionRate = "0%"
                    //      if (checkForParameter(manegerSearch[j].warehouseHSTier1 && manegerSearch[j].warehouseQtyGt600)) {
                    //          if (WhchiCombinedTotal <= manegerSearch[j].warehouseHSTier1) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate1
                    //          } else if (WhchiCombinedTotal > manegerSearch[j].warehouseQtyGt600) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate2
                    //          }
                    //      }
                    //
                    //      let commissionRate1 = commissionRate.split("%")
                    //      commissionRate = commissionRate1[0]
                    //
                    //      totalCommission = Number((Number(totalCommision) * Number(commissionRate)) / 100).toFixed(2)
                    //
                    //      markObj.actualSaleRepId = manegerSearch[j].salesRep
                    //      markObj.quantity = totalQnty
                    //      markObj.profit = Number(totalCommision)
                    //      markObj.rate = commissionRate
                    //      markObj.warehouseCommission = Number(totalCommission)
                    //      whArray.push(markObj)
                    //
                    //  }
                    //
                    //  else if (manegerSearch[j].mmProfile == 2) {
                    //      let markObj = {}
                    //
                    //      markObj.salesRep = manegerSearch[j].salesRepName
                    //      markObj.mmProfile = manegerSearch[j].mmProfileTxt
                    //
                    //      let totalQnty = Number(NationalOwnQnty) + Number(NatioanlManegerQnty)
                    //      let totalCommision = Number(NationalOwnTotal) + Number(NationalMangerTotal)
                    //
                    //      let commissionRate = "0%"
                    //      if (checkForParameter(manegerSearch[j].warehouseHSTier1 && manegerSearch[j].warehouseQtyGt600)) {
                    //          if (WhNationalCombinedTotal <= manegerSearch[j].warehouseHSTier1) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate1
                    //          } else if (WhNationalCombinedTotal > manegerSearch[j].warehouseQtyGt600) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate2
                    //          }
                    //      }
                    //
                    //      let commissionRate1 = commissionRate.split("%")
                    //      commissionRate = commissionRate1[0]
                    //
                    //      totalCommission = Number((Number(totalCommision) * Number(commissionRate)) / 100).toFixed(2)
                    //
                    //      markObj.actualSaleRepId = manegerSearch[j].salesRep
                    //      markObj.quantity = totalQnty
                    //      markObj.profit = Number(totalCommision)
                    //      markObj.rate = commissionRate
                    //      markObj.warehouseCommission = Number(totalCommission)
                    //      whArray.push(markObj)
                    //  }
                    //
                    //  else if (manegerSearch[j].mmProfile == 6) {
                    //      let markObj = {}
                    //
                    //      markObj.salesRep = manegerSearch[j].salesRepName
                    //      markObj.mmProfile = manegerSearch[j].mmProfileTxt
                    //
                    //      let totalQnty = Number(NCOwnQnty) + Number(NCRegularManegerQnty)
                    //      let totalCommision = Number(NCOwnTotal) + Number(NCRegularManegerTotal)
                    //
                    //      let commissionRate = "0%"
                    //      if (checkForParameter(manegerSearch[j].warehouseHSTier1 && manegerSearch[j].warehouseQtyGt600)) {
                    //          if (WhncCombinedTotal <= manegerSearch[j].warehouseHSTier1) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate1
                    //          } else if (WhncCombinedTotal > manegerSearch[j].warehouseQtyGt600) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate2
                    //          }
                    //      }
                    //
                    //      let commissionRate1 = commissionRate.split("%")
                    //      commissionRate = commissionRate1[0]
                    //
                    //      totalCommission = Number((Number(totalCommision) * Number(commissionRate)) / 100).toFixed(2)
                    //
                    //      markObj.actualSaleRepId = manegerSearch[j].salesRep
                    //      markObj.quantity = totalQnty
                    //      markObj.profit = Number(totalCommision)
                    //      markObj.rate = commissionRate
                    //      markObj.warehouseCommission = Number(totalCommission)
                    //      whArray.push(markObj)
                    //  }
                    //
                    //  else if (manegerSearch[j].mmProfile == 1) {
                    //      let markObj = {}
                    //
                    //      markObj.salesRep = manegerSearch[j].salesRepName
                    //      markObj.mmProfile = manegerSearch[j].mmProfileTxt
                    //
                    //      let totalQnty = Number(NYOwnQnty) + Number(NYRegularManegerQnty)
                    //      let totalCommision = Number(NYOwnTotal) + Number(NYRegularManegerTotal)
                    //
                    //      let commissionRate = "0%"
                    //      if (checkForParameter(manegerSearch[j].warehouseHSTier1 && manegerSearch[j].warehouseQtyGt600)) {
                    //          if (WhnyCombinedTotal <= manegerSearch[j].warehouseHSTier1) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate1
                    //          } else if (WhnyCombinedTotal > manegerSearch[j].warehouseQtyGt600) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate2
                    //          }
                    //      }
                    //
                    //      let commissionRate1 = commissionRate.split("%")
                    //      commissionRate = commissionRate1[0]
                    //
                    //      totalCommission = Number((Number(totalCommision) * Number(commissionRate)) / 100).toFixed(2)
                    //
                    //      markObj.actualSaleRepId = manegerSearch[j].salesRep
                    //      markObj.quantity = totalQnty
                    //      markObj.profit = Number(totalCommision)
                    //      markObj.rate = commissionRate
                    //      markObj.warehouseCommission = Number(totalCommission)
                    //      whArray.push(markObj)
                    //  }
                    //
                    //  else if (manegerSearch[j].mmProfile == 4) {
                    //      let markObj = {}
                    //
                    //      markObj.salesRep = manegerSearch[j].salesRepName
                    //      markObj.mmProfile = manegerSearch[j].mmProfileTxt
                    //
                    //      let totalQnty = Number(TXOwnQnty) + Number(TXRegularManegerQnty)
                    //      let totalCommision = Number(TXOwnTotal) + Number(TXRegularManegerTotal)
                    //
                    //      let commissionRate = "0%"
                    //      if (checkForParameter(manegerSearch[j].warehouseHSTier1 && manegerSearch[j].warehouseQtyGt600)) {
                    //          if (WhtxCombinedTotal <= manegerSearch[j].warehouseHSTier1) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate1
                    //          } else if (WhtxCombinedTotal > manegerSearch[j].warehouseQtyGt600) {
                    //              commissionRate = manegerSearch[j].warehousePayOutRate2
                    //          }
                    //      }
                    //
                    //      let commissionRate1 = commissionRate.split("%")
                    //      commissionRate = commissionRate1[0]
                    //
                    //      totalCommission = Number((Number(totalCommision) * Number(commissionRate)) / 100).toFixed(2)
                    //
                    //      markObj.actualSaleRepId = manegerSearch[j].salesRep
                    //      markObj.quantity = totalQnty
                    //      markObj.profit = Number(totalCommision)
                    //      markObj.rate = commissionRate
                    //      markObj.warehouseCommission = Number(totalCommission)
                    //      whArray.push(markObj)
                    // }
                }
                // }
            }

            //Combining warehouse and handset commissions
            var finalObj ={};

            if (checkForParameter(test)) {
                finalObj ={
                    warehouseCommission: handSetArray,
                    handsetCommission: test.whArray
                };
            } else {
                finalObj ={
                    warehouseCommission: handSetArray,
                    handsetCommission: whArray
                };
            }
            return finalObj;
        }

        /**
         * Function used to set the branded handset subtab for the reginal managers.
         * @param lineNumber
         * @param OwnTotal
         * @param RegularManegerTotal
         * @param OwnQnty
         * @param RegularManegerQnty
         * @param j
         * @param marketPlaceResult
         * @param manegerSearch
         * @param whArray
         * @param combinedTotal
         * @returns {{}}
         */
        function setMarketPlaceManager(lineNumber,OwnTotal, RegularManegerTotal, OwnQnty, RegularManegerQnty, j, marketPlaceResult, manegerSearch, whArray, combinedTotal) {

            let markArray = {}
            let markObj = {}

            markObj.salesRep = manegerSearch[j].salesRepName
            markObj.mmProfile = manegerSearch[j].mmProfileTxt

            let totalQnty = Number(OwnQnty) + Number(RegularManegerQnty)

            let totalCommision = Number(OwnTotal) + Number(RegularManegerTotal)

            let commissionRate = "0%"
            if (checkForParameter(manegerSearch[j].warehouseHSTier1 && manegerSearch[j].warehouseQtyGt600)) {
                if (combinedTotal <= manegerSearch[j].warehouseHSTier1) {
                    commissionRate = manegerSearch[j].warehousePayOutRate1
                } else if (combinedTotal > manegerSearch[j].WarehouseQtygt600) {
                    commissionRate = manegerSearch[j].warehousePayOutRate2
                }
            }

            let commissionRate1 = commissionRate.split("%")
            commissionRate = commissionRate1[0]

            totalCommission = (Number(totalCommision) * Number(commissionRate)) / 100
            if(manegerSearch[j].mmProfile == 5){
            }

            markObj.actualSaleRep = manegerSearch[j].salesRepName
            markObj.actualSaleRepId = manegerSearch[j].salesRep
            markObj.quantity = totalQnty
            markObj.profit = Number(totalCommision).toFixed(2)
            markObj.rate = commissionRate
            markObj.warehouseCommission = Number(totalCommission).toFixed(2)
            whArray.push(markObj)
            lineNumber++
            markArray.lineNumber = lineNumber
            markArray.whArray = whArray

            return markArray;
        }

        /**
         * Search for Simsale Commisions
         * @returns {simResult[]} simsale search result
         */
        function simsaleSearch(){
            try{
                var transactionSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["closedate","within","lastmonth"],
                            "AND",["type", "anyof", "CashSale", "CustInvc", "CustCred"],
                            "AND", ["custcol_commitemgroup", "anyof", "2", "3"],
                            "AND", ["partner", "noneof", "10456", "11940", "8739", "9260", "4868", "9566", "4870", "9623", "14117", "14352", "4985", "14402", "14482", "15016", "16261", "15676", "16419", "8049"],
                            "AND", ["mainline", "is", "F"],
                            "AND", ["shipping", "is", "F"],
                            "AND", ["taxline", "is", "F"],
                            "AND", ["cogs", "is", "F"],
                            "AND", ["subsidiary", "anyof", "@ALL@"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                join: "partner",
                                summary: "GROUP",
                                label: "Salerep ID"
                            }),
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
                var simArr = [];
                if(searchResultCount > 0){

                    transactionSearchObj.run().each(function(result) {

                        // .run().each has a limit of 4,000 results
                        var salesRepId = result.getValue({
                            name: "internalid",
                            join: "partner",
                            summary: "GROUP"
                        });
                        var salesRep = result.getValue({
                            name: 'companyname',
                            join: 'partner',
                            summary: 'GROUP'
                        });

                        var qty = result.getValue({
                            name: 'quantity',
                            summary: 'SUM'
                        });

                        var tier1 = result.getValue({
                            name: 'custentity_sim_cards_teir_1',
                            join: 'partner',
                            summary: 'GROUP'
                        });

                        var tier2 = result.getValue({
                            name: "custentity70",
                            join: "partner",
                            summary: "GROUP"
                        });

                        var tier1Rate = result.getValue({
                            name: "custentity81",
                            join: "partner",
                            summary: "GROUP"
                        });

                        var tier2Rate = result.getValue({
                            name: "custentity82",
                            join: "partner",
                            summary: "GROUP"
                        });

                        var mmProfile = result.getValue({
                            name: "custentity51",
                            join: "partner",
                            summary: "GROUP"
                        });

                        var mmProfileTxt = result.getText({
                            name: "custentity51",
                            join: "partner",
                            summary: "GROUP"
                        });

                        var simsaleClass = result.getValue({
                            name: "classnohierarchy",
                            join: "partner",
                            summary: "GROUP"
                        })

                        simArr.push({
                            salesRep: salesRepId,
                            salesRepName: salesRep,
                            qty: qty,
                            tier1: tier1,
                            tier1Rate: tier1Rate,
                            tier2: tier2,
                            tier2Rate: tier2Rate,
                            mmProfile: mmProfile,
                            mmProfileTxt: mmProfileTxt,
                            simsaleClass: simsaleClass
                        })
                        return true;
                    });
                }
                var simResult = setSublistSimScale(simArr);
                return simResult;
            }
            catch (e) {
                log.error("ERROR In SIMSALE : ",e.name+" : "+e.message);
            }
        }

        /**
         * Function for setting up Total Sim sale Commision
         * @param {simSaleSearchResults} - simsale search result
         * @returns {simSaleArray[{}]} sim sale commissions (Array of objects)
         */
        function setSublistSimScale(simSaleSearchResults){
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
            var simSaleArray = [];
            for (var k = 0; k < simSaleSearchResults.length; k++) {
                let simSaleObj = {}
                var rate = 0

                if (simSaleSearchResults[k].mmProfile != 1 && simSaleSearchResults[k].mmProfile != 2 && simSaleSearchResults[k].mmProfile != 4 && simSaleSearchResults[k].mmProfile != 5 && simSaleSearchResults[k].mmProfile != 6) {
                    if (checkForParameter(simSaleSearchResults[k].tier1) && checkForParameter(simSaleSearchResults[k].tier2)) {
                        if (Number(simSaleSearchResults[k].qty) > Number(simSaleSearchResults[k].tier1) && Number(simSaleSearchResults[k].qty) < Number(simSaleSearchResults[k].tier2)) {
                            rate = Number(simSaleSearchResults[k].tier1Rate).toFixed(2)
                        } else if (Number(simSaleSearchResults[k].qty) > Number(simSaleSearchResults[k].tier2)) {
                            rate = Number(simSaleSearchResults[k].tier2Rate).toFixed(2)
                        } else {
                            rate = Number(0).toFixed(2)
                        }
                    }
                    var totalAmount = Number(rate) * Number(parseInt(simSaleSearchResults[k].qty))

                    simSaleObj.salesRep = simSaleSearchResults[k].salesRep
                    simSaleObj.salesRepName = simSaleSearchResults[k].salesRepName
                    simSaleObj.mmProfile = simSaleSearchResults[k].mmProfileTxt
                    simSaleObj.quantity = simSaleSearchResults[k].qty
                    simSaleObj.tier1 = simSaleSearchResults[k].tier1
                    simSaleObj.tier1Rate = Number(simSaleSearchResults[k].tier1Rate).toFixed(2)
                    simSaleObj.tier2 = simSaleSearchResults[k].tier2
                    simSaleObj.tier2Rate = Number(simSaleSearchResults[k].tier2Rate).toFixed(2)
                    simSaleObj.commissionRate = parseFloat(rate).toFixed(2)
                    simSaleObj.simsaleSum = parseFloat(Number(totalAmount).toFixed(2))
                    simSaleArray.push(simSaleObj)

                    if (simSaleSearchResults[k].simsaleClass == "North Carolina") {
                        if (simSaleSearchResults[k].qty != "" || simSaleSearchResults[k].qty != " " || simSaleSearchResults[k].qty != NaN) {
                            NCQuantity = Number(NCQuantity) + Number(simSaleSearchResults[k].qty)
                        }
                    } else if (simSaleSearchResults[k].simsaleClass == "Virginia") {
                        if (simSaleSearchResults[k].qty != "" || simSaleSearchResults[k].qty != " " || simSaleSearchResults[k].qty != NaN) {
                            virginiaQuantity = Number(virginiaQuantity) + Number(simSaleSearchResults[k].qty)
                        }
                    } else if (simSaleSearchResults[k].simsaleClass == "Illinois") {
                        if (simSaleSearchResults[k].qty != "" || simSaleSearchResults[k].qty != " " || simSaleSearchResults[k].qty != NaN) {
                            IllinoisQuantity = Number(IllinoisQuantity) + Number(simSaleSearchResults[k].qty)
                        }
                    } else if (simSaleSearchResults[k].simsaleClass == "New York") {

                        if (simSaleSearchResults[k].simsaleClass != "" || simSaleSearchResults[k].qty != " " || simSaleSearchResults[k].qty != NaN) {
                            NewYorkQuantity = Number(NewYorkQuantity) + Number(simSaleSearchResults[k].qty)
                        }
                    } else if (simSaleSearchResults[k].simsaleClass == "TX") {
                        if (simSaleSearchResults[k].qty != "" || simSaleSearchResults[k].qty != " " || simSaleSearchResults[k].qty != NaN) {
                            TXquantity = Number(TXquantity) + Number(simSaleSearchResults[k].qty)
                        }
                    }
                }

                else if (simSaleSearchResults[k].mmProfile == 1) {
                    if (checkForParameter(simSaleSearchResults[k].qty)) {
                        NewYorkQuantityOwn = (NewYorkQuantityOwn) + Number(simSaleSearchResults[k].qty)
                    }
                } else if (simSaleSearchResults[k].mmProfile == 6) {
                    if (checkForParameter(simSaleSearchResults[k].qty)) {
                        NCQuantityOwn = NCQuantityOwn + Number(simSaleSearchResults[k].qty)
                    }
                } else if (simSaleSearchResults[k].mmProfile == 4) {
                    if (checkForParameter(simSaleSearchResults[k].qty)) {
                        TXquantityOwn = simSaleSearchResults[k].qty
                    }
                } else if (simSaleSearchResults[k].mmProfile == 5) {
                    if (checkForParameter(simSaleSearchResults[k].qty)) {
                        IllinoisQuantityOwn = IllinoisQuantityOwn + Number(simSaleSearchResults[k].qty)
                    }
                } else if (simSaleSearchResults[k].mmProfile == 2) {
                    if (checkForParameter(simSaleSearchResults[k].qty)) {
                        virginiaQuantityOwn = virginiaQuantityOwn + Number(simSaleSearchResults[k].qty)
                    }
                }
            }

            NCQuantity = Number(NCQuantity) + Number(NCQuantityOwn)
            TXquantity = Number(TXquantity) + Number(TXquantityOwn)
            IllinoisQuantity = Number(IllinoisQuantity) + Number(IllinoisQuantityOwn)
            NewYorkQuantity = Number(NewYorkQuantity) + Number(NewYorkQuantityOwn)
            virginiaQuantity = Number(virginiaQuantity) + Number(virginiaQuantityOwn)

            var test

            totalFinalQuantity = Number(totalFinalQuantity) + Number(NCQuantity) + Number(TXquantity) + Number(IllinoisQuantity) + Number(NewYorkQuantity) + Number(virginiaQuantity)
            var manegerSearch = tracfoneReginalManegerSearch()

            for (var k = 0; k < manegerSearch.length; k++) {
                var simSaleObj = {};
                if (checkForParameter(manegerSearch[k].mmProfile)) {

                    if (manegerSearch[k].mmProfile == 1) { //1 NY Regional Mngr
                        if (checkForParameter(manegerSearch[k].tier1) && checkForParameter(manegerSearch[k].tier2)) {
                            if (Number(NewYorkQuantity) > Number(manegerSearch[k].tier1) && Number(NewYorkQuantity) < Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            } else if (Number(NewYorkQuantity) > Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            } else {
                                rate = Number(0).toFixed(2)
                            }

                            var totalAmount = Number(rate) * Number(parseInt(NewYorkQuantity))

                            simSaleObj.salesRep = manegerSearch[k].salesRep
                            simSaleObj.salesRepName = manegerSearch[k].salesRepName
                            simSaleObj.mmProfile = manegerSearch[k].mmProfileTxt
                            simSaleObj.quantity = Number(NewYorkQuantity)
                            simSaleObj.tier1 = manegerSearch[k].tier1
                            simSaleObj.tier1Rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            simSaleObj.tier2 = manegerSearch[k].tier2
                            simSaleObj.tier2Rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            simSaleObj.commissionRate = parseFloat(rate).toFixed(2)
                            simSaleObj.simsaleSum = parseFloat(Number(totalAmount).toFixed(2))
                            simSaleArray.push(simSaleObj)
                        }
                    }
                    if (manegerSearch[k].mmProfile == 2) { //2 National sale manager
                        if (checkForParameter(manegerSearch[k].tier1) && checkForParameter(manegerSearch[k].tier2)) {
                            if (Number(totalFinalQuantity) > Number(manegerSearch[k].tier1) && Number(totalFinalQuantity) < Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            } else if (Number(totalFinalQuantity) > Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            } else {
                                rate = Number(0).toFixed(2)
                            }

                            var totalAmount = Number(rate) * Number(parseInt(totalFinalQuantity))

                            simSaleObj.salesRep = manegerSearch[k].salesRep
                            simSaleObj.salesRepName = manegerSearch[k].salesRepName
                            simSaleObj.mmProfile = manegerSearch[k].mmProfileTxt
                            simSaleObj.quantity = Number(totalFinalQuantity)
                            simSaleObj.tier1 = manegerSearch[k].tier1
                            simSaleObj.tier1Rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            simSaleObj.tier2 = manegerSearch[k].tier2
                            simSaleObj.tier2Rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            simSaleObj.commissionRate = parseFloat(rate).toFixed(2)
                            simSaleObj.simsaleSum = parseFloat(Number(totalAmount).toFixed(2))
                            simSaleArray.push(simSaleObj)
                        }
                    }
                    if (manegerSearch[k].mmProfile == 4) { //4 TX Regional mngr
                        if (checkForParameter(manegerSearch[k].tier1) && checkForParameter(manegerSearch[k].tier2)) {
                            if (Number(TXquantity) > Number(manegerSearch[k].tier1) && Number(TXquantity) < Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            } else if (Number(TXquantity) > Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            } else {
                                rate = Number(0).toFixed(2)
                            }

                            var totalAmount = Number(rate) * Number(parseInt(TXquantity))

                            simSaleObj.salesRep = manegerSearch[k].salesRep
                            simSaleObj.salesRepName = manegerSearch[k].salesRepName
                            simSaleObj.mmProfile = manegerSearch[k].mmProfileTxt
                            simSaleObj.quantity = Number(TXquantity)
                            simSaleObj.tier1 = manegerSearch[k].tier1
                            simSaleObj.tier1Rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            simSaleObj.tier2 = manegerSearch[k].tier2
                            simSaleObj.tier2Rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            simSaleObj.commissionRate = parseFloat(rate).toFixed(2)
                            simSaleObj.simsaleSum = parseFloat(Number(totalAmount).toFixed(2))
                            simSaleArray.push(simSaleObj)
                        }
                    }
                    if (manegerSearch[k].mmProfile == 5) { //5 Chi Regional mngr
                        if (checkForParameter(manegerSearch[k].tier1) && checkForParameter(manegerSearch[k].tier2)) {
                            if (Number(IllinoisQuantity) > Number(manegerSearch[k].tier1) && Number(IllinoisQuantity) < Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            } else if (Number(IllinoisQuantity) > Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            } else {
                                rate = Number(0).toFixed(2)
                            }

                            var totalAmount = Number(rate) * Number(parseInt(IllinoisQuantity))

                            simSaleObj.salesRep = manegerSearch[k].salesRep
                            simSaleObj.salesRepName = manegerSearch[k].salesRepName
                            simSaleObj.mmProfile = manegerSearch[k].mmProfileTxt
                            simSaleObj.quantity = Number(IllinoisQuantity)
                            simSaleObj.tier1 = manegerSearch[k].tier1
                            simSaleObj.tier1Rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            simSaleObj.tier2 = manegerSearch[k].tier2
                            simSaleObj.tier2Rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            simSaleObj.commissionRate = parseFloat(rate).toFixed(2)
                            simSaleObj.simsaleSum = parseFloat(Number(totalAmount).toFixed(2))
                            simSaleArray.push(simSaleObj)
                        }
                    }
                    if (manegerSearch[k].mmProfile == 6) { //6 NC Regional mngr
                        if (checkForParameter(manegerSearch[k].tier1) && checkForParameter(manegerSearch[k].tier2)) {
                            if (Number(NCQuantity) > Number(manegerSearch[k].tier1) && Number(NCQuantity) < Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            } else if (Number(NCQuantity) > Number(manegerSearch[k].tier2)) {
                                rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            } else {
                                rate = Number(0).toFixed(2)
                            }

                            var totalAmount = Number(rate) * Number(parseInt(NCQuantity))

                            simSaleObj.salesRep = manegerSearch[k].salesRep
                            simSaleObj.salesRepName = manegerSearch[k].salesRepName
                            simSaleObj.mmProfile = manegerSearch[k].mmProfileTxt
                            simSaleObj.quantity = Number(NCQuantity)
                            simSaleObj.tier1 = manegerSearch[k].tier1
                            simSaleObj.tier1Rate = Number(manegerSearch[k].tier1Rate).toFixed(2)
                            simSaleObj.tier2 = manegerSearch[k].tier2
                            simSaleObj.tier2Rate = Number(manegerSearch[k].tier2Rate).toFixed(2)
                            simSaleObj.commissionRate = parseFloat(rate).toFixed(2)
                            simSaleObj.simsaleSum = parseFloat(Number(totalAmount).toFixed(2))
                            simSaleArray.push(simSaleObj)
                        }
                    }
                }
            }
            return simSaleArray
        }

        /**
         * Regional Managers Search
         * @returns {*[]|Object[]}
         */
        function tracfoneReginalManegerSearch() {
            var partnerSearchObj = search.create({
                type: "partner",
                filters:
                    [
                        ["custentity51","anyof","1","2","4","5","6"],
                        "AND",
                        ["internalidnumber","notequalto","18152"]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "companyname", label: "CompanyName"}),
                        search.createColumn({name: "altname", label: "Name"}),
                        search.createColumn({name: "class", label: "Class"}),
                        search.createColumn({
                            name: "custentity51",
                            sort: search.Sort.ASC,
                            label: "MMCommissionProfile"
                        }),
                        search.createColumn({name: "custentity52", label: "AR"}),
                        search.createColumn({name: "custentity_jj_trac_exclusive_rate", label: "EXCLUSIVE"}),
                        search.createColumn({name: "custentity61", label: "ELITE"}),
                        search.createColumn({name: "custentity53", label: "MEMBER"}),
                        search.createColumn({name: "custentity54", label: "PRO"}),
                        search.createColumn({name: "custentity62", label: "VIP"}),
                        search.createColumn({name: "custentity_sim_cards_teir_1", label: "SimCardstier1"}),
                        search.createColumn({name: "custentity70", label: "SimCardstier2"}),
                        search.createColumn({name: "custentity81", label: "SimTier1rate"}),
                        search.createColumn({name: "custentity82", label: "SimTier2Rate"}),
                        search.createColumn({name: "custentity_jj_branded_handset_count", label: "BrandedHSTier1"}),
                        search.createColumn({name: "custentity57", label: "BrandedHSTier1rate"}),
                        search.createColumn({name: "custentity64", label: "BrandedHSTier2"}),
                        search.createColumn({name: "custentity63", label: "BrandedHSTier2rate"}),
                        search.createColumn({name: "custentity58", label: "MarketPlaceTier1"}),
                        search.createColumn({name: "custentity66", label: "MarketPlaceTier1Rate"}),
                        search.createColumn({name: "custentity65", label: "MarketPlaceTier2"}),
                        search.createColumn({name: "custentity60", label: "MarketPlaceTier2Rate"}),
                        search.createColumn({name: "custentity_jj_total_credit_card_per_mont", label: "TOTALCREDITCARD"}),
                        search.createColumn({name: "custentity_jj_air_bonus_tier_1", label: "AirBonusTier1"}),
                        search.createColumn({name: "custentity_jj_air_bonus_tier_2", label: "AirBonusTier2"}),
                        search.createColumn({name: "custentity_jj_air_bonus_tier_3", label: "AirBonusTier3"}),
                        search.createColumn({name: "custentity80", label: "Airtimetier1"}),
                        search.createColumn({name: "custentity73", label: "Airtimetier15"}),
                        search.createColumn({name: "custentity71", label: "Airtimetier2"}),
                        search.createColumn({name: "custentity74", label: "Airtimetier25"}),
                        search.createColumn({name: "custentity72", label: "Airtimetier3"}),
                        search.createColumn({name: "custentity75", label: "Airtimetier35"}),
                        search.createColumn({name: "custentity76", label: "MerchantSVCTeir1"}),
                        search.createColumn({name: "custentity77", label: "MerchantSVCTeir10"}),
                        search.createColumn({name: "custentity_jj_warehouse_payout_rate_2", label: "WAREHOUSEPAYOUTRATE2"}),
                        search.createColumn({name: "custentity87", label: "WarehousePayoutRate1"}),
                        search.createColumn({name: "custentity86", label: "WarehouseHSTier1"}),
                        search.createColumn({name: "custentity_jj_warehouse_qty_gt_600", label: "WarehouseQtygt600"}),
                        search.createColumn({name: "custentity_jj_credit_card_bonus_tier", label: "CreditCardBonusTier"}),
                        search.createColumn({name: "custentity78", label: "NewDoorAdd1"}),
                        search.createColumn({name: "custentity79", label: "NewDoorAdd4"}),
                        search.createColumn({name: "custentity_jj_total_new_doors_added", label: "TOTALNEWDOORSADDED"}),
                        search.createColumn({name: "custentity_jj_activation_bonus_25", label: "ActivationBonus25"}),
                        search.createColumn({name: "custentity_jj_activation_bonus_50", label: "ActivationBonus50"}),
                        search.createColumn({name: "custentity_jj_activation_bonus_75", label: "ActivationBonus70"})
                    ]
            });
            var searchResultCount = partnerSearchObj.runPaged().count;
            var resultArr = []
            partnerSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var salesRep = result.getValue({
                    name: "companyname"
                });
                var salesRepId = result.getValue({
                    name: "internalid"
                });
                var mmProfile = result.getValue({
                    name: "custentity51",
                });
                var mmProfileTxt = result.getText({
                    name: "custentity51",
                });
                var AR = result.getValue({name: "custentity52"})
                var Exclusive = result.getValue({name: "custentity_jj_trac_exclusive_rate"})
                var Elite = result.getValue({name: "custentity61"})
                var Member = result.getValue({name: "custentity53"})
                var Pro = result.getValue({name: "custentity54"})
                var Executive = result.getValue({name: "custentity62"})
                var tier1 = result.getValue({
                    name: "custentity_sim_cards_teir_1"
                });
                var tier1Rate = result.getValue({
                    name: "custentity81"
                });
                var tier2 = result.getValue({
                    name: "custentity70"
                });
                var tier2Rate = result.getValue({
                    name: "custentity82"
                });
                var brandedHSTier1 = result.getValue({
                    name: "custentity_jj_branded_handset_count"
                })
                var brandedHSTier1Rate = result.getValue({
                    name: "custentity57"
                })
                var brandedHSTier2 = result.getValue({
                    name: "custentity64"
                })
                var brandedHSTier2Rate = result.getValue({
                    name: "custentity63"
                })
                var airtimeTotalCreditCard =  result.getValue({
                    name: "custentity_jj_total_credit_card_per_mont"
                })
                var airtimeCreditCardBonusTier = result.getValue({
                    name: "custentity_jj_credit_card_bonus_tier"
                })
                var airbonusTier1 = result.getValue({name: "custentity_jj_air_bonus_tier_1"})
                var airbonusTier2 = result.getValue({name: "custentity_jj_air_bonus_tier_2"})
                var airbonusTier3 = result.getValue({name: "custentity_jj_air_bonus_tier_3"})
                var airtimeTier1 = result.getValue({name: "custentity80"})
                var airtimeTier15 = result.getValue({name: "custentity73"})
                var airtimeTier2 = result.getValue({name: "custentity71"})
                var airtimeTier25 = result.getValue({name: "custentity74"})
                var airtimeTier3 = result.getValue({name: "custentity72"})
                var airtimeTier35 = result.getValue({name: "custentity75"})
                var airtimeMerchantSVTeir1 = result.getValue({name: "custentity76"})
                var airtimeMerchantSVTeir10 = result.getValue({name: "custentity77"})
                var airtimeTotalNewDoorsAdded = result.getValue({name: "custentity_jj_total_new_doors_added"})
                var airtimeNewDoorAdd1 = result.getValue({name: "custentity78"})
                var airtimeNewDoorAdd4 = result.getValue({name: "custentity79"})
                var activationBonus25 = result.getValue({name: "custentity_jj_activation_bonus_25"})
                var activationBonus50 = result.getValue({name: "custentity_jj_activation_bonus_50"})
                var activationBonus70 = result.getValue({name: "custentity_jj_activation_bonus_75"})
                var warehouseHSTier1 = result.getValue({name: "custentity86"})
                var warehousePayOutRate1 = result.getValue({name: "custentity87"})
                var warehousePayOutRate2 = result.getValue({name: "custentity_jj_warehouse_payout_rate_2"})
                var warehouseQtyGt600 = result.getValue({name: "custentity_jj_warehouse_qty_gt_600"})

                resultArr.push({
                    salesRep: salesRepId,
                    salesRepName: salesRep,
                    tier1: tier1,
                    tier1Rate: tier1Rate,
                    tier2: tier2,
                    tier2Rate: tier2Rate,
                    mmProfile: mmProfile,
                    mmProfileTxt: mmProfileTxt,
                    AR:AR,
                    Exclusive: Exclusive,
                    Elite: Elite,
                    Member: Member,
                    Pro: Pro,
                    Executive:Executive,
                    brandedHSTier1: brandedHSTier1,
                    brandedHSTier1Rate: brandedHSTier1Rate,
                    brandedHSTier2: brandedHSTier2,
                    brandedHSTier2Rate: brandedHSTier2Rate,
                    airtimeTotalCreditCard: airtimeTotalCreditCard,
                    airtimeCreditCardBonusTier: airtimeCreditCardBonusTier,
                    airbonusTier1: airbonusTier1,
                    airbonusTier2: airbonusTier2,
                    airbonusTier3: airbonusTier3,
                    airtimeTier1: airtimeTier1,
                    airtimeTier15: airtimeTier15,
                    airtimeTier2: airtimeTier2,
                    airtimeTier25: airtimeTier25,
                    airtimeTier3: airtimeTier3,
                    airtimeTier35: airtimeTier35,
                    airtimeMerchantSVTeir1: airtimeMerchantSVTeir1,
                    airtimeMerchantSVTeir10: airtimeMerchantSVTeir10,
                    airtimeTotalNewDoorsAdded: airtimeTotalNewDoorsAdded,
                    airtimeNewDoorAdd1: airtimeNewDoorAdd1,
                    airtimeNewDoorAdd4: airtimeNewDoorAdd4,
                    activationBonus25: activationBonus25,
                    activationBonus50: activationBonus50,
                    activationBonus70: activationBonus70,
                    warehouseHSTier1: warehouseHSTier1,
                    warehousePayOutRate1: warehousePayOutRate1,
                    warehousePayOutRate2: warehousePayOutRate2,
                    warehouseQtyGt600: warehouseQtyGt600
                })
                return true;
            });
            return resultArr
        }

        /**
         * Search for Activation Bonus Commisions
         * @returns {activationArr[]} activation bonus search results
         */
        function activationBonusSearch(){
            var customrecord_jj_tracfone_activationsSearchObj = search.create({
                type: "customrecord_jj_tracfone_activations",
                filters:
                    [
                        ["custrecord_jj_tra_activation_date","within","lastmonth"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                            summary: "GROUP",
                            label: "SalesRep ID"
                        }),
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
            var activationArr = [];
            if(searchResultCount>0){
                customrecord_jj_tracfone_activationsSearchObj.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    var salesRep = result.getValue({
                        name: "custrecord_jj_sales_rep_tracfone",
                        summary: "GROUP"
                    });
                    var salesRepId = result.getValue({
                        name: "internalid",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    })
                    var salesRepTxt = result.getText({
                        name: "custrecord_jj_sales_rep_tracfone",
                        summary: "GROUP"
                    });
                    var internalid = result.getValue({
                        name: "internalid",
                        summary: "COUNT"
                    })
                    var formulaBonus = result.getValue({
                        name: "formulanumeric",
                        summary: "COUNT",
                        formula: "CASE WHEN {custrecord_jj_tracfone_teir} = 'ELITE' OR  {custrecord_jj_tracfone_teir} = 'PRO'  OR  {custrecord_jj_tracfone_teir} = 'VIP' OR  {custrecord_jj_tracfone_teir} = 'VIP+'  THEN  {internalid} END"
                    });
                    var qty = result.getValue({
                        name: "internalid",
                        summary: "COUNT"
                    });
                    var ab25 = result.getValue({
                        name: "custentity_jj_activation_bonus_25",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    });
                    var ab50 = result.getValue({
                        name: "custentity_jj_activation_bonus_50",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    });
                    var ab70 = result.getValue({
                        name: "custentity_jj_activation_bonus_75",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    });
                    var mmProfile = result.getValue({
                        name: "custentity51",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    });
                    var mmProfileTxt = result.getText({
                        name: "custentity51",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    });
                    var activationClass = result.getValue({
                        name: "class",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    })
                    var activationClassTxt = result.getText({
                        name: "class",
                        join: "CUSTRECORD_JJ_SALES_REP_TRACFONE",
                        summary: "GROUP"
                    })
                    var marketManager = result.getValue({
                        name: "custrecord_jj_mkt_manager",
                        summary: "GROUP"
                    })
                    var marketManagerTxt = result.getText({
                        name: "custrecord_jj_mkt_manager",
                        summary: "GROUP"
                    })

                    activationArr.push({
                        salesRepId: salesRepId,
                        salesRep: salesRep,
                        salesRepTxt: salesRepTxt,
                        internalid: internalid,
                        mmProfile: mmProfile,
                        mmProfileTxt: mmProfileTxt,
                        activationClass: activationClass,
                        activationClassTxt: activationClassTxt,
                        marketManager: marketManager,
                        marketManagerTxt: marketManagerTxt,
                        formulaBonus: formulaBonus,
                        qty: qty,
                        ab25: ab25,
                        ab50: ab50,
                        ab70: ab70
                    });
                    return true;
                });
            }
            var activation = setActivationBonusList(activationArr)
            return activation;
        }

        /**
         * Function for setting the trancfone activation bonus sub tab.
         * @param sublistActivationBonus
         * @param activationBonusSearchval
         * @param profile
         * @param manegerSearch
         * @returns {[Object Array]}
         */
        function setActivationBonusList(activationBonusSearchval) {
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


            for (var k = 0; k < activationBonusSearchval.length; k++) {
                var trancFoneObj = {}

                if (activationBonusSearchval[k].mmProfile != 1 && activationBonusSearchval[k].mmProfile != 2 && activationBonusSearchval[k].mmProfile != 4 && activationBonusSearchval[k].mmProfile != 5 && activationBonusSearchval[k].mmProfile != 6) {

                    if (activationBonusSearchval[k].marketManagerTxt != '- None -') {
                        var activationObj = {}
                        if (activationBonusSearchval[k].mmProfile == 3 || activationBonusSearchval[k].mmProfile == 0) {

                            var totalSold = activationBonusSearchval[k].internalid

                            var bonusSold = activationBonusSearchval[k].formulaBonus

                            let activationPercentage = 0
                            if (checkForParameter(activationBonusSearchval[k].internalid) && checkForParameter(activationBonusSearchval[k].formulaBonus)) {
                                if (parseInt(activationBonusSearchval[k].internalid) > 0) {
                                    activationPercentage = (Number(activationBonusSearchval[k].formulaBonus) * 100) / Number(activationBonusSearchval[k].internalid)
                                }
                            }

                            let activationBonusTotal = 0
                            if (activationPercentage >= 25 && activationPercentage < 50) {
                                if (checkForParameter(activationBonusSearchval[k].ab25)) {
                                    activationBonusTotal = activationBonusSearchval[k].ab25
                                }
                            } else if (activationPercentage >= 50 && activationPercentage < 70) {
                                if (checkForParameter(activationBonusSearchval[k].ab50)) {
                                    activationBonusTotal = activationBonusSearchval[k].ab50
                                }
                            } else if (activationPercentage > 70) {
                                if (checkForParameter(activationBonusSearchval[k].ab70)) {
                                    activationBonusTotal = activationBonusSearchval[k].ab70
                                }
                            }
                            activationObj.MarketManager = activationBonusSearchval[k].salesRepTxt

                            if (activationBonusSearchval[k].marketManagerTxt == "SolomonS") {
                                let temp = (activationBonusSearchval[k].marketManagerTxt).toUpperCase();
                                activationObj.salesRepName = temp
                            } else {
                                activationObj.salesRepName = activationBonusSearchval[k].marketManagerTxt
                            }

                            activationObj.salesRep = activationBonusSearchval[k].salesRepId
                            activationObj.MMCommissionProfile = activationBonusSearchval[k].mmProfileTxt
                            activationObj.totalSold = activationBonusSearchval[k].internalid
                            activationObj.bonusSold = activationBonusSearchval[k].formulaBonus
                            activationObj.activationPercentage = Number(activationPercentage)
                            activationObj.totalAmount = Number(activationBonusTotal).toFixed(2)
                            activationArray.push(activationObj)
                        }

                        if (activationBonusSearchval[k].activationClassTxt == "TX") {
                            TXtotalSold = Number(TXtotalSold) + Number(activationBonusSearchval[k].internalid)
                            TXBonusSold = Number(TXBonusSold) + Number(activationBonusSearchval[k].formulaBonus)
                        } else if (activationBonusSearchval[k].activationClassTxt == "North Carolina") {
                            NCtotalSold = Number(NCtotalSold) + Number(activationBonusSearchval[k].internalid)
                            NCBonusSold = Number(NCBonusSold) + Number(activationBonusSearchval[k].formulaBonus)
                        } else if (activationBonusSearchval[k].activationClassTxt == "New York") {
                            NYtotalSold = Number(NYtotalSold) + Number(activationBonusSearchval[k].internalid)
                            NYbonusSold = Number(NYbonusSold) + Number(activationBonusSearchval[k].formulaBonus)
                        } else if (activationBonusSearchval[k].activationClassTxt == "Illinois") {
                            CHItotalSold = Number(CHItotalSold) + Number(activationBonusSearchval[k].internalid)
                            CHIBonusSold = Number(CHIBonusSold) + Number(activationBonusSearchval[k].formulaBonus)
                        } else if (activationBonusSearchval[k].activationClassTxt == "Virginia") {
                            virginiaTotalSold = Number(virginiaTotalSold) + Number(activationBonusSearchval[k].internalid)
                            virginiaBonusSold = Number(virginiaBonusSold) + Number(activationBonusSearchval[k].formulaBonus)
                        }
                    }
                }
                else if (activationBonusSearchval[k].mmProfile == 5) {
                    CHItotalOwn = activationBonusSearchval[k].internalid
                    CHIBonusOwn = activationBonusSearchval[k].formulaBonus
                }
                else if (activationBonusSearchval[k].mmProfile == 2) {
                    virginiaTotalOwn = activationBonusSearchval[k].internalid
                    virginiaBonusOwn = activationBonusSearchval[k].formulaBonus
                }
                else if (activationBonusSearchval[k].mmProfile == 6) {
                    NCtotalOwn = activationBonusSearchval[k].internalid
                    NCBonusOwn = activationBonusSearchval[k].formulaBonus
                }
                else if (activationBonusSearchval[k].mmProfile == 1) {
                    NYtotalOwn = activationBonusSearchval[k].internalid
                    NybonusOwn = activationBonusSearchval[k].formulaBonus
                }
                else if (activationBonusSearchval[k].mmProfile == 4) {
                    TXtotalOwn = activationBonusSearchval[k].internalid
                    TXbonusOwn = activationBonusSearchval[k].formulaBonus
                }
            }

            virginiaBonusSold = Number(virginiaBonusSold) + Number(virginiaBonusOwn) + Number(CHIBonusSold) + Number(CHIBonusOwn) + Number(NCBonusSold) + Number(NCBonusOwn) + Number(NYbonusSold) + Number(NybonusOwn) + Number(TXBonusSold) + Number(TXbonusOwn)
            virginiaTotalSold = Number(virginiaTotalSold) + Number(virginiaTotalOwn) + Number(CHItotalSold) + Number(CHItotalOwn) + Number(NCtotalSold) + Number(NCtotalOwn) + Number(NYtotalSold) + Number(NYtotalOwn) + Number(TXtotalSold) + Number(TXtotalOwn)

            var manegerSearch = tracfoneReginalManegerSearch()

            for (var j = 0; j < manegerSearch.length; j++) {
                if (checkForParameter(manegerSearch[j].mmProfile)) {

                    if (manegerSearch[j].mmProfile == 5) {
                        CHIBonusSold = Number(CHIBonusSold) + Number(CHIBonusOwn)
                        CHItotalSold = Number(CHItotalSold) + Number(CHItotalOwn)
                        var activationObj = {}
                        activationObj.salesRep = manegerSearch[j].salesRep
                        activationObj.MarketManager = manegerSearch[j].salesRepName
                        activationObj.MMCommissionProfile = manegerSearch[j].mmProfileTxt
                        activationObj.totalSold = CHItotalSold
                        if (CHIBonusSold == "" || CHIBonusSold == " " || CHIBonusSold == null || CHIBonusSold == undefined) {
                            CHIBonusSold = 0
                        }
                        activationObj.bonusSold = CHIBonusSold

                        var activationPercentage = 0
                        if (checkForParameter(CHItotalSold) && checkForParameter(CHIBonusSold)) {
                            if (CHIBonusSold > 0) {
                                activationPercentage = (Number(CHIBonusSold) * 100) / Number(CHItotalSold)
                            }
                        }
                        activationObj.activationPercentage = parseFloat(activationPercentage).toFixed(2)


                        let activationBonusTotal = 0
                        if (activationPercentage >= 25 && activationPercentage < 50) {
                            if (checkForParameter(manegerSearch[j].activationBonus25)) {
                                activationBonusTotal = manegerSearch[j].activationBonus25
                            }
                        }
                        else if (activationPercentage >= 50 && activationPercentage < 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus50)) {
                                activationBonusTotal = manegerSearch[j].activationBonus50
                            }
                        }
                        else if (activationPercentage > 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus70)) {
                                activationBonusTotal = manegerSearch[j].activationBonus70
                            }
                        }
                        activationObj.totalAmount = Number(activationBonusTotal)
                        activationArray.push(activationObj)
                    }

                    //National sales Manager
                    else if (manegerSearch[j].mmProfile == 2) {
                        var activationObj = {}
                        activationObj.salesRep = manegerSearch[j].salesRep
                        activationObj.MarketManager = manegerSearch[j].salesRepName
                        activationObj.MMCommissionProfile = manegerSearch[j].mmProfileTxt
                        activationObj.totalSold = virginiaTotalSold
                        if (virginiaBonusSold == "" || virginiaBonusSold == " " || virginiaBonusSold == null || virginiaBonusSold == undefined) {
                            virginiaBonusSold = 0
                        }
                        activationObj.bonusSold = virginiaBonusSold

                        var activationPercentage = 0
                        if (checkForParameter(virginiaTotalSold) && checkForParameter(virginiaBonusSold)) {
                            if (virginiaBonusSold > 0) {
                                activationPercentage = (Number(virginiaBonusSold) * 100) / Number(virginiaTotalSold)
                            }
                        }
                        activationObj.activationPercentage = parseFloat(activationPercentage).toFixed(2)


                        let activationBonusTotal = 0
                        if (activationPercentage >= 25 && activationPercentage < 50) {
                            if (checkForParameter(manegerSearch[j].activationBonus25)) {
                                activationBonusTotal = manegerSearch[j].activationBonus25
                            }
                        }
                        else if (activationPercentage >= 50 && activationPercentage < 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus50)) {
                                activationBonusTotal = manegerSearch[j].activationBonus50
                            }
                        }
                        else if (activationPercentage > 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus70)) {
                                activationBonusTotal = manegerSearch[j].activationBonus70
                            }
                        }
                        activationObj.totalAmount = Number(activationBonusTotal)
                        activationArray.push(activationObj)
                    }

                    else if (manegerSearch[j].mmProfile == 6) {
                        NCBonusSold = Number(NCBonusSold) + Number(NCBonusOwn)
                        NCtotalSold = Number(NCtotalSold) + Number(NCtotalOwn)

                        var interObj = {}
                        var activationObj = {}
                        activationObj.salesRep = manegerSearch[j].salesRep
                        activationObj.MarketManager = manegerSearch[j].salesRepName
                        activationObj.MMCommissionProfile = manegerSearch[j].mmProfileTxt
                        activationObj.totalSold = NCtotalSold
                        if (NCBonusSold == "" || NCBonusSold == " " || NCBonusSold == null || NCBonusSold == undefined) {
                            NCBonusSold = 0
                        }
                        activationObj.bonusSold = NCBonusSold

                        var activationPercentage = 0
                        if (checkForParameter(NCtotalSold) && checkForParameter(NCBonusSold)) {
                            if (NCBonusSold > 0) {
                                activationPercentage = (Number(NCBonusSold) * 100) / Number(NCtotalSold)
                            }
                        }
                        activationObj.activationPercentage = Number(activationPercentage)


                        let activationBonusTotal = 0
                        if (activationPercentage >= 25 && activationPercentage < 50) {
                            if (checkForParameter(manegerSearch[j].activationBonus25)) {
                                activationBonusTotal = manegerSearch[j].activationBonus25
                            }
                        }
                        else if (activationPercentage >= 50 && activationPercentage < 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus50)) {
                                activationBonusTotal = manegerSearch[j].activationBonus50
                            }
                        }
                        else if (activationPercentage > 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus70)) {
                                activationBonusTotal = manegerSearch[j].activationBonus70
                            }
                        }
                        activationObj.totalAmount = Number(activationBonusTotal)
                        activationArray.push(activationObj)

                    }

                    else if (manegerSearch[j].mmProfile == 1) {
                        NYbonusSold = Number(NYbonusSold) + Number(NybonusOwn)
                        NYtotalSold = Number(NYtotalSold) + Number(NYtotalOwn)

                        var activationObj = {}
                        activationObj.salesRep = manegerSearch[j].salesRep
                        activationObj.MarketManager = manegerSearch[j].salesRepName
                        activationObj.MMCommissionProfile = manegerSearch[j].mmProfileTxt
                        activationObj.totalSold = NYtotalSold
                        if (NYbonusSold == "" || NYbonusSold == " " || NYbonusSold == null || NYbonusSold == undefined) {
                            NYbonusSold = 0
                        }
                        activationObj.bonusSold = NYbonusSold

                        var activationPercentage = 0
                        if (checkForParameter(NYtotalSold) && checkForParameter(NYbonusSold)) {
                            if (NYbonusSold > 0) {
                                activationPercentage = (Number(NYbonusSold) * 100) / Number(NYtotalSold)
                            }
                        }
                        activationObj.activationPercentage = parseFloat(activationPercentage).toFixed(2)


                        let activationBonusTotal = 0
                        if (activationPercentage >= 25 && activationPercentage < 50) {
                            if (checkForParameter(manegerSearch[j].activationBonus25)) {
                                activationBonusTotal = manegerSearch[j].activationBonus25
                            }
                        }
                        else if (activationPercentage >= 50 && activationPercentage < 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus50)) {
                                activationBonusTotal = manegerSearch[j].activationBonus50
                            }
                        }
                        else if (activationPercentage > 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus70)) {
                                activationBonusTotal = manegerSearch[j].activationBonus70
                            }
                        }
                        activationObj.totalAmount = Number(activationBonusTotal)
                        activationArray.push(activationObj)
                    }

                    else if (manegerSearch[j].mmProfile == 4) {
                        TXBonusSold = Number(TXBonusSold) + Number(TXbonusOwn)
                        TXtotalSold = Number(TXtotalSold) + Number(TXtotalOwn)

                        var activationObj = {}
                        activationObj.salesRep = manegerSearch[j].salesRep
                        activationObj.MarketManager = manegerSearch[j].salesRepName
                        activationObj.MMCommissionProfile = manegerSearch[j].mmProfileTxt
                        activationObj.totalSold = TXtotalSold
                        if (TXBonusSold == "" || TXBonusSold == " " || TXBonusSold == null || TXBonusSold == undefined) {
                            TXBonusSold = 0
                        }
                        activationObj.bonusSold = TXBonusSold

                        var activationPercentage = 0
                        if (checkForParameter(TXtotalSold) && checkForParameter(TXBonusSold)) {
                            if (TXBonusSold > 0) {
                                activationPercentage = (Number(TXBonusSold) * 100) / Number(TXtotalSold)
                            }
                        }
                        activationObj.activationPercentage = parseFloat(activationPercentage).toFixed(2)


                        let activationBonusTotal = 0
                        if (activationPercentage >= 25 && activationPercentage < 50) {
                            if (checkForParameter(manegerSearch[j].activationBonus25)) {
                                activationBonusTotal = manegerSearch[j].activationBonus25
                            }
                        }
                        else if (activationPercentage >= 50 && activationPercentage < 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus50)) {
                                activationBonusTotal = manegerSearch[j].activationBonus50
                            }
                        }
                        else if (activationPercentage > 70) {
                            if (checkForParameter(manegerSearch[j].activationBonus70)) {
                                activationBonusTotal = manegerSearch[j].activationBonus70
                            }
                        }
                        activationObj.totalAmount = Number(activationBonusTotal)
                        activationArray.push(activationObj)
                    }
                }
            }
            return activationArray;
        }

        /**
         * Search for Airtime bonus Commisions
         * @returns {qpaySearchVal[{}]} activation bonus search result
         */
        function airtimeBonusSearch(){
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["partner", "noneof", "@NONE@", "12191", "14638", "14224", "14747", "14848", "15073", "15265", "14426", "15522", "11939", "14117", "14142", "14219", "14352", "14402", "4854", "14427", "14482", "14640", "14708", "14758", "14759", "14986", "15016", "15107", "15161", "15206", "16603", "17474", "18315", "8760", "10284", "15425", "15449", "15571", "15572", "15676", "16261", "16419", "4857", "4993", "17402", "17408", "4858", "18414", "4865", "4866", "4867", "4870", "4977", "4982", "4985", "4987", "4988", "4989", "4990", "4991", "4992", "8034", "4853", "14649", "14979", "17367", "10136", "4851", "11404", "4852", "11818", "12093", "8049", "8048", "8050", "8051", "8353", "4847", "8425", "8559", "8627", "8688", "8757", "8758", "8755", "8756", "9371", "9372", "9960", "8759", "8761", "9271", "9282", "4849", "9463", "9566", "9623", "14223", "15134", "9852", "10093", "7595", "10370", "10393", "10456", "10516", "10551", "10599", "11030", "11096", "11214", "11235", "11271", "11314", "11315", "11421", "11432", "11449", "11594", "11781", "11917", "11921", "11935", "11940", "12003", "18422"],
                        "AND", ["category", "noneof", "5"],
                        "AND", ["isinactive", "is", "F"],
                        "AND", ["custentity3", "noneof", "@NONE@"]
                    ],
                columns:
                    [
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
            var airtimeArr = []
            customerSearchObj.run().each(function (airtime) {
                var airtimePMairtimesum = airtime.getValue({
                    name: "custentity_jj_previous_month_airtime_sum",
                    summary: "SUM"
                })
                var airtimeMarketManager = airtime.getText({
                    name: "custentity3",
                    summary: "GROUP"
                });
                var airtimeCreditCard = airtime.getValue({
                    name: "custentity_jj_total_credit_card_per_mont",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeCreditCardTier = airtime.getValue({
                    name: "formulanumeric",
                    summary: "GROUP",
                    formula: "{partner.custentity_jj_credit_card_bonus_tier}"
                });
                var airtimeTier1 = airtime.getValue({
                    name: "custentity_jj_air_bonus_tier_1",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier2 = airtime.getValue({
                    name: "custentity_jj_air_bonus_tier_2",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier3 = airtime.getValue({
                    name: "custentity_jj_air_bonus_tier_3",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier1Value =airtime.getValue({
                    name: "custentity80",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier15Value = airtime.getValue({
                    name: "custentity73",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier2Value = airtime.getValue({
                    name: "custentity71",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier25Value = airtime.getValue({
                    name: "custentity74",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier3Value = airtime.getValue({
                    name: "custentity72",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTier35Value = airtime.getValue({
                    name: "custentity75",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeMarchantTier1 = airtime.getValue({
                    name: "custentity76",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeMarchantTier10 = airtime.getValue({
                    name: "custentity77",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeTotalNewDoors = airtime.getValue({
                    name: "custentity_jj_total_new_doors_added",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeNewDoorAdd1 = airtime.getValue({
                    name: "custentity78",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeNewDoorAdd4 = airtime.getValue({
                    name: "custentity79",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeSalesRepPartner = airtime.getText({
                    name: "partner",
                    summary: "GROUP"
                });
                var airtimeSalesRepPartnerValue = airtime.getValue({
                    name: "partner",
                    summary: "GROUP"
                });
                var airtimeClass = airtime.getValue({
                    name: "class",
                    join: "partner",
                    summary: "GROUP"
                });
                var airtimeMMProfile = airtime.getValue({
                    name: "custentity51",
                    join: "partner",
                    summary: "GROUP"
                })
                var airtimeMMProfileTxt = airtime.getText({
                    name: "custentity51",
                    join: "partner",
                    summary: "GROUP"
                })

                airtimeArr.push({
                    airtimePMairtimesum: airtimePMairtimesum,
                    airtimeMarketManager: airtimeMarketManager,
                    airtimeSalesRepPartner: airtimeSalesRepPartner,
                    airtimeSalesRepPartnerValue: airtimeSalesRepPartnerValue,
                    airtimeClass: airtimeClass,
                    airtimeMMProfile: airtimeMMProfile,
                    airtimeMMProfileTxt: airtimeMMProfileTxt,
                    airtimeCreditCard: airtimeCreditCard,
                    airtimeCreditCardTier: airtimeCreditCardTier,
                    airtimeTier1: airtimeTier1,
                    airtimeTier2: airtimeTier2,
                    airtimeTier3: airtimeTier3,
                    airtimeTier1Value: airtimeTier1Value,
                    airtimeTier15Value: airtimeTier15Value,
                    airtimeTier2Value: airtimeTier2Value,
                    airtimeTier25Value: airtimeTier25Value,
                    airtimeTier3Value: airtimeTier3Value,
                    airtimeTier35Value: airtimeTier35Value,
                    airtimeMarchantTier1: airtimeMarchantTier1,
                    airtimeMarchantTier10: airtimeMarchantTier10,
                    airtimeTotalNewDoors: airtimeTotalNewDoors,
                    airtimeNewDoorAdd1: airtimeNewDoorAdd1,
                    airtimeNewDoorAdd4: airtimeNewDoorAdd4
                });
                return true;
            });
            var qpaySearchVal = QPayAirTimeBonusSearch(airtimeArr);
            return qpaySearchVal;
        }

        /**
         * Search for Qpay Airtime Bonus Search
         * @param {customerSearchObj} - airtimebonus search result
         * @returns {setAirTimeBonusVal} Qpay airtime bonus search results
         */
        function QPayAirTimeBonusSearch(customerSearchObj){
            var customrecord_jj_qpaydetail_transactionSearchObj = search.create({
                type: "customrecord_jj_qpaydetail_transaction",
                filters:
                    [
                        ["custrecord_jj_sales_rep_qpay","noneof","@NONE@"],
                        "AND",
                        ["custrecord_jj_sales_rep_qpay.custentity51","noneof","@NONE@"],
                        "AND",
                        ["custrecord_jj_qpaydetail_date","within","lastmonth"]
                    ],
                columns:
                    [
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
            var qpayArr = [];
            customrecord_jj_qpaydetail_transactionSearchObj.run().each(function (qpay) {
                var qpayCompanyName = qpay.getValue({
                    name: "companyname",
                    join: "CUSTRECORD_JJ_SALES_REP_QPAY",
                    summary: "GROUP"
                });
                var qpayRetail = qpay.getValue({
                    name: "custrecord_jj_qpaydetail_retailcost",
                    summary: "SUM"
                });

                qpayArr.push({
                    qpayCompanyName: qpayCompanyName,
                    qpayRetail: qpayRetail
                });
                return true;
            });
            var setAirTimeBonusVal = setAirTimeBonusCommision(customerSearchObj,qpayArr);
            return setAirTimeBonusVal;
        }

        /**
         * Function for setting Air Time Bonus of Sales Rep Partners
         * @param {airTimeBonusSearch}
         * @param {qpayAirTimeBonusSearch}
         * @returns {airTimeSetArray []} airtime commision of salesRep Partner which contains Their individual Airtime bonus Sum
         */
        function setAirTimeBonusCommision(airTimeBonusSearch,qpayAirTimeBonusSearch){
            var airTimeSetArray = [];
            for(var i=0;i<qpayAirTimeBonusSearch.length;i++) {
                let flagChecker = false

                for(var j=0;j<airTimeBonusSearch.length;j++) {
                    if (airTimeBonusSearch[j].airtimeMarketManager == "SolomonS") {
                        airTimeBonusSearch[j].airtimeMarketManager = ("SolomonS").toUpperCase();
                    }

                    if (qpayAirTimeBonusSearch[i].qpayCompanyName) {

                        if (airTimeBonusSearch[j].airtimeMarketManager == qpayAirTimeBonusSearch[i].qpayCompanyName) {

                            airTimeBonusSearch[j].qpayAirtimeCommsion = qpayAirTimeBonusSearch[i].qpayRetail
                            flagChecker = true
                            break;
                        }
                    }
                }
            }

            let lineNumber = 0;
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


            for(var i=0;i<airTimeBonusSearch.length;i++){
                if (airTimeBonusSearch[i].airtimeMMProfile != 1 && airTimeBonusSearch[i].airtimeMMProfile != 2 && airTimeBonusSearch[i].airtimeMMProfile != 4 && airTimeBonusSearch[i].airtimeMMProfile != 5 && airTimeBonusSearch[i].airtimeMMProfile != 6) {

                    if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                        var partnerSum = Number(airTimeBonusSearch[i].airtimePMairtimesum) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion)
                    } else if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum)) {
                        var partnerSum = airTimeBonusSearch[i].airtimePMairtimesum
                    } else {
                        var partnerSum = 0
                    }

                    if(airTimeBonusSearch[i].airtimeMMProfile == 3 || airTimeBonusSearch[i].airtimeMMProfile == 0) {
                        var airTimeObj = {};
                        var bonusPercentage;
                        if (checkForParameter(airTimeBonusSearch[i].airtimeCreditCard && airTimeBonusSearch[i].airtimeCreditCardTier)) {
                            if ((airTimeBonusSearch[i].airtimeCreditCard) > airTimeBonusSearch[i].airtimeCreditCardTier) {
                                bonusPercentage = 100
                            } else {
                                bonusPercentage = 50
                            }
                        } else {
                            bonusPercentage = 0
                        }

                        //check the air time bonus is in which tier based on the previous month total.
                        var airTimeBonus = 0

                        if (checkForParameter(airTimeBonusSearch[i].airtimeTier1) && checkForParameter(airTimeBonusSearch[i].airtimeTier2) && checkForParameter(airTimeBonusSearch[i].airtimeTier3)) {
                            if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum)) {
                                if (parseFloat(airTimeBonusSearch[i].airtimePMairtimesum) > parseFloat(airTimeBonusSearch[i].airtimeTier1) && parseFloat(airTimeBonusSearch[i].airtimePMairtimesum) < parseFloat(airTimeBonusSearch[i].airtimeTier2)) {
                                    if (bonusPercentage == 100) {
                                        airTimeBonus = airTimeBonusSearch[i].airtimeTier1Value

                                    } else if (bonusPercentage == 50) {
                                        airTimeBonus = airTimeBonusSearch[i].airtimeTier15Value

                                    }
                                } else if (parseFloat(airTimeBonusSearch[i].airtimePMairtimesum) > parseFloat(airTimeBonusSearch[i].airtimeTier2) && parseFloat(airTimeBonusSearch[i].airtimePMairtimesum) < parseFloat(airTimeBonusSearch[i].airtimeTier3)) {
                                    if (bonusPercentage == 100) {
                                        airTimeBonus = airTimeBonusSearch[i].airtimeTier2Value
                                    } else if (bonusPercentage == 50) {
                                        airTimeBonus = airTimeBonusSearch[i].airtimeTier25Value
                                    }
                                } else if (parseFloat(airTimeBonusSearch[i].airtimePMairtimesum) > parseFloat(airTimeBonusSearch[i].airtimeTier3)) {
                                    if (bonusPercentage == 100) {
                                        airTimeBonus = airTimeBonusSearch[i].airtimeTier3Value
                                    } else if (bonusPercentage == 50) {

                                        airTimeBonus = airTimeBonusSearch[i].airtimeTier35Value
                                    }
                                } else {
                                    airTimeBonus = 0
                                }
                            }
                        } else {
                            airTimeBonus = 0
                        }

                        var creditCardBonus = 0
                        if (checkForParameter(airTimeBonusSearch[i].airtimeCreditCard)) {
                            if (airTimeBonusSearch[i].airtimeCreditCard < 10 && airTimeBonusSearch[i].airtimeCreditCard > 0) {
                                creditCardBonus = Number(airTimeBonusSearch[i].airtimeMarchantTier1) * Number(airTimeBonusSearch[i].airtimeCreditCard)
                            } else if (airTimeBonusSearch[i].airtimeCreditCard >= 10) {
                                creditCardBonus = Number(airTimeBonusSearch[i].airtimeMarchantTier10) * Number(airTimeBonusSearch[i].airtimeCreditCard)
                            }
                        }

                        var newDoorBonus = 0;
                        if (checkForParameter(airTimeBonusSearch[i].airtimeTotalNewDoors)) {
                            if (airTimeBonusSearch[i].airtimeTotalNewDoors > 3) {
                                if (checkForParameter(airTimeBonusSearch[i].airtimeNewDoorAdd4)) {
                                    newDoorBonus = Number(airTimeBonusSearch[i].airtimeNewDoorAdd4) * Number(airTimeBonusSearch[i].airtimeTotalNewDoors)
                                }
                            } else if (airTimeBonusSearch[i].airtimeTotalNewDoors <= 3 && airTimeBonusSearch[i].airtimeTotalNewDoors > 0) {
                                if (checkForParameter(airTimeBonusSearch[i].airtimeNewDoorAdd1)) {
                                    newDoorBonus = Number(airTimeBonusSearch[i].airtimeNewDoorAdd1) * Number(airTimeBonusSearch[i].airtimeTotalNewDoors)
                                }
                            }
                        }

                        var totalBonus = 0
                        if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                            totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                        }

                        if (airTimeBonusSearch[i].airtimeMarketManager == "SolomonS") {
                            let temp = (airTimeBonusSearch[i].airtimeMarketManager).toUpperCase();
                            airTimeObj.salesRep = temp
                        } else {
                            airTimeObj.salesRep = airTimeBonusSearch[i].airtimeMarketManager
                        }

                        airTimeObj.SalesRepPartner = airTimeBonusSearch[i].airtimeSalesRepPartner
                        airTimeObj.SalesRepPartnerValue = airTimeBonusSearch[i].airtimeSalesRepPartnerValue
                        airTimeObj.MMProfile = airTimeBonusSearch[i].airtimeMMProfileTxt
                        airTimeObj.airTimePM = airTimeBonusSearch[i].airtimePMairtimesum
                        airTimeObj.bonusPercentage = bonusPercentage
                        airTimeObj.airTimeBonus = airTimeBonus
                        airTimeObj.creditCardBonus = creditCardBonus
                        airTimeObj.newDoorBonus = newDoorBonus
                        airTimeObj.totalAmount = Number(totalBonus).toFixed(2)
                        airTimeSetArray.push(airTimeObj)
                        lineNumber++
                        // return true;
                    }

                    //Adding total amount to the each reginal class
                    if (airTimeBonusSearch[i].airtimeClass == 168) {
                        TXRegularAirtimePM = Number(TXRegularAirtimePM) + Number(partnerSum)
                    } else if (airTimeBonusSearch[i].airtimeClass == 10) {
                        NCRegularAirtimePM = Number(NCRegularAirtimePM) + Number(partnerSum)
                    } else if (airTimeBonusSearch[i].airtimeClass == 6) {
                        NYRegularAirtimePM = Number(NYRegularAirtimePM) + Number(partnerSum)
                    } else if (airTimeBonusSearch[i].airtimeClass == 3) {
                        CHIRegularAirtimePM = Number(CHIRegularAirtimePM) + Number(partnerSum)
                    } else if (airTimeBonusSearch[i].airtimeClass == 1) {
                        VirginiaRegularAirtimePM = Number(VirginiaRegularAirtimePM) + Number(partnerSum)
                    } else if (airTimeBonusSearch[i].airtimeClass == "- None -") {
                        noneRegulartAirtimePM = Number(noneRegulartAirtimePM) + Number(partnerSum)
                    }
                }

                //setting the reginal maneger lines
                else if (airTimeBonusSearch[i].airtimeMMProfile == 5) {
                    if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                        var partnerSum = Number(airTimeBonusSearch[i].airtimePMairtimesum) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion)
                    } else if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum)) {
                        var partnerSum = airTimeBonusSearch[i].airtimePMairtimesum
                    } else {
                        var partnerSum = 0
                    }
                    CHIownAirTime = Number(CHIownAirTime) + Number(partnerSum)
                }
                else if (airTimeBonusSearch[i].airtimeMMProfile == 2) {
                    if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                        var partnerSum = Number(airTimeBonusSearch[i].airtimePMairtimesum) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion)
                    } else if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum)) {
                        var partnerSum = airTimeBonusSearch[i].airtimePMairtimesum
                    } else {
                        var partnerSum = 0
                    }
                    NationalAirTime = Number(NationalAirTime) + Number(partnerSum)
                }
                else if (airTimeBonusSearch[i].airtimeMMProfile == 6) {
                    if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                        var partnerSum = Number(airTimeBonusSearch[i].airtimePMairtimesum) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion)
                    } else if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum)) {
                        var partnerSum = airTimeBonusSearch[i].airtimePMairtimesum
                    } else {
                        var partnerSum = 0
                    }
                    NCownAirTime = Number(NCownAirTime) + Number(airTimeBonusSearch[i].airtimePMairtimesum) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion)
                }
                else if (airTimeBonusSearch[i].airtimeMMProfile == 1) {
                    if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                        var partnerSum = Number(airTimeBonusSearch[i].airtimePMairtimesum) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion)
                    } else if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum)) {
                        var partnerSum = airTimeBonusSearch[i].airtimePMairtimesum
                    } else {
                        var partnerSum = 0
                    }
                    NYownAirTime = Number(NYownAirTime) + Number(partnerSum)
                }
                else if (airTimeBonusSearch[i].airtimeMMProfile == 4) {
                    if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum) && checkForParameter(airTimeBonusSearch[i].qpayAirtimeCommsion)) {
                        var partnerSum = Number(airTimeBonusSearch[i].airtimePMairtimesum) + Number(airTimeBonusSearch[i].qpayAirtimeCommsion)
                    } else if (checkForParameter(airTimeBonusSearch[i].airtimePMairtimesum)) {
                        var partnerSum = airTimeBonusSearch[i].airtimePMairtimesum
                    } else {
                        var partnerSum = 0
                    }
                    TXownAirTime = Number(TXownAirTime) + Number(partnerSum)
                }

            }

            NationalTotal = Number(TXRegularAirtimePM) + Number(NCRegularAirtimePM) + Number(NYRegularAirtimePM) + Number(CHIRegularAirtimePM) + Number(VirginiaRegularAirtimePM) + Number(noneRegulartAirtimePM)
            NationalAirTime = Number(NationalAirTime) + Number(CHIownAirTime) + Number(NCownAirTime) + Number(NYownAirTime) + Number(TXownAirTime)

            var manegerSearch = tracfoneReginalManegerSearch()

            for (var j = 0; j < manegerSearch.length; j++) {
                if (checkForParameter(manegerSearch[j].mmProfile)) {

                    if (manegerSearch[j].mmProfile == 5) {
                        let timeArray = {}
                        var airTimeVal = 0
                        if (checkForParameter(CHIownAirTime) || checkForParameter(CHIRegularAirtimePM)) {
                            airTimeVal = Number(airTimeVal) + Number(CHIownAirTime) + Number(CHIRegularAirtimePM)
                        }

                        var bonusPercentage = 0
                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard && manegerSearch[j].airtimeCreditCardBonusTier)) {
                            if ((manegerSearch[j].airtimeTotalCreditCard) > manegerSearch[j].airtimeCreditCardBonusTier) {
                                bonusPercentage = 100
                            } else {
                                bonusPercentage = 50
                            }
                        }

                        //check the air time bonus is in which tier based on the previous month total.
                        var airTimeBonus = 0
                        if (checkForParameter(manegerSearch[j].airbonusTier1) && checkForParameter(manegerSearch[j].airbonusTier2) && checkForParameter(manegerSearch[j].airbonusTier3)) {
                            if (airTimeVal > manegerSearch[j].airbonusTier1 && airTimeVal < manegerSearch[j].airbonusTier2) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier1
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier15
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier2 && airTimeVal < manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier2
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier25
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier3
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier35
                                }
                            } else {
                                airTimeBonus = 0
                            }
                        } else {
                            airTimeBonus = 0
                        }

                        var creditCardBonus = 0

                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard)) {
                            if (manegerSearch[j].airtimeTotalCreditCard < 10 && manegerSearch[j].airtimeTotalCreditCard > 0) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir1) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            } else if (manegerSearch[j].airtimeTotalCreditCard >= 10) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir10) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            }
                        }

                        var newDoorBonus = 0;
                        if (checkForParameter(manegerSearch[j].airtimeTotalNewDoorsAdded)) {
                            if (manegerSearch[j].airtimeTotalNewDoorsAdded > 3) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd4)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd4) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            } else if (manegerSearch[j].airtimeTotalNewDoorsAdded <= 3 && manegerSearch[j].airtimeTotalNewDoorsAdded > 0) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd1)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd1) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            }
                        }

                        var totalBonus = 0
                        if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                            totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                        }

                        timeArray.salesRep = manegerSearch[j].SalesRepPartnerValue
                        timeArray.SalesRepPartnerValue = manegerSearch[j].salesRep
                        timeArray.MMProfile = manegerSearch[j].mmProfileTxt
                        timeArray.airTimePM = airTimeVal
                        timeArray.bonusPercentage = bonusPercentage
                        timeArray.airTimeBonus = airTimeBonus
                        timeArray.creditCardBonus = creditCardBonus
                        timeArray.newDoorBonus = newDoorBonus
                        timeArray.totalAmount = Number(totalBonus).toFixed(2)
                        airTimeSetArray.push(timeArray)
                    }

                    else if (manegerSearch[j].mmProfile == 2) {
                        let timeArray = {}
                        var airTimeVal = 0
                        if (checkForParameter(NationalAirTime) || checkForParameter(NationalTotal)) {
                            airTimeVal = Number(airTimeVal) + Number(NationalAirTime) + Number(NationalTotal)
                        }

                        var bonusPercentage = 0
                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard && manegerSearch[j].airtimeCreditCardBonusTier)) {
                            if ((manegerSearch[j].airtimeTotalCreditCard) > manegerSearch[j].airtimeCreditCardBonusTier) {
                                bonusPercentage = 100
                            } else {
                                bonusPercentage = 50
                            }
                        }

                        //check the air time bonus is in which tier based on the previous month total.
                        var airTimeBonus = 0
                        if (checkForParameter(manegerSearch[j].airbonusTier1) && checkForParameter(manegerSearch[j].airbonusTier2) && checkForParameter(manegerSearch[j].airbonusTier3)) {
                            if (airTimeVal > manegerSearch[j].airbonusTier1 && airTimeVal < manegerSearch[j].airbonusTier2) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier1
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier15
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier2 && airTimeVal < manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier2
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier25
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier3
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier35
                                }
                            } else {
                                airTimeBonus = 0
                            }
                        } else {
                            airTimeBonus = 0
                        }

                        var creditCardBonus = 0

                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard)) {
                            if (manegerSearch[j].airtimeTotalCreditCard < 10 && manegerSearch[j].airtimeTotalCreditCard > 0) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir1) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            } else if (manegerSearch[j].airtimeTotalCreditCard >= 10) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir10) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            }
                        }

                        var newDoorBonus = 0;
                        if (checkForParameter(manegerSearch[j].airtimeTotalNewDoorsAdded)) {
                            if (manegerSearch[j].airtimeTotalNewDoorsAdded > 3) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd4)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd4) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            } else if (manegerSearch[j].airtimeTotalNewDoorsAdded <= 3 && manegerSearch[j].airtimeTotalNewDoorsAdded > 0) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd1)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd1) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            }
                        }

                        var totalBonus = 0
                        if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                            totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                        }

                        timeArray.salesRep = manegerSearch[j].SalesRepPartnerValue
                        timeArray.SalesRepPartnerValue = manegerSearch[j].salesRep
                        timeArray.MMProfile = manegerSearch[j].mmProfileTxt
                        timeArray.airTimePM = airTimeVal
                        timeArray.bonusPercentage = bonusPercentage
                        timeArray.airTimeBonus = airTimeBonus
                        timeArray.creditCardBonus = creditCardBonus
                        timeArray.newDoorBonus = newDoorBonus
                        timeArray.totalAmount = Number(totalBonus).toFixed(2)
                        airTimeSetArray.push(timeArray)
                    }

                    else if (manegerSearch[j].mmProfile == 6) {
                        let timeArray = {}
                        var airTimeVal = 0
                        if (checkForParameter(NCownAirTime) || checkForParameter(NCRegularAirtimePM)) {
                            airTimeVal = Number(airTimeVal) + Number(NCownAirTime) + Number(NCRegularAirtimePM)
                        }

                        var bonusPercentage = 0
                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard && manegerSearch[j].airtimeCreditCardBonusTier)) {
                            if ((manegerSearch[j].airtimeTotalCreditCard) > manegerSearch[j].airtimeCreditCardBonusTier) {
                                bonusPercentage = 100
                            } else {
                                bonusPercentage = 50
                            }
                        }

                        //check the air time bonus is in which tier based on the previous month total.
                        var airTimeBonus = 0
                        if (checkForParameter(manegerSearch[j].airbonusTier1) && checkForParameter(manegerSearch[j].airbonusTier2) && checkForParameter(manegerSearch[j].airbonusTier3)) {
                            if (airTimeVal > manegerSearch[j].airbonusTier1 && airTimeVal < manegerSearch[j].airbonusTier2) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier1
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier15
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier2 && airTimeVal < manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier2
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier25
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier3
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier35
                                }
                            } else {
                                airTimeBonus = 0
                            }
                        } else {
                            airTimeBonus = 0
                        }

                        var creditCardBonus = 0

                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard)) {
                            if (manegerSearch[j].airtimeTotalCreditCard < 10 && manegerSearch[j].airtimeTotalCreditCard > 0) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir1) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            } else if (manegerSearch[j].airtimeTotalCreditCard >= 10) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir10) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            }
                        }

                        var newDoorBonus = 0;
                        if (checkForParameter(manegerSearch[j].airtimeTotalNewDoorsAdded)) {
                            if (manegerSearch[j].airtimeTotalNewDoorsAdded > 3) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd4)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd4) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            } else if (manegerSearch[j].airtimeTotalNewDoorsAdded <= 3 && manegerSearch[j].airtimeTotalNewDoorsAdded > 0) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd1)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd1) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            }
                        }

                        var totalBonus = 0
                        if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                            totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                        }

                        timeArray.salesRep = manegerSearch[j].SalesRepPartnerValue
                        timeArray.SalesRepPartnerValue = manegerSearch[j].salesRep
                        timeArray.MMProfile = manegerSearch[j].mmProfileTxt
                        timeArray.airTimePM = airTimeVal
                        timeArray.bonusPercentage = bonusPercentage
                        timeArray.airTimeBonus = airTimeBonus
                        timeArray.creditCardBonus = creditCardBonus
                        timeArray.newDoorBonus = newDoorBonus
                        timeArray.totalAmount = Number(totalBonus).toFixed(2)
                        airTimeSetArray.push(timeArray)
                    }

                    else if (manegerSearch[j].mmProfile == 1) {
                        let timeArray = {}
                        var airTimeVal = 0
                        if (checkForParameter(NYownAirTime) || checkForParameter(NYRegularAirtimePM)) {
                            airTimeVal = Number(airTimeVal) + Number(NYownAirTime) + Number(NYRegularAirtimePM)
                        }

                        var bonusPercentage = 0
                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard && manegerSearch[j].airtimeCreditCardBonusTier)) {
                            if ((manegerSearch[j].airtimeTotalCreditCard) > manegerSearch[j].airtimeCreditCardBonusTier) {
                                bonusPercentage = 100
                            } else {
                                bonusPercentage = 50
                            }
                        }

                        //check the air time bonus is in which tier based on the previous month total.
                        var airTimeBonus = 0
                        if (checkForParameter(manegerSearch[j].airbonusTier1) && checkForParameter(manegerSearch[j].airbonusTier2) && checkForParameter(manegerSearch[j].airbonusTier3)) {
                            if (airTimeVal > manegerSearch[j].airbonusTier1 && airTimeVal < manegerSearch[j].airbonusTier2) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier1
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier15
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier2 && airTimeVal < manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier2
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier25
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier3
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier35
                                }
                            } else {
                                airTimeBonus = 0
                            }
                        } else {
                            airTimeBonus = 0
                        }

                        var creditCardBonus = 0

                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard)) {
                            if (manegerSearch[j].airtimeTotalCreditCard < 10 && manegerSearch[j].airtimeTotalCreditCard > 0) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir1) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            } else if (manegerSearch[j].airtimeTotalCreditCard >= 10) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir10) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            }
                        }

                        var newDoorBonus = 0;
                        if (checkForParameter(manegerSearch[j].airtimeTotalNewDoorsAdded)) {
                            if (manegerSearch[j].airtimeTotalNewDoorsAdded > 3) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd4)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd4) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            } else if (manegerSearch[j].airtimeTotalNewDoorsAdded <= 3 && manegerSearch[j].airtimeTotalNewDoorsAdded > 0) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd1)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd1) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            }
                        }

                        var totalBonus = 0
                        if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                            totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                        }

                        timeArray.salesRep = manegerSearch[j].SalesRepPartnerValue
                        timeArray.SalesRepPartnerValue = manegerSearch[j].salesRep
                        timeArray.MMProfile = manegerSearch[j].mmProfileTxt
                        timeArray.airTimePM = airTimeVal
                        timeArray.bonusPercentage = bonusPercentage
                        timeArray.airTimeBonus = airTimeBonus
                        timeArray.creditCardBonus = creditCardBonus
                        timeArray.newDoorBonus = newDoorBonus
                        timeArray.totalAmount = Number(totalBonus).toFixed(2)
                        airTimeSetArray.push(timeArray)
                    }

                    else if (manegerSearch[j].mmProfile == 4) {
                        let timeArray = {}
                        var airTimeVal = 0
                        if (checkForParameter(TXownAirTime) || checkForParameter(TXRegularAirtimePM)) {
                            airTimeVal = Number(airTimeVal) + Number(TXownAirTime) + Number(TXRegularAirtimePM)
                        }

                        var bonusPercentage = 0
                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard && manegerSearch[j].airtimeCreditCardBonusTier)) {
                            if ((manegerSearch[j].airtimeTotalCreditCard) > manegerSearch[j].airtimeCreditCardBonusTier) {
                                bonusPercentage = 100
                            } else {
                                bonusPercentage = 50
                            }
                        }

                        //check the air time bonus is in which tier based on the previous month total.
                        var airTimeBonus = 0
                        if (checkForParameter(manegerSearch[j].airbonusTier1) && checkForParameter(manegerSearch[j].airbonusTier2) && checkForParameter(manegerSearch[j].airbonusTier3)) {
                            if (airTimeVal > manegerSearch[j].airbonusTier1 && airTimeVal < manegerSearch[j].airbonusTier2) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier1
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier15
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier2 && airTimeVal < manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier2
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier25
                                }
                            } else if (airTimeVal > manegerSearch[j].airbonusTier3) {
                                if (bonusPercentage == 100) {
                                    airTimeBonus = manegerSearch[j].airtimeTier3
                                } else if (bonusPercentage == 50) {
                                    airTimeBonus = manegerSearch[j].airtimeTier35
                                }
                            } else {
                                airTimeBonus = 0
                            }
                        } else {
                            airTimeBonus = 0
                        }

                        var creditCardBonus = 0

                        if (checkForParameter(manegerSearch[j].airtimeTotalCreditCard)) {
                            if (manegerSearch[j].airtimeTotalCreditCard < 10 && manegerSearch[j].airtimeTotalCreditCard > 0) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir1) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            } else if (manegerSearch[j].airtimeTotalCreditCard >= 10) {
                                creditCardBonus = Number(manegerSearch[j].airtimeMerchantSVTeir10) * Number(manegerSearch[j].airtimeTotalCreditCard)
                            }
                        }

                        var newDoorBonus = 0;
                        if (checkForParameter(manegerSearch[j].airtimeTotalNewDoorsAdded)) {
                            if (manegerSearch[j].airtimeTotalNewDoorsAdded > 3) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd4)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd4) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            } else if (manegerSearch[j].airtimeTotalNewDoorsAdded <= 3 && manegerSearch[j].airtimeTotalNewDoorsAdded > 0) {
                                if (checkForParameter(manegerSearch[j].airtimeNewDoorAdd1)) {
                                    newDoorBonus = Number(manegerSearch[j].airtimeNewDoorAdd1) * Number(manegerSearch[j].airtimeTotalNewDoorsAdded)
                                }
                            }
                        }

                        var totalBonus = 0
                        if (checkForParameter(creditCardBonus) || checkForParameter(airTimeBonus) || checkForParameter(newDoorBonus)) {
                            totalBonus = Number(creditCardBonus) + Number(airTimeBonus) + Number(newDoorBonus)
                        }

                        timeArray.salesRep = manegerSearch[j].SalesRepPartnerValue
                        timeArray.SalesRepPartnerValue = manegerSearch[j].salesRep
                        timeArray.MMProfile = manegerSearch[j].mmProfileTxt
                        timeArray.airTimePM = airTimeVal
                        timeArray.bonusPercentage = bonusPercentage
                        timeArray.airTimeBonus = airTimeBonus
                        timeArray.creditCardBonus = creditCardBonus
                        timeArray.newDoorBonus = newDoorBonus
                        timeArray.totalAmount = Number(totalBonus).toFixed(2)
                        airTimeSetArray.push(timeArray)
                    }
                }
            }
            return airTimeSetArray;
        }

        /**
         * Search for Miscellanious Commisions
         * @returns {miscArr []} miscellanious commision search results
         */
        function miscellaniousSearch(){
            var partnerSearchObj = search.create({
                type: "partner",
                filters:
                    [
                        ["custentity94","isnotempty",""]
                    ],
                columns:
                    [
                        search.createColumn({name: "altname", label: "Name"}),
                        search.createColumn({name: "companyname", label: "CompanyName"}),
                        search.createColumn({name: "custentity94", label: "MiscellaneousAdditions"}),
                        search.createColumn({
                            name: "custentity51",
                            sort: search.Sort.DESC,
                            label: "MM Commission Profile"
                        }),
                        search.createColumn({name: "internalid", label: "Sales Rep Partner ID"})
                    ]
            });
            var searchResultCount = partnerSearchObj.runPaged().count;
            var miscArr = [];
            var miscellaniousObj = {};
            partnerSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var salesRepId = result.getValue({
                    name: 'internalid'
                });
                var company = result.getValue({
                    name: "companyname"
                })
                var salesRep = result.getValue({
                    name: 'altname'
                })
                var commision = result.getValue({
                    name: 'custentity94'
                });

                miscellaniousObj = {
                    salesRepId: salesRepId,
                    company: company,
                    salesRep: salesRep,
                    miscellaniousCommision: Number(commision).toFixed(2)
                };
                miscArr.push(miscellaniousObj);
                return true;
            });
            return miscArr;
        }

        return {execute}
    });