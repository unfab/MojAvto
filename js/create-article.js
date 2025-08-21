import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';
import { translate } from './i18n.js';

// Uporabili bomo javni CORS proxy za pridobivanje vsebine iz drugih spletnih strani.
const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export function initCreateArticlePage() {
    const articleForm = document.getElementById('articleForm');
    // Preverimo, ali obrazec obstaja, preden nadaljujemo.
    if (!articleForm) return;

    const { loggedInUser } = stateManager.getState();

    // Stran je dostopna samo administratorjem.
    if (!loggedInUser || !loggedInUser.isAdmin) {
        showNotification("Nimate dovoljenja za dostop do te strani.", 'error');
        window.location.hash = '#/';
        return;
    }

    // === DOM Elementi ===
    const importUrlInput = document.getElementById('import-url');
    const importBtn = document.getElementById('import-btn');
    const importStatus = document.getElementById('import-status');
    const titleInput = document.getElementById('article-title');
    const contentTextarea = document.getElementById('article-content');
    const imageInput = document.getElementById('article-image');

    // === Logika za uvoz iz URL-ja ===
    if (importBtn) {
        importBtn.addEventListener('click', async () => {
            const urlToFetch = importUrlInput.value.trim();
            if (!urlToFetch) {
                showNotification("Vnesite veljaven URL.", 'error');
                return;
            }

            importStatus.textContent = "Pridobivam vsebino...";
            importBtn.disabled = true;

            try {
                const response = await fetch(`${CORS_PROXY}${encodeURIComponent(urlToFetch)}`);
                if (!response.ok) throw new Error("Vira ni bilo mogoče naložiti.");
                
                const htmlText = await response.text();
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');

                const title = doc.querySelector('h1')?.innerText || doc.querySelector('title')?.innerText || '';
                const imageUrl = doc.querySelector('meta[property="og:image"]')?.content || '';
                
                let content = '';
                doc.querySelectorAll('article p, .post-content p, .entry-content p').forEach(p => {
                    if (p.innerText.trim().length > 20) { // Ignoriramo kratke odstavke (npr. podpise slik)
                         content += `<p>${p.innerText}</p>\n`;
                    }
                });

                // Pred-izpolnimo obrazec
                titleInput.value = title;
                imageInput.value = imageUrl;
                contentTextarea.value = content;
                
                const sourceInfo = `\n\n<p><i>Vir: ${new URL(urlToFetch).hostname}</i><br><a href="${urlToFetch}" target="_blank" rel="noopener noreferrer">Ogled originalnega članka</a></p>`;
                contentTextarea.value += sourceInfo;

                importStatus.textContent = "Vsebina uspešno uvožena. Prosimo, preglejte jo in po potrebi uredite.";
                showNotification("Vsebina uvožena!", 'success');

            } catch (error) {
                importStatus.textContent = `Napaka pri uvozu: ${error.message}`;
                showNotification("Uvoz ni uspel.", 'error');
            } finally {
                importBtn.disabled = false;
            }
        });
    }

    // === Logika za oddajo obrazca ===
    articleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(articleForm);
        const data = Object.fromEntries(formData.entries());

        if (!data.title || !data.content) {
            showNotification("Naslov in vsebina sta obvezna polja.", 'error');
            return;
        }

        const newArticle = {
            title: data.title,
            imageUrl: data.image || 'slike/icons/favicon-32x32.png', // Privzeta slika, če URL ni vnesen
            content: data.content
        };

        stateManager.addArticle(newArticle);
        showNotification("Članek uspešno objavljen!", 'success');
        window.location.hash = '#/'; // Preusmeri na domačo stran po objavi
    });
}