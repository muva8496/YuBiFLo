import React from "react";

export interface YuBiFloLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "colored";
  showTagline?: boolean;
  iconOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * YuBiFlo Emblem Mark:
 * A blooming golden-ratio flower whose petals curve into a continuous, fluid cashflow spiral.
 * "Your Business Is A Flower" — organic growth, steady watering, and flourishing liquidity.
 */
export function YuBiFloMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const gradientId1 = `yubiflo-flow-grad1-${size}`;
  const gradientId2 = `yubiflo-flow-grad2-${size}`;
  const gradientId3 = `yubiflo-flow-grad3-${size}`;
  const glowId = `yubiflo-glow-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="YuBiFlo Logo Mark"
    >
      <defs>
        {/* Vibrant Sapphire to Cyan Flow Gradient */}
        <linearGradient id={gradientId1} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Emerald Growth Gradient */}
        <linearGradient id={gradientId2} x1="56" y1="8" x2="8" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>

        {/* Golden Nectar / Capital Spark Gradient */}
        <radialGradient id={gradientId3} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>

        {/* Soft shadow filter for depth */}
        <filter id={glowId} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0F172A" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Outer rounded pill / tile container with micro-border */}
      <rect x="2" y="2" width="60" height="60" rx="17" fill="#0B132B" stroke="#1E293B" strokeWidth="1.5" />

      {/* Subtly illuminated inner background aura */}
      <circle cx="32" cy="32" r="22" fill="#1E3A8A" fillOpacity="0.28" filter="blur(6px)" />

      {/* ========================================================================= */}
      {/* 4 INTERLOCKING HARMONIC FLOWER PETALS IN PERPETUAL CASHFLOW MOTION        */}
      {/* ========================================================================= */}
      <g filter={`url(#${glowId})`}>
        {/* Top-Right Petal: Inflow & Capital */}
        <path
          d="M32 10C39 10 49 16 50 25C50.8 32.2 44 37 36 34C32 32.5 31.5 28 32 23C32.3 20 32 10 32 10Z"
          fill={`url(#${gradientId1})`}
          fillOpacity="0.95"
        />

        {/* Bottom-Right Petal: Retail Velocity */}
        <path
          d="M54 32C54 39 48 49 39 50C31.8 50.8 27 44 30 36C31.5 32 36 31.5 41 32C44 32.3 54 32 54 32Z"
          fill={`url(#${gradientId2})`}
          fillOpacity="0.92"
        />

        {/* Bottom-Left Petal: Nurtured Inventory */}
        <path
          d="M32 54C25 54 15 48 14 39C13.2 31.8 20 27 28 30C32 31.5 32.5 36 32 41C31.7 44 32 54 32 54Z"
          fill={`url(#${gradientId1})`}
          fillOpacity="0.95"
        />

        {/* Top-Left Petal: Flourishing Harvest */}
        <path
          d="M10 32C10 25 16 15 25 14C32.2 13.2 37 20 34 28C32.5 32 28 32.5 23 32C20 31.7 10 32 10 32Z"
          fill={`url(#${gradientId2})`}
          fillOpacity="0.92"
        />
      </g>

      {/* Continuous Golden Floral Wave (Cashflow connector) */}
      <path
        d="M20 32C20 25.3726 25.3726 20 32 20C38.6274 20 44 25.3726 44 32C44 38.6274 38.6274 44 32 44C27.5 44 24 41 24 37C24 34 27 32 30 32C33 32 35 34 35 36"
        stroke="#FDE047"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.85"
      />

      {/* Central Golden Pistil (Core Liquidity Spark) */}
      <circle cx="32" cy="32" r="4.2" fill={`url(#${gradientId3})`} />
      <circle cx="32" cy="32" r="1.8" fill="#FFFFFF" fillOpacity="0.9" />
    </svg>
  );
}

export function YuBiFloLogo({
  size = "md",
  variant = "dark",
  showTagline = true,
  iconOnly = false,
  className = "",
  onClick
}: YuBiFloLogoProps) {
  const pixelSizes = {
    xs: 24,
    sm: 30,
    md: 38,
    lg: 48,
    xl: 60
  };

  const textSizes = {
    xs: "text-sm",
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl"
  };

  const taglineSizes = {
    xs: "text-[8px]",
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
    xl: "text-sm"
  };

  const currentPx = pixelSizes[size];
  const textColor = variant === "light" ? "text-white" : "text-slate-900";
  const taglineColor = variant === "light" ? "text-cyan-300/90" : "text-blue-600";

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? "cursor-pointer group" : ""} ${className}`}
    >
      {/* Icon Mark */}
      <div className="relative transition-transform duration-200 group-hover:scale-105">
        <YuBiFloMark size={currentPx} />
      </div>

      {/* Wordmark and Tagline */}
      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <div className={`font-serif font-black tracking-tight ${textColor} ${textSizes[size]} flex items-center gap-0.5`}>
            <span>YuBi</span>
            <span className="text-blue-600 font-extrabold">FLo</span>
          </div>
          {showTagline && (
            <span
              className={`font-mono font-bold tracking-wider uppercase mt-1 ${taglineColor} ${taglineSizes[size]}`}
            >
              Your Business Is A Flower
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default YuBiFloLogo;
