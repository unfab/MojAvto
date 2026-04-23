
const fs = require('fs');
const path = 'css/styles.css';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

const gridNoteOverride = [
    "",
    "#carListingsContainer.grid-layout .seller-note-card {",
    "  justify-content: center !important;",
    "  text-align: center !important;",
    "  padding: 0.6rem 1rem !important;",
    "  margin-top: 0.75rem !important;",
    "  font-size: 0.8rem !important;",
    "}"
];

lines.push(...gridNoteOverride);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Grid note override added');
