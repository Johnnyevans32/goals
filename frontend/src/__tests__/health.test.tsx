import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple test to verify Jest setup works
describe('Frontend Health Check', () => {
  it('should render a basic component', () => {
    const TestComponent = () => <div>Hello World</div>;
    render(<TestComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should verify that testing utilities are working', () => {
    expect(true).toBe(true);
  });

  it('should test React component functionality', () => {
    const TestButton = ({ onClick }: { onClick: () => void }) => (
      <button onClick={onClick}>Click me</button>
    );
    
    const mockClick = jest.fn();
    render(<TestButton onClick={mockClick} />);
    
    const button = screen.getByRole('button');
    button.click();
    
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});