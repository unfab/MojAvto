// b2b-tools.js — External / chrome extension integration for dealers
import { mountB2BShell } from '../layouts/b2b-layout.js';
import { hasRole } from '../core/b2bContext.js';

export async function initB2bToolsPage() {
    const main = mountB2BShell({ activeRoute: '/b2b/orodja', title: 'B2B orodja' });
    if (!main) return;
    if (!hasRole('dealer')) {
        main.innerHTML = `<div class="b2b-empty"><p>Ta orodja so namenjena avtohišam.</p></div>`;
        return;
    }

    main.innerHTML = `
        <div class="b2b-tools-grid">
            <article class="b2b-card">
                <h2 class="b2b-card-title"><i data-lucide="download"></i> Orodje za uvoz vozil</h2>
                <p>Chrome razširitev, ki omogoča hitri uvoz vozil iz tujih avtomobilskih portalov neposredno v vašo zalogo.</p>
                <ol class="b2b-steps">
                    <li>Prenesite razširitev (ZIP) in razpakirajte.</li>
                    <li>V Chrome odprite <code>chrome://extensions</code>.</li>
                    <li>Vklopite <strong>Developer mode</strong> (zgoraj desno).</li>
                    <li>Kliknite <strong>Load unpacked</strong> in izberite razpakirano mapo <code>b2b-extension</code>.</li>
                    <li>Prijavite se z istim računom kot tukaj.</li>
                </ol>
                <div class="b2b-dialog-actions">
                    <a class="btn b2b-btn-primary" href="/b2b-extension.zip" download><i data-lucide="download"></i> Prenesi razširitev</a>
                    <button class="btn b2b-btn-secondary" id="openExtBtn"><i data-lucide="external-link"></i> Odpri orodje za uvoz</button>
                </div>
            </article>

            <article class="b2b-card">
                <h2 class="b2b-card-title"><i data-lucide="package"></i> Dostopna integracija</h2>
                <ul class="b2b-info-list">
                    <li><strong>Mobile.de uvoz:</strong> samodejno pridobivanje podatkov</li>
                    <li><strong>AutoScout24:</strong> enoklikni uvoz</li>
                    <li><strong>Ročno:</strong> kopiraj-prilepi URL vozila</li>
                </ul>
                <p class="b2b-cell-sub">Vsi uvoženi zapisi gredo najprej v <a href="#/b2b/zaloga">Zalogo</a> s statusom <em>Osnutek</em>.</p>
            </article>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    document.getElementById('openExtBtn').addEventListener('click', () => {
        alert('Odprite razširitev preko Chrome ikone (pin) zgoraj desno — najprej jo morate namestiti.');
    });
}
