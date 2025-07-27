import { renderHook, act } from '@testing-library/react';
import { useReferrals } from './useReferrals';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Mock the entire supabase module
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ subscription: { unsubscribe: jest.fn() } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(),
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
    })),
    rpc: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
    })),
  },
}));

// Mock useAuth to control authentication state for the hook
jest.mock('./useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', props, children),
  },
}));

describe('useReferrals', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    // Silence console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock for authenticated user
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      profile: { 
        id: 'test-user-id', 
        full_name: 'Test User', 
        email: 'test@example.com', 
        referral_code: 'testcode', 
        role: 'user' 
      },
      isAuthenticated: true,
      loading: false,
      initialized: true,
      refreshProfile: jest.fn(),
    });

    // Set up default mock responses for supabase
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [{ referral_code: 'newtestcode' }], error: null })
      }),
    });
    
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });
  });

  it('should generate a referral code and URL', async () => {
    // Mock the profile to not have a referral code initially
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      profile: { 
        id: 'test-user-id', 
        full_name: 'Test User', 
        email: 'test@example.com', 
        referral_code: null, 
        role: 'user' 
      },
      isAuthenticated: true,
      loading: false,
      initialized: true,
      refreshProfile: jest.fn(),
    });

    const { result } = renderHook(() => useReferrals());

    let generatedCode: string | null = null;
    await act(async () => {
      generatedCode = await result.current.generateReferralCode();
    });

    expect(generatedCode).not.toBeNull();
    expect(generatedCode).toMatch(/^[a-z0-9]+$/); // Basic format check

    let referralUrl: string | null = null;
    await act(async () => {
      referralUrl = await result.current.getReferralUrl();
    });

    expect(referralUrl).toContain('/influencer-signup?ref=');
  });

  it('should generate correct URL for different landing pages', async () => {
    const { result } = renderHook(() => useReferrals());

    let url1: string | null = null;
    await act(async () => {
      url1 = await result.current.getReferralUrlForLandingPage('/general-tagging');
    });
    expect(url1).toContain('/general-tagging?ref=testcode');

    let url2: string | null = null;
    await act(async () => {
      url2 = await result.current.getReferralUrlForLandingPage('/business-tagging');
    });
    expect(url2).toContain('/business-tagging?ref=testcode');
  });

  it('should handle loading states correctly', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      isAuthenticated: false,
      loading: true,
      initialized: false,
      refreshProfile: jest.fn(),
    });

    const { result } = renderHook(() => useReferrals());

    expect(result.current.loading).toBe(false); // Should not be loading if not authenticated
    expect(result.current.stats.totalReferred).toBe(0);
  });

  it('should handle errors gracefully', async () => {
    // Mock supabase to return an error
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockRejectedValue(new Error('Failed to fetch referrals')),
      single: jest.fn().mockRejectedValue(new Error('Failed to fetch referrals')),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockRejectedValue(new Error('Failed to fetch referrals')),
    });

    const { result } = renderHook(() => useReferrals());

    await act(async () => {
      await result.current.forceRefresh();
    });

    expect(result.current.error).toBe('Failed to load referral data');
  });
});