#!/usr/bin/env node
var metaMarked =    require("meta-marked"),
    fs =            require("fs-extra"),
    yamljs =        require("yamljs"),
    fswf =          require("safe-write-file");

var SOURCE_PATH = "src/",
    SOURCE_INFO_FILE = "info.yml",
    SOURCE_EXTENSION = "md",
    SOURCE_COVER_FILE = "cover.png",
    DIST_PATH = "dist/",
    DIST_INFO_FILE = "info.json",
    DIST_COVER_FILE = "cover.png",
    DIST_EXTENSION = "json";

var crypto = require("crypto");

function createChecksum(str){
  return crypto
    .createHash("sha256")
    .update(str, "utf8")
    .digest("hex")
}


var processLang = function(path){
  var quarterlies = fs.readdirSync(path).reverse(),
      lang_info = { "quarterlies": [] };

  for (var i = 0; i < quarterlies.length; i++){
    var quarterly_path = path + "/" + quarterlies[i];
    if (!fs.lstatSync(quarterly_path).isDirectory()) continue;
    if (!fs.lstatSync(quarterly_path + "/" + SOURCE_INFO_FILE).isFile()) continue;
    if (!fs.lstatSync(quarterly_path + "/" + SOURCE_COVER_FILE).isFile()) continue;

    var quarterly = fs.readdirSync(quarterly_path);

    var quarterly_info = yamljs.load(quarterly_path + "/" + SOURCE_INFO_FILE);
    quarterly_info.id = quarterly_path.replace(SOURCE_PATH, "");
    quarterly_info.lessons = [];

    fs.copySync(quarterly_path + "/" + SOURCE_COVER_FILE, quarterly_path.replace(SOURCE_PATH, DIST_PATH) + "/" + DIST_COVER_FILE);
    quarterly_info.cover = quarterly_path.replace(SOURCE_PATH, "") + "/" + DIST_COVER_FILE;

    for (var j = 0; j < quarterly.length; j++){
      var lesson_dir = quarterly_path + "/" + quarterly[j];
      if (!fs.lstatSync(lesson_dir).isDirectory()) continue;

      var lessons = fs.readdirSync(lesson_dir);

      var lesson_md_info = yamljs.load(lesson_dir + "/" + SOURCE_INFO_FILE);
      lesson_md_info.days = [];

      for (var k = 0; k < lessons.length; k++){
        var extension = lessons[k].split(".").pop();
        if (extension != SOURCE_EXTENSION) continue;

        var day_path = lesson_dir.replace(SOURCE_PATH, DIST_PATH) + "/" + lessons[k].replace(SOURCE_EXTENSION, DIST_EXTENSION),
          lesson_md = metaMarked(fs.readFileSync(lesson_dir + "/" + lessons[k], "utf-8"));

        lesson_md.meta.path = day_path.replace(DIST_PATH, "");
        lesson_md_info.days.push(lesson_md.meta);

        var lesson_contents = {};
        lesson_contents = lesson_md.meta;
        lesson_contents.html = lesson_md.html;

        lesson_contents.checksum = createChecksum(JSON.stringify(lesson_contents));
        lesson_contents.last_modified = Date.now();
        fswf(day_path, JSON.stringify(lesson_contents));
        delete lesson_contents.html;

      }

      lesson_md_info.checksum = createChecksum(JSON.stringify(lesson_md_info));
      lesson_md_info.last_modified = Date.now();
      fswf(quarterly_path.replace(SOURCE_PATH, DIST_PATH) + "/" + "/" + quarterly[j] + "/" + DIST_INFO_FILE, JSON.stringify(lesson_md_info));
      delete lesson_md_info.days;
      lesson_md_info.path = quarterly_path.replace(SOURCE_PATH, "") + "/" + quarterly[j] + "/" + DIST_INFO_FILE;
      quarterly_info.lessons.push(lesson_md_info);
    }

    quarterly_info.path = quarterly_path.replace(SOURCE_PATH, "") + "/" + DIST_INFO_FILE;

    quarterly_info.checksum = createChecksum(JSON.stringify(quarterly_info));
    quarterly_info.last_modified = Date.now();
    fswf(quarterly_path.replace(SOURCE_PATH, DIST_PATH) + "/" + DIST_INFO_FILE, JSON.stringify(quarterly_info));
    delete quarterly_info.lessons;
    lang_info.quarterlies.push(quarterly_info);
  }


  lang_info.checksum = createChecksum(JSON.stringify(lang_info));
  lang_info.last_modified = Date.now();
  fswf(path.replace(SOURCE_PATH, DIST_PATH) + "/" + DIST_INFO_FILE, JSON.stringify(lang_info));
};


var languages = fs.readdirSync(SOURCE_PATH),
    api_info = {
      "languages": []
    };

for (var i = 0; i < languages.length; i++){
  if (!fs.lstatSync(SOURCE_PATH + languages[i]).isDirectory()) continue;
  processLang(SOURCE_PATH + languages[i]);
  api_info.languages.push(languages[i]);

}


api_info.checksum = createChecksum(JSON.stringify(api_info));
api_info.last_modified = Date.now();
fswf(DIST_PATH+ "/" + DIST_INFO_FILE, JSON.stringify(api_info));

