const yaml = require("js-yaml")
const moment = require("moment")
const fs = require("fs")
const path = require("path")

function getCompilationQuarterValueForAudioVideo() {
    try {
        const baseDir = "src/en"

        // Get all subdirectories and sort alphabetically, take last 2
        const folders = fs.readdirSync(baseDir)
            .filter(f => /\d{4}-\d{2}$/.test(f) && fs.statSync(path.join(baseDir, f)).isDirectory())
            .sort()
            .slice(-2)

        const today = moment()

        for (const folder of folders) {
            const infoPath = path.join(baseDir, folder, "info.yml")

            if (!fs.existsSync(infoPath)) continue

            const info = yaml.load(fs.readFileSync(infoPath, "utf8"))

            const startDate = moment(info.start_date, "DD/MM/YYYY")
            const endDate = moment(info.end_date, "DD/MM/YYYY")

            if (today.isBetween(startDate, endDate, "day", "[]")) {
                return folder
            }
        }

        return getCompilationQuarterValue(null, true)
    } catch (e) {
        return getCompilationQuarterValue(null, true)
    }
}

let getCompilationQuarterValue = function (d, strict, includePrevious) {
    d = d || new Date();
    let quarterIndex = (Math.ceil((d.getMonth() + 1) / 3)),
        nextQuarter = (quarterIndex <= 3) ? d.getFullYear() + "-0" + (quarterIndex + 1) : (d.getFullYear() + 1) + "-01";

    let ret = `+(${includePrevious ? getPreviousQuarter() + "|" : ''}${d.getFullYear()}-0${quarterIndex}|${nextQuarter})`;
    if (!strict) {
        ret = `${ret}*`
    }
    return ret
};

let getCurrentQuarter = function () {
    let d = new Date();
    let quarterIndex = (Math.ceil((d.getMonth() + 1) / 3));

    return `${d.getFullYear()}-0${quarterIndex}`;
};

let getCurrentQuarterWithOffset = function (offset) {
    let d = new Date();
    d.setDate(d.getDate() + offset);
    let quarterIndex = (Math.ceil((d.getMonth() + 1) / 3));

    return `${d.getFullYear()}-0${quarterIndex}`;
};

let getNextQuarter = function () {
    let d = new Date();
    let quarterIndex = (Math.ceil((d.getMonth() + 1) / 3));
    let nextQuarter = (quarterIndex <= 3) ? d.getFullYear() + "-0" + (quarterIndex + 1) : (d.getFullYear() + 1) + "-01";

    return `${nextQuarter}`;
};

let getPreviousQuarter = function () {
    let d = new Date();
    let quarterIndex = (Math.ceil((d.getMonth() + 1) / 3));
    let prevQuarter = (quarterIndex === 1) ? (d.getFullYear() - 1) + "-04" : (d.getFullYear()) + `-0${(quarterIndex - 1)}`;

    return `${prevQuarter}`;
};

let getInfoFromPath = function (path) {
    let infoRegExp = /src\/([a-z]{2,3})?\/?([a-z0-9-]{6,})?\/?([0-9a-z\-]{2,})?\/?([a-z0-9-]{2,}(\.md)?)?\/?/g,
        matches = infoRegExp.exec(path),
        info = {};

    info.language = matches[1] || null;
    info.quarterly = matches[2] || null;
    info.lesson = matches[3] || null;
    info.day = (matches[4]) ? matches[4].replace(".md", "") : null;

    return info;
};

const WILDCARD_BATCH_SIZE = 15

let generateInvalidations = function (paths) {
    if (paths.length > 1000) {
        return {
            "invalidation.json": buildInvalidationJson(["/*"]),
        }
    }

    const nonWildcard = paths.filter((p) => !p.includes("*"))
    const wildcard = paths.filter((p) => p.includes("*"))

    const files = {}

    if (nonWildcard.length > 0) {
        files["invalidation.json"] = buildInvalidationJson(nonWildcard)
    }

    for (let i = 0; i < wildcard.length; i += WILDCARD_BATCH_SIZE) {
        const batch = wildcard.slice(i, i + WILDCARD_BATCH_SIZE)
        const fileIndex = Math.floor(i / WILDCARD_BATCH_SIZE) + 1
        files[`invalidation-${fileIndex}.json`] = buildInvalidationJson(batch)
    }

    return files
}

let buildInvalidationJson = function (items) {
    return {
        Paths: {
            Quantity: items.length,
            Items: items,
        },
        CallerReference: `deploy.js (${Date.now()}-${Math.random().toString(36).slice(2, 7)})`,
    }
}

module.exports = { getCompilationQuarterValueForAudioVideo, getCompilationQuarterValue, getCurrentQuarter, getNextQuarter, getPreviousQuarter, getInfoFromPath, getCurrentQuarterWithOffset, generateInvalidations }