/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/ui/serverWidget'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{serverWidget} serverWidget
     */
    (record, search, serverWidget) => {

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
            try {
                scriptContext.form.clientScriptFileId = 17366804;
                var htmlString = '<script>' +
                    '        function freezeHead (){(function ($, undefined) {' +
                    '           $(function () {' +
                    '              const windowHeight = $(window).height();' +
                    '              $(\'.uir-machine-table-container\')' +
                    '                 .filter((index, elem) => $(elem).height() > windowHeight)' +
                    '                 .css(\'height\', \'70vh\')' +
                    '                 .bind(\'scroll\', (event) => {' +
                    '                    const headerElem = $(event.target).find(\'.uir-machine-headerrow\');' +
                    '                    headerElem.css(\'transform\', `translate(0, ${event.target.scrollTop}px)`);' +
                    '                 })' +
                    '                 .bind(\'scroll\', (event) => {' +
                    '                    const headerElem = $(event.target).find(\'.uir-list-headerrow\');' +
                    '                    headerElem.css(\'transform\', `translate(0, ${event.target.scrollTop}px)`);' +
                    '                 })' +
                    '         });' +
                    '        })(window.jQuery);}' +
                    '   freezeHead()\n         ' +
                    '           </script>';
                scriptContext.form.addField({
                    type: 'inlinehtml',
                    id: 'custpage_stickyheaders_script',
                    label: 'Hidden'
                }).defaultValue = htmlString;
            } catch (err) {
                log.debug("error@beforeLoad", err);
            }
        }
        return {beforeLoad: beforeLoad}

    });

