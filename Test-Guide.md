# TagMyThing - External Testing Guide

**Version:** 1.0  
**Date:** November 27, 2025  
**Environment:** Production (https://tagmything.com)

Welcome to the TagMyThing testing program! This guide will walk you through testing all major features of our digital asset tagging platform. Your feedback is invaluable in helping us deliver a robust user experience.

---

## 📋 Testing Overview

TagMyThing is a digital asset tagging system that allows users to document ownership of items with secure, timestamped, and verifiable records. Test all core features systematically using this guide.

### 🎯 Testing Objectives
- Verify core asset tagging functionality
- Test token economy and transactions
- Validate referral system mechanics
- Check Next-of-Kin (NOK) and Dead Man's Switch features
- Ensure business features work correctly
- Test authentication and security features

---

## 🚀 Getting Started

### Test Environment Setup
1. **Access the app:** https://tagmything.com
2. **Device requirements:** Mobile device with camera (recommended) or desktop with webcam
3. **Browser:** Chrome, Safari, or Firefox (latest versions)
4. **Network:** Stable internet connection for uploads

### Test Account Strategy
Create multiple test accounts to fully test referral and NOK features:
- **Primary Account:** Your main testing account
- **Secondary Account:** For referral testing
- **NOK Account:** For Next-of-Kin feature testing

---

## 📱 Test Scenarios

### 1. Account Creation & Authentication

#### 1.1 Standard User Signup
**Path:** `/auth`
- [ ] Visit the signup page
- [ ] Enter valid email and password
- [ ] Verify email confirmation process
- [ ] Check that you receive **50 TMT tokens** upon signup
- [ ] Confirm user profile is created with correct information

**Expected Results:**
- Account created successfully
- Email verification required and working
- 50 TMT tokens credited automatically
- Access to main dashboard

#### 1.2 Business User Signup  
**Path:** `/business-auth`
- [ ] Visit business signup page
- [ ] Complete business registration form
- [ ] Verify business-specific features are available
- [ ] Check **50 TMT tokens** are credited
- [ ] Test access to product verification tools

**Expected Results:**
- Business account created with enhanced features
- Product verification and QR code tools accessible
- 50 TMT starting balance

#### 1.3 Referral Signup
**Prerequisites:** Obtain a referral code from another user
- [ ] Visit signup with referral link (`?ref=code`)
- [ ] Complete registration process
- [ ] Verify referrer receives appropriate rewards
- [ ] Check your account shows referral relationship

**Expected Results:**
- Signup completes with referral attribution
- Referrer receives tokens (50 TMT for Level 1)
- Referral chain properly established

---

### 2. Core Asset Tagging

#### 2.1 Photo Tagging
**Cost:** 25 TMT per photo
- [ ] Navigate to dashboard and click "Tag Now" or similar
- [ ] Grant camera permissions when prompted
- [ ] Take a photo of a physical item
- [ ] Fill in asset details:
  - [ ] Title (required)
  - [ ] Description
  - [ ] Tags/categories
  - [ ] Estimated value
  - [ ] Location/GPS data
- [ ] Save the asset
- [ ] Verify 25 TMT tokens are deducted
- [ ] Confirm asset appears on dashboard

**Expected Results:**
- Camera functionality works smoothly
- All metadata fields save correctly
- Token deduction is accurate
- Asset is retrievable from dashboard

#### 2.2 Video Tagging
**Cost:** 60 TMT per video
- [ ] Follow same process but record a video instead
- [ ] Test video upload and processing
- [ ] Verify 60 TMT token deduction
- [ ] Check video playback functionality

**Expected Results:**
- Video recording and upload work
- Higher token cost properly applied
- Video plays back correctly in asset view

#### 2.3 Asset Management
- [ ] View asset details from dashboard
- [ ] Edit asset information
- [ ] Test search functionality for finding assets
- [ ] Organize assets by tags/categories
- [ ] Test asset privacy settings

---

### 3. Token Economy Testing

#### 3.1 Token Balance Management
- [ ] Check initial balance (should be 50 TMT)
- [ ] Monitor balance changes with each tag created
- [ ] Verify transaction history is accurate
- [ ] Test behavior when balance reaches zero

**Expected Results:**
- Accurate token tracking
- Clear transaction history
- Appropriate restrictions when funds are low

#### 3.2 Token Purchases (if available)
- [ ] Navigate to token purchase section
- [ ] Test Stripe payment integration (use test cards if in test mode)
- [ ] Verify tokens are added to balance after purchase
- [ ] Check receipt/transaction confirmation

#### 3.3 Insufficient Funds Scenarios
- [ ] Attempt to tag when balance is below required amount
- [ ] Verify appropriate error messages
- [ ] Check that partial charges don't occur

---

### 4. Referral System Testing

#### 4.1 Creating Referrals
- [ ] Generate your referral code
- [ ] Share referral link with test account
- [ ] Complete signup process using referral link
- [ ] Monitor token rewards:
  - **Level 1:** 50 TMT for direct referral
  - **Level 2:** 30 TMT when your referral refers someone
  - **Level 3:** 20 TMT (and so on down to Level 5: 5 TMT)

#### 4.2 Multi-Level Referral Chain
Create a test chain: You → Account A → Account B → Account C
- [ ] Verify you receive rewards from all levels
- [ ] Check that rewards decrease appropriately by level
- [ ] Confirm total potential: 115 TMT per complete chain

#### 4.3 Referral Dashboard
- [ ] View referral statistics
- [ ] Track referred users and their activity
- [ ] Monitor cumulative rewards earned

---

### 5. Next-of-Kin (NOK) & Dead Man's Switch

#### 5.1 NOK Setup
**Prerequisites:** Create additional test account for NOK
- [ ] Add a Next-of-Kin contact in settings
- [ ] Provide NOK contact information
- [ ] Configure Dead Man's Switch period (1-5 years)

#### 5.2 Asset Assignment to NOK
- [ ] Select specific assets to assign to NOK
- [ ] Test "mass assignment" feature (assign all assets to one NOK)
- [ ] Configure visibility and access settings

#### 5.3 NOK Experience Testing
**Using NOK test account:**
- [ ] Receive NOK assignment notification
- [ ] Verify you can see assignment without asset details (privacy protection)
- [ ] Test that asset details are NOT visible before DMS trigger
- [ ] Simulate DMS trigger (if test environment allows)

#### 5.4 NOK Dashboard Features
- [ ] View incoming NOK assignments (assets assigned to you)
- [ ] View outgoing NOK assignments (assets you've assigned)
- [ ] Test NOK reassignment functionality
- [ ] Check upcoming DMS dates and status

---

### 6. Business Features Testing

#### 6.1 Product Verification (Business Accounts Only)
- [ ] Add a product with serial number
- [ ] Generate QR code for product
- [ ] Test QR code scanning with another device
- [ ] Verify scan tracking and history

#### 6.2 QR Code Features
- [ ] Generate QR codes for assets
- [ ] Test QR code scanning functionality
- [ ] Check scan event logging
- [ ] Verify scan history tracking

#### 6.3 Business Dashboard
- [ ] Access business-specific analytics
- [ ] View scan statistics
- [ ] Test product management features

---

### 7. Security & Privacy Testing

#### 7.1 Data Access Controls
- [ ] Verify you can only access your own assets
- [ ] Test that other users' assets are not visible
- [ ] Check privacy settings work correctly

#### 7.2 Phone Number Management
- [ ] Add/update phone number
- [ ] Test phone number validation (numbers only)
- [ ] Verify sync between profile and auth system

#### 7.3 Authentication Security
- [ ] Test password reset functionality
- [ ] Verify email change process
- [ ] Test session management (logout/login)

---

### 8. Mobile & Responsive Testing

#### 8.1 Mobile Experience
- [ ] Test on mobile browser
- [ ] Verify camera access on mobile
- [ ] Check touch interactions
- [ ] Test responsive layout on various screen sizes

#### 8.2 Progressive Web App (PWA)
- [ ] Test "Add to Home Screen" functionality
- [ ] Verify offline capabilities (if any)
- [ ] Check PWA icon and splash screen

---

### 9. Performance & Edge Cases

#### 9.1 File Upload Testing
- [ ] Upload very large photo files
- [ ] Upload long video files
- [ ] Test upload progress indicators
- [ ] Verify file size limits and error messages

#### 9.2 Network Conditions
- [ ] Test with slow internet connection
- [ ] Test behavior when network drops during upload
- [ ] Verify retry mechanisms

#### 9.3 Browser Compatibility
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Check for JavaScript errors in console
- [ ] Verify features work across browsers

---

## 🐛 Bug Reporting Guidelines

When you find issues, please report them with:

### Bug Report Template
```
**Bug Title:** Brief description
**Severity:** High/Medium/Low
**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:** What should happen
**Actual Result:** What actually happened
**Browser/Device:** Chrome on iPhone 14, etc.
**Screenshots/Videos:** If applicable
**Additional Notes:** Any other relevant information
```

### Reporting Channels
- **Email:** tagmything_support@marshallepie.com
- **Subject Line:** [TESTING] Bug Report - [Brief Description]

---

## ✅ Testing Completion Checklist

### Core Features
- [ ] Account creation (Standard & Business)
- [ ] Asset tagging (Photo & Video)
- [ ] Token economy (Balance, purchases, deductions)
- [ ] Referral system (Multi-level rewards)
- [ ] Next-of-Kin setup and assignments
- [ ] Dashboard navigation and asset management

### Advanced Features
- [ ] Dead Man's Switch configuration
- [ ] Business product verification
- [ ] QR code generation and scanning
- [ ] Mobile camera integration
- [ ] Cross-device compatibility

### Security & Performance
- [ ] Data privacy and access controls
- [ ] Authentication flows
- [ ] File upload handling
- [ ] Responsive design testing
- [ ] Error handling and edge cases

---

## 📞 Support & Questions

**Testing Coordinator:** Marshall Epie  
**Email:** marshallepie@marshallepie.com  
**Response Time:** 24-48 hours

### Testing Tips
1. **Document everything:** Screenshot interesting behaviors
2. **Test systematically:** Follow the guide step by step
3. **Think like a user:** Try workflows a real user would follow
4. **Break things:** Try unexpected inputs and sequences
5. **Test across devices:** Mobile and desktop experiences differ

---

**Thank you for helping make TagMyThing better! Your thorough testing ensures a reliable experience for all users.** 🏷️✨