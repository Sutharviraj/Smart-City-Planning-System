/**
 * Smart City Portal - Dummy Data
 * Used for demo when no backend
 */

const DUMMY_COMPLAINTS = [
  {
    id: 'SC001',
    category: 'Road Repair',
    status: 'resolved',
    worker: 'Raj Kumar',
    message: 'Pothole on Main Street',
    rating: 5,
    createdAt: '2025-01-28T10:00:00'
  },
  {
    id: 'SC002',
    category: 'Water Supply',
    status: 'in_progress',
    worker: 'Amit Singh',
    message: 'Low water pressure in Sector 5',
    rating: null,
    createdAt: '2025-01-29T14:30:00'
  },
  {
    id: 'SC003',
    category: 'Street Light',
    status: 'assigned',
    worker: 'Vijay Sharma',
    message: 'Broken light near park',
    rating: null,
    createdAt: '2025-01-30T09:15:00'
  },
  {
    id: 'SC004',
    category: 'Garbage',
    status: 'pending',
    worker: null,
    message: 'Overflowing bin at market',
    rating: null,
    createdAt: '2025-01-31T11:00:00'
  }
];

const DUMMY_ALERTS = [
  { id: 1, title: 'Water Supply Update', message: 'Scheduled maintenance tomorrow 9-11 AM', priority: 'high', date: '2025-01-31' },
  { id: 2, title: 'Road Closure', message: 'Main Street closed for repairs', priority: 'medium', date: '2025-01-30' },
  { id: 3, title: 'New Online Service', message: 'Apply for certificates online now', priority: 'low', date: '2025-01-29' }
];

const DUMMY_ROUTES = [
  { id: 1, from: 'Bus Stand', to: 'City Hospital', time: '25 min', stops: 8 },
  { id: 2, from: 'Market', to: 'Railway Station', time: '15 min', stops: 5 }
];

/** Default hero slider photos (assets/images). Only admin can change these via Admin Panel. */
const DEFAULT_HERO_SLIDES = [
  { imageUrl: 'assets/images/Gemini_Generated_Image_1r9hld1r9hld1r9h.png', title: 'Smart City – Digital & Connected' },
  { imageUrl: 'assets/images/Gemini_Generated_Image_2dvg5d2dvg5d2dvg.png', title: 'Smart City India – Innovation & Pride' },
  { imageUrl: 'assets/images/Gemini_Generated_Image_butcq5butcq5butc.png', title: 'Citizen Services & Feedback' },
  { imageUrl: 'assets/images/Gemini_Generated_Image_pxlptpxlptpxlptp.png', title: 'Clean India – Swachh Bharat' },
  { imageUrl: 'assets/images/WhatsApp Image 2026-02-01 at 4.10.03 PM.jpeg', title: 'Futuristic Smart City' },
  { imageUrl: 'assets/images/WhatsApp Image 2026-02-01 at 4.14.48 PM.jpeg', title: 'Smart City Vision' }
];
