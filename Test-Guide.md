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
- [ ] **NEW:** Location permission modal appears after successful signup
- [ ] **NEW:** Choose to enable or disable automatic GPS tracking
- [ ] Verify email confirmation process
- [ ] Check that you receive **50 TMT tokens** upon signup
- [ ] Confirm user profile is created with correct information

**Expected Results:**
- Account created successfully
- Location permission modal shows privacy explanation
- GPS tracking preference is saved based on user choice
- Email verification required and working
- 50 TMT tokens credited automatically
- Access to main dashboard with location toggle (if GPS enabled)

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
  - [ ] **Manual Location Field:** Enter the physical location of the tagged item (e.g., "Kitchen drawer", "Office desk", "Car trunk")
- [ ] **NEW:** If GPS tracking is enabled, app automatically captures your current location where you're using the app
- [ ] Save the asset
- [ ] Verify 25 TMT tokens are deducted
- [ ] Confirm asset appears on dashboard
- [ ] **NEW:** Check that both manual item location and automatic GPS coordinates (if enabled) are stored

**Expected Results:**
- Camera functionality works smoothly
- All metadata fields save correctly
- Manual location field stores where the item is located
- Automatic GPS captures where you used the app (if enabled)
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

### 2.5 GPS Location Tracking (NEW FEATURE)

#### 2.5.1 GPS Permission Setup
**During Signup/Signin:**
- [ ] Complete account creation
- [ ] Location Permission Modal should appear automatically
- [ ] Read privacy explanation and benefits
- [ ] Test both "Enable Location Tracking" and "Skip for Now" options
- [ ] Verify permission preference is saved to profile

#### 2.5.2 Dashboard Location Features
**Path:** `/dashboard`
- [ ] Look for LocationToggle component on dashboard sidebar
- [ ] If GPS enabled, verify current location is displayed
- [ ] Test the toggle switch to enable/disable GPS tracking
- [ ] Click refresh location button (if GPS enabled)
- [ ] Verify location updates in real-time

**Expected Results:**
- Location toggle shows current GPS status
- Current location displayed with formatted address (via Google Maps API)
- Toggle switch properly enables/disables location tracking
- Location updates when refreshed

#### 2.5.3 Automatic Session Tracking
**Background GPS Capture:**
- [ ] Enable GPS tracking from dashboard toggle
- [ ] Navigate around the app (dashboard, tagging, assets)
- [ ] Verify GPS coordinates are automatically captured during session
- [ ] Check that location updates in user profile
- [ ] Test with GPS disabled - verify no location capture

#### 2.5.4 Asset Tagging with GPS
**Two Types of Location Data:**
- [ ] **Manual Item Location:** Enter where the item is physically stored (e.g., "Home office", "Car glove compartment")
- [ ] **Automatic GPS Coordinates:** App captures where YOU are when tagging (if GPS enabled)
- [ ] Tag an item with both location types
- [ ] Verify both are stored separately in the asset record
- [ ] Check that GPS coordinates show your tagging location, not the item's location

**Expected Results:**
- Manual location field stores item's physical storage location
- GPS coordinates automatically capture where you used the app
- Both location types are clearly differentiated
- GPS data only captured when permission is enabled

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

#### 7.4 GPS Privacy & Security (NEW)
**Location Data Protection:**
- [ ] Test location permission modal privacy explanations
- [ ] Verify GPS can be disabled at any time via dashboard toggle
- [ ] Check that location data is not captured when permission is disabled
- [ ] Confirm location data is only used for asset tracking purposes
- [ ] Test that location data is securely stored in user profile
- [ ] Verify no location sharing with third parties (privacy policy compliance)

**Browser Permission Management:**
- [ ] Test browser-level location permission denial
- [ ] Verify app gracefully handles permission errors
- [ ] Check fallback behavior when GPS is unavailable
- [ ] Test location accuracy settings (high accuracy vs. standard)

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
- [ ] **GPS location tracking (Permissions, dashboard toggle, automatic capture)**
- [ ] Referral system (Multi-level rewards)
- [ ] Next-of-Kin setup and assignments
- [ ] Dashboard navigation and asset management

### Advanced Features
- [ ] **GPS-enhanced asset tagging (Dual location capture)**
- [ ] Dead Man's Switch configuration
- [ ] Business product verification
- [ ] QR code generation and scanning
- [ ] Mobile camera integration
- [ ] Cross-device compatibility

### Security & Performance
- [ ] **Location privacy and GPS permission management**
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