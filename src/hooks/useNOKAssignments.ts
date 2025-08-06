import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface IncomingAssignment {
  assignment_id: string;
  asset_id: string;
  asset_title: string;
  asset_media_url: string | null;
  asset_media_type: string;
  assigner_email: string;
  assigner_full_name: string | null;
  dms_date: string;
  status: 'pending' | 'active' | 'triggered' | 'cancelled';
  access_granted_at: string | null;
  can_view_details: boolean;
  nok_status: 'pending' | 'invited' | 'verified' | 'declined' | 'reverted';
  nok_linked_user_id: string | null;
}

interface OutgoingAssignment {
  assignment_id: string;
  asset_id: string;
  asset_title: string;
  asset_media_url: string;
  asset_media_type: string;
  nok_name: string;
  nok_email: string;
  nok_relationship: string;
  dms_date: string;
  status: 'pending' | 'active' | 'triggered' | 'cancelled';
  access_granted_at: string | null;
  days_until_dms: number;
  nok_status: 'pending' | 'invited' | 'verified' | 'declined' | 'reverted';
  nok_linked_user_id: string | null;
}

interface NOKStats {
  incoming_count: number;
  outgoing_count: number;
  triggered_incoming: number;
  pending_outgoing: number;
  upcoming_dms_count: number;
}

export const useNOKAssignments = () => {
  const [incomingAssignments, setIncomingAssignments] = useState<IncomingAssignment[]>([]);
  const [outgoingAssignments, setOutgoingAssignments] = useState<OutgoingAssignment[]>([]);
  const [stats, setStats] = useState<NOKStats>({
    incoming_count: 0,
    outgoing_count: 0,
    triggered_incoming: 0,
    pending_outgoing: 0,
    upcoming_dms_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isAuthenticated } = useAuth();

  const fetchAssignments = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);

      // Fetch incoming assignments
      const { data: incomingData, error: incomingError } = await supabase
        .rpc('get_user_incoming_nok_assignments');

      if (incomingError) {
        console.error('Error fetching incoming assignments:', incomingError);
        throw incomingError;
      }

      // Fetch outgoing assignments
      const { data: outgoingData, error: outgoingError } = await supabase
        .rpc('get_user_outgoing_nok_assignments');

      if (outgoingError) {
        console.error('Error fetching outgoing assignments:', outgoingError);
        throw outgoingError;
      }

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_nok_assignment_stats');

      if (statsError) {
        console.error('Error fetching NOK stats:', statsError);
        throw statsError;
      }

      setIncomingAssignments(incomingData || []);
      setOutgoingAssignments(outgoingData || []);
      setStats(statsData || {
        incoming_count: 0,
        outgoing_count: 0,
        triggered_incoming: 0,
        pending_outgoing: 0,
        upcoming_dms_count: 0
      });

    } catch (error: any) {
      console.error('Error fetching NOK assignments:', error);
      setError(error.message || 'Failed to load NOK assignments');
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const assignNOKToAsset = async (assetId: string, nokId: string, dmsDate: Date) => {
    try {
      const { data, error } = await supabase.rpc('assign_nok_to_asset_with_dms', {
        p_asset_id: assetId,
        p_nok_id: nokId,
        p_dms_date: dmsDate.toISOString()
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Next of Kin assigned successfully!');
        await fetchAssignments(); // Refresh data
        return true;
      } else {
        toast.error(data?.error || 'Failed to assign Next of Kin');
        return false;
      }
    } catch (error: any) {
      console.error('Error assigning NOK:', error);
      toast.error('Failed to assign Next of Kin');
      return false;
    }
  };

  const massAssignAssetsToNOK = async (nokId: string, dmsDate: Date) => {
    try {
      const { data, error } = await supabase.rpc('mass_assign_assets_to_nok', {
        p_nok_id: nokId,
        p_dms_date: dmsDate.toISOString()
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Successfully assigned ${data.assigned_count} assets to Next of Kin!`);
        await fetchAssignments(); // Refresh data
        return true;
      } else {
        toast.error(data?.error || 'Failed to mass assign assets');
        return false;
      }
    } catch (error: any) {
      console.error('Error mass assigning assets:', error);
      toast.error('Failed to mass assign assets');
      return false;
    }
  };

  const reassignIncomingAssignment = async (assignmentId: string, newNOKId: string) => {
    try {
      const { data, error } = await supabase.rpc('reassign_incoming_nok_assignment', {
        p_assignment_id: assignmentId,
        p_new_nok_id: newNOKId
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Assignment reassigned successfully!');
        await fetchAssignments(); // Refresh data
        return true;
      } else {
        toast.error(data?.error || 'Failed to reassign assignment');
        return false;
      }
    } catch (error: any) {
      console.error('Error reassigning assignment:', error);
      toast.error('Failed to reassign assignment');
      return false;
    }
  };

  const updateUserActivity = async () => {
    try {
      const { error } = await supabase.rpc('update_user_activity');
      if (error) {
        console.error('Error updating user activity:', error);
      }
    } catch (error: any) {
      console.error('Error updating user activity:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAssignments();
      updateUserActivity(); // Update activity on hook initialization
    }
  }, [isAuthenticated, user, fetchAssignments]);

  const getAssignmentMediaUrl = (assignment: IncomingAssignment | OutgoingAssignment): string => {
    return assignment.asset_media_items?.[0]?.url || '';
  };

  const getAssignmentMediaType = (assignment: IncomingAssignment | OutgoingAssignment): string => {
    return assignment.asset_media_items?.[0]?.type || 'photo';
  };

  return {
    incomingAssignments,
    outgoingAssignments,
    stats,
    loading,
    error,
    assignNOKToAsset,
    massAssignAssetsToNOK,
    reassignIncomingAssignment,
    updateUserActivity,
    refreshAssignments: fetchAssignments,
    getAssignmentMediaUrl,
    getAssignmentMediaType
  };
};