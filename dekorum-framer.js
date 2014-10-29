var fs = require('fs');
var imgproc = require('./dekorum-imgproc');
var dfs = require('./dekorum-fs');

exports = module.exports

module.exports = {
    frame: frame,
};

// TODO: Force/overwrite param
function frame(indir, outdir){

	var filenames = dfs.loadFilenames(indir);

	function convert(filename){
		var infile = indir + "/" + filename;
		var outfile = outdir + "/" + filename + ".png";
		if(fs.existsSync(outfile)){
			console.log("Skipping " + filename + " (exists)");
			return convert(filenames.shift(), filenames);
		}
		imgproc.make720p(infile, function(err, png){
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
}
