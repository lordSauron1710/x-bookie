# Accessibility Policy

x-bookie should meet WCAG 2.1 AA expectations for the bookmark review interface.

The UI can be visually opinionated, but it still has to be operable, understandable, and resilient.

## Core Rules

- Use semantic HTML for every interactive control.
  - Buttons are buttons. Links are links.
- Every icon-only control must have an accessible name.
- Focus must remain visible at all times.
- Keyboard access is mandatory for primary actions.
- Motion must respect user preference.
- Color cannot be the only signal.
- Important state changes should be understandable from nearby text, not color or motion alone.

## Repo-Specific Requirements

- The app should keep a clear landmark structure such as `main`, sidebars, and labeled control areas.
- Category selection, bookmark selection, and status banners must expose meaningful text.
- Search, filters, and category overrides must remain usable without a mouse.
- Keep touch targets usable on mobile layouts.

## Visual Requirements

- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and UI components.
- Aim for 44x44px touch targets on mobile.
- Keep the layout usable at 200% zoom without clipped controls.

## Pre-Merge Checklist

- [ ] Tab through the app and verify logical focus order
- [ ] Verify icon buttons have accessible names
- [ ] Check reduced-motion behavior for animated interactions
- [ ] Verify contrast on text, controls, and active states
- [ ] Confirm state changes are understandable from text, not color alone
