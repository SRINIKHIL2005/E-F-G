// routes/auth.routes.js using ES modules
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import User from '../models/user.model.js'; // Ensure your User model is exported as default
import { LegalConsent, SecurityLog } from '../models/security.model.js';
import ViolationEnforcer from '../middleware/violations.middleware.js';
import { body, validationResult } from 'express-validator';
import { loginLimiter, apiLimiter } from '../middleware/security.middleware.js';

const router = express.Router();

// Demo/auth fallback - check at runtime (not at module load)
const isDemoAuth = () => process.env.DEMO_AUTH === 'true';
const isDbConnected = () => mongoose.connection.readyState === 1;

const buildDemoUser = (email) => ({
  _id: '000000000000000000000000',
  name: email?.split('@')[0] || 'Demo User',
  email: (email || 'demo@example.com').toLowerCase(),
  role: 'student',
  department: 'General'
});

// Check email availability
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Email is already registered' : 'Email is available'
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email availability'
    });
  }
});

// SIMPLE TEST ROUTE - NO DATABASE, NO VALIDATION
router.post('/test-register', async (req, res) => {
  console.log('🧪 TEST ROUTE: Simple registration test');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  res.status(200).json({
    success: true,
    message: 'Test registration endpoint working!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// QUICK REGISTER WITH UNIQUE EMAIL FOR TESTING
router.post('/register-unique', [
  apiLimiter,
], async (req, res) => {
  try {
    console.log('🚀 UNIQUE REGISTRATION: Generating unique email for testing');
    
    // Generate unique email automatically
    const timestamp = Date.now();
    const uniqueEmail = `test${timestamp}@test.com`;
    
    const registrationData = {
      name: req.body.name || 'Test User',
      email: uniqueEmail,
      password: req.body.password || 'Password123!',
      role: 'student',
      department: req.body.department || 'Computer Science',
      phone: req.body.phone || '1234567890',
      termsVersion: '1.0',
      privacyVersion: '1.0',
      termsOfServiceVersion: '1.0',
      dataProcessingConsent: 'true',
      marketingConsent: true
    };
    
    console.log('📝 Creating user with unique email:', uniqueEmail);
    
    // Create new user
    const user = new User({
      name: registrationData.name,
      email: registrationData.email,
      password: registrationData.password,
      role: registrationData.role,
      department: registrationData.department,
      phone: registrationData.phone
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, uid: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      message: 'Registration successful with unique email!',
      generatedEmail: uniqueEmail
    });
    
  } catch (error) {
    console.error('❌ Unique registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error during unique registration',
      error: error.message
    });
  }
});

// Register a new user with security and legal compliance
router.post('/register', [
  apiLimiter,
  // VALIDATION DISABLED FOR TESTING - ACCEPT ANY DATA
], async (req, res) => {
  try {
    console.log('🚨 BACKEND: ALL VALIDATION DISABLED - ACCEPTING ANY DATA');
    console.log('📝 Request body received:', JSON.stringify(req.body, null, 2));
    
    // SKIP ALL VALIDATION - JUST LOG AND PROCEED
    const errors = validationResult(req);
    console.log('⚠️ Validation check skipped, proceeding with registration...');

    const { 
      name, 
      email, 
      password, 
      role, 
      department,
      phone,
      termsVersion,
      privacyVersion,
      termsOfServiceVersion,
      dataProcessingConsent,
      marketingConsent = false
    } = req.body;
    
    console.log('✅ Extracted data:', {
      name, email, password: password ? '***' : 'MISSING', 
      role, department, phone, termsVersion, privacyVersion, 
      termsOfServiceVersion, dataProcessingConsent, marketingConsent
    });
    
    // Basic safety checks (not validation, just preventing crashes)
    if (!name || !email || !password) {
      console.error('❌ Missing basic required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing basic required fields: name, email, password'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️ User already exists with email:', email);
      
      // Try to log security event, but don't fail if this errors
      try {
        await SecurityLog.create({
          action: 'registration_attempt_existing_email',
          level: 'warning',
          details: {
            email,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          }
        });
      } catch (logError) {
        console.error('❌ Could not log existing email attempt:', logError.message);
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      department,
      phone: phone || undefined, // Only include phone if provided
    });
    
    await user.save();

    // Record legal consent
    const consent = new LegalConsent({
      userId: user._id,
      termsVersion,
      privacyVersion,
      termsOfServiceVersion,
      dataProcessingConsent: dataProcessingConsent === 'true',
      marketingConsent: marketingConsent === 'true',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      consentTimestamp: new Date(),
      isActive: true
    });

    await consent.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, uid: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    // Log successful registration
    try {
      await SecurityLog.create({
        userId: user._id,
        action: 'user_registered',
        level: 'info',
        details: {
          email,
          role,
          department,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (logError) {
      console.error('⚠️ Could not log successful registration:', logError.message);
      // Don't fail the registration if logging fails
    }
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('❌ DETAILED Registration error:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Request body that caused error:', JSON.stringify(req.body, null, 2));
    
    // Try to create security log, but don't fail if this also errors
    try {
      await SecurityLog.create({
        action: 'registration_error',
        level: 'error',
        details: {
          error: error.message,
          errorStack: error.stack,
          requestBody: req.body,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (logError) {
      console.error('❌ Could not log error to SecurityLog:', logError.message);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message, // Include actual error for debugging
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Login user with security checks
router.post('/login', async (req, res) => {
  try {
    // Check demo mode at runtime (after env is loaded)
    const DEMO_AUTH = isDemoAuth();
    console.log('🔐 Login attempt - DEMO_AUTH:', DEMO_AUTH);
    
    // DEMO MODE: Accept any credentials without checks
    if (DEMO_AUTH) {
      const { email } = req.body;
      const demoUser = buildDemoUser(email);
      const token = jwt.sign(
        { id: demoUser._id, role: demoUser.role, uid: demoUser._id },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '30d' }
      );
      console.log('✅ Demo login successful for:', email);
      return res.json({
        success: true,
        token,
        user: {
          id: demoUser._id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          department: demoUser.department,
          lastLogin: new Date()
        },
        requiresConsent: false,
        message: 'Login successful (demo mode)'
      });
    }

    // Apply rate limiting only for real auth
    await new Promise((resolve, reject) => {
      loginLimiter(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Apply validation only for real auth
    await Promise.all([
      body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email').run(req),
      body('password').notEmpty().withMessage('Password is required').run(req)
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Allow demo auth even when DB is connected but user doesn't exist
      if (DEMO_AUTH) {
        const demoUser = buildDemoUser(email);
        const token = jwt.sign(
          { id: demoUser._id, role: demoUser.role, uid: demoUser._id },
          process.env.JWT_SECRET || 'your_jwt_secret',
          { expiresIn: '30d' }
        );
        console.log('✅ Demo login successful for:', email);
        return res.json({
          success: true,
          token,
          user: {
            id: demoUser._id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            department: demoUser.department
          },
          requiresConsent: false,
          message: 'Login successful (demo user created)'
        });
      }
      // Track failed login attempt (only if not in demo mode)
      try {
        await ViolationEnforcer.trackFailedLogin(email, req.ip, req.get('User-Agent'));
      } catch (err) {
        console.error('Error tracking failed login:', err.message);
      }
      
      console.error('Login error: User not found');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check account status
    const accountCheck = await ViolationEnforcer.checkAccountStatus(user._id);
    if (!accountCheck.canAccess) {
      const message = accountCheck.status === 'banned' 
        ? 'Your account has been permanently banned due to violations of our terms of service.'
        : accountCheck.status === 'suspended'
        ? `Your account is temporarily suspended until ${accountCheck.suspensionEnd}. Please contact support if you believe this is an error.`
        : 'Your account is under review. Please contact support for more information.';

      await SecurityLog.create({
        userId: user._id,
        action: 'login_attempt_blocked',
        level: 'warning',
        details: {
          email,
          accountStatus: accountCheck.status,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      return res.status(403).json({
        success: false,
        message,
        accountStatus: accountCheck.status,
        suspensionEnd: accountCheck.suspensionEnd
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (DEMO_AUTH) {
        const demoUser = buildDemoUser(email);
        const token = jwt.sign(
          { id: demoUser._id, role: demoUser.role, uid: demoUser._id },
          process.env.JWT_SECRET || 'your_jwt_secret',
          { expiresIn: '30d' }
        );
        console.log('✅ Demo login successful (password bypass) for:', email);
        return res.json({
          success: true,
          token,
          user: {
            id: demoUser._id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            department: demoUser.department
          },
          requiresConsent: false,
          message: 'Login successful (demo mode)'
        });
      }
      // Track failed login attempt (only if not in demo mode)
      try {
        await ViolationEnforcer.trackFailedLogin(email, req.ip, req.get('User-Agent'));
      } catch (err) {
        console.error('Error tracking failed login:', err.message);
      }
      
      console.error('Login error: Password mismatch');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Reset failed login attempts on successful login
    await ViolationEnforcer.resetFailedLoginAttempts(user._id);

    // Check for valid legal consent
    const currentConsent = await LegalConsent.findOne({
      userId: user._id,
      isActive: true
    }).sort({ consentTimestamp: -1 });

    const requiresConsent = !currentConsent || !currentConsent.dataProcessingConsent;

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role, uid: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' }
    );

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await SecurityLog.create({
      userId: user._id,
      action: 'user_login',
      level: 'info',
      details: {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        requiresConsent
      }
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin
      },
      requiresConsent,
      message: requiresConsent 
        ? 'Please review and accept our updated terms and privacy policy.' 
        : 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    await SecurityLog.create({
      action: 'login_error',
      level: 'error',
      details: {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    res.status(500).json({ 
      success: false,
      message: 'Server error during login' 
    });
  }
});

// Firebase Google Sign-In endpoint
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log('Received Firebase idToken:', idToken);

    // Verify the Firebase ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Decoded Firebase token:', decodedToken);
    
    // Extract user information from decoded token
    const { uid, email, name } = decodedToken;
    
    // Check for an existing user using the email
    let user = await User.findOne({ email });
    if (!user) {
      // Create a new user with default settings for Google sign-in
      user = new User({
        name: name || 'No Name',
        email,
        role: 'student',
        department: 'Computer Science',
        authMethod: 'google',
      });
      await user.save();
    }
    
    // Generate JWT token for your app’s session management
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '30d' } // Changed from '1d' to '30d'
    );

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      token
    });
  } catch (error) {
    console.error('Firebase Google authentication error:', error);
    res.status(401).json({ message: 'Firebase Google authentication failed' });
  }
});

// Google OAuth callback endpoint for redirect flow
router.post('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required'
      });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user information');
    }

    const googleUser = await userResponse.json();

    // Find or create user in database
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });
    
    if (!user) {
      // Create new user
      user = new User({
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.id,
        profilePicture: googleUser.picture,
        role: 'student', // Default role
        department: 'General', // Default department
        isVerified: true, // Google accounts are pre-verified
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      await user.save();
      console.log(`✅ New user created via Google OAuth: ${user.email}`);
    } else {
      // Update existing user
      user.lastLogin = new Date();
      if (!user.googleId) user.googleId = googleUser.id;
      if (!user.profilePicture) user.profilePicture = googleUser.picture;
      await user.save();
      console.log(`✅ Existing user signed in via Google OAuth: ${user.email}`);
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );

    // Return credential (similar to firebase auth)
    const credential = jwt.sign(
      {
        sub: user.googleId || user._id,
        email: user.email,
        name: user.name,
        picture: user.profilePicture
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      credential: credential,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        profilePicture: user.profilePicture
      },
      token: jwtToken
    });

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({
      success: false,
      message: 'OAuth callback failed',
      error: error.message
    });
  }
});

export default router;
