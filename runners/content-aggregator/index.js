const { getCompilationQuarterValue, getInfoFromPath } = require('../../deploy-helper')

let yamljs  = require("js-yaml"),
    glob    = require("glob"),
    axios   = require("axios"),
    moment  = require("moment"),
    fs      = require("fs-extra");

const DATE_FORMAT = "DD/MM/YYYY"

let dailyAudio = async function (lang, title, template, srcFunc, priorCheck, postCheck, insideStoryCheck) {
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

                if (!fs.pathExistsSync(`${targetQuarter}/audio.yml`)) {
                    return
                }

                let audioSource = yamljs.load(fs.readFileSync(`${targetQuarter}/audio.yml`), 'utf-8')

                let diff = targetDate.diff(startDate, 'days') + 7
                let week = Math.floor(diff / 7)
                let day = (diff % 7) + 1

                let audio = audioSource.audio.find(e => e.artist === template.artist)

                if (!audio) {
                    console.log(`Looks like a brand new ${title} audio section`)
                    audio = JSON.parse(JSON.stringify(template))
                    audioSource.audio.push(audio)
                }

                let src = srcFunc(targetDate, week, day, quarterlyInfo.quarterly.slice(0, 7))

                let target

                if (Array.isArray(src)) {
                    target = src[1]
                    src = src[0]
                }

                let track = audio.tracks.find(e =>
                    e.target === `${quarterlyInfo.language}/${quarterlyInfo.quarterly}/${String(week).padStart(2, '0')}/${String(day).padStart(2, '0')}` ||
                    e.src === src
                )

                if (track) {
                    console.log(`${title} for ${targetDate.format(DATE_FORMAT)} already exists.`)
                    return
                }

                let response = await axios.head(src);
                if (response.status === 200 &&
                    response.headers['content-type'].indexOf('audio/') >= 0
                    || response.headers['content-type'].indexOf('application/mp3') >= 0
                    || response.headers['content-type'].indexOf('application/wav') >= 0)
                {
                    console.log(`Found ${title} for ${targetDate.format(DATE_FORMAT)}. Will commit`)
                    audio.tracks.push({
                        src: src,
                        target: target || `${quarterlyInfo.language}/${quarterlyInfo.quarterly}/${String(week).padStart(2, '0')}/${String(day).padStart(2, '0')}`
                    })
                    fs.outputFileSync(`${targetQuarter}/audio.yml`,
                        yamljs.dump(audioSource, {
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
            await process(moment().add(-1*i, 'd'))
        }

        for (let i = 1; i <= postCheck; i++) {
            await process(moment().add(i, 'd'))
        }
    }
}

let ellenWhiteAudio = async function () {
    await dailyAudio(
        "en",
        "EGW notes",
        {
            artist: "Ellen G. White Notes",
            image: "misc/ellen-white-notes.png",
            imageRatio: "square",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/audio/en/${targetQuarter}/en-egw-${targetQuarter}-${String(week).padStart(2, '0')}-${String(day).padStart(2, '0')}.mp3`
        },
        2,
        7
    )
}

let indonesiaAudio = async function () {
    await dailyAudio(
        "in",
        "AWR Asia",
        {
            artist: "AWR Asia",
            tracks: []
        },
        function (targetDate, week, day) {
            let mapping = [7, 1, 2, 3, 4, 5, 6]
            return `https://podcasts.awr.org/Audio/Asia/LowResWeb/INDJA/SSL/INDJAaSSLx_${targetDate.format("YYYYMMDD")}_${mapping[day-1]}.mp3`
        },
        2,
        7
    )
}

let hungarianAudio = async function () {
    await dailyAudio(
        "hu",
        "Felnőtt szombatiskola",
        {
            artist: "Felnőtt szombatiskola",
            tracks: []
        },
        function (targetDate, week, day) {
            return `https://bibliatanulmanyok.hu/tanulmanyok/audio/${targetDate.format("YYYYMMDD")}.mp3`
        },
        2,
        7
    )
}

let spanishAudio = async function () {
    await dailyAudio(
        "es",
        "Escuela Sabática en Audio",
        {
            artist: "Escuela Sabática en Audio",
            target: 'daily',
            tracks: []
        },
        function (targetDate, week, day) {
            let mapping = [
                "SABADO",
                "DOMINGO",
                "LUNES",
                "MARTES",
                "MIERCOLES",
                "JUEVES",
                "VIERNES"
            ]

            return `https://www.audioescuelasabatica.com/wp-content/uploads/2024/07/LECCION-${week}-${mapping[day-1]}.mp3`
        },
        2,
        7
    )
}

let romanianAudio = async function () {
    await dailyAudio(
        "ro",
        "Școala de Sabat Audio",
        {
            artist: "Școala de Sabat Audio",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {

            let year = targetQuarter.slice(0, 4)
            let quarter = targetQuarter.slice(6)

            let mapping = [
                "introducere",
                "duminica",
                "luni",
                "marti",
                "miercuri",
                "joi",
                "vineri"
            ]

            return [
                `http://www.7adventist.com/wp-content/themes/adventist-corporate/download-audio.php?f=/${year}/trim${quarter}/st${String(week).padStart(2, '0')}/st${String(week).padStart(2, '0')}.mp3`,
                `ro/${targetQuarter}/${String(week).padStart(2, '0')}/01`
            ]
        },
        2,
        7
    )
}

let czechAudio = async function () {
    await dailyAudio(
        "cs",
        "Průvodce studiem Bible",
        {
            artist: "Průvodce studiem Bible",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {
            let year = targetQuarter.slice(0, 4)
            let quarter = targetQuarter.slice(6)

            let mapping = [
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "inside-story"
            ]

            return `https://radvanice.casd.cz/sobotniskola/audio/${year}_Q${quarter}/${year}_Q${quarter}_${String(week).padStart(2, '0')}-${mapping[day-1]}.mp3`
        },
        2,
        7
    )
}

let ukrainianAudio = async function () {
    await dailyAudio(
        "uk",
        "Суботня Школа",
        {
            artist: "Суботня Школа",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {
            return `https://sabbath-school-media-tmp.s3.us-east-1.amazonaws.com/audio/uk/${targetQuarter}/${targetDate.format('YYYY-MM-DD')}.mp3`
        },
        2,
        7
    )
}

let bulgarianAudio = async function () {
    await dailyAudio(
        "bg",
        "Съботно училище",
        {
            artist: "Съботно училище",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {
            let year = targetQuarter.slice(0, 4)
            let quarter = targetQuarter.slice(6)
            return [
                `https://web.3-16.bg/lessons/${year}_Q${quarter}/${year}_Q${quarter}_Lesson_${week}.mp3`,
                `bg/${targetQuarter}/${String(week).padStart(2, '0')}/01`
            ]
        },
        2,
        7
    )
}

let germanAudio = async function () {
    await dailyAudio(
        "de",
        "Seminar Schloss Bogenhofen",
        {
            artist: "Seminar Schloss Bogenhofen",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {
            return [
                `https://sabbath-school-media-tmp.s3.us-east-1.amazonaws.com/audio/de/${targetQuarter}/de-bh-${targetQuarter}-${String(week).padStart(2, '0')}.mp3`,
                `de/${targetQuarter}/${String(week).padStart(2, '0')}/01`
            ]
        },
        2,
        7
    )
}

let papiamentoAudio = async function () {
    await dailyAudio(
        "pap",
        "Les di Sabbatskol",
        {
            artist: "Les di Sabbatskol",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {
            let year = targetQuarter.slice(0, 4)
            let quarter = targetQuarter.slice(6)
            return [
                `https://joycita-adv.nl/media/audio/sabbatskol/${year}/${quarter}/${week}.mp3`,
                `pap/${targetQuarter}/${String(week).padStart(2, '0')}/01`
            ]
        },
        2,
        7
    )
}

let russianAudio = async function () {
    await dailyAudio(
        "ru",
        "Голос Надежды",
        {
            artist: "Голос Надежды",
            tracks: []
        },
        function (targetDate, week, day, targetQuarter) {
            return `https://sabbath-school-media-tmp.s3.amazonaws.com/audio/ru/${targetQuarter}/ru-${targetQuarter}-${String(week).padStart(2, '0')}.mp3-${day}.mp3`
        },
        7,
        7
    )
}

let run = async function () {
    await ellenWhiteAudio();
    await indonesiaAudio();
    await spanishAudio();
    await romanianAudio()
    await hungarianAudio();
    await czechAudio();
    await ukrainianAudio();
    await bulgarianAudio();
    await germanAudio();
    await papiamentoAudio();
    await russianAudio();
}

run().then(() => {
    return true
});