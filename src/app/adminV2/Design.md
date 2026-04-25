---
name: Booking Admin App Design System
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#40493d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#3c6842'
  on-secondary: '#ffffff'
  secondary-container: '#bdefbe'
  on-secondary-container: '#426e47'
  tertiary: '#595645'
  on-tertiary: '#ffffff'
  tertiary-container: '#726e5c'
  on-tertiary-container: '#f8f1db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#bdefbe'
  secondary-fixed-dim: '#a2d3a4'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#24502c'
  tertiary-fixed: '#e9e2cc'
  tertiary-fixed-dim: '#ccc6b1'
  on-tertiary-fixed: '#1e1c0e'
  on-tertiary-fixed-variant: '#4a4737'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
  primary-dark: '#1B5E20'
  surface-cream: '#FFF8E1'
  card-white: '#FFFFFF'
  text-primary: '#212121'
  text-secondary: '#616161'
  border-subtle: '#E0E0E0'
  state-disabled: '#BDBDBD'
typography:
  h1:
    fontFamily: Work Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Work Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Work Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  body-sm:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin-mobile: 16px
  container-margin-desktop: 32px
  gutter: 16px
  touch-target-min: 44px
  sidebar-width: 260px
  sidebar-collapsed: 72px
---

# Booking Admin App – Design.md

## Overview

This document defines the UI/UX design specifications for the Booking Admin App. The application is mobile-first, touch-friendly, and built using Next.js with a modern SaaS design approach.

---

## Theme & Design System

### Colors

* **Primary:** Green (#2E7D32)
* **Primary Light:** #A5D6A7
* **Primary Dark:** #1B5E20
* **Surface:** Cream (#FFF8E1)
* **Card:** White (#FFFFFF)
* **Background:** #F5F5F5
* **Text Primary:** #212121
* **Text Secondary:** #616161
* **Border:** #E0E0E0
* **Disabled:** #BDBDBD

### Design Principles

* Mobile-first layout
* Touch-friendly components
* Clean SaaS-style UI
* Minimal and spacious layout

---

## Layout

### Sidebar (Desktop)

* Fixed sidebar
* Icons + Labels
* Collapsible

### Mobile Navigation

* Top: Burger menu → opens drawer
* Bottom Navigation:

  * Dashboard
  * Calendar
  * Checklist
  * Profile
  * More (opens drawer)

---

## Pages

### 1. Login Page

#### Desktop

* Split layout

  * Left: Image carousel
  * Right: Login card

#### Mobile

* Background image
* Centered login card

#### Fields

* Email
* Password
* Login button

---

### 2. Dashboard

#### Components

* Stats Cards:

  * Today Visitors
  * Upcoming
  * Overall
  * Includes trend indicators

* Data View:

  * Desktop: Table with pagination
  * Mobile: Card/List view

---

### 3. Calendar Page

#### Layout

* Full-screen calendar (Google Calendar style)

#### Booking States

* 0 bookings → Cream
* Partial → Light Green
* Full → Dark Green
* Disabled → Grey

#### Interaction

* Click date → Open modal

#### Modal Fields

* Selected Date
* Booking Counts (Total / Booked / Available)
* Time Picker (12hr with AM/PM)
* Max Booking (0–200, default 100)
* Disable Toggle

#### Actions

* Cancel
* Save

---

### 4. Checklist Page

#### Top Bar

* Search Input
* Date Picker (default: today)

#### List

* User Name
* Mobile Number
* Visited Toggle

---

### 5. History Page

#### Features

* Search
* Filter
* Sort
* Pagination

#### Data View

* Desktop: Table
* Mobile: Compact List

#### Fields

* User Name
* Mobile
* Email
* Guest Count
* Visited Status

---

### 6. Gallery Page

#### Layout

* Bento Grid (responsive)

#### Interactions

* Click → Fullscreen view
* Long press (mobile) → Context menu

  * Edit
  * Delete

#### Header Action

* Add Image button

#### Upload Modal

* Desktop: Dialog
* Mobile: Bottom sheet

#### Fields

* Drag & Drop Upload (images only)
* Caption (max 100 chars)

#### Actions

* Cancel
* Save

---

### 7. Profile Page

#### Feature: Change Password with OTP

#### Stepper

**Step 1: Password**

* Password
* Confirm Password

**Step 2: OTP Verification**

* 6-digit OTP input

**Step 3: Success**

* Success message
* Animation

---

## Interaction Guidelines

* Use smooth transitions for navigation and modals
* Ensure all tap targets are mobile-friendly
* Use bottom sheets for mobile dialogs where applicable
* Maintain consistent spacing and typography

---

## Notes

* Follow accessibility best practices
* Ensure responsive behavior across all screen sizes
* Optimize for performance and fast interactions

---

## End of Document
