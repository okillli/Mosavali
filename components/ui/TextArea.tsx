import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.memo<TextAreaProps>(function TextArea({
  label,
  error,
  className,
  rows = 3,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <textarea
        className={`w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 ${className}`}
        rows={rows}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
});
