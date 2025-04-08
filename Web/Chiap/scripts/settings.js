document.addEventListener("DOMContentLoaded", function () {
    const openBtn = document.getElementById("openSettings");
    const modal = document.getElementById("settingsModal");
    const closeBtn = document.querySelector(".close");

    
    openBtn.addEventListener("click", function () {
        modal.style.display = "block";
    });

    
    closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
    });

    
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        const modal = document.getElementById("settingsModal");
        modal.style.display = "none";
    }
})

import { LightTheme, DarkTheme, applyTheme } from './theme.js';

document.addEventListener("DOMContentLoaded", function () {
    const openBtn = document.getElementById("openSettings");
    const modal = document.getElementById("settingsModal");
    const closeBtn = document.querySelector(".close");
    const darkModeToggle = document.getElementById("darkModeToggle");

    
    if (localStorage.getItem("theme") === "dark") {
        applyTheme(DarkTheme);
        darkModeToggle.checked = true;
    } else {
        applyTheme(LightTheme);
    }

    
    openBtn.addEventListener("click", function () {
        modal.style.display = "block";
    });

    
    closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
    });

    
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    
    darkModeToggle.addEventListener("change", function () {
        if (this.checked) {
            applyTheme(DarkTheme);
            localStorage.setItem("theme", "dark");
        } else {
            applyTheme(LightTheme);
            localStorage.setItem("theme", "light");
        }
    });

    
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            modal.style.display = "none";
        }
    });
});
