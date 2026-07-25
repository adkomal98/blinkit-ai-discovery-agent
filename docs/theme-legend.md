# Theme Legend

The discovery engine groups every review into **at most 5 cross-category discovery themes** (plus a non-surfaced
"General Feedback" fallback). Classification is keyword-based and fully transparent — the single
source of truth is [`lib/theme-legend.json`](../lib/theme-legend.json), shared by the web app and the
offline artifact script.

## How classification works

For each review, `title + text` is lowercased and scored against every theme's keyword list
(single-word keywords need a word-boundary match; multi-word phrases match as substrings and count
double). The review is assigned to the **highest-scoring** theme; ties break by the theme order below.
A review that matches **no** keyword falls to **General Feedback** and is counted but never shown as a
pulse theme.

"Share %" in the note is a theme's count divided by the number of **categorised** reviews (i.e.
excluding General Feedback), so the operational signal isn't diluted by generic 5★ praise.

## The five discovery themes

### 1. Habitual Reordering & Routine
Repeat orders, weekly routines, same items purchased over and over, habit loops and reordering behavior.
**Keywords:** repeat, reorder, same items, same products, same order, routine, habit, weekly, regular,
always order, always buy, every week, every time, usual, usual order, same thing, same stuff, go-to,
staple, essentials, monthly, recurring, basket, favourites, favorites, frequently bought, buy again,
order again, past order, previous order.

### 2. Category Discovery & Browsing
Exploring new products, recommendations, category awareness, browsing experience, and product suggestions.
**Keywords:** explore, discover, new product, new category, recommend, recommendation, suggestion, suggest,
browse, browsing, search, find, finding, try, trying, variety, different, option, options, categories,
category, collection, homepage, banner, promoted, trending, popular, best seller, new arrival, personalized,
personalised, curated, for you.

### 3. Product Range & Availability
Out-of-stock issues, limited selection, missing brands or items, product variety and range gaps.
**Keywords:** stock, out of stock, unavailable, not available, limited, selection, missing, brand, brands,
variety, range, choice, choices, item, items, product, products, inventory, assortment, alternative,
substitute, replacement, organic, premium, quality, fresh, expired, expiry, quantity, size, pack size, specific.

### 4. Pricing, Offers & Value
Prices, discounts, offers, coupons, cashback, value-for-money and comparison with competitors.
**Keywords:** price, prices, pricing, expensive, cheap, costly, cost, discount, discounts, offer, offers,
deal, deals, coupon, coupons, cashback, cash back, reward, rewards, value, worth, save, saving, savings,
free delivery, delivery charge, delivery fee, membership, subscription, compare, comparison, competitor,
bigbasket, zepto, swiggy, instamart, jiomart, dmart, markup, overpriced, affordable, budget.

### 5. Delivery, Trust & Experience
Delivery speed and reliability, product quality upon arrival, trust, packaging, returns and overall experience.
**Keywords:** delivery, deliver, delivered, late, delay, delayed, fast, quick, minute, minutes, speed, time,
timing, slot, packaging, packed, damaged, broken, leak, leaking, fresh, stale, quality, trust, reliable,
reliability, return, refund, replace, replacement, wrong item, wrong product, missing item, missing product,
customer care, support, complaint, response, experience, service, app.

## Fallback — General Feedback
Generic praise or feedback not mapped to a specific cross-category discovery theme (e.g. "best app",
"love it"). Counted in totals but not surfaced as a pulse theme.

## Tuning for a new week / product
Edit `lib/theme-legend.json` only — add keywords, rename a theme, or swap the action templates. Both the
app and `npm run generate:note` pick the change up automatically. Keep it to **5 themes** to respect the
brief's cap.
