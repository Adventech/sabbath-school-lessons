#!/usr/bin/env node
let GITHUB_TOKEN

if (process && process.env && process.env.GITHUB_TOKEN) {
    GITHUB_TOKEN = process.env.GITHUB_TOKEN
} else {
    console.error('Can not proceed without a token. Aborting')
    return
}

// TODO: check for next quarter as well
const {  getCurrentQuarterWithOffset } = require('../deploy-helper')

let glob        = require("glob"),
    axios       = require("axios"),
    quarters    = [getCurrentQuarterWithOffset(14)],
    fs          = require("fs-extra");

let SRC_DIR = 'src'
let COLUMN_ID = "19666486"
let API_HEADERS = {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28"
}

let getListOfAllLanguages = async function() {
    return glob.sync(`${SRC_DIR}/*`).map(e => e.replace(/^src\//, ''));
}

let getListOfAllOpenIssues = async function() {
    let issues = []
    try {
        let count
        let page = 1
        do {
            let response = await axios.get(`https://api.github.com/projects/columns/${COLUMN_ID}/cards?per_page=100&page=${page}`, { headers: API_HEADERS });
            if (response && response.data) {
                count = response.data.length
                issues = issues.concat(response.data.map(a => {return {title: a.note, id: a.id}}))
                page++
            } else {
                break
            }
        } while (count)
    } catch (e) {
        console.log(e)
    }
    return issues
}

let updateProject = async function(languages, issues) {
    console.log(languages, issues)
    for (let quarter of quarters) {
        for (let language of languages) {
            console.log(`Checking ${language}/${quarter}`)
            if (fs.pathExistsSync(`${SRC_DIR}/${language}/${quarter}`)) {
                // if issue exists delete issue
                let card = issues.find(e => e.title === `${language}/${quarter}`)
                if (card) {
                    try {
                        console.log(`Found card for the quarter that has been added. Deleting card`)
                        await axios.delete(`https://api.github.com/projects/columns/cards/${card.id}`, { headers: API_HEADERS });
                    } catch (e) {
                        console.error(e)
                        return
                    }
                }
            } else {
                // if quarter does not exist and issue does not exist create issue
                let card = issues.find(e => e.title === `${language}/${quarter}`)
                if (!card) {
                    try {
                        console.log(`Quarter does not exist and no corresponding card exists. Creating new card`)
                        await axios.post(`https://api.github.com/projects/columns/${COLUMN_ID}/cards`, {note: `${language}/${quarter}`}, { headers: API_HEADERS });
                    } catch (e) {
                        console.error(e)
                        return
                    }
                } else {
                    console.log(`Quarter does not exist but corresponding card exists. Skipping`)
                }
            }
            console.log(`Sleeping for 300ms`)
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}

let run = async function () {
    let languages = await getListOfAllLanguages()
    let issues = await getListOfAllOpenIssues()
    await updateProject(languages, issues)
}

run().then(() => {
    return true
});