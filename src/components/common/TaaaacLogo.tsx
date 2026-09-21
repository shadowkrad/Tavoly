import React from "react";

interface TaaaacIconProps {
  className?: string;
  size?: number;
}

export function TaaaacIcon({ className = "w-8 h-8", size }: TaaaacIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <g stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 64 8 L 64 14" />
        <path d="M 76 13 L 71 18" />
        <path d="M 81 25 L 75 25" />
        <path d="M 77 35 L 72 31" />
        <path d="M 52 11 L 56 17" />
        <path d="M 45 20 L 51 22" />
        <path
          d="M 64 17 L 66 22 L 71 20 L 68 25 L 73 28 L 67 29 L 69 35 L 64 31 L 60 36 L 61 30 L 55 30 L 60 26 L 57 20 L 62 23 Z"
          fill="#10b981"
          fillOpacity="0.25"
        />
      </g>
      <g stroke="#2563eb" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 28 48 L 19 25 C 18 21 21 17 25 18 C 28 19 30 22 32 26 L 43 45" />
        <path d="M 49 53 C 51 46 54 38 58 29 C 59.5 25.5 63 26 63 29 C 63 35 60 48 57 58 C 55 64 57 70 59 76 L 56 86 C 53 88 47 87 43 78 C 38 68 31 60 21 54 C 18 52 19 47 23 48 C 27 49 32 53 36 57" />
        <path d="M 43 45 C 47 42 53 44 51 49 C 50 52 46 54 41 53" />
        <path d="M 37 53 C 41 51 46 53 45 57 C 44 60 40 61 35 60" />
      </g>
    </svg>
  );
}

interface TaaaacLogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  showBadge?: boolean;
  badgeText?: string;
}

export function TaaaacLogo({
  className = "",
  iconSize = 22,
  textSize = "text-base",
  showBadge = true,
  badgeText = "Tavoly",
}: TaaaacLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center p-1 rounded-xl bg-blue-50 border border-blue-100 shadow-2xs">
        <TaaaacIcon size={iconSize} />
      </div>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`font-black tracking-tight text-slate-900 shrink-0 ${textSize}`}>
          taaaac<span className="text-emerald-600">.eu</span>
        </span>
        {showBadge && badgeText && (
          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0 tracking-wider">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
