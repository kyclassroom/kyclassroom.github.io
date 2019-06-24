$(function(){
  
  var previous_eng = "";
  setInterval(function() {
    eng = $("#eng").val()
    if (eng != previous_eng) {
      previous_eng = eng;
      $(".html_eng").html(eng);
    }
  }, 10);
  
  var previous_chi = "";
  setInterval(function() {
    chi = $("#chi").val()
    if (chi != previous_chi) {
      previous_chi = chi;
      $(".html_chi").html(chi);
    }
  }, 10);
  
});
