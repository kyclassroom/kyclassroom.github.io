<html lang="en">
<head>
  <title>KYClassroom Index</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"></script>
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>  
  <script src="https://peterolson.github.io/BigInteger.js/BigInteger.min.js"></script>
  <script src="https://www.gstatic.com/firebasejs/5.10.0/firebase.js"></script>
  <script>
    var config = {
      apiKey: "AIzaSyBYbOBvjVnfvWMoMK8DUY1BUaaNo603CaE",
      authDomain: "kyclassroom-3f768.firebaseapp.com",
      databaseURL: "https://kyclassroom-3f768.firebaseio.com",
      projectId: "kyclassroom-3f768",
      storageBucket: "kyclassroom-3f768.appspot.com",
      messagingSenderId: "32602951040"
    };
    firebase.initializeApp(config);
  </script>
  <script src="https://kyclassroom.github.io/bignumber.js"></script>
  <script src="https://kyclassroom.github.io/javascript.js"></script>
</head>
<body>
<div class="wrapper">

<div class="py-5 bg-primary text-white">
  <div class="container">
    <div class="row align-items-center">
      <div class="col-9">
        <h2 class="kyclassroom">KYClassroom</h2>
      </div>
      <div class="col-3 text-right">
        <button type="button" class="btn btn-success chi">中文</button>
      </div>
    </div>
  </div>
</div>

<div class="py-5">
  <div class="container">
    <form action="https://kyclassroom.github.io/action.php" method="post">
      <div class="form-group">
        <label class="username-txt" name="username">Username:</label>
        <input type="text" class="form-control username">
      </div>
      <div class="form-group">
        <label class="password-txt" name="password">Password:</label>
        <input type="password" class="form-control password">
      </div>
      <div class="text-center">
        <button type="submit" class="btn btn-success btn-lg login-btn">LOGIN</button>
    </form>
  </div>
</div>
  
<div class="py-5">
  <div class="container">
    <div class="py-3">
      <span class="username-txt">Username:</span>
      <input type="text" class="form-control username">
    </div>
    <div class="py-3">
      <span class="password-txt">Password:</span>
      <input type="password" class="form-control password">
    </div>
    <div class="py-3 text-center">
      <button type="button" class="btn btn-success btn-lg login-btn">LOGIN</button>
    </div>
  </div>
</div>

<div class="py-5">
  <div class="container">
    <p class="text-justify txt">
      Welcome to KYClassroom!
      <br><br>
      This is a free online learning platform. To increase the intrinsic motivation to learn, we use AI technogies to provide personalized learning materials.
      <br><br>
      To have a try is very easy. Just click on the "TRY" button below. You will then be provided a username and a password so that you can start. You can change both the username and the password later.
    </p>
    <div class="text-center">
      <button type="button" class="btn btn-success btn-lg try-btn">TRY</button>
    </div>
  </div>
</div>

</div>
</body>
</html>

