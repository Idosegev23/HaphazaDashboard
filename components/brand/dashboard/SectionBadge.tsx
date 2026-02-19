interface SectionBadgeProps {
  label: string;
}

export function SectionBadge({ label }: SectionBadgeProps) {
  return (
    <span className="inline-block border border-[#dfdfdf] rounded-md px-2 py-1 text-sm text-[#6b7281]">
      {label}
    </span>
  );
}
