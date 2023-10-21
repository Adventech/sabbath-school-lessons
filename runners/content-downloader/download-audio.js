const { XMLParser } = require("fast-xml-parser"),
    axios   = require("axios"),
    { getCompilationQuarterValue } = require('../../deploy-helper'),
    fs = require("fs-extra"),
    moment  = require("moment"),
    crypto = require("crypto"),
    algorithm = "aes-192-cbc";

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
        if (existing.status === 200) {
            fs.outputFileSync(`audio-commands.txt`, '');
            return 2
        }
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

let downloadUKAudio = async function() {
    let GITHUB_TOKEN
    const quarter = getCompilationQuarterValue(null, true).replace(/[()|+]/g, '').substring(0, 7)
    const SERVER_URL = `https://sabbath-school-media-tmp.s3.amazonaws.com/audio/uk/${quarter}`

    if (process && process.env && process.env.GITHUB_TOKEN) {
        GITHUB_TOKEN = process.env.GITHUB_TOKEN
    } else {
        console.error('Can not proceed without a token. Aborting')
        return
    }

    try {
        let e = `2758c920be4b2529b79601a58fa5ad8f7af30b591b14b635a12e6d04220a5d817858c0b203f575e8685c71435ab5c9bdc5c8ef9840b23e6eca2118e130ec7bba|88045e891be09256e3d5cd40df5159e6`
        const key = crypto.scryptSync(GITHUB_TOKEN, 'salt', 24)
        const DATE_FORMAT = "YYYY-MM-DD"
        const [enc, iv] = e.split("|");
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, "hex"));
        const REMOTE_URL = decipher.update(enc, 'hex', 'utf8') + decipher.final('utf8');

        let date = moment()
        date.isoWeekday(1)

        let commands = `\n`

        for (let i = 1; i <= 7; i++) {
            try {
                // check if target exists already
                let existCloud = await axios.head(`${SERVER_URL}/${date.format(DATE_FORMAT)}.mp3`);
                if (existCloud.status !== 200) {
                    let remoteFileUrl = `${REMOTE_URL}${date.format(DATE_FORMAT)}.mp3`
                    let exists = await axios.head(remoteFileUrl);
                    if (exists.status === 200) {
                        // exist on remote add to download list
                        commands += `curl -C - -L --create-dirs -o audio/uk/${quarter}/${date.format(DATE_FORMAT)}.mp3 "${remoteFileUrl}"\n`
                    }
                }
            } catch (e) {
                console.error(e)
            }
            date.add(1, 'd')
            console.log(`Sleeping for 500ms`)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        fs.appendFileSync(`audio-commands.txt`, commands);
    } catch (e) {
        console.error(e)
    }
}

let run = async function () {
    await downloadEGWaudio();
    await downloadUKAudio();
}

run().then(() => {
    return true
});