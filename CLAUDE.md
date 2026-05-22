# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

No test suite is configured.

## Architecture

**Invoice Studio** is a single-page invoice generator targeting the Moroccan market (MAD currency, French UI, TVA). It renders A4-sized pages in the browser and uses `window.print()` for PDF export.

### State management

All state lives in a single `useReducer` in `src/hooks/useInvoiceState.js`. It is auto-persisted to `localStorage` under the key `invoice-studio-state` on every state change, with UI flags (`settingsOpen`, modals, dropdowns) reset to `false` on load. Initial seed data (clients, products, company info, invoice defaults) is read from `src/data.json` and used only when no localStorage state exists.

`src/context/InvoiceContext.jsx` wraps the reducer and exposes named action helpers (e.g. `addRow`, `updateRow`, `resetInvoice`) — components consume these via `useInvoice()` rather than dispatching directly.

### Pagination

`src/hooks/usePagination.js` slices `invoice.rows` into A4 pages using pixel budgets (A4 = 1123px height, 96px padding). It reads actual rendered row heights from a `Map` (heightCache) passed down from `App.jsx`. The first page has a smaller content area (`FIRST_BUDGET`) because it includes the header/company zone; subsequent pages use `NEXT_BUDGET`. If totals + the "add" button don't fit on the last page, an extra empty page is appended to hold them.

### Component structure

```
src/components/
  layout/      — Toolbar, PageCanvas (scroll container), A4Page (fixed 794×1123px wrapper)
  zones/       — ZoneCompany, ZoneClient, ZoneInvoiceBody, ZoneFooter (A4 page regions)
  invoice/     — InvoiceTable, InvoiceRow, InvoiceRowActions, AddProductButton, ContinuedRowFragment
  totals/      — TotalsBlock, TVASelector, DiscountField, AmountInWords
  editor/      — RichTextEditor (contentEditable), RichTextToolbar, RowEditModal, ColorPalette, FontSizePicker
  client/      — ClientDropdown, ClientForm, ClientInfo, ClientListItem
  product/     — ProductModal, ProductSearch, ProductForm, ProductListItem
  settings/    — SettingsDrawer (slide-in panel), CompanyInfoForm, InvoiceDefaultsForm, FooterConfigForm, LogoUploader
  ui/          — Button, Input, Modal, Dropdown, Badge, Divider (shared primitives)
```

### Print / PDF

Elements with `data-print-hide` (Toolbar, page number overlays) are hidden via CSS during print. The A4 page dimensions (794×1123px) are sized to match browser print output at 96dpi.

### Key utilities

- `src/utils/numberToWords.js` — converts a monetary amount to French words (e.g. "Deux mille cinq cents dirhams"). Handles MAD, EUR, USD. Used by `AmountInWords` in the totals block.

### Row description fields

Each invoice row has both `description` (plain text) and `descriptionHtml` (rich text HTML from the contentEditable editor). `RichTextEditor` sets its initial content via `innerHTML` in a mount-only effect — it does not re-render from props to avoid cursor-reset issues, so changes flow out via `onChange(html)` only.
