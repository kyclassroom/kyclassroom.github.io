function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min
}

function hcf(a, b) {
    if (b) {
        return hcf(b, a % b)
    } else {
        return Math.abs(a)
    }
}

function randFrac() {
    denominator = randInt(2, 6);
    numerator = randInt(1, denominator - 1);
    return [numerator, denominator];
}

function simFrac(frac) {
    factor = hcf(frac[0], frac[1]);
    return [frac[0]/factor, frac[1]/factor]
}

function abs(frac) {
    return [Math.abs(frac[0]), frac[1]]
}

function fracMultiply(signA, A, signB, B) {
    return simFrac([signValue(signA) * A[0] * signValue(signB) * B[0], A[1] * B[1]])
}

function fracAdd(A, B, C=[0,1]) {
    return simFrac([A[0] * B[1] * C[1] + A[1] * B[0] * C[1] + A[1] * B[1] * C[0], A[1] * B[1] * C[1]])
}

function displayFrac(array) {
    return `
    <span class="d-inline-block align-middle text-center">
        <span class="d-block">` + array[0] + `</span><span class="border-top border-dark">`+ array[1] + `</span>
    </span>`
}

function randSign() {
    rand = randInt(0, 1);
    if (rand) {
        return "+"
    } else {
        return "-"
    }
}

function signValue(sign) {
    if (sign == "+") {
        return 1
    } else {
        return -1
    }
}

function sign(value) {
    if (value < 0) {
        return "-"
    } else {
        return "+"
    }
}

function quadratic(A, signB, B, signC, C) {
    return `
    <span class="d-inline-block align-middle text-center border border-dark border-right-0">
        <span class="d-block">&nbsp;</span><span>&nbsp;</span>
    </span>` + displayFrac(A) + `x<sup>2</sup> ` + signB + ` ` + displayFrac(B) + `x ` + signC + ` ` + displayFrac(C) + `
    <span class="d-inline-block align-middle text-center border border-dark border-left-0">
        <span class="d-block">&nbsp;</span><span>&nbsp;</span>
    </span>`
}

$(function(){

    $(".example").html(quadratic([1,2], "-", [3,4], "+", [5,6]) + " " + quadratic([7,8], "-", [9,10], "+", [11,12]));

    A = simFrac(randFrac());
    signB = randSign();
    B = simFrac(randFrac());
    signC = randSign();
    C = simFrac(randFrac());
    D = simFrac(randFrac());
    signE = randSign();
    E = simFrac(randFrac());
    signF = randSign();
    F = simFrac(randFrac());
    $(".exercise").html("Expand " + quadratic(A, signB, B, signC, C) + " " + quadratic(D, signE, E, signF, F) + " . Write down the answer directly without steps or draft. You may use a calculator.");

    $(".displayAns").click(function(){

        P = fracMultiply("+", A, "+", D);
        Q = fracAdd(fracMultiply("+", A, signE, E), fracMultiply(signB, B, "+", D));
        R = fracAdd(fracMultiply("+", A, signF, F), fracMultiply(signB, B, signE, E), fracMultiply(signC, C, "+", D));
        S = fracAdd(fracMultiply(signB, B, signF, F), fracMultiply(signC, C, signE, E));
        T = fracMultiply(signC, C, signF, F);

        $(".ans").append(displayFrac(P) + "x<sup>4</sup>");

        numeratorQ = Q[0];
        if (numeratorQ != 0) {
            $(".ans").append(" " + sign(numeratorQ) + " " + displayFrac(abs(Q)) + "x<sup>3</sup>");
        }

        numeratorR = R[0];
        if (numeratorR != 0) {
            $(".ans").append(" " + sign(numeratorR) + " " + displayFrac(abs(R)) + "x<sup>2</sup>");
        }

        numeratorS = S[0];
        if (numeratorS != 0) {
            $(".ans").append(" " + sign(numeratorS) + " " + displayFrac(abs(S)) + "x");
        }

        $(".ans").append(" " + sign(T[0]) + " " + displayFrac(abs(T)));

    })

})
