fs = require("fs")
var detect = require('charset-detector')
var utf8 = require('to-utf-8')
var gcloud = require('gcloud')({
    projectId: 'gcdc2013-iogrow',
    keyFilename: "cridentials.json"
});
var Iconv = require('iconv').Iconv;
var peek = require('peek-stream')
var splicer = require('stream-splicer')
var iconv = require('iconv-lite')
var Converter = require("csvtojson").Converter;
var gcs = gcloud.storage()
var backups = gcs.bucket('gcdc2013-iogrow.appspot.com');
var _this= this;

//var insertContactUrl = "http://localhost:8090/_ah/api/crmengine/v1/contacts/insertv2?alt=json"

//var access_token = "ya29.6gHU9LqUTZp4e_VdorIB3xRUHQ6M3SYIForWXLdOzGWwFScoiDR0p-MAtq8qGKRC5IaA"

function ioconvertFrom (encoding) {
  return splicer([
      iconv.decodeStream(encoding)
    ])
}
function getSupportedEncoding (encoding) {
  if(encoding === 'ISO-8859-8-I') encoding = 'ISO-8859-8'
  if(iconv.encodingExists(encoding)) return encoding
  return 'utf8' // default
}
var ioEncoding = function(){
 	return peek(function (data, swap) {
 		var matches = detect(data)
    	var encoding = matches.length > 0 && matches[0].confidence > 0
      		? matches[0].charsetName 
      		: 'utf8'
    	encoding = getSupportedEncoding(encoding)
	    if (encoding ==='ISO-8859-1'){
	    	swap(null, splicer())
	    }else{
	    	swap(null, splicer([
							      iconv.decodeStream('cp1252')
							    ]));
	    }
	 })
}
exports.Import = function (params, file, map, callback , end ) {
    var fileStream = backups.file(file).createReadStream();
    var converter = new Converter({constructResult: false});
    converter.on("end_parsed", end);
    converter.on("record_parsed", callback);
    fileStream.pipe(ioEncoding()).pipe(converter);
}
exports.isEmpty = function(obj) {
    return Object.keys(obj).length === 0;
}
exports.getDefaultFields = function(){
	return {
	    'phones' : {'default_field' : 'number'},
	    'emails' : {'default_field' : 'email'},
	    'addresses' : {'default_field' : 'formatted'},
	    'sociallinks' : {'default_field' : 'url'},
	    'websites' : {'default_field' : 'url'}
	}
}
exports.constructInfoNode = function(obj){
	var infoNode = {};
	var defaultFields = _this.getDefaultFields();
	for (var key in obj){
		infoNode['kind']=key;
		infoNode['fields']=[];
		var defaultField = defaultFields[key]['default_field'];
		if (typeof(obj[key])=='object'){
			for (var i in obj[key]){
				var field = {};
				field['field']=defaultField;
				field['value']=obj[key][i];
				if (!(_this.isEmpty(field))){
					infoNode['fields'].push(field);
				}
			}
		}else{
			var field = {};
			field['field']=defaultField;
			field['value']=obj[key];
			if (!(_this.isEmpty(field))){
				infoNode['fields'].push(field);
			}
		}
	}
	return infoNode;
}
exports.constructCustomField = function(obj){
	var customField = {};
	for (var key in obj){
		customField['kind']='customfields';
		customField['fields']=[];
		if (typeof(obj[key])=='object'){
			for (var i in obj[key]){
				var field = {};
				field['field']=key;
				field['value']=obj[key][i];
				if (!(_this.isEmpty(field))){
					customField['fields'].push(field);
				}
			}
		}else{
			var field = {};
			field['field']=key;
			field['value']=obj[key];
			if (!(_this.isEmpty(field))){
				customField['fields'].push(field);
			}
		}
	}
	return customField;
}

exports.getInfoNodes = function(params){
	var infoNodes = [];
	var defaultFields = _this.getDefaultFields();
	for (var attr in params){
		if (defaultFields.hasOwnProperty(attr)){
			var obj={};
			obj[attr]=params[attr];
			infoNodes.push(_this.constructInfoNode(obj));
		}else if(attr==='customFields'){
			for (i=0;i<params['customFields'].length;i++){
				var obj={};
				obj[params['customFields'][i]['default_field']]=params['customFields'][i]['value'];
				var customFieldObj = _this.constructCustomField(obj);
				if (!(_this.isEmpty(customFieldObj.fields))){
					infoNodes.push(customFieldObj);
				}
			}	
		}
	}
	return infoNodes;
}
exports.prepareParams = function(rawRow,matchedColumns,customFields){
	var params = {'access':'public'};
            for(var key in matchedColumns){
                if (rawRow[key]){
                    if (matchedColumns[key]==='fullname'){
                        params.firstname = rawRow[key].split(' ').slice(0, -1).join(' ') || " ";
                        params.lastname = rawRow[key].split(' ').slice(-1).join(' ') || " ";
                    }
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
            params['customFields'] = [];
            for(var key in customFields){
                if (rawRow[key]){
                    var customObj = {};
                    if (params['customFields'].hasOwnProperty(customFields[key])){
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
                        params['customFields'].push(customObj);
                    }
                }     
            }
            console.log('---------------PARAMS BEFORE TRANSOFRMATION----------');
            console.log(params);
            params.infonodes = _this.getInfoNodes(params);
            delete params.emails;
            delete params.phones;
            delete params.addresses;
            console.log('---------------PARAMS After TRANSOFRMATION----------');
            for (var key in params.infonodes){
            	for (var ind in params.infonodes[key]){
            		console.log(ind);
            		console.log(params.infonodes[key][ind]);
            	}
            }
            return params

}
