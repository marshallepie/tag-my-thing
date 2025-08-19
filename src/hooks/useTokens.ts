import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

// Standalone function to fetch wallet data - can be called from anywhere
export const fetchWalletData = async (userId: string) => {
  try {
    // Fetch wallet balance
    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    // Fetch recent transactions
    const { data: transactionData } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      balance: wallet?.balance || 0,
      transactions: transactionData || []
    };
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return {
      balance: 0,
      transactions: []
    };
  }
};

export const useTokens = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      refreshWallet();
    }
  }, [user]);

  const refreshWallet = async () => {
    if (!user) return;

    setLoading(true);
    const walletData = await fetchWalletData(user.id);
    setBalance(walletData.balance);
    setTransactions(walletData.transactions);
    setLoading(false);
  };

  const spendTokens = async (amount: number, source: string, description?: string) => {
    if (!user || balance < amount) {
      toast.error('Insufficient tokens');
      return false;
    }

    try {
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          amount: -amount,
          type: 'spent',
          source: source as any,
          description,
        });

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ balance: balance - amount })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      setBalance(prev => prev - amount);
      await refreshWallet(); // Refresh data
      return true;
    } catch (error) {
      console.error('Error spending tokens:', error);
      toast.error('Failed to spend tokens');
      return false;
    }
  };

  const earnTokens = async (amount: number, source: string, description?: string) => {
    if (!user) return false;

    try {
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          amount,
          type: 'earned',
          source: source as any,
          description,
        });

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ balance: balance + amount })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      setBalance(prev => prev + amount);
      await refreshWallet(); // Refresh data
      return true;
    } catch (error) {
      console.error('Error earning tokens:', error);
      return false;
    }
  };

  return {
    balance,
    transactions,
    loading,
    spendTokens,
    earnTokens,
    refreshWallet,
  };
};