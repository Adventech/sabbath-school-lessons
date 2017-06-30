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
  var bible_books = "Gen|Exod|Exod|Lev|Num|Deut|Josh|Judg|Ruth|1 ?Sam|2 ?Sam|1 ?Kgs|2 ?Kgs|1 ?Chr|2 ?Chr|1 ?Chron|2 ?Chron|Ezra|Neh|Esth|Job|Ps|Prov|Eccl|Song|Isa|Jer|Lam|Ezek|Dan|Hos|Joel|Amos|Obad|Jonah|Mic|Nah|Hab|Zeph|Hag|Zech|Mal|Matt|Mark|Luke|John|Acts|Rom|1 ?Cor|2 ?Cor|Gal|Eph|Phil|Col|1 ?Thess|2 ?Thess|1 ?Tim|2 ?Tim|Titus|Phlm|Heb|Jas|1 ?Pet|2 ?Pet|1 ?John|2 ?John|3 ?John|Jude|Rev|Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](\ and\ )?(?!"+bible_books+"))+)", "ig");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_nkjv = [],
      scrape_tasks_kjv = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){
      var verse = customTrim(verses[i], " ;,()<>.:-");

      if (verse.indexOf(" and ") > 0){
          var new_verse = verse.replace(" and ", ", ");
          read = read.replace(new RegExp(verse, "ig"), new_verse);
          verse = new_verse;
      }

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