function rand(min, max){
  return Math.floor((Math.random() * (max - min + 1)) + min)
}

$(function(){
  $(".header").html(`
    <div class="py-4 bg-success">
      <h1 class="text-white text-center">KY教室</h1>
      <p class="text-white text-center small">kyclassroom@gmail.com</p>
    </div>
  `);
})