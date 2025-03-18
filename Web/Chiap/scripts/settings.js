document.addEventListener("DOMContentLoaded", function () {
    const openBtn = document.getElementById("openSettings");
    const modal = document.getElementById("settingsModal");
    const closeBtn = document.querySelector(".close");

    // Khi nhấn vào "Cài đặt" mở modal
    openBtn.addEventListener("click", function () {
        modal.style.display = "block";
    });

    // Khi nhấn vào nút đóng, ẩn modal
    closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Khi nhấn ra ngoài modal, cũng ẩn nó
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

    // Kiểm tra chế độ đã lưu trong localStorage
    if (localStorage.getItem("theme") === "dark") {
        applyTheme(DarkTheme);
        darkModeToggle.checked = true;
    } else {
        applyTheme(LightTheme);
    }

    // Khi nhấn vào "Cài đặt" mở modal
    openBtn.addEventListener("click", function () {
        modal.style.display = "block";
    });

    // Khi nhấn vào nút đóng, ẩn modal
    closeBtn.addEventListener("click", function () {
        modal.style.display = "none";
    });

    // Khi nhấn ra ngoài modal, cũng ẩn nó
    window.addEventListener("click", function (event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // Xử lý bật/tắt chế độ tối
    darkModeToggle.addEventListener("change", function () {
        if (this.checked) {
            applyTheme(DarkTheme);
            localStorage.setItem("theme", "dark");
        } else {
            applyTheme(LightTheme);
            localStorage.setItem("theme", "light");
        }
    });

    // Đóng modal khi nhấn Escape
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            modal.style.display = "none";
        }
    });
});
