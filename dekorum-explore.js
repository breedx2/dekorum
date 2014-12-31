var express = require('express');
var fs = require('fs');
var imgproc = require('./dekorum-imgproc');
var dfs = require('./dekorum-fs');
var colors = require('./dekorum-colors');

exports = module.exports

module.exports = {
    explore: explore,
};

var palettes = {};

function serveFileFromS3(dir){
	return function(req, res){
		console.log("Got it!");
		dfs.loadFile(dir + '/' + req.params.filename, function(err, data){
			res.setHeader("Content-type", "image/jpg");
			res.send(data);
		});
	}
}

function getPalette(req, res){
	var filename = req.params.filename;
	res.json(palettes[filename]);
}

function getScaledImage(dir){
	return function(req, res){
		var filename = dir + '/' + req.params.filename;
		imgproc.make720p(filename, function(err, png){

			/* Grab streaming data so we can use it to get a palette... */
			var pngBuffer = new Buffer(0);
			png.on('data', function(chunk){
				pngBuffer = Buffer.concat([pngBuffer, new Buffer(chunk)]);
			});
			png.on('end', function(){
				var palette = colors.getPalette(pngBuffer, png.width, png.height);
				console.log("Color palette calculated: ");
				console.log(palette);
				palettes[req.params.filename] = palette;
			});

			res.writeHead(200, {
				'Content-Type': "image/png", 
				//'Content-Length': stat.size,
				//'Last-Modified': stat.mtime
			});
			png.pipe(res);
		});
	}
}

function explore(dir){
	var app = express();
	app.engine('jade', require('jade').__express);
	app.use(express.static('static'));
	console.log("DEBUG: dir = " + dir);
	if(dfs.is_s3(dir)){
		app.get("/:filename", serveFileFromS3(dir));
	}
	else {
		app.use(express.static(dir));
	}
	dfs.loadFilenames(dir, function(err, files){
		app.get('/', function(req, res){
			files = files.map(function(f){ return path.basename(f); });
			res.render('explore.jade', { names: files});
		});
	});

	app.get('/palette/:filename', getPalette);

	app.get('/scaled/:filename', getScaledImage(dir));

	var server = app.listen(8155, function() {
		console.log('Listening on port %d', server.address().port);
	});
}
