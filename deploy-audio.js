#!/usr/bin/env node

let firebase = require("firebase-admin"),
    glob = require("glob"),
    yamljs = require("js-yaml"),
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
    API_VERSION_2 = "v2",
    SOURCE_DIR = "src/",
    SOURCE_AUDIO_FILE = "audio.yml",
    SOURCE_COVER_FILE = "cover.png",
    DIST_DIR = "dist/api/" + API_VERSION + "/",
    DIST_DIR_V2 = "dist/api/" + API_VERSION_2 + "/",
    FIREBASE_DATABASE_AUDIO = "/api/" + API_VERSION + "/audio",
    FIREBASE_DATABASE_AUDIO_V2 = "/api/" + API_VERSION_2 + "/audio";

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


    let curlConfig = ""

    for (let audio of audios) {
        let audioInfo = []
        let audioSource = yamljs.load(fs.readFileSync(`${audio}`)),
            info = getInfoFromPath(audio);

        for (let artist of audioSource.audio) {
            let weekIterator = 1;
            for (let [i, track] of artist.tracks.entries()) {
                let audioItem = {
                    artist: artist.artist
                }
                if (!track['src'] || (!track['target'] && !artist['target'])) { continue }

                if (!track['target']) {
                    if (artist['target'] === 'daily') {
                        track['target'] = `${info.language}/${info.quarterly}/${String(weekIterator).padStart(2, '0')}/${String(i+1 - ((weekIterator-1) * 7)).padStart(2, '0')}`
                    } else {
                        track['target'] = `${info.language}/${info.quarterly}/${String(i+1).padStart(2, '0')}`
                    }
                    if ((i+1) % 7 === 0) {
                        weekIterator++;
                    }
                }

                audioItem.id = crypto.createHash('sha256').update(artist.artist + track['target'] + track['src']).digest('hex');

                for (let k of Object.keys(track)) {
                    if (allowedAudioItemKeys.indexOf(k) >= 0) {
                        audioItem[k] = track[k]
                    }
                }

                let extname = path.extname(audioItem.src)

                if (!extname.length || extname.length <= 1 || extname.length > 4 || !/^\./.test(extname)) {
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
                        let lesson = yamljs.load(fs.readFileSync(`${SOURCE_DIR}${audioItemInfo.language}/${audioItemInfo.quarterly}/${audioItemInfo.lesson}/info.yml`))
                        audioItem.title = lesson.title
                    }
                }

                audioInfo.push(audioItem)

                if (mode === "keep" && fs.pathExistsSync(`audio/audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}`)) {
                    let stats = fs.statSync(`audio/audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}`);
                    if (stats.size > 0) {
                        fs.outputFileSync(`audio/audio/${info.language}/${info.quarterly}/${audioItem.id}/.keep`, "");
                    }
                }

                if (mode === "gen" && !fs.pathExistsSync(`audio/audio/${info.language}/${info.quarterly}/${audioItem.id}/`)) {
                    curlConfig += `
url = "${track.src.replace(/ /g, "\%20")}"
output = "audio/audio/${info.language}/${info.quarterly}/${audioItem.id}/${audioItem.id}${extname}"
-C -
--create-dirs
-L
`
                }
            }
        }

        audioInfo = audioInfo.sort(function(a, b){
            if (a.targetIndex < b.targetIndex) {
                return (a.targetIndex.length < b.targetIndex.length) && a.targetIndex.length === 13 ? 1 : -1;
            }

            if (a.targetIndex > b.targetIndex) {
                return (a.targetIndex.length > b.targetIndex.length) && a.targetIndex.length === 13 ? -1 : 1;
            }
            return 0;
        })

        if (mode === "sync") {
            await db.ref(FIREBASE_DATABASE_AUDIO).child(`${info.language}-${info.quarterly}`).set(audioInfo);
            await db.ref(FIREBASE_DATABASE_AUDIO_V2).child(`${info.language}-${info.quarterly}`).set(audioInfo);

            if (audioInfo.length) {
                fs.outputFileSync(`${DIST_DIR}${info.language}/quarterlies/${info.quarterly}/audio.json`, JSON.stringify(audioInfo));
                fs.outputFileSync(`${DIST_DIR_V2}${info.language}/quarterlies/${info.quarterly}/audio.json`, JSON.stringify(audioInfo));
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