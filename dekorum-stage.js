// Stages frames for later processing (video conversion)

fs = require('fs');//todo: make all fileops go thru dfs
path = require('path');
dfs = require('./dekorum-fs');

function stage(indir, outdir, mode, framect){
	dfs.loadFilteredFilenames(indir, function(err, filenames){
		if(mode == "rand"){
			stageRandom(filenames, outdir, framect);
		}
		else{
			console.log("Unrecognized Stage mode: " + mode);
		}
	});
}

function stageRandom(filenames, outdir, framect){
	if(!framect){
		framect = filenames.length;
	}
	console.log("Picking " + framect + " random frames...");
	//+ Jonas Raoni Soares Silva
	//@ http://jsfromhell.com/array/shuffle [v1.0]
	function shuffle(o){ //v1.0
	    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	filenames = shuffle(filenames).slice(0, framect-1);
	var i = 0;
	filenames.forEach(function(x){ 
		console.log(x);
		var outfilename = String("0000000000" + i++).slice(-6);
		fs.symlinkSync(x, outdir + "/" + outfilename);
	});

}

module.exports = {
    stage: stage
};
