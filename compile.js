#!/usr/bin/env node

const copyrightNotice = "\n\n<p><small>Content © 2020 General Conference of Seventh-day Adventists®. All rights reserved. No part of the Adult Sabbath School Bible Study Guide may be edited, altered, modified, adapted,  translated, re-produced, or published by any person or entity without prior written authorization from the General Conference of Seventh-day Adventists®. The division offices of the General Conference of Seventh-day Adventists® are authorized to arrange for translation of the Adult Sabbath School Bible Study Guide, under specific guidelines. Copyright of such translations and their publication shall remain with the General Conference.</small></p>";

var glob                = require("glob"),
    yamljs              = require("yamljs"),
    metaMarked          = require("meta-marked"),
    ent                 = require('ent'),
    fs                  = require("fs-extra"),
    moment              = require("moment"),
    changeCase          = require('change-case'),
    bibleSearchBCV      = require("adventech-bible-tools/bible_tools_bcv");

var firebase = require("firebase"),
    async = require("async");

var API_HOST = "https://sabbath-school.adventech.io/api/",
    API_VERSION = "v1",
    SOURCE_DIR = "src/",
    SOURCE_INFO_FILE = "info.yml",
    SOURCE_COVER_FILE = "cover.png",
    DIST_DIR = "dist/api/" + API_VERSION + "/",
    WEB_DIR = "web/content/",
    BIBLE_PARSER_CONFIG = require("./config.js"),
    FIREBASE_DATABASE_LANGUAGES = "/api/" + API_VERSION + "/languages",
    FIREBASE_DATABASE_QUARTERLIES = "/api/" + API_VERSION + "/quarterlies",
    FIREBASE_DATABASE_QUARTERLY_INFO = "/api/" + API_VERSION + "/quarterly-info",
    FIREBASE_DATABASE_LESSONS = "/api/" + API_VERSION + "/lessons",
    FIREBASE_DATABASE_LESSON_INFO = "/api/" + API_VERSION + "/lesson-info",
    FIREBASE_DATABASE_DAYS = "/api/" + API_VERSION + "/days",
    FIREBASE_DATABASE_READ = "/api/" + API_VERSION + "/reads";

var argv = require("optimist").usage("Compile & deploy script - DON'T USE IF YOU DON'T KNOW WHAT IT DOES\n" +
    "Usage: $0 -b [string]")
    .alias({"b": "branch"})
    .describe({
      "b": "branch",
      "l": "language",
      "q": "quarter"
    })
    .demand(["b"])
    .argv;

var getCompilationQuarterValue = function(d) {
  d = d || new Date();
  var quarterIndex = (Math.ceil((d.getMonth()+1)/3)),
      nextQuarter = (quarterIndex <= 3) ? d.getFullYear() + "-0" + (quarterIndex+1) : (d.getFullYear()+1) + "-01";

  return "(" + d.getFullYear() + "-0" + quarterIndex + "|" + nextQuarter + ")";
};

var branch = argv.b,
    compile_language = argv.l || "*",
    compile_quarter = argv.q || "";

var firebaseDeploymentTasks = [];

var getInfoFromPath = function(path){
  var infoRegExp = /src\/([a-z]{2,3})?\/?([a-z0-9-]{6,})?\/?([0-9]{2})?\/?([a-z0-9-]{2,}\.md)?\/?/g,
      matches = infoRegExp.exec(path),
      info = {};

  info.language = matches[1] || null;
  info.quarterly = matches[2] || null;
  info.lesson = matches[3] || null;
  info.day = (matches[4]) ? matches[4].replace(".md", "") : null;

  return info;
};

var renderer = new metaMarked.noMeta.Renderer();

renderer.codespan = function(text) {
    return '<code>' + ent.decode(text) + '</code>';
};

var slug = function(input){
  var s = changeCase.lower(input).replace(/ /g, "-");
  return s;
};

var convertDatesForWeb = function(object){
  for (var key in object) {
    if (object.hasOwnProperty(key)) {
      if (key === "date" ||
        key === "start_date" ||
        key === "end_date") {
        object[key] = moment(object[key], "DD/MM/YYYY").format("YYYY-MM-DD");
      }
    }
  }
  return object;
};

var yamlify = function(json){
  return "---\n" + yamljs.stringify(json, 4) + "\n---";
};

if (branch.toLowerCase() === "master"){
  API_HOST = "https://sabbath-school.adventech.io/api/";
  firebase.initializeApp({
    databaseURL: "https://blistering-inferno-8720.firebaseio.com",
    serviceAccount: "deploy-creds.json",
    databaseAuthVariableOverride: {
      uid: "deploy"
    }
  });
  db = firebase.database();
} else if (branch.toLowerCase() === "stage") {
  API_HOST = "https://sabbath-school-stage.adventech.io/api/";
    firebase.initializeApp({
      databaseURL: "https://sabbath-school-stage.firebaseio.com",
      serviceAccount: "deploy-creds-stage.json",
      databaseAuthVariableOverride: {
        uid: "deploy"
      }
    });
  db = firebase.database();
} else {
  db = {
    ref: function(){
      return {
        set: function(){},
        child: function(){
          return { set: function(){} }
        }
      }
    },
    goOffline: function(){}
  }
}

glob("images/global/**/cover.png", function(er, files){
  for (var i = 0; i < files.length; i++){
    fs.copySync(files[i], files[i].replace("images/global", DIST_DIR + "images/global"));
    if (branch.toLowerCase() !== "master" && branch.toLowerCase() !== "stage"){
      fs.copySync(files[i], files[i].replace("images/global", "web/static/img/global"));
    }
  }
});

glob("images/misc/*.{png,jpg,jpeg}", function(er, files){
  for (var i = 0; i < files.length; i++){
    fs.copySync(files[i], files[i].replace("images/misc", DIST_DIR + "images/misc"));
    if (branch.toLowerCase() !== "master" && branch.toLowerCase() !== "stage"){
      fs.copySync(files[i], files[i].replace("images/misc", "web/static/img/misc"));
    }
  }
});

// Create languages API endpoint
glob("src/*/info.yml", {}, function (er, files) {
  var languages = [];
  for (var i = 0; i < files.length; i++){
    languages.push(yamljs.load(files[i]));
  }

  // Firebase
  (function(languages) {
    firebaseDeploymentTasks.push(function (cb) {
      db.ref(FIREBASE_DATABASE_LANGUAGES).set(languages, function (e) {
        cb(false, true);
      });
    });
  })(languages);

  // API
  fs.outputFileSync(DIST_DIR + "/languages/index.json", JSON.stringify(languages));
});

// get quarterlies
glob("src/"+compile_language+"/", {}, function (er, files) {
  for (var i = 0; i < files.length; i++){
    var quarterlies = quarterliesAPI(files[i]),
        info = getInfoFromPath(files[i]);

    // Firebase Deployment
    (function(language, quarterlies){
      firebaseDeploymentTasks.push(function(cb){
        db.ref(FIREBASE_DATABASE_QUARTERLIES).child(language).once("value", function(data){
          var existingQuarterlies = data.val() || [];

          for (var i = 0; i < quarterlies.length; i++) {
            var replaced = false;
            for (var j = 0; j < existingQuarterlies.length; j++) {
              if (existingQuarterlies[j] && quarterlies[i].index === existingQuarterlies[j].index) {
                existingQuarterlies[j] = quarterlies[i];
                replaced = true;
              }
            }
            if (!replaced) {
              existingQuarterlies.unshift(quarterlies[i]);
            }
          }

          existingQuarterlies = existingQuarterlies.sort(function(a, b){
            var s = a.index,
                d = b.index;

            if (s.length === 10) s += "_";
            if (d.length === 10) d += "_";

            if (s < d) return -1;
            if (s > d) return 1;

            return 0;
          }).reverse();

          db.ref(FIREBASE_DATABASE_QUARTERLIES).child(language).set(existingQuarterlies, function (e) {
            cb(false, true);
          });

        });
      });
    })(info.language, quarterlies);

    // API
    fs.outputFileSync(files[i].replace(SOURCE_DIR, DIST_DIR) + "/quarterlies/index.json", JSON.stringify(quarterlies));

    var _quarterlies = JSON.parse(JSON.stringify(quarterlies));

    // Web
    fs.outputFileSync(files[i].replace(SOURCE_DIR, WEB_DIR) + "_index.md", yamlify({quarterlies: _quarterlies.map(function (q) {
      q.path = q.path.replace(/quarterlies\//g, "");
      return convertDatesForWeb(q)
    }), type: "quarterly"}));
  }

  async.series(firebaseDeploymentTasks,
    function(err, results) {
      db.goOffline();
    }
  );
});

var quarterliesAPI = function(languagePath){
  var quarterlies = [];

  // Getting files and sorting based on the quarterly type and year quarter
  var files = glob.sync(languagePath+compile_quarter+"*/").sort(function(a, b){
    if (a.length === 15) a = a + "_";
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }).reverse();

  for (var i = 0; i < files.length; i++){
    quarterlies.push(quarterlyAPI(files[i]));
  }
  return quarterlies;
};

var quarterlyAPI = function(quarterlyPath){
  var quarterly = yamljs.load(quarterlyPath + "info.yml"),
      info = getInfoFromPath(quarterlyPath);

  console.log("Processing", quarterlyPath);

  quarterly.lang = info.language;
  quarterly.id = info.quarterly;
  quarterly.index = info.language + "-" + info.quarterly;
  quarterly.path = info.language + "/quarterlies/" + info.quarterly;
  quarterly.full_path = API_HOST + API_VERSION + "/" + info.language + "/quarterlies/" + info.quarterly;

  if (quarterly.quarterly_name) {
    quarterly.group = `${quarterly.index.substring(0, 10)}`
  }

  try {
    fs.lstatSync(quarterlyPath + "/" + SOURCE_COVER_FILE);
    fs.copySync(quarterlyPath + "/" + SOURCE_COVER_FILE, DIST_DIR + quarterly.path + "/" + SOURCE_COVER_FILE);
    quarterly.cover = quarterly.full_path + "/" + SOURCE_COVER_FILE;
  } catch (err) {
    quarterly.cover = "";
  }

  var lessons = lessonsAPI(quarterlyPath);

  // Firebase
  (function(quarterly){
    firebaseDeploymentTasks.push(function(cb){
      db.ref(FIREBASE_DATABASE_QUARTERLY_INFO).child(quarterly.quarterly.index).set(quarterly, function(e){
        cb(false, true);
      });
    });
  })({quarterly: quarterly, lessons: lessons});

  // API
  fs.outputFileSync(DIST_DIR + quarterly.path + "/index.json", JSON.stringify({quarterly: quarterly, lessons: lessons}));

  // Web
  var _quarterly = JSON.parse(JSON.stringify(quarterly)),
      _lessons = JSON.parse(JSON.stringify(lessons));

  _quarterly.type = "lesson";
  delete _quarterly.index;
  delete _quarterly.id;
  _quarterly.path = _quarterly.path.replace(/quarterlies\//g, "");
  _quarterly.lessons = _lessons.map(function(l){
    l.path = l.path.replace(/quarterlies\//g, "");
    l.path = l.path.replace(/lessons\//g, "");
    l.path_index = info.language + "/" + info.quarterly + "/" + l.id + "/01";
    return convertDatesForWeb(l);
  });

  fs.outputFileSync(WEB_DIR + info.language + "/" + info.quarterly + "/_index.md", yamlify(convertDatesForWeb(_quarterly)));

  return quarterly;
};

var lessonsAPI = function(quarterlyPath){
  var lessons = [],
      files = glob.sync(quarterlyPath+"*/"),
      info = getInfoFromPath(quarterlyPath);

  for (var i = 0; i < files.length; i++){
    lessons.push(lessonAPI(files[i]));
  }

  // Firebase
  (function(language, quarterly, lessons){
    firebaseDeploymentTasks.push(function(cb){
      db.ref(FIREBASE_DATABASE_LESSONS).child(language + "-" + quarterly).set(lessons, function(e){
        console.log('Deployment', language + "-" + quarterly)
        cb(false, true);
      });
    });
  })(info.language, info.quarterly, lessons);

  // API
  fs.outputFileSync(DIST_DIR + info.language + "/quarterlies/" + info.quarterly + "/lessons/" + "index.json", JSON.stringify(lessons));

  return lessons;
};

var lessonAPI = function(lessonPath){
  var lesson = yamljs.load(lessonPath + "info.yml"),
      info = getInfoFromPath(lessonPath);

  lesson.id = info.lesson;
  lesson.index = info.language + "-" + info.quarterly + "-" + info.lesson;
  lesson.path = info.language + "/quarterlies/" + info.quarterly + "/lessons/" + info.lesson;
  lesson.full_path = API_HOST + API_VERSION + "/" + lesson.path;
  lesson.cover = API_HOST + API_VERSION + "/images/global/" + info.quarterly.slice(0, 7) + "/" + info.lesson + "/" + SOURCE_COVER_FILE;

  if (branch.toLowerCase() !== "master" && branch.toLowerCase() !== "stage"){
    lesson.cover = "/img/global/" + info.quarterly.slice(0, 7) + "/" + info.lesson + "/" + SOURCE_COVER_FILE;
  }

  try {
    fs.lstatSync(lessonPath + "/" + SOURCE_COVER_FILE);
    fs.copySync(lessonPath + "/" + SOURCE_COVER_FILE, DIST_DIR + lesson.path + "/" + SOURCE_COVER_FILE);
    lesson.cover = lesson.full_path + "/" + SOURCE_COVER_FILE;
  } catch (err) {}

  var days = daysAPI(lessonPath, JSON.parse(JSON.stringify(lesson)));

  // Firebase
  (function(lesson){
    firebaseDeploymentTasks.push(function(cb){
      db.ref(FIREBASE_DATABASE_LESSON_INFO).child(lesson.lesson.index).set(lesson, function(e){
        console.log('Deployment', lesson.lesson.index)
        cb(false, true);
      });
    });
  })({lesson: lesson, days: days});

  // API
  fs.outputFileSync(DIST_DIR + lesson.path + "/index.json", JSON.stringify({lesson: lesson, days: days}));

  return lesson;
};

var daysAPI = function(lessonPath, lesson){
  var days = [],
      files = glob.sync(lessonPath+"/*.md"),
      info = getInfoFromPath(lessonPath),
      assets = glob.sync(lessonPath+"/*.{png,jpg,jpeg}")

  for (var i = 0; i < assets.length; i++){
    fs.copySync(assets[i], DIST_DIR + info.language + "/quarterlies/" + info.quarterly + "/lessons/" + info.lesson + "/days/" + assets[i].replace(lessonPath, ""));
  }

  for (var i = 0; i < files.length; i++){
    days.push(dayAPI(files[i], lesson));
  }

  if (new RegExp(getCompilationQuarterValue()).test(info.quarterly.substring(0, 7))) {
    // Firebase
    (function(language, quarterly, lesson, days){
      firebaseDeploymentTasks.push(function(cb){
        db.ref(FIREBASE_DATABASE_DAYS).child(language + "-" + quarterly + "-" + lesson).set(days, function(e){
          cb(false, true);
        });
      });
    })(info.language, info.quarterly, info.lesson, days);

    // API
    fs.outputFileSync(DIST_DIR + info.language + "/quarterlies/" + info.quarterly + "/lessons/" + info.lesson + "/days/" + "index.json", JSON.stringify(days));
  }

  return days;
};

var dayAPI = function(dayPath, lesson){
  var _day = metaMarked(fs.readFileSync(dayPath, "utf-8"), {renderer: renderer}),
      info = getInfoFromPath(dayPath);

  readAPI(dayPath, _day, info, lesson);

  var day = _day.meta;
  day.id = info.day;
  day.index = info.language + "-" + info.quarterly + "-" + info.lesson + "-" + info.day;
  day.path = info.language + "/quarterlies/" + info.quarterly + "/lessons/" + info.lesson + "/days/" + info.day;
  day.full_path = API_HOST + API_VERSION + "/" + day.path;
  day.read_path = day.path + "/read";
  day.full_read_path = API_HOST + API_VERSION + "/" + day.read_path;

  // API
  fs.outputFileSync(DIST_DIR + day.path + "/index.json", JSON.stringify(day));

  return day;
};

var readAPI = function(dayPath, day, info, lesson){
  if (!(new RegExp(getCompilationQuarterValue()).test(info.quarterly.substring(0, 7)))) {
    return false;
  }
  var read = {};
  let meta = null;

  try {
    meta = JSON.parse(JSON.stringify(day.meta));
    meta.bible = [];
  } catch (e) {
    console.error('Error parsing this file: ', dayPath)
    return;
  }

  var quarterlyVariant = info.quarterly.substring(info.quarterly.lastIndexOf('-')+1);
  var iteratorArray = (BIBLE_PARSER_CONFIG[(info.language + '-' + quarterlyVariant)]) ? BIBLE_PARSER_CONFIG[(info.language + '-' + quarterlyVariant)] : BIBLE_PARSER_CONFIG[info.language];

  for (var bibleVersionIterator = 0; bibleVersionIterator < iteratorArray.length; bibleVersionIterator++){
    var bibleVersion = iteratorArray[bibleVersionIterator],
      resultRead = day.markdown,
      resultBible = {},
      language = info.language;

    if (bibleVersion.version) {
      language = bibleVersion.lang;
      bibleVersion = bibleVersion.version;
    }
    try {
      var result = bibleSearchBCV.search(language, bibleVersion, resultRead);
    } catch (err){}

    if (!result) continue;

    resultRead = result.output;

    resultBible["name"] = bibleVersion.toUpperCase();

    if (result.verses.length){
      resultBible["verses"] = result.verses.reduce(function(result,item){var key=Object.keys(item)[0]; result[key]=item[key]; return result;},{});
      meta.bible.push(resultBible);
    }
  }

  if (meta.bible.length <= 0){
    delete meta.bible;
  }

  read.id = info.day;
  read.date = day.meta.date;
  read.index = info.language + "-" + info.quarterly + "-" + info.lesson + "-" + info.day;
  read.title = day.meta.title;
  read.bible = meta.bible;

  if (!read.bible){
    read.bible = [{
      "name": "",
      "verses": {}
    }]
  }

  read.content = metaMarked(resultRead, {renderer: renderer}).html;
  read.content += copyrightNotice;

  (function(read){
    firebaseDeploymentTasks.push(function(cb){
      db.ref(FIREBASE_DATABASE_READ).child(read.index).set(read, function(e){
        cb(false, true);
      });
    })
  })(read);

  // API
  fs.outputFileSync(DIST_DIR + info.language + "/quarterlies/" + info.quarterly + "/lessons/" + info.lesson + "/days/" + info.day + "/read/" + "index.json", JSON.stringify(read));

  var _meta = JSON.parse(JSON.stringify(meta)),
      _lesson = JSON.parse(JSON.stringify(lesson));

  _meta.slug = slug(read.title);
  _meta.aliases = [info.language + "/" + info.quarterly + "/" + info.lesson + "/" + info.day];
  _meta.lesson = convertDatesForWeb(_lesson);
  _meta.cover = _lesson.cover;

  // Web
  fs.outputFileSync(WEB_DIR + info.language + "/" + info.quarterly + "/" + info.lesson + "/" + info.day + ".md", yamlify(convertDatesForWeb(_meta)) + resultRead + copyrightNotice);
};