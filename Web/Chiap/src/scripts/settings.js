import { LightTheme, DarkTheme, applyTheme } from './theme.js';

// Apply theme ngay khi script load - không cần đợi DOMContentLoaded
(function initTheme() {
    try {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            applyTheme(DarkTheme);
        } else {
            applyTheme(LightTheme);
        }
        console.log('Theme applied:', savedTheme || 'light (default)');
    } catch (error) {
        console.error('Error applying initial theme:', error);
        // Fallback to light theme
        applyTheme(LightTheme);
    }
})();

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
            // Set initial state based on current theme
            const savedTheme = localStorage.getItem("theme");
            darkModeToggle.checked = savedTheme === "dark";

            darkModeToggle.addEventListener("change", function () {
                if (this.checked) {
                    applyTheme(DarkTheme);
                    localStorage.setItem("theme", "dark");
                    console.log('Theme changed to: dark');
                } else {
                    applyTheme(LightTheme);
                    localStorage.setItem("theme", "light");
                    console.log('Theme changed to: light');
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
