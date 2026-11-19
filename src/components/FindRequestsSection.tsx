import React, { useMemo, useState } from 'react';
import { Search, X, MapPin, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  CampusLocation,
  GeotaggedImage,
  LostItemRecord
} from '../types';
import {
  getCoordinatesForLocation,
  inferIllustrationType
} from '../data/campusData';
import { formatCoordinates, GeotaggedCamera } from './GeotaggedCamera';
import { ItemIllustration } from './ItemIllustration';
import { formatDisplayDate } from './ItemDetailModal';
import { PRIMARY_ACTION_BUTTON_CLASS } from './Navbar';

interface FindRequestsSectionProps {
  requests: LostItemRecord[];
  onAddRequest: (request: LostItemRecord) => void;
  onSelectRequest: (request: LostItemRecord) => void;
}

export const FindRequestsSection: React.FC<FindRequestsSectionProps> = ({
  requests,
  onAddRequest,
  onSelectRequest
}) => {
  const todayISO = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<CampusLocation>(CAMPUS_LOCATIONS[0]);
  const [dateLost, setDateLost] = useState(todayISO);
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [media, setMedia] = useState<GeotaggedImage | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<'All Locations' | CampusLocation>(
    'All Locations'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !description.trim() ||
      !dateLost ||
      !contactName.trim() ||
      !contactInfo.trim()
    ) {
      return;
    }

    const newRequest: LostItemRecord = {
      id: `vtu-req-${Date.now()}`,
      kind: 'find_request',
      name: name.trim(),
      description: description.trim(),
      status: 'Active',
      imageUrl: media?.imageUrl,
      geotag:
        media && media.latitude !== null && media.longitude !== null
          ? {
              latitude: media.latitude,
              longitude: media.longitude,
              accuracy: media.accuracy,
              capturedAt: media.capturedAt
            }
          : undefined,
      location,
      locationCoordinates: getCoordinatesForLocation(location),
      dateLost,
      contactName: contactName.trim(),
      contactInfo: contactInfo.trim(),
      createdAt: Date.now(),
      illustrationType: inferIllustrationType(name, description)
    };

    onAddRequest(newRequest);

    setName('');
    setDescription('');
    setMedia(null);
    setSubmittedNotice(true);
  };

  const hasActiveFilter =
    searchQuery.trim().length > 0 || selectedLocation !== 'All Locations';

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return requests
      .filter((req) => {
        if (selectedLocation !== 'All Locations' && req.location !== selectedLocation) {
          return false;
        }
        if (
          q &&
          !req.name.toLowerCase().includes(q) &&
          !req.description.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [requests, searchQuery, selectedLocation]);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="pb-6 border-b border-[#E5DFD6]">
        <p className="text-xs font-semibold text-[#DF6A18] mb-1.5">
          Campus Search Assistance
        </p>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#191816] tracking-tight">
          Request to Find a Lost Item
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-[#625D55] max-w-2xl">
          Ask fellow students on campus to help look for an item you misplaced, or browse active search requests to lend a hand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Submit a Request Form */}
        <div className="lg:col-span-5 bg-white border border-[#E5DFD6] rounded-xl p-5 sm:p-6">
          <h2 className="font-serif text-xl font-semibold text-[#191816] mb-1">
            Submit a Help Request
          </h2>
          <p className="text-xs text-[#625D55] mb-5">
            Share where you believe the item was lost so students nearby can check for it.
          </p>

          {submittedNotice && (
            <div className="mb-4 p-3 rounded-lg bg-[#EDF6F0] border border-[#146B32]/25 flex items-center justify-between gap-2 text-xs text-[#146B32]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Your request has been posted to the help board.</span>
              </div>
              <button
                type="button"
                onClick={() => setSubmittedNotice(false)}
                aria-label="Dismiss notification"
                className="p-0.5 hover:bg-[#DFEFE5] rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="req-item-name"
                className="block text-xs font-medium text-[#191816] mb-1"
              >
                Item Name <span className="text-[#B8520D]">*</span>
              </label>
              <input
                id="req-item-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter item name"
                className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="req-location"
                  className="block text-xs font-medium text-[#191816] mb-1"
                >
                  Believed Location <span className="text-[#B8520D]">*</span>
                </label>
                <select
                  id="req-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value as CampusLocation)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32] cursor-pointer"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="req-date"
                  className="block text-xs font-medium text-[#191816] mb-1"
                >
                  Date Lost <span className="text-[#B8520D]">*</span>
                </label>
                <input
                  id="req-date"
                  type="date"
                  required
                  max={todayISO}
                  value={dateLost}
                  onChange={(e) => setDateLost(e.target.value)}
                  className="w-full px-3 py-2 text-sm tabular-nums bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="req-description"
                className="block text-xs font-medium text-[#191816] mb-1"
              >
                Item Description <span className="text-[#B8520D]">*</span>
              </label>
              <textarea
                id="req-description"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what it looks like and where around that area to check..."
                className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
              />
            </div>

            <GeotaggedCamera
              value={media}
              onChange={setMedia}
              label="Reference Image or Spot Photo (Optional)"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-[#E5DFD6]">
              <div>
                <label
                  htmlFor="req-contact-name"
                  className="block text-xs font-medium text-[#191816] mb-1"
                >
                  Your Name <span className="text-[#B8520D]">*</span>
                </label>
                <input
                  id="req-contact-name"
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
                />
              </div>

              <div>
                <label
                  htmlFor="req-contact-info"
                  className="block text-xs font-medium text-[#191816] mb-1"
                >
                  Contact Information <span className="text-[#B8520D]">*</span>
                </label>
                <input
                  id="req-contact-info"
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone or email"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button type="submit" className={PRIMARY_ACTION_BUTTON_CLASS}>
                Submit Help Request
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Dedicated Browse & Search Help Requests List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold text-[#191816] tabular-nums">
              Active Help Requests ({filteredRequests.length})
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative sm:w-52">
                <Search className="w-4 h-4 text-[#625D55] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search requests..."
                  aria-label="Search help requests"
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear request search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#625D55] hover:text-[#191816] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={selectedLocation}
                onChange={(e) =>
                  setSelectedLocation(e.target.value as 'All Locations' | CampusLocation)
                }
                aria-label="Filter requests by location"
                className="px-3 py-2 text-xs sm:text-sm bg-white border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32] cursor-pointer"
              >
                <option value="All Locations">All Locations</option>
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <article
                  key={req.id}
                  onClick={() => onSelectRequest(req)}
                  className="group bg-white border border-[#E5DFD6] hover:border-[#C5BCB0] rounded-xl overflow-hidden flex flex-col sm:flex-row transition-colors duration-150 cursor-pointer"
                >
                  <div className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-[#E5DFD6]">
                    <ItemIllustration
                      type={req.illustrationType}
                      imageUrl={req.imageUrl}
                      alt={req.name}
                      className="h-40 sm:h-full min-h-[148px] w-full"
                    />
                  </div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#625D55] flex-wrap">
                        <span className="font-semibold text-[#DF6A18]">Help Requested</span>
                        <span aria-hidden="true">·</span>
                        <span>{req.location}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatDisplayDate(req.dateLost)}</span>
                      </div>

                      <h3 className="mt-1.5 font-serif text-lg font-semibold text-[#191816] group-hover:text-[#146B32] transition-colors leading-snug">
                        {req.name}
                      </h3>

                      <p className="mt-2 text-sm text-[#625D55] line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E5DFD6] flex items-center justify-between gap-3 text-xs text-[#625D55]">
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">Requested by {req.contactName}</span>
                        {req.geotag && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-[#146B32] shrink-0">
                              <MapPin className="w-3 h-3" />
                              <span>
                                {formatCoordinates(req.geotag.latitude, req.geotag.longitude)}
                              </span>
                            </span>
                          </>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 font-semibold text-[#146B32] whitespace-nowrap shrink-0">
                        <span>Help Locate</span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-12 px-6 bg-white border border-[#E5DFD6] rounded-xl text-center">
              <h3 className="font-serif text-lg font-semibold text-[#191816]">
                {requests.length === 0
                  ? 'No help requests yet'
                  : 'No matching help requests'}
              </h3>
              <p className="mt-1.5 text-sm text-[#625D55]">
                {requests.length === 0
                  ? 'Submitted requests for help finding lost items will appear here.'
                  : 'Try clearing your search or selecting another campus location.'}
              </p>
              {hasActiveFilter && requests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('All Locations');
                  }}
                  className="mt-4 px-4 py-2 text-xs font-medium text-[#191816] bg-[#FAF8F5] hover:bg-[#EFECE5] border border-[#E5DFD6] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
