document.addEventListener("DOMContentLoaded", () => {
  const makeSelect = document.getElementById("make");
  const modelSelect = document.getElementById("model");
  const yearFromInput = document.getElementById("yearFrom");
  const priceToInput = document.getElementById("priceTo");
  const listingsContainer = document.getElementById("listingsContainer");
  const noListingsMessage = document.getElementById("noListingsMessage");

  let brandModelData = {};
  let userListings = [
    {
      id: 1,
      make: "Toyota",
      model: "Corolla",
      title: "Toyota Corolla 1.8 Hybrid",
      year: 2019,
      mileage: 35000,
      price: 15900,
      images: ["https://cdn.example.com/toyota-corolla.jpg"]
    },
    {
      id: 2,
      make: "Volkswagen",
      model: "Golf",
      title: "Volkswagen Golf 7",
      year: 2017,
      mileage: 48000,
      price: 13000,
      images: ["https://cdn.example.com/vw-golf.jpg"]
    },
    {
      id: 3,
      make: "BMW",
      model: "X5",
      title: "BMW X5 xDrive",
      year: 2018,
      mileage: 65000,
      price: 35000,
      images: ["https://cdn.example.com/bmw-x5.jpg"]
    }
  ];

  fetch("json/brands_models_global.json")
    .then(res => res.json())
    .then(data => {
      brandModelData = data;
      populateMakeOptions();
    })
    .catch(err => console.error("Napaka pri nalaganju znamk in modelov:", err));

  function populateMakeOptions() {
    makeSelect.innerHTML = '<option value="">Vse znamke</option>';
    Object.keys(brandModelData).sort().forEach(make => {
      const option = document.createElement("option");
      option.value = make;
      option.textContent = make;
      makeSelect.appendChild(option);
    });
  }

  makeSelect.addEventListener("change", () => {
    const selectedMake = makeSelect.value;
    modelSelect.innerHTML = "";
    modelSelect.disabled = true;

    if (selectedMake && brandModelData[selectedMake]) {
      modelSelect.innerHTML = '<option value="">Vsi modeli</option>';
      brandModelData[selectedMake].forEach(model => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
      modelSelect.disabled = false;
    } else {
      modelSelect.innerHTML = '<option value="">Najprej izberi znamko</option>';
    }

    filterListings();
  });

  modelSelect.addEventListener("change", filterListings);
  yearFromInput.addEventListener("input", filterListings);
  priceToInput.addEventListener("input", filterListings);

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
        <img src="${listing.images?.[0] || 'https://via.placeholder.com/300x180?text=Avto'}" alt="${listing.title}" />
        <div class="card-body">
          <h3 class="card-title">${listing.title}</h3>
          <p class="card-details">Letnik: ${listing.year} | Prevoženih: ${listing.mileage.toLocaleString()} km</p>
          <p class="card-price">${listing.price.toLocaleString()} €</p>
        </div>
      `;
      card.addEventListener("click", () => {
        localStorage.setItem("selectedListing", JSON.stringify(listing));
        window.location.href = "listing.html";
      });
      listingsContainer.appendChild(card);
    });
  }

  // Prikaz vseh oglasov ob nalaganju
  renderListings(userListings);
});
