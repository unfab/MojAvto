// popup.js — MojAvto B2B Extension
const MOJAVTO_URL = 'http://localhost:5173/#/b2b/oceni';

const statusEl = document.getElementById('status');
const btn = document.getElementById('analyzeBtn');

// Check if current tab is on Mobile.de
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  if (tab.url && tab.url.includes('mobile.de')) {
    statusEl.textContent = '✓ Mobile.de oglas zaznan';
    statusEl.className = 'ok';
    btn.disabled = false;
  } else {
    statusEl.textContent = 'Odpri oglas na Mobile.de';
    statusEl.className = 'error';
  }
});

btn.addEventListener('click', () => {
  btn.disabled = true;
  btn.textContent = 'Zajemam podatke...';
  statusEl.textContent = '';
  statusEl.className = '';

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.id) return handleError('Ni aktivnega zavihka.');

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        files: ['content.js'],
      },
      (results) => {
        if (chrome.runtime.lastError) {
          return handleError(chrome.runtime.lastError.message);
        }

        const result = results?.[0]?.result;
        if (!result || result.error) {
          return handleError(result?.error || 'Ekstrakcija ni uspela.');
        }

        const encoded = encodeURIComponent(JSON.stringify(result));
        const target = `${MOJAVTO_URL}?importData=${encoded}`;

        chrome.tabs.create({ url: target });
        window.close();
      }
    );
  });
});

function handleError(msg) {
  statusEl.textContent = '⚠ ' + msg;
  statusEl.className = 'error';
  btn.disabled = false;
  btn.textContent = 'Analiziraj uvoz v MojAvto';
}
