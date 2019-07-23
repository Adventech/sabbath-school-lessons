#!/usr/bin/env node

/**
 * Created by vitalik on 16-10-15.
 */

var exec                = require('child_process').execSync,
    ent                 = require('ent'),
    metaMarked          = require("meta-marked"),
    fs                  = require("fs-extra"),
    yamljs              = require("yamljs"),
    fswf                = require("safe-write-file"),
    bibleSearch         = require("adventech-bible-tools"),
    bibleSearchBCV      = require("adventech-bible-tools/bible_tools_bcv"),
    bibleHelpers        = require("adventech-bible-tools/bible_helpers");

var firebase = require("firebase"),
    async = require("async");

var API_HOST = "https://sabbath-school.adventech.io/api/",
    API_VERSION = "v1",
    SOURCE_DIR = "src/",
    SOURCE_INFO_FILE = "info.yml",
    SOURCE_COVER_FILE = "cover.png",
    SOURCE_EXTENSION = "md",
    SOURCE_EXTENSION_BIBLE = "bible",
    QUARTERLY_COVER = "images/quarterly_cover.png",
    DIST_DIR = "dist/api/" + API_VERSION + "/",
    FIREBASE_DATABASE_LANGUAGES = "/api/" + API_VERSION + "/languages",
    FIREBASE_DATABASE_QUARTERLIES = "/api/" + API_VERSION + "/quarterlies",
    FIREBASE_DATABASE_QUARTERLY_INFO = "/api/" + API_VERSION + "/quarterly-info",
    FIREBASE_DATABASE_LESSONS = "/api/" + API_VERSION + "/lessons",
    FIREBASE_DATABASE_LESSON_INFO = "/api/" + API_VERSION + "/lesson-info",
    FIREBASE_DATABASE_DAYS = "/api/" + API_VERSION + "/days",
    FIREBASE_DATABASE_READ = "/api/" + API_VERSION + "/reads";

var BIBLE_PARSER_CONFIG = {
    "ar": [
        "svd"
    ],
    "bg": [
        "bg1940"
    ],

    "cs": [
        "kralicka-1613"
    ],

    "da": [
        "bph",
        "dn1933"
    ],

    "de": [
        "luth1545",
        "luth1912"
    ],

    "en": [
        "nasb",
        "nkjv",
        "kjv"
    ],

    "es": [
        "rvr1960"
    ],

    "fa": [
        "opv-1896"
    ],

    "fr": [
        "lsg"
    ],

    "he": [
        "em-1865"
    ],

    "ja": [
        "kougo-yaku",
        "jlb"
    ],

    "pt": [
        "arc",
        "nvi-pt"
    ],

    "in": [
        "alkitab"
    ],

    "ko": [
        "krv"
    ],

    "mk": [
        "MKB"
    ],

    "ms": [
        "alkitab"
    ],

    "ne": [
        "erv"
    ],

    "no": [
        "nb-bibelen-1930"
    ],

    "ro": [
        "rmnn"
    ],

    "ru": [
        "rusv"
    ],

    "sr": [
        "biblija"
    ],

    "tr": [
        "kitab"
    ],

    "uk": [
        "ukr"
    ],

    "zh": [
        "cuvs"
    ]
};

var BIBLE_PARSER_IGNORE_BCV = ["ja"];

var argv = require("optimist")
  .usage("Compile & deploy script - DON'T USE IF YOU DON'T KNOW WHAT IT DOES\n" +
  "Usage: $0 -l [string] -b [string]")
  .alias({"l": "lastModified", "b": "branch"})
  .describe({
    "l": "lastModified",
    "b": "branch"
  })
  .demand(["l", "b"])
  .argv;

var lastModified = argv.l,
    branch = argv.b;

if (branch.toLowerCase() == "master"){
  API_HOST = "https://sabbath-school.adventech.io/api/";
  firebase.initializeApp({
    databaseURL: "https://blistering-inferno-8720.firebaseio.com",
    serviceAccount: "deploy-creds.json",
    databaseAuthVariableOverride: {
      uid: "deploy"
    }
  });
  db = firebase.database();
} else if (branch.toLowerCase() == "stage") {
  API_HOST = "https://sabbath-school-stage.adventech.io/api/",
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
        set: function(){}
      }
    },

    goOffline: function(){}
  }
}

var firebaseDeploymentTasks = [];

var changeCheck = function(path){
  if (lastModified === "force"){
    return true;
  }
  return exec('git log '+lastModified+' '+path).toString().length>0;
};

String.prototype.customTrim = function(charlist) {
    var tmp = this.replace(new RegExp("^[" + charlist + "]+"), "");
    tmp = tmp.replace(new RegExp("[" + charlist + "]+$"), "")
    return tmp;
};

var create_languages_api = function(){
  /**
   * Creating languages API
   *
   * /api/v1/languages
   */
  var languages = [],
      _languages = fs.readdirSync(SOURCE_DIR);

  for (var i = 0; i < _languages.length; i++){
    if (!fs.lstatSync(SOURCE_DIR + _languages[i]).isDirectory()) continue;
    languages.push(yamljs.load(SOURCE_DIR + _languages[i] + "/" + SOURCE_INFO_FILE));
  }

  firebaseDeploymentTasks.push(function(cb){
    db.ref(FIREBASE_DATABASE_LANGUAGES).set(languages, function(e){
      cb(false, true);
    });
  });

  fswf(DIST_DIR + "/languages/index.json", JSON.stringify(languages));
  return languages;
};

var create_bible_references = function(path, language){
    var read = metaMarked(fs.readFileSync(path, "utf-8")),
        meta = read.meta;

    meta.bible = [];

    if (!(language in BIBLE_PARSER_CONFIG)) return;

    for (var bibleVersionIterator = 0; bibleVersionIterator < BIBLE_PARSER_CONFIG[language].length; bibleVersionIterator++){
        var bibleVersion = BIBLE_PARSER_CONFIG[language][bibleVersionIterator],
            bibleRegex = bibleSearch.getBibleRegex(language, bibleVersion),
            bibleReferenceMatches = read.markdown.match(new RegExp(bibleRegex.regex, "g")),
            resultRead = read.markdown,
            resultBible = {};

        resultBible["name"] = bibleVersion.toUpperCase();
        resultBible["verses"] = {};

        if (!bibleReferenceMatches) { continue; }

        bibleReferenceMatches = bibleReferenceMatches.sort(function(a,b){
            return b.length - a.length;
        });

        for (var j = 0; j < bibleReferenceMatches.length; j++){
            var verse = bibleReferenceMatches[j].customTrim(" .;,");
            var reference = bibleSearch.search(language, bibleVersion, verse),
                result = "";


            for (var k = 0; k < reference.results.length; k++){
                if (reference.results[k]["verses"]){
                    result += reference.results[k]["header"] + reference.results[k]["verses"];
                }
            }

            if (result.length){
                var firebaseReadyMatch = bibleReferenceMatches[j].replace(/\.|\#|\$|\/|\[|\]/g, '');
                resultBible["verses"][firebaseReadyMatch] = result;
                resultRead = resultRead.replace(new RegExp('(?!<a[^>]*?>)('+bibleReferenceMatches[j]+')(?![^<]*?</a>)', "g"), '<a class="verse" verse="'+firebaseReadyMatch+'">'+bibleReferenceMatches[j]+'</a>');
            }
        }

        if (Object.keys(resultBible["verses"]).length){
            meta.bible.push(resultBible);
        }

    }

    if (meta.bible.length <= 0){
        delete meta.bible;
    } else {
        fs.writeFileSync(path + "." + SOURCE_EXTENSION_BIBLE, "---\n" + yamljs.stringify(meta, 4) + "\n---" + resultRead);
    }
};

var create_bible_references_bcv = function(path, language){
    if (BIBLE_PARSER_IGNORE_BCV.indexOf(language) >= 0){
        create_bible_references(path, language);
        return;
    }

    var read = metaMarked(fs.readFileSync(path, "utf-8")),
        meta = read.meta;

    meta.bible = [];

    if (!(language in BIBLE_PARSER_CONFIG)) return;

    for (var bibleVersionIterator = 0; bibleVersionIterator < BIBLE_PARSER_CONFIG[language].length; bibleVersionIterator++){
        var bibleVersion = BIBLE_PARSER_CONFIG[language][bibleVersionIterator],
            resultRead = read.markdown,
            resultBible = {};

        try {
            var result = bibleSearchBCV.search(language, bibleVersion, resultRead);
        } catch (err){
            if (err.sender === "bibleParserBCVMissingLanguage"){
                create_bible_references(path, language);
            }
        }

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
    } else {
        fs.writeFileSync(path + "." + SOURCE_EXTENSION_BIBLE, "---\n" + yamljs.stringify(meta, 4) + "\n---" + resultRead);
    }
};

var create_days_api = function(language, quarterly, lesson){
  /**
   * Create Days API
   */

  var WORKING_DIR = SOURCE_DIR + language + "/" + quarterly + "/" + lesson,
      days = [],
      _days = fs.readdirSync(WORKING_DIR);

  // Custom inline level renderer.
  // For the purpose of decoding HTML entities inside code block
  // We use codeblock for different purpose :P

  var renderer = new metaMarked.noMeta.Renderer();
  renderer.codespan = function(text) {
    return '<code>' + ent.decode(text) + '</code>';
  };

  for (var i = 0; i < _days.length; i++){
    var extension = _days[i].split(".").pop(),
        _day = _days[i].replace("." + SOURCE_EXTENSION, "");
    if (extension != SOURCE_EXTENSION) continue;

    var _read, day, read, found_bible_edition = false, generated_bible_verse = false;

    try {
      fs.lstatSync(WORKING_DIR + "/" + _days[i] + "." + SOURCE_EXTENSION_BIBLE);
    } catch (err) {
      if (changeCheck(WORKING_DIR + "/" + _days[i]) && !generated_bible_verse) {
         create_bible_references_bcv(WORKING_DIR + "/" + _days[i], language);
         generated_bible_verse = true;
      }
    }

    try {
      fs.lstatSync(WORKING_DIR + "/" + _days[i] + "." + SOURCE_EXTENSION_BIBLE);
      _read = metaMarked(fs.readFileSync(WORKING_DIR + "/" + _days[i] + "." + SOURCE_EXTENSION_BIBLE, "utf-8"), {renderer: renderer});
      found_bible_edition = true;
    } catch (err) {
      _read = metaMarked(fs.readFileSync(WORKING_DIR + "/" + _days[i], "utf-8"), {renderer: renderer});
    }

    day = _read.meta;
    read = {};


    day.id = _day;
    day.index = language + "-" + quarterly + "-" + lesson + "-" + _day;
    day.path = language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/" + _day;
    day.full_path = API_HOST + API_VERSION + "/" + language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/" + _day;
    day.read_path = language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/" + _day + "/read";
    day.full_read_path = API_HOST + API_VERSION + "/" + language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/" + _day + "/read";

    read.id = day.id;
    read.date = day.date;
    read.index = day.index;
    read.title = day.title;
    read.bible = day.bible;

    if (!read.bible){
      read.bible = [{
        "name": "",
        "verses": {}
      }]
    }

    read.content = _read.html;

    delete day.bible;

    days.push(day);

    if (found_bible_edition && !generated_bible_verse) {
      if (!changeCheck(WORKING_DIR + "/" + _days[i]) && !changeCheck(WORKING_DIR + "/" + _days[i] + "." + SOURCE_EXTENSION_BIBLE)) continue;
    } else {
      if (!changeCheck(WORKING_DIR + "/" + _days[i])) continue;
    }

    fswf(DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/" + _day + "/index.json", JSON.stringify(day));
    fswf(DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/" + _day + "/read/index.json", JSON.stringify(read));
    //fswf(DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/" + _day + "/read/index.html", read.content);

    (function(child, data){
      firebaseDeploymentTasks.push(function(cb){
        db.ref(FIREBASE_DATABASE_READ).child(child).set(data, function(e){
          cb(false, true);
        });
      })
    })(day.index, read);
  }

  firebaseDeploymentTasks.push(function(cb){
    db.ref(FIREBASE_DATABASE_DAYS).child(language + "-" + quarterly + "-" + lesson).set(days, function(e){
      cb(false, true);
    });
  });

  fswf(DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/" + lesson + "/days/index.json", JSON.stringify(days));
  return days;
};

var create_lessons_api = function(language, quarterly){
  /**
   * Create Lessons API
   * language - @type {string}
   */

  var WORKING_DIR = SOURCE_DIR + language + "/" + quarterly,
      lessons = [],
      _lessons = fs.readdirSync(WORKING_DIR);

  for (var i = 0; i < _lessons.length; i++){
    if (!fs.lstatSync(WORKING_DIR + "/" + _lessons[i]).isDirectory()) continue;
    var lesson = {};
    lesson.lesson = yamljs.load(WORKING_DIR + "/" + _lessons[i] + "/" + SOURCE_INFO_FILE);
    lesson.lesson.id = _lessons[i];
    lesson.lesson.index = language + "-" + quarterly + "-" + _lessons[i];
    lesson.lesson.path = language + "/quarterlies/" + quarterly + "/lessons/" + _lessons[i];
    lesson.lesson.full_path = API_HOST + API_VERSION + "/" + language + "/quarterlies/" + quarterly + "/lessons/" + _lessons[i];
    lesson.lesson.cover = "";

    try {
      fs.lstatSync(WORKING_DIR + "/" + _lessons[i] + "/" + SOURCE_COVER_FILE);
      fs.copySync(WORKING_DIR + "/" + _lessons[i] + "/" + SOURCE_COVER_FILE, DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/" + _lessons[i] + "/" + SOURCE_COVER_FILE);
      lesson.lesson.cover = API_HOST + API_VERSION + "/" + lesson.lesson.path + "/" + SOURCE_COVER_FILE + "?"+ Math.round((new Date()).getTime() / 1000);
    } catch (err) {
        try {
            var q = quarterly.substring(0, 7);
            fs.lstatSync("images/global/" + q + "/" + _lessons[i] + "/" + SOURCE_COVER_FILE);
            fs.copySync("images/global/" + q + "/" + _lessons[i] + "/" + SOURCE_COVER_FILE, DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/" + _lessons[i] + "/" + SOURCE_COVER_FILE);
            lesson.lesson.cover = API_HOST + API_VERSION + "/" + lesson.lesson.path + "/" + SOURCE_COVER_FILE + "?"+ Math.round((new Date()).getTime() / 1000);
        } catch (err3) {}
    }

    lesson.days = create_days_api(language, quarterly, _lessons[i]);

    lessons.push(lesson.lesson);

    if (!changeCheck(WORKING_DIR + "/" + _lessons[i])) continue;

    fswf(DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/" + _lessons[i] + "/index.json", JSON.stringify(lesson));

    (function(child, data){
      firebaseDeploymentTasks.push(function(cb){
        db.ref(FIREBASE_DATABASE_LESSON_INFO).child(child).set(data, function(e){
          cb(false, true);
        });
      });
    })(lesson.lesson.index, lesson);
  }

  firebaseDeploymentTasks.push(function(cb){
    db.ref(FIREBASE_DATABASE_LESSONS).child(language + "-" + quarterly).set(lessons, function(e){
      cb(false, true);
    });
  });

  fswf(DIST_DIR + language + "/quarterlies/" + quarterly + "/lessons/index.json", JSON.stringify(lessons));
  return lessons;
};

var create_quarterlies_api = function(language){
  /**
   * Create Quarterlies API
   * @type {string} language code. Ex: 'en'
   */
  var WORKING_DIR = SOURCE_DIR + language,
      quarterlies = [],
      _quarterlies = fs.readdirSync(WORKING_DIR).sort(function(a, b){
        if (a.length === 7) a = a + "_";
        if (a < b) return -1;
        if (a > b) return 1;

        return 0;
      }).reverse();

  for (var i = 0; i < _quarterlies.length; i++){
    if (!fs.lstatSync(WORKING_DIR + "/" + _quarterlies[i]).isDirectory()) continue;

    try {
      fs.lstatSync(WORKING_DIR + "/" + _quarterlies[i] + "/" + SOURCE_COVER_FILE);
      fs.copySync(WORKING_DIR + "/" + _quarterlies[i] + "/" + SOURCE_COVER_FILE, DIST_DIR + language + "/quarterlies/" + _quarterlies[i] + "/" + SOURCE_COVER_FILE);
    } catch (err){
      fs.copySync(QUARTERLY_COVER, DIST_DIR + language + "/quarterlies/" + _quarterlies[i] + "/" + SOURCE_COVER_FILE);
    }

    var quarterly = {};
    quarterly.quarterly = yamljs.load(WORKING_DIR + "/" + _quarterlies[i] + "/" + SOURCE_INFO_FILE);
    quarterly.quarterly.lang = language;
    quarterly.quarterly.id = _quarterlies[i];
    quarterly.quarterly.index = language + "-" + _quarterlies[i];
    quarterly.quarterly.path = language + "/quarterlies/" + _quarterlies[i];
    quarterly.quarterly.full_path = API_HOST + API_VERSION + "/" + language + "/quarterlies/" + _quarterlies[i];
    quarterly.quarterly.cover = API_HOST + API_VERSION + "/" + quarterly.quarterly.path + "/" + SOURCE_COVER_FILE + "?"+ Math.round((new Date()).getTime() / 1000);

    quarterly.lessons = create_lessons_api(language, _quarterlies[i]);

    quarterlies.push(quarterly.quarterly);

    if (!changeCheck(WORKING_DIR + "/" + _quarterlies[i])) continue;

    fswf(DIST_DIR + language + "/quarterlies/" + _quarterlies[i] + "/index.json", JSON.stringify(quarterly));

    (function(child, data){
      firebaseDeploymentTasks.push(function(cb){
        db.ref(FIREBASE_DATABASE_QUARTERLY_INFO).child(child).set(data, function(e){
          cb(false, true);
        });
      });
    })(quarterly.quarterly.index, quarterly);
  }

  firebaseDeploymentTasks.push(function(cb){
    db.ref(FIREBASE_DATABASE_QUARTERLIES).child(language).set(quarterlies, function(e){
      cb(false, true);
    });
  });

  fswf(DIST_DIR + language + "/quarterlies/index.json", JSON.stringify(quarterlies));
  return quarterlies;
};

if (changeCheck(SOURCE_DIR)){
  var languages = create_languages_api();

  for (var i = 0; i < languages.length; i++){
    create_quarterlies_api(languages[i].code);
  }

// Not syncing with Firebase if not run with argument. Argument is commit range
  if (lastModified){
    async.series(firebaseDeploymentTasks,
      function(err, results) {
        db.goOffline();
      });
  } else {
    db.goOffline();
  }
} else {
  db.goOffline();
}