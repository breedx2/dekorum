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
	dfs.loadFilenames(indir, function(err, filenames){
		function convert(filename){
			if(!filename){
				return;
			}
			var outfile = outdir + "/" + path.basename(filename) + ".png";
			if(fs.existsSync(outfile)){
				console.log("Skipping " + filename + " (exists)");
				return convert(filenames.shift(), filenames);
			}
			imgproc.make720p(filename, function(err, png){
				if(err){
					return convert(filenames.shift(), filenames);
				}
				console.log("Writing outfile: " + outfile);
				var outstream = fs.createWriteStream(outfile);
				png.on('end', function(){
					convert(filenames.shift(), filenames);
				});
				png.pipe(outstream);
			});
		}

		convert(filenames.shift(), filenames);
	});
}
