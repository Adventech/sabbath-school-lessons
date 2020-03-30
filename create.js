#!/usr/bin/env node
var argv = require("optimist")
  .usage("Create the file structure for a quarter in given language.\n" +
    "Usage: $0 -s [string] -l [string] -q [string] -c [num] -t [string] -d [string] -h [string] -u [bool] -i [bool] -m [bool] -y [hex] -z [hex]")
  .alias({"s":"start-date", "l": "language", "q": "quarter", "c": "count", "t": "title", "d": "description", "h": "human-date", "u": "teacher-comments", "i": "inside-story", "k": "lesson-cover", "y": "color-primary", "z": "color-dark" })
  .describe({
    "s": "Start date in DD/MM/YYYY format. Ex: 25/01/2016",
    "l": "Target language. For ex. 'en' or 'ru'",
    "q": "Quarter id. For example: 2016-04 or 2016-04-er (easy reading)",
    "c": "Amount of lessons in quarter. Typically 13 but can be more",
    "t": "Title of the quarterly in target language",
    "d": "Description of the quarterly in target language",
    "h": "Human readable date of quarterly. Ex. Fourth quarter of 2016",
    "u": "Include teacher comments",
    "i": "Inside story",
    "m": "Create TMI (Total Member Involvement) News/Tips placeholder lessons",
    "k": "Create lesson cover placeholder images"
  })
  .demand(["s", "l", "q", "c", "t", "d", "h"])
  .default({ "l" : "en", "c": 13, "u": false, "i": false, "m": false, "k": false })
  .argv;

var fs     =  require("fs-extra"),
    moment =  require("moment"),
    yamljs = require("yamljs"),
    changeCase = require("change-case");

var SRC_PATH = "src/",
    QUARTERLY_COVER = "images/quarterly_cover.png",
    LESSON_COVER = "images/lesson_cover.png",
    DATE_FORMAT = "DD/MM/YYYY";

var LOCALE_VARS = {

  "daily_lesson_title": {
    "am": "ትምህርት",
    "af": "Les",
    "ar": "درس",
    "bg": "Дневен урок",
    "cs": "Lekce",
    "da": "Lektie",
    "de": "Tägliche Lektion",
    "el": "Μάθημα",
    "en": "Daily Lesson",
    "es": "Lección",
    "et": "Õppetund",
    "fa": "درس",
    "fj": "Na lesoni",
    "fi": "Oppitunti",
    "fr": "Leçon quotidienne",
    "it": "Lezione",
    "lt": "Pamoka",
    "is": "Lexía",
    "ilo": "Liksion",
    "in": "Lesson",
    "he": "שיעור",
    "hi": "पाठ",
    "hil": "Leksion",
    "hr": "Lekcija",
    "hu": "Lecke",
    "hy": "Դաս",
    "mk": "Лекција",
    "mn": "Хичээл",
    "ms": "Pelajaran",
    "ne": "पाठ",
    "no": "Lekse",
    "nl": "Les",
    "ko": "교훈",
    "lo": "ບົດຮຽນ",
    "lv": "Nodarbība",
    "pl": "Lekcja",
    "pt": "Lição",
    "ro": "Lecție zilnică",
    "ru": "Урок",
    "ka": "გაკვეთილი",
    "si": "පාඩම",
    "sl": "Lekcija",
    "sk": "Lekcie",
    "sr": "Lekcija",
    "st": "Thuto",
    "sq": "Mësim",
    "sw": "Somo",
    "ta": "பாடம்",
    "th": "บทเรียน",
    "tl": "Leksiyon",
    "tr": "Ders",
    "uk": "Урок",
    "ja": "日課",
    "zh": "每日课程",
    "vi": "Bài",
    "xh": "Isifundo",
    "zu": "Isifundo"
  },

  "empty_placeholder": {
    "am": "### <center>እኛ በዚህ ሌንስ ላይ እየሰራን ነው ፡፡</center>\n<center>እባክዎ ቆየት ብለው ይሞክሩ.</center>",
    "af": "### <center>Ons werk aan hierdie les.</center>\n<center>Kom asseblief later terug.</center>",
    "ar": "### <center>ونحن نعمل على هذا الدرس.</center>\n<center>يرجى العودة لاحقا.</center>",
    "bg": "### <center>Работим по този урок.</center>\n<center>Моля, върнете се по-късно.</center>",
    "cs": "### <center>Na této lekci pracujeme.</center>\n<center>Prosim zkuste to znovu pozdeji.</center>",
    "da": "### <center>Vi arbejder på denne lektion.</center>\n<center>Prøv igen senere.</center>",
    "de": "### <center>Wir arbeiten noch an dieser Lektion.</center>\n<center>Bitte komme später zurück.</center>",
    "el": "### <center>Εργαζόμαστε σε αυτό το μάθημα</center>\n<center>Παρακαλώ ελάτε ξανά αργότερα</center>",
    "en": "### <center>We are working on this lesson</center>\n<center>Please come back later</center>",
    "es": "### <center>Todavía estamos trabajando en esta lección. Por favor, vuelva más tarde.</center>",
    "et": "### <center>Me tegeleme selle õppetükiga. Palun proovige hiljem uuesti.</center>",
    "fa": "### <center>ما در این درس کار می کنیم</center>\n<center>لطفا بعدا بیا</center>",
    "fj": "### <center>Eda sa cakacaka tiko ena lesoni oqo</center>",
    "fi": "### <center>Työskentelemme tämän oppitunnin parissa</center>\n<center>Yritä uudelleen myöhemmin</center>",
    "fr": "### <center>Nous travaillons sur cette leçon.</center>\n<center>Revenez plus tard, s'il vous plaît.</center>",
    "it": "### <center>Stiamo lavorando a questa lezione.</center>\n<center>Per favore ritorna più tardi.</center>",
    "is": "### <center>Við erum að vinna að núverandi kennslustund.</center>\n<center>Vinsamlegast reyndu aftur síðar.</center>",
    "in": "### <center>Kami sedang mengerjakan pelajaran ini</center>\n<center>Silahkan kembali lagi nanti</center>",
    "ilo": "### <center>Araramiden mi pay daytoy nga liksion</center>\n<center>Sublianan yon to</center>",
    "lt": "### <center>Pamoka kuriama.</center>\n<center>Kviečiame sugrįžti vėliau.</center>",
    "lv": "### <center>Mēs strādājam pie šīs nodarbības.</center>\n<center>Lūdzu, atgriezieties vēlāk.</center>",
    "he": "### <center>אנחנו עובדים על השיעור הזה</center>\n<center>בבקשה תחזור מאוחר יותר</center>",
    "hi": "### <center>हम इस पाठ पर काम कर रहे हैं।</center>\n<center>कृपया बाद में आइये।</center>",
    "hil": "### <center>Nagsusumikap kami sa araling ito.</center>\n<center>Lihog liwat.</center>",
    "hr": "### <center>Radimo na ovoj lekciji.</center>\n<center>Molimo pokušajte ponovo kasnije.</center>",
    "hu": "### <center>Erre a leckére dolgozunk.</center>\n<center>Légyszíves gyere vissza később.</center>",
    "hy": "### <center>Մենք աշխատում ենք այս դասի վրա:</center>\n<center>Խնդրում եմ փորձեք մի փոքր ուշ</center>",
    "mk": "### <center>Ние работиме на оваа лекција</center>\n<center>Те молам врати се подоцна</center>",
    "mn": "### <center>Бид энэ хичээл дээр ажиллаж байна.</center>\n<center>Дараа дахин ирнэ үү.</center>",
    "ms": "### <center>Kami sedang menjalankan pelajaran ini.</center>\n<center>Sila balik kemudian.</center>",
    "ne": "### <center>हामी यस पाठमा काम गरिरहेका छौं</center>\n<center>फेरी प्रयास गर्नु होला</center>",
    "nl": "### <center>We werken aan deze les.</center>\n<center>Kom alsjeblieft terug.</center>",
    "no": "### <center>Vi jobber med denne leksjonen.</center>\n<center>Prøv igjen senere.</center>",
    "ko": "### <center>우리는이 공과를 위해 노력하고있다..</center>\n<center>나중에 다시 시도 해주십시오..</center>",
    "lo": "### <center>ພວກເຮົາກໍາລັງເຮັດວຽກໃນບົດຮຽນນີ້.</center>\n<center>ກະລຸນາກັບຄືນມາຫຼັງຈາກນັ້ນ.</center>",
    "pl": "### <center>Pracujemy nad tą lekcją.</center>\n<center>Proszę przyjść później.</center>",
    "pt": "### <center>Estamos a trabalhar sobre esta lição.</center>\n<center>Volte mais tarde, por favor.</center>",
    "ro": "### <center>Lucrăm la această lecție.</center>\n<center>Te rog intoarce-te mai tarziu.</center>",
    "ru": "### <center>Мы подготавливаем данный урок</center>\n<center>Попробуйте позже</center>",
    "ka": "### <center>გაკვეთილი მზადების პროცესშია</center>\n<center>სცადეთ მოგვიანებით</center>",
    "sk": "### <center>Pracujeme na tejto lekcii.</center>\n<center>Prosím vráť sa neskôr.</center>",
    "si": "### <center>අපි මෙම පාඩම මත වැඩ කරමින් සිටිමු.</center>\n<center>කරුණාකර පසුව නැවත උත්සාහ කරන්න.</center>",
    "sl": "### <center>Delamo na tej lekciji.</center>\n<center>Vrnite se kasneje.</center>",
    "sr": "### <center>Radimo na ovoj lekciji.</center>\n<center>Molim vas, vratite se kasnije</center>",
    "st": "### <center>Re sa sebetsa thutong ena</center>\n<center>Ka kopo kgutla ha moraho</center>",
    "sq": "### <center>Ne jemi duke punuar në këtë mësim</center>\n<center>Ju lutemi provoni përsëri më vonë</center>",
    "sw": "### <center>Tunafanya kazi kwenye somo hili.</center>\n<center>Tafadhali   rudi baadaye.</center>",
    "ta": "### <center>நாங்கள் இந்த பாடம் படித்து வருகிறோம்.</center>\n<center>தயவு செய்து மீண்டும் வாருங்கள்.</center>",
    "th": "### <center>เรากำลังดำเนินการในบทเรียนนี้</center>\n<center>โปรดกลับมาใหม่.</center>",
    "tl": "### <center>Nagsusumikap kami sa araling ito.</center>\n<center>Subukang muli mamaya.</center>",
    "tr": "### <center>Biz bu derste üzerinde çalışıyoruz.</center>\n<center>Lütfen daha sonra gelin.</center>",
    "uk": "### <center>Ми готуємо цей урок.</center>\n<center>Будь ласка, зайдіть пізніше.</center>",
    "ja": "### <center>この日課は完了されています。　後でここに返ってください。</center>",
    "zh": "### <center>我们正在学习这一课。请稍后再来。</center>",
    "vi": "### <center>Chúng tôi đang làm việc trên bài học này.</center>\n<center>Xin vui lòng trở lại sau.</center>",
    "xh": "### <center>Sisebenza kulesi sifundo.</center>\n<center>Sicela uzame futhi emuva kwesikhathi.</center>",
    "zu": "### <center>Sisebenza kwesi sifundo.</center>\n<center>Nceda zama kwakhona.</center>"
  },

  "teacher_comments": {
    "am": "Teacher comments",
    "af": "Teacher comments",
    "ar": "Teacher comments",
    "bg": "Учител коментира.",
    "cs": "Teacher comments",
    "da": "Aktiviteter og dialog",
    "de": "Lehrerteil",
    "en": "Teacher Comments",
    "es": "Teacher Comments",
    "et": "Teacher Comments",
    "fa": "Teacher Comments",
    "fj": "Teacher Comments",
    "fi": "Teacher Comments",
    "fr": "Commentaires Moniteurs",
    "it": "Commenti degli insegnanti",
    "in": "Teacher Comments",
    "is": "Teacher Comments",
    "ilo": "Teacher Comments",
    "lt": "Teacher Comments",
    "lv": "Palīgmateriāls Bībeles studiju skolotājiem",
    "hr": "Učitelj komentira",
    "he": "Teacher Comments",
    "hi": "Teacher Comments",
    "hil": "Teacher Comments",
    "hu": "Tanítói Melléklet",
    "hy": "Teacher Comments",
    "mk": "Teacher Comments",
    "mn": "Багшийн тайлбар",
    "ms": "Komen Guru",
    "ne": "Teacher Comments",
    "no": "Teacher Comments",
    "nl": "Teacher Comments",
    "ko": "교사의 의견",
    "lo": "Teacher Comments",
    "pt": "Moderador",
    "ro": "Teacher Comments",
    "ru": "Комментарий для Учителей",
    "ka": "კომენტარები მასწავლებლებისთვის",
    "sk": "Pouka za učitelje",
    "sl": "Pouka za učitelje",
    "si": "Teacher comments",
    "sr": "Pouka za učitelje",
    "st": "Tlhaiso ha Mosuwe",
    "sq": "Teacher Comments",
    "sw": "Teacher Comments",
    "ta": "Teacher Comments",
    "th": "ความคิดเห็นของครู",
    "tr": "Teacher Comments",
    "tl": "Ang mga guro ay nagsabi",
    "uk": "Teacher Comments",
    "ja": "Teacher Comments",
    "zh": "Teacher Comments",
    "vi": "Teacher Comments",
    "xh": "Teacher Comments",
    "zu": "Teacher Comments"
  },

  "inside_story": {
    "am": "Inside story",
    "af": "Inside story",
    "ar": "Inside story",
    "bg": "Разказ",
    "cs": "Inside story",
    "da": "Missionsberetning",
    "de": "Mit Gott erlebt",
    "en": "Inside Story",
    "es": "Inside Story",
    "et": "Misjonilugu",
    "fa": "داستانهای ایمانداران",
    "fj": "Inside Story",
    "fi": "Inside Story",
    "fr": "Histoire",
    "it": "Finestra sulle missioni",
    "in": "Inside Story",
    "ilo": "Inside Story",
    "is": "Inside Story",
    "hr": "Iskustvo",
    "he": "Inside Story",
    "hi": "Inside Story",
    "hil": "Inside Story",
    "lt": "Inside Story",
    "lv": "Misijas ziņas",
    "hu": "Inside Story",
    "hy": "Inside Story",
    "mk": "Inside Story",
    "mn": "Гэрчлэлийн Туух",
    "ms": "Inside Story",
    "ne": "कथा",
    "nl": "Inside Story",
    "no": "Misjonsfortelling",
    "ko": "선교 이야기",
    "lo": "Inside Story",
    "pt": "Inside Story",
    "ro": "Inside Story",
    "ru": "Миссионерская история",
    "ka": "მისიონერული ისტორია",
    "lr": "Inside Story",
    "sk": "Inside Story",
    "sl": "Inside Story",
    "si": "Inside Story",
    "sr": "Inside Story",
    "st": "Taba tsa ka hare",
    "sq": "Inside Story",
    "sw": "Inside Story",
    "ta": "Inside Story",
    "th": "ข่าวพันธกิจสำหรับผู้ใหญ่",
    "tl": "Kuwento ng misyon",
    "tr": "Inside Story",
    "uk": "Місіонерська історія",
    "ja": "Inside Story",
    "zh": "Inside Story",
    "vi": "Inside Story",
    "xh": "Inside Story",
    "zu": "Inside Story"
  },

  "tmi": {
    "ko": "TMI"
  }
};

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}

function createLanguageFolder(quarterlyLanguage){
  console.log("Necessary directory not found. Creating...");
  fs.mkdirSync(SRC_PATH + quarterlyLanguage);
  fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/info.yml", "---\n  name: \"Language Name\"\n  code: \""+ quarterlyLanguage +"\"");
  console.log("Necessary " + quarterlyLanguage + " directory created");
}

function createQuarterlyFolderAndContents(quarterlyLanguage, quarterlyId, quarterlyLessonAmount, quarterlyTitle, quarterlyDescription, quarterlyHumanDate, quarterlyTeacherComments, quarterlyInsideStory, quarterlyTmi, quarterlyStartDate, lessonCover, quarterlyColorPrimary, quarterlyColorDark){

  var start_date = moment(quarterlyStartDate, DATE_FORMAT),
      start_date_f = moment(quarterlyStartDate, DATE_FORMAT);

  console.log("Creating file structure for new quarterly. Please do not abort execution");

  fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId);

  for (var i = 1; i <= quarterlyLessonAmount; i++){
    fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i));

    fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/info.yml", "---\n  title: \"Weekly Lesson Title\"\n  start_date: \""+moment(start_date).format(DATE_FORMAT)+"\"\n  end_date: \""+ moment(start_date).add(6, "d").format(DATE_FORMAT) +"\"");

    for (var j = 1; j <= 7; j++){
      fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/" + pad(j) + ".md",
        "---\ntitle:  "+LOCALE_VARS["daily_lesson_title"][quarterlyLanguage]+"\ndate:   "+moment(start_date).format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
      );
      start_date = moment(start_date).add(1, "d");
    }

    if (quarterlyTeacherComments){
      fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/teacher-comments.md",
        "---\ntitle:  "+LOCALE_VARS["teacher_comments"][quarterlyLanguage]+"\ndate:   "+moment(start_date).add(-1, "d").format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
      );
    }

    if (quarterlyInsideStory){
      fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/inside-story.md",
        "---\ntitle:  "+LOCALE_VARS["inside_story"][quarterlyLanguage]+"\ndate:   "+moment(start_date).add(-1, "d").format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
      );
    }

    if (quarterlyTmi){
      fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/tmi.md",
        "---\ntitle:  "+LOCALE_VARS["tmi"][quarterlyLanguage]+"\ndate:   "+moment(start_date).add(-1, "d").format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
      );
    }

    if (lessonCover){
      fs.copySync(LESSON_COVER, SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/cover.png");
    }
  }

  start_date = moment(start_date).add(-1, "d");

  if (fs.existsSync(`${SRC_PATH}/en/${quarterlyId}/info.yml`)) {
    let englishInfo = yamljs.load(`${SRC_PATH}/en/${quarterlyId}/info.yml`);
    if (!quarterlyColorPrimary) {
      quarterlyColorPrimary = englishInfo.color_primary
    }
    if (!quarterlyColorDark) {
      quarterlyColorDark = englishInfo.color_primary_dark
    }
  } else {
    quarterlyColorPrimary = "#7D7D7D";
    quarterlyColorDark = "#333333";
  }

  if (quarterlyHumanDate === true) {
    let quarter = quarterlyId.substr(quarterlyId.indexOf("-")+1,2);
    let year = quarterlyId.substr(0, quarterlyId.indexOf("-"));
    let q = "";
    for (let i = 0; i <= 2; i++) {
      let m = moment();
      m.year(parseInt(year));
      m.month(i + (3 * (parseInt(quarter)-1)));
      m.locale(quarterlyLanguage);
      q += changeCase.title(m.format("MMMM")) + ((i < 2) ? ' · ' : ' ');
    }
    q += year;
    quarterlyHumanDate = q;
  }

  fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + "info.yml", "---\n  title: \""+quarterlyTitle+"\"\n  description: \""+quarterlyDescription+"\"\n  human_date: \""+quarterlyHumanDate+"\"\n  start_date: \""+moment(start_date_f).format(DATE_FORMAT)+"\"\n  end_date: \""+moment(start_date).format(DATE_FORMAT)+"\"\n  color_primary: \""+quarterlyColorPrimary+"\"\n  color_primary_dark: \""+quarterlyColorDark+"\"");
  fs.copySync(QUARTERLY_COVER, SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/cover.png");

  console.log("File structure for new quarterly created");
}

try {
  stats = fs.lstatSync(SRC_PATH + argv.l);
  if (stats.isDirectory()) {
    console.log("Found necessary directory " + argv.l);
  } else {
    createLanguageFolder(argv.l);
  }
} catch (e) {
  createLanguageFolder(argv.l);
}

try {
  stats = fs.lstatSync(SRC_PATH + argv.l + "/" + argv.q);
  if (stats.isDirectory()) {
    console.log("Quarterly with same id already exists. Aborting");
  } else {
    console.log("Something weird happened. Aborting");
  }
} catch (e) {
  createQuarterlyFolderAndContents(argv.l, argv.q, argv.c, argv.t, argv.d, argv.h, argv.u, argv.i, argv.m, argv.s, argv.k, argv.y, argv.z);
}
