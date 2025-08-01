document.addEventListener("DOMContentLoaded", () => {
  const makeSelect = document.getElementById("make");
  const modelSelect = document.getElementById("model");
  const yearFromInput = document.getElementById("yearFrom");
  const priceToInput = document.getElementById("priceTo");
  const listingsContainer = document.getElementById("listingsContainer");
  const noListingsMessage = document.getElementById("noListingsMessage");

  let brandModelData = {};
  // Primer oglasov; kasneje lahko podatke naložiš iz baze/localStorage/API
  let userListings = [
    {
      id: 1,
      make: "Toyota",
      model: "Corolla",
      title: "Toyota Corolla 1.8 Hybrid",
      year: 2019,
      mileage: 35000,
      price: 15900,
      image: "https://cdn.example.com/toyota-corolla.jpg"
    },
    {
      id: 2,
      make: "Volkswagen",
      model: "Golf",
      title: "Volkswagen Golf 7",
      year: 2017,
      mileage: 48000,
      price: 13000,
      image: "https://cdn.example.com/vw-golf.jpg"
    },
    {
      id: 3,
      make: "BMW",
      model: "X5",
      title: "BMW X5 xDrive",
      year: 2018,
      mileage: 65000,
      price: 35000,
      image: "https://cdn.example.com/bmw-x5.jpg"
    }
  ];

  // Naloži znamke in modele iz JSON datoteke
  fetch("data/brands_models_global.json")
    .then(res => res.json())
    .then(data => {
      brandModelData = data;
      populateBrandOptions();
    })
    .catch(err => console.error("Napaka pri nalaganju znamk in modelov:", err));

  // Napolni znamke v select "make"
  function populateBrandOptions() {
    makeSelect.innerHTML = '<option value="">Vse znamke</option>';
    Object.keys(brandModelData).sort().forEach(brand => {
      const opt = document.createElement("option");
      opt.value = brand;
      opt.textContent = brand;
      makeSelect.appendChild(opt);
    });
  }

  // Ob spremembi znamke napolni modele
  makeSelect.addEventListener("change", () => {
    const selectedBrand = makeSelect.value;
    modelSelect.innerHTML = "";
    modelSelect.disabled = true;

    if (selectedBrand && brandModelData[selectedBrand]) {
      modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
      brandModelData[selectedBrand].forEach(model => {
        const opt = document.createElement("option");
        opt.value = model;
        opt.textContent = model;
        modelSelect.appendChild(opt);
      });
      modelSelect.disabled = false;
    } else {
      modelSelect.innerHTML = '<option value="">Najprej izberi znamko</option>';
    }
    filterListings();
  });

  // Ob spremembi modela, letnika ali cene izvedi filtriranje
  modelSelect.addEventListener("change", filterListings);
  yearFromInput.addEventListener("input", filterListings);
  priceToInput.addEventListener("input", filterListings);

  // Filtriraj oglase po kriterijih iz obrazca
  function filterListings() {
    const make = makeSelect.value.toLowerCase();
    const model = modelSelect.value.toLowerCase();
    const yearFrom = parseInt(yearFromInput.value, 10);
    const priceTo = parseFloat(priceToInput.value);

    let filtered = userListings;

    if (make) {
      filtered = filtered.filter(item => item.make.toLowerCase() === make);
    }

    if (model) {
      filtered = filtered.filter(item => item.model.toLowerCase() === model);
    }

    if (!isNaN(yearFrom)) {
      filtered = filtered.filter(item => item.year >= yearFrom);
    }

    if (!isNaN(priceTo)) {
      filtered = filtered.filter(item => item.price <= priceTo);
    }

    renderListings(filtered);
  }

  // Prikaži seznam oglasov
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
      card.innerHTML = `
        <img src="${listing.image || "https://via.placeholder.com/300x180?text=Avto"}" alt="${listing.title}" />
        <div class="card-body">
          <h3 class="card-title">${listing.title}</h3>
          <p class="card-details">Letnik: ${listing.year} | Prevoženih: ${listing.mileage.toLocaleString()} km</p>
          <p class="card-price">${listing.price.toLocaleString()} €</p>
        </div>
      `;
      listingsContainer.appendChild(card);
    });
  }

  // Prvi prikaz vseh oglasov
  renderListings(userListings);
});
