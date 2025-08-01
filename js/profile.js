document.addEventListener("DOMContentLoaded", () => {
    // Nalaganje glave
    fetch("header.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("header").innerHTML = data;
        const userMenuScript = document.createElement('script');
        userMenuScript.src = 'js/userMenu.js';
        document.body.appendChild(userMenuScript);
      });

    // Preverjanje prijave
    const loggedUser = JSON.parse(localStorage.getItem("mojavto_loggedUser"));
    if (!loggedUser) {
        window.location.href = "login.html";
        return;
    }

    // Prikaz uporabnikovih podatkov
    document.getElementById('welcome-message').textContent = `Pozdravljen, ${loggedUser.fullname}!`;
    document.getElementById('user-details').innerHTML = `<p><strong>Uporabniško ime:</strong> ${loggedUser.username}</p><p><strong>Email:</strong> ${loggedUser.email}</p>`;

    const container = document.getElementById('saved-searches-container');
    const noSearchesMsg = document.getElementById('no-searches-message');
    const allListings = JSON.parse(localStorage.getItem('mojavto_listings')) || [];
    const allSavedSearches = JSON.parse(localStorage.getItem('mojavto_savedSearches')) || {};
    const userSearches = allSavedSearches[loggedUser.username] || [];

    function displaySavedSearches() {
        container.innerHTML = '';
        if (userSearches.length === 0) {
            noSearchesMsg.style.display = 'block';
            return;
        }
        
        noSearchesMsg.style.display = 'none';
        userSearches.forEach((search, index) => {
            const currentResultsCount = applyAdvancedFilters(allListings, search.criteria).length;
            const hasNewResults = currentResultsCount > search.lastResultCount;

            const item = document.createElement('div');
            item.className = 'saved-search-item';
            item.innerHTML = `
                <div class="search-name">
                    <span>${search.name}</span>
                    ${hasNewResults ? `<span class="notification-badge">NOVO!</span>` : ''}
                </div>
                <div class="search-actions">
                    <button class="btn btn-run-search" data-index="${index}"><i class="fas fa-search"></i> Zaženi</button>
                    <button class="btn btn-delete" data-index="${index}"><i class="fas fa-trash"></i> Izbriši</button>
                </div>
            `;
            container.appendChild(item);
        });

        // Event listenerji za gumbe
        container.querySelectorAll('.btn-run-search').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.currentTarget.dataset.index;
                const search = userSearches[index];
                
                // Posodobimo število rezultatov za "obvestila"
                search.lastResultCount = applyAdvancedFilters(allListings, search.criteria).length;
                localStorage.setItem('mojavto_savedSearches', JSON.stringify(allSavedSearches));

                sessionStorage.setItem('advancedSearchCriteria', JSON.stringify(search.criteria));
                window.location.href = "index.html";
            });
        });

        container.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm("Ali ste prepričani, da želite izbrisati to iskanje?")) {
                    const index = e.currentTarget.dataset.index;
                    userSearches.splice(index, 1);
                    localStorage.setItem('mojavto_savedSearches', JSON.stringify(allSavedSearches));
                    displaySavedSearches(); // Ponovno prikaži seznam
                }
            });
        });
    }

    // Pomožna funkcija za filtriranje (enaka kot v main.js in advanced-search.js)
    function applyAdvancedFilters(listings, criteria) {
        let filtered = listings;
        if (!criteria) return [];
        if (criteria.make) filtered = filtered.filter(l => l.make === criteria.make);
        if (criteria.model) filtered = filtered.filter(l => l.model === criteria.model);
        if (criteria.priceFrom) filtered = filtered.filter(l => l.price >= Number(criteria.priceFrom));
        if (criteria.priceTo) filtered = filtered.filter(l => l.price <= Number(criteria.priceTo));
        // ... dodajte preostale filtre, ki jih podpirate ...
        return filtered;
    }

    displaySavedSearches();
});