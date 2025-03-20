async function loadNotificationComponent() {
    const response = await fetch("../components/notification.html"); // Tải file notification.html
    const html = await response.text();
    const placeholder = document.createElement("div"); // Tạo một thẻ div chứa thông báo
    placeholder.innerHTML = html;
    document.body.appendChild(placeholder); // Gắn vào cuối <body>
}

loadNotificationComponent().then(() => {
    console.log("Thông báo đã được tải!");
});

// Hàm hiển thị thông báo
function showToast(message, type = "success") {
    const container = document.getElementById("notification-container");
    if (!container) {
        console.error("Thông báo chưa được tải!");
        return;
    }
    container.textContent = message;
    container.style.background = type === "success" ? "green" : "red";
    container.style.display = "block";

    setTimeout(() => {
        container.style.display = "none";
    }, 3000);
}
