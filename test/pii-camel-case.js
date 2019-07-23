var changeCase = require('change-case');
var fs                  = require("fs-extra");

var lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('./test/pii-list.txt')
});

lineReader.on('line', function (line) {
  console.log(changeCase.camel(line));
});