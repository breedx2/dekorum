var fs = require('fs');
var path = require('path');
var async = require('async');
var imgproc = require('./dekorum-imgproc');
var dfs = require('./dekorum-fs');

exports = module.exports

module.exports = {
    frame: frame,
};

// TODO: Force/overwrite param
function frame(indir, outdir){
	dfs.loadFilteredFilenames(indir, function(err, filenames){
		// TODO: Consider adding concurrency here -- like async.eachLimit
		async.eachSeries(filenames, function(filename, callback){
			var outfile = outdir + "/" + path.basename(filename) + ".png";
			dfs.exists(outfile, function(exists){
				if(exists){
					console.log("Skipping " + filename + " (exists)");
					return callback(null);
				}
				imgproc.make720p(filename, function(err, png){
					if(err){
						callback(err);
					}
					console.log("Writing outfile: " + outfile);
					dfs.writeFile(png, outfile, function(err, data){
						if(err){
							console.log("Error writing file: " + err);
							callback(err);
						}
						console.log("Done writing file: " + outfile);
					});
					return callback(null);
				});
			});
		});
	});
}
