/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
/****************************************************************************
 * Aqualis Braemar
 * AQ-605 Real Time Entity Wip Report
 * **************************************************************************
 * Date: 29/06/2020
 *
 * Author: Febin Antony, Jobin & Jismi IT Services LLP
 * Script Description : Bulk download for admin(Unbilled item, time, expenses, bill credit)
 * Date created : 29 June 2020
 *
 * REVISION HISTORY
 *
 * Revision 1.0 29/06/2020 md: Create
 *
 ****************************************************************************/
 define(['N/file', 'N/search', 'N/record', 'N/format', 'N/runtime', 'N/task', "N/error"],

 function (file, search, record, format, runtime, task, error){

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
         function execute(scriptContext) {
            try {
                log.debug("Working");
            }
            catch (e) {
                log.debug("Error");
            }
        }

        return {execute}

    });
