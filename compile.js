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
    DIST_EXTENSION = "html",
    DIST_S3 = "https://s3-us-west-2.amazonaws.com/com.cryart.sabbathschool";


var processLang = function(path){
  var quarterlies = fs.readdirSync(path).reverse(),
      lang_info = [];

  for (var i = 0; i < quarterlies.length; i++){
    var quarterly_path = path + "/" + quarterlies[i];
    if (!fs.lstatSync(quarterly_path).isDirectory()) continue;
    if (!fs.lstatSync(quarterly_path + "/" + SOURCE_INFO_FILE).isFile()) continue;
    if (!fs.lstatSync(quarterly_path + "/" + SOURCE_COVER_FILE).isFile()) continue;

    var quarterly = fs.readdirSync(quarterly_path);

    var quarterly_info = yamljs.load(quarterly_path + "/" + SOURCE_INFO_FILE);
    quarterly_info.lessons = [];

    fs.copySync(quarterly_path + "/" + SOURCE_COVER_FILE, quarterly_path.replace(SOURCE_PATH, DIST_PATH) + "/" + DIST_COVER_FILE);
    quarterly_info.cover = DIST_S3 + "/" + quarterly_path.replace(SOURCE_PATH, "") + "/" + DIST_COVER_FILE;

    for (var j = 0; j < quarterly.length; j++){
      var extension = quarterly[j].split(".").pop();
      if (extension != SOURCE_EXTENSION) continue;

      var day_path = quarterly_path.replace(SOURCE_PATH, DIST_PATH) + "/" + quarterly[j].replace(SOURCE_EXTENSION, DIST_EXTENSION),
          quarterly_md = metaMarked(fs.readFileSync(quarterly_path + "/" + quarterly[j], "utf-8"));

      fswf(day_path, quarterly_md.html);
      quarterly_md.meta.path = DIST_S3 + "/" + quarterly_path.replace(SOURCE_PATH, "") + "/" + quarterly[j].replace(SOURCE_EXTENSION, DIST_EXTENSION);
      quarterly_info.lessons.push(quarterly_md.meta);
    }
    lang_info.push(quarterly_info);

  }

  fswf(path.replace(SOURCE_PATH, DIST_PATH) + "/" + DIST_INFO_FILE, JSON.stringify(lang_info));
};

var languages = fs.readdirSync(SOURCE_PATH);

for (var i = 0; i < languages.length; i++){
  if (!fs.lstatSync(SOURCE_PATH + languages[i]).isDirectory()) continue;
  processLang(SOURCE_PATH + languages[i]);
}


