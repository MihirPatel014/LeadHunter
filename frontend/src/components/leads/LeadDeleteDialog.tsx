import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface LeadDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  leadName?: string;
  isLoading?: boolean;
}

export const LeadDeleteDialog: React.FC<LeadDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  leadName,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border w-full max-w-md rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-rose-500">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground font-display">Delete Lead</h3>
            <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-foreground">{leadName || 'this lead'}</span>? All recorded information and activity for this lead will be permanently removed.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-secondary text-foreground text-xs font-medium border border-border hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete Lead
          </button>
        </div>
      </div>
    </div>
  );
};
