// The 24-question Market Readiness self-check, ported verbatim from the
// approved reference file (red-door-market-readiness-assessment.html,
// supplied 2026-09-25) — question text, category, weight, reverseScoring,
// and every yes/no/unsure response's status/priority/copy are copied
// exactly, not recreated from memory. Do not edit question wording,
// weights, or scoring behavior here without going back to that source —
// see MarketReadinessAssessment.astro's header comment for the full
// build context.
//
// Isomorphic on purpose: imported by both the client-side interactive
// component (src/components/MarketReadinessAssessment.astro) and the
// server-side submit route (src/pages/api/market-readiness/submit-
// report.ts), which recomputes the score from the raw answers rather
// than trusting a client-submitted score — the reference file's own
// scoring.ts equivalent (scoring.ts) is the ONLY place this logic lives.

export type AnswerValue = 'yes' | 'no' | 'unsure';
export type ItemStatus = 'ready' | 'needs-attention' | 'confirm';
export type Priority = 'critical' | 'high' | 'medium' | 'low' | null;

export interface QuestionResponse {
  status: ItemStatus;
  priority: Priority;
  category: string;
  whyItMatters: string;
  recommendation: string;
  inlineRecommendation: string;
}

export interface ReadinessQuestion {
  id: string;
  question: string;
  category: string;
  weight: number;
  reverseScoring?: boolean;
  responses: Record<AnswerValue, QuestionResponse>;
}

function response(
  status: ItemStatus,
  priority: Priority,
  category: string,
  whyItMatters: string,
  recommendation: string,
  inlineRecommendation: string
): QuestionResponse {
  return { status, priority, category, whyItMatters, recommendation, inlineRecommendation };
}

export const READINESS_QUESTIONS: ReadinessQuestion[] = [
  {
    id: 'pricing',
    question: 'Has the proposed rental price been compared with recently leased properties?',
    category: 'Pricing and Market Position',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Pricing and Market Position', "Pricing the property against recently leased comparables helps establish a realistic market position rather than relying only on active listings or an owner's desired rent.", 'Confirm that the comparison includes similar properties, recent leasing activity, condition, location, bedroom count, amenities, and days on market.', 'Pricing appears to be on the right path. Confirm the comparison includes similar leased homes, condition, amenities, and days on market.'),
      no: response('needs-attention', 'high', 'Pricing and Market Position', 'An unsupported rental price can lead to extended vacancy, repeated reductions, fewer qualified applicants, and lost rental income.', 'Complete a rental market analysis using recently leased comparable properties before advertising the home.', 'An unsupported rent can weaken early listing performance. Complete a rental market analysis before advertising the home.'),
      unsure: response('confirm', 'high', 'Pricing and Market Position', 'Active listings show current competition, but recently leased properties provide stronger evidence of what renters are actually willing to pay.', 'Have a local property management professional verify the target rent before the listing goes live.', 'Confirm the target rent with recent leased comparable properties before the listing goes live.'),
    },
  },
  {
    id: 'cleaning',
    question: 'Has the property been professionally cleaned to a move-in-ready standard?',
    category: 'Cleaning and Presentation',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Cleaning and Presentation', 'A move-in-ready cleaning creates a stronger first impression and helps prospective tenants view the home as well cared for.', 'Complete a final walkthrough to confirm kitchens, bathrooms, appliances, cabinet interiors, baseboards, windowsills, floors, dust, debris, and odors remain addressed.', 'Cleaning appears addressed. Confirm kitchens, bathrooms, appliances, cabinet interiors, baseboards, windowsills, floors, dust, debris, and odors before launch.'),
      no: response('needs-attention', 'high', 'Cleaning and Presentation', 'Visible dirt, odors, residue, or debris can negatively affect photographs, showings, and renter confidence in the property’s condition.', 'Schedule a professional move-in-quality cleaning before photography, marketing, or tenant showings.', 'Cleaning issues can weaken photos and showings. Schedule a move-in-quality cleaning before marketing.'),
      unsure: response('confirm', 'medium', 'Cleaning and Presentation', 'A home may appear generally clean while still needing attention in kitchens, bathrooms, appliances, cabinet interiors, baseboards, windowsills, floors, or odor-prone areas.', 'Use a detailed rent-ready cleaning checklist or request a professional condition review before marketing.', 'Confirm the home meets a move-in cleaning standard, including surfaces, appliance interiors, floors, dust, debris, and odors.'),
    },
  },
  {
    id: 'carpet',
    question: 'Have all carpets been professionally cleaned or replaced if necessary?',
    category: 'Cleaning and Presentation',
    weight: 1,
    responses: {
      yes: response('ready', null, 'Cleaning and Presentation', 'Clean carpet improves appearance, reduces odors, and creates a stronger first impression in photographs and showings.', 'Allow the carpet to dry completely and confirm that stains or odors have not returned before photography or showings.', 'Carpet appears addressed. Confirm it is dry and that stains or odors have not returned before photos or showings.'),
      no: response('needs-attention', 'high', 'Cleaning and Presentation', 'Dirty, stained, worn, or odorous carpet can significantly weaken listing photos and make prospective tenants question the overall condition of the property.', 'Schedule professional carpet cleaning. Replace carpeting when cleaning will not adequately correct stains, odors, damage, or excessive wear.', 'Stained, worn, or odorous carpet can weaken photos and showings. Clean or replace carpet where needed.'),
      unsure: response('confirm', 'medium', 'Cleaning and Presentation', 'Carpet condition can look different in daylight, photographs, and an empty room.', 'Inspect all carpeted areas under bright lighting and check for staining, wear, pet damage, and lingering odors.', 'Inspect carpet under bright lighting and check for staining, wear, pet damage, and lingering odors.'),
    },
  },
  {
    id: 'interior-finishes',
    question: 'Are walls, flooring, doors, baseboards, and trim in clean and marketable condition?',
    category: 'Cleaning and Presentation',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Cleaning and Presentation', 'Clean, neutral, and well-maintained finishes help the property photograph better and create a stronger impression during showings.', 'Inspect the home under bright lighting and complete minor touch-ups before professional photos are taken.', 'Interior finishes appear ready. Check under bright lighting and finish minor touch-ups before photography.'),
      no: response('needs-attention', 'high', 'Cleaning and Presentation', 'Damaged flooring, marked walls, worn trim, and visibly neglected finishes can reduce renter interest and make the property feel poorly maintained.', 'Repair visible damage and consider fresh, neutral paint where practical before marketing.', 'Visible wear can weaken listing photos and first impressions. Repair damage and consider fresh, neutral paint where practical.'),
      unsure: response('confirm', 'medium', 'Cleaning and Presentation', 'Owners often become accustomed to cosmetic wear that prospective tenants notice immediately.', 'Have an objective third party evaluate paint, flooring, doors, baseboards, trim, stains, odors, and visible damage before marketing begins.', 'Have a fresh set of eyes review paint, flooring, trim, stains, odors, and visible damage before marketing.'),
    },
  },
  {
    id: 'odors',
    question: 'Is the property free of noticeable odors, smoke residue, pet odors, mold-like smells, or mustiness?',
    category: 'Cleaning and Presentation',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Cleaning and Presentation', 'Neutral indoor air helps prospective tenants focus on the property rather than questioning cleanliness, moisture, or prior occupancy.', 'Keep the property ventilated and recheck after it has been closed for several hours, especially before photos and showings.', 'Odors appear addressed. Recheck after the home has been closed for several hours before showings.'),
      no: response('needs-attention', 'high', 'Cleaning and Presentation', 'Smoke, pet, musty, or mold-like odors can weaken showings, reduce tenant confidence, and signal issues that need correction before move-in.', 'Identify the source, clean or repair affected materials, and use appropriate professionals for moisture, smoke, pet, or mold-like concerns.', 'Noticeable odors can weaken showings. Identify the source and correct smoke, pet, moisture, or musty conditions before marketing.'),
      unsure: response('confirm', 'high', 'Cleaning and Presentation', 'Odors are often easier for visitors to notice than owners, especially after a home has been vacant or closed up.', 'Ask an objective person to walk the home after it has been closed for several hours and check closets, carpets, bathrooms, basements, and HVAC airflow.', 'Have someone objective check for odors after the home has been closed, including closets, carpets, bathrooms, basements, and HVAC airflow.'),
    },
  },
  {
    id: 'belongings',
    question: 'Have all personal belongings, trash, construction materials, and unnecessary items been removed?',
    category: 'Cleaning and Presentation',
    weight: 1,
    responses: {
      yes: response('ready', null, 'Cleaning and Presentation', 'Empty, uncluttered spaces photograph better, show better, and allow renters to understand the available space.', 'Complete a final sweep of closets, garage, attic access, storage areas, sheds, and exterior spaces before photos or showings.', 'Clutter appears addressed. Check closets, garage, storage areas, sheds, and exterior spaces before photos.'),
      no: response('needs-attention', 'high', 'Cleaning and Presentation', 'Personal belongings, debris, or construction materials can make the property look unfinished and distract renters from the home’s usable space.', 'Remove unnecessary items and debris before photography, showings, or tenant move-in.', 'Remove belongings, trash, debris, and construction materials so the home photographs and shows clearly.'),
      unsure: response('confirm', 'medium', 'Cleaning and Presentation', 'Items left in closets, garages, sheds, or exterior areas can be missed until showings or move-in.', 'Walk every storage and exterior area and remove anything that should not remain for the next resident.', 'Check closets, garage, sheds, storage, and exterior areas for items that should be removed.'),
    },
  },
  {
    id: 'window-coverings',
    question: 'Are appropriate window coverings installed in bedrooms and other areas where privacy is expected?',
    category: 'Windows, Doors, and Interior Features',
    weight: 1,
    responses: {
      yes: response('ready', null, 'Windows, Doors, and Interior Features', 'Appropriate window coverings improve privacy, presentation, and move-in readiness.', 'Confirm that coverings are clean, secure, easy to operate, and appropriately sized for each window.', 'Window coverings appear addressed. Confirm they are clean, secure, easy to operate, and appropriately sized.'),
      no: response('needs-attention', 'medium', 'Windows, Doors, and Interior Features', 'Missing window coverings can make the property feel incomplete and may create an immediate privacy concern for a new tenant.', 'Install clean, neutral, functional window coverings in bedrooms and other appropriate areas before move-in.', 'Install practical window coverings where privacy is expected, especially bedrooms and other appropriate areas.'),
      unsure: response('confirm', 'medium', 'Windows, Doors, and Interior Features', 'Window-covering expectations can vary by room, but basic privacy should be considered before the tenant takes possession.', 'Walk through the property from both inside and outside to identify windows that need practical privacy coverings.', 'Walk the home from inside and outside to identify windows where practical privacy coverings are needed.'),
    },
  },
  {
    id: 'windows',
    question: 'Do all windows open, close, lock, and remain securely in place?',
    category: 'Windows, Doors, and Interior Features',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Windows, Doors, and Interior Features', 'Functional windows support safety, ventilation, security, and a positive move-in experience.', 'Complete a final test of each accessible window and document any windows that are intentionally designed not to open.', 'Windows appear functional. Complete a final test and note any windows intentionally designed not to open.'),
      no: response('needs-attention', 'high', 'Windows, Doors, and Interior Features', 'Broken locks, damaged glass, stuck windows, torn screens, loose components, or worn seals can create security, safety, air intrusion, water intrusion, and tenant satisfaction concerns.', 'Repair damaged or nonfunctioning windows before marketing or tenant occupancy.', 'Repair damaged glass, locks, stuck windows, loose components, torn screens where applicable, or visible seal issues before launch.'),
      unsure: response('confirm', 'high', 'Windows, Doors, and Interior Features', 'Windows are often overlooked during property preparation, particularly when they have not been operated recently.', 'Open, close, and lock each window. Inspect glass, screens, frames, seals, and surrounding areas for visible damage or moisture.', 'Open, close, and lock each window. Check glass, screens, frames, seals, and surrounding areas.'),
    },
  },
  {
    id: 'exterior-doors',
    question: 'Do all exterior doors open, close, lock, and seal properly?',
    category: 'Windows, Doors, and Interior Features',
    weight: 2,
    responses: {
      yes: response('ready', null, 'Windows, Doors, and Interior Features', 'Secure, weather-tight exterior doors support safety, energy performance, and tenant confidence at move-in.', 'Test entry doors, sliding doors, deadbolts, weather stripping, and frames before marketing.', 'Exterior doors appear ready. Test entry doors, sliding doors, locks, deadbolts, weather stripping, and frames.'),
      no: response('needs-attention', 'critical', 'Windows, Doors, and Interior Features', 'Exterior door problems can create security concerns, water intrusion, air leaks, and immediate move-in complaints.', 'Repair door operation, damaged frames, worn weather stripping, sliding door issues, and lock or deadbolt concerns before marketing or occupancy.', 'Exterior door issues can affect security and move-in readiness. Repair locks, seals, frames, or operation before launch.'),
      unsure: response('confirm', 'high', 'Windows, Doors, and Interior Features', 'Door operation and seals may not be obvious until each entry is tested from inside and outside.', 'Test every entry and sliding door, confirm locks and deadbolts operate, and inspect weather stripping and damaged frames.', 'Test each exterior and sliding door from inside and outside, including locks, deadbolts, seals, and frames.'),
    },
  },
  {
    id: 'interior-doors-cabinets',
    question: 'Are all interior doors, closet doors, cabinets, and drawers operating properly?',
    category: 'Windows, Doors, and Interior Features',
    weight: 1,
    responses: {
      yes: response('ready', null, 'Windows, Doors, and Interior Features', 'Working interior features help the property feel cared for and reduce small move-in frustrations.', 'Open and close interior doors, closet doors, cabinets, and drawers one final time before showings.', 'Interior doors, cabinets, and drawers appear ready. Complete one final operation check before showings.'),
      no: response('needs-attention', 'medium', 'Windows, Doors, and Interior Features', 'Sticking doors, damaged hinges, missing hardware, and broken drawer tracks can make the home feel unfinished or poorly maintained.', 'Repair sticking doors, damaged hinges, missing hardware, broken drawer tracks, and cabinet issues before move-in.', 'Repair sticking doors, hinges, missing hardware, drawer tracks, or cabinet issues before move-in.'),
      unsure: response('confirm', 'medium', 'Windows, Doors, and Interior Features', 'Small operation issues are easy to miss until a tenant starts using the home every day.', 'Walk room by room and test doors, closets, cabinets, drawers, latches, hinges, and tracks.', 'Walk room by room and test doors, closets, cabinets, drawers, latches, hinges, and tracks.'),
    },
  },
  {
    id: 'appliances',
    question: 'Are all included appliances clean and functioning properly?',
    category: 'Appliances and Major Systems',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Appliances and Major Systems', 'Clean, working appliances support a smoother move-in and reduce immediate maintenance requests.', 'Test each included appliance, such as refrigerator, range, oven, dishwasher, microwave, washer, dryer, and garbage disposal where applicable.', 'Included appliances appear ready. Test and clean each appliance that will remain with the property.'),
      no: response('needs-attention', 'high', 'Appliances and Major Systems', 'Dirty or nonfunctioning included appliances can delay move-in, weaken renter confidence, and create early service complaints.', 'Clean and repair included appliances before marketing or occupancy, using appropriate professionals when service is needed.', 'Clean and repair included appliances before marketing or occupancy.'),
      unsure: response('confirm', 'high', 'Appliances and Major Systems', 'Appliances may appear present but still have hidden cleaning, drainage, cooling, heating, or operation issues.', 'Run each included appliance through a normal cycle or test and document any appliance that is not included with the rental.', 'Run each included appliance through a normal test and document what is or is not included.'),
    },
  },
  {
    id: 'hvac',
    question: 'Are the heating and cooling systems functioning properly?',
    category: 'Appliances and Major Systems',
    weight: 2,
    responses: {
      yes: response('ready', null, 'Appliances and Major Systems', 'Functional heating and cooling are central to comfort, showings, and a positive move-in experience.', 'Confirm heating, cooling, thermostat operation, a clean filter, normal airflow, and no unusual sounds or odors.', 'HVAC appears ready. Confirm heat, cooling, thermostat, filter, airflow, and no unusual sounds or odors.'),
      no: response('needs-attention', 'critical', 'Appliances and Major Systems', 'Heating or cooling problems can delay occupancy, create comfort concerns, and lead to immediate maintenance issues.', 'Have the system evaluated and repaired by an appropriate HVAC professional before marketing or tenant move-in.', 'Heating or cooling problems need prompt review by an appropriate HVAC professional before move-in.'),
      unsure: response('confirm', 'high', 'Appliances and Major Systems', 'HVAC issues may not be obvious until the system is run long enough to verify temperature change and airflow.', 'Test heat and cooling, check thermostat operation, replace or inspect the filter, and note any unusual sound, smell, or airflow issue.', 'Test heat and cooling, thermostat operation, filter condition, airflow, and any unusual sound or odor.'),
    },
  },
  {
    id: 'plumbing',
    question: 'Are all plumbing fixtures functioning without active leaks, clogs, or drainage problems?',
    category: 'Appliances and Major Systems',
    weight: 2,
    responses: {
      yes: response('ready', null, 'Appliances and Major Systems', 'Working plumbing reduces the risk of immediate move-in complaints and helps prevent avoidable water damage.', 'Run faucets, toilets, sinks, tubs, showers, and the garbage disposal where applicable; check visible supply lines and the water heater area.', 'Plumbing appears ready. Run fixtures and check visible supply lines, drains, and the water heater area.'),
      no: response('needs-attention', 'critical', 'Appliances and Major Systems', 'Active leaks, clogs, slow drains, or water heater area concerns can create damage, safety issues, and immediate tenant dissatisfaction.', 'Address active leaks, clogs, drainage problems, and visible plumbing concerns before marketing or occupancy.', 'Leaks, clogs, or drainage issues should be addressed before marketing or occupancy.'),
      unsure: response('confirm', 'high', 'Appliances and Major Systems', 'Plumbing problems can be hidden until fixtures are run and cabinets, supply lines, and drain areas are checked.', 'Run every fixture, flush toilets, test tubs and showers, check under sinks, and inspect visible supply lines and the water heater area.', 'Run every fixture, flush toilets, test drains, and inspect under sinks and the water heater area.'),
    },
  },
  {
    id: 'electrical',
    question: 'Are all lights, switches, outlets, ceiling fans, and other electrical fixtures functioning properly?',
    category: 'Appliances and Major Systems',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Appliances and Major Systems', 'Working electrical fixtures support safe showings, daily function, and a better move-in experience.', 'Test lights, switches, accessible outlets, ceiling fans, exterior lights, and included fixtures before marketing.', 'Electrical fixtures appear ready. Test lights, switches, accessible outlets, fans, and exterior lights.'),
      no: response('needs-attention', 'high', 'Appliances and Major Systems', 'Nonfunctioning lights, switches, outlets, fans, or fixtures can create safety concerns and make the property feel unfinished.', 'Document the issue and use an appropriate professional for electrical repairs when needed.', 'Electrical issues should be documented and handled by an appropriate professional when repairs are needed.'),
      unsure: response('confirm', 'medium', 'Appliances and Major Systems', 'Electrical issues are often discovered only when each fixture and switch is tested.', 'Walk the home with lights on and test switches, accessible outlets, ceiling fans, exterior lights, and included fixtures.', 'Walk the home and test switches, accessible outlets, fans, exterior lights, and included fixtures.'),
    },
  },
  {
    id: 'detectors',
    question: 'Are smoke and carbon monoxide detectors installed, properly located, and operational?',
    category: 'Safety and Security',
    weight: 2,
    responses: {
      yes: response('ready', null, 'Safety and Security', 'Operational safety devices are essential for resident safety and may be required by applicable laws or local regulations.', 'Confirm proper placement, test each device, replace weak batteries, and document the test before move-in.', 'Safety devices appear addressed. Confirm placement, test each unit, replace weak batteries, and document the test.'),
      no: response('needs-attention', 'critical', 'Safety and Security', 'Missing or nonfunctional safety devices create significant safety and liability concerns.', 'Install and test required smoke and carbon monoxide detectors before the home is shown or occupied, while confirming local requirements.', 'Missing or untested safety devices need prompt attention before showings or occupancy.'),
      unsure: response('confirm', 'critical', 'Safety and Security', 'Safety equipment should never be assumed to be installed, properly located, or functioning.', 'Inspect and test every detector, confirm appropriate placement, and replace outdated units before marketing.', 'Do not assume safety equipment is ready. Inspect, test, and document every detector before marketing.'),
    },
  },
  {
    id: 'walking-surfaces',
    question: 'Are stairways, railings, decks, porches, and walking surfaces secure and free of obvious hazards?',
    category: 'Safety and Security',
    weight: 2,
    responses: {
      yes: response('ready', null, 'Safety and Security', 'Secure walking surfaces support safe access during showings and tenant move-in.', 'Recheck loose handrails, damaged steps, trip hazards, rotting deck boards, uneven walking surfaces, and missing guards where applicable.', 'Walking surfaces appear ready. Recheck handrails, steps, decks, porches, trip hazards, and uneven surfaces.'),
      no: response('needs-attention', 'critical', 'Safety and Security', 'Loose handrails, damaged steps, trip hazards, rotting deck boards, uneven surfaces, or missing guards can create safety concerns before or after move-in.', 'Repair obvious hazards before showings or tenant occupancy, using qualified help for structural or safety-related work.', 'Obvious walking-surface hazards should be repaired before showings or tenant occupancy.'),
      unsure: response('confirm', 'critical', 'Safety and Security', 'Porches, decks, stairs, and railings may look acceptable until they are walked, held, or loaded.', 'Walk each area, gently test railings, look for damaged boards or uneven surfaces, and flag anything that should be professionally reviewed.', 'Walk and inspect stairs, railings, decks, porches, and pathways; flag anything that needs professional review.'),
    },
  },
  {
    id: 'immediate-safety',
    question: 'Are there any exposed wires, broken glass, active leaks, visible water damage, or other immediate safety concerns?',
    category: 'Safety and Security',
    weight: 2,
    reverseScoring: true,
    responses: {
      yes: response('needs-attention', 'critical', 'Safety and Security', 'Immediate concerns such as exposed wires, broken glass, active leaks, or visible water damage can affect safety, habitability, and move-in readiness.', 'Address immediate safety or water-related concerns before showings or tenant occupancy, using appropriate professionals when needed.', 'Immediate safety or water-related concerns should be addressed before showings or occupancy.'),
      no: response('ready', null, 'Safety and Security', 'A property without obvious immediate safety concerns is better positioned for showings and move-in review.', 'Complete one final walkthrough before marketing to confirm no new leaks, broken glass, exposed wiring, or visible water damage has appeared.', 'No immediate safety concerns were noted. Complete one final walkthrough before marketing.'),
      unsure: response('confirm', 'critical', 'Safety and Security', 'Unconfirmed safety concerns should be reviewed before a renter enters the home or a tenant takes possession.', 'Perform a careful walkthrough and request professional review for exposed wiring, broken glass, active leaks, visible water damage, or anything that appears unsafe.', 'Perform a careful walkthrough and request professional review for anything that appears unsafe.'),
    },
  },
  {
    id: 'access-devices',
    question: 'Have all prior tenant keys, garage remotes, mailbox keys, and property access devices been accounted for?',
    category: 'Safety and Security',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Safety and Security', 'Organized access supports security, vendor access, showings, and a smoother move-in process.', 'Confirm keys, remotes, mailbox keys, gate access, and other devices are labeled and available for turnover.', 'Access appears organized. Confirm keys, remotes, mailbox keys, gate access, and other devices are labeled and available.'),
      no: response('needs-attention', 'high', 'Safety and Security', 'Missing or unaccounted-for access devices can create security concerns and delay preparation, showings, or move-in.', 'Account for access devices and consider rekeying or replacing missing controls before the property is marketed or occupied.', 'Account for access devices and consider rekeying or replacing missing controls before launch.'),
      unsure: response('confirm', 'high', 'Safety and Security', 'Access gaps are often discovered late and can slow vendor work, showings, or move-in coordination.', 'Inventory keys, garage remotes, mailbox keys, gate devices, and other access items before marketing begins.', 'Inventory keys, remotes, mailbox keys, gate devices, and other access items before marketing.'),
    },
  },
  {
    id: 'curb-appeal',
    question: 'Is the lawn, landscaping, driveway, walkway, porch, and entry area clean and presentable?',
    category: 'Exterior and Curb Appeal',
    weight: 1,
    responses: {
      yes: response('ready', null, 'Exterior and Curb Appeal', 'The exterior often creates the first impression before a prospective tenant enters the home.', 'Maintain mowing, trimming, driveway, walkway, porch, and entry cleanliness through photography and showings.', 'Curb appeal appears ready. Maintain lawn, landscaping, driveway, walkway, porch, and entry areas through showings.'),
      no: response('needs-attention', 'medium', 'Exterior and Curb Appeal', 'Poor exterior presentation can weaken photos and reduce renter confidence before the showing even begins.', 'Clean up landscaping, remove debris, sweep entry areas, and address obvious curb appeal issues before photos.', 'Improve exterior presentation before photos by cleaning landscaping, walkways, porch, driveway, and entry areas.'),
      unsure: response('confirm', 'medium', 'Exterior and Curb Appeal', 'Exterior presentation can look different from the street, driveway, porch, and listing-photo angles.', 'View the property from the street and entry path, then correct anything that distracts from a clean first impression.', 'View the property from the street and entry path, then correct distracting curb appeal issues.'),
    },
  },
  {
    id: 'exterior-condition',
    question: 'Is the exterior free of excessive debris, peeling paint, damaged siding, broken fixtures, or obvious deferred maintenance?',
    category: 'Exterior and Curb Appeal',
    weight: 1,
    responses: {
      yes: response('ready', null, 'Exterior and Curb Appeal', 'A visibly maintained exterior supports marketability and helps tenants feel more confident in the property’s overall care.', 'Recheck siding, paint, exterior fixtures, debris, and visible deferred maintenance before listing photos.', 'Exterior condition appears marketable. Recheck siding, paint, fixtures, debris, and visible deferred maintenance.'),
      no: response('needs-attention', 'medium', 'Exterior and Curb Appeal', 'Excessive debris, peeling paint, damaged siding, broken fixtures, or visible deferred maintenance can distract renters and weaken perceived property care.', 'Address visible exterior issues that affect marketability or safety before marketing, without assuming a full renovation is required.', 'Address visible exterior issues that affect marketability or safety before listing.'),
      unsure: response('confirm', 'medium', 'Exterior and Curb Appeal', 'Exterior issues may be easy to miss when they have been present for a long time.', 'Walk the full exterior and note debris, paint, siding, fixtures, trim, and obvious maintenance concerns that may appear in photos or showings.', 'Walk the full exterior and note debris, paint, siding, fixtures, trim, and visible maintenance concerns.'),
    },
  },
  {
    id: 'drainage-roof',
    question: 'Are gutters, downspouts, exterior drainage areas, and visible roof components free of obvious problems?',
    category: 'Exterior and Curb Appeal',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Exterior and Curb Appeal', 'Visible drainage and roof issues can affect property protection and renter confidence, even though this is not a professional roof inspection.', 'Visually recheck gutters, downspouts, splash areas, grading near the home, and visible roof components after heavy rain when possible.', 'Drainage and visible roof areas appear ready. Recheck gutters, downspouts, grading, and visible roof components.'),
      no: response('needs-attention', 'high', 'Exterior and Curb Appeal', 'Obvious gutter, downspout, drainage, or visible roof concerns can contribute to water intrusion concerns and poor exterior presentation.', 'Address visible drainage concerns, clogged gutters, disconnected downspouts, or obvious roof-component issues before marketing where practical.', 'Address obvious drainage, gutter, downspout, or visible roof-component issues before marketing where practical.'),
      unsure: response('confirm', 'medium', 'Exterior and Curb Appeal', 'Drainage and visible roof concerns are not always obvious until the exterior is checked from multiple angles.', 'Perform a visual check of gutters, downspouts, drainage paths, and visible roof components; request professional review for anything concerning.', 'Visually check gutters, downspouts, drainage paths, and visible roof components; request review for concerns.'),
    },
  },
  {
    id: 'planned-repairs',
    question: 'Are all owner-planned repairs and improvements complete?',
    category: 'Final Move-In Readiness',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Final Move-In Readiness', 'Completed repairs help the listing reflect the condition renters will actually see and reduce confusion during showings.', 'Confirm no tools, materials, punch-list items, or contractor access needs remain before marketing.', 'Planned work appears complete. Confirm no tools, materials, punch-list items, or contractor access needs remain.'),
      no: response('needs-attention', 'high', 'Final Move-In Readiness', 'Marketing before work is completed can create inaccurate expectations, weaken listing performance, and lead to avoidable showing objections.', 'Finish owner-planned repairs and improvements before professional marketing begins whenever practical.', 'Finish planned repairs before marketing so photos and showings match the condition renters can expect.'),
      unsure: response('confirm', 'medium', 'Final Move-In Readiness', 'Small unfinished items can become showing objections or move-in frustrations if they are not clearly identified.', 'Create a final punch list, confirm responsibility for each item, and decide what must be complete before photos, showings, or move-in.', 'Create a final punch list and decide what must be complete before photos, showings, or move-in.'),
    },
  },
  {
    id: 'utilities',
    question: 'Are utilities currently available so the property can be cleaned, inspected, tested, and shown properly?',
    category: 'Final Move-In Readiness',
    weight: 1.5,
    responses: {
      yes: response('ready', null, 'Final Move-In Readiness', 'Electricity, water, heating, and cooling help support cleaning, inspection, system testing, photography, and comfortable showings.', 'Keep needed utilities available through preparation, testing, professional marketing, and showings.', 'Utilities appear available. Keep needed utilities on through preparation, testing, photos, and showings.'),
      no: response('needs-attention', 'high', 'Final Move-In Readiness', 'Without utilities, cleaning, inspection, HVAC testing, plumbing checks, lighting, and showings may be delayed or incomplete.', 'Arrange needed utilities before cleaning, testing, professional photography, or showings.', 'Arrange needed utilities before cleaning, testing, photos, or showings.'),
      unsure: response('confirm', 'high', 'Final Move-In Readiness', 'Utility status can delay preparation if it is discovered after vendors, inspectors, or photographers arrive.', 'Confirm electricity, water, heating, and cooling availability before scheduling preparation or showings.', 'Confirm electricity, water, heating, and cooling availability before scheduling preparation or showings.'),
    },
  },
  {
    id: 'move-in-ready',
    question: 'Could a tenant reasonably move into the property today without encountering unfinished work or immediate unresolved problems?',
    category: 'Final Move-In Readiness',
    weight: 2,
    responses: {
      yes: response('ready', null, 'Final Move-In Readiness', 'This final test helps confirm that the physical home is clean, safe, functional, accessible, and ready for professional marketing and tenant occupancy.', 'Use this as a final readiness check, then let Red Door confirm pricing, condition, and market position through a professional review.', 'The property appears close to move-in ready. Use this as a final check before Red Door confirms pricing and condition.'),
      no: response('needs-attention', 'critical', 'Final Move-In Readiness', 'Unfinished work or immediate unresolved problems can weaken showings, delay leasing, and create a poor first experience for a new resident.', 'Identify the remaining blockers and complete the highest-priority safety, function, cleaning, and access items before marketing or move-in.', 'Identify remaining blockers and complete key safety, function, cleaning, and access items before launch.'),
      unsure: response('confirm', 'high', 'Final Move-In Readiness', 'A final move-in readiness review can reveal unfinished items that are not obvious when focusing on one room or repair at a time.', 'Walk the home from entry to exit as if you were the next tenant and list anything that would need explanation or immediate correction.', 'Walk the home like the next tenant and list anything that would need explanation or immediate correction.'),
    },
  },
];
