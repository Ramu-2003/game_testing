const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const phaseSchema = {
    phase1: { type: Number, default: 0 },
    phase2: { type: Number, default: 0 },
    phase3: { type: Number, default: 0 },
    phase4: { type: Number, default: 0 },
    phase5: { type: Number, default: 0 },
    phase6: { type: Number, default: 0 },
    phase7: { type: Number, default: 0 },
    phase8: { type: Number, default: 0 },
    phase9: { type: Number, default: 0 },
    phase10: { type: Number, default: 0 },
};

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    uid: { type: String, unique: true, sparse: true },
    gender: { type: String, enum: ['male', 'female'], required: false },
    bio: { type: String, default: 'Add some things about you' },
    profileImage: { type: String, default: '/assets/profile-images/male_human_01.png' },
    isPublic: { type: Boolean, default: true },
    nameChangeCount: { type: Number, default: 0 },
    rankPoints: { type: Number, default: 0 },
    profileSetupComplete: { type: Boolean, default: false },
    winsVsBots: { type: [Number], default: [0, 0, 0, 0, 0] },
    lossesVsBots: { type: [Number], default: [0, 0, 0, 0, 0] },
    // G-THUNDER Points System
    gThunderPoints: { type: Number, default: 20 },
    // XP Points System
    xpPoints: { type: Number, default: 0 },
    dailyRewards: {
        currentDay: { type: Number, default: 0 },
        lastClaimTime: { type: Date, default: null },
        lastClaimDate: { type: String, default: null }, // Store date as YYYY-MM-DD
        canClaimAt: { type: Date, default: null },
    },
    adsWatched: {
        count: { type: Number, default: 0 },
        lastResetDate: { type: String, default: null }, // Store date as YYYY-MM-DD
        adTimestamps: { type: [Date], default: [] },
        canWatchAt: { type: Date, default: null },
    },
    // Level Progress Tracking (10 phases; each can grow to 100 levels)
    levelProgress: {
        html: {
            ...phaseSchema,
            phase1: { type: Number, default: 1 }, // Phase 1 unlocked by default
        },
        css: {
            ...phaseSchema,
        },
        javascript: {
            ...phaseSchema,
        },
        python: {
            ...phaseSchema,
        },
        java: {
            ...phaseSchema,
        },
    },
    completedLevels: [{
        course: String, // 'html', 'css', 'javascript', 'python', 'java'
        phase: Number, // 1-10
        level: Number, // 1-100
        xpEarned: Number,
        completedAt: { type: Date, default: Date.now }
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
