import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export function Auth() {
  const { t, i18n } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isSignUp) {
      const { error: authError } = await signUp(email, password);
      if (authError) {
        setError(authError.message);
      } else {
        setSuccessMsg(t('registrationSuccess'));
        setEmail('');
        setPassword('');
      }
    } else {
      const { error: authError } = await signIn(email, password);
      if (authError) setError(authError.message);
    }

    setLoading(false);
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleLang}
            className="text-sm px-4 py-1.5 border border-slate-300 rounded-full text-slate-600 hover:bg-white"
          >
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">{t('appName')}</h1>
          <p className="text-base text-slate-500">{t('appSubtitle')}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-black mb-6">
            {isSignUp ? t('signUp') : t('signIn')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('processing') : isSignUp ? t('signUp') : t('signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMsg(''); }}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              {isSignUp ? t('alreadyRegistered') : t('needAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
