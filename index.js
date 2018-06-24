var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var SVGO = require('svgo');
var svgo = new SVGO();

var optimize = false;
var OPT_FILE_SIZE = 300 * 1024;

function getFileSize(path) {
  return new Promise(function (res, rej) {
    fs.stat(path, (err, stat) => {
      if (err) {
        rej(err);
      } else {
        res(stat.size);
      }
    });
  });
}

function optimizeSVG(path) {
  return new Promise(function (res, rej) {
    fs.readFile(path, 'utf8', function(err, data) {
      if (err) {
        rej(err);
      }
      svgo.optimize(data, {path: path})
      .then((d) => {
        fs.writeFile(path, d.data, function(err) {
          if (err) {
            rej(err);
          }
          res();
        });
      }).catch(e => rej(e));
    });
  });
}

function execute(command) {
  return new Promise(function (res, rej) {
    exec(command, function (error, stdout, stderr) {
      if (error) {
        rej(error);
      } else {
        res({
          stdout: stdout,
          stderr: stderr
        });
      }
    });
  });
}

function pdf2svg(input, output) {
  return new Promise((res, rej) => {
    exec(`pdfinfo '${input}' | grep Pages`, (err, stdout, stderr) => {
      if (err) {
        rej(err);
      }
      var pdfLength = 0;
      if (stdout) {
        pdfLength = stdout.match(/Pages:\s+(\d+)/)[1];
      }
      execute(`pdf2svg '${input}' '${output}-%d.svg' all`)
      .then((success) => {
        var sizePromises = [];
        if (optimize) {
          for (var i = 1; i <= pdfLength; i += 1) {
            sizePromises.push(getFileSize(`${output}-${i}.svg`));
          }
        }
        return Promise.all(sizePromises)
      })
      .then((sizes) => {
        var SVGOptimizationPromises = [];
        if (optimize) {
          sizes.forEach((size, index) => {
            if (size > OPT_FILE_SIZE) {
              SVGOptimizationPromises.push(optimizeSVG(`${output}-${index + 1}.svg`));
            }
          });
        }
        return Promise.all(SVGOptimizationPromises);
      })
      .then((d) => {
        res(pdfLength);
      }).catch(e => rej(e));
    });
  });
}

function ppt2svg(config, callback) {
  if (!config.input || !config.output) {
    callback(new Error('Insufficient configuration'));
  } else {
    optimize = !!config.optimize;
    if (config.optimizationFileSize) {
      OPT_FILE_SIZE = config.optimizationFileSize;
    }
    execute(`unoconv -f pdf -o '${config.output}.pdf' '${config.input}'`)
    .then((res) => {
      return pdf2svg(`${config.output}.pdf`, config.output)
    })
    .then((presentationLength) => {
      fs.unlink(`${config.output}.pdf`, function(err) {
        callback(err, presentationLength);
      });
    }).catch(e => callback(e));
  }
}

module.exports = ppt2svg;
