#!/usr/bin/env node

var fs = require("fs-extra");

var SOURCE_DIR = "src/",
    LANGUAGE_EMOJI_MAPPER = {
        "af": "🇿🇦",
        "ar": "🇸🇦",
        "bg": "🇧🇬",
        "cs": "🇨🇿",
        "da": "🇩🇰",
        "de": "🇩🇪",
        "el": "🇬🇷",
        "en": "🇺🇸",
        "es": "🇪🇸",
        "et": "🇪🇪",
        "fa": "🇮🇷",
        "fj": "🇫🇯",
        "fr": "🇫🇷",
        "it": "🇮🇹",
        "lt": "🇱🇹",
        "he": "🇮🇱",
        "hr": "🇭🇷",
        "hu": "🇭🇺",
        "in": "🇮🇩",
        "ko": "🇰🇷",
        "lo": "🇱🇦",
        "mk": "🇲🇰",
        "ms": "🇲🇾",
        "no": "🇳🇴",
        "ne": "🇳🇵",
        "ja": "🇯🇵",
        "pl": "🇵🇱",
        "pt": "🇵🇹",
        "ro": "🇷🇴",
        "ru": "🇷🇺",
        "sl": "🇸🇮",
        "sr": "🇷🇸",
        "st": "🇿🇦",
        "sv": "🇸🇪",
        "sw": "🇰🇪",
        "ta": "🇮🇳",
        "tl": "🇵🇭",
        "th": "🇹🇭",
        "tr": "🇹🇷",
        "uk": "🇺🇦",
        "vi": "🇻🇳",
        "zh": "🇨🇳"
    },
    SOURCE_EXTENSION = "md",
    SOURCE_EXTENSION_BIBLE = "bible",
    MD_COMPLETE_THRESHOLD = 300;

var getQuarterlyPrefix = function(d) {
    d = d || new Date();
    var quarterIndex = (Math.ceil((d.getMonth()+1)/3));
    return d.getFullYear() + "-0" + quarterIndex;
};

var l = {
    "en": {
        "2017-03": {
            "01": {
                "complete": "complete", // incomplete
                "01": {
                    "text": "complete",
                    "bible": "complete"
                }
            }
        }
    }
};

/**
 *
 * @param lessonDir
 * @param language
 * @param quarterly
 * @param week
 */
var scanAndReturnIfWeekIsComplete = function(weeksDir, week){
    // scan all md files
    // compare if amount of MD that are completed (size is more than X) is more or less of MD that are incomplete
    // also check if Bible is not there but marked as completed

    var days = fs.readdirSync(weeksDir),
        ret = {};

    var _complete = 0, _incomplete = 0;

    for (var _day = 0; _day < days.length; _day++){
        var extension = days[_day].split(".").pop();
        if (extension !== SOURCE_EXTENSION) continue;

        var sourceSize = Buffer.byteLength(fs.readFileSync(weeksDir + "/" + days[_day]), 'utf8'),
            sourceBible = false;

        try {
            fs.lstatSync(weeksDir + "/" + days[_day] + "." + SOURCE_EXTENSION_BIBLE);
            sourceBible = true;
        } catch (err) {}

        ret[days[_day]] = {
            "text": sourceSize > MD_COMPLETE_THRESHOLD,
            "bible": sourceBible
        };

        var _ = (sourceSize > MD_COMPLETE_THRESHOLD) ? _complete++ : _incomplete++;
    }

    ret["complete"] = _complete > _incomplete;

    return ret;
};

var summaryMatrixToShortMd = function(summaryMatrix){
    var lessons = [];
    var output = "#### Summary\n\n";
    output += "##### " + getQuarterlyPrefix() + "\n\n";


    // Taking English to build header
    output += "|  |";
    var _separator = "\n| ------------ |";

    for (var lesson in summaryMatrix["en"][getQuarterlyPrefix()]){
        lessons.push(lesson);
    }

    lessons.sort(function(x, y){
        return parseInt(x) - parseInt(y);
    });

    for (var i = 0; i < lessons.length; i++){
        output += " " + lessons[i] + " |";
        _separator += " ------------ |";
    }

    output += _separator + "\n";

    for (var language in summaryMatrix){

        for (var quarterly in summaryMatrix[language]){
            output += "| ";
            output += (LANGUAGE_EMOJI_MAPPER.hasOwnProperty(language)) ? LANGUAGE_EMOJI_MAPPER[language] : language;
            output += " " + quarterly.replace(getQuarterlyPrefix(), "").toUpperCase() + " | ";

            for (var i = 0; i < lessons.length; i++){
                lesson = lessons[i];
                output += " ";
                output += (summaryMatrix[language][quarterly][lesson].complete) ? "✅ |" : "❌ |";
            }

            output += "\n";
        }
    }

    console.log(output);
};

var summaryMatrixToFullyMd = function(summaryMatrix){

};

var languages = fs.readdirSync(SOURCE_DIR);
var summaryMatrix = {};

for (var i = 0; i < languages.length; i++){

    var languageDir = SOURCE_DIR + languages[i];
    if (!fs.lstatSync(languageDir).isDirectory()) continue;

    var lessons = fs.readdirSync(languageDir);
    summaryMatrix[languages[i]] = {};

    for (var j = 0; j < lessons.length; j++){
        var lessonsDir = languageDir + "/" + lessons[j];
        if (!fs.lstatSync(lessonsDir).isDirectory() || lessons[j].indexOf(getQuarterlyPrefix()) !== 0) continue;
        summaryMatrix[languages[i]][lessons[j]] = {};

        var weeks = fs.readdirSync(lessonsDir);

        for (var k = 0; k < weeks.length; k++){
            var weeksDir = lessonsDir + "/" + weeks[k];
            if (!fs.lstatSync(weeksDir).isDirectory()) continue;

            summaryMatrix[languages[i]][lessons[j]][weeks[k]] = scanAndReturnIfWeekIsComplete(weeksDir, weeks[k]);
        }
    }


    // console.log(JSON.stringify(summaryMatrix, null, 2));
}

summaryMatrixToShortMd(summaryMatrix);