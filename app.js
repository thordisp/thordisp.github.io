// ============================================================
// CV App — i18n, dark mode, scroll animations, PDF download
// ============================================================

const LANG_KEY  = 'cv-lang';
const DARK_KEY  = 'cv-dark';
const DEFAULT_LANG = 'en';

let currentLang  = (function () {
  try { return localStorage.getItem(LANG_KEY) || DEFAULT_LANG; } catch (e) { return DEFAULT_LANG; }
})();

let translations = {};

// ------------------------------------------------------------------
// Persistence helpers
// ------------------------------------------------------------------
function storePref(key, val) {
  try { localStorage.setItem(key, val); } catch (e) { /* private browsing */ }
}

// ------------------------------------------------------------------
// i18n helpers
// ------------------------------------------------------------------
async function loadTranslations(lang) {
  const res = await fetch(`./i18n/${lang}.json`);
  if (!res.ok) throw new Error(`Failed to load i18n/${lang}.json`);
  return res.json();
}

function t(keyPath) {
  return keyPath.split('.').reduce((obj, k) => obj && obj[k], translations) ?? keyPath;
}

// ------------------------------------------------------------------
// Render helpers
// ------------------------------------------------------------------
function toParas(text) {
  return text.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function renderStatic() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (typeof val === 'string' && val.includes('\n')) {
      el.innerHTML = toParas(val);
    } else {
      el.textContent = val;
    }
  });
  document.documentElement.lang = t('meta.lang');
  document.title               = t('meta.title');
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', t('meta.description'));
}

function renderExperience() {
  const jobs = t('experience.jobs');
  document.getElementById('experience-list').innerHTML = jobs.map(job => `
    <div class="timeline-item animatable">
      <div class="timeline-item__date">${job.date}</div>
      <div class="timeline-item__content">
        <h3 class="timeline-item__title">${job.title}</h3>
        <p class="timeline-item__company">${job.company}</p>
        <div class="timeline-item__desc">${toParas(job.description)}</div>
      </div>
    </div>
  `).join('');
}

function renderEducation() {
  const items = t('education.items');
  document.getElementById('education-list').innerHTML = items.map(item => `
    <div class="timeline-item animatable">
      <div class="timeline-item__date">${item.years}</div>
      <div class="timeline-item__content">
        <h3 class="timeline-item__title">${item.field || item.degree}</h3>
        <p class="timeline-item__company">${item.institution}</p>
        ${item.field ? `<p class="timeline-item__desc">${item.degree}</p>` : ''}
      </div>
    </div>
  `).join('');
}

function renderSkills() {
  const categories = t('skills.categories');
  document.getElementById('skills-list').innerHTML = categories.map(cat => `
    <div class="skill-category animatable">
      <h3 class="skill-category__name">${cat.name}</h3>
      <ul class="skill-list">
        ${cat.items.map(skill => `
          <li class="skill-item">
            <span class="skill-item__name">${skill.name}</span>
            <span class="skill-item__dots" aria-label="${skill.level} out of 5">
              ${[1,2,3,4,5].map(i =>
                `<span class="dot${i <= skill.level ? ' dot--active' : ''}"></span>`
              ).join('')}
            </span>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
}

function renderSpokenLanguages() {
  const items = t('spoken_languages.items');
  document.getElementById('languages-list').innerHTML = items.map(item => `
    <div class="lang-item animatable">
      <span class="lang-item__flag" aria-hidden="true">${item.flag}</span>
      <span class="lang-item__name">${item.language}</span>
      <span class="lang-item__level">${item.level}</span>
    </div>
  `).join('');
}

function renderProjects() {
  const items = t('projects.items');
  document.getElementById('projects-list').innerHTML = items.map(project => `
    <article class="project-card animatable">
      <h3 class="project-card__name">${project.name}</h3>
      <div class="project-card__desc">${toParas(project.description)}</div>
      <div class="project-card__tags">
        ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      <div class="project-card__links">
        ${project.url ? `<a class="project-card__link" href="${project.url}" target="_blank" rel="noopener">Live &#8594;</a>` : ''}
        ${project.github ? `<a class="project-card__link" href="${project.github}" target="_blank" rel="noopener">GitHub &#8594;</a>` : ''}
      </div>
    </article>
  `).join('');
}

function applyTranslations() {
  renderStatic();
  renderExperience();
  renderEducation();
  renderSkills();
  renderSpokenLanguages();
  renderProjects();
}

// ------------------------------------------------------------------
// Dark mode
// ------------------------------------------------------------------
function initDarkMode() {
  let isDark;
  try { isDark = localStorage.getItem(DARK_KEY) === 'true'; } catch (e) { isDark = false; }
  if (isDark) document.documentElement.classList.add('dark');

  document.getElementById('darkModeToggle').addEventListener('click', () => {
    const on = document.documentElement.classList.toggle('dark');
    storePref(DARK_KEY, on);
  });
}

// ------------------------------------------------------------------
// Language toggle
// ------------------------------------------------------------------
function initLangToggle() {
  document.getElementById('langToggle').addEventListener('click', async () => {
    const next = currentLang === 'en' ? 'is' : 'en';
    currentLang = next;
    storePref(LANG_KEY, next);
    translations = await loadTranslations(next);
    document.body.classList.add('lang-transitioning');
    applyTranslations();
    observeAnimatables();
    requestAnimationFrame(() => document.body.classList.remove('lang-transitioning'));
  });
}

// ------------------------------------------------------------------
// Scroll animations
// ------------------------------------------------------------------
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      scrollObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

function observeAnimatables() {
  document.querySelectorAll('.animatable:not(.visible)').forEach(el => {
    scrollObserver.observe(el);
  });
}

// ------------------------------------------------------------------
// PDF download
// ------------------------------------------------------------------
function initPdfDownload() {
  document.getElementById('downloadPdf').addEventListener('click', () => {
    window.print();
  });
}

// ------------------------------------------------------------------
// Bootstrap
// ------------------------------------------------------------------
async function init() {
  initDarkMode();
  initPdfDownload();

  // Observe static sections immediately so they're never stuck invisible
  observeAnimatables();

  try {
    translations = await loadTranslations(currentLang);
    applyTranslations();
    observeAnimatables(); // pick up dynamically rendered items
    initLangToggle();
  } catch (err) {
    console.error('Failed to load translations:', err);
    // Make all sections visible so the page doesn't appear blank
    document.querySelectorAll('.animatable').forEach(el => el.classList.add('visible'));
  }
}

init();
