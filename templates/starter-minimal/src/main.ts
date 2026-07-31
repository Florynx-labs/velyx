import './styles/style.css';
import { mount } from '@velyx/runtime';
import { createRouter } from '@velyx/router';

// Import pages — or use the filesystem router plugin from @velyx/adapter-vite
import HomePage  from './app/routes/page.vx';
import AboutPage from './app/routes/about/page.vx';

const router = createRouter({
  routes: [
    { path: '/',      component: HomePage  },
    { path: '/about', component: AboutPage }
  ]
});

mount(router, '#app');
