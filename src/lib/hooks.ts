import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from '../context/AuthContext';

// ── Generic query hook ──────────────────────────────────────────────────────
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<{ data: T | null; error: any }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await fetcher();
      if (err) setError(err.message || 'An error occurred');
      else setData(result);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── Notifications hook with Realtime ────────────────────────────────────────
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, (payload) => {
        const newN = payload.new as Notification;
        setNotifications((prev) => [newN, ...prev].slice(0, 20));
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetchNotifications };
}

// ── Customers hook ───────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  location: string | null;
  customer_type: 'walk_in' | 'delivery';
  business_id: string | null;
  shop_id: string | null;
  credit_balance: number;
  created_at: string;
}

export function useCustomers(type?: 'walk_in' | 'delivery') {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      let q = supabase.from('customers').select('*').order('full_name');
      if (type) q = q.eq('customer_type', type);
      const { data } = await q;
      if (data) setCustomers(data);
      setLoading(false);
    };
    fetch();
  }, [type]);

  return { customers, loading };
}

// ── Stock requests hook ──────────────────────────────────────────────────────
export interface StockRequest {
  id: string;
  shop_id: string;
  cashier_id: string;
  product_id: string;
  quantity: number;
  request_type: 'addition' | 'reduction';
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles?: { full_name: string };
  water_products?: { size_label: string };
}

export function useStockRequests(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all') {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let q = supabase
      .from('stock_requests')
      .select('*, profiles(full_name), water_products(size_label)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    if (data) setRequests(data as StockRequest[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  return { requests, loading, refetch: fetch };
}

// ── Delivery trips hook ──────────────────────────────────────────────────────
export interface DeliveryTrip {
  id: string;
  driver_id: string;
  shop_id: string;
  trip_date: string;
  dispatch_time: string | null;
  delivery_time: string | null;
  return_time: string | null;
  status: 'pending' | 'dispatched' | 'delivered' | 'returned';
  notes: string | null;
  profiles?: { full_name: string };
}

export function useDeliveryTrips(date?: string) {
  const { user, role } = useAuth();
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const today = date || new Date().toISOString().split('T')[0];
    let q = supabase
      .from('delivery_trips')
      .select('*, profiles(full_name)')
      .eq('trip_date', today)
      .order('created_at', { ascending: false });
    if (role === 'driver' && user) q = q.eq('driver_id', user.id);
    const { data } = await q;
    if (data) setTrips(data as DeliveryTrip[]);
    setLoading(false);
  }, [date, role, user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { trips, loading, refetch: fetch };
}

// ── Driver daily log hook ────────────────────────────────────────────────────
export interface DriverDailyLog {
  id: string;
  driver_id: string;
  log_date: string;
  opening_lorry_load: number | null;
  closing_lorry_load: number | null;
  opening_mileage: number | null;
  closing_mileage: number | null;
  opened_at: string | null;
  closed_at: string | null;
}

export function useDriverDailyLog() {
  const { user } = useAuth();
  const [log, setLog] = useState<DriverDailyLog | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('driver_daily_logs')
      .select('*')
      .eq('driver_id', user.id)
      .eq('log_date', today)
      .maybeSingle();
    setLog(data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { log, loading, refetch: fetch };
}
