var express = require('express');
var fs = require('fs');
var imgproc = require('./dekorum-imgproc');
var dfs = require('./dekorum-fs');
var colors = require('./dekorum-colors');

exports = module.exports

module.exports = {
    explore: explore,
};

function explore(dir){
	var app = express();
	app.engine('jade', require('jade').__express);
	app.use(express.static('static'));
	app.use(express.static(dir));
	dfs.loadFilenames(dir, function(err, files){
		app.get('/', function(req, res){
			files = files.map(function(f){ return path.basename(f); });
			res.render('explore.jade', { names: files});
		});
	});

	app.get('/scaled/:filename', function(req, res){
		var filename = dir + '/' + req.params.filename;
		imgproc.make720p(filename, function(err, png){

			/* Grab streaming data so we can use it to get a palette... */
			var pngBuffer = new Buffer(0);
			png.on('data', function(chunk){
				pngBuffer = Buffer.concat([pngBuffer, new Buffer(chunk)]);
			});
			png.on('end', function(){
				var palette = colors.getPalette(pngBuffer, png.width, png.height);
				console.log("YAY!!!!!!!!!!!!");
				console.log(palette);
			});

			res.writeHead(200, {
		    	'Content-Type': "image/png", 
				//'Content-Length': stat.size,
				//'Last-Modified': stat.mtime
			});
			png.pipe(res);
		});
	});

	var server = app.listen(8155, function() {
		console.log('Listening on port %d', server.address().port);
	});
}
