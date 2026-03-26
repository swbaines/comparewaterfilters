

# Provider Management System: Admin Dashboard + Web Scraping Import

## Overview

Build a database-backed provider management system with two ways to add providers:
1. A manual admin form to add/edit/delete providers
2. A "Import from website" feature that scrapes a provider's URL and pre-fills the form for review

## Current State

Providers are hardcoded in `src/data/providers.ts` (8 providers). No database, no admin UI.

## Architecture

```text
┌─────────────────────────────────────────────┐
│  Admin Dashboard (/admin/providers)         │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Provider     │  │ Add/Edit Form        │  │
│  │ List Table   │  │  - Manual fields     │  │
│  │              │  │  - "Import from URL" │  │
│  │              │  │    button that calls  │  │
│  │              │  │    Firecrawl to       │  │
│  │              │  │    pre-fill fields    │  │
│  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   Supabase DB          Firecrawl API
   (providers table)    (via edge function)
```

## Steps

### 1. Enable Lovable Cloud + Create Database Table

Create a `providers` table in Supabase with columns matching the current `Provider` interface: name, slug, description, logo, states (text array), postcode_ranges (text array), system_types (text array), brands (text array), price_range (enum), rating, review_count, years_in_business, certifications, highlights, available_for_quote, response_time, warranty, website, phone.

Seed it with the 8 existing providers from `src/data/providers.ts`.

### 2. Connect Firecrawl for Web Scraping

Use the Firecrawl connector to scrape provider websites. Build an edge function (`scrape-provider`) that:
- Takes a URL
- Scrapes the page using Firecrawl with structured JSON extraction
- Returns extracted fields (name, description, services, location, phone, certifications) mapped to our provider schema

### 3. Build Admin Dashboard Page

Create `/admin/providers` with:
- **Provider list table** showing all providers with edit/delete actions
- **Add Provider form** with all fields from the Provider interface
- **"Import from URL" button** that calls the scrape edge function, pre-fills the form, and lets the admin review/edit before saving
- Toast confirmations for all CRUD actions

### 4. Update App to Read from Database

Replace the hardcoded `providers` array import in `src/lib/providerMatchEngine.ts` and `src/pages/ResultsPage.tsx` with a Supabase query. Add a React Query hook (`useProviders`) to fetch providers from the database.

### 5. Quote Requests Table

Create a `quote_requests` table to store submissions from the Request Quote dialog, linking to the provider and storing the user's quiz answers + contact info. Update `RequestQuoteDialog.tsx` to insert into this table instead of simulating.

## Technical Details

- **Database**: Supabase (via Lovable Cloud) for providers + quote_requests tables
- **Scraping**: Firecrawl connector with JSON extraction format for structured data
- **Frontend**: New admin page with shadcn/ui Table, Form, Dialog components
- **Data fetching**: React Query + Supabase client for real-time provider data
- **No auth initially**: Admin page accessible by URL (can add auth later)

