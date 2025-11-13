// scripts/app.js
import { renderMainApp } from './app-ui.js';

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('loader-container').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    renderMainApp();
  }, 2500);
});
