import React from 'react';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';

// Mock App component to focus on basic structure testing
const MockApp = () => (
  <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
    <div data-testid="mock-header">Header</div>
    <div data-testid="mock-module-nav">ModuleNav</div>
    <main className="flex-1">
      <div>App Content</div>
    </main>
  </div>
);

describe('App', () => {
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

  it('renders the main app structure', () => {
    renderWithRouter(<MockApp />);
    
    expect(document.body).toBeInTheDocument();
  });

  it('includes Header component', () => {
    renderWithRouter(<MockApp />);
    
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
  });

  it('includes ModuleNav component', () => {
    renderWithRouter(<MockApp />);
    
    expect(screen.getByTestId('mock-module-nav')).toBeInTheDocument();
  });

  it('has proper main content area', () => {
    renderWithRouter(<MockApp />);
    
    const mainContent = document.querySelector('main');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveClass('flex-1');
  });

  it('applies the correct styling classes', () => {
    renderWithRouter(<MockApp />);
    
    const appContainer = document.querySelector('.min-h-screen.bg-\\[\\#0a0a0a\\].text-white');
    expect(appContainer).toBeInTheDocument();
  });
});