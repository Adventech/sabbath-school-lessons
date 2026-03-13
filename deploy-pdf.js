#!/usr/bin/env node

let firebase = require("firebase-admin"),
    glob = require("glob"),
    yamljs = require("js-yaml"),
    fs = require("fs-extra"),
    crypto = require('crypto'),
    path = require("path");

const { getCompilationQuarterValue, getInfoFromPath } = require('./deploy-helper')

let argv = require("optimist").usage("Compile & deploy pdf - DON'T USE IF YOU DON'T KNOW WHAT IT DOES\n" +
    "Usage: $0 -b [string]")
    .alias({"b": "branch"})
    .describe({
        "b": "branch",
        "l": "language",
        "q": "quarter",
        "m": "mode"
    })
    .demand(["b"])
    .argv;

let branch = argv.b,
    compile_language = argv.l || "*",
    compile_quarter = argv.q || getCompilationQuarterValue(),
    mode = argv.m || "gen";

let API_HOST = "https://sabbath-school.adventech.io/api/",
    PDF_HOST = "https://sabbath-school-pdf.adventech.io/",
    SOURCE_DIR = "src/",
    SOURCE_PDF_FILE = "pdf.yml";

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

let pdfAPI = async function (mode) {
    console.log('Deploying pdf API');

    let pdfInfoFiles = glob.sync(`${SOURCE_DIR}/${compile_language}/${compile_quarter}/${SOURCE_PDF_FILE}`);
    let curlConfig = ""

    for (let pdfInfo of pdfInfoFiles) {

        let pdfs = yamljs.load(fs.readFileSync(`${pdfInfo}`)),
            info = getInfoFromPath(pdfInfo);

        for (let [i, pdf] of pdfs.pdf.entries()) {
            if (!pdf['src']) { continue }
            if (!pdf['target']) {
                pdf['target'] = `${info.language}/${info.quarterly}/${String(i+1).padStart(2, '0')}`
            }
            pdf.id = crypto.createHash('sha256').update(pdf['target'] + pdf['src']).digest('hex');
            let extname = ".pdf"

            if (mode === "keep" && fs.pathExistsSync(`pdf/pdf/${info.language}/${info.quarterly}/${pdf.id}/${pdf.id}${extname}`)) {
                let stats = fs.statSync(`pdf/pdf/${info.language}/${info.quarterly}/${pdf.id}/${pdf.id}${extname}`);
                if (stats.size > 0) {
                    fs.outputFileSync(`pdf/pdf/${info.language}/${info.quarterly}/${pdf.id}/.keep`, "");
                }
            }

            if (mode === "gen" && !fs.pathExistsSync(`pdf/pdf/${info.language}/${info.quarterly}/${pdf.id}/`)) {
                curlConfig += `
url = "${pdf.src}"
output = "pdf/pdf/${info.language}/${info.quarterly}/${pdf.id}/${pdf.id}${extname}"
-C -
--create-dirs
-L
`
            }
        }
    }

    if (mode === "gen" && curlConfig.trim().length > 1) {
        fs.outputFileSync(`curl-config.txt`, curlConfig);
    }
};

((async function () {
    try {
        await pdfAPI(mode);
    } catch (e) {
        console.error(e)
    }
})()).then(() => {
    db.goOffline();
    firebase.app().delete();
});