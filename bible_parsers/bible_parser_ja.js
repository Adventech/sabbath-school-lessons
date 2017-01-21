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
  var url = "http://mobile.legacy.biblegateway.com/passage/?search=" + encodeURIComponent(verseFind) + "&version=" + version;

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
          var $ = cheerio.load(body);

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

function parse_en(read, callback){
  var bible_books = "創|出|レビ|民|申|ヨシュ|士|ルツ|サム上|サム下|王上|王下|代上|代下|エヅ|ネへ|エス|ヨブ|詩|箴|コヘ|雅|イザ|エレ|哀|エゼ|ダニ|ホセ|ヨエ|アモ|オバ|ヨナ|ミカ|ナホ|ハバ|ゼファ|ハガ|ゼカ|マル|マタイ|まるこ|ルカ|ヨハネ|使徒|ロマ|一コリ|二コリ|ガラ|エフェ|フィリ|コロ|一テサ|二テサ|一テモ|二テモ|テト|フィレ|ヘブ|ヤコ|一ペト|二ペト|一ヨハ|二ヨハ|三ヨハ|ユダ|黙|創世記|出エジプト記|レビ記|民数記|申命記|ヨシュア記|士師記|ルツ記|サムエル記上|サムエル記下|列王記上|列王記下|歴代誌上|歴代誌下|エズラ記|ネヘミヤ記|エズラ記|ヨブ記|詩篇|箴言|コヘレトの言葉|雅歌|イザヤ書|エレミヤ書|哀歌|エゼキエル書|ダニエル書|ホセア書|ヨエル書|アモス書|オバ書|ヨナ書|ミカ書|ナホム書|ハバクク書|ゼファニヤ書|ハガイ書|ゼカリヤ書|マラキ書|マタイによる福音書|マルコによる福音書|ルカによる福音書|ヨハネによる福音書|使徒言行録|ローマの使徒への手紙|コリントの信徒への手紙一|コリントの信徒への手紙二|ガラテヤの信徒への手紙|エフェソの信徒への手紙|フィリピの信徒への手紙|コロサイの信徒への手紙|テサロニケの信徒への手紙一|テサロニケの信徒への手紙二|テモテへの手紙一|テモテへの手紙二|テトスへの手紙|フィレモンへの手紙|ヘブライ人への手紙|ヤコブの手紙|ペトロの手紙一|ペトロの手紙二|ヨハネの手紙一|ヨハネの手紙二|ヨハネの手紙三|ユダの手紙|ヨハネの黙示録";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](?!"+bible_books+"))+)", "ig");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_nkjv = [],
      scrape_tasks_kjv = [];

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

      var final_verse = verses_parsed[i].replace(/\.|\#|\$|\/|\[|\]/g, '');
      read = read.replace(new RegExp('(?!<a[^>]*?>)('+verses_parsed[i]+')(?![^<]*?</a>)', "g"), '<a class="verse" verse="'+final_verse+'">'+verses_parsed[i]+'</a>');
      (function(verseKey, verseFind){scrape_tasks_kjv.push(function(cb){
        scrape(verseKey, verseFind, "KJV", cb);
      })})(final_verse, verses_parsed[i]);

      (function(verseKey, verseFind){scrape_tasks_nkjv.push(function(cb){
        scrape(verseKey, verseFind, "NKJV", cb);
      })})(final_verse, verses_parsed[i]);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_nkjv, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "NKJV", "verses": verses, "read": read});
        });
      },

      function(callback){
        async.series(scrape_tasks_kjv, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "KJV", "verses": verses, "read": read});
        });
      }
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_en;
