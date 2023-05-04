const { getCompilationQuarterValue, getInfoFromPath } = require('../../deploy-helper')

let yamljs  = require("js-yaml"),
    glob    = require("glob"),
    axios   = require("axios"),
    moment  = require("moment"),
    fs      = require("fs-extra");

const DATE_FORMAT = "DD/MM/YYYY"

let weeklyVideo = async function (lang, title, template, srcFunc) {
    let targetQuarterlies = glob.sync(`src/${lang}/${getCompilationQuarterValue(null, true)}/`);

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

                let src = srcFunc(targetDate, quarterlyInfo.quarterly, year, week)

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
                        newClip.thumbnail = src.replace(/\.mp4$/, '.webp')
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

        await process()
    }
}

let englishVideo = async function () {
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
        "Amazing Facts Study Hour",
        {
            artist: "Amazing Facts Study Hour",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/en/af/en-af-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
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
        }
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
        "Adventistas Lago Sul",
        {
            artist: "Adventistas Lago Sul",
            clips: []
        },
        function (targetDate, targetQuarter, year, week) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/pt/lago/pt-lago-${targetQuarter}-${String(week).padStart(2, '0')}.mp4`
        }
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

let run = async function () {
    await englishVideo();
    await spanishVideo();
    await russianVideo();
    await ukrainianVideo();
    await portugueseVideo();
    await romanianVideo();
    await chineseVideo()
    await czechVideo();
}

run().then(() => {
    return true
});