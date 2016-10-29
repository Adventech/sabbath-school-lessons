#!/usr/bin/env node
var argv = require("optimist")
  .usage("Parse .md files for bible verses.\n" +
  "Usage: $0 -p [string] -l [string]")
  .alias({"p": "path"})
  .describe({
    "p": "Path to scan for .md files and parse. Not recursive",
    "l": "Parse language"
  })
  .demand(["f"])
  .default({ "l" : "en" })
  .argv;

var fs            = require("fs"),
    metaMarked    = require("meta-marked"),
    fswf          = require("safe-write-file"),
    yamljs        = require("yamljs"),
    parser        = require("./bible_parsers/bible_parser_"+argv.l);


var SOURCE_EXTENSION = "md";

function processParsing(path){
  var mds = fs.readdirSync(path);

  for (var i = 0; i < mds.length; i++) {
    var extension = mds[i].split(".").pop();
    if (extension != SOURCE_EXTENSION) continue;

    var read = metaMarked(fs.readFileSync(path + mds[i], "utf-8"));

    var tasks = [];

    (function(file, read){
      parser(read.markdown, function(result){

        var meta = read.meta,
          result_read;

        meta.bible = [];

        for (var i = 0; i < result.length; i++){
          if (!result_read){
            result_read = result[i].read;
          }

          delete result[i].read;
          meta.bible.push(result[i]);
        }
        fswf(path + "/" + file + ".bible", "---\n" + yamljs.stringify(meta, 4) + "\n---" + result_read);
      });
    })(mds[i], read);

  }
}

processParsing(argv.f);