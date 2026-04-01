import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile, effectiveRole } from '../lib/supabase';
import { DoctorCard } from './DoctorCard';
import { DoctorProfile } from './DoctorProfile';
import { EvaluationModal } from './EvaluationModal';

type View = 'directory' | 'my-profile' | 'doctor-profile';

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const { signOut, user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentView, setCurrentView] = useState<View>('directory');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Profile | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProfiles();
    if (user) loadUserProfile();
  }, [user]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const handleEvaluate = async (traits: number[]) => {
    if (!user || !selectedDoctor) throw new Error('Authentication required');
    if (user.id === selectedDoctor.id) throw new Error('Self-evaluation not permitted.');
    const { error } = await supabase.from('peer_reviews').insert({
      evaluator_id: user.id,
      evaluated_id: selectedDoctor.id,
      traits,
    });
    if (error) throw error;
    await loadProfiles();
  };

  const handlePromote = async (profile: Profile, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id);
    if (!error) await loadProfiles();
  };

  const handleViewProfile = (profile: Profile) => {
    setViewingDoctor(profile);
    setCurrentView('doctor-profile');
  };

  const handleBackToDirectory = () => {
    setViewingDoctor(null);
    setCurrentView('directory');
  };

  const toggleLang = () => i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');

  const isAdmin = userProfile ? effectiveRole(userProfile) === 'admin' : false;

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q)
    );
  }, [profiles, searchQuery]);

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 p-5 hidden md:flex flex-col flex-shrink-0">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-black leading-tight">{t('appName')}</h1>
        </div>
        <nav className="space-y-1 flex-1">
          <button
            onClick={() => { setCurrentView('directory'); setViewingDoctor(null); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
              currentView === 'directory' || currentView === 'doctor-profile'
                ? 'bg-slate-100 text-black'
                : 'text-slate-500 hover:bg-slate-50 hover:text-black'
            }`}
          >
            {t('dashboard')}
          </button>
          <button
            onClick={() => setCurrentView('my-profile')}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium ${
              currentView === 'my-profile'
                ? 'bg-slate-100 text-black'
                : 'text-slate-500 hover:bg-slate-50 hover:text-black'
            }`}
          >
            {t('myProfile')}
          </button>
          <button
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-black"
          >
            {t('systemExit')}
          </button>
        </nav>
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={toggleLang}
            className="w-full text-left px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-50 hover:text-black"
          >
            {i18n.language === 'en' ? 'العربية 🌐' : 'English 🌐'}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-5 md:p-8">
        {/* Mobile header */}
        <div className="md:hidden mb-5 flex justify-between items-center">
          <h1 className="text-lg font-bold text-black">{t('appName')}</h1>
          <div className="flex gap-2 items-center">
            <button
              onClick={toggleLang}
              className="text-xs text-slate-500 border border-slate-200 rounded-full px-2.5 py-1"
            >
              {i18n.language === 'en' ? 'ع' : 'EN'}
            </button>
            <button onClick={() => signOut()} className="text-sm text-slate-500 hover:text-black">
              {t('exit')}
            </button>
          </div>
        </div>

        {/* Directory view */}
        {(currentView === 'directory') && (
          <>
            {/* Search — always first, renders before data loads */}
            <div className="relative mb-6 max-w-xl">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                autoFocus
                className="w-full ps-9 pe-4 py-3 border border-slate-300 rounded-xl text-base bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-black mb-0.5">{t('networkDirectory')}</h2>
              <p className="text-sm text-slate-500">{t('networkSubtitle')}</p>
            </div>

            {loading && <p className="text-slate-500">{t('loadingProfiles')}</p>}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProfiles.map((profile) => (
                  <DoctorCard
                    key={profile.id}
                    profile={profile}
                    onViewProfile={handleViewProfile}
                    onEndorse={user && user.id !== profile.id ? setSelectedDoctor : undefined}
                    onPromote={isAdmin ? handlePromote : undefined}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}

            {!loading && !error && filteredProfiles.length === 0 && (
              <p className="text-slate-500 mt-4">{t('noProfiles')}</p>
            )}
          </>
        )}

        {/* Doctor profile view */}
        {currentView === 'doctor-profile' && viewingDoctor && (
          <DoctorProfile
            profile={viewingDoctor}
            onBack={handleBackToDirectory}
            onEndorse={user && user.id !== viewingDoctor.id ? () => setSelectedDoctor(viewingDoctor) : undefined}
            isAdmin={isAdmin}
            onPromote={isAdmin ? handlePromote : undefined}
          />
        )}

        {/* My profile view */}
        {currentView === 'my-profile' && (
          <div className="max-w-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-black mb-0.5">{t('myProfile')}</h2>
            </div>

            {userProfile ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="flex items-start gap-5 mb-6">
                  <img
                    src={userProfile.image_url || DEFAULT_IMAGE}
                    alt={userProfile.full_name}
                    className="w-20 h-20 rounded-full object-cover border border-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-black mb-0.5">
                      {t('drPrefix')} {userProfile.full_name}
                    </h3>
                    <p className="text-sm font-medium mb-3" style={{ color: '#0055ff' }}>
                      {userProfile.specialty}
                    </p>
                    <span className={`text-xs font-semibold uppercase border rounded-full px-3 py-0.5 ${
                      userProfile.trust_band === 'Advanced' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                      userProfile.trust_band === 'Strong'   ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      {t(`trustBand.${userProfile.trust_band.toLowerCase()}`, userProfile.trust_band)}
                    </span>
                  </div>
                </div>
                {userProfile.bio && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      {t('biography')}
                    </h4>
                    <p className="text-base text-black leading-relaxed">{userProfile.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500">{t('noProfile')}</p>
            )}
          </div>
        )}
      </main>

      {selectedDoctor && (
        <EvaluationModal
          doctorName={selectedDoctor.full_name}
          doctorId={selectedDoctor.id}
          onClose={() => setSelectedDoctor(null)}
          onSubmit={handleEvaluate}
        />
      )}
    </div>
  );
}
