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
  var url = "http://bibleonline.ru/search/?s="+encodeURIComponent(verseFind);

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
          var $ = cheerio.load(body);
          var v_t = [],
            output = "";

          if ($("h3").length){
            $("h3").each(function(i, e){
              var raw = $(e).text().trim();
              v_t.push("<h3>"+raw+"</h3><p>");
            });
          } else {
            $("h2.sprite:not(.trans)").each(function(i, e){
              var raw = $(e).text().trim();
              raw = raw.substr(0, (raw.indexOf("\n")>-1) ? raw.indexOf("\n") : raw.length);

              if (raw.indexOf("Параллельные места") == -1){
                v_t.push("<h3>"+raw+"</h3><p>");
              }
            });
          }

          $(".biblecont ol").each(function(i, e){
            $(e).children().each(function(ii, ee){
              v_t[i] += "<sup>"+$(ee).attr("value").trim()+"</sup><span>" + $(ee).text() + "</span>";
            });
            v_t[i] += "</p>";
          });

          for (var i = 0; i < v_t.length; i++){
            output += v_t[i];
          }

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

function parse_ru(read, callback){
  var bible_books = "Быт|Исх|Лев|Чис|Числ|Втор|Нав|Суд|Руф|1(–?-?а?я?e? ?)?Цар|2(–?-?а?я?e? ?)?Цар|3(–?-?а?я?e? ?)?Цар|4(–?-?а?я?e? ?)?Цар|1(–?-?а?я?e? ?)?Пар|2(–?-?а?я?e? ?)?Пар|Езд|Неем|Есф|Иов|Пс|Псал|Прит|Притч|Еккл|Песн|Ис|Исаи|Иер|Плач|Иез|Дан|Ос|Иоил|Иоиль|Ам|Амос|Авд|Ион|Иона|Мих|Наум|Авв|Соф|Агг|Зах|Мал|Мф|Мат|Мк|Мр|Мар|Лк|Лук|Ин|Иоан|Деян|Иак|1(–?-?а?я?e? ?)?Пет|2(–?-?а?я?e? ?)?Пет|1(–?-?а?я?e? ?)?Петр|2(–?-?а?я?e? ?)?Петр|1(–?-?а?я?e? ?)?Ин|1(–?-?а?я?e? ?)?Иоан|2(–?-?а?я?e? ?)?Ин|2(–?-?а?я?e? ?)?Иоан|3(–?-?а?я?e? ?)?Ин|3(–?-?а?я?e? ?)?Иоан|Иуд|Иуды|Рим|1(–?-?а?я?e? ?)?Кор|2(–?-?а?я?e? ?)?Кор|Гал|Еф|Ефес|Флп|Филип|Кол|1(–?-?а?я?e? ?)?Фес|2(–?-?а?я?e? ?)?Фес|1(–?-?а?я?e? ?)?Тим|2(–?-?а?я?e? ?)?Тим|Тит|Флм|Филим|Евр|Евреям|Откр";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](?!"+bible_books+"))+)", "ig");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_syno = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){
      var verse = customTrim(verses[i], " ;,()<>.:-");

      if (((verse.split(",").length - 1) > 1) || (((verse.split(",").length - 1) == 1) && (verse.split("-").length - 1) > 0)){
        var tmp = verse.match(bible_book_regexp);
        if (tmp){
          tmp = tmp[0];

          var f_verse = "",
            m_verses = verse.match(/([0-9:-]+)/g),
            m_chapter = "";

          for (var mv = 0; mv < m_verses.length; mv++){
            if (m_verses[mv].indexOf(":") != -1){
              m_chapter = m_verses[mv].match(/([0-9]+:)/g)[0];
              f_verse += tmp + " " + m_verses[mv] + "; ";
            } else {
              f_verse += tmp + " " + m_chapter + m_verses[mv] + "; ";
            }
          }

          read = read.replace(new RegExp(verse, "ig"), f_verse);
          verse = customTrim(f_verse, " ;,()<>.");
        }
      }
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
      (function(verseKey, verseFind){scrape_tasks_syno.push(function(cb){
        scrape(verseKey, verseFind, "SYNO", cb);
      })})(final_verse, find_verse);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_syno, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "Синод.", "verses": verses, "read": read});
        });
      }
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_ru;