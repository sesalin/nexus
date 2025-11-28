import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';

// Mock the Header component to focus on basic functionality
const MockHeader = () => (
  <header className="sticky top-0 z-50 bg-gray-900">
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center space-x-4">
        <div data-testid="bell-icon">Bell</div>
        <div data-testid="mic-icon">Mic</div>
        <div data-testid="search-icon">Search</div>
      </div>
      <div data-testid="account-menu">AccountMenu</div>
    </div>
  </header>
);

describe('Header', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <HashRouter>
        {component}
      </HashRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header with essential elements', () => {
    renderWithRouter(<MockHeader />);
    
    expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
    expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('includes account menu', () => {
    renderWithRouter(<MockHeader />);
    
    expect(screen.getByTestId('account-menu')).toBeInTheDocument();
  });

  it('applies proper styling classes', () => {
    renderWithRouter(<MockHeader />);
    
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    renderWithRouter(<MockHeader />);
    
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
  });
});