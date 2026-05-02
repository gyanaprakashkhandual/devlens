import { createIcon } from "../../icons/core.icons";

const ctaHTML = `
  <div class="cta-container">
    <div class="cta-background"></div>
    
    <div class="cta-content">
      <h2 class="cta-title">Ready to analyze your code?</h2>
      <p class="cta-subtitle">DevLens works completely offline with no installation required. Just open and start analyzing.</p>
      
      <div class="cta-buttons">
        <button class="btn btn-primary btn-lg cta-primary">
          <div class="btn-icon"></div>
          Launch DevLens Now
        </button>
        <button class="btn btn-secondary btn-lg cta-secondary">
          <div class="btn-icon"></div>
          Read Documentation
        </button>
      </div>

      <div class="cta-highlights">
        <div class="highlight">
          <div class="highlight-icon"></div>
          <span>Works Offline</span>
        </div>
        <div class="highlight">
          <div class="highlight-icon"></div>
          <span>No Installation</span>
        </div>
        <div class="highlight">
          <div class="highlight-icon"></div>
          <span>Zero Dependencies</span>
        </div>
        <div class="highlight">
          <div class="highlight-icon"></div>
          <span>Open Source</span>
        </div>
      </div>
    </div>
  </div>
`;

function initCTA() {
    const ctaEl = document.getElementById('cta');
    ctaEl.innerHTML = ctaHTML;

    const primaryBtn = ctaEl.querySelector('.cta-primary');
    const secondaryBtn = ctaEl.querySelector('.cta-secondary');

    const primaryIcon = primaryBtn.querySelector('.btn-icon');
    primaryIcon.appendChild(createIcon('arrow'));

    const secondaryIcon = secondaryBtn.querySelector('.btn-icon');
    secondaryIcon.appendChild(createIcon('externalLink'));

    const highlights = ctaEl.querySelectorAll('.highlight-icon');
    const highlightIcons = ['shield', 'zap', 'cpu', 'github'];
    highlights.forEach((icon, index) => {
        icon.appendChild(createIcon(highlightIcons[index]));
    });

    primaryBtn.addEventListener('click', () => {
        window.location.href = '/devlens/index.html';
    });

    secondaryBtn.addEventListener('click', () => {
        window.open('#docs', '_blank');
    });
}

document.addEventListener('DOMContentLoaded', initCTA);