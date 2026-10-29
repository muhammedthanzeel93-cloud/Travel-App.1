'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  KeyRound,
  Compass,
  LogOut,
  Camera,
  Luggage,
  Check
} from 'lucide-react';
import TravelLuggageBox from '@/components/TravelLuggageBox';
import { fetchFromApi } from '@/lib/api';
import {
  getUserSession,
  setUserSession,
  clearUserSession,
  subscribeToUserSession,
  UserSession
} from '@/features/auth/userAuth';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'FORGOT_PASSWORD';
type VerificationChannel = 'email' | 'phone';

export default function HomePage() {
  const router = useRouter();

  // Active User Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Auth Modes: LOGIN | SIGNUP | FORGOT_PASSWORD
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup Form States (3 Steps: 1. Info -> 2. OTP -> 3. Password)
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [signupUsername, setSignupUsername] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupChannel, setSignupChannel] = useState<VerificationChannel>('email');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);
  const [signupOtpPreview, setSignupOtpPreview] = useState<string | null>(null);
  const [signupOtpTimer, setSignupOtpTimer] = useState(60);

  // Forgot Password States (3 Steps: 1. Identifier -> 2. OTP -> 3. New Password)
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotMaskedTarget, setForgotMaskedTarget] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [forgotOtpPreview, setForgotOtpPreview] = useState<string | null>(null);

  // Initial Check for Existing User Session & Verify Administrator Block Status
  useEffect(() => {
    const session = getUserSession();
    if (session) {
      setCurrentUser(session);
      // Immediately verify with server if user has been blocked by administrator
      fetch(`/api/auth/check-status?username=${encodeURIComponent(session.username)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && (data.status === 'BLOCKED' || data.isBlocked)) {
            clearUserSession();
            setCurrentUser(null);
            setLoginError(`Your account (@${session.username}) has been BLOCKED by the administrator. Access is disabled.`);
          }
        })
        .catch(() => {});
    }
    setIsCheckingSession(false);

    const unsubscribe = subscribeToUserSession((updated) => {
      setCurrentUser(updated);
    });

    return () => unsubscribe();
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (signupStep === 2 && signupOtpTimer > 0) {
      interval = setInterval(() => {
        setSignupOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signupStep, signupOtpTimer]);

  // Switch to Forgot Password with prefilled username
  const handleGoToForgotPassword = () => {
    setMode('FORGOT_PASSWORD');
    setForgotStep(1);
    setForgotError(null);
    setForgotSuccessMsg(null);
    if (loginUsername.trim()) {
      setForgotIdentifier(loginUsername.trim());
    }
  };

  // Switch to Signup
  const handleGoToSignup = () => {
    setMode('SIGNUP');
    setSignupStep(1);
    setSignupError(null);
    setSignupSuccessMsg(null);
  };

  // Switch to Login
  const handleGoToLogin = () => {
    setMode('LOGIN');
    setLoginError(null);
  };

  // -------------------------------------------------------------
  // 1. LOGIN HANDLER
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUsername = loginUsername.trim();
    const cleanPassword = loginPassword.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError('Please enter both your username and password.');
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetchFromApi<{
        success: boolean;
        token: string;
        user: any;
        message?: string;
        blocked?: boolean;
      }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            username: cleanUsername,
            identifier: cleanUsername,
            password: cleanPassword
          })
        }
      );

      // Blocked account protection check
      if (res.user && res.user.status === 'BLOCKED') {
        clearUserSession();
        setCurrentUser(null);
        setLoginError(`Your account (@${res.user.username}) has been BLOCKED by the administrator. Access is disabled for this ${res.user.role || 'user'} account.`);
        return;
      }

      if (res.success && res.token && res.user) {
        const session: UserSession = {
          id: res.user.id || `user_${Date.now()}`,
          username: res.user.username,
          name: res.user.name || res.user.username,
          email: res.user.email,
          phone: res.user.phone,
          role: res.user.role || 'USER',
          avatarUrl: res.user.avatarUrl,
          bio: res.user.bio,
          token: res.token,
          authenticatedAt: new Date().toISOString()
        };

        setUserSession(session);
        setCurrentUser(session);
      } else {
        setLoginError(res.message || 'Login failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Unable to connect to the authentication server.');
    } finally {
      setLoginLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. SIGNUP STEP 1: VERIFY CREDENTIALS & DISPATCH OTP
  // -------------------------------------------------------------
  const handleSignupCheckAndSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const cleanUsername = signupUsername.trim().toLowerCase();
    const target = signupChannel === 'email' ? signupEmail.trim() : signupPhone.trim();

    if (!cleanUsername) {
      setSignupError('Username is required.');
      return;
    }

    if (cleanUsername.length < 3) {
      setSignupError('Username must be at least 3 characters long.');
      return;
    }

    if (!target) {
      setSignupError(
        signupChannel === 'email'
          ? 'Please enter your email address to receive OTP.'
          : 'Please enter your mobile number to receive OTP.'
      );
      return;
    }

    setSignupLoading(true);

    try {
      // 1. Check duplicate username, email, phone availability
      const availRes = await fetchFromApi<{ available: boolean; field?: string; message?: string }>(
        '/auth/check-availability',
        {
          method: 'POST',
          body: JSON.stringify({
            username: cleanUsername,
            ...(signupChannel === 'email' ? { email: target } : { phone: target })
          })
        }
      );

      if (!availRes.available) {
        setSignupError(availRes.message || 'This credential is already taken. Please choose another.');
        setSignupLoading(false);
        return;
      }

      // 2. Send OTP
      const otpRes = await fetchFromApi<{
        success: boolean;
        message?: string;
        otpPreview?: string;
        target?: string;
      }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({
          target,
          channel: signupChannel,
          type: 'REGISTRATION'
        })
      });

      if (otpRes.success) {
        setSignupOtpPreview(otpRes.otpPreview || null);
        setSignupOtpTimer(60);
        setSignupStep(2);
        setSignupSuccessMsg(
          signupChannel === 'email'
            ? `Verification code sent to ${target}`
            : `SMS verification code sent to ${target}`
        );
      } else {
        setSignupError(otpRes.message || 'Failed to dispatch OTP. Please try again.');
      }
    } catch (err: any) {
      setSignupError(err.message || 'Network error while requesting OTP.');
    } finally {
      setSignupLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. SIGNUP STEP 2: VERIFY OTP
  // -------------------------------------------------------------
  const handleSignupVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const target = signupChannel === 'email' ? signupEmail.trim() : signupPhone.trim();
    const cleanOtp = signupOtp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setSignupError('Please enter the 6-digit OTP code received.');
      return;
    }

    setSignupLoading(true);

    try {
      const res = await fetchFromApi<{ success: boolean; message?: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          target,
          otp: cleanOtp
        })
      });

      if (res.success) {
        setSignupStep(3);
        setSignupSuccessMsg('OTP verified successfully! Now set your account password.');
      } else {
        setSignupError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setSignupError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setSignupLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. SIGNUP STEP 3: CREATE PASSWORD & COMPLETE ACCOUNT
  // -------------------------------------------------------------
  const handleSignupComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match. Please re-enter.');
      return;
    }

    setSignupLoading(true);

    try {
      const target = signupChannel === 'email' ? signupEmail.trim() : signupPhone.trim();
      const res = await fetchFromApi<{
        success: boolean;
        message?: string;
        token: string;
        user: any;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: signupUsername.trim().toLowerCase(),
          name: signupName.trim() || signupUsername.trim(),
          ...(signupChannel === 'email' ? { email: target } : { phone: target }),
          password: signupPassword
        })
      });

      if (res.success && res.token && res.user) {
        const session: UserSession = {
          id: res.user.id || `user_${Date.now()}`,
          username: res.user.username,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          role: res.user.role || 'TRAVELER',
          avatarUrl: res.user.avatarUrl,
          bio: res.user.bio,
          token: res.token,
          authenticatedAt: new Date().toISOString()
        };

        setUserSession(session);
        setCurrentUser(session);
      } else {
        setSignupError(res.message || 'Failed to complete registration.');
      }
    } catch (err: any) {
      setSignupError(err.message || 'Account creation encountered an error.');
    } finally {
      setSignupLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. FORGOT PASSWORD STEP 1: REQUEST RESET OTP
  // -------------------------------------------------------------
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanIdentifier = forgotIdentifier.trim();
    if (!cleanIdentifier) {
      setForgotError('Please enter your username, email address, or mobile number.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetchFromApi<{
        success: boolean;
        message?: string;
        target?: string;
        maskedTarget?: string;
        otpPreview?: string;
        username?: string;
      }>('/auth/forgot-password/request', {
        method: 'POST',
        body: JSON.stringify({ identifier: cleanIdentifier })
      });

      if (res.success && res.target) {
        setForgotTarget(res.target);
        setForgotMaskedTarget(res.maskedTarget || res.target);
        setForgotOtpPreview(res.otpPreview || null);
        setForgotStep(2);
        setForgotSuccessMsg(`Verification code sent to ${res.maskedTarget || res.target}`);
      } else {
        setForgotError(res.message || 'No registered user found with provided details.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Could not locate account. Please verify credentials.');
    } finally {
      setForgotLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. FORGOT PASSWORD STEP 2: VERIFY RESET OTP
  // -------------------------------------------------------------
  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanOtp = forgotOtp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setForgotError('Please enter the 6-digit OTP code.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetchFromApi<{ success: boolean; message?: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          target: forgotTarget,
          otp: cleanOtp
        })
      });

      if (res.success) {
        setForgotStep(3);
        setForgotSuccessMsg('Code verified! Enter your new password below.');
      } else {
        setForgotError(res.message || 'Invalid or expired OTP code.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'OTP verification failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 3. FORGOT PASSWORD STEP 3: RESET PASSWORD
  // -------------------------------------------------------------
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (forgotNewPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New passwords do not match. Please verify.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetchFromApi<{ success: boolean; message?: string; username?: string }>(
        '/auth/forgot-password/reset',
        {
          method: 'POST',
          body: JSON.stringify({
            target: forgotTarget,
            otp: forgotOtp.trim(),
            newPassword: forgotNewPassword
          })
        }
      );

      if (res.success) {
        setMode('LOGIN');
        if (res.username) {
          setLoginUsername(res.username);
        }
        setLoginPassword('');
        setLoginError(null);
        alert('🎉 Password updated successfully! Please sign in with your new password.');
      } else {
        setForgotError(res.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Password update failed.');
    } finally {
      setForgotLoading(false);
    }
  };

  // -------------------------------------------------------------
  // LOGOUT
  // -------------------------------------------------------------
  const handleSignOut = () => {
    clearUserSession();
    setCurrentUser(null);
    setMode('LOGIN');
  };

  // -------------------------------------------------------------
  // IF USER IS ALREADY AUTHENTICATED
  // -------------------------------------------------------------
  if (currentUser && !isCheckingSession) {
    return (
      <div className="py-6 sm:py-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 w-full">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#131b2e] to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg shadow-amber-500/20"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {currentUser.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-semibold border border-amber-500/30">
                    @{currentUser.username}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>{currentUser.bio || 'Global wanderer & explorer'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/feed"
            className="group bg-gradient-to-br from-slate-900 to-[#121624] border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                Social Travel Feed &amp; Stories
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Explore authentic multi-photo stories, double-tap to like, vote on 24-hour interactive travel polls, and watch vertical video reels from Dubai to Kerala.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-amber-400">
              <span>Open Travel Feed</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/admin"
            className="group bg-gradient-to-br from-slate-900 to-[#181424] border border-slate-800 hover:border-purple-500/50 rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                Operations &amp; Admin Desk
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Access Traveler Governance, community moderation, verified creator badges, and system diagnostics for Super Admins.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-purple-400">
              <span>Open Admin Desk</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MAIN AUTHENTICATION INTERFACE (SPLIT SCREEN: TRAVEL LUGGAGE BOX + FORM)
  // -------------------------------------------------------------
  return (
    <div className="py-4 sm:py-8 max-w-6xl mx-auto w-full">
      {/* 2-Column Responsive Layout: Travel Suitcase ("പെട്ടി") on Left, Auth Desk on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column: Travel Suitcase ("ട്രാവൽ പെട്ടി") */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <TravelLuggageBox />
        </div>

        {/* Right Column: Interactive Authentication Forms */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="bg-[#0e1320] border border-slate-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Pill */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm text-white tracking-tight">Travel Buddy</span>
              </div>

              {/* Mode Badges */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={handleGoToLogin}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    mode === 'LOGIN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={handleGoToSignup}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    mode === 'SIGNUP' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* VIEW 1: SIGN IN (LOGIN) */}
            {/* ======================================================== */}
            {mode === 'LOGIN' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Welcome Back, Traveler
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your username and password to open your travel journal and social feed.
                  </p>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-in shake duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Username Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Username</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Password</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Forgot Password Link Under Password Field */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">Must be at least 6 characters</span>
                      <button
                        type="button"
                        onClick={handleGoToForgotPassword}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {loginLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Travel Buddy</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Account Creation Switcher */}
                <div className="pt-4 border-t border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    Don&apos;t have a traveler account yet?{' '}
                    <button
                      type="button"
                      onClick={handleGoToSignup}
                      className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition-colors"
                    >
                      Create Account Now
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: SIGN UP (CREATE ACCOUNT WITH OTP) */}
            {/* ======================================================== */}
            {mode === 'SIGNUP' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      STEP {signupStep} OF 3
                    </span>
                    <span className="text-xs text-slate-400">
                      {signupStep === 1 && 'Account Details'}
                      {signupStep === 2 && 'OTP Verification'}
                      {signupStep === 3 && 'Security & Password'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Create Traveler Account
                  </h1>
                </div>

                {signupError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-in shake duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{signupError}</span>
                  </div>
                )}

                {signupSuccessMsg && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{signupSuccessMsg}</span>
                  </div>
                )}

                {/* STEP 1: Enter Username, Full Name, Email or Phone */}
                {signupStep === 1 && (
                  <form onSubmit={handleSignupCheckAndSendOtp} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-400" />
                          <span>Username</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Unique identifier</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Display Name (Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Full Name (Optional)"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>

                    {/* Toggle: Email OR Mobile Number */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>OTP Verification Method</span>
                        <span className="text-[10px] text-amber-400">Select email or mobile</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSignupChannel('email')}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            signupChannel === 'email'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email Address</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignupChannel('phone')}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            signupChannel === 'phone'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Mobile Number</span>
                        </button>
                      </div>

                      {/* Input based on selected channel */}
                      {signupChannel === 'email' ? (
                        <div className="pt-1.5">
                          <input
                            type="email"
                            required
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            placeholder="Email Address"
                            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                          />
                        </div>
                      ) : (
                        <div className="pt-1.5">
                          <input
                            type="tel"
                            required
                            value={signupPhone}
                            onChange={(e) => setSignupPhone(e.target.value)}
                            placeholder="Mobile Number"
                            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
                    >
                      {signupLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Checking &amp; Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2: Enter & Verify OTP */}
                {signupStep === 2 && (
                  <form onSubmit={handleSignupVerifyOtp} className="space-y-5">
                    {/* Demo OTP Preview Banner */}
                    {signupOtpPreview && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Verification OTP Code:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSignupOtp(signupOtpPreview)}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold cursor-pointer hover:bg-amber-400 transition-colors"
                          >
                            Paste Code
                          </button>
                        </div>
                        <span className="font-mono text-2xl font-black text-amber-400 tracking-widest block text-center">
                          {signupOtpPreview}
                        </span>
                        <span className="text-[10px] text-slate-400 block text-center">
                          (Valid for 10 minutes)
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block text-center">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Didn&apos;t get the code?</span>
                      <button
                        type="button"
                        disabled={signupOtpTimer > 0}
                        onClick={handleSignupCheckAndSendOtp}
                        className="text-amber-400 hover:text-amber-300 font-semibold disabled:text-slate-600 cursor-pointer"
                      >
                        {signupOtpTimer > 0 ? `Resend in ${signupOtpTimer}s` : 'Resend OTP Now'}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={signupLoading || signupOtp.length !== 6}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {signupLoading ? 'Verifying OTP...' : 'Verify OTP'}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Create & Confirm Password */}
                {signupStep === 3 && (
                  <form onSubmit={handleSignupComplete} className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>OTP Verified! Set your secure password to complete account creation.</span>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSignupPassword ? 'text' : 'password'}
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span>Confirm Password</span>
                      </label>
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        required
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        placeholder="Confirm Password"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
                    >
                      {signupLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Complete Registration &amp; Explore</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Back to Sign In */}
                <div className="pt-4 border-t border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    Already have a traveler account?{' '}
                    <button
                      type="button"
                      onClick={handleGoToLogin}
                      className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition-colors"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW 3: FORGOT PASSWORD (OTP & RESET) */}
            {/* ======================================================== */}
            {mode === 'FORGOT_PASSWORD' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      STEP {forgotStep} OF 3
                    </span>
                    <span className="text-xs text-slate-400">
                      {forgotStep === 1 && 'Find Account'}
                      {forgotStep === 2 && 'Verify Code'}
                      {forgotStep === 3 && 'New Password'}
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Reset Password
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Enter your username to receive an OTP and reset your password.
                  </p>
                </div>

                {forgotError && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold animate-in shake duration-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccessMsg && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                {/* STEP 1: Enter Username */}
                {forgotStep === 1 && (
                  <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>Username</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="Username"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
                    >
                      {forgotLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Searching Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reset OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2: Enter & Verify Reset OTP */}
                {forgotStep === 2 && (
                  <form onSubmit={handleForgotVerifyOtp} className="space-y-5">
                    {/* Demo OTP Preview */}
                    {forgotOtpPreview && (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Password Reset OTP Code:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setForgotOtp(forgotOtpPreview)}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold cursor-pointer hover:bg-amber-400 transition-colors"
                          >
                            Paste Code
                          </button>
                        </div>
                        <span className="font-mono text-2xl font-black text-amber-400 tracking-widest block text-center">
                          {forgotOtpPreview}
                        </span>
                        <span className="text-[10px] text-slate-400 block text-center">
                          (Valid for 10 minutes)
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 block text-center">
                        Enter 6-Digit OTP Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading || forgotOtp.length !== 6}
                        className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {forgotLoading ? 'Verifying OTP...' : 'Verify OTP'}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Enter New Password & Confirm */}
                {forgotStep === 3 && (
                  <form onSubmit={handleForgotResetPassword} className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>OTP Verified! Enter your new password below.</span>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>New Password</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="New Password"
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                        >
                          {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span>Confirm New Password</span>
                      </label>
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 mt-4"
                    >
                      {forgotLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Set New Password &amp; Sign In</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Back to Sign In */}
                <div className="pt-4 border-t border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    Remembered your password?{' '}
                    <button
                      type="button"
                      onClick={handleGoToLogin}
                      className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition-colors"
                    >
                      Return to Sign In
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

