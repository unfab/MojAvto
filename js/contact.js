import { translate } from './i18n.js';
// Izvozimo funkcijo, da jo lahko ruter pokliče
export function initContactPage() {
    const contactForm = document.getElementById('contactForm');
    const feedbackDiv = document.getElementById('form-feedback');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            if (feedbackDiv) {
                feedbackDiv.textContent = translate('contact_form_sending');
                feedbackDiv.style.color = '#3b82f6';
            }

            setTimeout(() => {
                if (feedbackDiv) {
                    feedbackDiv.textContent = translate('contact_form_success');
                    feedbackDiv.style.color = '#16a34a';
                }
                contactForm.reset();
                setTimeout(() => { 
                    if (feedbackDiv) feedbackDiv.textContent = ''; 
                }, 5000);
            }, 1500);
        });
    }
}