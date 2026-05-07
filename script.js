// ==========================================
// 🕒 時計機能
// ==========================================
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timeElement = document.getElementById('current-time');
    if(timeElement) timeElement.innerText = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 🏫 時間割カウントダウン機能（曜日自動判定版）
// ==========================================
const schedules = {
    "shinryokusai": [ // 新緑祭用のスケジュール
        { name: "開会式", time: "09:00" },
        { name: "一般公開開始", time: "09:30" },
        { name: "ステージ企画①", time: "10:30" },
        { name: "昼休憩", time: "12:00" },
        { name: "ステージ企画②", time: "13:00" },
        { name: "一般公開終了", time: "15:00" },
        { name: "後夜祭", time: "15:30" }
    ]
};
// ※この後、この「shinryokusai」スケジュールを読み込むように少し下部のコードも調整します。

let currentScheduleMode = "shinryokusai";

function getAutoScheduleMode() {
    const today = new Date().getDay(); // 0:日, 1:月, 2:火, 3:水, 4:木, 5:金, 6:土
    if (today === 2 || today === 4) { return "shinryokusai"; }
    else { return "shinryokusai"; }
}

function updateCountdown() {
    const now = new Date();
    const nowSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    
    let activeMode = currentScheduleMode;
    if (activeMode === "auto") { activeMode = getAutoScheduleMode(); }

    const activeSchedule = schedules[activeMode] || schedules["shinryokusai"];
    let nextEvent = null;

    if (activeSchedule) {
        for (let i = 0; i < activeSchedule.length; i++) {
            const [h, m] = activeSchedule[i].time.split(':');
        const eventSeconds = (parseInt(h) * 3600) + (parseInt(m) * 60);

        if (eventSeconds > nowSeconds) {
            nextEvent = activeSchedule[i];
            const diffSeconds = eventSeconds - nowSeconds;
            const remainMin = Math.floor(diffSeconds / 60);
            const remainSec = String(diffSeconds % 60).padStart(2, '0');

            const nextClassElement = document.getElementById('next-class-name');
            const countdownElement = document.getElementById('countdown-timer');
            
            if(nextClassElement) nextClassElement.innerText = `次のチャイム（${nextEvent.name}）まで`;
            if(countdownElement) {
                if (remainMin >= 60) {
                    const remainHour = Math.floor(remainMin / 60);
                    const remMin = String(remainMin % 60).padStart(2, '0');
                    countdownElement.innerText = `${remainHour}時間 ${remMin}分`;
                } else {
                    countdownElement.innerText = `${remainMin}分 ${remainSec}秒`;
                }
            }
            break;
        }
    }
    }

    if (!nextEvent) {
        const nextClassElement = document.getElementById('next-class-name');
        const countdownElement = document.getElementById('countdown-timer');
        if(nextClassElement) nextClassElement.innerText = "本日のチャイムは終了しました";
        if(countdownElement) countdownElement.innerText = "また明日！👋";
    }
}
setInterval(updateCountdown, 1000);
updateCountdown();


// ==========================================
// 📱 左右パネル（常時表示）の機能
// ==========================================

function changeLeftPanel() {
    const inputElement = document.getElementById('admin-left-panel-input');
    if (!inputElement) return;
    
    const fileName = inputElement.value.trim();
    if (!fileName) return;
    
    const titleElement = document.getElementById('left-panel-title');
    const iframeElement = document.getElementById('left-panel-iframe');
    
    if (titleElement && iframeElement) {
        titleElement.innerText = `🌟 表示中: ${fileName}`;
        iframeElement.src = fileName;
    }
}

function changeRightPanel() {
    const inputElement = document.getElementById('admin-right-panel-input');
    if (!inputElement) return;
    
    const fileName = inputElement.value.trim();
    if (!fileName) return;
    
    const titleElement = document.getElementById('right-panel-title');
    const iframeElement = document.getElementById('right-panel-iframe');
    
    if (titleElement && iframeElement) {
        titleElement.innerText = `🌟 表示中: ${fileName}`;
        iframeElement.src = fileName;
    }
}
// ...（中略）...

// ==========================================
// 🚀 全画面アプリのデータと切り替え機能（動的生成）
// ==========================================
let dynamicApps = [];
window.fullScreenApps = {};

function loadApps() {
    const saved = localStorage.getItem('shinguApps');
    if (saved) {
        try {
            dynamicApps = JSON.parse(saved);
        } catch (e) {
            dynamicApps = [];
        }
    } else {
        dynamicApps = [];
    }
    renderApps();
    renderAdminAppList();
}

function renderApps() {
    const container = document.getElementById('dynamic-apps-container');
    if (!container) return;
    container.innerHTML = '';
    window.fullScreenApps = {};

    dynamicApps.forEach((app, index) => {
        const key = app.key;
        // modeプロパティをサポート (古いデータはデフォルトで'fullscreen')
        const mode = app.mode || 'fullscreen';
        window.fullScreenApps[key] = { title: app.icon + " " + app.name, url: app.url, mode: mode };

        const btn = document.createElement('div');
        btn.className = 'app-btn horizontal-btn';
        btn.id = 'btn-' + key;
        btn.onclick = () => openApp(key);
        
        btn.innerHTML = `
            <div class="key-badge">${key}</div>
            <div class="app-icon">${app.icon}</div>
            <span>${app.name}</span>
        `;
        container.appendChild(btn);
    });
}

function addApp() {
    const name = document.getElementById('new-app-name').value;
    const icon = document.getElementById('new-app-icon').value;
    const url = document.getElementById('new-app-url').value;
    const key = document.getElementById('new-app-key').value;
    const mode = document.getElementById('new-app-mode') ? document.getElementById('new-app-mode').value : 'fullscreen';
    
    if (!name || !icon || !url || !key) {
        alert('全ての項目を入力してください');
        return;
    }

    dynamicApps.push({ name, icon, url, key, mode });
    saveApps();
    
    document.getElementById('new-app-name').value = '';
    document.getElementById('new-app-icon').value = '';
    document.getElementById('new-app-url').value = '';
    document.getElementById('new-app-key').value = '';
}

function deleteApp(index) {
    if (confirm("本当にこのアプリボタンを削除しますか？")) {
        dynamicApps.splice(index, 1);
        saveApps();
    }
}

function saveApps() {
    localStorage.setItem('shinguApps', JSON.stringify(dynamicApps));
    renderApps();
    renderAdminAppList();
}

function renderAdminAppList() {
    const list = document.getElementById('admin-app-list');
    if (!list) return;
    list.innerHTML = '';
    dynamicApps.forEach((app, index) => {
        const modeStr = app.mode === 'popup' ? 'ポップアップ' : '全画面';
        const div = document.createElement('div');
        div.style = 'display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #ddd;';
        div.innerHTML = `
            <span style="font-size: 1.1rem;">【キー: ${app.key}】 ${app.icon} ${app.name} (${app.url}) [${modeStr}]</span>
            <button onclick="deleteApp(${index})" style="background: #E74C3C; color: white; border: none; border-radius: 5px; cursor: pointer; padding: 5px 10px;">削除</button>
        `;
        list.appendChild(div);
    });
}

// 初期化実行
window.addEventListener('DOMContentLoaded', loadApps);

// アプリを開く
function openApp(appId) {
    const data = window.fullScreenApps[appId];
    if (data) {
        animateTransition(() => {
            if (data.mode === 'popup') {
                openPopupApp(data);
            } else {
                document.getElementById('app-title').innerText = data.title;
                document.getElementById('app-iframe').src = data.url;
                document.getElementById('home-view').style.display = 'none';
                document.getElementById('app-fullscreen-view').style.display = 'flex';
            }
        });
    }
}

// アプリを閉じてホーム画面に戻る
function closeApp() {
    animateTransition(() => {
        document.getElementById('app-iframe').src = "";
        document.getElementById('home-view').style.display = 'flex';
        document.getElementById('app-fullscreen-view').style.display = 'none';
    });
}

function animateTransition(callback) {
    const circle = document.querySelector('.transition-circle');
    if (!circle) {
        callback();
        return;
    }
    
    // アニメーションを強制リセットして再開
    circle.classList.remove('animate-in');
    void circle.offsetWidth;
    circle.classList.add('animate-in');
    
    // 画面が完全に覆われたタイミング（300ms）で中身を切り替え
    setTimeout(() => {
        callback();
    }, 300);
}

function openPopupApp(data) {
    document.getElementById('popup-title').innerText = data.title;
    document.getElementById('popup-iframe').src = data.url;
    document.getElementById('popup-window').style.display = 'flex';
}

function closePopupApp() {
    document.getElementById('popup-iframe').src = "";
    document.getElementById('popup-window').style.display = 'none';
}


// ==========================================
// ⌨️ キーボード操作 ＆ 管理者モード
// ==========================================
let isShiftDown = false;
let isCtrlDown = false;

document.addEventListener('keydown', (event) => {
    // 管理者モードの検知
    if (event.key === 'Shift') isShiftDown = true;
    if (event.key === 'Control') isCtrlDown = true;

    if (isShiftDown && isCtrlDown) {
        document.getElementById('admin-modal').style.display = 'flex';
    }

    // ★追加：Escキー、または Backspaceキーで全画面アプリを閉じる
    if (event.key === 'Escape' || event.key === 'Backspace') {
        closeApp();
    }

    // 動的に生成されたアプリのショートカットキー操作
    if (window.fullScreenApps && window.fullScreenApps[event.key]) {
        // 入力フォームなどでタイプしている時は反応させない
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

        const btnElement = document.getElementById(`btn-${event.key}`);
        if (btnElement) {
            btnElement.classList.add('active');
            setTimeout(() => { btnElement.classList.remove('active'); }, 150);
        }
        openApp(event.key);
    }
});

document.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') isShiftDown = false;
    if (event.key === 'Control') isCtrlDown = false;
});

// --- 管理者画面用の機能 ---
function closeAdmin() {
    document.getElementById('admin-modal').style.display = 'none';
}

function changeScheduleModeFromAdmin() {
    currentScheduleMode = document.getElementById('admin-schedule-mode').value;
    updateCountdown();
}

function exitApp() {
    if (confirm("本当に案内板システムを終了しますか？")) {
        window.close();
    }
}

// 起動時は何もせず、HTMLのwait-time.htmlをそのまま表示
window.onload = function() {
    // 起動時の初期化があればここに記述
};

// ==========================================
// 遊び心機能: キャラクター画像のフリードラッグ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const mascots = document.querySelectorAll('.mascot-badge');
    
    mascots.forEach(mascot => {
        let isDragging = false;
        let offsetX, offsetY;

        const startDrag = (e) => {
            isDragging = true;
            
            // タッチイベントかマウスイベントかで座標を取得
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const rect = mascot.getBoundingClientRect();
            
            // 要素の左上からのクリック位置のズレを保持
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;

            // CSSでの位置固定を解除
            mascot.style.bottom = 'auto';
            mascot.style.right = 'auto';
            mascot.style.left = `${rect.left}px`;
            mascot.style.top = `${rect.top}px`;
            mascot.style.transform = 'none'; // translateX等があれば解除

            // 浮遊アニメーションを停止
            mascot.style.animation = 'none';

            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', drag, { passive: false });
            document.addEventListener('touchend', endDrag);
        };

        const drag = (e) => {
            if (!isDragging) return;
            e.preventDefault(); // スクロール等のブラウザデフォルト動作を防止

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            // マウス位置に合わせて座標を更新
            mascot.style.left = `${clientX - offsetX}px`;
            mascot.style.top = `${clientY - offsetY}px`;
        };

        const endDrag = () => {
            isDragging = false;
            
            // ドロップ後、再び浮遊アニメーションを再開させる
            if (mascot.id === 'matsumiya-badge') {
                mascot.style.animation = 'float-anim 4.5s infinite ease-in-out reverse';
            } else {
                mascot.style.animation = 'float-anim 4s infinite ease-in-out';
            }

            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('touchend', endDrag);
        };

        mascot.addEventListener('mousedown', startDrag);
        mascot.addEventListener('touchstart', startDrag, { passive: false });

        // 画像自体のドラッグ（半透明の幽霊みたいなやつ）を防ぐ
        mascot.addEventListener('dragstart', (e) => e.preventDefault());
    });
});

// ==========================================
// 🪟 ポップアップウィンドウのドラッグ＆リサイズ処理
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const popupWindow = document.getElementById('popup-window');
    const popupHeader = document.getElementById('popup-header');
    const overlay = document.getElementById('popup-overlay');

    if (!popupWindow || !popupHeader) return;

    let isDraggingPopup = false;
    let initialX, initialY;

    popupHeader.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return; // 閉じるボタン等をクリックした時は無効
        isDraggingPopup = true;
        const rect = popupWindow.getBoundingClientRect();
        initialX = e.clientX - rect.left;
        initialY = e.clientY - rect.top;
        
        if (overlay) overlay.style.display = 'block';

        popupWindow.style.cursor = 'grabbing';
        popupHeader.style.cursor = 'grabbing';
        
        document.addEventListener('mousemove', dragPopup);
        document.addEventListener('mouseup', stopDragPopup);
    });

    function dragPopup(e) {
        if (!isDraggingPopup) return;
        e.preventDefault();
        
        let newX = e.clientX - initialX;
        let newY = e.clientY - initialY;

        if (newY < 0) newY = 0;

        popupWindow.style.left = `${newX}px`;
        popupWindow.style.top = `${newY}px`;
    }

    function stopDragPopup() {
        isDraggingPopup = false;
        popupWindow.style.cursor = 'default';
        popupHeader.style.cursor = 'move';
        
        if (overlay) overlay.style.display = 'none';
        
        document.removeEventListener('mousemove', dragPopup);
        document.removeEventListener('mouseup', stopDragPopup);
    }
    
    // リサイズ中も iframe のイベントが邪魔しないようにする対応
    popupWindow.addEventListener('mousedown', (e) => {
        if (e.target === popupWindow) {
            if (overlay) overlay.style.display = 'block';
            const stopResize = () => {
                if (overlay) overlay.style.display = 'none';
                document.removeEventListener('mouseup', stopResize);
            };
            document.addEventListener('mouseup', stopResize);
        }
    });
});