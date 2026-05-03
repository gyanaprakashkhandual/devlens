import { createIcon } from "../../icons/core.icons.js";

const heroHTML = `
  <div class="hero-container">
    <div class="hero-background"></div>
    
    <div class="hero-content">
      <div class="hero-text">
        <h1 class="hero-title">
          <span class="title-word">Professional</span>
          <span class="title-word">Code Analysis</span>
          <span class="title-highlight">Without Limits</span>
        </h1>
        
        <p class="hero-subtitle">
          DevLens is a powerful offline developer tool that analyzes code, detects memory leaks, visualizes dependencies, and audits accessibility—entirely in your browser with zero network requests.
        </p>

        <div class="hero-actions">
          <button class="btn btn-primary btn-lg">
            <div class="btn-icon"></div>
            Launch App
          </button>
          <button class="btn btn-secondary btn-lg">
            <div class="btn-icon"></div>
            View Docs
          </button>
        </div>

        <div class="hero-badges">
          <div class="badge">
            <div class="badge-icon"></div>
            <span>Zero Dependencies</span>
          </div>
          <div class="badge">
            <div class="badge-icon"></div>
            <span>Fully Offline</span>
          </div>
          <div class="badge">
            <div class="badge-icon"></div>
            <span>6 Analysis Modules</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="visual-box box-1"></div>
        <div class="visual-box box-2"></div>
        <div class="visual-box box-3"></div>
      </div>
    </div>

    <div class="hero-scroll">
      <div class="scroll-indicator">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M19 16L12 23L5 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>
`;

function initHero() {
    const heroEl = document.getElementById('hero');
    heroEl.innerHTML = heroHTML;

    const primaryBtn = heroEl.querySelector('.btn-primary');
    const secondaryBtn = heroEl.querySelector('.btn-secondary');

    const downloadIcon = primaryBtn.querySelector('.btn-icon');
    downloadIcon.appendChild(createIcon('download'));

    const docIcon = secondaryBtn.querySelector('.btn-icon');
    docIcon.appendChild(createIcon('externalLink'));

    const badges = heroEl.querySelectorAll('.badge-icon');
    badges[0].appendChild(createIcon('shield'));
    badges[1].appendChild(createIcon('zap'));
    badges[2].appendChild(createIcon('layers'));

    primaryBtn.addEventListener('click', () => {
        window.location.href = '/devlens/index.html';
    });

    secondaryBtn.addEventListener('click', () => {
        document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
    });
}

document.addEventListener('DOMContentLoaded', initHero);