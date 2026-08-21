import React from 'react';
import { Tag, Plus } from 'lucide-react';
import { TemplateVariable } from '../../types/template';

interface VariablePickerProps {
  variables: TemplateVariable[];
  onSelectVariable: (variableKey: string) => void;
}

export const VariablePicker: React.FC<VariablePickerProps> = ({ variables, onSelectVariable }) => {
  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground font-display flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-primary" /> Dynamic Variables Picker
        </h3>
        <span className="text-[10px] text-muted-foreground">Click chip to insert</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {variables.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onSelectVariable(v.key)}
            className="px-2.5 py-1 rounded-md bg-background border border-border text-foreground hover:bg-primary hover:text-primary-foreground text-xs font-mono transition-colors inline-flex items-center gap-1 group shadow-sm"
            title={`${v.label}: e.g. "${v.example}"`}
          >
            <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
            <span>{v.key}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        Variables are automatically substituted with real lead values when generating messages (works without AI).
      </p>
    </div>
  );
};
