import SiteFormDialog from "@/components/SiteFormDialog"

export default function AddSiteCard() {
  return (
    <SiteFormDialog
      mode="add"
      trigger={
        <button
          className="flex items-center gap-2 rounded cursor-pointer w-full"
          style={{
            background: "transparent",
            border: "1.5px dashed #D4CFC9",
            padding: "12px 18px",
            color: "#8A8A8A",
            transition: "border-color 0.15s, color 0.15s",
          }}
        >
          <svg
            width="16"
            height="16"
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
