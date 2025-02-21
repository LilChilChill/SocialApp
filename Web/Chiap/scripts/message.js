const API_URL = import.meta.env.VITE_API_URL
document.title = "Chiap"

const socket = io(`${API_URL}`);
let currentFriendId = null;
let friendAvatar = null;
let friendName = null; 
let currentPage = 1;
let selectedFile = null; 
let cachedImages = [];
let imagesFetched = false;
let tempImages = [];
let currentImageIndex = 0;
let hasMoreImages = true;

let localStream;
let peerConnection;

// Cấu hình STUN server
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Khởi tạo voice call
async function startVoiceCall() {
    try {
        // Yêu cầu truy cập microphone
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Tạo PeerConnection
        peerConnection = new RTCPeerConnection(configuration);
        
        // Thêm luồng âm thanh vào kết nối
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        // Nghe ICE candidates từ local peer
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                sendSignal('new-ice-candidate', event.candidate);
            }
        };

        // Khi nhận remote stream, phát âm thanh
        peerConnection.ontrack = event => {
            const audioElement = document.createElement('audio');
            audioElement.srcObject = event.streams[0];
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);
        };

        // Tạo offer SDP
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Gửi offer đến peer khác
        sendSignal('voice-call-offer', offer);

    } catch (error) {
        console.error('Lỗi khi bắt đầu voice call:', error);
    }
}

// Nhận và xử lý tín hiệu từ peer
function handleSignal(type, data) {
    switch (type) {
        case 'voice-call-offer':
            handleOffer(data);
            break;
        case 'voice-call-answer':
            handleAnswer(data);
            break;
        case 'new-ice-candidate':
            handleNewICECandidate(data);
            break;
    }
}

// Xử lý offer nhận được
async function handleOffer(offer) {
    try {
        peerConnection = new RTCPeerConnection(configuration);
        
        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                sendSignal('new-ice-candidate', event.candidate);
            }
        };

        peerConnection.ontrack = event => {
            const audioElement = document.createElement('audio');
            audioElement.srcObject = event.streams[0];
            audioElement.autoplay = true;
            document.body.appendChild(audioElement);
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        sendSignal('voice-call-answer', answer);
    } catch (error) {
        console.error('Lỗi xử lý offer:', error);
    }
}

// Xử lý answer từ remote peer
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Xử lý ICE candidate mới
function handleNewICECandidate(candidate) {
    const newCandidate = new RTCIceCandidate(candidate);
    peerConnection.addIceCandidate(newCandidate).catch(e => console.error(e));
}

// Hàm giả lập gửi tín hiệu (thay bằng socket hoặc WebRTC signaling thực tế)
function sendSignal(type, data) {
    socket.emit('signal', { type, data }); // Sử dụng socket.io hoặc WebSocket
}

socket.on('signal', ({ type, data }) => {
    handleSignal(type, data);
});

socket.on('connect', () => {
    const userId = localStorage.getItem('userId');

    // console.log('Đã kết nối với server:', socket.id);
    if (userId) {
        socket.emit('register', userId);
        // console.log(`Đã gửi sự kiện đăng ký userId: ${userId}`);
    } else {
        console.error('Không tìm thấy userId trong localStorage.');
    }
});

socket.on('receiveMessage', (message) => {
    // console.log('Nhận tin nhắn:', message);
});

socket.on('disconnect', () => {
    console.log('Mất kết nối tới server.');
});

//----------------------------------------------------- PRIVATE CHAT -------------------------------------------------------------\\
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
        friendList.innerHTML = ''; 

        if (friends.length === 0) {
            friendList.innerHTML = '<p>Không có bạn bè nào.</p>';
        } else {
            friends.forEach(friend => {
                const friendAvatar = friend.avatar 
                    ? friend.avatar 
                    : '../assets/profile-default.png';

                const friendItem = document.createElement('div');
                friendItem.classList.add('friend-item');
                friendItem.innerHTML = `
                   <div class='chatUser' onclick="openChatEncoded('${encodeBase64Unicode(friend._id)}', '${encodeBase64Unicode(friend.name)}', '${encodeBase64Unicode(friendAvatar)}')">
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


// function loadChatImages() {
//     prefetchImages(currentPage, false); 
// }

// document.addEventListener("DOMContentLoaded", () => {
//     loadChatImages();
// });

function openChat(friendId, name, avatar, page = 1) {
    friendName = name;
    friendAvatar = avatar;
    document.getElementById('username').textContent = friendName;
    document.getElementById('avatar').src = friendAvatar;
    currentFriendId = friendId;
    currentPage = 1;
    hasMoreMessages = true;

    const deleteBtn = document.getElementById('deleteChatButton');
    const friendInfo = document.getElementById('headerSide');
    const chatArea = document.getElementById('chatArea');
    const fileData = document.getElementById('file');

    friendInfo.innerHTML = `<div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div>`;
    chatArea.innerHTML = `<div style="display: flex; justify-content: center;"><div class="three-body"><div class="three-body__dot"></div><div class="three-body__dot"></div><div class="three-body__dot"></div></div></div>`;
    fileData.innerHTML = '';

    fetch(`${API_URL}/api/messages/${friendId}?page=${page}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
        if (!response.ok) throw new Error('Lỗi khi lấy tin nhắn');
        return response.json();
    })
    .then(messages => {
        chatArea.innerHTML = '';
        friendInfo.innerHTML = '';
        fileData.innerHTML = '';
        deleteBtn.innerHTML = '';

        if (messages.length === 0) {
            chatArea.innerHTML = '<p>Không có tin nhắn nào.</p>';
        } else {
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message', message.sender === friendId ? 'received' : 'sent');

                const fileUrl = message.fileUrl;

                messageDiv.innerHTML = `
                    ${message.sender === friendId ? `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : '<img src="" alt="Bạn" style="display: none;">'}
                    <div class="msgContent">
                        ${message.content ? `<div class="messageContent"><p>${message.content.replace(/\n/g, '<br>')}</p></div>` : ''}
                        ${fileUrl ? `<img src="${fileUrl}" class="imgContent" onclick="openImage('${fileUrl}')"/>` : ''}
                    </div>
                `;

                chatArea.appendChild(messageDiv);
            });
        }

        friendInfo.innerHTML = `
            <img src="${friendAvatar}" alt="Ảnh đại diện" id="headerAva"/>
            <p>${friendName}</p>
            <div>
                <a href="#"><i class="fa-solid fa-bell"></i></a>
                <a href="#"><i class="fa-solid fa-magnifying-glass"></i></a>
            </div>
        `;
        
        fileData.innerHTML = `
            <a href="#" onclick="fileToggle()"><p>File phương tiện & file</p></a>
            <div style="display: none" id="fileDisplay">
                <a href="#" onclick="toggleImages()"><p>- File phương tiện</p></a>
                <div style="display: none" id="fileImageDisplay"></div>
                <a href="#"><p>- File</p></a>
            </div>
        `;

        deleteBtn.innerHTML = `
            <i class="fa-regular fa-trash-can"></i>
            <p>Xóa lịch sử trò chuyện</p>
        `;

        chatArea.scrollTop = chatArea.scrollHeight;
    })
    .catch(error => {
        console.error('Lỗi khi lấy tin nhắn:', error);
        chatArea.innerHTML = '<p>Không thể tải tin nhắn. Vui lòng thử lại sau.</p>';
    });
}

window.openChat = openChat;

function encodeBase64Unicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}

function decodeBase64Unicode(str) {
    return decodeURIComponent(escape(atob(str)));
}

function openChatEncoded(encodedId, encodedName, encodedAvatar) {
    const friendId = decodeBase64Unicode(encodedId);
    const friendName = decodeBase64Unicode(encodedName);
    const friendAvatar = decodeBase64Unicode(encodedAvatar);

    openChat(friendId, friendName, friendAvatar);
}
window.openChatEncoded = openChatEncoded;


document.getElementById('fileInput').addEventListener('change', function(event) {
    const fileInput = event.target;
    selectedFile = fileInput.files[0]; 

    const chatInput = document.getElementById('inputPreview');
    chatInput.innerHTML = ''; 

    if (selectedFile) {
        if (selectedFile.type.startsWith('image/')) {
            chatInput.innerHTML = `<img src="${URL.createObjectURL(selectedFile)}" alt="Selected File" class="imgPreview"/>`;
        } else {
            chatInput.innerHTML = `<p>${selectedFile.name}</p>`;
        }
    }
});

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

                canvas.toBlob(async (blob) => {
                    if (blob.size / 1024 / 1024 > maxSizeMB) {
                        resolve(await compressImage(file, maxSizeMB, quality - 0.1)); // Tiếp tục giảm chất lượng nếu cần
                    } else {
                        resolve(new File([blob], file.name, { type: "image/jpeg" }));
                    }
                }, "image/jpeg", quality);
            };
        };
        reader.onerror = (error) => reject(error);
    });
}

window.openImage = openImage

// Gửi tin nhắn
document.getElementById('sendButton').addEventListener('click', async () => {
    const messageInput = document.getElementById('chatInput');
    const content = messageInput.value.trim();

    if (!content && !selectedFile) {
        return;
    }

    if (!currentFriendId) {
        return;
    }

    let fileToSend = selectedFile;

    // Nếu có file và là ảnh, thực hiện nén
    if (fileToSend && fileToSend.type.startsWith('image/')) {
        try {
            fileToSend = await compressImage(fileToSend);
        } catch (error) {
            console.error('Lỗi khi nén ảnh:', error);
            return;
        }
    }

    const messageData = new FormData();
    messageData.append('receiverId', currentFriendId);
    messageData.append('content', content);

    if (fileToSend) {
        messageData.append('file', fileToSend);
    }

    fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: messageData
    })
    .then(response => response.json())
    .then(data => {
        messageInput.value = '';
        document.getElementById('inputPreview').innerHTML = '';

        const messagePayload = {
            chatType: 'private',  // Hoặc 'group' nếu gửi tin nhắn nhóm
            receiverId: currentFriendId,
            sender: localStorage.getItem('userId'),
            content: content,
            fileUrl: data.messageData.fileUrl || null,
            fileType: data.messageData.fileType || null,
            date: data.messageData.date
        };

        // Gửi tin nhắn qua socket
        socket.emit('sendMessage', messagePayload);

        selectedFile = null;

        // Hiển thị tin nhắn ngay trên giao diện người gửi
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'sent');

        if (content) {
            messageDiv.innerHTML = `
                <div class="msgContent">
                    <div class="messageContent">
                        <p>${content.replace(/\n/g, '<br>')}</p>
                    </div>
                    ${messagePayload.fileUrl ? `<img src="${messagePayload.fileUrl}" class="imgContent" onclick="openImage('${messagePayload.fileUrl}')"/>` : ''}
                </div>
            `;
        } else if (messagePayload.fileUrl) {
            messageDiv.innerHTML = `
                <div class="msgContent">
                    <img src="${messagePayload.fileUrl}" class="imgContent" onclick="openImage('${messagePayload.fileUrl}')"/>
                </div>
            `;
        }

        document.getElementById('chatArea').appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    })
    .catch(error => {
        console.error('Lỗi khi gửi tin nhắn:', error);
    });
});


// Nhận tin nhắn
socket.on('receiveMessage', (messageData) => {
    const chatArea = document.getElementById('chatArea');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageData.sender === currentFriendId ? 'received' : 'sent');

    const fileDataUrl = messageData.file && messageData.file.data && typeof messageData.file.data === 'string'
        ? `data:${messageData.file.contentType};base64,${messageData.file.data}`
        : null;

    const avatarUrl = messageData.sender === currentFriendId ? friendAvatar : '../img/default-avatar.png';

    if (messageData.content == '') {
        messageDiv.innerHTML = `
        <img src="${avatarUrl}" alt="${messageData.sender === currentFriendId ? friendName : 'Bạn'}" class="avatar">
        <div class="msgContent" id="msgContent">
            ${fileDataUrl ? `<img src="${fileDataUrl}" class="imgContent" onclick="openImage(this.src)" />` : ''}
        </div>
        `;
    } else {
        messageDiv.innerHTML = `
        <img src="${avatarUrl}" alt="${messageData.sender === currentFriendId ? friendName : 'Bạn'}" class="avatar">
        <div class="msgContent" id="msgContent">
            <div class="messageContent">
                <p>${messageData.content.replace(/\n/g, '<br>')}</p>
            </div>
            ${fileDataUrl ? `<img src="${fileDataUrl}" class="imgContent" onclick="openImage(this.src)" />` : ''}
        </div>
    `;
    }

    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
});

function prefetchImages(page = 1, append = false) {
    if (!hasMoreImages) return Promise.resolve();

    return fetch(`${API_URL}/api/messages/images/${currentFriendId}?page=${page}&limit=10`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi lấy ảnh');
        }
        return response.json();
    })
    .then(data => {
        if (append) {
            cachedImages = [...cachedImages, ...data.images];
        } else {
            cachedImages = data.images;
        }

        hasMoreImages = data.hasMore;
        imagesFetched = true;
        console.log(`Ảnh trang ${page}:`, cachedImages);
    })
    .catch(error => {
        console.error('Lỗi khi tải ảnh:', error);
    });
}

function fetchAllImages() {
    let page = 1; 
    let allImages = []; 

    function fetchNextPage() {
        return fetch(`${API_URL}/api/messages/images/${currentFriendId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi lấy ảnh');
            }
            return response.json();
        })
        .then(data => {
            allImages = [...allImages, ...data.images]; 

            if (data.hasMore) {
                page++; 
                return fetchNextPage(); 
            } else {
                cachedImages = allImages; 
                imagesFetched = true;
                console.log('Tất cả ảnh đã tải:', cachedImages);
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải ảnh:', error);
        });
    }

    return fetchNextPage();
}

function toggleImages() {
    const fileImageDisplay = document.getElementById('fileImageDisplay');

    if (fileImageDisplay.style.display === 'block') {
        fileImageDisplay.style.display = 'none';
        return;
    }

    fileImageDisplay.style.display = 'block';
    fileImageDisplay.innerHTML = '<p>Đang tải ảnh...</p>';

    if (imagesFetched) {
        renderImages();
        return;
    }

    fetchAllImages()
        .then(() => {
            renderImages();
        })
        .catch(error => {
            console.error('Lỗi khi tải ảnh:', error);
            fileImageDisplay.innerHTML = '<p>Lỗi khi tải ảnh.</p>';
        });
}

function renderImages() {
    const fileImageDisplay = document.getElementById('fileImageDisplay');
    fileImageDisplay.innerHTML = '';

    if (cachedImages.length === 0) {
        fileImageDisplay.innerHTML = '<p>Không có ảnh nào.</p>';
    } else {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        cachedImages.forEach(image => {
            const fileUrl = image.fileUrl;

            if (!fileUrl) return;

            const imgElement = document.createElement('img');
            imgElement.src = fileUrl;
            imgElement.onclick = () => openImage(imgElement.src);
            imageContainer.appendChild(imgElement);
        });

        fileImageDisplay.appendChild(imageContainer);
    }

    imagesFetched = true;
}

window.toggleImages = toggleImages;



document.getElementById('deleteChatButton').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat không?')) {
        fetch(`${API_URL}/api/messages/delete/${currentFriendId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Lỗi khi xóa lịch sử chat');
            }
            document.getElementById('chatArea').innerHTML = '<p>Đã xóa lịch sử chat.</p>';
            openChat(currentFriendId, friendName, friendAvatar);
        })
        .catch(error => {
            console.error('Lỗi khi xóa lịch sử chat:', error);
        });
    }
});



let isLoadingMessages = false; 

document.getElementById('chatArea').addEventListener('scroll', () => {
    const chatArea = document.getElementById('chatArea');
    
    if (chatArea.scrollTop === 0 && !isLoadingMessages) {
        loadOlderMessages();
    }
});

function switchChat(newFriendId, newFriendAvatar, newFriendName) {
    if (currentFriendId === newFriendId) return;

    currentFriendId = newFriendId;
    friendAvatar = newFriendAvatar;
    friendName = newFriendName;

    currentPage = 1;
    hasMoreMessages = true;
    isLoadingMessages = false;
    document.getElementById('chatArea').innerHTML = ''; 
    loadOlderMessages();

    cachedImages = [];
    imagesFetched = false;
    hasMoreImages = true;

    document.getElementById('fileImageDisplay').innerHTML = '';

    console.log(`Đã chuyển sang chat với ${friendName} - ID: ${currentFriendId}`);
}



let hasMoreMessages = true;
function loadOlderMessages() {
    if (!hasMoreMessages || isLoadingMessages) return;
    
    isLoadingMessages = true;

    fetch(`${API_URL}/api/messages/${currentFriendId}?page=${currentPage + 1}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Lỗi khi lấy tin nhắn cũ');
        }
        return response.json();
    })
    .then(messages => {
        if (messages.length === 0) {
            hasMoreMessages = false; 
            return;
        }

        const chatArea = document.getElementById('chatArea');
        const fragment = document.createDocumentFragment(); 

        messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', message.sender === currentFriendId ? 'received' : 'sent');

            const fileUrl = message.fileUrl;

            messageDiv.innerHTML = `
                ${message.sender === currentFriendId ? 
                    `<img src="${friendAvatar}" alt="${friendName}" class="avatar">` : 
                    `<img src="" alt="Bạn" style="display: none;">`}
                <div class="msgContent">
                    <div class="messageContent">
                        <p>${message.content.replace(/\n/g, '<br>')}</p>
                    </div>
                    ${fileUrl ? `<img src="${fileUrl}" class="imgContent" onclick="openImage('${fileUrl}')" />` : ''}
                </div>
            `;

            fragment.appendChild(messageDiv);
        });

        chatArea.insertBefore(fragment, chatArea.firstChild);

        currentPage++; 
        
    })
    .catch(error => {
        console.error('Lỗi khi lấy tin nhắn cũ:', error);
    })
    .finally(() => {
        isLoadingMessages = false;
    });
}


document.getElementById('chatInput').addEventListener('keydown', (event) => {
    
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); 
        document.getElementById('sendButton').click(); 
    }
});


function imgFileToggle(){
    document.getElementById('imgFile').style.display = document.getElementById('imgFile').style.display === 'none'? 'flex' : 'none';
}


function sideMenu(){
    document.getElementById('sideMenu').style.display = document.getElementById('sideMenu').style.display === 'none'? 'flex' : 'none';
    document.getElementById('icon').style.left = document.getElementById('icon').style.left === '65%' ? '86%' : '65%';
}
window.sideMenu = sideMenu

function emojiToggle(){
    document.getElementById('emoji').style.display = document.getElementById('emoji').style.display === 'none'? 'flex' : 'none';
}
function fileToggle(){
    document.getElementById('fileDisplay').style.display = document.getElementById('fileDisplay').style.display === 'none'? 'flex' : 'none';
}
window.fileToggle = fileToggle

function openImage(src) {
    document.getElementById("popupImage").src = src;
    document.getElementById("imagePopup").style.display = "block";

    currentImageIndex = cachedImages.findIndex(image => image.fileUrl === src);

    updateImage();
}

function closeImage() {
    document.getElementById("imagePopup").style.display = "none";
}
window.closeImage = closeImage

function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updateImage();
    } 
    // else if (hasMoreImages) {
    //     currentPage--;
    //     prefetchImages(currentPage, true);
    // }
}
window.prevImage = prevImage

let isLoading = false;
function nextImage() {
    if (isLoading) return;

    if (currentImageIndex < cachedImages.length - 1) {
        currentImageIndex++;
        updateImage();
    } else if (hasMoreImages) {
        isLoading = true;
        currentPage++;

        const prefetchResult = prefetchImages(currentPage, true);

        if (prefetchResult instanceof Promise) {
            prefetchResult
                .then(() => {
                    isLoading = false;
                    updateImage();
                })
                .catch(() => {
                    isLoading = false;
                });
        } else {
            console.error('prefetchImages không trả về Promise');
            isLoading = false;
        }
    }
}


window.nextImage = nextImage

function updateImage() {
    const image = cachedImages[currentImageIndex];
    if (!image) return;

    const fileUrl = image.fileUrl;

    if (fileUrl) {
        document.getElementById("popupImage").src = fileUrl;
        updateDownloadLink();
    }

    document.querySelector(".prev-btn").style.display = currentImageIndex === 0 ? "none" : "block";
    document.querySelector(".next-btn").style.display = currentImageIndex === cachedImages.length - 1 ? "none" : "block";
}


function updateDownloadLink() {
    const downloadBtn = document.getElementById("downloadBtn");
    downloadBtn.href = document.getElementById("popupImage").src;
    downloadBtn.setAttribute("download", `image_${currentImageIndex + 1}.jpg`);
}


document.addEventListener("click", function (event) {
    if (event.target.id === "imagePopup") {
        closeImage();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeImage();
    }
    if (event.key === "ArrowLeft") {
        prevImage();
    }
    if (event.key === "ArrowRight") {
        nextImage();
    }
});

getFriends();