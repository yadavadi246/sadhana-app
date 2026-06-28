import { render } from 'preact';
import { html } from './html.js';
import App from './App.js';

// Get target mounting element
const rootElement = document.getElementById('root');

if (rootElement) {
  // Clear any loading state markup
  rootElement.innerHTML = '';
  // Render the application
  render(html`<${App} />`, rootElement);
}
