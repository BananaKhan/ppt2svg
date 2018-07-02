# ppt2svg

## Installation

  Debian/Ubuntu:

  `sudo apt-get install unoconv libreoffice-dev poppler-utils pdf2svg`


  `npm install ppt2svg`

## Usage

    var ppt2svg = require('ppt2svg');

    var config = {
      input: path to presentation file
      output: path where to put images, they will be named `${output}-${1 to presentationLength}.svg`
      optimize: [true|false] (default false, optional)
      optimizationFileSize: start size of images that should be optimized in bytes (default 300kb, optional)
      pdf: [true|false] (default false, optional) set true if input file is a pdf file
    }

    ppt2svg(config, function callback(err, presentationLength) {
      // Handle callback
    });
