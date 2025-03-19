const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap";

document.getElementById('forgotPasswordForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('forgotEmail').value;

    try {
        const response = await fetch(`${API_URL}/api/users/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        alert(data.message);
        setTimeout(() => {
            window.location.href = window.location.origin;
        }, 3000);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});
