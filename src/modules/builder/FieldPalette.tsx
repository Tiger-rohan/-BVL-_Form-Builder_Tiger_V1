import React from 'react';
import { FieldType } from '../../types/form.ts';
import {
  Type,
  Mail,
  Hash,
  AlignLeft,
  ChevronDown,
  CheckCircle,
  CheckSquare,
  Calendar,
  Plus,
} from 'lucide-react';

interface FieldPaletteProps {
  onAddField: (type: FieldType) => void;
}

export const PALETTE_ITEMS: {
  type: FieldType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    type: 'text',
    label: 'Short Text',
    description: 'Names, short titles, one-line answers',
    icon: Type,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  {
    type: 'textarea',
    label: 'Paragraph / Notes',
    description: 'Multi-line comments, detailed observations',
    icon: AlignLeft,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  },
  {
    type: 'email',
    label: 'Email Address',
    description: 'Validated respondent contact email',
    icon: Mail,
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  {
    type: 'number',
    label: 'Number',
    description: 'Numeric quantities, age, metrics, score',
    icon: Hash,
    color: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    type: 'select',
    label: 'Dropdown Select',
    description: 'Single choice from a compact menu list',
    icon: ChevronDown,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
  },
  {
    type: 'radio',
    label: 'Single Choice (Radio)',
    description: 'Pick exactly one from visible options',
    icon: CheckCircle,
    color: 'bg-pink-50 text-pink-600 border-pink-200',
  },
  {
    type: 'checkbox',
    label: 'Multiple Choice',
    description: 'Select one or more items from a list',
    icon: CheckSquare,
    color: 'bg-teal-50 text-teal-600 border-teal-200',
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Calendar date selection (YYYY-MM-DD)',
    icon: Calendar,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
  },
];

export const FieldPalette: React.FC<FieldPaletteProps> = ({ onAddField }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">Question Types</h3>
          <p className="text-xs text-slate-400">Click to append field to your form</p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          8 Types
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => onAddField(item.type)}
              className="flex items-center gap-3 p-3 text-left rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/40 transition group"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 ${item.color} group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 flex items-center justify-between">
                  <span>{item.label}</span>
                  <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-600 transition" />
                </div>
                <div className="text-[11px] text-slate-400 truncate">{item.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
