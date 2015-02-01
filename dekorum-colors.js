var thief = require('thief');
var Canvas = thief.Canvas;
var onecolor = require('onecolor');

exports = module.exports

module.exports = {
	getPalette: getPalette,
	rgbToHsv: rgbToHsv,
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
}

function rgbToHsv(r, g, b){
	var colorString = 'rgb(' + (r/255) + ',' + (g/255) + ',' + (b/255) + ')';
	var color = onecolor(colorString);
	return [color.hue(), color.saturation(), color.value()];
}
