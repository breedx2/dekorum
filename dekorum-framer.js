var fs = require('fs');
var path = require('path');
var imgproc = require('./dekorum-imgproc');
var dfs = require('./dekorum-fs');

exports = module.exports

module.exports = {
    frame: frame,
};

// TODO: Force/overwrite param
function frame(indir, outdir){
	dfs.loadFilteredFilenames(indir, function(err, filenames){
		var convert = function(filename){
			if(!filename){
				return;
			}
			var outfile = outdir + "/" + path.basename(filename) + ".png";
			dfs.exists(outfile, function(exists){
				if(exists){
					console.log("Skipping " + filename + " (exists)");
					return convert(filenames.shift(), filenames);
				}
				imgproc.make720p(filename, function(err, png){
					if(err){
						return convert(filenames.shift(), filenames);
					}
					console.log("Writing outfile: " + outfile);
					dfs.writeFile(png, outfile, function(err, data){
						if(err){
							console.log("Error writing file: " + err);
							return;
						}
						console.log("Done writing file: " + outfile);
						convert(filenames.shift(), filenames);
					});
				});
			});
		}

		convert(filenames.shift(), filenames);
	});
}
