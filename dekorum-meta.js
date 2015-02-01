
var async = require('async');
var PNG = require('pngjs').PNG;
var dfs = require('./dekorum-fs');
var colors = require('./dekorum-colors');
var entropy = require('./dekorum-entropy');
var streams = require('memory-streams');

exports = module.exports

module.exports = {
    calculate: calculate,
};

function calculateMeta(indir, outdir, file, callback){
	console.log("Calculating metdata for " + file + " into " + outdir);
	dfs.loadFile(file, function(err, data){
		console.log("Frame loaded! " + data.length);
		var reader = new streams.ReadableStream(data);
		var png = new PNG({ filterType: -1 });
		reader.pipe(png)
			.on('parsed', function(){
				console.log('Done parsing PNG data...');
				console.log('Calculating palette...');
				var palette = colors.getPalette(data, png.width, png.height);
				palette = palette.map(function(rgb){
					return {
						rgb: rgb,
						hsv: colors.rgbToHsv(rgb[0], rgb[1], rgb[2])
					}
				});
				console.log('Calculating entropy...');
				var entropyValue = entropy.entropy(png.data);
				console.log(JSON.stringify({ palette: palette, entropy: entropyValue }, null, 2));
				callback(null);
			});
	});
}

function generateCalculateMeta(indir, outdir){
	return function(file, callback){
		calculateMeta(indir, outdir, file, callback);
	}
}

function calculate(indir, outdir){
	dfs.loadFilteredFilenames(indir, function(err, files){
		async.eachSeries(files, generateCalculateMeta(indir, outdir));
	});
}
