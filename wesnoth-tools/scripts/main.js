// Simple animation for tool cards
document.addEventListener('DOMContentLoaded', () => {
  // Tool card interactions
  document.querySelectorAll('.open-tool').forEach(button => {
    button.addEventListener('click', (e) => {
      const moduleName = e.target.closest('.tool-card').dataset.module;
      loader.loadModule(moduleName);
    });
  });
  
  // Back to dashboard button
  document.addEventListener('click', (e) => {
    if (e.target.id === 'return-dashboard') {
      loader.showDashboard();
    }
  });

  // PWA Install Prompt
  let deferredPrompt;
  const installButton = document.getElementById('install-btn');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        installButton.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted install');
          }
          deferredPrompt = null;
        });
      });
    }
  });
});