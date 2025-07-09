import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useTokens = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      // Fetch wallet balance
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalance(wallet.balance);
      }

      // Fetch recent transactions
      const { data: transactionData } = await supabase
        .from('token_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionData) {
        setTransactions(transactionData);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
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
      await fetchWalletData(); // Refresh data
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
      await fetchWalletData(); // Refresh data
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
    refreshWallet: fetchWalletData,
  };
};