var async = require("async"),
  redis = require("redis"),
  cheerio = require("cheerio"),
  request = require("request");

var customTrim = function(s, charlist) {
  var tmp = s.replace(new RegExp("^[" + charlist + "]+"), "");
  tmp = tmp.replace(new RegExp("[" + charlist + "]+$"), "")
  return tmp;
};

function scrape(verseKey, verseFind, version, cb){
  var redis_client = redis.createClient();
  var url = "http://mobile.legacy.biblegateway.com/passage/?search=" + encodeURIComponent(verseFind) + "&version=UKR";

  redis_client.get(url, function(err, reply) {
    if (!reply){
      request(
        {
          "url": url,
          "headers" : {
            "User-Agent": "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)"
          }
        },
        function(err, response, body) {
          if (err) {console.log(err);}

          var output = "";
          var $ = cheerio.load(body, {decodeEntities: false});

          $(".publisher-info-bottom").remove();
          $(".passage-display-version").remove();

          $(".passage-wrap > .passage-content").find(".passage-display, p").each(function(i, e){
            $(e).find(".footnote, .footnotes").remove();
            $(e).removeAttr("class");
            $(e).removeAttr("id");
            $(e).find("p, span, div, sup").removeAttr("class");
            $(e).find("p, span, div, sup").removeAttr("id");
            output += $("<div></div>").html($(e).clone()).html();
            output = output.replace("h1>", "h3>");
          });

          redis_client.set(url, output);
          redis_client.quit();

          var result = {};
          result[verseKey] = output;

          cb(null, result);
        }
      );
    } else {
      redis_client.quit();
      var result = {};
      result[verseKey] = reply;
      cb(null, result);
    }
  });
}

function parse_uk(read, callback){
  var bible_books = "Буття|Бут|Вихід|Вих|Левит|Лев|Числа|Чис|Повторення Закону|П. Зак|Ісус Навин|Нав|Книга Суддів|Суд|Рут|Рут|1 Самуїлова|1? Сам|2 Самуїлова|2? Сам|1 царів|1? Цар|2 царів|2? Цар|1 хроніки|1? Хр|2 хроніки|2? Хр|Ездра|Неемія|Неєм|Естер|Ест|Йов|Йов|Йова|Псал|Псалми|Пс|Прип|Приповісті|Пр|Екклезіяст|Екл|Пісня над піснями|Пісн|Ісая|Ісаї|Єремія|Плач Єремії|Єрем|Плач|Єзек|Єзекіїль|Єз|Даниїл|Дан|Осія|Йоїла|Йоїл|Йоіл|Амос|Амоса|Овдій|Авд|Йона|Йони|Йон|Михей|Мих|Наум|Наум|Авакум|Софонія|Соф|Огій|Аг|Захарія|Зах|Малахії|Мал|Від Матвія|Матв|Від Марка|Марка|Від Луки|Луки|Від Івана|Івана|Дії|Дії|До римлян|Римл|1 до коринтян|1? Кор|2 до коринтян|2? Кор|До галатів|Гал|До ефесян|Ефес|До филип'ян|Филп|Флп|До колоссян|Кол|Колос|1 до солунян|1? Сол|2 до солунян|2? Сол|1 Тимофію|1? Тим|2 Тимофію|2? Тим|До Тита|Тит|До Филимона|Флм|До євреїв|Євр|Якова|Яков|1 Петра|1? Пт|2 Петра|2? Пт|1 Івана|1? Ів|2 Івана|2? Ів|3 Івана|2? Ів|Юда|Юд|Об'явлення|Об'явл";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](?!"+bible_books+"))+)", "ig");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_ukr = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){
      var verse = customTrim(verses[i], " ;,()<>.:-");

      var ukrainian_verse_replacement = [
        {"s": /^Бут\.? /gi, "r": "Буття "},
        {"s": /^Вих\.? /gi, "r": "Вихід "},
        {"s": /^Лев\.? /gi, "r": "Левит "},
        {"s": /^Чис\.? /gi, "r": "Числа "},
        {"s": /^П. Зак\.? /gi, "r": "Повторення Закону "},
        {"s": /^Нав\.? /gi, "r": "Ісус Навин "},
        {"s": /^І. Нав\.? /gi, "r": "Ісус Навин "},
        {"s": /^Суд\.? /gi, "r": "Книга Суддів "},
        {"s": /^Рут\.? /gi, "r": "Рут "},
        {"s": /^1 Сам\.? /gi, "r": "1 Самуїлова "},
        {"s": /^2 Сам\.? /gi, "r": "2 Самуїлова "},
        {"s": /^1 Цар\.? /gi, "r": "1 царів "},
        {"s": /^2 Цар\.? /gi, "r": "2 царів "},
        {"s": /^1 Хр\.? /gi, "r": "1 хроніки "},
        {"s": /^2 Хр\.? /gi, "r": "2 хроніки "},
        {"s": /^Ез\.? /gi, "r": "Ездра "},
        {"s": /^Неєм\.? /gi, "r": "Неемія "},
        {"s": /^Ест\.? /gi, "r": "Естер "},
        {"s": /^Йова\.? /gi, "r": "Йов "},
        {"s": /^Псал\.? /gi, "r": "Псалми "},
        {"s": /^Пр\.? /gi, "r": "Приповісті "},
        {"s": /^Прип\.? /gi, "r": "Приповісті "},
        {"s": /^Екл\.? /gi, "r": "Екклезіяст "},
        {"s": /^Пісн\.? /gi, "r": "Пісня над піснями "},
        {"s": /^Ісаї\.? /gi, "r": "Ісая "},
        {"s": /^Єр\.? /gi, "r": "Єремія "},
        {"s": /^Єрем\.? /gi, "r": "Єремія "},
        {"s": /^Плач\.? /gi, "r": "Плач Єремії "},
        {"s": /^Єз\.? /gi, "r": "Єзекіїль "},
        {"s": /^Єзек\.? /gi, "r": "Єзекіїль "},
        {"s": /^Дан\.? /gi, "r": "Даниїл "},
        {"s": /^Ос\.? /gi, "r": "Осія "},
        {"s": /^Йоіл\.? /gi, "r": "Йоїл "},
        {"s": /^Амоса\.? /gi, "r": "Амос "},
        {"s": /^Авд\.? /gi, "r": "Овдій "},
        {"s": /^Йони\.? /gi, "r": "Йона "},
        {"s": /^Мих\.? /gi, "r": "Михей "},
        {"s": /^Наум\.? /gi, "r": "Наум "},
        {"s": /^Ав\.? /gi, "r": "Авакум "},
        {"s": /^Соф\.? /gi, "r": "Софонія "},
        {"s": /^Аг\.? /gi, "r": "Огій "},
        {"s": /^Зах\.? /gi, "r": "Захарія "},
        {"s": /^Мал\.? /gi, "r": "Малахії "},
        {"s": /^Матв\.? /gi, "r": "Від Матвія "},
        {"s": /^Марка\.? /gi, "r": "Від Марка "},
        {"s": /^Луки\.? /gi, "r": "Від Луки "},
        {"s": /^Івана\.? /gi, "r": "Від Івана "},
        {"s": /^Дії\.? /gi, "r": "Дії "},
        {"s": /^Римл\.? /gi, "r": "До римлян "},
        {"s": /^1 Кор\.? /gi, "r": "1 до коринтян "},
        {"s": /^2 Кор\.? /gi, "r": "2 до коринтян "},
        {"s": /^Гал\.? /gi, "r": "До галатів "},
        {"s": /^Ефес\.? /gi, "r": "До ефесян "},
        {"s": /^Флп\.? /gi, "r": "До филипян "},
        {"s": /^Филп\.? /gi, "r": "До филипян "},
        {"s": /^Кол\.? /gi, "r": "До колоссян "},
        {"s": /^Колос\.? /gi, "r": "До колоссян "},
        {"s": /^1 Сол\.? /gi, "r": "1 до солунян "},
        {"s": /^2 Сол\.? /gi, "r": "2 до солунян "},
        {"s": /^1 Тим\.? /gi, "r": "1 Тимофію "},
        {"s": /^2 Тим\.? /gi, "r": "2 Тимофію "},
        {"s": /^Тит\.? /gi, "r": "До Тита "},
        {"s": /^Флм\.? /gi, "r": "До Филимона "},
        {"s": /^Євр\.? /gi, "r": "До євреїв "},
        {"s": /^Як\.? /gi, "r": "Якова "},
        {"s": /^1 Пт\.? /gi, "r": "1 Петра "},
        {"s": /^2 Пт\.? /gi, "r": "2 Петра "},
        {"s": /^1 Ів\.? /gi, "r": "1 Івана "},
        {"s": /^2 Ів\.? /gi, "r": "2 Івана "},
        {"s": /^2 Ів\.? /gi, "r": "3 Івана "},
        {"s": /^Юд\.? /gi, "r": "Юда "},
        {"s": /^Об'явл\.? /gi, "r": "Обявлення "}
      ];
      //console.log(verse);

      for (var sr = 0; sr < ukrainian_verse_replacement.length; sr++){
        if (verse.indexOf(ukrainian_verse_replacement[sr]["s"]) == -1){
          var new_verse = verse.replace(ukrainian_verse_replacement[sr]["s"], ukrainian_verse_replacement[sr]["r"]);
          read = read.replace(new RegExp(verse, "ig"), new_verse);
          verse = new_verse;
        }
      }

      //if (((verse.split(",").length - 1) > 1) || (((verse.split(",").length - 1) == 1) && (verse.split("-").length - 1) > 0)){
      //  var tmp = verse.match(bible_book_regexp);
      //  if (tmp){
      //    tmp = tmp[0];
      //
      //    var f_verse = "",
      //      m_verses = verse.match(/([0-9:-]+)/g),
      //      m_chapter = "";
      //
      //    for (var mv = 0; mv < m_verses.length; mv++){
      //      if (m_verses[mv].indexOf(":") != -1){
      //        m_chapter = m_verses[mv].match(/([0-9]+:)/g)[0];
      //        f_verse += tmp + " " + m_verses[mv] + "; ";
      //      } else {
      //        f_verse += tmp + " " + m_chapter + m_verses[mv] + "; ";
      //      }
      //    }
      //
      //    read = read.replace(new RegExp(verse, "ig"), f_verse);
      //    verse = customTrim(f_verse, " ;,()<>.");
      //  }
      //}
      if (verse.length > 0 && verse.match(/\d/g)) {
        verses_parsed.push(verse);
      }
    }

    verses_parsed = verses_parsed.sort(function(a, b){
      return b.length - a.length;
    });

    for (var i = 0; i < verses_parsed.length; i++){

      var final_verse = verses_parsed[i].replace(/\.|\#|\$|\/|\[|\]/g, '').replace(/–/g, "-"),
          find_verse = verses_parsed[i].replace(/–/g, "-");
      read = read.replace(new RegExp('(?!<a[^>]*?>)('+verses_parsed[i]+')(?![^<]*?</a>)', "g"), '<a class="verse" verse="'+final_verse+'">'+find_verse+'</a>');
      (function(verseKey, verseFind){scrape_tasks_ukr.push(function(cb){
        scrape(verseKey, verseFind, "UKR", cb);
      })})(final_verse, find_verse);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_ukr, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "UKR.", "verses": verses, "read": read});
        });
      }
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_uk;