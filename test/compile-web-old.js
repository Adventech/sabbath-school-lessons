var fs                  = require("fs-extra"),
    fswf                = require("safe-write-file"),
    metaMarked          = require("meta-marked"),
    yamljs              = require("yamljs"),
    moment              = require("moment"),
    changeCase          = require('change-case'),
    bibleSearchBCV      = require("adventech-bible-tools/bible_tools_bcv");

var SOURCE_EXTENSION    = "md",
    SOURCE              = "src/",
    DEST                = "./web/content/";

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

var slug = function(input){
    var s = changeCase.lower(input).replace(/ /g, "-");
    return s;
};

var quarterlyInfoCache = [],
    quarterlyLanguageCache = [];

var walkSync = function(dir, filelist) {
    var files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(dir + file).isDirectory()) {

            if ((dir+file).match(/src\/([a-z]{2})$/)){
                var quarterlies = fs.readdirSync(dir+file),
                    quarterliesOutput = {
                        quarterlies: [],
                        type: "quarterly"
                    };

                quarterlies.sort(function(a, b){
                    if (a.length === 7) a = a + "_";
                    if (a < b) return -1;
                    if (a > b) return 1;

                    return 0;
                }).reverse();

                quarterlies.forEach(function(quarterly) {
                    if (fs.statSync(dir + file+"/"+quarterly).isDirectory()){
                        try {
                            var quarterlyInfo = yamljs.load(dir+file+"/"+quarterly+"/info.yml");

                            quarterlyInfo.cover = "https://sabbath-school.adventech.io/api/v1/"
                                +  (dir+file+"/"+quarterly).replace(SOURCE, "").replace(/([a-z]{2})\/(.*)$/g, "$1/quarterlies/$2/")
                                + "cover.png";
                            quarterlyInfo.start_date = moment(quarterlyInfo.start_date, "DD/MM/YYYY").format("YYYY-MM-DD");
                            quarterlyInfo.end_date = moment(quarterlyInfo.end_date, "DD/MM/YYYY").format("YYYY-MM-DD");
                            quarterlyInfo.path = (dir+file+"/"+quarterly).replace(SOURCE, "");

                            quarterliesOutput.quarterlies.push(quarterlyInfo);
                        } catch(err){}
                    }
                });
                fs.outputFileSync((dir+file).replace(SOURCE, DEST)+"/_index.md", "---\n" + yamljs.stringify(quarterliesOutput, 4) + "\n---" );

            }

            if ((dir+file).match(/src\/([a-z]{2})\/([0-9a-z\-]{4,})$/)){
                if (quarterlyInfoCache.indexOf(dir+file)<0){
                    quarterlyInfoCache.push(dir+file);
                    var quarterlyInfo = yamljs.load(dir+file+"/info.yml");
                    quarterlyInfo.type = "lesson";
                    quarterlyInfo.cover = "https://sabbath-school.adventech.io/api/v1/"
                        +  (dir+file).replace(SOURCE, "").replace(/([a-z]{2})\/(.*)$/g, "$1/quarterlies/$2/")
                        + "cover.png";
                    quarterlyInfo.start_date = moment(quarterlyInfo.start_date, "DD/MM/YYYY").format("YYYY-MM-DD");
                    quarterlyInfo.end_date = moment(quarterlyInfo.end_date, "DD/MM/YYYY").format("YYYY-MM-DD");
                    fs.outputFileSync((dir+file).replace(SOURCE, DEST)+"/_index.md", "---\n" + yamljs.stringify(quarterlyInfo, 4) + "\n---" );
                }
            }

            filelist = walkSync(dir + file + '/', filelist);
        } else {
            var extension = file.split(".").pop();

            if ((dir+file).match(/src\/([a-z]{2})\/(.*)\/([0-9]{2})\/info\.yml/)){
                var quarterlyInfoFile = (dir+file).replace(/src\/([a-z]{2})\/(.*)\/([0-9]{2})\/info\.yml/, DEST+"$1/$2/_index.md");
                try {
                    var quarterlyInfo = metaMarked(fs.readFileSync(quarterlyInfoFile, "utf-8")),
                        lessonInfo = yamljs.load(dir+file);

                    if (!quarterlyInfo.meta.lessons) {
                        quarterlyInfo.meta.lessons = [];
                    }

                    lessonInfo.path = (dir+file).replace(SOURCE, "").replace("/info.yml", "");
                    lessonInfo.path_index = (dir+file).replace(SOURCE, "").replace("info.yml", "01");
                    lessonInfo.start_date = moment(lessonInfo.start_date, "DD/MM/YYYY").format("YYYY-MM-DD");
                    lessonInfo.end_date = moment(lessonInfo.end_date, "DD/MM/YYYY").format("YYYY-MM-DD");

                    quarterlyInfo.meta.lessons.push(lessonInfo);

                    fs.outputFileSync(quarterlyInfoFile, "---\n" + yamljs.stringify(quarterlyInfo.meta, 4) + "\n---\n\n");
                } catch (err){
                    // console.log(err)
                }
            }

            if (extension === SOURCE_EXTENSION){

                var read = metaMarked(fs.readFileSync(dir + file, "utf-8")),
                    dest = dir.replace(SOURCE, DEST),
                    cover = "https://sabbath-school.adventech.io/api/v1/"
                        +  dir.replace(SOURCE, "").replace(/([a-z]{2})\/(.*)\/([0-9]{2})\//g, "$1/quarterlies/$2/lessons/$3/")
                        + "cover.png";

                read.meta.date = moment(read.meta.date, "DD/MM/YYYY").format("YYYY-MM-DD");
                read.meta.slug = slug(read.meta.title);
                read.meta.cover = cover;
                read.meta.bible = [];
                read.meta.aliases = [(dir+file).replace(SOURCE, "").replace("."+SOURCE_EXTENSION, "")]

                try {
                    var lessonInfo = yamljs.load(dir+"info.yml");
                    read.meta.lesson = lessonInfo;
                    read.meta.lesson.start_date = moment(read.meta.lesson.start_date, "DD/MM/YYYY").format("YYYY-MM-DD");
                    read.meta.lesson.end_date = moment(read.meta.lesson.end_date, "DD/MM/YYYY").format("YYYY-MM-DD");
                } catch (exception){}

                var language = dir.match(/src\/([a-z]{2})\/(.*)\/([0-9]{2})/);

                var resultRead = read.markdown;

                if (language){
                    language = language[1];

                    for (var bibleVersionIterator = 0; bibleVersionIterator < BIBLE_PARSER_CONFIG[language].length; bibleVersionIterator++){
                        var bibleVersion = BIBLE_PARSER_CONFIG[language][bibleVersionIterator],
                            resultRead = read.markdown,
                            resultBible = {};

                        try {
                            var result = bibleSearchBCV.search(language, bibleVersion, resultRead);
                        } catch (err){}

                        if (!result) continue;

                        resultRead = result.output;

                        resultBible["name"] = bibleVersion.toUpperCase();

                        if (result.verses.length){
                            resultBible["verses"] = result.verses.reduce(function(result,item){var key=Object.keys(item)[0]; result[key]=item[key]; return result;},{});
                            read.meta.bible.push(resultBible);
                        }
                    }
                }

                if (read.meta.bible.length <= 0){
                    delete read.meta.bible;
                }

                fswf(dest+file, "---\n" + yamljs.stringify(read.meta, 4) + "\n---" + resultRead);
            }
        }
    });
};

walkSync("src/");