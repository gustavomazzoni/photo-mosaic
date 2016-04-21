// worker

this.onmessage = function (event) {
	var rgb = getAverageRGB(event.data.imageData);

	// Convert color in rgb to hex
    var colorHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    
	this.postMessage({
		index: event.data.index, 
		result: {imageData: event.data.imageData, colorHex: colorHex, index: event.data.tileIndex} //row: event.data.row, col: event.data.col
	});
}

function getAverageRGB(imageData) {
	var length = imageData.data.length;

	var blockSize = 5, // only visit every 5 pixels
        i = -4,
        length,
        rgb = {r:0,g:0,b:0},
        count = 0;

    while ( (i += blockSize * 4) < length ) {
        ++count;
        rgb.r += imageData.data[i];
        rgb.g += imageData.data[i+1];
        rgb.b += imageData.data[i+2];
    }

    rgb.r = Math.floor(rgb.r/count);
    rgb.g = Math.floor(rgb.g/count);
    rgb.b = Math.floor(rgb.b/count);

    return rgb;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}