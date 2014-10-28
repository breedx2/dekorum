
var fs = require('fs');

exports = module.exports

module.exports = {
   	loadFilenames: loadFilenames,
};

function loadFilenames(dir){
	console.log("Loading all filenames...");
	var result = fs.readdirSync(dir);
	console.log("Loaded " + result.length + " filenames from " + dir);
	return result;
}
