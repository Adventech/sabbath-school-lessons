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
  var url = "https://www.academic-bible.com/en/online-bibles/luther-bible-1984/read-the-bible-text/bibel/text/lesen/?tx_buhbibelmodul_bibletext[scripture]=" + encodeURIComponent(verseFind);

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

          output += "<h3>" + $(".location .name").text() + "</h3>";
          output += "<h3>" + $(".location .scripture").text() + "</h3>";

          var main = "";

          $(".highlight").each(function(i, e){
            $(e).find("span").removeAttr("class");
            $(e).find("span").removeAttr("data-location");
            $(e).find("span").removeAttr("id");
            $(e).find("blockquote").each(function(i, e){
              $(e).replaceWith($(e).text());
            });
            main += $(e).html();
          });

          if (!main.length){
            $(".markdown").find("span").removeAttr("class");
            $(".markdown").find("span").removeAttr("data-location");
            $(".markdown").find("span").removeAttr("id");
            $(".markdown").find("blockquote").each(function(i, e){
              $(e).replaceWith($(e).text());
            });
            main += $(".markdown").html();
          }

          output += main;

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

function parse_de(read, callback){
  var bible_books = "Gen|1\\.? ?Mos?|Ex|2\\.? ?Mos?|Lev|3\\.? ?Mos?|Num|4\\.? ?Mos?|Dtn|5\\.? ?Mos?|Jos|Ri|Rut|1?\\.? Sam|2?\\.? Sam|1?\\.? Koen|1?\\.? Kön|2?\\.? Koen|2?\\.? Kön|1?\\.? Chr|2?\\.? Chr|Esr|Neh|Est|Hi|Ps|Pss|Spr|Pred|Koh|Hld|Jes|Jer|Klgl|Ez|Hes|Dan|Hos|Jo|Am|Obd|Jon|Mi|Nah|Hab|Zef|Hag|Sach|Mal|Mt|Mk|Lk|Joh|Apg|Röm|Roem|1?\\.? Kor|2?\\.? Kor|Gal|Eph|Phil|Kol|1?\\.? Thess|2?\\.? Thess|1?\\.? Tim|2?\\.? Tim|Phlm|Hbr|Hebr|Jak|1?\\.? Petr|2?\\.? Petr|1?\\.? Joh|2?\\.? Joh|3?\\.? Joh|Jud|Offb|Genesis|1?\\.? Mose|Exodus|2?\\.? Mose|Levitikus|3?\\.? Mose|Numeri|4?\\.? Mose|Deuteronomium|5?\\.? Mose|Josua|Richter|Ruth|1?\\.? Samuel|2?\\.? Samuel|1?\\.? Könige|2?\\.? Könige|1?\\.? Koenige|2?\\.? Koenige|1?\\.? Chronik|2?\\.? Chronik|Esra|Nehemia|Ester|Hiob|Ijob|Psalm|Psalmen|Sprueche|Sprüche|Sprichwoerter|Sprichwörter|Prediger|Kohelet|Hohelied|Hoheslied|Jesaja|Jeremia|Klagelieder|Ezechiel|Hesekiel|Daniel|Hosea|Joel|Amos|Obadja|Jona|Micha|Nahum|Habakuk|Zefanja|Haggai|Sacharja|Maleachi|Matthäus|Matthaeus|Markus|Lukas|Johannes|Apostelgeschichte|Römer|Roemer|1?\\.? Korinther|2?\\.? Korinther|Galater|Epheser|Philipper|Kolosser|1?\\.? Thessalonicher|2?\\.? Thessalonicher|1?\\.? Timotheus|2?\\.? Timotheus|Philemon|Hebräer|Hebraeer|Jakobus|1?\\.? Petrus|2?\\.? Petrus|1?\\.? Johannes|2?\\.? Johannes|3?\\.? Johannes|Judas|Offenbarung";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](?!"+bible_books+"))+)", "ig");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_ukr = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){
      var verse = customTrim(verses[i], " ;,()<>.:-");

      var old_verse = verse;
      if (verse.substring(0,2).match(/^[0-9]\.$/)){
        verse = verse.slice(0,1) + verse.slice(2,verse.length);
      }

      read = read.replace(new RegExp(old_verse, "ig"), verse);

      var german_verse_replacement = [
        {"s": "1 Mo ", "r": "1 Mose "},
        {"s": "2 Mo ", "r": "2 Mose "},
        {"s": "3 Mo ", "r": "3 Mose "},
        {"s": "4 Mo ", "r": "4 Mose "},
        {"s": "5 Mo ", "r": "5 Mose "},
        {"s": "5 Mo ", "r": "5 Mose "},

        {"s": "Röm ", "r": "Rom "},
        {"s": "Kol ", "r": "Kolosser "},
        {"s": "Apg ", "r": "Apostel "},
        {"s": "1 Kor ", "r": "1 Korinther "},
        {"s": "2 Kor ", "r": "2 Korinther "},
        {"s": "Jes ", "r": "Jesaja "},
        {"s": "Offb ", "r": "Offenbarung "},
        {"s": "Spr ", "r": "Sprueche "},
        {"s": "Hes ", "r": "Hesekiel "},
        {"s": "Hbr ", "r": "Hebr "}
      ];

      for (var sr = 0; sr < german_verse_replacement.length; sr++){
        if (verse.indexOf(german_verse_replacement[sr]["s"]) == 0){
          var new_verse = verse.replace(german_verse_replacement[sr]["s"], german_verse_replacement[sr]["r"]);
          read = read.replace(new RegExp(verse, "ig"), new_verse);
          verse = new_verse;
        }
      }

      if (verse.split(/[\.;]+/).length > 1){
        var reverse = function(s) { var o = ''; for (var i = s.length - 1; i >= 0; i--) o += s[i]; return o; };
        var book_name  = verse.substr(0, verse.length - reverse(verse).search(/[A-Za-z]/));
        var m_verses = verse.split(/[\.;]+/);
        var f_verses = [];
        for (var m_v_i = 0; m_v_i < m_verses.length; m_v_i++){
          if (m_verses[m_v_i].indexOf(",") == -1 && m_v_i > 0){
            var b_l = m_verses[0].indexOf(",");
            if (b_l<0) {
              f_verses.push(book_name + " " + m_verses[m_v_i].trim());
            } else {
              f_verses.push(m_verses[0].substr(0, b_l) + "," + m_verses[m_v_i].trim());
            }
          } else {
            if (m_verses[m_v_i].indexOf(book_name) == -1){
              f_verses.push(book_name + " " + m_verses[m_v_i]);
            } else {
              f_verses.push(m_verses[m_v_i]);
            }
          }
        }

        read = read.replace(new RegExp(verse, "ig"), f_verses.join("; "));

        for (var f_v_i = 0; f_v_i < f_verses.length; f_v_i++){
          verses_parsed.push(f_verses[f_v_i]);
        }
      } else if (verse.length > 0 && verse.match(/\d/g)) {
        verses_parsed.push(verse);
      }
    }

    verses_parsed = verses_parsed.sort(function(a, b){
      return b.length - a.length;
    });

    for (var i = 0; i < verses_parsed.length; i++) {

      var final_verse = verses_parsed[i].replace(/\.|\#|\$|\/|\[|\]/g, '').replace(/–/g, "-"),
          find_verse = verses_parsed[i].replace(/–/g, "-");
      read = read.replace(new RegExp('(?!<a[^>]*?>)('+verses_parsed[i]+')(?![^<]*?</a>)', "g"), '<a class="verse" verse="'+final_verse+'">'+find_verse+'</a>');
      (function(verseKey, verseFind){scrape_tasks_ukr.push(function(cb){
        scrape(verseKey, verseFind, "LUTH1984", cb);
      })})(final_verse, find_verse);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_ukr, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "LUTH1984", "verses": verses, "read": read});
        });
      }
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_de;