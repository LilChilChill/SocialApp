const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap";

document.getElementById('resetPasswordForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // Kiểm tra nếu có token trong localStorage
    const userToken = localStorage.getItem("token");
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });

        const data = await response.json();
        alert(data.message);
        if (response.ok) 
        {
            if (userToken) {
                // window.location.href =  window.location.origin + "/components/home";
                window.location.href = import.meta.env.DEV
                    ? '/components/home.html'
                    : '/home';
            } else {
                window.location.href = window.location.origin; 
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
