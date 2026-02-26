import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const getSocketUrl = () => {
  const base = import.meta.env.VITE_API_BASE;
  if (base && base.startsWith('http')) {
    return base.replace(/\/api\/?$/, '');
  }
  return window.location.origin;
};

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [matches, setMatches] = useState({ upcoming: [], ongoing: [], completed: [] });

  const updateMatchInList = useCallback((matchId, updated) => {
    setMatches((prev) => {
      const put = (list) => {
        const i = list.findIndex((m) => m.id === matchId);
        if (i >= 0) {
          const next = [...list];
          next[i] = { ...next[i], ...updated };
          return next;
        }
        return list;
      };
      const addToOngoing = (list) => {
        if (list.some((m) => m.id === matchId)) return list;
        return [{ ...updated, id: matchId }, ...list];
      };
      const moveToCompleted = (list) => {
        const filtered = list.filter((m) => m.id !== matchId);
        return [...filtered, { ...updated, id: matchId }];
      };
      if (updated.status === 'ongoing') {
        return {
          upcoming: prev.upcoming.filter((m) => m.id !== matchId),
          ongoing: addToOngoing(put(prev.ongoing)),
          completed: prev.completed,
        };
      }
      if (updated.status === 'completed') {
        return {
          upcoming: prev.upcoming,
          ongoing: prev.ongoing.filter((m) => m.id !== matchId),
          completed: moveToCompleted(put(prev.completed)),
        };
      }
      if (updated.home_goals !== undefined || updated.away_goals !== undefined) {
        return {
          ...prev,
          ongoing: put(prev.ongoing),
        };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const url = getSocketUrl();
    const s = io(url, { path: '/socket.io', transports: ['polling', 'websocket'] });
    setSocket(s);

    s.on('match:started', ({ matchId, match }) => {
      updateMatchInList(matchId, { ...match, status: 'ongoing' });
    });
    s.on('match:goal', ({ matchId, home_goals, away_goals }) => {
      updateMatchInList(matchId, { home_goals, away_goals });
    });
    s.on('match:ended', ({ matchId, match }) => {
      updateMatchInList(matchId, { ...match, status: 'completed' });
    });

    return () => {
      s.close();
    };
  }, [updateMatchInList]);

  const setMatchesSnapshot = useCallback((upcoming, ongoing, completed) => {
    setMatches({ upcoming: upcoming || [], ongoing: ongoing || [], completed: completed || [] });
  }, []);

  return (
    <SocketContext.Provider value={{ socket, matches, setMatchesSnapshot, updateMatchInList }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
