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

function parse_pt(read, callback){
  var bible_books = "Gn|Gén|Êx|Êxo|Lv|Nm|Núm|Dt|Deut|Js|Jz|Juí|Rt|1Sm|2Sm|I ?Sam|II ?Sam|1Rs|2Rs|1Cr|2Cr|Esd|Ne|Nee|Et|Est|Jó|Job|Sl|Sal|Pv|Prov|Ec|Ct|Is|Isa|Jr|Jer|Lm|Ez|Eze|Dan|Dn|Jl|Amos|Obadias|Jn|Mq|Miq|Na|Hc|Hab|Sf|Ag|Zc|Ml|Mal|Mt|Mat|Mc|Lc|Luc|Jo|At|Atos|Rm|Rom|1Co|2Co|I? Cor|II? Cor|Gál|Gl|Ef|Fp|Fil|Col|Cl|1Ts|2Ts|I? Tes|II? Tes|1Tn|2Tm|I? Tim|II? Tim|Tt|Fm|Hb|Heb|Tg|Tia|1Pe|2Pe|I Ped|II Ped|1Jo|2Jo|3Jo|Jd|Ap|Apoc|Génesis|Gênesis|Êxodo|Levítico|Números|Deuteronómio|Deuteronômio|Josué|Juízes|Rute|1º? Samuel|2º Samuel|1º? Reis|2º? Reis|1º? Crônicas|2º? Crônicas|I? Samuel|II? Samuel|I? Reis|II? Reis|I? Crônicas|II? Crônicas|Esdras|Neemias|Ester|Jó|Salmo|Salmos|Provérbios|Eclesiastes|Cantares ou Cânticos dos Cânticos|Isaías|Jeremias|Lamentações de Jeremias|Ezequiel|Daniel|Oseias|Oséias|Joel|Amós|Obadias|Jonas|Miqueias|Miquéias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Atos dos Apóstolos|Romanos|1ª? Coríntios|2ª? Coríntios|I? Coríntios|II? Coríntios|Gálatas|Efésios|Filipenses|Colossenses|1ª? Tessalonicenses|2ª? Tessalonicenses|1ª? Timóteo|2ª? Timóteo|I? Tessalonicenses|II? Tessalonicenses|I? Timóteo|II? Timóteo|Tito|Filemom|Hebreus|Tiago|1ª? Pedro|2ª? Pedro|I? Pedro|II? Pedro|1ª? João|2ª? João|3ª? João|I? João|II? João|III? João|Judas|Apocalipse";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](\ e\ )?(?!"+bible_books+"))+)", "g");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "g");

  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_aa = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){

      var pt_verse_replacement = [
        {"s": "Deuteronómio ", "r": "Deut "},
        {"s": "I Tes.", "r": "1 Ts."},
        {"s": "II Tes.", "r": "2 Ts."},
        {"s": "Gén.", "r": "Gn."},
        {"s": "I João ", "r": "1 João "},
        {"s": "II João ", "r": "2 João "},
        {"s": "III João ", "r": "3 João "},
        {"s": "I Coríntios ", "r": "1 Coríntios "},
        {"s": "Gál.", "r": "Gal."},
        {"s": "I Tessalonicenses ", "r": "1 Tessalonicenses "},
        {"s": "II Tessalonicenses ", "r": "2 Tessalonicenses "},
        {"s": "Núm.", "r": "Num."},
        {"s": "Nee.", "r": "Ne."},
        {"s": "Jer.", "r": "Jr."},
        {"s": "I Ped.", "r": "1 Pe."},
        {"s": "II Ped.", "r": "2 Pe."},
        {"s": "I Pedro ", "r": "1 Pedro "},
        {"s": "II Pedro ", "r": "2 Pedro "},
        {"s": "Tia.", "r": "Tiago"},
        {"s": "Êxo.", "r": "Exodo"},
        {"s": "I Coríntios ", "r": "1 Coríntios "},
        {"s": "II Coríntios ", "r": "2 Coríntios "},
        {"s": "I Cor. ", "r": "1 Cor."},
        {"s": "II Cor. ", "r": "2 Cor."},
        {"s": "I Samuel ", "r": "1 Samuel "},
        {"s": "II Samuel ", "r": "2 Samuel "},
        {"s": "I Reis ", "r": "1 Reis "},
        {"s": "II Reis ", "r": "2 Reis "},
        {"s": "I Crônicas ", "r": "1 Crônicas "},
        {"s": "II Crônicas ", "r": "2 Crônicas "},
        {"s": "Juí.", "r": "Juízes"},
        {"s": "Miq.", "r": "Mic."},
        {"s": "ap. 10", "r": ""},
        {"s": "ap. 12", "r": ""},
        {"s": "ed. 2010", "r": ""},
        {"s": "Apoc.", "r": "Ap."},
        {"s": "I Tim.", "r": "1 Tim."},
        {"s": "II Tim.", "r": "2 Tim."},
        {"s": "Jo ", "r": "João "},
        {"s": "At ", "r": "Atos "},
        {"s": "Fp ", "r": "Filip "},
        {"s": "Sl ", "r": "Sal "}
      ];

      var verse = customTrim(verses[i], " ;,()<>.:-");

      if (verse.indexOf(" e ") > 0){
        var new_verse = verse.replace(" e ", ", ");
        read = read.replace(new RegExp(verse, "ig"), new_verse);
        verse = new_verse;
      }

      for (var sr = 0; sr < pt_verse_replacement.length; sr++){
        if (verse.indexOf(pt_verse_replacement[sr]["s"]) == 0){
          var new_verse = verse.replace(pt_verse_replacement[sr]["s"], pt_verse_replacement[sr]["r"]);
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
      (function(verseKey, verseFind){scrape_tasks_aa.push(function(cb){
        scrape(verseKey, verseFind, "AA", cb);
      })})(final_verse, verses_parsed[i]);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_aa, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "AA", "verses": verses, "read": read});
        });
      },
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_pt;