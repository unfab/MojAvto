
const fs = require('fs');
const path = 'css/styles.css';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

const gridPrimaryPillsOverride = [
    "",
    "#carListingsContainer.grid-layout .primary-specs .spec-pill {",
    "  padding: 0.4rem 0.6rem !important;",
    "  font-size: 0.8rem !important;",
    "  min-width: 0 !important;",
    "}"
];

lines.push(...gridPrimaryPillsOverride);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Grid primary pills override added');
