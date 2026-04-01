import { useEffect, useState } from 'react';
import { supabase, Profile } from './lib/supabase';
import { EvaluationModal } from './components/EvaluationModal';
import { User } from 'lucide-react';

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProfiles(data);
    }

    setLoading(false);
  };

  const handleEvaluate = async (traits: number[]) => {
    if (!currentUser || !selectedDoctor) {
      throw new Error('Authentication required');
    }

    if (currentUser === selectedDoctor.id) {
      throw new Error('Self-evaluation not permitted.');
    }

    const { error } = await supabase
      .from('peer_reviews')
      .insert({
        evaluator_id: currentUser,
        evaluated_id: selectedDoctor.id,
        traits,
      });

    if (error) {
      throw error;
    }

    await loadData();
  };

  const getTrustBandColor = (band: string) => {
    switch (band) {
      case 'Advanced':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Strong':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Stable':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medical Professional Directory</h1>
          <p className="mt-2 text-gray-600">Professional peer evaluation system</p>
        </div>

        {!currentUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Please sign in to submit evaluations
            </p>
          </div>
        )}

        <div className="space-y-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{profile.full_name}</h3>
                    <p className="text-sm text-gray-600">{profile.specialty}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getTrustBandColor(profile.trust_band)}`}>
                        {profile.trust_band}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {currentUser && currentUser !== profile.id && (
                    <button
                      onClick={() => setSelectedDoctor(profile)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      Endorse
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {profiles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No medical professionals found</p>
            </div>
          )}
        </div>
      </div>

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

export default App;
