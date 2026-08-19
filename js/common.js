/**
 * QuizMaster - Common Shared Script
 * Handles Theme, API Key Settings Modal, Lucide Icons, and shared state helpers.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // Theme Switcher Logic
    // ==========================================================================
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon      = document.getElementById('theme-icon');

    const initialTheme = localStorage.getItem('quizmaster_theme') || 'light';
    if (initialTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
    }

    if (window.lucide) {
        window.lucide.createIcons();
    }

    if (btnThemeToggle && themeIcon) {
        btnThemeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            themeIcon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
            localStorage.setItem('quizmaster_theme', isDark ? 'dark' : 'light');
            if (window.lucide) window.lucide.createIcons();
        });
    }

    // ==========================================================================
    // Active Link Highlight in Navbar
    // ==========================================================================
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const linkHome = document.getElementById('link-home');
    const linkHistory = document.getElementById('link-history');

    if (linkHome && linkHistory) {
        linkHome.classList.remove('active');
        linkHistory.classList.remove('active');

        if (currentPath === 'history.html') {
            linkHistory.classList.add('active');
        } else {
            linkHome.classList.add('active');
        }
    }

    // ==========================================================================
    // API Key & Settings Modal Logic
    // ==========================================================================
    const btnSettingsToggle = document.getElementById('btn-settings-toggle');
    const modalApiSettings  = document.getElementById('modal-api-settings');
    const btnCloseApiModal  = document.getElementById('btn-close-api-modal');
    const btnCancelApiModal = document.getElementById('btn-cancel-api-modal');
    const formApiSettings   = document.getElementById('form-api-settings');
    const inputApiKey       = document.getElementById('input-api-key');
    const inputModelName    = document.getElementById('input-model-name');

    const DEFAULT_API_KEY = (typeof window !== 'undefined' && window.ENV && window.ENV.GEMINI_API_KEY) || '';
    const DEFAULT_MODEL   = 'gemini-3.5-flash-lite';

    let geminiApiKey = localStorage.getItem('quizmaster_gemini_key') || DEFAULT_API_KEY;
    let geminiModel  = localStorage.getItem('quizmaster_gemini_model') || DEFAULT_MODEL;

    // Pre-populate localStorage with the key if not set
    if (!localStorage.getItem('quizmaster_gemini_key')) {
        localStorage.setItem('quizmaster_gemini_key', DEFAULT_API_KEY);
    }
    if (!localStorage.getItem('quizmaster_gemini_model')) {
        localStorage.setItem('quizmaster_gemini_model', DEFAULT_MODEL);
    }

    function openApiModal() {
        if (!modalApiSettings) return;
        modalApiSettings.classList.remove('hidden');
        if (inputApiKey) inputApiKey.value = geminiApiKey;
        if (inputModelName) inputModelName.value = geminiModel;
    }

    function closeApiModal() {
        if (modalApiSettings) modalApiSettings.classList.add('hidden');
    }

    if (btnSettingsToggle) {
        btnSettingsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            openApiModal();
        });
    }
    if (btnCloseApiModal)  btnCloseApiModal.addEventListener('click', closeApiModal);
    if (btnCancelApiModal) btnCancelApiModal.addEventListener('click', closeApiModal);
    if (modalApiSettings) {
        modalApiSettings.addEventListener('click', (e) => {
            if (e.target === modalApiSettings) closeApiModal();
        });
    }

    if (formApiSettings) {
        formApiSettings.addEventListener('submit', (e) => {
            e.preventDefault();
            const keyVal   = inputApiKey ? inputApiKey.value.trim() : '';
            const modelVal = inputModelName && inputModelName.value.trim() ? inputModelName.value.trim() : 'gemini-3.5-flash-lite';

            localStorage.setItem('quizmaster_gemini_key', keyVal);
            localStorage.setItem('quizmaster_gemini_model', modelVal);

            closeApiModal();
            alert('Pengaturan API Gemini berhasil disimpan!');
        });
    }

    // Expose global open modal helper for other scripts
    window.openApiModal = openApiModal;

    // Initialize Floating Gemini AI Chat Widget
    initFloatingAIChat();
});

// ==========================================================================
// Math LaTeX Sanitizer & Normalizer
// ==========================================================================
function fixMathFormatting(text) {
    if (!text || typeof text !== 'string') return text;

    let clean = text;

    // 1. Unescape \$ to $ so KaTeX delimiter matching works properly
    clean = clean.replace(/\\(\$)/g, '$1');

    // 2. Fix double backslashes in LaTeX commands (e.g. \\times -> \times, \\frac -> \frac)
    clean = clean.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

    // 3. Fix Indonesian log notation: ^2\log 8 or ^{2}\log 8 -> {}^{2}\log 8
    // We match a caret, followed by optional braces with alphanumeric, then \log
    // We add a lookbehind/grouping equivalent to ensure we don't break existing {}^{2}
    clean = clean.replace(/(^|[^}\w])\^(\{?[0-9a-zA-Z]+\}?)\\log/g, (match, prefix, base) => {
        const b = base.replace(/[{}]/g, '');
        return `${prefix}{}^{${b}}\\log`;
    });

    return clean;
}

// Global KaTeX helper — single-pass, safe for dynamic elements
function safeRenderMath(element) {
    if (!element) return;

    const doRender = () => {
        if (window.renderMathInElement) {
            try {
                window.renderMathInElement(element, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$',  right: '$',  display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true  }
                    ],
                    throwOnError: false,
                    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                });
            } catch (e) {
                console.error('KaTeX auto-render error:', e);
            }
        } else if (window.katex) {
            try {
                const targets = Array.from(
                    element.querySelectorAll(
                        '.option-text, .gform-q-text, .feedback-alert, ' +
                        '.history-question, .history-explanation, .fchat-msg-bubble'
                    )
                );
                const selfClasses = [
                    'option-text','gform-q-text','feedback-alert',
                    'history-question','history-explanation','fchat-msg-bubble'
                ];
                if (element.classList && selfClasses.some(c => element.classList.contains(c))) {
                    targets.push(element);
                }
                targets.forEach(target => {
                    if (target.innerHTML.includes('$')) {
                        target.innerHTML = target.innerHTML.replace(/\$([^$]+)\$/g, (_, tex) =>
                            window.katex.renderToString(tex, { throwOnError: false })
                        );
                    }
                });
            } catch (e) {
                console.error('KaTeX direct render error:', e);
            }
        } else {
            // KaTeX not yet loaded — retry once
            setTimeout(doRender, 150);
        }
    };

    // Single requestAnimationFrame — no extra setTimeout to avoid double-render
    requestAnimationFrame(doRender);
}

// ==========================================================================
// Floating AI Chat Widget (fchat) Component
// ==========================================================================
function initFloatingAIChat() {
    if (document.getElementById('fchat-root')) return;

    const fchatRoot = document.createElement('div');
    fchatRoot.id = 'fchat-root';
    fchatRoot.innerHTML = `
        <button class="fchat-trigger-btn" id="fchat-toggle-btn" title="Tanya AI Master (Chat Assistant)" aria-label="Buka Chat AI">
            <i data-lucide="bot" class="fchat-icon"></i>
            <span class="fchat-pulse-ring"></span>
            <span class="fchat-badge">AI</span>
        </button>

        <div class="fchat-window hidden" id="fchat-window">
            <div class="fchat-header">
                <div class="fchat-header-brand">
                    <div class="fchat-avatar"><i data-lucide="bot"></i></div>
                    <div class="fchat-title-wrapper">
                        <h4>QuizMaster AI <span class="fchat-online-dot"></span></h4>
                        <span class="fchat-subtitle">Tutor Belajar Gemini AI</span>
                    </div>
                </div>
                <div class="fchat-header-actions">
                    <button class="fchat-header-btn" id="fchat-btn-settings" title="Pengaturan API Gemini">
                        <i data-lucide="settings"></i>
                    </button>
                    <button class="fchat-header-btn" id="fchat-btn-clear" title="Bersihkan Chat">
                        <i data-lucide="rotate-ccw"></i>
                    </button>
                    <button class="fchat-header-btn" id="fchat-btn-close" title="Tutup Chat">
                        <i data-lucide="x"></i>
                    </button>
                </div>
            </div>

            <div class="fchat-body" id="fchat-body">
                <div class="fchat-msg model">
                    <div class="fchat-msg-bubble">
                        👋 <strong>Halo! Saya QuizMaster AI Tutor.</strong><br>
                        Ada materi Matematika/Fisika atau rumus yang membingungkan? Tanyakan saja di sini, saya siap membantu menjelaskan secara rinci!
                    </div>
                </div>

                <div class="fchat-chips" id="fchat-chips">
                    <button class="fchat-chip-btn" data-prompt="Jelaskan konsep dasar Logaritma dan sifat-sifat utamanya!">💡 Konsep Logaritma</button>
                    <button class="fchat-chip-btn" data-prompt="Bagaimana langkah menghitung \${}^{2}\\log 8 = 3$? Jelaskan!">📐 Hitung ²log 8</button>
                    <button class="fchat-chip-btn" data-prompt="Berikan 1 contoh soal latihan logaritma tingkat SMA beserta pembahasan!">✏️ Contoh Soal Logaritma</button>
                </div>
            </div>

            <div class="fchat-footer">
                <form class="fchat-input-form" id="fchat-form">
                    <input type="text" class="fchat-input-field" id="fchat-input" placeholder="Tanyakan rumus, konsep, atau soal..." autocomplete="off">
                    <button type="submit" class="fchat-send-btn" id="fchat-send" title="Kirim Pesan">
                        <i data-lucide="send"></i>
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(fchatRoot);
    if (window.lucide) window.lucide.createIcons();

    // DOM References
    const toggleBtn   = document.getElementById('fchat-toggle-btn');
    const fchatWindow = document.getElementById('fchat-window');
    const btnClose    = document.getElementById('fchat-btn-close');
    const btnSettings = document.getElementById('fchat-btn-settings');
    const btnClear    = document.getElementById('fchat-btn-clear');
    const fchatBody   = document.getElementById('fchat-body');
    const fchatForm   = document.getElementById('fchat-form');
    const fchatInput  = document.getElementById('fchat-input');
    const fchatChips  = document.getElementById('fchat-chips');

    // Conversation Memory
    let chatHistory = [];

    const SYSTEM_PROMPT = `Kamu adalah QuizMaster AI Tutor, asisten tutor pintar dan ramah yang membantu siswa belajar Matematika dan Fisika (SD, SMP, SMA).
Jelaskan konsep dengan sangat jelas, ringkas, dan sistematis. 
WAJIB: Gunakan format LaTeX math dibungkus simbol dollar ($ ... $) untuk semua rumus dan persamaan matematika (contoh: \${}^{2}\\log 8 = 3\$ atau \$\\log_2 8 = 3\$). Jawablah selalu dalam Bahasa Indonesia.`;

    function toggleChat(show) {
        if (show === undefined) {
            fchatWindow.classList.toggle('hidden');
        } else if (show) {
            fchatWindow.classList.remove('hidden');
        } else {
            fchatWindow.classList.add('hidden');
        }
        if (!fchatWindow.classList.contains('hidden')) {
            setTimeout(() => fchatInput.focus(), 150);
            safeRenderMath(fchatBody);
        }
    }

    if (toggleBtn) toggleBtn.addEventListener('click', () => toggleChat());
    if (btnClose)  btnClose.addEventListener('click', () => toggleChat(false));
    if (btnSettings) btnSettings.addEventListener('click', () => {
        if (window.openApiModal) window.openApiModal();
    });

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            chatHistory = [];
            fchatBody.innerHTML = `
                <div class="fchat-msg model">
                    <div class="fchat-msg-bubble">
                        🔄 <strong>Percakapan dibersihkan.</strong><br>Ada pertanyaan baru seputar Matematika atau Fisika?
                    </div>
                </div>
            `;
            safeRenderMath(fchatBody);
        });
    }

    if (fchatChips) {
        fchatChips.addEventListener('click', (e) => {
            const chip = e.target.closest('.fchat-chip-btn');
            if (chip && chip.dataset.prompt) {
                const prompt = chip.dataset.prompt;
                fchatInput.value = prompt;
                fchatForm.dispatchEvent(new Event('submit'));
                chip.remove();
            }
        });
    }

    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `fchat-msg ${role}`;

        // Apply math fix on raw text FIRST, then escape only non-math chars
        const fixedText = fixMathFormatting(text);
        // Escape HTML but preserve $ delimiters and LaTeX backslashes in math spans
        const formattedText = fixedText
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        let toolsHTML = '';
        if (role === 'model') {
            toolsHTML = `
                <div class="fchat-msg-tools">
                    <button class="fchat-msg-action-btn copy-btn" title="Salin Teks">
                        <i data-lucide="copy"></i> Salin
                    </button>
                    <button class="fchat-msg-action-btn scratch-btn" title="Kirim ke Ruang Coretan Notepad">
                        <i data-lucide="edit-3"></i> Kirim ke Coretan
                    </button>
                </div>
            `;
        }

        msgDiv.innerHTML = `<div class="fchat-msg-bubble">${formattedText}</div>${toolsHTML}`;
        fchatBody.appendChild(msgDiv);

        if (role === 'model') {
            const copyBtn = msgDiv.querySelector('.copy-btn');
            const scratchBtn = msgDiv.querySelector('.scratch-btn');

            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(text);
                    copyBtn.innerHTML = `<i data-lucide="check"></i> Tersalin`;
                    setTimeout(() => {
                        copyBtn.innerHTML = `<i data-lucide="copy"></i> Salin`;
                        if (window.lucide) window.lucide.createIcons();
                    }, 2000);
                    if (window.lucide) window.lucide.createIcons();
                });
            }

            if (scratchBtn) {
                scratchBtn.addEventListener('click', () => {
                    const notepad = document.getElementById('notepad-area');
                    if (notepad) {
                        notepad.value += `\n\n--- Catatan AI Tutor ---\n${text}\n`;
                        scratchBtn.innerHTML = `<i data-lucide="check"></i> Masuk Coretan`;
                        setTimeout(() => {
                            scratchBtn.innerHTML = `<i data-lucide="edit-3"></i> Kirim ke Coretan`;
                            if (window.lucide) window.lucide.createIcons();
                        }, 2000);
                        if (window.lucide) window.lucide.createIcons();
                    } else {
                        alert('Fitur "Kirim ke Coretan" tersedia saat berada di halaman Ruang Kerja Latihan!');
                    }
                });
            }
        }

        safeRenderMath(msgDiv);
        if (window.lucide) window.lucide.createIcons();
        fchatBody.scrollTop = fchatBody.scrollHeight;
    }

    function showTypingIndicator() {
        const typing = document.createElement('div');
        typing.className = 'fchat-msg model';
        typing.id = 'fchat-typing-indicator';
        typing.innerHTML = `
            <div class="fchat-typing">
                <div class="fchat-typing-dot"></div>
                <div class="fchat-typing-dot"></div>
                <div class="fchat-typing-dot"></div>
            </div>
        `;
        fchatBody.appendChild(typing);
        fchatBody.scrollTop = fchatBody.scrollHeight;
    }

    function hideTypingIndicator() {
        const typing = document.getElementById('fchat-typing-indicator');
        if (typing) typing.remove();
    }

    async function sendUserMessageToGemini(userText) {
        appendMessage('user', userText);
        showTypingIndicator();

        const DEFAULT_API_KEY = (typeof window !== 'undefined' && window.ENV && window.ENV.GEMINI_API_KEY) || '';
        const DEFAULT_MODEL   = 'gemini-3.5-flash-lite';

        const apiKey = localStorage.getItem('quizmaster_gemini_key') || DEFAULT_API_KEY;
        const model  = localStorage.getItem('quizmaster_gemini_model') || DEFAULT_MODEL;

        chatHistory.push({ role: 'user', parts: [{ text: userText }] });

        const contentsPayload = [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'Siap! Saya QuizMaster AI Tutor. Saya akan menjawab pertanyaan Anda dengan format LaTeX math ($...$) yang rapi dan penjelasan terstruktur dalam Bahasa Indonesia.' }] },
            ...chatHistory
        ];

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: contentsPayload })
            });

            hideTypingIndicator();

            if (!response.ok) {
                throw new Error(`API Error Status: ${response.status}`);
            }

            const data = await response.json();
            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, AI tidak memberikan respon.';

            chatHistory.push({ role: 'model', parts: [{ text: replyText }] });
            appendMessage('model', replyText);

        } catch (error) {
            hideTypingIndicator();
            console.error('Gemini Chat Error:', error);
            appendMessage('model', `⚠️ **Gagal terhubung ke AI Gemini.**\nPastikan API Key di Pengaturan AI sudah benar. (${error.message})`);
        }
    }

    if (fchatForm) {
        fchatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = fchatInput.value.trim();
            if (!text) return;
            fchatInput.value = '';
            sendUserMessageToGemini(text);
        });
    }

    // Expose helper to open chat from anywhere
    window.openFloatingChat = function(initialPrompt) {
        toggleChat(true);
        if (initialPrompt) {
            fchatInput.value = initialPrompt;
            fchatForm.dispatchEvent(new Event('submit'));
        }
    };
}

// Global Storage Helpers
function getHistory() {
    return JSON.parse(localStorage.getItem('quizmaster_history') || '[]');
}

function saveHistory(list) {
    localStorage.setItem('quizmaster_history', JSON.stringify(list));
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]||t));
}

