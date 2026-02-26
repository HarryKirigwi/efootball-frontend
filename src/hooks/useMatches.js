import { useState, useEffect, useCallback } from 'react';
import { getMatches } from '../api/client';
import { useSocket } from '../context/SocketContext';

export function useMatches() {
  const { matches: socketMatches, setMatchesSnapshot } = useSocket();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [upcoming, ongoing, completed] = await Promise.all([
        getMatches({ status: 'upcoming', published: 1 }).then((r) => r.matches || []),
        getMatches({ status: 'ongoing', published: 1 }).then((r) => r.matches || []),
        getMatches({ status: 'completed', published: 1 }).then((r) => r.matches || []),
      ]);
      setMatchesSnapshot(upcoming, ongoing, completed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [setMatchesSnapshot]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    upcoming: socketMatches.upcoming,
    ongoing: socketMatches.ongoing,
    completed: socketMatches.completed,
    loading,
    error,
    refetch: fetchAll,
  };
}
