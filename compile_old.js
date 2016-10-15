#!/usr/bin/env node
var metaMarked =    require("meta-marked"),
    fs =            require("fs-extra"),
    yamljs =        require("yamljs"),
    fswf =          require("safe-write-file");

var SOURCE_PATH = "src/",
    SOURCE_INFO_FILE = "info.yml",
    SOURCE_EXTENSION = "md",
    SOURCE_COVER_FILE = "cover.png",
    DIST_PATH = "dist/api/v1/",
    DIST_INFO_FILE = "index.json",
    DIST_COVER_FILE = "cover.png",
    DIST_EXTENSION = "json",
    DIST_EXTENSION_ALT = "html";

var crypto = require("crypto");

function createChecksum(str){
  return crypto
    .createHash("sha256")
    .update(str, "utf8")
    .digest("hex")
}


var processLang = function(path){
  var quarterlies = fs.readdirSync(path).reverse(),
      lang_info = [];

  for (var i = 0; i < quarterlies.length; i++){
    var quarterly_path = path + "/" + quarterlies[i],
        quarterly_path_dist = path + "/quarterlies/" + quarterlies[i];
    if (!fs.lstatSync(quarterly_path).isDirectory()) continue;
    if (!fs.lstatSync(quarterly_path + "/" + SOURCE_INFO_FILE).isFile()) continue;
    if (!fs.lstatSync(quarterly_path + "/" + SOURCE_COVER_FILE).isFile()) continue;

    var quarterly = fs.readdirSync(quarterly_path);

    var quarterly_info = {};
    quarterly_info.quarter = yamljs.load(quarterly_path + "/" + SOURCE_INFO_FILE);
    quarterly_info.quarter.id = quarterlies[i];
    quarterly_info.quarter.cover = quarterly_path_dist.replace(SOURCE_PATH, "") + "/" + DIST_COVER_FILE;

    var lessons_info = [];

    fs.copySync(quarterly_path + "/" + SOURCE_COVER_FILE, quarterly_path_dist.replace(SOURCE_PATH, DIST_PATH) + "/" + DIST_COVER_FILE);


    for (var j = 0; j < quarterly.length; j++){
      var lesson_dir = quarterly_path + "/" + quarterly[j],
          lesson_dir_dist = quarterly_path_dist + "/"  + quarterly[j];
      if (!fs.lstatSync(lesson_dir).isDirectory()) continue;

      var lessons = fs.readdirSync(lesson_dir);

      var lesson_md_info = {};
      lesson_md_info.lesson = yamljs.load(lesson_dir + "/" + SOURCE_INFO_FILE);
      lesson_md_info.lesson.id = quarterly[j];
      lesson_md_info.days = [];

      var days_info = [];

      for (var k = 0; k < lessons.length; k++){
        var extension = lessons[k].split(".").pop();
        if (extension != SOURCE_EXTENSION) continue;

        var day_path = lesson_dir_dist.replace(SOURCE_PATH, DIST_PATH) + "/" + lessons[k].replace(SOURCE_EXTENSION, DIST_EXTENSION),
          day_path_alt  = lesson_dir_dist.replace(SOURCE_PATH, DIST_PATH) + "/" + lessons[k].replace(SOURCE_EXTENSION, DIST_EXTENSION_ALT),
          lesson_md = metaMarked(fs.readFileSync(lesson_dir + "/" + lessons[k], "utf-8"));

        days_info.push(lesson_md.meta);

        var lesson_contents = {};

        lesson_contents = lesson_md.meta;
        lesson_contents.id = lesson_dir.replace(SOURCE_PATH, "") + "/" + lessons[k].replace("."+SOURCE_EXTENSION, "");
        lesson_contents.html = lesson_md.html;


        fswf(day_path, JSON.stringify(lesson_contents));
        //fswf(day_path_alt, lesson_contents.html);
        delete lesson_contents.html;

      }
      fswf(lesson_dir_dist.replace(SOURCE_PATH, DIST_PATH) + "/days/" + DIST_INFO_FILE, JSON.stringify(days_info));
      lesson_md_info.days = days_info;
      fswf(quarterly_path_dist.replace(SOURCE_PATH, DIST_PATH) + "/" + quarterly[j] + "/" + DIST_INFO_FILE, JSON.stringify(lesson_md_info));
      lessons_info.push(lesson_md_info.lesson);
    }
    fswf(quarterly_path_dist.replace(SOURCE_PATH, DIST_PATH) + "/lessons/" + DIST_INFO_FILE, JSON.stringify(lessons_info));
    quarterly_info.lessons = lessons_info;
    fswf(quarterly_path_dist.replace(SOURCE_PATH, DIST_PATH) + "/" + DIST_INFO_FILE, JSON.stringify(quarterly_info));

    lang_info.push(quarterly_info.quarter);
  }


  lang_info.checksum = createChecksum(JSON.stringify(lang_info));
  lang_info.lastModified = Date.now();
  fswf(path.replace(SOURCE_PATH, DIST_PATH) + "/quarterlies/" + DIST_INFO_FILE, JSON.stringify(lang_info));
};


var languages = fs.readdirSync(SOURCE_PATH),
    languages_info = [];

for (var i = 0; i < languages.length; i++){
  if (!fs.lstatSync(SOURCE_PATH + languages[i]).isDirectory()) continue;
  processLang(SOURCE_PATH + languages[i]);
  languages_info.push(languages[i]);
}

fswf(DIST_PATH+ "/languages/" + DIST_INFO_FILE, JSON.stringify(languages_info));