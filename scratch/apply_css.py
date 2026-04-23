
import os

file_path = r'c:\Users\marti\AMS d.o.o\MojAvto\css\styles.css'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# line 3101 is index 3100
# Update seller-note-card
# .seller-note-card { (3101) to } (3115)
start_note = 3100
end_note = 3114

new_note_lines = [
    ".seller-note-card {\n",
    "  width: 100%;\n",
    "  background: rgba(99, 102, 241, 0.05);\n",
    "  border: 1px solid rgba(99, 102, 241, 0.12);\n",
    "  padding: 0.75rem 1.25rem;\n",
    "  border-radius: 1rem;\n",
    "  display: flex;\n",
    "  align-items: center;\n",
    "  gap: 0.85rem;\n",
    "  font-size: 0.85rem;\n",
    "  color: #4f46e5;\n",
    "  font-weight: 600;\n",
    "  line-height: 1.4;\n",
    "  margin: 1.25rem 0; /* More spacing for seller note */\n",
    "}\n"
]

# Update action-bar
# .listing-card-footer { (3122) to } (3135)
start_action = 3121
end_action = 3134

new_action_lines = [
    ".listing-card-action-bar {\n",
    "  display: flex;\n",
    "  align-items: center;\n",
    "  justify-content: space-between;\n",
    "  width: 100%;\n",
    "  padding-top: 1rem;\n",
    "  border-top: 1.5px solid #f1f5f9;\n",
    "  margin-top: auto;\n",
    "}\n",
    "\n",
    ".primary-specs {\n",
    "  display: flex;\n",
    "  align-items: center;\n",
    "  gap: 1rem;\n",
    "}\n",
    "\n",
    ".listing-card-actions {\n",
    "  display: flex;\n",
    "  gap: 0.75rem;\n",
    "  align-items: center;\n",
    "}\n"
]

# Apply changes from bottom to top to preserve indices
lines[start_action:end_action+1] = new_action_lines
lines[start_note:end_note+1] = new_note_lines

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Replacement successful")
