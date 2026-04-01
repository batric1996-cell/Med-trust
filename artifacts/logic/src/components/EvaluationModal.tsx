import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EvaluationModalProps {
  doctorName: string;
  doctorId: string;
  onClose: () => void;
  onSubmit: (traits: number[]) => Promise<void>;
}

export function EvaluationModal({ doctorName, onClose, onSubmit }: EvaluationModalProps) {
  const { t } = useTranslation();
  const [selectedTraits, setSelectedTraits] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TRAITS = [
    { id: 1, label: t('traits.clinicalAccuracy') },
    { id: 2, label: t('traits.communicationClarity') },
    { id: 3, label: t('traits.ethicalPractice') },
    { id: 4, label: t('traits.diagnosticSkill') },
    { id: 5, label: t('traits.collaboration') },
  ];

  const handleTraitToggle = (traitId: number) => {
    setError('');
    if (selectedTraits.includes(traitId)) {
      setSelectedTraits(selectedTraits.filter(id => id !== traitId));
    } else {
      if (selectedTraits.length >= 3) { setError(t('selectTraits')); return; }
      setSelectedTraits([...selectedTraits, traitId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedTraits.length < 1 || selectedTraits.length > 3) { setError(t('selectTraits')); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit(selectedTraits);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('unique_evaluation')) setError(t('alreadySubmitted'));
        else if (err.message.includes('no_self_evaluation') || err.message.includes('self')) setError(t('selfEvaluation'));
        else setError(t('errorOccurred'));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-900">{t('professionalEvaluation')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" disabled={isSubmitting}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            {t('evaluating')}: <span className="font-medium text-slate-900">{doctorName}</span>
          </p>

          <div className="space-y-3">
            {TRAITS.map((trait) => (
              <label key={trait.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTraits.includes(trait.id)}
                  onChange={() => handleTraitToggle(trait.id)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-700">{trait.label}</span>
              </label>
            ))}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-6 flex justify-end space-x-3">
            <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md">
              {t('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedTraits.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('submitting') : t('submitEvaluation')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
