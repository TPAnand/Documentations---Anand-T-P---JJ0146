/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/https', 'N/record', 'N/redirect', 'N/ui/serverWidget','N/file'],
    /**
 * @param{https} https
 * @param{record} record
 * @param{redirect} redirect
 * @param{serverWidget} serverWidget
     * @param{file} file
 */
    (https, record, redirect, serverWidget,file) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var form = serverWidget.createForm({
                title: ' '
            })
            var fileObj = file.load({
                id: 35423466
            })
            log.debug("fileObj: ",fileObj)

            var htmlContents = fileObj.getContents();
            log.debug("htmlContents: ",htmlContents)
            form.addField({
                id: 'custpage_thanks_msg',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Thanks'
            }).defaultValue=htmlContents
            scriptContext.response.writePage(form);
        }

        return {onRequest}

    });
