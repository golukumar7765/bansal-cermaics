import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/HomePage', () => () => <div>Catalog page</div>);

test('renders the catalog homepage', () => {
  render(<App />);
  const linkElement = screen.getByText(/Catalog page/i);
  expect(linkElement).toBeInTheDocument();
});
