import { LightTheme, DarkTheme, applyTheme } from './theme.js';

document.addEventListener("DOMContentLoaded", function () {
    try {
        const openBtn = document.getElementById("openSettings");
        const openBtnSide = document.getElementById("openSettingsSide");
        const modal = document.getElementById("settingsModal");
        const closeBtn = document.querySelector(".close");
        const darkModeToggle = document.getElementById("darkModeToggle");

        // Kiểm tra null trước khi sử dụng
        if (openBtn) {
            openBtn.addEventListener("click", function () {
                if (modal) modal.style.display = "block";
            });
        }

        if (openBtnSide) {
            openBtnSide.addEventListener("click", function () {
                if (modal) modal.style.display = "block";
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener("click", function () {
                if (modal) modal.style.display = "none";
            });
        }

        if (darkModeToggle) {
            // Apply theme
            if (localStorage.getItem("theme") === "dark") {
                applyTheme(DarkTheme);
                darkModeToggle.checked = true;
            } else {
                applyTheme(LightTheme);
            }

            darkModeToggle.addEventListener("change", function () {
                if (this.checked) {
                    applyTheme(DarkTheme);
                    localStorage.setItem("theme", "dark");
                } else {
                    applyTheme(LightTheme);
                    localStorage.setItem("theme", "light");
                }
            });
        }

        // Window click handler
        window.addEventListener("click", function (event) {
            if (modal && event.target === modal) {
                modal.style.display = "none";
            }
        });

        // Escape key handler
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && modal) {
                modal.style.display = "none";
            }
        });
    } catch (error) {
        console.error('Error in settings.js:', error);
    }
});
