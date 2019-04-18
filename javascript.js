$(function(){
  
  $(".chi").click(function(){
    $(".wrapper").html(`

      <div class="py-5 bg-primary text-white">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-9">
              <h1>KY教室</h1>
            </div>
            <div class="col-3 text-right">
              <button type="button" class="btn btn-success" onclick="location.reload()">Eng</button>
            </div>
          </div>
        </div>
      </div>

      <div class="py-5">
        <div class="container">
          <div class="py-3">
            <span>使用者名稱：</span>
            <input type="text" class="form-control username">
          </div>
          <div class="py-3">
            <span>密碼：</span>
            <input type="password" class="form-control password">
          </div>
          <div class="py-3 text-center">
            <button type="button" class="btn btn-success btn-lg login-btn">登入</button>
          </div>
        </div>
      </div>

      <div class="py-5">
        <div class="container">
          <p class="text-justify">
            歡迎來到KY教室！
            <br><br>
            這是一個免費的線上學習平台。為了增加內在的學習動機，我們會利用AI科技來提供個人化的學習材料。
            <br><br>
            試用方法非常簡單，按下面的「試用」鍵就可以了。我們會自動提供使用者名稱和密碼，然後就可以開始了。您稍後可以修改使用者名稱和密碼。
          </p>
          <div class="text-center">
            <button type="button" class="btn btn-success btn-lg">試用</button>
          </div>
        </div>
      </div>

    `);
  });
  
  $(".login").click(function(){
    $.ajax({url: "https://kyclassroom.github.io/test.py", success: function(result){
      $(".wrapper").val(result);
    }});
  });
  
});
