const { getCompilationQuarterValue, getInfoFromPath } = require('../../deploy-helper')

let yamljs  = require("js-yaml"),
    glob    = require("glob"),
    axios   = require("axios"),
    moment  = require("moment"),
    fs      = require("fs-extra");

const DATE_FORMAT = "DD/MM/YYYY"

let weeklyVideo = async function (lang, title, template, srcFunc, postFix) {
    let postfix = (!postFix) ? "" : `-${postFix}`
    let priorCheck = 1
    let postCheck = 2
    let targetQuarterlies = glob.sync(`src/${lang}/${getCompilationQuarterValue(null, true)}${postfix}/`);

    for (let targetQuarter of targetQuarterlies) {
        let quarterlyInfo = getInfoFromPath(targetQuarter)
        let process = async function (date) {
            try {
                let targetDate = date || moment()
                let infoSource = yamljs.load(fs.readFileSync(`${targetQuarter}/info.yml`), 'utf-8')
                let startDate = moment(infoSource.start_date, DATE_FORMAT)
                let endDate = moment(infoSource.end_date, DATE_FORMAT)

                if (!targetDate.isBetween(startDate, endDate)) {
                    return;
                }

                console.log(`Checking ${title} for ${targetDate.format(DATE_FORMAT)}`)

                let videoSource = yamljs.load(fs.readFileSync(`${targetQuarter}/video.yml`), 'utf-8')

                let diff = targetDate.diff(startDate, 'days') + 7
                let week = Math.floor(diff / 7)
                let year = moment(targetDate).year()

                let video = videoSource.video.find(e => e.artist === template.artist)

                if (!video) {
                    console.log(`Looks like a brand new ${title} video section`)
                    video = JSON.parse(JSON.stringify(template))
                    videoSource.video.push(video)
                }

                let srcFuncRet = srcFunc(targetDate, quarterlyInfo.quarterly.slice(0, 7), year, week)
                let src, thumbnail

                if (Array.isArray(srcFuncRet)) {
                    src = srcFuncRet[0]
                    thumbnail = srcFuncRet[1]
                } else {
                    src = srcFuncRet
                }

                let clip = video.clips.find(e =>
                    e.target === `${quarterlyInfo.language}/${quarterlyInfo.quarterly}/${String(week).padStart(2, '0')}`
                    || e.src === src
                )

                if (clip) {
                    console.log(`${title} for ${targetDate.format(DATE_FORMAT)} already exists.`)
                    return
                }

                let response = await axios.head(src);

                if (response.status === 200 &&
                    response.headers['content-type'].indexOf('video/') >= 0
                    || response.headers['content-type'].indexOf('application/mp4') >= 0)
                {
                    console.log(`Found ${title} for ${targetDate.format(DATE_FORMAT)}. Will commit`)
                    let newClip = {
                        src: src,
                        target: `${quarterlyInfo.language}/${quarterlyInfo.quarterly}/${String(week).padStart(2, '0')}`
                    }

                    if (!video.thumbnail) {
                        newClip.thumbnail = thumbnail ? thumbnail : src.replace(/\.mp4$/, '.webp')
                    }

                    video.clips.push(newClip)

                    fs.outputFileSync(`${targetQuarter}/video.yml`,
                        yamljs.dump(videoSource, {
                            lineWidth: -1
                        }).replace(/^(?!$)/mg, '  ').replace(/^/, '---\n')
                    );
                }
            } catch (e) {
                if (e && e.response && e.response.status === 404) {
                    console.log(`${title} file is not found`)
                }
            }
        }

        for (let i = priorCheck || 0; i >= 0; i--) {
            await process(moment().add(-1*i, 'w'))
        }

        await process()

        for (let i = 1; i <= postCheck; i++) {
            await process(moment().add(i, 'w'))
        }
    }
}

let englishVideo = async function () {
    await weeklyVideo(
        "en",
        "Hope Sabbath School",
        {
            artist: "Hope Sabbath School",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/en/hopess/en-hopess-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "en",
        "Hope Lives 365",
        {
            artist: "Hope Lives 365",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/en/365/365-en-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "en",
        "Hope Lives 365",
        {
            artist: "Hope Lives 365",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/en/365/365-en-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "er"
    )

    await weeklyVideo(
        "en",
        "Hope Sabbath School",
        {
            artist: "Hope Sabbath School",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/en/hopess/en-hopess-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "er"
    )

    await weeklyVideo(
        "en",
        "It Is Written",
        {
            artist: "It Is Written",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/iiw/iiw-en-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "en",
        "It Is Written",
        {
            artist: "It Is Written",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/iiw/iiw-en-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "er"
    )

    await weeklyVideo(
        "en",
        "Amazing Facts Study Hour",
        {
            artist: "Amazing Facts Study Hour",
            thumbnail: "https://manna.amazingfacts.org/amazingfacts/website/medialibrary/images/collections/Sabbath-school-study-hour-large.jpg",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/en/af/en-af-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "en",
        "Amazing Facts Study Hour",
        {
            artist: "Amazing Facts Study Hour",
            thumbnail: "https://manna.amazingfacts.org/amazingfacts/website/medialibrary/images/collections/Sabbath-school-study-hour-large.jpg",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/en/af/en-af-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "er"
    )

    await weeklyVideo(
        "en",
        "Sabbath School Talking Points",
        {
            artist: "Sabbath School Talking Points",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/tp/tp-en-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "en",
        "Sabbath School Talking Points",
        {
            artist: "Sabbath School Talking Points",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/tp/tp-en-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "er"
    )

    await weeklyVideo(
        "en",
        "InVerse Bible",
        {
            artist: "InVerse Bible",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/inv/en-${targetQuarter}-inv-${String(week).padStart(2, '0')}.mp4`
        },
        "cq"
    )


    await weeklyVideo(
        "en",
        "Gracelink",
        {
            artist: "Gracelink",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            let r = `https://sabbath-school-media-tmp.s3.amazonaws.com/en/kd/en-kd-${targetQuarter}-${String(week).padStart(2, '0')}`
            return [`${r}.mp4`, `${r}.jpg`]
        },
        "kd"
    )

    await weeklyVideo(
        "en",
        "Gracelink",
        {
            artist: "Gracelink",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            let r = `https://sabbath-school-media-tmp.s3.amazonaws.com/en/pr/en-pr-${targetQuarter}-${String(week).padStart(2, '0')}`
            return [`${r}.mp4`, `${r}.jpg`]
        },
        "pr"
    )

    await weeklyVideo(
        "en",
        "Gracelink",
        {
            artist: "Gracelink",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            let r = `https://sabbath-school-media-tmp.s3.amazonaws.com/en/cc/en-cc-${targetQuarter}-${String(week).padStart(2, '0')}`
            return [`${r}.mp4`, `${r}.jpg`]
        },
        "cc"
    )
}

let spanishVideo = async function () {
    await weeklyVideo(
        "es",
        "Escuela Sabática Viva",
        {
            artist: "Escuela Sabática Viva",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/es/viva/es-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "es",
        "Escrito Está",
        {
            artist: "Escrito Está",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/es/ee/es-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "es",
        "Pastor Alejandro Bullon",
        {
            artist: "Pastor Alejandro Bullon",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/es/bul/es-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "es",
        "Juventud Adventista de España",
        {
            artist: "Juventud Adventista de España",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/es/inv/es-${targetQuarter}-inv-${String(week).padStart(2, '0')}.mp4`
        },
        "cq"
    )
}

let russianVideo = async function () {
    await weeklyVideo(
        "ru",
        "Субботняя школа из ЗАУ",
        {
            artist: "Субботняя школа из ЗАУ",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ru/zau/ru-zau-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "ru",
        "Александр Болотников",
        {
            artist: "Александр Болотников",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ru/bol/ru-bol-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "ru",
        "Изучаем Библию с Виталием Олийником",
        {
            artist: "Изучаем Библию с Виталием Олийником",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ru/cdp/ru-cdp-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "ru",
        "Субботняя школа с Алехандро Буйоном",
        {
            artist: "Субботняя школа с Алехандро Буйоном",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ru/bul/ru-bul-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let ukrainianVideo = async function () {
    await weeklyVideo(
        "uk",
        "В контексті",
        {
            artist: "В контексті",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/uk/uk-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let portugueseVideo = async function () {
    await weeklyVideo(
        "pt",
        "Adventistas Paulista Leste",
        {
            artist: "Adventistas Paulista Leste",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pt/apl/pt-apl-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "pt",
        "Adventismo Vivo",
        {
            artist: "Adventismo Vivo",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pt/vivo/pt-vivo-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "pt",
        "Adventistas Lago Sul",
        {
            artist: "Adventistas Lago Sul",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pt/lago/pt-lago-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "pt",
        "Bíblia Aberta",
        {
            artist: "Bíblia Aberta",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pt/portugal/ba/pt-ba-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "pt"
    )

    await weeklyVideo(
        "pt",
        "NoComTexto Podcast",
        {
            artist: "NoComTexto Podcast",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pt/inv/pt-inv-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "cq"
    )

    await weeklyVideo(
        "pt",
        "Adventismo Vivo",
        {
            artist: "Adventismo Vivo",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pt/vivo/pt-vivo-inv-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "cq"
    )
}

let romanianVideo = async function () {
    await weeklyVideo(
        "ro",
        "Scoala de Sabat Video",
        {
            artist: "Scoala de Sabat Video",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ro/ro-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let chineseVideo = async function () {
    await weeklyVideo(
        "zh",
        "希望中文台 (普通話版視頻)",
        {
            artist: "希望中文台 (普通話版視頻)",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/zh/hopetv/zh-hopetv-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "zh",
        "希望中文台 (普通話版視頻)",
        {
            artist: "希望中文台 (普通話版視頻)",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/zh/hopetv/zh-hopetv-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "hant"
    )

    await weeklyVideo(
        "zh",
        "希望中文台 (粵語版視頻)",
        {
            artist: "希望中文台 (粵語版視頻)",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/zh/cant/zh-cant-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "hant"
    )

    await weeklyVideo(
        "zh",
        "希望中文台 (粵語版視頻)",
        {
            artist: "希望中文台 (粵語版視頻)",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/zh/cant/zh-cant-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let czechVideo = async function () {
    await weeklyVideo(
        "cs",
        "Bible pro dnešek",
        {
            artist: "Bible pro dnešek",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/cs/cs-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "sk",
        "Bible pro dnešek",
        {
            artist: "Bible pro dnešek",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/cs/cs-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let indonesianVideo = async function () {
    await weeklyVideo(
        "in",
        "Diskusi Sekolah Sabat",
        {
            artist: "Diskusi Sekolah Sabat",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/in/hope/in-hope-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "in",
        "Amazing Facts Indonesia",
        {
            artist: "Amazing Facts Indonesia",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/in/af/in-af-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let italianVideo = async function () {
    await weeklyVideo(
        "it",
        "Scoala de Sabat Video",
        {
            artist: "Scoala de Sabat Video",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/it/it-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let hungarianVideo = async function () {
    await weeklyVideo(
        "hu",
        "Bibliatanulmányok minden napra",
        {
            artist: "Bibliatanulmányok minden napra",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/hu/hope/hu-hope-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let frenchVideo = async function () {
    await weeklyVideo(
        "fr",
        "Églises Adventistes du Nord de la France",
        {
            artist: "Églises Adventistes du Nord de la France",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/ffn/fr-ffn-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "fr",
        "Églises Adventistes du Nord de la France",
        {
            artist: "Églises Adventistes du Nord de la France",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/ffn/fr-ffn-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "iad"
    )

    await weeklyVideo(
        "fr",
        "Espoir Médias",
        {
            artist: "Espoir Médias",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/em/fr-em-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "fr",
        "Espoir Médias",
        {
            artist: "Espoir Médias",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/em/fr-em-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "iad"
    )

    await weeklyVideo(
        "fr",
        "An Ti Kozé",
        {
            artist: "An Ti Kozé",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/hope/fr-hope-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "fr",
        "An Ti Kozé",
        {
            artist: "An Ti Kozé",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/hope/fr-hope-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "iad"
    )

    await weeklyVideo(
        "fr",
        "Autrement Dit",
        {
            artist: "Autrement Dit",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/esj/fr-esj-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "fr",
        "Autrement Dit",
        {
            artist: "Autrement Dit",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/esj/fr-esj-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "iad"
    )

    await weeklyVideo(
        "fr",
        "Coffre aux Idees",
        {
            artist: "Coffre aux Idees",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/fr/inv/fr-inv-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        },
        "cq"
    )
}

let germanVideo = async function () {
    await weeklyVideo(
        "de",
        "Joel Media",
        {
            artist: "Joel Media",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/de/jm/de-jm-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "de",
        "Adventgemeinde Fürstenfeld",
        {
            artist: "Adventgemeinde Fürstenfeld",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/de/af/de-af-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "de",
        "Seminar Schloss Bogenhofen",
        {
            artist: "Seminar Schloss Bogenhofen",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/de/ssb/de-ssb-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let tagalogVideo = async function () {
    await weeklyVideo(
        "tl",
        "Oras ng Pag-aaral",
        {
            artist: "Oras ng Pag-aaral",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/tl/hope/tl-hope-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "tl",
        "Solid Rock Ministries",
        {
            artist: "Solid Rock Ministries",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/tl/srm/tl-srm-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let ilocanoVideo = async function () {
    await weeklyVideo(
        "ilo",
        "Pastor Elias Rafanan",
        {
            artist: "Pastor Elias Rafanan",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ilo/ilo-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let afrikaansVideo = async function () {
    await weeklyVideo(
        "af",
        "Insig",
        {
            artist: "Insig",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/af/insig/af-insig-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "af",
        "Woord in Diepte",
        {
            artist: "Woord in Diepte",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/af/hb/af-hb-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let japaneseVideo = async function () {
    await weeklyVideo(
        "ja",
        "Hope Channel Japan",
        {
            artist: "Hope Channel Japan",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ja/hope/ja-hope-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "ja",
        "横浜キリスト教会",
        {
            artist: "横浜キリスト教会",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ja/yok/ja-yok-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let malayalamVideo = async function () {
    await weeklyVideo(
        "ml",
        "Eden TV",
        {
            artist: "Eden TV",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ml/ml-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let tamilVideo = async function () {
    await weeklyVideo(
        "ta",
        "Hope Channel Tamil",
        {
            artist: "Hope Channel Tamil",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ta/ta-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let polishVideo = async function () {
    await weeklyVideo(
        "pl",
        "Głos Nadziei",
        {
            artist: "Głos Nadziei",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pl/pl-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let koreanVideo = async function () {
    await weeklyVideo(
        "ko",
        "ABN 재림방송",
        {
            artist: "ABN 재림방송",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ko/abn/ko-abn-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )

    await weeklyVideo(
        "ko",
        "류대균의 교과방송",
        {
            artist: "류대균의 교과방송",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/ko/dsn/ko-dsn-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let croatianVideo = async function () {
    await weeklyVideo(
        "hr",
        "Tajne Biblije",
        {
            artist: "Tajne Biblije",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/hr/hr-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
    )
}

let run = async function () {
    await englishVideo();
    await spanishVideo();
    await russianVideo();
    await ukrainianVideo();
    await portugueseVideo();
    await romanianVideo();
    await chineseVideo()
    await czechVideo();
    await indonesianVideo();
    await italianVideo();
    await hungarianVideo();
    await frenchVideo();
    await germanVideo();
    await tagalogVideo()
    await ilocanoVideo()
    await afrikaansVideo()
    await japaneseVideo()
    await malayalamVideo()
    await tamilVideo()
    await polishVideo()
    await koreanVideo()
    await croatianVideo()
}

run().then(() => {
    return true
});