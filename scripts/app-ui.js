// scripts/app-ui.js
const DEFAULT_BACKEND_URL = 'http://127.0.0.1:8000';
window.BACKEND_BASE_URL = window.BACKEND_BASE_URL || DEFAULT_BACKEND_URL;

export function renderMainApp() {
  const app = document.getElementById('main-app');
  const storedEmail = localStorage.getItem('userEmail');
  const isAuth = localStorage.getItem('isAuth') === 'true' && storedEmail;
  // Блок для кнопок авторизации
  let authButtonHtml = '';
  if (isAuth) {
    authButtonHtml = `
      <button class="profile-btn" title="Личный кабинет">
        <svg width="26" height="26" viewBox="0 0 22 22"><circle cx="11" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="11" cy="17" rx="7.1" ry="3.3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      </button>
    `;
  } else {
    authButtonHtml = `
      <button class="login-btn" id="login-btn" title="Войти">Войти</button>
    `;
  }
  app.innerHTML = `
    <div class="bg-text">Bank</div>
    <div id="main-app-header">
      <div class="header-left">
        ${authButtonHtml}
        <button class="add-btn" title="Новый чат">
          <svg width="26" height="26" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.5" stroke="currentColor" fill="none"/><rect x="8.15" y="4.2" width="1.7" height="9.6" rx=".85" fill="currentColor"/><rect x="4.2" y="8.15" width="9.6" height="1.7" rx=".85" fill="currentColor"/></svg>
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
        <img alt="Logo" class="logo-sign" id="logo-sign"/>
        <span class="slogan">Чем я могу вам помочь?</span>
      </div>
      <div class="offer-row">
        <button class="offer-btn">Юридические консультации</button>
        <button class="offer-btn">Анализ продаж</button>
        <button class="offer-btn">составить договор</button>
        <button class="offer-btn">Актуальные новости для предпринимателя</button>
        <button class="offer-btn">Предложения по улучшению бизнеса</button>
      </div>
      <div class="chat-wrapper">
        <div class="chat-history" id="chat-history">
          <div class="chat-placeholder">
            <p>Отправьте свой первый вопрос, и я подготовлю ответ.</p>
          </div>
        </div>
      </div>
      <form class="input-row" id="chat-input-form">
        <textarea placeholder="Напишите ваш вопрос" rows="1"></textarea>
        <div class="input-buttons">
          <button class="tag-btn" type="button">
            <svg width="12" height="12" viewBox="0 0 20 18"><ellipse cx="10" cy="9" rx="9.5" ry="8.5" stroke="#ffffff" fill="none"/><rect x="8.85" y="4.6" width="2.3" height="7.8" rx="1.1" fill="#ffffff"/><rect x="4.6" y="8.85" width="10.8" height="2.3" rx="1.1" fill="#ffffff"/></svg>Рассуждение
          </button>
          <button class="send-btn" type="submit">
            <img src="images/send-icon.png" alt="Отправить" />
          </button>
        </div>
      </form>
    </main>
  `;
  
  // Сразу выставляем корректную иконку
  const logo = document.getElementById('logo-sign');
  if (logo) {
    // Определяем по классу main-app или localStorage
    const mainApp = document.getElementById('main-app');
    const isLight = (mainApp && mainApp.classList.contains('light-theme'))
      || localStorage.getItem('theme') === 'light';
    logo.src = isLight ? 'images/logolighttheme.png' : 'images/logoblack theme.png';
  }
  
  const API_BASE_URL = window.BACKEND_BASE_URL || 'http://127.0.0.1:8000';

  const chatHistory = document.getElementById('chat-history');
  let chatPlaceholder = chatHistory ? chatHistory.querySelector('.chat-placeholder') : null;
  const chatForm = document.getElementById('chat-input-form');
  const textarea = chatForm ? chatForm.querySelector('textarea') : null;
  const sendButton = chatForm ? chatForm.querySelector('.send-btn') : null;

  const addChatBtn = document.querySelector('.add-btn');
  const mainPanel = document.querySelector('.main-panel');

  const messageHistory = [];
  let conversationId = null;
  let isRequestPending = false;

  function createChatPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'chat-placeholder';
    placeholder.innerHTML = '<p>Отправьте свой первый вопрос, и я подготовлю ответ.</p>';
    return placeholder;
  }

  function enterChatMode() {
    if (mainPanel) {
      mainPanel.classList.add('chat-active');
    }
  }

  function exitChatMode() {
    if (mainPanel) {
      mainPanel.classList.remove('chat-active');
    }
  }

  function resetChatHistory() {
    if (!chatHistory) return;
    chatHistory.innerHTML = '';
    chatPlaceholder = createChatPlaceholder();
    chatHistory.appendChild(chatPlaceholder);
    chatHistory.scrollTop = 0;
    messageHistory.length = 0;
    conversationId = null;
    exitChatMode();
    if (textarea) {
      textarea.value = '';
      resizeTextarea(textarea);
      textarea.focus();
    }
  }

  function resizeTextarea(field) {
    field.style.height = 'auto';
    field.style.height = Math.min(field.scrollHeight, 200) + 'px';
  }

  function appendMessage(role, text, options = {}) {
    if (!chatHistory) return null;
    if (chatPlaceholder) {
      chatPlaceholder.classList.add('hidden');
    }

    const bubble = document.createElement('div');
    bubble.className = `chat-message ${role === 'user' ? 'from-user' : 'from-ai'}`;
    if (options.typing) {
      bubble.classList.add('typing');
    }
    if (options.error) {
      bubble.classList.add('error');
    }

    const content = document.createElement('div');
    content.className = 'chat-message-content';
    if (options.html) {
      content.innerHTML = options.html;
    } else {
      content.textContent = text;
    }

    bubble.appendChild(content);
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    if (role === 'user') {
      enterChatMode();
    }

    return bubble;
  }

  function setSendingState(state) {
    isRequestPending = state;
    if (sendButton) {
      sendButton.disabled = state;
      sendButton.classList.toggle('is-loading', state);
    }
  }

  function resolveErrorMessage(error) {
    if (!error) return 'Не удалось получить ответ. Попробуйте снова.';
    if (typeof error === 'string') return error;
    if (error.detail) {
      if (typeof error.detail === 'string') return error.detail;
      if (Array.isArray(error.detail)) {
        return error.detail.map(item => item.msg || item).join('\n');
      }
    }
    if (error.message) return error.message;
    return 'Не удалось получить ответ. Попробуйте снова.';
  }

  async function sendToAssistant() {
    const payload = {
      conversation_id: conversationId,
      messages: messageHistory,
    };

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (err) {
        errorBody = await response.text();
      }
      throw errorBody;
    }

    return response.json();
  }

  async function handleSend() {
    if (!textarea || isRequestPending) return;
    const value = textarea.value.trim();
    if (!value) return;

    appendMessage('user', value);
    messageHistory.push({ role: 'user', content: value });

    textarea.value = '';
    resizeTextarea(textarea);

    const typingBubble = appendMessage('assistant', '', {
      html: '<span class="typing-dots"><span></span><span></span><span></span></span>',
      typing: true
    });

    try {
      setSendingState(true);
      const data = await sendToAssistant();
      const reply = data?.reply?.trim() || 'Ответ не получен.';
      conversationId = data?.conversation_id || conversationId;

      if (typingBubble && typingBubble.parentElement) {
        typingBubble.remove();
      }

      messageHistory.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply);
    } catch (error) {
      if (typingBubble && typingBubble.parentElement) {
        typingBubble.remove();
      }
      const errorMessage = resolveErrorMessage(error);
      appendMessage('assistant', errorMessage, { error: true });
      console.error('Chat request failed:', error);
    } finally {
      setSendingState(false);
    }
  }

  if (chatForm && textarea) {
    resizeTextarea(textarea);

    textarea.addEventListener('input', () => resizeTextarea(textarea));

    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    });

    chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      handleSend();
    });
  }

  if (addChatBtn) {
    addChatBtn.addEventListener('click', resetChatHistory);
  }

  // Экспортируем API для будущей интеграции
  window.chatUi = {
    appendUserMessage: (text) => {
      messageHistory.push({ role: 'user', content: text });
      return appendMessage('user', text);
    },
    appendAssistantMessage: (text) => {
      messageHistory.push({ role: 'assistant', content: text });
      return appendMessage('assistant', text);
    },
    resetChat: resetChatHistory,
  };
  
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
    const logo = document.getElementById('logo-sign');
    if (logo) {
      logo.src = isLight ? 'images/logolighttheme.png' : 'images/logoblack theme.png';
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

  // Если пользователь не авторизован, обработчик для кнопки Войти
  if (!isAuth) {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        openAuthModal();
      });
    }
  }

  function openAuthModal() {
    if (document.querySelector('.auth-modal-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'auth-modal-overlay';

    overlay.innerHTML = `
      <div class="auth-card" data-step="email">
        <button class="auth-close" title="Закрыть">×</button>
        <div class="auth-logo">
          <img src="images/logolighttheme.png" alt="Logo" />
        </div>
        <h2 class="auth-title">Войдите в аккаунт</h2>
        <form class="auth-form auth-form-email" novalidate>
          <label class="auth-field">
            <span class="auth-label">Электронная почта</span>
            <input type="email" name="email" placeholder="example@mail.ru" required />
          </label>
          <p class="auth-hint">Укажите почту, к которой привязан ваш бизнес‑кабинет.</p>
          <button type="submit" class="auth-primary-btn">Продолжить</button>
          <label class="auth-checkbox">
            <input type="checkbox" checked />
            <span class="auth-checkbox-box"></span>
            <span>Соглашаюсь получать рекламные материалы</span>
          </label>
          <label class="auth-checkbox">
            <input type="checkbox" />
            <span class="auth-checkbox-box"></span>
            <span>Соглашаюсь на обработку персональных данных</span>
          </label>
          <p class="auth-error hidden"></p>
        </form>

        <form class="auth-form auth-form-code hidden" novalidate>
          <h3 class="auth-subtitle">Введите СМС код</h3>
          <p class="auth-text">Мы отправили код на почту: <span class="auth-email-value"></span></p>
          <div class="auth-code-row">
            <input type="text" inputmode="numeric" maxlength="1" class="auth-code-field" autofocus />
            <input type="text" inputmode="numeric" maxlength="1" class="auth-code-field" />
            <input type="text" inputmode="numeric" maxlength="1" class="auth-code-field" />
            <input type="text" inputmode="numeric" maxlength="1" class="auth-code-field" />
            <input type="text" inputmode="numeric" maxlength="1" class="auth-code-field" />
            <input type="text" inputmode="numeric" maxlength="1" class="auth-code-field" />
          </div>
          <p class="auth-timer">Отправить код повторно через 56 c...</p>
          <button type="submit" class="auth-primary-btn">Подтвердить</button>
          <label class="auth-checkbox">
            <input type="checkbox" />
            <span class="auth-checkbox-box"></span>
            <span>Запомнить меня</span>
          </label>
          <p class="auth-error hidden"></p>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('open');
    });

    const closeModal = () => {
      overlay.classList.remove('open');
      const card = overlay.querySelector('.auth-card');
      if (card) card.classList.remove('open');
      setTimeout(() => overlay.remove(), 320);
    };

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    const closeBtn = overlay.querySelector('.auth-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const emailForm = overlay.querySelector('.auth-form-email');
    const codeForm = overlay.querySelector('.auth-form-code');
    const emailInput = overlay.querySelector('input[name="email"]');
    const emailError = emailForm.querySelector('.auth-error');
    const codeError = codeForm.querySelector('.auth-error');
    const emailValueHolder = overlay.querySelector('.auth-email-value');
    const codeInputs = overlay.querySelectorAll('.auth-code-field');
    const timerText = overlay.querySelector('.auth-timer');

    let resendIntervalId = null;
    const RESEND_TIMEOUT = 56;

    function startTimer() {
      clearInterval(resendIntervalId);
      let secondsRemaining = RESEND_TIMEOUT;
      const tick = () => {
        if (secondsRemaining > 0) {
          timerText.textContent = `Отправить код повторно через ${secondsRemaining} c...`;
        } else {
          timerText.textContent = 'Можно запросить код повторно.';
          clearInterval(resendIntervalId);
        }
        secondsRemaining -= 1;
      };
      tick();
      resendIntervalId = setInterval(tick, 1000);
    }

    async function requestVerificationCode(email) {
      const response = await fetch(`${API_BASE_URL}/auth/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        let errorBody = null;
        try {
          errorBody = await response.json();
        } catch (err) {
          errorBody = await response.text();
        }
        throw errorBody;
      }
      return response.json();
    }

    async function verifyCodeBackend(email, code) {
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });
      if (!response.ok) {
        let errorBody = null;
        try {
          errorBody = await response.json();
        } catch (err) {
          errorBody = await response.text();
        }
        throw errorBody;
      }
      return response.json();
    }

    emailForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      emailError.classList.add('hidden');
      emailInput.classList.remove('auth-field-error');
      const email = emailInput.value.trim().toLowerCase();
      if (!validateEmail(email)) {
        emailError.textContent = 'Введите корректный адрес электронной почты';
        emailError.classList.remove('hidden');
        emailInput.classList.add('auth-field-error');
        return;
      }

      try {
        emailForm.classList.add('is-loading');
        await requestVerificationCode(email);
        emailValueHolder.textContent = email;
        emailForm.classList.add('hidden');
        codeForm.classList.remove('hidden');
        overlay.querySelector('.auth-card').dataset.step = 'code';
        startTimer();
        setTimeout(() => {
          codeInputs[0].focus();
        }, 60);
      } catch (error) {
        const errorMessage = resolveErrorMessage(error);
        emailError.textContent = errorMessage;
        emailError.classList.remove('hidden');
        emailInput.classList.add('auth-field-error');
        console.error('Code request failed:', error);
      } finally {
        emailForm.classList.remove('is-loading');
      }
    });

    codeInputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        const value = input.value.replace(/\D/g, '');
        input.value = value;
        if (value && index < codeInputs.length - 1) {
          codeInputs[index + 1].focus();
        }
        codeInputs.forEach(field => field.classList.remove('code-error'));
        codeError.classList.add('hidden');
      });
      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Backspace' && !input.value && index > 0) {
          codeInputs[index - 1].focus();
        }
      });
    });

    codeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = Array.from(codeInputs).map(inp => inp.value).join('');
      if (code.length < codeInputs.length) {
        codeError.textContent = 'Введите полный код';
        codeError.classList.remove('hidden');
        codeInputs.forEach(field => field.classList.add('code-error'));
        return;
      }

      try {
        codeForm.classList.add('is-loading');
        await verifyCodeBackend(emailValueHolder.textContent, code);
        localStorage.setItem('isAuth', 'true');
        localStorage.setItem('userEmail', emailValueHolder.textContent);
        closeModal();
        setTimeout(() => renderMainApp(), 320);
      } catch (error) {
        const errorMessage = resolveErrorMessage(error);
        codeError.textContent = errorMessage;
        codeError.classList.remove('hidden');
        codeInputs.forEach(field => field.classList.add('code-error'));
        console.error('Code verification failed:', error);
      } finally {
        codeForm.classList.remove('is-loading');
      }
    });
  }

  function validateEmail(email) {
    const re = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
    return re.test(email);
  }

  if (isAuth) {
    const onProfileOpen = () => {
      if (document.getElementById('sidebar-overlay')) return;
      const overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      const userEmail = localStorage.getItem('userEmail') || 'Гость';
      overlay.innerHTML = `
        <div class="sidebar">
          <button class="sidebar-close" title="Закрыть">×</button>
          <div class="sidebar-header">
            <img src="images/logoblacktheme.png" alt="avatar" class="sidebar-avatar" />
            <span class="sidebar-name">${userEmail}</span>
          </div>
          <button class="sidebar-logout">ВЫХОД</button>
        </div>
      `;
      document.body.appendChild(overlay);
      setTimeout(() => {
        overlay.classList.add('active');
        overlay.querySelector('.sidebar').classList.add('open');
      }, 10);
      overlay.querySelector('.sidebar-close').onclick = () => {
        overlay.classList.remove('active');
        overlay.querySelector('.sidebar').classList.remove('open');
        setTimeout(() => overlay.remove(), 310);
      };
      overlay.addEventListener('mousedown', e => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          overlay.querySelector('.sidebar').classList.remove('open');
          setTimeout(() => overlay.remove(), 310);
        }
      });
      overlay.querySelector('.sidebar-logout').onclick = () => {
        localStorage.removeItem('isAuth');
        localStorage.removeItem('userEmail');
        overlay.classList.remove('active');
        overlay.querySelector('.sidebar').classList.remove('open');
        setTimeout(() => {
          overlay.remove();
          renderMainApp();
        },310);
      };
    };
    setTimeout(() => {
      const btn = document.querySelector('.profile-btn');
      if (btn) btn.onclick = onProfileOpen;
    }, 0);
  }
}
