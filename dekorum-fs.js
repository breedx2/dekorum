
var fs = require('fs');

exports = module.exports

module.exports = {
   	loadFilteredFilenames: loadFilteredFilenames,
   	loadFilenames: loadFilenames,
	loadFile: loadFile,
   	exists: exists,
};

function is_s3(dir){
	return dir.indexOf("s3://") == 0;
}

function s3BucketFromUri(uri){
	return uri.replace(/^s3:../, '').replace(/\/.*/, '')
}

function s3PrefixFromUri(uri){
	var result = uri.slice("s3://".length + s3BucketFromUri(uri).length);
	if(result[0] == '/'){
		return result.slice(1);
	}
	return result;
}

function s3Exists(file, callback){
	//TODO: build me...
	callback(true);
}

function exists(file, callback){
	if(is_s3(file)){
		s3Exists(file, callback);
	}
	else {
		fs.exists(file, callback);
	}
}

var FILTER_PREFIX = "437-";
function loadFilteredFilenames(dir, callback){
	return loadFilenames(dir, function(err, files){
		var cbfiles = files;
		if(!err){
			console.log("Filtering files to remove prefix " + FILTER_PREFIX);
			cbfiles = files.filter(function(f){ 
				return path.basename(f).indexOf(FILTER_PREFIX) != 0;
			});
			console.log(cbfiles.length + " files are remaining.");
		}
		callback(err, cbfiles);
	});
}

function loadFilenames(dir, callback){
	console.log("Loading all filenames from " + dir + "...");
	var cb = function(err, files){
		if(err){
			console.log("Error loading files: " + err);
		}
		else {
			console.log("Loaded " + files.length + " filenames from " + dir);
			callback(err, files);
		}
	}
	if(is_s3(dir)){
		result = loadFilenamesS3(dir, cb);
	}
	else{
		result = loadFilenamesFs(dir, cb);
	}
	return result;
}

function loadFilenamesS3(dir, callback, markerKey){
	var aws = require('aws-sdk'); 
	aws.config.loadFromPath('./aws_dekorum_creds.json');	// todo: don't rely on cwd
	var s3 = new aws.S3();
	var bucket = s3BucketFromUri(dir);
	console.log("Loading files from s3 bucket " + bucket + " (at marker = " + markerKey + ")");
	var params = { Bucket: bucket }
	if(markerKey){
		params['Marker'] = markerKey;
	}
	s3.listObjects(params, function(err, data){
		var files = data.Contents
				.map(function(x) { return x.Key; })
				.filter(function(x){ return x.match(/^img\/\w/); });
		var cbfiles = files.map(function(x) { return "s3://" + bucket + "/" + x; });
		callback(err, cbfiles);
		if(data.IsTruncated){
			var markerKey = files[files.length-1];
			console.log("S3 paging forward from " + markerKey);
			loadFilenamesS3(dir, callback, markerKey);
		}
	});
}

function loadFilenamesFs(dir, callback){
	return fs.readdir(dir, function(err, filenames){
		if(err){
			console.log("Error loading filenames from " + dir + ": " + err);
			return;
		}
		callback(err, filenames.map(function(x){ return dir + "/" + x;} ));
	});
}

function loadFileFromS3(file, callback){
	var aws = require('aws-sdk'); 
	aws.config.loadFromPath('./aws_dekorum_creds.json');	// todo: don't rely on cwd
	var s3 = new aws.S3();
	var bucket = s3BucketFromUri(file);
	var key = s3PrefixFromUri(file);
	var params = { Bucket: bucket, Key: key};
	s3.getObject(params, function(err, data){
		callback(err, data.Body);
	});
}

function loadFile(file, callback){
	if(is_s3(file)){
		loadFileFromS3(file, callback);
	}
	else{
		fs.readFile(file, callback);
	}
}
