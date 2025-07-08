import React from 'react';

interface VersionFlowIndicatorProps {
  versionFlow: string;
  currentVersion: number | null;
  originalVersionId: number | null;
  className?: string;
}

export const VersionFlowIndicator: React.FC<VersionFlowIndicatorProps> = ({
  versionFlow,
  currentVersion,
  originalVersionId,
  className = ''
}) => {
  if (!versionFlow || !currentVersion) {
    return null;
  }

  // Extraer las versiones del flujo para mostrar información adicional
  const flowMatch = versionFlow.match(/v(\d+)\s*→\s*v(\d+)/);
  const fromVersion = flowMatch ? parseInt(flowMatch[1]) : null;
  const toVersion = flowMatch ? parseInt(flowMatch[2]) : null;
  const isJump = fromVersion && toVersion && (toVersion - fromVersion) > 1;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full text-xs font-medium text-blue-700 ${className}`}>
      <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <span className="font-mono">{versionFlow}</span>
      {isJump && (
        <span className="text-orange-600 opacity-75">
          (salto de {toVersion - fromVersion} versiones)
        </span>
      )}
      {originalVersionId && (
        <span className="text-blue-500 opacity-75">
          (base: v{originalVersionId})
        </span>
      )}
    </div>
  );
}; 