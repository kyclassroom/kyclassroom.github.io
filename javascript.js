$(function(){
  
  setInterval(function() {
    eval($("#eng").val())
  }, 3000);
  
  setInterval(function() {
    eval($("#chi").val())
  }, 3000);
  
});

$(".submit").click(function(){
  $(".html_eng").children().each(function(){
    submit_eng($(this).html());
  });
  $(".html_chi").children().each(function(){
    submit_chi($(this).html());
  });
});

function preview_eng(html){
  $(".html_eng").append("<div>" + html + "</div>");
}
