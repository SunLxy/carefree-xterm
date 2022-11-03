import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/app/App';

describe('<App />', () => {
  test('renders without exploding', () => {
    const root = createRoot(document.createElement('div'));
    root.render(<App />);
  });
});
