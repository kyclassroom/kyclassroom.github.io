$(function(){  
  
  $(".chi").click(function(){
    $(".kyclassroom").html("KY教室");
    $(".chi").html("Eng");
    $(".chi").attr("onclick", "location.reload()");
    $(".chi").removeClass("chi");
    $(".username-txt").html("使用者名稱：");
    $(".password-txt").html("密碼：");
    $(".login-btn").html("登入");
    $(".txt").html(`
      歡迎來到KY教室！
      <br><br>
      這是一個免費的線上學習平台。為了增加內在的學習動機，我們會利用AI科技來提供個人化的學習材料。
      <br><br>
      試用方法非常簡單。填寫以下表格，然後按「註冊」就可以了。請注意，您日後不能更改使用者名稱或語言。
    `);
    $(".try-btn").html("試用");
  });
  
});
