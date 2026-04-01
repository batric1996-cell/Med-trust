import { useState } from 'react';
import { X } from 'lucide-react';

interface EvaluationModalProps {
  doctorName: string;
  doctorId: string;
  onClose: () => void;
  onSubmit: (traits: number[]) => Promise<void>;
}

const TRAITS = [
  { id: 1, label: 'Clinical Accuracy' },
  { id: 2, label: 'Communication Clarity' },
  { id: 3, label: 'Ethical Practice' },
  { id: 4, label: 'Diagnostic Skill' },
  { id: 5, label: 'Collaboration' },
];

export function EvaluationModal({ doctorName, onClose, onSubmit }: EvaluationModalProps) {
  const [selectedTraits, setSelectedTraits] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTraitToggle = (traitId: number) => {
    setError('');

    if (selectedTraits.includes(traitId)) {
      setSelectedTraits(selectedTraits.filter(id => id !== traitId));
    } else {
      if (selectedTraits.length >= 3) {
        setError('Select 1 to 3 professional traits.');
        return;
      }
      setSelectedTraits([...selectedTraits, traitId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedTraits.length < 1 || selectedTraits.length > 3) {
      setError('Select 1 to 3 professional traits.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(selectedTraits);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('unique_evaluation')) {
          setError('Evaluation already submitted.');
        } else if (err.message.includes('no_self_evaluation') || err.message.includes('self')) {
          setError('Self-evaluation not permitted.');
        } else {
          setError('An error occurred. Please try again.');
        }
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Professional Evaluation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Evaluating: <span className="font-medium text-gray-900">{doctorName}</span>
          </p>

          <div className="space-y-3">
            {TRAITS.map((trait) => (
              <label
                key={trait.id}
                className="flex items-center space-x-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTraits.includes(trait.id)}
                  onChange={() => handleTraitToggle(trait.id)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-gray-700">{trait.label}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedTraits.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
