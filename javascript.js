$(function(){
  
  setInterval(function() {
    $(".html_eng").html(eval($("#eng").val()));
  }, 10);
  
  setInterval(function() {
    $(".html_chi").html(eval($("#chi").val()));
  }, 10);
  
});
