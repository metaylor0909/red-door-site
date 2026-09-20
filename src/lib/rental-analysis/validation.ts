// Decision #8, step 1 + step 3 — validates the intake form submission.
// Pure function, no framework dependency, so it's easy to unit test
// against constructed payloads without spinning up the Astro route.

export const PROPERTY_TYPES = ['single-family', 'townhouse-duplex', 'apartment-condo'] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export interface RentalAnalysisIntake {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  propertyAddress: string;
  propertyUnit: string | null;
  propertyBeds: number;
  propertyBaths: number;
  propertySqft: number | null;
  propertyType: PropertyType;
  propertyFurnished: boolean;
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

  const ownerName = readString(raw, 'owner_name');
  if (!ownerName) errors.owner_name = 'Name is required.';

  const ownerEmail = readString(raw, 'owner_email');
  if (!ownerEmail || !EMAIL_PATTERN.test(ownerEmail)) errors.owner_email = 'A valid email is required.';

  const ownerPhone = readString(raw, 'owner_phone');
  if (!ownerPhone) errors.owner_phone = 'Phone number is required.';

  const propertyAddress = readString(raw, 'property_address');
  if (!propertyAddress) errors.property_address = 'Property address is required.';

  const propertyUnit = readString(raw, 'property_unit') || null;

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
  let propertySqft: number | null = null;
  if (sqftRaw) {
    propertySqft = Number(sqftRaw);
    if (!Number.isFinite(propertySqft) || propertySqft <= 0) {
      errors.property_sqft = 'Square footage must be a positive number, or left blank.';
      propertySqft = null;
    }
  }

  const propertyTypeRaw = readString(raw, 'property_type');
  const propertyType = PROPERTY_TYPES.find((t) => t === propertyTypeRaw);
  if (!propertyType) errors.property_type = 'Select a property type.';

  const propertyFurnished = readString(raw, 'property_furnished') === 'true';

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      ownerName,
      ownerEmail,
      ownerPhone,
      propertyAddress,
      propertyUnit,
      propertyBeds,
      propertyBaths,
      propertySqft,
      propertyType: propertyType as PropertyType,
      propertyFurnished,
    },
  };
}
