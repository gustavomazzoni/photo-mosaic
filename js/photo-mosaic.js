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
			_workersPool = [],
			_workersCount = 4,
			_index = 0,
			_handlers = [];


		function launchWorkers() {
			// Launching every worker
		    for (var i = 0; i < _workersCount; i++) {
		        var worker = new Worker("js/worker.js");
		        worker.onmessage = onWorkerMessage;
		        // add to pool
		        _workersPool.push(worker);
		    }
		}

		function onWorkerMessage(e) {
			var handler = _handlers[e.data.index];
			if (e.data.err){
				handler.reject(e.data.err);
			} else {
				handler.resolve(e.data.result);
			}
		}

		function getWorker() {
			var index = 0;
			function getWorkerFromPool() {
				var worker = _workersPool[index];
				if (index === _workersCount - 1) {
					index = 0;
				} else {
					index++;
				}
				return worker;
			}
			// return closure function
			return getWorkerFromPool();
		}

		// computes the average color of each tile,
		// fetches a tile from the server for that color, and
		// composites the results into a photomosaic of the original image.
		this.build = function() {
			// load workers in advance
			launchWorkers();

			// divides the image into tiles
			var slicedImageList = sliceImageIntoTiles();

			var promise = new Promise(function(resolve, reject) {
		  		var count = 0;
				for (var i = 0, l = slicedImageList.length; i < l; i++) {
					getAverageColor(slicedImageList[i].data, i).then(function(result) {
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

							// when every image is loaded, resolve
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
						data: ctx.getImageData(0, 0, dx, dy),
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
				// start backgroud process via worker.
				// The index property is to find the right handler on return
				// The tileIndex is to find the right tile on return
				getWorker().postMessage({index: _index, imageData: imageData, tileIndex: index});
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
