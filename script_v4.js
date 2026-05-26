// ==========================================
// 🕒 時計機能
// ==========================================
function updateClock() {
    const now = new Date();
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const day = days[now.getDay()];

    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.innerHTML = `${h}:${m}:${s} <span style="font-size:0.6em; margin-left:10px;">(${day})</span>`;
    }
}
setInterval(updateClock, 1000);
updateClock();

// ==========================================
// 🏫 時間割カウントダウン機能（曜日自動判定版）
// ==========================================
// ⏳ チャイム・スケジュール
let chimeSchedule = [];

// ★ 追加：全予定終了後の表示設定
let finishedAppUrl = "";

// ★ 追加：案内板の設置階数設定
let currentFloor = "1";

function loadSettingsConfig() {
    finishedAppUrl = localStorage.getItem('naviFinishedAppUrl') || "wait-time-right.html";
    if (finishedAppUrl === "格言.html" || finishedAppUrl === "格言") {
        finishedAppUrl = "wait-time-right.html";
        localStorage.setItem('naviFinishedAppUrl', finishedAppUrl);
    }
    currentFloor = localStorage.getItem('naviCurrentFloor') || "1";
    
    // UIへの反映
    const floorInput = document.getElementById('admin-current-floor-input');
    if (floorInput) floorInput.value = currentFloor;

    // ★ 特別期間設定の読み込み
    const sStart = localStorage.getItem('naviSpecialStart');
    const sEnd = localStorage.getItem('naviSpecialEnd');
    const sMWF = localStorage.getItem('naviSpecialFileMWF');
    const sTTh = localStorage.getItem('naviSpecialFileTTh');

    if (document.getElementById('special-start-date')) document.getElementById('special-start-date').value = sStart || "";
    if (document.getElementById('special-end-date')) document.getElementById('special-end-date').value = sEnd || "";
    if (document.getElementById('special-json-mwf')) document.getElementById('special-json-mwf').value = sMWF || "";
    if (document.getElementById('special-json-tth')) document.getElementById('special-json-tth').value = sTTh || "";
}

// ※ saveSpecialPeriod / clearSpecialPeriod は下部で定義（重複定義を防ぐため）

function saveCurrentFloor() {
    const floorInput = document.getElementById('admin-current-floor-input');
    if (floorInput) {
        currentFloor = floorInput.value.trim() || "1";
        localStorage.setItem('naviCurrentFloor', currentFloor);
        
        showAdminToast(`📍 設置場所を ${currentFloor}階 に設定しました。画面を切り替えます...`);
        
        // 1秒後にリロード（トーストを見せるため）
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
}

function saveCountdownConfig() {
    localStorage.setItem('naviFinishedAppUrl', finishedAppUrl);
}

loadSettingsConfig(); // 起動時に読み込み

let lastTriggeredSeconds = -1; // 同じ秒数で何度も発動しないための記録用
// ==========================================
// ⏰ カウントダウン警告・占有モード設定（独立設定版）
// ==========================================

// --- ① 警告パネル設定 ---
let alertEnabled = localStorage.getItem('naviAlertEnabled') !== 'false'; // デフォルト有効
let alertMinutes = parseInt(localStorage.getItem('naviAlertMinutes') || '5');

function saveAlertConfig() {
    localStorage.setItem('naviAlertEnabled', String(alertEnabled));
    localStorage.setItem('naviAlertMinutes', String(alertMinutes));
}

// --- ② ロックスクリーン設定 ---
let lockEnabled = localStorage.getItem('naviLockEnabled') === 'true';  // デフォルト無効
let lockMinutes = parseInt(localStorage.getItem('naviLockMinutes') || '30');

function saveLockConfig() {
    localStorage.setItem('naviLockEnabled', String(lockEnabled));
    localStorage.setItem('naviLockMinutes', String(lockMinutes));
}

// --- 警告パネルの表示制御 ---
let alertPanelVisible = false;
function showAlertPanel(eventName, countStr) {
    const panel = document.getElementById('countdown-alert-panel');
    if (!panel) return;
    document.getElementById('alert-event-name').textContent = eventName;
    document.getElementById('alert-countdown-time').textContent = countStr;
    if (!alertPanelVisible) {
        panel.classList.add('visible');
        alertPanelVisible = true;
    } else {
        // 既に表示中は時刻だけ更新
        document.getElementById('alert-countdown-time').textContent = countStr;
    }
}
function hideAlertPanel() {
    const panel = document.getElementById('countdown-alert-panel');
    if (!panel) return;
    panel.classList.remove('visible');
    alertPanelVisible = false;
}

// --- ロックスクリーンの表示制御 ---
let lockScreenVisible = false;
function showLockScreen(eventName, countStr) {
    const lock = document.getElementById('countdown-lock-screen');
    if (!lock) return;
    document.getElementById('lock-event-name').textContent = eventName;
    document.getElementById('lock-countdown-time').textContent = countStr;
    if (!lockScreenVisible) {
        lock.classList.add('visible');
        lockScreenVisible = true;
    } else {
        document.getElementById('lock-countdown-time').textContent = countStr;
    }
}
function hideLockScreen() {
    const lock = document.getElementById('countdown-lock-screen');
    if (!lock) return;
    lock.classList.remove('visible');
    lockScreenVisible = false;
}

// 新緑祭タイムテーブル連動チャイム（timetable.htmlと同期）
const defaultChimes6 = [
    { "name": "1年生企画(中継)", "time": "10:15", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "吹奏楽部", "time": "10:45", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "6.0（有志）", "time": "11:18", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "Homies（有志）", "time": "11:25", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "you U（有志）", "time": "11:32", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "ピアニッシモ（有志）", "time": "11:40", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "はるな（有志）", "time": "11:52", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "ムラサキしきぶ（有志）", "time": "12:15", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "TA・WA・SHI（有志）", "time": "12:35", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "ダンス部", "time": "13:05", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 },
    { "name": "書道部", "time": "13:40", "alertEnabled": true, "alertMinutes": 5, "lockEnabled": false, "lockMinutes": 3 }
];

// 7限版も同一スケジュールで統一
const defaultChimes7 = defaultChimes6;


async function loadChimes() {
    const todayStr = new Date().toDateString();
    const lastSavedDate = localStorage.getItem('naviChimesDate');

    // --- ① 一日限定設定（最優先）のチェック ---
    const oneDayDate = localStorage.getItem('naviOneDayDate');
    const oneDayFile = localStorage.getItem('naviOneDayFile');

    if (oneDayDate && oneDayFile) {
        const targetDateStr = new Date(oneDayDate).toDateString();
        if (targetDateStr === todayStr) {
            // 本日の一日限定設定が有効
            if (lastSavedDate !== todayStr) {
                // 履歴が未記録の場合のみファイルを取得
                console.log(`[OneDaySetting] 一日限定設定: ${oneDayFile} を読み込みます。`);
                try {
                    const response = await fetch(oneDayFile);
                    if (response.ok) {
                        const data = await response.json();
                        if (Array.isArray(data)) {
                            chimeSchedule = data;
                            saveChimes();
                            renderChimeList();
                            return;
                        }
                    }
                } catch (e) {
                    console.error("一日限定ファイルの読み込みに失敗しました:", e);
                }
            } else {
                // 同日既済分を使用
                const saved = localStorage.getItem('naviChimes');
                if (saved) {
                    try { chimeSchedule = JSON.parse(saved); renderChimeList(); return; } catch(e) {}
                }
            }
        }
    }

    // --- ② 特別期間（日付指定）のチェック ---
    const specialStart = localStorage.getItem('naviSpecialStart');
    const specialEnd = localStorage.getItem('naviSpecialEnd');
    const specialFileMWF = localStorage.getItem('naviSpecialFileMWF');
    const specialFileTTh = localStorage.getItem('naviSpecialFileTTh');

    let useDefault = false;
    // 日付が変わったらリセットする（今日の保存データでなければ再判定する）
    if (lastSavedDate !== todayStr) {
        useDefault = true;
    }

    // 特別期間中かつ、今日まだ読み込んでいない（日付が変わった）場合はファイルを読み込む
    if (useDefault && specialStart && specialEnd) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        today.setHours(0, 0, 0, 0); // 時刻をリセットして日付のみで比較
        
        const start = new Date(specialStart);
        const end = new Date(specialEnd);
        end.setHours(23, 59, 59, 999);

        if (today >= start && today <= end) {
            // 曜日に応じて読み込むファイルを判定
            let targetFile = "";
            if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) {
                targetFile = specialFileMWF;
            } else if (dayOfWeek === 2 || dayOfWeek === 4) {
                targetFile = specialFileTTh;
            }

            if (targetFile) {
                console.log(`[SpecialPeriod] 曜日判定により ${targetFile} を自動読み込みします。`);
                try {
                    const response = await fetch(targetFile);
                    if (response.ok) {
                        const data = await response.json();
                        if (Array.isArray(data)) {
                            chimeSchedule = data;
                            saveChimes(); // 今日のデータとしてlocalStorageに固定
                            renderChimeList();
                            return;
                        }
                    }
                } catch (e) {
                    console.error("特別期間ファイルの読み込みに失敗しました:", e);
                }
            }
        }
    }

    const saved = localStorage.getItem('naviChimes');
    if (saved && !useDefault) {
        try {
            chimeSchedule = JSON.parse(saved);
        } catch (e) {
            useDefault = true;
        }
    }

    if (!saved || useDefault) {
        const dayOfWeek = new Date().getDay();
        // 新緑祭タイムテーブルで統一（曜日によらず同一スケジュール）
        chimeSchedule = JSON.parse(JSON.stringify(defaultChimes6));
        saveChimes(); // 自動的に今日のデータとして保存する
    }
    renderChimeList();
}

function saveChimes() {
    const todayStr = new Date().toDateString();
    localStorage.setItem('naviChimesDate', todayStr);
    localStorage.setItem('naviChimes', JSON.stringify(chimeSchedule));
    renderChimeList();
    updateCountdown(); // 保存直後に反映
}

function addChime() {
    const name = document.getElementById('new-chime-name').value;
    const time = document.getElementById('new-chime-time').value;
    if (!name || !time) {
        alert('予定名と時間を入力してください');
        return;
    }
    // デフォルトの個別設定を付与
    chimeSchedule.push({
        name, time,
        alertEnabled: true, alertMinutes: 5,
        lockEnabled: false, lockMinutes: 30
    });
    // 時間順に並び替え
    chimeSchedule.sort((a, b) => a.time.localeCompare(b.time));
    saveChimes();
    document.getElementById('new-chime-name').value = '';
    document.getElementById('new-chime-time').value = '';
}

function deleteChime(index) {
    if (confirm('この予定を削除しますか？')) {
        chimeSchedule.splice(index, 1);
        saveChimes();
    }
}

function renderChimeList() {
    const list = document.getElementById('admin-chime-list');
    if (!list) return;
    list.innerHTML = '';
    chimeSchedule.forEach((chime, index) => {
        const aEnabled = chime.alertEnabled !== false;
        const aMin = chime.alertMinutes || 5;
        const lEnabled = chime.lockEnabled === true;
        const lMin = chime.lockMinutes || 30;

        const div = document.createElement('div');
        div.className = 'chime-item';
        div.innerHTML = `
            <div class="chime-item-header">
                <span class="chime-item-time">【${chime.time}】 ${chime.name}</span>
                <div class="chime-item-actions">
                    <span class="chime-badge ${aEnabled ? 'badge-alert' : 'badge-off'}">⏰ ${aEnabled ? aMin + '分前' : 'OFF'}</span>
                    <span class="chime-badge ${lEnabled ? 'badge-lock' : 'badge-off'}">🔒 ${lEnabled ? lMin + '分前' : 'OFF'}</span>
                    <button class="chime-settings-btn" onclick="toggleChimeSettings(${index})">⚙️ 編集</button>
                    <button onclick="deleteChime(${index})" class="chime-delete-btn">削除</button>
                </div>
            </div>
            <div id="chime-settings-${index}" class="chime-settings-panel">

                <!-- 予定名・時刻の編集 -->
                <div style="display:grid; grid-template-columns:1fr auto; gap:8px; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid rgba(0,0,0,0.08);">
                    <input id="chime-edit-name-${index}" class="admin-input" style="margin:0; font-weight:800;" placeholder="予定名" value="${chime.name}">
                    <input id="chime-edit-time-${index}" type="time" class="admin-input" style="margin:0; width:130px;" value="${chime.time}">
                </div>

                <div class="chime-settings-grid">
                    <div class="chime-setting-block border-alert">
                        <div class="chime-setting-title">
                            <span>⏰ 警告パネル</span>
                            <label class="admin-toggle">
                                <input type="checkbox" id="chime-alert-toggle-${index}" ${aEnabled ? 'checked' : ''}>
                                <span class="admin-toggle-slider"></span>
                            </label>
                        </div>
                        <div class="feature-time-row" style="margin-top:10px;">
                            <span class="feature-time-label">残り</span>
                            <input type="number" id="chime-alert-min-${index}"
                                class="admin-input feature-num-input" min="1" max="120" value="${aMin}">
                            <span class="feature-time-label">分前から表示</span>
                        </div>
                    </div>
                    <div class="chime-setting-block border-lock">
                        <div class="chime-setting-title">
                            <span>🔒 ロックスクリーン</span>
                            <label class="admin-toggle">
                                <input type="checkbox" id="chime-lock-toggle-${index}" ${lEnabled ? 'checked' : ''}>
                                <span class="admin-toggle-slider"></span>
                            </label>
                        </div>
                        <div class="feature-time-row" style="margin-top:10px;">
                            <span class="feature-time-label">残り</span>
                            <input type="number" id="chime-lock-min-${index}"
                                class="admin-input feature-num-input" min="1" max="120" value="${lMin}">
                            <span class="feature-time-label">分前から占有</span>
                        </div>
                    </div>
                    </div>
                </div>

                <!-- ★ チャイム固有のカウントダウン連動アプリ設定 -->
                ${renderChimeCountdownAppsUI(index)}

                <button class="admin-btn chime-save-btn" onclick="saveChimeSettings(${index})">✔️ 変更を保存</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// アコーディオンの開閉
function toggleChimeSettings(index) {
    const panel = document.getElementById(`chime-settings-${index}`);
    if (!panel) return;
    panel.classList.toggle('open');
}

// 個別設定を保存（名前・時刻も含む）
function saveChimeSettings(index) {
    const aToggle = document.getElementById(`chime-alert-toggle-${index}`);
    const aInput = document.getElementById(`chime-alert-min-${index}`);
    const lToggle = document.getElementById(`chime-lock-toggle-${index}`);
    const lInput = document.getElementById(`chime-lock-min-${index}`);
    const nameInput = document.getElementById(`chime-edit-name-${index}`);
    const timeInput = document.getElementById(`chime-edit-time-${index}`);
    if (!aToggle || !aInput || !lToggle || !lInput) return;

    // 予定名・時刻の更新
    if (nameInput && nameInput.value.trim()) chimeSchedule[index].name = nameInput.value.trim();
    if (timeInput && timeInput.value) chimeSchedule[index].time = timeInput.value;

    // 警告・ロック設定の更新
    chimeSchedule[index].alertEnabled = aToggle.checked;
    const aVal = parseInt(aInput.value);
    chimeSchedule[index].alertMinutes = (isNaN(aVal) || aVal < 1) ? 1 : aVal;
    chimeSchedule[index].lockEnabled = lToggle.checked;
    const lVal = parseInt(lInput.value);
    chimeSchedule[index].lockMinutes = (isNaN(lVal) || lVal < 1) ? 1 : lVal;

    // 時間順に並び替え
    chimeSchedule.sort((a, b) => a.time.localeCompare(b.time));
    localStorage.setItem('naviChimes', JSON.stringify(chimeSchedule));
    updateCountdown();
    renderChimeList(); 
    showAdminToast(`✔️ 【${chimeSchedule[index]?.time || ''}】の設定を保存しました`);
}

// --- チャイム固有のカウントダウン連動アプリ設定のUI生成 ---
function renderChimeCountdownAppsUI(chimeIndex) {
    const chime = chimeSchedule[chimeIndex];
    if (!chime) return "";
    
    let html = `
        <div class="chime-setting-block border-app" style="grid-column: 1 / -1; margin-top: 15px; border-left: 4px solid #be123c; padding-left:12px; background:rgba(190,18,60,0.02); border-radius:4px;">
            <div class="chime-setting-title" style="margin-bottom:8px;">
                <span style="color: #be123c; font-weight:800; font-size:0.9rem;">⏱️ この予定専用の連動アプリ</span>
            </div>
            <div id="chime-countdown-list-${chimeIndex}">
                <div style="display:flex; gap:10px; align-items:center; margin-top:5px;">
                    <input type="text" id="chime-countdown-url-${chimeIndex}" class="admin-input" style="flex:1; margin:0;" placeholder="ファイル名.html" value="${chime.countdownAppUrl || ''}">
                    <button onclick="saveChimeCountdownApp(${chimeIndex})" style="background:#be123c; color:white; border:none; border-radius:8px; cursor:pointer; padding:10px 18px; font-weight:800; font-size:0.85rem;">保存</button>
                </div>
                <p style="font-size:0.75rem; color:#6b7280; margin-top:6px; margin-bottom:0;">※設定すると、この予定のカウントダウン中はずっとこのアプリが表示されます。</p>
            </div>
        </div>
    `;
    return html;
}

function saveChimeCountdownApp(chimeIndex) {
    const url = document.getElementById(`chime-countdown-url-${chimeIndex}`).value.trim();
    chimeSchedule[chimeIndex].countdownAppUrl = url;
    saveChimes();
    showAdminToast('✔️ 連動アプリの設定を保存しました');
}

// (古い add/remove 関数は削除)

// 📥 チャイムをファイルに書き出し (JSON)
function exportChimes() {
    if (chimeSchedule.length === 0) {
        alert("設定された予定がありません。");
        return;
    }
    const dataStr = JSON.stringify(chimeSchedule, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chimes_config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 📤 ファイルから読み込み (JSON)
function triggerChimeImport() {
    document.getElementById('chime-import-input').click();
}

function importChimesFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("現在のスケジュールを上書きしてファイルを読み込みますか？")) {
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (Array.isArray(importedData)) {
                chimeSchedule = importedData;
                saveChimes();
                alert("スケジュールを正常に読み込みました。");
            } else {
                throw new Error("Invalid format");
            }
        } catch (err) {
            alert("ファイルの形式が正しくありません。");
            console.error(err);
        }
        event.target.value = ""; // Reset input
    };
    reader.readAsText(file);
}

// 📦 全設定書き出し
function exportAllSettings() {
    const allSettings = {
        global: {
            alertEnabled: alertEnabled,
            alertMinutes: alertMinutes,
            lockEnabled: lockEnabled,
            lockMinutes: lockMinutes
        },
        chimes: chimeSchedule,
        apps: dynamicApps,
        countdown: {
            finishedUrl: finishedAppUrl
        },
        location: {
            currentFloor: currentFloor
        },
        // メニューリスト設定 ('shinryokusai_menu_v1') を追加
        menu: (() => {
            try {
                const savedMenu = localStorage.getItem('shinryokusai_menu_v1');
                return savedMenu ? JSON.parse(savedMenu) : null;
            } catch (e) {
                console.error("Failed to parse menu settings for export:", e);
                return null;
            }
        })()
    };

    const dataStr = JSON.stringify(allSettings, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "all_settings_config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showAdminToast("📤 全ての設定（メニュー設定含む）をファイルに書き出しました");
}

// 📦 全設定インポート
function triggerAllSettingsImport() {
    document.getElementById('all-settings-import-input').click();
}

function importAllSettingsFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm("全ての設定（アラート、時間割、スケジュール、アプリ、メニュー設定）を上書きしますか？\nこの操作は元に戻せません。")) {
        event.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.global || !data.chimes || !data.apps) {
                throw new Error("Invalid format: Missing required sections.");
            }

            // 1. Global config
            alertEnabled = data.global.alertEnabled !== false;
            alertMinutes = parseInt(data.global.alertMinutes || 5);
            lockEnabled = data.global.lockEnabled === true;
            lockMinutes = parseInt(data.global.lockMinutes || 30);
            saveAlertConfig();
            saveLockConfig();

            // 2. Chimes
            chimeSchedule = data.chimes;
            saveChimes();

            // 4. Apps
            dynamicApps = data.apps;
            saveApps();

            // 5. Countdown Config
            if (data.countdown) {
                finishedAppUrl = data.countdown.finishedUrl || "";
                saveCountdownConfig();
            }

            // 6. Location Settings
            if (data.location) {
                currentFloor = data.location.currentFloor || "1";
                localStorage.setItem('naviCurrentFloor', currentFloor);
            }

            // 7. Menu Settings ('shinryokusai_menu_v1')
            if (data.menu) {
                try {
                    localStorage.setItem('shinryokusai_menu_v1', JSON.stringify(data.menu));
                    console.log("[Import] メニュー設定を正常に復元しました。");
                } catch (err) {
                    console.error("Failed to restore menu settings:", err);
                }
            }

            alert("全ての設定（メニュー設定含む）を正常に読み込みました。再読込して適用します。");
            location.reload();

        } catch (err) {
            alert("ファイルの形式が正しくないか、必要なデータが不足しています。");
            console.error(err);
        }
        event.target.value = "";
    };
    reader.readAsText(file);
}

// 読み込みキーの調整

let currentScheduleMode = "default";

function getAutoScheduleMode() {
    return "default";
}

function updateCountdown() {
    const now = new Date(Date.now() + (window._debugTimeOffset || 0));
    const nowSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();

    const activeSchedule = chimeSchedule;
    let nextEvent = null;
    let foundDiff = 0;

    if (activeSchedule) {
        for (let i = 0; i < activeSchedule.length; i++) {
            const [h, m] = activeSchedule[i].time.split(':');
            const eventSeconds = (parseInt(h) * 3600) + (parseInt(m) * 60);

            if (eventSeconds >= nowSeconds) {
                nextEvent = activeSchedule[i];
                foundDiff = eventSeconds - nowSeconds;
                const remainMin = Math.floor(foundDiff / 60);
                const remainSec = String(foundDiff % 60).padStart(2, '0');

                const nextClassElement = document.getElementById('next-class-name');
                const countdownElement = document.getElementById('countdown-timer');
                const globalCountdown = document.getElementById('global-countdown-text');

                const countStr = remainMin >= 60 ?
                    `${Math.floor(remainMin / 60)}時間 ${String(remainMin % 60).padStart(2, '0')}分` :
                    `${remainMin}分 ${remainSec}秒`;

                // トップバーのカウントダウン：警告閾値以下で色を変える
                const globalContainer = document.getElementById('global-countdown-container');

                // ★ チャイム固有の設定を取得
                const cAlertEnabled = nextEvent.alertEnabled !== false;
                const cAlertMinutes = nextEvent.alertMinutes || 5;
                const cLockEnabled = nextEvent.lockEnabled === true;
                const cLockMinutes = nextEvent.lockMinutes || 30;

                const widget = document.getElementById('countdown-widget');
                const flashEl = document.getElementById('urgent-border-flash');

                if (cAlertEnabled && foundDiff <= 60) {
                    // 1分切り：超緊急モード
                    if (globalContainer) {
                        globalContainer.classList.add('urgent');
                        globalContainer.classList.add('critical');
                    }
                    if (widget) {
                        widget.classList.remove('warn');
                        widget.classList.add('critical');
                    }
                    if (flashEl) flashEl.classList.add('active');
                } else if (cAlertEnabled && foundDiff <= cAlertMinutes * 60) {
                    // 5分切り：警告モード
                    if (globalContainer) {
                        globalContainer.classList.add('urgent');
                        globalContainer.classList.remove('critical');
                    }
                    if (widget) {
                        widget.classList.add('warn');
                        widget.classList.remove('critical');
                    }
                    if (flashEl) flashEl.classList.remove('active');
                } else {
                    // 通常
                    if (globalContainer) {
                        globalContainer.classList.remove('urgent');
                        globalContainer.classList.remove('critical');
                    }
                    if (widget) {
                        widget.classList.remove('warn');
                        widget.classList.remove('critical');
                    }
                    if (flashEl) flashEl.classList.remove('active');
                }

                if (nextClassElement) nextClassElement.innerText = `次のチャイム（${nextEvent.name}）まで`;
                if (countdownElement) countdownElement.innerText = countStr;
                if (globalCountdown) globalCountdown.innerText = `${nextEvent.name}まで ${countStr}`;

                // ========== ロックスクリーン（優先度が高い）==========
                if (cLockEnabled && foundDiff <= cLockMinutes * 60) {
                    showLockScreen(nextEvent.name, countStr);
                    hideAlertPanel();
                } else {
                    hideLockScreen();

                    // ========== 警告パネル（ロック非表示時のみ） ==========
                    if (cAlertEnabled && foundDiff <= cAlertMinutes * 60) {
                        showAlertPanel(nextEvent.name, countStr);
                    } else {
                        hideAlertPanel();
                    }
                }

                // ★ カウントダウンに連動した右パネルの自動切り替えチェック
                checkCountdownApps(foundDiff);

                break;
            }
        }
    }

    if (!nextEvent) {
        const nextClassElement = document.getElementById('next-class-name');
        const countdownElement = document.getElementById('countdown-timer');
        const globalCountdown = document.getElementById('global-countdown-text');
        const globalContainer = document.getElementById('global-countdown-container');
        if (nextClassElement) nextClassElement.innerText = "全日程が終了しました";
        if (countdownElement) countdownElement.innerText = "また来年！👋";
        if (globalCountdown) globalCountdown.innerText = "全日程が終了しました。また来年！";
        if (globalContainer) {
            globalContainer.classList.remove('urgent');
            globalContainer.classList.remove('critical');
        }
        const widget = document.getElementById('countdown-widget');
        if (widget) { widget.classList.remove('warn'); widget.classList.remove('critical'); }
        const flashEl = document.getElementById('urgent-border-flash');
        if (flashEl) flashEl.classList.remove('active');
        hideAlertPanel();
        hideLockScreen();

        // ★ 全終了後の自動切り替えチェック
        checkCountdownApps(-1); // -1 は全終了を意味する
    }
}

// 現在の状況（カウントダウン・スケジュール）から表示すべきURLを判定
function getCurrentActiveFile(currentRemainSeconds = -2) {
    const now = new Date(Date.now() + (window._debugTimeOffset || 0));
    const nowSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();

    let remain = currentRemainSeconds;
    let nextEvent = null;

    // 次のイベントを特定
    for (const chime of chimeSchedule) {
        const [h, m] = chime.time.split(':');
        const eventSeconds = (parseInt(h) * 3600) + (parseInt(m) * 60);
        if (eventSeconds >= nowSeconds) {
            nextEvent = chime;
            if (remain === -2) remain = eventSeconds - nowSeconds;
            break;
        }
    }
    
    if (!nextEvent && remain === -2) remain = -1; // 全終了

    // 1. 次のチャイム固有のカウントダウン連動判定
    if (nextEvent && nextEvent.countdownAppUrl && remain > 0) {
        return nextEvent.countdownAppUrl;
    } 
    
    // 2. 全予定終了後の判定
    if (remain === -1 && finishedAppUrl) {
        return finishedAppUrl;
    }

    // 3. デフォルト
    // 管理者設定のメインパネル入力欄がある場合はそこから取得、なければ固定デフォルト
    const inputElement = document.getElementById('admin-main-panel-input');
    return (inputElement && inputElement.value) ? inputElement.value.trim() : "wait-time-right.html";
}

function checkCountdownApps(seconds) {
    // 1秒ごとに1回だけ判定（秒数が変わった時のみ）
    if (seconds === lastTriggeredSeconds) return;
    lastTriggeredSeconds = seconds;

    // 全画面アプリまたはポップアップが開いているときは自動切り替えをスキップ
    const appView = document.getElementById('app-fullscreen-view');
    const popupView = document.getElementById('popup-window');
    if ((appView && appView.style.display === 'flex') ||
        (popupView && popupView.style.display === 'flex')) {
        return;
    }

    const targetFile = getCurrentActiveFile(seconds);
    
    // 現在の表示と異なり、かつ自動切り替えが必要な場合
    if (targetFile && targetFile !== lastScheduledFile) {
        console.log(`[AutoSwitch] Switching to: ${targetFile} (Reason: Countdown/Phase)`);
        changeMainPanel(targetFile);
    }
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ==========================================
// 🧪 デバッグ：時刻シミュレーター
// ==========================================
function simulateTime(minutesBefore) {
    // モーダルを先に閉じて変化が見えるようにする
    const modal = document.getElementById('admin-modal');
    if (modal) modal.style.display = 'none';

    if (minutesBefore === null) {
        window._debugTimeOffset = 0;
        updateCountdown();
        showAdminToast('✕ 時刻シミュレーターをリセットしました');
        return;
    }

    // 現在のチャイムスケジュールから「次に来るチャイム」または最初のチャイムを探す
    let targetChime = null;
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    for (const chime of chimeSchedule) {
        const [h, m] = chime.time.split(':');
        const chimeSec = parseInt(h) * 3600 + parseInt(m) * 60;
        if (chimeSec > nowSec) {
            targetChime = chime;
            const targetSec = chimeSec - minutesBefore * 60;
            window._debugTimeOffset = (targetSec - nowSec) * 1000;
            showAdminToast(`🧪 【${chime.name}】の ${minutesBefore >= 1 ? minutesBefore + '分前' : '30秒前'} を模擬中`);
            updateCountdown();
            return;
        }
    }

    // 当日のチャイムが全て過去なら最初のチャイムを翌日扱いで模擬
    if (chimeSchedule.length > 0) {
        const first = chimeSchedule[0];
        const [h, m] = first.time.split(':');
        const chimeSec = parseInt(h) * 3600 + parseInt(m) * 60;
        // 翌日として計算（+86400秒）
        const targetSec = chimeSec + 86400 - minutesBefore * 60;
        window._debugTimeOffset = (targetSec - nowSec) * 1000;
        showAdminToast(`🧪 【${first.name}】の ${minutesBefore >= 1 ? minutesBefore + '分前' : '30秒前'} を模擬中（翌日扱い）`);
        updateCountdown();
        return;
    }

    showAdminToast('⚠️ チャイムスケジュールが設定されていません');
}

// ==========================================
// 📱 メインパネル（常時表示）の機能 ＆ 自動切り替え
// ==========================================

let lastScheduledFile = "";

function changeMainPanel(url = null) {
    let fileName = "";
    if (url) {
        fileName = url;
    } else {
        const inputElement = document.getElementById('admin-main-panel-input');
        if (!inputElement) return;
        fileName = inputElement.value.trim();
    }
    
    if (!fileName) return;

    const iframeElement = document.getElementById('main-panel-iframe');
    const choiceAppElement = document.getElementById('integrated-choice-app');
    
    // 究極の2択の場合は統合UIを表示
    if (fileName === "究極の2択.html") {
        if (iframeElement) iframeElement.style.display = 'none';
        if (choiceAppElement) {
            choiceAppElement.style.display = 'flex'; // flexにすることで中央配置
            if (typeof initChoiceApp === 'function') initChoiceApp();
        }
    } else {
        if (choiceAppElement) {
            choiceAppElement.style.display = 'none';
            // 履歴画面が開いていれば閉じる
            const historyView = document.getElementById('choice-history-view');
            if (historyView) historyView.style.display = 'none';
        }
        if (iframeElement) {
            iframeElement.style.display = 'block';
            // 同じURLならリロードしない
            if (iframeElement.src.endsWith(fileName)) {
                lastScheduledFile = fileName;
                return;
            }
            iframeElement.src = fileName;
        }
    }
    lastScheduledFile = fileName;
    console.log(`[MainPanel] Switched to: ${fileName}`);
}

// ==========================================
// 🚀 全画面アプリのデータと切り替え機能（動的生成）
// ==========================================
let dynamicApps = [];
window.fullScreenApps = {};
let draggedItemIndex = null; // ドラッグ中のアイテムのインデックス

function loadApps() {
    const saved = localStorage.getItem('naviApps');
    
    // 共通のデフォルトアプリ配列を定義（ver3.0に入っている実際のファイル）
    const defaultAppsList = [
        { name: "📅 タイムテーブル", icon: "📅", url: "timetable-app.html", key: "1", mode: "fullscreen" },
        { name: "🍚 食堂混雑状況", icon: "🍚", url: "cafeteria-app.html", key: "2", mode: "fullscreen" },
        { name: "🛍️ 商店・在庫状況", icon: "🛍️", url: "shops-app.html", key: "3", mode: "fullscreen" },
        { name: "⏱️ 独自企画待ち時間", icon: "⏱️", url: "events-app.html", key: "4", mode: "fullscreen" },
        { name: "時刻表", icon: "⏱️", url: "train-timetable.html", key: "t", mode: "fullscreen" },
        { name: "メニュー一覧", icon: "🍽️", url: "menu-list.html", key: "l", mode: "fullscreen" }
    ];

    const ORDER_VERSION = 'v4_order_final_v12';
    const savedVersion = localStorage.getItem('naviAppsOrderVersion');

    if (saved && savedVersion === ORDER_VERSION) {
        try {
            dynamicApps = JSON.parse(saved);
            
            // 強制的に前回の模擬店、遅延管理、校内マップ、ならびに食堂メニューを除外する
            dynamicApps = dynamicApps.filter(app => 
                app.url !== "menu.html" && 
                app.url !== "メニュー.html" && 
                app.url !== "メニュー表.html" && 
                app.name !== "模擬店" &&
                app.url !== "delay-control.html" &&
                app.url !== "school-guide.html" &&
                app.url !== "canteen-menu.html"
            );

            // 互換性・キャッシュ対策のための移行処理
            let hasOldApps = false;
            dynamicApps.forEach(app => {
                if (app.url === "時刻表.html" || app.url === "時刻表_v2.html") {
                    app.url = "train-timetable.html";
                }

                if (app.url === "メニュー.html" || app.url === "メニュー表.html") {
                    app.url = "menu.html";
                }
                // 子アプリフォルダ移動に伴うパスのマイグレーション
                if (app.url === "app1-timetable/index.html") {
                    app.url = "timetable-app.html";
                }
                if (app.url === "app2-cafeteria/index.html") {
                    app.url = "cafeteria-app.html";
                }
                if (app.url === "app3-shops/index.html") {
                    app.url = "shops-app.html";
                }
                if (app.url === "app4-events/index.html") {
                    app.url = "events-app.html";
                }

                // 古い非存在ファイルが登録されているかチェック
                if (app.url === "天気.html" || app.url === "占い.html" || app.url === "学習.html" || app.url === "格言.html" || app.url === "バグ.html" || app.url === "広報.html" || app.url === "究極 of 2択.html" || app.url === "究極の2択.html" || app.url === "menu.html") {
                    hasOldApps = true;
                }
            });
            // 古い非存在アプリが含まれている、あるいは古いデフォルト構成の場合は自動的にアップグレード
            if (hasOldApps) {
                console.log("[Migration] Old default apps detected. Resetting to new local file defaults.");
                dynamicApps = defaultAppsList;
            }
            saveApps(); // 修正したURLを保存
        } catch (e) {
            console.warn("Could not parse dynamicApps:", e);
            dynamicApps = defaultAppsList;
            localStorage.setItem('naviAppsOrderVersion', ORDER_VERSION);
            saveApps();
        }
    } else {
        // デフォルトアプリのセット（初回起動、または新しい表示順序へのバージョン強制移行用）
        dynamicApps = defaultAppsList;
        localStorage.setItem('naviAppsOrderVersion', ORDER_VERSION);
        saveApps(); // デフォルトを保存
    }
    renderApps();
    renderAdminAppList();
    loadChimes(); // チャイムスケジュールも読み込む
    renderCountdownPhases(); // カウントダウン連動設定も表示
}

// 以前の共通設定用関数は削除または非表示にするが、全終了後設定のみ残す
function renderCountdownPhases() {
    const finishedInput = document.getElementById('admin-finished-app-input');
    if (finishedInput) finishedInput.value = finishedAppUrl;
}

function updateFinishedApp() {
    const url = document.getElementById('admin-finished-app-input').value.trim();
    finishedAppUrl = url;
    saveCountdownConfig();
    showAdminToast('✔️ 全終了後の表示設定を保存しました');
    updateCountdown(); 
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
        btn.className = 'app-btn';
        btn.id = 'btn-' + key;
        btn.onclick = () => openApp(key);

        btn.innerHTML = `
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
    localStorage.setItem('naviApps', JSON.stringify(dynamicApps));
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
        div.style = 'border-bottom: 1px solid #e2e8f0; padding: 4px 0;';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 4px;">
                <span style="font-size:1rem; font-weight:700;">
                    【${app.key}】 ${app.icon} ${app.name}
                    <span style="font-size:0.82rem; color:#888; font-weight:400;"> /${app.url}/ [${modeStr}]</span>
                </span>
                <div style="display:flex; gap:6px; flex-shrink:0;">
                    <button onclick="toggleAppEdit(${index})"
                        style="background:#3b82f6; color:#fff; border:none; border-radius:6px; padding:5px 14px; font-weight:800; cursor:pointer;">✏️ 編集</button>
                    <button onclick="deleteApp(${index})"
                        style="background:#e74c3c; color:#fff; border:none; border-radius:6px; padding:5px 14px; font-weight:800; cursor:pointer;">削除</button>
                </div>
            </div>
            <!-- インライン編集パネル -->
            <div id="app-edit-${index}" style="display:none; background:rgba(59,130,246,0.06); border:1px solid rgba(59,130,246,0.2); border-radius:12px; padding:14px; margin:0 4px 8px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                    <input id="app-edit-name-${index}" class="admin-input" style="margin:0;" placeholder="表示名" value="${app.name}">
                    <input id="app-edit-icon-${index}" class="admin-input" style="margin:0;" placeholder="アイコン絵文字" value="${app.icon}">
                    <input id="app-edit-url-${index}"  class="admin-input" style="margin:0;" placeholder="URLまたはファイル名" value="${app.url}">
                    <input id="app-edit-key-${index}"  class="admin-input" style="margin:0;" placeholder="ショートカットキー" value="${app.key}">
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <select id="app-edit-mode-${index}" class="admin-input" style="margin:0; flex:1;">
                        <option value="fullscreen" ${app.mode !== 'popup' ? 'selected' : ''}>全画面で開く</option>
                        <option value="popup"      ${app.mode === 'popup' ? 'selected' : ''}>ポップアップで開く</option>
                    </select>
                    <button onclick="saveAppEdit(${index})"
                        style="background:#16a34a; color:#fff; border:none; border-radius:8px; padding:10px 22px; font-weight:900; cursor:pointer; white-space:nowrap;">✔️ 保存</button>
                </div>
            </div>
        `;
        list.appendChild(div);
    });
}

function toggleAppEdit(index) {
    const panel = document.getElementById(`app-edit-${index}`);
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function saveAppEdit(index) {
    const name = document.getElementById(`app-edit-name-${index}`)?.value.trim();
    const icon = document.getElementById(`app-edit-icon-${index}`)?.value.trim();
    const url = document.getElementById(`app-edit-url-${index}`)?.value.trim();
    const key = document.getElementById(`app-edit-key-${index}`)?.value.trim();
    const mode = document.getElementById(`app-edit-mode-${index}`)?.value;
    if (!name || !icon || !url || !key) {
        alert('全ての項目を入力してください');
        return;
    }
    dynamicApps[index] = { name, icon, url, key, mode };
    saveApps(); // 保存＆再描画
    showAdminToast(`✔️ 【${name}】を更新しました`);
}

// 共通設定ファイル(all_settings_config.json)から全員のスマホへ設定データを自動同期する関数
async function initializeDefaultSettingsFromJSON(forceUpdate = false) {
    const hasCache = localStorage.getItem('naviChimes') && localStorage.getItem('naviApps');
    
    // キャッシュがなく、かつ強制アップデートでもない場合は、自動で同期を行う
    if (!hasCache) {
        forceUpdate = true;
    }

    try {
        // 3秒のタイムアウト付きでfetchを実行 (起動がフリーズするのを防ぐセーフガード)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch('all_settings_config.json?t=' + Date.now(), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            if (data) {
                let changed = false;

                // 差分チェック関数
                const checkAndSet = (key, value) => {
                    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    const current = localStorage.getItem(key);
                    if (current !== strVal) {
                        localStorage.setItem(key, strVal);
                        changed = true;
                    }
                };

                // 1. Global config
                if (data.global) {
                    checkAndSet('naviAlertEnabled', data.global.alertEnabled !== false);
                    checkAndSet('naviAlertMinutes', parseInt(data.global.alertMinutes || 5));
                    checkAndSet('naviLockEnabled', data.global.lockEnabled === true);
                    checkAndSet('naviLockMinutes', parseInt(data.global.lockMinutes || 30));
                    
                    // 管理者アプリで保存されたポータルデフォルト表示パネルがある場合は反映
                    if (data.global.mainPanelDefault) {
                        checkAndSet('naviMainPanelInput', data.global.mainPanelDefault);
                    }
                }

                // 2. Chimes
                if (data.chimes) {
                    checkAndSet('naviChimesDate', new Date().toDateString());
                    checkAndSet('naviChimes', data.chimes);
                }

                // 4. Apps
                if (data.apps) {
                    checkAndSet('naviApps', data.apps);
                    checkAndSet('naviAppsOrderVersion', 'v4_order_final_v12');
                }

                // 5. Countdown Config
                if (data.countdown) {
                    checkAndSet('naviFinishedAppUrl', data.countdown.finishedUrl || "");
                }

                // 6. Location Settings
                if (data.location) {
                    checkAndSet('naviCurrentFloor', data.location.currentFloor || "1");
                }

                // 7. Delay Settings
                if (data.delay) {
                    checkAndSet('naviDelayEnabled', data.delay.enabled ? 'true' : 'false');
                    checkAndSet('naviDelayText', data.delay.text || '');
                    checkAndSet('naviDelayApiUrl', data.delay.apiUrl || '');
                }

                // 8. Menu Settings ('shinryokusai_menu_v1')
                if (data.menu) {
                    checkAndSet('shinryokusai_menu_v1', data.menu);
                }

                if (changed && !forceUpdate) {
                    console.log("[Sync] サーバー側での設定変更を検知しました。画面を再読み込みします。");
                    location.reload();
                } else if (changed) {
                    console.log("[Sync] サーバー設定を展開しました。");
                }
            }
        }
    } catch (e) {
        console.warn("[Sync] サーバーとの同期をスキップしました (ローカルキャッシュを使用します):", e);
    }
}

// 初期化実行
window.addEventListener('DOMContentLoaded', () => {
    // 1. まずローカルのキャッシュからアプリボタンを即座に（0msで）レンダリングしてタップ可能にする
    loadApps();
    initInactivityTimer();

    // 2. その後、バックグラウンド（非同期）でサーバーの共通設定を自動フェッチ・同期する
    // awaitを使わず並行して実行することで、ローカルファイル（file://）起動時や通信遅延時の画面フリーズを完全に防止します
    initializeDefaultSettingsFromJSON(true);

    // 3. 30秒ごとにバックグラウンドでサーバーの設定変更をポーリング同期チェック
    setInterval(async () => {
        await initializeDefaultSettingsFromJSON(false);
    }, 30000);
});

// アプリを開く
function openApp(appId) {
    const data = window.fullScreenApps[appId];
    if (data) {
        animateTransition(() => {
            if (data.mode === 'popup') {
                openPopupApp(data);
            } else {
                document.getElementById('app-title').innerText = data.title;
                const iframe = document.getElementById('app-iframe');
                iframe.src = data.url;
                iframe.onload = () => {
                    try {
                        iframe.contentWindow.focus();
                    } catch (e) {
                        console.warn("Could not focus iframe:", e);
                    }
                };
                document.getElementById('home-view').style.display = 'none';
                document.getElementById('app-fullscreen-view').style.display = 'flex';
                resetInactivityTimer(); // タイマー始動
            }
        });
    }
}

// アプリを閉じてホーム画面に戻る
function closeApp() {
    clearTimeout(inactivityTimeout); // タイマー停止
    animateTransition(() => {
        document.getElementById('app-iframe').src = "";
        document.getElementById('home-view').style.display = 'flex';
        document.getElementById('app-fullscreen-view').style.display = 'none';

        // ホームに戻った際に、メインパネルを現在の最適なファイルに更新する
        lastScheduledFile = ""; // リセットして次のチェックで再評価させる
        lastTriggeredSeconds = -1; // カウントダウンチェックも再評価させる

        // ★さらに強化：DOMの更新後、確実にフォーカスを戻す
        setTimeout(() => {
            window.focus();
            if (document.activeElement) document.activeElement.blur();
            document.body.focus();
        }, 50);
    });
}

function animateTransition(callback) {
    // 演出を廃止し、即座に実行する
    callback();
}

function openPopupApp(data) {
    document.getElementById('popup-title').innerText = data.title;
    document.getElementById('popup-iframe').src = data.url;
    document.getElementById('popup-window').style.display = 'flex';
    resetInactivityTimer(); // タイマー始動
}

function closePopupApp() {
    clearTimeout(inactivityTimeout); // タイマー停止
    document.getElementById('popup-iframe').src = "";
    document.getElementById('popup-window').style.display = 'none';

    // ★さらに強化：ポップアップを閉じた時も確実にフォーカスを戻す
    setTimeout(() => {
        window.focus();
        if (document.activeElement) document.activeElement.blur();
        document.body.focus();
    }, 50);
}


// ==========================================
// ⌨️ キーボード操作 ＆ 管理者モード
// ==========================================


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

// --- 警告パネル設定の保存と反映 ---
function applyAlertConfig() {
    const enabledEl = document.getElementById('alert-enabled-toggle');
    const minutesEl = document.getElementById('alert-minutes-input');
    if (!enabledEl || !minutesEl) return;
    alertEnabled = enabledEl.checked;
    const val = parseInt(minutesEl.value);
    alertMinutes = (isNaN(val) || val < 1) ? 1 : val;
    minutesEl.value = alertMinutes;
    saveAlertConfig();
    updateCountdown();
    showAdminToast('⏰ 警告パネルの設定を保存しました');
}

// --- ロックスクリーン設定の保存と反映 ---
function applyLockConfig() {
    const enabledEl = document.getElementById('lock-enabled-toggle');
    const minutesEl = document.getElementById('lock-minutes-input');
    if (!enabledEl || !minutesEl) return;
    lockEnabled = enabledEl.checked;
    const val = parseInt(minutesEl.value);
    lockMinutes = (isNaN(val) || val < 1) ? 1 : val;
    minutesEl.value = lockMinutes;
    saveLockConfig();
    updateCountdown();
    showAdminToast('🔒 ロックスクリーンの設定を保存しました');
}

// --- 保存完了のトースト通知 ---
function showAdminToast(msg) {
    let toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// 起動時：管理者設定UIの状態を反映
function initLockModeUI() {
    // 警告パネル
    const alertToggle = document.getElementById('alert-enabled-toggle');
    const alertInput = document.getElementById('alert-minutes-input');
    if (alertToggle) alertToggle.checked = alertEnabled;
    if (alertInput) alertInput.value = alertMinutes;
    // ロックスクリーン
    const lockToggle = document.getElementById('lock-enabled-toggle');
    const lockInput = document.getElementById('lock-minutes-input');
    if (lockToggle) lockToggle.checked = lockEnabled;
    if (lockInput) lockInput.value = lockMinutes;
}

// 特別期間の設定保存
function saveSpecialPeriod() {
    const start = document.getElementById('special-start-date').value;
    const end = document.getElementById('special-end-date').value;
    const fileMWF = document.getElementById('special-json-mwf').value.trim();
    const fileTTh = document.getElementById('special-json-tth').value.trim();

    if (!start || !end || (!fileMWF && !fileTTh)) {
        alert('開始日、終了日、および少なくとも1つの曜日用ファイル名を入力してください。');
        return;
    }

    localStorage.setItem('naviSpecialStart', start);
    localStorage.setItem('naviSpecialEnd', end);
    localStorage.setItem('naviSpecialFileMWF', fileMWF);
    localStorage.setItem('naviSpecialFileTTh', fileTTh);

    // 日付キャッシュをクリアして、同日中でも即時に特別期間ファイルを再読み込みさせる
    localStorage.removeItem('naviChimesDate');

    showAdminToast('📅 特別期間の設定を保存しました。すぐに適用されます。');
    loadChimes(); // 強制再判定
}

function clearSpecialPeriod() {
    if (confirm('特別期間の設定をクリアしますか？')) {
        localStorage.removeItem('naviSpecialStart');
        localStorage.removeItem('naviSpecialEnd');
        localStorage.removeItem('naviSpecialFileMWF');
        localStorage.removeItem('naviSpecialFileTTh');

        // 日付キャッシュもクリアして通常スケジュールに即時戻す
        localStorage.removeItem('naviChimesDate');
        
        document.getElementById('special-start-date').value = '';
        document.getElementById('special-end-date').value = '';
        document.getElementById('special-json-mwf').value = '';
        document.getElementById('special-json-tth').value = '';
        
        showAdminToast('🧹 特別期間の設定をクリアしました。通常スケジュールに戻します。');
        loadChimes(); // 強制再判定
    }
}

function initSpecialPeriodUI() {
    // 一日限定設定のUI復元
    const odDate = localStorage.getItem('naviOneDayDate');
    const odFile = localStorage.getItem('naviOneDayFile');
    if (document.getElementById('oneday-date')) document.getElementById('oneday-date').value = odDate || '';
    if (document.getElementById('oneday-json')) document.getElementById('oneday-json').value = odFile || '';

    // 一日限定設定のアクティブバッジ
    const badge = document.getElementById('oneday-active-badge');
    if (badge) {
        if (odDate && odFile) {
            const today = new Date().toDateString();
            const target = new Date(odDate).toDateString();
            if (target === today) {
                badge.textContent = `✅ 本日適用中: ${odFile}`;
            } else {
                badge.textContent = `⏰ 予定設定済み: ${odDate} に ${odFile} を適用`;
            }
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    // 特別期間設定のUI復元
    const start = localStorage.getItem('naviSpecialStart');
    const end = localStorage.getItem('naviSpecialEnd');
    const fileMWF = localStorage.getItem('naviSpecialFileMWF');
    const fileTTh = localStorage.getItem('naviSpecialFileTTh');

    if (start && document.getElementById('special-start-date')) document.getElementById('special-start-date').value = start;
    if (end && document.getElementById('special-end-date')) document.getElementById('special-end-date').value = end;
    if (fileMWF && document.getElementById('special-json-mwf')) document.getElementById('special-json-mwf').value = fileMWF;
    if (fileTTh && document.getElementById('special-json-tth')) document.getElementById('special-json-tth').value = fileTTh;
}

// 一日限定設定の保存
function saveOneDaySetting() {
    const date = document.getElementById('oneday-date').value;
    const file = document.getElementById('oneday-json').value.trim();

    if (!date || !file) {
        alert('対象日とJSONファイル名を入力してください。');
        return;
    }

    localStorage.setItem('naviOneDayDate', date);
    localStorage.setItem('naviOneDayFile', file);

    // 日付キャッシュをクリアして同日設定でも即時適用
    localStorage.removeItem('naviChimesDate');

    // バッジを更新
    initSpecialPeriodUI();

    showAdminToast(`📌 一日限定設定を保存しました。${date} に適用されます。`);
    loadChimes(); // 強制再判定
}

// 一日限定設定のクリア
function clearOneDaySetting() {
    if (!confirm('一日限定設定をクリアしますか？')) return;

    localStorage.removeItem('naviOneDayDate');
    localStorage.removeItem('naviOneDayFile');
    localStorage.removeItem('naviChimesDate');

    if (document.getElementById('oneday-date')) document.getElementById('oneday-date').value = '';
    if (document.getElementById('oneday-json')) document.getElementById('oneday-json').value = '';

    const badge = document.getElementById('oneday-active-badge');
    if (badge) badge.style.display = 'none';

    showAdminToast('🧹 一日限定設定をクリアしました。通常スケジュールに戻します。');
    loadChimes();
}

// 起動時はスケジュールチェックを開始
window.onload = function () {
    initLockModeUI();
    initSpecialPeriodUI();
    initDelayDisplay();

    // 放置タイマーの初期化とiframe監視の開始
    resetGlobalIdleTimer();
};

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
// ==========================================
// 🕒 旧グローバル無操作タイマー（互換性維持のため、新規タイマーシステムにルーティング）
// ==========================================
let globalIdleTimer = null;
function resetGlobalIdleTimer() {
    if (typeof resetInactivityTimer === 'function') {
        resetInactivityTimer();
    }
}
function setupIframeActivityMonitoring(iframe) {
    if (typeof setupIframeInactivitySync === 'function') {
        setupIframeInactivitySync(iframe);
    }
}

// ==========================================
// 🛡️ フォーカスガード：右側パネルにフォーカスを奪われないようにする
// ==========================================
// ホーム画面表示中、フォーカスがiframeに移ったら即座にメインウィンドウに戻す
setInterval(() => {
    const homeView = document.getElementById('home-view');
    const adminModal = document.getElementById('admin-modal');
    
    // ホーム画面が表示されており、かつ管理画面が開いていない場合のみ実行
    if (homeView && homeView.style.display === 'flex' && adminModal && adminModal.style.display === 'none') {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
            // iframeにフォーカスがある場合、解除してウィンドウ本体にフォーカスを戻す
            document.activeElement.blur();
            window.focus();
            document.body.focus();
        }
    }
}, 500); // 0.5秒ごとにチェック

// ==========================================
// 🆚 究極の2択：統合ロジック
// ==========================================
const CHOICE_API_URL = "https://script.google.com/macros/s/AKfycbwcCfHQKkHEtZrR93L86R-ctesAzL61_YmrsTx6gxlg6_yj3ZjJUXzYgqNFPL4IKdlN/exec";
const CHOICE_START_DATE = new Date(2025, 10, 27); // 11/27
const CHOICE_Q_LIST = [
    { q: "一生住むなら？", a: "灼熱の砂漠", b: "極寒の雪国" }, { q: "特殊能力を得るなら？", a: "空を飛ぶ", b: "透明人間" },
    { q: "一生これしか食べられない", a: "カレーライス", b: "ラーメン" }, { q: "行けるなら？", a: "100年前", b: "100年後" },
    { q: "知りたい真実は？", a: "宇宙人の正体", b: "幽霊の正体" }, { q: "どっちの人生？", a: "友達0の大富豪", b: "親友多数の貧乏" },
    { q: "生まれ変わるなら？", a: "絶世の美形", b: "IQ200の天才" }, { q: "一生我慢するなら？", a: "スマホ", b: "お風呂" },
    { q: "ペットにするなら？", a: "話す犬", b: "飛ぶ猫" }, { q: "住むなら？", a: "魔法の世界", b: "SF未来の世界" },
    { q: "朝食は？", a: "パン派", b: "ごはん派" }, { q: "犬と猫、飼うなら？", a: "犬", b: "猫" },
    { q: "夏と冬、好きなのは？", a: "夏", b: "冬" }, { q: "タイムマシン、使うなら？", a: "過去に戻る", b: "未来を見る" },
    { q: "一生やめるなら？", a: "お酒", b: "お菓子" }, { q: "映画を見るなら？", a: "字幕", b: "吹き替え" },
    { q: "休日の過ごし方は？", a: "アウトドア", b: "インドア" }, { q: "生まれ変わるなら？", a: "男", b: "女" },
    { q: "大切なのは？", a: "愛", b: "お金" }, { q: "無人島に持っていくなら？", a: "ナイフ", b: "マッチ" },
    { q: "住むなら？", a: "都会のタワマン", b: "田舎の古民家" }, { q: "超能力、欲しいのは？", a: "心を読む", b: "予知能力" },
    { q: "最後の晩餐は？", a: "焼肉", b: "寿司" }, { q: "幽霊は？", a: "いると思う", b: "いないと思う" },
    { q: "自分は？", a: "Sだと思う", b: "Mだと思う" }, { q: "デートに行くなら？", a: "遊園地", b: "映画館" },
    { q: "寝るときは？", a: "真っ明るい", b: "豆電球つける" }, { q: "欲しいのは？", a: "時間", b: "お金" },
    { q: "どっちになりたい？", a: "有名人", b: "大富豪" }, { q: "性格は？", a: "楽観的", b: "悲観的" },
    { q: "食事は？", a: "量より質", b: "質より量" }, { q: "旅行に行くなら？", a: "国内温泉", b: "海外リゾート" },
    { q: "スマホの充電は？", a: "100%まで待つ", b: "80%で抜く" }, { q: "目玉焼きには？", a: "醤油", b: "ソース" },
    { q: "おにぎりの具は？", a: "鮭", b: "ツナマヨ" }, { q: "コーラかサイダーか？", a: "コーラ", b: "サイダー" },
    { q: "好きな季節は？", a: "春", b: "秋" }, { q: "一生遊んで暮らせるなら？", a: "働く", b: "働かない" },
    { q: "宝くじが当たったら？", a: "貯金する", b: "使い切る" }, { q: "ゾンビが出たら？", a: "戦う", b: "逃げる" },
    { q: "宇宙旅行に？", a: "行きたい", b: "行きたくない" }, { q: "1日だけなれるなら？", a: "総理大臣", b: "アイドル" },
    { q: "喧嘩したら？", a: "自分から謝る", b: "謝らない" }, { q: "サプライズは？", a: "好き", b: "嫌い" },
    { q: "遊園地の絶叫系は？", a: "大好き", b: "無理" }, { q: "お風呂は？", a: "熱め", b: "ぬるめ" },
    { q: "睡眠時間は？", a: "ショート", b: "ロング" }, { q: "作業中は？", a: "音楽あり", b: "無音" },
    { q: "本を読むなら？", a: "紙の本", b: "電子書籍" }, { q: "支払いは？", a: "現金", b: "キャッシュレス" },
    { q: "連絡手段は？", a: "電話", b: "LINE/メール" }, { q: "告白は？", a: "自分から", b: "待ち" },
    { q: "失恋したら？", a: "すぐ忘れる", b: "引きずる" }, { q: "男女の友情は？", a: "成立する", b: "しない" },
    { q: "結婚式は？", a: "挙げたい", b: "ナシでいい" }, { q: "子供の頃に戻れるなら？", a: "戻りたい", b: "戻りたくない" },
    { q: "明日地球が滅亡するなら？", a: "好きな物を食べる", b: "家族と過ごす" }, { q: "名前を変えるなら？", a: "キラキラネーム", b: "古風な名前" },
    { q: "行列のできる店、並ぶ？", a: "並ぶ", b: "並ばない" }, { q: "美容室での会話は？", a: "話したい", b: "静かにしたい" },
    { q: "虫は？", a: "平気", b: "無理" }, { q: "高いところは？", a: "平気", b: "怖い" },
    { q: "お化け屋敷は？", a: "入りたい", b: "入りたくない" }, { q: "占いは？", a: "信じる", b: "信じない" },
    { q: "ジンクスは？", a: "気にする", b: "気にしない" }, { q: "勝負下着は？", a: "持っている", b: "持っていない" },
    { q: "嘘をつくのは？", a: "得意", b: "苦手" }, { q: "人の顔色は？", a: "伺う", b: "気にしない" },
    { q: "悩みは？", a: "相談する", b: "自己解決" }, { q: "泣くときは？", a: "人前でも泣く", b: "隠れて泣く" },
    { q: "怒ると？", a: "黙る", b: "言い返す" }, { q: "ストレス発散は？", a: "食べる", b: "寝る" },
    { q: "休日は？", a: "一人でいたい", b: "誰かといたい" }, { q: "友達は？", a: "狭く深く", b: "広く浅く" },
    { q: "SNSは？", a: "見る専", b: "投稿する" }, { q: "写真は？", a: "撮る派", b: "撮られる派" },
    { q: "料理は？", a: "得意", b: "苦手" }, { q: "部屋は？", a: "綺麗", b: "汚い" },
    { q: "遅刻は？", a: "よくする", b: "絶対しない" }, { q: "約束は？", a: "守る", b: "たまに破る" },
    { q: "秘密は？", a: "守れる", b: "言っちゃう" }, { q: "運は？", a: "良いほう", b: "悪いほう" },
    { q: "直感は？", a: "当たる", b: "当たらない" }, { q: "勉強は？", a: "好きだった", b: "嫌いだった" },
    { q: "運動は？", a: "得意", b: "苦手" }, { q: "歌は？", a: "得意", b: "苦手" },
    { q: "絵は？", a: "得意", b: "苦手" }, { q: "字は？", a: "綺麗", b: "汚い" },
    { q: "PC派？スマホ派？", a: "PC", b: "スマホ" }, { q: "iPhone？Android？", a: "iPhone", b: "Android" },
    { q: "きのこ？たけのこ？", a: "きのこ", b: "たけのこ" }, { q: "うどん？そば？", a: "うどん", b: "そば" },
    { q: "コーヒー？紅茶？", a: "コーヒー", b: "紅茶" }, { q: "こしあん？つぶあん？", a: "こしあん", b: "つぶあん" },
    { q: "唐揚げにレモン？", a: "かける", b: "かけない" }, { q: "マック？モス？", a: "マック", b: "モス" },
    { q: "ディズニー？USJ？", a: "ディズニー", b: "USJ" }, { q: "ドラクエ？FF？", a: "ドラクエ", b: "FF" },
    { q: "任天堂？ソニー？", a: "任天堂", b: "ソニー" },
    { q: "ピザの生地は？", a: "薄いクリスピー", b: "厚いふっくら" }, { q: "お好み焼きでのご飯は？", a: "あり", b: "なし" },
    { q: "たい焼きはどこから？", a: "頭から", b: "尻尾から" }, { q: "ショートケーキの苺は？", a: "最初に食べる", b: "最後に食べる" },
    { q: "焼肉のタレは？", a: "甘口", b: "辛口" }, { q: "好きな飲み物は？", a: "炭酸水", b: "お茶・水" },
    { q: "お酒を飲むなら？", a: "ビール", b: "ハイボール" }, { q: "好きな肉料理は？", a: "ステーキ", b: "ハンバーグ" },
    { q: "朝ごはんの卵は？", a: "目玉焼き", b: "スクランブル" }, { q: "好きな果物は？", a: "いちご", b: "みかん" },
    { q: "好きな野菜は？", a: "トマト", b: "きゅうり" }, { q: "アイスクリームは？", a: "バニラ", b: "チョコ" },
    { q: "ポテチの味は？", a: "うすしお", b: "コンソメ" }, { q: "好きな中華は？", a: "餃子", b: "チャーハン" },
    { q: "パスタは？", a: "トマト系", b: "クリーム系" }, { q: "好きな魚は？", a: "マグロ", b: "サーモン" },
    { q: "納豆に卵は？", a: "入れる", b: "入れない" }, { q: "味噌汁の具は？", a: "豆腐", b: "わかめ" },
    { q: "好きな寿司ネタは？", a: "赤身", b: "白身" }, { q: "鍋の〆は？", a: "雑炊", b: "うどん" },
    { q: "住むなら？", a: "持ち家", b: "賃貸" }, { q: "部屋の明かりは？", a: "白っぽい", b: "オレンジっぽい" },
    { q: "洗濯物は？", a: "外干し", b: "部屋干し・乾燥機" }, { q: "トイレの蓋は？", a: "閉める", b: "開けっ放し" },
    { q: "寝具は？", a: "ベッド", b: "布団" }, { q: "掃除は？", a: "毎日コツコツ", b: "まとめて一気" },
    { q: "買い物は？", a: "ネット通販", b: "実店舗" }, { q: "服を買うなら？", a: "新品", b: "古着" },
    { q: "靴は？", a: "スニーカー", b: "革靴・ブーツ" }, { q: "カバンは？", a: "リュック", b: "トート" },
    { q: "財布は？", a: "長財布", b: "二つ折り" }, { q: "時計は？", a: "アナログ", b: "デジタル" },
    { q: "傘は？", a: "ビニール傘", b: "折りたたみ" }, { q: "移動は？", a: "電車・バス", b: "車・バイク" },
    { q: "席を選ぶなら？", a: "窓側", b: "通路側" }, { q: "旅行の計画は？", a: "綿密に", b: "行き当たりばったり" },
    { q: "荷物は？", a: "多い", b: "少ない" }, { q: "お土産は？", a: "買う", b: "買わない" },
    { q: "写真は？", a: "風景", b: "人物" }, { q: "動画は？", a: "倍速で見る", b: "等倍で見る" },
    { q: "ニュースは？", a: "テレビ", b: "ネット" }, { q: "ドラマは？", a: "リアルタイム", b: "録画・配信" },
    { q: "音楽は？", a: "邦楽", b: "洋楽" }, { q: "カラオケは？", a: "好き", b: "嫌い" },
    { q: "ライブは？", a: "アリーナ席", b: "スタンド席" }, { q: "スポーツは？", a: "する派", b: "見る派" },
    { q: "野球派？サッカー派？", a: "野球", b: "サッカー" }, { q: "オリンピックは？", a: "夏", b: "冬" },
    { q: "ゲームは？", a: "RPG", b: "アクション" }, { q: "漫画は？", a: "週刊誌", b: "単行本" },
    { q: "アニメは？", a: "好き", b: "見ない" }, { q: "YouTubeは？", a: "よく見る", b: "あまり見ない" },
    { q: "SNSのアイコンは？", a: "自分", b: "それ以外" }, { q: "LINEの返信は？", a: "早い", b: "遅い" },
    { q: "既読スルーは？", a: "気になる", b: "気にならない" }, { q: "電話は？", a: "出る", b: "居留守" },
    { q: "友達との予定は？", a: "自分から誘う", b: "誘われるの待つ" }, { q: "大勢の飲み会は？", a: "好き", b: "苦手" },
    { q: "初対面の人とは？", a: "すぐ話せる", b: "人見知り" }, { q: "好きなタイプは？", a: "年上", b: "年下" },
    { q: "恋人とは？", a: "毎日連絡したい", b: "用事だけでいい" }, { q: "デート代は？", a: "割り勘", b: "奢り・奢られ" },
    { q: "浮気は？", a: "絶対許さない", b: "一度なら許す" }, { q: "復縁は？", a: "あり", b: "なし" },
    { q: "結婚相手に求めるのは？", a: "性格", b: "経済力" }, { q: "子供は？", a: "欲しい", b: "欲しくない" },
    { q: "老後は？", a: "日本", b: "海外" }, { q: "生まれ変わるなら？", a: "人間", b: "動物" },
    { q: "幽霊が見えたら？", a: "話しかける", b: "無視する" }, { q: "宇宙人は？", a: "友好的", b: "侵略的" },
    { q: "タイムトラベルは？", a: "過去", b: "未来" }, { q: "もし1億円当たったら？", a: "誰かに言う", b: "秘密にする" },
    { q: "無人島に一つだけ？", a: "スマホ", b: "ナイフ" }, { q: "魔法が使えるなら？", a: "空を飛ぶ", b: "透明になる" },
    { q: "ドラえもんの道具？", a: "どこでもドア", b: "タケコプター" }, { q: "ヒーローになるなら？", a: "パワー系", b: "頭脳系" },
    { q: "悪役になるなら？", a: "カリスマ系", b: "狂気系" }, { q: "映画の世界なら？", a: "ハリーポッター", b: "スターウォーズ" },
    { q: "ジブリなら？", a: "トトロ", b: "千と千尋" }, { q: "ポケモンなら？", a: "ピカチュウ", b: "イーブイ" },
    { q: "飼うなら？", a: "ドラゴン", b: "ユニコーン" }, { q: "ゾンビ世界で武器は？", a: "銃", b: "刀" },
    { q: "デスゲームに参加？", a: "する", b: "しない" }, { q: "人生は？", a: "長い", b: "短い" },
    { q: "自分は？", a: "運がいい", b: "運が悪い" }, { q: "努力は？", a: "報われる", b: "報われない" },
    { q: "お金で幸せは？", a: "買える", b: "買えない" }, { q: "愛と平和、大事なのは？", a: "愛", b: "平和" },
    { q: "正義と悪、魅力的なのは？", a: "正義", b: "悪" }, { q: "過去と未来、大事なのは？", a: "過去", b: "未来" },
    { q: "直感と論理、信じるのは？", a: "直感", b: "論理" }, { q: "プロセスと結果、大事なのは？", a: "プロセス", b: "結果" },
    { q: "質と量、大事なのは？", a: "質", b: "量" }, { q: "シンプルと複雑、好きなのは？", a: "シンプル", b: "複雑" },
    { q: "都会と田舎、住むなら？", a: "都会", b: "田舎" }, { q: "暑いと寒い、マシなのは？", a: "暑い", b: "寒い" },
    { q: "朝と夜、得意なのは？", a: "朝", b: "夜" }, { q: "海と山、行くなら？", a: "海", b: "山" },
    { q: "犬と猫、どっち？", a: "犬", b: "猫" },
];

let choice_localData = { c1: 0, c2: 0 };
let choice_working = false;
let choice_allHistoryData = null;
let choice_lastUpdateDate = "";

function choice_formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

function choice_getQ(dateObj) {
    const t = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const s = new Date(CHOICE_START_DATE.getFullYear(), CHOICE_START_DATE.getMonth(), CHOICE_START_DATE.getDate());
    const diffDays = Math.floor((t - s) / (1000 * 60 * 60 * 24));
    let index = diffDays % CHOICE_Q_LIST.length;
    if (index < 0) index = 0;
    return { ...CHOICE_Q_LIST[index], id: index + 1 };
}

async function initChoiceApp() {
    const d = new Date(Date.now() + (window._debugTimeOffset || 0));
    const dStr = choice_formatDate(d);
    
    // 日付が変わった時だけ初期化
    if (choice_lastUpdateDate === dStr) return;
    choice_lastUpdateDate = dStr;

    const y = new Date(d); y.setDate(y.getDate() - 1);
    const yStr = choice_formatDate(y);

    const todayQ = choice_getQ(d);
    const yesterdayQ = choice_getQ(y);

    const dNumEl = document.getElementById('choice-q-num');
    const dDateEl = document.getElementById('choice-date');
    const yDateEl = document.getElementById('choice-y-date');
    const qEl = document.getElementById('choice-q');
    const t1El = document.getElementById('choice-t1');
    const t2El = document.getElementById('choice-t2');
    const yqEl = document.getElementById('choice-y-q-text');
    const yo1El = document.getElementById('choice-y-opt1');
    const yo2El = document.getElementById('choice-y-opt2');

    if (dNumEl) dNumEl.textContent = todayQ.id;
    if (dDateEl) dDateEl.textContent = d.toLocaleDateString('ja-JP');
    if (yDateEl) yDateEl.textContent = y.toLocaleDateString('ja-JP');
    if (qEl) qEl.textContent = todayQ.q;
    if (t1El) t1El.textContent = todayQ.a;
    if (t2El) t2El.textContent = todayQ.b;
    if (yqEl) yqEl.textContent = yesterdayQ.q;
    if (yo1El) yo1El.textContent = yesterdayQ.a;
    if (yo2El) yo2El.textContent = yesterdayQ.b;

    choice_setMsg("データ同期中...");
    await Promise.all([choice_fetchData(dStr, false), choice_fetchData(yStr, true)]);
    choice_setMsg("");
}

async function choice_vote(c) {
    if (choice_working) return;
    choice_working = true;
    const btn = document.getElementById(c === 1 ? 'choice-b1' : 'choice-b2');
    if (btn) btn.style.transform = "translateY(6px)";
    choice_setMsg("送信中...");
    
    if (c === 1) choice_localData.c1++; else choice_localData.c2++;
    choice_draw(choice_localData, false);

    const d = new Date(Date.now() + (window._debugTimeOffset || 0));
    const dStr = choice_formatDate(d);

    try {
        const ts = new Date().getTime();
        const res = await fetch(`${CHOICE_API_URL}?action=vote&date=${dStr}&choice=${c}&t=${ts}`, { redirect: "follow" });
        const json = await res.json();
        if (typeof json.c1 === 'number') { choice_localData = json; choice_draw(json, false); }
    } catch (e) { console.error("Vote failed", e); }

    choice_setMsg("投票しました！");
    setTimeout(() => { 
        if (btn) btn.style.transform = "translateY(0)"; 
        choice_working = false; 
        if (typeof resetGlobalIdleTimer === 'function') resetGlobalIdleTimer();
    }, 150);
}

async function choice_fetchData(dateKey, isYesterday) {
    try {
        const ts = new Date().getTime();
        const res = await fetch(`${CHOICE_API_URL}?action=get&date=${dateKey}&t=${ts}`, { redirect: "follow" });
        const json = await res.json();
        if (typeof json.c1 === 'number') {
            if (!isYesterday) { choice_localData = json; choice_draw(json, false); }
            else { choice_draw(json, true); }
        }
    } catch (e) { console.error("Fetch failed", e); }
}

function choice_draw(d, isYesterday) {
    const c1 = Number(d.c1) || 0; const c2 = Number(d.c2) || 0; const total = c1 + c2;
    const p = isYesterday ? "choice-y-" : "choice-";
    const b1 = document.getElementById(p + 'bar1') || document.getElementById('choice-br1');
    const b2 = document.getElementById(p + 'bar2') || document.getElementById('choice-br2');
    if (!isYesterday) {
        const totalEl = document.getElementById('choice-total');
        if (totalEl) totalEl.textContent = `計 ${total} 票`;
    }

    let pct1 = 0, pct2 = 0;
    if (total > 0) { pct1 = Math.round((c1 / total) * 100); pct2 = 100 - pct1; }
    else { pct1 = 50; pct2 = 50; if (b1) b1.textContent = isYesterday ? "--%" : "0%"; if (b2) b2.textContent = isYesterday ? "--%" : "0%"; }

    if (b1) {
        b1.style.width = (total === 0 && !isYesterday) ? "50%" : pct1 + "%";
        if (total > 0) b1.textContent = pct1 + "%";
    }
    if (b2) {
        b2.style.width = (total === 0 && !isYesterday) ? "50%" : pct2 + "%";
        if (total > 0) b2.textContent = pct2 + "%";
    }
}

function choice_setMsg(m) { 
    const msgEl = document.getElementById('choice-msg');
    if (msgEl) msgEl.textContent = m; 
}

// iframeからのメッセージ（CORS回避用のホーム遷移や遅延情報の同期など）を受け取る
window.addEventListener('message', function(event) {
    if (!event.data) return;
    
    if (event.data === 'closeApp') {
        const popupView = document.getElementById('popup-window');
        const isPopupOpen = popupView && popupView.style.display === 'flex';
        if (isPopupOpen) {
            closePopupApp();
        } else {
            closeApp();
        }
        
        // 右パネルがデフォルトでない場合は戻す
        const inputElement = document.getElementById('admin-main-panel-input');
        const defaultFile = (inputElement && inputElement.value) ? inputElement.value.trim() : "wait-time-right.html";
        if (lastScheduledFile !== defaultFile && typeof changeMainPanel === 'function') {
            changeMainPanel(defaultFile);
        }
    }
    
    // 遠隔遅延情報の同期メッセージ
    if (event.data.type === 'updateDelay') {
        updateDelayState(event.data.enabled, event.data.text);
    }

    // 非アクティブタイマーのリセットおよび一時停止制御
    if (event.data === 'resetInactivity') {
        resetInactivityTimer();
    }
    if (event.data === 'adminOpen') {
        console.log("[Inactivity Message] Admin mode opened. Pausing timer.");
        isAdminOpen = true;
        clearTimeout(inactivityTimeout);
    }
    if (event.data === 'adminClose') {
        console.log("[Inactivity Message] Admin mode closed. Resuming timer.");
        isAdminOpen = false;
        resetInactivityTimer();
    }
    if (event.data === 'inputFocus') {
        console.log("[Inactivity Message] Input focused. Pausing timer.");
        isInputFocused = true;
        clearTimeout(inactivityTimeout);
    }
    if (event.data === 'inputBlur') {
        console.log("[Inactivity Message] Input blurred. Resuming timer.");
        isInputFocused = false;
        resetInactivityTimer();
    }
});

// ==========================================
// ⚠️ スケジュール遅延情報ウィジェットの制御機能
// ==========================================
const WAIT_TIME_API_URL = 'https://script.google.com/macros/s/AKfycbzgrgP84UFyJoEiBBzskZxBOV6BJQz0TbT-lEyntc_w-OpwjyEbe07sd_iP59OeUimWJQ/exec';

function initDelayDisplay() {
    const delayEnabled = localStorage.getItem('naviDelayEnabled') === 'true';
    const delayText = localStorage.getItem('naviDelayText') || '現在、一部の予定が 遅れて 進行しています。';
    const delayApiUrl = localStorage.getItem('naviDelayApiUrl') || '';

    const apiInput = document.getElementById('admin-delay-api-input');
    if (apiInput) apiInput.value = delayApiUrl;

    updateDelayState(delayEnabled, delayText);
}

function updateDelayState(enabled, text) {
    localStorage.setItem('naviDelayEnabled', enabled ? 'true' : 'false');
    if (text) {
        localStorage.setItem('naviDelayText', text);
    }
    
    const toggle = document.getElementById('admin-delay-toggle');
    const textInput = document.getElementById('admin-delay-text-input');
    const inputContainer = document.getElementById('admin-delay-input-container');
    const delayWidget = document.getElementById('delay-widget');
    const delayTextDisplay = document.getElementById('delay-text-display');

    if (toggle) toggle.checked = enabled;
    if (textInput && text) textInput.value = text;
    if (inputContainer) inputContainer.style.display = enabled ? 'block' : 'none';
    
    if (delayWidget) {
        delayWidget.style.display = enabled ? 'block' : 'none';
    }
    if (delayTextDisplay && text) {
        delayTextDisplay.innerText = text;
    }
}

function toggleDelayDisplay() {
    const toggle = document.getElementById('admin-delay-toggle');
    const textInput = document.getElementById('admin-delay-text-input');
    if (!toggle) return;
    const enabled = toggle.checked;
    const text = textInput ? textInput.value.trim() : '現在、一部の予定が 遅れて 進行しています。';
    
    updateDelayState(enabled, text);
    showAdminToast(enabled ? '⚠️ 遅延情報の表示を有効にしました。' : '🧹 遅延情報の表示を無効にしました。');
}

function updateDelayTextFromAdmin() {
    const toggle = document.getElementById('admin-delay-toggle');
    const textInput = document.getElementById('admin-delay-text-input');
    if (!textInput) return;
    const enabled = toggle ? toggle.checked : true;
    const text = textInput.value.trim();
    
    updateDelayState(enabled, text);
}

function saveDelayApiUrl() {
    const apiInput = document.getElementById('admin-delay-api-input');
    if (!apiInput) return;
    const url = apiInput.value.trim();
    localStorage.setItem('naviDelayApiUrl', url);
    showAdminToast('💾 遠隔同期API URLを保存しました。');
    fetchRemoteDelaySettings();
}

// 異なるウィンドウ/タブ間でのlocalStorage変更の即時リアルタイム検知と同期 (別Webアプリ間連携)
window.addEventListener('storage', function(event) {
    if (event.key === 'naviDelayEnabled' || event.key === 'naviDelayText' || event.key === 'naviDelayApiUrl') {
        initDelayDisplay();
    }
    if (event.key === 'naviApps') {
        loadApps();
    }
});

// スプレッドシートまたはカスタムWebアプリ外部APIからの遠隔遅延情報の同期取得
async function fetchRemoteDelaySettings() {
    // 遠隔同期URLが登録されている場合はそちらを優先、なければ標準GAS URLを使用
    const customApiUrl = localStorage.getItem('naviDelayApiUrl');
    const targetApiUrl = (customApiUrl && customApiUrl.trim() !== "") ? customApiUrl.trim() : WAIT_TIME_API_URL;

    try {
        const response = await fetch(targetApiUrl);
        if (!response.ok) return;
        const data = await response.json();
        
        // 1. スプレッドシート風（配列）フォーマットの解析
        if (Array.isArray(data)) {
            const delayItem = data.find(item => {
                if (!item) return false;
                const title = String(item.title || "").trim();
                const className = String(item.className || "").trim();
                return title.includes("遅延情報") || className.includes("遅延情報") || title === "遅延" || className === "遅延";
            });

            if (delayItem) {
                const waitTime = String(delayItem.waitTime || "").trim().toUpperCase();
                const enabled = waitTime !== "" && waitTime !== "OFF" && waitTime !== "0" && waitTime !== "非表示" && waitTime !== "準備中";
                const text = String(delayItem.callNumber || "").trim() || String(delayItem.title || "").trim();
                
                updateDelayState(enabled, text);
                console.log(`[RemoteDelay] Array format sync. Enabled: ${enabled}, Text: ${text}`);
            }
        } 
        // 2. 他のカスタムWebアプリ（単一オブジェクト）フォーマットの解析
        else if (data && typeof data === 'object') {
            // 様々なJSONプロパティの命名規則に対応（拡張対応）
            const enabled = (data.enabled === true || data.enabled === 'true' || 
                             data.delayEnabled === true || data.delayEnabled === 'true' ||
                             data.status === 'ON' || data.status === 'active' ||
                             data.visible === true);
            const text = String(data.text || data.delayText || data.message || data.announcement || "").trim();
            
            updateDelayState(enabled, text || undefined);
            console.log(`[RemoteDelay] Object format sync. Enabled: ${enabled}, Text: ${text}`);
        }
    } catch (e) {
        console.warn("Failed to fetch remote delay settings:", e);
    }
}

// 遠隔遅延情報の自動取得タイマー登録 (30秒おきに外部APIと自動同期)
setInterval(fetchRemoteDelaySettings, 30000);
setTimeout(fetchRemoteDelaySettings, 5000);

// ==========================================
// ⏳ デジタルサイネージ用 自動ホーム戻りタイマー (最終操作から1分後)
// ==========================================
let inactivityTimeout;
let isAdminOpen = false;
let isInputFocused = false;

function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    
    // 管理者モードまたは入力フォーカス中は非アクティブタイマーを作動させない（人による操作途中での意図しない画面戻りを100%防ぐ）
    if (isAdminOpen || isInputFocused) {
        console.log("[Inactivity] Timer paused because admin mode is open or input is focused.");
        return;
    }

    // アプリ（全画面 または ポップアップ）が開いているときのみ、1分間（60000ms）の非アクティブ監視を行う
    const appView = document.getElementById('app-fullscreen-view');
    const popupView = document.getElementById('popup-window');
    const isAppOpen = appView && appView.style.display === 'flex';
    const isPopupOpen = popupView && popupView.style.display === 'flex';

    if (isAppOpen || isPopupOpen) {
        inactivityTimeout = setTimeout(returnToHome, 60000);
    }
}

function returnToHome() {
    const appView = document.getElementById('app-fullscreen-view');
    const popupView = document.getElementById('popup-window');
    const isAppOpen = appView && appView.style.display === 'flex';
    const isPopupOpen = popupView && popupView.style.display === 'flex';

    if (isAppOpen) {
        console.log("[Inactivity] 1 minute of inactivity detected. Returning to Home fullscreen app.");
        closeApp();
    }
    if (isPopupOpen) {
        console.log("[Inactivity] 1 minute of inactivity detected. Closing popup app.");
        closePopupApp();
    }
}

function initInactivityTimer() {
    // 親ウィンドウ（ポータル側）での操作検知
    // ありとあらゆる人による操作（クリック、ダブルクリック、右クリック、キー、タッチ、ポインター、スクロール、ホイール、フォーム編集、フォーカス）を検知対象とする
    const events = [
        'mousemove', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu',
        'keydown', 'keypress', 'keyup',
        'touchstart', 'touchmove', 'touchend', 'touchcancel',
        'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
        'scroll', 'wheel', 'mousewheel',
        'input', 'change', 'focus', 'blur'
    ];
    events.forEach(eventName => {
        window.addEventListener(eventName, resetInactivityTimer, { capture: true, passive: true });
        document.addEventListener(eventName, resetInactivityTimer, { capture: true, passive: true });
    });

    // 親ドメイン自身の入力フォーム監視
    document.addEventListener('focus', function(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
            console.log("[Inactivity Parent] Input focused. Pausing timer.");
            isInputFocused = true;
            clearTimeout(inactivityTimeout);
        }
    }, { capture: true, passive: true });

    document.addEventListener('blur', function(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
            console.log("[Inactivity Parent] Input blurred. Resuming timer.");
            isInputFocused = false;
            resetInactivityTimer();
        }
    }, { capture: true, passive: true });

    // iframe内のコンテンツ操作検知
    const appIframe = document.getElementById('app-iframe');
    const popupIframe = document.getElementById('popup-iframe');
    
    setupIframeInactivitySync(appIframe);
    setupIframeInactivitySync(popupIframe);
    
    resetInactivityTimer();
}

function setupIframeInactivitySync(iframe) {
    if (!iframe) return;
    iframe.addEventListener('load', () => {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (doc) {
                const events = [
                    'mousemove', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu',
                    'keydown', 'keypress', 'keyup',
                    'touchstart', 'touchmove', 'touchend', 'touchcancel',
                    'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
                    'scroll', 'wheel', 'mousewheel',
                    'input', 'change', 'focus', 'blur'
                ];
                events.forEach(eventName => {
                    doc.addEventListener(eventName, resetInactivityTimer, { capture: true, passive: true });
                });
                
                // iframe内の入力フォーム監視
                doc.addEventListener('focus', function(e) {
                    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
                        console.log("[Inactivity Iframe] Input focused. Pausing timer.");
                        isInputFocused = true;
                        clearTimeout(inactivityTimeout);
                    }
                }, { capture: true, passive: true });

                doc.addEventListener('blur', function(e) {
                    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
                        console.log("[Inactivity Iframe] Input blurred. Resuming timer.");
                        isInputFocused = false;
                        resetInactivityTimer();
                    }
                }, { capture: true, passive: true });

                console.log("[Inactivity] Successfully bound activity listeners to iframe:", iframe.id);
            }
        } catch (e) {
            // 他ドメインのアプリがロードされた場合に備えたセーフガード
            console.warn("Could not bind inactivity listeners to iframe (cross-origin limitation):", e);
        }
    });
}
