/**
 * CustomSelect - Transforms standard HTML selects into searchable, pill-shaped dropdowns.
 */
export function initCustomSelects() {
    const selects = document.querySelectorAll('select:not(.custom-select-hidden)');
    selects.forEach(select => {
        // Skip already processed
        // We allow hidden selects if they are form inputs (cl-select, pill-input)
        const isFormInput = select.classList.contains('pill-input') || select.classList.contains('cl-select') || select.classList.contains('pill-select');
        if (select.offsetParent === null && !isFormInput) return;
        createCustomSelect(select);
    });
}

export function createCustomSelect(select) {
    if (select.dataset.customSelectInit) return;
    select.dataset.customSelectInit = "true";
    select.classList.add('custom-select-hidden');
    select.style.display = 'none';

    const container = document.createElement('div');
    container.className = 'custom-select-container';

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `
        <span class="custom-select-value">${select.options[select.selectedIndex]?.text || ''}</span>
        <i data-lucide="chevron-down" class="select-icon"></i>
    `;

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu';

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'custom-select-search-wrapper';
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'custom-select-search';
    searchInput.placeholder = 'Išči...';
    searchWrapper.appendChild(searchInput);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';

    menu.appendChild(searchWrapper);
    menu.appendChild(optionsContainer);
    container.appendChild(trigger);
    container.appendChild(menu);

    select.parentNode.insertBefore(container, select);

    // Sync options
    function updateOptions() {
        optionsContainer.innerHTML = '';
        Array.from(select.options).forEach((opt, index) => {
            const optionElem = document.createElement('div');
            optionElem.className = 'custom-select-option';
            if (index === select.selectedIndex) optionElem.classList.add('selected');
            optionElem.textContent = opt.text;
            optionElem.dataset.value = opt.value;

            optionElem.addEventListener('click', () => {
                select.selectedIndex = index;
                select.dispatchEvent(new Event('change'));
                trigger.querySelector('.custom-select-value').textContent = opt.text;
                closeMenu();
            });
            optionsContainer.appendChild(optionElem);
        });
    }

    updateOptions();

    // Toggle menu
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        closeAllMenus();
        if (!isOpen) {
            menu.classList.add('open');
            trigger.classList.add('open');
            searchInput.focus();
        }
    });

    // Search logic
    let highlightedIndex = -1;
    function getVisibleOptions() {
        return Array.from(optionsContainer.querySelectorAll('.custom-select-option:not(.hidden):not(.no-results)'));
    }

    function highlightOption(index) {
        const visible = getVisibleOptions();
        visible.forEach(opt => opt.classList.remove('highlighted'));
        if (index >= 0 && index < visible.length) {
            visible[index].classList.add('highlighted');
            visible[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            highlightedIndex = index;
        } else {
            highlightedIndex = -1;
        }
    }

    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase();
        const options = optionsContainer.querySelectorAll('.custom-select-option');
        let hasResults = false;

        options.forEach(opt => {
            const text = opt.textContent.toLowerCase();
            if (text.includes(term)) {
                opt.classList.remove('hidden');
                hasResults = true;
            } else {
                opt.classList.add('hidden');
            }
        });

        highlightedIndex = -1;
        options.forEach(opt => opt.classList.remove('highlighted'));

        // No results message
        let noRes = optionsContainer.querySelector('.no-results');
        if (!hasResults) {
            if (!noRes) {
                noRes = document.createElement('div');
                noRes.className = 'custom-select-option no-results';
                noRes.textContent = 'Ni zadetkov';
                optionsContainer.appendChild(noRes);
            }
        } else if (noRes) {
            noRes.remove();
        }
    });

    searchInput.addEventListener('keydown', (e) => {
        const visible = getVisibleOptions();
        if (visible.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = (highlightedIndex + 1) % visible.length;
            highlightOption(next);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = (highlightedIndex - 1 + visible.length) % visible.length;
            highlightOption(prev);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && visible[highlightedIndex]) {
                visible[highlightedIndex].click();
            } else if (visible.length === 1) {
                visible[0].click();
            }
        } else if (e.key === 'Escape') {
            closeMenu();
        }
    });

    // Prevent click inside search from closing
    searchInput.addEventListener('click', (e) => e.stopPropagation());

    function closeMenu() {
        menu.classList.remove('open');
        trigger.classList.remove('open');
        searchInput.value = '';
    }

    // Observer to handle dynamic content changes in original select
    const observer = new MutationObserver(updateOptions);
    observer.observe(select, { childList: true });

    // Sync trigger text when original select changes via JS
    select.addEventListener('change', () => {
        trigger.querySelector('.custom-select-value').textContent = select.options[select.selectedIndex]?.text || '';
        // Highlight correct option
        optionsContainer.querySelectorAll('.custom-select-option').forEach((opt, idx) => {
            opt.classList.toggle('selected', idx === select.selectedIndex);
        });
    });

    if (window.lucide) window.lucide.createIcons({ scope: container });
}

function closeAllMenus() {
    document.querySelectorAll('.custom-select-menu.open').forEach(menu => {
        menu.classList.remove('open');
        menu.previousElementSibling.classList.remove('open');
    });
}

document.addEventListener('click', closeAllMenus);
