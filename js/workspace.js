/**
 * QuizMaster - Workspace Script (js/workspace.js)
 * Manages 5-Question Quiz Batch, Gemini AI Generation, Essay Grader, Scratchpad & Whiteboard Canvas.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // URL Query Params & Initial State
    // ==========================================================================
    const urlParams = new URLSearchParams(window.location.search);
    const currentLevel      = urlParams.get('level') || 'sd';
    const currentSubject    = urlParams.get('subject') || 'matematika';
    const currentSubtopic   = urlParams.get('subtopic') || 'penjumlahan-pengurangan';

    let currentDifficulty = 'easy';
    let currentType       = 'pilihan-ganda';

    const DEFAULT_API_KEY = (typeof window !== 'undefined' && window.ENV && window.ENV.GEMINI_API_KEY) || '';
    const DEFAULT_MODEL   = 'gemini-3.5-flash-lite';

    let geminiApiKey = localStorage.getItem('quizmaster_gemini_key') || DEFAULT_API_KEY;
    let geminiModel  = localStorage.getItem('quizmaster_gemini_model') || DEFAULT_MODEL;

    // DOM Elements
    const badgeCurrentSubject   = document.getElementById('badge-current-subject');
    const badgeCurrentSubtopic  = document.getElementById('badge-current-subtopic');
    const btnBackHome           = document.getElementById('btn-back-home');
    const btnRegenerateQuestion = document.getElementById('btn-regenerate-question');
    const btnSubmitAnswer       = document.getElementById('btn-submit-answer');

    const difficultyToggle = document.getElementById('difficulty-toggle');
    const typeToggle       = document.getElementById('type-toggle');

    const gformQuestionsWrapper = document.getElementById('gform-questions-wrapper');
    const gformBatchIndicator   = document.getElementById('gform-batch-indicator');
    const gformScoreBadge       = document.getElementById('gform-score-badge');

    // Scratchpad & Canvas Elements
    const scratchpadModeToggle   = document.getElementById('scratchpad-mode-toggle');
    const scratchpadTextWrapper  = document.getElementById('scratchpad-text-wrapper');
    const scratchpadCanvasWrapper= document.getElementById('scratchpad-canvas-wrapper');
    const paintCanvas            = document.getElementById('paint-canvas');
    const canvasColor            = document.getElementById('canvas-color');
    const canvasWidth            = document.getElementById('canvas-width');
    const widthIndicator         = document.getElementById('width-indicator');
    const btnCanvasUndo          = document.getElementById('btn-canvas-undo');
    const btnCanvasClear         = document.getElementById('btn-canvas-clear');

    const ctx = paintCanvas ? paintCanvas.getContext('2d') : null;

    // Canvas Drawing State
    let isDrawing     = false;
    let canvasHistory = [];

    // Header Badges Init
    if (badgeCurrentSubject)  badgeCurrentSubject.textContent  = currentSubject === 'matematika' ? 'Matematika' : 'Fisika';
    if (badgeCurrentSubtopic) badgeCurrentSubtopic.textContent = currentSubtopic.replace(/-/g, ' ').toUpperCase();

    if (btnBackHome) {
        btnBackHome.addEventListener('click', () => {
            window.location.href = 'index.html#step-subject-container';
        });
    }

    // ==========================================================================
    // Question Bank Data Definition
    // ==========================================================================
    const questionBank = {
        sd: {
            matematika: {
                'penjumlahan-pengurangan': {
                    easy: [
                        { question: "Berapakah hasil dari $5 + 3$?", type: "pilihan-ganda", options: ["6", "7", "8", "9"], correctIndex: 2, explanation: "$5 + 3 = 8$." },
                        { question: "Hitunglah $15 - 7$.", type: "pilihan-ganda", options: ["7", "8", "9", "6"], correctIndex: 1, explanation: "$15 - 7 = 8$." },
                        { question: "Jelaskan cara menghitung $12 + 9$ menggunakan penjumlahan bersusun.", type: "essay", answerKeywords: ["21", "dua puluh satu"], explanation: "Susun secara vertikal: 12 + 9 = 21." }
                    ],
                    medium: [
                        { question: "Mana sajakah pernyataan yang BENAR tentang penjumlahan dan pengurangan berikut?", type: "multiple-choices", options: ["$20 + 30 = 50$", "$45 - 20 = 15$", "$18 + 12 = 30$", "$100 - 55 = 55$"], correctIndices: [0, 2, 3], explanation: "$20+30=50$ ✓, $18+12=30$ ✓, $100-55=45$ ✗." },
                        { question: "Ibu membeli 24 butir telur. Digunakan 9 butir untuk memasak. Berapa sisa telur ibu?", type: "essay", answerKeywords: ["15", "lima belas"], explanation: "$24 - 9 = 15$ butir telur tersisa." }
                    ],
                    hard: [
                        { question: "Pak Ali memiliki 135 buku. Beliau menyumbangkan 48 buku dan membeli 27 buku baru. Berapakah jumlah buku Pak Ali sekarang?", type: "pilihan-ganda", options: ["114", "110", "116", "120"], correctIndex: 0, explanation: "$135 - 48 + 27 = 114$ buku." }
                    ]
                },
                'perkalian-pembagian': {
                    easy: [
                        { question: "Berapakah hasil dari $6 \\times 7$?", type: "pilihan-ganda", options: ["42", "36", "48", "54"], correctIndex: 0, explanation: "$6 \\times 7 = 42$." },
                        { question: "Hitunglah $56 \\div 8$.", type: "essay", answerKeywords: ["7", "tujuh"], explanation: "$56 \\div 8 = 7$." }
                    ],
                    medium: [
                        { question: "Manakah pernyataan berikut yang benar?", type: "multiple-choices", options: ["$9 \\times 9 = 81$", "$7 \\times 8 = 54$", "$48 \\div 6 = 8$", "$63 \\div 7 = 9$"], correctIndices: [0, 2, 3], explanation: "$9\\times9=81$✓, $48\\div6=8$✓, $63\\div7=9$✓." }
                    ],
                    hard: [
                        { question: "Sebuah kardus berisi 12 kotak kue. Setiap kotak berisi 8 kue. Jika terdapat 5 kardus, berapakah total kue seluruhnya?", type: "pilihan-ganda", options: ["480", "420", "500", "460"], correctIndex: 0, explanation: "$5 \\times 12 \\times 8 = 480$ kue." }
                    ]
                },
                'pengukuran-sd': {
                    easy: [
                        { question: "Sebuah pensil memiliki panjang $15\\text{ cm}$. Berapakah panjang pensil jika dinyatakan dalam milimeter ($1\\text{ cm} = 10\\text{ mm}$)?", type: "pilihan-ganda", options: ["$150\\text{ mm}$", "$1.5\\text{ mm}$", "$1500\\text{ mm}$", "$15\\text{ mm}$"], correctIndex: 0, explanation: "$15\\text{ cm} \\times 10 = 150\\text{ mm}$." },
                        { question: "Hitunglah hasil dari $3\\text{ m} + 250\\text{ cm}$ dalam satuan sentimeter ($1\\text{ m} = 100\\text{ cm}$).", type: "pilihan-ganda", options: ["$550\\text{ cm}$", "$253\\text{ cm}$", "$325\\text{ cm}$", "$500\\text{ cm}$"], correctIndex: 0, explanation: "$3\\text{ m} = 300\\text{ cm} \\Rightarrow 300 + 250 = 550\\text{ cm}$." },
                        { question: "Ibu membeli $2\\text{ kg}$ gula. Berapa gramkah gula tersebut ($1\\text{ kg} = 1000\\text{ g}$)?", type: "essay", answerKeywords: ["2000", "dua ribu"], explanation: "$2\\text{ kg} \\times 1000 = 2000\\text{ g}$." }
                    ],
                    medium: [
                        { question: "Manakah konversi satuan pengukuran berikut yang BENAR?", type: "multiple-choices", options: ["$1\\text{ m} = 100\\text{ cm}$", "$2\\text{ km} = 2000\\text{ m}$", "$500\\text{ cm} = 5\\text{ m}$", "$1\\text{ m} = 10\\text{ cm}$"], correctIndices: [0, 1, 2], explanation: "$1\\text{ m} = 100\\text{ cm}$ ✓, $2\\text{ km} = 2000\\text{ m}$ ✓, $500\\text{ cm} = 5\\text{ m}$ ✓." },
                        { question: "Sebuah ember dapat menampung $5\\text{ liter}$ air. Berapa mililiter kapasitas ember tersebut ($1\\text{ liter} = 1000\\text{ ml}$)?", type: "essay", answerKeywords: ["5000", "lima ribu"], explanation: "$5 \\times 1000 = 5000\\text{ ml}$." }
                    ],
                    hard: [
                        { question: "Ayah mengendarai mobil selama $2\\text{ jam } 30\\text{ menit}$. Berapa total menit perjalanan Ayah?", type: "pilihan-ganda", options: ["$150\\text{ menit}$", "$120\\text{ menit}$", "$180\\text{ menit}$", "$140\\text{ menit}$"], correctIndex: 0, explanation: "$(2 \\times 60) + 30 = 120 + 30 = 150\\text{ menit}$." }
                    ]
                }
            },
            fisika: {
                'sifat-benda': {
                    easy: [
                        { question: "Air termasuk benda berwujud apa?", type: "pilihan-ganda", options: ["Padat", "Cair", "Gas", "Plasma"], correctIndex: 1, explanation: "Air berwujud cair." },
                        { question: "Sebutkan 3 contoh benda padat yang ada di sekitarmu!", type: "essay", answerKeywords: ["batu", "kayu", "meja", "buku", "kursi"], explanation: "Contoh benda padat: batu, kayu, meja, buku, kursi." }
                    ]
                }
            }
        },
        smp: {
            matematika: {
                'aljabar-dasar': {
                    easy: [
                        { question: "Tentukan nilai $x$ dari: $2x + 5 = 13$.", type: "pilihan-ganda", options: ["$x = 3$", "$x = 4$", "$x = 5$", "$x = 6$"], correctIndex: 1, explanation: "$2x = 8 \\Rightarrow x = 4$." },
                        { question: "Sederhanakan: $4a + 3b - 2a + b$.", type: "essay", answerKeywords: ["2a", "4b", "2a + 4b"], explanation: "$(4a-2a) + (3b+b) = 2a + 4b$." }
                    ]
                },
                'pythagoras': {
                    easy: [
                        { question: "Pada segitiga siku-siku dengan sisi $a = 3$ dan $b = 4$, berapakah hipotenusa $c$?", type: "pilihan-ganda", options: ["5", "6", "7", "8"], correctIndex: 0, explanation: "$c = \\sqrt{3^2 + 4^2} = 5$." }
                    ]
                }
            },
            fisika: {
                'besaran-satuan': {
                    easy: [
                        { question: "Satuan SI untuk panjang adalah...", type: "pilihan-ganda", options: ["Kilometer", "Sentimeter", "Meter", "Inci"], correctIndex: 2, explanation: "Satuan SI panjang adalah meter." }
                    ]
                }
            }
        },
        sma: {
            matematika: {
                'trigonometri-sma': {
                    easy: [
                        { question: "Nilai dari $\\sin 30^\\circ + \\cos 60^\\circ$ adalah...", type: "pilihan-ganda", options: ["0", "$\\frac{1}{2}$", "1", "$\\frac{\\sqrt{3}}{2}$"], correctIndex: 2, explanation: "$\\frac{1}{2} + \\frac{1}{2} = 1$." }
                    ]
                },
                'logaritma': {
                    easy: [
                        { question: "Untuk mencari nilai ${}^{2}\\log 8$, kita mencari pangkat berapa yang harus diberikan kepada 2 agar menghasilkan 8. Berapakah nilainya?", type: "pilihan-ganda", options: ["2", "3", "4", "8"], correctIndex: 1, explanation: "Karena $2^3 = 8$, maka ${}^{2}\\log 8 = 3$." },
                        { question: "Hitunglah nilai dari ${}^{3}\\log 81$.", type: "pilihan-ganda", options: ["3", "4", "5", "9"], correctIndex: 1, explanation: "Karena $3^4 = 81$, maka ${}^{3}\\log 81 = 4$." },
                        { question: "Tentukan hasil dari ${}^{5}\\log 125$.", type: "essay", answerKeywords: ["3", "tiga"], explanation: "Karena $5^3 = 125$, maka ${}^{5}\\log 125 = 3$." }
                    ],
                    medium: [
                        { question: "Sederhanakan ekspresi logaritma: ${}^{2}\\log 4 + {}^{2}\\log 8$.", type: "pilihan-ganda", options: ["4", "5", "6", "32"], correctIndex: 1, explanation: "Menggunakan sifat logaritma ${}^{a}\\log b + {}^{a}\\log c = {}^{a}\\log(b \\times c)$: ${}^{2}\\log(4 \\times 8) = {}^{2}\\log 32 = 5$ (karena $2^5 = 32$)." }
                    ],
                    hard: [
                        { question: "Jika ${}^{2}\\log 3 = a$ dan ${}^{2}\\log 5 = b$, tentukan nilai dari ${}^{2}\\log 60$.", type: "pilihan-ganda", options: ["$a + b + 1$", "$a + b + 2$", "$2a + b$", "$a + 2b$"], correctIndex: 1, explanation: "$60 = 4 \\times 3 \\times 5 = 2^2 \\times 3 \\times 5$. Maka ${}^{2}\\log 60 = {}^{2}\\log(2^2) + {}^{2}\\log 3 + {}^{2}\\log 5 = 2 + a + b$." }
                    ]
                }
            },
            fisika: {
                'kinematika': {
                    easy: [
                        { question: "Sebuah benda dilempar vertikal ke atas dengan $v_0 = 20$ m/s. Waktu untuk mencapai tinggi maksimum ($g = 10$ m/s²) adalah...", type: "pilihan-ganda", options: ["1 s", "2 s", "3 s", "4 s"], correctIndex: 1, explanation: "$t = \\frac{20}{10} = 2$ s." }
                    ]
                }
            }
        }
    };

    // State for 5 questions batch
    let currentQuestionsBatch = [];
    let userAnswersBatch = {};

    // Gemini AI API Fetcher
    async function fetchQuestionsFromGemini(targetCount, difficulty, topic, type) {
        const typeDesc = type === 'multiple-choices' ? 'Pilihan Ganda Kompleks' : (type === 'essay' ? 'Essay' : 'Pilihan Ganda');
        const prompt = `Buatlah tepat ${targetCount} soal latihan matematika/fisika tingkat ${currentLevel} tentang subtopik "${topic}" dengan tingkat kesulitan "${difficulty}" dan tipe "${typeDesc}".
WAJIB: Gunakan notasi LaTeX dibungkus simbol dollar ($ ... $) untuk semua formula dan angka matematika (contoh: \${}^{2}\\log 8 = 3$ atau $\\log_2 8 = 3$ atau $2^3 = 8$). JANGAN gunakan backslash sebelum dollar (jangan pakai \\$).
Kembalikan respon DALAM FORMAT JSON MURNI TANPA MARKDOWN CODEBLOCK:
[
  {
    "type": "${type}",
    "question": "teks soal...",
    "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
    "correctIndex": 0,
    "correctIndices": [0, 2],
    "answerKeywords": ["kata1", "kata2"],
    "explanation": "pembahasan..."
  }
]`;

        geminiApiKey = localStorage.getItem('quizmaster_gemini_key') || DEFAULT_API_KEY;
        geminiModel  = localStorage.getItem('quizmaster_gemini_model') || DEFAULT_MODEL;

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            text = jsonMatch[0];
        } else {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        return JSON.parse(text);
    }

    // Dynamic Variation Generator Fallback
    function buildDynamicQuestionVariation(indexNum) {
        const diffStr = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
        const isMulti = currentType === 'multiple-choices';
        const isEssay = currentType === 'essay';

        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 12) + 3;
        const result = a * b;

        if (isEssay) {
            return {
                type: 'essay',
                question: `Soal #${indexNum} [${diffStr}]: Berikan analisis lengkap dan tentukan hasil dari perhitungan $${a} \\times ${b}$ serta jelaskan langkah-langkah penyelesaiannya terkait materi "${currentSubtopic}".`,
                answerKeywords: [result.toString(), "langkah", "perhitungan"],
                explanation: `Hasil perhitungan adalah $${a} \\times ${b} = ${result}$. Langkah penyelesaian diawali dengan mengalikan koefisien utama.`
            };
        }

        if (isMulti) {
            return {
                type: 'multiple-choices',
                question: `Soal #${indexNum} [${diffStr}]: Manakah pernyataan yang BENAR mengenai materi "${currentSubtopic}" dan nilai $${a} \\times ${b} = ${result}$? (Pilih semua yang tepat)`,
                options: [
                    `Hasil $${a} \\times ${b}$ adalah ${result}`,
                    `Hasil $${a} \\times ${b}$ adalah ${result + 2}`,
                    `Nilai ${result} merupakan bilangan genap`,
                    `Perhitungan ini bagian dari prinsip ${currentSubtopic}`
                ],
                correctIndices: [0, 2, 3],
                explanation: `$${a} \\times ${b} = ${result}$ (Benar), ${result} genap (Benar), dan sesuai dengan konsep ${currentSubtopic} (Benar).`
            };
        }

        const wrong1 = result + 2;
        const wrong2 = result - 3 > 0 ? result - 3 : result + 5;
        const wrong3 = result + 10;
        const optionsList = [`$${result}$`, `$${wrong1}$`, `$${wrong2}$`, `$${wrong3}$`].sort(() => Math.random() - 0.5);
        const correctIdx = optionsList.indexOf(`$${result}$`);

        return {
            type: 'pilihan-ganda',
            question: `Soal #${indexNum} [${diffStr}]: Berapakah hasil penyelesaian dari ekspresi $${a} \\times ${b}$ dalam topik "${currentSubtopic}"?`,
            options: optionsList,
            correctIndex: correctIdx,
            explanation: `Perhitungan langsung: $${a} \\times ${b} = ${result}$.`
        };
    }

    // Generate Quiz Questions Batch (Always fetch from AI Gemini directly by default)
    async function generateQuizQuestion(useAI = true) {
        userAnswersBatch = {};
        if (gformScoreBadge) gformScoreBadge.classList.add('hidden');

        const typeLabel = currentType === 'pilihan-ganda' ? 'Pilihan Ganda' : currentType === 'multiple-choices' ? 'PG Kompleks' : 'Essay';
        const diffLabel = currentDifficulty.toUpperCase();
        if (gformBatchIndicator) {
            gformBatchIndicator.textContent = `Paket 5 Soal [${diffLabel}] — ${typeLabel}`;
        }

        const targetCount = 5;

        if (gformQuestionsWrapper) {
            gformQuestionsWrapper.innerHTML = `
                <div style="padding:40px; text-align:center; color:var(--text-muted);">
                    <i data-lucide="loader-2" style="animation: spin 2s linear infinite; margin-bottom:12px; width:32px; height:32px;"></i>
                    <p>Memanggil AI Gemini (gemini-3.5-flash-lite) untuk meracik 5 soal baru...</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        try {
            if (useAI) {
                geminiApiKey = localStorage.getItem('quizmaster_gemini_key') || DEFAULT_API_KEY;
                if (!geminiApiKey) {
                    if (window.openApiModal) window.openApiModal();
                    throw new Error("Silakan masukkan API Key Gemini terlebih dahulu di menu Pengaturan AI!");
                }
                const topicName = currentSubtopic.replace(/-/g, ' ');
                const aiQuestions = await fetchQuestionsFromGemini(targetCount, currentDifficulty, topicName, currentType);
                if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
                    currentQuestionsBatch = aiQuestions;
                } else {
                    throw new Error("Respon AI tidak berisi daftar soal yang valid.");
                }
            } else {
                const subjectData = questionBank[currentLevel]?.[currentSubject]?.[currentSubtopic];
                let availablePool = subjectData ? (subjectData[currentDifficulty] || subjectData['easy'] || []).filter(q => q.type === currentType) : [];

                currentQuestionsBatch = [];
                const shuffledPool = [...availablePool].sort(() => Math.random() - 0.5);

                for (let i = 0; i < targetCount; i++) {
                    if (i < shuffledPool.length) {
                        const picked = JSON.parse(JSON.stringify(shuffledPool[i]));
                        picked.type = currentType;
                        currentQuestionsBatch.push(picked);
                    } else {
                        currentQuestionsBatch.push(buildDynamicQuestionVariation(i + 1));
                    }
                }
            }
        } catch (error) {
            console.warn("AI generation failed, fallback to local pool:", error);
            const subjectData = questionBank[currentLevel]?.[currentSubject]?.[currentSubtopic];
            let availablePool = subjectData ? (subjectData[currentDifficulty] || subjectData['easy'] || []).filter(q => q.type === currentType) : [];

            currentQuestionsBatch = [];
            const shuffledPool = [...availablePool].sort(() => Math.random() - 0.5);

            for (let i = 0; i < targetCount; i++) {
                if (i < shuffledPool.length) {
                    const picked = JSON.parse(JSON.stringify(shuffledPool[i]));
                    picked.type = currentType;
                    currentQuestionsBatch.push(picked);
                } else {
                    currentQuestionsBatch.push(buildDynamicQuestionVariation(i + 1));
                }
            }
        }

        render5QuestionsBatch();
    }

    // Render 5 Question Cards
    function render5QuestionsBatch() {
        if (!gformQuestionsWrapper) return;
        gformQuestionsWrapper.innerHTML = '';

        currentQuestionsBatch.forEach((q, qIndex) => {
            const card = document.createElement('div');
            card.className = 'gform-card';
            card.id = `gform-card-${qIndex}`;

            const qQuestionText = (typeof fixMathFormatting === 'function') ? fixMathFormatting(q.question || '') : (q.question || '');

            const qHeaderHTML = `
                <div class="gform-card-header">
                    <span class="gform-q-number">Soal ${qIndex + 1} dari 5</span>
                    <span class="badge-tag subject-badge" style="font-size:0.7rem;">${q.type === 'pilihan-ganda' ? 'Pilihan Ganda' : q.type === 'multiple-choices' ? 'PG Kompleks' : 'Essay'}</span>
                </div>
                <div class="gform-q-text">${qQuestionText.replace(/\n/g, '<br>')}</div>
            `;

            let bodyHTML = '';
            if (q.type === 'pilihan-ganda') {
                userAnswersBatch[qIndex] = null;
                const optsHTML = (q.options || []).map((opt, optIdx) => {
                    const formattedOpt = (typeof fixMathFormatting === 'function') ? fixMathFormatting(opt) : opt;
                    return `
                    <div class="option-tile" data-qindex="${qIndex}" data-optindex="${optIdx}">
                        <div class="gform-control">
                            <div class="gform-radio-circle"><div class="gform-radio-inner"></div></div>
                        </div>
                        <div class="option-text">${formattedOpt}</div>
                    </div>
                `;
                }).join('');
                bodyHTML = `<div class="options-group">${optsHTML}</div>`;

            } else if (q.type === 'multiple-choices') {
                userAnswersBatch[qIndex] = new Set();
                const optsHTML = (q.options || []).map((opt, optIdx) => {
                    const formattedOpt = (typeof fixMathFormatting === 'function') ? fixMathFormatting(opt) : opt;
                    return `
                    <div class="option-tile multiple" data-qindex="${qIndex}" data-optindex="${optIdx}">
                        <div class="gform-control">
                            <div class="gform-checkbox-box"><i data-lucide="check" class="gform-check-icon"></i></div>
                        </div>
                        <div class="option-text">${formattedOpt}</div>
                    </div>
                `;
                }).join('');
                bodyHTML = `<div class="options-group">${optsHTML}</div>`;

            } else {
                userAnswersBatch[qIndex] = '';
                bodyHTML = `
                    <div class="essay-group">
                        <textarea id="essay-input-${qIndex}" placeholder="Ketikkan jawaban Anda untuk Soal #${qIndex + 1} di sini..." rows="3"></textarea>
                    </div>
                `;
            }

            const feedbackHTML = `<div class="feedback-alert hidden" id="gform-feedback-${qIndex}"></div>`;
            card.innerHTML = qHeaderHTML + bodyHTML + feedbackHTML;
            gformQuestionsWrapper.appendChild(card);
        });

        safeRenderMath(gformQuestionsWrapper);

        currentQuestionsBatch.forEach((q, qIndex) => {
            const card = document.getElementById(`gform-card-${qIndex}`);
            if (!card) return;

            if (q.type === 'pilihan-ganda' || q.type === 'multiple-choices') {
                card.querySelectorAll('.option-tile').forEach(tile => {
                    tile.addEventListener('click', () => {
                        const optIdx = parseInt(tile.dataset.optindex);
                        if (q.type === 'pilihan-ganda') {
                            card.querySelectorAll('.option-tile').forEach(t => t.classList.remove('selected'));
                            tile.classList.add('selected');
                            userAnswersBatch[qIndex] = optIdx;
                        } else {
                            if (userAnswersBatch[qIndex].has(optIdx)) {
                                userAnswersBatch[qIndex].delete(optIdx);
                                tile.classList.remove('selected');
                            } else {
                                userAnswersBatch[qIndex].add(optIdx);
                                tile.classList.add('selected');
                            }
                        }
                    });
                });
            } else {
                const textarea = card.querySelector(`#essay-input-${qIndex}`);
                if (textarea) {
                    textarea.addEventListener('input', (e) => {
                        userAnswersBatch[qIndex] = e.target.value.trim();
                    });
                }
            }
        });

        if (window.lucide) window.lucide.createIcons();
    }

    // Essay Grader Helper
    function gradeEssay(userText, question) {
        const keywords = question.answerKeywords || [];
        if (keywords.length === 0) {
            return { score: 100, grade: 'A', feedback: 'Jawaban diterima. Bandingkan dengan pembahasan.' };
        }
        const lowerText = userText.toLowerCase();
        let matched = 0;
        keywords.forEach(kw => {
            if (lowerText.includes(kw.toLowerCase())) matched++;
        });
        const score = Math.round((matched / keywords.length) * 100);
        let levelClass = score >= 85 ? 'success' : (score >= 65 ? 'info' : 'danger');
        let feedback = score >= 85 ? '✅ Jawaban Sangat Baik!' : (score >= 65 ? '🟡 Jawaban Cukup Baik.' : '❌ Jawaban Kurang Tepat.');
        return { score, feedback, levelClass };
    }

    // Submit Answers Batch
    if (btnSubmitAnswer) {
        btnSubmitAnswer.addEventListener('click', () => {
            if (!currentQuestionsBatch || currentQuestionsBatch.length === 0) return;

            let totalCorrect = 0;
            let totalScoreSum = 0;
            const historyItemsToSave = [];

            currentQuestionsBatch.forEach((q, qIndex) => {
                const feedbackElem = document.getElementById(`gform-feedback-${qIndex}`);
                if (!feedbackElem) return;
                feedbackElem.classList.remove('hidden');

                let status = 'incorrect';
                let userAnsText = '';

                if (q.type === 'pilihan-ganda') {
                    const userAns = userAnswersBatch[qIndex];
                    const expl = fixMathFormatting ? fixMathFormatting(q.explanation) : q.explanation;
                    if (userAns === null || userAns === undefined) {
                        feedbackElem.className = 'feedback-alert danger';
                        feedbackElem.innerHTML = `⚠️ <strong>Belum Dijawab!</strong><br><strong>Pembahasan:</strong><br>${expl.replace(/\n/g, '<br>')}`;
                        userAnsText = '(Belum dijawab)';
                    } else if (userAns === q.correctIndex) {
                        totalCorrect++;
                        totalScoreSum += 20;
                        status = 'correct';
                        feedbackElem.className = 'feedback-alert success';
                        feedbackElem.innerHTML = `✅ <strong>Jawaban Benar!</strong> (+20 Poin)<br><strong>Pembahasan:</strong><br>${expl.replace(/\n/g, '<br>')}`;
                        userAnsText = `Pilihan ${['A','B','C','D'][userAns]}: ${q.options[userAns]}`;
                    } else {
                        feedbackElem.className = 'feedback-alert danger';
                        feedbackElem.innerHTML = `❌ <strong>Jawaban Salah!</strong> (Jawaban Benar: ${['A','B','C','D'][q.correctIndex]})<br><strong>Pembahasan:</strong><br>${expl.replace(/\n/g, '<br>')}`;
                        userAnsText = `Pilihan ${['A','B','C','D'][userAns]}: ${q.options[userAns]}`;
                    }

                } else if (q.type === 'multiple-choices') {
                    const selected = userAnswersBatch[qIndex] || new Set();
                    const correctSet = new Set(q.correctIndices);
                    const isCorrect = selected.size > 0 && [...correctSet].every(i => selected.has(i)) && [...selected].every(i => correctSet.has(i));
                    const correctLabels = [...correctSet].map(i => ['A','B','C','D','E'][i]).join(', ');

                    const explMC = fixMathFormatting ? fixMathFormatting(q.explanation) : q.explanation;
                    if (selected.size === 0) {
                        feedbackElem.className = 'feedback-alert danger';
                        feedbackElem.innerHTML = `⚠️ <strong>Belum Dijawab!</strong><br>Jawaban benar: <strong>${correctLabels}</strong>.<br><strong>Pembahasan:</strong><br>${explMC.replace(/\n/g, '<br>')}`;
                        userAnsText = '(Belum dijawab)';
                    } else if (isCorrect) {
                        totalCorrect++;
                        totalScoreSum += 20;
                        status = 'correct';
                        feedbackElem.className = 'feedback-alert success';
                        feedbackElem.innerHTML = `✅ <strong>Semua Pilihan Benar!</strong> (+20 Poin)<br><strong>Pembahasan:</strong><br>${explMC.replace(/\n/g, '<br>')}`;
                        userAnsText = `Pilihan: ${[...selected].map(i=>['A','B','C','D'][i]).join(', ')}`;
                    } else {
                        feedbackElem.className = 'feedback-alert danger';
                        feedbackElem.innerHTML = `❌ <strong>Pilihan Kurang Tepat!</strong> (Jawaban Benar: <strong>${correctLabels}</strong>)<br><strong>Pembahasan:</strong><br>${explMC.replace(/\n/g, '<br>')}`;
                        userAnsText = `Pilihan: ${[...selected].map(i=>['A','B','C','D'][i]).join(', ')}`;
                    }

                } else {
                    const userText = userAnswersBatch[qIndex] || '';
                    const explEssay = fixMathFormatting ? fixMathFormatting(q.explanation) : q.explanation;
                    if (!userText) {
                        feedbackElem.className = 'feedback-alert danger';
                        feedbackElem.innerHTML = `⚠️ <strong>Belum Mengisi Jawaban Essay!</strong><br><strong>Kunci Jawaban:</strong><br>${explEssay.replace(/\n/g, '<br>')}`;
                        userAnsText = '(Kosong)';
                    } else {
                        const res = gradeEssay(userText, q);
                        const qScore = Math.round((res.score / 100) * 20);
                        totalScoreSum += qScore;
                        if (res.score >= 70) totalCorrect++;
                        status = res.score >= 70 ? 'correct' : 'answered';

                        feedbackElem.className = `feedback-alert ${res.levelClass || 'info'}`;
                        feedbackElem.innerHTML = `📝 <strong>Hasil AI (${res.score}%):</strong> ${res.feedback.replace(/\n/g, '<br>')}<br><strong>Kunci Jawaban Ideal:</strong><br>${explEssay.replace(/\n/g, '<br>')}`;
                        userAnsText = userText;
                    }
                }

                historyItemsToSave.push({
                    id: Date.now() + qIndex,
                    level: currentLevel,
                    subject: currentSubject,
                    subtopic: currentSubtopic,
                    difficulty: currentDifficulty,
                    type: q.type,
                    question: q.question,
                    userAnswer: userAnsText,
                    status: status,
                    explanation: q.explanation,
                    timestamp: new Date().toLocaleString('id-ID')
                });

                safeRenderMath(feedbackElem);
            });

            if (gformScoreBadge) {
                gformScoreBadge.classList.remove('hidden');
                gformScoreBadge.textContent = `Skor Akhir Paket Soal: ${totalScoreSum} / 100 (${totalCorrect} dari 5 Benar)`;
            }

            // Save to LocalStorage History automatically
            const existingHistory = getHistory();
            saveHistory([...historyItemsToSave, ...existingHistory]);

            if (window.lucide) window.lucide.createIcons();
            if (gformQuestionsWrapper) gformQuestionsWrapper.scrollTo({ top: 0, behavior: 'smooth' });

            // Render all math AFTER scroll & before alert (alert blocks rendering frames)
            if (gformQuestionsWrapper && window.renderMathInElement) {
                try {
                    window.renderMathInElement(gformQuestionsWrapper, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$',  right: '$',  display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false,
                        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                    });
                } catch (e) { console.error('KaTeX submit render error:', e); }
            }

            alert('Jawaban berhasil disubmit, diperiksa, dan disimpan ke Riwayat Soal!');
        });
    }

    if (btnRegenerateQuestion) {
        btnRegenerateQuestion.addEventListener('click', (e) => {
            e.preventDefault();
            generateQuizQuestion(true);
            if (gformQuestionsWrapper) gformQuestionsWrapper.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Toggle Listeners
    if (difficultyToggle) {
        difficultyToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                difficultyToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentDifficulty = btn.dataset.difficulty;
                generateQuizQuestion();
            });
        });
    }

    if (typeToggle) {
        typeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                typeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentType = btn.dataset.type;
                generateQuizQuestion();
            });
        });
    }

    // ==========================================================================
    // Scratchpad & Canvas Whiteboard Logic
    // ==========================================================================
    if (scratchpadModeToggle) {
        scratchpadModeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                scratchpadModeToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const mode = btn.dataset.mode;
                if (mode === 'ketik') {
                    if (scratchpadTextWrapper) scratchpadTextWrapper.classList.remove('hidden');
                    if (scratchpadCanvasWrapper) scratchpadCanvasWrapper.classList.add('hidden');
                } else {
                    if (scratchpadTextWrapper) scratchpadTextWrapper.classList.add('hidden');
                    if (scratchpadCanvasWrapper) scratchpadCanvasWrapper.classList.remove('hidden');
                    setTimeout(resizeCanvas, 50);
                }
            });
        });
    }

    if (canvasColor && ctx) {
        canvasColor.addEventListener('input', () => { ctx.strokeStyle = canvasColor.value; });
    }
    if (canvasWidth && ctx) {
        canvasWidth.addEventListener('input', () => {
            if (widthIndicator) widthIndicator.textContent = `${canvasWidth.value}px`;
            ctx.lineWidth = canvasWidth.value;
        });
    }

    function resizeCanvas() {
        if (!paintCanvas || !ctx) return;
        const rect = paintCanvas.parentElement.getBoundingClientRect();
        const tempImg = paintCanvas.toDataURL();
        paintCanvas.width  = rect.width;
        paintCanvas.height = rect.height;
        ctx.strokeStyle = canvasColor ? canvasColor.value : '#1e293b';
        ctx.lineWidth   = canvasWidth ? canvasWidth.value : 3;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = tempImg;
    }

    window.addEventListener('resize', () => {
        if (scratchpadCanvasWrapper && !scratchpadCanvasWrapper.classList.contains('hidden')) resizeCanvas();
    });

    function getPos(canvasDom, e) {
        const r = canvasDom.getBoundingClientRect();
        if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function startDraw(e) {
        if (!ctx) return;
        e.preventDefault(); isDrawing = true;
        saveCanvasState();
        const p = getPos(paintCanvas, e);
        ctx.beginPath(); ctx.moveTo(p.x, p.y);
    }
    function drawStroke(e) {
        if (!isDrawing || !ctx) return; e.preventDefault();
        const p = getPos(paintCanvas, e);
        ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    function stopDraw() { if (isDrawing && ctx) { ctx.closePath(); isDrawing = false; } }

    if (paintCanvas) {
        paintCanvas.addEventListener('mousedown', startDraw);
        paintCanvas.addEventListener('mousemove', drawStroke);
        paintCanvas.addEventListener('mouseup',   stopDraw);
        paintCanvas.addEventListener('mouseleave',stopDraw);
        paintCanvas.addEventListener('touchstart', startDraw,  { passive: false });
        paintCanvas.addEventListener('touchmove',  drawStroke, { passive: false });
        paintCanvas.addEventListener('touchend',   stopDraw);
    }

    function saveCanvasState() {
        if (!paintCanvas) return;
        if (canvasHistory.length >= 15) canvasHistory.shift();
        canvasHistory.push(paintCanvas.toDataURL());
    }

    if (btnCanvasUndo && ctx) {
        btnCanvasUndo.addEventListener('click', () => {
            if (canvasHistory.length > 0) {
                const prev = canvasHistory.pop();
                const img  = new Image();
                img.onload = () => { ctx.clearRect(0,0,paintCanvas.width,paintCanvas.height); ctx.drawImage(img,0,0); };
                img.src = prev;
            }
        });
    }

    if (btnCanvasClear && ctx) {
        btnCanvasClear.addEventListener('click', () => {
            saveCanvasState();
            ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
        });
    }

    // Initial Load
    generateQuizQuestion();
    setTimeout(resizeCanvas, 100);
});
