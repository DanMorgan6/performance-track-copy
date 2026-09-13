import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import injuryLibrary from './injury_diagnosis_library.json';
import BodyDiagram from './BodyDiagram';
import InjurySummary from './InjurySummary';

export default function InjuryCaptureSystem({ onSave, initialData = null }) {
  const [view, setView] = useState('front'); // 'front' or 'back'
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [injuries, setInjuries] = useState(initialData || []);

  const currentRegion = useMemo(() => {
    if (!selectedRegion) return null;
    return injuryLibrary.regions.find(r => r.region_key === selectedRegion.region_key);
  }, [selectedRegion]);

  const handleRegionSelect = (regionKey, side = null) => {
    const region = injuryLibrary.regions.find(r => r.region_key === regionKey);
    if (region.sides.includes('bilateral')) {
      setSelectedRegion({ region_key: regionKey });
    } else {
      setSelectedRegion({ region_key: regionKey, side: side || 'left' });
    }
  };

  const handleAddInjury = (diagnosisKey, modifiers = {}) => {
    const newInjury = {
      id: `${selectedRegion.region_key}-${selectedRegion.side || 'bilateral'}-${diagnosisKey}-${Date.now()}`,
      region_key: selectedRegion.region_key,
      side: selectedRegion.side || 'bilateral',
      view: view,
      primary_diagnosis_issue_key: diagnosisKey,
      modifiers: modifiers
    };
    setInjuries([...injuries, newInjury]);
    setSelectedRegion(null);
  };

  const handleRemoveInjury = (injuryId) => {
    setInjuries(injuries.filter(i => i.id !== injuryId));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(injuries);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Injury Capture</h2>
        <p className="text-sm text-slate-600">Select body region and specify injuries</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('front')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            view === 'front'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          Front View
        </button>
        <button
          onClick={() => setView('back')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            view === 'back'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          Back View
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Body Diagram */}
        <div className="lg:col-span-2">
          <BodyDiagram
            view={view}
            selectedRegion={selectedRegion}
            onRegionSelect={handleRegionSelect}
          />
        </div>

        {/* Region Panel */}
        <div className="space-y-4">
          {selectedRegion && currentRegion ? (
            <RegionPanel
              region={currentRegion}
              selectedRegion={selectedRegion}
              onAddInjury={handleAddInjury}
              onClose={() => setSelectedRegion(null)}
            />
          ) : (
            <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-500 text-sm">
              Click on a body region to add an injury
            </div>
          )}
        </div>
      </div>

      {/* Injury Summary */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="font-semibold text-slate-800 mb-4">Selected Injuries</h3>
        {injuries.length === 0 ? (
          <p className="text-slate-500 text-sm">No injuries added yet</p>
        ) : (
          <div className="space-y-2">
            {injuries.map(injury => (
              <InjurySummary
                key={injury.id}
                injury={injury}
                onRemove={handleRemoveInjury}
              />
            ))}
          </div>
        )}
      </div>

      {injuries.length > 0 && (
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Save Injuries
          </button>
        </div>
      )}
    </div>
  );
}

function RegionPanel({ region, selectedRegion, onAddInjury, onClose }) {
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(null);
  const [modifiers, setModifiers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDiagnoses = region.diagnoses.filter(d =>
    d.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDiagnosis = region.diagnoses.find(d => d.issue_key === primaryDiagnosis);

  const handleSelectDiagnosis = (diagnosisKey) => {
    setPrimaryDiagnosis(diagnosisKey);
    setModifiers({});
  };

  const handleModifierChange = (key, value) => {
    setModifiers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAdd = () => {
    if (primaryDiagnosis) {
      onAddInjury(primaryDiagnosis, modifiers);
      setPrimaryDiagnosis(null);
      setModifiers({});
      setSearchQuery('');
    }
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-slate-800">
          {region.label} {selectedRegion.side && `(${selectedRegion.side})`}
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search diagnoses..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />

      {/* Diagnosis List */}
      <div className="space-y-2">
        {filteredDiagnoses.map(diagnosis => (
          <button
            key={diagnosis.issue_key}
            onClick={() => handleSelectDiagnosis(diagnosis.issue_key)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              primaryDiagnosis === diagnosis.issue_key
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            )}
          >
            {diagnosis.label}
          </button>
        ))}
      </div>

      {/* Modifiers */}
      {selectedDiagnosis && selectedDiagnosis.modifiers.length > 0 && (
        <div className="border-t border-slate-200 pt-3 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase">Modifiers</p>
          {selectedDiagnosis.modifiers.map(modifier => (
            <div key={modifier.key}>
              {modifier.type === 'select' ? (
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    {modifier.label}
                  </label>
                  <select
                    value={modifiers[modifier.key] || ''}
                    onChange={e => handleModifierChange(modifier.key, e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                  >
                    <option value="">Select...</option>
                    {modifier.options.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ) : modifier.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={modifiers[modifier.key] || false}
                    onChange={e => handleModifierChange(modifier.key, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-slate-700">{modifier.label}</span>
                </label>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={handleAdd}
        disabled={!primaryDiagnosis}
        className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg font-medium text-sm transition-colors"
      >
        Add Injury
      </button>
    </div>
  );
}