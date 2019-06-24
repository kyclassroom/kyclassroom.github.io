$(function(){
  
  var previous_eng = '';
  setInterval(function() {
    console.log("test")
    eng = $("#eng").val()
    if (eng != previous_eng) {
      console.log("test_alt")
      previous_eng = eng;
      $(".latex_eng").html(eng);
    }
  }, 10);
  
});
