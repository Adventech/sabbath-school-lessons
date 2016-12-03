[![Build Status](https://travis-ci.org/Adventech/sabbath-school-lessons.svg?branch=master)](https://travis-ci.org/Adventech/sabbath-school-lessons)

# Sabbath School Lessons

This repository contains all lessons for the Sabbath School app (for all platforms).
 
## Contributing



## Getting Started

### create.js

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

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
