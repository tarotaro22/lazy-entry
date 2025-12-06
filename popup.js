// ボタンがクリックされた時の処理
document.getElementById("fillBtn").addEventListener("click", async () => {
    // 1. 現在アクティブなタブ（開いているページ）を取得
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 2. そのタブで "content.js" を実行させる
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    });
});