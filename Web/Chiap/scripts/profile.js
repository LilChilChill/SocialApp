const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap";

// User functions
const userInfoContainer = document.getElementById('userInfo');
const postUser = document.getElementById('post-user');
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
    postUser.innerHTML = `
        <img id="postUser" src="${avatarUrl}" alt="Avatar" >
        <div class="post-user-info">
            <p><strong>${user.name || 'Chưa có thông tin'}</strong></p>
            <select id="postStatus" style="margin-bottom: 10px" hidden>
                <option value="public">Công khai</option>
                <option value="private">Riêng tư</option>
                <option value="friends">Bạn bè</option>
            </select>
        </div>
    `

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
const postStatus = document.getElementById('postStatus');
const postFiles = document.getElementById('postImage');

const API_BASE_URL = `${API_URL}/api/feeds/posts`;
//Tải post
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

//Hiển thị bài đăng
const displayPosts = (posts) => {
    
    postsContainer.innerHTML = '';
    posts.forEach((post) => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        const currentUserId = localStorage.getItem('userId'); // Lấy ID người dùng từ localStorage
        const isLiked = post.likes.includes(currentUserId); // Kiểm tra người dùng đã like chưa
        const likeClass = isLiked ? 'fa-solid' : 'fa-regular'; // Định dạng icon
        const likedClass = isLiked ? 'liked' : ''; // Thêm class "liked" nếu đã like

        let documents = post.files.filter(file => file.fileType === 'document');
            let images = post.files.filter(file => file.fileType === 'image');
            let videos = post.files.filter(file => file.fileType === 'video');

            let filesHtml = '<div class="post-files">';
            if (documents.length > 0) {
                filesHtml += documents.map(file => `<a href="${file.data}" target="_blank" class="post-document">📄 Xem tài liệu</a>`).join('');
            }
            if (images.length > 0) {
                let gridClass = '';
                if (images.length === 2) {
                  gridClass = 'two-images';
                } else if (images.length >= 3 && images.length <= 4) {
                  gridClass = 'three-four-images';
                } else if (images.length > 4) {
                  gridClass = 'three-four-images';
                }
              
                filesHtml += `<div class="post-images-grid ${gridClass}">`;
              
                images.slice(0, 4).forEach((file, index) => {
                  if (index === 3 && images.length > 4) {
                    filesHtml += `
                      <div class="post-image-overlay">
                        <img src="${file.data}" alt="Hình ảnh" class="post-image">
                        <span>+${images.length - 4}</span>
                      </div>
                    `;
                  } else {
                    filesHtml += `<img src="${file.data}" alt="Hình ảnh" class="post-image">`;
                  }
                });
              
                filesHtml += `</div>`;
              }
            
            
            if (videos.length > 0) {
                if (videos.length === 1) {
                    filesHtml += `<video controls class="post-video"><source src="${videos[0].data}" type="${videos[0].contentType}"></video>`;
                } else {
                    filesHtml += '<div class="post-videos-grid">' + videos.map(file => `<video controls class="post-video"><source src="${file.data}" type="${file.contentType}"></video>`).join('') + '</div>';
                }
            }
            filesHtml += '</div>';
        

            const avatarUrl = post.author.avatar ? post.author.avatar : '../assets/profile-default.png';
            const authorName = post.author.name || 'Người dùng ẩn danh';
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-header-info">
                        <img src="${avatarUrl}" alt="Avatar" class="post-avatar">
                        <div class="post-info">
                            <h4 onclick="goToProfile('${post.author._id}')">${authorName}</h4>
                            <p onclick="goToProfile('${post.author._id}')"><small>${post.status}</small></p>
                            <a href="#"><small>${new Date(post.createdAt).toLocaleString()}</small></a>
                        </div>
                    </div>
                    <div class="post-setting">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                        <div class="post-menu hidden">
                            <button class="edit-post-btn" data-post-id="${post._id}" data-title="${post.title}" data-status="${post.status}">Chỉnh sửa bài viết</button>
                            <button class="delete-post-btn" data-post-id="${post._id}">Xóa bài viết</button>
                        </div>
                    </div>
                </div>
                <p>${post.title ? post.title.replace(/\n/g, '<br>') : ''}</p>
                ${filesHtml}
                <div class="post-actions">
                    <button class="like-btn ${likedClass}" data-post-id="${post._id}">
                        <i class="${likeClass} fa-heart"></i> <span class="like-count">${post.likes.length}</span>
                    </button>
                    <button class="comment-btn">
                        <i class="fa-regular fa-comment"></i> <span class="like-count">${post.comments.length}</span>
                    </button>
                </div>
                <div class="post-comments">
                    <div class="comment-list">
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <img onclick="goToProfile('${comment.user._id}')" src="${comment.user?.avatar || '../assets/profile-default.png'}" alt="Avatar" class="comment-avatar">
                                <div class="comment-content">
                                    <div class="comment-user" onclick="goToProfile('${comment.user._id}')">${comment.user?.name || 'Ẩn danh'}</div>
                                    <div class="comment-text">${comment.text}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="comment-input-box">
                        <input type="text" class="comment-input" placeholder="Viết bình luận..." data-post-id="${post._id}" />
                        <button class="comment-submit" data-post-id="${post._id}">Gửi</button>
                    </div>
                </div>
            `;

            const settingBtn = postElement.querySelector('.post-setting i');
            const menu = postElement.querySelector('.post-menu');

            if (settingBtn) {
                settingBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    menu.classList.toggle('show');
                });
                
                document.addEventListener('click', (e) => {
                    if (menu.classList.contains('show') && !menu.contains(e.target) && e.target !== settingBtn) {
                        menu.classList.remove('show');
                    }
                });
            }

        postsContainer.appendChild(postElement);
        const deleteBtn = postElement.querySelector('.delete-post-btn');

        if (deleteBtn) {
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); 
                const postId = deleteBtn.dataset.postId;
                const confirmDelete = confirm('Bạn có chắc chắn muốn xóa bài viết này không?');
                if (confirmDelete) {
                    deletePost(postId)
                }
            });
        }

        const likeBtn = postElement.querySelector('.like-btn');
        likeBtn.addEventListener('click', async () => {
            await likePost(post._id, postElement);
        });

        const commentBtn = postElement.querySelector('.comment-btn');
        commentBtn.addEventListener('click', () => {
            const commentSection = postElement.querySelector('.post-comments');
            commentSection.classList.toggle('active'); // Hiện/ẩn bình luận
        });

        const commentSubmitBtn = postElement.querySelector('.comment-submit');
        commentSubmitBtn.addEventListener('click', async () => {
            const input = postElement.querySelector('.comment-input');
            const text = input.value.trim();
            if (text) {
                await commentPost(post._id, text, postElement);
                input.value = '';
            }
        });

    });
};

//Lượt thích
const likePost = async (postId, postElement) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/like`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
        });
        const data = await response.json();
        if (response.ok) {
            const likeBtn = postElement.querySelector('.like-btn');
            const likeIcon = likeBtn.querySelector('i');
            likeIcon.classList.toggle('fa-solid');
            likeIcon.classList.toggle('fa-regular');
            likeIcon.style.color = likeIcon.classList.contains('fa-solid') ? 'red' : 'black';
            postElement.querySelector('.like-count').textContent = data.likes;
        }
    } catch (error) {
        console.error('Lỗi khi like bài viết:', error);
    }
};

// Gửi bình luận
const commentPost = async (postId, text, postElement) => {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}/comment`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        if (response.ok) {
            const commentList = postElement.querySelector('.comment-list');
            commentList.innerHTML = data.comments.map(comment => `
                <div class="comment">
                    <strong>${comment.user?.name || 'Ẩn danh'}:</strong> ${comment.text}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Lỗi khi bình luận:', error);
    }
};

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".like-btn").forEach(button => {
        button.addEventListener("click", function () {
            this.classList.toggle("liked");
        });
    });

    document.querySelectorAll(".comment-btn").forEach(button => {
        button.addEventListener("click", function () {
            const postElement = this.closest(".post-actions").nextElementSibling;
            postElement.classList.toggle("active");
        });
    });
});

const goToProfile = (userId) => {
    const currentUserId = localStorage.getItem('userId');
    if (userId === currentUserId) {
        window.location.href = window.location.origin + '/components/profile.html';
    } else {
        window.location.href = window.location.origin + `/components/user.html?userId=${userId}`;
    }
};
window.goToProfile = goToProfile;
//Tạo post
postButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const title = postContent.value.trim();
    const files = postFiles.files;
    const status = postStatus.value;

    if (!title && files.length === 0) {
        alert('Vui lòng nhập nội dung hoặc chọn tệp.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('status', status);

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
            postStatus.value = 'public';
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
//Cập nhật bài đăng
postsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-post-btn')) {
        currentPostId = e.target.dataset.postId;
        editTitle.value = e.target.dataset.title;
        editStatus.value = e.target.dataset.status;
        popup.classList.remove('hidden');
    }
});

const updatePost = async (postId, title, status) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, status })
        });

        if (response.ok) {
            alert('Cập nhật bài viết thành công');
            loadProfilePosts();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra.');
    }
};

const popup = document.querySelector('.popup');
const closePopup = document.querySelector('.close-popup');
const editTitle = document.querySelector('#edit-title');
const editStatus = document.querySelector('#edit-status');
const saveEditBtn = document.querySelector('#save-edit-btn');
let currentPostId = '';

closePopup.onclick = () => {
    popup.classList.add('hidden');
};

saveEditBtn.onclick = async () => {
    const newTitle = editTitle.value;
    const newStatus = editStatus.value;

    if (newTitle.trim() !== '') {
        await updatePost(currentPostId, newTitle, newStatus);
        popup.classList.add('hidden');
    } else {
        alert('Nội dung bài viết không được để trống');
    }
};

window.onclick = (e) => {
    if (e.target === popup) {
        popup.classList.add('hidden');
    }
};

//Xóa Post
const deletePost = async (postId) => {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await res.json();
        if (res.ok) {
            alert(result.message);
            loadProfilePosts();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Lỗi:', error);
    }
};

postsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('fa-ellipsis-vertical')) {
        const menu = e.target.nextElementSibling;
        menu.classList.toggle('hidden');
    }
});

document.addEventListener('DOMContentLoaded', loadProfilePosts);