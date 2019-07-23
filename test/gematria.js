
var gematriya = require("./gematriya");

var regex = "(";
var array = "{";

for (var i = 1; i < 200; i++){
  regex += gematriya(i).replace("\"", "") + "|";
  
  array += "\""+gematriya(i).replace("\"", "") +"\":\""+i+"\",";
}

regex += ") \\\d";
array += "};";


console.log(array);
console.log(regex);