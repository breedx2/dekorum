var fs = require('fs');
var mime = require('mime');

exports = module.exports

module.exports = {
   	loadFilteredFilenames: loadFilteredFilenames,
   	loadFilenames: loadFilenames,
	loadFile: loadFile,
	writeFile: writeFile,
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
	console.log("Checking to seee if " + file + " exists in s3...");
	var s3 = buildS3();
	var bucket = s3BucketFromUri(file);
	var key = s3PrefixFromUri(file);
	var params = { Bucket: bucket, Key: key };
	s3.headObject(params, function(err, data){
		callback(err ? false : true);
	});
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

function buildS3(){
	var aws = require('aws-sdk'); 
	aws.config.loadFromPath('./aws_dekorum_creds.json');	// todo: don't rely on cwd
	return new aws.S3();
}

function loadFilenamesS3(dir, callback, markerKey){
	var s3 = buildS3();
	var bucket = s3BucketFromUri(dir);
	console.log("Loading files from s3 bucket " + bucket + " (at marker = " + markerKey + ")");
	var params = { Bucket: bucket };
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
	var s3 = buildS3();
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

function s3WriteFile(instream, file, callback){
	console.log("Writing to s3 " + file);
	// Note: aws requires a known content length, so we have to buffer in mem first.  Bummer.
	var buf = new Buffer(0);
	instream.on('data', function(data){
		buf = Buffer.concat([buf, data]);
	});
	instream.on('end', function(){
		var s3 = buildS3();
		var bucket = s3BucketFromUri(file);
		var key = s3PrefixFromUri(file);
		var params = { Bucket: bucket, Key: key, Body: buf, ContentLength: buf.length, ContentType: mime.lookup(file) };
		s3.putObject(params, callback);
	});
}

function writeFile(instream, file, callback){
	if(is_s3(file)){
		s3WriteFile(instream, file, callback);
	}
	else {
		var outstream = fs.createWriteStream(file);
		instream.on('end', function(){
			console.log("DEBUG: GOT END OF PNG...");
			callback(null, 'success');
		});
		instream.pipe(outstream);
	}
}
