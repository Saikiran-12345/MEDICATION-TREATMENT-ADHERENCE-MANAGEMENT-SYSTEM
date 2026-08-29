import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ShieldAlert, KeyRound, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    const success = await login(username, password);
    setIsSubmitting(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password. Please use the demo credentials below.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl mb-2">
            M
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">MTAMS Portal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            Medication & Treatment Adherence Management System
          </p>
        </div>

        {/* Global Safety Note */}
        <div className="mb-6 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 leading-normal">
          <span className="font-semibold">Demo Sandbox:</span> Administrative tracking indicator. Do not use for clinical diagnostics.
        </div>

        {/* Form Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                placeholder="e.g. admin, staff, patient"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl cursor-pointer transition shadow-md shadow-blue-500/10 text-sm flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Demo Portal Credentials
          </h3>
          <div className="space-y-2 text-xs">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
              <div>
                <span className="font-semibold text-purple-700 dark:text-purple-400">ADMIN</span>
                <span className="text-gray-400 mx-1.5">|</span>
                <span className="text-gray-600 dark:text-gray-300">user:</span> <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded select-all font-mono font-bold">admin</code>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">pass:</span> <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded select-all font-mono font-bold">admin123</code>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
              <div>
                <span className="font-semibold text-blue-700 dark:text-blue-400">STAFF</span>
                <span className="text-gray-400 mx-1.5">|</span>
                <span className="text-gray-600 dark:text-gray-300">user:</span> <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded select-all font-mono font-bold">staff</code>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">pass:</span> <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded select-all font-mono font-bold">staff123</code>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-xl border border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
              <div>
                <span className="font-semibold text-green-700 dark:text-green-400">PATIENT</span>
                <span className="text-gray-400 mx-1.5">|</span>
                <span className="text-gray-600 dark:text-gray-300">user:</span> <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded select-all font-mono font-bold">patient</code>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">pass:</span> <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded select-all font-mono font-bold">patient123</code>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
