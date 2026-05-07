const { app, BrowserWindow } = require('electron');
const path = require('path'); // ★追加：ファイルの場所を絶対間違えないための魔法
const fs = require('fs'); // ★追加：ファイルを監視するための機能

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true, // iframeの中でもNode.jsやwebviewを使えるようにする
      webviewTag: true // Meetなどの外部サイトを埋め込むための特別なタグを許可
    }
  });

  // カメラ・マイク等の権限を自動で許可する（Google Meet用）
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });

  // ★重要★ Googleのログイン画面が開く時だけ「Node.jsの機能」をオフにする
  // (Googleはハッキング防止のため、特殊な機能を持ったブラウザからのログインを即座に弾くため)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.includes('accounts.google.com')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }
    return { action: 'allow' };
  });

  // ★変更：確実に index.html を見つけ出す書き方
  win.loadFile(path.join(__dirname, 'Ver3.0.html'));

  // ★追加：ファイルが保存されたら自動的に画面を更新する自作機能
  let reloadTimeout;
  fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
    // node_modulesや隠しファイルの変更は無視する
    if (!filename || filename.includes('node_modules') || filename.startsWith('.')) return;
    
    // 連続してリロードされすぎるのを防ぐための調整
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
      if (!win.isDestroyed()) {
        console.log(`${filename} が更新されました。画面を再読み込みします。`);
        win.reload();
      }
    }, 100);
  });
  
  // ※もしこれでも真っ白なら、下の行の「//」を消して保存・起動すると、
  // エラーの原因を教えてくれる「開発者ツール」が開きます。
  // win.webContents.openDevTools();
}

// Googleの「安全でないブラウザ」ブロックを回避するため、最新のChromeのふりをする
app.userAgentFallback = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

app.whenReady().then(() => {
  // ★最強の魔法：Google Meetなどの「埋め込み拒否設定（X-Frame-Optionsなど）」を世界中のすべてのサイトに対して無効化する
  const { session } = require('electron');
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = Object.assign({}, details.responseHeaders);
    // 埋め込みをブロックするヘッダーを削除
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['Content-Security-Policy'];
    delete responseHeaders['content-security-policy'];
    // 変更したヘッダーでレスポンスを返す
    callback({
      cancel: false,
      responseHeaders: responseHeaders
    });
  });

  // ★ログインブロック回避その２：Googleに「私はElectronではありません」と強引に信じ込ませる
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // 最新のChromeのふりをする
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    // Electronであることをバラしてしまう「sec-ch-ua」という証拠ヘッダーを完全に消去する（これが原因の可能性大）
    delete details.requestHeaders['sec-ch-ua'];
    delete details.requestHeaders['Sec-CH-UA'];
    delete details.requestHeaders['sec-ch-ua-mobile'];
    delete details.requestHeaders['sec-ch-ua-platform'];
    callback({ windowId: details.windowId, requestHeaders: details.requestHeaders });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});