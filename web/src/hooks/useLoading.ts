"use client";

import { useState } from 'react';

export function useLoading(initialState = false) {
  const [loading, setLoading] = useState(initialState);

  const withLoading = async <T>(asyncFunction: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await asyncFunction();
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    setLoading,
    withLoading,
  };
}

// Usage:
// const { loading, withLoading } = useLoading();
// await withLoading(() => createBooking(data)); 