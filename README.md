# ppt2svg [![NPM version](https://badge.fury.io/js/ppt2svg.png)](http://badge.fury.io/js/ppt2svg)

  This is Node wrap over pdf2svg and unoconv system packages.

## Installation

  Debian/Ubuntu:

  `sudo apt-get install unoconv libreoffice-dev poppler-utils pdf2svg`


  `npm install ppt2svg`

## Usage

    const ppt2svg = require('ppt2svg');

    const config = {
      input: 'input.ppt|pptx' - path to a presentation file
      output: 'outputFolder/outputName' - path where to put images, they will be named `${outputFolder}/${outputName}-${1 to presentationLength}.svg`
      optimize: [true|false] (optional, defaults to false)
      optimizationFileSize: starting size for images that should be optimized, set in bytes (optional, defaults to 300*1024)
      pdf: [true|false] (optional, default false) set true if input file is a pdf file
    }

    ppt2svg(config, (err, presentationLength) => {
      // Handle callback
    });

      or

    ppt2svg(config)
      .then((presentationLength) => {
        // Do something
      })
      .catch((err) => {
        // Handle error
      })
