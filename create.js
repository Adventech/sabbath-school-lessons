#!/usr/bin/env node
var argv = require("optimist")
  .usage("Create the file structure for a quarter in given language.\n" +
  "Usage: $0 -s [string] -l [string] -q [string] -c [num] -t [string] -d [string] -h [string] -u [bool] -i [bool] -y [hex] -z [hex]")
  .alias({"s":"start-date", "l": "language", "q": "quarter", "c": "count", "t": "title", "d": "description", "h": "human-date", "u": "teacher-comments", "i": "inside-story", "k": "lesson-cover", "y": "color-primary", "z": "color-dark" })
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
    "k": "Create lesson cover placeholder images",
    "y": "Primary color for the lesson",
    "z": "Dark primary color for the lesson"
  })
  .demand(["s", "l", "q", "c", "t", "d", "h"])
  .default({ "l" : "en", "c": 13, "u": false, "i": false, "k": false, "y" : "ffffff", "z" : "000000" })
  .argv;

var fs     =  require("fs-extra"),
    fswf   =  require("safe-write-file"),
    moment =  require("moment");

var SRC_PATH = "src/",
    QUARTERLY_COVER = "images/quarterly_cover.png",
    LESSON_COVER = "images/lesson_cover.png",
    DATE_FORMAT = "DD/MM/YYYY";

var LOCALE_VARS = {

  "daily_lesson_title": {
    "bg": "Дневен урок",
    "da": "Lektie",
    "de": "Tägliche Lektion",
    "en": "Daily Lesson",
    "es": "Lección",
    "fr": "Leçon quotidienne",
    "pt": "Lição",
    "ro": "Lecție zilnică",
    "ru": "Урок",
    "sr": "Lekcija",
    "tr": "Ders",
    "uk": "Урок",
    "ja": "日課",
    "zh": "每日课程",
  },

  "empty_placeholder": {
    "bg": "### <center>Работим по този урок.</center>\n<center>Моля, върнете се по-късно.</center>",
    "da": "### <center>Vi arbejder på denne lektion.</center>\n<center>Prøv igen senere.</center>",
    "de": "### <center>Wir arbeiten noch an dieser Lektion.</center>\n<center>Bitte komme später zurück.</center>",
    "en": "### <center>We are working on this lesson</center>\n<center>Please come back later</center>",
    "es": "### <center>Todavía estamos trabajando en esta lección. Por favor, vuelva más tarde.</center>",
    "fr": "### <center>Nous travaillons sur cette leçon.</center>\n<center>Revenez plus tard, s'il vous plaît.</center>",
    "pt": "### <center>Estamos a trabalhar sobre esta lição.</center>\n<center>Volte mais tarde, por favor.</center>",
    "ro": "### <center>Lucrăm la această lecție.</center>\n<center>Te rog intoarce-te mai tarziu.</center>",
    "ru": "### <center>Мы подготавливаем данный урок</center>\n<center>Попробуйте позже</center>",
    "sr": "### <center>Radimo na ovoj lekciji.</center>\n<center>Molim vas, vratite se kasnije</center>",
    "tr": "### <center>Biz bu derste üzerinde çalışıyoruz.</center>\n<center>Lütfen daha sonra gelin.</center>",
    "uk": "### <center>Ми готуємо цей урок.</center>\n<center>Будь ласка, зайдіть пізніше.</center>",
    "ja": "### <center>この日課は完了されています。　後でここに返ってください。</center>",
    "zh": "### <center>我们正在学习这一课。请稍后再来。</center>",
  },

  "teacher_comments": {
    "bg": "Учител коментира.",
    "da": "Aktiviteter og dialog",
    "de": "Lehrerteil",
    "en": "Teacher Comments",
    "es": "Teacher Comments",
    "fr": "Commentaires Moniteurs",
    "pt": "Moderador",
    "ro": "Teacher Comments",
    "ru": "Комментарий для Учителей",
    "sr": "Pouka za učitelje",
    "tr": "Teacher Comments",
    "uk": "Teacher Comments",
    "ja": "Teacher Comments",
    "zh": "Teacher Comments"
  },

  "inside_story": {
    "bg": "Разказ",
    "da": "Missionsberetning",
    "de": "Mit Gott erlebt",
    "en": "Inside Story",
    "es": "Inside Story",
    "fr": "Histoire",
    "pt": "Inside Story",
    "ro": "Inside Story",
    "ru": "Миссионерская история",
    "sr": "Inside Story",
    "tr": "Inside Story",
    "uk": "Місіонерська історія",
    "ja": "Inside Story",
    "zh": "Inside Story"
  },
};

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function createLanguageFolder(quarterlyLanguage){
  console.log("Necessary directory not found. Creating...");
  fs.mkdirSync(SRC_PATH + quarterlyLanguage);
  fswf(SRC_PATH+ "/" + quarterlyLanguage + "/info.yml", "---\n  name: \"Language Name\"\n  code: \""+ quarterlyLanguage +"\"");
  console.log("Necessary " + quarterlyLanguage + " directory created");
}

function createQuarterlyFolderAndContents(quarterlyLanguage, quarterlyId, quarterlyLessonAmount, quarterlyTitle, quarterlyDescription, quarterlyHumanDate, quarterlyTeacherComments, quarterlyInsideStory, quarterlyStartDate, lessonCover, quarterlyColorPrimary, quarterlyColorDark){

  var start_date = moment(quarterlyStartDate, DATE_FORMAT),
      start_date_f = moment(quarterlyStartDate, DATE_FORMAT);

  console.log("Creating file structure for new quarterly. Please do not abort execution");

  fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId);

  for (var i = 1; i <= quarterlyLessonAmount; i++){
    fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i));

    fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/info.yml", "---\n  title: \"Weekly Lesson Title\"\n  start_date: \""+moment(start_date).format(DATE_FORMAT)+"\"\n  end_date: \""+ moment(start_date).add(6, "d").format(DATE_FORMAT) +"\"");

    for (var j = 1; j <= 7; j++){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/" + pad(j) + ".md",
        "---\ntitle:  "+LOCALE_VARS["daily_lesson_title"][quarterlyLanguage]+"\ndate:   "+moment(start_date).format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
      );
      start_date = moment(start_date).add(1, "d");
    }

    if (quarterlyTeacherComments){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/teacher-comments.md",
        "---\ntitle:  "+LOCALE_VARS["teacher_comments"][quarterlyLanguage]+"\ndate:   "+moment(start_date).add(-1, "d").format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
      );
    }

    if (quarterlyInsideStory){
      fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/inside-story.md",
        "---\ntitle:  "+LOCALE_VARS["inside_story"][quarterlyLanguage]+"\ndate:   "+moment(start_date).add(-1, "d").format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
      );
    }
    if (lessonCover){
      fs.copySync(LESSON_COVER, SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/cover.png");
    }
  }

  start_date = moment(start_date).add(-1, "d");

  fswf(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + "info.yml", "---\n  title: \""+quarterlyTitle+"\"\n  description: \""+quarterlyDescription+"\"\n  human_date: \""+quarterlyHumanDate+"\"\n  start_date: \""+moment(start_date_f).format(DATE_FORMAT)+"\"\n  end_date: \""+moment(start_date).format(DATE_FORMAT)+"\"\n  color_primary: \"#"+quarterlyColorPrimary+"\"\n  color_primary_dark: \"#"+quarterlyColorDark+"\"");
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
  createQuarterlyFolderAndContents(argv.l, argv.q, argv.c, argv.t, argv.d, argv.h, argv.u, argv.i, argv.s, argv.k, argv.y, argv.z);
}
