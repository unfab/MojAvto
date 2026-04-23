
const fs = require('fs');
const path = 'css/styles.css';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

// Find the grid-layout .listing-card-specs override
const gridSpecsIndex = lines.findIndex(l => l.includes('#carListingsContainer.grid-layout .listing-card-specs {'));
if (gridSpecsIndex !== -1) {
    let endIndex = gridSpecsIndex;
    while (endIndex < lines.length && !lines[endIndex].includes('}')) {
        endIndex++;
    }
    const newGridSpecsLines = [
        "#carListingsContainer.grid-layout .listing-card-specs {",
        "  display: flex !important;",
        "  justify-content: center !important;",
        "  width: 100% !important;",
        "  margin-top: 0.75rem !important;",
        "}",
        "",
        "#carListingsContainer.grid-layout .listing-card-specs .spec-pill {",
        "  padding: 0.4rem 0.6rem !important;",
        "  font-size: 0.75rem !important;",
        "}"
    ];
    lines.splice(gridSpecsIndex, endIndex - gridSpecsIndex + 1, ...newGridSpecsLines);
}

// Also adjust the action bar in grid view to be more compact
const gridActionIndex = lines.findIndex(l => l.includes('#carListingsContainer.grid-layout .listing-card-action-bar {'));
if (gridActionIndex !== -1) {
    let endIndex = gridActionIndex;
    while (endIndex < lines.length && !lines[endIndex].includes('}')) {
        endIndex++;
    }
    const newGridActionLines = [
        "#carListingsContainer.grid-layout .listing-card-action-bar {",
        "  flex-direction: column !important;",
        "  gap: 1rem !important;",
        "  border-top: none !important;",
        "  margin-top: 0.75rem !important;",
        "  padding-top: 0 !important;",
        "}"
    ];
    lines.splice(gridActionIndex, endIndex - gridActionIndex + 1, ...newGridActionLines);
}

// Ensure primary specs in grid are also centered and compact
const gridPrimaryIndex = lines.findIndex(l => l.includes('#carListingsContainer.grid-layout .primary-specs {'));
if (gridPrimaryIndex !== -1) {
     let endIndex = gridPrimaryIndex;
    while (endIndex < lines.length && !lines[endIndex].includes('}')) {
        endIndex++;
    }
    const newGridPrimaryLines = [
        "#carListingsContainer.grid-layout .primary-specs {",
        "  justify-content: center !important;",
        "  width: 100% !important;",
        "  gap: 0.5rem !important;",
        "}"
    ];
    lines.splice(gridPrimaryIndex, endIndex - gridPrimaryIndex + 1, ...newGridPrimaryLines);
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Grid layout updated');
