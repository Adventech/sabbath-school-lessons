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

var config = {
    "en": [
        "nkjv",
        "kjv"
    ],

    "ja": [
        "jlb"
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
                bibleReferenceMatches = read.markdown.match(new RegExp(bibleRegex.regex, "ig")),
                resultRead = read.markdown,
                resultBible = {};

            resultBible["name"] = bibleVersion.toUpperCase();
            resultBible["verses"] = {};

            if (!bibleReferenceMatches) { continue; }

            bibleReferenceMatches = bibleReferenceMatches.sort(function(a,b){
                return b.length - a.length;
            });

            for (var j = 0; j < bibleReferenceMatches.length; j++){
                var verse = bibleReferenceMatches[j].trim();
                var reference = bibleSearch.search(lang, bibleVersion, verse);

                if (reference["verses"]){
                    resultBible["verses"][verse] = reference["header"] + reference["verses"];
                    resultRead = resultRead.replace(new RegExp('(?!<a[^>]*?>)('+bibleReferenceMatches[j]+')(?![^<]*?</a>)', "g"), '<a class="verse" verse="'+bibleReferenceMatches[j]+'">'+bibleReferenceMatches[j]+'</a>');
                }
            }

            meta.bible.push(resultBible);
        }

        if (meta.bible.length <= 0){
            delete meta.bible;
        } else {
            fswf(path + "/" + mds[i] + ".bible", "---\n" + yamljs.stringify(meta, 4) + "\n---" + resultRead);
        }
    }
}

processParsing(argv.p);