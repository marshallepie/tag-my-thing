import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export const InfluencerAuth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasProfile } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const redirectParam = urlParams.get('redirect') || '';
  const fromParam = urlParams.get('from') || '';
  const nokInviteEmail = urlParams.get('nok_invite_email') || '';

  // capture referral (from URL or cache)
  const [refCode, setRefCode] = useState<string | null>(null);

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState(nokInviteEmail || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    // name prefill
    const qName = urlParams.get('name');
    if (qName) setName(qName);
    else {
      try {
        const cached = localStorage.getItem('tmt_prefill_name');
        if (cached) setName(cached);
      } catch {}
    }

    // referral capture
    const qRef = urlParams.get('ref');
    try {
      if (qRef && qRef.trim()) {
        localStorage.setItem('tmt_ref_code', qRef.trim());
        setRefCode(qRef.trim());
      } else {
        const cachedRef = localStorage.getItem('tmt_ref_code');
        if (cachedRef) setRefCode(cachedRef);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // already signed in + has profile? route away
  if (isAuthenticated && hasProfile) {
    if (nokInviteEmail) return <Navigate to="/nok" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  const goNext = (opts: { toNok?: boolean }) => {
    if (fromParam === 'tagging' && redirectParam) {
      navigate(`${redirectParam}?from=tagging`, { replace: true });
    } else if (opts.toNok || nokInviteEmail) {
      navigate('/nok', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const validate = () => {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  // const handleSignup = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError(null);
  //   setInfo(null);

  //   const v = validate();
  //   if (v) { setError(v); return; }

  //   setSubmitting(true);
  //   try {
  //     // cache name for later
  //     try { localStorage.setItem('tmt_prefill_name', name.trim()); } catch {}

  //     // include referral in user metadata if present
  //     const metadata: Record<string, any> = { full_name: name.trim() };
  //     if (refCode) metadata.referral_code = refCode;

  //     const { data, error: signErr } = await supabase.auth.signUp({
  //       email: email.trim(),
  //       password,
  //       options: {
  //         data: metadata,
  //         // emailRedirectTo: `${window.location.origin}/auth/callback`,
  //       },
  //     });
  //     if (signErr) throw signErr;

  //     // If confirmation required, session may be null
  //     const user = data.user ?? (await supabase.auth.getUser()).data.user;
  //     if (!user) {
  //       setInfo('Check your email to confirm your address. Once confirmed, come back and sign in.');
  //       return;
  //     }

  //     // Ensure profile name (if you use a profiles table)
  //     try {
  //       await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
  //     } catch {}

  //     // OPTIONAL: record referral attribution in your own table or RPC
  //     // Adjust table/column names to your schema; failure is non-fatal.
  //     if (refCode) {
  //       try {
  //         // Example table write
  //         await supabase.from('referral_attribution').insert({
  //           ref_code: refCode,
  //           new_user_id: user.id,
  //           new_user_email: email.trim(),
  //           source: fromParam || 'landing_signup',
  //         });
  //         // OR, if you have an RPC:
  //         // await supabase.rpc('apply_referral_on_signup', { p_ref_code: refCode });
  //       } catch {
  //         // ignore if table/RLS not set up; metadata already preserves the code
  //       }
  //     }

  //     goNext({ toNok: Boolean(nokInviteEmail) });
  //   } catch (err: any) {
  //     setError(err?.message || 'Failed to create account.');
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setInfo(null);
  const v = validate();
  if (v) { setError(v); return; }

  setSubmitting(true);
  try {
    try { localStorage.setItem('tmt_prefill_name', name.trim()); } catch {}

    const metadata: Record<string, any> = { full_name: name.trim() };
    if (refCode) metadata.referral_code = refCode;
    
    // Add account_type for business landing
    if (/* this is business landing */) {
      metadata.account_type = 'business';
    }

    // Build redirect URL with referral preserved
    const baseRedirectUrl = `${window.location.origin}/auth/callback`;
    const redirectUrl = refCode
      ? `${baseRedirectUrl}?ref=${encodeURIComponent(refCode)}&from=${encodeURIComponent(fromParam || 'landing_page_name')}`
      : baseRedirectUrl;

    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: metadata,
        emailRedirectTo: redirectUrl,  // ← Now includes referral info
      },
    });
    if (signErr) throw signErr;

    // Always redirect to check email page after signup
    const user = data.user;
    if (!user) {
      setError('Failed to create account');
      return;
    }

    // Referral processing happens in AuthCallback after email verification
    navigate('/check-email', { replace: true });
    return;

  } catch (err: any) {
    setError(err?.message || 'Failed to create account.');
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-primary-50">
      {/* minimal nav */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img src="/tagmaithing.png" alt="TagMyThing" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-gray-900">
              Tag<span className="text-primary-600">My</span>Thing
            </span>
          </button>
          <Button variant="ghost" onClick={() => navigate('/tag')}>
            Try Tagging
          </Button>
        </div>
      </nav>

      {/* hero + inline signup form */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl lg:text-5xl font-semibold text-gray-900 leading-snug">
              Become a Tag<span className="text-primary-600">My</span>Thing{' '}
              <span className="text-primary-700 font-medium">Member</span> and take part in a{' '}
              <span className="text-indigo-600 font-medium">Digital Autonomous Organization</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              TagMyThing lets you digitally store proof — forever.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSignup}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-10 space-y-4"
          >
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-900">
                Your name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || Boolean(nokInviteEmail)}
                readOnly={Boolean(nokInviteEmail)}
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-70"
              />
              {nokInviteEmail && (
                <p className="mt-1 text-xs text-gray-500">Email locked by invitation.</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {refCode && (
              <p className="text-xs text-gray-500">
                Applying referral code: <span className="font-medium">{refCode}</span>
              </p>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            {info && <p className="text-sm text-amber-700">{info}</p>}

            <Button type="submit" className="w-full rounded-2xl" disabled={submitting}>
              {submitting ? 'Creating your account…' : (
                <span className="inline-flex items-center">
                  Create account <ArrowRight className="h-4 w-4 ml-2" />
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-gray-500">
              By continuing you agree to our Terms and acknowledge our Privacy Policy.
            </p>
          </motion.form>
        </div>

        {/* soft background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-yellow-200 rounded-full opacity-20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-200 rounded-full opacity-20 blur-3xl" />
        </div>
      </section>
    </div>
  );
};
