import { cn } from "@/lib/utils";

const categoryColors: Record<string, { bg: string; text: string }> = {
  bathroom: { bg: "bg-yellow-100", text: "text-yellow-800" },
  basement: { bg: "bg-lime-100", text: "text-lime-800" },
  addition: { bg: "bg-blue-100", text: "text-blue-800" },
  renovation: { bg: "bg-orange-100", text: "text-orange-800" },
  kitchen: { bg: "bg-green-100", text: "text-green-800" },
  attic: { bg: "bg-gray-100", text: "text-gray-700" },
  exterior: { bg: "bg-purple-100", text: "text-purple-800" },
  roofing: { bg: "bg-red-100", text: "text-red-800" },
  siding: { bg: "bg-teal-100", text: "text-teal-800" },
  windows: { bg: "bg-cyan-100", text: "text-cyan-800" },
  deck: { bg: "bg-amber-100", text: "text-amber-800" },
  other: { bg: "bg-slate-100", text: "text-slate-700" },
};

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const normalizedCategory = category.toLowerCase().replace(/\s+/g, "");
  const colors = categoryColors[normalizedCategory] || categoryColors.other;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide",
        colors.bg,
        colors.text,
        className
      )}
    >
      {category}
    </span>
  );
}
