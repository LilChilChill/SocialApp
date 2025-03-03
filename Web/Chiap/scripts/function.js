const API_URL = import.meta.env.VITE_API_URL;

const userAvatar = document.getElementById('userAvatar');
let currentUser = {};

function listDisplay() {
    document.getElementById('list').style.display = document.getElementById('list').style.display === 'none' ? 'flex' : 'none';
}

const getUserInfo = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Vui lòng đăng nhập trước khi truy cập thông tin.');
        window.location.href = window.location.origin;
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            currentUser = await res.json();
            displayUserInfo(currentUser);
        } else {
            const errorMsg = await res.json();
            alert(errorMsg.message || 'Không thể lấy thông tin người dùng.');
            window.location.href = window.location.origin;
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
const displayUserInfo = (user) => {
    localStorage.setItem('userId', user._id);
    const avatarUrl = user.avatar ? user.avatar : '../assets/profile-default.png';

    userAvatar.innerHTML = `
        <img class="user-avatar" src="${avatarUrl}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border-color: #000">
    `;
    console.log(avatarUrl);
};
getUserInfo()

const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const userList = document.getElementById('userList');
const notification = document.getElementById('notification');
const error = document.getElementById('error');

const searchUsers = async () => {
    const query = searchInput.value.trim()
    userList.innerHTML = ''
    notification.style.display = 'none'
    error.style.display = 'none'

    if (!query) {
        error.innerHTML = 'Vui lòng nhập tên để tìm kiếm.';
        error.style.display = 'block';
        return;
    }

    const token = localStorage.getItem('token'); 

    if (!token) {
        error.innerHTML = 'Vui lòng đăng nhập để thực hiện hành động này.'; 
        error.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/search?query=${query}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorMessage = await response.json();
            error.innerHTML = errorMessage.message;
            error.style.display = 'block';
            return;
        }

        const users = await response.json();

        if (users.length === 0) {
            userList.innerHTML = '<p>Không tìm thấy người dùng nào.</p>';
        } else {
            users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.classList.add('user-item');
                
                const avatarUrl = user.avatar ? user.avatar : '../img/default-avatar.png';
                
                userItem.innerHTML = `
                    <div class='userName'> 
                        <img src="${avatarUrl}" alt="${user.name}" id="avatar">
                        <span>${user.name}</span>    
                    </div>
                    <button onclick="addFriend('${user._id}')">Thêm bạn</button>
                `;
                userList.appendChild(userItem);
            });
        }
    } catch (error) {
        console.error(error);
        error.innerHTML = 'Có lỗi xảy ra trong quá trình tìm kiếm.';
        error.style.display = 'block';
    }
};



const addFriend = async (receiverId) => {
    notification.style.display = 'none'; 
    error.style.display = 'none'; 

    const token = localStorage.getItem('token'); 

    if (!token) {
        error.innerHTML = 'Vui lòng đăng nhập để thực hiện hành động này.'; 
        error.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/friends/add`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ receiverId }) 
        });

        if (response.ok) {
            notification.innerHTML = `Đã gửi lời mời kết bạn tới người dùng ID: ${receiverId}`;
            notification.style.display = 'block';
            notification.style.justifyContent = 'center';
            
            setTimeout(() => {
                notification.style.display = 'none';
            }, 2000);
        } else {
            const errorMessage = await response.json();
            error.innerHTML = `Lỗi: ${errorMessage.message}`;
            error.style.display = 'block';
            setTimeout(() => {
                error.style.display = 'none';
            }, 2000);
        }
    } catch (error) {
        console.error(error);
        error.innerHTML = 'Có lỗi xảy ra khi gửi lời mời kết bạn.';
        error.style.display = 'block';
    }
};

window.addFriend = addFriend;

searchButton.addEventListener('click', searchUsers);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchUsers();
    }
});
