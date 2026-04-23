
const fs = require('fs');
const path = 'css/styles.css';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

// Find .listing-card-action-bar base style
// In previous view_file it was at 3122
// Let's re-verify line index because splice might have shifted it slightly
// Actually, I just added lines, so it's around 3122 still.

const newActionLines = [
    ".listing-card-action-bar {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: space-between;",
    "  width: 100%;",
    "  padding-top: 1rem;",
    "  border-top: 1.5px solid #f1f5f9;",
    "  margin-top: 1.25rem; /* Replaced auto with fixed margin to keep it 'higher' */",
    "}"
];

// Let's find the index by searching for the start of the block
const startIndex = lines.findIndex(l => l.includes('.listing-card-action-bar {'));
if (startIndex !== -1) {
    // Find the end of the block (the next '}')
    let endIndex = startIndex;
    while (endIndex < lines.length && !lines[endIndex].includes('}')) {
        endIndex++;
    }
    lines.splice(startIndex, endIndex - startIndex + 1, ...newActionLines);
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Adjustment successful');
