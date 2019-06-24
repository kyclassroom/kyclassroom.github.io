$(function(){
  
  var previous_eng = '';
  setInterval(function() {
    eng = $("#eng").val()
    if (eng != previous_eng) {
      previous_eng = eng;
      $(".latex_eng").html(eng);
    }
  }, 10);
  
});
