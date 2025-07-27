import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { InfluencerReferrals } from './InfluencerReferrals';
import { useAuth } from '../hooks/useAuth';
import { useReferrals } from '../hooks/useReferrals';

// Mock the Layout component to simplify testing
jest.mock('../components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'layout' }, children),
}));

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock useReferrals hook
jest.mock('../hooks/useReferrals', () => ({
  useReferrals: jest.fn(),
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

describe('InfluencerReferrals', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseReferrals = useReferrals as jest.Mock;

  beforeEach(() => {
    // Default mock for authenticated user
    mockUseAuth.mockReturnValue({
      user: { id: 'user123', email: 'test@example.com' },
      profile: { 
        id: 'user123', 
        full_name: 'Test User', 
        email: 'test@example.com', 
        referral_code: 'testrefcode', 
        role: 'user' 
      },
      isAuthenticated: true,
      loading: false,
      initialized: true,
    });

    // Default mock for referral data
    mockUseReferrals.mockReturnValue({
      stats: {
        totalReferred: 5,
        totalEarned: 250,
        pendingRewards: 0,
        levelBreakdown: [
          { referral_level: 1, count: 3, earned: 150 },
          { referral_level: 2, count: 2, earned: 100 },
          { referral_level: 3, count: 0, earned: 0 },
          { referral_level: 4, count: 0, earned: 0 },
          { referral_level: 5, count: 0, earned: 0 },
        ],
      },
      referredUsers: [
        { 
          id: 'ref1', 
          full_name: 'Ref User 1', 
          email: 'ref1@example.com', 
          created_at: '2024-01-01T00:00:00Z', 
          referral_level: 1, 
          status: 'completed', 
          reward_amount: 50 
        },
        { 
          id: 'ref2', 
          full_name: 'Ref User 2', 
          email: 'ref2@example.com', 
          created_at: '2024-01-05T00:00:00Z', 
          referral_level: 1, 
          status: 'completed', 
          reward_amount: 50 
        },
      ],
      referralSettings: [
        { referral_level: 1, token_reward: 50 },
        { referral_level: 2, token_reward: 30 },
        { referral_level: 3, token_reward: 20 },
        { referral_level: 4, token_reward: 10 },
        { referral_level: 5, token_reward: 5 },
      ],
      loading: false,
      error: null,
      getReferralUrl: jest.fn().mockResolvedValue('http://localhost/influencer-signup?ref=testrefcode'),
      getReferralUrlForLandingPage: jest.fn((path) => Promise.resolve(`http://localhost${path}?ref=testrefcode`)),
      refreshData: jest.fn(),
      forceRefresh: jest.fn(),
      generateReferralCode: jest.fn().mockResolvedValue('testrefcode'),
      processReferralSignup: jest.fn(),
    });
  });

  it('renders loading state initially', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      isAuthenticated: false,
      loading: true,
      initialized: false,
    });

    render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects if not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      isAuthenticated: false,
      loading: false,
      initialized: true,
    });

    const { container } = render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    // The component should render a Navigate component, which doesn't render visible content
    expect(container.firstChild).toBeNull();
  });

  it('displays referral stats and link generation section', async () => {
    render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    await waitFor(() => {
      expect(screen.getByText('Influencer Referrals')).toBeInTheDocument();
      expect(screen.getByText('Total Referred')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Total Referred value
    });

    // Check for referral URL input
    const referralUrlInput = screen.getByDisplayValue(/http:\/\/localhost\/influencer-signup\?ref=testrefcode/);
    expect(referralUrlInput).toBeInTheDocument();
  });

  it('updates referral URL when landing page selection changes', async () => {
    const mockGetReferralUrlForLandingPage = jest.fn()
      .mockResolvedValueOnce('http://localhost/influencer-signup?ref=testrefcode')
      .mockResolvedValueOnce('http://localhost/general-tagging?ref=testrefcode');

    mockUseReferrals.mockReturnValue({
      ...mockUseReferrals().mockReturnValue(),
      getReferralUrlForLandingPage: mockGetReferralUrlForLandingPage,
    });

    render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/http:\/\/localhost\/influencer-signup\?ref=testrefcode/)).toBeInTheDocument();
    });

    // Simulate changing the landing page selection
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: '/general-tagging' } });

    await waitFor(() => {
      expect(mockGetReferralUrlForLandingPage).toHaveBeenCalledWith('/general-tagging');
    });
  });

  it('copies referral URL to clipboard', async () => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });

    render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue(/http:\/\/localhost\/influencer-signup\?ref=testrefcode/)).toBeInTheDocument();
    });

    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost/influencer-signup?ref=testrefcode');
      expect(require('react-hot-toast').success).toHaveBeenCalledWith('Referral URL copied to clipboard!');
    });
  });

  it('displays referred users list', async () => {
    render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    await waitFor(() => {
      expect(screen.getByText('Referred Users')).toBeInTheDocument();
      expect(screen.getByText('Ref User 1')).toBeInTheDocument();
      expect(screen.getByText('ref1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Ref User 2')).toBeInTheDocument();
    });
  });

  it('handles error state', () => {
    mockUseReferrals.mockReturnValue({
      ...mockUseReferrals().mockReturnValue(),
      loading: false,
      error: 'Failed to load referral data',
    });

    render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    expect(screen.getByText('Failed to load referral data')).toBeInTheDocument();
  });

  it('shows empty state when no referrals exist', () => {
    mockUseReferrals.mockReturnValue({
      ...mockUseReferrals().mockReturnValue(),
      stats: {
        totalReferred: 0,
        totalEarned: 0,
        pendingRewards: 0,
        levelBreakdown: [
          { referral_level: 1, count: 0, earned: 0 },
          { referral_level: 2, count: 0, earned: 0 },
          { referral_level: 3, count: 0, earned: 0 },
          { referral_level: 4, count: 0, earned: 0 },
          { referral_level: 5, count: 0, earned: 0 },
        ],
      },
      referredUsers: [],
    });

    render(
      React.createElement(Router, null,
        React.createElement(InfluencerReferrals)
      )
    );

    expect(screen.getByText('No referrals yet')).toBeInTheDocument();
    expect(screen.getByText('Start sharing your referral link to earn tokens!')).toBeInTheDocument();
  });
});