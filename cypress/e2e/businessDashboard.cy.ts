describe('Business Dashboard E2E Tests', () => {
  beforeEach(() => {
    cy.clearAppData();

    // Mock business user profile
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      statusCode: 200,
      body: [
        {
          id: 'business-user-id',
          email: 'business@example.com',
          full_name: 'Business Owner',
          role: 'user',
          is_business_user: true,
        },
      ],
    }).as('fetchProfile');

    // Mock business products
    cy.intercept('POST', '**/rpc/get_business_products', {
      statusCode: 200,
      body: [
        {
          id: 'product-1',
          product_name: 'Existing Product',
          serial_number: 'SN-EXISTING-001',
          description: 'An existing product',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('fetchProducts');
  });

  it('allows business user to access dashboard and register products', () => {
    // 1. Log in as a business user
    cy.login('business@example.com', 'password123');

    // 2. Navigate to the business dashboard
    cy.visit('/business-dashboard');
    cy.url().should('include', '/business-dashboard');
    cy.wait(['@fetchProfile', '@fetchProducts']);

    // 3. Verify dashboard elements are visible
    cy.contains('Business Dashboard').should('be.visible');
    cy.contains('Register New Product').should('be.visible');
    cy.contains('Total Products').should('be.visible');
    cy.contains('Existing Product').should('be.visible');

    // 4. Simulate registering a new product
    cy.intercept('POST', '**/rpc/register_product', {
      statusCode: 200,
      body: {
        success: true,
        product_id: 'new-product-id',
      },
    }).as('registerProduct');

    cy.contains('Register New Product').click();
    cy.get('h3').contains('Register New Product').should('be.visible');

    // 5. Fill out the product registration form
    const productName = `Test Product ${Date.now()}`;
    const serialNumber = `SN-${Date.now()}`;

    cy.get('input[name="product_name"]').type(productName);
    cy.get('input[name="serial_number"]').type(serialNumber);
    cy.get('textarea').type('This is a test product description.');
    cy.get('button[type="submit"]').contains('Register Product').click();
    cy.wait('@registerProduct');

    // 6. Simulate viewing scan history
    cy.intercept('POST', '**/rpc/get_product_scan_history', {
      statusCode: 200,
      body: {
        success: true,
        scan_history: [
          {
            id: 'scan1',
            scanned_at: new Date().toISOString(),
            location: 'London, UK',
            ip_address: '192.168.1.1',
            device_info: 'Cypress Test Browser',
          },
        ],
      },
    }).as('getScanHistory');
  });

  it('prevents regular user from accessing business dashboard', () => {
    // Mock regular user profile
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      statusCode: 200,
      body: [
        {
          id: 'regular-user-id',
          email: 'regular@example.com',
          full_name: 'Regular User',
          role: 'user',
          is_business_user: false,
        },
      ],
    }).as('fetchRegularProfile');

    // 1. Log in as a regular user
    cy.login('regular@example.com', 'password123');

    // 2. Try to access business dashboard
    cy.visit('/business-dashboard');
    cy.wait('@fetchRegularProfile');

    // 3. Verify access denied message
    cy.contains('Not a Business User').should('be.visible');
    cy.contains('You need to be registered as a business user').should('be.visible');
    cy.contains('Go to Profile Settings').should('be.visible');
  });

  it('handles product registration errors', () => {
    // Mock business user
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      body: [{ id: 'business-user-id', is_business_user: true }],
    }).as('fetchProfile');

    cy.intercept('POST', '**/rpc/get_business_products', { body: [] }).as('fetchProducts');

    // Mock registration error
    cy.intercept('POST', '**/rpc/register_product', {
      statusCode: 400,
      body: {
        success: false,
        error: 'Serial number already exists',
      },
    }).as('registerProductError');

    cy.login('business@example.com', 'password123');
    cy.visit('/business-dashboard');
    cy.wait(['@fetchProfile', '@fetchProducts']);

    cy.contains('Register New Product').click();
    cy.get('input[name="product_name"]').type('Duplicate Product');
    cy.get('input[name="serial_number"]').type('DUPLICATE-SN');
    cy.get('button[type="submit"]').contains('Register Product').click();

    cy.wait('@registerProductError');
    cy.contains('Serial number already exists').should('be.visible');
  });

  it('allows copying QR code URL', () => {
    // Mock clipboard API
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });

    // Mock business user and products
    cy.intercept('GET', '**/rest/v1/user_profiles*', {
      body: [{ id: 'business-user-id', is_business_user: true }],
    }).as('fetchProfile');

    cy.intercept('POST', '**/rpc/get_business_products', {
      body: [
        {
          id: 'product-1',
          product_name: 'Test Product',
          serial_number: 'SN-TEST-001',
          created_at: new Date().toISOString(),
        },
      ],
    }).as('fetchProducts');

    cy.login('business@example.com', 'password123');
    cy.visit('/business-dashboard');
    cy.wait(['@fetchProfile', '@fetchProducts']);

    cy.get('button').contains('Copy URL').click();
    cy.contains('QR Code URL copied to clipboard!').should('be.visible');

    cy.window().its('navigator.clipboard.writeText').should('have.been.calledWith', 
      Cypress.sinon.match(/\/verify\/SN-TEST-001$/)
    );
  });
});