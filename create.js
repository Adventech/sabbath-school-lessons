#!/usr/bin/env node
var argv = require("optimist")
  .usage("Create the file structure for a quarter in given language.\n" +
  "Usage: $0 -s [string] -l [string] -q [string] -c [num] -t [string] -d [string] -h [string] -u [bool] -i [bool]")
  .alias({"s":"start-date", "l": "language", "q": "quarter", "c": "count", "t": "title", "d": "description", "h": "human-date", "u": "teacher-comments", "i": "inside-story"})
  .describe({
    "s": "Start date in d/m/YYYY format. Ex: 25/01/2016",
    "l": "Target language. For ex. 'en' or 'ru'",
    "q": "Quarter id. For example: 2016-04 or 2016-04-er (easy reading)",
    "c": "Amount of lessons in quarter. Typically 13 but can be more",
    "t": "Title of the quarterly in target language",
    "d": "Description of the quarterly in target language",
    "h": "Human readable date of quarterly. Ex. Fourth quarter of 2016",
    "u": "Include teacher comments",
    "i": "Inside story"
  })
  .demand(["s", "l", "q", "c", "t", "d", "h"])
  .default({ "l" : "en", "c": 13, "u": false, "m": false })
  .argv;

var fs     =  require("fs-extra"),
    fswf   =  require("safe-write-file"),
    moment =  require("moment");

var SRC_PATH = "src/",
    COVER_IMAGE_BASE64 = "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";

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function createLanguageFolder(quarterlyLanguage){
  console.log("Necessary directory not found. Creating...");
  fs.mkdirSync(SRC_PATH + quarterlyLanguage);
  console.log("Necessary " + quarterlyLanguage + " directory created");
}

function createQuarterlyFolderAndContents(quarterlyLanguage, quarterlyId, quarterlyLessonAmount, quarterlyTitle, quarterlyDescription, quarterlyHumanDate, quarterlyTeacherComments, quarterlyInsideStory, quarterlyStartDate){

  var start_date = moment(quarterlyStartDate, "D/M/YYYY");

  console.log("Creating file structure for new quarterly. Please do not abort execution");

  fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId);

  for (var i = 1; i <= quarterlyLessonAmount; i++){
    fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i));

    fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/info.yml", "---\n  title: \"Weekly Lesson Title\"\n  date: \""+moment(start_date).format("D/M/YYYY")+" - "+ moment(start_date).add(6, "d").format("D/M/YYYY") +"\"");

    for (var j = 1; j <= 7; j++){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/" + pad(j) + ".md",
        "---\ntitle:  Daily Lesson Title\ndate:   "+moment(start_date).format("D/M/YYYY")+"\n---\n\n# Daily Lesson Title\n\nWrite lesson contents using Markdown format here"
      );
      start_date = moment(start_date).add(1, "d");
    }

    if (quarterlyTeacherComments){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/teacher-comments.md",
        "---\ntitle:  Teacher Comments\n---\n\n# Teacher Comments\n\nWrite teacher comments for this lesson using Markdown format here"
      );
    }

    if (quarterlyInsideStory){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/inside-story.md",
        "---\ntitle:  Inside Story\n---\n\n# Inside Story\n\nWrite inside story for this lesson using Markdown format here"
      );
    }
  }

  fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + "info.yml", "---\n  title: \""+quarterlyTitle+"\"\n  description: \""+quarterlyDescription+"\"\n  date: \""+quarterlyHumanDate+"\"");
  fs.writeFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + "cover.png", COVER_IMAGE_BASE64, "base64");

  console.log("File structure for new quarterly created");
}

try {
  stats = fs.lstatSync(SRC_PATH + argv.l);
  if (stats.isDirectory()) {
    console.log("Found necessary directory " + argv.l);
  } else {
    createLanguageFolder(argv.l);
  }
} catch (e) {
  createLanguageFolder(argv.l);
}

try {
  stats = fs.lstatSync(SRC_PATH + argv.l + "/" + argv.q);
  if (stats.isDirectory()) {
    console.log("Quarterly with same id already exists. Aborting");
  } else {
    console.log("Something weird happened. Aborting");
  }
} catch (e) {
  createQuarterlyFolderAndContents(argv.l, argv.q, argv.c, argv.t, argv.d, argv.h, argv.u, argv.i, argv.s);
}