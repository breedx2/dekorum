var fs = require('fs');
var imgproc = require('./dekorum-imgproc');
var dfs = require('./dekorum-fs');

exports = module.exports

module.exports = {
    frame: frame,
};

function frame(indir, outdir){
	var filenames = dfs.loadFilenames(indir);
}
