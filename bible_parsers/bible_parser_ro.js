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

function parse_ro(read, callback){
    var bible_books = "Geneza|Exod|Levitic|Numeri|Deuteronom|Iosua|Judecatori|Rut|1 Samuel|2 Samuel|1 Împăraţilor|2 Împăraţilor|1 Cronici|2 Cronici|Ezra|Neemia|Estera|Iov|Psalmi|Psalmii|Proverbele|Ecclesiast|Cantarea Cantarilor|Isaia|Ieremia|Plângerile|Ezechiel|Daniel|Osea|Ioel|Amos|Obadia|Iona|Mica|Naum|Habacuc|Tefania|Hagai|Zaharia|Maleahi|Matei|Marcu|Luca|Ioan|Faptele|Faptele Apostolilor|Romani|1 Corinteni|2 Corinteni|Galateni|Efeseni|Filipeni|Coloseni|1 Tesaloniceni|2 Tesaloniceni|1 Timotei|2 Timotei|Tit|Filimon|Evrei|Iacob|1 Petru|2 Petru|1 Ioan|2 Ioan|3 Ioan|Iuda|Apocalipsa";
    var bible_regexp = new RegExp("(("+bible_books+")\\.?\\ ([0-9\\.;,: \\-\\–](?!"+bible_books+"))+)", "ig");
    var bible_book_regexp = new RegExp("("+bible_books+")\\.?", "ig");

    var verses = read.match(bible_regexp),
        verses_parsed = [];

    var scrape_tasks_rvr1960 = [];

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
            (function(verseKey, verseFind){scrape_tasks_rvr1960.push(function(cb){
                scrape(verseKey, verseFind, "RMNN", cb);
            })})(final_verse, verses_parsed[i]);
        }

        async.series([
            function(callback){
                async.series(scrape_tasks_rvr1960, function(err, results){
                    var verses = {};
                    for (var i = 0; i < results.length; i++){
                        for (var attrname in results[i]) { verses[attrname] = results[i][attrname]; }
                    }

                    callback(null, {"name": "RMNN", "verses": verses, "read": read});
                });
            },
        ], function(err, result){
            callback(result);
        });
    }
}

module.exports = parse_ro;