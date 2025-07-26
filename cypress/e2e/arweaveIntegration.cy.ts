describe('Arweave Integration E2E Tests', () => {
  it('successfully archives a pending asset to Arweave', () => {
    // Mock user profile and wallet
    cy.clearAppData();

    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      statusCode: 200,
      body: [
        {
          id: 'test-user-id',
          email: 'arweaveuser@example.com',
          full_name: 'Arweave Test User',
          role: 'user',
        },
      ],
    }).as('fetchProfile');

    cy.intercept('GET', '**/rest/v1/user_wallets*', {
      statusCode: 200,
      body: [
        {
          user_id: 'test-user-id',
          balance: 500, // Enough tokens for archiving
        },
      ],
    }).as('fetchWallet');

    // Mock the assets fetch to ensure there's a pending asset
    cy.intercept('GET', '**/rest/v1/assets*', {
      statusCode: 200,
      body: [
        {
          id: 'asset-pending-1',
          user_id: 'test-user-id',
          title: 'Pending Arweave Asset',
          description: 'This asset is waiting to be archived.',
          tags: ['test', 'pending'],
          media_url: 'https://example.com/test.jpg',
          media_type: 'photo',
          privacy: 'private',
          archive_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('fetchAssets');

    // Mock user profile and wallet
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      statusCode: 200,
      body: [
        {
          id: 'test-user-id',
          email: 'arweaveuser@example.com',
          full_name: 'Arweave Test User',
          role: 'user',
        },
      ],
    }).as('fetchProfile');

    cy.intercept('GET', '**/rest/v1/user_wallets*', {
      statusCode: 200,
      body: [
        {
          user_id: 'test-user-id',
          balance: 500, // Enough tokens for archiving
        },
      ],
    }).as('fetchWallet');

    // Mock the assets fetch to ensure there's a pending asset
    cy.intercept('GET', '**/rest/v1/assets*', {
      statusCode: 200,
      body: [
        {
          id: 'asset-pending-1',
          user_id: 'test-user-id',
          title: 'Pending Arweave Asset',
          description: 'This asset is waiting to be archived.',
          tags: ['test', 'pending'],
          media_url: 'https://example.com/test.jpg',
          media_type: 'photo',
          privacy: 'private',
          archive_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('fetchAssets');

    // Mock the RPC call to simulate successful archiving
    cy.intercept('POST', '**/rpc/archive_tag_now', {
      statusCode: 200,
      body: {
        success: true,
        arweave_tx_id: 'mock-arweave-tx-id-12345',
      },
    }).as('archiveAsset');

    // 1. Log in as a user
    cy.login('arweaveuser@example.com', 'password123');
    cy.get('a[href*="arweave.net/mock-arweave-tx-id-12345"]').should('be.visible');
  });

  it('shows error if user has insufficient tokens for archiving', () => {
    // Mock user with insufficient tokens
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      body: [{ id: 'test-user-id', email: 'pooruser@example.com' }],
    }).as('fetchProfile');

    cy.intercept('GET', '**/rest/v1/user_wallets*', {
      body: [{ user_id: 'test-user-id', balance: 50 }], // Not enough for archiving (300 TMT required)
    }).as('fetchWallet');

    cy.intercept('GET', '**/rest/v1/assets*', {
      body: [
        {
          id: 'asset-pending-2',
          title: 'Cannot Archive Asset',
          archive_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('fetchAssets');

    cy.login('pooruser@example.com', 'password123');
    cy.visit('/assets');
    cy.wait(['@fetchProfile', '@fetchWallet', '@fetchAssets']);

    cy.contains('Cannot Archive Asset').parents('[data-testid="asset-card"]').within(() => {
      cy.get('button').contains('Archive').should('be.disabled');
    });

    // Verify tooltip or error message
    cy.contains('Insufficient tokens').should('be.visible');
  });

  it('shows error if user has insufficient tokens for archiving', () => {
    // Mock user with insufficient tokens
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      body: [{ id: 'test-user-id', email: 'pooruser@example.com' }],
    }).as('fetchProfile');

    cy.intercept('GET', '**/rest/v1/user_wallets*', {
      body: [{ user_id: 'test-user-id', balance: 50 }], // Not enough for archiving (300 TMT required)
    }).as('fetchWallet');

    cy.intercept('GET', '**/rest/v1/assets*', {
      body: [
        {
          id: 'asset-pending-2',
          title: 'Cannot Archive Asset',
          archive_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('fetchAssets');

    cy.login('pooruser@example.com', 'password123');
    cy.visit('/assets');
    cy.wait(['@fetchProfile', '@fetchWallet', '@fetchAssets']);

    cy.contains('Cannot Archive Asset').parents('[data-testid="asset-card"]').within(() => {
      cy.get('button').contains('Archive').should('be.disabled');
    });

    // Verify tooltip or error message
    cy.contains('Insufficient tokens').should('be.visible');
  });

  it('shows error if Arweave archiving fails', () => {
    // Mock user with sufficient tokens
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      body: [{ id: 'test-user-id', email: 'arweaveuser@example.com' }],
    }).as('fetchProfile');

    cy.intercept('GET', '**/rest/v1/user_wallets*', {
      body: [{ user_id: 'test-user-id', balance: 500 }],
    }).as('fetchWallet');

    cy.intercept('GET', '**/rest/v1/assets*', {
      body: [
        {
          id: 'asset-pending-3',
          title: 'Failed Archive Asset',
          archive_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('fetchAssets');

    // Mock user with sufficient tokens
    cy.intercept('POST', '**/rpc/archive_tag_now', {
      statusCode: 500,
      body: { error: 'Arweave service unavailable' },
    }).as('archiveAssetFail');

    cy.login('arweaveuser@example.com', 'password123');
    cy.visit('/assets');

    cy.wait(['@fetchProfile', '@fetchWallet', '@fetchAssets']);
    // 4. Verify the toast message and the RPC call
    cy.contains('Failed Archive Asset').parents('[data-testid="asset-card"]').within(() => {
      cy.get('button').contains('Archive').click();
    });

    cy.wait('@archiveAssetFail');
    cy.contains('Asset archived successfully!').should('not.exist');

    // 5. Verify the Arweave link appears
    cy.contains('Failed to archive asset').should('be.visible');
  });
});