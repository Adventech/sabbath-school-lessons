#!/usr/bin/env node
var argv = require("optimist")
  .usage("Create the file structure for a quarter in given language.\n" +
  "Usage: $0 -s [string] -l [string] -q [string] -c [num] -t [string] -d [string] -h [string] -u [bool] -i [bool]")
  .alias({"s":"start-date", "l": "language", "q": "quarter", "c": "count", "t": "title", "d": "description", "h": "human-date", "u": "teacher-comments", "i": "inside-story", "k": "lesson-cover"})
  .describe({
    "s": "Start date in DD/MM/YYYY format. Ex: 25/01/2016",
    "l": "Target language. For ex. 'en' or 'ru'",
    "q": "Quarter id. For example: 2016-04 or 2016-04-er (easy reading)",
    "c": "Amount of lessons in quarter. Typically 13 but can be more",
    "t": "Title of the quarterly in target language",
    "d": "Description of the quarterly in target language",
    "h": "Human readable date of quarterly. Ex. Fourth quarter of 2016",
    "u": "Include teacher comments",
    "i": "Inside story",
    "k": "Create lesson cover placeholder images"
  })
  .demand(["s", "l", "q", "c", "t", "d", "h"])
  .default({ "l" : "en", "c": 13, "u": false, "i": true, "k": false })
  .argv;

var fs     =  require("fs-extra"),
    fswf   =  require("safe-write-file"),
    moment =  require("moment");

var SRC_PATH = "src/",
    QUARTERLY_COVER = "images/quarterly_cover.png",
    LESSON_COVER = "images/lesson_cover.png",
    DATE_FORMAT = "DD/MM/YYYY";

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function createLanguageFolder(quarterlyLanguage){
  console.log("Necessary directory not found. Creating...");
  fs.mkdirSync(SRC_PATH + quarterlyLanguage);
  fswf(SRC_PATH+ "/" + quarterlyLanguage + "/info.yml", "---\n  language: \"Language\"\n  code: \""+ quarterlyLanguage +"\"");
  console.log("Necessary " + quarterlyLanguage + " directory created");
}

function createQuarterlyFolderAndContents(quarterlyLanguage, quarterlyId, quarterlyLessonAmount, quarterlyTitle, quarterlyDescription, quarterlyHumanDate, quarterlyTeacherComments, quarterlyInsideStory, quarterlyStartDate, lessonCover){

  var start_date = moment(quarterlyStartDate, DATE_FORMAT),
      start_date_f = moment(quarterlyStartDate, DATE_FORMAT);

  console.log("Creating file structure for new quarterly. Please do not abort execution");

  fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId);

  for (var i = 1; i <= quarterlyLessonAmount; i++){
    fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i));

    fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/info.yml", "---\n  title: \"Weekly Lesson Title\"\n  start_date: \""+moment(start_date).format(DATE_FORMAT)+"\"\n  end_date: \""+ moment(start_date).add(6, "d").format(DATE_FORMAT) +"\"");

    for (var j = 1; j <= 7; j++){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/" + pad(j) + ".md",
        "---\ntitle:  Daily Lesson Title\ndate:   "+moment(start_date).format(DATE_FORMAT)+"\n---\n\nWrite lesson contents using Markdown format here"
      );
      start_date = moment(start_date).add(1, "d");
    }

    if (quarterlyTeacherComments){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/teacher-comments.md",
        "---\ntitle:  Teacher Comments\n---\n\nWrite teacher comments for this lesson using Markdown format here"
      );
    }

    if (quarterlyInsideStory){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/inside-story.md",
        "---\ntitle:  Inside Story\n---\n\nWrite inside story for this lesson using Markdown format here"
      );
    }
    if (lessonCover){
      fs.copySync(LESSON_COVER, SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/cover.png");
    }
  }

  start_date = moment(start_date).add(-1, "d");

  fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + "info.yml", "---\n  title: \""+quarterlyTitle+"\"\n  description: \""+quarterlyDescription+"\"\n  human_date: \""+quarterlyHumanDate+"\"\n  start_date: \""+moment(start_date_f).format(DATE_FORMAT)+"\"\n  end_date: \""+moment(start_date).format(DATE_FORMAT)+"\"");
  fs.copySync(QUARTERLY_COVER, SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/cover.png");

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
  createQuarterlyFolderAndContents(argv.l, argv.q, argv.c, argv.t, argv.d, argv.h, argv.u, argv.i, argv.s, argv.k);
}