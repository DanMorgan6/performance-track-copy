import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';
import { injuryDiagnosisLibrary } from './injuryDiagnosisLibrary';

export default function InjuryCaptureForm({ onAddInjury, onRemoveInjury, injuries = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedIssue, setSelectedIssue] = useState('');
  const [formData, setFormData] = useState({
    side: '',
    severity: '',
    confirmed_status: 'suspected',
    muscle_grade: {},
    disc_details: {},
    meniscus_details: {},
    oa_compartment: '',
    impingement_type: '',
    notes: '',
    date_of_injury: ''
  });

  const currentRegion = injuryDiagnosisLibrary.regions.find(r => r.region_key === selectedRegion);
  const currentGroup = currentRegion?.groups.find(g => g.group_key === selectedGroup);
  const currentIssue = currentGroup?.items.find(i => i.issue_key === selectedIssue);

  const resetForm = () => {
    setSelectedRegion('');
    setSelectedGroup('');
    setSelectedIssue('');
    setFormData({
      side: '',
      severity: '',
      confirmed_status: 'suspected',
      muscle_grade: {},
      disc_details: {},
      meniscus_details: {},
      oa_compartment: '',
      impingement_type: '',
      notes: '',
      date_of_injury: ''
    });
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!selectedRegion || !selectedGroup || !selectedIssue || !formData.side) {
      alert('Please fill in all required fields');
      return;
    }

    const region = injuryDiagnosisLibrary.regions.find(r => r.region_key === selectedRegion);
    const group = region.groups.find(g => g.group_key === selectedGroup);
    const issue = group.items.find(i => i.issue_key === selectedIssue);

    const injuryData = {
      region_key: selectedRegion,
      region_label: region.label,
      group_key: selectedGroup,
      group_label: group.label,
      issue_key: selectedIssue,
      issue_label: issue.label,
      side: formData.side,
      severity: formData.severity || undefined,
      confirmed_status: formData.confirmed_status,
      modifiers_data: {
        muscle_grade: Object.keys(formData.muscle_grade).length > 0 ? formData.muscle_grade : undefined,
        disc_details: Object.keys(formData.disc_details).length > 0 ? formData.disc_details : undefined,
        meniscus_details: Object.keys(formData.meniscus_details).length > 0 ? formData.meniscus_details : undefined,
        oa_compartment: formData.oa_compartment || undefined,
        impingement_type: formData.impingement_type || undefined
      },
      notes: formData.notes || undefined,
      date_of_injury: formData.date_of_injury || undefined
    };

    onAddInjury(injuryData);
    resetForm();
  };

  const hasModifier = (modifierKey) => {
    if (typeof modifierKey === 'string') {
      return currentIssue?.modifiers?.includes(modifierKey);
    }
    return currentIssue?.modifiers?.some(m => m.key === modifierKey);
  };

  const renderModifierField = (modifier) => {
    if (typeof modifier === 'string') {
      const globalModifier = injuryDiagnosisLibrary.global[modifier];
      
      if (!globalModifier) return null;

      if (globalModifier.type === 'enum') {
        return (
          <div key={modifier} className="space-y-2">
            <Label className="text-slate-600">{globalModifier.label}</Label>
            <select
              value={formData[globalModifier.key] || ''}
              onChange={(e) => setFormData({...formData, [globalModifier.key]: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
            >
              <option value="">{globalModifier.optional ? 'Optional' : 'Select...'}</option>
              {globalModifier.options.map(opt => (
                <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        );
      }

      if (globalModifier.type === 'object') {
        return (
          <div key={modifier} className="space-y-3 border border-slate-200 rounded-lg p-3">
            <p className="font-medium text-slate-700">{globalModifier.label}</p>
            {globalModifier.fields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label className="text-slate-600 text-sm">{field.label}</Label>
                {field.type === 'enum' && (
                  <select
                    value={formData[modifier]?.[field.key] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      [modifier]: {...formData[modifier], [field.key]: e.target.value}
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm"
                  >
                    <option value="">{field.optional ? 'Optional' : 'Select...'}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                )}
                {field.type === 'string' && (
                  <Input
                    value={formData[modifier]?.[field.key] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      [modifier]: {...formData[modifier], [field.key]: e.target.value}
                    })}
                    placeholder={field.hint || ''}
                    className="rounded-lg text-sm"
                  />
                )}
                {field.type === 'boolean' && (
                  <input
                    type="checkbox"
                    checked={formData[modifier]?.[field.key] || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      [modifier]: {...formData[modifier], [field.key]: e.target.checked}
                    })}
                    className="rounded"
                  />
                )}
              </div>
            ))}
          </div>
        );
      }
    } else {
      const customModifier = modifier;
      
      if (customModifier.type === 'enum') {
        return (
          <div key={customModifier.key} className="space-y-2">
            <Label className="text-slate-600">{customModifier.label}</Label>
            <select
              value={formData[customModifier.key] || ''}
              onChange={(e) => setFormData({...formData, [customModifier.key]: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
            >
              <option value="">{customModifier.optional ? 'Optional' : 'Select...'}</option>
              {customModifier.options.map(opt => (
                <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        );
      }

      if (customModifier.type === 'boolean') {
        return (
          <div key={customModifier.key} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={customModifier.key}
              checked={formData[customModifier.key] || false}
              onChange={(e) => setFormData({...formData, [customModifier.key]: e.target.checked})}
              className="rounded"
            />
            <Label htmlFor={customModifier.key} className="text-slate-600 cursor-pointer">{customModifier.label}</Label>
          </div>
        );
      }

      if (customModifier.type === 'multi_picklist') {
        const picklistItems = injuryDiagnosisLibrary.picklists[customModifier.picklist] || [];
        return (
          <div key={customModifier.key} className="space-y-2">
            <Label className="text-slate-600">{customModifier.label}</Label>
            <select
              multiple
              value={formData[customModifier.key] || []}
              onChange={(e) => setFormData({
                ...formData,
                [customModifier.key]: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
            >
              {picklistItems.map(item => (
                <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Injuries List */}
      {injuries.length > 0 && (
        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold">Recorded Injuries</Label>
          {injuries.map((injury, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{injury.region_label} - {injury.issue_label}</p>
                <p className="text-xs text-slate-500">{injury.group_label} • {injury.side} • {injury.confirmed_status}</p>
              </div>
              <Button
                onClick={() => onRemoveInjury(idx)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-rose-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Injury Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full rounded-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Injury / Condition
        </Button>
      ) : (
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold">Select Region</Label>
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedGroup('');
                setSelectedIssue('');
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
            >
              <option value="">Select a region...</option>
              {injuryDiagnosisLibrary.regions.map(region => (
                <option key={region.region_key} value={region.region_key}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Select Group</Label>
              <select
                value={selectedGroup}
                onChange={(e) => {
                  setSelectedGroup(e.target.value);
                  setSelectedIssue('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
              >
                <option value="">Select a group...</option>
                {currentRegion?.groups.map(group => (
                  <option key={group.group_key} value={group.group_key}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedGroup && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Select Diagnosis</Label>
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
              >
                <option value="">Select a diagnosis...</option>
                {currentGroup?.items.map(item => (
                  <option key={item.issue_key} value={item.issue_key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedIssue && (
            <>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Side *</Label>
                <select
                  value={formData.side}
                  onChange={(e) => setFormData({...formData, side: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900"
                >
                  <option value="">Select side...</option>
                  {currentRegion?.default_sides.map(side => (
                    <option key={side} value={side}>{side}</option>
                  ))}
                </select>
              </div>

              {/* Modifiers */}
              <div className="space-y-3 pt-2 border-t border-slate-300">
                {currentIssue?.modifiers?.map((modifier) => renderModifierField(modifier))}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">Date of Injury</Label>
                <Input
                  type="date"
                  value={formData.date_of_injury}
                  onChange={(e) => setFormData({...formData, date_of_injury: e.target.value})}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional clinician notes..."
                  className="rounded-lg min-h-[80px]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                >
                  Add Injury
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}