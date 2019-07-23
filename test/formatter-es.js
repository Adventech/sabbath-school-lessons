#!/usr/bin/env node

var fs                  = require("fs-extra"),
  cheerio             = require("cheerio"),
  moment              = require("moment"),
  changeCase          = require('change-case');

function parseEGWEs(path, originalDestination, destination){
  var DATE_FORMAT = "DD/MM/YYYY";
  var start = moment("30/03/2019", DATE_FORMAT);

  var week = 1;
  for (var i = 0; i < 13; i++){
    var day = 0;
    var file = fs.readFileSync(path +"GEB_2T_2019_Leccion_"+(i+1)+"/GEB_2T_2019_Leccion_"+(i+1)+".html", "utf-8");
    var $ = cheerio.load(file, {decodeEntities: false});

    $(".italica").each(function(j, e){
      $(e).html("_" + $(e).html() + "_");
    });

    $("section .bold").each(function(j, e){
      if ($(e).text().trim().indexOf("Resumen") === 0) {
        $(e).html("**Resumen**: ");
      }
    });



    for (var j = 0; j < 7; j++){
      day++;
      var title = changeCase.title($("section").eq(j).find("[class^=titulo]").eq(0).text().trim());

      if (day === 1){
        fs.outputFileSync(destination + "/" + pad(week , 2)+ "/info.yml", "---\ntitle: \""+title+"\"\nstart_date: \""+moment(start).format(DATE_FORMAT)+"\"\nend_date: \""+moment(start).add(6,'d').format(DATE_FORMAT)+"\"");
      }

      var output = "---\ntitle:  " + title + "\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
      var isDiscussion = false;

      $("section").eq(j).find(".container > p, h2").each(function(k,e){
        if (($(e).prop("tagName") === "H2") && $(e).text().indexOf("PREGUNTAS PARA DIALOGAR:") === 0){
          output += "\n\n**Preguntas para dialogar**";
          isDiscussion = true;
        }

        if ($(e).prop("tagName") === "P"){
          if (
            (day === 1 && $(e).text().trim().indexOf("Sábado") === 0) ||
            (day === 2 && $(e).text().trim().indexOf("Domingo") === 0) ||
            (day === 3 && $(e).text().trim().indexOf("Lunes") === 0) ||
            (day === 4 && $(e).text().trim().indexOf("Martes") === 0) ||
            (day === 5 && $(e).text().trim().indexOf("Miércoles") === 0) ||
            (day === 6 && $(e).text().trim().indexOf("Jueves") === 0) ||
            (day === 7 && $(e).text().trim().indexOf("Viernes") === 0)
          ) {

          } else {
            if (($(e).hasClass("pregunta") || ($(e).hasClass('body_pgta')) ) || (day === 7 && isDiscussion === true && $(e).text().trim().indexOf("**Resumen") < 0) || $(e).hasClass("reflexion")){
              if ($(e).find('.editorComment').length || $(e).hasClass("reflexion") || day === 7) {
                output += "\n\n`" + $(e).text().trim() + "`";
              } else {
                output += "\n\n**" + $(e).text().trim() + "**";
              }
            } else if ($(e).hasClass("body") || $(e).hasClass('body_intro')) {
              var body = $(e).text().trim();
              var readWeek = "LEE PARA EL ESTUDIO DE ESTA SEMANA:";
              var memoryText = "PARA MEMORIZAR: ";
              if (body.length) {
                if (body.indexOf(readWeek) === 0){
                  output += "\n\n### Lee para el estudio de esta semana\n" + body.replace(readWeek, "").trim();
                } else if (body.indexOf(memoryText) === 0){
                  output += "\n\n> <p>Para memorizar</p>\n> " + body.replace(memoryText, "");
                } else {
                  output += "\n\n" + body;
                }
              }
            }
          }
        }
      });

      //output += "\n\n---\n\n#### Comentarios Elena G.W";
      //$(".EGWComment").eq(j).find("p").each(function(k, e){
      //   output += "\n\n"+$(e).text().trim();
      //});

      fs.outputFileSync(destination + "/" + pad(week, 2) + "/0" + day + ".md", output);

      //if (day === 7){
      //  $("section").remove();
      //  $(".publication p .bold").each(function(j, e) {
      //    $(e).html("**" + $(e).html().trim() + "** ");
      //  });
      //  output = "---\ntitle:  El Sábado enseñaré\ndate:  "+moment(start).format(DATE_FORMAT)+"\n---";
      //  $(".publication > p, h1, h2, h3").each(function(k,e){
      //    if ($(e).prop("tagName") === "H1") {
      //      output += "\n\n### " + $(e).text().trim();
      //    }
      //
      //    if ($(e).prop("tagName") === "H2") {
      //      output += "\n\n#### " + $(e).text().trim();
      //    }
      //
      //    if ($(e).prop("tagName") === "H3") {
      //      output += "\n\n##### " + $(e).text().trim();
      //    }
      //
      //    if ($(e).prop("tagName") === "P") {
      //      output += "\n\n" + $(e).text().trim();
      //    }
      //  })
      //  fs.outputFileSync(destination + "/" + pad(week, 2) + "/teacher-comments.md", output);
      //}

      start = moment(start).add(1, 'd');

    }

    week++;
  }
}

parseEGWEs("/Users/vitaliy/Sites/Adventech/sabbath-school-compilation-2/2019-02/es/", "", "test/z");