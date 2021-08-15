#!/usr/bin/env node

let firebase = require("firebase-admin"),
    glob = require("glob"),
    yamljs = require("yamljs"),
    fs = require("fs-extra"),
    crypto = require('crypto'),
    metaMarked = require("meta-marked"),
    path = require("path");

const { getCompilationQuarterValue, getInfoFromPath } = require('./deploy-helper')

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
    MEDIA_HOST = "https://sabbath-school-media.adventech.io/",
    API_VERSION = "v1",
    SOURCE_DIR = "src/",
    SOURCE_AUDIO_FILE = "audio.yml",
    SOURCE_COVER_FILE = "cover.png",
    DIST_DIR = "dist/api/" + API_VERSION + "/",
    FIREBASE_DATABASE_AUDIO = "/api/" + API_VERSION + "/audio";

let db
if (branch.toLowerCase() === "master") {
    API_HOST = "https://sabbath-school.adventech.io/api/";
    MEDIA_HOST = "https://sabbath-school-media.adventech.io/";
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
    MEDIA_HOST = "https://sabbath-school-media-stage.adventech.io/";
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
    let audioInfo = []

    let curlConfig = ""

    for (let audio of audios) {

        let audioSource = yamljs.load(`${audio}`),
            info = getInfoFromPath(audio);

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

                let extname = path.extname(audioItem.src)

                if (!extname.length || extname.length <= 1) {
                    extname = ".mp3"
                }

                audioItem.src = `${MEDIA_HOST}audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}`

                audioItem.targetIndex = audioItem.target.replace(/\//g, '-')

                if (!audioItem.image) {
                    if (artist.image && !/^http/.test(artist.image.trim())) {
                        artist.image = `${API_HOST}${API_VERSION}/images/${artist.image}`
                    }
                    audioItem.image = artist.image || `${API_HOST}${API_VERSION}/${info.language}/quarterlies/${info.quarterly}/${SOURCE_COVER_FILE}`
                }

                if (!audioItem.imageRatio) {
                    audioItem.imageRatio = artist.imageRatio || "portrait"
                }

                if (!audioItem.title) {
                    let audioItemInfo = getInfoFromPath(`src/${audioItem.target}`)
                    if (!audioItemInfo.lesson) {
                        continue
                    }

                    if (audioItemInfo.day) {
                        let read = metaMarked(fs.readFileSync(`${SOURCE_DIR}${audioItemInfo.language}/${audioItemInfo.quarterly}/${audioItemInfo.lesson}/${audioItemInfo.day}.md`, "utf-8"))
                        audioItem.title = read.meta.title
                    } else {
                        let lesson = yamljs.load(`${SOURCE_DIR}${audioItemInfo.language}/${audioItemInfo.quarterly}/${audioItemInfo.lesson}/info.yml`)
                        audioItem.title = lesson.title
                    }
                }

                audioInfo.push(audioItem)

                if (mode === "keep" && fs.pathExistsSync(`audio/audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}`)) {
                    let stats = fs.statSync(`audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}`);
                    if (stats.size > 0) {
                        fs.outputFileSync(`audio/${info.language}/${info.quarterly}/${audioItem.id}/.keep`, "");
                    }
                }

                if (mode === "gen" && !fs.pathExistsSync(`audio/audio/${info.language}/${info.quarterly}/${audioItem.id}/`)) {
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
            await db.ref(FIREBASE_DATABASE_AUDIO).child(`${info.language}-${info.quarterly}`).set(audioInfo);

            if (audioInfo.length) {
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