const DATE_FORMAT = "DD/MM/YYYY"
const { getCompilationQuarterValue } = require('./deploy-helper')

let metaMarked = require("meta-marked"),
    fs = require('fs-extra'),
    yamljs = require("js-yaml"),
    glob = require("glob"),
    moment = require('moment'),
    axios = require('axios'),
    core = require('@actions/core');

let prNum = false

if (process && process.env && process.env.GITHUB_EVENT_PATH && fs.pathExistsSync(process.env.GITHUB_EVENT_PATH)) {
    let ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    prNum = ev.pull_request.number || true
}

let failMessages = []

let fail = function (message) {
    failMessages.push(message);
}

/**
 * Validate quarterly content to be complete, contain proper dates
 * @returns {Promise<void>}
 */
let validateContent = async function () {
    let quarterliesList = glob.sync("src/**/"+getCompilationQuarterValue()+"?(-cq|-er)")
    for (let quarterly of quarterliesList) {
        let validDate = null
        let doc = null
        try {
            doc = yamljs.load(fs.readFileSync(`${quarterly}/info.yml`));
        } catch (e) {
            e = e.toString().replace(/\n/g, '<br>');
            fail(`Critical error. Can not parse the quarterly info: \`${quarterly}\`/info.yml. Error: \`${e}\``);
            break
        }

        try {
            validDate = moment(doc["start_date"], DATE_FORMAT).add(-1, 'd');
        } catch (e) {
            fail(`Critical error. Can not obtain start date for the quarterly: \`${quarterly}\`/info.yml. Error: \`${e}\``);
            break
        }

        let weeklyInfoFiles = glob.sync(`${quarterly}/+(0|1|2|3|4|5|6|7|8|9)/info.yml`);

        for (let weeklyInfoFile of weeklyInfoFiles) {
            try {
                doc = yamljs.load(fs.readFileSync(`${weeklyInfoFile}`));
            } catch (e) {
                e = e.toString().replace(/\n/g, '<br>');
                fail(`Critical error. Can not parse the weekly info: \`${weeklyInfoFile}\`. Error: \`${e}\``);
                break
            }
        }

        let markdownFiles = glob.sync(`${quarterly}/+(0|1|2|3|4|5|6|7|8|9)/*.md`);

        if (markdownFiles.filter((f) => { return /\d{2}\.md$/img.test(f) }).length < 91) {
            if (!fs.pathExistsSync(`${quarterly}/pdf.yml`)) {
                fail(`Incomplete quarterly \`${quarterly}\`. Expecting markdown for all 7 days for each 13 weeks`);
            }
        }

        for (let markdownFile of markdownFiles) {
            try {
                if (/\d{2}\.md$/.test(markdownFile)) {
                    validDate.add(1, 'd')
                }

                let content = metaMarked(fs.readFileSync(markdownFile, "utf-8"))
                let contentDate = moment(content.meta.date, DATE_FORMAT)

                if (contentDate.format(DATE_FORMAT) !== validDate.format(DATE_FORMAT)) {
                    fail(`Potential error in the date field: \`${markdownFile}\`. Expected: \`${validDate.format(DATE_FORMAT)}\`, got: \`${contentDate.format(DATE_FORMAT)}\``)
                }
            } catch (e) {
                e = e.toString().replace(/\n/g, '<br>');
                fail(`Error parsing: \`${markdownFile}\`. Error: ${e}`);
            }
        }
    }
}

validateContent().then(async function (){
    if (failMessages.length) {
        let pullRequestComment = "Ooops! Looks like you have to fix some issues before I can merge this PR\n"
        pullRequestComment += "||Error description |\n| ----------- | ----------- |"

        for (let message of failMessages) {
            pullRequestComment += `\n|🛑| ${message}|`
        }

        if (!prNum) {
            console.error(pullRequestComment)
            return
        }

        await axios({
            method: 'post',
            url: 'https://fh83o4b1ph.execute-api.us-east-1.amazonaws.com/default/SabbathSchoolPullRequestPost',
            data: {
                pullRequestID: prNum,
                pullRequestComment: pullRequestComment
            }
        });

        core.setFailed("Ooops! Looks like you have to fix some issues before I can merge this PR");
    }
})