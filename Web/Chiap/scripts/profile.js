
function logout() {
    localStorage.removeItem('token');
    window.location.href = '../index.html'; 
}

function listDisplay() {
    document.getElementById('list').style.display = document.getElementById('list').style.display === 'none'? 'flex' : 'none';
}