#!/usr/bin/env node

/**
 */

var fs                  = require("fs-extra"),
    metaMarked          = require("meta-marked"),
    yamljs              = require("yamljs"),
    columnify           = require("columnify"),
    bibleSearchBCV      = require("adventech-bible-tools/bible_tools_bcv");

var SOURCE_EXTENSION = "md";

var argv = require("optimist")
    .usage("Celaner - cleanses Arabic, Persian and Hebrew content and optionally replaces numerals for Arabic and Persian\n" +
        "Usage: $0 -p [string]")
    .alias({"p": "path"})
    .describe({
        "p": "path"
    })
    .demand(["p"])
    .argv;

function reduceArray(input){
    return input.reduce(function(result, currentObject) {
        for(var key in currentObject) {
            if (currentObject.hasOwnProperty(key)) {
                result[key] = currentObject[key];
            }
        }
        return result;
    }, {});
}

function checkPathForVerses(path, lang){
    var contentFiles = fs.readdirSync(path);
    var columnObjects = [], columnObjectLang = {};

    for (var i = 0; i < contentFiles.length; i++) {
        var extension = contentFiles[i].split(".").pop();
        if (extension !== SOURCE_EXTENSION) continue;

        var lang_match = path.match(/src\/([a-z]{2})\//);

        if (lang_match){
            var lang = lang_match[1];

            var read_english = metaMarked(fs.readFileSync(path.replace(lang_match[0], 'src/en/').replace("-hant", "") + "/" + contentFiles[i], "utf-8"));
            var read_lang = metaMarked(fs.readFileSync(path + "/" + contentFiles[i], "utf-8"));

            var bible_verses_english = bibleSearchBCV.search("en", "nkjv", read_english.markdown);
            var bible_verses_lang = bibleSearchBCV.search(lang, "th-1971", read_lang.markdown);

            bible_verses_english.verses = reduceArray(bible_verses_english.verses);
            bible_verses_lang.verses = reduceArray(bible_verses_lang.verses);

            var columnObject = {};
            columnObject['path'] = path + "/" + contentFiles[i];
            columnObject['en'] = Object.keys(bible_verses_english.verses).join(" ");
            columnObject[lang] = Object.keys(bible_verses_lang.verses).join(" ");
            columnObjects.push(columnObject);
        }
    }
    var columns = columnify(
        columnObjects
    , {
        maxWidth: 50,
        minWidth: 50,

        columnSplitter: ' | ',
        config: {
            description: {maxWidth: 30}
        }
    });
    console.log(columns);
}

checkPathForVerses(argv.p);