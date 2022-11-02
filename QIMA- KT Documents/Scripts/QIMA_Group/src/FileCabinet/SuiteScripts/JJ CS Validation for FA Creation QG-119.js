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
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        // function postSourcing(scriptContext) {
        //     try{
        //         var rec = scriptContext.currentRecord
        //         if(scriptContext.sublistId == 'expense' || scriptContext.sublistId == 'item' || scriptContext.sublistId == 'line'){
        //             rec.setCurrentSublistValue({
        //                 sublistId: scriptContext.sublistId,
        //                 fieldId: 'custcol_far_trn_relatedasset',
        //                 value: null
        //             })
        //             return true
        //         }
        //     }
        //     catch (e) {
        //         console.log("Error @ postSourcing : ",e.name+" : "+e.message)
        //     }
        // }

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

                var assetType;

                //For Vendor Bill
                if(scriptContext.sublistId == 'expense'){

                    var exAcc = rec.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account'
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
                }

                if(scriptContext.sublistId == 'expense' || 'item'){
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

                if(scriptContext.sublistId == 'expense' || 'line'){
                    assetType = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custcol_far_asset_type'
                    })

                    if(checkForParameter(assetType)== true){
                        var atRec = record.load({
                            type: 'customrecord_ncfar_assettype',
                            id: assetType,
                            isDynamic: true
                        })
                        var atSubsidary = atRec.getValue({
                            fieldId: 'custrecord_assettype_subsidiary'
                        })

                        if(atSubsidary.includes(recSubsidary)==true){
                            return true;
                        }
                        else{
                            alert("Subsidiary of Asset type and Bill/Journal should be the same")
                            return false;
                        }
                    }

                    var jAcc = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'account'
                    })
                    if(checkForParameter(jAcc)==true){
                        //Account Record
                        var accountRec = record.load({
                            type: record.Type.ACCOUNT,
                            id: jAcc,
                            isDynamic: true
                        })

                        var accType = accountRec.getValue({
                            fieldId: 'accttype'
                        })

                        if(accType == 'FixedAsset'){
                            // if((checkForParameter(assetType) == false) && (Boolean(checkValue) == false)){
                            if(checkForParameter(assetType) == false){
                                // alert(" Invalid Choose. If you want to exclude Fixed Asset please check the Exclude Fixed Asset Checkbox or please provide valid Asset type ")
                                alert("Invalid Choose. Please Select an Asset type. You can't create Fixed asset without Asset Type")
                                return false
                            }
                            else {
                                return true
                            }
                        }
                        else{
                            return true
                        }
                    }
                }


                if(scriptContext.sublistId == 'item'){
                    assetType = rec.getCurrentSublistValue({
                        sublistId: scriptContext.sublistId,
                        fieldId: 'custcol_far_asset_types'
                    })
                    if(checkForParameter(assetType)== true){
                        var atRec = record.load({
                            type: 'customrecord_ncfar_assettype',
                            id: assetType,
                            isDynamic: true
                        })
                        var atSubsidary = atRec.getValue({
                            fieldId: 'custrecord_assettype_subsidiary'
                        })

                        if(atSubsidary.includes(recSubsidary)==true){
                            return true;
                        }
                        else{
                            alert("Subsidiary of Asset type and Bill should be the same")
                            return false;
                        }
                    }
                    // if((checkForParameter(assetType) == false) && (Boolean(checkValue) == false)){
                    if(checkForParameter(assetType) == false){
                        // alert(" Invalid Choose. If you want to exclude Fixed Asset please check the Exclude Fixed Asset Checkbox or please provide valid Asset type ")
                        alert("Invalid Choose. Please Select an Asset type. You can't create Fixed asset without Asset Type")
                        return false
                    }
                    else {
                        return true
                    }
                }

            }
            catch (e) {
                log.error({
                    title:"Error @ valiadte Line: ",
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
            // postSourcing: postSourcing,
            validateLine: validateLine,
            saveRecord: saveRecord
        };

    });
