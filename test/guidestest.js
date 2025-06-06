function toggleMenu() {
  document.getElementById('nav').classList.toggle('active');
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function toggleTheme() {
  const currentTheme = document.body.dataset.theme;
  if (currentTheme === 'dark') {
    document.body.dataset.theme = '';
    localStorage.setItem('theme', 'light');
    document.getElementById('themeToggle').textContent = '🌓';
  } else {
    document.body.dataset.theme = 'dark';
    localStorage.setItem('theme', 'dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }
}
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.dataset.theme = 'dark';
    document.getElementById('themeToggle').textContent = '☀️';
  }
});
window.addEventListener('scroll', () => {
  const button = document.getElementById('backToTop');
  button.classList.toggle('show', window.scrollY > 300);
});
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('show');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.section').forEach(section => observer.observe(section));

function filterGuides() {
  const search = document.getElementById('guideSearch').value.toLowerCase();
  document.querySelectorAll('.cards-grid .card').forEach(card => {
    const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
    const description = card.querySelector('p')?.textContent.toLowerCase() || '';
    const matches = title.includes(search) || description.includes(search);
    card.style.display = matches ? 'block' : 'none';
  });
}