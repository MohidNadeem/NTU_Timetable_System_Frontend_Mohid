import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function useDashboardPing(path) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    api.get(path)
      .then((data) => {
        if (cancelled) return;
        console.log(`[dashboard] ${path} ->`, data);
        setMessage(data.message);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[dashboard] ${path} failed`, err);
        setError(err.message);
      });

    return () => { cancelled = true; };
  }, [path]);

  return { message, error };
}
