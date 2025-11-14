import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Heart, Users, FileText, Shield, Clock, ArrowRight, Watch, Image, Coins, Mail, Phone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { PhoneSignupForm } from '../components/auth/PhoneSignupForm';

export const MyWillTaggingLanding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasProfile } = useAuth();

  // URL params
  const urlParams = new URLSearchParams(location.search);
  const redirectParam = urlParams.get('redirect') || '';
  const fromParam = urlParams.get('from') || '';
  const nokInviteEmail = urlParams.get('nok_invite_email') || '';

  // Referral code
  const [refCode, setRefCode] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState(nokInviteEmail || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleNavigation = (path: string) => {
    try {
      if (path.startsWith('http')) window.open(path, '_blank');
      else navigate(path);
    } catch (err) {
      console.error('Navigation error:', err);
      window.location.href = path;
    }
  };

  useEffect(() => {
    // Prefill name from ?name or cache
    const qName = urlParams.get('name');
    if (qName) setName(qName);
    else {
      try {
        const cached = localStorage.getItem('tmt_prefill_name');
        if (cached) setName(cached);
      } catch {}
    }

    // Capture referral from ?ref or cache
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

  // If already signed in & profiled, go to tagging/redirect
  useEffect(() => {
    if (isAuthenticated && hasProfile) {
      if (redirectParam) navigate(redirectParam, { replace: true });
      else navigate('/tag', { replace: true });
    }
  }, [isAuthenticated, hasProfile, navigate, redirectParam]);

  const benefits = [
    {
      icon: <Heart className="h-8 w-8 text-primary-600" />,
      title: 'Clear Intentions',
      description:
        'Document sentimental value, history, and specific instructions to prevent disputes and honor your wishes.',
    },
    {
      icon: <Coins className="h-8 w-8 text-secondary-600" />,
      title: 'Digital Asset Management',
      description:
        'Record access details for digital accounts and crypto so your next-of-kin can find and manage them.',
    },
    {
      icon: <Users className="h-8 w-8 text-accent-600" />,
      title: 'Next-of-Kin Access',
      description:
        'Designate trusted people who can access specific tagged information when the time comes.',
    },
    {
      icon: <Clock className="h-8 w-8 text-success-600" />,
      title: 'Living Document',
      description:
        'Update your wishes as life evolves, keeping your legacy plan current and comprehensive.',
    },
  ];

  const examples = [
    {
      icon: <Watch className="h-12 w-12 text-primary-600" />,
      title: 'Family Heirlooms',
      description:
        'Tag an antique watch with a video on its history and who should receive it, preserving story + intent.',
    },
    {
      icon: <Image className="h-12 w-12 text-secondary-600" />,
      title: 'Digital Photo Archives',
      description:
        'Store where albums live and how to access/share them so memories aren’t lost.',
    },
    {
      icon: <Coins className="h-12 w-12 text-accent-600" />,
      title: 'Cryptocurrency Wallets',
      description:
        'Record wallet details and transfer instructions so digital wealth reaches beneficiaries.',
    },
  ];

  const validate = () => {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please enter a valid email.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const postSignupRedirect = () => {
    if (fromParam === 'tagging' && redirectParam) {
      navigate(`${redirectParam}?from=tagging`, { replace: true });
    } else if (redirectParam) {
      navigate(redirectParam, { replace: true });
    } else {
      navigate('/tag', { replace: true });
    }
  };

  // const handleSignup = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError(null);
  //   setInfo(null);
  //   const v = validate();
  //   if (v) { setError(v); return; }

  //   setSubmitting(true);
  //   try {
  //     try { localStorage.setItem('tmt_prefill_name', name.trim()); } catch {}

  //     const metadata: Record<string, any> = { full_name: name.trim() };
  //     if (refCode) metadata.referral_code = refCode;

  //     const { data, error: signErr } = await supabase.auth.signUp({
  //       email: email.trim(),
  //       password,
  //       options: { data: metadata /*, emailRedirectTo: `${window.location.origin}/auth/callback`*/ },
  //     });
  //     if (signErr) throw signErr;

  //     // If email confirmation is on, session may be null
  //     const user = data.user ?? (await supabase.auth.getUser()).data.user;
  //     if (!user) {
  //       setInfo('Check your email to confirm your address. Once confirmed, come back and sign in.');
  //       return;
  //     }

  //     // Ensure profile name
  //     try {
  //       await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
  //     } catch {}

  //     // Apply referral via RPC → inserts into public.referrals (server-side)
  //     if (refCode) {
  //       try {
  //         const { error: rpcErr } = await supabase.rpc('apply_referral_on_signup', {
  //           p_new_user_id: user.id,
  //           p_referral_code: refCode,
  //           p_source: fromParam || 'mywill_tagging_landing',
  //         });
  //         if (rpcErr) console.warn('apply_referral_on_signup:', rpcErr.message);
  //       } catch (ex) {
  //         console.warn('apply_referral_on_signup exception:', ex);
  //       }
  //     }

  //     postSignupRedirect();
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

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePhoneSignupSuccess = () => {
    // After successful phone signup, navigate to dashboard or redirect
    if (redirectParam) {
      navigate(redirectParam, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img src="/tagmaithing.png" alt="TagMyThing" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-gray-900">
                Tag<span className="text-primary-600">My</span>Thing
              </span>
            </button>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={scrollToForm}>
                Sign In / Sign Up
              </Button>
              <Button size="sm" onClick={scrollToForm}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                MyWill & Legacy
                <span className="block text-primary-600">Tagging</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Secure Your Legacy: Beyond the Last Will and Testament
              </p>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-8 leading-relaxed">
                Your possessions tell a story, and your intentions for them are deeply personal. MyWill/Legacy Tagging with TagMyThing
                allows you to create a living, verifiable record of your wishes for physical and digital assets, ensuring your legacy
                is preserved and your intentions are clearly understood by those you leave behind.
              </p>
              <p className="text-lg font-medium text-primary-700 max-w-3xl mx-auto mb-12">
                This is not just a place to leave your <em>last</em> will—it’s a place to record your <em>first</em> will,
                and every intention in between.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Button size="lg" className="w-full sm:w-auto" onClick={scrollToForm}>
                <Camera className="h-5 w-5 mr-2" />
                Start Your Legacy
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={scrollToForm}>
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Key Benefits</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Preserve your legacy with comprehensive digital documentation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full">
                  <div className="flex justify-center mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Legacy Examples</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how TagMyThing can preserve your intentions and memories
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {examples.map((example, index) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="text-center h-full">
                  <div className="flex justify-center mb-6">{example.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{example.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{example.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inline Signup */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-semibold text-gray-900">
              Become a Tag<span className="text-primary-600">My</span>Thing{' '}
              <span className="text-primary-700 font-medium">Member</span> and record your wishes
            </h2>
            <p className="mt-3 text-gray-600">Create your account here — no page hopping.</p>
          </motion.div>

          {/* Signup Method Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-6 flex justify-center"
          >
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSignupMethod('email')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  signupMethod === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setSignupMethod('phone')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  signupMethod === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </button>
            </div>
          </motion.div>

          {/* Conditional Signup Form */}
          {signupMethod === 'email' ? (
            <motion.form
              ref={formRef}
              onSubmit={handleSignup}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-8 space-y-4"
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
                {nokInviteEmail && <p className="mt-1 text-xs text-gray-500">Email locked by invitation.</p>}
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
                {submitting ? (
                  'Creating your account…'
                ) : (
                  <span className="inline-flex items-center">
                    Create account & start tagging <ArrowRight className="h-4 w-4 ml-2" />
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-gray-500">
                By continuing you agree to our Terms and acknowledge our Privacy Policy.
              </p>
            </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="mt-8"
            >
              <PhoneSignupForm
                referralCode={refCode}
                fullName={name || ''}
                fromSource={fromParam || 'mywill_tagging_landing'}
                isBusinessSignup={false}
                nokInviteEmail={nokInviteEmail || undefined}
                onBackToEmail={() => setSignupMethod('email')}
                onSuccess={handlePhoneSignupSuccess}
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Start Building Your Digital Legacy</h2>
            <p className="text-xl text-amber-100 mb-8">
              Ensure your wishes are preserved and your loved ones understand your intentions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={scrollToForm}>
                <Heart className="h-5 w-5 mr-2" />
                Create Your Legacy
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-amber-600"
                onClick={scrollToForm}
              >
                Create Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
