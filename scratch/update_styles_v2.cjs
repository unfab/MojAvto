
const fs = require('fs');
const path = 'css/styles.css';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

// Update .listing-card-action-bar
const actionStartIndex = lines.findIndex(l => l.includes('.listing-card-action-bar {'));
if (actionStartIndex !== -1) {
    let actionEndIndex = actionStartIndex;
    while (actionEndIndex < lines.length && !lines[actionEndIndex].includes('}')) {
        actionEndIndex++;
    }
    const newActionLines = [
        ".listing-card-action-bar {",
        "  display: flex;",
        "  align-items: center;",
        "  justify-content: space-between;",
        "  width: 100%;",
        "  margin-top: 0.5rem; /* Reduced margin */",
        "}"
    ];
    lines.splice(actionStartIndex, actionEndIndex - actionStartIndex + 1, ...newActionLines);
}

// Update .seller-note-card
const noteStartIndex = lines.findIndex(l => l.includes('.seller-note-card {'));
if (noteStartIndex !== -1) {
    let noteEndIndex = noteStartIndex;
    while (noteEndIndex < lines.length && !lines[noteEndIndex].includes('}')) {
        noteEndIndex++;
    }
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
        "  margin-top: 1rem;",
        "}"
    ];
    lines.splice(noteStartIndex, noteEndIndex - noteStartIndex + 1, ...newNoteLines);
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Styles updated');
