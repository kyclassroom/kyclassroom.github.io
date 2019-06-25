$(function(){
  
  $(".preview_eng").click(function(){
    $(".html_eng").html("");
    eval($("#eng").val());
  });
  
  $(".submit").click(function(){
  $(".html_eng").children().each(function(){
    submit_eng($(this).html());
  });
  $(".html_chi").children().each(function(){
    submit_chi($(this).html());
  });
});

  $("button").click(function(){
    console.log("start");
    $.ajax({
      url: "https://kyclassroom.github.io/test.txt", 
      success: function(result){
        console.log(result);
      }
    });
  });
  
});


