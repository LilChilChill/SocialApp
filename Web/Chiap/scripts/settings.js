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