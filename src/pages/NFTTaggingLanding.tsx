import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Shield, Palette, Music, Lightbulb, QrCode, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const NFTTaggingLanding: React.FC = () => {
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
    // Prefill name from ?name or localStorage
    const qName = urlParams.get('name');
    if (qName) setName(qName);
    else {
      try {
        const cached = localStorage.getItem('tmt_prefill_name');
        if (cached) setName(cached);
      } catch {}
    }

    // Capture referral from ?ref or localStorage
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
      icon: <Music className="h-8 w-8 text-primary-600" />,
      title: 'For Songwriters and Musicians',
      description:
        'Tag lyrics, melodies, and recordings. Each tag creates a digital fingerprint to verify authorship.',
    },
    {
      icon: <Lightbulb className="h-8 w-8 text-secondary-600" />,
      title: 'For Inventors',
      description:
        "Protect innovations by tagging specs and prototypes. Create a dated record confirming originality.",
    },
    {
      icon: <Palette className="h-8 w-8 text-accent-600" />,
      title: 'For Artists & NFT Creators',
      description:
        'Give every piece a verified digital identity to protect it and increase marketplace trust.',
    },
    {
      icon: <QrCode className="h-8 w-8 text-success-600" />,
      title: 'QR Codes (Coming Soon)',
      description:
        'Generate QR codes for physical items so anyone can quickly verify authenticity.',
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

      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
          // emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signErr) throw signErr;

      // If email confirmation is on, session may be null
      const user = data.user ?? (await supabase.auth.getUser()).data.user;
      if (!user) {
        setInfo('Check your email to confirm your address. Once confirmed, come back and sign in.');
        return;
      }

      // Ensure profile full_name (if you maintain profiles table)
      try {
        await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
      } catch {}

      // Apply referral via RPC (server-side insert into public.referrals)
      if (refCode) {
        try {
          const { error: rpcErr } = await supabase.rpc('apply_referral_on_signup', {
            p_new_user_id: user.id,
            p_referral_code: refCode,
            p_source: fromParam || 'nft_tagging_landing',
          });
          if (rpcErr) console.warn('apply_referral_on_signup:', rpcErr.message);
        } catch (ex) {
          console.warn('apply_referral_on_signup exception:', ex);
        }
      }

      postSignupRedirect();
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Digital Asset & NFT
                <span className="block text-primary-600">Tagging</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Unlock the Power of TagMyThing for Your Creative and Inventive Works
              </p>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
                Welcome to a new era of authenticity and protection for your creative masterpieces and innovative inventions.
                With TagMyThing, you can ensure that your work is securely tagged and easily verifiable.
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
                Start Tagging Now
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
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Protect Your Creative Work</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Secure digital fingerprints for all your creative and inventive works
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-3 bg-gray-50 rounded-lg">{benefit.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
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
              <span className="text-primary-700 font-medium">Member</span> and start tagging
            </h2>
            <p className="mt-3 text-gray-600">Create your account here — no page hopping.</p>
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
        </div>
      </section>

      {/* Community CTA */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Join the Creative Community</h2>
            <p className="text-xl text-purple-100 mb-8">
              Creators and innovators trust TagMyThing to protect and authenticate their most valuable work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={scrollToForm}>
                <Camera className="h-5 w-5 mr-2" />
                Tag Your Creation
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-purple-600"
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
