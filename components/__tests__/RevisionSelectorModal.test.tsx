import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RevisionSelectorModal } from '../RevisionSelectorModal';

describe('RevisionSelectorModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    evaluations: [],
    onSelect: jest.fn(),
    onContinue: jest.fn(),
    onNew: jest.fn()
  };

  test('renderiza correctamente', () => {
    render(<RevisionSelectorModal {...defaultProps} />);
  });
}); 