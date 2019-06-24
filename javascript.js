$(function(){
  
  var previous_eng = "";
  setInterval(function() {
    eng = $("#eng").val()
    if (eng != previous_eng) {
      previous_eng = eng;
      $(".latex_eng").html(eng);
    }
  }, 10);
  
  var previous_chi = "";
  setInterval(function() {
    chi = $("#chi").val()
    if (chi != previous_chi) {
      previous_chi = chi;
      $(".latex_chi").html(chi);
    }
  }, 10);
  
});
