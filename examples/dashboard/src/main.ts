import { signal } from '@velyx/core';
import { createElement, mount } from '@velyx/runtime-dom';

function DashboardApp() {
  const activeUsers = signal(1420);
  const requestsPerSec = signal(8950);

  setInterval(() => {
    activeUsers(1400 + Math.floor(Math.random() * 50));
    requestsPerSec(8800 + Math.floor(Math.random() * 300));
  }, 2000);

  return createElement('div', { style: 'padding: 3rem; max-width: 900px; margin: 0 auto; background: #0b0f19; color: #fff; font-family: sans-serif;' },
    createElement('h1', { style: 'font-size: 2rem; margin-bottom: 2rem; color: #38bdf8;' }, 'VELYX Real-time Analytics Dashboard'),
    createElement('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;' },
      createElement('div', { style: 'background: #131b2e; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);' },
        createElement('h3', { style: 'color: #94a3b8; font-size: 0.9rem; margin-bottom: 0.5rem;' }, 'Active Sessions'),
        createElement('p', { style: 'font-size: 2.5rem; font-weight: 800; color: #34d399;' }, () => activeUsers().toLocaleString())
      ),
      createElement('div', { style: 'background: #131b2e; padding: 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);' },
        createElement('h3', { style: 'color: #94a3b8; font-size: 0.9rem; margin-bottom: 0.5rem;' }, 'Requests / sec'),
        createElement('p', { style: 'font-size: 2.5rem; font-weight: 800; color: #818cf8;' }, () => requestsPerSec().toLocaleString())
      )
    )
  );
}

mount(DashboardApp, '#app');
