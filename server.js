// server.js

// BASE SETUP
// =============================================================================
var Iconv = require('iconv').Iconv;
// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require('request');
var iconv = require('iconv-lite');
var api= require('./api');
var utf8 = require('utf8');
var insertLeadEndpoint = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/leads/insertv2?alt=json"
// var insertLeadEndpoint = "http://localhost:8090/_ah/api/crmengine/v1/leads/insertv2?alt=json"


var importCompletedEndpoint = "https://gcdc2013-iogrow.appspot.com/jj"
// var importCompletedEndpoint = "http://localhost:8090/jj"


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
    var fullFilePath = jdata['file_path'];
    var splitter = fullFilePath.split('/gcdc2013-iogrow.appspot.com/');
    var filePath = splitter[1];
    api.Import({},filePath,{0:"fr"},
        function(resultRow,rawRow,rowIndex) {
            var params = api.prepareParams(rawRow,matchedColumns,customFields);
             request.post({url:insertLeadEndpoint, json:params}, function (error, response, body) {
             }).auth(null, null, true, jdata['token']);
        },
        function(){
            var params = {'job_id':jdata['job_id']};
            request.post({url:importCompletedEndpoint, json:params}, function (error, response, body) {
            });
            res.json({ message: 'imort api' });
        });
        console.log('import res');
        res.json({ message: 'imort api' });
});
router.post('/import_contacts', function(req, res) {
    var jdata = JSON.parse(Object.keys(req.body)[0]);
    var customFields = jdata['customfields_columns'];
    var matchedColumns = jdata['matched_columns'];
    var fullFilePath = jdata['file_path'];
    var splitter = fullFilePath.split('/gcdc2013-iogrow.appspot.com/');
    var filePath = splitter[1];
    api.Import({},filePath,{0:"fr"},
        function(resultRow,rawRow,rowIndex) {
            var params = api.prepareParams(rawRow,matchedColumns,customFields);
             request.post({url:insertContactEndpoint, json:params}, function (error, response, body) {
             }).auth(null, null, true, jdata['token']);
        },
        function(){
            var params = {'job_id':jdata['job_id']};
            request.post({url:importCompletedEndpoint, json:params}, function (error, response, body) {
            });
            res.json({ message: 'imort api' });
        });
        console.log('import res');
        res.json({ message: 'imort api' });
});


router.get('/json', function(req, res) {
    var filePath = 'tedj@reseller.success2i.com_1442929168.87.csv';
    api.Import({},filePath,{0:"fr"},
        function(resultRow,rawRow,rowIndex) {
            console.log('in json api clbck console');
            var r = JSON.stringify(rawRow);
            var buf = utf8.encode(r);

            console.log(rawRow);
            console.log('end json api clbck console');
        },
        function(){
            console.log('completed');
        });
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