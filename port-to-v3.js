const
        glob = require("glob"),
        fs = require("fs-extra"),
        SOURCE_DIR = "src",
        ASSETS_DIR = "images/global",
        path = require('path'),
        { getInfoFromPath } = require('./deploy-helper'),
        { XMLParser } = require("fast-xml-parser"),
        yamljs = require("js-yaml"),
        BIBLE_PARSER_CONFIG = require("./config.js");

let DIST_DIR = "./dist/port/ss",
    DIST_DIR_ASSETS = "./dist/port/assets"

const locales = [
    {
        "native": "English",
        "en": "English",
        "code": "en",
        "flag": "🇺🇸",
    },
    {
        "native": "Español",
        "en": "Spanish",
        "code": "es",
        "flag": "🇪🇸",
    },
    {
        "native": "Русский",
        "en": "Russian",
        "code": "ru",
        "flag": "🇷🇺",
    },
    {
        "native": "Português",
        "en": "Portugese",
        "code": "pt",
        "flag": "🇧🇷"
    },
    {
        "native": "Українська",
        "en": "Ukrainian",
        "code": "uk",
        "flag": "🇺🇦",
    },
    {
        "native": "Deutsch",
        "en": "German",
        "code": "de",
        "flag": "🇩🇪",
    },
    {
        "native": "Français",
        "en": "French",
        "code": "fr",
        "flag": "🇫🇷",
    },
    {
        "native": "Română",
        "en": "Romanian",
        "code": "ro",
        "flag": "🇷🇴",
    },
    {
        "native": "Türk",
        "en": "Turkish",
        "code": "tr",
        "flag": "🇹🇷",
    },
    {
        "native": "Srpski",
        "en": "Serbian",
        "code": "sr",
        "flag": "🇷🇸",
    },
    {
        "native": "Dansk",
        "en": "Danish",
        "code": "da",
        "flag": "🇩🇰",
    },
    {
        "native": "Български",
        "en": "Bulgarian",
        "code": "bg",
        "flag": "🇧🇬",
    },
    {
        "native": "فارسی",
        "en": "Persian",
        "code": "fa",
        "flag": "🇮🇷",
    },
    {
        "native": "日本語",
        "en": "Japanese",
        "code": "ja",
        "flag": "🇯🇵",
    },
    {
        "native": "Bahasa Indonesia",
        "en": "Indonesian",
        "code": "in",
        "flag": "🇮🇩",
    },
    {
        "native": "한국어",
        "en": "Korean",
        "code": "ko",
        "flag": "🇰🇷",
    },
    {
        "native": "Norsk",
        "en": "Norwegian",
        "code": "no",
        "flag": "🇳🇴",
    },
    {
        "native": "Bahasa Malaysia",
        "en": "Malay",
        "code": "ms",
        "flag": "🇲🇾",
    },
    {
        "native": "中文",
        "en": "Chinese",
        "code": "zh",
        "flag": "🇨🇳",
    },
    {
        "native": "عربى",
        "en": "Arabic",
        "code": "ar",
        "flag": "🇸🇦",
    },
    {
        "native": "Český",
        "en": "Czech",
        "code": "cs",
        "flag": "🇨🇿",
    },
    {
        "native": "עִברִית",
        "en": "Hebrew",
        "code": "he",
        "flag": "🇮🇱",
    },
    {
        "native": "नेपाली",
        "en": "Nepali",
        "code": "ne",
        "flag": "🇳🇵",
    },
    {
        "native": "Македонски",
        "en": "Macedonian",
        "code": "mk",
        "flag": "🇲🇰",
    },
    {
        "native": "Eesti Keel",
        "en": "Estonian",
        "code": "et",
        "flag": "🇪🇪",
    },
    {
        "native": "Viti",
        "en": "Fijian",
        "code": "fj",
        "flag": "🇫🇯",
    },
    {
        "native": "Magyar",
        "en": "Hungarian",
        "code": "hu",
        "flag": "🇭🇺",
    },
    {
        "native": "Italiano",
        "en": "Italian",
        "code": "it",
        "flag": "🇮🇹",
    },
    {
        "native": "ไทย",
        "en": "Thai",
        "code": "th",
        "flag": "🇹🇭",
    },
    {
        "native": "தமிழ்",
        "en": "Tamil",
        "code": "ta",
        "flag": "🇮🇳",
    },
    {
        "native": "Afrikaans",
        "en": "Afrikaans",
        "code": "af",
        "flag": "🇿🇦",
    },
    {
        "native": "Việt",
        "en": "Vietnamese",
        "code": "vi",
        "flag": "🇻🇳",
    },
    {
        "native": "Ελληνικά",
        "en": "Greek",
        "code": "el",
        "flag": "🇬🇷",
    },
    {
        "native": "ລາວ",
        "en": "Lao",
        "code": "lo",
        "flag": "🇱🇦",
    },
    {
        "native": "Polski",
        "en": "Polish",
        "code": "pl",
        "flag": "🇵🇱",
    },
    {
        "native": "Svenska",
        "en": "Swedish",
        "code": "sv",
        "flag": "🇸🇪",
    },
    {
        "native": "Lietuviškai",
        "en": "Lithuanian",
        "code": "lt",
        "flag": "🇱🇹",
    },
    {
        "native": "Sesotho",
        "en": "Sesotho",
        "code": "st",
        "flag": "🇱🇸",
    },
    {
        "native": "Hrvatski",
        "en": "Croatian",
        "code": "hr",
        "flag": "🇭🇷",
    },
    {
        "native": "Tagalog",
        "en": "Tagalog",
        "code": "tl",
        "flag": "🇵🇭",
    },
    {
        "native": "Kiswahili",
        "en": "Swahili",
        "code": "sw",
        "flag": "🇹🇿",
    },
    {
        "native": "Slovenščina",
        "en": "Slovenian",
        "code": "sl",
        "flag": "🇸🇮",
    },
    {
        "native": "Монгол хэл",
        "en": "Mongolian",
        "code": "mn",
        "flag": "🇲🇳",
    },
    {
        "native": "ქართული ენა",
        "en": "Georgian",
        "code": "ka",
        "flag": "🇬🇪",
    },
    {
        "native": "Slovenčina",
        "en": "Slovak",
        "code": "sk",
        "flag": "🇸🇰",
    },
    {
        "native": "Íslenska",
        "en": "Icelandic",
        "code": "is",
        "flag": "🇮🇸",
    },
    {
        "native": "Հայերեն",
        "en": "Armenian",
        "code": "hy",
        "flag": "🇦🇲",
    },
    {
        "native": "IsiZulu",
        "en": "Zulu",
        "code": "zu",
        "flag": "🇿🇦",
    },
    {
        "native": "IsiXhosa",
        "en": "Xhosa",
        "code": "xh",
        "flag": "🇿🇦",
    },
    {
        "native": "हिन्दी",
        "en": "Hindi",
        "code": "hi",
        "flag": "🇮🇳",
    },
    {
        "native": "Shqiptar",
        "en": "Albanian",
        "code": "sq",
        "flag": "🇦🇱",
    },
    {
        "native": "Latviešu valoda",
        "en": "Latvian",
        "code": "lv",
        "flag": "🇱🇻",
    },
    {
        "native": "Nederlandse taal",
        "en": "Dutch",
        "code": "nl",
        "flag": "🇳🇱",
    },
    {
        "native": "አማርኛ",
        "en": "Amharic",
        "code": "am",
        "flag": "🇪🇹",
    },
    {
        "native": "සිංහල",
        "en": "Sinhala",
        "code": "si",
        "flag": "🇱🇰",
    },
    {
        "native": "Ilokano",
        "en": "Ilocano",
        "code": "ilo",
        "flag": "🇵🇭",
    },
    {
        "native": "Hiligaynon",
        "en": "Hiligaynon",
        "code": "hil",
        "flag": "🇵🇭",
    },
    {
        "native": "Suomen kieli",
        "en": "Finnish",
        "code": "fi",
        "flag": "🇫🇮",
    },
    {
        "native": "မြန်မာဘာသာ",
        "en": "Burmese",
        "code": "my",
        "flag": "🇲🇲",
    },
    {
        "native": "ខ្មែរ",
        "en": "Khmer",
        "code": "km",
        "flag": "🇰🇭",
    },
    {
        "native": "Malagasy",
        "en": "Malagasy",
        "code": "mg",
        "flag": "🇲🇬",
    },
    {
        "native": "മലയാളം",
        "en": "Malayalam",
        "code": "ml",
        "flag": "🇮🇳",
    },
    {
        "native": "ಕನ್ನಡ",
        "en": "Kannada",
        "code": "kn",
        "flag": "🇮🇳",
    },
    {
        "native": "Batak Toba",
        "en": "Batak Toba",
        "code": "bbc",
        "flag": "🇮🇩",
    },
    {
        "native": "Kreyòl ayisyen",
        "en": "Haitian Creole",
        "code": "ht",
        "flag": "🇭🇹",
    },
    {
        "native": "Sinugboanon",
        "en": "Cebuano",
        "code": "ceb",
        "flag": "🇵🇭",
    },
    {
        "native": "తెలుగు",
        "en": "Telugu",
        "code": "te",
        "flag": "🇮🇳",
    },
    {
        "native": "Tedim Chin",
        "en": "Tedim Chin",
        "code": "ctd",
        "flag": "🇲🇲",
    },
    {
        "native": "Mizo ṭawng",
        "en": "Mizo",
        "code": "lus",
        "flag": "🇮🇳",
    },
    {
        "native": "मराठी",
        "en": "Marathi",
        "code": "mr",
        "flag": "🇮🇳",
    },
    {
        "native": "ଓଡ଼ିଆ",
        "en": "Odia",
        "code": "or",
        "flag": "🇮🇳",
    },
    {
        "native": "বাংলা",
        "en": "Bengali",
        "code": "bn",
        "flag": "🇧🇩",
    },
    {
        "native": "Khasi",
        "en": "Khasi",
        "code": "kha",
        "flag": "🇮🇳",
    },
    {
        "native": "ગુજરાતી",
        "en": "Gujarathi",
        "code": "gu",
        "flag": "🇮🇳",
    },
    {
        "native": "Garo",
        "en": "Garo",
        "code": "grt",
        "flag": "🇮🇳",
    },
    {
        "native": "ကညီကျိာ်",
        "en": "S'gaw Karen",
        "code": "kar",
        "flag": "🇲🇲",
    },
    {
        "native": "အရှေ့ပိုးကရင်",
        "en": "Pwo Karen",
        "code": "kjp",
        "flag": "🇲🇲",
    },
    {
        "native": "Jaku Iban",
        "en": "Iban",
        "code": "iba",
        "flag": "🇮🇩🇲🇾",
    },
    {
        "native": "Lai ṭong",
        "en": "Falam Chin",
        "code": "cfm",
        "flag": "🇲🇲🇮🇳",
    },
    {
        "native": "Ikinyarwanda",
        "en": "Kinyarwanda",
        "code": "kin",
        "flag": "🇷🇼",
    },
    {
        "native": "ChiShona",
        "en": "Shona",
        "code": "sn",
        "flag": "🇿🇼",
    },
    {
        "native": "Ikirundi",
        "en": "Kirundi",
        "code": "run",
        "flag": "🇧🇮",
    },
    {
        "native": "Català",
        "en": "Catalan",
        "code": "ca",
        "flag": "🇪🇸",
    },

    {
        "native": "Twi",
        "en": "Twi",
        "code": "tw",
        "flag": "🇬🇭",
    },
    {
        "native": "অসমীয়া",
        "en": "Assamese",
        "code": "as",
        "flag": "🇮🇳",
    },
    {
        "native": "Papiamentu",
        "en": "Papiamento",
        "code": "pap",
        "flag": "🇨🇼",
    },
    {
        "native": "Lus Hmoob",
        "en": "Hmong",
        "code": "hmn",
        "flag": "🇻🇳",
    },
]

let listDirectoriesSync = (dirPath) => {
    try {
        const files = fs.readdirSync(dirPath)
        let directories = []

        for (let file of files) {
            const fullPath = path.join(dirPath, file)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
                directories.push(fullPath)
            }
        }

        return directories
    } catch (err) {
        console.error("Error reading directory:", err)
        throw err
    }
};

let portQuarterliesForLanguage = async function (language) {
    console.log(`Porting quarterlies for ${language}`)

    let quarterlies = listDirectoriesSync(`./src/${language}`)

    for (let quarterly of quarterlies) {
        const quarterlyPathInfo = getInfoFromPath(quarterly)
        fs.copySync(quarterly, `${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}`)

        if (fs.pathExistsSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/cover.png`)) {
            fs.moveSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/cover.png`,
                `${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/assets/cover.png`)
        }

        if (fs.pathExistsSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/splash.png`)) {
            fs.moveSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/splash.png`,
                `${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/assets/splash.png`)
        }

        if (fs.pathExistsSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/pdf.yml`)) {
            let pdf = fs.readFileSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/pdf.yml`, 'utf-8')
            pdf = pdf.replace(/target:\s*([a-z]{2,3})\//g, 'target: $1/ss/')
            fs.outputFileSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/pdf.yml`, pdf)
        }

        if (fs.pathExistsSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/audio.yml`)) {
            let pdf = fs.readFileSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/audio.yml`, 'utf-8')
            pdf = pdf.replace(/target:\s*([a-z]{2,3})\//g, 'target: $1/ss/')
            fs.outputFileSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/audio.yml`, pdf)
        }

        if (fs.pathExistsSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/video.yml`)) {
            let pdf = fs.readFileSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/video.yml`, 'utf-8')
            pdf = pdf.replace(/target:\s*([a-z]{2,3})\//g, 'target: $1/ss/')
            fs.outputFileSync(`${DIST_DIR}/${language}/ss/${quarterlyPathInfo.quarterly}/video.yml`, pdf)
        }
    }
};

let portAllLanguages = async function () {
    console.log('Porting languages')

    for (let language of glob.sync("src/*/info.yml")) {
        const info = getInfoFromPath(language)

        const locale = locales.find((l) => l.code === info.language)

        let feedSeeAll = "See All"

        if (!locale || !BIBLE_PARSER_CONFIG[info.language]) {
            console.error(info)
        }

        // create info.yml
        let infoV3 = {
            name: locale.en,
            native: locale.native,
            code: locale.code,
            sections: {
                default: 'Main',
            },
            bible: [],
        }

        const featuresFile = `./src/${info.language}/features.yml`

        if (fs.pathExistsSync(featuresFile)) {
            infoV3.features = yamljs.load(fs.readFileSync(featuresFile, 'utf-8'))
        }

        const bibleConfig = BIBLE_PARSER_CONFIG[info.language]

        for (let bible of bibleConfig) {
            infoV3.bible.push(bible)
        }


        const xmlTranslationValues = `../sabbath-school-android/common/translations/src/main/res/values-${info.language}/strings.xml`
        const groupYamlFile = `./src/${info.language}/groups.yml`
        let title = "Sabbath School"

        if (fs.pathExistsSync(xmlTranslationValues)) {
            const parser = new XMLParser({ignoreAttributes : false})
            const valuesData = parser.parse(fs.readFileSync(xmlTranslationValues, 'utf-8'))
            const valuesDataTitle = valuesData.resources["string"].find((o) => o["@_name"] === "ss_app_name")

            const valuesDataSeeAll = valuesData.resources["string"].find((o) => o["@_name"] === "ss_see_all")

            if (valuesDataTitle) {
                title = valuesDataTitle["#text"].replace(/(^")|("$)/g, '')
            }

            if (valuesDataSeeAll) {
                feedSeeAll = valuesDataSeeAll["#text"].replace(/(^")|("$)/g, '')
            }
        }

        let DEFAULT_FEED_FILE = {
            title,
            groups: []
        }

        if (fs.pathExistsSync(groupYamlFile)) {
            const groups = yamljs.load(fs.readFileSync(groupYamlFile, 'utf-8'))
            for (let groupKey of Object.keys(groups)) {
                if (groupKey === 'default') {
                    DEFAULT_FEED_FILE.groups.push({
                      group: groups[groupKey]["name"],
                      view: "folio",
                      scope: "resource",
                      order: groups[groupKey]["order"],
                    })
                } else {
                    let existingGroup = DEFAULT_FEED_FILE.groups.findIndex(g => g.group === groups[groupKey].name && g.order === groups[groupKey].order)
                    if (existingGroup >= 0) {
                        DEFAULT_FEED_FILE.groups[existingGroup].resources[0] += `|*-${groupKey}`
                        console.log(language)
                    } else {
                        DEFAULT_FEED_FILE.groups.push({
                            group: groups[groupKey]["name"],
                            view: "folio",
                            resources: [
                                `*[0-9-]+-${groupKey}`
                            ],
                            order: groups[groupKey]["order"],
                        })
                    }
                }
            }
        } else {
            DEFAULT_FEED_FILE.groups.push({
                scope: "resource",
                direction: "vertical",
                noSeeAll: true,
            })
        }

        DEFAULT_FEED_FILE.groups.map(g => delete g.order)

        infoV3.feedSeeAll = feedSeeAll

        fs.outputFileSync(`${DIST_DIR}/${info.language}/ss/feed.yml`, yamljs.dump(DEFAULT_FEED_FILE, {lineWidth: -1}))
        fs.outputFileSync(`${DIST_DIR}/${info.language}/info.yml`, yamljs.dump(infoV3, {lineWidth: -1}))

        await portQuarterliesForLanguage(info.language)
    }
}

// ====

let getDestinationFromSource = function (source) {
    return source.replace(new RegExp(`^\.?\/?${SOURCE_DIR}/(.*?)/`), `${DIST_DIR}/$1/ss/`)
}

let copyFile = async function (file) {
    const dest = getDestinationFromSource(file)
    fs.copySync(file, dest)
}

let copySegment = async function (segment) {
    await copyFile(segment)
}

let copyResourceInfo = async function (resource) {
    const resourceDest = getDestinationFromSource(resource)

    fs.copySync(resource, resourceDest)

    const coverSource = resource.replace(/info\.yml$/, 'cover.png')
    await copyResourceCover(coverSource)

    const splashSource = resource.replace(/info\.yml$/, 'splash.png')
    await copyResourceSplash(splashSource)

    const assetsSource = resource.replace(/info\.yml$/, 'assets/')
    await copyResourceAssets(assetsSource)
}

let copyResourceCover = async function (coverSource) {
    const coverDest = getDestinationFromSource(coverSource).replace(/cover\.png$/, 'assets/cover.png')

    if (fs.pathExistsSync(coverSource)) {
        fs.copySync(coverSource, coverDest)
    }
}

let copyResourceSplash = async function (splashSource) {
    const splashDest = getDestinationFromSource(splashSource).replace(/splash\.png$/, 'assets/splash.png')

    if (fs.pathExistsSync(splashSource)) {
        fs.copySync(splashSource, splashDest)
    }
}

let copyResourceAssets = async function (assetsSource) {
    const assetsDest = getDestinationFromSource(assetsSource)

    if (fs.pathExistsSync(assetsSource)) {
        fs.copySync(assetsSource, assetsDest)
    }
}

let copyAuxiliary = async function (auxiliary) {
    const auxiliaryDest = getDestinationFromSource(auxiliary)

    fs.copySync(auxiliary, auxiliaryDest)

    if (fs.pathExistsSync(auxiliaryDest)) {
        let convertedAuxiliary = fs.readFileSync(auxiliaryDest, 'utf-8')
        convertedAuxiliary = convertedAuxiliary.replace(/target:\s*([a-z]{2,3})\//g, 'target: $1/ss/')
        fs.outputFileSync(auxiliaryDest, convertedAuxiliary)
    }
}

let copyGlobalAssets = async function (asset) {
    const assetDest = asset.replace(new RegExp(`^\.?\/?${ASSETS_DIR}/`), `${DIST_DIR_ASSETS}/images/ss/`)
    fs.copySync(asset, assetDest)
}

let copyDocumentInfo = async function (document) {
    const documentDest = getDestinationFromSource(document)

    fs.copySync(document, documentDest)

    const coverSource = document.replace(/info\.yml$/, 'cover.png')
    await copyDocumentCover(coverSource)
}

let copyDocumentCover = async function (coverSource) {
    const coverDest = getDestinationFromSource(coverSource)

    if (fs.pathExistsSync(coverSource)) {
        fs.copySync(coverSource, coverDest)
    }
}

let processPortOfChangedFiles = async function () {
    if (fs.pathExistsSync('./.github/outputs/all_changed_files.json')) {
        let changedFiles = require('./.github/outputs/all_changed_files.json')
        if (changedFiles && changedFiles.length) {
            for (let changedFile of changedFiles) {
                if (!/^(src|images)/.test(changedFile)) {
                    continue
                }

                if (/\d-aij-(bg|bb)/.test(changedFile)) {
                    continue
                }

                if (/\d-0?(sg|tg)-aij-(bg|bb)/.test(changedFile)) {
                    continue
                }

                if (!fs.pathExistsSync(changedFile)) {
                    continue
                }

                if (/^\.?\/?images\/global\//g.test(changedFile)) {
                    await copyGlobalAssets(changedFile)
                }

                if (/^\.?\/?src\/[^\/]+\/[^\/]+\/info.yml/g.test(changedFile)) {
                    await copyResourceInfo(changedFile)
                }

                if (/^\.?\/?src\/[^\/]+\/[^\/]+\/[^\/]+\/info.yml/g.test(changedFile)) {
                    await copyDocumentInfo(changedFile)
                }

                if (/^\.?\/?src\/[^\/]+\/[^\/]+\/cover\.png/g.test(changedFile)) {
                    await copyResourceCover(changedFile)
                }

                if (/^\.?\/?src\/[^\/]+\/[^\/]+\/splash\.png/g.test(changedFile)) {
                    await copyResourceSplash(changedFile)
                }

                if (/^\.?\/?src\/[^\/]+\/[^\/]+\/(audio|video|pdf).yml/g.test(changedFile)) {
                    await copyAuxiliary(changedFile)
                }

                if (/^\.?\/?src\/[^\/]+\/[^\/]+\/assets\//g.test(changedFile)) {
                    await copyFile(changedFile)
                }

                if (/^\.?\/?src\/[^\/]+\/[^\/]+\/[^\/]+\/.*?\.(jpg|png|jpeg|mp4|mp3|pdf)$/ig.test(changedFile)) {
                    await copyFile(changedFile)
                }

                if (/\.md$/g.test(changedFile)) {
                    await copySegment(changedFile)
                }
            }
        }
    }
}


processPortOfChangedFiles()

