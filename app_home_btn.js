(function() {
    if (document.getElementById('unified-home-btn')) return;

    // 現在のファイルから見たホーム（index.html）への相対パスを動的に判定
    function getHomePath() {
        const path = window.location.pathname;
        // 子アプリのディレクトリ内にある場合は1つ上の階層に戻る
        if (path.includes('/app1-') || path.includes('/app2-') || path.includes('/app3-') || path.includes('/app4-')) {
            return '../index.html';
        }
        return 'index.html';
    }

    function goHome() {
        try {
            // 親ウィンドウが存在し、自分自身でない場合（iframe内にある場合）
            if (window.parent && window.parent !== window) {
                // 安全に postMessage で閉じるよう要求する（CORSエラーを完全に回避）
                window.parent.postMessage('closeApp', '*');
            } else {
                // 単独で開かれている場合は適切な index.html に遷移
                window.location.href = getHomePath();
            }
        } catch (error) {
            // セーフガード: 万が一エラーが発生した場合のフォールバック
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage('closeApp', '*');
                    return;
                }
            } catch (e) {}
            window.location.href = getHomePath();
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

    // タッチデバイスでの反応性を向上させるため、clickとtouchstartの両方にバインド
    const triggerGoHome = (e) => {
        e.preventDefault();
        goHome();
    };
    btn.onclick = triggerGoHome;
    btn.ontouchstart = triggerGoHome;

    function addBtn() {
        if (document.body) {
            document.body.appendChild(btn);
        } else {
            setTimeout(addBtn, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addBtn);
    } else {
        addBtn();
    }

    // 子画面での操作を親の非アクティブタイマーに同期する処理（CORSセーフ版）
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
                    // 親のプロパティに直接アクセスせず、常に安全に postMessage を送信
                    window.parent.postMessage('resetInactivity', '*');
                }
            } catch (e) {}
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
