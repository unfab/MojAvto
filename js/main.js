const userListings = JSON.parse(localStorage.getItem("userListings") || "[]");

const listingsContainer = document.getElementById("listingsContainer");
const noListingsMessage = document.getElementById("noListingsMessage");

function renderListings(listings) {
  listingsContainer.innerHTML = "";
  if (listings.length === 0) {
    noListingsMessage.style.display = "block";
    return;
  }
  noListingsMessage.style.display = "none";

  listings.forEach((listing) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${listing.image || "https://via.placeholder.com/300x180?text=Avto"}" alt="${listing.title}" />
      <div class="card-body">
        <h3 class="card-title">${listing.title}</h3>
        <p class="card-details">Letnik: ${listing.year} | Prevoženih: ${listing.mileage || "n/a"} km</p>
        <p class="card-price">${listing.price.toLocaleString()} €</p>
      </div>
    `;
    listingsContainer.appendChild(card);
  });
}

function quickSearch() {
  const make = document.getElementById("make").value.toLowerCase();
  const yearFrom = parseInt(document.getElementById("yearFrom").value, 10);
  const priceTo = parseInt(document.getElementById("priceTo").value, 10);

  let filtered = userListings;

  if (make) {
    filtered = filtered.filter((item) => item.make.toLowerCase() === make);
  }
  if (!isNaN(yearFrom)) {
    filtered = filtered.filter((item) => item.year >= yearFrom);
  }
  if (!isNaN(priceTo)) {
    filtered = filtered.filter((item) => item.price <= priceTo);
  }

  renderListings(filtered);
}

renderListings(userListings);
