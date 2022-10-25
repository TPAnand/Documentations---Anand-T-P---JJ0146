/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */
define(['N/error', 'N/search'],
    /**
     * @param{error} error
     * @param{search} search
     */
    function (error, search) {
        /**
         * Defines the Portlet script trigger point.
         * @param {Object} params - The params parameter is a JavaScript object. It is automatically passed to the script entry
         *     point by NetSuite. The values for params are read-only.
         * @param {Portlet} params.portlet - The portlet object used for rendering
         * @param {string} params.column - Column index forthe portlet on the dashboard; left column (1), center column (2) or
         *     right column (3)
         * @param {string} params.entity - (For custom portlets only) references the customer ID for the selected customer
         * @since 2015.2
         */
        const render = (params) => {
            try{
                let portlet = params.portlet;
                portlet.title = "Commission report";

                portlet.addColumn({
                    id: 'custrecord_jj_salesrep_partner',
                    type: 'text',
                    label: 'Sales Rep',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_month',
                    type: 'text',
                    label: 'Month',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_tracfone',
                    type: 'float',
                    label: 'Tracfone',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_sim_sales',
                    type: 'float',
                    label: 'Sim Sales',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_hand_set_commision',
                    type: 'float',
                    label: 'Handsets',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_warehouse_commission',
                    type: 'float',
                    label: 'Warehouse',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_marketplace_sim_commission',
                    type: 'float',
                    label: 'Market Place SIM',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_air_time_bonus',
                    type: 'float',
                    label: 'Air Time',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_activation_bonus',
                    type: 'float',
                    label: 'Activation',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_miscellaneous_additions',
                    type: 'float',
                    label: 'Miscellaneous',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_total_commission',
                    type: 'float',
                    label: 'Total',
                    align: 'LEFT'
                });
                let commissionReportSearch = search.load({
                    type: 'customrecord_jj_commision_report',
                    id: 1227
                });
                let count = commissionReportSearch.runPaged().count;
                commissionReportSearch.run().each(function(result) {
                    portlet.addRow(result.getAllValues());
                    return true;
                });
            }
            catch (e) {
                log.error("Error: ",e.name+e.message)
            }
        }
        return {render}
    });
