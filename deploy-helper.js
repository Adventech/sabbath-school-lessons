let getCompilationQuarterValue = function (d, strict) {
    d = d || new Date();
    let quarterIndex = (Math.ceil((d.getMonth() + 1) / 3)),
        nextQuarter = (quarterIndex <= 3) ? d.getFullYear() + "-0" + (quarterIndex + 1) : (d.getFullYear() + 1) + "-01";

    let ret = `+(${d.getFullYear()}-0${quarterIndex}|${nextQuarter})`;
    if (!strict) {
        ret = `${ret}*`
    }
    return ret
};

let getInfoFromPath = function (path) {
    let infoRegExp = /src\/([a-z]{2,3})?\/?([a-z0-9-]{6,})?\/?([0-9]{2})?\/?([a-z0-9-]{2,}(\.md)?)?\/?/g,
        matches = infoRegExp.exec(path),
        info = {};

    info.language = matches[1] || null;
    info.quarterly = matches[2] || null;
    info.lesson = matches[3] || null;
    info.day = (matches[4]) ? matches[4].replace(".md", "") : null;

    return info;
};

module.exports = { getCompilationQuarterValue, getInfoFromPath }