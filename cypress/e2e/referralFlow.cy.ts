describe('Referral Flow E2E Tests', () => {
  beforeEach(() => {
    cy.clearAppData();
    cy.intercept('GET', '**/rest/v1/referrals*', {
      statusCode: 200,
      body: [],
    }).as('fetchReferrals');

    cy.intercept('GET', '**/rest/v1/referral_rewards*', {
      statusCode: 200,
      body: [],
    }).as('fetchRewards');

    cy.intercept('GET', '**/rest/v1/referral_settings*', {
      statusCode: 200,
      body: [
        { referral_level: 1, token_reward: 50, active: true },
        { referral_level: 2, token_reward: 30, active: true },
        { referral_level: 3, token_reward: 20, active: true },
        { referral_level: 4, token_reward: 10, active: true },
        { referral_level: 5, token_reward: 5, active: true },
      ],
    }).as('fetchSettings');
  });

  it('allows business referral link generation and signup', () => {
    // Mock the referral data fetch
    cy.intercept('GET', '**/rest/v1/referrals*', {
      statusCode: 200,
      body: [],
    }).as('fetchReferrals');

    cy.intercept('GET', '**/rest/v1/referral_rewards*', {
      statusCode: 200,
      body: [],
    }).as('fetchRewards');

    cy.intercept('GET', '**/rest/v1/referral_settings*', {
      statusCode: 200,
      body: [
        { referral_level: 1, token_reward: 50, active: true },
        { referral_level: 2, token_reward: 30, active: true },
        { referral_level: 3, token_reward: 20, active: true },
        { referral_level: 4, token_reward: 10, active: true },
        { referral_level: 5, token_reward: 5, active: true },
      ],
    }).as('fetchSettings');

    // 1. Log in as a referrer (existing user)
    cy.login('referrer@example.com', 'password123');

    // 2. Navigate to the referral page
    cy.visit('/referrals');
    cy.url().should('include', '/referrals');
    cy.waitForPageLoad();

    // 3. Wait for referral data to load
    cy.wait(['@fetchReferrals', '@fetchRewards', '@fetchSettings']);

    // 4. Select a landing page (e.g., Business Tagging)
    cy.get('select').contains('Landing Page Destination').parent().find('select').select('/business-tagging');

    // 5. Get the generated referral URL
    cy.get('input[readonly]').should('contain.value', '/business-tagging?ref=').invoke('val').then((referralUrl) => {
      expect(referralUrl).to.include('/business-tagging?ref=');
      const code = (referralUrl as string).split('ref=')[1];
      expect(code).to.not.be.empty;

      // 6. Log out the referrer
      cy.logout();

      // 7. Visit the referral URL as a new user
      cy.visit(referralUrl as string);
      cy.url().should('include', '/business-tagging');
      cy.url().should('include', `ref=${code}`);

      // 8. Navigate to signup (business landing pages redirect to signup)
      cy.contains('Get Started').click();
      cy.url().should('include', '/influencer-signup');
      cy.url().should('include', `ref=${code}`);

      // 9. Mock the signup process
      cy.intercept('POST', '**/auth/v1/signup', {
        statusCode: 200,
        body: {
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
          },
        },
      }).as('signupUser');

      cy.intercept('POST', '**/rest/v1/user_profiles', {
        statusCode: 201,
        body: {
          id: 'new-user-id',
          email: 'newuser@example.com',
          full_name: 'New Business User',
          role: 'user',
          is_business_user: true,
        },
      }).as('createProfile');

      cy.intercept('POST', '**/rest/v1/user_wallets', {
        statusCode: 201,
        body: {
          user_id: 'new-user-id',
          balance: 50,
        },
      }).as('createWallet');

      cy.intercept('POST', '**/rest/v1/token_transactions', {
        statusCode: 201,
        body: {},
      }).as('createTransaction');

      // 10. Sign up as a new user
      const newUserEmail = `newuser-${Date.now()}@example.com`;
      cy.get('#auth-full-name').type('New Business User');
      cy.get('#auth-email').type(newUserEmail);
      cy.get('#auth-password').type('newpassword123');
      cy.get('button[type="submit"]').click();

      // 11. Verify successful signup
      cy.wait(['@signupUser', '@createProfile', '@createWallet', '@createTransaction']);
      cy.contains('Account created successfully!').should('be.visible');
    });
  });

  it('ensures non-business referral link does not auto-flag as business', () => {
    // Mock referral data
    cy.intercept('GET', '**/rest/v1/referrals*', { body: [] }).as('fetchReferrals');
    cy.intercept('GET', '**/rest/v1/referral_rewards*', { body: [] }).as('fetchRewards');
    cy.intercept('GET', '**/rest/v1/referral_settings*', {
      body: [{ referral_level: 1, token_reward: 50, active: true }],
    }).as('fetchSettings');

    // 1. Log in as a referrer
    cy.login('referrer@example.com', 'password123');

    // 2. Navigate to the referral page
    cy.visit('/referrals');
    cy.wait(['@fetchReferrals', '@fetchRewards', '@fetchSettings']);

    // 4. Select a landing page (e.g., Business Tagging)
    cy.get('select').contains('Landing Page Destination').parent().find('select').select('/general-tagging');

    // 5. Get the generated referral URL
    cy.get('input[readonly]').should('contain.value', '/general-tagging?ref=').invoke('val').then((referralUrl) => {
      const code = (referralUrl as string).split('ref=')[1];
      expect(code).to.not.be.empty;

      // 6. Log out the referrer
      cy.logout();

      // 7. Visit the referral URL as a new user
      cy.visit(referralUrl as string);
      cy.url().should('include', '/general-tagging');

      // 7. Navigate to signup
      cy.contains('Get Started').click();
      cy.url().should('include', '/influencer-signup');

      // 8. Verify the business toggle is available and unchecked
      // Note: This depends on your actual implementation
      // You might need to adjust the selector based on your UI
      cy.get('body').should('not.contain', 'Business signup automatically enabled');
    });
  });

  it('handles referral link generation errors gracefully', () => {
    // Mock error in referral code generation
    cy.intercept('POST', '**/rest/v1/user_profiles', {
      statusCode: 500,
      body: { error: 'Database error' },
    }).as('updateProfileError');

    cy.login('referrer@example.com', 'password123');
    cy.visit('/referrals');

    // Try to copy the referral link when there's an error
    cy.get('button').contains('Copy').click();
    cy.contains('Failed to generate referral code').should('be.visible');
  });
});