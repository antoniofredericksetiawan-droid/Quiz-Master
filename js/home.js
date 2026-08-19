/**
 * QuizMaster - Home Page Script (js/home.js)
 * Manages Subject & Level Selection Wizard and Custom AI Subtopic Modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // Subtopic Data Map
    // ==========================================================================
    const subtopicMap = {
        sd: {
            matematika: [
                { key: 'penjumlahan-pengurangan', label: 'Penjumlahan & Pengurangan' },
                { key: 'perkalian-pembagian',      label: 'Perkalian & Pembagian' },
                { key: 'pecahan',                  label: 'Pecahan & Desimal' },
                { key: 'bangun-datar-sd',          label: 'Bangun Datar' },
                { key: 'pengukuran-sd',            label: 'Pengukuran (Panjang, Berat, Waktu)' },
            ],
            fisika: [
                { key: 'sifat-benda',         label: 'Sifat-sifat Benda' },
                { key: 'energi-sd',           label: 'Energi & Gaya Sederhana' },
                { key: 'cuaca-iklim',         label: 'Cuaca & Iklim' },
                { key: 'sistem-tatasurya-sd', label: 'Tata Surya Sederhana' },
            ]
        },
        smp: {
            matematika: [
                { key: 'aljabar-dasar',    label: 'Aljabar Dasar' },
                { key: 'persamaan-linear', label: 'Persamaan Linear' },
                { key: 'pythagoras',       label: 'Teorema Pythagoras' },
                { key: 'statistika-smp',   label: 'Statistika Dasar' },
                { key: 'bilangan-bulat',   label: 'Bilangan Bulat & Pecahan' },
                { key: 'bangun-ruang-smp', label: 'Bangun Ruang' },
            ],
            fisika: [
                { key: 'besaran-satuan',    label: 'Besaran & Satuan' },
                { key: 'gerak-lurus',       label: 'Gerak Lurus' },
                { key: 'gaya-hukum-newton', label: 'Gaya & Hukum Newton' },
                { key: 'tekanan',           label: 'Tekanan Zat' },
                { key: 'suhu-kalor',        label: 'Suhu & Kalor' },
                { key: 'gelombang-bunyi',   label: 'Gelombang & Bunyi' },
            ]
        },
        sma: {
            matematika: [
                { key: 'fungsi-komposisi', label: 'Fungsi & Komposisi' },
                { key: 'trigonometri-sma', label: 'Trigonometri' },
                { key: 'limit-turunan',    label: 'Limit & Turunan' },
                { key: 'integral',         label: 'Integral' },
                { key: 'logaritma',        label: 'Logaritma & Eksponen' },
                { key: 'vektor',           label: 'Vektor' },
                { key: 'statistika-sma',   label: 'Statistika Lanjut' },
            ],
            fisika: [
                { key: 'kinematika',        label: 'Kinematika' },
                { key: 'dinamika',          label: 'Dinamika & Hukum Newton' },
                { key: 'usaha-energi',      label: 'Usaha & Energi' },
                { key: 'getaran-gelombang',  label: 'Getaran & Gelombang' },
                { key: 'listrik-dinamis',   label: 'Listrik Dinamis' },
                { key: 'optik-sma',         label: 'Optik & Cahaya' },
                { key: 'relativitas',       label: 'Relativitas & Fisika Modern' },
            ]
        }
    };

    // DOM Elements
    const stepLevelContainer   = document.getElementById('step-level-container');
    const stepSubjectContainer = document.getElementById('step-subject-container');
    const subtopicsWrapper     = document.getElementById('subtopics-wrapper');
    const listDynamicSubtopics = document.getElementById('list-dynamic-subtopics');
    const subtopicTitle        = document.getElementById('subtopic-title');

    const btnSubjectMath    = document.getElementById('btn-subject-math');
    const btnSubjectPhysics = document.getElementById('btn-subject-physics');
    const btnBackToLevels   = document.getElementById('btn-back-to-levels');
    const btnBackToSubjects = document.getElementById('btn-back-to-subjects');
    const btnQuickStart     = document.getElementById('btn-quick-start');

    // Modals
    const modalPrompt      = document.getElementById('modal-prompt');
    const btnCloseModal    = document.getElementById('btn-close-modal');
    const btnCancelModal   = document.getElementById('btn-cancel-modal');
    const formCustomTopic  = document.getElementById('form-custom-topic');
    const inputCustomTopic = document.getElementById('input-custom-topic');

    // State
    let currentLevel   = 'sd';
    let currentSubject = 'matematika';

    // Wizard Step Navigation
    function showStep(step) {
        if (step === 'level') {
            if (stepLevelContainer) stepLevelContainer.classList.remove('hidden');
            if (stepSubjectContainer) stepSubjectContainer.classList.add('hidden');
            if (subtopicsWrapper) subtopicsWrapper.classList.add('hidden');
            if (stepLevelContainer) stepLevelContainer.scrollIntoView({ behavior: 'smooth' });
        } else if (step === 'subject') {
            if (stepLevelContainer) stepLevelContainer.classList.remove('hidden');
            if (stepSubjectContainer) stepSubjectContainer.classList.remove('hidden');
            if (subtopicsWrapper) subtopicsWrapper.classList.add('hidden');
            setTimeout(() => {
                if (stepSubjectContainer) stepSubjectContainer.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        } else if (step === 'subtopic') {
            if (stepLevelContainer) stepLevelContainer.classList.remove('hidden');
            if (stepSubjectContainer) stepSubjectContainer.classList.remove('hidden');
            if (subtopicsWrapper) subtopicsWrapper.classList.remove('hidden');
            setTimeout(() => {
                if (subtopicsWrapper) subtopicsWrapper.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        }
    }

    // Header Quick Start Button -> Jump to Step Subject
    if (btnQuickStart) {
        btnQuickStart.addEventListener('click', () => {
            showStep('subject');
        });
    }

    // Step 1: Choose Level
    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.level-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentLevel = card.dataset.level || 'sd';
            showStep('subject');
        });
    });

    if (btnBackToLevels) {
        btnBackToLevels.addEventListener('click', () => showStep('level'));
    }

    // Step 2: Choose Subject
    if (btnSubjectMath) {
        btnSubjectMath.addEventListener('click', () => {
            document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
            btnSubjectMath.classList.add('active');
            currentSubject = 'matematika';
            renderSubtopics();
            showStep('subtopic');
        });
    }

    if (btnSubjectPhysics) {
        btnSubjectPhysics.addEventListener('click', () => {
            document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('active'));
            btnSubjectPhysics.classList.add('active');
            currentSubject = 'fisika';
            renderSubtopics();
            showStep('subtopic');
        });
    }

    if (btnBackToSubjects) {
        btnBackToSubjects.addEventListener('click', () => showStep('subject'));
    }

    // Render Subtopic Buttons
    function renderSubtopics() {
        if (!listDynamicSubtopics) return;
        const data = subtopicMap[currentLevel] && subtopicMap[currentLevel][currentSubject];
        const label = currentSubject === 'matematika' ? 'Matematika' : 'Fisika';
        const levelLabel = { sd: 'SD', smp: 'SMP', sma: 'SMA' }[currentLevel] || 'SD';

        if (subtopicTitle) {
            subtopicTitle.textContent = `Pilih Subtopik ${label} — Tingkat ${levelLabel}`;
        }

        listDynamicSubtopics.innerHTML = '';
        if (!data) return;

        data.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'subtopic-btn btn btn-outline';
            btn.dataset.subtopic = item.key;
            btn.textContent = item.label;
            btn.addEventListener('click', () => {
                // Navigate to workspace.html with query params
                window.location.href = `workspace.html?level=${encodeURIComponent(currentLevel)}&subject=${encodeURIComponent(currentSubject)}&subtopic=${encodeURIComponent(item.key)}`;
            });
            listDynamicSubtopics.appendChild(btn);
        });

        // "Others" AI Prompt button
        const othersBtn = document.createElement('button');
        othersBtn.className = 'subtopic-others-btn btn btn-primary';
        othersBtn.innerHTML = '<i data-lucide="plus-circle"></i> Lainnya (AI Prompt)';
        othersBtn.addEventListener('click', openCustomModal);
        listDynamicSubtopics.appendChild(othersBtn);

        if (window.lucide) window.lucide.createIcons();
    }

    // Custom Subtopic Modal Logic
    function openCustomModal() {
        if (modalPrompt) {
            modalPrompt.classList.remove('hidden');
            if (inputCustomTopic) {
                inputCustomTopic.value = '';
                inputCustomTopic.focus();
            }
        }
    }

    function closeCustomModal() {
        if (modalPrompt) modalPrompt.classList.add('hidden');
    }

    if (btnCloseModal)  btnCloseModal.addEventListener('click', closeCustomModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeCustomModal);
    if (modalPrompt) {
        modalPrompt.addEventListener('click', (e) => {
            if (e.target === modalPrompt) closeCustomModal();
        });
    }

    if (formCustomTopic) {
        formCustomTopic.addEventListener('submit', (e) => {
            e.preventDefault();
            const topicVal = inputCustomTopic ? inputCustomTopic.value.trim() : '';
            if (!topicVal) return;
            closeCustomModal();
            window.location.href = `workspace.html?level=${encodeURIComponent(currentLevel)}&subject=${encodeURIComponent(currentSubject)}&subtopic=${encodeURIComponent(topicVal)}`;
        });
    }
});
