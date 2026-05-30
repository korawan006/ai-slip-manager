import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured.');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Insert a transaction into the Supabase `transactions` table.
 * Maps senderName → name column.
 */
export const insertTransaction = async (data, userId = null) => {
  if (!supabase) {
    console.warn('Supabase client is not configured. Skipping insert.');
    return null;
  }

  const row = {
    name: data.senderName || '-',
    date: data.date || new Date().toISOString().split('T')[0],
    time: data.time || new Date().toTimeString().split(' ')[0],
    amount: data.amount ? Number(String(data.amount).replace(/,/g, '')) : 0,
    sender_bank: data.senderBank || '-',
    receiver_bank: data.receiverBank || '-',
    reference_no: data.referenceNo || data.refNo || '-',
  };

  // Attach user_id if provided
  if (userId) {
    row.user_id = userId;
  }

  const { data: result, error } = await supabase
    .from('transactions')
    .insert([row])
    .select();

  if (error) {
    console.error('Error inserting into Supabase:', error);
    throw error;
  }

  return result;
};

/**
 * Fetch all transactions from Supabase, ordered by most recent first.
 */
export const getTransactionsFromSupabase = async () => {
  if (!supabase) {
    console.warn('Supabase client is not configured. Returning empty array.');
    return [];
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching from Supabase:', error);
    return [];
  }

  // Map Supabase column names back to the frontend-friendly format
  return data.map((row) => ({
    id: row.id,
    date: row.date || '',
    time: row.time || '',
    amount: row.amount ? Number(row.amount) : 0,
    senderName: row.name || '',
    senderBank: row.sender_bank || '',
    receiverBank: row.receiver_bank || '',
    referenceNo: row.reference_no || '',
    createdAt: row.created_at || '',
  }));
};
