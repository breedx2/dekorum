var program = require('commander');

var scrape = require('./dekorum-scrape');
var download = require('./dekorum-download');
var explore = require('./dekorum-explore');
var framer = require('./dekorum-framer');
var stage = require('./dekorum-stage');
var meta = require('./dekorum-meta');

program.version('0.0.1')
    .option('-s, --scrape', 'Scrape mode')
    .option('-d, --download', 'Download mode')
    .option('-i, --indir <indir>', 'Input directory for download/conversion')
    .option('-o, --outdir <outdir>', 'Output directory for download/conversion')
    .option('-c, --color <color>', 'Just scrape colors matching <color>')
	.option('-e, --explore <dir>', 'Tile explorer mode')
	.option('-f, --frames', 'Convert images in <indir> to frames in <outdir>')
	.option('-S, --Stage <mode>', 'Stage frames into <outdir> with <mode> = [rand]')
	.option('-n, --num <num>', 'Stage only <num> frames')
	.option('-m, --meta', 'Compute metadata from frames in <indir> to <outdir>')
    .parse(process.argv);

function defaultOutDir(){
    if(!program.outdir){
		console.log("--outdir not given, defaulting to '.'");
        program.outdir = '.';
    }
}

function requireInDir(modeName){
    if(!program.indir){
        console.log("Whoops.  --indir <indir> is required for " + modeName + " mode.");
        process.exit(1);;
    }
}

if (program.scrape) {
    console.log("Initiating scrape mode...");
    if (program.color) {
        console.log("Limiting scrape to just " + program.color);
    }
    scrape.scrape(program.color);
}
else if(program.download){
    console.log("Initiating download mode!");
	requireInDir('download');
	defaultOutDir();
    download.download(program.indir.replace(/\/+$/, ''), program.outdir.replace(/\/+$/, ''));
}
else if(program.explore){
	console.log("Initiating explorer mode..");
	explore.explore(program.explore);
}
else if(program.frames){
	requireInDir('frame');
	defaultOutDir();
    framer.frame(program.indir.replace(/\/+$/, ''), program.outdir.replace(/\/+$/, ''));
}
else if(program.Stage){
	requireInDir('Stage');
	defaultOutDir();
	console.log("Let's stage some frames for video...");
	stage.stage(program.indir, program.outdir, program.Stage, program.num);
}
else if(program.meta){
	requireInDir('meta');
	defaultOutDir();
	console.log("Calculating metadata (palette, entropy, etc)...");
	meta.calculate(program.indir.replace(/\/+$/, ''), program.outdir.replace(/\/+$/, ''));
}
else {
    console.log("Must choose one of --scrape or --download or --explore or --frames or --Stage");
}

