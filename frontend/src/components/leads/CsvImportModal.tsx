import React, { useState, useMemo, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { leadService } from '../../services/leadService';
import { WebsiteTypeBadge } from './LeadBadges';

export interface CsvLeadRow {

  tempId: string;
  businessName: string;
  category: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  mapsUrl: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  reviewCount: number | null;
  isDuplicate: boolean;
  duplicateReason?: string;
  existingId?: number;
  selected?: boolean;
}

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvFileName, setCsvFileName] = useState<string>('');
  const [items, setItems] = useState<CsvLeadRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter settings
  const [filterDuplicate, setFilterDuplicate] = useState<'ALL' | 'NEW_ONLY' | 'DUPLICATES_ONLY'>('ALL');
  const [filterContact, setFilterContact] = useState<'ALL' | 'HAS_PHONE' | 'HAS_WEBSITE' | 'HAS_EMAIL'>('ALL');
  const [filterWebsiteType, setFilterWebsiteType] = useState<string>('ALL');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);

  
  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CsvLeadRow>>({});
  const [isDragOver, setIsDragOver] = useState(false);

  // Preview Mutation
  const previewMutation = useMutation({
    mutationFn: (csvText: string) => leadService.previewCsvImport(csvText),
    onSuccess: (data) => {
      setItems(data.items);
      toast.success(`Parsed ${data.total} leads (${data.newLeads} new, ${data.duplicates} duplicates)`);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to parse CSV file');
    },
  });

  // Confirm Import Mutation
  const confirmMutation = useMutation({
    mutationFn: (selectedLeads: Array<any>) => leadService.confirmCsvImport(selectedLeads),
    onSuccess: (data) => {
      toast.success(
        `Import complete! ${data.created} leads created, ${data.updated} updated.`
      );
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Import failed. Please try again.');
    },
  });

  const handleClose = () => {
    setItems([]);
    setCsvFileName('');
    setSearchQuery('');
    setFilterDuplicate('ALL');
    setFilterContact('ALL');
    setFilterMinRating(0);
    setEditingRowId(null);
    onClose();
  };

  const handleFileRead = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a valid .csv file');
      return;
    }
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        previewMutation.mutate(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0]);
    }
  };

  // Selection handlers
  const toggleRowSelect = (tempId: string) => {
    setItems((prev) =>
      prev.map((row) => (row.tempId === tempId ? { ...row, selected: !row.selected } : row))
    );
  };

  const handleSelectAllFiltered = (selected: boolean) => {
    const filteredIds = new Set(filteredItems.map((f) => f.tempId));
    setItems((prev) =>
      prev.map((row) => (filteredIds.has(row.tempId) ? { ...row, selected } : row))
    );
  };

  const handleSelectOnlyNew = () => {
    setItems((prev) =>
      prev.map((row) => ({ ...row, selected: !row.isDuplicate }))
    );
    toast.info('Selected all non-duplicate leads');
  };

  // Editing Handlers
  const startEditing = (row: CsvLeadRow) => {
    setEditingRowId(row.tempId);
    setEditForm({ ...row });
  };

  const cancelEditing = () => {
    setEditingRowId(null);
    setEditForm({});
  };

  const saveEditing = (tempId: string) => {
    setItems((prev) =>
      prev.map((row) =>
        row.tempId === tempId
          ? {
              ...row,
              businessName: editForm.businessName || row.businessName,
              category: editForm.category !== undefined ? editForm.category : row.category,
              city: editForm.city !== undefined ? editForm.city : row.city,
              phone: editForm.phone !== undefined ? editForm.phone : row.phone,
              email: editForm.email !== undefined ? editForm.email : row.email,
              website: editForm.website !== undefined ? editForm.website : row.website,
              address: editForm.address !== undefined ? editForm.address : row.address,
              rating: editForm.rating !== undefined ? editForm.rating : row.rating,
            }
          : row
      )
    );
    setEditingRowId(null);
    setEditForm({});
    toast.success('Row updated');
  };

  const removeRow = (tempId: string) => {
    setItems((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = row.businessName.toLowerCase().includes(q);
        const matchesCat = (row.category || '').toLowerCase().includes(q);
        const matchesCity = (row.city || '').toLowerCase().includes(q);
        const matchesPhone = (row.phone || '').includes(q);
        if (!matchesName && !matchesCat && !matchesCity && !matchesPhone) return false;
      }

      // Duplicates filter
      if (filterDuplicate === 'NEW_ONLY' && row.isDuplicate) return false;
      if (filterDuplicate === 'DUPLICATES_ONLY' && !row.isDuplicate) return false;

      // Contact filter
      if (filterContact === 'HAS_PHONE' && !row.phone) return false;
      if (filterContact === 'HAS_WEBSITE' && !row.website) return false;
      if (filterContact === 'HAS_EMAIL' && !row.email) return false;

      // Website Type filter
      if (filterWebsiteType !== 'ALL') {
        const clean = (row.website || '').toLowerCase();
        if (filterWebsiteType === 'NONE' && row.website && row.website.trim().length > 0) return false;
        if (filterWebsiteType === 'INSTAGRAM' && !clean.includes('instagram.com')) return false;
        if (filterWebsiteType === 'FACEBOOK' && !clean.includes('facebook.com') && !clean.includes('fb.com')) return false;
        if (filterWebsiteType === 'INDIAMART' && !clean.includes('indiamart.com')) return false;
        if (filterWebsiteType === 'JUSTDIAL' && !clean.includes('justdial.com')) return false;
        if (filterWebsiteType === 'CUSTOM') {
          if (!row.website || clean.includes('instagram.com') || clean.includes('facebook.com') || clean.includes('indiamart.com') || clean.includes('justdial.com')) {
            return false;
          }
        }
      }

      // Rating filter
      if (filterMinRating > 0) {
        if (!row.rating || row.rating < filterMinRating) return false;
      }

      return true;
    });
  }, [items, searchQuery, filterDuplicate, filterContact, filterWebsiteType, filterMinRating]);


  const selectedCount = items.filter((i) => i.selected).length;
  const filteredSelectedCount = filteredItems.filter((i) => i.selected).length;

  const handleConfirmImport = () => {
    const selectedLeads = items.filter((i) => i.selected);
    if (selectedLeads.length === 0) {
      toast.error('No leads selected for import.');
      return;
    }

    const payload = selectedLeads.map((item) => ({
      businessName: item.businessName,
      category: item.category,
      city: item.city,
      address: item.address,
      website: item.website,
      mapsUrl: item.mapsUrl,
      phone: item.phone,
      email: item.email,
      rating: item.rating,
      reviewCount: item.reviewCount,
      updateIfExisting: item.isDuplicate,
    }));

    confirmMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground font-display flex items-center gap-2">
                  Import Leads from Google Maps CSV
                </h2>
                <p className="text-xs text-muted-foreground">
                  Preview, filter, inline-edit, and verify your leads before saving them into the pipeline.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. File Upload Dropzone if no items */}
            {items.length === 0 ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-secondary/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileRead(e.target.files[0]);
                    }
                  }}
                />

                <div className="p-4 rounded-full bg-primary/10 text-primary">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1 max-w-sm">
                  <p className="text-sm font-semibold text-foreground">
                    Click to browse or drag & drop Google Maps results CSV
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports output from Maps Scraper extensions (Name, Phone, Category, Address, Website, Rating, etc.)
                  </p>
                </div>

                {previewMutation.isPending && (
                  <div className="flex items-center gap-2 text-xs text-primary font-medium mt-2">
                    <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Parsing & cross-checking database records...
                  </div>
                )}
              </div>
            ) : (
              /* 2. Interactive Preview & Filter Toolbar */
              <div className="space-y-4">
                {/* Stats Header & Re-upload Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/50 rounded-lg border border-border text-xs">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-primary" /> {csvFileName || 'CSV Results'}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-foreground">
                      Total: <strong>{items.length}</strong>
                    </span>
                    <span className="text-emerald-500 font-medium">
                      New: <strong>{items.filter((i) => !i.isDuplicate).length}</strong>
                    </span>
                    <span className="text-amber-500 font-medium">
                      Duplicates: <strong>{items.filter((i) => i.isDuplicate).length}</strong>
                    </span>
                    <span className="text-primary font-semibold">
                      Selected: <strong>{selectedCount}</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setItems([]);
                      setCsvFileName('');
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Upload Different File
                  </button>
                </div>

                {/* Filters & Search Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-card p-3 rounded-lg border border-border">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search name, phone, city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Duplicate Filter */}
                  <select
                    value={filterDuplicate}
                    onChange={(e: any) => setFilterDuplicate(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-md bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">All Records ({items.length})</option>
                    <option value="NEW_ONLY">New Leads Only ({items.filter((i) => !i.isDuplicate).length})</option>
                    <option value="DUPLICATES_ONLY">Duplicates in DB ({items.filter((i) => i.isDuplicate).length})</option>
                  </select>

                  {/* Contact Info Filter */}
                  <select
                    value={filterContact}
                    onChange={(e: any) => setFilterContact(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-md bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">All Contact Details</option>
                    <option value="HAS_PHONE">Has Phone Number</option>
                    <option value="HAS_WEBSITE">Has Website</option>
                    <option value="HAS_EMAIL">Has Email Address</option>
                  </select>

                  {/* Website Type Filter */}
                  <select
                    value={filterWebsiteType}
                    onChange={(e) => setFilterWebsiteType(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-md bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="ALL">All Website Types</option>
                    <option value="CUSTOM">Dedicated Website</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="INDIAMART">IndiaMART</option>
                    <option value="JUSTDIAL">Justdial</option>
                    <option value="NONE">No Website (Missing)</option>
                  </select>

                  {/* Minimum Rating */}
                  <select
                    value={filterMinRating}
                    onChange={(e) => setFilterMinRating(parseFloat(e.target.value))}
                    className="px-3 py-1.5 text-xs rounded-md bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="0">Any Rating (All)</option>
                    <option value="4.0">Rating ≥ 4.0 ★</option>
                    <option value="4.5">Rating ≥ 4.5 ★</option>
                    <option value="4.8">Rating ≥ 4.8 ★</option>
                  </select>
                </div>


                {/* Bulk Selection Action Bar */}
                <div className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectAllFiltered(true)}
                      className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground font-medium flex items-center gap-1 border border-border"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-primary" /> Select Filtered ({filteredItems.length})
                    </button>
                    <button
                      onClick={() => handleSelectAllFiltered(false)}
                      className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 border border-border"
                    >
                      <Square className="w-3.5 h-3.5" /> Deselect Filtered
                    </button>
                    <button
                      onClick={handleSelectOnlyNew}
                      className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium flex items-center gap-1 border border-emerald-500/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Select Only New ({items.filter((i) => !i.isDuplicate).length})
                    </button>
                  </div>

                  <span className="text-muted-foreground">
                    Showing <strong>{filteredItems.length}</strong> of {items.length} rows
                  </span>
                </div>

                {/* 3. Table of Leads */}
                <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
                  <div className="max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm border-b border-border z-10 text-muted-foreground font-medium">
                        <tr>
                          <th className="p-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={filteredItems.length > 0 && filteredItems.every((i) => i.selected)}
                              onChange={(e) => handleSelectAllFiltered(e.target.checked)}
                              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                          </th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Business Name</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">City / Address</th>
                          <th className="p-3">Phone</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Website</th>
                          <th className="p-3 text-center">Rating</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-muted-foreground">
                              No records match the current filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((row) => {
                            const isEditing = editingRowId === row.tempId;

                            return (
                              <tr
                                key={row.tempId}
                                className={`transition-colors ${
                                  row.selected ? 'bg-primary/5' : 'hover:bg-secondary/30'
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={!!row.selected}
                                    onChange={() => toggleRowSelect(row.tempId)}
                                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                  />
                                </td>

                                {/* Duplicate/New Status */}
                                <td className="p-3 whitespace-nowrap">
                                  {row.isDuplicate ? (
                                    <span
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                      title={row.duplicateReason}
                                    >
                                      <AlertTriangle className="w-3 h-3" /> Duplicate
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      <CheckCircle2 className="w-3 h-3" /> Ready
                                    </span>
                                  )}
                                </td>

                                {/* Business Name */}
                                <td className="p-3 font-medium text-foreground max-w-[180px]">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.businessName || ''}
                                      onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                                      className="w-full px-2 py-1 bg-background border border-primary rounded text-xs"
                                    />
                                  ) : (
                                    <div className="truncate font-semibold" title={row.businessName}>
                                      {row.businessName}
                                    </div>
                                  )}
                                </td>

                                {/* Category */}
                                <td className="p-3 text-muted-foreground max-w-[140px]">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.category || ''}
                                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                      className="w-full px-2 py-1 bg-background border border-primary rounded text-xs"
                                    />
                                  ) : (
                                    <span className="truncate block" title={row.category || '-'}>
                                      {row.category || '-'}
                                    </span>
                                  )}
                                </td>

                                {/* City / Address */}
                                <td className="p-3 text-muted-foreground max-w-[160px]">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.city || ''}
                                      placeholder="City"
                                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                      className="w-full px-2 py-1 bg-background border border-primary rounded text-xs"
                                    />
                                  ) : (
                                    <div className="truncate" title={row.address || row.city || '-'}>
                                      {row.city ? (
                                        <span className="font-medium text-foreground">{row.city}</span>
                                      ) : (
                                        <span className="text-muted-foreground">{row.address || '-'}</span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Phone */}
                                <td className="p-3 whitespace-nowrap">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.phone || ''}
                                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                      className="w-full px-2 py-1 bg-background border border-primary rounded text-xs"
                                    />
                                  ) : row.phone ? (
                                    <span className="text-foreground">{row.phone}</span>
                                  ) : (
                                    <span className="text-muted-foreground/50">-</span>
                                  )}
                                </td>

                                {/* Email */}
                                <td className="p-3 max-w-[130px]">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.email || ''}
                                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                      className="w-full px-2 py-1 bg-background border border-primary rounded text-xs"
                                    />
                                  ) : row.email ? (
                                    <span className="truncate block text-primary" title={row.email}>
                                      {row.email}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/50">-</span>
                                  )}
                                </td>

                                {/* Website */}
                                <td className="p-3 max-w-[150px]">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editForm.website || ''}
                                      placeholder="https://..."
                                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                      className="w-full px-2 py-1 bg-background border border-primary rounded text-xs"
                                    />
                                  ) : row.website ? (
                                    <div className="flex flex-col gap-1 items-start">
                                      <WebsiteTypeBadge url={row.website} />
                                      <a
                                        href={row.website.startsWith('http') ? row.website : `https://${row.website}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="truncate block text-indigo-500 hover:underline max-w-[140px]"
                                        title={row.website}
                                      >
                                        {row.website.replace(/^https?:\/\/(www\.)?/, '')}
                                      </a>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/50">-</span>
                                  )}
                                </td>


                                {/* Rating */}
                                <td className="p-3 text-center whitespace-nowrap">
                                  {row.rating ? (
                                    <span className="inline-flex items-center gap-1 font-medium text-amber-500">
                                      <Star className="w-3 h-3 fill-amber-500" /> {row.rating}
                                      {row.reviewCount ? (
                                        <span className="text-[10px] text-muted-foreground">({row.reviewCount})</span>
                                      ) : null}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/50">-</span>
                                  )}
                                </td>

                                {/* Row Actions */}
                                <td className="p-3 text-right whitespace-nowrap">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => saveEditing(row.tempId)}
                                        className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-medium"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="px-2 py-0.5 rounded bg-secondary text-foreground text-[10px]"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                      <button
                                        onClick={() => startEditing(row)}
                                        className="p-1 hover:text-foreground hover:bg-secondary rounded transition-colors"
                                        title="Edit this record inline"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => removeRow(row.tempId)}
                                        className="p-1 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors"
                                        title="Exclude from import"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-4 border-t border-border bg-card/80 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info className="w-4 h-4 text-primary" />
              Only checked records will be saved to your database.
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-xs font-medium border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={selectedCount === 0 || confirmMutation.isPending}
                className="px-4 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
              >
                {confirmMutation.isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Import {selectedCount} Verified {selectedCount === 1 ? 'Lead' : 'Leads'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
