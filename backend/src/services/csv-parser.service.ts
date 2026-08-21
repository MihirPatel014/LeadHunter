import { prisma } from '../config/prisma.js';

export interface ParsedCsvLead {
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

export class CsvParserService {
  /**
   * Parse a raw CSV string with proper handling of quotes, commas, and newlines.
   */
  static parseCsv(csvText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \n in CRLF
        }
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Helper to extract city from an address string.
   */
  static extractCity(address: string | null): string | null {
    if (!address) return null;
    
    // Pattern match: "... Surat, Gujarat 395002"
    const pincodeMatch = address.match(/([A-Za-z\s]+),\s*[A-Za-z\s]+\s*\d{6}/);
    if (pincodeMatch && pincodeMatch[1]) {
      const parts = pincodeMatch[1].split(',');
      const candidate = parts[parts.length - 1].trim();
      if (candidate && candidate.length > 2 && candidate.length < 30) {
        return candidate;
      }
    }

    const parts = address.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      const secondLast = parts[parts.length - 2];
      if (secondLast && !/\d/.test(secondLast) && secondLast.length < 25) {
        return secondLast;
      }
    }

    return null;
  }

  /**
   * Clean email list and get primary valid email
   */
  static cleanEmail(rawEmail: string | null): string | null {
    if (!rawEmail) return null;
    const emails = rawEmail.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
    const validEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (validEmailRegex.test(email)) {
        return email;
      }
    }
    return emails[0] || null;
  }

  /**
   * Clean category: take first or primary category
   */
  static cleanCategory(rawCat: string | null): string | null {
    if (!rawCat) return null;
    const parts = rawCat.split(';').map((p) => p.trim()).filter(Boolean);
    return parts.length > 0 ? parts[0] : rawCat.trim();
  }

  /**
   * Build Google Maps URL from PlaceID or CID
   */
  static buildMapsUrl(placeId?: string, cid?: string, name?: string): string | null {
    if (placeId && placeId.startsWith('ChIJ')) {
      return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
    }
    if (cid && cid.length > 4) {
      return `https://maps.google.com/?cid=${cid}`;
    }
    if (name) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    }
    return null;
  }

  /**
   * Convert parsed CSV matrix into preview leads with duplicate check
   */
  static async transformAndCheckDuplicates(rows: string[][]): Promise<ParsedCsvLead[]> {
    if (rows.length === 0) return [];

    const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Find column indexes dynamically
    const findCol = (...names: string[]) => {
      return headers.findIndex((h) => names.some((n) => h.includes(n)));
    };

    const nameIdx = findCol('name', 'business', 'title');
    const phoneIdx = findCol('phone', 'tel', 'mobile', 'contact');
    const emailIdx = findCol('email', 'mail');
    const websiteIdx = findCol('website', 'site', 'url', 'web');
    const addressIdx = findCol('address', 'location', 'addr');
    const categoryIdx = findCol('category', 'type');
    const reviewCountIdx = findCol('reviewcount', 'reviews', 'totalreview');
    const ratingIdx = findCol('averagerating', 'rating', 'stars');
    const placeIdIdx = findCol('placeid', 'place_id');
    const cidIdx = findCol('cid');

    // Fetch existing leads for duplicate checks
    const existingLeads = await prisma.lead.findMany({
      select: {
        id: true,
        businessName: true,
        phone: true,
        website: true,
      },
    });

    const existingNames = new Map<string, number>();
    const existingPhones = new Map<string, number>();

    existingLeads.forEach((l) => {
      if (l.businessName) existingNames.set(l.businessName.toLowerCase().trim(), l.id);
      if (l.phone) {
        const cleanP = l.phone.replace(/[^0-9]/g, '');
        if (cleanP.length >= 7) existingPhones.set(cleanP, l.id);
      }
    });

    const parsedResults: ParsedCsvLead[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const businessName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
      if (!businessName) continue; // Skip empty rows

      const rawPhone = phoneIdx !== -1 ? row[phoneIdx]?.trim() || null : null;
      const rawEmail = emailIdx !== -1 ? row[emailIdx]?.trim() || null : null;
      const rawWebsite = websiteIdx !== -1 ? row[websiteIdx]?.trim() || null : null;
      const rawAddress = addressIdx !== -1 ? row[addressIdx]?.trim() || null : null;
      const rawCategory = categoryIdx !== -1 ? row[categoryIdx]?.trim() || null : null;
      const rawRating = ratingIdx !== -1 ? row[ratingIdx]?.trim() || null : null;
      const rawReviews = reviewCountIdx !== -1 ? row[reviewCountIdx]?.trim() || null : null;
      const placeId = placeIdIdx !== -1 ? row[placeIdIdx]?.trim() : undefined;
      const cid = cidIdx !== -1 ? row[cidIdx]?.trim() : undefined;

      const category = this.cleanCategory(rawCategory);
      const email = this.cleanEmail(rawEmail);
      const city = this.extractCity(rawAddress);
      const rating = rawRating && !isNaN(parseFloat(rawRating)) ? parseFloat(rawRating) : null;
      const reviewCount = rawReviews && !isNaN(parseInt(rawReviews, 10)) ? parseInt(rawReviews, 10) : null;
      const mapsUrl = this.buildMapsUrl(placeId, cid, businessName);

      // Duplicate check
      let isDuplicate = false;
      let duplicateReason: string | undefined = undefined;
      let existingId: number | undefined = undefined;

      const normName = businessName.toLowerCase().trim();
      const normPhone = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : '';

      if (existingNames.has(normName)) {
        isDuplicate = true;
        duplicateReason = 'Business name already exists in database';
        existingId = existingNames.get(normName);
      } else if (normPhone && normPhone.length >= 7 && existingPhones.has(normPhone)) {
        isDuplicate = true;
        duplicateReason = 'Phone number already exists in database';
        existingId = existingPhones.get(normPhone);
      }

      parsedResults.push({
        tempId: `temp_${r}_${Date.now()}`,
        businessName,
        category,
        city,
        address: rawAddress,
        website: rawWebsite,
        mapsUrl,
        phone: rawPhone,
        email,
        rating,
        reviewCount,
        isDuplicate,
        duplicateReason,
        existingId,
        selected: !isDuplicate, // default select non-duplicates
      });
    }

    return parsedResults;
  }
}
