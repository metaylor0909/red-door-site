// Decision #8, step 1 + step 3 — validates the intake form submission.
// Pure function, no framework dependency, so it's easy to unit test
// against constructed payloads without spinning up the Astro route.
//
// Redesigned 2026-09-22 to match the new 3-step intake form (see
// src/pages/rental-analysis/index.astro's header comment for the full
// before/after): owner name splits into first/last, address splits into
// street/city/zip, and four new context fields are captured (property
// status, desired timeline, current/expected rent, preferred contact
// method) that feed the owner/LeadSimple emails only — not the estimate
// logic (comp-selection.ts, analyze.ts, bedroom-adjustment.ts have no
// dependency on any of them, confirmed before this redesign).

export const PROPERTY_TYPES = ['single-family', 'townhome', 'condo', 'duplex', 'multi-family', 'other'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = ['vacant', 'owner-occupied', 'tenant-occupied', 'being-purchased', 'needs-repairs'] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const TIMELINES = ['asap', 'within-30-days', 'within-2-3-months', 'just-researching'] as const;
export type Timeline = (typeof TIMELINES)[number];

export const CONTACT_METHODS = ['phone', 'email', 'text'] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

export interface RentalAnalysisIntake {
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  preferredContactMethod: ContactMethod;
  propertyStreet: string;
  propertyCityInput: string;
  propertyZipInput: string;
  propertyBeds: number;
  propertyBaths: number;
  propertySqft: number;
  propertyType: PropertyType;
  propertyStatus: PropertyStatus;
  desiredTimeline: Timeline;
  currentRent: number | null;
}

export type ValidationResult =
  | { valid: true; value: RentalAnalysisIntake }
  | { valid: false; errors: Record<string, string> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(raw: Record<string, string>, key: string): string {
  return (raw[key] ?? '').trim();
}

export function validateIntake(raw: Record<string, string>): ValidationResult {
  const errors: Record<string, string> = {};

  const propertyStreet = readString(raw, 'property_street');
  if (!propertyStreet) errors.property_street = 'Street address is required.';

  const propertyCityInput = readString(raw, 'property_city_input');
  if (!propertyCityInput) errors.property_city_input = 'City is required.';

  const propertyZipInput = readString(raw, 'property_zip_input');
  if (!propertyZipInput) errors.property_zip_input = 'ZIP code is required.';

  const propertyTypeRaw = readString(raw, 'property_type');
  const propertyType = PROPERTY_TYPES.find((t) => t === propertyTypeRaw);
  if (!propertyType) errors.property_type = 'Select a property type.';

  const bedsRaw = readString(raw, 'property_beds');
  const propertyBeds = Number(bedsRaw);
  if (!bedsRaw || !Number.isInteger(propertyBeds) || propertyBeds < 0 || propertyBeds > 10) {
    errors.property_beds = 'Select a valid number of bedrooms.';
  }

  const bathsRaw = readString(raw, 'property_baths');
  const propertyBaths = Number(bathsRaw);
  if (!bathsRaw || Number.isNaN(propertyBaths) || propertyBaths < 0 || propertyBaths > 10) {
    errors.property_baths = 'Select a valid number of bathrooms.';
  }

  const sqftRaw = readString(raw, 'property_sqft');
  const propertySqft = Number(sqftRaw);
  if (!sqftRaw || !Number.isFinite(propertySqft) || propertySqft <= 0 || propertySqft > 50000) {
    errors.property_sqft = 'Enter a valid square footage.';
  }

  const propertyStatusRaw = readString(raw, 'property_status');
  const propertyStatus = PROPERTY_STATUSES.find((s) => s === propertyStatusRaw);
  if (!propertyStatus) errors.property_status = 'Select the property’s current status.';

  const desiredTimelineRaw = readString(raw, 'desired_timeline');
  const desiredTimeline = TIMELINES.find((t) => t === desiredTimelineRaw);
  if (!desiredTimeline) errors.desired_timeline = 'Select a timeline.';

  const currentRentRaw = readString(raw, 'current_rent');
  let currentRent: number | null = null;
  if (currentRentRaw) {
    currentRent = Number(currentRentRaw);
    if (!Number.isFinite(currentRent) || currentRent <= 0) {
      errors.current_rent = 'Rent must be a positive number, or left blank.';
      currentRent = null;
    }
  }

  const ownerFirstName = readString(raw, 'owner_first_name');
  if (!ownerFirstName) errors.owner_first_name = 'First name is required.';

  const ownerLastName = readString(raw, 'owner_last_name');
  if (!ownerLastName) errors.owner_last_name = 'Last name is required.';

  const ownerEmail = readString(raw, 'owner_email');
  if (!ownerEmail || !EMAIL_PATTERN.test(ownerEmail)) errors.owner_email = 'A valid email is required.';

  const ownerPhone = readString(raw, 'owner_phone');
  if (!ownerPhone) errors.owner_phone = 'Phone number is required.';

  const preferredContactMethodRaw = readString(raw, 'preferred_contact_method');
  const preferredContactMethod = CONTACT_METHODS.find((m) => m === preferredContactMethodRaw);
  if (!preferredContactMethod) errors.preferred_contact_method = 'Select a preferred way to connect.';

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhone,
      preferredContactMethod: preferredContactMethod as ContactMethod,
      propertyStreet,
      propertyCityInput,
      propertyZipInput,
      propertyBeds,
      propertyBaths,
      propertySqft,
      propertyType: propertyType as PropertyType,
      propertyStatus: propertyStatus as PropertyStatus,
      desiredTimeline: desiredTimeline as Timeline,
      currentRent,
    },
  };
}
