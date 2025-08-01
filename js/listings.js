document.addEventListener("DOMContentLoaded", () => {
  const selectedListing = JSON.parse(localStorage.getItem("selectedListing"));
  if (!selectedListing) return;

  const images = selectedListing.images || [];
  const mainImage = document.getElementById("mainImage");
  const thumbnailsContainer = document.getElementById("thumbnails");

  let currentIndex = 0;

  function renderMainImage(index) {
    mainImage.src = images[index];
    updateActiveThumbnail(index);
  }

  function updateActiveThumbnail(index) {
    const thumbnails = thumbnailsContainer.querySelectorAll("img");
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
  }

  function renderThumbnails() {
    thumbnailsContainer.innerHTML = "";
    images.forEach((img, index) => {
      const thumb = document.createElement("img");
      thumb.src = img;
      thumb.addEventListener("click", () => {
        currentIndex = index;
        renderMainImage(currentIndex);
      });
      thumbnailsContainer.appendChild(thumb);
    });
    updateActiveThumbnail(currentIndex);
  }

  document.getElementById("prevBtn").addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    renderMainImage(currentIndex);
  });

  document.getElementById("nextBtn").addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    renderMainImage(currentIndex);
  });

  if (images.length > 0) {
    renderMainImage(currentIndex);
    renderThumbnails();
  } else {
    mainImage.src = "https://via.placeholder.com/600x400?text=Ni+slike";
  }
});
