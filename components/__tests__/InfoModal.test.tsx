import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InfoModal } from '../InfoModal';

describe('InfoModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Título',
    children: <div>Mensaje de prueba</div>
  };

  test('renderiza correctamente', () => {
    render(<InfoModal {...defaultProps} />);
  });
}); 