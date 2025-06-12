import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  onSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../utils/firebase';

// Optimized Firestore hook with caching and pagination
export const useOptimizedFirestore = <T>(
  collectionName: string,
  queryConstraints: any[] = [],
  options: {
    enableRealtime?: boolean;
    pageSize?: number;
    cacheKey?: string;
  } = {}
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const { enableRealtime = false, pageSize = 50, cacheKey } = options;

  // Memoize query to prevent unnecessary re-renders
  const firestoreQuery = useMemo(() => {
    const baseQuery = query(
      collection(db, collectionName),
      ...queryConstraints,
      limit(pageSize)
    );
    return baseQuery;
  }, [collectionName, queryConstraints, pageSize]);

  // Load initial data
  const loadData = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      let queryToExecute = firestoreQuery;
      
      if (!reset && lastDoc) {
        queryToExecute = query(
          collection(db, collectionName),
          ...queryConstraints,
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(queryToExecute);
      const newData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      if (reset) {
        setData(newData);
      } else {
        setData(prev => [...prev, ...newData]);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);

      // Cache data if cache key provided
      if (cacheKey && reset) {
        localStorage.setItem(cacheKey, JSON.stringify(newData));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [firestoreQuery, lastDoc, collectionName, queryConstraints, pageSize, cacheKey]);

  // Load more data for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData(false);
    }
  }, [loading, hasMore, loadData]);

  // Refresh data
  const refresh = useCallback(() => {
    setLastDoc(null);
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    // Try to load from cache first
    if (cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
        } catch {
          // Invalid cache, proceed with normal loading
        }
      }
    }

    if (enableRealtime) {
      // Set up real-time listener
      const unsubscribe = onSnapshot(
        firestoreQuery,
        (snapshot) => {
          const newData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          setData(newData);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // Load data once
      loadData(true);
    }
  }, [enableRealtime, firestoreQuery, loadData, cacheKey]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

// Hook for optimized real-time subscriptions with debouncing
export const useRealtimeSubscription = <T>(
  collectionName: string,
  queryConstraints: any[] = [],
  debounceMs = 500
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const firestoreQuery = query(
      collection(db, collectionName),
      ...queryConstraints
    );

    const unsubscribe = onSnapshot(firestoreQuery, (snapshot) => {
      // Debounce rapid updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(newData);
        setLoading(false);
      }, debounceMs);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [collectionName, queryConstraints, debounceMs]);

  return { data, loading };
};

// Hook for batch operations
export const useBatchOperations = () => {
  const [loading, setLoading] = useState(false);

  const executeBatch = useCallback(async (operations: (() => Promise<void>)[]) => {
    setLoading(true);
    try {
      await Promise.all(operations.map(op => op()));
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeBatch, loading };
};