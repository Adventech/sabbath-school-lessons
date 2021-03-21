$(function(){
  $("div.ss-donation-appeal-title").click(function (){
    if ($(".ss-donation-appeal-text").is(":visible")) {
      $(".ss-donation-appeal-title").removeClass("ss-donation-appeal-title-expanded");
      $(".ss-donation-appeal-text").hide();
    } else {
      $(".ss-donation-appeal-title").addClass("ss-donation-appeal-title-expanded");
      $(".ss-donation-appeal-text").show();
    }
  });
});