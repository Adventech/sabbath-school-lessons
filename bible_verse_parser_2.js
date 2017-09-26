#!/usr/bin/env node
var argv = require("optimist")
    .usage("Parse .md files for bible verses.\n" +
        "Usage: $0 -p [string] -l [string]")
    .alias({"p": "path"})
    .describe({
        "p": "Path to scan for .md files and parse. Not recursive",
        "l": "Parse language"
    })
    .demand(["p"])
    .default({ "l" : "en" })
    .argv;

var fs            = require("fs"),
    metaMarked    = require("meta-marked"),
    fswf          = require("safe-write-file"),
    yamljs        = require("yamljs"),
    bibleSearch   = require("adventech-bible-tools");

String.prototype.customTrim = function(charlist) {
    var tmp = this.replace(new RegExp("^[" + charlist + "]+"), "");
    tmp = tmp.replace(new RegExp("[" + charlist + "]+$"), "")
    return tmp;
};

var config = {
    "bg": [
        "bg1940"
    ],
    "da": [
        "bph",
        "dn1933"
    ],
    "en": [
        "nasb",
        "nkjv",
        "kjv"
    ],

    "fr": [
        "lsg"
    ],

    "ja": [
        "kougo-yaku",
        "jlb"
    ],

    "in": [
        "alkitab"
    ],

    "ro": [
        "rmnn"
    ],

    "ru": [
        "rusv"
    ],

    "tr": [
        "kitab"
    ],

    "zh": [
        "cuvs"
    ]
};

var SOURCE_EXTENSION = "md";

function processParsing (path){
    var mds = fs.readdirSync(path);

    for (var i = 0; i < mds.length; i++) {
        var extension = mds[i].split(".").pop();
        if (extension !== SOURCE_EXTENSION) continue;

        var read = metaMarked(fs.readFileSync(path + mds[i], "utf-8")),
            meta = read.meta;

        meta.bible = [];

        for (var bibleVersionIterator = 0; bibleVersionIterator < config[argv.l].length; bibleVersionIterator++){
            var lang = argv.l,
                bibleVersion = config[lang][bibleVersionIterator],
                bibleRegex = bibleSearch.getBibleRegex(lang, bibleVersion),
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
                var reference = bibleSearch.search(lang, bibleVersion, verse),
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
            fswf(path + "/" + mds[i] + ".bible", "---\n" + yamljs.stringify(meta, 4) + "\n---" + resultRead);
        }
    }
}

processParsing(argv.p);
