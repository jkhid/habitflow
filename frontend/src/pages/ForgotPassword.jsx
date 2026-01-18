import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <Flame className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HabitFlow</h1>
        </div>

        <Card className="shadow-xl border-0">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Check your email
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                If an account exists for {email}, you'll receive a password reset link shortly.
              </p>
              <Link to="/">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Forgot your password?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                    className="pl-10"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full active-press"
                  size="lg"
                  loading={loading}
                >
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
