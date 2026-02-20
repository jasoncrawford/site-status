# Site Edit Popover Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace inline site edit/add UI with a centered `<dialog>` popover, shared by both add and edit flows.

**Architecture:** Single new `SiteFormDialog` client component wraps a native `<dialog>`. It accepts a `trigger` ReactNode that opens the dialog on click. The form inside calls existing server actions (`addSite`, `editSite`, `deleteSite`) unchanged. Delete has an inline confirmation step.

**Tech Stack:** Next.js 15 App Router, React `useRef`/`useState`, native HTML `<dialog>`, existing server actions.

**Design doc:** `docs/plans/2026-02-20-site-edit-popover-design.md`

**Branch:** Create `site-edit-popover` from `main`.

---

### Task 1: Create `SiteFormDialog` component

**Files:**
- Create: `src/components/SiteFormDialog.tsx`

**Step 1: Create the component**

```tsx
"use client"

import { useRef, useState } from "react"
import { addSite, editSite, deleteSite } from "@/app/sites/actions"

export default function SiteFormDialog({
  mode,
  siteId,
  name,
  url,
  trigger,
}: {
  mode: "add" | "edit"
  siteId?: string
  name?: string
  url?: string
  trigger: React.ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function open() {
    setConfirmingDelete(false)
    dialogRef.current?.showModal()
  }

  function close() {
    dialogRef.current?.close()
    setConfirmingDelete(false)
  }

  return (
    <>
      <span onClick={open} className="contents">
        {trigger}
      </span>
      <dialog
        ref={dialogRef}
        className="rounded-lg p-0 backdrop:bg-black/40"
        style={{
          border: "1px solid #E8E4DF",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          maxWidth: "400px",
          width: "calc(100% - 48px)",
        }}
        onCancel={(e) => {
          // Native dialog fires cancel on Escape — allow it
          // But prevent backdrop click from closing
        }}
        onClick={(e) => {
          // Clicks on the backdrop hit the dialog element itself
          // Don't close — user preference
          if (e.target === dialogRef.current) {
            e.preventDefault()
          }
        }}
      >
        <div style={{ padding: "24px" }}>
          <h3
            className="text-base font-bold mb-4"
            style={{ color: "#1A1A1A" }}
          >
            {mode === "add" ? "Add site" : "Edit site"}
          </h3>
          <form
            action={async (formData) => {
              if (mode === "add") {
                await addSite(formData)
              } else {
                await editSite(siteId!, formData)
              }
              close()
            }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="site-name"
                className="text-xs font-medium"
                style={{ color: "#5C5C5C" }}
              >
                Name
              </label>
              <input
                id="site-name"
                type="text"
                name="name"
                defaultValue={name ?? ""}
                placeholder="Site name"
                required
                autoFocus
                className="text-sm px-3 py-2 rounded outline-none"
                style={{
                  border: "1px solid #E8E4DF",
                  backgroundColor: "#FFFFFF",
                  color: "#1A1A1A",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="site-url"
                className="text-xs font-medium"
                style={{ color: "#5C5C5C" }}
              >
                URL
              </label>
              <input
                id="site-url"
                type="url"
                name="url"
                defaultValue={url ?? ""}
                placeholder="https://example.com"
                required
                className="text-sm px-3 py-2 rounded outline-none"
                style={{
                  border: "1px solid #E8E4DF",
                  backgroundColor: "#FFFFFF",
                  color: "#1A1A1A",
                }}
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="text-sm font-medium px-4 py-2 rounded cursor-pointer text-white"
                style={{ backgroundColor: "#2C2C2C" }}
              >
                {mode === "add" ? "Add" : "Save"}
              </button>
              <button
                type="button"
                onClick={close}
                className="text-sm px-4 py-2 rounded cursor-pointer"
                style={{
                  backgroundColor: "transparent",
                  color: "#5C5C5C",
                  border: "1px solid #E8E4DF",
                }}
              >
                Cancel
              </button>
              {mode === "edit" && !confirmingDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="text-sm px-4 py-2 rounded cursor-pointer ml-auto"
                  style={{
                    backgroundColor: "transparent",
                    color: "#C4453C",
                    border: "1px solid #E8E4DF",
                  }}
                >
                  Delete
                </button>
              )}
              {mode === "edit" && confirmingDelete && (
                <span className="ml-auto flex items-center gap-2 text-sm" style={{ color: "#C4453C" }}>
                  Delete?
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteSite(siteId!)
                      close()
                    }}
                    className="text-sm font-medium px-3 py-1 rounded cursor-pointer text-white"
                    style={{ backgroundColor: "#C4453C" }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="text-sm px-3 py-1 rounded cursor-pointer"
                    style={{
                      backgroundColor: "transparent",
                      color: "#5C5C5C",
                      border: "1px solid #E8E4DF",
                    }}
                  >
                    No
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </dialog>
    </>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/SiteFormDialog.tsx
git commit -m "feat: add SiteFormDialog component with native dialog element"
```

---

### Task 2: Simplify `AddSiteCard` to use `SiteFormDialog`

**Files:**
- Modify: `src/components/AddSiteCard.tsx` (full rewrite)

**Step 1: Replace AddSiteCard with a simple trigger card that wraps SiteFormDialog**

Replace the entire file with:

```tsx
import SiteFormDialog from "@/components/SiteFormDialog"

export default function AddSiteCard() {
  return (
    <SiteFormDialog
      mode="add"
      trigger={
        <button
          className="flex items-center justify-center flex-col gap-1.5 rounded cursor-pointer w-full"
          style={{
            background: "transparent",
            border: "1.5px dashed #D4CFC9",
            padding: "24px 18px",
            color: "#8A8A8A",
            minHeight: "108px",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          <span className="text-[13px] font-medium">Add site</span>
        </button>
      }
    />
  )
}
```

Note: `AddSiteCard` is no longer a client component — it doesn't use `useState` anymore. `SiteFormDialog` handles all the state. Remove the `"use client"` directive.

**Step 2: Commit**

```bash
git add src/components/AddSiteCard.tsx
git commit -m "refactor: simplify AddSiteCard to use SiteFormDialog"
```

---

### Task 3: Update status page to use `SiteFormDialog` instead of `EditSiteButton`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace import and usage**

- Replace `import EditSiteButton from "@/components/EditSiteButton"` with `import SiteFormDialog from "@/components/SiteFormDialog"`
- Replace the `<EditSiteButton>` block (lines 186-194) with:

```tsx
{isAdmin && (
  <div className="absolute top-3 right-3 z-10">
    <SiteFormDialog
      mode="edit"
      siteId={site.id}
      name={site.name}
      url={site.url}
      trigger={
        <button
          className="flex items-center justify-center rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          style={{
            width: "28px",
            height: "28px",
            color: "#5C5C5C",
            background: "transparent",
            border: "none",
          }}
          title="Edit site"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11.5 1.5l3 3-9 9H2.5v-3z" />
            <path d="M10 3l3 3" />
          </svg>
        </button>
      }
    />
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: use SiteFormDialog on status page instead of inline edit"
```

---

### Task 4: Update site detail page with full "Edit" button using `SiteFormDialog`

**Files:**
- Modify: `src/app/sites/[id]/page.tsx`

**Step 1: Replace import and usage**

- Replace `import EditSiteButton from "@/components/EditSiteButton"` with `import SiteFormDialog from "@/components/SiteFormDialog"`
- Replace the `{user && (...)}` block (lines 94-98) with:

```tsx
{user && (
  <div className="flex items-center gap-2.5 shrink-0 pt-1.5">
    <SiteFormDialog
      mode="edit"
      siteId={site.id}
      name={site.name}
      url={site.url}
      trigger={
        <button
          className="text-sm font-medium px-4 py-2 rounded cursor-pointer"
          style={{
            backgroundColor: "transparent",
            color: "#5C5C5C",
            border: "1px solid #E8E4DF",
          }}
        >
          Edit
        </button>
      }
    />
  </div>
)}
```

**Step 2: Commit**

```bash
git add src/app/sites/[id]/page.tsx
git commit -m "refactor: use SiteFormDialog with Edit button on site detail page"
```

---

### Task 5: Delete `EditSiteButton.tsx`

**Files:**
- Delete: `src/components/EditSiteButton.tsx`

**Step 1: Delete the file**

```bash
git rm src/components/EditSiteButton.tsx
```

**Step 2: Verify no remaining imports**

```bash
grep -r "EditSiteButton" src/
```

Expected: no results.

**Step 3: Commit**

```bash
git commit -m "chore: remove EditSiteButton, replaced by SiteFormDialog"
```

---

### Task 6: Run unit tests

**Step 1: Run vitest**

```bash
npx vitest run
```

Expected: All 88 tests pass. The server action unit tests (`sites-crud.test.ts`) should be unaffected since we didn't change `actions.ts`.

---

### Task 7: Update e2e tests for dialog-based UI

**Files:**
- Modify: `e2e/sites-crud.spec.ts`

**Step 1: Rewrite the e2e tests**

The key changes:
- "Add site" click now opens a dialog, not an inline form. Use `page.getByRole("dialog")` to scope interactions.
- Edit pencil icon on status page now opens a dialog.
- Site detail page now has an "Edit" button (text), not a pencil icon.
- Delete now has a confirmation step (click Delete, then click Yes).
- Add test for Escape key dismissal.

Replace the full file:

```ts
import { test, expect } from "./fixtures";

test.afterEach(async ({ adminClient }) => {
  // Restore renamed site if needed
  const { data: sites } = await adminClient.from("sites").select("id, name");
  const renamed = sites?.find((s) => s.name === "Renamed Site");
  if (renamed) {
    await adminClient
      .from("sites")
      .update({ name: "E2E Test Site" })
      .eq("id", renamed.id);
  }

  // Clean up any extra sites created during tests (keep the seeded one)
  for (const site of sites ?? []) {
    if (site.name !== "E2E Test Site" && site.name !== "Renamed Site") {
      await adminClient.from("incidents").delete().eq("site_id", site.id);
      await adminClient.from("checks").delete().eq("site_id", site.id);
      await adminClient.from("sites").delete().eq("id", site.id);
    }
  }
});

test("shows Add site card when authenticated", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Add site")).toBeVisible();
});

test("adds a new site", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Add site").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Name").fill("New Test Site");
  await dialog.getByLabel("URL").fill("https://example.com/test");
  await dialog.getByRole("button", { name: "Add" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("New Test Site")).toBeVisible();
  await expect(page.getByText("https://example.com/test")).toBeVisible();
});

test("cancels adding a site", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Add site").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Add site")).toBeVisible();
});

test("dismisses dialog with Escape key", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Add site").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});

test("edits a site name", async ({ page }) => {
  await page.goto("/");

  // Hover the site card to reveal the edit button, click it
  const siteCard = page.locator(".group").filter({ hasText: "E2E Test Site" });
  await siteCard.hover();
  await siteCard.getByTitle("Edit site").click({ force: true });

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const nameInput = dialog.getByLabel("Name");
  await nameInput.clear();
  await nameInput.fill("Renamed Site");
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Renamed Site")).toBeVisible();
});

test("site detail Edit button opens edit dialog", async ({ page, testData }) => {
  await page.goto(`/sites/${testData.siteId}`);
  await page.getByRole("button", { name: "Edit" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Name")).toBeVisible();
  await expect(dialog.getByLabel("URL")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
});

test("deletes a site with confirmation", async ({ page, adminClient }) => {
  // First create a site to delete
  await adminClient
    .from("sites")
    .insert({ name: "Site To Delete", url: "https://example.com/delete" });

  await page.goto("/");
  await expect(page.getByText("Site To Delete")).toBeVisible();

  // Hover and click edit
  const siteCard = page.locator(".group").filter({ hasText: "Site To Delete" });
  await siteCard.hover();
  await siteCard.getByTitle("Edit site").click({ force: true });

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Click Delete — should show confirmation
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(dialog.getByText("Delete?")).toBeVisible();

  // Confirm deletion
  await dialog.getByRole("button", { name: "Yes" }).click();

  await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Site To Delete")).not.toBeVisible();
});
```

**Step 2: Commit**

```bash
git add e2e/sites-crud.spec.ts
git commit -m "test: update e2e tests for dialog-based site edit UI"
```

---

### Task 8: Run all tests

**Step 1: Run unit tests**

```bash
npx vitest run
```

Expected: All pass.

**Step 2: Run e2e tests**

```bash
env-cmd -f .env.test npx playwright test
```

Expected: All pass. If any fail, debug and fix before proceeding.

**Step 3: Final commit if any fixes were needed**

---

### Task 9: Create PR

```bash
gh pr create --title "Replace inline site edit with dialog popover" --body "$(cat <<'EOF'
## Summary
- New `SiteFormDialog` component using native `<dialog>` for both add and edit flows
- Centered popover with semi-transparent backdrop (non-dismissive on backdrop click)
- Delete now requires confirmation (Delete → "Delete? Yes / No")
- Site detail page uses full "Edit" button instead of pencil icon
- Removed `EditSiteButton` component entirely, simplified `AddSiteCard`

Closes #31

## Test plan
- [ ] Unit tests pass (server actions unchanged)
- [ ] E2E: add site via dialog
- [ ] E2E: edit site via dialog (status page pencil icon)
- [ ] E2E: edit site via dialog (site detail Edit button)
- [ ] E2E: delete site with confirmation
- [ ] E2E: cancel/Escape dismisses dialog
- [ ] E2E: backdrop click does NOT dismiss

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
