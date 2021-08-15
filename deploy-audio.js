#!/usr/bin/env node

let firebase = require("firebase-admin"),
    glob = require("glob"),
    yamljs = require("yamljs"),
    fs = require("fs-extra"),
    crypto = require('crypto'),
    url = require("url"),
    path = require("path");

const { getCompilationQuarterValue, getInfoFromPath } = require('./deploy-helper')

console.log(getCompilationQuarterValue())

let argv = require("optimist").usage("Compile & deploy audio - DON'T USE IF YOU DON'T KNOW WHAT IT DOES\n" +
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
    mode = argv.m || "sync";

let API_HOST = "https://sabbath-school.adventech.io/api/",
    API_VERSION = "v1",
    SOURCE_DIR = "src/",
    SOURCE_AUDIO_FILE = "audio.yml",
    SOURCE_COVER_FILE = "cover.png",
    DIST_DIR = "dist/api/" + API_VERSION + "/";

let db
if (branch.toLowerCase() === "master") {
    API_HOST = "https://sabbath-school.adventech.io/api/";
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

let audioAPI = async function (mode) {
    const allowedAudioItemKeys = ['title', 'src', 'image', 'imageRatio', 'target']
    console.log('Deploying audio API');

    let audios = glob.sync(`${SOURCE_DIR}/${compile_language}/${compile_quarter}/${SOURCE_AUDIO_FILE}`);
    let audioInfo = {}

    let curlConfig = ""

    for (let audio of audios) {

        let audioSource = yamljs.load(`${audio}`),
            info = getInfoFromPath(audio);

        audioInfo.cover = `${API_HOST}${API_VERSION}/${info.language}/quarterlies/${info.quarterly}/${SOURCE_COVER_FILE}`
        audioInfo.audio = []

        for (let artist of audioSource.audio) {
            for (let track of artist.tracks) {
                let audioItem = {
                    artist: artist.artist
                }
                if (!track['target'] || !track['src']) { continue }

                audioItem.id = crypto.createHash('sha256').update(artist.artist + track['target'] + track['src']).digest('hex');

                for (let k of Object.keys(track)) {
                    if (allowedAudioItemKeys.indexOf(k) >= 0) {
                        audioItem[k] = track[k]
                    }
                }

                // TODO: Generate title if doesnt exist

                audioInfo.audio.push(audioItem)

                let extname = path.extname(audioItem.src)

                if (!extname.length || extname.length <= 1) {
                    extname = ".mp3"
                }

                if (mode === "keep" && fs.pathExistsSync(`audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}`)) {
                    let stats = fs.statSync(`audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}`);
                    if (stats.size > 0) {
                        fs.outputFileSync(`audio/${info.language}/${info.quarterly}/${audioItem.id}/.keep`, "");
                    }
                }

                if (mode === "gen" && !fs.pathExistsSync(`audio/${info.language}/${info.quarterly}/${audioItem.id}/`)) {
                    curlConfig += `
url = "${track.src}"
output = "audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}"
-C -
--create-dirs
-L
`
                }
            }
        }

        if (mode === "sync") {
            // TODO: firebase upload
            if (audioInfo.audio.length) {
                fs.outputFileSync(`${DIST_DIR}${info.language}/quarterlies/${info.quarterly}/audio.json`, JSON.stringify(audioInfo));
            }
        }
    }

    if (mode === "gen" && curlConfig.trim().length > 1) {
        fs.outputFileSync(`curl-config.txt`, curlConfig);
    }
};

((async function () {
    try {
        await audioAPI(mode);
    } catch (e) {
        console.error(e)
    }
})()).then(() => {
    db.goOffline();
    firebase.app().delete();
});