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