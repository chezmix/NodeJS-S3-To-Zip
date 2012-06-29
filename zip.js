//Example of using NodeJS Streams to zip files from Amazon S3
var settings = require('./settings');
var s3 = require('aws2js').load('s3', settings.AWSAccessKeyId, settings.AWSSecretAccessKey);
var ee = require('events').EventEmitter; //for event emitter errors
var st = require('stream');
var async = require('async');
var zipstream = require('zipstream');
var fs = require('fs');

s3.setBucket(settings.S3Bucket);
var files = [
	{path:'testfolder/cg8.jpg', fileName:'cg8.jpg'},
	{path:'testfolder/cg7.png', fileName:'cg7.png'}
];
	
var out = fs.createWriteStream('out.zip');
var zip = zipstream.createZip({ level: 1 });
zip.pipe(out);

async.forEachSeries(files, function(item, callback) { //need to call callback to denote when the async function is finished
	s3.get(item.path, null, 'stream', function(err, response) {
		if (err) {
			console.log("err");
			callback(err);
		} else {
			zip.addFile(response, { name: item.fileName }, callback);
		}
	});
},
function (err) {
	if (!err) {
		zip.finalize(function(written) { console.log(written + ' total bytes written'); });
	} else {
		console.log(err.toString());
	}
});