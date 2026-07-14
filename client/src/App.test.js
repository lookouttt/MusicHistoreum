import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { store } from './app/store';
import App from './App';

test('shows a loading state before chart data has loaded', () => {
  render(
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  );

  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
