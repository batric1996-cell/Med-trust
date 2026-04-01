import { useTranslation } from 'react-i18next';
import { ArrowLeft, Phone, Globe, MapPin, Briefcase, BookOpen, Award, Users } from 'lucide-react';
import { Profile, effectiveRole } from '../lib/supabase';

const BADGE_STYLES: Record<string, string> = {
  Stable:   'bg-slate-100 text-slate-600 border-slate-300',
  Strong:   'bg-blue-100 text-blue-700 border-blue-300',
  Advanced: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  elite:    'bg-amber-100 text-amber-700 border-amber-300',
  admin:    'bg-purple-100 text-purple-700 border-purple-300',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop';

interface Section {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}

function InfoSection({ title, items }: { title: string; items: Section[] }) {
  const filled = items.filter((i) => i.value);
  if (filled.length === 0) return null;
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{title}</h3>
      <div className="space-y-3">
        {filled.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            {item.icon && <span className="mt-0.5 text-slate-400 flex-shrink-0">{item.icon}</span>}
            <div>
              <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
              <p className="text-base text-black leading-relaxed">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DoctorProfileProps {
  profile: Profile;
  onBack: () => void;
  onEndorse?: () => void;
  isAdmin?: boolean;
  onPromote?: (profile: Profile, newRole: string) => void;
}

export function DoctorProfile({ profile, onBack, onEndorse, isAdmin, onPromote }: DoctorProfileProps) {
  const { t } = useTranslation();
  const role = effectiveRole(profile);
  const bandKey = profile.trust_band === 'Advanced' ? 'elite' : profile.trust_band.toLowerCase();
  const badgeStyle = BADGE_STYLES[profile.trust_band] ?? BADGE_STYLES.Stable;

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-black mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('back')}
      </button>

      {/* Hero */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-4">
        <div className="flex items-start gap-6">
          <img
            src={profile.image_url || DEFAULT_IMAGE}
            alt={profile.full_name}
            className="w-24 h-24 rounded-full object-cover flex-shrink-0 border border-slate-100"
            onError={(e) => { e.currentTarget.src = DEFAULT_IMAGE; }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-black mb-0.5">
              {t('drPrefix')} {profile.full_name}
            </h1>
            <p className="text-base font-medium mb-3" style={{ color: '#0055ff' }}>
              {profile.specialty}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs font-semibold uppercase border rounded-full px-3 py-0.5 ${badgeStyle}`}>
                {t(`trustBand.${bandKey}`, profile.trust_band)}
              </span>
              {role === 'admin' && (
                <span className={`text-xs font-semibold uppercase border rounded-full px-3 py-0.5 ${BADGE_STYLES.admin}`}>
                  {t('role.admin')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-4 space-y-1">
        {/* Basic */}
        <InfoSection
          title=""
          items={[
            { label: t('workplace'), value: profile.workplace, icon: <Briefcase className="w-4 h-4" /> },
          ]}
        />

        {/* Location */}
        <InfoSection
          title={t('location')}
          items={[
            { label: t('governorate'), value: profile.governorate, icon: <MapPin className="w-4 h-4" /> },
            { label: t('clinicLocation'), value: profile.clinic_location, icon: <MapPin className="w-4 h-4" /> },
          ]}
        />

        {/* About */}
        {profile.bio && (
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{t('biography')}</h3>
            <p className="text-base text-black leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Professional */}
        <InfoSection
          title={t('professionalInfo')}
          items={[
            { label: t('qualifications'), value: profile.qualifications, icon: <Award className="w-4 h-4" /> },
            { label: t('experience'), value: profile.experience, icon: <Briefcase className="w-4 h-4" /> },
            { label: t('memberships'), value: profile.memberships, icon: <Users className="w-4 h-4" /> },
            { label: t('publications'), value: profile.publications, icon: <BookOpen className="w-4 h-4" /> },
          ]}
        />

        {/* Contact */}
        <InfoSection
          title={t('contact')}
          items={[
            { label: t('phone'), value: profile.phone, icon: <Phone className="w-4 h-4" /> },
            { label: t('website'), value: profile.website, icon: <Globe className="w-4 h-4" /> },
          ]}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {onEndorse && (
          <button
            onClick={onEndorse}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            {t('endorse')}
          </button>
        )}
        {isAdmin && onPromote && role !== 'admin' && (
          <button
            onClick={() => onPromote(profile, 'admin')}
            className="px-6 py-2.5 border border-purple-300 text-purple-700 rounded-lg font-medium hover:bg-purple-50"
          >
            {t('promoteToAdmin')}
          </button>
        )}
      </div>
    </div>
  );
}
