import React, { useState } from 'react';
import { X, Copy, Check, Mail, Phone, MapPin, Trash2, CheckCircle2, RotateCcw, Archive } from 'lucide-react';
import { ItemStatus, LostItemRecord } from '../types';
import { ItemIllustration } from './ItemIllustration';
import { formatCoordinates } from './GeotaggedCamera';

interface ItemDetailModalProps {
  item: LostItemRecord | null;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: ItemStatus) => Promise<void>;
  onDeleteItem?: (id: string) => Promise<void>;
}

export function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const date = new Date(year, month, day);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getStatusBadge(status?: ItemStatus) {
  switch (status) {
    case 'Claimed':
      return {
        label: 'Claimed',
        classes: 'bg-[#FDF3EB] text-[#B8520D] border-[#DF6A18]/30'
      };
    case 'Returned':
      return {
        label: 'Returned to Owner',
        classes: 'bg-[#EBF3FF] text-[#1D4ED8] border-[#3B82F6]/30'
      };
    case 'Archived':
      return {
        label: 'Archived',
        classes: 'bg-[#F3EFE9] text-[#625D55] border-[#C5BCB0]'
      };
    case 'Active':
    default:
      return {
        label: 'Active Listing',
        classes: 'bg-[#EDF6F0] text-[#146B32] border-[#146B32]/30'
      };
  }
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onUpdateStatus,
  onDeleteItem
}) => {
  const [copied, setCopied] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  const emailMatch = item.contactInfo.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = item.contactInfo.match(/(\+?\d[\d\s-]{8,}\d)/);
  const statusBadge = getStatusBadge(item.status);

  const handleCopyContact = async () => {
    try {
      await navigator.clipboard.writeText(`${item.contactName} — ${item.contactInfo}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (!onUpdateStatus || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(item.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteItem || isDeleting) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await onDeleteItem(item.id);
      onClose();
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lost-item-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#191816]/55 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white border border-[#E5DFD6] rounded-xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5DFD6] bg-[#FAF8F5]">
          <div className="flex items-center gap-2 text-xs text-[#625D55] flex-wrap">
            <span className="font-semibold text-[#B8520D]">
              {item.kind === 'found_report'
                ? 'Found Item Report'
                : item.kind === 'find_request'
                  ? 'Search Assistance Request'
                  : 'Lost Item Report'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{item.location}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatDisplayDate(item.dateLost)}</span>
            <span aria-hidden="true">·</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.classes}`}
            >
              {statusBadge.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close item details"
            className="p-1.5 text-[#625D55] hover:text-[#191816] rounded-lg hover:bg-[#EFECE5] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          <ItemIllustration
            type={item.illustrationType}
            imageUrl={item.imageUrl}
            alt={item.name}
            className="h-56 w-full rounded-lg border border-[#E5DFD6]"
          />

          <div>
            <div className="flex items-start justify-between gap-3">
              <h2
                id="lost-item-modal-title"
                className="font-serif text-2xl font-semibold text-[#191816] leading-snug"
              >
                {item.name}
              </h2>
              <span
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusBadge.classes}`}
              >
                {item.status || 'Active'}
              </span>
            </div>

            <dl className="mt-4 divide-y divide-[#E5DFD6] border-t border-b border-[#E5DFD6] text-xs sm:text-sm">
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#625D55]">
                  {item.kind === 'found_report'
                    ? 'Location Found'
                    : item.kind === 'find_request'
                      ? 'Believed Location'
                      : 'Location Lost'}
                </dt>
                <dd className="font-medium text-[#191816] text-right">{item.location}</dd>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#625D55]">
                  {item.kind === 'found_report' ? 'Date Found' : 'Date Lost'}
                </dt>
                <dd className="font-medium text-[#191816] tabular-nums text-right">
                  {formatDisplayDate(item.dateLost)}
                </dd>
              </div>
              {item.geotag && (
                <div className="py-2.5 flex justify-between gap-4">
                  <dt className="text-[#625D55] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#146B32] shrink-0" />
                    <span>Geotagged Location</span>
                  </dt>
                  <dd className="font-mono tabular-nums font-medium text-[#146B32] text-right">
                    {formatCoordinates(item.geotag.latitude, item.geotag.longitude)}
                    {item.geotag.accuracy ? ` (±${item.geotag.accuracy}m)` : ''}
                  </dd>
                </div>
              )}
              <div className="py-2.5 flex justify-between gap-4">
                <dt className="text-[#625D55]">
                  {item.kind === 'found_report' ? 'Found By / Custodian' : 'Posted By'}
                </dt>
                <dd className="font-medium text-[#191816] text-right">{item.contactName}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-[#625D55] mb-1.5">Description</h3>
            <p className="text-sm sm:text-base text-[#191816] leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Contact Section */}
          <div className="pt-2 border-t border-[#E5DFD6]">
            <h3 className="text-xs font-semibold text-[#625D55] mb-2">
              Contact {item.contactName}
            </h3>
            <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#E5DFD6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#191816]">{item.contactName}</p>
                <p className="text-xs sm:text-sm font-mono tabular-nums text-[#625D55] mt-0.5 break-all">
                  {item.contactInfo}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {emailMatch && (
                  <a
                    href={`mailto:${emailMatch[0]}?subject=${encodeURIComponent(`Regarding ${item.name} on VTU Campus`)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#146B32] hover:bg-[#0E4F24] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
                {phoneMatch && (
                  <a
                    href={`tel:${phoneMatch[0].replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#146B32] bg-[#EDF6F0] hover:bg-[#DFEFE5] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleCopyContact}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#191816] bg-white hover:bg-[#EFECE5] border border-[#E5DFD6] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#146B32]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#625D55]" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* MongoDB Status Management (PATCH /api/items/:id/status & DELETE /api/items/:id) */}
          <div className="pt-3 border-t border-[#E5DFD6] space-y-3">
            <h3 className="text-xs font-semibold text-[#625D55]">Manage Item Listing</h3>

            <div className="flex flex-wrap items-center gap-2">
              {item.status !== 'Claimed' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('Claimed')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#FDF3EB] text-[#B8520D] hover:bg-[#F9E2D2] border border-[#DF6A18]/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Claimed</span>
                </button>
              )}

              {item.status !== 'Returned' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('Returned')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#EBF3FF] text-[#1D4ED8] hover:bg-[#DCEBFE] border border-[#3B82F6]/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark as Returned</span>
                </button>
              )}

              {item.status !== 'Archived' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('Archived')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#F3EFE9] text-[#625D55] hover:bg-[#E8E2D8] border border-[#C5BCB0] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive</span>
                </button>
              )}

              {item.status !== 'Active' && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange('Active')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#EDF6F0] text-[#146B32] hover:bg-[#DFEFE5] border border-[#146B32]/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen as Active</span>
                </button>
              )}

              {/* Delete Button */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className={`ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                  confirmDelete
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmDelete ? 'Confirm Delete?' : 'Delete Report'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
