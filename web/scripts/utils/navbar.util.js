import { createIcon } from './icons.js';
import themeManager from './theme.js';

const navbarHTML = `
  <div class="navbar-container">
    <div class="navbar-content">
      <div class="navbar-brand">
        <a href="#" class="logo-link">
          <div class="logo-icon"></div>
          <span class="logo-text">DevLens</span>
        </a>
      </div>

      <button class="navbar-toggle" aria-label="Toggle navigation">
        <div class="toggle-icon"></div>
      </button>

      <nav class="navbar-menu">
        <a href="#features" class="nav-link">Features</a>
        <a href="#docs" class="nav-link">Docs</a>
        <a href="#guide" class="nav-link">Guide</a>
        <a href="#help" class="nav-link">Help</a>
      </nav>

      <div class="navbar-actions">
        <button class="theme-toggle" aria-label="Toggle theme">
          <div class="theme-icon"></div>
        </button>
        
        <a href="#" class="btn btn-primary btn-sm">
          Launch App
        </a>
      </div>
    </div>
  </div>

  <div class="mobile-menu-overlay"></div>
`;

function initNavbar() {
    const navbarEl = document.getElementById('navbar');
    navbarEl.innerHTML = navbarHTML;

    const navbarToggle = navbarEl.querySelector('.navbar-toggle');
    const mobileMenu = navbarEl.querySelector('.navbar-menu');
    const overlay = navbarEl.querySelector('.mobile-menu-overlay');
    const navLinks = navbarEl.querySelectorAll('.nav-link');

    const logoIcon = navbarEl.querySelector('.logo-icon');
    logoIcon.appendChild(createIcon('logo'));

    const themeIcon = navbarEl.querySelector('.theme-icon');
    const themeButton = navbarEl.querySelector('.theme-toggle');

    updateThemeIcon();

    navbarToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        overlay.classList.remove('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            overlay.classList.remove('active');
        });
    });

    themeButton.addEventListener('click', () => {
        themeManager.toggle();
        updateThemeIcon();
    });

    function updateThemeIcon() {
        themeIcon.innerHTML = '';
        const iconName = themeManager.isDark() ? 'sun' : 'moon';
        themeIcon.appendChild(createIcon(iconName));
    }
}

document.addEventListener('DOMContentLoaded', initNavbar);