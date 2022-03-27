const { getCompilationQuarterValue, getInfoFromPath } = require('../../deploy-helper')

let yamljs  = require("js-yaml"),
    glob    = require("glob"),
    axios   = require("axios"),
    moment  = require("moment"),
    fs      = require("fs-extra");

const DATE_FORMAT = "DD/MM/YYYY"

let dailyAudio = async function (lang, title, template, srcFunc, priorCheck, postCheck) {
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

                let src = srcFunc(targetDate, week, day)
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
                    || response.headers['content-type'].indexOf('application/mp3') >= 0)
                {
                    console.log(`Found ${title} for ${targetDate.format(DATE_FORMAT)}. Will commit`)
                    audio.tracks.push({
                        src: src,
                        target: `${quarterlyInfo.language}/${quarterlyInfo.quarterly}/${String(week).padStart(2, '0')}/${String(day).padStart(2, '0')}`
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
        function (targetDate, week, day) {
            return `https://egwhiteaudio.com/wp-content/uploads/${moment().format("YYYY/MM")}/${targetDate.format("YYYY-MM-DD")}.mp3`
        },
        2,
        5
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
        }
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
        }
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

            return `https://www.audioescuelasabatica.com/wp-content/uploads/2022/03/LECCION-${week}-${mapping[day-1]}.mp3`
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
        function (targetDate, week, day) {
            let mapping = [
                "introducere",
                "duminica",
                "luni",
                "marti",
                "miercuri",
                "joi",
                "vineri"
            ]

            return `http://www.7adventist.com/wp-content/themes/adventist-corporate/download-audio.php?f=/2021/trim3/st${String(week).padStart(2, '0')}/st${String(week).padStart(2, '0')}_${mapping[day-1]}.mp3`
        },
        2,
        7
    )
}

let run = async function () {
    await ellenWhiteAudio();
    await indonesiaAudio();
    await spanishAudio();
    await romanianAudio()
    await hungarianAudio();
}

run().then(() => {
    return true
});