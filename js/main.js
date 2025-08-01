document.addEventListener("DOMContentLoaded", () => {
  const makeSelect = document.getElementById("make");
  const modelSelect = document.getElementById("model");
  const yearFromInput = document.getElementById("yearFrom");
  const priceToInput = document.getElementById("priceTo");
  const listingsContainer = document.getElementById("listingsContainer");
  const noListingsMessage = document.getElementById("noListingsMessage");
  const compareLink = document.getElementById("compareLink"); // Dodano

  let brandModelData = {};
  
  // --- SPREMEMBA: Centralizacija oglasov v localStorage ---
  let allListings = [];
  const initialListings = [
    {
      id: 1,
      make: "Toyota",
      model: "Corolla",
      title: "Toyota Corolla 1.8 Hybrid",
      year: 2019,
      mileage: 35000,
      price: 15900,
      power: 90, // kW
      fuel: "Hibrid",
      transmission: "Avtomatski",
      images: {
        exterior: ["https://cdn3.avto.net/images/2024/07/21/1/300427843.1.jpg", "https://cdn3.avto.net/images/2024/07/21/1/300427843.4.jpg"],
        interior: ["https://cdn3.avto.net/images/2024/07/21/1/300427843.5.jpg"]
      }
    },
    {
      id: 2,
      make: "Volkswagen",
      model: "Golf",
      title: "Volkswagen Golf 8 2.0 TDI",
      year: 2021,
      mileage: 48000,
      price: 24500,
      power: 110, // kW
      fuel: "Dizel",
      transmission: "Ročni",
      images: {
        exterior: ["https://cdn3.avto.net/images/2024/07/22/1/300516801.1.jpg", "https://cdn3.avto.net/images/2024/07/22/1/300516801.3.jpg"],
        interior: ["https://cdn3.avto.net/images/2024/07/22/1/300516801.8.jpg"]
      }
    },
    {
      id: 3,
      make: "BMW",
      model: "Serija 3",
      title: "BMW 320d M Sport",
      year: 2020,
      mileage: 65000,
      price: 31800,
      power: 140, // kW
      fuel: "Dizel",
      transmission: "Avtomatski",
      images: {
        exterior: ["https://cdn3.avto.net/images/2024/07/19/1/300171060.1.jpg", "https://cdn3.avto.net/images/2024/07/19/1/300171060.2.jpg"],
        interior: ["https://cdn3.avto.net/images/2024/07/19/1/300171060.7.jpg"]
      }
    },
     {
      id: 4,
      make: "Tesla",
      model: "Model 3",
      title: "Tesla Model 3 Long Range",
      year: 2022,
      mileage: 55000,
      price: 38900,
      power: 324, // kW
      fuel: "Elektrika",
      transmission: "Avtomatski",
      battery: 75, // kWh
      range: 560, // km
      images: {
        exterior: ["https://cdn3.avto.net/images/2024/07/22/1/300512689.1.jpg", "https://cdn3.avto.net/images/2024/07/22/1/300512689.3.jpg"],
        interior: ["https://cdn3.avto.net/images/2024/07/22/1/300512689.5.jpg"]
      }
    }
  ];

  if (localStorage.getItem("mojavto_listings")) {
    allListings = JSON.parse(localStorage.getItem("mojavto_listings"));
  } else {
    allListings = initialListings;
    localStorage.setItem("mojavto_listings", JSON.stringify(allListings));
  }
  // --- KONEC SPREMEMBE ---
  
  // Pridobivanje podatkov za znamke/modele
  fetch("json/brands_models_global.json")
    .then(res => res.json())
    .then(data => {
      brandModelData = data;
      populateMakeOptions();
    })
    .catch(err => console.error("Napaka pri nalaganju znamk in modelov:", err));
  
  // Funkcije za populacijo in filtriranje ostanejo enake...
  function populateMakeOptions() { /* ... koda ostane enaka ... */ }
  makeSelect.addEventListener("change", () => { /* ... koda ostane enaka ... */ });
  function filterListings() { /* ... koda se spremeni, da uporablja 'allListings' namesto 'userListings' ... */ }
  
  // --- NOVO: Funkcije za primerjavo ---
  function getCompareItems() {
    return JSON.parse(localStorage.getItem("mojavto_compareItems")) || [];
  }

  function toggleCompareItem(listingId) {
    let compareItems = getCompareItems();
    const itemIndex = compareItems.indexOf(listingId);

    if (itemIndex > -1) {
      compareItems.splice(itemIndex, 1); // Odstrani
    } else {
      if (compareItems.length >= 4) {
        alert("Za primerjavo lahko izberete največ 4 vozila.");
        return;
      }
      compareItems.push(listingId); // Dodaj
    }

    localStorage.setItem("mojavto_compareItems", JSON.stringify(compareItems));
    updateCompareUI();
  }

  function updateCompareUI() {
    const compareItems = getCompareItems();
    // Posodobi link v glavi
    if (compareLink) {
        compareLink.innerHTML = `<i class="fas fa-balance-scale"></i> Primerjava (${compareItems.length})`;
    }
    
    // Posodobi gumbe na karticah
    document.querySelectorAll('.compare-btn').forEach(btn => {
      const cardId = parseInt(btn.dataset.id, 10);
      if (compareItems.includes(cardId)) {
        btn.classList.add('selected');
        btn.title = "Odstrani iz primerjave";
      } else {
        btn.classList.remove('selected');
        btn.title = "Dodaj v primerjavo";
      }
    });
  }
  // --- KONEC NOVIH FUNKCIJ ---

  function renderListings(listings) {
    listingsContainer.innerHTML = "";

    if (listings.length === 0) {
      noListingsMessage.style.display = "block";
      return;
    }
    noListingsMessage.style.display = "none";

    listings.forEach(listing => {
      const card = document.createElement("article");
      card.className = "card";
      
      // --- SPREMEMBA: Dodan gumb za primerjavo ---
      card.innerHTML = `
        <div class="card-image-container">
          <img src="${listing.images?.exterior[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" />
          <button class="compare-btn" data-id="${listing.id}" title="Dodaj v primerjavo">
            <i class="fas fa-balance-scale"></i>
          </button>
        </div>
        <div class="card-body">
          <h3 class="card-title">${listing.title}</h3>
          <p class="card-details">Letnik: ${listing.year} | Prevoženih: ${listing.mileage.toLocaleString()} km</p>
          <p class="card-price">${listing.price.toLocaleString()} €</p>
        </div>
      `;
      // --- KONEC SPREMEMBE ---

      // Klik na celotno kartico vodi na podrobnosti
      card.addEventListener("click", (e) => {
        if (e.target.closest('.compare-btn')) return; // Prepreči navigacijo, če kliknemo gumb
        localStorage.setItem("selectedListing", JSON.stringify(listing));
        window.location.href = "listing.html";
      });
      
      // Klik na gumb za primerjavo
      card.querySelector('.compare-btn').addEventListener('click', (e) => {
        e.stopPropagation(); // Prepreči proženje klika na celotno kartico
        toggleCompareItem(listing.id);
      });

      listingsContainer.appendChild(card);
    });

    updateCompareUI(); // Posodobi stanje gumbov
  }

  // Prikaz vseh oglasov ob nalaganju
  renderListings(allListings);
  updateCompareUI(); // Začetni prikaz števila v glavi
});