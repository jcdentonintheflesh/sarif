import { differenceInDays, parseISO, isWithinInterval, subDays, addDays, format, min, max } from 'date-fns';

const today = () => new Date();

// Clamp a date to [start, end]
function clamp(d, lo, hi) {
  return new Date(Math.max(lo, Math.min(hi, d)));
}

// Days spent in the US within a specific date range [windowStart, windowEnd]
export function daysInWindow(trips, windowStart, windowEnd) {
  let total = 0;
  for (const trip of trips) {
    const arrival = parseISO(trip.arrival);
    const departure = trip.departure ? parseISO(trip.departure) : today();
    const lo = clamp(arrival, windowStart, windowEnd);
    const hi = clamp(departure, windowStart, windowEnd);
    const days = differenceInDays(hi, lo);
    if (days > 0) total += days;
  }
  return total;
}

// Rolling window status — configurable window and limit
// windowDays: size of rolling window (180 for ESTA, 365 for annual tracking)
// limitDays: max allowed days in that window (90 for ESTA, 183 for "less than half a year")
export function rollingWindowStatus(trips, windowDays = 180, limitDays = 90) {
  const end = today();
  const start = subDays(end, windowDays);
  const days = daysInWindow(trips, start, end);
  const remaining = limitDays - days;
  const pct = Math.min(100, (days / limitDays) * 100);

  let safeEntry = null;
  if (remaining <= 0) {
    for (let i = 1; i <= windowDays; i++) {
      const futureDate = addDays(end, i);
      const futureStart = subDays(futureDate, windowDays);
      const futureDays = daysInWindow(trips, futureStart, futureDate);
      if (futureDays < limitDays) {
        safeEntry = futureDate;
        break;
      }
    }
  }

  return { days, remaining, pct, windowStart: start, windowEnd: end, safeEntry, limitDays, windowDays };
}

// Days in US per calendar year
export function daysByYear(trips) {
  const yearMap = {};
  for (const trip of trips) {
    const arrival = parseISO(trip.arrival);
    const departure = trip.departure ? parseISO(trip.departure) : today();
    const startYear = arrival.getFullYear();
    const endYear = departure.getFullYear();
    for (let y = startYear; y <= endYear; y++) {
      const yStart = new Date(y, 0, 1);
      const yEnd = new Date(y, 11, 31);
      const lo = clamp(arrival, yStart, yEnd);
      const hi = clamp(departure, yStart, yEnd);
      const days = differenceInDays(hi, lo);
      if (days > 0) yearMap[y] = (yearMap[y] || 0) + days;
    }
  }
  return yearMap;
}

// Current stay duration (if currently in US)
export function currentStay(trips) {
  const current = trips.find(t => t.departure === null);
  if (!current) return null;
  const arrival = parseISO(current.arrival);
  return { arrival: current.arrival, days: differenceInDays(today(), arrival) + 1 };
}

// Recommended exit date: leave before hitting 90 days in rolling window
export function recommendedExitDate(trips) {
  const end = today();
  const start = subDays(end, 180);
  const days = daysInWindow(trips, start, end);
  const remaining = 90 - days;
  if (remaining <= 5) return { date: addDays(end, 0), urgent: true, daysLeft: remaining };
  return { date: addDays(end, Math.max(0, remaining - 5)), urgent: remaining < 15, daysLeft: remaining };
}

// Substantial Presence Test — IRS 3-year weighted formula
// Triggers US tax residency if score >= 183 AND current year days >= 31
export function substantialPresenceTest(trips) {
  const year   = new Date().getFullYear();
  const yearly = daysByYear(trips);

  const cy  = yearly[year]     || 0;  // weight 1
  const py  = yearly[year - 1] || 0;  // weight 1/3
  const ppy = yearly[year - 2] || 0;  // weight 1/6

  const score = cy + (py / 3) + (ppy / 6);

  return {
    year, cy, py, ppy,
    cyContrib:  cy,
    pyContrib:  py / 3,
    ppyContrib: ppy / 6,
    score:      Math.round(score * 10) / 10,
    triggers:   score >= 183 && cy >= 31,
    at31:       cy >= 31,
  };
}

// All stays with computed duration for display
export function computedTrips(trips) {
  return trips.map(t => {
    const arrival = parseISO(t.arrival);
    const departure = t.departure ? parseISO(t.departure) : today();
    return {
      ...t,
      durationDays: differenceInDays(departure, arrival),
      isActive: !t.departure,
    };
  }).sort((a, b) => new Date(b.arrival) - new Date(a.arrival)); // Most recent first
}
