import {message, fail, danger} from "danger"
let metaMarked = require("meta-marked"),
    fs = require('fs-extra'),
    markdownlint = require("markdownlint"),
    yamljs = require("yamljs"),
    yamlLint = require('yaml-lint'),
    glob = require("glob");



const options = {
  "files": [],
  config: {
    "line-length": false,
    "single-trailing-newline": false,
    "no-inline-html": false,
    "blanks-around-headings": false,
    "no-emphasis-as-heading": false,
    "no-hard-tabs": false
  }
};

let getCompilationQuarterValue = function(d) {
  d = d || new Date();
  let quarterIndex = (Math.ceil((d.getMonth()+1)/3));

  return d.getFullYear() + "-0" + quarterIndex;
};

glob("src/**/"+getCompilationQuarterValue()+"?(-cq|-er)/**/*.{yml,md}", function(er, files){
  for (let i = 0; i < files.length; i++){
    let fileName = files[i];
    let fileExtension = fileName.split('.').pop().toLowerCase();
    if (fileExtension === 'md') {
      options.files.push(fileName);
      try {
        metaMarked(fs.readFileSync(files[i], "utf-8"))
      } catch (e) {
        fail("Error parsing: " + files[i]+ ". Error: " + e);
      }
    } else if (fileExtension === "yml") {
      try {
        let doc = yamlLint.lint(fs.readFileSync(files[i], 'utf8'));
      } catch (e) {
        fail("Error parsing: " + files[i]+ ". Error: " + e.message);
      }
    }
  }
});

let res = markdownlint.sync(options);

for (let property in res) {
  if (!res.hasOwnProperty(property)) { continue };
  for (let i = 0; i < res[property].length; i++) {
    fail("Error in " + property +  ". Markdown lint error: " + res[property][i].ruleDescription + ". Line: " + res[property][i].lineNumber)
  }
}