[![Build Status](https://travis-ci.org/Adventech/sabbath-school-lessons.svg?branch=master)](https://travis-ci.org/Adventech/sabbath-school-lessons)

# Sabbath School Lessons

This repository contains all lessons for the Sabbath School app (for all platforms).

## Languages matrix

Below is current list of languages and capabilities implemented

| Language  | Adult Lesson | Bible verses | Inside Story | Teacher Edition |
|:--|:-:|:-:|:-:|:-:|
|🇫🇷 French |✅ Yes|✅ Yes|✅ Yes|✅ Yes|
|🇺🇸 English|✅ Yes|✅ Yes|✅ Yes|✅ Yes|
|🇩🇪 German|✅ Yes|✅ Yes|✅ Yes|✅ Yes|✅ Yes|
|🇵🇹 🇧🇷 Portuguese|✅ Yes|✅ Yes|❌ No|✅ Yes|
|🇷🇺 Russian|✅ Yes|✅ Yes|✅ Yes|✅ Yes|
|🇪🇸 🇲🇽 Spanish|✅ Yes|✅ Yes|❌ No|❌ No|
|🇹🇷 Turkish|✅ Yes|❌ No|❌ No|❌ No|
|🇺🇦 Ukrainian|✅ Yes|✅ Yes|✅ Yes|❌ No|
|🇯🇵 Japanese|✅ Yes|❌ No|❌ No|❌ No|
 
_* ER - Easy Reading_

### Language Roadmap

- [ ] Add Arabic Language
- [ ] Add Farsi Language
- [ ] Add Hebrew Language
- [ ] Add Estonian Language
- [ ] Add Danish Language
- [ ] Add Romanian Language
- [ ] Add Bulgarian Language
- [ ] Add Norwegian Language
- [ ] Add Korean Language
- [ ] Add Chinese Simplified Language
- [ ] Add Afrikaans Language
- [ ] Add Malayalam Language
- [ ] Add Nepali Language
- [ ] Add SiSwati Language
- [ ] Add Sesotho Language
- [ ] Add Tamil Language
- [ ] Add Xhosa Language
- [ ] Add Zulu Language
 
## Contributing

There are many ways you can contribute to this project:

- Regularly add Sabbath School lesson content
- Provide source (PDF, HTML or any other) of the Sabbath School content
- Create Bible verse parsers for languages that do not have
- Find and correct mistakes in existing lessons

### Folder structure and formats

Please note that best way to create folder structure is to use `create.js` script approach. Below is the
explanation of existing folders & files.

Each quarterly has few parameters that are reflected in the way files and folders are organizes:

- Language
- Quarter
- Type (Could be Adult, Easy Reading, Youth & etc)
- Quarterly Info file
- Quarterly cover image

Folder structure for quarterly looks like that

`src/[language code in ISO 639-1]/[quarter_number]` - which will point to the root folder of the quarterly

`quarter_number` - has following format `YYYY-QQ` or `YYYY-QQ-TYPE`, where

- `YYYY` is four digit number of year
- `QQ` is the numerical value of quarter must be one of [01, 02, 03, 04]
- `TYPE` is the short representation of quarterly type. Omitted if adult version of the lesson

Quarterly info file must be named `info.yml` and placed in the root folder of the quarterly. As you may understand it
is written in YAML format. See for example `src/en/2016-04/info.yml` for more.

Quarterly cover file must be named `cover.png` and placed in the root folder of the quarterly. It's a PNG image that represents
the cover of the quarterly.

Quarterly content (weekly and daily lessons) have it's own specific format and structure based on the following parameters:

- Week number
- Day of week file
- Type of reading
- Week info file
- Week cover image

So quarterly structure looks like that:

`[quarterly_root_folder]/[week_number]/[read_file]`

So main content of Sabbath School lesson is the `read_file`. This is the markdown type file with the annotation (comment)
section on top. For simplicity follow the numerical approach for days of the week readings (Sun through Sat) naming according
to the numerical sequential value of the day of week. Additional readings like inside stories, teacher comments & etc can be named
according to the type. For example `create.js` will name them `inside-story.md` and `teacher-comments.md`.

### Adding / Editing weekly lesson

### Deployment

### Adding new quarterly using create.js

This little script will help you to create structure for the quarterly. See below info for the usage

<pre>
Create the file structure for a quarter in given language.
Usage: /usr/local/bin/node ./create.js -s [string] -l [string] -q [string] -c [num] -t [string] -d [string] -h [string] -u [bool] -i [bool]

Options:
  -s, --start-date        Start date in DD/MM/YYYY format. Ex: 25/01/2016                [required]
  -l, --language          Target language. For ex. 'en' or 'ru'                          [required]  [default: "en"]
  -q, --quarter           Quarter id. For example: 2016-04 or 2016-04-er (easy reading)  [required]
  -c, --count             Amount of lessons in quarter. Typically 13 but can be more     [required]  [default: 13]
  -t, --title             Title of the quarterly in target language                      [required]
  -d, --description       Description of the quarterly in target language                [required]
  -h, --human-date        Human readable date of quarterly. Ex. Fourth quarter of 2016   [required]
  -u, --teacher-comments  Include teacher comments                                       [default: false]
  -i, --inside-story      Inside story                                                   [default: true]
  -k, --lesson-cover      Create lesson cover placeholder images                         [default: false]

Missing required arguments: s, q, t, d, h
</pre>

When ran properly it will create the structure under `src` folder. For an example please see `src` folder that contains 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
