$(function(){
  
  $(".preview_eng").click(function(){
    console.log($("#eng").val());
    eval($("#eng").val());
  });
  
});

$(".submit").click(function(){
  $(".html_eng").children().each(function(){
    submit_eng($(this).html());
  });
  $(".html_chi").children().each(function(){
    submit_chi($(this).html());
  });
});
