// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require('request');
var api= require('./api')
// var insertLeadEndpoint = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/leads/insertv2?alt=json"
var insertLeadEndpoint = "http://localhost:8090/_ah/api/crmengine/v1/leads/insertv2?alt=json"

// var insertLeadEndpoint = "https://gcdc2013-iogrow.appspot.com/jj"
var importCompletedEndpoint = "http://localhost:8090/jj"


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});
// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router



// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.post('/import_leads', function(req, res) {
    var jdata = JSON.parse(Object.keys(req.body)[0]);
    var customFields = jdata['customfields_columns'];
    var matchedColumns = jdata['matched_columns'];
    // var filePath = jdata['file_path'];
    var filePath = "google (14).csv";

    api.Import({},filePath,{0:"fr"},
        function(resultRow,rawRow,rowIndex) {
            var params = {'access':'public'};
            for(var key in matchedColumns){
                if (rawRow[key]){
                    if (params.hasOwnProperty(matchedColumns[key])){
                        if (typeof(params[matchedColumns[key]])=='object'){
                            params[matchedColumns[key]].push(rawRow[key]);
                        }else{
                            var newList = [];
                            newList.push(params[matchedColumns[key]]);
                            newList.push(rawRow[key]);
                            params[matchedColumns[key]]=newList;
                        }
                    }
                    else{
                        params[matchedColumns[key]]=rawRow[key];
                    }
                }     
            }
            for(var key in customFields){
                if (rawRow[key]){
                    var customObj = {};
                    if (params.hasOwnProperty(customFields[key])){
                        if (typeof(params[customFields[key]])=='object'){
                            customObj['default_field']=customFields[key]
                            customObj['value']=rawRow[key]
                            params['customFields'].push(customObj);
                        }else{
                            var newList = [];
                            customObj['default_field']=customFields[key]
                            customObj['value']=rawRow[key]
                            newList['customFields'].push(customObj);
                            params['customFields']=newList;
                        }
                    }
                    else{
                        customObj['default_field']=customFields[key]
                        customObj['value']=rawRow[key]
                        params['customFields']=customObj;
                    }
                }     
            }
            params.infonodes = api.getInfoNodes(params);
            delete params.emails;
            delete params.phones;
             request.post({url:insertLeadEndpoint, json:params}, function (error, response, body) {
             }).auth(null, null, true, jdata['token']);
        },
        function(){
            var params = {'job_id':jdata['job_id']};
            request.post({url:importCompletedEndpoint, json:params}, function (error, response, body) {
            });
            res.json({ message: 'imort api' });
        });
});
router.post('/export', function(req, res) {
    res.json({ message: 'export api' });
});

router.get('/json', function(req, res) {
    var dd = {"access":"public","firstname":"Idriss","lastname":"Belamri","infonodes":[{"kind":"emails","fields":[{"email":"idriss@iogrow.com"}]},{"kind":"phones","fields":[{"number":"0552 35 56 15"},{"number":"6619 8904"}]}]};
    var cc = '{"access":"public","firstname":"Idriss","lastname":"Belamri","infonodes":[{"kind":"emails","fields":[{"email":"idriss@iogrow.com"}]},{"kind":"phones","fields":[{"number":"0552 35 56 15"},{"number":"6619 8904"}]}]}';
    var jj = JSON.parse(cc);
    console.log('0000');
    console.log(dd);
    res.json({ message: 'export api' });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
// more routes for our API will happen here