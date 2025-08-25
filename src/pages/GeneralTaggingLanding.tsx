import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Shield, Package, CheckCircle, ArrowRight, Home, Bike, Star, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Footer } from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const GeneralTaggingLanding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasProfile } = useAuth();

  // URL params / referral preservation
  const urlParams = new URLSearchParams(location.search);
  const redirectParam = urlParams.get('redirect') || '';
  const fromParam = urlParams.get('from') || '';
  const nokInviteEmail = urlParams.get('nok_invite_email') || '';
  const [refCode, setRefCode] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState(nokInviteEmail || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Scroll target
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleNavigation = (path: string) => {
    try {
      if (path.startsWith('http')) {
        window.open(path, '_blank');
      } else {
        navigate(path);
      }
    } catch (err) {
      console.error('Navigation error:', err);
      window.location.href = path;
    }
  };

  useEffect(() => {
    // Prefill name if present/cached
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

  // If already in and profiled, send to tagging (this landing is for tagging)
  useEffect(() => {
    if (isAuthenticated && hasProfile) {
      if (redirectParam) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate('/tag', { replace: true });
      }
    }
  }, [isAuthenticated, hasProfile, navigate, redirectParam]);

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-primary-600" />,
      title: 'Proof of Ownership',
      description: 'Create immutable, timestamped records that serve as verifiable proof of ownership for any item.',
    },
    {
      icon: <FileText className="h-8 w-8 text-primary-600" />,
      title: 'Detailed Documentation',
      description: 'Attach photos, videos, descriptions, and important documents (like receipts or certificates) to each tag.',
    },
    {
      icon: <Package className="h-8 w-8 text-primary-600" />,
      title: 'Lost & Found Recovery',
      description: 'Increase the chances of recovering lost items by providing clear ownership information accessible to finders.',
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary-600" />,
      title: 'Insurance & Valuation',
      description: 'Maintain a comprehensive inventory of your valuables, simplifying insurance claims and appraisals.',
    },
  ];

  const examples = [
    {
      icon: <Bike className="h-12 w-12 text-primary-600" />,
      title: 'Bicycle Registration',
      description:
        "Tag your bicycle with its serial number, photos, and your contact information. If it's ever stolen and recovered, law enforcement can easily identify you as the rightful owner.",
    },
    {
      icon: <Star className="h-12 w-12 text-secondary-600" />,
      title: 'Collectibles & Memorabilia',
      description:
        'Document your stamp collection, vintage comic books, or sports memorabilia with detailed photos, condition reports, and purchase receipts. This enhances their value and provides a clear record for future sales or inheritance.',
    },
    {
      icon: <Home className="h-12 w-12 text-accent-600" />,
      title: 'Home Inventory',
      description:
        'Create a digital inventory of valuable items in your home, such as electronics, jewelry, or artwork. In case of fire, theft, or natural disaster, you have a verifiable record for insurance purposes.',
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
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      try {
        localStorage.setItem('tmt_prefill_name', name.trim());
      } catch {}

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

      // Session may be null if email confirmation is on
      const user = data.user ?? (await supabase.auth.getUser()).data.user;
      if (!user) {
        setInfo('Check your email to confirm your address. Once confirmed, come back and sign in.');
        return;
      }

      // Ensure profile full_name if you maintain a profiles table
      try {
        await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
      } catch {}

      // Apply referral via RPC (server-side attribution)
      if (referralCode) {
        try {
          const { error: rpcErr } = await supabase.rpc('apply_referral_on_signup', {
            p_new_user_id: user.id,
            p_referral_code: refCode,
            p_source: fromParam || 'general_tagging_landing',
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

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                General Ownership
                <span className="block text-primary-600">Tagging</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Document and Verify Ownership of Anything You Own
              </p>
              <p className="text-lg text-gray-700 max-w-4xl mx-auto mb-12 leading-relaxed">
                Whether it's a cherished family heirloom, a valuable piece of equipment, or simply an item you want to keep track of,
                General Ownership Tagging with TagMyThing provides a simple, secure, and verifiable way to document your possessions.
                Create a digital record that proves ownership, tracks important details, and ensures your items are always identifiable.
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

      {/* Features Section */}
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
              Everything you need to document and protect your valuable possessions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="text-center h-full">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inline Signup Section */}
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

      {/* Examples Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Real-World Examples</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how TagMyThing can protect your valuable possessions
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

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Start Protecting Your Assets Today</h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of users who trust TagMyThing to document and secure their valuable possessions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={scrollToForm}>
                <Camera className="h-5 w-5 mr-2" />
                Tag Your First Item
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary-600"
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
