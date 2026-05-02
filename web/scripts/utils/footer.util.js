import { createIcon } from "../../icons/core.icons";

const footerHTML = `
  <div class="footer-container">
    <div class="footer-content">
      <div class="footer-section">
        <div class="footer-brand">
          <div class="footer-logo"></div>
          <h3>DevLens</h3>
        </div>
        <p class="footer-description">Professional code analysis and debugging for modern developers</p>
        <div class="footer-socials">
          <a href="#" class="social-link" aria-label="GitHub">
            <div class="social-icon"></div>
          </a>
          <a href="#" class="social-link" aria-label="Twitter">
            <div class="social-icon"></div>
          </a>
          <a href="#" class="social-link" aria-label="LinkedIn">
            <div class="social-icon"></div>
          </a>
        </div>
      </div>

      <div class="footer-section">
        <h4>Product</h4>
        <ul class="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#guide">Getting Started</a></li>
          <li><a href="#docs">Documentation</a></li>
          <li><a href="#help">Support</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h4>Resources</h4>
        <ul class="footer-links">
          <li><a href="#">Blog</a></li>
          <li><a href="#">GitHub</a></li>
          <li><a href="#">Issues</a></li>
          <li><a href="#">Roadmap</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h4>Company</h4>
        <ul class="footer-links">
          <li><a href="#">About</a></li>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">License</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-divider"></div>

    <div class="footer-bottom">
      <p class="footer-copyright">&copy; 2026 DevLens. MIT License. Open source and free forever.</p>
      <div class="footer-badge">
        <span>Built with</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
        <span>for developers</span>
      </div>
    </div>
  </div>
`;

function initFooter() {
    const footerEl = document.getElementById('footer');
    footerEl.innerHTML = footerHTML;

    const footerLogo = footerEl.querySelector('.footer-logo');
    footerLogo.appendChild(createIcon('logo'));

    const socialIcons = footerEl.querySelectorAll('.social-icon');
    const socialNames = ['github', 'twitter', 'linkedin'];
    socialIcons.forEach((icon, index) => {
        icon.appendChild(createIcon(socialNames[index]));
    });

    const footerLinks = footerEl.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href');
            if (target.startsWith('#')) {
                const element = document.querySelector(target);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', initFooter);