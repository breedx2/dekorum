var thief = require('thief');
var Canvas = thief.Canvas;
//var toArray = require('stream-to-array');

exports = module.exports

module.exports = {
	getPalette: getPalette,
};

function getPalette(pngBuffer, width, height) {

	var img = new Canvas.Image();
	var canvas = new Canvas(width, height);
    var ctx = canvas.getContext("2d");

	console.log("Creating palette for png -> " + width + " x " + height + " of size " + pngBuffer.length);

	img.src = pngBuffer;
	ctx.drawImage(img, 0, 0, width, height);
	var palette = thief.createPalette(img, 5);
	return palette;

/*
	toArray(png, function(err, arr){
		var buff = Buffer.concat(arr);
		console.log("ARRAY COMPLETE!");
		img.src = buff;
		ctx.drawImage(img, 0, 0, png.width, png.height);
		var palette = thief.createPalette(img, 5);
		callback(null, palette);
	});
	*/
}
