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
    "k": "Create lesson cover placeholder images",
    "f": "Format. Default is md.",
    "o": "Outlines",
  })
  .demand(["s", "l", "q", "c", "t", "d", "h"])
  .default({ "l" : "en", "c": 13, "u": false, "i": false, "m": false, "k": false, "f": "md" })
  .argv;

var fs     =  require("fs-extra"),
    moment =  require("moment"),
    yamljs = require("js-yaml");

var SRC_PATH = "src/",
    QUARTERLY_COVER = "images/quarterly_cover.png",
    LESSON_COVER = "images/lesson_cover.png",
    DATE_FORMAT = "DD/MM/YYYY";

var LOCALE_VARS = {

  "daily_lesson_title": {
    "am": "ትምህርት",
    "as": "পাঠ",
    "af": "Les",
    "ar": "درس",
    "bbc": "Parsiajaran",
    "bg": "Дневен урок",
    "bn": "পাঠ",
    "ca": "Lliçó",
    "cs": "Lekce",
    "ceb": "Leksyon",
    "ctd": "Laisim",
    "cfm": "Zirlai",
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
    "gu": "પાઠ",
    "grt": "Poraiani",
    "it": "Lezione",
    "lt": "Pamoka",
    "lus": "Zirlai",
    "mr": "धडा",
    "is": "Lexía",
    "ilo": "Liksion",
    "in": "Lesson",
    "he": "שיעור",
    "hi": "पाठ",
    "hil": "Leksion",
    "hmn": "Zaj lus qhia",
    "hr": "Lekcija",
    "ht": "Leson",
    "hu": "Lecke",
    "hy": "Դաս",
    "km": "ខ្មែរ",
    "kin": "Icyigisho",
    "kar": "တၢ်မၤလိ",
    "kjp": "တၢ်မၤလိ",
    "kha": "lynnong",
    "kn": "ಪಾಠ",
    "mk": "Лекција",
    "mg": "Lesona",
    "mn": "Хичээл",
    "ml": "പാഠം",
    "ms": "Pelajaran",
    "my": "သင်ခန်းစာ",
    "ne": "पाठ",
    "no": "Lekse",
    "nl": "Les",
    "ko": "교훈",
    "lo": "ບົດຮຽນ",
    "lv": "Nodarbība",
    "or": "ଶିକ୍ଷା",
    "pap": "Leccion",
    "pl": "Lekcja",
    "pt": "Lição",
    "ro": "Lecție zilnică",
    "ru": "Урок",
    "run": "Indongozi" ,
    "ka": "გაკვეთილი",
    "kin": "Icyigisho",
    "si": "පාඩම",
    "sl": "Lekcija",
    "sn": "Chidzidzo",
    "sk": "Lekcie",
    "sr": "Lekcija",
    "st": "Thuto",
    "sq": "Mësim",
    "sw": "Somo",
    "te": "పాఠం",
    "ta": "பாடம்",
    "ti": "ትምህቲ",
    "th": "บทเรียน",
    "tl": "Leksiyon",
    "tr": "Ders",
    "tw": "Nnawɔtwe biara adesua",
    "uk": "Урок",
    "ja": "日課",
    "zh": "每日课程",
    "vi": "Bài",
    "xh": "Isifundo",
    "zu": "Isifundo"
  },

  "empty_placeholder": {
    "am": "### እኛ በዚህ ሌንስ ላይ እየሰራን ነው ፡፡\nእባክዎ ቆየት ብለው ይሞክሩ.",
    "as": "### আমি এই পাঠটোৰ ওপৰত কাম কৰি আছো।\nঅনুগ্ৰহ কৰি পিছত আহিব।",
    "af": "### Ons werk aan hierdie les.\nKom asseblief later terug.",
    "ar": "### ونحن نعمل على هذا الدرس.\nيرجى العودة لاحقا.",
    "bbc": "### Kami sedang mengerjakan pelajaran ini\nSilahkan kembali lagi nanti",
    "bg": "### Работим по този урок.\nМоля, върнете се по-късно.",
    "bn": "### আমরা এই পাঠে কাজ করছি।\nঅনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।",
    "ca": "### Estem treballant en aquesta lliçó. \nSi us plau, torneu més tard.",
    "cs": "### Na této lekci pracujeme.\nProsim zkuste to znovu pozdeji.",
    "ceb": "### Gihimo namo kini nga leksyon.\nPalihug balik unya.",
    "ctd": "### We are working on this lesson.\nPlease come back later.",
    "cfm": "### We are working on this lesson.\nPlease come back later.",
    "da": "### Vi arbejder på denne lektion.\nPrøv igen senere.",
    "de": "### Wir arbeiten noch an dieser Lektion.\nBitte komme später zurück.",
    "el": "### Εργαζόμαστε σε αυτό το μάθημα\nΠαρακαλώ ελάτε ξανά αργότερα",
    "en": "### We are working on this lesson\nPlease come back later",
    "es": "### Todavía estamos trabajando en esta lección. Por favor, vuelva más tarde.",
    "et": "### Me tegeleme selle õppetükiga. Palun proovige hiljem uuesti.",
    "fa": "### ما در این درس کار می کنیم\nلطفا بعدا بیا",
    "fj": "### Eda sa cakacaka tiko ena lesoni oqo",
    "fi": "### Työskentelemme tämän oppitunnin parissa\nYritä uudelleen myöhemmin",
    "fr": "### Nous travaillons sur cette leçon.\nRevenez plus tard, s'il vous plaît.",
    "gu": "### અમે આ પાઠ પર કામ કરી રહ્યા છીએ.\nકૃપા કરીને પછી પાછા આવો.",
    "grt": "### We are working on this lesson.\nPlease come back later.",
    "it": "### Stiamo lavorando a questa lezione.\nPer favore ritorna più tardi.",
    "is": "### Við erum að vinna að núverandi kennslustund.\nVinsamlegast reyndu aftur síðar.",
    "in": "### Kami sedang mengerjakan pelajaran ini\nSilahkan kembali lagi nanti",
    "ilo": "### Araramiden mi pay daytoy nga liksion\nSublianan yon to",
    "lt": "### Pamoka kuriama.\nKviečiame sugrįžti vėliau.",
    "lus": "### He zirlai hi kan thawk mek a ni.\nKhawngaihin nakinah lo kal leh rawh.",
    "mr": "### आम्ही या धड्यावर काम करत आहोत.\nकृपया नंतर परत या.",
    "lv": "### Mēs strādājam pie šīs nodarbības.\nLūdzu, atgriezieties vēlāk.",
    "he": "### אנחנו עובדים על השיעור הזה\nבבקשה תחזור מאוחר יותר",
    "hi": "### हम इस पाठ पर काम कर रहे हैं।\nकृपया बाद में आइये।",
    "hil": "### Nagsusumikap kami sa araling ito.\nLihog liwat.",
    "hmn": "### Peb tab tom ua haujlwm ntawm zaj lus qhia.\nThov rov los tom qab.",
    "hr": "### Radimo na ovoj lekciji.\nMolimo pokušajte ponovo kasnije.",
    "ht": "### Nou ap travay sou leson sa a.\nTanpri tounen pita.",
    "hu": "### Erre a leckére dolgozunk.\nLégyszíves gyere vissza később.",
    "hy": "### Մենք աշխատում ենք այս դասի վրա:\nԽնդրում եմ փորձեք մի փոքր ուշ",
    "km": "### យើងកំពុងសិក្សាមេរៀននេះ។\nសូម​ព្យាយាម​ម្តង​ទៀត​នៅ​ពេល​ក្រោយ។",
    "kin": "### Turacyari gukora aya migisho\nMuze kugaruka nyuma, Murakoze kwihangana.",
    "kar": "### ဒီသင်ခန်းစာကို ကျွန်တော်တို့ လုပ်ဆောင်နေပါတယ်။\nကျေးဇူးပြုပြီး နောက်မှပြန်လာပါ။",
    "kjp": "### ဒီသင်ခန်းစာကို ကျွန်တော်တို့ လုပ်ဆောင်နေပါတယ်။\nကျေးဇူးပြုပြီး နောက်မှပြန်လာပါ။",
    "kha": "### We are working on this lesson\nPlease come back later",
    "kn": "### ನಾವು ಈ ಪಾಠದಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೇವೆ\nದಯವಿಟ್ಟು ನಂತರ ಹಿಂತಿರುಗಿ",
    "mk": "### Ние работиме на оваа лекција\nТе молам врати се подоцна",
    "mg": "### Eo am-panatanterahana ity lesona ity izahay.\nAndramo indray azafady.",
    "mn": "### Бид энэ хичээл дээр ажиллаж байна.\nДараа дахин ирнэ үү.",
    "ml": "### ഞങ്ങൾ ഈ പാഠത്തിൽ പ്രവർത്തിക്കുന്നു\nപിന്നീട് വീണ്ടും ശ്രമിക്കുക",
    "ms": "### Kami sedang menjalankan pelajaran ini.\nSila balik kemudian.",
    "my": "### ဒီသင်ခန်းစာကို ကျွန်တော်တို့ လုပ်ဆောင်နေပါတယ်။\nကျေးဇူးပြုပြီး နောက်မှပြန်လာပါ။",
    "ne": "### हामी यस पाठमा काम गरिरहेका छौं\nफेरी प्रयास गर्नु होला",
    "nl": "### We werken aan deze les.\nKom alsjeblieft terug.",
    "no": "### Vi jobber med denne leksjonen.\nPrøv igjen senere.",
    "ko": "### 우리는이 공과를 위해 노력하고있다..\n나중에 다시 시도 해주십시오..",
    "lo": "### ພວກເຮົາກໍາລັງເຮັດວຽກໃນບົດຮຽນນີ້.\nກະລຸນາກັບຄືນມາຫຼັງຈາກນັ້ນ.",
    "or": "### ଆମେ ଏହି ଶିକ୍ଷା ଉପରେ କାର୍ଯ୍ୟ କରୁଛୁ |\nଦୟାକରି ପରେ ଫେରି ଆସନ୍ତୁ |",
    "pap": "### Nos ta trahando riba e les aki.\nPor fabor, e ta bolbe despues.",
    "pl": "### Pracujemy nad tą lekcją.\nProszę przyjść później.",
    "pt": "### Estamos a trabalhar sobre esta lição.\nVolte mais tarde, por favor.",
    "ro": "### Lucrăm la această lecție.\nTe rog intoarce-te mai tarziu.",
    "ru": "### Мы подготавливаем данный урок\nПопробуйте позже",
    "run": "### Turacyari gukora aya migisho\nMuze kugaruka nyuma, Murakoze kwihangana.",
    "kin": "### Turacyari gukora aya migisho\nMuze kugaruka nyuma, Murakoze kwihangana.",
    "ka": "### გაკვეთილი მზადების პროცესშია\nსცადეთ მოგვიანებით",
    "sk": "### Pracujeme na tejto lekcii.\nProsím vráť sa neskôr.",
    "si": "### අපි මෙම පාඩම මත වැඩ කරමින් සිටිමු.\nකරුණාකර පසුව නැවත උත්සාහ කරන්න.",
    "sl": "### Delamo na tej lekciji.\nVrnite se kasneje.",
    "sn": "### Tiri kugadzirisa chidzidzo ichi\nDzokai gare gare",
    "sr": "### Radimo na ovoj lekciji.\nMolim vas, vratite se kasnije",
    "st": "### Re sa sebetsa thutong ena\nKa kopo kgutla ha moraho",
    "sq": "### Ne jemi duke punuar në këtë mësim\nJu lutemi provoni përsëri më vonë",
    "sw": "### Tunafanya kazi kwenye somo hili.\nTafadhali   rudi baadaye.",
    "ta": "### நாங்கள் இந்த பாடம் படித்து வருகிறோம்.\nதயவு செய்து மீண்டும் வாருங்கள்.",
    "te": "### మేము ఈ పాఠంపై పని చేస్తున్నాము.\nదయచేసి తర్వాత తిరిగి రండి.",
    "ti": "### ነዚ ትምህርቲ ንሰርሕ ኣለና።",
    "th": "### เรากำลังดำเนินการในบทเรียนนี้\nโปรดกลับมาใหม่.",
    "tl": "### Nagsusumikap kami sa araling ito.\nSubukang muli mamaya.",
    "tr": "### Biz bu derste üzerinde çalışıyoruz.\nLütfen daha sonra gelin.",
    "tw": "### Yɛreyɛ adesua yi ho adwuma.\nYɛsrɛ sɛ monsan mmra akyiri yi..",
    "uk": "### Ми готуємо цей урок.\nБудь ласка, зайдіть пізніше.",
    "ja": "### この日課はまだ完了されていません。もう少し後で戻ってきてください。",
    "zh": "### 我们正在学习这一课。请稍后再来。",
    "vi": "### Chúng tôi đang làm việc trên bài học này.\nXin vui lòng trở lại sau.",
    "xh": "### Sisebenza kulesi sifundo.\nSicela uzame futhi emuva kwesikhathi.",
    "zu": "### Sisebenza kwesi sifundo.\nNceda zama kwakhona."
  },

  "teacher_comments": {
    "am": "Teacher comments",
    "as": "Teacher comments",
    "af": "Teacher comments",
    "ar": "Teacher comments",
    "bbc": "Teacher comments",
    "bg": "Учител коментира.",
    "bn": "Teacher comments",
    "ca": "Teacher comments",
    "cs": "Teacher comments",
    "ceb": "Teacher comments",
    "ctd": "Teacher comments",
    "cfm": "Teacher comments",
    "da": "Aktiviteter og dialog",
    "de": "Lehrerteil",
    "en": "Teacher Comments",
    "es": "Teacher Comments",
    "et": "Teacher Comments",
    "fa": "Teacher Comments",
    "fj": "Teacher Comments",
    "fi": "Teacher Comments",
    "fr": "Commentaires Moniteurs",
    "gu": "Teacher Comments",
    "grt": "Teacher Comments",
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
    "ht": "Teacher Comments",
    "hu": "Tanítói Melléklet",
    "hy": "Teacher Comments",
    "km": "Teacher Comments",
    "kin": "Ubusobanuro Bugenewe Abigisha",
    "kar": "Teacher Comments",
    "kjp": "Teacher Comments",
    "kha": "Teacher Comments",
    "kn": "Teacher Comments",
    "mk": "Teacher Comments",
    "mg": "Teacher Comments",
    "ml": "Teacher Comments",
    "mn": "Багшийн тайлбар",
    "ms": "Komen Guru",
    "my": "Teacher Comments",
    "ne": "Teacher Comments",
    "no": "Teacher Comments",
    "nl": "Teacher Comments",
    "ko": "교사의 의견",
    "lo": "Teacher Comments",
    "lus": "Teacher Comments",
    "mr": "Teacher Comments",
    "or": "Teacher Comments",
    "papa": "Teacher Comments",
    "pt": "Moderador",
    "ro": "Teacher Comments",
    "ru": "Комментарий для Учителей",
    "run": "Teacher Comments",
    "ka": "კომენტარები მასწავლებლებისთვის",
    "sk": "Pouka za učitelje",
    "sl": "Pouka za učitelje",
    "si": "Teacher comments",
    "sn": "Teacher comments",
    "sr": "Pouka za učitelje",
    "st": "Tlhaiso ha Mosuwe",
    "sq": "Teacher Comments",
    "sw": "Teacher Comments",
    "ta": "Teacher Comments",
    "te": "Teacher Comments",
    "th": "ความคิดเห็นของครู",
    "tr": "Teacher Comments",
    "tl": "Ang mga guro ay nagsabi",
    "uk": "Teacher Comments",
    "ja": "Teacher Comments",
    "zh": "Teacher Comments",
    "vi": "Teacher Comments",
    "tw": "Teacher Comments",
    "xh": "Teacher Comments",
    "zu": "Teacher Comments"
  },

  "inside_story": {
    "am": "Inside story",
    "as": "Inside story",
    "af": "Inside story",
    "ar": "Inside story",
    "bbc": "Inside story",
    "bg": "Разказ",
    "bn": "Inside story",
    "ca": "Inside story",
    "cs": "Inside story",
    "ceb": "Inside story",
    "ctd": "Inside story",
    "cfm": "Inside story",
    "da": "Missionsberetning",
    "de": "Mit Gott erlebt",
    "en": "Inside Story",
    "es": "Inside Story",
    "et": "Misjonilugu",
    "fa": "داستانهای ایمانداران",
    "fj": "Inside Story",
    "fi": "Inside Story",
    "fr": "Histoire",
    "gu": "Inside Story",
    "grt": "Inside Story",
    "it": "Finestra sulle missioni",
    "in": "Inside Story",
    "ilo": "Inside Story",
    "is": "Inside Story",
    "hr": "Iskustvo",
    "he": "Inside Story",
    "hi": "Inside Story",
    "ht": "Inside Story",
    "hil": "Inside Story",
    "lt": "Inside Story",
    "lv": "Misijas ziņas",
    "hu": "Inside Story",
    "hy": "Inside Story",
    "km": "រឿងខ្លី",
    "kin": "Gahunda yo Kugarurira Icyacumi no Gutura Amaturo",
    "kar": "Inside Story",
    "kjp": "Inside Story",
    "kha": "Inside Story",
    "kn": "Inside Story",
    "mk": "Inside Story",
    "mg": "Inside Story",
    "ml": "Inside Story",
    "mn": "Гэрчлэлийн Туух",
    "ms": "Inside Story",
    "my": "Inside Story",
    "ne": "कथा",
    "nl": "Inside Story",
    "no": "Misjonsfortelling",
    "ko": "선교 이야기",
    "lo": "Inside Story",
    "lus": "Inside Story",
    "mr": "Inside Story",
    "or": "Inside Story",
    "pap": "Inside Story",
    "pt": "Inside Story",
    "ro": "Inside Story",
    "ru": "Миссионерская история",
    "run": "Inside Story",
    "ka": "მისიონერული ისტორია",
    "lr": "Inside Story",
    "sk": "Inside Story",
    "sl": "Inside Story",
    "si": "Inside Story",    
    "sn": "Inside Story",
    "sr": "Inside Story",
    "st": "Taba tsa ka hare",
    "sq": "Inside Story",
    "sw": "Inside Story",
    "ta": "Inside Story",
    "te": "Inside Story",
    "th": "ข่าวพันธกิจสำหรับผู้ใหญ่",
    "tl": "Kuwento ng misyon",
    "tr": "Inside Story",
    "tw": "Inside Story",
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

function createQuarterlyFolderAndContents(quarterlyLanguage, quarterlyId, quarterlyLessonAmount, quarterlyTitle, quarterlyDescription, quarterlyHumanDate, quarterlyTeacherComments, quarterlyInsideStory, quarterlyTmi, quarterlyStartDate, lessonCover, quarterlyColorPrimary, quarterlyColorDark, outline){

  var start_date = moment(quarterlyStartDate, DATE_FORMAT),
      start_date_f = moment(quarterlyStartDate, DATE_FORMAT);

  let credits = null;

  console.log("Creating file structure for new quarterly. Please do not abort execution");

  fs.mkdirSync(SRC_PATH + quarterlyLanguage + "/" + quarterlyId);

  if (argv.f === "pdf") {
    let pdf = []
    for (var i = 1; i <= quarterlyLessonAmount; i++) {
      pdf.push({
        src: "",
        target: `${quarterlyLanguage}/${quarterlyId}/${String(i).padStart(2, '0')}`,
        title: LOCALE_VARS["daily_lesson_title"][quarterlyLanguage],
        start_date: moment(start_date).format(DATE_FORMAT),
        end_date: moment(start_date).add(6, 'd').format(DATE_FORMAT)
      })
      start_date = moment(start_date).add(7, "d");
    }
    fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/pdf.yml",
        yamljs.dump({ pdf: pdf }, {
          lineWidth: -1
        }).replace(/^(?!$)/mg, '  ').replace(/^/, '---\n')
    );
  }

  if (argv.f === "md") {
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

      if (outline){
        fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/hope-ss.md",
            "---\ntitle:  "+LOCALE_VARS["daily_lesson_title"][quarterlyLanguage]+"\ndate:   "+moment(start_date).add(-1, "d").format(DATE_FORMAT)+"\n---\n\n"+LOCALE_VARS["empty_placeholder"][quarterlyLanguage]
        );
      }

      // Not need anymore.
      // if (lessonCover){
      //   fs.copySync(LESSON_COVER, SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + pad(i) + "/cover.png");
      // }
    }
  }



  start_date = moment(start_date).add(-1, "d");

  if (fs.existsSync(`${SRC_PATH}/en/${quarterlyId}/info.yml`)) {
    let englishInfo = yamljs.load(fs.readFileSync(`${SRC_PATH}/en/${quarterlyId}/info.yml`));
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

  if (fs.existsSync(`${SRC_PATH}/${quarterlyLanguage}/credits.yml`)) {
    credits = yamljs.load(fs.readFileSync(`${SRC_PATH}/${quarterlyLanguage}/credits.yml`));

    try {
      credits = credits['credits']
    } catch (e) {
      credits = null
    }
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
      q += m.format("MMMM") + ((i < 2) ? ' · ' : ' ');
    }
    q += year;
    quarterlyHumanDate = q;
  }

  let quarterlyInfoYaml = `---\n  title: "${quarterlyTitle}"
  description: "${quarterlyDescription}"
  human_date: "${quarterlyHumanDate}"
  start_date: "${moment(start_date_f).format(DATE_FORMAT)}"
  end_date: "${moment(start_date).format(DATE_FORMAT)}"
  color_primary: "${quarterlyColorPrimary}"
  color_primary_dark: "${quarterlyColorDark}"`;

  if (credits) {
    quarterlyInfoYaml += `\n  credits:`;
    for (credit of credits) {
      quarterlyInfoYaml += `\n    - name: ${credit.name}`;
      quarterlyInfoYaml += `\n      value: ${credit.value ? credit.value : "\"\""}`
    }
  }

  fs.outputFileSync(SRC_PATH+ "/" + quarterlyLanguage + "/" + quarterlyId + "/" + "info.yml", quarterlyInfoYaml);
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
  createQuarterlyFolderAndContents(argv.l, argv.q, argv.c, argv.t, argv.d, argv.h, argv.u, argv.i, argv.m, argv.s, argv.k, argv.y, argv.z, argv.o);
}
