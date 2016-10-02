var PhotoMosaic = (function(document) {
	'use strict';

	// limits of image size
	var MAX_HEIGHT = 680,
		MAX_WIDTH = 680;

	// Resize the image in case it's bigger than the limit size
	function scaleSize(img) {
		if (img.width < MAX_WIDTH && img.height < MAX_HEIGHT) return img;

		if (img.width > MAX_WIDTH) {
			img.height *= MAX_WIDTH / img.width;
			img.width = MAX_WIDTH;
		}
		if (img.height > MAX_HEIGHT) {
			img.width *= MAX_HEIGHT / img.height;
			img.height = MAX_HEIGHT;
		}
		var canvas = document.createElement('canvas'),
			ctx = canvas.getContext('2d'),
			resizedImage = new Image();
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.drawImage(img, 0, 0, img.width, img.height);
		resizedImage.src = canvas.toDataURL();
		return resizedImage;
	}

	function generate(image) {
		var start = performance.now(); // for performance debugging

		// Resize the image in case it's bigger than the limit size
		image = scaleSize(image);
		
		// Create promise to return the result when the whole canvas is ready
		var promise = new Promise(function(resolve, reject) {
			var canvas = document.createElement('canvas'),
				context;
			canvas.width = image.width;
			canvas.height = image.height;
			context = canvas.getContext('2d')
			
			// call function to composite the tiles results into a photomosaic of the original image
			var photomosaic = new PhotoMosaic(image, TILE_WIDTH, TILE_HEIGHT);
			photomosaic.build().then(function(result) {
				for (var i = 0; i < result.length; i++) {
					var tile = result[i];
					context.drawImage(tile.image, tile.x, tile.y, tile.width, tile.height);
				};

				resolve(canvas);
				var end = performance.now();
				console.log('Execution time (ms): ' + (end - start).toFixed(4));
			}, function(err) {
				reject(err);
			});
		});
		return promise;
	}

	function PhotoMosaic(image, width, height) {
		var _originalImage = image,
			_tileWidth = width,
			_tileHeight = height,
			_worker = new Worker('js/worker.js'),
			_index = 0,
			_handlers = [];

		_worker.onmessage = function(e) {
			var handler = _handlers[e.data.index];
			if (e.data.err){
				handler.reject(e.data.err);
			} else {
				handler.resolve(e.data.result);
			}
		}

		// computes the average color of each tile,
		// fetches a tile from the server for that color, and
		// composites the results into a photomosaic of the original image.
		this.build = function() {
			// divides the image into tiles
			var slicedImageList = sliceImageIntoTiles();

			var promise = new Promise(function(resolve, reject) {
		  		var count = 0;
				for (var i = 0, l = slicedImageList.length; i < l; i++) {
					var tile = slicedImageList[i],
						tileImage = new Image(),
						imageData;

					tileImage.src = tile.src;
					imageData = getImageData(tileImage);

					getAverageColor(imageData, i).then(function(result) {
						// Set the source image to the one fetched from the server for the color
						var sourceTile = 'color/' + result.colorHex.substring(1),
							// create an image object and set the url source to preload the image
							tempImg = new Image();

						tempImg.src = sourceTile;

						tempImg.onload = function(e) {
							var tile = slicedImageList[result.index];
							tile.src = e.target.src;
							tile.image = e.target;
							
							count++;

							if (count === l) {
								resolve(slicedImageList);
							}
						};
					}, function(err) {
						reject(err);
					});
				};
			});
			return promise;
		};

		// divides the image into tiles
		function sliceImageIntoTiles() {
			var canvas = document.createElement('canvas'),
				dx = canvas.width = _tileWidth,
				dy = canvas.height = _tileHeight,
				ctx = canvas.getContext('2d'),
				cols = _originalImage.width / _tileWidth,
				rows = _originalImage.height / _tileHeight,
				slicedImageList = [];

			for (var row = 0; row < rows; row++) {
				for (var col = 0; col < cols; col++) {
					// Take snapshot of a part of the source image. The tile.
					ctx.drawImage(_originalImage, dx*col, dy*row, dx, dy, 0, 0, dx, dy);

					var tile = {
						src: canvas.toDataURL(),
						width: dx,
						height: dy,
						x: dx * col,
						y: dy * row,
					};
					
					slicedImageList.push(tile);
				}
			}
			return slicedImageList;
		}

		// Get imageData from image object
		function getImageData(image){
			var c = document.createElement('canvas'),
				height = c.height = image.naturalHeight || image.offsetHeight || image.height,
				width = c.width = image.naturalWidth || image.offsetWidth || image.width,
				ctx = c.getContext('2d'),
				data;

			ctx.drawImage(image, 0, 0);
		    try {
		        data = ctx.getImageData(0, 0, width, height);
		    } catch(e) {
		        console.log('Error getting image data.');
		    }
			return data;
		}

		// computes the average color of each tile
		// operation done by the worker.
		function getAverageColor(imageData, index) {
			_index++;

			var promise = new Promise(function(resolve, reject) {
				// Add the resolve and reject functions to handler
				// This promise will be called several times so it's necessary to keep a track of it.
		  		_handlers[_index] = {
					resolve: resolve,
					reject: reject
				}
				// The index property is to find the right handler
				// The tileIndex is to find the right tile
				_worker.postMessage({index: _index, imageData: imageData, tileIndex: index});
			});

			return promise;
		}
	}

	return {
		generate: generate
	};
})(document);


var exports = exports || null;
if (exports) {
  exports.PhotoMosaic = PhotoMosaic;
}
