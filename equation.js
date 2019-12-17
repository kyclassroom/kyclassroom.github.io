function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min
}

function coeff(value) {
    absolute = Math.abs(value)
    if (absolute == 1) {
        return ""
    } else {
        return absolute
    }
}

$(function(){
    
    x = randInt(1, 9);
    e = randInt(1, 9);
    c = randInt(1, 9);
    a = e + c;
    b = randInt(1, 9);
    d = x * e + b;

    $(".exercise").html("Solve " + coeff(a) + "x + " + Math.abs(b) + " = " + coeff(c) + "x + " + Math.abs(d) + ". Write down the answer directly without any steps or draft. Do not use a calculator.");

    $(".displayAns").click(function(){
        $(".ans").html(x);
    })

})