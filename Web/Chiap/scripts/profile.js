const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap";

// User functions
const userInfoContainer = document.getElementById('userInfo');
const updateButton = document.getElementById('updateButton');
const updateForm = document.getElementById('updateForm');
const saveButton = document.getElementById('saveButton');
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

const postsContainer = document.getElementById('posts');
const postButton = document.getElementById('postButton');
const postContent = document.getElementById('postContent');
const postFiles = document.getElementById('postImage');

const API_BASE_URL = `${API_URL}/api/feeds/posts`;

const loadProfilePosts = async () => {
    const userId = localStorage.getItem('userId');
    const res = await fetch(`${API_BASE_URL}?userId=${userId}`);

    if (res.ok) {
        const posts = await res.json();
        displayPosts(posts);
    } else {
        console.error('Không thể tải bài viết.');
    }
};

document.addEventListener('DOMContentLoaded', loadProfilePosts);


const displayPosts = (posts) => {
    postsContainer.innerHTML = '';
    posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';

        let filesHtml = '';
        if (post.files.length > 0) {
            filesHtml = `<div class="post-images-container">` + post.files.map(file => {
                if (file.fileType === 'image') {
                    return `<img src="${file.data}" alt="Hình ảnh" class="post-image">`;
                } else if (file.fileType === 'video') {
                    return `<video controls class="post-video"><source src="${file.data}" type="${file.contentType}"></video>`;
                } else {
                    return `<a href="${file.data}" target="_blank" class="post-document">📄 Xem tài liệu</a>`;
                }
            }).join('') + `</div>`;
        }

        const authorName = post.author.name || 'Người dùng ẩn danh';
        const avatarUrl = post.author.avatar ? post.author.avatar : '../assets/profile-default.png';
        console.log('Name:', authorName);
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${avatarUrl}" alt="Avatar" class="post-avatar">
                <div class="post-info">
                    <h4>${authorName}</h4>
                    <p><small>${new Date(post.createdAt).toLocaleString()}</small></p>
                </div>
            </div>
            <p>${post.title}</p>
            <div class="post-files">${filesHtml}</div>
        `;

        postsContainer.appendChild(postElement);
    });
};

postButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const title = postContent.value.trim();
    const files = postFiles.files;

    if (!title && files.length === 0) {
        alert('Vui lòng nhập nội dung hoặc chọn tệp.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    for (let file of files) {
        formData.append('files', file);
    }

    try {
        const res = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        });

        if (res.ok) {
            postContent.value = '';
            postFiles.value = '';
            alert('Đăng bài thành công!');
            loadProfilePosts();
        } else {
            const errorMsg = await res.json();
            alert(errorMsg.message || 'Đăng bài thất bại.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

document.addEventListener('DOMContentLoaded', loadProfilePosts);