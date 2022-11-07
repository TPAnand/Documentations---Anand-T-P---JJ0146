/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/currentRecord', 'N/email', 'N/error', 'N/format', 'N/https', 'N/record', 'N/redirect', 'N/runtime', 'N/search', 'N/file', 'N/ui/serverWidget', 'N/url','N/render'],
    /**
     * @param{currentRecord} currentRecord
     * @param{email} email
     * @param{error} error
     * @param{format} format
     * @param{https} https
     * @param{record} record
     * @param{redirect} redirect
     * @param{runtime} runtime
     * @param{search} search
     * @param{file} file
     * @param{serverWidget} serverWidget
     * @param{url} url
     * @param{render} render
     */
    (currentRecord, email, error, format, https, record, redirect, runtime, search, file, serverWidget, url, render) => {

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
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                var mode = scriptContext.request.parameters.mode;
                log.debug("mode: ", mode)
                var currentRec = currentRecord.get();
                log.debug("currentRec: ", currentRec)
                var npsRecIdParam = scriptContext.request.parameters.recId;
                log.debug("idParam: ", npsRecIdParam)
                var npsResponseParam = scriptContext.request.parameters.response
                log.debug("responseParam: ", npsResponseParam)

                var curDate = new Date()
                log.debug("curDate: ", curDate)

                if (checkForParameter(mode)) {
                    if(mode == 2) {

                        if(checkForParameter(npsRecIdParam)) {

                            var thanksForm = serverWidget.createForm({
                                title: ' '
                            })
                            var fileObj = file.load({
                                id: 35423466
                            })
                            log.debug("fileObj: ", fileObj)

                            var htmlContents = fileObj.getContents();
                            log.debug("htmlContents: ", htmlContents)
                            thanksForm.addField({
                                id: 'custpage_thanks_msg',
                                type: serverWidget.FieldType.INLINEHTML,
                                label: 'Thanks'
                            }).defaultValue = htmlContents
                            scriptContext.response.writePage(thanksForm);
                        }
                    }
                    if(mode == 3) {
                        var errorForm = serverWidget.createForm({
                            title: ' '
                        })
                        var fileObj = file.load({
                            id: 35426993
                        })
                        log.debug("fileObj: ", fileObj)

                        var htmlContents = fileObj.getContents();
                        log.debug("htmlContents: ", htmlContents)
                        errorForm.addField({
                            id: 'custpage_error_msg',
                            type: serverWidget.FieldType.INLINEHTML,
                            label: ' '
                        }).defaultValue = htmlContents
                        scriptContext.response.writePage(errorForm);
                    }
                }
                else {
                    if (scriptContext.request.method === 'GET') {

                        var form = serverWidget.createForm({
                            title: ' '
                        })

                        if(checkForParameter(npsRecIdParam)) {
                            var npsRecord = record.load({
                                id: npsRecIdParam,
                                type: 'customrecord_jj_nps_survey_response',
                                isDynamic: true
                            })

                            var fileObj = file.load({
                                id: 35422462
                            })
                            log.debug("fileObj: ", fileObj)

                            var htmlContents = fileObj.getContents();
                            log.debug("htmlContents: ", htmlContents)

                            var htmlFeedback = form.addField({
                                type: serverWidget.FieldType.INLINEHTML,
                                id: 'custpage_feedback',
                                label: 'FeedBack'
                            }).updateLayoutType({
                                layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
                            }).updateDisplaySize({width: '100%', height: '25%'})
                            htmlFeedback.defaultValue = htmlContents


                            if (checkForParameter(npsResponseParam)) {

                                npsRecord.setValue({
                                    fieldId: 'custrecord_jj_response',
                                    value: npsResponseParam
                                })
                                npsRecord.setValue({
                                    fieldId: 'custrecord_jj_nps_mail_status',
                                    value: 3
                                })
                                npsRecord.setValue({
                                    fieldId: 'custrecord_jj_last_response_date',
                                    value: checkForParameter(curDate) ? curDate : ''
                                })
                            }
                            var npsUpdated = npsRecord.save()
                            log.debug("npsUpdated: ", npsUpdated)

                            var idField = form.addField({
                                id: 'custpage_nps_rec_id',
                                type: serverWidget.FieldType.TEXT,
                                label: 'NPS Record ID'
                            }).updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            })
                            idField.defaultValue = npsRecIdParam

                            var responseField = form.addField({
                                id: 'custpage_nps_response',
                                type: serverWidget.FieldType.INTEGER,
                                label: 'Response'
                            }).updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.HIDDEN
                            })
                            responseField.defaultValue = npsResponseParam
                        }


                        // form.addField({
                        //     id: 'custpage_feedback_area',
                        //     type: serverWidget.FieldType.TEXTAREA,
                        //     label: 'Are there any comments you would like to share relating to your feedback?'
                        // }).updateDisplaySize({
                        //     width: '100%',
                        //     height: '15%'
                        // }).isSingleColumn = true



                        // form.addSubmitButton({
                        //     label: 'Comment'
                        // })

                        scriptContext.response.writePage(form);
                    } else {
                        log.debug("POST", scriptContext.request.parameters);
                        // const text = scriptContext.request.getValue
                        var npsFeedback = scriptContext.request.parameters.commentText
                        log.debug("POST  FeedBack: ", npsFeedback)
                        var npsRec = scriptContext.request.parameters.custpage_nps_rec_id
                        log.debug("POST rec: ", npsRec)
                        if (checkForParameter(npsRec)) {
                            var npsRecord = record.submitFields({
                                id: npsRec,
                                type: 'customrecord_jj_nps_survey_response',
                                values: {
                                    'custrecord_jj_feedback': checkForParameter(npsFeedback) ? npsFeedback : ''
                                }
                            })
                            log.debug("npsRecord POST: ", npsRecord)
                        }

                        let paramObj = {
                            mode: '2',
                            recId: npsRec
                        }
                        log.debug("paramObj: ", paramObj)
                        if (checkForParameter(paramObj)) {
                            var finalUrl = url.resolveScript({
                                scriptId: 'customscript_jj_sl_nps_survey_otga1515',
                                deploymentId: 'customdeploy_jj_sl_nps_survey_otga1515',
                                params: paramObj,
                                returnExternalUrl: true
                            })
                            log.debug("finalUrl: ",finalUrl)
                            if(checkForParameter(finalUrl)){
                                redirect.redirect({
                                    url: finalUrl,
                                })
                            }
                        }
                    }
                }
            }
            catch (e) {
                log.debug("Error @ onRequest: ",e.name+" : "+e.message);
                let paramObj = {
                    mode: '3'
                }
                log.debug("paramObj: ", paramObj)
                if (checkForParameter(paramObj)) {
                    var finalUrl = url.resolveScript({
                        scriptId: 'customscript_jj_sl_nps_survey_otga1515',
                        deploymentId: 'customdeploy_jj_sl_nps_survey_otga1515',
                        params: paramObj,
                        returnExternalUrl: true
                    })
                    log.debug("finalUrl: ",finalUrl)
                    if(checkForParameter(finalUrl)){
                        redirect.redirect({
                            url: finalUrl,
                        })
                    }
                }

            }
        }

        return {onRequest}

    });
