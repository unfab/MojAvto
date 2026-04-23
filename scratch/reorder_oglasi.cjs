
const fs = require('fs');
const path = 'src/pages/oglasi.js';

let content = fs.readFileSync(path, 'utf8');

const oldNoteBlock = `            \${note ? \`
            <div class="seller-note-card">
                <i data-lucide="message-square"></i>
                <em>"\${note}"</em>
            </div>\` : ''}

            <div class="listing-card-action-bar">
                <div class="primary-specs">
                    <div class="spec-pill">
                        <i data-lucide="calendar"></i> \${car.year}
                    </div>
                    <div class="spec-pill">
                        <i data-lucide="gauge"></i> \${car.mileage}
                    </div>
                    \${getPowerPill(car.powerKw)}
                </div>

                <div class="listing-card-actions">
                    <button class="action-pill-btn listing-fav-btn" data-car-id="\${car.id}" title="Shrani med všečkane">
                        <i data-lucide="heart"></i>
                    </button>
                    <button class="action-pill-btn listing-compare-btn \${inCompare ? 'active' : ''}" data-car-id="\${car.id}" title="Primerjaj">
                        <i data-lucide="scale"></i>
                    </button>
                    <button class="action-pill-btn contact-btn accent" data-car-id="\${car.id}" title="Kontakt">
                        <i data-lucide="phone"></i>
                    </button>
                </div>
            </div>`;

const newNoteBlock = `            <div class="listing-card-action-bar">
                <div class="primary-specs">
                    <div class="spec-pill">
                        <i data-lucide="calendar"></i> \${car.year}
                    </div>
                    <div class="spec-pill">
                        <i data-lucide="gauge"></i> \${car.mileage}
                    </div>
                    \${getPowerPill(car.powerKw)}
                </div>

                <div class="listing-card-actions">
                    <button class="action-pill-btn listing-fav-btn" data-car-id="\${car.id}" title="Shrani med všečkane">
                        <i data-lucide="heart"></i>
                    </button>
                    <button class="action-pill-btn listing-compare-btn \${inCompare ? 'active' : ''}" data-car-id="\${car.id}" title="Primerjaj">
                        <i data-lucide="scale"></i>
                    </button>
                    <button class="action-pill-btn contact-btn accent" data-car-id="\${car.id}" title="Kontakt">
                        <i data-lucide="phone"></i>
                    </button>
                </div>
            </div>

            \${note ? \`
            <div class="seller-note-card">
                <i data-lucide="message-square"></i>
                <em>"\${note}"</em>
            </div>\` : ''}`;

// This is still tricky due to template literals. 
// I'll use a simpler approach: line indices.

let lines = content.split(/\r?\n/);
// lines 247 to 275 (0-based: 246 to 274)
const noteBlock = lines.slice(246, 251); // 247 to 251
const spacer = lines.slice(251, 252); // line 252
const actionBlock = lines.slice(252, 275); // 253 to 275

const reordered = [...actionBlock, ...spacer, ...noteBlock];
lines.splice(246, 29, ...reordered);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Reordering successful');
