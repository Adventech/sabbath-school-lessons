#!/usr/bin/env node

let firebase = require("firebase-admin"),
    glob = require("glob"),
    yamljs = require("js-yaml"),
    fs = require("fs-extra"),
    crypto = require('crypto'),
    metaMarked = require("meta-marked"),
    path = require("path"),
    moment = require("moment");

const { getCompilationQuarterValue, getInfoFromPath } = require('./deploy-helper')

let argv = require("optimist").usage("Compile & deploy video - DON'T USE IF YOU DON'T KNOW WHAT IT DOES\n" +
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
    compile_quarter = argv.q || getCompilationQuarterValue(null, null, true),
    mode = argv.m || "sync";

let API_HOST = "https://sabbath-school.adventech.io/api/",
    MEDIA_HOST = "https://sabbath-school-media.adventech.io/",
    API_VERSION = "v1",
    API_VERSION_2 = "v2",
    SOURCE_DIR = "src/",
    SOURCE_VIDEO_FILE = "video.yml",
    SOURCE_COVER_FILE = "cover.png",
    DIST_DIR = "dist/api/" + API_VERSION + "/",
    DIST_DIR_V2 = "dist/api/" + API_VERSION_2 + "/",
    FIREBASE_DATABASE_VIDEO = "/api/" + API_VERSION + "/video",
    FIREBASE_DATABASE_VIDEO_V2 = "/api/" + API_VERSION_2 + "/video";

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

let videoAPI = async function (mode) {
    const allowedVideoItemKeys = ['title', 'src', 'thumbnail', 'target', 'duration']
    console.log('Deploying video API');

    let videoLanguages = glob.sync(`${SOURCE_DIR}/${compile_language}`)

    let availableLanguages = []
    let curlConfig = []

    for (let videoLanguage of videoLanguages) {
        let languageVideos = []
        let videos = glob.sync(`${videoLanguage}/${compile_quarter}/${SOURCE_VIDEO_FILE}`);

        if (fs.pathExistsSync(`${videoLanguage}/groups.yml`)) {
            let groups = yamljs.load(fs.readFileSync(`${videoLanguage}/groups.yml`))
            videos = videos.sort(function (a, b) {
                let quarterlyTypeA = a.replace(`${videoLanguage}/`, '').replace(/\d{4}-\d{2}-?/g, '').replace('/video.yml', '').trim() || 'default'
                let quarterlyTypeB = b.replace(`${videoLanguage}/`, '').replace(/\d{4}-\d{2}-?/g, '').replace('/video.yml', '').trim() || 'default'

                if (!groups[quarterlyTypeA] || !groups[quarterlyTypeB] || !groups[quarterlyTypeA].order || !groups[quarterlyTypeB].order) {
                    return 0
                }

                if (groups[quarterlyTypeA].order > groups[quarterlyTypeB].order) return 1;
                if (groups[quarterlyTypeA].order < groups[quarterlyTypeB].order) return -1;
                return 0;
            })
        } else {
            videos = videos.sort(function (a, b) {
                if (a.length === 15) a = a + "_";
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
            }).reverse()
        }

        let languageInfo = getInfoFromPath(videoLanguage)

        for (let video of videos) {
            let videoAPIJson = []
            let videoSource = yamljs.load(fs.readFileSync(`${video}`)),
                info = getInfoFromPath(video);

            for (let artist of videoSource.video) {
                if (artist.skip) {
                    continue;
                }
                let videoInfo = {
                    artist: artist.artist,
                    clips: []
                }

                if (artist.thumbnail) {
                    videoInfo.thumbnail = artist.thumbnail
                }

                for (let [i, clip] of artist.clips.entries()) {
                    if (!clip['src']) { continue }

                    if (!clip['target']) {
                        clip['target'] = `${info.language}/${info.quarterly}/${String(i+1).padStart(2, '0')}`
                    }

                    let videoItem = {
                        artist: videoInfo.artist
                    }

                    videoItem.id = crypto.createHash('sha256').update(artist.artist + clip['target'] + clip['src']).digest('hex');

                    for (let k of Object.keys(clip)) {
                        if (allowedVideoItemKeys.indexOf(k) >= 0) {
                            videoItem[k] = clip[k]
                        }
                    }

                    let extname = path.extname(videoItem.src)

                    if (!extname.length || extname.length <= 1 || extname.length > 4 || !/^\./.test(extname)) {
                        extname = ".mp4"
                    }

                    videoItem.src = `${MEDIA_HOST}video/${info.language}/${info.quarterly}/${videoItem.id}/${videoItem.id}${extname}`

                    videoItem.targetIndex = videoItem.target.replace(/\//g, '-')

                    if (!videoItem.thumbnail) {
                        if (artist.thumbnail && !/^http/.test(artist.thumbnail.trim())) {
                            artist.thumbnail = `${API_HOST}${API_VERSION}/images/${artist.thumbnail}`
                        }
                        videoItem.thumbnail = artist.thumbnail || `${API_HOST}${API_VERSION}/${info.language}/quarterlies/${info.quarterly}/${SOURCE_COVER_FILE}`
                    }

                    let thumbnailSrc = videoItem.thumbnail

                    let thumbExtname = path.extname(videoItem.thumbnail)

                    if (!thumbExtname.length || thumbExtname.length <= 1 || thumbExtname.length > 5 || !/^\./.test(thumbExtname)) {
                        thumbExtname = ".png"
                    }

                    videoItem.thumbnail = `${MEDIA_HOST}video/${info.language}/${info.quarterly}/${videoItem.id}/thumb/${videoItem.id}${thumbExtname}`


                    delete videoInfo.thumbnail

                    if (videoItem.duration) {
                        if (typeof videoItem.duration === 'number') {
                            videoItem.duration = moment("2015-01-01").startOf('day').seconds(videoItem.duration).format("H:mm:ss").replace(/^[0:]+(?=\d[\d:]{3})/, '');
                        }
                    }

                    if (!videoItem.title) {
                        let videoItemInfo = getInfoFromPath(`src/${videoItem.target}`)
                        if (!videoItemInfo.lesson) {
                            continue
                        }

                        if (videoItemInfo.day) {
                            let read = metaMarked(fs.readFileSync(`${SOURCE_DIR}${videoItemInfo.language}/${videoItemInfo.quarterly}/${videoItemInfo.lesson}/${videoItemInfo.day}.md`, "utf-8"))
                            videoItem.title = read.meta.title
                        } else {
                            if (fs.pathExistsSync(`${SOURCE_DIR}${videoItemInfo.language}/${videoItemInfo.quarterly}/${videoItemInfo.lesson}/info.yml`)) {
                                let lesson = yamljs.load(fs.readFileSync(`${SOURCE_DIR}${videoItemInfo.language}/${videoItemInfo.quarterly}/${videoItemInfo.lesson}/info.yml`))
                                videoItem.title = lesson.title
                            } else if (fs.pathExistsSync(`${SOURCE_DIR}${videoItemInfo.language}/${videoItemInfo.quarterly}/pdf.yml`)) {
                                let pdfLesson = yamljs.load(fs.readFileSync(`${SOURCE_DIR}${videoItemInfo.language}/${videoItemInfo.quarterly}/pdf.yml`))
                                let pdfLessonItem = pdfLesson.pdf.find((e) => e.target === `${videoItem.target}`)
                                if (!pdfLessonItem) {
                                    console.error('Can not determine the lesson title from PDF')
                                } else {
                                    videoItem.title = pdfLessonItem.title
                                }
                            } else {
                                console.error('Can not determine the lesson title')
                                return
                            }
                        }
                    }

                    videoInfo.clips.push(videoItem)

                    if (mode === "keep" && fs.pathExistsSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/${videoItem.id}${extname}`)) {
                        let stats = fs.statSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/${videoItem.id}${extname}`);
                        if (stats.size > 0) {
                            fs.outputFileSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/.keep`, "");
                        }
                    }

                    if (mode === "keep" && fs.pathExistsSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/thumb/${videoItem.id}${thumbExtname}`)) {
                        let stats = fs.statSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/thumb/${videoItem.id}${thumbExtname}`);
                        if (stats.size > 0) {
                            fs.outputFileSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/thumb/.keep`, "");
                        }
                    }

                    if (mode === "gen") {
                        if (!fs.pathExistsSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/`)) {
                            curlConfig.push(`
url = "${clip.src}"
output = "video/video/${info.language}/${info.quarterly}/${videoItem.id}/${videoItem.id}${extname}"
-C -
--create-dirs
--globoff
--insecure
-L
`)
                        }
                        if (!fs.pathExistsSync(`video/video/${info.language}/${info.quarterly}/${videoItem.id}/thumb/`)) {
                            curlConfig.push(`
url = "${thumbnailSrc}"
output = "video/video/${info.language}/${info.quarterly}/${videoItem.id}/thumb/${videoItem.id}${thumbExtname}"
-C -
--create-dirs
--globoff
--insecure
-L
`)
                        }
                    }
                }

                if (videoInfo.clips.length) {
                    videoInfo.clips = videoInfo.clips.sort(function(a, b){
                        if (a.targetIndex < b.targetIndex) {
                            return a.targetIndex.length < b.targetIndex.length ? -1 : 1;
                        }

                        if (a.targetIndex > b.targetIndex) {
                            return a.targetIndex.length > b.targetIndex.length ? 1 : -1;
                        }
                        return 0;
                    })

                    videoAPIJson.push(videoInfo)

                    let languageVideoArtist = languageVideos.find(a => a.artist === videoInfo.artist)

                    let languageVideoArtistMatch = languageVideos.find(a => {
                        let r = a.clips[0].target.replace(`${info.language}/`, '').replace(/\d{4}-\d{2}-?/, '').replace(/\/(\d*)$/, '').trim() || 'adult'
                        let b = videoInfo.clips[0].target.replace(`${info.language}/`, '').replace(/\d{4}-\d{2}-?/, '').replace(/\/(\d*)$/, '').trim() || 'adult'

                        return r === b && a.artist === videoInfo.artist
                    })

                    // TODO: ugly way for now, but perhaps the flag in the language config can be used in the future
                    if (!(info.language === "en" && /\d{4}-\d{2}-er/.test(info.quarterly))) {
                        if (languageVideoArtist && languageVideoArtistMatch) {
                            languageVideoArtist.clips = videoInfo.clips.concat(languageVideoArtist.clips)
                        } else {
                            languageVideos.push(videoInfo)
                        }
                    }
                }
            }



            if (mode === "sync") {
                await db.ref(FIREBASE_DATABASE_VIDEO).child(`${info.language}-${info.quarterly}`).set(videoAPIJson);
                await db.ref(FIREBASE_DATABASE_VIDEO_V2).child(`${info.language}-${info.quarterly}`).set(videoAPIJson);

                if (videoAPIJson.length) {
                    fs.outputFileSync(`${DIST_DIR}${info.language}/quarterlies/${info.quarterly}/video.json`, JSON.stringify(videoAPIJson));
                    fs.outputFileSync(`${DIST_DIR_V2}${info.language}/quarterlies/${info.quarterly}/video.json`, JSON.stringify(videoAPIJson));
                }
            }
        }

        if (languageVideos.length) {
            for (let languageVideo of languageVideos) {
                languageVideo.clips = languageVideo.clips.slice(0, 14)
            }
            availableLanguages.push(languageInfo.language)
            fs.outputFileSync(`${DIST_DIR_V2}${languageInfo.language}/video/latest.json`, JSON.stringify(languageVideos));
        }
    }

    if (mode === "gen" && curlConfig.length >= 1) {
        const chunkSize = 10
        let iterator = 0
        for (let i = 0; i < curlConfig.length; i+=chunkSize) {
            const chunk = curlConfig.slice(i, i+chunkSize)
            fs.outputFileSync(`curl-config-${iterator}.txt`, chunk.join("\n\n"))
            iterator++
        }
    }

    if (availableLanguages.length) {
        fs.outputFileSync(`${DIST_DIR_V2}/video/languages.json`, JSON.stringify(availableLanguages));
    }
};

((async function () {
    try {
        await videoAPI(mode);
    } catch (e) {
        console.error(e)
    }
})()).then(() => {
    db.goOffline();
    firebase.app().delete();
});