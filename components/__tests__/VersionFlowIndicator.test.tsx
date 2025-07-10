import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VersionFlowIndicator } from '../VersionFlowIndicator';

describe('VersionFlowIndicator', () => {
  const defaultProps = {
    versionFlow: 'normal',
    currentVersion: 1,
    originalVersionId: null
  };

  test('renderiza correctamente', () => {
    render(<VersionFlowIndicator {...defaultProps} />);
  });
}); 