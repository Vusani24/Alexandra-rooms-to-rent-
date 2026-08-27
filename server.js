async function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('loginError');

    try {
        errorEl.style.display = 'none';
        if (!password) {
            errorEl.textContent = 'Please enter your password.';
            errorEl.style.display = 'block';
            return;
        }

        const BACKEND_URL = window.BACKEND_URL || 'https://vusani-ikhaya-backend.onrender.com';
        
        const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        token = data.token;
        localStorage.setItem('adminToken', token);
        showDashboard();
        await refreshAdmin();
        showToast('✅ Logged in successfully!');

    } catch (error) {
        errorEl.textContent = error.message || 'Incorrect password. Please try again.';
        errorEl.style.display = 'block';
    }
}
