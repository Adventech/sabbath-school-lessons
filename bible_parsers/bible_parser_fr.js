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

function parse_fr(read, callback){
  var bible_books = "Gn|Gen|Ex|Lev|Nom|Nb|Deut|Jos|Jg|Jug|Rt|1 ?Sam|2 ?Sam|1 ?R|2 ?R|1 ?Ch|2 ?Ch|1 ?Chron|2 ?Chron|Esd|Ne|Neh|Est|Jb|Ps|Pr|Prov|Ec|Isa|Esa|Jr|Jer|La|Ezdr|Ez|Da|Dan|Os|Jl|Am|Ab|Jon|Mic|Na|Hab|So|Ag|Zach|Ma|Mal|Mt|Mat|Matt|Mc|Lc|Jn|John|Acts|Act|Ac|Rom|1 ?Cor|2 ?Cor|Gal|Eph|Ph|Phil|Col|1 ?Th|2 ?Th|1 ?Tim|1 Thess|2 Thess|2 ?Tim|Tt|Phm|He|Hé|Héb|Heb|Jc|1 ?Pie|2 ?Pie|1 ?Jn|2 ?Jn|3 ?Jn|Jd|Ap|Apo|Apoc|Genèse|Exode|Lévitique|Nombres|Deutéronome|Josué|Juges|Ruth|1 ?Samuel|2 ?Samuel|1 ?Rois|2 ?Rois|1 ?Chroniques|2 ?Chroniques|Esdras|Néhémie|Esther|Job|Psaume|Psaumes|Proverbes|Proverbe|Ecclésiaste|Cantique des cantiques|Esaïe|Ésaïe|Jérémie|Lamentations|Ézéchiel|Daniel|Osée|Joël|Amos|Abdias|Jonas|Michée|Nahum|Habakuk|Sophonie|Aggée|Zacharie|Malachie|Matthieu|Marc|Luc|Jean|Actes|Romains|1 ?Corinthiens|2 ?Corinthiens|Galates|Éphésiens|Philippiens|Colossiens|1 ?Thessaloniciens|2 ?Thessaloniciens|1 ?Timothée|2 ?Timothée|Tite|Philémon|Hébreux|Jacques|1 ?Pierre|2 ?Pierre|1 ?Jean|2 ?Jean|3 ?Jean|Jude|Apocalypse";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](?!"+bible_books+"))+)", "g");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "g");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_lsg = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){
      var verse = customTrim(verses[i], " ;,()<>.:-");

      var french_verse_replacement = [
        {"s": "Esa.", "r": "Ésaïe"},
        {"s": "Esa ", "r": "Ésaïe "},
        {"s": "Apo.", "r": "Ap."},
        {"s": "Za.", "r": "Zac."},
        {"s": "Zach.", "r": "Zac."},
        {"s": "Jug.", "r": "Jg."},
        {"s": "Nom. ", "r": "Nm. "}
      ];

      for (var sr = 0; sr < french_verse_replacement.length; sr++){
        if (verse.indexOf(french_verse_replacement[sr]["s"]) == 0){
          var new_verse = verse.replace(french_verse_replacement[sr]["s"], french_verse_replacement[sr]["r"]);
          read = read.replace(verse, new_verse);
          verse = new_verse;
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
      (function(verseKey, verseFind){scrape_tasks_lsg.push(function(cb){
        scrape(verseKey, verseFind, "LSG", cb);
      })})(final_verse, verses_parsed[i]);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_lsg, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "LSG", "verses": verses, "read": read});
        });
      }
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_fr;