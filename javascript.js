function general_click(str1, str2, str3) {
  $("." + str1 + str2).click(function(){
    $("." + str1 + str3).toggleClass("d-none");
  });
}

function btn_click(str) {
  general_click(str, "_btn", "_text");
}

function hint_click(str) {
  general_click(str, "_hint", "_content");
}

$(function(){
  btn_click("angle_between_two_planes");
  hint_click("angle_between_two_planes");
  btn_click("distance_formula");
  hint_click("distance_formula");
  btn_click("in-centre_formula");
  btn_click("recurrence");
});
