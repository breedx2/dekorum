var express = require('express');
var fs = require('fs');
var imgproc = require('./dekorum-imgproc');

exports = module.exports

module.exports = {
    explore: explore,
};

function loadFilenames(dir){
	return fs.readdirSync(dir);
}

function explore(dir){
	var app = express();
	app.engine('jade', require('jade').__express);
	app.use(express.static('static'));
	app.use(express.static(dir));
	console.log("Loading all filenames...");
	var filenames = loadFilenames(dir);
	console.log("Loaded " + filenames.length + " filenames from " + dir);
	app.get('/', function(req, res){
		res.render('explore.jade', { names: filenames });
	});

	app.get('/scaled/:filename', function(req, res){
		var filename = dir + '/' + req.params.filename;
		imgproc.make720p(filename, function(png){
			//TODO: Write response...
		});
	});

	var server = app.listen(8155, function() {
		console.log('Listening on port %d', server.address().port);
	});
}
