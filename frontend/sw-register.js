/**
 * Service Worker Registration Script
 * Registers the Service Worker for PWA functionality
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('⚠️ Service Worker registration failed:', error);
            });
    });
} else {
    console.log('ℹ️ Service Workers not supported in this browser');
}
