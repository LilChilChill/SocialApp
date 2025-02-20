const API_URL = import.meta.env.VITE_API_URL;

// User functions
const userInfoContainer = document.getElementById('userInfo')
const updateButton = document.getElementById('updateButton')
const updateForm = document.getElementById('updateForm')
const saveButton = document.getElementById('saveButton')
let currentUser = {}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = window.location.origin; 
}

window.logout = logout

function listDisplay() {
    document.getElementById('list').style.display = document.getElementById('list').style.display === 'none'? 'flex' : 'none';
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
    const avatarUrl = user.avatar && user.avatar.data && typeof user.avatar.data === 'string'
        ? `data:${user.avatar.contentType};base64,${user.avatar.data}`
        : '../img/default-avatar.png';

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

const showStatusMessage = (message, isError = false) => {
    const statusMessage = document.createElement('div');
    statusMessage.className = isError ? 'error' : 'success';
    statusMessage.textContent = message;
    document.body.appendChild(statusMessage);

    setTimeout(() => {
        document.body.removeChild(statusMessage);
    }, 3000);
};

const validateInputs = (name, birthDate) => {
    if (!name || !birthDate) {
        showStatusMessage('Vui lòng điền đầy đủ thông tin.', true);
        return false;
    }
    return true;
};

async function compressImage(file, maxSizeMB = 5, quality = 0.8) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              const maxWidth = 1920;
              const maxHeight = 1080;
              let width = img.width;
              let height = img.height;

              if (width > maxWidth || height > maxHeight) {
                  if (width > height) {
                      height *= maxWidth / width;
                      width = maxWidth;
                  } else {
                      width *= maxHeight / height;
                      height = maxHeight;
                  }
              }

              canvas.width = width;
              canvas.height = height;
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob((blob) => {
                  if (blob.size / 1024 / 1024 > maxSizeMB) {
                      resolve(compressImage(file, maxSizeMB, quality - 0.1)); // Giảm tiếp chất lượng nếu cần
                  } else {
                      resolve(new File([blob], file.name, { type: "image/jpeg" }));
                  }
              }, "image/jpeg", quality);
          };
      };
      reader.onerror = (error) => reject(error);
  });
}

saveButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const name = document.getElementById('name').value || currentUser.name;
    const birthDate = document.getElementById('birthDate').value || currentUser.birthDate;

    if (!validateInputs(name, birthDate)) return; 

    let gender = document.getElementById('gender').value || currentUser.gender;
    gender = gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';

    const avatar = document.getElementById('avatar') ? document.getElementById('avatar').files[0] : null;
    const formData = new FormData();

    if (name !== currentUser.name) formData.append('name', name);
    if (birthDate !== currentUser.birthDate) formData.append('birthDate', birthDate);
    if (gender !== currentUser.gender) formData.append('gender', gender);
    if (avatar) formData.append('avatar', avatar);

    if (Array.from(formData.keys()).length === 0) {
        showStatusMessage('Không có thông tin nào để cập nhật.', true);
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
            showStatusMessage('Cập nhật thông tin thành công!');
        } else {
            const errorMsg = await res.json();
            showStatusMessage(errorMsg.message || 'Cập nhật thông tin không thành công.', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showStatusMessage('Có lỗi xảy ra. Vui lòng thử lại.', true);
    }
});

getUserInfo();

// FEED function

const postsContainer = document.getElementById('posts');
const postButton = document.getElementById('postButton');
const postContent = document.getElementById('postContent');
const postImage = document.getElementById('postImage');

// API URL
const API_BASE_URL = `${API_URL}/api/feeds/posts`;

// Hiển thị bài viết
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
    const imageUrl = post.image ? `data:${post.image.contentType};base64,${post.image.data}` : '';

    postElement.innerHTML = `
      <p><strong>${post.author}</strong></p>
      <p>${post.content}</p>
      ${imageUrl ? `<img src="${imageUrl}" alt="Post Image">` : ''}
      <p><small>${new Date(post.createdAt).toLocaleString()}</small></p>
    `;

    postsContainer.appendChild(postElement);
  });
};

// Đăng bài viết mới
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
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (res.ok) {
      postContent.value = '';
      postImage.value = '';
      alert('Đăng bài thành công!');
      loadPosts(); // Tải lại danh sách bài viết
    } else {
      const errorMsg = await res.json();
      alert(errorMsg.message || 'Đăng bài thất bại.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
});

// Tải bài viết khi trang được load
document.addEventListener('DOMContentLoaded', loadPosts);
