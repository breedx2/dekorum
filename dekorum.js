var program = require('commander');

var scrape = require('./dekorum-scrape');
var download = require('./dekorum-download');
var explore = require('./dekorum-explore');

program.version('0.0.1')
    .option('-d, --download', 'Download mode')
    .option('-i, --indir <indir>', 'Input directory for download data')
    .option('-o, --outdir <outdir>', 'Output directory for download')
    .option('-s, --scrape', 'Scrape mode')
    .option('-c, --color <color>', 'Just scrape colors matching <color>')
	.option('-e, --explore <dir>', 'Tile explorer mode')
    .parse(process.argv);

if (program.scrape) {
    console.log("Initiating scrape mode...");
    if (program.color) {
        console.log("Limiting scrape to just " + program.color);
    }
    scrape.scrape(program.color);
}
else if(program.download){
    console.log("Initiating download mode!");
    if(!program.indir){
        console.log("--indir is required for download mode.");
        return;
    }
    if(!program.outdir){
        program.outdir = '.';
    }
    download.download(program.indir.replace(/\/+$/, ''), program.outdir.replace(/\/+$/, ''));
}
else if(program.explore){
	console.log("Initiating explorer mode..");
	explore.explore(program.explore);
}
else {
    console.log("Must choose one of --scrape or --download or --explore");
}

