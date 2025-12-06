document.addEventListener('DOMContentLoaded', () => {
    const fillBtn = document.getElementById('fillBtn');

    fillBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    // Trigger the 'autoFill' logical block in content.js
                    // Since content.js is already loaded, we can dispatch a custom event or just require it to listen for runtime messages.
                    // However, keeping it simple: content_scripts handles page load, but we want manual trigger.
                    // Better approach: Send a message to the content script.
                }
            });

            // Sending a message is cleaner if content.js is already injected by manifest
            chrome.tabs.sendMessage(tab.id, { action: "autoFill" }).catch(err => {
                console.log("Communication error or content script not ready:", err);
                // Fallback or alert user
            });
        }
    });
});