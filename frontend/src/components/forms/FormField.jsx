import React from 'react';

const FormField = ({
  label,
  id,
  error,
  helperText,
  required = false,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-maintext tracking-wide"
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}

      {children}

      {error ? (
        <p className="text-xs font-medium text-error mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-subtext mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};

export default FormField;
