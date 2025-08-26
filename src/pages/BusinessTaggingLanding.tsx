import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Shield, QrCode, Building, CheckCircle, ArrowRight, Key, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const BusinessTaggingLanding: React.FC = () => {
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
    // Prefill name
    const qName = urlParams.get('name');
    if (qName) setName(qName);
    else {
      try {
        const cached = localStorage.getItem('tmt_prefill_name');
        if (cached) setName(cached);
      } catch {}
    }

    // Capture referral
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

  // If already signed in with profile, go to redirect or dashboard
  useEffect(() => {
    if (isAuthenticated && hasProfile) {
      if (redirectParam) navigate(redirectParam, { replace: true });
      else navigate('/dashboard', { replace: true }); // change to '/business' if that's your biz home
    }
  }, [isAuthenticated, hasProfile, navigate, redirectParam]);

  const steps = [
    {
      number: '1',
      title: 'Assign Unique Serial & QR Code',
      description: 'Each product gets a unique serial number and an automatically generated QR code that links to its TagMyThing record.',
      icon: <QrCode className="h-8 w-8 text-primary-600" />
    },
    {
      number: '2',
      title: 'Attach QR Code to Product',
      description: 'Apply the QR code to your product via sticker, engraving, or integration into packaging for easy customer access.',
      icon: <Key className="h-8 w-8 text-secondary-600" />
    },
    {
      number: '3',
      title: 'Customer Scans QR Code',
      description: "Customers use any QR scanner to instantly access the product's TagMyThing verification page.",
      icon: <Shield className="h-8 w-8 text-success-600" />
    },
    {
      number: '4',
      title: 'View Authenticity & Scan History',
      description: 'Customers see product details and scan history. Unusual patterns or locations help identify potential counterfeits.',
      icon: <Lock className="h-8 w-8 text-accent-600" />
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
    if (fromParam && redirectParam) {
      navigate(`${redirectParam}?from=${encodeURIComponent(fromParam)}`, { replace: true });
    } else if (redirectParam) {
      navigate(redirectParam, { replace: true });
    } else {
      navigate('/dashboard', { replace: true }); // change to '/business' if desired
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

  //     // include business hint + referral in metadata
  //     const metadata: Record<string, any> = { full_name: name.trim(), account_type: 'business' };
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

  //     // If email confirmation is on, session may be null
  //     const user = data.user ?? (await supabase.auth.getUser()).data.user;
  //     if (!user) {
  //       setInfo('Check your email to confirm your address. Once confirmed, come back and sign in.');
  //       return;
  //     }

  //     // Ensure profile name (if you maintain profiles table)
  //     try {
  //       await supabase.from('profiles').update({ full_name: name.trim(), account_type: 'business' }).eq('id', user.id);
  //     } catch {}

  //     // Apply referral via RPC (server-side insert into public.referrals)
  //     if (refCode) {
  //       try {
  //         const { error: rpcErr } = await supabase.rpc('apply_referral_on_signup', {
  //           p_new_user_id: user.id,
  //           p_referral_code: refCode,
  //           p_source: fromParam || 'business_tagging_landing',
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

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Business & Inventory
                <span className="block text-primary-600">Tagging</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                TagMyThing for Businesses: Simple, Secure Product Authentication with QR Codes
              </p>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
                TagMyThing offers a lightweight product verification system built for businesses. Each product is assigned a unique serial number and an automatically generated QR code. When customers scan the code, they can instantly verify the product's authenticity and view its scan history. This helps identify counterfeits through unusual scan patterns or locations, giving customers confidence and protecting your brand—all without complex cryptographic systems.
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
                Start Protecting Products
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={scrollToForm}>
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple four-step process to secure your products against counterfeiting
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {step.number}
                    </div>
                  </div>
                  <div className="pt-6">
                    <div className="flex justify-center mb-4">{step.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Why Choose TagMyThing?</h2>
              <p className="text-lg text-gray-600 mb-8">
                Our simple yet effective system assigns each product a unique serial number and QR code. When customers scan the code,
                they instantly see the product's verification page with its complete scan history. Unusual scan patterns—like multiple
                scans from different countries or suspicious frequency—help identify potential counterfeits. This transparency builds
                customer confidence while protecting your brand reputation.
              </p>

              <div className="space-y-4">
                {[
                  'Simple QR code system requires no complex setup',
                  'Instant verification with complete scan history',
                  'Unusual patterns help identify potential counterfeits',
                  'Scalable for any production volume',
                  'Builds customer trust through transparency',
                ].map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="relative">
              <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
                <Building className="h-16 w-16 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Simple & Transparent</h3>
                <p className="text-primary-100 mb-6">
                  Our lightweight QR code system provides effective protection through transparency and scan history tracking, scaling effortlessly with your business growth.
                </p>
                <Button variant="secondary" size="lg" className="w-full" onClick={scrollToForm}>
                  Start Simple Product Authentication
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Inline Signup */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-semibold text-gray-900">
              Become a Tag<span className="text-primary-600">My</span>Thing <span className="text-primary-700 font-medium">Member</span> for Business
            </h2>
            <p className="mt-3 text-gray-600">Create your business account here — no page hopping.</p>
          </motion.div>

          <motion.form
            ref={formRef}
            onSubmit={handleSignup}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="mt-8 space-y-4"
          >
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-900">Your name</label>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || Boolean(nokInviteEmail)}
                readOnly={Boolean(nokInviteEmail)}
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-70"
              />
              {nokInviteEmail && <p className="mt-1 text-xs text-gray-500">Email locked by invitation.</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">Password</label>
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
              {submitting ? 'Creating your business account…' : (
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
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Protect Your Products Today</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join forward-thinking businesses that trust TagMyThing's simple QR code authentication to protect their products and build customer confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={scrollToForm}>
                <Shield className="h-5 w-5 mr-2" />
                Start Product Authentication
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600" onClick={scrollToForm}>
                Create Business Account
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
