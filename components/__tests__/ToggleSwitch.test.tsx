import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToggleSwitch } from '../ToggleSwitch';

describe('ToggleSwitch', () => {
  const defaultProps = {
    id: 'test-toggle',
    checked: false,
    onChange: jest.fn(),
    label: 'Test Toggle'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza correctamente', () => {
    render(<ToggleSwitch {...defaultProps} />);
    
    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('llama a onChange cuando se hace clic', () => {
    render(<ToggleSwitch {...defaultProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(defaultProps.onChange).toHaveBeenCalledWith(true);
  });

  test('muestra el estado correcto cuando está activado', () => {
    render(<ToggleSwitch {...defaultProps} checked={true} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  test('muestra el estado correcto cuando está desactivado', () => {
    render(<ToggleSwitch {...defaultProps} checked={false} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  test('maneja correctamente cuando no hay label', () => {
    render(<ToggleSwitch id="no-label" checked={false} onChange={jest.fn()} />);
    
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
}); 