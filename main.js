$(function(){
    $(".header").html(`
        <div class="py-4 bg-success">
            <a href="./index.html"><h1 class="text-white text-center">KY教室</h1></a>
            <p class="text-white text-center small">kyclassroom@gmail.com</p>        
            <nav class="navbar navbar-expand-sm navbar-dark justify-content-center">
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link active dropdown-toggle" data-toggle="dropdown">
                            觀點
                        </a>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="./banding.html">論「第一組別(Band 1)中學」</a>
                            <a class="dropdown-item" href="./moi.html">中文小學 vs 英文小學</a>
                        </div>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link active dropdown-toggle" data-toggle="dropdown">
                            語文
                        </a>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="#">簡介</a>
                        </div>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link active dropdown-toggle" data-toggle="dropdown">
                            數學
                        </a>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="#">簡介</a>
                        </div>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link active dropdown-toggle" data-toggle="dropdown">
                            科學
                        </a>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="#">簡介</a>
                        </div>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link active dropdown-toggle" data-toggle="dropdown">
                            人文
                        </a>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="#">簡介</a>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    `);
})
