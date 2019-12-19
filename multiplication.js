$(function(){
    
    for (i = 12; i < 50; i++) {
        for (j = 2; i * j < 100; j++) {
            $(".results").append(i + " x " + j + "<span class='result'> = " + i * j + "</span><br>");
        }
    }

    $(".toggle").click(function(){

        if($(this).text() == "Hide Results") {

            $(this).text("Show Results");
            $(".result").addClass("d-none");

        } else {

            $(this).text("Hide Results");
            $(".result").removeClass("d-none");

        }

    })

})