# Photo Mosaic App
## Goal

The goal of this task is to implement the following flow in a client-side app.

1. A user selects a local image file.

2. The app loads that image, divides the image into tiles, computes the average
   color of each tile, fetches a tile from the server for that color, and
   composites the results into a photomosaic of the original image.

3. The composited photomosaic should be displayed according to the following
   constraints:
    - tiles should be rendered a complete row at a time (a user should never
      see a row with some completed tiles and some incomplete)
    - the mosaic should be rendered from the top row to the bottom row.
    
4. The client app should make effective use of parallelism and asynchrony.


## Guidelines

The project skeleton contains a lightweight server (written in node) for
serving the client app and the tile images. To start it, run npm start.
  /              serves mosaic.html
  /js/*          serves static resources
  /color/<hex>   serves an SVG mosaic tile for color <hex>.  e.g., /color/0e4daa

The tile size should be configurable via the code constants in js/mosaic.js.
The project skeleton is already set up to include those constants in both the
mosaic client and the mosaic server.  The default size is 16x16.

### Requirements:
 - Submit this as production-quality code for review; i.e.,
   - write effective comments; 
   - make the code modular;
   - make the code testable;
 - Avoid using JS libraries (e.g., jQuery, Modernizr, React) as browser APIs
   are sufficient for the exercise and we're not testing for familiarity with
   any particular tools;
 - Use HTML5 features where appropriate;
 - Allocate about 3 hours to do the task.

### Optional:
 - edit /etc/hosts;
 - use any HTML5 feature supported by current Chrome (e.g., Promise, Worker);
 - be as creative as you like with the submission UI (file input, drag & drop,
   etc); however, it is not the focus of the task, a minimal UI is fine.

## Solution

It was created and exposed a module called PhotoMosaic to manage everything related to the generation of the photo mosaic. To get a better performance and optimization, it was used Promise and Worker (HTML5 features) to make havy and/or equal operations in parallel and asynchronous.

The PhotoMosaic module, through the generate function, returns a promise so when every tile is processed and loaded it responds with a canvas with the photomosaic image ready to be displayed.

## Running the application
### Download the project
Download or clone the project using following command:
```sh
$ git clone https://github.com/gustavomazzoni/photo-mosaic
```

### Run locally
Start the server
```sh
$ npm start
```

