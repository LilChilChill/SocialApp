
const API_URL = import.meta.env.VITE_API_URL;
document.title = "Chiap"

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = window.location.origin; 
    
}

window.logout = logout
function getFriends() {
    const token = localStorage.getItem('token'); 

    if (!token) {
        alert('Vui lòng đăng nhập.');
        window.location.href = window.location.origin; 
        return;
    }

    fetch(`${API_URL}/api/users/friends`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(friends => {
        const friendList = document.getElementById('friendList');
        const headerName = document.getElementById('header')
        friendList.innerHTML = ''; 

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendAvatar = friend.avatar
                    ? friend.avatar
                    : '../img/default-avatar.png';

                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                // onclick="openChat('${friend._id}', '${friend.name}', '${friendAvatar}')"
                friendItem.innerHTML = `
                    <div class='chatUser' >
                        <img src="${friendAvatar}" alt="${friend.name}" class="avatar">
                        <div class='content'>
                            <span>${friend.name}</span>
                        </div>
                    </div>
                `;
                friendList.appendChild(friendItem);
            });
        }
    })
    .catch(error => {
        console.error('Lỗi khi lấy danh sách bạn bè:', error);
        document.getElementById('friendList').innerHTML = '<p>Không thể tải danh sách bạn bè. Vui lòng thử lại sau.</p>';
    });
}

getFriends()