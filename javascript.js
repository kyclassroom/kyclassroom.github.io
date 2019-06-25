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
      url: "https://docs.google.com/spreadsheets/d/1Gy1Qt1ko1OcESFmvS2EgUSKXQZKj9hQCFVssWVdi7dA", 
      success: function(result){
        console.log(result);
      }
    });
  });
  
});


