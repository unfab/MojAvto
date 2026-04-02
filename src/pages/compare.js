// Compare page — MojAvto.si
// Renders side-by-side comparison of selected vehicles from localStorage

export function initComparePage() {
    console.log('[ComparePage] init');
    renderComparison();
}

function renderComparison() {
    const container = document.getElementById('compareContent');
    if (!container) return;

    const compareList = JSON.parse(localStorage.getItem('mojavto_compare') || '[]');

    if (compareList.length === 0) {
        container.innerHTML = `
            <div class="compare-empty">
                <i data-lucide="scale" class="compare-empty-icon"></i>
                <h2>Niste izbrali nobenega vozila za primerjavo</h2>
                <p>Pojdite na oglasno desko in pri oglasih kliknite na ikono tehtnice, da jih dodate v primerjavo.</p>
                <a href="#/oglasi"><i data-lucide="search" style="width:16px;height:16px;"></i> Pojdi na oglase</a>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const colClass = compareList.length === 2 ? 'cols-2' : (compareList.length === 3 ? 'cols-3' : 'cols-2');

    let gridHTML = `<div class="compare-grid ${colClass}">`;
    
    compareList.forEach(car => {
        const rating = car.priceRating || { score: 2, label: 'Povprečna cena', color: 'amber' };
        
        gridHTML += `
        <div class="compare-col" data-compare-id="${car.id}">
            <div class="compare-col-img">
                <img src="${car.image}" alt="${car.title}" loading="lazy">
            </div>
            <div class="compare-col-header">
                <h2 class="compare-col-title">${car.title}</h2>
                <p class="compare-col-subtitle">${car.subtitle || ''}</p>
                <div class="compare-col-price-row">
                    <span class="compare-col-price">${car.price || '—'}</span>
                    <span class="price-rating rating-${rating.color}">${rating.label}</span>
                </div>
            </div>
            <div class="compare-specs">
                <div class="compare-spec-row">
                    <span class="compare-spec-label"><i data-lucide="calendar"></i> Letnik</span>
                    <span class="compare-spec-value">${car.year || '—'}</span>
                </div>
                <div class="compare-spec-row">
                    <span class="compare-spec-label"><i data-lucide="gauge"></i> Prevoženi km</span>
                    <span class="compare-spec-value">${car.mileage || '—'}</span>
                </div>
                <div class="compare-spec-row">
                    <span class="compare-spec-label"><i data-lucide="settings-2"></i> Moč</span>
                    <span class="compare-spec-value">${car.power || '—'}</span>
                </div>
                <div class="compare-spec-row">
                    <span class="compare-spec-label"><i data-lucide="fuel"></i> Gorivo</span>
                    <span class="compare-spec-value">${car.fuel || '—'}</span>
                </div>
                <div class="compare-spec-row">
                    <span class="compare-spec-label"><i data-lucide="map-pin"></i> Lokacija</span>
                    <span class="compare-spec-value">${car.location || '—'}</span>
                </div>
                <div class="compare-spec-row">
                    <span class="compare-spec-label"><i data-lucide="user"></i> Prodajalec</span>
                    <span class="compare-spec-value">${car.seller || '—'}</span>
                </div>
            </div>
            <div class="compare-col-footer">
                <button class="compare-remove-btn" data-remove-id="${car.id}">
                    <i data-lucide="x"></i> Odstrani
                </button>
                <button class="compare-contact-btn">
                    <i data-lucide="mail"></i> Kontakt
                </button>
            </div>
        </div>`;
    });

    gridHTML += '</div>';

    // Actions row
    gridHTML += `
        <div class="compare-actions">
            <button class="compare-clear-all" id="clearAllCompare">Počisti vse</button>
            ${compareList.length < 3 ? '<a href="#/oglasi" class="compare-add-more"><i data-lucide="plus" style="width:16px;height:16px;"></i> Dodaj vozilo</a>' : ''}
        </div>
    `;

    container.innerHTML = gridHTML;

    // Init Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Bind remove buttons
    container.querySelectorAll('.compare-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const removeId = btn.getAttribute('data-remove-id');
            let list = JSON.parse(localStorage.getItem('mojavto_compare') || '[]');
            list = list.filter(c => c.id !== removeId);
            localStorage.setItem('mojavto_compare', JSON.stringify(list));
            if (window.updateHeaderCompare) window.updateHeaderCompare();
            renderComparison();
        });
    });

    // Bind clear all
    const clearBtn = document.getElementById('clearAllCompare');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            localStorage.setItem('mojavto_compare', JSON.stringify([]));
            if (window.updateHeaderCompare) window.updateHeaderCompare();
            renderComparison();
        });
    }
}
