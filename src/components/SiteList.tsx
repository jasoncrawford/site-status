"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Site, Check } from "@/lib/supabase/types"
import { formatTimeAgo } from "@/lib/format"
import { reorderSites } from "@/app/sites/actions"
import SiteFormDialog from "@/components/SiteFormDialog"
import AddSiteCard from "@/components/AddSiteCard"

type SiteWithLastCheck = Site & { lastCheck: Check | null }

function SortableSiteCard({
  site,
  isAdmin,
}: {
  site: SiteWithLastCheck
  isAdmin: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0"
        style={{
          width: "16px",
          height: "16px",
          color: "#B0B0B0",
          background: "transparent",
          border: "none",
          padding: 0,
          touchAction: "none",
        }}
        title="Drag to reorder"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="5.5" cy="3" r="1.5" />
          <circle cx="10.5" cy="3" r="1.5" />
          <circle cx="5.5" cy="8" r="1.5" />
          <circle cx="10.5" cy="8" r="1.5" />
          <circle cx="5.5" cy="13" r="1.5" />
          <circle cx="10.5" cy="13" r="1.5" />
        </svg>
      </button>
      <SiteCard site={site} isAdmin={isAdmin} isWrapped />
    </div>
  )
}

function SiteCard({
  site,
  isAdmin,
  isWrapped,
}: {
  site: SiteWithLastCheck
  isAdmin: boolean
  isWrapped?: boolean
}) {
  return (
    <div
      className={`${isWrapped ? "" : "group "}relative flex-1 min-w-0`}
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E8E4DF",
        borderRadius: "4px",
        padding: "14px 18px",
      }}
    >
      <Link
        href={`/sites/${site.id}`}
        className="absolute inset-0 z-0"
        aria-label={site.name}
      />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              backgroundColor:
                site.lastCheck?.status === "failure"
                  ? "#C4453C"
                  : "#2DA44E",
            }}
          />
          <span
            className="text-sm font-bold"
            style={{ color: "#1A1A1A" }}
          >
            {site.name}
          </span>
        </div>
        <span
          className="text-xs"
          style={{ color: "#5C5C5C" }}
        >
          {site.url}
        </span>
        {isAdmin && (
          <div className="relative z-10">
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
        <span
          className="ml-auto text-[11px] shrink-0"
          style={{ color: "#8A8A8A", letterSpacing: "0.01em" }}
        >
          {site.lastCheck
            ? `Checked ${formatTimeAgo(site.lastCheck.checked_at)}`
            : "No checks yet"}
        </span>
      </div>
    </div>
  )
}

export default function SiteList({
  sites: initialSites,
  isAdmin,
}: {
  sites: SiteWithLastCheck[]
  isAdmin: boolean
}) {
  const [sites, setSites] = useState(initialSites)

  // Sync local state when server data changes (after add/edit/delete revalidation)
  const serverKey = initialSites.map((s) => `${s.id}:${s.name}:${s.url}`).join("|")
  const prevServerKey = useRef(serverKey)
  if (serverKey !== prevServerKey.current) {
    prevServerKey.current = serverKey
    setSites(initialSites)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sites.findIndex((s) => s.id === active.id)
    const newIndex = sites.findIndex((s) => s.id === over.id)
    const reordered = arrayMove(sites, oldIndex, newIndex)

    setSites(reordered)
    reorderSites(reordered.map((s) => s.id))
  }

  if (sites.length === 0 && !isAdmin) {
    return (
      <p className="text-sm" style={{ color: "#5C5C5C" }}>
        No sites are being monitored yet.
      </p>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-3">
        {sites.map((site) => (
          <SiteCard key={site.id} site={site} isAdmin={false} />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sites.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3">
          {sites.map((site) => (
            <SortableSiteCard
              key={site.id}
              site={site}
              isAdmin
            />
          ))}
          <AddSiteCard />
        </div>
      </SortableContext>
    </DndContext>
  )
}
