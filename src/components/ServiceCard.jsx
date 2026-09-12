import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ServiceCard({
  icon,
  title,
  description,
  badge,
  turnaround,
  highlights = [],
  loading = false,
  makeLink = (p) => p,
}) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-3xl border border-[#E4D2C0] bg-white p-8 shadow-md">
        <div className="mb-6 h-14 w-14 rounded-2xl bg-[#F5ECE1]" />
        <div className="mb-4 h-7 w-3/4 rounded bg-[#E4D2C0]" />
        <div className="space-y-3">
          <div className="h-4 rounded bg-[#F5ECE1]" />
          <div className="h-4 w-11/12 rounded bg-[#F5ECE1]" />
          <div className="h-4 w-8/12 rounded bg-[#F5ECE1]" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col justify-between rounded-3xl border border-[#E4D2C0] bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-2 hover:border-[#9E532B]/50 hover:shadow-2xl hover:shadow-[#9E532B]/15">
      <div>
        {/* Top bar with Icon & Badge */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5ECE1] to-[#FAF5EE] text-[#9E532B] transition-all duration-300 group-hover:bg-[#9E532B] group-hover:text-white group-hover:scale-105 shadow-sm border border-[#E4D2C0]">
            {icon}
          </div>

          {badge && (
            <span className="rounded-full border border-[#9E532B]/20 bg-[#F6ECE3] px-3 py-1 text-xs font-bold text-[#9E532B]">
              {badge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-3 text-2xl font-bold text-[#38240D] transition-colors duration-300 group-hover:text-[#9E532B]">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm sm:text-base leading-relaxed text-[#6B5645]">
          {description}
        </p>

        {/* Highlights List if present */}
        {highlights && highlights.length > 0 && (
          <ul className="mt-6 space-y-2.5 border-t border-[#E4D2C0] pt-5 text-sm text-[#6B5645]">
            {highlights.map((item, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#9E532B] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-8 flex items-center justify-between border-t border-[#E4D2C0]/50 pt-4">
        {turnaround ? (
          <span className="text-xs font-semibold text-[#6B5645]">
            SLA: <strong className="text-[#9E532B]">{turnaround}</strong>
          </span>
        ) : (
          <span className="text-xs font-semibold text-[#6B5645]">Certified Quality</span>
        )}

        <Link
          href={makeLink("/contact")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#9E532B] transition-all group-hover:translate-x-1 group-hover:text-[#7D3B17]"
        >
          <span>Book Service</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}