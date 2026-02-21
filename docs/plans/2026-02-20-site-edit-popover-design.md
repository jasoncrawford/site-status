# Site Edit Popover Design

**Issue:** #31 — Site edit UI should be its own page (popover)
**Date:** 2026-02-20

## Problem

The inline site edit UI replaces card content in-place, which feels awkward. Both add and edit flows should use a centered popover dialog instead.

## Design

### New component: `SiteFormDialog`

A single client component using the native HTML `<dialog>` element, shared by both add and edit flows.

**Props:**
- `mode: "add" | "edit"`
- `siteId?: string` (edit only)
- `name?: string` (edit only, pre-fills input)
- `url?: string` (edit only, pre-fills input)
- `trigger: ReactNode` — the button/element that opens the dialog

**Behavior:**
- Clicking the trigger calls `dialogRef.current.showModal()`
- Dialog renders centered with semi-transparent backdrop
- Form contains: Name input, URL input, action buttons
- Add mode: "Add" and "Cancel" buttons
- Edit mode: "Save", "Cancel", and "Delete" buttons
- Cancel button and Escape key dismiss the dialog
- Backdrop click does NOT close the dialog
- On successful save/add: dialog closes, server action revalidates paths
- Delete: clicking Delete shows inline confirmation ("Are you sure? Yes / No") replacing the Delete button. "Yes" executes deletion.

### Changes to existing components

**Status page (`page.tsx`):**
- Replace `<EditSiteButton>` with `<SiteFormDialog mode="edit">` wrapping a pencil icon trigger
- Replace `<AddSiteCard>` inline form — dashed card becomes a simple trigger for `<SiteFormDialog mode="add">`

**Site detail page (`sites/[id]/page.tsx`):**
- Replace pencil icon `<EditSiteButton>` with `<SiteFormDialog mode="edit">` wrapping a full "Edit" button (text, not just icon)

**Components to delete/simplify:**
- `EditSiteButton.tsx` — delete entirely, replaced by `SiteFormDialog`
- `AddSiteCard.tsx` — simplify to just the dashed card trigger (no inline form logic)

### Server actions

No changes — existing `addSite`, `editSite`, `deleteSite` in `actions.ts` work as-is.

### E2E tests

Update selectors in `e2e/sites-crud.spec.ts` to interact with the dialog instead of inline forms. Test dialog open/close, Escape key, and delete confirmation flow.
