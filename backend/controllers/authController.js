const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const levelsRegistry = require('../data/levelsRegistry.json');
const { getPhaseLevelCounts } = require('../utils/curriculumStats');
const RewardTransaction = require('../models/RewardTransaction');
const { claimDailyXp, awardXpOnce } = require('../services/rewards');
const { verifyLevelCompletionProof } = require('../utils/completionProof');
const { getLevelCompletionDecision } = require('../utils/levelProgression');

const DUMMY_PASSWORD_HASH = bcrypt.hash('game-trail-invalid-account-password', 12);
const PROFILE_IMAGE_PATTERN = /^\/assets\/profile-images\/(?:male|female)_human_(?:0[1-9]|[1-4][0-9]|50)\.png$/;

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validNewPassword(value) {
  return typeof value === 'string'
    && Buffer.byteLength(value, 'utf8') >= 8
    && Buffer.byteLength(value, 'utf8') <= 72;
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

async function findUserByResetToken(token) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) return null;
  return User.findOne({
    resetPasswordToken: { $in: [hashResetToken(token), token] },
    resetPasswordExpires: { $gt: Date.now() },
  });
}

async function findUserByEmail(email) {
  const exact = await User.findOne({ email });
  if (exact || !email) return exact;
  // The case-insensitive fallback keeps accounts created before email
  // normalization able to sign in while new addresses are stored lowercase.
  return User.findOne({ email: new RegExp(`^${escapeRegExp(email)}$`, 'i') });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function logAuthFailure(action, error) {
  console.error(`[Auth] ${action} failed:`, error?.code || error?.name || 'UNKNOWN_ERROR');
}

// Configure Gmail SMTP transporter with explicit settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Verify transporter configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.log('⚠️  Gmail SMTP not configured (email features disabled)');
    console.log('   This is OK - Computer Mode will work without email');
    console.log('   To enable email: Check GMAIL_USER and GMAIL_PASS in .env');
  } else {
    console.log('✅ Gmail SMTP Server is ready to send emails');
  }
});

// Test endpoint
exports.testRoute = (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    time: new Date().toISOString() 
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (name.length > 80 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid name and email address.' });
    }

    if (!validNewPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.' });
    }

    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(409).json({ message: 'An account already exists for this email.' });
    }

    const user = new User({ name, email, password });
    await user.save();

    res.json({ message: "Registered Successfully" });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'An account already exists for this email.' });
    }
    logAuthFailure('registration', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const password = req.body?.password;
    
    if (!email || typeof password !== 'string' || email.length > 254 || password.length > 1024) {
      return res.status(400).json({ message: 'Enter a valid email and password.' });
    }

    const user = await findUserByEmail(email.toLowerCase());
    if (!user) {
      await bcrypt.compare(password, await DUMMY_PASSWORD_HASH);
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        username: user.username,
        uid: user.uid,
        bio: user.bio,
        profileImage: user.profileImage,
        isPublic: user.isPublic,
        nameChangeCount: user.nameChangeCount,
        rankPoints: user.rankPoints,
        profileSetupComplete: user.profileSetupComplete
      }
    });
  } catch (err) {
    logAuthFailure('sign-in', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // Security: Don't reveal if user exists or not
      return res.json({ message: "If this email is registered, you will receive a reset link" });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpires = Date.now() + 900000; // 15 minutes (900000 ms)
    await user.save();

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetURL = `${frontend}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: `"GAME IN MY STYLE" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: 'Password Reset - GAME IN MY STYLE',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px;">GAME IN MY STYLE</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #555; line-height: 1.6;">Hello ${escapeHtml(user.name)},</p>
            <p style="color: #555; line-height: 1.6;">You requested a password reset for your GAME IN MY STYLE account.</p>
            <p style="color: #555; line-height: 1.6;">Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetURL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; letter-spacing: 1px;">RESET PASSWORD</a>
            </div>
            
            <p style="color: #666; font-size: 13px; line-height: 1.6;">Or copy and paste this link into your browser:</p>
            <p style="color: #667eea; word-break: break-all; font-size: 12px; background: #f3f4f6; padding: 10px; border-radius: 5px;">${resetURL}</p>
            
            <div style="margin-top: 30px; padding: 15px; background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 5px;">
              <p style="color: #991b1b; font-size: 13px; margin: 0; font-weight: bold;">⚠️ Important Security Notice:</p>
              <p style="color: #991b1b; font-size: 12px; margin: 5px 0 0 0;">This link will expire in 15 minutes for your security.</p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 20px; line-height: 1.5;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            
            <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">© 2026 GAME IN MY STYLE. All rights reserved.</p>
          </div>
        </div>
      `,
    };
    
    // Send email asynchronously (non-blocking)
    transporter.sendMail(mailOptions)
      .then(() => {
        console.log('Password reset email sent.');
      })
      .catch((emailErr) => {
        console.error('Password reset email delivery failed:', emailErr.code || 'SMTP_ERROR');
      });
    
    // Respond immediately without waiting for email
    res.json({ message: "If this email is registered, you will receive a reset link" });
  } catch (err) {
    logAuthFailure('password reset request', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Validate reset token (check if token is still valid)
exports.validateResetToken = async (req, res) => {
  try {
    const user = await findUserByResetToken(req.params.token);

    if (!user) {
      return res.status(400).json({ 
        valid: false, 
        message: "Invalid or expired token" 
      });
    }

    res.json({ 
      valid: true, 
      message: "Token is valid" 
    });
  } catch (err) {
    logAuthFailure('reset-token validation', err);
    res.status(500).json({ 
      valid: false, 
      message: "Server error" 
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    if (!validNewPassword(req.body?.password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.' });
    }

    const user = await findUserByResetToken(req.params.token);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    logAuthFailure('password reset', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    logAuthFailure('profile read', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Setup profile (first time after registration)
exports.setupProfile = async (req, res) => {
  try {
    const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { fullName, username, gender, bio, profileImage } = payload;
    const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : '';
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    
    if (!normalizedFullName || !normalizedUsername || !gender) {
      return res.status(400).json({ message: "Full name, username, and gender are required" });
    }

    if (normalizedFullName.length > 80 || !/^[a-zA-Z0-9_]{1,24}$/.test(normalizedUsername)) {
      return res.status(400).json({ message: 'Name or username has an invalid length or format.' });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ message: "Gender must be either 'male' or 'female'" });
    }

    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 300)) {
      return res.status(400).json({ message: 'Bio must be 300 characters or fewer.' });
    }
    if (profileImage !== undefined && profileImage !== ''
        && (typeof profileImage !== 'string' || !PROFILE_IMAGE_PATTERN.test(profileImage))) {
      return res.status(400).json({ message: 'Choose a profile image from the available avatars.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if username is already taken (by another user)
    if (user.username !== normalizedUsername) {
      const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Generate random 6-digit UID
    let uid;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      // Generate random 6-digit number (100000 to 999999)
      uid = String(Math.floor(100000 + Math.random() * 900000));
      
      // Check if UID already exists
      const existingUid = await User.findOne({ uid });
      if (!existingUid) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ message: "Unable to generate unique UID. Please try again." });
    }

    user.name = normalizedFullName;
    user.username = normalizedUsername;
    user.uid = uid;
    user.gender = gender;
    user.bio = bio || user.bio;
    user.profileImage = profileImage || user.profileImage;
    user.profileSetupComplete = true;
    
    await user.save();

    res.json({ 
      message: "Profile setup complete",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        uid: user.uid,
        gender: user.gender,
        bio: user.bio,
        profileImage: user.profileImage,
        isPublic: user.isPublic,
        nameChangeCount: user.nameChangeCount,
        rankPoints: user.rankPoints,
        profileSetupComplete: user.profileSetupComplete
      }
    });
  } catch (err) {
    logAuthFailure('profile setup', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const payload = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { fullName, username, bio, profileImage, isPublic } = payload;
    const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : fullName;
    const normalizedUsername = typeof username === 'string' ? username.trim() : username;

    if (fullName !== undefined && (typeof fullName !== 'string' || !normalizedFullName || normalizedFullName.length > 80)) {
      return res.status(400).json({ message: 'Name must contain 1–80 characters.' });
    }
    if (username !== undefined && (typeof username !== 'string' || !/^[a-zA-Z0-9_]{1,24}$/.test(normalizedUsername))) {
      return res.status(400).json({ message: 'Username must contain 1–24 letters, numbers, or underscores.' });
    }
    if (bio !== undefined && (typeof bio !== 'string' || bio.length > 300)) {
      return res.status(400).json({ message: 'Bio must be 300 characters or fewer.' });
    }
    if (profileImage !== undefined
        && (typeof profileImage !== 'string' || !PROFILE_IMAGE_PATTERN.test(profileImage))) {
      return res.status(400).json({ message: 'Choose a profile image from the available avatars.' });
    }
    if (isPublic !== undefined && typeof isPublic !== 'boolean') {
      return res.status(400).json({ message: 'Profile visibility must be true or false.' });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if name or username is being changed
    const nameChanged = (normalizedFullName && normalizedFullName !== user.name)
      || (normalizedUsername && normalizedUsername !== user.username);
    
    if (nameChanged && user.nameChangeCount >= 3) {
      return res.status(400).json({ message: "Maximum name changes reached (3/3)" });
    }

    // Check if new username is already taken
    if (normalizedUsername && normalizedUsername !== user.username) {
      const existingUser = await User.findOne({ username: normalizedUsername, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    // Update fields
    if (normalizedFullName) user.name = normalizedFullName;
    if (normalizedUsername) user.username = normalizedUsername;
    if (bio !== undefined) user.bio = bio;
    if (profileImage) user.profileImage = profileImage;
    if (isPublic !== undefined) user.isPublic = isPublic;
    
    if (nameChanged) {
      user.nameChangeCount += 1;
    }

    await user.save();

    res.json({ 
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        uid: user.uid,
        bio: user.bio,
        profileImage: user.profileImage,
        isPublic: user.isPublic,
        nameChangeCount: user.nameChangeCount,
        rankPoints: user.rankPoints,
        profileSetupComplete: user.profileSetupComplete
      }
    });
  } catch (err) {
    logAuthFailure('profile update', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Search user by UID
exports.searchUserByUid = async (req, res) => {
  try {
    const { uid } = req.params;
    
    const user = await User.findOne({ uid }).select('-password -email -resetPasswordToken -resetPasswordExpires');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isPublic) {
      return res.status(403).json({ message: "This user's profile is private" });
    }

    res.json({ 
      user: {
        name: user.name,
        username: user.username,
        uid: user.uid,
        bio: user.bio,
        profileImage: user.profileImage,
        rankPoints: user.rankPoints
      }
    });
  } catch (err) {
    logAuthFailure('user search', err);
    res.status(500).json({ message: "Server error" });
  }
};


// Claim daily reward (XP Points)
exports.claimDailyReward = async (req, res) => {
  try {
    const result = await claimDailyXp(req.user.id);
    if (result.reason === 'USER_NOT_FOUND') return res.status(404).json({ message: 'User not found' });
    if (!result.success) return res.status(400).json({
      message: 'Already claimed today',
      nextClaimDate: result.today,
    });

    return res.json({
      message: 'Daily reward claimed!',
      reward: result.reward,
      newXpBalance: result.newXpBalance,
      nextDay: result.nextDay,
      canClaimTomorrow: true,
      canClaimAt: result.canClaimAt,
    });
  } catch (err) {
    logAuthFailure('daily reward claim', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// No ad provider is configured. Never award XP based on a client-side timer.
exports.watchAd = async (_req, res) => {
  return res.status(503).json({
    message: 'Ad rewards are unavailable until a verified ad provider is configured.',
  });
};

// Get points info
exports.getPointsInfo = async (req, res) => {
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let needsUpdate = false;
    const updates = {};

    if (typeof user.gThunderPoints !== 'number') {
      updates.gThunderPoints = 20;
      needsUpdate = true;
    }

    if (!user.dailyRewards || typeof user.dailyRewards !== 'object') {
      updates['dailyRewards.currentDay'] = 0;
      updates['dailyRewards.lastClaimTime'] = null;
      updates['dailyRewards.canClaimAt'] = null;
      needsUpdate = true;
    } else if (typeof user.dailyRewards.currentDay !== 'number') {
      updates['dailyRewards.currentDay'] = 0;
      needsUpdate = true;
    }

    if (!user.adsWatched || typeof user.adsWatched !== 'object') {
      updates['adsWatched.count'] = 0;
      updates['adsWatched.lastResetDate'] = null;
      updates['adsWatched.canWatchAt'] = null;
      updates['adsWatched.adTimestamps'] = [];
      needsUpdate = true;
    } else {
      if (typeof user.adsWatched.count !== 'number') {
        updates['adsWatched.count'] = 0;
        needsUpdate = true;
      }
      if (!Array.isArray(user.adsWatched.adTimestamps)) {
        updates['adsWatched.adTimestamps'] = [];
        needsUpdate = true;
      }
    }

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    // Filter out timestamps older than 24 hours
    const adTimestamps = (user.adsWatched && Array.isArray(user.adsWatched.adTimestamps)) ? user.adsWatched.adTimestamps : [];
    const validTimestamps = adTimestamps.filter(timestamp => {
      const adTime = new Date(timestamp);
      return (now - adTime) < 24 * 60 * 60 * 1000;
    });

    const availableSlots = Math.max(0, 5 - validTimestamps.length);

    let nextAvailableTime = null;
    if (validTimestamps.length >= 5) {
      const oldestTimestamp = new Date(Math.min(...validTimestamps.map(t => new Date(t))));
      nextAvailableTime = new Date(oldestTimestamp.getTime() + 24 * 60 * 60 * 1000);
    }

    let canClaimAt = (user.dailyRewards && user.dailyRewards.canClaimAt) || null;
    if (user.dailyRewards && user.dailyRewards.lastClaimDate === todayDate && !canClaimAt) {
      canClaimAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      updates['dailyRewards.canClaimAt'] = canClaimAt;
      needsUpdate = true;
    }

    if (validTimestamps.length !== adTimestamps.length || user.adsWatched?.count !== validTimestamps.length) {
      updates['adsWatched.count'] = validTimestamps.length;
      updates['adsWatched.adTimestamps'] = validTimestamps;
      updates['adsWatched.canWatchAt'] = nextAvailableTime;
      needsUpdate = true;
    }

    if (needsUpdate) {
      user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updates },
        { new: true }
      );
    }

    res.json({
      gThunderPoints: user.gThunderPoints || 0,
      xpPoints: user.xpPoints || 0,
      dailyRewards: {
        currentDay: (user.dailyRewards && user.dailyRewards.currentDay) || 0,
        lastClaimTime: user.dailyRewards && user.dailyRewards.lastClaimTime,
        canClaimAt: canClaimAt,
      },
      adsWatched: {
        count: validTimestamps.length,
        remaining: availableSlots,
        canWatchAt: nextAvailableTime,
        adTimestamps: validTimestamps,
      },
    });
  } catch (err) {
    logAuthFailure('points read', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Convert XP to G-THUNDER points
exports.convertXpToGThunder = async (req, res) => {
  try {
    const { xpAmount } = req.body || {};
    const requestId = req.body?.requestId === undefined ? crypto.randomUUID() : req.body.requestId;

    if (!Number.isSafeInteger(xpAmount) || xpAmount < 100) {
      return res.status(400).json({ message: 'Minimum 100 XP required for conversion' });
    }

    if (xpAmount % 100 !== 0) {
      return res.status(400).json({ message: 'XP amount must be a multiple of 100' });
    }
    if (typeof requestId !== 'string' || !requestId.trim() || requestId.length > 128) {
      return res.status(400).json({ message: 'A valid conversion request id is required.' });
    }

    // Convert: 100 XP = 1 G-THUNDER
    const gThunderToAdd = xpAmount / 100;
    const session = await User.db.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const idempotencyKey = `conversion:${requestId}`;
        const existingTransaction = await RewardTransaction.findOne({
          userId: req.user.id,
          currency: 'xp',
          idempotencyKey,
        }).session(session);
        if (existingTransaction) {
          if (existingTransaction.amount !== -xpAmount) {
            result = { conflict: true };
            return;
          }
          const currentUser = await User.findById(req.user.id).session(session);
          result = currentUser ? { updatedUser: currentUser, alreadyProcessed: true } : { missing: true };
          return;
        }
        const existingUser = await User.findById(req.user.id).session(session);
        if (!existingUser) {
          result = { missing: true };
          return;
        }
        const defaults = {};
        if (typeof existingUser.xpPoints !== 'number') defaults.xpPoints = 0;
        if (typeof existingUser.gThunderPoints !== 'number') defaults.gThunderPoints = 20;
        if (Object.keys(defaults).length) {
          await User.updateOne({ _id: req.user.id }, { $set: defaults }, { session });
        }
        const updatedUser = await User.findOneAndUpdate(
          { _id: req.user.id, xpPoints: { $gte: xpAmount } },
          { $inc: { xpPoints: -xpAmount, gThunderPoints: gThunderToAdd } },
          { new: true, session },
        );
        if (!updatedUser) {
          const current = await User.findById(req.user.id).select('xpPoints').session(session);
          result = current ? { insufficient: true, currentXp: current.xpPoints || 0 } : { missing: true };
          return;
        }
        await RewardTransaction.create([{
          userId: req.user.id,
          currency: 'xp',
          amount: -xpAmount,
          source: 'conversion',
          idempotencyKey,
          relatedId: `xp-to-gthunder:${gThunderToAdd}`,
          balanceAfter: updatedUser.xpPoints,
        }], { session });
        result = { updatedUser };
      });
    } finally {
      await session.endSession();
    }

    if (result?.missing) return res.status(404).json({ message: 'User not found' });
    if (result?.conflict) return res.status(409).json({ message: 'This conversion id was already used for a different XP amount.' });
    if (result?.insufficient) {
      return res.status(400).json({
        message: 'Insufficient XP points',
        currentXp: result.currentXp,
        required: xpAmount,
      });
    }
    const updatedUser = result?.updatedUser;
    if (!updatedUser) return res.status(503).json({ message: 'Conversion could not be saved. Please retry.' });

    res.json({
      message: 'Conversion successful!',
      xpSpent: xpAmount,
      gThunderEarned: gThunderToAdd,
      newXpBalance: updatedUser.xpPoints,
      newGThunderBalance: updatedUser.gThunderPoints,
    });
  } catch (err) {
    logAuthFailure('XP conversion', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Complete level and earn XP
exports.completeLevel = async (req, res) => {
  try {
    const { course, phase, level, completionProof, userCode } = req.body || {};
    if (typeof course !== 'string' || !Number.isInteger(phase) || !Number.isInteger(level)) {
      return res.status(400).json({ message: 'A valid course, phase, and level are required' });
    }

    if (!verifyLevelCompletionProof(completionProof, {
      userId: req.user.id,
      course,
      phase,
      level,
      userCode,
    })) {
      return res.status(403).json({ message: 'Validate this level again before claiming its reward' });
    }

    const session = await User.db.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const user = await User.findById(req.user.id).session(session);
        if (!user) { result = { status: 404, body: { message: 'User not found' } }; return; }
        const decision = getLevelCompletionDecision({ course, phase, level, user });
        if (!decision.allowed) {
          const isPhaseLocked = decision.reason === 'phase_locked';
          const isLocked = isPhaseLocked || decision.reason === 'level_locked';
          result = {
            status: isLocked ? 403 : 400,
            body: {
              message: isPhaseLocked ? 'Complete the previous phase first'
                : isLocked ? 'Complete the previous level first' : 'Invalid course, phase, or level',
              unlockedLevel: decision.unlockedLevel,
              previousPhase: decision.previousPhase,
            },
          };
          return;
        }
        if (decision.alreadyCompleted) {
          result = { status: 200, body: {
            message: 'This level was already completed', alreadyCompleted: true,
            xpEarned: 0, newXpBalance: user.xpPoints || 0, nextLevelUnlocked: decision.unlockedLevel,
          } };
          return;
        }

        const xpReward = 50;
        const progressUpdate = { [`levelProgress.${course}.${decision.phaseKey}`]: decision.nextUnlocked };
        if (decision.nextPhaseKey) progressUpdate[`levelProgress.${course}.${decision.nextPhaseKey}`] = 1;
        const updatedUser = await User.findOneAndUpdate(
          { _id: req.user.id, completedLevels: { $not: { $elemMatch: { course, phase, level } } } },
          {
            $set: progressUpdate,
            $push: { completedLevels: { course, phase, level, xpEarned: xpReward, completedAt: new Date() } },
          },
          { new: true, session },
        );
        if (!updatedUser) {
          result = { status: 409, body: { message: 'Progress changed. Refresh and try again.' } };
          return;
        }
        const reward = await awardXpOnce({
          userId: req.user.id,
          amount: xpReward,
          source: 'level',
          idempotencyKey: `level:${course}:${phase}:${level}`,
          relatedId: `${course}:${phase}:${level}`,
          session,
        });
        result = { status: 200, body: {
          message: 'Level completed successfully!', xpEarned: reward.awarded ? xpReward : 0,
          newXpBalance: reward.balance, nextLevelUnlocked: decision.nextUnlocked,
        } };
      });
    } finally {
      await session.endSession();
    }
    return res.status(result?.status || 503).json(result?.body || { message: 'Level reward could not be saved. Please retry.' });
  } catch (err) {
    logAuthFailure('level completion', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get level progress (Phases 1-10)
exports.getLevelProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const defaultPhases = () => ({
      phase1: 0, phase2: 0, phase3: 0, phase4: 0, phase5: 0,
      phase6: 0, phase7: 0, phase8: 0, phase9: 0, phase10: 0
    });

    if (!user.levelProgress) {
      user.levelProgress = {
        html: { ...defaultPhases(), phase1: 1 },
        css: defaultPhases(),
        javascript: defaultPhases(),
        python: defaultPhases(),
        java: defaultPhases(),
      };
      await user.save();
    }

    res.json({
      levelProgress: user.levelProgress,
      completedLevels: user.completedLevels || [],
      phaseLevelCounts: getPhaseLevelCounts(levelsRegistry),
    });
  } catch (err) {
    logAuthFailure('level progress read', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Browser-simulated outcomes are not authoritative and must never grant profile rewards.
exports.updateComputerGameResult = async (_req, res) => res.status(503).json({
  message: 'Computer match rewards are unavailable until match results can be verified by the server.',
});
