$(function(){  
  
  $(".chi").click(function(){
    $(".kyclassroom").html("KY教室");
    $(".chi").html("Eng");
    $(".chi").attr("onclick", "location.reload()");
    $(".chi").removeClass("chi");
    $(".username-txt").html("使用者名稱：");
    $(".password-txt").html("密碼：");
    $(".login-btn-eng").html("登入");
    $(".login-btn-eng").addClass("login-btn-chi");
    $(".login-btn-eng").removeClass("login-btn-eng");
    $(".txt").html(`
      歡迎來到KY教室！
      <br><br>
      這是一個免費的線上學習平台。為了增加內在的學習動機，我們會利用AI科技來提供個人化的學習材料。
      <br><br>
      試用方法非常簡單，按下面的「試用」鍵就可以了。我們會自動提供使用者名稱和密碼，然後就可以開始了。您稍後可以修改使用者名稱和密碼。
    `);
    $(".try-btn").html("試用");
  });
  
});
