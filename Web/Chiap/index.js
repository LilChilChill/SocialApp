const API_URL = import.meta.env.VITE_API_URL;

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const container = document.getElementById('container');

    signUpButton.addEventListener('click', () => {
      container.classList.add("right-panel-active");
    });

    signInButton.addEventListener('click', () => {
      container.classList.remove("right-panel-active");
    });

    const signUpForm = document.getElementById('signUpForm');
    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch(`${API_URL}/api/users/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (res.ok) {
          showToast("Đăng ký thành công. Vui lòng đăng nhập.");
          // window.location.href = window.location.origin; 
          setTimeout(() => {
            window.location.href = window.location.origin;
          }, 2000);
        } else {
          showToast(data.message);
        }
      } catch (error) {
        showToast("Đã xảy ra lỗi trong quá trình đăng ký. Vui lòng thử lại.");
        console.error(data.message);
      }
    });

    const signInForm = document.getElementById('signInForm');
    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signInEmail').value;
      const password = document.getElementById('signInPassword').value;

      try {
        const res = await fetch(`${API_URL}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.name)
          localStorage.setItem('userEmail', data.email)
          localStorage.setItem('userId', data._id)
          // window.location.href = window.location.origin + '/components/home.html';
          window.location.href = import.meta.env.DEV
            ? '/components/home.html'
            : '/home';
        } else {
          showToast(data.message);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });