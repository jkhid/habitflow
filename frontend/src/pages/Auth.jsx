import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Flame, Mail, Lock, User, Target, Users, Trophy, Sparkles } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { login, signup, isAuthenticated } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!isLogin && !formData.username) {
      newErrors.username = 'Username is required';
    } else if (!isLogin && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
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
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await signup(formData.email, formData.username, formData.password);
      }

      if (result.success) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const features = [
    { icon: Target, text: 'Track daily habits', color: 'text-emerald-500' },
    { icon: Flame, text: 'Build winning streaks', color: 'text-orange-500' },
    { icon: Users, text: 'Connect with friends', color: 'text-blue-500' },
    { icon: Trophy, text: 'Compete on leaderboards', color: 'text-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex">
      {/* Left side - Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 flex-col justify-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">HabitFlow</h1>
          </div>

          <h2 className="text-3xl font-semibold text-white mb-4">
            Build better habits, together.
          </h2>
          <p className="text-indigo-100 text-lg mb-12 max-w-md">
            Join thousands of people using HabitFlow to build lasting habits, track progress, and achieve their goals with friends.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text, color }, index) => (
              <div
                key={text}
                className="flex items-center gap-4 text-white animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <span className="text-lg">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-indigo-200 text-sm">
              "HabitFlow helped me build a 100-day meditation streak. The social features keep me accountable!"
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 bg-indigo-400 rounded-full flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div>
                <p className="text-white font-medium">Sarah M.</p>
                <p className="text-indigo-200 text-sm">100+ day streak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">HabitFlow</h1>
            <p className="text-gray-500 mt-2">Build better habits with friends</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </h2>
            <p className="text-gray-500 mt-1">
              {isLogin ? 'Sign in to continue your streak' : 'Start building better habits today'}
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  className="pl-10"
                />
              </div>

              {!isLogin && (
                <div className="relative animate-fade-in">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <Input
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    error={errors.username}
                    className="pl-10"
                  />
                </div>
              )}

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  className="pl-10"
                />
              </div>

              {isLogin && (
                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {!isLogin && (
                <div className="relative animate-fade-in">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    className="pl-10"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full active-press"
                size="lg"
                loading={loading}
              >
                {isLogin ? (
                  'Sign In'
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              {isLogin ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Sign up for free
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </Card>

          {/* Mobile features */}
          <div className="mt-8 lg:hidden">
            <div className="flex justify-center gap-6">
              {features.slice(0, 4).map(({ icon: Icon, color }) => (
                <div
                  key={color}
                  className="w-10 h-10 bg-white shadow-md rounded-xl flex items-center justify-center"
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
