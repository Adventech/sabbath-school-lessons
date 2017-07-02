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
  var url = "http://bibleonline.ru/search/?s="+encodeURIComponent(verseFind)+"&books=&trans=tur&from=&to=";

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


          var reps = [
            {"s": "Бытие", "r": "Tekvin"},
            {"s": "Исход", "r": "Çıkış"},
            {"s": "Левит", "r": "Levililer"},
            {"s": "Числа", "r": "Sayılar"},
            {"s": "Второзаконие", "r": "Tesniye"},
            {"s": "Иисус Навин", "r": "Yeşu"},
            {"s": "Судей", "r": "Hakimler"},
            {"s": "Руфь", "r": "Rut"},
            {"s": "1 Царств", "r": "1 Samuel"},
            {"s": "2 Царств", "r": "2 Samuel"},
            {"s": "3 Царств", "r": "1 Krallar"},
            {"s": "4 Царств", "r": "2 Krallar"},
            {"s": "1 Паралипоменон", "r": "1 Paralipomenon"},
            {"s": "2 Паралипоменон", "r": "2 Paralipomenon"},
            {"s": "Ездра", "r": "Ezra"},
            {"s": "Неемия", "r": "Nehemya"},
            {"s": "Есфирь", "r": "Esther"},
            {"s": "Иов", "r": "Eyüp"},
            {"s": "Псалтирь", "r": "Zebur"},
            {"s": "Притчи", "r": "Atasözleri"},
            {"s": "Екклесиаст", "r": "Eski Ahit'te Hazreti Süleyman'a yazılan kitap"},
            {"s": "Песня Песней", "r": "Süleyman'ın Şarkısı"},
            {"s": "Исаия", "r": "İşaya"},
            {"s": "Иеремия", "r": "Yeremya"},
            {"s": "Плач Иеремии", "r": "Ağıtlar Kitabı"},
            {"s": "Иезекииль", "r": "Hezekiel"},
            {"s": "Даниил", "r": "Daniel"},
            {"s": "Осия", "r": "Hoşea"},
            {"s": "Иоиль", "r": "Yoel"},
            {"s": "Амос", "r": "Amos"},
            {"s": "Авдий", "r": "Obadya"},
            {"s": "Иона", "r": "Yunus"},
            {"s": "Михей", "r": "Mika"},
            {"s": "Наум", "r": "Nahum"},
            {"s": "Аввакум", "r": "Habakkuk"},
            {"s": "Софония", "r": "Sefanya"},
            {"s": "Аггей", "r": "Hagay"},
            {"s": "Захария", "r": "Zekeriya"},
            {"s": "Малахия", "r": "Malaki"},
            {"s": "Матфея", "r": "Matta"},
            {"s": "Марка", "r": "Markos"},
            {"s": "Луки", "r": "Luke"},
            {"s": "Иоанна", "r": "Yuhanna"},
            {"s": "Деяния", "r": "Resullerin işleri"},
            {"s": "Римлянам", "r": "Romalılar"},
            {"s": "1 Коринфянам", "r": "1 Korintoslulara"},
            {"s": "2 Коринфянам", "r": "2 Korintoslulara"},
            {"s": "Галатам", "r": "Galatlar"},
            {"s": "Ефесянам", "r": "Efesliler"},
            {"s": "Филиппийцам", "r": "Filipililer"},
            {"s": "Колоссянам", "r": "Koloseliler"},
            {"s": "1 Фессалоникийцам", "r": "1 Selanikliler"},
            {"s": "2 Фессалоникийцам", "r": "2 Selanikliler"},
            {"s": "1 Тимофею", "r": "1 Timoteosa"},
            {"s": "2 Тимофею", "r": "2 Timoteosa"},
            {"s": "Титу", "r": "Titusa"},
            {"s": "Филимону", "r": "Filimona"},
            {"s": "Евреям", "r": "İbraniler"},
            {"s": "Иаков", "r": "Yakub"},
            {"s": "1 Петра", "r": "1 Petrus"},
            {"s": "2 Петра", "r": "2 Petrus"},
            {"s": "1 Иоанна", "r": "1 Yuhanna"},
            {"s": "2 Иоанна", "r": "2 Yuhanna"},
            {"s": "3 Иоанна", "r": "3 Yuhanna"},
            {"s": "Иуда", "r": "Yahuda"},
            {"s": "Откровение", "r": "Vahiy"}];

          for (var sr = 0; sr < reps.length; sr++){
              body = body.replace(new RegExp(reps[sr]["s"], "ig"), reps[sr]["r"]);
          }

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

function parse_tr(read, callback){
  var bible_books = "Yar|Çık|Lev|Say|Yas|Yşu|Hak|Rut|1Sa|2Sa|1Kr|2Kr|1 Ta|1Ta|2Ta|Ezr|Neh|Est|Eyü|Mez|Özd|Vai|Ezg|Yşa|Yer|Ağı|Hez|Dan|Hoş|Yoe|Amo|Ova|Yun|Mik|Nah|Hab|Sef|Hag|Zek|Mal|Mat|Mar|Luk|Yu|Elç|Rom|1Ko|2Ko|Gal|Ef|Flp|Kol|1Se|2Se|1Ti|2Ti|Tit|Flm|İbr|Yak|1Pe|2Pe|1Yu|2Yu|3Yu|Yah|Va|Tekvin|Çıkış|Levililer|Sayılar|Tesniye|Yeşu|Hakimler|Rut|1 ?\.?Samuel|2 ?\.?Samuel|1 ?\.?Krallar|2 ?\.?Krallar|1 ?\.?Paralipomenon|2 ?\.?Paralipomenon|Ezra|Nehemya|Esther|Eyüp|Zebur|Atasözleri|Eski ?\.?Ahit'te ?\.?Hazreti ?\.?Süleyman'a ?\.?yazılan ?\.?kitap|Süleyman'ın ?\.?Şarkısı|İşaya|Yeremya|Ağıtlar ?\.?Kitabı|Hezekiel|Daniel|Hoşea|Yoel|Amos|Obadya|Yunus|Mika|Nahum|Habakkuk|Sefanya|Hagay|Zekeriya|Malaki|Matta|Markos|Luke|Yuhanna|Resullerin ?\.?işleri|Romalılar|1 ?\.?Korintoslulara|2 ?\.?Korintoslulara|1 ?\.?Korintliler|2 ?\.?Korintliler|Galatyalılar|Galatlar|Efesliler|Filipililer|Koloseliler|1 ?\.?Selanikliler|2 ?\.?Selanikliler|1 ?\.?Timoteosa|2 ?\.?Timoteosa|Titusa|Filimona|İbraniler|Yakub|1 ?\.?Petrus|2 ?\.?Petrus|1 ?\.?Yuhanna|2 ?\.?Yuhanna|3 ?\.?Yuhanna|Yahuda|Vahiy";
  var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](?!"+bible_books+"))+)", "ig");
  var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

  read = read.replace(/–/g, "-");
  var verses = read.match(bible_regexp),
    verses_parsed = [];

  var scrape_tasks_syno = [];

  if (verses){
    for (var i = 0; i < verses.length; i++){
      var verse = customTrim(verses[i], " ;,()<>.:-");
      if (
          ((verse.split(",").length - 1) > 1) ||

          (((verse.split(",").length - 1) == 1) && (verse.split("-").length - 1) > 0)
      ){

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

          f_verse = customTrim(f_verse, " ;,()<>.");
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


        var tr_verse_replacement = [
            {"s": "Tekvin", "r": "Gen"},
            {"s": "Çıkış", "r": "Exod"},
            {"s": "Levililer", "r": "Lev"},
            {"s": "Sayılar", "r": "Num"},
            {"s": "Tesniye", "r": "Deut"},
            {"s": "Yeşu", "r": "Josh"},
            {"s": "Hakimler", "r": "Judg"},
            {"s": "Rut", "r": "Ruth"},
            {"s": "1 Samuel", "r": "1Sam"},
            {"s": "2 Samuel", "r": "2Sam"},
            {"s": "1 Krallar", "r": "1Kgs"},
            {"s": "2 Krallar", "r": "2Kgs"},
            {"s": "1 Paralipomenon", "r": "1Chr"},
            {"s": "2 Paralipomenon", "r": "2Chr"},
            {"s": "Ezra", "r": "Ezra"},
            {"s": "Nehemya", "r": "Neh"},
            {"s": "Esther", "r": "Esth"},
            {"s": "Eyüp", "r": "Job"},
            {"s": "Zebur", "r": "Ps"},
            {"s": "Atasözleri", "r": "Prov"},
            {"s": "Eski Ahit'te Hazreti Süleyman'a yazılan kitap", "r": "Eccl"},
            {"s": "Süleyman'ın Şarkısı", "r": "Song"},
            {"s": "İşaya", "r": "Isa"},
            {"s": "Yeremya", "r": "Jer"},
            {"s": "Ağıtlar Kitabı", "r": "Lam"},
            {"s": "Hezekiel", "r": "Ezek"},
            {"s": "Daniel", "r": "Dan"},
            {"s": "Hoşea", "r": "Hos"},
            {"s": "Yoel", "r": "Joel"},
            {"s": "Amos", "r": "Amos"},
            {"s": "Obadya", "r": "Obad"},
            {"s": "Yunus", "r": "Jonah"},
            {"s": "Mika", "r": "Mic"},
            {"s": "Nahum", "r": "Nah"},
            {"s": "Habakkuk", "r": "Hab"},
            {"s": "Sefanya", "r": "Zeph"},
            {"s": "Hagay", "r": "Hag"},
            {"s": "Zekeriya", "r": "Zech"},
            {"s": "Malaki", "r": "Mal"},
            {"s": "Matta", "r": "Mat"},
            {"s": "Markos", "r": "Mark"},
            {"s": "Luke", "r": "Luke"},
            {"s": "Yuhanna", "r": "John"},
            {"s": "Resullerin işleri", "r": "Acts"},
            {"s": "Romalılar", "r": "Rom"},
            {"s": "1 ?.?Korintoslulara", "r": "1Cor"},
            {"s": "2 ?.?Korintoslulara", "r": "2Cor"},
            {"s": "1 ?.?Korintliler", "r": "1Cor"},
            {"s": "2 ?.?Korintliler", "r": "2Cor"},
            {"s": "Galatlar", "r": "Gal"},
            {"s": "Galatyalılar", "r": "Gal"},
            {"s": "Efesliler", "r": "Eph"},
            {"s": "Filipililer", "r": "Phil"},
            {"s": "Koloseliler", "r": "Col"},
            {"s": "1 ?.?Selanikliler", "r": "1Thess"},
            {"s": "2 ?.?Selanikliler", "r": "2Thess"},
            {"s": "1 ?.?Timoteosa", "r": "1Tim"},
            {"s": "2 ?.?Timoteosa", "r": "2Tim"},
            {"s": "Titusa", "r": "Titus"},
            {"s": "Filimona", "r": "Phlm"},
            {"s": "İbraniler", "r": "Heb"},
            {"s": "Yakub", "r": "Jas"},
            {"s": "1 ?.?Petrus", "r": "1Pet"},
            {"s": "2 ?.?Petrus", "r": "2Pet"},
            {"s": "1 ?.?Yuhanna", "r": "1John"},
            {"s": "2 ?.?Yuhanna", "r": "2John"},
            {"s": "3 ?.?Yuhanna", "r": "3John"},
            {"s": "Yahuda", "r": "Jude"},
            {"s": "Vahiy", "r": "Rev"},

            {"s": "Yar", "r": "Gen"},
            {"s": "Çık", "r": "Exod"},
            {"s": "Lev", "r": "Lev"},
            {"s": "Say", "r": "Num"},
            {"s": "Yas", "r": "Deut"},
            {"s": "Yşu", "r": "Josh"},
            {"s": "Hak", "r": "Judg"},
            {"s": "Ru", "r": "Ruth"},
            {"s": "1Sa", "r": "1Sam"},
            {"s": "2Sa", "r": "2Sam"},
            {"s": "1Kr", "r": "1Kgs"},
            {"s": "2Kr", "r": "2Kgs"},
            {"s": "1Ta", "r": "1Chr"},
            {"s": "1Ta", "r": "1Chr"},
            {"s": "2Ta", "r": "2Chr"},
            {"s": "Ezr", "r": "Ezra"},
            {"s": "Neh", "r": "Neh"},
            {"s": "Est", "r": "Esth"},
            {"s": "Eyü", "r": "Job"},
            {"s": "Mez", "r": "Ps"},
            {"s": "Özd", "r": "Prov"},
            {"s": "Vai", "r": "Eccl"},
            {"s": "Ezg", "r": "Song"},
            {"s": "Yşa", "r": "Isa"},
            {"s": "Yer", "r": "Jer"},
            {"s": "Ağı", "r": "Lam"},
            {"s": "Hez", "r": "Ezek"},
            {"s": "Dan", "r": "Dan"},
            {"s": "Hoş", "r": "Hos"},
            {"s": "Yoe", "r": "Joel"},
            {"s": "Amo", "r": "Amos"},
            {"s": "Ova", "r": "Obad"},
            {"s": "Yun", "r": "Jonah"},
            {"s": "Mik", "r": "Mic"},
            {"s": "Nah", "r": "Nah"},
            {"s": "Hab", "r": "Hab"},
            {"s": "Sef", "r": "Zeph"},
            {"s": "Hag", "r": "Hag"},
            {"s": "Zek", "r": "Zech"},
            {"s": "Mal", "r": "Mal"},
            {"s": "Mat", "r": "Matt"},
            {"s": "Mar", "r": "Mark"},
            {"s": "Luk", "r": "Luke"},
            {"s": "Yu", "r": "John"},
            {"s": "Elç", "r": "Acts"},
            {"s": "Rom", "r": "Rom"},
            {"s": "1Ko", "r": "1Cor"},
            {"s": "2Ko", "r": "2Cor"},
            {"s": "Gal", "r": "Gal"},
            {"s": "Ef", "r": "Eph"},
            {"s": "Flp", "r": "Phil"},
            {"s": "Kol", "r": "Col"},
            {"s": "1Se", "r": "1Thess"},
            {"s": "2Se", "r": "2Thess"},
            {"s": "1Ti", "r": "1Tim"},
            {"s": "2Ti", "r": "2Tim"},
            {"s": "Tit", "r": "Titus"},
            {"s": "Flm", "r": "Phlm"},
            {"s": "İbr", "r": "Heb"},
            {"s": "Yak", "r": "Jas"},
            {"s": "1Pe", "r": "1Pet"},
            {"s": "2Pe", "r": "2Pet"},
            {"s": "1Yu", "r": "1John"},
            {"s": "2Yu", "r": "2John"},
            {"s": "3Yu", "r": "3John"},
            {"s": "Yah", "r": "Jude"},
            {"s": "Va", "r": "Rev"}


        ];

        for (var sr = 0; sr < tr_verse_replacement.length; sr++){
            if (find_verse.match(new RegExp(tr_verse_replacement[sr]["s"], "ig"))){
                var new_verse = find_verse.replace(new RegExp(tr_verse_replacement[sr]["s"], "ig"), tr_verse_replacement[sr]["r"]);
                find_verse = new_verse;
                break;
            }
        }

      read = read.replace(new RegExp('(?!<a[^>]*?>)('+verses_parsed[i]+')(?![^<]*?</a>)', "g"), '<a class="verse" verse="'+final_verse+'">'+final_verse+'</a>');
      (function(verseKey, verseFind){scrape_tasks_syno.push(function(cb){
        scrape(verseKey, verseFind, "TUR", cb);
      })})(final_verse, find_verse);
    }

    async.series([
      function(callback){
        async.series(scrape_tasks_syno, function(err, results){
          var verses = {};
          for (var i = 0; i < results.length; i++){
            for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
          }

          callback(null, {"name": "Tur.", "verses": verses, "read": read});
        });
      }
    ], function(err, result){
      callback(result);
    });
  }
}

module.exports = parse_tr;