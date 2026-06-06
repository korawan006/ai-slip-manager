import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Sparkles, Zap, QrCode, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function Login() {
  const { oAuthLogin, emailLogin, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await emailLogin(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    setGoogleLoading(true);
    try {
      await oAuthLogin('google');
    } catch (err) {
      setError('Google login failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();

    if (!email.trim()) {
      setError('Please enter your email address first, then click "Forgot your password?"');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-primary/15 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] bg-accent/15 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-primary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Main card */}
        <div className="glass rounded-3xl p-10 text-center relative overflow-hidden">
          {/* Shimmer border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-50" style={{ padding: '1px' }}>
            <div className="w-full h-full bg-card rounded-3xl" />
          </div>

          <div className="relative z-10">
            {/* Logo / Brand */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(99,102,241,0.4)]"
            >
              <QrCode className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-2"
            >
              AI Slip Manager
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-8 text-sm"
            >
              Extract &amp; manage your bank slips with AI-powered OCR
            </motion.p>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  id="login-error-message"
                  className="flex items-start gap-3 mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-left"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success message */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  id="login-success-message"
                  className="flex items-start gap-3 mb-6 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-left"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-300 leading-relaxed">{successMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email/Password Form */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleEmailLogin}
              className="space-y-4 text-left"
            >
              {/* Email field */}
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-primary transition-colors duration-300" />
                <input
                  id="email-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/30 border border-border text-gray-100 placeholder-gray-500 text-sm
                    focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-all duration-300"
                  autoComplete="email"
                />
              </div>

              {/* Password field */}
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-primary transition-colors duration-300" />
                <input
                  id="password-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-black/30 border border-border text-gray-100 placeholder-gray-500 text-sm
                    focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(99,102,241,0.25)] transition-all duration-300"
                  autoComplete="current-password"
                />
              </div>

              {/* Forgot password link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline hover:text-primary-neon transition-colors duration-200 cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Sign In button */}
              <motion.button
                type="submit"
                id="email-login-button"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? 'none' : '0 0 30px rgba(99,102,241,0.3)' }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-hover
                  text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-primary/25 
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </motion.form>

            {/* OR Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4 my-7"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-medium">OR</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-transparent" />
            </motion.div>

            {/* Google Sign-in Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              id="google-login-button"
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white/5 border border-border
                hover:bg-white/10 hover:border-gray-500/40 text-gray-200 font-semibold text-sm transition-all duration-300 
                disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  {/* Google "G" icon (inline SVG) */}
                  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-gray-500 uppercase tracking-wider">Secure Login</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap justify-center gap-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI OCR
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs text-accent"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Supabase Auth
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400"
              >
                <Zap className="w-3.5 h-3.5" />
                Real-time Sync
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center text-xs text-gray-600 mt-6"
        >
          Powered by Gemini AI &bull; Supabase &bull; Google Sheets
        </motion.p>
      </motion.div>
    </div>
  );
}
