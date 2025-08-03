function initContactPage() {
    const contactForm = document.getElementById('contactForm');
    const feedbackDiv = document.getElementById('form-feedback');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            feedbackDiv.textContent = translate('contact_form_sending');
            feedbackDiv.style.color = '#3b82f6';

            setTimeout(() => {
                feedbackDiv.textContent = translate('contact_form_success');
                feedbackDiv.style.color = '#16a34a';
                contactForm.reset();
                setTimeout(() => { feedbackDiv.textContent = ''; }, 5000);
            }, 1500);
        });
    }
}