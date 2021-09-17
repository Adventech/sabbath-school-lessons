#!/usr/bin/env node

let donationNotice = {
  'en': "<div style=\"display: none\" class=\"ss-donation-appeal\">\n" +
    "    <div class=\"ss-donation-appeal-title\">\n" +
    "      <p>We need your help!</p>\n" +
    "      <div class=\"ss-donation-appeal-icon\"></div>\n" +
    "    </div>\n" +
    "    <div class=\"ss-donation-appeal-text\">\n" +
    "      <p>Dear brothers and sisters, we would like to thank <strong>each</strong> of you for being with us and using the Sabbath School app. As you know, we at Adventech are all volunteers, passionate to be part of the\n" +
    "        <strong>greatest commission</strong> and that is why our mission is to use technology for His glory!</p>\n" +
    "      <p>Early on we decided that our application would remain ad-free. We want to continue adding new features and functionality to Sabbath School. For example, this year we plan to add\n" +
    "        <strong>audio / video</strong> support for the Sabbath School app.</p>\n" +
    "      <p>We are truly humbled that many of you are generous and have offered to <strong>donate</strong> to our ministry. Every amount counts and we thank you so much for being here for us.</p>\n" +
    "      <p>You can make donation using the link below:</p>\n" +
    "      <p><strong><a href=\"https://adventech.io/donate\">adventech.io/donate</a></strong></p>\n" +
    "      <p><em>Adventech team</em></p>\n" +
    "    </div>\n" +
    "  </div>",
  'de': "<div style=\"display: none\" class=\"ss-donation-appeal\">\n" +
    "<div class=\"ss-donation-appeal-title\">\n" +
    "<p>Wir brauchen deine Hilfe!</p>\n" +
    "<div class=\"ss-donation-appeal-icon\"></div>\n" +
    "</div>\n" +
    "<div class=\"ss-donation-appeal-text\">\n" +
    "<p>Liebe Brüder und Schwestern, wir möchten uns bei <strong>jedem</strong> von euch dafür bedanken, dass ihr dabei seid und die Sabbatschul-App nutzt. Wie ihr wisst, sind wir bei Adventech alle <strong>ehrenamtlich</strong> tätig, leidenschaftlich bestrebt, Teil des <strong>besten Dienstes</strong> zu sein, und deshalb besteht unsere Mission darin, Technologie zu Seiner Ehre zu verwenden!</p>\n" +
    "<p>Schon früh haben wir entschieden, dass unsere Anwendung werbefrei bleiben soll. Wir wollen der Sabbatschule-App weiterhin neue Funktionen und Features implementieren. Zum Beispiel planen wir dieses Jahr eine <strong>Audio-/Video-Unterstützung</strong> für die Sabbatschule-App einzuführen.</p>\n" +
    "<p>Wir sind wirklich dankbar, dass viele von euch großzügig sind und angeboten haben, für unseren Dienst zu <strong>spende</strong>. Jeder Betrag zählt, und wir danken euch sehr, dass ihr für uns da seid.</p>\n" +
    "<p>Ihr könnt über den Link unterhalb eine Spende leisten:</p>\n" +
    "<p><strong><a href=\"https://adventech.io/donate\">adventech.io/donate</a></strong></p>\n" +
    "<p><em>Adventech-team</em></p>\n" +
    "</div>\n" +
    "</div>",
  "es": "<div style=\"display: none\" class=\"ss-donation-appeal\">\n" +
    "<div class=\"ss-donation-appeal-title\">\n" +
    "<p>¡Necesitamos tu ayuda!</p>\n" +
    "<div class=\"ss-donation-appeal-icon\"></div>\n" +
    "</div>\n" +
    "<div class=\"ss-donation-appeal-text\">\n" +
    "<p>Queridos hermanos y hermanas,</p>\n" +
    "<p>Les queremos agradecer a <strong>cada uno</strong> de ustedes por utilizar la aplicación de Sabbath School. Como saben, los que colaboramos en Adventech somos todos <strong>voluntarios</strong>, apasionados de ser parte de la <strong>gran comisión</strong> que se nos encomendó, ¡y es por eso que nuestra misión es utilizar la tecnología para honra y gloria de nuestro Dios! Desde el inicio de nuestra aplicación, decidimos que permanecería sin anuncios o comerciales. Deseamos continuar añadiendo nuevas funcionalidades y herramientas a la aplicación de Sabbath School; por ejemplo, este año planeamos agregar soporte de <strong>audio y video</strong> a nuestra aplicación.</p>\n" +
    "<p>Agradecemos profundamente que muchos han sido generosos y han <strong>donado</strong> a nuestro ministerio. Cada centavo cuenta, y agradecemos mucho que estén aquí para apoyarnos.</p>\n" +
    "<p>Puede realizar una donación en el siguiente enlace:</p>\n" +
    "<p><strong><a href=\"https://adventech.io/donate\">adventech.io/donate</a></strong></p>\n" +
    "<p>Gracias,</p>\n" +
    "<p><em>Equipo de Adventech</em></p>" +
    "</div>\n" +
    "</div>",
  "pl": "<div style=\"display: none\" class=\"ss-donation-appeal\">\n" +
    "<div class=\"ss-donation-appeal-title\">\n" +
    "<p>Potrzebujemy Twojej pomocy!</p>\n" +
    "<div class=\"ss-donation-appeal-icon\"></div>\n" +
    "</div>\n" +
    "<div class=\"ss-donation-appeal-text\">\n" +
    "<p>Drodzy bracia i drogie siostry w Chrystusie, pragniemy szczególnie podziękować wam wszystkim oraz każdemu z osobna za wasze wsparcie i korzystanie z aplikacji Szkoła Sobotnia. Jak dobrze wiecie, wszyscy, którzy pracujemy w Adventech jesteśmy wolontariuszami. Z pasją uczestniczymy w największym zleceniu i dlatego naszą misją jest wykorzystanie technologii dla Jego chwały!</p>\n" +
    "<p>Jesteśmy naprawdę zaszczyceni, że wielu z was wspiera nas, dzieląc się aplikacją z przyjaciółmi i rodziną. </p>\n" +
    "<p>Niedawno osiągnęliśmy porozumienie z wydawnictwem Znaki Czasu, aby za ich zgodą publikować polską wersję lekcji szkoły sobotniej. Prosimy Was wszystkich o wsparcie wydawnictwa poprzez przekazanie darowizn. Liczy się każda kwota i bardzo Wam dziękujemy, że jesteście tu.</p>\n" +
    "<p>Koszt lekcji w wersji elektronicznej kwartalnie w wydawnictwie wynosi:</p>\n" +
    "<p>11 zł - przekazując tę kwotę dla wydawnictwa pomagasz sfinansować materiał, który otrzymujesz!</p>\n" +
    "<p>Darowiznę możesz przekazać poprzez kliknięcie poniższego linku:</p>\n" +
    "<p><strong><a href=\"https://zrzutka.pl/g8tfmw\">https://zrzutka.pl/g8tfmw</a></strong></p>\n" +
    "<p><em>Zespół Adventech</em></p>" +
    "</div>\n" +
    "</div>"
}

let firebase = require("firebase-admin"),
    glob = require("glob"),
    yamljs = require("js-yaml"),
    metaMarked = require("meta-marked"),
    ent = require('ent'),
    fs = require("fs-extra"),
    crypto = require('crypto'),
    moment = require("moment");

const bibleSearchBCV = require('adventech-bible-tools/bible_tools_bcv');

const { getCompilationQuarterValue, getInfoFromPath } = require('./deploy-helper');

const DAYS_MAP = new Map([
  ['01', 'Saturday'],
  ['02', 'Sunday'],
  ['03', 'Monday'],
  ['04', 'Tuesday'],
  ['05', 'Wednesday'],
  ['06', 'Thursday'],
  ['07', 'Friday'],
])

let argv = require("optimist").usage("Compile & deploy script - DON'T USE IF YOU DON'T KNOW WHAT IT DOES\n" +
    "Usage: $0 -b [string]")
    .alias({"b": "branch"})
    .describe({
      "b": "branch",
      "l": "language",
      "q": "quarter",
      "v": "api"
    })
    .demand(["b"])
    .argv;

let branch = argv.b,
    compile_language = argv.l || "*",
    compile_quarter = argv.q || getCompilationQuarterValue(),
    target_api = parseInt(argv.v) || 1;

let API_HOST = "https://sabbath-school.adventech.io/api/",
    API_VERSION = target_api === 1 ? "v1" : "v2",
    PDF_HOST = "https://sabbath-school-pdf.adventech.io/",
    SOURCE_DIR = "src/",
    SOURCE_INFO_FILE = "info.yml",
    SOURCE_PDF_FILE = "pdf.yml",
    SOURCE_COVER_FILE = "cover.png",
    SOURCE_SPLASH_FILE = "splash.png",
    DIST_DIR = "dist/api/" + API_VERSION + "/",
    WEB_DIR = "web/content/",
    BIBLE_PARSER_CONFIG = require("./config.js"),
    FIREBASE_DATABASE_LANGUAGES = "/api/" + API_VERSION + "/languages",
    FIREBASE_DATABASE_QUARTERLIES = "/api/" + API_VERSION + "/quarterlies",
    FIREBASE_DATABASE_QUARTERLY_INFO = "/api/" + API_VERSION + "/quarterly-info",
    FIREBASE_DATABASE_LESSONS = "/api/" + API_VERSION + "/lessons",
    FIREBASE_DATABASE_LESSON_INFO = "/api/" + API_VERSION + "/lesson-info",
    FIREBASE_DATABASE_DAYS = "/api/" + API_VERSION + "/days",
    FIREBASE_DATABASE_READ = "/api/" + API_VERSION + "/reads";

let renderer = new metaMarked.noMeta.Renderer();

renderer.codespan = function (text) {
  return '<code>' + ent.decode(text) + '</code>';
};

let slug = function (input) {
  return input.toLowerCase().replace(/ /g, "-")
};

let convertDatesForWeb = function (object) {
  for (let key in object) {
    if (object.hasOwnProperty(key)) {
      if (key === "date" ||
        key === "start_date" ||
        key === "end_date") {
        object[key] = moment(object[key], "DD/MM/YYYY").format("YYYY-MM-DD");
      }
    }
  }
  return object;
};

let yamlify = function (json) {
  return "---\n" + yamljs.dump(json, {lineWidth: -1}) + "\n---";
};

let db
if (branch.toLowerCase() === "master") {
  API_HOST = "https://sabbath-school.adventech.io/api/";
  PDF_HOST = "https://sabbath-school-pdf.adventech.io/";
  firebase.initializeApp({
    databaseURL: "https://blistering-inferno-8720.firebaseio.com",
    credential: firebase.credential.cert(require('./deploy-creds.json')),
    databaseAuthVariableOverride: {
      uid: "deploy"
    }
  });
  db = firebase.database();
} else if (branch.toLowerCase() === "stage") {
  API_HOST = "https://sabbath-school-stage.adventech.io/api/";
  PDF_HOST = "https://sabbath-school-pdf-stage.adventech.io/";
  firebase.initializeApp({
    databaseURL: "https://sabbath-school-stage.firebaseio.com",
    credential: firebase.credential.cert(require('./deploy-creds-stage.json')),
    databaseAuthVariableOverride: {
      uid: "deploy"
    }
  });
  db = firebase.database();
} else {
  firebase = {
    app: function () {
      return {
        delete: function () {}
      }
    }
  };
  db = {
    ref: function () {
      return {
        set: function () {},
        child: function () {
          return {
            set: function (a) {},
            once: function () {}
          }
        }
      }
    },
    goOffline: function () {}
  }
}

// Processing cover images
let processCoverImages = function () {
  console.log('Processing cover images');
  let files = glob.sync(`images/global/${compile_quarter}/*/cover.png`);
  for (let i = 0; i < files.length; i++) {
    try {
      fs.copySync(files[i], files[i].replace("images/global", DIST_DIR + "images/global"));
      if (!/master|stage/i.test(branch)) {
        fs.copySync(files[i], files[i].replace("images/global", "web/static/img/global"));
      }
    } catch (e) {}
  }

  let splash = glob.sync(`images/global/${compile_quarter}/${SOURCE_SPLASH_FILE}`);
  for (let i = 0; i < splash.length; i++) {
    try {
      fs.copySync(splash[i], splash[i].replace("images/global", DIST_DIR + "images/global"));
      if (!/master|stage/i.test(branch)) {
        fs.copySync(splash[i], splash[i].replace("images/global", "web/static/img/global"));
      }
    } catch (e) {}
  }
};

// Processing other images
let processMiscImages = function () {
  console.log('Processing misc images');
  let files = glob.sync("images/misc/*.{png,jpg,jpeg}");
  for (let i = 0; i < files.length; i++) {
    try {
      fs.copySync(files[i], files[i].replace("images/misc", DIST_DIR + "images/misc"));
      if (!/master|stage/i.test(branch)) {
        fs.copySync(files[i], files[i].replace("images/misc", "web/static/img/misc"));
      }
    } catch (e) {}
  }
};

let processFeaturesImages = function () {
  console.log('Processing features images');
  let files = glob.sync("images/features/*.{png,jpg,jpeg}");
  for (let i = 0; i < files.length; i++) {
    try {
      fs.copySync(files[i], files[i].replace("images/features", DIST_DIR + "images/features"));
      if (!/master|stage/i.test(branch)) {
        fs.copySync(files[i], files[i].replace("images/features", "web/static/img/features"));
      }
    } catch (e) {}
  }
};

let processAssetImages = function () {
  console.log('Processing asset images');
  let assets = glob.sync(`src/*/${compile_quarter}/*/*.{png,jpg,jpeg}`);
  for (let asset of assets) {
    let info = getInfoFromPath(asset)
    fs.copySync(asset, `${DIST_DIR}${info.language}/quarterlies/${info.quarterly}/lessons/${info.lesson}/days/${asset.split("/").pop()}`);
  }
};

let getQuarterlyJSON = function (quarterlyPath) {
  let quarterly = yamljs.load(fs.readFileSync(`${quarterlyPath}info.yml`)),
      info = getInfoFromPath(quarterlyPath);

  quarterly.lang = info.language;
  quarterly.id = info.quarterly;
  quarterly.index = `${info.language}-${info.quarterly}`;
  quarterly.path = `${info.language}/quarterlies/${info.quarterly}`;
  quarterly.full_path = `${API_HOST}${API_VERSION}/${info.language}/quarterlies/${info.quarterly}`;
  quarterly.introduction = quarterly.description

  if (fs.pathExistsSync(quarterlyPath + "/introduction.md")) {
    quarterly.introduction = fs.readFileSync(quarterlyPath + "/introduction.md", "utf-8")
  }

  if (quarterly.credits) {
    quarterly.credits = quarterly.credits.filter(item => item.value.length)
  }

  if (fs.existsSync(`src/${info.language}/features.yml`)) {
    let quarterly_features = []
    let features = yamljs.load(fs.readFileSync(`src/${info.language}/features.yml`));

    for (let key of Object.keys(features)) {
      features[key].image = `${API_HOST}${features[key].image}`
    }

    if (quarterly.features && quarterly.features.length) {
      for (let feature of quarterly.features) {
        if (feature && features[feature]) {
          quarterly_features.push(features[feature])
        }
      }
    }

    let inside_stories = glob.sync(`${quarterlyPath}/+(0|1|2|3|4|5|6|7|8|9)/inside-story.md`);

    if (inside_stories.length && features['inside-story']) {
      quarterly_features.push(features['inside-story'])
    }

    let teacher_comments = glob.sync(`${quarterlyPath}/+(0|1|2|3|4|5|6|7|8|9)/teacher-comments.md`);

    if (teacher_comments.length && features['teacher-comments']) {
      quarterly_features.push(features['teacher-comments'])
    }

    let audio = glob.sync(`${quarterlyPath}/audio.yml`);

    if (audio.length && features['audio']) {
      quarterly_features.push(features['audio'])
    }

    let video = glob.sync(`${quarterlyPath}/video.yml`);

    if (video.length && features['video']) {
      quarterly_features.push(features['video'])
    }

    quarterly.features = quarterly_features.filter((thing, index) => {
      const _thing = JSON.stringify(thing);
      return index === quarterly_features.findIndex(obj => {
        return JSON.stringify(obj) === _thing;
      });
    });
  }
  if (fs.existsSync(`src/${info.language}/groups.yml`)) {
    let groups = yamljs.load(fs.readFileSync(`src/${info.language}/groups.yml`));
    let quarterly_group = quarterly.index.substring(10).replace(/^-/, '')
    if (!quarterly_group.length) {
      quarterly_group = 'default'
    }

    if (quarterly_group.length && groups[quarterly_group]) {
      quarterly.quarterly_group = groups[quarterly_group]
    }
  }

  if (fs.existsSync(`${quarterlyPath}/${SOURCE_SPLASH_FILE}`)) {
    fs.copySync(quarterlyPath + "/" + SOURCE_SPLASH_FILE, DIST_DIR + quarterly.path + "/" + SOURCE_SPLASH_FILE);
    quarterly.splash = quarterly.full_path + "/" + SOURCE_SPLASH_FILE;
  } else {
    if (fs.existsSync(`images/global/${info.quarterly.slice(0, 7)}/${SOURCE_SPLASH_FILE}`) && quarterly.splash === true) {
      quarterly.splash = `${API_HOST}${API_VERSION}/images/global/${info.quarterly.slice(0, 7)}/${SOURCE_SPLASH_FILE}`;
    }
  }

  try {
    fs.lstatSync(quarterlyPath + "/" + SOURCE_COVER_FILE);
    fs.copySync(quarterlyPath + "/" + SOURCE_COVER_FILE, DIST_DIR + quarterly.path + "/" + SOURCE_COVER_FILE);
    quarterly.cover = quarterly.full_path + "/" + SOURCE_COVER_FILE;
  } catch (err) {
    quarterly.cover = "";
  }
  return quarterly
};

let getLessonJSON = function (lessonPath, pdf, pdfPath) {
  let lesson = {}, info

  if (pdf && pdfPath) {

    let targetPdf = pdf[0]
    let id = targetPdf.target.substr(targetPdf.target.lastIndexOf('/')+1)
    info = getInfoFromPath(`${pdfPath.replace("/"+SOURCE_PDF_FILE, id)}/`);
    lesson.title = targetPdf.title
    lesson.start_date = targetPdf.start_date
    lesson.end_date = targetPdf.end_date


  } else if (lessonPath) {
    try {
      lesson = yamljs.load(fs.readFileSync(`${lessonPath}info.yml`))
      info = getInfoFromPath(lessonPath);
    } catch (err) {
      console.log(`${lessonPath}info.yml`)
      console.log(err)
    }
  }

  lesson.id = info.lesson;
  lesson.index = `${info.language}-${info.quarterly}-${info.lesson}`;
  lesson.path = `${info.language}/quarterlies/${info.quarterly}/lessons/${info.lesson}`;
  lesson.full_path = `${API_HOST}${API_VERSION}/${lesson.path}`;

  if (target_api === 2) {
    lesson.pdfOnly = false
  }

  let targetQuarterlyIndex = info.quarterly

  if (!fs.pathExistsSync(`images/global/${targetQuarterlyIndex}/${info.lesson}/${SOURCE_COVER_FILE}`)) {
    targetQuarterlyIndex = info.quarterly.slice(0, 7)
  }

  lesson.cover = `${API_HOST}${API_VERSION}/images/global/${targetQuarterlyIndex}/${info.lesson}/${SOURCE_COVER_FILE}`;

  if (!/master|stage/i.test(branch)) {
    lesson.cover = `/img/global/${targetQuarterlyIndex}/${info.lesson}/${SOURCE_COVER_FILE}`;
  }

  // TODO: Optimize to check if file exists instead of try / catch block
  try {
    fs.lstatSync(`${lessonPath}/${SOURCE_COVER_FILE}`);
    fs.copySync(`${lessonPath}/${SOURCE_COVER_FILE}`, `${DIST_DIR}${lesson.path}/${SOURCE_COVER_FILE}`);
    lesson.cover = `${lesson.full_path}/${SOURCE_COVER_FILE}`;
  } catch (err) {}
  return lesson
};

let getDayJSON = function (dayPath, deep) {
  let _day = metaMarked(fs.readFileSync(dayPath, "utf-8"), {renderer: renderer}),
      info = getInfoFromPath(dayPath);

  let day = _day.meta;
  day.id = info.day;
  day.index = `${info.language}-${info.quarterly}-${info.lesson}-${info.day}`;
  day.path = `${info.language}/quarterlies/${info.quarterly}/lessons/${info.lesson}/days/${info.day}`;
  day.full_path = `${API_HOST}${API_VERSION}/${day.path}`;
  day.read_path = `${day.path}/read`;
  day.full_read_path = `${API_HOST}${API_VERSION}/${day.read_path}`;

  return deep ? [day, _day] : day;
};

let generatePDFId = function (pdf) {
  return crypto.createHash('sha256').update(pdf['target'] + pdf['src']).digest('hex');
}

let groupPDFsByTarget = function (pdfs) {
  return pdfs.reduce(function (r, a) {
    r[a.target] = r[a.target] || [];
    r[a.target].push(a);
    return r;
  }, Object.create(null))
}

// Create languages API endpoint
let languagesAPI = async function () {
  console.log('Deploying languages API');
  let languages = [];
  for (let language of glob.sync("src/*/info.yml")) {
    languages.push(yamljs.load(fs.readFileSync(language)));
  }

  // Firebase
  await db.ref(FIREBASE_DATABASE_LANGUAGES).set(languages);
  // API
  fs.outputFileSync(`${DIST_DIR}/languages/index.json`, JSON.stringify(languages));
};

let quarterliesAPI = async function () {
  console.log('Deploying quarterlies API');
  let languages = glob.sync(`src/${compile_language}/`).map(x => x.substring(4, x.length-1));

  for (let language of languages) {
    let _quarterlies = glob.sync(`src/${language}/${compile_quarter}/`)
    let quarterlies = []

    if (target_api === 1) {
      for (let quarterly of _quarterlies) {

        if (fs.pathExistsSync(`${quarterly}/01`)) {
          quarterlies.push(quarterly)
        }
      }
    } else {
      quarterlies = _quarterlies
    }

    quarterlies = quarterlies.sort(function (a, b) {
      if (a.length === 15) a = a + "_";
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }).reverse().map(q => getQuarterlyJSON(q));

    if (!quarterlies.length) continue;

    let data = await db.ref(FIREBASE_DATABASE_QUARTERLIES).child(language).once("value");

    let existingQuarterlies = data && data.val() || [];

    for (let quarterly of quarterlies) {
      let replaced = false;
      for (let i = 0; i < existingQuarterlies.length; i++) {
        if (existingQuarterlies[i] && quarterly.index === existingQuarterlies[i].index) {
          existingQuarterlies[i] = quarterly;
          replaced = true;
        }
      }
      if (!replaced) {
        existingQuarterlies.unshift(quarterly);
      }
    }

    existingQuarterlies = existingQuarterlies.sort(function (a, b) {
      let s = a.index,
          d = b.index;

      if (s.length === 10) s += "_";
      if (d.length === 10) d += "_";

      if (s < d) return -1;
      if (s > d) return 1;

      return 0;
    }).reverse();

    // Firebase
    await db.ref(FIREBASE_DATABASE_QUARTERLIES).child(language).set(existingQuarterlies);

    // API
    fs.outputFileSync(`${DIST_DIR}/${language}/quarterlies/index.json`, JSON.stringify(existingQuarterlies));

    // Web
    fs.outputFileSync(`${WEB_DIR}/${language}/_index.md`, yamlify({
      quarterlies: existingQuarterlies.map(function (q) {
        q.path = q.path.replace(/quarterlies\//g, "");
        return convertDatesForWeb(q)
      }), type: "quarterly"
    }));
  }
};

let quarterlyAPI = async function () {
  console.log('Deploying quarterly API');
  let pdfs
  let quarterlies = glob.sync(`src/${compile_language}/${compile_quarter}/`);

  for (let quarterlyId of quarterlies) {
    if (target_api === 1) {
      if (!fs.pathExistsSync(`${quarterlyId}/01`)) {
        continue
      }
    }

    let quarterly = getQuarterlyJSON(quarterlyId),
        info = getInfoFromPath(quarterlyId),
        lessons = glob.sync(`${quarterlyId}*/`).map(x => getLessonJSON(x)),
        pdfPath = `${quarterlyId}/${SOURCE_PDF_FILE}`;

    if (fs.pathExistsSync(pdfPath)) {
      pdfs = yamljs.load(fs.readFileSync(pdfPath))
    }

    if (pdfs && !lessons.length) {
      let grouped_pdfs = groupPDFsByTarget(pdfs.pdf);

      lessons = await Promise.all(lessons.concat(Object.keys(grouped_pdfs).map(
          async function (x) {
            grouped_pdfs[x].map(
                x => {
                  x.id = generatePDFId(x)
                  x.src = `${PDF_HOST}pdf/${info.language}/${info.quarterly}/${x.id}/${x.id}.pdf`
                }
            )
            let lesson = getLessonJSON(null, grouped_pdfs[x], pdfPath)
            lesson['pdfOnly'] = true

            let lessonInfo = {lesson: lesson, days: [], pdfs: grouped_pdfs[x]}
            await db.ref(FIREBASE_DATABASE_LESSON_INFO).child(lesson.index).set(lessonInfo);
            // API
            fs.outputFileSync(`${DIST_DIR}${lesson.path}/index.json`, JSON.stringify(lessonInfo));
            return lesson
          }
      )))
    }

    // Firebase
    await db.ref(FIREBASE_DATABASE_QUARTERLY_INFO).child(quarterly.index).set({quarterly: quarterly, lessons: lessons});
    await db.ref(FIREBASE_DATABASE_LESSONS).child(`${info.language}-${info.quarterly}`).set(lessons);

    // API
    fs.outputFileSync(`${DIST_DIR}${quarterly.path}/index.json`, JSON.stringify({quarterly: quarterly,lessons: lessons}));
    fs.outputFileSync(`${DIST_DIR}${quarterly.path}/lessons/index.json`, JSON.stringify(lessons));

    // Web
    quarterly.type = "lesson";
    delete quarterly.index;
    delete quarterly.id;
    quarterly.path = quarterly.path.replace(/quarterlies\//g, "");
    quarterly.lessons = lessons.map(function (l) {
      l.path = l.path.replace(/(quarterlies|lessons)\//g, "");
      l.path_index = `${info.language}/${info.quarterly}/${l.id}/01`;
      return convertDatesForWeb(l);
    });
    fs.outputFileSync(`${WEB_DIR}${info.language}/${info.quarterly}/_index.md`, yamlify(convertDatesForWeb(quarterly)));
  }
};

let lessonAPI = async function () {
  console.log('Deploying lesson API');
  let lessons = glob.sync(`src/${compile_language}/${compile_quarter}/*/`);
  let pdfs = glob.sync(`src/${compile_language}/${compile_quarter}/${SOURCE_PDF_FILE}`).map(function (pdfPath){
    let _pdfs = yamljs.load(fs.readFileSync(pdfPath))
    return groupPDFsByTarget(_pdfs.pdf)
  });

  if (pdfs.length) {
    pdfs = Object.assign(...pdfs)
  }

  for (let lessonId of lessons) {
    let lesson = getLessonJSON(lessonId),
      info = getInfoFromPath(lessonId),
      days = glob.sync(`${lessonId}*.md`).map(x => getDayJSON(x)),
      pdf = [];

    let lessonInfo = {lesson: lesson, days: days}

    if (target_api === 2) {
      for (let pdfItem of pdfs[`${info.language}/${info.quarterly}/${info.lesson}`] || []) {
        pdfItem.id = generatePDFId(pdfItem)
        pdfItem.src = `${PDF_HOST}pdf/${info.language}/${info.quarterly}/${pdfItem.id}/${pdfItem.id}.pdf`
        if (!pdfItem.title) { pdfItem.title = lesson.title }
        if (!pdfItem.start_date) { pdfItem.start_date = lesson.start_date }
        if (!pdfItem.end_date) { pdfItem.end_date = lesson.end_date }
        pdf.push(pdfItem)
      }

      delete pdfs[`${info.language}/${info.quarterly}/${info.lesson}`]

      lessonInfo.pdfs = pdf
    }

    // Firebase
    await db.ref(FIREBASE_DATABASE_LESSON_INFO).child(lesson.index).set(lessonInfo);
    await db.ref(FIREBASE_DATABASE_DAYS).child(`${info.language}-${info.quarterly}-${info.lesson}`).set(days);

    // API
    fs.outputFileSync(`${DIST_DIR}${lesson.path}/index.json`, JSON.stringify(lessonInfo));
    fs.outputFileSync(`${DIST_DIR}${lesson.path}/days/index.json`, JSON.stringify(days));
  }
};

let dayAPI = async function () {
  console.log('Deploying day API');
  let days = glob.sync(`src/${compile_language}/${compile_quarter}/+(0|1|2|3|4|5|6|7|8|9)/*.md`);
  let dayIndex = 0
  let prevWeek = null

  for (let dayId of days) {

    let dayJSON = getDayJSON(dayId, true);
    let day = dayJSON[1],
        _day = dayJSON[0],
        info = getInfoFromPath(dayId),
        read = {},
        meta = null,
        resultRead;

    if (prevWeek !== info.lesson) {
      dayIndex = 0
    }
    dayIndex++
    prevWeek = info.lesson

    try {
      meta = JSON.parse(JSON.stringify(day.meta));
      meta.bible = [];
    } catch (e) {
      console.error('Error parsing this file: ', dayId);
    }

    let quarterlyVariant = info.quarterly.substring(info.quarterly.lastIndexOf('-') + 1);
    let iteratorArray = (BIBLE_PARSER_CONFIG[(info.language + '-' + quarterlyVariant)]) ? BIBLE_PARSER_CONFIG[(info.language + '-' + quarterlyVariant)] : BIBLE_PARSER_CONFIG[info.language];

    for (let bibleVersionIterator = 0; bibleVersionIterator < iteratorArray.length; bibleVersionIterator++) {
      let bibleVersion = iteratorArray[bibleVersionIterator],
          resultBible = {},
          language = info.language;

      resultRead = day.markdown;

      if (bibleVersion.version) {
        language = bibleVersion.lang;
        bibleVersion = bibleVersion.version;
      }

      let result = null;
      try {
        result = bibleSearchBCV.search(language, bibleVersion, resultRead);
      } catch (err) {
        result = null;
      }
      if (!result) continue;

      resultRead = result.output;

      resultBible["name"] = bibleVersion.toUpperCase();

      if (result.verses.length) {
        resultBible["verses"] = result.verses.reduce(function (result, item) {
          let key = Object.keys(item)[0];
          result[key] = item[key];
          return result;
        }, {});
        meta.bible.push(resultBible);
      }
    }

    if (meta.bible.length <= 0) {
      delete meta.bible;
    }

    read.id = info.day;
    read.date = day.meta.date;
    read.index = info.language + "-" + info.quarterly + "-" + info.lesson + "-" + info.day;
    read.title = day.meta.title;
    read.bible = meta.bible;

    if (!read.bible) {
      read.bible = [{
        "name": "",
        "verses": {}
      }]
    }

    read.content = metaMarked(resultRead, {renderer: renderer}).html;

    if (donationNotice[info.language] && (/^src\/(en|de|es)\/2020-02(-er|-cq)?\/(07|08|11|13)/img.test(dayId) || /^src\/pl\/202\d-\d{2}/img.test(dayId))) {
      read.content = donationNotice[info.language] + read.content;
      resultRead = "\n\n" + donationNotice[info.language] + "\n\n" + resultRead;
    }

    // Firebase
    await db.ref(FIREBASE_DATABASE_READ).child(read.index).set(read);

    // API
    fs.outputFileSync(`${DIST_DIR}${_day.path}/index.json`, JSON.stringify(_day));
    fs.outputFileSync(`${DIST_DIR}${_day.path}/read/index.json`, JSON.stringify(read));

    let lesson = getLessonJSON(dayId.replace(dayId.split("/").pop(), ''));

    var slugId = '';
    let dayName = DAYS_MAP.get(read.id);
    if (dayName === undefined) {
      slugId = `${String(dayIndex).padStart(2, '0')} ${read.title}`;
    } else {
      slugId = `${String(dayIndex).padStart(2, '0')} ${dayName} ${read.title}`;
    }

    meta.slug = slug(slugId);
    meta.aliases = `/${info.language}/${info.quarterly}/${info.lesson}/${info.day}`;
    meta.lesson = convertDatesForWeb(lesson);
    meta.cover = lesson.cover;

    // Web
    fs.outputFileSync(`${WEB_DIR}${info.language}/${info.quarterly}/${info.lesson}/${info.day}.md`, yamlify(convertDatesForWeb(meta)) + resultRead);
  }
};

((async function () {
  processCoverImages();
  processMiscImages();
  processFeaturesImages();
  processAssetImages();

  try {
    //await dayAPI();
    await lessonAPI();
    await quarterlyAPI();
    await quarterliesAPI();
    await languagesAPI();
  } catch (e) {
    console.error(e)
  }
})()).then(() => {
  db.goOffline();
  firebase.app().delete();
});