$(function(){
  
  $(".chi").click(function(){
    $(".wrapper").html(`

      <div class="py-5 bg-primary text-white">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-10">
              <h1>KY教室</h1>
            </div>
            <div class="col-2 text-right">
              <a href="https://kyclassroom.github.io" class="text-white">Eng</a>
            </div>
          </div>
        </div>
      </div>

      <div class="py-5">
        <div class="container">
          <form action="#">
            <div class="form-group">
              使用者名稱：
              <input type="text" class="form-control username">
            </div>
            <div class="form-group">
              密碼：
              <input type="password" class="form-control password">
            </div>
            <div class="text-center">
              <button type="submit" class="btn btn-success btn-lg">登入</button>
            </div>
          </form>
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
  
  $(".login-btn").click(function(){
    $(".wrapper").html("<p>Trial</p>");
  });
  
});
