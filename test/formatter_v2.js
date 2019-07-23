#!/usr/bin/env node

var fs                  = require("fs-extra"),
    cheerio             = require("cheerio"),
    moment              = require("moment"),
    async               = require("async"),
    redis               = require("redis"),
    request             = require("request"),
    changeCase          = require('change-case'),
    yamljs              = require("yamljs"),
    metaMarked          = require("meta-marked"),
    _                   = require('lodash'),
    execSync            = require('child_process').execSync;


var DATE_FORMAT = "DD/MM/YYYY";

String.prototype.customTrim = function(charlist) {
  var tmp = this.replace(new RegExp("^[" + charlist + "]+"), "");
  tmp = tmp.replace(new RegExp("[" + charlist + "]+$"), "")
  return tmp;
};

function pad(num, size) {
  var s = num+"";
  while (s.length < size) s = "0" + s;
  return s;
}

function ssMdQuestion (line) {
  return "`" + line + "`";
}

function ssMdUnderline (line) {
  return "_" + line + "_";
}

function ssMdBold (line) {
  return "**" + line + "**";
}

function ssMdInsideStory (line) {
  return "#### " + line;
}

function ssMdWeekVerses (weekVerseCaption, line) {
  return "### " + weekVerseCaption + "\n" + line;
}

function ssMdMemoryVerse (memVerseCaption, line) {
  return "> <p>" + memVerseCaption + "</p>\n> " + line;
}

function ssMdInitialOutput (title, date) {
  return "---\ntitle:  "+title+"\ndate:  "+moment(date).format(DATE_FORMAT)+"\n---";
}

function ssWriteInfo (destination, week, title, start) {
  fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
}

function ssWriteMd (destination, week, day, output) {
  fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
}

function cleanRussianEpub(path, destination) {
  var file = fs.readFileSync(path, "utf-8"),
      $ = cheerio.load(file, {decodeEntities: true});

  var lesson = [{}];

  lesson[0].title = $(".СШ_Lesson-Name").text();


  console.log($(".СШ_Lesson-Name").text());
  console.log($(".СШ_DAY_Lesson-Day-header").length);
}

function parseSpanish(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/09/2018", DATE_FORMAT);
  var week = 1;
  var day = 1;
  var title = "";
  for (var i = 0; i < 91; i++){
    var file = require(path + "/" + moment(start).format("YYYY-MM-DD")+".json");
    var output = "---\ntitle:  "+file.title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
    if (day === 1){
      title = file.title;
    }
    for (var j = 0; j < file.doc.length; j++){
      var doc = file.doc[j];
      if (doc.type !== "para" && doc.type !== "thought"){ continue; }

      if (doc.type === "thought"){
        output += "\n\n`" + doc.text+"`";
      } else if (doc.type === "para" && doc.lead > 0){
        output += "\n\n`" + doc.text+"`";
      } else {
        output += "\n\n" + doc.text;
      }
    }

    fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
    console.log(day)

    if ((day + 1) === 8){
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).add(-6, 'd').format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).format(DATE_FORMAT)+"\"");
      day = 1;
      week++;
    } else { day++; }
    start = moment(start).add(1, 'd');
  }
}

function parseEnglish(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/09/2018", DATE_FORMAT);
  var week = 1;
  var day = 1;
  var title = "";
  for (var i = 0; i < 91; i++){
    var file = require(path + "/" + moment(start).format("YYYY-MM-DD")+".json");
    var output = "---\ntitle:  "+file.title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
    if (day === 1){
      title = file.title;
    }
    for (var j = 0; j < file.doc.length; j++){
      var doc = file.doc[j];
      if ((doc.type !== "para" && doc.type !== "thought" && doc.type !== "inside_story") || doc.text.indexOf("Sabbath afternoon") === 0 ){ continue; }

      if (doc.type === "thought"){
        output += "\n\n`" + doc.text+"`";
      } else if (doc.type === "para" && doc.text.indexOf("Read") === 0 && doc.text.indexOf("?") > 0){
        output += "\n\n`" + doc.text+"`";
      } else if (doc.type === "para" && doc.text.indexOf("Read for This Week") === 0){
        output += "\n\n### " + doc.text;
      } else if (doc.type === "para" && doc.text.indexOf("Memory Text: ") === 0){
        output += "\n\n> <p>Memory Text</p>\n> " + doc.text.replace("Memory Text: ", "");
      } else if (doc.type === "para" && doc.text.indexOf("* Study this week’s lesson to prepare for Sabbath") === 0){
        output += "\n\n_" + doc.text + "_";
      } else if (doc.type === "para" && doc.text.indexOf("Discussion Questions:") === 0){
        output += "\n\n**Discussion Questions**";
      } else if (doc.type === "para" && doc.text.indexOf("\u2022") === 0 && day === 7){
        output += "\n\n`" + doc.text.replace("\u2022  ", "") + "`";
      } else if (doc.type === "para" && doc.text.indexOf("Summary:") === 0 && day === 7){
        output += "\n\n" + doc.text.replace("Summary:", "**Summary**:");
      } else if (doc.type === "para" && doc.text.indexOf("Provided by the General Conference Office") === 0 && day === 7){
        continue;
      } else if (doc.type === "inside_story") {
        var inside_story_output = "---\ntitle: Inside Story\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        for (var k = 0; k < doc.children.length; k++){
          inside_story_output += "\n\n" + doc.children[k].text;
        }
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/inside-story.md", inside_story_output);
      } else {
        output += "\n\n" + doc.text;
      }
    }

    fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
    console.log(day)

    if ((day + 1) === 8){
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).add(-6, 'd').format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).format(DATE_FORMAT)+"\"");
      day = 1;
      week++;
    } else { day++; }
    start = moment(start).add(1, 'd');
  }
}

function parseEnglishABSG(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);
  var week = 1;

  for (var i = 0; i < 13; i++){
    var day = 1;
    var file = fs.readFileSync(path +'/'+ pad(i+1,2) +".html", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});

    var title = $("#lesson-title").text().trim();
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");

    $(".page").each(function(j, e){
      var dayTitle = (day !== 1) ? $(e).find("h2").eq(1).text().trim() : title;
      if (day === 7) {
        dayTitle = "Further Thought"
      }
      if (day !== 1 && (title === dayTitle)) {
        dayTitle += ".";
      }
      var output = "---\ntitle:  "+dayTitle+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";

      $(e).children().each(function(jj, ee){
        var tag = $(ee).get(0).name;
        var text = $(ee).text().trim();

        if ($(ee).find("textarea").length) {
          output += "\n\n`" + text + "`";
        } else if (tag === "p") {
          if (text.indexOf("* Study this week’s lesson") === 0) {
            output += "\n\n_" + text + "_";
          } else if (text.indexOf("Discussion Questions") === 0) {
            output += "\n\n**" + text + "**";
          } else if (text.indexOf("Further Thought: ") === 0 && day === 7) {
            text = text.replace("Further Thought: ", "");
            output += "\n\n" + text;
          } else {
            output += "\n\n" + text;
          }
        } else if (tag === "h4") {
          output += "\n\n`" + text + "`";
        } else if (tag === "h3") {

          if (text.indexOf("Read for This Week’s Study") === 0) {
            output += "\n\n### Read for This Week’s Study\n" + text.replace("Read for This Week’s Study: ", "");
          } else if (text.indexOf("Memory Text") === 0) {
            output += "\n\n> <p>Memory Text</p>\n> " + text.replace("Memory Text: ", "");
          } else {
            output += "\n\n`" + text + "`";
          }
        } else if (tag === "ol") {
          $(ee).find("li").each(function(jjj, eee){
            output += "\n\n`" + $(eee).text().trim() + "`";
          });
        }
      });

      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);

      start = moment(start).add(1, 'd');
      day++;
    });

    week++;
  }
}

function parseChinese(path, destination){
  var file = fs.readFileSync(path, "utf-8").split("\n");
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2018", DATE_FORMAT);
  var week = 1;
  var day = 0;
  var output = "";
  var isTitle = false;

  for(var i = 0;i < file.length; i++){
    if (file[i].length <= 1) { continue; }
    if (/(  )+.*\d/.test(file[i])){
      start = moment(start).add(1, 'd');
      isTitle = true;

      if (day >= 7){
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
        week++;
        output = "";
        day = 0;
      }

      if (day > 0){
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
      }
      day++;

    } else {
      if (isTitle) {
        output = "---\ntitle:  "+file[i]+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        if (day === 1){
          fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+file[i]+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
        }
        isTitle = false;
      } else {
        output += "\n\n"+file[i];
      }
    }
    fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
  }
}

function parseItalian(path, destination, inside_story){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("30/03/2019", DATE_FORMAT);
  var week = 1;
  var day = 1;
  for(var i = 112; i <= 214; i++){
    var file = fs.readFileSync(path +"ScuolaDelSabato2019EpubFinale65-" + i + ".html", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});

    $(".Rosso-apice").remove();
    $("._idFootnoteLink").remove();

    $("a > [class^='testo-a-correre']").each(function() {
      $(this).insertBefore($(this).parent());
    });

    var output = "";
    // var title = $("p.Testata_titolo-fuori-gabbia").text().replace(/^\d+\. /g,'');

    if ($("p.tit-giorno").length) {
      var title = $("p.tit-giorno").text().replace(/^\d+\. /g,'').trim();
      output = "---\ntitle:  "+title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";

      if (day === 7 && week === 1 ){
        //console.log($("div.Cornice-di-testo-di-base").html())
      }

      if (inside_story && day === 8){
        title = "Finestra sulle missioni";
        output = "---\ntitle:  "+title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        output += "\n\n#### " + $(".Finestra-Missioni_Titolo-finestra-missinon").text();
        $(".Finestra-Missioni_Testo-Finestra-Missioni").each(function(i,e){
          output += "\n\n" + $(e).text();
        });
        output += "\n\n_" + $(".Finestra-Missioni_Autore-finestre-missioni").text().trim() + "_";
      } else {

        $("body > div[id^='_idContainer'] > p").each(function(i,e){

          if (
            !$(e).hasClass("tit-giorno")
            && !$(e).hasClass("data-giorno")
            && !$(e).hasClass("rif-preghiamo-per")
            && !$(e).hasClass("rif-meditazione")
            && !$(e).hasClass("settimana")
            && !($(e).hasClass("_idFootnotes") && day === 1)
            && !$(e).hasClass("rif-preghiamo-per")
            && !$(e).hasClass("tramonto-del-sole")
            && $(e).text().indexOf("o scaricate dal seguente link") < 0
            && $(e).text().indexOf("SdS video possono essere visionate") < 0
          ){

            if ($(e).hasClass("testo-a-correre")){
              output += "\n\n" + $(e).text();
            } else {
              if ($(e).hasClass("versetto-intro-sabato")){
                output += "\n\n> <p></p>\n> " + $(e).text();
              } else if ($(e).hasClass("letture-sabato")){
                output += "\n\n### Letture\n" + $(e).text().replace(/^Letture: /g, "");
              } else if ($(e).hasClass("tit-missione")) {
                output += "\n\n**Missione**";
              } else if ($(e).hasClass("punto-elenco-grassetto")){
                if (day === 7 && week === 1 ){
                  console.log($(e).text().trim())
                }
                output += "\n\n`" + $(e).text().trim() + '`';
              } else {
                output += "\n\n`" + $(e).text().trim() + '`';
              }
            }
          }
        });
      }

      if (day === 1) {
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
      } else if (inside_story && day === 8){
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/inside-story.md", output);
      } else {
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
      }

      day++;
      if ((inside_story && day === 9) || (!inside_story && day === 8)){
        day = 1;
        week++;
      }
      if (day <= 7){
        start = moment(start).add(1, 'd');
      }
    }
  }
}

function parseItalian2(path, tocFile, destination, inside_story){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);
  var week = 1;
  var day = 1;
  var TOC = fs.readFileSync(path + tocFile, "utf-8");
  var jqueryToc = cheerio.load(TOC, {decodeEntities: false});
  var tocLinks = [];

  jqueryToc('.sgc-toc-level-1 > a').each(function(i,e){
    var href = jqueryToc(e).attr('href');
    if (!href || i < 3 || tocLinks.length > 90) return;
    if (jqueryToc(e).text().indexOf('SCHEDA GUIDA') < 0) {
      tocLinks.push(href);
    }
  });

  // console.log(tocLinks); return;

  for(var i = 0; i < tocLinks.length; i++){
    var file = fs.readFileSync(path + tocLinks[i], "utf-8");

    var $ = cheerio.load(file, {decodeEntities: false});

    $(".Rosso-apice").remove();
    $("._idFootnoteLink").remove();

    $("a > [class^='testo-a-correre']").each(function() {
      $(this).insertBefore($(this).parent());
    });

    var output = "";
    // var title = $("p.Testata_titolo-fuori-gabbia").text().replace(/^\d+\. /g,'');

    if ($("p.tit-giorno").length) {
      var title = $("p.tit-giorno").text().replace(/^\d+\. /g,'').trim();
      console.log(title);
      output = "---\ntitle:  "+title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";

      if (day === 7 && week === 1 ){
        //console.log($("div.Cornice-di-testo-di-base").html())
      }

      if (inside_story && day === 8){
        title = "Finestra sulle missioni";
        output = "---\ntitle:  "+title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        output += "\n\n#### " + $(".Finestra-Missioni_Titolo-finestra-missinon").text();
        $(".Finestra-Missioni_Testo-Finestra-Missioni").each(function(i,e){
          output += "\n\n" + $(e).text();
        });
        output += "\n\n_" + $(".Finestra-Missioni_Autore-finestre-missioni").text().trim() + "_";
      } else {

        $("body > p").each(function(i,e){

          if (
            $(e).text().trim().length
            && !$(e).hasClass("tit-giorno")
            && !$(e).hasClass("data-giorno")
            && !$(e).hasClass("rif-preghiamo-per")
            && !$(e).hasClass("rif-meditazione")
            && !$(e).hasClass("settimana")
            && !($(e).hasClass("_idFootnotes") && day === 1)
            && !$(e).hasClass("rif-preghiamo-per")
            && !$(e).hasClass("tramonto-del-sole")
            && $(e).text().indexOf("o scaricate dal seguente link") < 0
            && $(e).text().indexOf("SdS video possono essere visionate") < 0
          ){

            if ($(e).hasClass("testo-a-correre")){
              output += "\n\n" + $(e).text();
            } else {
              if ($(e).hasClass("versetto-intro-sabato")){
                output += "\n\n> <p></p>\n> " + $(e).text();
              } else if ($(e).hasClass("letture-sabato")){
                output += "\n\n### Letture\n" + $(e).text().replace(/^Letture: /g, "");
              } else if ($(e).hasClass("tit-missione")) {
                output += "\n\n**Missione**";
              } else if ($(e).hasClass("punto-elenco-grassetto") || $(e).hasClass('testo-a-correre-bold')){
                if (day === 7 && week === 1 ){
                  console.log($(e).text().trim())
                }
                output += "\n\n`" + $(e).text().trim() + '`';
              } else {
                if ($(e).text().trim() === $(e).find("strong").text().trim()){
                  output += "\n\n`" + $(e).text().trim() + '`';
                } else {
                  output += "\n\n" + $(e).text().trim();
                }
              }
            }
          }
        });
      }

      if (day === 1) {
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
      } else if (inside_story && day === 8){
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/inside-story.md", output);
      } else {
        fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
      }

      day++;
      if ((inside_story && day === 9) || (!inside_story && day === 8)){
        day = 1;
        week++;
      }
      if (day <= 7){
        start = moment(start).add(1, 'd');
      }
    }
  }
}

function scrapeHungarian(destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("28/06/2019", DATE_FORMAT);
  var tasks = [];
  for (var i = 1; i <= 13; i++){

    for (var j = 1; j <= 7; j++){
      tasks.push(
        (function(addition, i, j){
          return function(callback) {
            var redis_client = redis.createClient();
            var date = moment(start).add(addition, "d");
            var url = "http://bibliatanulmanyok.hu/2019-3/d/d" + moment(date).format("YYYYMMDD");

            var process = function (body, delay) {
              var $ = cheerio.load(body, {decodeEntities: false});

              var title = changeCase.title($(".chapter > .titlepage h1").text().trim());
              var output = "---\ntitle:  " + title + "\ndate:  " + moment(date).format(DATE_FORMAT) + "\n---";

              $(".chapter p").each(function (i, e) {
                if ($(e).text().indexOf("SZOMBAT DÉLUTÁN") < 0) {
                  if ($(e).hasClass("kerdesekkekfolyo") || $(e).hasClass("xmmbehuzas")) {

                    if (j === 1){
                      output += "\n\n> <p></p>\n> " + $(e).text().trim();
                    } else {
                      output += "\n\n`" + $(e).text().trim() + "`";
                    }
                  } else if ($(e).hasClass("beszelgessunkrola")) {
                    if ($(e).text().trim().indexOf("BESZÉLGESSÜNK RÓLA!") >= 0 || $(e).text().trim().indexOf('Beszélgessünk róla') >= 0) {
                      output += "\n\n**Beszélgessünk róla!**";
                    } else {
                      output += "\n\n`" + $(e).text().trim() + "`";
                    }
                  } else {
                    output += "\n\n" + $(e).text().trim();
                  }
                }
              });

              output = output.replace(/E HETITANULMÁNYUNK:/g, '### E hetitanulmányunk\n');
              output = output.replace(/E HETI TANULMÁNYUNK:/g, '### E hetitanulmányunk\n');
              output = output.replace(//g, "\"");
              output = output.replace(//g, "\"");
              output = output.replace(//g, "-");
              output = output.replace(//g, "…");

              fs.outputFileSync(destination + "/" + pad(i, 2) + "/0" + j + ".md", output);

              if (j === 1) {
                fs.outputFileSync(destination + "/" + pad(i, 2) + "/info.yml", "---\ntitle: \"" + title + "\"\nstart_date: \"" + moment(date).format(DATE_FORMAT) + "\"\nend_date: \"" + moment(date).add(6, 'd').format(DATE_FORMAT) + "\"");
              }

              setTimeout(function () {
                callback(null)
              }, delay || 800);
            };

            console.log("Processing", url);

            redis_client.get(url, function (err, reply) {
              if (!reply) {
                request(
                  {
                    "uri": url,
                    "encoding": 'latin1',
                    "headers": {
                      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0"
                    }
                  },
                  function (err, response, body) {
                    if (err) {
                      console.log(err);
                      return;
                    }

                    redis_client.set(url, body);
                    redis_client.quit();

                    process(body);
                  }
                );
              } else {
                redis_client.quit();
                process(reply, 10);
              }
            });
          }
        })((i-1)*7+j, i, j))
    }
  }
  async.series(tasks);
}

function parseEnglishCQ(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);
  var week = 1;

  for (var i = 0; i < 13; i++){
    var day = 1;
    var file = fs.readFileSync(path + pad(i+1,2) +".html", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});
    var title = $("#header > .lesson-title").text().trim();
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");

    $(".day-lesson").each(function(j, e){
      var dayTitle = $(e).find(".day-title strong").text().trim();
      var dayVerse = $(e).find(".day-verse").text().trim().replace(/\n/g, "");
      var dayType = $(e).find(".day-title").text().replace(dayTitle, "").trim();
      var output = "---\ntitle:  "+dayTitle+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---\n\n" + "**" + dayType + "**: " + dayVerse;

      var react = false;
      var consider = false;
      var connect = false;

      $(e).find(".content").children(function(k,el){
        var tag = $(el).get(0).name;
        if (tag !== "h3"){
          if (tag === "ul") {
            if (consider) {
              output += '\n\n'
              $(el).find("li").each(function(ii, ee){
                output += '- ' + $(ee).text().trim() + '\n'
              })
            }
          } else if (tag === "p"){
            if (react) {
              output += "\n\n`"+$(el).text()+"`";
            } else if (consider) {
              output += "\n\n- "+$(el).text().replace(/• /g, "");
            } else if (connect) {
              output += "\n\n"+$(el).text();
            } else {
              output += "\n\n"+$(el).text();
            }

          } else if (tag === "h2" || tag === "h4"){
            if ($(el).text().indexOf("REACT") === 0){
              react = true;
              consider = false;
              connect = false;
              output += "\n\n**"+changeCase.title($(el).text().trim())+"**";
            } else if ($(el).text().indexOf("CONSIDER") === 0) {
              react = false;
              consider = true;
              connect = false;
              output += "\n\n**"+changeCase.title($(el).text().trim())+"**";
            } else if ($(el).text().indexOf("CONNECT") === 0) {
              react = false;
              consider = false;
              connect = true;
              output += "\n\n**"+changeCase.title($(el).text().trim())+"**";
            } else if ($(el).text().indexOf("CONCLUDE") === 0) {
              output += "\n\n**"+changeCase.title($(el).text().trim())+"**";
            } else {
              react = false;
              consider = false;
              connect = false;
              output += "\n\n**"+$(el).text().trim()+"**";
            }
          }
        }
      });

      if ($(e).find('.reference').length) {
        output += '\n\n---';
        $(e).find('.reference').children().each(function(ii,ee){
          if ($(ee).find("br").length){
            var arrayRefs = $(ee).text().trim().split('\n');

            for(var kk = 0; kk < arrayRefs.length; kk++){
              output += '\n\n<sup>' + arrayRefs[kk].trim() + '</sup>';
            }


          } else {
            output += '\n\n<sup>' + $(ee).text().trim() + '</sup>';
          }

        })
      }

      output += "\n\n_"+$(e).find(".contributor").text().trim()+"_";
      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);

      start = moment(start).add(1, 'd');
      day++;
    });

    week++;
  }
}

function parseRussian(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);
  var week = 1;

  for (var i = 0; i < 13; i++){
    var day = 0;
    var file = fs.readFileSync(path +"Section00" + pad(i+1,2) +".xhtml", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});
    var title = $(".СШ_Lesson-Name").text().trim();
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
    var output = "";
    $(".italic").each(function(j, e){
      $(e).html("_" + $(e).html() + "_");
    });
    output = "---\ntitle:  "+$(".Header-of-Lesson.HEADER_Right").text().trim()+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---"

    $("body > div").children(function(j, e){
      var tag = $(e).get(0).name;

      if ($(e).hasClass("СШ_DAY_Lesson-Day-header")){
        day++;
        start = moment(start).add(1, 'd');
        output = output.replace(/_{2,}/g, '');
        fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);
        output = "";
        output = "---\ntitle:  "+$(e).text().trim()+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---"

      }

      if ($(e).hasClass('СШ_Lesson-intro-БТИ-текст')){
        output += "\n\n### Библейские тексты для исследования\n"+$(e).text().trim();
      }

      if ($(e).hasClass('СШ_Lesson-intro-ПС-текст')){
        output += "\n\n> <p>Памятный стих</p>\n> " + $(e).text().trim();
      }

      if ($(e).hasClass("СШ_Question__1_Question_continued")||
          $(e).hasClass("СШ_Question__3_Question_w-o_spacing")||
          $(e).hasClass("СШ_Question__lines-w-o-space")
      ){
        if ( $(e).text().trim().length){
          output += "\n\n`" + $(e).text().trim() + "`";
        }
      }

      if ($(e).hasClass("DAY_DAY_routine_Bible_text")){
        output += ": " + $(e).text().trim();
      }

      if ($(e).hasClass("Basic-Paragraph")||
        $(e).hasClass("list_questions_for_discus-SIMPLE")||
        $(e).hasClass("СШ_Question__2_Question_continueing")||
        $(e).hasClass("СШ_Drop_Begin")){
          output += "\n\n" + $(e).text().trim();
      }

      if (tag === "ol"){
        output += "\n\n**Вопросы для обсуждения**";

        if ($(e).find("ol").length) {
          $(e).find("ol").find("li").each(function(k,el){
            output += "\n\n`" + $(el).text().trim() + "`";
          })
        } else {

          $(e).find("p").each(function(k,el){
            output += "\n\n`" + $(el).text().trim() + "`";
          })
        }
      }
    });
    if (day > 0){
      day++;
      start = moment(start).add(1, 'd');
      output = output.replace(/_{2,}/g, '');
      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);
    }

    week++;
  }
}

function parseRussianCQ(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);
  var week = 1;

  for (var i = 0; i < 13; i++){
    var day = 0;
    var file = fs.readFileSync(path +"Section00" + pad(i+2,2) +".xhtml", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});
    var title = $(".Lesson_Name").text().trim();
    $(".italic").each(function(j, e){
      $(e).html("_" + $(e).html() + "_");
    });
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
    var output = "";
    var discussion = false;


    $("body > div").children(function(j, e){
      var tag = $(e).get(0).name;

      if ($(e).hasClass("DAY_3_Header")){
        if (day > 0){
          fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);
          output = "";
        }
        day++;
        discussion = false;

        if (day === 1){
          output = "---\ntitle:  "+title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---\n\n**"+$(e).text().trim()+"**";
        } else {
          output = "---\ntitle:  "+$(e).text().trim()+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---"
        }
        start = moment(start).add(1, 'd');
      }

      if ($(e).hasClass("DAY_DAY_routine_Subheading") || $(e).hasClass("DAY_DAY_routine_Subheading-2") || $(e).hasClass("DAY_DAY_routine_Subheading-2-STANDARD")){
        if ($(e).text().indexOf("Дискуссия") >= 0){
          discussion = true;
        } else {
          discussion = false;
        }
        output += "\n\n**" + $(e).text().trim() + "**";
      }

      if ($(e).hasClass("DAY_DAY_routine_Bible_text")){
        output += ": " + $(e).text().trim();
      }

      if ($(e).hasClass("Basic-Paragraph")||
        $(e).hasClass("DAY_DAY_routine_List_NUMBER")){
        if (discussion){
          output += "\n\n`" + $(e).text().trim() + "`";
        } else {
          output += "\n\n" + $(e).text().trim();
        }
      }

      if ($(e).hasClass("DAY_DAY_routine_Authers")){
        if ($(e).text().trim().indexOf("_") === 0) {
          output += "\n\n" + $(e).text().trim();
        } else {
          output += "\n\n_" + $(e).text().trim() + "_";
        }
      }

      if ($(e).hasClass("DAY_DAY_routine_List")){
        if (discussion){
          output += "\n\n`" + $(e).text().trim() + "`";
        } else {
          output += "\n\n" + $(e).text().trim();
        }

      }

      if (tag === "ul"){
        var auth = null;
        if ($(e).find(".DAY_DAY_routine_Authers").length) {
          auth = $(e).find(".DAY_DAY_routine_Authers").text().trim();
          $(e).find(".DAY_DAY_routine_Authers").remove();
        }
        output += "\n";
        $(e).find("li").each(function(k,el){
          output += "\n- " + $(el).text().trim();
        });
        if (auth) {
          output += "\n\n_" + auth + "_";
        }
      }
    });
    if (day > 0){
      output = output.replace(/_{2,}/g, '');
      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);
    }

    week++;
  }
}

function parseEGWEn(path, originalDestination, destination){
  var week = 1;
  for (var i = 0; i < 13; i++){
    var day = 0;
    var file = fs.readFileSync(path +"part00"+pad(i+3,2)+"_split_001.html", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});
    var output = "";

    $("i").each(function(j, e){
      $(e).html("_" + $(e).html() + "_");
    });

    $("body > section").children(function(j, e){
      var tag = $(e).get(0).name;

      if ($(e).hasClass("lessionnumber")){
        if (day > 0){
          var original = fs.readFileSync(originalDestination + "/" + pad(week, 2) + "/0" + day + ".md", "utf-8");
          original += output;
          fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", original);
          output = "";
        }
        day++;
        output += "\n\n---\n\n#### Additional Reading: Selected Quotes from Ellen G. White";
      }

      if (tag === "p") {
        output += "\n\n" + $(e).text();
      }
    });

    if (day > 0){
      var original = fs.readFileSync(originalDestination + "/" + pad(week, 2) + "/0" + day + ".md", "utf-8");
      original += output;
      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", original);
    }

    week++;
  }
}

function parseEGWEs(path, originalDestination, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var week = 1;
  for (var i = 0; i < 13; i++){
    var day = 0;
    var file = fs.readFileSync(path +"GEB_3T_2019_Leccion_"+(i+1)+"/GEB_3T_2019_Leccion_"+(i+1)+".html", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});

    $(".italica").each(function(j, e){
      $(e).html("_" + $(e).html() + "_");
    });

    $("section .bold").each(function(j, e){
      if ($(e).text().trim().indexOf("Resumen") === 0) {
        $(e).html("**Resumen**: ");
      }
    });



    for (var j = 0; j < 7; j++){
      day++;
      var title = changeCase.title($("section").eq(j).find("[class^=titulo]").eq(0).text().trim());

      if (day === 1){
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
      }

      var output = "---\ntitle:  " + title + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
      var isDiscussion = false;

      $("section").eq(j).find(".container > p, h2").each(function(k,e){
        if (($(e).prop("tagName") === "H2") && $(e).text().indexOf("PREGUNTAS PARA DIALOGAR:") === 0){
          output += "\n\n**Preguntas para dialogar**";
          isDiscussion = true;
        }

        if ($(e).prop("tagName") === "P"){
          if (
            (day === 1 && $(e).text().trim().indexOf("Sábado") === 0) ||
            (day === 2 && $(e).text().trim().indexOf("Domingo") === 0) ||
            (day === 3 && $(e).text().trim().indexOf("Lunes") === 0) ||
            (day === 4 && $(e).text().trim().indexOf("Martes") === 0) ||
            (day === 5 && $(e).text().trim().indexOf("Miércoles") === 0) ||
            (day === 6 && $(e).text().trim().indexOf("Jueves") === 0) ||
            (day === 7 && $(e).text().trim().indexOf("Viernes") === 0)
          ) {

          } else {
            if (($(e).hasClass("pregunta") || ($(e).hasClass('body_pgta')) ) || (day === 7 && isDiscussion === true && $(e).text().trim().indexOf("**Resumen") < 0) || $(e).hasClass("reflexion")){
              if ($(e).find('.editorComment').length || $(e).hasClass("reflexion") || day === 7) {
                output += "\n\n`" + $(e).text().trim() + "`";
              } else {
                output += "\n\n**" + $(e).text().trim() + "**";
              }
            } else if ($(e).hasClass("body") || $(e).hasClass('body_intro')) {
              var body = $(e).text().trim();
              var readWeek = "LEE PARA EL ESTUDIO DE ESTA SEMANA:";
              var memoryText = "PARA MEMORIZAR: ";
              if (body.length) {
                if (body.indexOf(readWeek) === 0){
                  output += "\n\n### Lee para el estudio de esta semana\n" + body.replace(readWeek, "").trim();
                } else if (body.indexOf(memoryText) === 0){
                  output += "\n\n> <p>Para memorizar</p>\n> " + body.replace(memoryText, "");
                } else {
                  output += "\n\n" + body;
                }
              }
            }
          }
        }
      });

      output += "\n\n---\n\n#### Comentarios Elena G.W";
      $(".EGWComment").eq(j).find("p").each(function(k, e){
         output += "\n\n"+$(e).text().trim();
      });

      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);

      if (day === 7){
        $("section").remove();
        $(".publication p .bold").each(function(j, e) {
          $(e).html("**" + $(e).html().trim() + "** ");
        });
        output = "---\ntitle:  El Sábado enseñaré\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        $(".publication > p, h1, h2, h3").each(function(k,e){
          if ($(e).prop("tagName") === "H1") {
            output += "\n\n### " + $(e).text().trim();
          }

          if ($(e).prop("tagName") === "H2") {
            output += "\n\n#### " + $(e).text().trim();
          }

          if ($(e).prop("tagName") === "H3") {
            output += "\n\n##### " + $(e).text().trim();
          }

          if ($(e).prop("tagName") === "P") {
            output += "\n\n" + $(e).text().trim();
          }
        })
        fs.outputFileSync(destination + "/" + pad(week, 2) + "/teacher-comments.md", output);
      }

      start = moment(start).add(1, 'd');

    }

    week++;
  }
}

function parseTurkish(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

   $(".Commonly-Used_Zaph-Dingbats").remove();

  var iterator = 1,
      week = 1,
      output = null,
      title = "";

  $("[id^=_idContainer]").has(".Body").slice(0).each(function(i,e){

    $(e).children().each(function(ii, ee){
      if ($(ee).hasClass('Lesson-Title') || $(ee).hasClass('Day-Title') || ($(ee).hasClass('Friday-Body') && $(ee).text().trim().indexOf('Ek Çalışma') >= 0)) {
        title = $(ee).text().trim();

        if (output) {
          fs.outputFileSync(destination + "/" + pad(week, 2) + "/" + pad(iterator, 2) + ".md", output);

          iterator++;

          start = moment(start).add(1, 'd');


          if ($(ee).hasClass('Friday-Body')) {
            title = 'Ek Çalışma';
          }

          output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";

          if ($(ee).hasClass('Friday-Body')) {
            output += "\n\n" +  $(ee).text().trim().replace(/Ek Çalışma: /g, '');
          }

          if (iterator > 7) {
            iterator = 1;
            week++;
            fs.outputFileSync(destination + "/" + pad(week, 2) + "/info.yml", "---\ntitle: \"" + title + "\"\nstart_date: \"" + moment(start).format(DATE_FORMAT) + "\"\nend_date: \"" + moment(start).add(6, 'd').format(DATE_FORMAT) + "\"");
          }
        } else {
          output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
          if (iterator === 1) {
            fs.outputFileSync(destination + "/" + pad(week, 2) + "/info.yml", "---\ntitle: \"" + title + "\"\nstart_date: \"" + moment(start).format(DATE_FORMAT) + "\"\nend_date: \"" + moment(start).add(6, 'd').format(DATE_FORMAT) + "\"");
          }
        }
      } else {
        var tag = $(ee).get(0).name;
        var text = $(ee).text().trim();

        if (!$(ee).hasClass('Lesson-Dates') &&
          !$(ee).hasClass('Lesson-Title') &&
          !$(ee).hasClass('Sabbath-Afternoon-Head') &&
          !$(ee).hasClass('Day-Title') &&
          text.length > 0) {

          if (text.indexOf('Ek Çalışma: ') === 0 && iterator === 7){
            text = text.replace('Ek Çalışma: ', '');
          }

          if (text.indexOf('Özet:') === 0 && iterator === 7){
            text = text.replace('Özet:', '**Özet**:');
          }

          if ($(ee).hasClass('Commonly-Used_Discussion-Title')) {
            output += '\n\n**Tartışma Soruları**';
          } else if ($(ee).hasClass('Commonly-Used_Numbered-Bullet-List-SA') || $(ee).hasClass('Numbered-Bullet-List-SA')) {
            output += '\n\n`' + text + '`';
          } else if (text.indexOf('için bu haftanın konusunu çalışın') > 0) {
            output += '\n\n_' + text + '_';
          } else if (text.indexOf('Konuyla İlgili Metinler:') === 0) {
            output += '\n\n### Konuyla İlgili Metinler\n' + text.replace('Konuyla İlgili Metinler: ', '');
          } else if (text.indexOf('Hatırlama Metni') === 0) {
            output += '\n\n> <p>Hatırlama Metni</p>\n> ' + text.replace('Hatırlama Metni: ', '');
          } else if ($(ee).hasClass('Question') || $(ee).hasClass('x-screened-box-text')){
            output += '\n\n`' + text + '`';
          } else {
            output += '\n\n' + text;
          }
        }
      }
    });
    if (output){
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(iterator, 2) + ".md", output);
    }

  })
}

function parseEnglishEPUB(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/12/2018", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  $(".Basic-Text-Frame, .Commonly-Used_Zaph-Dingbats").remove();

  var iterator = 0,
    week = 1;

  $("[id^=_idContainer]").each(function(i,e){
    if ($(e).has('.Inside-Stories_IS-Title').length) {
      var title = 'Inside Story';
      var output = "---\ntitle:  " + title + "\ndate:  "+moment(start).add(-1,'d').format(DATE_FORMAT)+"\n---";
      $(e).children().each(function(ii, ee){
        var tag = $(ee).get(0).name;
        var text = $(ee).text().trim();

        if ($(ee).hasClass('Inside-Stories_IS-Title')) {
          output += '\n\n#### ' + text;
        } else if ($(ee).hasClass('Inside-Story-Author')) {
          output += '\n\n_' + text + '_';
        } else if ($(ee).hasClass('Inside-Stories_Inside-Story-author-info')) {
          output += '\n\n_' + text + '_';
        } else {
          output += '\n\n' + text;
        }


      });
      fs.outputFileSync(destination + "/" + pad(week-1, 2)+ "/inside-story.md", output);
    }

    if ($(e).text().trim().length > 10 && $(e).has(".Rarely-Used_Lesson-Dates").length){
      var isInsideStory = false;
      var titleClass = ".Commonly-Used_Head";

      if (iterator === 0) {
        titleClass = ".Commonly-Used_Lesson-Head-SA";
      }

      var title = $(e).find(titleClass).text().trim();

      if (iterator === 6) {
        title = 'Further Thought';
      }

      var output = "---\ntitle:  " + title + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";

      if (iterator === 0){
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
      }

      if (!isInsideStory) {
        iterator++;
        start = moment(start).add(1, 'd');
      }

      $(e).children().each(function(ii, ee){
        var tag = $(ee).get(0).name;
        var text = $(ee).text().trim();

        if (!$(ee).hasClass('Lesson-Dates') &&
          !$(ee).hasClass('Rarely-Used_Lesson-Dates') &&
          !$(ee).hasClass('Commonly-Used_Lesson-Head-SA') &&
          !$(ee).hasClass('Lesson-Title') &&
          !$(ee).hasClass('Commonly-Used_Head') &&
          !$(ee).hasClass('Sabbath-Afternoon-Head') &&
          !$(ee).hasClass('Commonly-Used_Sabbath-Afternoon-Head') &&
          !$(ee).hasClass('Day-Title') &&
          text.length > 0) {

          if (text.indexOf('Further Thought: ') === 0 && iterator === 7){
            text = text.replace('Further Thought: ', '');
          }

          if (text.indexOf('* Study this week’s lesson') === 0 && iterator === 1){
            text = '_' + text + '_';
          }

          if (text.indexOf('Discussion Questions:') === 0 && iterator === 7){
            text = text.replace('Discussion Questions:', '**Discussion Questions**:');
          }

          if ($(ee).hasClass('Commonly-Used_Discussion-Title')) {
            output += '\n\n**Tartışma Soruları**';
          } else if ($(ee).hasClass('Commonly-Used_Numbered-Bullet-List-SA')) {
            output += '\n\n`' + text + '`';
          } else if (text.indexOf('için bu haftanın konusunu çalışın') > 0) {
            output += '\n\n_' + text + '_';
          } else if (text.indexOf('Read for This Week’s Study:') === 0) {
            output += '\n\n### Read for This Week’s Study\n' + text.replace('Read for This Week’s Study: ', '');
          } else if (text.indexOf('Memory Text:') === 0) {
            output += '\n\n> <p>Memory Text:</p>\n> ' + text.replace('Memory Text: ', '');
          } else if (($(ee).hasClass('Commonly-Used_Question') || $(ee).hasClass('Commonly-Used_Question-NO-SB') || $(ee).hasClass('Commonly-Used_x-screened-box-text')) && $(ee).text().indexOf('Discussion Questions:') !== 0 && $(ee).text().indexOf('Further Thought') !== 0 && $(ee).text().indexOf('* Study this week’s lesson') !== 0){
            output += '\n\n`' + text + '`';
          } else {
            output += '\n\n' + text;
          }
        }
      });

      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(iterator, 2) + ".md", output);

      if (iterator === 7){
        iterator = 0;
        week++;
      }
    }

  })
}

function parsePolish(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/03/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var block = 0;
  var week = 1;
  $("[id^=_idContainer]").each(function(i, e){

    var day = 1, output = null, discussion = false;

    $(e).children().each(function(ii,ee){
      var title = "";

      if (day === 1 && !output){
        start = moment(start).add(1, 'd');
        title = changeCase.title($(e).find('._3--Tytuł-LB').eq(week-1).text().trim());
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
        output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
      } else if (day === 1 && output) {
        start = moment(start).add(1, 'd');
        title = changeCase.title($(e).find('._3--Tytuł-LB').eq(week-1).text().trim());
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
        output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
      }

      if ($(ee).hasClass('_6--TYTUŁ-DNIA-LB') || ($(ee).hasClass('_7--BL-LB') && $(ee).text().trim().indexOf('DO DALSZEGO STUDIUM')===0) || ($(ee).hasClass('_3--Tytuł-LB') && day !== 1)) {

        if (output) {
          fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
        }
        if (day === 7) {
          day = 1;
          week++;
        } else {
          day++;
        }


        start = moment(start).add(1, 'd');
        title = $(ee).text().trim();
        if (day === 7) {
          title = "Do dalszego studium";
        }
        output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
      }



      var text = $(ee).text().trim();
      if (
        !$(ee).hasClass('_1--Lekcja-LB') &&
        !$(ee).hasClass('_3--Tytuł-LB') &&
        !$(ee).hasClass('_6--TYTUŁ-DNIA-LB') &&
        !$(ee).hasClass('_4--dni-szczególne-LB') &&
        !$(ee).hasClass('_1b--Lekcja-LB-niedzielona') &&
        !$(ee).hasClass('_0--ZDJĘCIOWE-WSTAWIANKO') &&
        !$(ee).hasClass('_5--DZIEŃ-LB') &&
        text !== '...' &&
        text.length &&
        !$(ee).hasClass('_idFootnote') &&
        !((text.indexOf('DO DALSZEGO STUDIUM') === 0) && day === 7)
      ) {
        if (text.indexOf('PODSUMOWANIE') === 0) {
          output += '\n\n**Podsumowanie**';
          discussion = false;
        } else if (text.indexOf('PYTANIA DO DYSKUSJI') === 0) {
          output += '\n\n**Pytania do dyskusji**';
          discussion = true;
        } else if (text.indexOf('STUDIUM BIEŻĄCEGO TYGODNIA:') === 0){
          output += '\n\n### Studium bieżącego tygodnia\n' + text.replace('STUDIUM BIEŻĄCEGO TYGODNIA: ', '');
        } else if (text.indexOf('TEKST PAMIĘCIOWY:') === 0){
          output += '\n\n> <p>Tekst pamięciowy</p>\n> ' + text.replace('TEKST PAMIĘCIOWY: ', '');
        } else if ($(ee).hasClass('_8--P-Y-T-A-N-I-E--LB')) {
          output += '\n\n`' + text + '`';
        } else if ($(ee).hasClass('_idFootnotes')){
          output += '\n\n---';
          $(ee).find('._idFootnote').each(function(iii,eee){
            output += '\n\n_' + $(eee).text().trim() + '_';
          });
        } else {
          if (day === 7 && discussion) {
            output += '\n\n`' + text + '`';
          } else { output += '\n\n' + text; }
        }
      }
    });
    if (output) {
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
    }
    // week++;

  });
}

function parsePolish2(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT),
      begin = false,
      fridayQuestionBegin = false;

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var week = 0, day = 8,
      title = null,
      output = null;

  $("[id^=_idContainer]").children().each(function(i, e){
    if ($(e).hasClass('_3--Tytuł-LB')) { begin = true; }
    if (begin) {
      var text = $(e).text().trim();
      if (!text.length || !(text.customTrim(".").length)) {
        return 1
      }
      var isFriday = text.indexOf("DO DALSZEGO STUDIUM") === 0;

      let BIBLE_VERSES_CONST = "STUDIUM BIEŻĄCEGO TYGODNIA",
          MEMORY_VERSE_CONST = "TEKST PAMIĘCIOWY",
          FRIDAY_QUESTIONS_START = "PYTANIA DO DYSKUSJI";

      var isBibleVerses = text.indexOf(BIBLE_VERSES_CONST) === 0,
          isMemory = text.indexOf(MEMORY_VERSE_CONST) === 0,
          isFridayQuestions = text.indexOf(FRIDAY_QUESTIONS_START) === 0;

      if ($(e).hasClass('_3--Tytuł-LB') || $(e).hasClass("_6--TYTUŁ-DNIA-LB") || isFriday) {
        title = text;

        if (isFriday) {
          title = changeCase.sentenceCase(title)
        }

        if (output) {
          ssWriteMd(destination, week, day, output);
        }

        if (day >= 7) {
          fridayQuestionBegin = false;
          day = 1;
          week++;
          ssWriteInfo(destination, week, title, start);
        } else {
          day++;
        }

        output = ssMdInitialOutput(title, start);
        start = moment(start).add(1, 'd');
      } else if (isFridayQuestions) {
        output += "\n\n" + ssMdBold(changeCase.sentenceCase(text));
        fridayQuestionBegin = true
      } else {
        if (isBibleVerses) {
          output += "\n\n" + ssMdWeekVerses(changeCase.sentenceCase(BIBLE_VERSES_CONST), text.replace(BIBLE_VERSES_CONST, "").customTrim(" :"));
        } else if (isMemory) {
          output += "\n\n" + ssMdMemoryVerse(changeCase.sentenceCase(MEMORY_VERSE_CONST), text.replace(MEMORY_VERSE_CONST, "").customTrim(" :"));
        } else if ($(e).hasClass('_7--Tekst-podstawowy')) {
          if (fridayQuestionBegin) {
            output += "\n\n" + ssMdQuestion(text);
          } else if (text.endsWith("...")) {
            output += "\n\n" + ssMdQuestion(text);
          } else {
            output += "\n\n" + text;
          }
        } else if ($(e).hasClass('_8--P-Y-T-A-N-I-E--LB')) {
          output += "\n\n" + ssMdQuestion(text);
        } else if ($(e).hasClass('_3--początek-lekcji-LB')) {
          output += "\n\n" + text;
        }
      }
    }
  });
  if (output) {
    ssWriteMd(destination, week, day, output);
  }
}

function parseArabic(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});


  var week = 1;
  $("[id^=_idContainer]").has('.LESSON-Top-tab').each(function(i, e){
    var day = 0;
    var output = "";
    $(e).children().each(function(ii, ee){
      var text = $(ee).text().trim();
      var title = "";
      if (
        !$(ee).hasClass('LESSON-Top-tab') &&
        !$(ee).hasClass('Centralized-Auto') &&
        !$(ee).hasClass('Saturday-Title') &&
        !$(ee).hasClass('DAY-Top-tab') &&
        text.length
      ) {
        if ($(ee).hasClass('Lesson-Titles')) {
          title = text;
          fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
          output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
          day++;
          start = moment(start).add(1, 'd');
        } else if ($(ee).hasClass('Day-Title') || (day === 6 && (text.indexOf('لمزيد من الدرس') === 0 || text.indexOf('لمزيد مِن الدرس') === 0))) {

          if (day === 6) {
            title = 'لمزيد من الدرس';
          } else {
            title = text;
          }

          fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
          output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
          day++;
          start = moment(start).add(1, 'd');
        } else if ($(ee).hasClass('Bible-Refs-and-Verse')){
          if (text.indexOf('المراجع الأسبوعية: ') === 0) {
            output += '\n\n### المراجع الأسبوعية\n' + text.replace('المراجع الأسبوعية: ', '');
          } else if (text.indexOf('آية الحفظ: ') === 0) {
            output += '\n\n> <p>آية الحفظ</p>\n> ' + text.replace('آية الحفظ: ', '');
          } else {
            output += '\n\n`' + text + '`';
          }
        } else if ($(ee).hasClass('Body-Text')) {
          output += '\n\n' + text;
        } else if ($(ee).hasClass('Text-with-GRAY-back') || $(ee).hasClass('Friday-GRAY-questions')) {
          if ((text.indexOf('أسئلة للنقاش') === 0) || (text.indexOf('لمزيد مِن الدرس') === 0)){
            output += '\n\n**' + text + '**';
          } else {
            output += '\n\n`' + text + '`';
          }
        }
      }
    });

    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
    week++;
  });
}

function parseFarsi(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});


  var week = 1;
  $("[id^=_idContainer]").has(".LESSON-Title").each(function(i, e){
    var day = 0;
    var output = "";
    $(e).children().each(function(ii, ee){
      var text = $(ee).text().trim();
      var title = "";

      if (
        !$(ee).hasClass('LESSON-Top-tab') &&
        !$(ee).hasClass('Centralized-Auto') &&
        !$(ee).hasClass('Saturday-Title') &&
        !$(ee).hasClass('DAY-Top-tab') &&
        !($(ee).hasClass('Day-Title') && text.indexOf('بعد از ظهر روز سبت') === 0) &&
        text.length
      ) {
        if ($(ee).hasClass('LESSON-Title')) {
          title = text;
          fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
          output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
          day++;
          start = moment(start).add(1, 'd');
        } else if ($(ee).hasClass('Day-Title') || (day === 6 && ((text.indexOf('اندیشه') === 0) || (text.indexOf('تفکری') === 0) ))) {

          if (day === 6) {
            title = 'اندیشه هایی فراتر';
          } else {
            title = text;
          }

          fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
          output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
          day++;
          start = moment(start).add(1, 'd');
          if (day === 7){
            output += "\n\n" + text.substring(text.indexOf(': ')+2).trim();
          }
        } else if ($(ee).hasClass('Bible-Refs-and-Verse')){
          if (text.indexOf('مطالعه این هفته: ') === 0) {
            output += '\n\n### مطالعه این هفته\n' + text.replace('مطالعه این هفته: ', '');
          } else if (text.indexOf('آیه حفظی: ') === 0) {
            output += '\n\n> <p>آیه حفظی</p>\n> ' + text.replace('آیه حفظی: ', '');
          } else {
            output += '\n\n`' + text + '`';
          }
        } else if ($(ee).hasClass('Body-Text-AR')) {
          output += '\n\n' + text;
        } else if ($(ee).hasClass('Text-with-GRAY-back') || $(ee).hasClass('Friday-GRAY-questions')) {
          if ((text.indexOf('سوالاتی برای بحث') === 0)){
            output += '\n\n**' + text + '**';
          } else {
            output += '\n\n`' + text + '`';
          }
        }
      }
    });

    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
    week++;
  });
}

function scrapeRomanian(destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var links = [
    "http://www.7adventist.com/studiu/creatia-lui-dumnezeu/",
    "http://www.7adventist.com/studiu/o-lume-mai-buna/",
    "http://www.7adventist.com/studiu/sabatul-o-zi-a-libertatii/",
    "http://www.7adventist.com/studiu/mila-si-dreptatea-in-cartile-psalmii-si-proverbele/",
    "http://www.7adventist.com/studiu/strigatul-profetilor/",
    "http://www.7adventist.com/studiu/inchinati-va-creatorului-2/",
    "http://www.7adventist.com/studiu/isus-si-cei-nevoiasi/",
    "http://www.7adventist.com/studiu/acesti-foarte-neinsemnati-frati-ai-mei/",
    "http://www.7adventist.com/studiu/slujirea-nevoiasilor-in-biserica-noului-testament/",
    "http://www.7adventist.com/studiu/evanghelia-pusa-in-practica/",
    "http://www.7adventist.com/studiu/fericita-noastra-nadejde/",
    "http://www.7adventist.com/studiu/sa-iubesti-mila/",
    "http://www.7adventist.com/studiu/o-biserica-in-care-toti-slujesc/"
    ],
    tasks = [],
    start = moment("29/06/2019", DATE_FORMAT),
    week = 1;

  for (var i = 0; i < links.length; i++){
    tasks.push(
      (function(url){
        return function(callback) {
          var redis_client = redis.createClient();

          var process = function (body, delay) {
            var day = 1;
            var $ = cheerio.load(body, {decodeEntities: false});
            var title = $("#featured-post h3:first-child").text();
            var workingDay = true;
            var discussion = false;

            // info.yml
            fs.outputFileSync(destination + "/" + pad(week, 2) + "/info.yml", "---\ntitle: \"" + title + "\"\nstart_date: \"" + moment(start).format(DATE_FORMAT) + "\"\nend_date: \"" + moment(start).add(6, 'd').format(DATE_FORMAT) + "\"");
            var output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";

            $("#featured-post").children().each(function(ii,ee){
              var tag = $(ee).get(0).name;
              var text= $(ee).text().trim();

              var finishedDay = function() {
                fs.outputFileSync(destination + "/" + pad(week, 2) + "/" + pad(day, 2) + ".md", output);
                day++;
                start = moment(start).add(1, 'd');
              };

              if (text.indexOf('Aici puteţi asculta cartea') === 0 || text.indexOf('Aici puteţi citi cartea') === 0){
                finishedDay();
                workingDay = false;
              }

              if (
                workingDay &&
                !$(ee).hasClass('sm2-bar-ui') &&
                tag!=='h3' &&
                tag!=='h6' &&
                text.length
              ) {
                if (tag === 'h4'){
                  finishedDay();
                  title = text.substring(text.indexOf("–")+2).trim();
                  output = "---\ntitle:  " + title + "\ndate:  " + moment(start).format(DATE_FORMAT) + "\n---";
                } else if (tag === 'blockquote') {
                  output += '\n\n> <p>Textul de memorat</p>\n> ' + text.replace('Textul de memorat: ', '');
                } else if (text.indexOf('Pentru studiu suplimentar') === 0) {
                  output += "\n\n**Pentru studiu suplimentar**: " + text.replace('Pentru studiu suplimentar', '');
                } else if (text.indexOf('BIBLIA ŞI CARTEA') === 0) {
                  output += "\n\n**Biblia şi cartea istoria mântuirii – studiu la rând**: " + text.replace('BIBLIA ŞI CARTEA ISTORIA MÂNTUIRII – STUDIU LA RÂND', '');
                } else if (day === 7 && text.indexOf('Biblia:') === 0 && $(ee).has('strong')) {
                  output += "\n\n**" + $(ee).find("strong").text().trim() + "**";
                  var b = $(ee).contents().filter(function(){
                    return (this.nodeType === 3);
                  }).remove();
                  var questions = $(b).text().trim().split("\n");
                  for (var splitQ = 0; splitQ < questions.length; splitQ++) {
                    output += "\n\n`" + questions[splitQ] + '`';
                  }
                } else if (day === 7 && text.indexOf('Istoria mântuirii') === 0 && $(ee).has('strong')) {
                  output += "\n\n**" + $(ee).find("strong").text().trim() + "**";
                  var b = $(ee).contents().filter(function(){
                    return (this.nodeType === 3);
                  }).remove();
                  var questions = $(b).text().trim().split("\n");
                  for (var splitQ = 0; splitQ < questions.length; splitQ++) {
                    output += "\n\n`" + questions[splitQ] + '`';
                  }
                } else if (day < 7 && ($(ee).has('strong').length || $(ee).find('> em').length)) {

                  var b = $(ee).contents().filter(function(){
                    return (this.nodeType === 3);
                  }).remove();

                  if (text.indexOf($(b).text().trim()) === 0){
                    output += "\n\n`" + text + '`';
                  } else {
                    output += "\n\n" + text;
                  }
                } else {
                  output += "\n\n" + text;
                }
              }
            });

            week++;

            setTimeout(function () {
              callback(null)
            }, delay || 800);
          };

          console.log("Processing", url);

          redis_client.get(url, function (err, reply) {
            if (!reply) {
              request(
                {
                  "uri": url,
                  "headers": {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0"
                  }
                },
                function (err, response, body) {
                  if (err) {
                    console.log(err);
                    return;
                  }

                  redis_client.set(url, body);
                  redis_client.quit();

                  process(body);
                }
              );
            } else {
              redis_client.quit();
              process(reply, 10);
            }
          });
        }
      })(links[i]))
  }
  async.series(tasks);
}

function parseCzech(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/09/2018", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var day = 0,
      week = 1;

  var output = "";

  var writeDay = function(){
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
  };

  var texty = false,
      zakladni = false,
      budovani = false,
      osnobni = false,
      aplikace = false,
      otkazy = false,
      podnety = false;

  $("body").children().each(function(i,e){
    var tag = $(e).get(0).name,
        text = $(e).text().trim();

    if (text.length > 1 &&
        text.indexOf("Týden") !== 0 &&
        text.indexOf("Neděle") !== 0 &&
        text.indexOf("Západ slunce") !== 0 &&
        text.indexOf("Konkrétní modlitební seznam mé třídy sobotní školy") !== 0 &&
        text.indexOf("Pondělí") !== 0 &&
        text.indexOf("Úterý") !== 0 &&
        text.indexOf("Středa") !== 0 &&
        text.indexOf("Čtvrtek") !== 0 &&
        text.indexOf("Pátek") !== 0 &&
        text.indexOf("_____") !== 0
        ){
      if (texty) {
        output += "\n\n### Texty na tento týden\n" + text;
        texty = false;
      } else if (zakladni) {
        output += "\n\n> <p>Základní verš</p>\n> "+text;
        zakladni = false;
      } else if (budovani) {
        if (tag === "ul") {
          output += "\n";
          $(e).find("li").each(function(ii,ee){
            output += "\n- " + $(ee).text().trim();
          });
        } else {
          output += "\n\n" + text;
        }
        budovani = false;
      } else if (osnobni) {
        if (text.indexOf("Aplikace") === 0) {
          aplikace = true;
          osnobni = false;
          output += "\n\n**" + text + "**";
        } else {
          if ((text.indexOf("Přečti") >= 0 && text.indexOf("?") > 0) || text.lastIndexOf("?") === text.length-1 ) {
            output += "\n\n`" + text + "`";
          } else {
            output += "\n\n" + text;
          }
        }
      } else if (aplikace) {
        output += "\n\n`" + text+ "`";
        aplikace = false;
      } else if (otkazy) {
        otkazy = false;
        if (tag === "ul") {
          $(e).find("li").each(function(ii,ee){
            output += "\n\n`" + $(ee).text().trim() +"`";
          });
        } else {
          output += "\n\n`" + text + "`";
        }
      } else if (podnety) {
        if (tag === "ul") {
          output += "\n";
          $(e).find("li").each(function(ii,ee){
            output += "\n- " + $(ee).text().trim();
          });
        } else {
          output += "\n\n" + text;
        }
        podnety = false;
      } else if (text.indexOf("Texty na tento týden") === 0) {
        texty = true;
      } else if (text.indexOf("Základní verš") === 0) {
        zakladni = true;
      } else if (text.indexOf("Budování společenství") === 0) {
        output += "\n\n**"+text+"**";
        budovani = true;
      } else if (text.indexOf("Osobní studium") === 0) {
        output += "\n\n**"+text+"**";
        osnobni = true;
      } else if ( ((text.indexOf("Shrnutí") === 0) || (text.indexOf("Praktický závěr") === 0)) && day === 7) {
        output += "\n\n**"+text+"**";
      } else if ( ((text.indexOf("Podněty k modlitbám") === 0)) && day === 7) {
        output += "\n\n**"+text+"**";
        podnety = true;
      } else if (text.indexOf("Otázky k rozhovoru") === 0) {
        otkazy = true;
        output += "\n\n**"+text+"**";
      } else if (text.indexOf("Aplikace") === 0) {
        aplikace = true;
      } else if (tag === "h1" || tag === "h2"){
        if (tag === "h1"){
          fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+text+"\"\nstart_date: \""+moment(start).add(-6, 'd').format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).format(DATE_FORMAT)+"\"");
        }

        if (day > 0){
          writeDay();
        }

        day++;

        if (day === 8) {
          day = 1;
          week++;
        }

        if (day === 1){

        }

        output = "---\ntitle:  " + text + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        start = moment(start).add(1, 'd');
      } else {
        if (day !== 1 && day !== 7) {
          output += "\n\n> <p></p>\n> " + text;
        } else {
          output += "\n\n" + text;
        }
      }
    }
  });
  writeDay();
}

function parseCzechEpub(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var day = 0,
    week = 1;

  var output = "";

  var writeDay = function(){

    if (day !== 1 && day !== 7) {
      var ap = $("p.Aplikace-text").eq(aplikaceIterator).text().trim();
      aplikaceIterator++;
      output += "\n\n**Aplikace**\n\n`"+ap+"`";
    }

    if (day === 1) {
      output += "\n\n**Budování společenství**";
      var apE = $("ul").has("li.Aplikace-neděle").eq(aplikaceNed).find("li").each(function(i,e){
        output += "\n\n`"+$(e).text().trim()+"`";
      });

      aplikaceNed++;
    }

    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);
  };

  var texty = false,
    zakladni = false,
    budovani = false,
    osnobni = false,
    aplikace = false,
    otkazy = false,
    podnety = false,
    title = "";

  var aplikaceIterator = 0,
      aplikaceNed = 0;

  $("div[id^=_idContainer]").has(".N1").children().each(function(i,e){
    var tag = $(e).get(0).name,
      text = $(e).text().trim();

    if (text.length  &&
      text.indexOf("Týden") !== 0 &&
      text.indexOf("Neděle") !== 0 &&
      text.indexOf("Západ slunce") !== 0 &&
      text.indexOf("Konkrétní modlitební seznam mé třídy sobotní školy") !== 0 &&
      text.indexOf("Pondělí") !== 0 &&
      text.indexOf("Úterý") !== 0 &&
      text.indexOf("Středa") !== 0 &&
      text.indexOf("Čtvrtek") !== 0 &&
      text.indexOf("Pátek") !== 0 &&
      text.indexOf("_____") !== 0
    ){
      if ($(e).hasClass("N1") || $(e).hasClass("N2")){
        texty = false;
        zakladni = false;
        budovani = false;
        osnobni = false;
        aplikace = false;
        otkazy = false;
        podnety = false;
        if (day > 0){
          if ($(e).hasClass("N1")){
            title = text;
            console.log(title, week)
            fs.outputFileSync(destination + "/" + pad(week+1 , 2)+ "/info.yml", "---\ntitle: \""+text+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
          }
          writeDay();
        } else {
          if ($(e).hasClass("N1")){
            title = text;
            console.log(title, week)
            fs.outputFileSync(destination + "/" + pad(1 , 2)+ "/info.yml", "---\ntitle: \""+text+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
          }
        }

        day++;

        if (day === 8) {
          day = 1;
          week++;
        }

        if (day === 1){

        }

        output = "---\ntitle:  " + text + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        start = moment(start).add(1, 'd');
      } else
      if (texty) {
        output += "\n\n### Texty na tento týden\n" + text;
        texty = false;
      } else if (zakladni) {
        output += "\n\n> <p>Základní verš</p>\n> "+text;
        zakladni = false;
      } else if (budovani) {
        if (tag === "ul") {
          output += "\n";
          $(e).find("li").each(function(ii,ee){
            output += "\n- " + $(ee).text().trim();
          });
        } else {
          output += "\n\n" + text;
        }
        budovani = false;
      } else if (osnobni) {
        if (text.indexOf("Aplikace") === 0) {
          aplikace = true;
          osnobni = false;
          output += "\n\n**" + text + "**";
        } else {
          if ((text.indexOf("Přečti") >= 0 && text.indexOf("?") > 0) || text.lastIndexOf("?") === text.length-1 ) {
            output += "\n\n`" + text + "`";
          } else {
            output += "\n\n" + text;
          }
        }
      } else if (aplikace) {
        output += "\n\n`" + text+ "`";
        aplikace = false;
      } else if ( ((text.indexOf("Shrnutí") === 0) || (text.indexOf("Praktický závěr") === 0)) && day === 7) {
        otkazy = false;
        output += "\n\n**"+text+"**";
      } else if (otkazy) {
        if (tag === "ul") {
          $(e).find("li").each(function(ii,ee){
            output += "\n\n`" + $(ee).text().trim() +"`";
          });
        } else {
          output += "\n\n`" + text + "`";
        }
      } else if (podnety) {
        if (tag === "ul") {
          output += "\n";
          $(e).find("li").each(function(ii,ee){
            output += "\n- " + $(ee).text().trim();
          });
        } else {
          output += "\n\n" + text;
        }
        podnety = false;
      } else if (text.indexOf("Texty na tento") === 0) {
        texty = true;
      } else if (text.indexOf("Základní verš") === 0) {
        zakladni = true;
      } else if (text.indexOf("Budování společenství") === 0) {
        output += "\n\n**"+text+"**";
        budovani = true;
      } else if (text.indexOf("Osobní studium") === 0) {
        output += "\n\n**"+text+"**";
        osnobni = true;
      } else if ( ((text.indexOf("Podněty k modlitbám") === 0)) && day === 7) {
        output += "\n\n**"+text+"**";
        podnety = true;
      } else if (text.indexOf("Otázky k") === 0) {
        otkazy = true;
        output += "\n\n**"+text+"**";
      } else if (text.indexOf("Aplikace") === 0) {
        aplikace = true;
      } else {
        if (day !== 1 && day !== 7) {
          output += "\n\n> <p></p>\n> " + text;
        } else {
          output += "\n\n" + text;
        }
      }
    }
  });
  fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).add(-7,'d').format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(-1,'d').format(DATE_FORMAT)+"\"");
  writeDay();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var scrapeNorwegian = async function (quarterId, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var getPage = async function(url){
    var axios = require('axios');
    var redis_client = redis.createClient();
    const {promisify} = require('util');
    const getAsync = promisify(redis_client.get).bind(redis_client);
    const setAsync = promisify(redis_client.set).bind(redis_client);

    let headers = {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15"
    };

    let data = await getAsync(url);

    if (!data){
      await sleep(800);
      data = await axios({
        url: url,
        headers: headers
      });
      data = data.data
      await setAsync(url, data)
    }
    redis_client.quit();

    return data;
  };

  let index = await getPage("https://bibelstudiet.no/" + quarterId);

  var $ = cheerio.load(index, {decodeEntities: false});

  let count = $("#toc").find("li").length;



  console.log(count);
  for(let i = 0; i < count; i++){
    let week = i+1;
    let weekPage = await getPage("https://bibelstudiet.no/" + quarterId + "/" + week);
    $ = cheerio.load(weekPage, {decodeEntities: false});
    $("cite").each(function(j, e){
      $(e).html("_" + $(e).html() + "_");
    });
    let weekInfo = "";
    let title = $("h1 a.title").text().trim();

    let day = 1;

    var writeDay = function (output) {
      fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day + ".md", output);
      day++;
      start = moment(start).add(1, 'd');
    };

    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");

    // Sabbath
    $("article.introduction").each(function(i,e){
      let output = "---\ntitle:  "+title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";

      output += "\n\n### " + $(e).find(".background h3:first-child").text().trim();
      output += "\n" + $(e).find(".background p").text().trim();

      output += "\n\n> <p>" + $(e).find(".memory h3:first-child").text().trim() + "</p>";
      output += "\n> " + $(e).find("div.memory p.memory").text().trim().replace(/\n/g, " ");

      $(e).find("> p").each(function(i,ee){
        output += "\n\n" + $(ee).text().trim().replace(/\n/g, " ");
      });

      writeDay(output);
    });

    // Week
    $("article.day").each(function(i,e){
      let output = "---\ntitle:  "+$(e).find("h2:first-child .title").text().trim()+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";

      $(e).children().each(function(ii,ee){
        let tag = $(ee).prop('tagName');

        if (tag === 'P') {
          output += "\n\n" + $(ee).text().trim().replace(/\n/g, " ");
        } else if (tag === 'DIV') {
          if ($(ee).hasClass('exercise')){

            if ($(ee).find(".exercise").length){
              output += "\n\n**" + $(ee).find('p').text().trim().replace(/\n/g, " ") + '**';
              $(ee).find('.exercise').each(function(iii,eee){
                output += "\n\n`" + $(eee).text().trim() + '`';
              })
            } else {
              output += "\n\n`" + $(ee).find('p').text().trim().replace(/\n/g, " ") + '`';
            }





          } else if ($(ee).hasClass('questions')) {
            output += "\n\n**" + $(ee).find('h3').text().trim().replace(/\n/g, " ") + '**';
            $(ee).find('li').each(function(iii,eee){
              output += "\n\n`" + $(eee).text().trim().replace(/\n/g, " ") + '`';
            })
          } else if ($(ee).hasClass('summary')) {
            output += "\n\n**" + $(ee).find('h3').text().trim().replace(/\n/g, " ") + '**';
            output += "\n\n" + $(ee).find('p').text().trim().replace(/\n/g, " ");
          }

        } else if (tag === 'OL') {
          output += "\n";
          $(ee).find('li').each(function(iii,eee){
            output += "\n" + (iii+1) + ". " + $(eee).text().trim().replace(/\n/g, " ");
          })
        } else if (tag === 'UL') {
          output += "\n";
          $(ee).find('li').each(function(iii,eee){
            output += "\n- " + $(eee).text().trim().replace(/\n/g, " ");
          })
        } else if (tag === 'DL') {
          let dlBold = null;
          $(ee).children().each(function(iii,eee){
            let dlTag = $(eee).prop('tagName');
            if (dlTag === 'DT') {
              dlBold = $(eee).text().trim();
            } else if (dlTag == 'DD') {
              if (dlBold) dlBold = "**" + dlBold + "**: "
              output += "\n\n" + (dlBold ? dlBold : "") + $(eee).text().trim().replace(/\n/g, " ");
              dlBold = null;
            }
          })
        }
      });

      writeDay(output);
    });

    $("article.story").each(function(i,e){
      let output = "---\ntitle:  "+$(e).find("h2 .subtitle").text().trim()+"\ndate:  "+moment(start).add(-1, 'd').format(DATE_FORMAT)+"\n---";

      output += '\n\n#### ' + $(e).find("h2:first-child .title").text().trim();
      output += '\n\n_' + $(e).find("p.about").text().trim() + '_';

      $(e).children().each(function(ii,ee){
        let tag = $(ee).prop('tagName');

        if (tag === 'P' && !$(ee).hasClass('about')) {
          output += "\n\n" + $(ee).text().trim().replace(/\n/g, " ");
        } else if (tag === 'ASIDE') {
          output += "\n\n##### " + $(ee).find('h3:first-child').text().trim();
          $(ee).children().each(function(iii,eee){
            let tag = $(eee).prop('tagName');

            if (tag === 'P') {
              output += "\n\n" + $(eee).text().trim().replace(/\n/g, " ");
            }
          })
        }
      });

      fs.outputFileSync(destination + "/" + pad(week , 2) + "/inside-story.md", output);
    });
  }
};

function parseFrenchEPUB(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  $(".Commonly-Used_Zaph-Dingbats").remove();

  var day = 1, week = 1, output = null;
  $("[id^=_idContainer]").has(".Rarely-Used_Lesson-Dates").each(function(i,e){
    var title = ($(e).has('.Commonly-Used_Lesson-Head-SA').length) ? $(e).find('.Commonly-Used_Lesson-Head-SA').text().trim() : $(e).find('.Commonly-Used_Head').text().trim();
    if (day === 7){
      title = "Réflexion avancée";
    }

    if (day === 1) {
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
    }

    output = "---\ntitle:  " + title + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";

    $(e).children().not('.Rarely-Used_Lesson-Dates, .Commonly-Used_Head, .Commonly-Used_Sabbath-Afternoon-Head, .Commonly-Used_Lesson-Head-SA').each(function(ii, ee){
      var text = $(ee).text().trim();
      if (text.length) {
        if (text.indexOf('Réflexion avancée:') === 0) {
          output += '\n\n'+ text.replace('Réflexion avancée:', '').trim();
        } else
        if (text.indexOf('Discussion:') === 0){
          output += '\n\n**Discussion**';
        } else
        if (text.indexOf('Lecture de la semaine') === 0) {
          output += '\n\n### Lecture de la semaine\n' + text.replace('Lecture de la semaine: ', '')
        } else
        if (text.indexOf('Verset à mémoriser') === 0) {
          output += '\n\n> <p>Verset à mémoriser</p>\n> ' + text.replace('Verset à mémoriser: ', '')
        } else
        if (text.indexOf('* Étudiez cette leçon') === 0) {
          output += '\n\n_' + text + '_';
        } else
        if ($(ee).hasClass('Commonly-Used_Question') || $(ee).hasClass('Commonly-Used_Question-NO-SB') || $(ee).hasClass('Commonly-Used_x-screened-box-text') || $(ee).hasClass('Commonly-Used_Numbered-Bullet-List-SA')){
          output += '\n\n`' + text + '`';
        } else {
          output += '\n\n' + text;
        }
      }
    });
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + pad(day, 2) + ".md", output);

    day++;
    start = moment(start).add(1, 'd');
    if (day>7){
      week++;
      day = 1;
    }
  });

  start = moment("29/12/2018", DATE_FORMAT);
  week = 1;
  output = 0;
  $("[id^=_idContainer]").has(".Inside-Stories_IS-Title").each(function(i,e){
    var title = "Histoire Missionnaire";
    output = "---\ntitle:  " + title + "\ndate:  "+moment(start).add(6,'d').format(DATE_FORMAT)+"\n---";
    $(e).children().each(function(ii,ee){
      var text = $(ee).text().trim();
      if (text.length){
        if ($(ee).hasClass('Inside-Stories_IS-Title')) {
          output += '\n\n#### ' + text;
        } else
        if ($(ee).hasClass('Inside-Stories_IS-Author')) {
          output += '\n\n_'+text+'_';
        } else {
          output += '\n\n' + text;
        }
      }
    });
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/inside-story.md", output);
    start = moment(start).add(7, 'd');
    week++;
  });
}

/**
 * Important to adjust margins in the original InDesign file
 * @param path
 * @param destination
 */
function parseDanish(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("28/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var day = 0, week = 0, output = null,
    margins = [], fMargins = [], memVerse = false, intro = false, tekster = false, discussion = false;

  var writeStuff = function (){
    if (output){
      var f = (day === 8) ? 'teacher-comments.md' : pad(day, 2) + ".md";
      if (day === 8) {
        output += "\n\n**Noter**\n\n``";
      }
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/" + f, output);
    }
  };

  $("body").children().each(function(i,e){
    var text = $(e).text().trim();
    if (text.length) {
      if ($(e).find(".Margin").length) {
        margins = [];
        $(e).find(".Margin").each(function(ii,ee){
          var innerText = $(ee).text().trim();
          if (innerText.length) {
            if (margins.length === 0 || innerText.indexOf("Til at") === 0) {
              margins.push(innerText);
            } else {
              if ($(ee).text().indexOf(" ") === 0) {
                margins.push(innerText);
              } else {
                margins[margins.length-1] += " " + innerText;
              }
            }
          }
        })
      } else
      if ($(e).find(".Overskrift").length) {
        writeStuff();
        if (margins.length) {
          fMargins = margins;
          margins = [];
        }
        day = 1;
        week++;
        start = moment(start).add(1, 'd');
        memVerse = false;
        intro = false;
        tekster = false;
        discussion = false;

        output = "---\ntitle:  " + text + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
        output += "\n\n> <p>Ugens vers</p>";


        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+text+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
      } else

      if ($(e).find(".Overskrift_ugedage").length) {
        writeStuff();
        if (margins.length) {
          fMargins = margins;
          margins = [];
        }
        day++;
        if (day <= 7) {
          start = moment(start).add(1, 'd');
        }
        output = "---\ntitle:  " + text + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
      } else
      if ($(e).find(">p[class^='Brød']").length) {
        $(e).find(">p[class^='Brød']").each(function(ii,ee){
          var innerText = $(ee).text().trim();
          if (innerText.length) {
            if (day === 8) {
              if ($(ee).hasClass('Brød-dot')) {
                output += "\n\n* " + innerText.replace("•", "");
              } else
              if ($(ee).hasClass('Brød-dot-indryk')) {
                output += "\n\t* " + innerText.replace("-", "");;
              } else
              {
                output += "\n\n" + innerText;
              }
            } else
            if (!memVerse && day === 1) {
              output += "\n> " + innerText;
              memVerse = true;
              fMargins.shift();
            }
            else if (memVerse && day === 1 && !intro) {
              output += "\n\n**Introduktion**\n\n" + innerText;
              intro = true;
              fMargins.shift();
            }
            else if (memVerse && intro && day === 1 && innerText.indexOf("·") === 0) {
              if (!tekster) {
                output += "\n\n**Ugens tekster**\n";
                tekster = true;
                fMargins.shift();
              }
              output += "\n" + innerText.replace("·", "-");
            }
            else if (day === 7 && $(ee).hasClass("Brød-dot")) {
              if (!discussion) {
                output += "\n\n**Spørgsmål til drøftelse**:";
                discussion = true;
              }
              output += "\n\n`" + innerText + "`";
            }
            else if ($(ee).find(">.Bold").length && day <= 7 && !$(ee).hasClass("Brød-dot")) {
              var marg = (day < 7 && fMargins.length) ? fMargins.shift() : "";
              if (marg.length) {
                if (marg.indexOf("Til at") !== 0) {
                  marg = "Læs " + marg + ". ";
                } else {
                  marg = marg + ". ";
                }
              }
              output += "\n\n`" + marg + innerText + "`";
            }
            else {
              output += "\n\n" + innerText;
            }

          }
        })
      }
    }
  });
  writeStuff();
}

function parseSwahili(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("28/12/2018", DATE_FORMAT);

  var quarterly = require(path);

  let day = 1,
      week = 1;

  for(let result of quarterly.results) {
    let discussion = false;
    let title = result.title;
    let output = "---\ntitle:  "+title+"\ndate:  "+moment(result.date.iso).add(1,'d').format(DATE_FORMAT)+"\n---";
    if (day === 1){
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(result.date.iso).add(1,'d').format(DATE_FORMAT)+"\"\nend_date: \""+moment(result.date.iso).add(7,'d').format(DATE_FORMAT)+"\"");
      var $ = cheerio.load(result.verse, {decodeEntities: false});

      output += "\n\n### Soma Kwa Ajili ya Somo la Juma Hili\n" + $("h4").eq(0).text().trim().replace("Soma Kwa Ajili ya Somo la Juma Hili: ", "").trim();
      output += "\n\n> <p>Fungu la Kukariri</p>\n> " + $("h4").eq(1).text().trim().replace("Fungu la Kukariri:", "").trim();
    }

    result.content = result.content.replace(/\n/g, "</p><p>")

    var $ = cheerio.load(result.content, {decodeEntities: false});
    //$("em").each(function(i,e){
    //  $(e).html("_"+$(e).html()+"_");
    //});

    $("strong").each(function(i,e){
      $(e).html("`"+$(e).html().trim()+"`");
    });

    $("p").each(function(i,e){
      let text = $(e).text().trim();
      if (day === 7 && text.match(/^\d./)) {
        if (!discussion) {
          output += "\n\n**Maswali ya Mjadala**";
        }
        output += "\n\n`" + text + '`';
        discussion = true;
      } else if (text.indexOf("*Jifunze somo") === 0) {
        output += "\n\n_" + text + "_";
      } else {
        output += "\n\n" + text;
      }
    });

    output = output.replace(/(\n){2,}/g, "\n\n");

    fs.outputFileSync(destination + "/" + pad(week , 2) + "/0" + day +  ".md", output);
    if (++day === 8) {
      day = 1;
      week++;
      discussion = false;
    }
  }
}

function parseSwahili2(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var DATE_FORMAT_FILE = "YYYY-MM-DD";
  var start = moment("29/06/2019", DATE_FORMAT);

  execSync('rm -rf ' + path + 'content/');
  execSync('unzip ' + path + 'content.zip -d ' + path + 'content');

  var metadata = require(path + 'metadata.json');

  for (let i = 0; i < metadata.lessons.length; i++) {
    let lesson = metadata.lessons[i];

    fs.outputFileSync(destination + "/" + pad((i+1) , 2)+ "/info.yml", "---\ntitle: \""+lesson.title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");

    for (let j = 0; j < lesson.days.length; j++){
      let day = lesson.days[j];
      let output = "---\ntitle:  " + day.title + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
      let originalOutput = output.length;
      let file = fs.readFileSync(path + "content/" + day.date + ".html", "utf-8");
      let $ = cheerio.load(file, {decodeEntities: false});
      let sabbathReadings = false;
      $("body").children().each(function(i,e){
        let text = $(e).text().trim();
        if (!text.length) return;
        if (/^Soma kwa/ig.test(text)) {
          output += "\n\n### " + $(e).text().trim().replace(":", "");
          sabbathReadings = true;
        } else if ($(e).prop("tagName") === "BLOCKQUOTE") {
          output += "\n\n> <p>Fungu la Kukariri</p>";
          output += "\n> " + $(e).find("p").eq(1).text().trim();
        } else if (text.indexOf("Maswali ya Mjadala") === 0) {
          output += "\n\n**Maswali ya Mjadala**";
        } else if (sabbathReadings) {
          output += "\n" + text;
          sabbathReadings = false;
        } else if ($(e).find("code").length) {
          output += "\n\n`" + $(e).text().trim() + "`";
        } else {
          output += "\n\n" + $(e).text().trim();
        }
      });
      start = moment(start).add(1, 'd');
      if (originalOutput === output.length) {
        output += "\n\n" + "### <center>Tunafanya kazi kwenye somo hili.</center>\n<center>Tafadhali   rudi baadaye.</center>";
      }
      fs.outputFileSync(destination + "/" + pad((i+1) , 2)+ "/0" + (j+1) + ".md", output);
    }

    // story
  }
}

function parseMongolian(path, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});
  var startProcessing = false,
      day = 1,
      week = 0,
      output = null;

  var writeDay = function() {
    fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);
    day++;
    start = moment(start).add(1, 'd');
  };
  var title = "";

  $("body > div.inside-story").each(function(i,e){
    week++;
    output = "---\ntitle: Гэрчлэлийн Туух\ndate: "+moment(start).add(week*7-1, 'd').format(DATE_FORMAT)+"\n---";
    var insideTitle = null;
    $(e).children().each(function(ii,ee){
      if ($(ee).hasClass("Normal")) {
        if (!insideTitle) {
          output += "\n\n#### " + $(ee).text().trim();
          insideTitle = true;
        } else {
          output += "\n\n_" + $(ee).text().trim() + "_";
        }
      } else {
        output += "\n\n" + $(ee).text().trim();
      }

    });
    fs.outputFileSync(destination + "/" + pad(week, 2) + "/inside-story.md", output);
  });
  week = 0;
  $("body > div:not(.inside-story)").children().each(function(i, e) {
    if ($(e).hasClass("Title")) { startProcessing = true; }
    var text = $(e).text().trim();

    if (startProcessing && text.length) {
      if ($(e).hasClass("Title")) {
        title = text;
        console.log(title)
      } else if ($(e).hasClass("Sabbath-Afternoon")) {
        if (week > 0) {
          writeDay();
        }
        day = 1;
        week++;
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: "+title+"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
        output = "---\ntitle: "+title+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
      } else if ($(e).hasClass("Lesson-Title")) {
        writeDay();
        output = "---\ntitle:  "+text+"\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
      } else if ($(e).hasClass("Friday")) {
        if ((text.indexOf("Гүнзгийрүүлэн судлах") === 0) || (text.indexOf("Гүнзгийрүүлэн Судлах") === 0)) {
          writeDay();
          output = "---\ntitle:  Гүнзгийрүүлэн судлах\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
          output += "\n\n" + text.replace("Гүнзгийрүүлэн судлах: ", "");
        } else if (text.indexOf("Дүгнэлт") === 0) {
          output += "\n\n" + text.replace("Дүгнэлт", "**Дүгнэлт**");
        } else {
          output += "\n\n" + text;
        }
      } else if ($(e).hasClass("Memory-verse")) {
        if (text.indexOf("Цээжлэх Эшлэл") === 0) {
          output += "\n\n> <p>Цээжлэх Эшлэл</p>\n> ";
          output += text.replace("Цээжлэх Эшлэл: ", "");
        } else {
          output += "\n\n### Энэ Долоо Хоногт Судлах Эшлэлүүд\n";
          output += text.replace("Энэ Долоо Хоногт Судлах Эшлэлүүд: ", "");
        }
      } else if ($(e).hasClass("Body-text")) {
        if (text.indexOf("*Энэ хичээлийг") === 0 || text.indexOf("*Энэ долоо") === 0) {
          output += "\n\n_" + text + "_";
        } else {
          output += "\n\n" + text;
        }
      } else if ($(e).hasClass("Question") || $(e).hasClass("Last-question")) {
        if (text.indexOf("Хэлэлцэх асуултууд") === 0) {
          output += "\n\n**Хэлэлцэх асуултууд**";
        } else if ((text.indexOf("Ярилцах асуултууд") === 0) || (text.indexOf("Ярилцах Асуултууд") == 0)) {
          output += "\n\n**Ярилцах асуултууд**";
        } else {
          output += "\n\n`" + text + "`";
        }
      } else if ($(e).hasClass("Basic-Table")) {
        $(e).find("p.Body-text").each(function (ii, ee) {
          output += "\n\n`" + $(ee).text().trim() + "`";
        });
      }
    }
  });
  writeDay();
}

function capitalizeTitles (originalDestination, destination){
  for (var week = 1; week <= 13; week++){
    for (var day = 1; day <= 7; day++) {
      var original = metaMarked(fs.readFileSync(originalDestination + "/" + pad(week, 2) + "/0" + day + ".md", "utf-8"));
      original.meta.title = changeCase.title(original.meta.title);
      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", "---\n" + yamljs.stringify(original.meta, 4) + "---" + original.markdown);
    }
  }
}

var fixDates = function(originalDestination, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  for (var week = 1; week <= 13; week++){
    for (var day = 1; day <= 7; day++) {
      var original = metaMarked(fs.readFileSync(originalDestination + "/" + pad(week, 2) + "/0" + day + ".md", "utf-8"));
      original.meta.date = moment(start).format(DATE_FORMAT);
      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", "---\n" + yamljs.stringify(original.meta, 4) + "---" + original.markdown);
      start = moment(start).add(1, 'd');
    }
  }
};

function parseSwedish(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path + "/MB 3-2019_1R.html", "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});
  let startPrase = false;

  let title =
  $("body").children().each(function(i,e){
    if ($(e).find("p.Normal > span.Rubrik").length){
      startPrase = true;
      console.log($(e).text().trim())
    }
    if (!startPrase) return;

  })
}

function parseLao(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var day = 0;
  var week = 0;
  var output = null;
  var title = null;
  var sabbathTick = 0;

  var writeOutput = function () {
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/0" + day + ".md", output);
  };


  $("body").children().each(function(i,e){
    var text = $(e).text().trim();
    if (!text || !text.length) return;

    if (text.indexOf('(') === 0 && text.indexOf(')') > 0) {
      return;
    }

    if (text.length <= 2 && !isNaN(text) && (parseInt(text) > 0 && parseInt(text) < 14)) {
      if (week > 0) {
        writeOutput();
        start = moment(start).add(1, 'd');
      }
      output = null;
      week++;
      day = 1;
      title = null;
      sabbathTick = 0;
    } else if (!title && $(e).find('strong').length) {
      title = text;
      fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
      output = "---\ntitle: " + title + "\ndate: " + moment(start).format(DATE_FORMAT) +"\n---";
    } else if (
      text.indexOf('ບ່າຍວັນສະບາໂຕ') === 0 ||
      text.indexOf('ບ່າຍ​ວັນ​ສະ​ບາ​ໂຕ') === 0 ||
      text.indexOf('ພຣະຄຳພີໃໝ່') === 0
    ) {
      // Sabbath
    } else if (
      text.indexOf('ວັນອາທິດ') === 0 || text.indexOf('ວັນ​ອາ​ທິດ') === 0 || text.indexOf('ວັນ​ອາທິດ') === 0 ||
      text.indexOf('ວັນຈັນ') === 0 || text.indexOf('ວັນ​ຈັນ') === 0 ||
      text.indexOf('ວັນອັງຄານ') === 0 || text.indexOf('ວັນ​ອັງ​ຄານ') === 0 ||
      text.indexOf('ວັນພຸດ') === 0 || text.indexOf('ວັນ​ພຸດ') === 0 ||
      text.indexOf('ວັນພະຫັດ') === 0 || text.indexOf('ວັນ​ພະ​ຫັດ') === 0 ||
      text.indexOf('ວັນສຸກ') === 0 || text.indexOf('ວັນ​ສຸກ') === 0
    ) {
      start = moment(start).add(1, 'd')
      writeOutput();
      title = text.substr(text.indexOf(':') + 1).trim();
      if (title.indexOf('(') > 0) {
        title = title.substr(0, title.indexOf('(')).trim()
      }
      if (text.indexOf('ວັນສຸກ') === 0) {
        title = "ຂໍ້ຄິດເພີ່ມເຕີມ";
      }
      output = "---\ntitle: " + title + "\ndate: " + moment(start).format(DATE_FORMAT) + "\n---";
      day++;

    } else if (text.indexOf('ຄຳຖາມຄົ້ນຄວ້າ') === 0) {
      output += '\n\n**ຄຳຖາມຄົ້ນຄວ້າ**';
    } else if ($(e).find('li').length) {
      $(e).find('li').each(function(ii,ee){
        output += "\n\n`" + $(ee).text().trim() + '`'
      })
    } else if ($(e).find('strong').length) {
      if (day === 1) {
        if (text.indexOf(":") > 0 && sabbathTick < 2) {
          var subtext = text.indexOf(":");
          if (sabbathTick === 0) {
            output += "\n\n### " + text.substr(0, subtext).trim();
            output += "\n" + text.substr(subtext+1).trim();
          } else {
            output += "\n\n> <p>" + text.substr(0, subtext).trim() + "</p>";
            output += "\n> " + text.substr(subtext+1).trim();
          }

          sabbathTick++;
        } else {
          output += "\n\n" + text;
        }
      } else if (day === 7) {
        output += "\n\n" + text;
      } else {
        var strongText = $(e).find('strong').text().trim();
        if (strongText.length > 5) {
          output += "\n\n`" + text + '`'
        } else {
          output += "\n\n" + text;
        }
      }
    } else {
      if (day === 1 && text.indexOf(":") > 0 && sabbathTick < 2) {
        if (text.indexOf(":") > 0 && sabbathTick < 2) {
          var subtext = text.indexOf(":");
          if (sabbathTick === 0) {
            output += "\n\n### " + text.substr(0, subtext).trim();
            output += "\n" + text.substr(subtext+1).trim();
          } else {
            output += "\n\n> <p>" + text.substr(0, subtext).trim() + "</p>";
            output += "\n> " + text.substr(subtext+1).trim();
          }
          sabbathTick++;
        } else {
          output += "\n\n" + text;
        }
      } else {
        output += "\n\n" + text;
      }

    }
  })
  writeOutput();
}

var parseMalay = function(path, destination) {
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var day = 0;
  var week = 0;
  var output = null;
  var title = null;
  var sabbathTick = 0;

  var writeOutput = function () {
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/0" + day + ".md", output);
  };

  $("body").children().each(function(i,e){
    var text = $(e).text().trim();
    if (!text || !text.length) return;
    if (/^(Petang Sabat|_+)/i.test(text)){
      return;
    }
    if (/^Pelajaran \d/i.test(text)) {
      if (week > 0) {
        writeOutput();
        start = moment(start).add(1, 'd');
      }
      output = null;
      week++;
      day = 1;
      title = null;
      sabbathTick = 0;
    } else if (!title && $(e).find('strong').length && day !== 7) {
      title = text;
      if (day === 1) {
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
      }

      output = "---\ntitle: " + title + "\ndate: " + moment(start).format(DATE_FORMAT) +"\n---";
    } else if (
      /^(Ahad|Isnin|Selasa|Rabu|Khamis|Jumaat)/i.test(text)
    ) {
      writeOutput();
      start = moment(start).add(1, 'd');
      day++;
      title = null;
      if (day === 7) {
        title = "Pandangan Tambahan"
        output = "---\ntitle: " + title + "\ndate: " + moment(start).format(DATE_FORMAT) +"\n---";
      }
    } else {
      if (day === 1) {
        var subtext = text.indexOf(":");
        if (sabbathTick === 0) {
          output += "\n\n### " + text.substr(0, subtext).trim();
          output += "\n" + text.substr(subtext+1).trim();
          sabbathTick++;
        } else if (sabbathTick === 1) {
          output += "\n\n> <p>" + text.substr(0, subtext).trim() + "</p>";
          output += "\n> " + text.substr(subtext+1).trim();
          sabbathTick++;
        } else if (text.indexOf("*Pelajari") === 0) {
          output += "\n\n_" + text + "_";
        } else {
          output += "\n\n" + text;
        }
      } else if (day === 7) {
        if (/^Pandangan/i.test(text)) {
          output += "\n\n" + text.substr(text.indexOf(":")+1).trim();
        } else if (/^Soalan/i.test(text)) {
          output += "\n\n**Soalan Perbincangan**";
        } else if ($(e).find('li').length) {
          $(e).find('li').each(function(ii,ee){
            output += "\n\n`" + $(ee).text().trim() + '`'
          })
        } else if (/^Kesimpulan/i.test(text)) {
          output += "\n\n" + text.replace("Kesimpulan", "**Kesimpulan**")
        } else {
          output += "\n\n" + text;
        }
      } else {
        if ($(e).find('strong').length) {
          $(e).find('strong').prepend(' ');
          text = $(e).text().trim();
          var strongText = $(e).find('strong').text().trim();
          if (strongText.length > 5) {
            output += "\n\n`" + text + '`'
          } else {
            output += "\n\n" + text;
          }
        } else {
          output += "\n\n" + text;
        }
      }
    }
  })

  writeOutput();
};

var parseBulgarian = function(path, destination) {
  // DO NOT FORGET TO REMOVE &shy;
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("29/06/2019", DATE_FORMAT);

  var file = fs.readFileSync(path, "utf-8");
  var $ = cheerio.load(file, {decodeEntities: false});

  var day = 0;
  var week = 0;
  var output = null;
  var title = null;
  var sabbathTick = 0;

  var writeOutput = function () {
    fs.outputFileSync(destination + "/" + pad(week , 2)+ "/0" + day + ".md", output);
  };

  $("body").children().each(function(i,e){
    $(e).find('strong').prepend(' ').append(' ');
    $(e).find('em').prepend(' ').append(' ');
    var text = $(e).text().trim().replace(/\ {2,}/g, " ").replace(/\u{00AC}/ug, "");

    if (!text || !text.length) return;

    if (/^(Залез:|_+|Събота следобед)/i.test(text)){
      return;
    }

    if (/^Урок \d/i.test(text)) {
      if (week > 0) {
        writeOutput();
        start = moment(start).add(1, 'd');
      }
      output = null;
      week++;
      day = 1;
      title = null;
      sabbathTick = 0;
    } else if (!title && $(e).find('strong').length) {
      title = text;
      output = "---\ntitle: " + title + "\ndate: " + moment(start).format(DATE_FORMAT) +"\n---";
      if (day === 1) {
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
      }
    } else if (
      /^(Неделя|Понеделник|Вторник|Сряда|Четвъртък|Петък)/i.test(text)
    ) {
      writeOutput();
      start = moment(start).add(1, 'd');
      day++;
      title = null;
    } else {
      if (day === 1) {
        var subtext = text.indexOf(":");
        if (sabbathTick === 0) {
          output += "\n\n### " + text.substr(0, subtext).trim();
          output += "\n" + text.substr(subtext+1).trim();
          sabbathTick++;
        } else if (sabbathTick === 1) {
          output += "\n\n> <p>" + text.substr(0, subtext).trim() + "</p>";
          output += "\n> " + text.substr(subtext+1).trim();
          sabbathTick++;
        } else {
          output += "\n\n" + text;
        }
      } else if (day === 7) {
        if (/^Въпроси за разискване/i.test(text)) {
          output += "\n\n**Въпроси за разискване**";
        } else if ($(e).find('li').length) {
          $(e).find('li').each(function(ii,ee){
            output += "\n\n`" + $(ee).text().trim().replace(/ {2,}/g, " ") + '`'
          })
        } else if (/^Обобщение/i.test(text)) {
          output += "\n\n" + text.replace("Обобщение", "**Обобщение**")
        } else {
          output += "\n\n" + text;
        }
      } else {
        if ($(e).find('strong').length) {
          $(e).find('strong').prepend(' ');
          text = $(e).text().trim().replace(/ {2,}/g, " ");
          var strongText = $(e).find('strong').text().trim();
          if (strongText.length > 5) {
            output += "\n\n`" + text + '`'
          } else {
            output += "\n\n" + text;
          }
        } else if (/_{3,}/.test(text)) {
          output += "\n\n`" + (text.replace(/_/g, "")).trim() + '`'
        } else {
          output += "\n\n" + text;
        }
      }
    }
  });

  writeOutput();
};

// parseEGWEs("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/es/", "src/es/2019-03", "test/z");
// parseEGWEn("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/en/EGW/text/", "src/en/2019-03", "test/z");
// parseRussianCQ("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/ru/youth/OEBPS/Text/", "test/z");
// parseRussian("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/ru/adult/OEBPS/Text/", "test/z");
// parseEnglishCQ("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/en/cq/", "test/z");
/// parseItalian2("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/it/OEBPS/Text/", "TOC.xhtml", "test/z", false);
// scrapeHungarian("test/z");
// parseChinese("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation/2018-03/zh/2018年第3季學課(繁體) - traditional.txt", "test/z");
// parseSpanish("/Users/vitaliy/Downloads/2018q3es", "test/z");
// parseEnglish("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation/2018-04/en/2018q4en", "test/z");
// parseEnglishABSG("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/en/ABSG", "test/z");
// cleanRussianEpub("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation/2018-03/ru/epub/OEBPS/Text/Section0004.xhtml");
// parseTurkish("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/MENA/ABSG MENA 3Q19/ABSG 2019 3Q TR Body Converted.html", "test/z")
// parsePolish("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-02/pl/OEBPS/Lekcje_Biblijne_2019-2_ePub_a.xhtml", 'test/z');
// parsePolish2("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/pl/OEBPS/Lekcje_Biblijne_2019-3_ePub_d.xhtml", 'test/z');
// parseArabic("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/MENA/ABSG MENA 3Q19/ABSG Arabic 2019-3Q Body Converted.html", 'test/z');
// parseFarsi("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/MENA/ABSG MENA 3Q19/ABSG Farsi 2019-3Q Body Converted.html", 'test/z');
// parseEnglishEPUB("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation/2019-01/en/EPUB/OEBPS/193066bEAQ119_copy.xhtml", "test/z")
// scrapeRomanian('test/z');
// parseCzech("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation/2018-04/cs/BU 4 2018.html", "test/z");
/// parseCzechEpub("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/cs/PSB 3 2019.html", "test/z");
// scrapeNorwegian("2019/3", "test/z")
// parseFrenchEPUB("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/MENA/ABSG MENA 3Q19/ABSG 3Q 2019 FR web.html", "test/z")
// parseDanish('/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/da/2019 BS 3 kvartal.html', 'test/z');
// parseSwahili('/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-02/sw/2019-02.json', 'test/z');
parseSwahili2('/Users/vitaliy/Sites/ibada-content/public/ssh/2019-3/', 'test/z');
// parseMongolian("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/mn/ASSL#3_2019.html", "test/z");
// capitalizeTitles("src/vi/2019-02", "test/z");
// fixDates("src/ka/2019-03", "test/z");
// parseSwedish("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/sv/Bibelstudium 3 kvartal 2019", "test/z")
// parseLao("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/lo/Combined Q3 2019.html", "test/z")
// parseMalay("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/ms/PSS K3 2019 Edisi Umum.html", "test/z")
// parseBulgarian("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-03/bg/2019-III trimesechie_Ivalina_ZA STRANIRANE.html", "test/z")
