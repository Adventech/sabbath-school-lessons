import {message, fail, danger} from "danger"
var metaMarked = require("meta-marked"),
    fs          = require('fs-extra'),
    markdownlint = require("markdownlint"),
    yamljs              = require("yamljs"),
    yamlLint = require('yaml-lint');



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

const modifiedFiles = danger.git.modified_files;

for (let i = 0; i < modifiedFiles.length; i++) {
  let fileName = modifiedFiles[i];
  let fileExtension = fileName.split('.').pop().toLowerCase();
  if (fileExtension === 'md') {
    options.files.push(fileName);
    try {
      metaMarked(fs.readFileSync(modifiedFiles[i], "utf-8"))
    } catch (e) {
      fail("Error parsing: " + modifiedFiles[i]+ ". Error: " + e);
    }
  } else if (fileExtension === "yml") {
    try {
      var doc = yamlLint.lint(fs.readFileSync(modifiedFiles[i], 'utf8'));
    } catch (e) {
      fail("Error parsing: " + modifiedFiles[i]+ ". Error: " + e);
    }
  }
}

let res = markdownlint.sync(options);

for (var property in res) {
  if (!res.hasOwnProperty(property)) { continue };
  for (let i = 0; i < res[property].length; i++) {
    fail("Error in " + property +  ". Markdown lint error: " + res[property][i].ruleDescription + ". Line: " + res[property][i].lineNumber)
  }
}