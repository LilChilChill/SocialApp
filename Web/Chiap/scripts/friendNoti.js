const API_URL = import.meta.env.VITER_API_URL

const friendRequestList = document.getElementById('friendRequestList');
const notification = document.getElementById('notification');
const error = document.getElementById('error');

const getFriendRequests = async () => {
    const token = localStorage.getItem('token'); 

    friendRequestList.innerHTML = '';
    notification.style.display = 'none';
    error.style.display = 'none';

    if (!token) {
        error.innerHTML = 'Vui lòng đăng nhập để xem danh sách lời mời kết bạn.';
        error.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/friends/requests`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorMessage = await response.json();
            error.innerHTML = errorMessage.message || 'Có lỗi xảy ra khi lấy danh sách lời mời.';
            error.style.display = 'block';
            return;
        }

        const requests = await response.json();

        if (requests.length === 0) {
            friendRequestList.innerHTML = '<p>Không có thông báo.</p>';
        } else {
            requests.forEach(request => {
                const requestItem = document.createElement('div');
                requestItem.classList.add('friend-request-item');
                requestItem.innerHTML = `
                    <span>${request.sender.name}</span>
                    <div>
                        <button class="accept-button" onclick="acceptFriendRequest('${request._id}')">Chấp nhận</button>
                        <button class="decline-button" onclick="rejectFriendRequest('${request._id}')">Từ chối</button>
                    </div>
                `;
                friendRequestList.appendChild(requestItem);
            });
        }
    } catch (err) {
        console.error(err);
        error.innerHTML = 'Có lỗi xảy ra khi lấy danh sách lời mời.';
        error.style.display = 'block';
    }
};

const acceptFriendRequest = async (requestId) => {
    notification.style.display = 'none'; 
    error.style.display = 'none';        

    const token = localStorage.getItem('token'); 

    if (!token) {
        error.innerHTML = 'Vui lòng đăng nhập để thực hiện hành động này.';
        error.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/friends/accept/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            notification.innerHTML = 'Đã chấp nhận lời mời kết bạn.';
            notification.style.display = 'block';
            getFriendRequests(); 
        } else {
            const errorMessage = await response.json();
            error.innerHTML = `Lỗi: ${errorMessage.message}`;
            error.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        error.innerHTML = 'Có lỗi xảy ra khi chấp nhận lời mời.';
        error.style.display = 'block';
    }
};

const rejectFriendRequest = async (requestId) => {
    notification.style.display = 'none'; 
    error.style.display = 'none';        

    const token = localStorage.getItem('token'); 

    if (!token) {
        error.innerHTML = 'Vui lòng đăng nhập để thực hiện hành động này.';
        error.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/friends/decline/${requestId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            notification.innerHTML = 'Đã từ chối lời mời kết bạn.';
            notification.style.display = 'block';
            getFriendRequests();
        } else {
            const errorMessage = await response.json();
            error.innerHTML = `Lỗi: ${errorMessage.message}`;
            error.style.display = 'block';
        }
    } catch (err) {
        console.error(err);
        error.innerHTML = 'Có lỗi xảy ra khi từ chối lời mời.';
        error.style.display = 'block';
    }
};

window.onload = getFriendRequests;