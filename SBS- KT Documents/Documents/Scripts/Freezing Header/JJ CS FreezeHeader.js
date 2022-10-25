/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([],

function() {


    function activateFreeze(context) {
        console.log("TESTINg")
        freezeHead();
    }

    return {
        lineInit: activateFreeze,
        pageInit: activateFreeze
    }
    
});
