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

const execSync = require("child_process").execSync;

function checkPathForVerses(path, lang){
    var contentFiles = fs.readdirSync(path);

    for (var i = 0; i < contentFiles.length; i++) {
        var extension = contentFiles[i].split(".").pop();
        if (extension !== SOURCE_EXTENSION) continue;

        var lang_match = path.match(/src\/([a-z]{2})\//);

        if (lang_match){
            var lang = lang_match[1];

            var read_english = metaMarked(fs.readFileSync(path.replace(lang_match[0], 'src/en/').replace("-hant", "") + "/" + contentFiles[i], "utf-8"));
            // var read_lang = metaMarked(fs.readFileSync(path + "/" + contentFiles[i], "utf-8"));

            var bible_verses_english = bibleSearchBCV.search("en", "nkjv", read_english.markdown, true);

            var bible_verses_english_output = bible_verses_english.output.trim();

            fs.writeFileSync("./a.txt", bible_verses_english_output);

            var output = execSync("python ~/Downloads/nltk/sentence.py").toString().trim();

            console.log(JSON.parse(output));

            // var bible_verses_lang = bibleSearchBCV.search(lang, "em-1865", read_lang.markdown);
        }
    }
}

checkPathForVerses(argv.p);