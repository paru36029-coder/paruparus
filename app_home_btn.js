(function() {
    if (document.getElementById('unified-home-btn')) return;



    function goHome() {
        try {
            if (window.parent && window.parent !== window) {
                let handled = false;
                if (typeof window.parent.closeApp === 'function') {
                    window.parent.closeApp();
                    handled = true;
                }
                if (typeof window.parent.closePopupApp === 'function') {
                    window.parent.closePopupApp();
                    handled = true;
                }
                
                // 右パネルに表示されている場合の対応
                if (typeof window.parent.changeMainPanel === 'function') {
                    const inputElement = window.parent.document.getElementById('admin-main-panel-input');
                    const defaultFile = (inputElement && inputElement.value) ? inputElement.value.trim() : "時刻表_下.html";
                    // 現在のファイルがデフォルトでない場合のみ戻す
                    const currentFile = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
                    if (decodeURIComponent(currentFile) !== defaultFile) {
                        window.parent.changeMainPanel(defaultFile);
                        handled = true;
                    }
                }

                if (!handled) {
                    window.location.href = 'index_v4.html';
                }
            } else {
                // 単独で開かれている場合は index_v4.html に遷移
                window.location.href = 'index_v4.html';
            }
        } catch (error) {
            // CORSエラー等の場合 (file:// プロトコルなど)
            if (window.parent && window.parent !== window) {
                window.parent.postMessage('closeApp', '*');
            } else {
                window.location.href = 'index_v4.html';
            }
        }
    }

    // ホームボタンの作成
    const btn = document.createElement('button');
    btn.id = 'unified-home-btn';
    btn.innerHTML = '◀ ホーム';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.left = '10px';
    btn.style.zIndex = '9999999';
    btn.style.padding = '8px 16px';
    btn.style.fontSize = '1.1rem';
    btn.style.borderRadius = '8px';
    btn.style.cursor = 'pointer';
    btn.style.background = '#ffffff';
    btn.style.border = '2px solid #16a34a';
    btn.style.fontWeight = '900';
    btn.style.color = '#16a34a';
    btn.style.boxShadow = '0 4px 10px rgba(22,163,74,0.15)';
    btn.style.transition = '0.2s';
    
    btn.onmouseover = () => {
        btn.style.background = '#f0fdf4';
        btn.style.transform = 'scale(1.02)';
    };
    btn.onmouseout = () => {
        btn.style.background = '#ffffff';
        btn.style.transform = 'scale(1)';
    };

    btn.onclick = goHome;

    function addBtn() {
        // bodyが存在すれば追加
        if (document.body) {
            document.body.appendChild(btn);
        } else {
            setTimeout(addBtn, 100);
        }
    }

    // 画面ロード時に追加
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addBtn);
    } else {
        addBtn();
    }

    // 子画面（各アプリ内）での操作を親の非アクティブタイマーに同期する
    // capture: true (キャプチャフェーズ) を使用することで、スクロールコンテナや特定要素でバブルが停止されたイベントも含めて漏れなく100%捕捉します
    const syncEvents = [
        'mousemove', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu',
        'keydown', 'keypress', 'keyup',
        'touchstart', 'touchmove', 'touchend', 'touchcancel',
        'pointerdown', 'pointermove', 'pointerup', 'pointercancel',
        'scroll', 'wheel', 'mousewheel',
        'input', 'change', 'focus', 'blur'
    ];
    
    syncEvents.forEach(eventName => {
        document.addEventListener(eventName, function() {
            try {
                if (window.parent && window.parent !== window) {
                    if (typeof window.parent.resetInactivityTimer === 'function') {
                        window.parent.resetInactivityTimer();
                    }
                    window.parent.postMessage('resetInactivity', '*');
                }
            } catch (e) {
                // セーフガード: CORSやセキュリティ制限がある場合のフォールバック
                try {
                    if (window.parent && window.parent !== window) {
                        window.parent.postMessage('resetInactivity', '*');
                    }
                } catch (err) {}
            }
        }, { capture: true, passive: true });
    });

    // 入力フォームでのタイピング中の自動戻りを防止するため、フォーカス/フォーカスアウトを親に通知
    document.addEventListener('focus', function(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage('inputFocus', '*');
                }
            } catch (err) {}
        }
    }, { capture: true, passive: true });

    document.addEventListener('blur', function(e) {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage('inputBlur', '*');
                }
            } catch (err) {}
        }
    }, { capture: true, passive: true });
})();
