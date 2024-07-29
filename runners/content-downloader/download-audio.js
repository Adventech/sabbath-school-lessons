const { XMLParser } = require("fast-xml-parser"),
    axios   = require("axios"),
    { getCompilationQuarterValue, getCurrentQuarter } = require('../../deploy-helper'),
    fs = require("fs-extra"),
    moment  = require("moment"),
    crypto = require("crypto"),
    algorithm = "aes-192-cbc",
    glob    = require("glob"),
    yamljs  = require("js-yaml"),
    { exec } = require('child_process'),
    util = require('util'),
    execAsync = util.promisify(exec);

const WORKING_DIR = `ss-audio`

let checkCebuanoAPK = async function() {
    let downloadAPK = async function () {
        let CEBUANO_APK_URL = `https://d.apkpure.net/b/APK/ph.edu.fusterobisaya?version=latest`
        try {
            const response = await axios({
                method: 'get',
                url: CEBUANO_APK_URL,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(`${WORKING_DIR}/cebuano.zip`)
            response.data.pipe(writer)

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Error downloading the Cebuano APK:', error);
        }
    }
    let executeCommand = async function (command) {
        try {
            const { stdout, stderr } = await execAsync(command);
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
                return;
            }
            return stdout
        } catch (error) {
            console.error(`Error: ${error.message}`);
        }
    }

    let commands = "\n"
    await downloadAPK()

    if (!fs.pathExistsSync(`${WORKING_DIR}/cebuano.zip`)) {
        return
    }

    await executeCommand(`mkdir -p "./ss-audio/cebuano" && unzip -o "./ss-audio/cebuano.zip" -d "./ss-audio/cebuano" && unzip -o "./ss-audio/cebuano/ph.edu.fusterobisaya.apk" -d "./ss-audio/cebuano" && mkdir -p "./ss-audio/pdf/ceb/fustero" && cp ./ss-audio/cebuano/assets/*.pdf ./ss-audio/pdf/ceb/fustero/ || echo "Error: Zip file does not exist."`)
    await executeCommand(`rm -r ./ss-audio/cebuano ./ss-audio/cebuano.zip`)

    let files = await executeCommand(`ls -1 ./ss-audio/pdf/ceb/fustero`)
    let filesArray = files.trim().split("\n")
    let newFiles = []

    if (files && filesArray.length) {
        for (let file of filesArray) {
            console.log(`Sleeping for 500ms`)

            await new Promise(resolve => setTimeout(resolve, 500));
            console.log(`Checking ${file}`)

            let remoteUrl = `https://sabbath-school-media-tmp.s3.amazonaws.com/pdf/ceb/fustero/${file}`
            try {
                let remoteResponse = await axios.head(remoteUrl)
                if (remoteResponse.status !== 200) {
                    newFiles.push(file)
                }
            } catch (e) {
                newFiles.push(file)
            }
        }
    }

    if (newFiles.length) {
        commands += `aws ses send-email --region us-east-1 --to="vitaliy@adventech.io" --subject="Cebuano files" --html="Cebuano files that are uploaded:<br/><br/>${newFiles.join("<br/>")}" --from="vitaliy@adventech.io"\n`
    }
    fs.appendFileSync(`${WORKING_DIR}/audio-commands.txt`, commands);
}

let downloadEGWaudio = async function() {
    const URL = "https://www.egwhiteaudio.com/feed.xml"
    const parser = new XMLParser({ignoreAttributes : false});
    const LESSON_NUMBER = /Lesson\s*(\d+)/gm
    const quarter = getCompilationQuarterValue(null, true).replace(/[()|+]/g, '').substring(0, 7)
    const SERVER_URL = `https://sabbath-school-media-tmp.s3.amazonaws.com/audio/en/${quarter}/en-egw-${quarter}`
    const TIMESTAMPS = /(\d\d:\d\d)/gm
    let response
    try {
         response = await axios.get(URL);
    } catch (e) {
        return
    }

    let rss = parser.parse(response.data);

    if (!rss.rss.channel.item.length || !rss.rss.channel.item[0].title || !rss.rss.channel.item[0].enclosure['@_url']) {
        console.error('The return from the server does not seem to be supported XML feed we are expecting')
        return
    }

    let found = false
    for (let episode of rss.rss.channel.item) {
        if (!found) {
            // Identifying the lesson #
            let lesson = LESSON_NUMBER.exec(episode.title.trim())

            if (lesson && lesson[1]) {
                lesson = String(lesson[1]).padStart(2, '0')

                // Check if this lesson has already been processed and uploaded to the cloud
                try {
                    let existing = await axios.head(`${SERVER_URL}-${lesson}-01.mp3`);
                    if (existing.status === 200) {
                        fs.appendFileSync(`${WORKING_DIR}/audio-commands.txt`, '\n\n');
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

                if (timestamps.indexOf("00:00") < 0) {
                    timestamps.unshift("00:00")
                }

                if (timestamps.length <= 0 || timestamps.length > 8) {
                    console.error(`Encountered unexpected timestamps amount. Expect 8, found ${timestamps.length}`)
                    return
                }

                let url = episode.enclosure['@_url']

                let commands = `curl -C - -L -o en-egw-${quarter}-${lesson}.mp3 "${url}"\n`

                commands += `mkdir -p audio/en/${quarter}/\n`

                for (let i = 0; i < timestamps.length; i++) {
                    let last = timestamps.length-1 === i
                    commands += `ffmpeg -i en-egw-${quarter}-${lesson}.mp3 -ss 00:${timestamps[i]} ${!last ? `-to ${timestamps[i+1]}` : ''} -c copy audio/en/${quarter}/en-egw-${quarter}-${lesson}-${String(i+1).padStart(2, '0')}.mp3\n`
                }

                commands += `rm en-egw-${quarter}-${lesson}.mp3\n`

                fs.appendFileSync(`${WORKING_DIR}/audio-commands.txt`, commands);

                found = true
            }
        }
    }


}

let downloadRussianAudio = async function() {
    let commands = `\n`
    let newUrls = []
    let currentQuarter = getCurrentQuarter()

    const SERVER_URL = `https://sabbath-school-media-tmp.s3.amazonaws.com/audio/ru/${currentQuarter}`

    // Determining current week relative to the quarter
    let date = moment()

    if (!fs.pathExistsSync(`src/ru/${currentQuarter}/info.yml`)) {
        return
    }

    let infoSource = yamljs.load(fs.readFileSync(`src/ru/${currentQuarter}/info.yml`), 'utf-8')
    let startDate = moment(infoSource.start_date, 'DD/MM/YYYY')
    let currentWeek = date.week() - startDate.week()

    // Getting number of lessons
    let lessons = glob.sync(`src/ru/${currentQuarter}/*/info.yml`).length;

    // Iterate over remaining weeks
    for (let week = currentWeek; week <= lessons; week++) {
        let response

        try {
            response = await axios.head(`${SERVER_URL}/ru-${currentQuarter}-${String(week).padStart(2, '0')}.mp3`);
        } catch (e) {}

        if (!response || (response && response.status !== 200)) {
            try {
                console.log(`Sleeping for 500ms`)
                await new Promise(resolve => setTimeout(resolve, 500));

                let remoteUrl = `https://www.adventistfiles.net/documents/ss/${currentQuarter.slice(0, 4)}/${currentQuarter.slice(-1)}/adult/mp3/ss_${currentQuarter.slice(0, 4)}_0${currentQuarter.slice(-1)}_${String(week).padStart(2, '0')}.mp3`
                let remoteResponse = await axios.head(remoteUrl)
                if (remoteResponse.status === 200) {
                    newUrls.push(`${SERVER_URL}/ru-${currentQuarter}-${String(week).padStart(2, '0')}.mp3`)
                    commands += `curl -C - -L --create-dirs -o audio/ru/${currentQuarter}/ru-${currentQuarter}-${String(week).padStart(2, '0')}.mp3 "${remoteUrl}"\n`
                }
            } catch (e) {}
        }
    }

    if (newUrls.length) {
        commands += `aws ses send-email --region us-east-1 --to="amara@adventech.io" --subject="New Russian Audio available" --html="New Russian audio is available for download:<br/><br/>${newUrls.join('<br/>')}" --from="vitaliy@adventech.io"\n`
    }

    fs.appendFileSync(`${WORKING_DIR}/audio-commands.txt`, commands);
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
            let existCloud = false
            try {
                // check if target exists already
                let existCloudResult = await axios.head(`${SERVER_URL}/${date.format(DATE_FORMAT)}.mp3`);
                if (existCloudResult.status === 200) {
                    existCloud = true
                }
            } catch (e) {
                console.error(e)
            }

            try {
                if (!existCloud) {
                    let remoteFileUrl = `${REMOTE_URL}${date.format(DATE_FORMAT)}.mp3`
                    let exists = await axios.head(remoteFileUrl);
                    console.log(`${REMOTE_URL}${date.format(DATE_FORMAT)}.mp3`)
                    if (exists.status === 200) {
                        // exist on remote add to download list

                        commands += `curl -C - -L --create-dirs -o audio/uk/${quarter}/${date.format(DATE_FORMAT)}.mp3 "${remoteFileUrl}"\n`
                    }
                }
            } catch (e) {}

            date.add(1, 'd')
            console.log(`Sleeping for 500ms`)
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        fs.appendFileSync(`${WORKING_DIR}/audio-commands.txt`, commands);
    } catch (e) {
        console.error(e)
    }
}

let downloadGermanAudio = async function() {
    const URL = "https://bogenhofen.podigee.io/feed/mp3"
    const parser = new XMLParser({ignoreAttributes : false});
    const LESSON_NUMBER = /^Q\d\s*-\s*E(\d)./gm
    const quarter = getCompilationQuarterValue(null, true).replace(/[()|+]/g, '').substring(0, 7)
    const SERVER_URL = `https://sabbath-school-media-tmp.s3.amazonaws.com/audio/de/${quarter}/de-bh-${quarter}`
    let response
    try {
        response = await axios.get(URL);
    } catch (e) {
        return
    }

    let rss = parser.parse(response.data);

    if (!rss.rss.channel.item.length || !rss.rss.channel.item[0].title || !rss.rss.channel.item[0].description
        || !rss.rss.channel.item[0].enclosure['@_url']) {
        console.error('The return from the server does not seem to be supported XML feed we are expecting')
        return
    }

    let year = parseInt(quarter.substring(0, 4))
    let quarterInt = parseInt(quarter.substring(6))

    let itemsThisQuarter = rss.rss.channel.item.filter(i => {
        let regex = new RegExp(`${quarterInt}\.\\s*Quartal\\s*${year}`)
        return regex.test(i["itunes:subtitle"])
    })

    if (!itemsThisQuarter.length || !itemsThisQuarter[0].title || !itemsThisQuarter[0].description
        || !itemsThisQuarter[0].enclosure['@_url']) {
        console.error('The return from the server does not seem to be have the lessons for the current quarter')
        return
    }

    let episode = itemsThisQuarter[0]

    // Identifying the lesson #
    let lesson = LESSON_NUMBER.exec(episode.title.trim())
    if (!lesson[1]) { return }
    lesson = String(lesson[1]).padStart(2, '0')

    // Check if this lesson has already been processed and uploaded to the cloud
    try {
        let existing = await axios.head(`${SERVER_URL}-${lesson}.mp3`);
        if (existing.status === 200) {
            fs.appendFileSync(`${WORKING_DIR}/audio-commands.txt`, '\n');
            return 2
        }
    } catch (e) {}

    let url = episode.enclosure['@_url']
    let commands = `curl -C - -L --create-dirs -o audio/de/${quarter}/de-bh-${quarter}-${lesson}.mp3 "${url}"\n`
    fs.appendFileSync(`${WORKING_DIR}/audio-commands.txt`, commands);
}

let run = async function () {
    await downloadEGWaudio();
    await downloadUKAudio();
    await downloadRussianAudio();
    await downloadGermanAudio();
    await checkCebuanoAPK();
}

run().then(() => {
    return true
});