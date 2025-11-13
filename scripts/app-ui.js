// scripts/app-ui.js
export function renderMainApp() {
  const app = document.getElementById('main-app');
  app.innerHTML = `
    <div class="bg-text">Bank</div>
    <div id="main-app-header">
      <div class="header-left">
        
        <button class="profile-btn" title="Личный кабинет"> <!-- Юзер -->
          <svg width="26" height="26" viewBox="0 0 22 22"><circle cx="11" cy="8" r="5" fill="none" stroke="#fff" stroke-width="2"/><ellipse cx="11" cy="17" rx="7.1" ry="3.3" fill="none" stroke="#fff" stroke-width="2"/></svg>
        </button>
        <button class="add-btn" title="Новый чат"> <!-- Плюс -->
          <svg width="26" height="26" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" stroke="#fff" fill="none"/><rect x="8.15" y="4.2" width="1.7" height="9.6" rx=".85" fill="#fff"/><rect x="4.2" y="8.15" width="9.6" height="1.7" rx=".85" fill="#fff"/></svg>
        </button>
      </div>
      <div class="header-right">
        <label class="darkmode-switch" id="darkmode-switch" for="darkmode-toggle">
          <span class="switch-slider"></span>
          <input type="checkbox" id="darkmode-toggle" />
          <span class="darkmode-label">Dark</span>
        </label>
      </div>
    </div>
    <main class="main-panel">
      <div class="logo-row">
        <img src="images/logo.png" alt="Logo" class="logo-sign" />
        <span class="slogan">Чем я могу вам помочь?</span>
      </div>
      <div class="offer-row">
        <button class="offer-btn">Юридические консультации</button>
        <button class="offer-btn">Анализ продаж</button>
        <button class="offer-btn">составить договор</button>
        <button class="offer-btn">Актуальные новости для предпринимателя</button>
        <button class="offer-btn">Предложения по улучшению бизнеса</button>
      </div>
      <div class="input-row">
        <textarea placeholder="Напишите ваш вопрос" rows="1"></textarea>
        <div class="input-buttons">
          <button class="tag-btn">
            <svg width="12" height="12" viewBox="0 0 20 18"><ellipse cx="10" cy="9" rx="9.5" ry="8.5" stroke="#ffffff" fill="none"/><rect x="8.85" y="4.6" width="2.3" height="7.8" rx="1.1" fill="#ffffff"/><rect x="4.6" y="8.85" width="10.8" height="2.3" rx="1.1" fill="#ffffff"/></svg>Рассуждение
          </button>
          <button class="send-btn">
            <img src="images/send-icon.png" alt="Отправить" />
          </button>
        </div>
      </div>
    </main>
  `;
  
  // Автоматическое изменение высоты textarea
  const textarea = document.querySelector('.input-row textarea');
  if (textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
  }
  
  // Переключение темы - используем делегирование событий
  const mainApp = document.getElementById('main-app');
  
  // Функция для применения темы
  function applyTheme(isLight) {
    const themeToggle = document.getElementById('darkmode-toggle');
    const themeSwitch = document.getElementById('darkmode-switch');
    const themeLabel = document.querySelector('.darkmode-label');
    
    if (!mainApp) return;
    
    if (isLight) {
      mainApp.classList.add('light-theme');
      if (themeSwitch) themeSwitch.classList.add('active');
      if (themeToggle) themeToggle.checked = true;
      if (themeLabel) themeLabel.textContent = 'White';
    } else {
      mainApp.classList.remove('light-theme');
      if (themeSwitch) themeSwitch.classList.remove('active');
      if (themeToggle) themeToggle.checked = false;
      if (themeLabel) themeLabel.textContent = 'Dark';
    }
  }
  
  // Загружаем сохранённую тему из localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    applyTheme(true);
  } else {
    applyTheme(false);
  }
  
  // Используем делегирование событий на main-app
  if (mainApp) {
    mainApp.addEventListener('change', function(e) {
      if (e.target && e.target.id === 'darkmode-toggle') {
        const isLight = e.target.checked;
        applyTheme(isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        console.log('Theme switched to:', isLight ? 'light' : 'dark');
      }
    });
    
    // Обработчик клика на переключатель
    mainApp.addEventListener('click', function(e) {
      const clickedElement = e.target;
      const themeSwitch = document.getElementById('darkmode-switch');
      const themeToggle = document.getElementById('darkmode-toggle');
      
      // Проверяем, что клик был по переключателю (но не по самому checkbox)
      if (themeSwitch && themeToggle && 
          (clickedElement === themeSwitch || 
           clickedElement.closest('#darkmode-switch') === themeSwitch ||
           clickedElement.classList.contains('switch-slider') ||
           clickedElement.classList.contains('darkmode-label')) &&
          clickedElement !== themeToggle && 
          clickedElement.tagName !== 'INPUT') {
        
        e.preventDefault();
        e.stopPropagation();
        
        // Переключаем checkbox
        themeToggle.checked = !themeToggle.checked;
        
        // Вызываем событие change
        const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        themeToggle.dispatchEvent(changeEvent);
        
        console.log('Switch clicked, new state:', themeToggle.checked);
      }
    });
    
    console.log('Theme toggle initialized');
  }
}
