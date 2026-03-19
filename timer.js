// 1. 要素の取得（すべて冒頭にまとめます）
const display = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const toggle = document.getElementById('mode-toggle');
const openBtn = document.getElementById('open-modal-btn');
const closeBtn = document.getElementById('close-modal-btn');
const overlay = document.getElementById('modal-overlay');
const reportStatusSelect = document.getElementById('report-status');
const saveReportBtn = document.getElementById('save-report-btn');
const usernameDisplay = document.getElementById('username-display');
const usernameInput = document.getElementById('username-input');
const openUsernameModalBtn = document.getElementById('open-username-modal-btn');
const taskInput = document.getElementById('task-input');
const openTaskModalBtn = document.getElementById('open-task-modal-btn');
const reportList = document.getElementById('report-list');
const clearReportsBtn = document.getElementById('clear-reports-btn');
const usernameModalOverlay = document.getElementById('username-modal-overlay');
const usernameModalInput = document.getElementById('username-modal-input');
const usernameModalSaveBtn = document.getElementById('username-modal-save-btn');
const usernameModalTitle = document.getElementById('username-modal-title');
const usernameModalDescription = document.getElementById('username-modal-description');
const taskModalOverlay = document.getElementById('task-modal-overlay');
const taskModalInput = document.getElementById('task-modal-input');
const taskModalSaveBtn = document.getElementById('task-modal-save-btn');
const taskModalTitle = document.getElementById('task-modal-title');
const taskModalDescription = document.getElementById('task-modal-description');
const toast = document.getElementById('toast');

const STORAGE_KEYS = {
    username: 'practicePomo.username',
    task: 'practicePomo.task',
    reports: 'practicePomo.reports',
};

let countdownInterval;
let timeLeft = 5; // テスト用に5秒設定
let isRunning = false;
let toastTimerId;

// 2. 関数の定義

// 表示更新
function updateDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    display.innerText = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function setUsername(name) {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) return false;
    localStorage.setItem(STORAGE_KEYS.username, trimmed);
    if (usernameDisplay) usernameDisplay.innerText = trimmed;
    if (usernameInput) usernameInput.value = trimmed;
    return true;
}

function setTask(task) {
    const trimmed = String(task ?? '').trim();
    if (!trimmed) return false;
    localStorage.setItem(STORAGE_KEYS.task, trimmed);
    if (taskInput) taskInput.value = trimmed;
    return true;
}

function getSavedUsername() {
    return (localStorage.getItem(STORAGE_KEYS.username) ?? '').trim();
}

function getSavedTask() {
    return (localStorage.getItem(STORAGE_KEYS.task) ?? '').trim();
}

function readReports() {
    const raw = localStorage.getItem(STORAGE_KEYS.reports);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeReports(reports) {
    localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
}

function formatReportStatus(status) {
    if (status === 'success') return 'うまくいった';
    if (status === 'fail') return 'うまくいかなかった';
    if (status === 'retry') return '再挑戦！';
    return String(status ?? '');
}

function formatDateTime(isoString) {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

function renderReports() {
    if (!reportList) return;
    const reports = readReports().slice().reverse(); // 新しい順
    if (reports.length === 0) {
        reportList.innerHTML = '<div class="report-item">まだレポートがありません</div>';
        return;
    }
    reportList.innerHTML = reports.map((r) => {
        const status = formatReportStatus(r.status);
        const user = r.username ? String(r.username) : 'ゲスト';
        const task = r.task ? String(r.task) : '未登録';
        const when = formatDateTime(r.createdAt);
        return `
<div class="report-item">
  <div class="headline">
    <span class="status">${status}</span>
    <span class="user">ユーザー: ${user}</span>
  </div>
  <div class="meta">${when} / タスク: ${task}</div>
</div>`;
    }).join('');
}

function showToast(message, options = {}) {
    if (!toast) return;
    const placement = options.placement ?? 'bottom';
    toast.classList.toggle('center', placement === 'center');
    toast.innerText = message;
    toast.classList.add('show');
    clearTimeout(toastTimerId);
    toastTimerId = setTimeout(() => {
        toast.classList.remove('show');
    }, 1800);
}

function openUsernameModal() {
    if (!usernameModalOverlay) return;
    const saved = getSavedUsername();
    const isEdit = Boolean(saved);

    if (usernameModalTitle) {
        usernameModalTitle.innerText = isEdit ? 'ユーザー名を変更' : 'ユーザー名を登録';
    }
    if (usernameModalDescription) {
        usernameModalDescription.innerText = isEdit ? '' : '最初にユーザー名を入力してください。';
    }
    if (usernameModalSaveBtn) {
        usernameModalSaveBtn.innerText = isEdit ? '変更する' : '登録する';
    }

    usernameModalOverlay.classList.add('active');
    if (usernameModalInput) {
        usernameModalInput.value = saved;
        usernameModalInput.focus();
    }
}

function closeUsernameModal() {
    if (!usernameModalOverlay) return;
    usernameModalOverlay.classList.remove('active');
}

function openTaskModal() {
    if (!taskModalOverlay) return;
    const saved = getSavedTask();
    const isEdit = Boolean(saved);

    if (taskModalTitle) {
        taskModalTitle.innerText = isEdit ? 'タスクを変更' : 'タスクを登録';
    }
    if (taskModalDescription) {
        taskModalDescription.innerText = isEdit ? '' : '最初にタスクを入力してください。';
    }
    if (taskModalSaveBtn) {
        taskModalSaveBtn.innerText = isEdit ? '変更する' : '登録する';
    }

    taskModalOverlay.classList.add('active');
    if (taskModalInput) {
        taskModalInput.value = saved;
        taskModalInput.focus();
    }
}

function closeTaskModal() {
    if (!taskModalOverlay) return;
    taskModalOverlay.classList.remove('active');
}

function loadUsername() {
    const saved = getSavedUsername();
    if (saved) {
        setUsername(saved);
        return;
    }
    if (usernameDisplay) usernameDisplay.innerText = 'ゲスト';
    if (usernameInput) usernameInput.value = '';
}

function loadTask() {
    const saved = getSavedTask();
    if (saved) {
        setTask(saved);
        return;
    }
    if (taskInput) taskInput.value = '';
}

// モーダルを開く
function openModal() {
    console.log("モーダルを表示します");
    if (overlay) {
        overlay.classList.add('active');
    }
}

// モーダルを閉じる
function closeModal() {
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// タイマー開始
function startTimer() {
    if (isRunning) return;
    isRunning = true;

    const endTime = Date.now() + timeLeft * 1000;

    countdownInterval = setInterval(() => {
        const now = Date.now();
        const diff = Math.round((endTime - now) / 1000);

        if (diff <= 0) {
            clearInterval(countdownInterval);
            updateDisplay(0);
            isRunning = false;
            openModal(); // 終了時に自動実行
        } else {
            updateDisplay(diff);
            timeLeft = diff;
        }
    }, 1000);
} // ← ここで正しくstartTimerを閉じる

// 3. イベントリスナーの登録

if (startBtn) {
    startBtn.addEventListener('click', startTimer);
}

if (openBtn) {
    openBtn.addEventListener('click', openModal);
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

if (saveReportBtn) {
    saveReportBtn.addEventListener('click', () => {
        const status = reportStatusSelect ? reportStatusSelect.value : '';
        const username = getSavedUsername();
        const task = getSavedTask();
        const report = {
            status,
            username: username || '',
            task: task || '',
            createdAt: new Date().toISOString(),
        };
        const reports = readReports();
        reports.push(report);
        writeReports(reports);
        closeModal();
        renderReports();
        showToast('保存しました', { placement: 'center' });
    });
}

if (clearReportsBtn) {
    clearReportsBtn.addEventListener('click', () => {
        writeReports([]);
        renderReports();
        showToast('削除しました', { placement: 'center' });
    });
}

// モード切替（重複していたものを1つに統合）
if (toggle) {
    toggle.addEventListener('change', () => {
        clearInterval(countdownInterval);
        isRunning = false;
        if (toggle.checked) {
            timeLeft = 25 * 60; // ポモドーロ
        } else {
            timeLeft = 10 * 60; // ノーマル
        }
        updateDisplay(timeLeft);
    });
}
const mainPage = document.getElementById('main-page');
const settingsPage = document.getElementById('settings-page');
const reportsPage = document.getElementById('reports-page');
const goSettingsBtn = document.getElementById('go-settings');
const goReportsBtn = document.getElementById('go-reports');
const backMainBtn = document.getElementById('back-main');
const backMainFromReportsBtn = document.getElementById('back-main-from-reports');

// 設定画面へ行く（メインを左へ、設定を中央へ）
if (goSettingsBtn && mainPage && settingsPage) {
    goSettingsBtn.addEventListener('click', () => {
        mainPage.classList.remove('active');
        mainPage.classList.add('left'); // メインを左へ押し出す
        settingsPage.classList.add('active'); // 設定を中央へ入れる
        if (reportsPage) reportsPage.classList.remove('active');
    });
}

// レポート画面へ行く（メインを左へ、レポートを中央へ）
if (goReportsBtn && mainPage && reportsPage) {
    goReportsBtn.addEventListener('click', () => {
        mainPage.classList.remove('active');
        mainPage.classList.add('left');
        reportsPage.classList.add('active');
        if (settingsPage) settingsPage.classList.remove('active');
        renderReports();
    });
}

// メイン画面へ戻る（メインを中央へ、設定を右へ）
if (backMainBtn && mainPage && settingsPage) {
    backMainBtn.addEventListener('click', () => {
        mainPage.classList.add('active');
        mainPage.classList.remove('left');
        settingsPage.classList.remove('active'); // 設定が右へ戻る
    });
}

// メイン画面へ戻る（メインを中央へ、レポートを右へ）
if (backMainFromReportsBtn && mainPage && reportsPage) {
    backMainFromReportsBtn.addEventListener('click', () => {
        mainPage.classList.add('active');
        mainPage.classList.remove('left');
        reportsPage.classList.remove('active');
    });
}

if (usernameModalSaveBtn) {
    usernameModalSaveBtn.addEventListener('click', () => {
        const isEdit = Boolean(getSavedUsername());
        const ok = setUsername(usernameModalInput ? usernameModalInput.value : '');
        if (!ok) {
            showToast('ユーザー名を入力してください', { placement: 'center' });
            if (usernameModalInput) usernameModalInput.focus();
            return;
        }
        closeUsernameModal();
        showToast(isEdit ? '変更しました' : '登録しました', { placement: 'center' });
    });
}

if (openUsernameModalBtn) {
    openUsernameModalBtn.addEventListener('click', () => {
        openUsernameModal();
    });
}

if (usernameModalInput) {
    usernameModalInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && usernameModalSaveBtn) {
            usernameModalSaveBtn.click();
        }
    });
}

if (taskModalSaveBtn) {
    taskModalSaveBtn.addEventListener('click', () => {
        const isEdit = Boolean(getSavedTask());
        const ok = setTask(taskModalInput ? taskModalInput.value : '');
        if (!ok) {
            showToast('タスクを入力してください', { placement: 'center' });
            if (taskModalInput) taskModalInput.focus();
            return;
        }
        closeTaskModal();
        showToast(isEdit ? '変更しました' : '登録しました', { placement: 'center' });
    });
}

if (openTaskModalBtn) {
    openTaskModalBtn.addEventListener('click', () => {
        openTaskModal();
    });
}

if (taskModalInput) {
    taskModalInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && taskModalSaveBtn) {
            taskModalSaveBtn.click();
        }
    });
}

// 初期化
loadUsername();
loadTask();
renderReports();
updateDisplay(timeLeft);
