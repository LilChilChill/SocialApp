const API_URL = import.meta.env.VITE_API_URL;
// User functions

const userInfoContainer = document.getElementById('userInfo');
const postUser = document.getElementById('post-user');
const updateButton = document.getElementById('updateButton');
const updateForm = document.getElementById('updateForm');
const saveButton = document.getElementById('saveButton');
let currentUser = {};

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
        document.getElementById('phoneNumber').value = currentUser.phoneNumber || ''; // Hiển thị số điện thoại hiện có
    }
});

saveButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const name = document.getElementById('name').value || currentUser.name;
    const birthDate = document.getElementById('birthDate').value || currentUser.birthDate;
    let gender = document.getElementById('gender').value || currentUser.gender;
    gender = gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';
    const phoneNumber = document.getElementById('phoneNumber').value || currentUser.phoneNumber; // Lấy số điện thoại

    // Kiểm tra hợp lệ số điện thoại (chỉ nhận số, 10-11 ký tự)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
        alert('Số điện thoại không hợp lệ. Vui lòng nhập 10-11 chữ số.');
        return;
    }

    const avatar = document.getElementById('avatar') ? document.getElementById('avatar').files[0] : null;
    const formData = new FormData();

    if (name !== currentUser.name) formData.append('name', name);
    if (birthDate !== currentUser.birthDate) formData.append('birthDate', birthDate);
    if (gender !== currentUser.gender) formData.append('gender', gender);
    if (phoneNumber !== currentUser.phoneNumber) formData.append('phoneNumber', phoneNumber); // Gửi số điện thoại
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

const openChangePasswordForm = document.getElementById('openChangePasswordForm');
const changePasswordButton = document.getElementById('changePasswordButton');

openChangePasswordForm.addEventListener('click', () => {
    updatePasswordForm.style.display = updatePasswordForm.style.display === 'none' ? 'block' : 'none';
});

changePasswordButton.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        alert('Vui lòng nhập đầy đủ thông tin.');
        return;
    }
    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới không trùng khớp.');
        return;
    }
    if (newPassword == oldPassword) {
        alert('Mật khẩu mới không được trùng với mật khẩu cũ.');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/users/change-password`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
        });

        if (res.ok) {
            alert('Đổi mật khẩu thành công!');
            updatePasswordForm.style.display = 'none';
        } else {
            const errorMsg = await res.json();
            alert(errorMsg.message || 'Đổi mật khẩu thất bại.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
    }
});


getUserInfo();

document.addEventListener("DOMContentLoaded", function () {
    const changePasswordForm = document.getElementById("updatePasswordForm");
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const forgotPasswordLink = document.querySelector("#updatePasswordForm a");
    const backToChangePassword = document.getElementById("backToChangePassword");
    const sendForgotPasswordButton = document.getElementById("sendForgotPassword");
    const API_URL = import.meta.env.VITE_API_URL; 
    const loggedInUserEmail = localStorage.getItem("userEmail");

    forgotPasswordLink.addEventListener("click", function (event) {
        event.preventDefault();
        changePasswordForm.style.display = "none"; 
        forgotPasswordForm.style.display = "block"; 
    });

    backToChangePassword.addEventListener("click", function (event) {
        event.preventDefault();
        forgotPasswordForm.style.display = "none"; 
        changePasswordForm.style.display = "block"; 
    });

    sendForgotPasswordButton.addEventListener("click", async function () {
        const email = document.getElementById("forgotEmail").value;
        if (!email) {
            alert("Vui lòng nhập email!");
            return;
        }

        if (!loggedInUserEmail || email !== loggedInUserEmail) {
            alert("Email không khớp với tài khoản đang đăng nhập!");
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/users/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            alert(data.message)
            {
                forgotPasswordForm.style.display = "none";
                changePasswordForm.style.display = "block";
            }

        } catch (error) {
            console.error("Lỗi:", error);
            alert("Đã có lỗi xảy ra. Vui lòng thử lại.");
        }
    });
});


const searchInput = document.getElementById('searchInput');
const userList = document.getElementById('userList');

const searchUsers = async () => {
    const query = searchInput.value.trim()
    // const query = removeAccents(searchInput.value.trim().toLowerCase());
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
                        <img onclick="goToProfile('${user._id}')" src="${avatarUrl}" alt="${user.name}" id="avatar">
                        <span onclick="goToProfile('${user._id}')">${user.name}</span>    
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
        userList.style.display = 'flex';
    }
});

let debounceTimer;

searchInput.addEventListener('input', () => {
    userList.style.display = 'flex';

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        if (searchInput.value.trim() !== '') {
            searchUsers();
        } else {
            userList.innerHTML = '';
            userList.style.display = 'none';
        }
    }, 300);
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        userList.style.display = 'none'
        searchInput.value = '';
    }
})