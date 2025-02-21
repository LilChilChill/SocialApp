const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap";

// User functions
const userInfoContainer = document.getElementById('userInfo');
const updateButton = document.getElementById('updateButton');
const updateForm = document.getElementById('updateForm');
const saveButton = document.getElementById('saveButton');
let currentUser = {};

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = window.location.origin; 
}

window.logout = logout;

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
    const avatarUrl = user.avatar ? user.avatar : '../img/default-avatar.png';

    userInfoContainer.innerHTML = `
        <img id="userAvatar" src="${avatarUrl}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border-color: #000">
        <p><strong>${user.name || 'Chưa có thông tin'}</strong></p>
    `;
};

updateButton.addEventListener('click', () => {
    updateForm.style.display = updateForm.style.display === 'none' ? 'block' : 'none';
    if (updateForm.style.display === 'block') {
        document.getElementById('name').value = currentUser.name || '';
        document.getElementById('birthDate').value = currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : ''; 
        document.getElementById('gender').value = currentUser.gender === 'Nam' ? 'male' : currentUser.gender === 'Nữ' ? 'female' : 'other';
    }
});

saveButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const name = document.getElementById('name').value || currentUser.name;
    const birthDate = document.getElementById('birthDate').value || currentUser.birthDate;
    
    let gender = document.getElementById('gender').value || currentUser.gender;
    gender = gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';

    const avatar = document.getElementById('avatar') ? document.getElementById('avatar').files[0] : null;
    const formData = new FormData();

    if (name !== currentUser.name) formData.append('name', name);
    if (birthDate !== currentUser.birthDate) formData.append('birthDate', birthDate);
    if (gender !== currentUser.gender) formData.append('gender', gender);
    if (avatar) formData.append('avatar', avatar);

    if (Array.from(formData.keys()).length === 0) {
        alert('Không có thông tin nào để cập nhật.');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/users/update`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        if (res.ok) {
            const updatedUser = await res.json();
            currentUser = updatedUser;
            displayUserInfo(updatedUser);
            updateForm.style.display = 'none';
            alert('Cập nhật thông tin thành công!');
        } else {
            const errorMsg = await res.json();
            alert(errorMsg.message || 'Cập nhật thông tin không thành công.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
});

getUserInfo();

// FEED function
const postsContainer = document.getElementById('posts');
const postButton = document.getElementById('postButton');
const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');

const API_BASE_URL = `${API_URL}/api/feeds/posts`;

const loadPosts = async () => {
    try {
        const res = await fetch(API_BASE_URL, {
            method: 'GET',
        });

        if (res.ok) {
            const posts = await res.json();
            displayPosts(posts);
        } else {
            console.error('Không thể tải bài viết.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const displayPosts = (posts) => {
    postsContainer.innerHTML = '';
    posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        const imageUrl = post.image ? post.image : '';

        postElement.innerHTML = `
            <p><strong>${post.author}</strong></p>
            <p>${post.content}</p>
            ${imageUrl ? `<img src="${imageUrl}" alt="Post Image">` : ''}
            <p><small>${new Date(post.createdAt).toLocaleString()}</small></p>
        `;

        postsContainer.appendChild(postElement);
    });
};

postButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const content = postContent.value.trim();
    const image = postImage.files[0];

    if (!content && !image) {
        alert('Vui lòng nhập nội dung hoặc chọn hình ảnh.');
        return;
    }

    const formData = new FormData();
    formData.append('content', content);
    if (image) {
        formData.append('image', image);
    }

    try {
        const res = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData,
        });

        if (res.ok) {
            postContent.value = '';
            postImage.value = '';
            alert('Đăng bài thành công!');
            loadPosts();
        } else {
            const errorMsg = await res.json();
            alert(errorMsg.message || 'Đăng bài thất bại.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.addEventListener('DOMContentLoaded', loadPosts);