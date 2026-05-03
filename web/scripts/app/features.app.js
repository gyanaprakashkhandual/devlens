import { createIcon } from "../../icons/core.icons.js";

const featuresHTML = `
  <div class="features-container">
    <div class="features-header">
      <h2>Powerful Analysis Modules</h2>
      <p>Six specialized tools to analyze, debug, and optimize your code</p>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-header">
          <div class="feature-icon"></div>
          <h3>Code Analysis</h3>
        </div>
        <p class="feature-description">Static analysis with AST parsing to detect unused variables, complex functions, and code quality issues</p>
        <ul class="feature-list">
          <li><span class="list-icon"></span>Unused declarations</li>
          <li><span class="list-icon"></span>Complexity metrics</li>
          <li><span class="list-icon"></span>Code patterns</li>
          <li><span class="list-icon"></span>Error handling</li>
        </ul>
      </div>

      <div class="feature-card">
        <div class="feature-header">
          <div class="feature-icon"></div>
          <h3>Scope & Closures</h3>
        </div>
        <p class="feature-description">Visualize scope chains and closure relationships with interactive diagrams and canvas rendering</p>
        <ul class="feature-list">
          <li><span class="list-icon"></span>Scope hierarchy</li>
          <li><span class="list-icon"></span>Variable tracking</li>
          <li><span class="list-icon"></span>Closure detection</li>
          <li><span class="list-icon"></span>Interactive canvas</li>
        </ul>
      </div>

      <div class="feature-card">
        <div class="feature-header">
          <div class="feature-icon"></div>
          <h3>Performance Profiling</h3>
        </div>
        <p class="feature-description">Real-time execution profiling with flame charts and function instrumentation via Proxy</p>
        <ul class="feature-list">
          <li><span class="list-icon"></span>Flame charts</li>
          <li><span class="list-icon"></span>Call timing</li>
          <li><span class="list-icon"></span>Long tasks</li>
          <li><span class="list-icon"></span>Frame analysis</li>
        </ul>
      </div>

      <div class="feature-card">
        <div class="feature-header">
          <div class="feature-icon"></div>
          <h3>Accessibility Auditing</h3>
        </div>
        <p class="feature-description">WCAG 2.1 AA compliance checking with contrast calculation and DOM analysis</p>
        <ul class="feature-list">
          <li><span class="list-icon"></span>WCAG criteria</li>
          <li><span class="list-icon"></span>Contrast ratios</li>
          <li><span class="list-icon"></span>ARIA validation</li>
          <li><span class="list-icon"></span>DOM structure</li>
        </ul>
      </div>

      <div class="feature-card">
        <div class="feature-header">
          <div class="feature-icon"></div>
          <h3>Memory Leak Detection</h3>
        </div>
        <p class="feature-description">Find memory leaks using WeakRef, FinalizationRegistry, and heap pressure analysis</p>
        <ul class="feature-list">
          <li><span class="list-icon"></span>Detached nodes</li>
          <li><span class="list-icon"></span>Listener tracking</li>
          <li><span class="list-icon"></span>Closure retention</li>
          <li><span class="list-icon"></span>Growing collections</li>
        </ul>
      </div>

      <div class="feature-card">
        <div class="feature-header">
          <div class="feature-icon"></div>
          <h3>Dependency Visualization</h3>
        </div>
        <p class="feature-description">Force-directed graphs showing module dependencies and circular dependency detection</p>
        <ul class="feature-list">
          <li><span class="list-icon"></span>Graph visualization</li>
          <li><span class="list-icon"></span>Cycle detection</li>
          <li><span class="list-icon"></span>Module relationships</li>
          <li><span class="list-icon"></span>Interactive layout</li>
        </ul>
      </div>
    </div>

    <div class="features-secondary">
      <h2>Additional Features</h2>
      
      <div class="secondary-grid">
        <div class="secondary-item">
          <div class="secondary-icon"></div>
          <h4>Live Sandbox</h4>
          <p>Execute code with step-by-step debugging and variable inspection</p>
        </div>
        
        <div class="secondary-item">
          <div class="secondary-icon"></div>
          <h4>Session Persistence</h4>
          <p>All data saved to IndexedDB for seamless browser tab reopening</p>
        </div>
        
        <div class="secondary-item">
          <div class="secondary-icon"></div>
          <h4>Report Generation</h4>
          <p>Export comprehensive HTML reports with all findings</p>
        </div>
        
        <div class="secondary-item">
          <div class="secondary-icon"></div>
          <h4>Dark Mode</h4>
          <p>Professional dark and light themes with full accessibility</p>
        </div>
      </div>
    </div>
  </div>
`;

function initFeatures() {
    const featuresEl = document.getElementById('features');
    featuresEl.innerHTML = featuresHTML;

    const featureIcons = [
        'code',
        'layers',
        'activity',
        'eye',
        'cpu',
        'target'
    ];

    const featureCards = featuresEl.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        const iconDiv = card.querySelector('.feature-icon');
        iconDiv.appendChild(createIcon(featureIcons[index]));

        const listIcons = card.querySelectorAll('.list-icon');
        listIcons.forEach(icon => {
            icon.appendChild(createIcon('check'));
        });
    });

    const secondaryIcons = [
        'zap',
        'shield',
        'download',
        'moon'
    ];

    const secondaryItems = featuresEl.querySelectorAll('.secondary-item');
    secondaryItems.forEach((item, index) => {
        const iconDiv = item.querySelector('.secondary-icon');
        iconDiv.appendChild(createIcon(secondaryIcons[index]));
    });
}

document.addEventListener('DOMContentLoaded', initFeatures);