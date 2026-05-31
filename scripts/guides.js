window.addEventListener('scroll', () => {
  const button = document.getElementById('backToTop');
  button.classList.toggle('visible', window.scrollY > 300);
});

function filterGuides() {
  const query = document.getElementById('guideSearch').value.toLowerCase();
  const sections = document.querySelectorAll('.section');

  sections.forEach(section => {
    const cards = section.querySelectorAll('.card');
    let sectionHasVisibleCard = false;

    cards.forEach(card => {
      const title = card.querySelector('.card-title').textContent.toLowerCase();
      const content = card.querySelector('.card-desc').textContent.toLowerCase();
      const keywords = card.dataset.keywords?.toLowerCase() || '';
      const isMatch = title.includes(query) || content.includes(query) || keywords.includes(query);

      card.classList.toggle('hidden', !isMatch);
      if (isMatch) sectionHasVisibleCard = true;
    });

    if (section.id !== 'home') {
      section.classList.toggle('hidden', !sectionHasVisibleCard);
    }
  });
}
