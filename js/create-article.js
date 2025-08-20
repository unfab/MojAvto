import { stateManager } from './stateManager.js';
import { showNotification } from './notifications.js';

const CORS_PROXY = "https://api.allorigins.win/raw?url=";

export function initCreateArticlePage() {
    const articleForm = document.getElementById('articleForm');
    const { loggedInUser } = stateManager.getState();
const importUrlInput = document.getElementById('import-url');
    const importBtn = document.getElementById('import-btn');
    const importStatus = document.getElementById('import-status');
    const titleInput = document.getElementById('article-title');
    const contentTextarea = document.getElementById('article-content');
    const imageInput = document.getElementById('article-image');

    importBtn.addEventListener('click', async () => {
        const urlToFetch = importUrlInput.value;
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
            
            // Uporabimo vgrajen DOMParser za razčlenjevanje HTML-ja
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            // Poskusimo najti naslov, sliko in vsebino (to je odvisno od strani!)
            const title = doc.querySelector('h1')?.innerText || doc.querySelector('title')?.innerText || '';
            const imageUrl = doc.querySelector('meta[property="og:image"]')?.content || '';
            
            let content = '';
            // Zberemo vsebino iz vseh <p> odstavkov v glavnem delu članka
            doc.querySelectorAll('article p, .post-content p').forEach(p => {
                content += `<p>${p.innerText}</p>\n`;
            });

            // Pred-izpolnimo obrazec
            titleInput.value = title;
            imageInput.value = imageUrl;
            contentTextarea.value = content;
            
            // Dodamo vir in povezavo na original
            const sourceInfo = `\n\n<p><i>Vir: ${new URL(urlToFetch).hostname}</i><br><a href="${urlToFetch}" target="_blank">Ogled originalnega članka</a></p>`;
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

    // Stran je samo za administratorje
    if (!loggedInUser || !loggedInUser.isAdmin) {
        window.location.hash = '#/';
        return;
    }

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
            imageUrl: data.image || 'slike/icons/favicon-32x32.png', // Privzeta slika
            content: data.content
        };

        stateManager.addArticle(newArticle);
        showNotification("Članek uspešno objavljen!", 'success');
        window.location.hash = '#/'; // Preusmeri na domačo stran
    });
}