/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget'],
    /**
     * @param{record} record
     * @param{serverWidget} serverWidget
     */
    (record, serverWidget) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            try{
                log.debug("scriptContext.type: ",scriptContext.type)
                if(scriptContext.type == 'edit') {
                    var form = scriptContext.form
                    form.clientScriptFileId = 78793
                    form.addButton({
                        id: 'custpage_update_masterdata_btn',
                        label: 'Update Master data',
                        functionName: 'updateMasterdata'
                    })
                }
            }
            catch (e) {
                log.debug("Error @ beforeLoad: ",e.name+" : "+e.message)
            }
        }

        return {beforeLoad}

    });
