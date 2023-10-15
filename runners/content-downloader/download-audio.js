const { XMLParser, XMLValidator} = require("fast-xml-parser"),
    axios   = require("axios"),
    { getCompilationQuarterValue } = require('../../deploy-helper'),
    fs = require("fs-extra");
const yamljs = require("js-yaml");


let downloadEGWaudio = async function() {
    const URL = "https://www.egwhiteaudio.com/feed.xml"
    const parser = new XMLParser({ignoreAttributes : false});
    const LESSON_NUMBER = /^Lesson\s*(\d+)/gm
    const quarter = getCompilationQuarterValue(null, true).replace(/[()|+]/g, '').substring(0, 7)
    const SERVER_URL = `https://sabbath-school-media-tmp.s3.amazonaws.com/audio/en/${quarter}/en-egw-${quarter}`
    const TIMESTAMPS = /(\d\d:\d\d)/gm

    let response = await axios.get(URL);
    let rss = parser.parse(response.data);

    if (!rss.rss.channel.item.length || !rss.rss.channel.item[0].title || !rss.rss.channel.item[0].description
    || !rss.rss.channel.item[0].enclosure['@_url']) {
        console.error('The return from the server does not seem to be supported XML feed we are expecting')
        return
    }

    let episode = rss.rss.channel.item[0]

    // Identifying the lesson #
    let lesson = LESSON_NUMBER.exec(episode.title.trim())
    if (!lesson[1]) { return }
    lesson = String(lesson[1]).padStart(2, '0')

    // Check if this lesson has already been processed and uploaded to the cloud
    try {
        let existing = await axios.head(`${SERVER_URL}-${lesson}-01.mp3`);
        if (existing.status === 200) { return 2 }
    } catch (e) {}

    let description = episode.description.replace(/\n/gm, ' ')

    let timestamp, timestamps = []
    do {
        timestamp = TIMESTAMPS.exec(description);
        if (timestamp) {
            timestamps.push(timestamp[1])
        }
    } while (timestamp);

    if (timestamps.length <= 0 || timestamps.length > 8) {
        console.error(`Encountered unexpected timestamps amount. Expect 8, found ${timestamps.length}`)
        return
    }

    timestamps = timestamps.slice(0, 7)
    let url = episode.enclosure['@_url']

    let commands = `curl -C - -L -o en-egw-${quarter}-${lesson}.mp3 "${url}"\n`

    commands += `mkdir -p audio/en/${quarter}/\n`

    for (let i = 0; i < timestamps.length; i++) {
        let last = timestamps.length-1 === i
        commands += `ffmpeg -i en-egw-${quarter}-${lesson}.mp3 -ss 00:${timestamps[i]} ${!last ? `-to ${timestamps[i+1]}` : ''} -c copy audio/en/${quarter}/en-egw-${quarter}-${lesson}-${String(i+1).padStart(2, '0')}.mp3\n`
    }

    commands += `rm en-egw-${quarter}-${lesson}.mp3`

    fs.outputFileSync(`audio-commands.txt`, commands);
}

let run = async function () {
    await downloadEGWaudio();
}

run().then(() => {
    return true
});