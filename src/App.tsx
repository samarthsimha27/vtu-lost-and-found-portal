/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, ArrowUpRight, CheckCircle2, MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  CampusLocation,
  ItemStatus,
  LostItemRecord,
  MapMarkerPayload
} from './types';
import {
  CAMPUS_LOCATION_DIRECTORY,
  INITIAL_FIND_REQUESTS,
  INITIAL_LOST_ITEMS
} from './data/campusData';
import { FluidParticleHero } from './components/FluidParticleHero';
import {
  ActiveFeatureTab,
  Navbar,
  PRIMARY_ACTION_BUTTON_CLASS
} from './components/Navbar';
import { ItemIllustration } from './components/ItemIllustration';
import { formatDisplayDate, ItemDetailModal } from './components/ItemDetailModal';
import { PostFoundItemForm } from './components/PostFoundItemForm';
import { FindRequestsSection } from './components/FindRequestsSection';
import { CampusMapSlot } from './components/CampusMapSlot';
import { formatCoordinates } from './components/GeotaggedCamera';
import {
  createItem,
  deleteItem,
  fetchItems,
  updateItemStatus
} from './api/itemsApi';

const STATUS_OPTIONS: Array<'All Statuses' | ItemStatus> = [
  'All Statuses',
  'Active',
  'Claimed',
  'Returned',
  'Archived'
];

type ItemTypeFilter = 'All Items' | 'Found Items' | 'Lost Reports';

export default function App() {
  // Completely separate Hero Page vs. Main Application
  const [currentPage, setCurrentPage] = useState<'hero' | 'app'>('hero');
  const [activeTab, setActiveTab] = useState<ActiveFeatureTab>('find');

  const [lostItems, setLostItems] = useState<LostItemRecord[]>(INITIAL_LOST_ITEMS);
  const [findRequests, setFindRequests] = useState<LostItemRecord[]>(INITIAL_FIND_REQUESTS);
  const [isLoading, setIsLoading] = useState(true);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  // Search & Filter State for Feature 2: Find a Lost Item
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<'All Locations' | CampusLocation>(
    'All Locations'
  );
  const [selectedStatus, setSelectedStatus] = useState<'All Statuses' | ItemStatus>(
    'All Statuses'
  );
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ItemTypeFilter>('All Items');
  const [selectedItem, setSelectedItem] = useState<LostItemRecord | null>(null);
  const [justPostedNotice, setJustPostedNotice] = useState(false);

  // Load items from MongoDB via Express API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await fetchItems();
      const itemsList = records.filter(
        (r) => r.kind === 'lost_report' || r.kind === 'found_report'
      );
      const reqs = records.filter((r) => r.kind === 'find_request');
      setLostItems(itemsList);
      setFindRequests(reqs);
      setBackendNotice(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn('API error when fetching from MongoDB/Express:', message);
      setBackendNotice('Notice: Connected via local state fallback. Ensure Express server is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenMainApp = () => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setCurrentPage('app');
  };

  const handleReturnToHero = () => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setCurrentPage('hero');
  };

  const handleSelectTab = (tab: ActiveFeatureTab) => {
    setActiveTab(tab);
    setJustPostedNotice(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // POST /api/items for found items
  const handleAddFoundItem = async (newItem: LostItemRecord) => {
    try {
      const saved = await createItem(newItem);
      setLostItems((prev) => [saved, ...prev]);
    } catch (err: unknown) {
      console.error('Failed to save found item to database:', err);
      setLostItems((prev) => [newItem, ...prev]);
    }
    setSearchQuery('');
    setSelectedLocation('All Locations');
    setSelectedStatus('All Statuses');
    setSelectedTypeFilter('All Items');
    setActiveTab('find');
    setJustPostedNotice(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // POST /api/items for find requests
  const handleAddFindRequest = async (newRequest: LostItemRecord) => {
    try {
      const saved = await createItem(newRequest);
      setFindRequests((prev) => [saved, ...prev]);
    } catch (err: unknown) {
      console.error('Failed to save find request to database:', err);
      setFindRequests((prev) => [newRequest, ...prev]);
    }
  };

  // PATCH /api/items/:id/status
  const handleUpdateStatus = async (id: string, newStatus: ItemStatus) => {
    try {
      const updated = await updateItemStatus(id, newStatus);
      setLostItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setFindRequests((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(updated);
      }
    } catch (err: unknown) {
      console.error('Failed to update status in MongoDB:', err);
      // Optimistic fallback
      setLostItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      setFindRequests((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({ ...selectedItem, status: newStatus });
      }
    }
  };

  // DELETE /api/items/:id
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      setLostItems((prev) => prev.filter((item) => item.id !== id));
      setFindRequests((prev) => prev.filter((item) => item.id !== id));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
    } catch (err: unknown) {
      console.error('Failed to delete item from MongoDB:', err);
      setLostItems((prev) => prev.filter((item) => item.id !== id));
      setFindRequests((prev) => prev.filter((item) => item.id !== id));
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    selectedLocation !== 'All Locations' ||
    selectedStatus !== 'All Statuses' ||
    selectedTypeFilter !== 'All Items';

  const filteredLostItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return lostItems
      .filter((item) => {
        if (selectedLocation !== 'All Locations' && item.location !== selectedLocation) {
          return false;
        }
        if (selectedStatus !== 'All Statuses') {
          const currentStatus = item.status || 'Active';
          if (currentStatus !== selectedStatus) return false;
        }
        if (selectedTypeFilter === 'Found Items' && item.kind !== 'found_report') {
          return false;
        }
        if (selectedTypeFilter === 'Lost Reports' && item.kind !== 'lost_report') {
          return false;
        }
        if (q && !item.name.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [lostItems, searchQuery, selectedLocation, selectedStatus, selectedTypeFilter]);

  // Normalized marker architecture prepared for Leaflet integration
  const mapMarkers: MapMarkerPayload[] = useMemo(() => {
    return [...lostItems, ...findRequests].map((record) => ({
      id: record.id,
      kind: record.kind,
      title: record.name,
      status: record.status || 'Active',
      locationName: record.location,
      coordinates: record.geotag
        ? {
            latitude: record.geotag.latitude,
            longitude: record.geotag.longitude,
            accuracy: record.geotag.accuracy
          }
        : record.locationCoordinates,
      hasExactGeotag: Boolean(record.geotag),
      imageUrl: record.imageUrl,
      capturedAt: record.geotag?.capturedAt,
      dateLost: record.dateLost
    }));
  }, [lostItems, findRequests]);

  const campusLocationList = useMemo(
    () => Object.values(CAMPUS_LOCATION_DIRECTORY),
    []
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLocation('All Locations');
    setSelectedStatus('All Statuses');
    setSelectedTypeFilter('All Items');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#191816]">
      <AnimatePresence mode="wait">
        {currentPage === 'hero' ? (
          <motion.div
            key="standalone-hero-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <FluidParticleHero onOpenApp={handleOpenMainApp} />
          </motion.div>
        ) : (
          <motion.div
            key="standalone-main-app"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex flex-col"
          >
            {/* Focused Navigation with Identically Styled Three Primary Action Buttons */}
            <Navbar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              onReturnToHero={handleReturnToHero}
            />

            {backendNotice && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
                <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{backendNotice}</span>
                  <button
                    type="button"
                    onClick={loadData}
                    className="ml-auto inline-flex items-center gap-1 font-semibold text-amber-900 underline hover:no-underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            )}

            {/* Primary Feature Workspace */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
              {/* Feature 1: Post a Found Item */}
              {activeTab === 'post' && (
                <PostFoundItemForm
                  onSubmitItem={handleAddFoundItem}
                  onCancel={() => handleSelectTab('find')}
                />
              )}

              {/* Feature 2: Find a Lost Item */}
              {activeTab === 'find' && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#E5DFD6]">
                    <div>
                      <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#191816] tracking-tight">
                        Find a Lost Item
                      </h1>
                      <p className="mt-1.5 text-sm sm:text-base text-[#625D55]">
                        Search items found on campus or reported lost. Filter by campus zone, type, and recovery status.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto flex-wrap">
                      {/* Search by Item Name / Description */}
                      <div className="relative sm:w-56">
                        <Search className="w-4 h-4 text-[#625D55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search items..."
                          aria-label="Search by item name"
                          className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#625D55] hover:text-[#191816] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Filter by Type (All / Found / Lost) */}
                      <select
                        value={selectedTypeFilter}
                        onChange={(e) => setSelectedTypeFilter(e.target.value as ItemTypeFilter)}
                        aria-label="Filter by item type"
                        className="px-3 py-2 text-sm bg-white border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32] cursor-pointer"
                      >
                        <option value="All Items">All Items (Found &amp; Lost)</option>
                        <option value="Found Items">Found Items Only</option>
                        <option value="Lost Reports">Lost Reports Only</option>
                      </select>

                      {/* Filter by Campus Location */}
                      <select
                        value={selectedLocation}
                        onChange={(e) =>
                          setSelectedLocation(e.target.value as 'All Locations' | CampusLocation)
                        }
                        aria-label="Filter by campus location"
                        className="px-3 py-2 text-sm bg-white border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32] cursor-pointer"
                      >
                        <option value="All Locations">All Locations</option>
                        {CAMPUS_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>

                      {/* Filter by Status */}
                      <select
                        value={selectedStatus}
                        onChange={(e) =>
                          setSelectedStatus(e.target.value as 'All Statuses' | ItemStatus)
                        }
                        aria-label="Filter by item status"
                        className="px-3 py-2 text-sm bg-white border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32] cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {justPostedNotice && (
                    <div className="mt-6 p-3.5 rounded-lg bg-[#EDF6F0] border border-[#146B32]/25 flex items-center justify-between gap-3 text-xs sm:text-sm text-[#146B32]">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Your found item report has been saved to the campus database.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setJustPostedNotice(false)}
                        aria-label="Dismiss notification"
                        className="p-1 hover:bg-[#DFEFE5] rounded cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between text-xs text-[#625D55]">
                    <div className="flex items-center gap-2">
                      <span>
                        Showing{' '}
                        <strong className="font-mono tabular-nums text-[#191816]">
                          {filteredLostItems.length}
                        </strong>{' '}
                        {filteredLostItems.length === 1 ? 'item' : 'items'}
                        {selectedLocation !== 'All Locations' ? ` in ${selectedLocation}` : ''}
                        {selectedStatus !== 'All Statuses' ? ` (${selectedStatus})` : ''}
                        {selectedTypeFilter !== 'All Items' ? ` · ${selectedTypeFilter}` : ''}
                      </span>
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#146B32]" />}
                    </div>

                    {hasActiveFilter && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-[#146B32] font-medium hover:underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {filteredLostItems.length > 0 ? (
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredLostItems.map((item) => (
                        <article
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className="group bg-white border border-[#E5DFD6] hover:border-[#C5BCB0] rounded-xl overflow-hidden flex flex-col justify-between transition-colors duration-150 cursor-pointer"
                        >
                          <div>
                            <div className="relative border-b border-[#E5DFD6]">
                              <ItemIllustration
                                type={item.illustrationType}
                                imageUrl={item.imageUrl}
                                alt={item.name}
                                className="h-44 w-full"
                              />

                              {/* Badges: Found/Lost + Recovery Status */}
                              <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase shadow-xs ${
                                    item.kind === 'found_report'
                                      ? 'bg-[#146B32] text-white'
                                      : 'bg-[#B8520D] text-white'
                                  }`}
                                >
                                  {item.kind === 'found_report' ? 'Found' : 'Lost'}
                                </span>

                                {item.status && item.status !== 'Active' && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase shadow-xs ${
                                      item.status === 'Claimed'
                                        ? 'bg-[#FDF3EB] text-[#B8520D] border border-[#DF6A18]/40'
                                        : item.status === 'Returned'
                                          ? 'bg-[#EBF3FF] text-[#1D4ED8] border border-[#3B82F6]/40'
                                          : 'bg-[#F3EFE9] text-[#625D55] border border-[#C5BCB0]'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-5">
                              <div className="flex items-center gap-1.5 text-xs text-[#625D55] flex-wrap">
                                <span
                                  className={`font-semibold ${
                                    item.kind === 'found_report' ? 'text-[#146B32]' : 'text-[#B8520D]'
                                  }`}
                                >
                                  {item.location}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">
                                  {formatDisplayDate(item.dateLost)}
                                </span>
                              </div>

                              <h2 className="mt-2 font-serif text-lg font-semibold text-[#191816] group-hover:text-[#146B32] transition-colors leading-snug">
                                {item.name}
                              </h2>

                              <p className="mt-2.5 text-sm text-[#625D55] line-clamp-3 leading-relaxed">
                                {item.description}
                              </p>

                              {item.geotag && (
                                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-[#146B32]">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    {formatCoordinates(
                                      item.geotag.latitude,
                                      item.geotag.longitude
                                    )}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="px-5 py-3.5 border-t border-[#E5DFD6] flex items-center justify-between gap-3 text-xs text-[#625D55]">
                            <span className="truncate">
                              {item.kind === 'found_report'
                                ? `Found by ${item.contactName}`
                                : `Posted by ${item.contactName}`}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#146B32] whitespace-nowrap shrink-0">
                              <span>Details</span>
                              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-8 py-14 px-6 bg-white border border-[#E5DFD6] rounded-xl text-center max-w-lg mx-auto">
                      <h2 className="font-serif text-xl font-semibold text-[#191816]">
                        {lostItems.length === 0
                          ? 'No items reported yet'
                          : 'No matching items found'}
                      </h2>
                      <p className="mt-2 text-sm text-[#625D55] leading-relaxed">
                        {lostItems.length === 0
                          ? 'Found items and lost reports will appear here.'
                          : 'Try clearing your search or selecting another campus location or status.'}
                      </p>
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        {hasActiveFilter && lostItems.length > 0 && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-[#191816] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#E5DFD6] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Clear Filters
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSelectTab('post')}
                          className={PRIMARY_ACTION_BUTTON_CLASS}
                        >
                          Post a Found Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Feature 3: Request to Find a Lost Item */}
              {activeTab === 'request' && (
                <FindRequestsSection
                  requests={findRequests}
                  onAddRequest={handleAddFindRequest}
                  onSelectRequest={(req) => setSelectedItem(req)}
                />
              )}
            </main>

            {/* Separate Dedicated Section Reserved for Future Leaflet Map Integration */}
            <CampusMapSlot markers={mapMarkers} locations={campusLocationList} />

            {/* Minimal Campus Footer */}
            <footer className="py-6 border-t border-[#E5DFD6] bg-white text-xs text-[#625D55]">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span>Visvesvaraya Technological University · Central Lost &amp; Found Database</span>
                <button
                  type="button"
                  onClick={handleReturnToHero}
                  className="hover:text-[#191816] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Return to Landing Page
                </button>
              </div>
            </footer>

            {/* Item & Request Detail Modal with MongoDB status & delete actions */}
            <ItemDetailModal
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteItem={handleDeleteItem}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
