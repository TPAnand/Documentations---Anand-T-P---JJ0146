/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search'],
    /**
     * @param{currentRecord} currentRecord
     * @param{record} record
     * @param{search} search
     */
    function(currentRecord, record, search) {

        /**
         * Function to check whether the field has an empty value or not.
         * @param {parameter} parameter - fieldValue
         * @returns {boolean} true - if the value is not empty
         * @returns {boolean} false - if the value is empty
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
                    title:"Error @ empty check Function: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        /**
         * Function to check the record type item.
         * @param {item} item - itemType from the selected item on the item line
         * @returns {result} result - record Type of the Item
         */
        function itemTypeFinder(item){
            try{
                if(checkForParameter(item)==true){
                    if(item=="Description"){
                        var result = "descriptionitem"
                        return result
                    }
                    if(item=="Discount"){
                        var result = "discountitem"
                        return result
                    }
                    if(item == "InvtPart"){
                        var result = "inventoryitem"
                        return result
                    }
                    if(item=="Group"){
                        var result = "itemgroup"
                        return result
                    }
                    if(item == "Kit"){
                        var result = "kititem"
                        return result
                    }
                    if(item == "Markup"){
                        var result = "markupitem"
                        return result
                    }
                    if(item == "NonInvtPart"){
                        var result = "noninventoryitem"
                        return result
                    }
                    if(item == "OthCharge"){
                        var result = "otherchargeitem"
                        return result
                    }
                    if(item == "Payment"){
                        var result = "paymentitem"
                        return result
                    }
                    if(item == "Service"){
                        var result = "serviceitem"
                        return result
                    }
                    if(item == "Subtotal"){
                        var result = "subtotalitem"
                        return result
                    }
                }
            }
            catch (e) {
                log.error({
                    title: "Error @ itemTypeFinder: ",
                    details: e.name+" : "+e.message
                })
            }
        }

        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            try{
                var rec = scriptContext.currentRecord

                var recSubsidary = rec.getValue({
                    fieldId: 'subsidiary'
                })

                var checkValue = rec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custcol_far_exclude_asset_type'
                })

                var relatedAsset = rec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custcol_far_trn_relatedasset'
                })

                if(checkForParameter(relatedAsset)==true){
                    alert("You can't Edit or Copy a line which has Already Fixed Asset")
                    return false
                }

                var assetType;

                //For Vendor Bill
                if(scriptContext.sublistId == 'expense'){

                    var exAcc = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account'
                    })
                    var exQty = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'custcol_expense_quantity'
                    })
                    if(checkForParameter(exAcc)==true){
                        var accRec = record.load({
                            type: 'account',
                            id: exAcc,
                            isDynamic: true
                        })
                        var accType = accRec.getValue({
                            fieldId: 'accttype'
                        })
                        if(accType != 'FixedAsset'){
                            alert("Selected Account is not a Fixed Asset Type Account. So You can't create Fixed Asset from this account")
                            // return true;
                        }
                    }

                    if(checkForParameter(exQty)==false){
                        alert("Please Provide Quantity for the Expense Item")
                        return false;
                    }
                    if((exQty==0) || (exQty<0)){
                        alert("Quantity should be minimum of 1")
                        return false;
                    }
                }

                if(scriptContext.sublistId == 'line'){
                    var debit = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'debit'
                    })
                    if(checkForParameter(debit)) {
                        if (Number(debit) < 0) {
                            alert("You can't provide an amount less than zero to a debit entry")
                            return false;
                        }
                    }
                    var credit = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'credit'
                    })
                    if(checkForParameter(credit)) {
                        if (Number(credit) < 0) {
                            alert("You can't provide an amount less than zero to a credit entry")
                            return false;
                        }
                    }
                }

                if(scriptContext.sublistId == 'item'){
                    var item = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'item'
                    })
                    var itemType = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'itemtype'
                    })
                    var itemRecordType = itemTypeFinder(itemType)
                    var itmLookup = search.lookupFields({
                        type: itemRecordType,
                        id: item,
                        columns: ['expenseaccount']
                    })
                    var itmAcc = (itmLookup && itmLookup.expenseaccount.length>0) ? itmLookup.expenseaccount[0].value : " "

                    var accLookup = search.lookupFields({
                        type: record.Type.ACCOUNT,
                        id: itmAcc,
                        columns: ['type']
                    })

                    var itmActype = (accLookup&& accLookup.type.length>0) ? accLookup.type[0].value : ""


                    assetType = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custcol_far_asset_types'
                    })
                    var itmQuantity = rec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    })
                    if(checkForParameter(itmQuantity)==false){
                        alert("Item should have a Quantity")
                        return false;
                    }
                    if((itmQuantity==0)||(itmQuantity<0)){
                        alert("Item should have minimum quantity of 1")
                        return false;
                    }
                    if(checkForParameter(itmActype)==true ) {
                        if (itmActype == "FixedAsset") {

                            if (checkForParameter(assetType) == true) {
                                var atRec = record.load({
                                    type: 'customrecord_ncfar_assettype',
                                    id: assetType,
                                    isDynamic: true
                                })
                                var atSubsidary = atRec.getValue({
                                    fieldId: 'custrecord_assettype_subsidiary'
                                })
                                var itmAssetAccount = atRec.getValue({
                                    fieldId: 'custrecord_assettypeassetacc'
                                })
                                // var itmAssetAccountLookup = search.lookupFields({
                                //     type: record.Type.ACCOUNT,
                                //     id: itmAssetAccount,
                                //     columns: ['type']
                                // })
                                // var itmAssetAccountType = (itmAssetAccountLookup && itmAssetAccountLookup.type.length > 0) ? itmAssetAccountLookup.type[0].value : " "

                                if ((checkForParameter(atSubsidary) == true) && (atSubsidary.length > 0)) {
                                    if (atSubsidary.includes(recSubsidary) == true) {
                                        return true;
                                    } else {
                                        alert("Subsidiary of Asset type and Bill/Journal should be the same")
                                        return false;
                                    }
                                }
                                if ((checkForParameter(atSubsidary) == true) && (atSubsidary.length <= 0)) {
                                    alert("Subsidiary of Asset type should be the same as Bill's")
                                    return false
                                }
                                if (checkForParameter(atSubsidary) == false) {
                                    alert("Selected Asset Type hasn't any Subsidiary")
                                    return false
                                }

                                // if((checkForParameter(itmAssetAccount)== true) && (checkForParameter(itemAccount)==true)){
                                if (checkForParameter(itmAcc) == true) {
                                    if (itmAssetAccount != itmAcc) {
                                        alert("Selected Asset type's Asset Account is different from Bill's Item line Account")
                                        return false;
                                    } else {
                                        return true;
                                    }
                                }
                            }
                            // if((checkForParameter(assetType) == false) && (Boolean(checkValue) == false)){
                            if (checkForParameter(assetType) == false) {
                                // alert(" Invalid Choose. If you want to exclude Fixed Asset please check the Exclude Fixed Asset Checkbox or please provide valid Asset type ")
                                alert("Invalid Choose. Please Select an Asset type. You can't create Fixed asset without Asset Type")
                                return false
                            }
                        }
                        else{
                            return true
                        }
                    }

                }

                if(scriptContext.sublistId == 'expense' || 'line'){

                    assetType = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custcol_far_asset_type'
                    })

                    var account = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'account'
                    })

                    if(checkForParameter(account)==true){
                        //Account Record
                        var accountRec = record.load({
                            type: record.Type.ACCOUNT,
                            id: account,
                            isDynamic: true
                        })

                        var accType = accountRec.getValue({
                            fieldId: 'accttype'
                        })

                        if(accType == 'FixedAsset'){
                            // if((checkForParameter(assetType) == false) && (Boolean(checkValue) == false)){

                            if(checkForParameter(assetType)== true){
                                var atRec = record.load({
                                    type: 'customrecord_ncfar_assettype',
                                    id: assetType,
                                    isDynamic: true
                                })

                                var atAssetAccount = atRec.getValue({
                                    fieldId: 'custrecord_assettypeassetacc'
                                })
                                if((checkForParameter(account) == true) && (checkForParameter(atAssetAccount)==true)){
                                    if(account != atAssetAccount){
                                        alert("Selected Asset type's Asset Account is different from Bill/journal's Account")
                                        return false;
                                    }
                                }

                                var atSubsidary = atRec.getValue({
                                    fieldId: 'custrecord_assettype_subsidiary'
                                })

                                if(checkForParameter(atSubsidary)==true) {
                                    if(atSubsidary.length<=0){
                                        alert("Asset Type has no Subsidiary value. Asset type should have a subsidiary value and it should be the same as Bill/journal ")
                                        return false
                                    }
                                    if(atSubsidary.length>0) {
                                        if (atSubsidary.includes(recSubsidary) == false) {
                                            alert("Subsidiary of Asset type and Bill/Journal should be the same")
                                            return false;
                                        }
                                    }
                                }
                                if(checkForParameter(atSubsidary)==false) {
                                    alert("Selected Asset Type hasn't any Subsidiary")
                                    return false
                                }
                            }

                            else{
                                // alert(" Invalid Choose. If you want to exclude Fixed Asset please check the Exclude Fixed Asset Checkbox or please provide valid Asset type ")
                                alert("Invalid Choose. Please Select an Asset type. You can't create Fixed asset without Asset Type")
                                return false
                            }
                        }
                        else{
                            return true
                        }
                    }

                    var amount = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'amount'
                    })
                    if(checkForParameter(amount)==true) {
                        if (Number(amount) < 0) {
                            alert("You can't provide an amount less than zero")
                            return false;
                        }
                    }
                }

                var employee = rec.getCurrentSublistValue({
                    sublistId: scriptContext.sublistId,
                    fieldId: 'custcol_far_employee'
                })
                if(checkForParameter(employee)==true){
                    var empRec = record.load({
                        type: record.Type.EMPLOYEE,
                        id: employee,
                        isDynamic: true
                    })
                    var empDep = empRec.getValue({
                        fieldId: 'department'
                    })
                    var empClass = empRec.getValue({
                        fieldId: 'class'
                    })
                    if(checkForParameter(empDep)==true) {
                        var depRec = record.load({
                            type: record.Type.DEPARTMENT,
                            id: empDep,
                            isDynamic: true
                        })
                        var depInactive = depRec.getValue({
                            fieldId: 'isinactive'
                        })
                        if (depInactive == true) {
                            alert("Selected Employee has an inactive Department. Please choose another Employee")
                            return false;
                        }
                        else{
                            return true
                        }
                    }
                    if(checkForParameter(empDep)==false){
                        return true;
                    }
                    if(checkForParameter(empClass)==true){
                        var classRec = record.load({
                            type: record.Type.CLASSIFICATION,
                            id: empClass,
                            isDynamic: true
                        })
                        var classInactive = classRec.getValue({
                            fieldId: 'isinactive'
                        })
                        if (classInactive == true) {
                            alert("Selected Employee has an inactive Class. Please choose another Employee")
                            return false;
                        }
                        else{
                            return true
                        }
                    }
                    if(checkForParameter(empClass)==false){
                        return true;
                    }
                }

            }
            catch (e) {
                log.error({
                    title:"Error @ validate Line: ",
                    details: e.name+' : '+e.message
                })
            }
        }

        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {

            try{
                return true
            }
            catch (e) {
                log.error({
                    title:"Error @ Save : ",
                    details: e.name+' : '+e.message
                })
            }

        }

        return {
            validateLine: validateLine,
            saveRecord: saveRecord
        };
    });