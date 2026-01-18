import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Flame, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setErrors({ form: err.response?.data?.error || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="shadow-xl border-0 text-center py-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">
                Request New Reset Link
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Password Reset!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button className="w-full" onClick={() => navigate('/')}>
                Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Reset your password
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Enter your new password below
                </p>
              </div>

              {errors.form && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <Input
                    name="password"
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                    className="pl-10"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full active-press"
                  size="lg"
                  loading={loading}
                >
                  Reset Password
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

export default ResetPassword;
