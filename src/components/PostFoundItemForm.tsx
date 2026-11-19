import React, { useState } from 'react';
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
import { GeotaggedCamera } from './GeotaggedCamera';
import { PRIMARY_ACTION_BUTTON_CLASS } from './Navbar';

interface PostFoundItemFormProps {
  onSubmitItem: (item: LostItemRecord) => void;
  onCancel: () => void;
}

export const PostFoundItemForm: React.FC<PostFoundItemFormProps> = ({
  onSubmitItem,
  onCancel
}) => {
  const todayISO = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<CampusLocation>(CAMPUS_LOCATIONS[0]);
  const [dateFound, setDateFound] = useState(todayISO);
  const [contactName, setContactName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [media, setMedia] = useState<GeotaggedImage | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !description.trim() ||
      !dateFound ||
      !contactName.trim() ||
      !contactInfo.trim()
    ) {
      return;
    }

    const newItem: LostItemRecord = {
      id: `vtu-found-${Date.now()}`,
      kind: 'found_report',
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
      dateLost: dateFound,
      contactName: contactName.trim(),
      contactInfo: contactInfo.trim(),
      createdAt: Date.now(),
      illustrationType: inferIllustrationType(name, description)
    };

    onSubmitItem(newItem);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#191816] tracking-tight">
          Post a Found Item
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-[#625D55]">
          Report an item you found on campus so the owner can recover it. You can take a geotagged photo where you found it and specify where it can be collected.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5DFD6] rounded-xl p-5 sm:p-7 space-y-5"
      >
        {/* Item Name */}
        <div>
          <label
            htmlFor="found-item-name"
            className="block text-xs sm:text-sm font-medium text-[#191816] mb-1.5"
          >
            Item Name <span className="text-[#B8520D]">*</span>
          </label>
          <input
            id="found-item-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Casio fx-991CW Calculator, College ID Card, Black Backpack..."
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
          />
        </div>

        {/* Location & Date Found */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="found-item-location"
              className="block text-xs sm:text-sm font-medium text-[#191816] mb-1.5"
            >
              Location Where Found <span className="text-[#B8520D]">*</span>
            </label>
            <select
              id="found-item-location"
              value={location}
              onChange={(e) => setLocation(e.target.value as CampusLocation)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32] cursor-pointer"
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
              htmlFor="found-item-date"
              className="block text-xs sm:text-sm font-medium text-[#191816] mb-1.5"
            >
              Date Found <span className="text-[#B8520D]">*</span>
            </label>
            <input
              id="found-item-date"
              type="date"
              required
              max={todayISO}
              value={dateFound}
              onChange={(e) => setDateFound(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm tabular-nums bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
            />
          </div>
        </div>

        {/* Item Description & Collection Spot */}
        <div>
          <label
            htmlFor="found-item-description"
            className="block text-xs sm:text-sm font-medium text-[#191816] mb-1.5"
          >
            Item Description &amp; Handover Location <span className="text-[#B8520D]">*</span>
          </label>
          <textarea
            id="found-item-description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe item appearance, distinguishing marks, and where it is currently stored (e.g. handed over to Dept Security, with Canteen Manager, or with you)..."
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
          />
        </div>

        {/* Reusable Built-in Geotagged Camera + Device Upload */}
        <GeotaggedCamera
          value={media}
          onChange={setMedia}
          label="Found Item Photo (Optional — Camera Geotag or Upload)"
        />

        {/* Contact Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5DFD6]">
          <div>
            <label
              htmlFor="found-contact-name"
              className="block text-xs sm:text-sm font-medium text-[#191816] mb-1.5"
            >
              Finder / Custodian Name <span className="text-[#B8520D]">*</span>
            </label>
            <input
              id="found-contact-name"
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Your name or desk (e.g. Suresh - Library Staff)"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
            />
          </div>

          <div>
            <label
              htmlFor="found-contact-info"
              className="block text-xs sm:text-sm font-medium text-[#191816] mb-1.5"
            >
              Contact Information <span className="text-[#B8520D]">*</span>
            </label>
            <input
              id="found-contact-info"
              type="text"
              required
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder="Phone number, email, or office room number"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E5DFD6] rounded-lg text-[#191816] focus:outline-none focus:border-[#146B32]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium text-[#625D55] hover:text-[#191816] cursor-pointer whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          <button type="submit" className={PRIMARY_ACTION_BUTTON_CLASS}>
            Post Found Item
          </button>
        </div>
      </form>
    </div>
  );
};
