/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/**
 * HGPL-10 Create suitelet for filtering customers
 *
 * Revision History
 *
 * 1.0      JJ0016      Created the suitelet  15 Nov 2021       SB
 */
define(['N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url'],
    /**
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{serverWidget} serverWidget
     * @param{url} url
     */
    (record, runtime, search, serverWidget, url) => {
        var CLIENT_SCRIPT_FILE_ID = 68991; // Sandbox file ID
        // var CLIENT_SCRIPT_FILE_ID = 68791; // Production File ID


        function checkForParameter(parameter) {
            if (parameter != "" && parameter != null && parameter != undefined && parameter != "null" && parameter != "undefined" && parameter != " ") {
                return false;
            }
            else {
                return true;
            }
        }

        /***
         * function to get the customer details
         *
         */
        const getCustomerDataArray=(salesRep,savedSearch, category, customerGrade,trainingGrade) => {
            try {

                var filterArray = [], customerDataArray = [];

                filterArray.push(["isinactive","is",'F']);
                filterArray.push("AND");
                filterArray.push(["custentitycustentity_ns_lat","isnotempty",""]);
                filterArray.push("AND");
                filterArray.push(["custentitycustentity_ns_long","isnotempty",""]);

                if (salesRep && salesRep != 0) {
                    filterArray.push("AND");
                    filterArray.push(["salesrep", "anyof",salesRep ]);
                }

                if (category && category!=0) {

                    filterArray.push("AND");

                    filterArray.push(["category", "anyof", category]);
                }

                if(customerGrade && customerGrade!=0){
                    filterArray.push("AND");
                    filterArray.push(["custrecord155.custrecord_jj_customer_grades_planogram", "anyof",customerGrade ]);// SB
                    // filterArray.push(["custrecord_jj_cust_plngrm_parent.custrecord_jj_customer_grades_planogram", "anyof",customerGrade ]);// PRODUCTION
                }

                if(trainingGrade && trainingGrade!=0){
                    filterArray.push("AND");
                    filterArray.push(["custrecord155.custrecord_jj_customer_grades","anyof",trainingGrade]);//SB
                    //filterArray.push(["custrecord_jj_cust_plngrm_parent.custrecord_jj_customer_grades","anyof",trainingGrade]);//PRODUCTION
                }

                if((savedSearch && savedSearch != 0) && ((salesRep && salesRep != 0) || (category && category!=0) || (customerGrade && customerGrade!=0) || (trainingGrade && trainingGrade!=0))){
                    var filterArray = []
                    log.debug("Inside Saved search filter")
                    log.debug("SEARCH ID: ",savedSearch)
                    var customerSearchObj = search.load({
                        id: savedSearch
                    });
                    log.debug("searchObj: ",customerSearchObj)
                    var searchfilterArray = customerSearchObj.filters
                    log.debug("searchfilterArray: ",searchfilterArray)
                    log.debug("searchfilterArray.length: ",searchfilterArray.length)
                    // if(checkForParameter(searchfilterArray)&&searchfilterArray.length>0){
                    //     for(var a=0;a<searchfilterArray.length;a++){
                    //         log.debug("I: ",searchfilterArray[a])
                    //         log.debug("Stringified: ",JSON.stringify(searchfilterArray[a]).split("values:"))
                    //
                    //         if(searchfilterArray[a].name == 'formulatext'){
                    //             searchfilterArray.splice(a,1)
                    //         }
                    //     }
                    // }
                    log.debug("Search Filters After Trimming: ",filterArray)
                    var filter1,filter2,filter3,filter4;
                    var filter5 = search.createFilter({
                        name: 'custentitycustentity_ns_long',operator: 'isnotempty',values: ""
                    })
                    searchfilterArray.push(filter5)
                    var filter6 = search.createFilter({
                        name: 'custentitycustentity_ns_lat',operator: 'isnotempty',values: ""
                    })
                    searchfilterArray.push(filter6)
                    if(salesRep && salesRep != 0){
                        filter1 = search.createFilter({
                            name: 'salesrep',operator: 'anyof',values: salesRep
                        })
                        searchfilterArray.push(filter1)
                    }
                    if(category&& category!=0){
                        filter2 = search.createFilter({
                            name: 'category',operator: 'anyof',values: category
                        })
                        searchfilterArray.push(filter2)
                    }
                    if(trainingGrade && trainingGrade!=0){
                        filter3 = search.createFilter({
                            name: 'custrecord_jj_customer_grades',join:'CUSTRECORD_JJ_CUST_PLNGRM_PARENT',operator: 'anyof',values: trainingGrade
                        })
                        searchfilterArray.push(filter3)
                    }
                    if(customerGrade && customerGrade!=0){
                        filter4 = search.createFilter({
                            name: 'custrecord_jj_customer_grades_planogram',join:'CUSTRECORD_JJ_CUST_PLNGRM_PARENT',operator: 'anyof',values: customerGrade
                        })
                        searchfilterArray.push(filter4)
                    }
                    log.debug("UPDATED: ",filterArray)
                    log.debug("UPDATED FILTERS; ",customerSearchObj.filters)

                    var entityID = search.createColumn({
                        name: 'entityid'
                    });

                    var internalId = search.createColumn({name: "internalid", label: "Internal ID"});
                    var altName = search.createColumn({name: "altname", label: "Name"})
                    var companyname = search.createColumn({name: "companyname", label: "Company Name"})
                    var lat = search.createColumn({name: "custentitycustentity_ns_lat", label: "Latitude"});

                    var long = search.createColumn({name: "custentitycustentity_ns_long", label: "Longitude"});
                    var grade = search.createColumn({name: "custrecord_jj_customer_grades", join: "CUSTRECORD155", label: "Grade"});//SB
                    // var grade = search.createColumn({name: "custrecord_jj_customer_grades", join: "CUSTRECORD_JJ_CUST_PLNGRM_PARENT", label: "Grade"});//Production
                    var trGrade = search.createColumn({ name: 'custrecord_jj_customer_grades_planogram',join:'CUSTRECORD155', label: "Training Grade"})//SB
                    // var trGrade = search.createColumn({ name: 'custrecord_jj_customer_grades_planogram',join:'CUSTRECORD_JJ_CUST_PLNGRM_PARENT', label: "Training Grade"})//Production
                    customerSearchObj.columns.push(internalId);
                    customerSearchObj.columns.push(altName);
                    customerSearchObj.columns.push(companyname);
                    customerSearchObj.columns.push(entityID);
                    customerSearchObj.columns.push(lat);
                    customerSearchObj.columns.push(long);
                    customerSearchObj.columns.push(grade);
                    customerSearchObj.columns.push(trGrade)
                    log.debug("customerSearchObj.columns",customerSearchObj.columns)
                }

                //if saved search then load the search
                else if (savedSearch && savedSearch != 0) {
                    var customerSearchObj = search.load({
                        id: savedSearch
                    });
                    log.debug("customerSearchObj: ",customerSearchObj)
                    var filter1 = search.createFilter({
                        name: 'custentitycustentity_ns_long',operator: 'isnotempty',values: ""
                    })
                    customerSearchObj.filters.push(filter1)
                    var filter2 = search.createFilter({
                        name: 'custentitycustentity_ns_lat',operator: 'isnotempty',values: ""
                    })
                    customerSearchObj.filters.push(filter2)

                    var entityID = search.createColumn({
                        name: 'entityid'
                    });

                    var internalId = search.createColumn({name: "internalid", label: "Internal ID"});
                    var altName = search.createColumn({name: "altname", label: "Name"})
                    var companyname = search.createColumn({name: "companyname", label: "Company Name"})
                    var lat = search.createColumn({name: "custentitycustentity_ns_lat", label: "Latitude"});

                    var long = search.createColumn({name: "custentitycustentity_ns_long", label: "Longitude"});
                    var grade = search.createColumn({name: "custrecord_jj_customer_grades", join: "CUSTRECORD155", label: "Grade"});//SB
                    var trGrade = search.createColumn({ name: 'custrecord_jj_customer_grades_planogram',join:'CUSTRECORD155', label: "Training Grade"})//SB
                    // var grade = search.createColumn({name: "custrecord_jj_customer_grades", join: "CUSTRECORD_JJ_CUST_PLNGRM_PARENT", label: "Grade"});//Production
                    // var trGrade = search.createColumn({ name: 'custrecord_jj_customer_grades_planogram',join:'CUSTRECORD_JJ_CUST_PLNGRM_PARENT', label: "Training Grade"})//Production
                    customerSearchObj.columns.push(internalId);
                    customerSearchObj.columns.push(altName);
                    customerSearchObj.columns.push(companyname);
                    customerSearchObj.columns.push(entityID);
                    customerSearchObj.columns.push(lat);
                    customerSearchObj.columns.push(long);
                    customerSearchObj.columns.push(grade);
                    customerSearchObj.columns.push(trGrade);
                    log.debug("customerSearchObj.columns",customerSearchObj.columns)
                } else {
                    log.debug("filterArray: ",filterArray)
                    //search
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters:
                        filterArray,
                        columns:
                            [
                                search.createColumn({name: "internalid", label: "Internal ID"}),
                                search.createColumn({name: "altname", label: "Name"}),
                                search.createColumn({name: "custentitycustentity_ns_lat", label: "Latitude"}),
                                search.createColumn({name: "custentitycustentity_ns_long", label: "Longitude"}),
                                search.createColumn({name: "companyname", label: "Company Name"}),
                                search.createColumn({name: "custrecord_jj_customer_grades_planogram", join: "CUSTRECORD155", label: "HOG Brick"}),//SB
                                search.createColumn({name: "custrecord_jj_customer_grades", join: "CUSTRECORD155", label: "Training Grading"})//SB
                                // search.createColumn({name: "custrecord_jj_customer_grades", join: "CUSTRECORD_JJ_CUST_PLNGRM_PARENT", label: "Training Grade"}),// PRODUCTION
                                // search.createColumn({name: "custrecord_jj_customer_grades_planogram", join: "CUSTRECORD_JJ_CUST_PLNGRM_PARENT", label: "Customer Grades "})// PRODUCTION
                            ]
                    });
                }
                log.debug("customerSearchOBJ: ",customerSearchObj)
                log.debug("FILTERS ARRAY: ",customerSearchObj.filters)
                log.debug("Name: ",customerSearchObj.filters[2].name)
                // if(checkForParameter(customerSearchObj.filters)==true && customerSearchObj.filters.length>0){
                //     for(var i=0;i<customerSearchObj.filters.length;i++){
                //
                //     }
                // }
                var searchResultCount = customerSearchObj.runPaged().count;
                log.debug("customerSearchObj result count", searchResultCount);

                customerSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    var customerObj = {}, customerArray = [];
                    customerObj.internalId = result.getValue({
                        name: "internalid", label: "Internal ID"
                    });

                    customerObj.name = result.getValue({
                        name: "altname", label: "Name"
                    });

                    customerObj.companyname = result.getValue({
                        name: "companyname", label: "Company Name"
                    });

                    customerObj.lat = result.getValue({
                        name: "custentitycustentity_ns_lat", label: "Latitude"
                    });

                    customerObj.lng = result.getValue({
                        name: "custentitycustentity_ns_long", label: "Longitude"
                    });
                    customerObj.grade = result.getText({
                        name: "custrecord_jj_customer_grades",
                        join: "CUSTRECORD_JJ_CUST_PLNGRM_PARENT"
                    })
                    customerObj.customergrade = result.getText({
                        name: "custrecord_jj_customer_grades_planogram",
                        join: "CUSTRECORD_JJ_CUST_PLNGRM_PARENT"
                    })

                    log.debug("customerObj.internalId: ", customerObj.internalId)
                    log.debug("GRADE OBJ: ",customerObj.grade)

                    customerArray.push({
                        "lat": Number(customerObj.lat),
                        "lng": Number(customerObj.lng),
                        "internalID": customerObj.internalId
                    });
                    customerArray.push(customerObj.name);
                    customerArray.push(customerObj.companyname);
                    if (checkForParameter(customerObj.grade) == false) {
                        customerArray.push(customerObj.grade)
                    }
                    if (checkForParameter(customerObj.customergrade) == false) {
                        customerArray.push(customerObj.customergrade)
                    }
                    customerDataArray.push(customerArray);
                    return true;
                });

                log.debug("customerDataArray", customerDataArray)

                return customerDataArray;


            }catch (e) {
                log.debug("Err@getCustomer data",e);
                log.error("Err@getCustomer data",e);


            }

        }


        /***
         *Function to get the map details
         */
        const getMapData = (customerData) => {
            try{
                log.debug("PARAM: ",customerData)

                var html =  `
                                   <!DOCTYPE html>
                                    <html>
                                    
                                    <head>
                                        <title>Map</title>
                                        <style>
                                            #mapForCustomers {
                                                height: 80%;
                                                margin-top: 10%;
                                            }
                                    
                                    
                                            #bodyOfHTML {
                                                padding: 50px;
                                                position: absolute;
                                                clip: rect(0px,650px,650px,0px);
                                                overflow: hidden;
                                                width: 650px;
                                                height: 650px;
                                                display: table;
                                                table-layout: auto;


                                            }
                                        </style>
                                        <script src="https://polyfill.io/v3/polyfill.min.js?features=default"></script>
                                    
                                    
                                    
                                    </head>
                                    
                                    <body>
                                    
                                    <script>
                                      let rectangle;
                                    
                                      var infoWindow2;
                                    
                                      function initMap() {
                                    
                                        console.log("inn")
                                    
                                        var tourStops = ${JSON.stringify(customerData)}
                                        console.log("Stringified customerData: ",tourStops)
                                        
                                    var map;
                                    if(tourStops.length>0){
                                         console.log("tourStops innn==>", tourStops)
                                     map = new google.maps.Map(document.getElementById("mapForCustomers"), {
                                          zoom: 10,
                                          controlSize: 32,
                                          center: { lat: Number(tourStops[0][0]['lat']), lng: Number(tourStops[0][0]['lng']) },
                                    
                                        });
                                        
                                    }else{
                                         console.log("tourStops==>", tourStops)
                                      map = new google.maps.Map(document.getElementById("mapForCustomers"), {
                                          zoom: 10,
                                          controlSize: 32,
                                          center: { lat: 25.2744, lng: 133.7751 },
                                    
                                        });
                                    }
                                    
                                     
                                        // Create an info window to share between markers.
                                        const infoWindow = new google.maps.InfoWindow();
                                        console.log("inn2")
                                        // Create the markers.
                                        tourStops.forEach(([position, title, t,grade], i) => {
                                           
                                          const marker = new google.maps.Marker({
                                    position,
                                    map,
                                    title: (i + 1) + ". " + title,
                                    label: grade!=undefined ? grade : (i + 1).toString(),
                                    optimized: false,
                                          });
                                          console.log("inn3")
                                          // Add a click listener for each marker, and set up the info window.
                                          marker.addListener("click", () => {
                                    infoWindow.close();
                                    infoWindow.setContent(marker.getTitle());
                                    infoWindow.open(marker.getMap(), marker);
                                          });
                                        });
                                        console.log("inn4")
                                    
                                        var drawingManager = new google.maps.drawing.DrawingManager({
                                          drawingControl: true,
                                          drawingControlOptions: {
                                    drawingModes: [
                                      google.maps.drawing.OverlayType.RECTANGLE
                                    ]
                                          },
                                          rectangleOptions: {
                                    editable: true
                                    // some code omitted here
                                          }
                                        });
                                        google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
                                          // when the overlay is complete, update the html form fields
                                          update_bounds_fields(event);
                                          rectangle = event.overlay;
                                    
                                          // don't allow the user to draw more than 1 rectangle
                                          // (disable drawing controls after the first one has been drawn)
                                          drawingManager.setDrawingMode(null);
                                          drawingManager.setOptions({
                                    drawingControl: false
                                          });
                                    
                                          // The drawn area is editable with mouse so also want to
                                          // update the html form when the area is edited
                                          google.maps.event.addListener(event.overlay, 'bounds_changed', function () {
                                    update_bounds_fields(event);
                                          });
                                        });
                                    
                                        drawingManager.setMap(map);
                                      }
                                    
                                      function update_bounds_fields(event) {
                                        var nwLat = event.overlay.getBounds().getNorthEast().lat();
                                        var swLng = event.overlay.getBounds().getSouthWest().lng();
                                        var swLat = event.overlay.getBounds().getSouthWest().lat();
                                        var neLng = event.overlay.getBounds().getNorthEast().lng();
                                    
                                        
                                        document.getElementById("rectangle_cordinates").value = nwLat + '|' + swLng + '|' + swLat + '|' + neLng;
                                      }
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    </script>
                                    <div id="bodyOfHTML">
                                    
                                        <div id="mapForCustomers">
                                    
                                        </div>
                                    
                                        <!-- Async script executes immediately and must be after any DOM elements used in callback. -->
                                    
                                        <script
                                                src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCG3hhpxx1unYEifoqrZ4rBASgeyG91eas&callback=initMap&libraries=drawing"
                                                async></script>
                                        <script>
                                          setTimeout(function () {
                                    document.getElementById("mapForCustomers").style = "";
                                          }, 2000);
                                        </script>
                                    
                                    </div>
                                    
                                    
                                    </body>
                                    
                                    </html>
                                                      
                  `;


                log.debug("html: ",html)
                return html;


            }catch (e) {
                log.error("Err@getMapDtata",e)
                log.debug("Err@getMapDtata",e)

            }

        }

        /**
         *function to get the customer category data
         */
        const getCustomerCategoryData=() => {
            try{


                var customerCategoryDataArray=[];
                var customerCategorySearchObj = search.create({
                    type: "customercategory",
                    filters:
                        [
                            ["isinactive","is","F"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })
                        ]
                });
                var searchResultCount = customerCategorySearchObj.runPaged().count;
                log.debug("customerCategorySearchObj result count",searchResultCount);
                customerCategorySearchObj.run().each(function(result){
                    var categoryObj ={}
                    // .run().each has a limit of 4,000 results
                    categoryObj.id =  result.getValue({
                        name: "internalid", label: "Internal ID"
                    })
                    categoryObj.name = result.getValue({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Name"
                    })
                    customerCategoryDataArray.push(categoryObj)
                    return true;
                });
                log.debug("customerCategoryDataArray",customerCategoryDataArray)
                return customerCategoryDataArray;

            }catch (e) {
                log.debug("Error @getCustomerCategoryData",e)
                log.error("Error @getCustomerCategoryData",e)

            }
        }

        function getList(id){
            try{
                log.debug("ID PARAM: ",id)
                var filterArray =[]
                if(id && id!=0){
                    filterArray.push(["isinactive","is","F"])
                    filterArray.push("AND")
                    filterArray.push(["internalid","anyof",id])
                }
                else{
                    filterArray.push(["isinactive","is","F"])
                }
                log.debug("FILTER ARRAY: ",filterArray)
                var customlist_jj_customer_gradesSearchObj = search.create({
                    type: "customlist_jj_customer_grades",
                    filters:filterArray,
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                });
                var searchResultCount = customlist_jj_customer_gradesSearchObj.runPaged().count;
                log.debug("customlist_jj_customer_gradesSearchObj result count",searchResultCount);
                var res = []
                if(searchResultCount>0) {
                    customlist_jj_customer_gradesSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var value = result.getValue({
                            name: "name",
                            sort: search.Sort.ASC
                        })
                        var id = result.getValue({
                            name: "internalid"
                        })
                        res.push({
                            id: id,
                            value: value
                        })
                        return true;
                    });
                    log.debug("RES: ",res)
                    return res
                }

                /*
                customlist_jj_customer_gradesSearchObj.id="customsearch1654869372516";
                customlist_jj_customer_gradesSearchObj.title="Customer Grades Search (copy)";
                var newSearchId = customlist_jj_customer_gradesSearchObj.save();
                */
            }
            catch (e) {
                log.debug("Error @ getList: ",e.name+" : "+e.message)
            }
        }

        function getTrainingGradeList(){
            try{
                var customlist_jj_training_gradingSearchObj = search.create({
                    type: "customlist_jj_training_grading",
                    filters:
                        [
                            ["isinactive","is","F"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                });
                var searchResultCount = customlist_jj_training_gradingSearchObj.runPaged().count;
                log.debug("customlist_jj_training_gradingSearchObj result count",searchResultCount);
                var res = []
                if(searchResultCount>0) {
                    customlist_jj_training_gradingSearchObj.run().each(function (result) {
                        // .run().each has a limit of 4,000 results
                        var value = result.getValue({
                            name: "name",
                            sort: search.Sort.ASC
                        })
                        var id = result.getValue({
                            name: "internalid"
                        })
                        res.push({
                            id: id,
                            value: value
                        })
                        return true;
                    });
                }
                log.debug("RES: ",res)
                return res
            }
            catch (e) {
                log.error({
                    title: 'Error @ getTrainingList: ',
                    details:e.name+" : "+e.message
                })
            }
        }

        /***
         *function to get the saved search list
         */
        const getSavedSearches =() =>{
            try{
                var searchArray =[];
                var savedSearches = search.load({
                        id: 1344,
                        // id: 1373,// Production ID
                        type: search.Type.SAVED_SEARCH
                    })
                //     search.create({
                //     type: search.Type.SAVED_SEARCH,
                //     filters: [
                //         ['recordtype','is','Customer'],
                //         "AND",
                //         ["internalid","noneof","1369"]
                //     ],
                //     columns: [
                //         search.createColumn({
                //             name: 'id'
                //         }),
                //         search.createColumn({
                //             name: 'title'
                //         }),
                //         search.createColumn({
                //             name: 'recordtype'
                //         })
                //     ]
                // });

                var searchResultCount = savedSearches.runPaged().count;
                log.debug("SEARCH result count",searchResultCount);


                savedSearches.run().each(function(result){
                    var savedSearchesObj ={}
                    // .run().each has a limit of 4,000 results
                    savedSearchesObj.id =  result.getValue({
                        name: "id", label: "id"
                    })
                    savedSearchesObj.name = result.getValue({
                        name: "title",

                    })
                    searchArray.push(savedSearchesObj)
                    return true;
                });
                log.debug("searchArray",searchArray)
                return searchArray;

            }catch (e) {
                log.debug("err@getSavedSearches")

            }
        }

        /***
         * Function to get all sales rep
         *
         * @returns {*[]}
         */
        const getSalesRep = () => {
            try{
                var salesRepDataArray=[];
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters:
                        [
                            ["salesrep","is","T"],
                            "AND",
                            ["isinactive","is","F"]
                        ],
                    columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })
                        ]
                });
                var searchResultCount = employeeSearchObj.runPaged().count;
                log.debug("employeeSearchObj result count",searchResultCount);
                employeeSearchObj.run().each(function(result){
                    var salesRepData ={}
                    // .run().each has a limit of 4,000 results
                    salesRepData.id =  result.getValue({
                        name: "internalid", label: "Internal ID"
                    })
                    salesRepData.name = result.getValue({
                        name: "entityid",
                        sort: search.Sort.ASC,
                        label: "Name"
                    })
                    salesRepDataArray.push(salesRepData)
                    return true;
                });
                return salesRepDataArray;

            }catch (e) {
                log.debug("Err@getSales Rep",e)
                log.error("Err@getSales Rep",e)

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
            try{

                var request = scriptContext.request;
                var response = scriptContext.response;
                var method = request.method;
                var mode =  request.parameters.mode;
                log.debug("mode: ",mode)

                //create a suitelet page
                if (mode!='page2') {

                    var form;
                    form = serverWidget.createForm({
                        title : 'Filter out customers to show on map'
                    });
                    form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;
                    form.addButton({
                        label : 'Show In Map',
                        id:'custpage_show_map_button',
                        functionName:'showOnMapFunction'

                    });
                    //sales rep
                    var salesRep = form.addField({
                        id: 'salesrepfield',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Select Sales Rep',

                    });
                    var salesRepsData = getSalesRep();
                    log.debug("salesRepsData",salesRepsData)
                    salesRep.addSelectOption({
                        value: 0,
                        text: ''
                    });
                    for(var key=0;key< salesRepsData.length;key++){
                        salesRep.addSelectOption({
                            value: salesRepsData[key]['id'],
                            text: salesRepsData[key]['name']
                        });
                    }



                    // Customer Category
                    let customercategory = form.addField({
                        id: 'customercategory',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Customer Category'
                    });
                    var customerCategoryData =  getCustomerCategoryData();

                    customercategory.addSelectOption({
                        value: 0,
                        text: ''
                    });
                    for(var key=0;key< customerCategoryData.length;key++){
                        customercategory.addSelectOption({
                            value: customerCategoryData[key]['id'],
                            text: customerCategoryData[key]['name']
                        });
                    }

                    //Training Grade
                    var trainingGrade = form.addField({
                        id: 'traininggrade',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Training Grading'
                    })

                    trainingGrade.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })

                    var listContents = getTrainingGradeList()
                    if(listContents.length>0){
                        for(var i=0;i<listContents.length;i++){
                            trainingGrade.addSelectOption({
                                value: listContents[i].id,
                                text: listContents[i].value
                            })
                        }
                    }

                    //Customer Grade
                    var customerGrade = form.addField({
                        id: 'customergrade',
                        type: serverWidget.FieldType.SELECT,
                        label: 'HOG BRICK'
                    })

                    customerGrade.addSelectOption({
                        value: 0,
                        text: '',
                        isSelected: true
                    })

                    var customerGradelistContents = getList()
                    if(customerGradelistContents.length>0){
                        for(var i=0;i<customerGradelistContents.length;i++){
                            customerGrade.addSelectOption({
                                value: customerGradelistContents[i].id,
                                text: customerGradelistContents[i].value
                            })
                        }
                    }


                    //saved search

                    let searchField = form.addField({
                        id: 'searchfield',
                        type: serverWidget.FieldType.SELECT,
                        label: 'Select a Saved Search'
                    });
                    var searchListData = getSavedSearches();

                    // var k =
                    //     search.load({
                    //         id: 1373,
                    //         type: search.Type.SAVED_SEARCH
                    //     })
                    // var count = k.runPaged().count
                    // log.debug("K COunt: ",count)

                    searchField.addSelectOption({
                        value: 0,
                        text: ''
                    });
                    for(var key=0;key< searchListData.length;key++){
                        searchField.addSelectOption({
                            value: searchListData[key]['id'],
                            text: searchListData[key]['name']
                        });
                    }

                    scriptContext.response.writePage(form);
                }
                else{
                    let uiFormResponse = serverWidget.createForm({
                        title: "Map Customers"
                    });

                    //get sales rep
                    var salesRep =  scriptContext.request.parameters.salesRep;
                    log.debug("REP: ",salesRep)
                    //get saved search
                    var savedSearch =  scriptContext.request.parameters.savedSearch;
                    log.debug("savedSearch: ",savedSearch)
                    //get category
                    var category =  scriptContext.request.parameters.customercategory;
                    log.debug("cat: ",category)
                    //get customer grade
                    var customerGrade = scriptContext.request.parameters.customerGrade;
                    log.debug("GRADE: ",customerGrade)
                    //get training grade
                    var trainingGrade = scriptContext.request.parameters.trainingGrade;
                    log.debug("TRAINING GRADE: ",trainingGrade)
                    //get the customer name & lat, long, id

                    var customerData = getCustomerDataArray(salesRep,savedSearch, category, customerGrade, trainingGrade);


                    //get the static map details
                    var mapData = getMapData(customerData);

                    let salesRepField = uiFormResponse.addField({
                        type:serverWidget.FieldType.SELECT,
                        label:"SalesRep",
                        id:"salesrepfield",
                        source:'employee',
                    });
                    salesRepField.defaultValue=salesRep

                    salesRepField.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    });

                    let categoryField = uiFormResponse.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Category",
                        id:"categoryfield"
                    });
                    categoryField.defaultValue=category;

                    categoryField.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    })

                    let customerGradeField = uiFormResponse.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Customer Grade",
                        id:"cgradefield"
                    });
                    customerGradeField.defaultValue=customerGrade;

                    customerGradeField.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    })

                    let trainingGradeField = uiFormResponse.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Training Grade",
                        id:"tgradefield"
                    });
                    trainingGradeField.defaultValue = trainingGrade;

                    trainingGradeField.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    })

                    let savedSearchField = uiFormResponse.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Saved search",
                        id:"savedsearchfield"
                    });
                    savedSearchField.defaultValue=savedSearch;

                    savedSearchField.updateDisplayType({
                        displayType:serverWidget.FieldDisplayType.HIDDEN
                    })




                    let showMessage = uiFormResponse.addField({
                        type:serverWidget.FieldType.INLINEHTML,
                        label:"Message",
                        id:"response_message",
                        //container: 'tab1id'
                    })
                    showMessage.defaultValue = mapData;

                    let rectangleOptions = uiFormResponse.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Rectangle Cordinates",
                        id:"rectangle_cordinates"
                    })
                    rectangleOptions.updateDisplayType({displayType:serverWidget.FieldDisplayType.DISABLED});
                    let totalCust = uiFormResponse.addField({
                        type:serverWidget.FieldType.TEXT,
                        label:"Total Customers",
                        id:"total_customers"
                    });
                    totalCust.defaultValue = customerData.length;
                    totalCust.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.INLINE
                    })
                    //add button
                    //craete task btn
                    uiFormResponse.addButton({
                        label: 'Next',
                        id:'custpage_next_btn',
                        functionName:'nextToCustomerList'
                    });

                    uiFormResponse.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;
                    scriptContext.response.writePage(uiFormResponse)
                }
            }catch (e) {
                log.debug("Error@ onRequest",e)
                log.error("Error@ onRequest",e)

            }

        }

        return {onRequest}

    });
