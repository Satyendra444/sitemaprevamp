# 91trucks Sitemap & URL Structure

This document outlines the URL patterns and page structures supported by 91trucks.com, including language variants and deprecated pages.

## 1. Language & Locale Support
91trucks supports 2 languages across 3 locale versions.

| Locale | Description | URL Pattern |
| :--- | :--- | :--- |
| **Base** | Default English | `https://www.91trucks.com/{path}` |
| **EN** | English | `https://www.91trucks.com/en/{path}` |
| **HI** | Hindi | `https://www.91trucks.com/hi/{path}` |

---

## 2. Home Page
- **Base**: `https://www.91trucks.com` (Explore A Range Of Commercial Trucks, EVs, Buses & Rickshaws)
- **EN**: `https://www.91trucks.com/en`
- **HI**: `https://www.91trucks.com/hi` (ट्रक, बस और रिक्शा जैसे कमर्शियल वाहनों की जानकारी पाएँ)

---

## 3. Category Pages
Follows the **Base / EN / HI** locale structure.

**URL Pattern**: `/{category}`

| Category | URL |
| :--- | :--- |
| Trucks | `/trucks` |
| Buses | `/buses` |
| Auto Rickshaws | `/auto-rickshaws` |

> [!WARNING]
> `/three-wheelers` is deprecated and replaced by `/auto-rickshaws`.

### 3.2 Tyres - Landing Page
- **Base**: `/tyres`
- **EN**: `/en/tyres`
- **HI**: `/hi/tyres`

### 3.3 Tyres Category Pages (By Vehicle Type)
| Tyre Category | URL |
| :--- | :--- |
| Truck Tyres | `/truck-tyres` |
| Bus Tyres | `/bus-tyres` |
| Three-Wheeler Tyres | `/three-wheeler-tyres` |
| Tractor Tyres | `/tractor-tyres` |

---

## 4. Filter Pages
Browse pages based on popularity, latest launches, or specific filters.

| Page | URL Pattern | Example URL |
| :--- | :--- | :--- |
| **Popular Page** | `/popular-{category}` | Browse Popular trucks for Your Business Needs |
| **Latest Page** | `/latest-{category}` | Discover the Latest trucks in the Market |
| **Filter Page** | `/{category}/{filter}` | Tata Trucks Price in India 2026 |
| **Multi-filter** | `/filter/{category}/{filter1}+{filter2}` | Truck in India (No-Index) |

---

## 5. Model Pages
Detailed specifications, pricing, and reviews for specific models.

| Page | URL Pattern | Description |
| :--- | :--- | :--- |
| **Overview** | `/{category}/{brand}/{model}` | Force Traveller 26-Seater Specs |
| **Price** | `/{category}/{brand}/{model}/price-in-{city}` | Localized Pricing |
| **Variant** | `/{category}/{brand}/{model}/{variant}` | Specific Variant details |
| **Review** | `/{category}/{brand}/{model}/reviews` | User & Expert Reviews |

---

## 6. Comparison Pages
Compare multiple models (Min 2, Max 4).

| Type | URL Pattern |
| :--- | :--- |
| **Landing Page** | `/compare-{category}` |
| **Detail Page** | `/compare/{model-1}-vs-{model-2}` |

---

## 7. Dealer & Service Centre Pages
| Page | URL Pattern |
| :--- | :--- |
| **Dealer Landing** | `/{category}-dealers` |
| **Dealer Brand** | `/{category}-dealers/{brand}` |
| **Dealer City** | `/{category}-dealers/{brand}/{city}` |
| **Service Landing** | `/{category}-servicecenters` |
| **Service Brand** | `/{category}-servicecenters/{brand}` |
| **Service City** | `/{category}-servicecenters/{brand}/{city}` |

---

## 8. Deprecated / Removed Pages (410 Gone)
These pages are no longer active.
- **Spare Parts**: `/{category}-spareparts`
- **Body Makers**: `/{category}-bodymakers`

---

## 9. Content Pages
### News, Blogs & Web Stories
| Type | Landing | Category | Detail |
| :--- | :--- | :--- | :--- |
| **News** | `/news` | `/news/{category}` | `/news/{slug}` |
| **Blog** | `/blog` | `/blog/{category}` | `/blog/{slug}` |
| **Web Stories** | `/web-stories` | `/web-stories/category/{category}` | `/web-stories/{slug}` |

### Videos
- **Landing**: `{category}/videos`
- **Brand**: `{category}/{brand}/videos`

---

## 10. Special Features
### Electric Vehicles
- **Landing**: `/electric`
- **Charging Stations**: `/electric/charging-stations/{city}`

### Campaigns
- **Auto Expo**: `/auto-expo` (Brand Page: `/auto-expo/tata`)
- **Upcoming**: `/upcoming-commercial-vehicle`

### Store & Finance
- **Store**: `/store`, `/used-trucks`, `/used-trucks/{id}`
- **Finance**: `/finance`, `/finance/banking-partners`, `/finance/banking-partners/axis-bank`

---

## 11. Static & Company Information
| Page | URL |
| :--- | :--- |
| About Us | `/about` |
| Contact Us | `/contact` |
| Privacy Policy | `/privacy-policy` |
| Terms & Conditions | `/terms` |
| Advertise With Us | `/advertise` |
| Feedback | `/feedback` |
| Careers | `/careers` |

---
*Note: All pages follow the Base/EN/HI locale structure.*
# sitemaprevamp
