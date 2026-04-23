
const fs = require('fs');
const path = 'css/styles.css';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

const newNoteLines = [
    ".seller-note-card {",
    "  width: 100%;",
    "  background: rgba(99, 102, 241, 0.05);",
    "  border: 1px solid rgba(99, 102, 241, 0.12);",
    "  padding: 0.75rem 1.25rem;",
    "  border-radius: 1rem;",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 0.85rem;",
    "  font-size: 0.85rem;",
    "  color: #4f46e5;",
    "  font-weight: 600;",
    "  line-height: 1.4;",
    "  margin: 1.25rem 0; /* More spacing for seller note */",
    "}"
];

const newActionLines = [
    ".listing-card-action-bar {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: space-between;",
    "  width: 100%;",
    "  padding-top: 1rem;",
    "  border-top: 1.5px solid #f1f5f9;",
    "  margin-top: auto;",
    "}",
    "",
    ".primary-specs {",
    "  display: flex;",
    "  align-items: center;",
    "  gap: 1rem;",
    "}",
    "",
    ".listing-card-actions {",
    "  display: flex;",
    "  gap: 0.75rem;",
    "  align-items: center;",
    "}"
];

// Indices are 0-based
// 3101 is index 3100
// 3122 is index 3121
// Applying changes from bottom to top

lines.splice(3121, 14, ...newActionLines);
lines.splice(3100, 15, ...newNoteLines);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Replacement successful');
