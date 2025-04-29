let plus = document.querySelectorAll(".plus");
let minus = document.querySelectorAll(".minus");
let num = document.querySelectorAll(".num")
plus.forEach(function (e) {
    e.onclick = function () {
        e.parentElement.children[3].innerHTML = (+e.parentElement.children[3].innerHTML) + 1
        localStorage.setItem(`${e.parentElement.children[3].classList[0]}`, e.parentElement.children[3].innerHTML)
    }
})
minus.forEach(function (e) {
    e.onclick = function () {
        if (+e.parentElement.children[3].innerHTML > 0) {
            e.parentElement.children[3].innerHTML = (+e.parentElement.children[3].innerHTML) - 1
            localStorage.setItem(`${e.parentElement.children[3].classList[0]}`, e.parentElement.children[3].innerHTML)
        }
    }
})
window.onload = function () {
    num.forEach(function (e) {
        if (localStorage.getItem(e.classList[0])) {
            e.innerHTML = localStorage.getItem(e.classList[0])
        }
    })
}