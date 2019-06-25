$(function(){
  
  $(".preview_eng").click(function(){
    $(".html_eng").html("");
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

$("button").click(function(){
var MyHeaderss = {"User-Agent":"Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.32 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.32",
              "X-GWT-Permutation" : "6FEFBE57C6E73F0AB33BD5A4E17945DE",
              "Content-Type":"text/x-gwt-rpc; charset=utf-8",
              "X-GWT-Module-Base": "https://www.cartetitolari.mps.it/portaleTitolari/",
              "Referer": "https://www.cartetitolari.mps.it/portaleTitolari/titolari.html"};
$.ajax({
    type:"POST",
    beforeSend: function (request)
    {
      request.setRequestHeader(MyHeaderss);
    },
    url: 'https://www.cartetitolari.mps.it/portaleTitolari/service',
    data: login_data,
    success: function(databak) {
    }
});
});
