import React from 'react';
import { Loader2 } from 'lucide-react';
import { STRINGS } from '../lib/strings';

export const PageLoader: React.FC = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[50vh]"
      data-testid="page-loader"
    >
      <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
      <p className="text-gray-500 text-sm">{STRINGS.LOADING}</p>
    </div>
  );
};
