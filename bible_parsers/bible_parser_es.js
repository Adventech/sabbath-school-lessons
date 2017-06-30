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

function parse_es(read, callback){
  var bible_books = "Gén|Gn|Éxod|Éx|Éxo|Lev|Lv|Núm|Nm|Deut|Dt|Jos|Jue|Juec|Jc|Rut|Rt|1 ?Sam|1 ?Sm|2 ?Sam|2 ?Sm|1 ?Rey|1 ?Re|2 ?Rey|2 ?Re|1 ?Cró|1 ?Cr|2 ?Cró|2 ?Cr|Esd|Neh|Ne|Est|Job|Sal|Prov|Pro|Ecl|Cant|Isa|Jer|Jr|Lam|Ez|Eze|Dan|Dn|Ose|Jl|Am|Abd|Jon|Miq|Mi|Miq|Nah|Na|Hab|Sof|Ag|Zac|Za|Mal|Mat|Mt|Mar|Luc|Lc|Juan|Jn|Hech|Hechos|Hch|He|Rom|1 ?Cor|1 ?Co|2 ?Cor|2 ?Co|Gál|Efes|Ef|Efe|Fil|Flp|Col|1 ?Tes|2 ?Tes|1 ?Tim|2 ?Tim|Tit|Ti|Filem|Flm|Heb|Sant|Stgo|St|1 ?Pe|2 ?Pe|1 ?Ped|2 ?Ped|1 ?Jn|2 ?Jn|3 ?Jn|Jds|Jud|Apoc|Ap|Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 ?Samuel|2 ?Samuel|1 ?Reyes|2 ?Reyes|1 ?Crónicas|2 ?Crónicas|Esdras|Nehemías|Ester|Job|Salmo|Salmos|Proverbios|Eclesiastés|Cantar de los Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahún|Habacuc|Sofonías|Ageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos de los Apóstoles|Romanos|1 ?Corintios|2 ?Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 ?Tesalonicenses|2 ?Tesalonicenses|1 ?Timoteo|2 ?Timoteo|Tito|Filemón|Hebreos|Santiago|1 ?Pedro|2 ?Pedro|Primera de ?Pedro|Segunda de ?Pedro|1 ?Juan|2 ?Juan|3 ?Juan|Judas|Apocalipsis";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](\ al\ )?(\ y\ )?(\ a\ )?(?!"+bible_books+"))+)", "ig");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_rvr1960 = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){

      var spanish_verse_replacement = [
        {"s": "Gál\ ", "r": "Gálatas "},
        {"s": "Gál.", "r": "Gálatas"},
        {"s": "Hech.", "r": "Hch."},
        {"s": "Miq.", "r": "Mi."},
        {"s": "Núm.", "r": "Nm."},
        {"s": "Sant.", "r": "Santiago"},
        {"s": "1 Rey.", "r": "1 Re."},
        {"s": "2 Rey.", "r": "2 Re."},

        {"s": "1 Tes.", "r": "1 Ts."},
        {"s": "2 Tes.", "r": "2 Ts."},
        {"s": "1 Ped.", "r": "1 Pedro"},
        {"s": "2 Ped.", "r": "2 Pedro"},
        {"s": "Primera de Pedro", "r": "1 Pedro"},
        {"s": "Segunda de Pedro", "r": "2 Pedro"},  
        {"s": "Gén.", "r": "Gn."},
        {"s": "Éxo.", "r": "Exo."},
        {"s": "Génesis", "r": "Gn."},
        {"s": "Apoc.", "r": "Ap."},
        {"s": "Efe.", "r": "Ef."},
        {"s": "Ose.", "r": "Oseas"},
        {"s": "Juec.", "r": "Jue."}
      ];

      var verse = customTrim(verses[i], " ;,()<>.:-");
      if (verse.indexOf(" al ") > 0){
        var new_verse = verse.replace(" al ", "-");
        read = read.replace(new RegExp(verse, "ig"), new_verse);
        verse = new_verse;
      }

      if (verse.indexOf(" a ") > 0){
        var new_verse = verse.replace(" a ", "-");
        read = read.replace(new RegExp(verse, "ig"), new_verse);
        verse = new_verse;
      }

      if (verse.indexOf(" y ") > 0){
        var new_verse = verse.replace(" y ", ", ");
        read = read.replace(new RegExp(verse, "ig"), new_verse);
        verse = new_verse;
      }

      for (var sr = 0; sr < spanish_verse_replacement.length; sr++){
        if (verse.indexOf(spanish_verse_replacement[sr]["s"]) >= 0){
            var new_verse = verse.replace(new RegExp(spanish_verse_replacement[sr]["s"], "ig"), spanish_verse_replacement[sr]["r"]);
          read = read.replace(new RegExp(verse, "ig"), new_verse);
          verse = new_verse;
        }
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

      for (var sr = 0; sr < spanish_verse_replacement.length; sr++){
          if (verse.indexOf(spanish_verse_replacement[sr]["s"]) >= 0){
              var new_verse = verse.replace(new RegExp(spanish_verse_replacement[sr]["s"], "ig"), spanish_verse_replacement[sr]["r"]);
              read = read.replace(new RegExp(verse, "ig"), new_verse);
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
      (function(verseKey, verseFind){scrape_tasks_rvr1960.push(function(cb){
        scrape(verseKey, verseFind, "RVR1960", cb);
      })})(final_verse, verses_parsed[i]);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_rvr1960, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "RVR1960", "verses": verses, "read": read});
        });
      },
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_es;