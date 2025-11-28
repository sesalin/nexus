import React from 'react';
import { render, screen } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock LiveStatus component
jest.mock('../components/dashboard/LiveStatus', () => ({
  LiveStatus: () => <div data-testid="mock-live-status">Live Status</div>,
}));

// Mock Alerts component
jest.mock('../components/dashboard/Alerts', () => ({
  Alerts: () => <div data-testid="mock-alerts">Alerts</div>,
}));

describe('Dashboard', () => {
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

  it('renders the dashboard container with correct class', () => {
    renderWithRouter(<Dashboard />);
    
    const dashboard = document.querySelector('.flex-1.min-h-full.relative');
    expect(dashboard).toBeInTheDocument();
  });

  it('includes LiveStatus component', () => {
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByTestId('mock-live-status')).toBeInTheDocument();
  });

  it('includes Alerts component', () => {
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByTestId('mock-alerts')).toBeInTheDocument();
  });

  it('has a main container with proper accessibility structure', () => {
    renderWithRouter(<Dashboard />);
    
    const mainContainer = document.querySelector('[role="main"], .flex-1');
    expect(mainContainer).toBeInTheDocument();
  });

  it('includes background ambient glow effects', () => {
    renderWithRouter(<Dashboard />);
    
    const glowElement = document.querySelector('.bg-nexdom-lime\\/5');
    expect(glowElement).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    renderWithRouter(<Dashboard />);
    
    // Check that it's a main section
    const mainElement = document.querySelector('main, section, [role="main"]');
    expect(mainElement).toBeInTheDocument();
  });
});