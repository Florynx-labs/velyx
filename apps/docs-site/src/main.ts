/**
 * VELYX Official Website & Documentation Platform
 * Developed by Florynx Labs for velyx.dev
 */

import './style.css';
import { initPlayground } from './playground.js';

document.addEventListener('DOMContentLoaded', () => {
  initPlayground();
  initTabNavigation();
});

function initTabNavigation(): void {
  const docLinks = document.querySelectorAll<HTMLAnchorElement>('.nav-tab');
  docLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      if (targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}
