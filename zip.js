//Example of using NodeJS Streams to zip files from Amazon S3 and then piping it to an HTTP Response
var fs = require('fs');
var settings = require('./settings');
var s3 = require('aws2js').load('s3', settings.AWSAccessKeyId, settings.AWSSecretAccessKey);
var ee = require('events').EventEmitter; //for event emitter errors
var st = require('stream');
var async = require('async');
var zipstream = require('zipstream');
s3.setBucket(settings.S3Bucket);

//Returns the zipStream of files from S3.  
//The cool thing about this is that the files are fetched asyncronously and we can use the ZipStream as we wish even if files are still being fetch from S3.

function getZipStream() {
	
	var files = [
		{path:'testfolder/cg8.jpg', fileName:'cg8.jpg'},
		{path:'testfolder/cg7.png', fileName:'cg7.png'}
	];
		
	var zip = zipstream.createZip({ level: -1 });
	
	async.forEachSeries(files, function(item, callback) { //need to call callback to denote when the async function is finished
		console.log("Grabbing S3 File");
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
			console.log("Finalizing");
			zip.finalize(function(written) { console.log(written + ' total bytes written'); });
		} else {
			console.log(err.toString());
		}
	});
	
	//Files are probably sill being fetched at this point, we don't care!
	return zip;
}

//In this example ZipStream is piped directly to HTTP Response.  No temp files are created!

var http = require('http');
var server = http.createServer(function(request, response) {
    response.writeHead(200, {
		'Content-type': 'application/octet-stream',
		'Content-Disposition':'attachment;filename=out.zip'
    });
	
	var zipStream = getZipStream();
	zipStream.pipe(response);
	zipStream.on('end', function() {
		response.end();
	});
});

server.listen(8000);
console.log('Listening on Port 8000...');