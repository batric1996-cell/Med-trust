import { useTranslation } from 'react-i18next';
import { Profile, effectiveRole } from '../lib/supabase';

const BADGE_STYLES: Record<string, string> = {
  Stable:   'bg-slate-100 text-slate-600 border-slate-300',
  Strong:   'bg-blue-100 text-blue-700 border-blue-300',
  Advanced: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  elite:    'bg-amber-100 text-amber-700 border-amber-300',
  admin:    'bg-purple-100 text-purple-700 border-purple-300',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop';

type DoctorCardProps = {
  profile: Profile;
  onViewProfile: (profile: Profile) => void;
  onEndorse?: (profile: Profile) => void;
  onPromote?: (profile: Profile, newRole: string) => void;
  isAdmin?: boolean;
};

export function DoctorCard({ profile, onViewProfile, onEndorse, onPromote, isAdmin }: DoctorCardProps) {
  const { t } = useTranslation();
  const role = effectiveRole(profile);
  const bandKey = profile.trust_band === 'Advanced' ? 'elite' : profile.trust_band.toLowerCase();
  const badgeStyle = BADGE_STYLES[profile.trust_band] ?? BADGE_STYLES.Stable;

  return (
    <div
      onClick={() => onViewProfile(profile)}
      className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-150"
    >
      <img
        src={profile.image_url || DEFAULT_IMAGE}
        alt={profile.full_name}
        className="w-20 h-20 rounded-full object-cover mb-4 border border-slate-100"
        onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
      />

      <h3 className="text-base font-bold text-black mb-0.5 leading-snug">
        {t('drPrefix')} {profile.full_name}
      </h3>

      <p className="text-sm font-medium mb-3" style={{ color: '#0055ff' }}>
        {profile.specialty}
      </p>

      {profile.bio && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
          {profile.bio}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 justify-center mb-5">
        <span className={`text-xs font-semibold uppercase border rounded-full px-3 py-0.5 ${badgeStyle}`}>
          {t(`trustBand.${bandKey}`, profile.trust_band)}
        </span>
        {role === 'admin' && (
          <span className={`text-xs font-semibold uppercase border rounded-full px-3 py-0.5 ${BADGE_STYLES.admin}`}>
            {t('role.admin')}
          </span>
        )}
      </div>

      {/* Buttons stop propagation to avoid triggering card click */}
      <div className="w-full space-y-2" onClick={(e) => e.stopPropagation()}>
        {onEndorse && (
          <button
            onClick={() => onEndorse(profile)}
            className="w-full border border-slate-300 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            {t('endorse')}
          </button>
        )}
        {isAdmin && onPromote && role !== 'admin' && (
          <button
            onClick={() => onPromote(profile, 'admin')}
            className="w-full border border-purple-300 text-purple-700 py-1.5 px-4 rounded-lg text-sm font-medium hover:bg-purple-50"
          >
            {t('promoteToAdmin')}
          </button>
        )}
      </div>
    </div>
  );
}
