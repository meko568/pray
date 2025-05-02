let plus = document.querySelectorAll(".plus");
let minus = document.querySelectorAll(".minus");
let num = document.querySelectorAll(".num");
let circles = document.querySelectorAll(".circle");
let clear = document.querySelectorAll(".clear");


plus.forEach(function (e) {
    e.onclick = function () {
        e.parentElement.children[2].innerHTML = (+e.parentElement.children[2].innerHTML) + 1
        localStorage.setItem(`${e.parentElement.children[2].classList[0]}`, e.parentElement.children[2].innerHTML)
    }
})
minus.forEach(function (e) {
    e.onclick = function () {
        if (+e.parentElement.children[2].innerHTML > 0) {
            e.parentElement.children[2].innerHTML = (+e.parentElement.children[2].innerHTML) - 1
            localStorage.setItem(`${e.parentElement.children[2].classList[0]}`, e.parentElement.children[2].innerHTML)
        }
    }
})

circles.forEach(function (e) {
    e.onclick = function () {
        e.parentElement.children[1].children[0].innerHTML = +e.parentElement.children[1].children[0].innerHTML + 1;
        localStorage.setItem(`${e.classList[1]}`, `${e.parentElement.children[1].children[0].innerHTML}`)
    }
})
clear.forEach(function (e) {
    e.onclick = function () {
        document.querySelector(`.number.${e.classList[1]}`).innerHTML = 0;
        localStorage.setItem(e.classList[1], "0")
    }
})
window.onload = function () {
    num.forEach(function (e) {
        if (localStorage.getItem(e.classList[0])) {
            e.innerHTML = localStorage.getItem(e.classList[0])
        }
    })
    circles.forEach(function (e) {
        if (localStorage.getItem(e.classList[1])) {
            e.parentElement.children[1].children[0].innerHTML = localStorage.getItem(e.classList[1])
        }
    })
}
