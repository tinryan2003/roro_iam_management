"use client";

import { useState } from 'react';

export function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (name: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when account starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const setError = (name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    setError,
    reset,
  };
}

// Usage:
// const { values, errors, handleChange } = useForm({ 
//   customerName: '', 
//   vehicleType: '', 
//   route: '' 
// }); 