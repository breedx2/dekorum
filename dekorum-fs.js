
var fs = require('fs');

exports = module.exports

module.exports = {
   	loadFilenames: loadFilenames,
};

function is_s3(dir){
	return dir.indexOf("s3://") == 0;
}

function s3BucketFromUri(uri){
	return uri.replace(/^s3:../, '').replace(/\/.*/, '')
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

function loadFilenamesS3(dir, callback){
	var aws = require('aws-sdk'); 
	var bucket = s3BucketFromUri(dir);
	aws.config.loadFromPath('./aws_dekorum_creds.json');	// todo: don't rely on cwd
	var s3 = new aws.S3();
	console.log("Checking out bucket " + bucket);
	var cb = function(err, data){
		files = data.Contents
				.map(function(x) { return x.Key; })
				.filter(function(x){ return x.match(/^img\/\w/); })
				.map(function(x) { return "s3://" + bucket + "/" + x; });
		callback(err, files);
	}
	// TODO: Fetch all (api limits to 1000, need to keep fetching...)
	s3.listObjects({ Bucket: bucket}, cb);
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
