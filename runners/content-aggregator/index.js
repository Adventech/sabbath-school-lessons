const { getCompilationQuarterValue, getInfoFromPath } = require('../../deploy-helper')

let yamljs  = require("js-yaml"),
    glob    = require("glob"),
    axios   = require("axios"),
    moment  = require("moment"),
    fs      = require("fs-extra");

const DATE_FORMAT = "DD/MM/YYYY"

let ellenWhiteAudio = async function () {
    const ARTIST_TEMPLATE = {
        artist: "Ellen G. White Notes",
        image: "misc/ellen-white-notes.png",
        imageRatio: "square",
        tracks: []
    }

    let targetQuarterlies = glob.sync(`src/en/${getCompilationQuarterValue(null, true)}/`);

    for (let targetQuarter of targetQuarterlies) {
        let quarterlyInfo = getInfoFromPath(targetQuarter)
        try {
            let targetDate = moment()
            let infoSource = yamljs.load(fs.readFileSync(`${targetQuarter}/info.yml`), 'utf-8')
            let startDate = moment(infoSource.start_date, DATE_FORMAT)
            let endDate = moment(infoSource.end_date, DATE_FORMAT)

            if (!targetDate.isBetween(startDate, endDate)) {
                continue;
            }

            console.log(`Checking EGW notes audio for ${targetDate.format(DATE_FORMAT)}`)

            let audioSource = yamljs.load(fs.readFileSync(`${targetQuarter}/audio.yml`), 'utf-8')

            let diff = targetDate.diff(startDate, 'days') + 7
            let week = Math.floor(diff / 7)
            let day = (diff % 7) + 1

            let egwNotes = audioSource.audio.find(e => e.artist === ARTIST_TEMPLATE.artist)

            if (!egwNotes) {
                console.log(`Looks like a brand new EGW notes audio section`)
                egwNotes = JSON.parse(JSON.stringify(ARTIST_TEMPLATE))
                audioSource.audio.push(egwNotes)
            }

            let track = egwNotes.tracks.find(e => e.target === `${quarterlyInfo.language}/${quarterlyInfo.quarterly}/${String(week).padStart(2, '0')}/${String(day).padStart(2, '0')}`)

            if (track) {
                console.log(`EGW notes audio for ${targetDate.format(DATE_FORMAT)} already exists.`)
                return
            }

            let src = `https://egwhiteaudio.com/wp-content/uploads/${targetDate.format("YYYY")}/${targetDate.format("MM")}/${targetDate.format("YYYY-MM-DD")}.mp3`
            let response = await axios.head(src);
            if (response.status === 200) {
                console.log(`Found EGW notes audio for ${targetDate.format(DATE_FORMAT)}. Will commit`)
                egwNotes.tracks.push({
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
                console.log('EGW file is not uploaded')
            }
        }
    }
}

ellenWhiteAudio();