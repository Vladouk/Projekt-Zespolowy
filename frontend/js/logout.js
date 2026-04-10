/**
 * Вихід з аккаунта (logout)
 */
function logout() {
    if (confirm('Ви впевнені що хочете вийти з аккаунта?')) {
        // Видалити токен з localStorage
        localStorage.removeItem('auth_token');
        
        // Очистити поточного користувача
        currentUser = null;
        
        // Показати повідомлення
        console.log('✅ Ви вийшли з аккаунта');
        
        // Перенаправити на логін
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}
