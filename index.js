const exec = require('child_process').exec;
const fs = require('fs');
const SVGO = require('svgo');
const svgo = new SVGO();
const OPT_FILE_SIZE = 300 * 1024;

let optimize = false;
let optMinSize = OPT_FILE_SIZE;

function getFileSize(path) {
  return new Promise((res, rej) => {
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
  return new Promise((res, rej) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        rej(err);
      }
      svgo.optimize(data, {path: path})
      .then((optimizedData) => {
        fs.writeFile(path, optimizedData.data, (err) => {
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
  return new Promise((res, rej) => {
    exec(command, (error, stdout, stderr) => {
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
      let pdfLength = 0;
      if (stdout) {
        pdfLength = stdout.match(/Pages:\s+(\d+)/)[1];
      }
      execute(`pdf2svg '${input}' '${output}-%d.svg' all`)
      .then(() => {
        let sizePromises = [];
        if (optimize) {
          for (let i = 1; i <= pdfLength; i += 1) {
            sizePromises.push(getFileSize(`${output}-${i}.svg`));
          }
        }
        return Promise.all(sizePromises)
      })
      .then((sizes) => {
        let SVGOptimizationPromises = [];
        if (optimize) {
          sizes.forEach((size, index) => {
            if (size > optMinSize) {
              SVGOptimizationPromises.push(optimizeSVG(`${output}-${index + 1}.svg`));
            }
          });
        }
        return Promise.all(SVGOptimizationPromises);
      })
      .then(() => {
        res(pdfLength);
      }).catch(e => rej(e));
    });
  });
}

function ppt2svg(config, callback) {
  if (!config.input || !config.output) {
    if (callback) {
      callback(new Error('Insufficient configuration'));
      return false;
    }
    return new Promise((res, rej) => {
      rej(new Error('Insufficient configuration'));
    });
  }
  optimize = !!config.optimize;
  if (config.optimizationFileSize) {
    optMinSize = config.optimizationFileSize;
  }
  let promise = null;
  if (config.pdf) {
    promise = pdf2svg(`${config.input}`, config.output);
  } else {
    promise = execute(`unoconv -f pdf -o '${config.input}.pdf' '${config.input}'`)
    .then(() => {
      return pdf2svg(`${config.input}.pdf`, config.output);
    })
    .then((presentationLength) => {
      return new Promise((res, rej) => {
        fs.unlink(`${config.input}.pdf`, function(err) {
          if (err) {
            rej(err);
          } else {
            res(presentationLength);
          }
        });
      });
    })
  }
  if (callback) {
    promise.then((presentationLength) => {
      callback(null, presentationLength);
    })
    .catch(e => callback(e));
    return false;
  }
  return promise;
}

module.exports = ppt2svg;
