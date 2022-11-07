/**
 * @NApiVersion 2.1
 * @NScriptType Portlet
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    function (record, search) {
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
                portlet.title = "NPS Survey Responses";

                portlet.addColumn({
                    id: 'custrecord_jj_survey_date',
                    type: 'date',
                    label: 'Survey Date',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_customer_name',
                    type: 'text',
                    label: 'Customer',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_feedback',
                    type: 'text',
                    label: 'Feedback',
                    align: 'LEFT'
                });
                portlet.addColumn({
                    id: 'custrecord_jj_response',
                    type: 'integer',
                    label: 'Response',
                    align: 'LEFT'
                });

                let npsSurveySearch = search.load({
                    type: 'customrecord_jj_nps_survey_response',
                    id: 7827
                });
                let count = npsSurveySearch.runPaged().count;
                npsSurveySearch.run().each(function(result) {
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
