/**
 * QuizMaster - History Page Script (js/history.js)
 * Manages rendering of saved quiz history and deletion.
 */

document.addEventListener('DOMContentLoaded', () => {
    const historyCounter       = document.getElementById('history-counter');
    const btnClearAllHistory   = document.getElementById('btn-clear-all-history');
    const historyEmptyState    = document.getElementById('history-empty');
    const historyListContainer = document.getElementById('history-list-container');

    function renderHistoryList() {
        if (!historyCounter || !historyListContainer || !historyEmptyState) return;

        const list = getHistory();
        historyCounter.textContent = `${list.length} Soal Tersimpan`;

        if (list.length === 0) {
            historyEmptyState.classList.remove('hidden');
            historyListContainer.innerHTML = '';
            return;
        }

        historyEmptyState.classList.add('hidden');
        historyListContainer.innerHTML = '';

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-item';

            const statusBadge = {
                correct:   '<span class="badge-tag" style="background:rgba(5,150,105,.15);color:#059669;border:1px solid rgba(5,150,105,.25);">Benar</span>',
                incorrect: '<span class="badge-tag" style="background:rgba(220,38,38,.15);color:#dc2626;border:1px solid rgba(220,38,38,.25);">Salah</span>',
                answered:  '<span class="badge-tag" style="background:rgba(217,119,6,.15);color:#d97706;border:1px solid rgba(217,119,6,.25);">Dijawab</span>'
            }[item.status] || '<span class="badge-tag" style="background:rgba(217,119,6,.15);color:#d97706;border:1px solid rgba(217,119,6,.25);">Tersimpan</span>';

            const levelLabel   = { sd:'SD', smp:'SMP', sma:'SMA' }[item.level] || item.level?.toUpperCase() || '';
            const subjectLabel = item.subject === 'matematika' ? 'Matematika' : 'Fisika';
            const typeLabel    = { 'pilihan-ganda':'Pilihan Ganda','multiple-choices':'Ganda Kompleks','essay':'Essay' }[item.type] || item.type;
            const subtopicName = (item.subtopic || '').replace(/-/g, ' ').toUpperCase();

            // Apply math formatting fix before inserting into DOM
            const questionText   = (typeof fixMathFormatting === 'function')
                ? fixMathFormatting(item.question  || '')
                : (item.question  || '');
            const explanationText = (typeof fixMathFormatting === 'function')
                ? fixMathFormatting(item.explanation || '')
                : (item.explanation || '');

            // Escape only HTML special chars (not $ or \) so KaTeX can process $...$
            const safeQuestion = questionText
                .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/\n/g,'<br>');

            card.innerHTML = `
                <div class="history-item-header">
                    <div class="history-meta">
                        <span class="badge-tag" style="background:rgba(236,72,153,.1);color:#db2777;border:1px solid rgba(236,72,153,.2);">${levelLabel}</span>
                        <span class="badge-tag subject-badge">${subjectLabel}</span>
                        <span class="badge-tag subtopic-badge">${subtopicName}</span>
                        <span class="badge-tag" style="text-transform:uppercase;">${item.difficulty || 'EASY'}</span>
                        <span class="badge-tag" style="background:rgba(0,0,0,.03);">${typeLabel}</span>
                        ${statusBadge}
                    </div>
                    <div class="history-item-actions">
                        <span class="history-time">${item.timestamp}</span>
                        <button class="btn-delete-history-item" data-id="${item.id}" aria-label="Hapus" style="margin-left:14px;">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="history-question">${safeQuestion}</div>
                <div class="history-user-answer">
                    <span class="answer-label">Jawaban Anda:</span> <span>${escapeHTML(item.userAnswer)}</span>
                </div>
                <div class="history-explanation">
                    <strong>Kunci Pembahasan:</strong><br>${explanationText.replace(/\n/g,'<br>')}
                </div>`;

            const btnDelete = card.querySelector('.btn-delete-history-item');
            if (btnDelete) {
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const updated = getHistory().filter(i => i.id !== item.id);
                    saveHistory(updated);
                    renderHistoryList();
                });
            }

            historyListContainer.appendChild(card);
        });

        // Batch render all math in one pass after all cards are in DOM
        if (window.renderMathInElement) {
            try {
                window.renderMathInElement(historyListContainer, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true  },
                        { left: '$',  right: '$',  display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true  }
                    ],
                    throwOnError: false,
                    ignoredTags: ['script','noscript','style','textarea','pre','code']
                });
            } catch (e) { console.error('KaTeX history render error:', e); }
        } else {
            // Fallback: render per-card
            historyListContainer.querySelectorAll('.history-item').forEach(card => safeRenderMath(card));
        }

        if (window.lucide) window.lucide.createIcons();
    }


    if (btnClearAllHistory) {
        btnClearAllHistory.addEventListener('click', () => {
            if (confirm('Hapus seluruh riwayat? Tindakan ini tidak dapat dibatalkan.')) {
                saveHistory([]);
                renderHistoryList();
            }
        });
    }

    // Initial render
    renderHistoryList();
});
