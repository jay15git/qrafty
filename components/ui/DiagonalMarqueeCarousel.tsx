"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  url: string;
  title: string;
}

export interface DiagonalMarqueeCarouselProps {
  animate?: boolean;
  cards?: CardItem[];
  angle?: number;
  baseSpeed?: number;
  alternateDirections?: boolean;
  dimCards?: boolean;
  itemClassName?: string;
  rowCount?: number;
  rowGapClassName?: string;
  rowRepeat?: number;
  className?: string;
  cardClassName?: string;
  fadeClassName?: string;
}

function rotateCards(cards: CardItem[], offset: number) {
  if (cards.length === 0) {
    return cards;
  }

  const shift = ((offset % cards.length) + cards.length) % cards.length;
  return [...cards.slice(shift), ...cards.slice(0, shift)];
}

function expandRowCards(cards: CardItem[], repeat: number) {
  if (repeat <= 1) {
    return cards;
  }

  return Array.from({ length: repeat }, () => cards).flat();
}

function resolveRowRepeat(cards: CardItem[], rowRepeat?: number) {
  if (rowRepeat !== undefined) {
    return rowRepeat;
  }

  return cards.length >= 18 ? 1 : 3;
}

const DEFAULT_CARDS: CardItem[] = [
  {
    id: 2,
    url: "https://ik.imagekit.io/ybq4azred/landscape_mountain_1784924486724.png",
    title: "Landscape",
  },
  {
    id: 3,
    url: "https://ik.imagekit.io/ybq4azred/nature_sunlight_1784924506267.png",
    title: "Nature",
  },
  {
    id: 4,
    url: "https://ik.imagekit.io/ybq4azred/forest_autumn_1784924537778.png",
    title: "Forest",
  },
  {
    id: 5,
    url: "https://ik.imagekit.io/ybq4azred/forest_bridge_1784924559843.png",
    title: "Bridge",
  },
  {
    id: 6,
    url: "https://ik.imagekit.io/ybq4azred/ocean_sunset_1784924582456.png",
    title: "Ocean",
  },
  {
    id: 7,
    url: "https://ik.imagekit.io/ybq4azred/valley_aerial_1784924609773.png",
    title: "Valley",
  },
];

const Card = ({
  card,
  className,
  dimCards,
}: {
  card: CardItem;
  className?: string;
  dimCards: boolean;
}) => {
  return (
    <div
      className={cn(
        "group relative h-[300px] w-[400px] shrink-0 cursor-pointer overflow-hidden rounded-xl shadow-2xl",
        className,
      )}
    >
      <img
        src={card.url}
        alt={card.title}
        className="h-full w-full object-cover"
        draggable={false}
        loading="lazy"
      />
      {dimCards ? <div className="absolute inset-0 bg-black/40" /> : null}
    </div>
  );
};

const MarqueeRow = ({
  cards,
  speed,
  direction,
  cardClassName,
  dimCards,
  itemClassName,
  animate,
}: {
  cards: CardItem[];
  speed: number;
  direction: 1 | -1;
  cardClassName?: string;
  dimCards: boolean;
  itemClassName?: string;
  animate: boolean;
}) => {
  const animationClass =
    direction === -1 ? "animate-marquee-left" : "animate-marquee-right";

  return (
    <div className="flex w-full overflow-hidden">
      <div
        className={cn(
          "flex shrink-0",
          animate && animationClass,
          animate && "hover:[animation-play-state:paused]",
        )}
        style={animate ? ({ "--speed": `${speed}s` } as React.CSSProperties) : undefined}
      >
        <div className="flex shrink-0">
          {cards.map((card) => (
            <div key={card.id} className={cn("shrink-0 pr-8", itemClassName)}>
              <Card card={card} className={cardClassName} dimCards={dimCards} />
            </div>
          ))}
        </div>
        <div className="flex shrink-0">
          {cards.map((card) => (
            <div
              key={`${card.id}-copy`}
              className={cn("shrink-0 pr-8", itemClassName)}
            >
              <Card card={card} className={cardClassName} dimCards={dimCards} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function DiagonalMarqueeCarousel({
  cards = DEFAULT_CARDS,
  angle = -25,
  baseSpeed = 120,
  alternateDirections = true,
  dimCards = true,
  itemClassName,
  rowGapClassName = "gap-8",
  className = "",
  cardClassName = "",
  fadeClassName = "",
  animate = true,
  rowRepeat,
  rowCount = 5,
}: DiagonalMarqueeCarouselProps) {
  const rotationStyle = {
    transform: `rotate(${angle}deg)`,
  };

  const resolvedRowRepeat = resolveRowRepeat(cards, rowRepeat);
  const resolvedRowCount = Math.max(1, rowCount);
  const rowStride = Math.max(1, Math.floor(cards.length / resolvedRowCount));
  const rows = Array.from({ length: resolvedRowCount }, (_, index) => {
    const rotated = rotateCards(cards, index * rowStride);
    const expanded = expandRowCards(rotated, resolvedRowRepeat);
    const useReverse = alternateDirections && index % 2 === 1;
    return useReverse ? [...expanded].reverse() : expanded;
  });

  const rowSpeedOffsets = [0, -15, 15, -6, 24];
  const rowSpeeds = Array.from({ length: resolvedRowCount }, (_, index) => {
    const speed = baseSpeed + (rowSpeedOffsets[index] ?? 0);
    return speed > 20 ? speed : 30;
  });
  const rowDirections: Array<1 | -1> = Array.from(
    { length: resolvedRowCount },
    (_, index) => {
      if (index % 2 === 0) {
        return -1;
      }

      return alternateDirections ? 1 : -1;
    },
  );

  return (
    <div
      className={cn(
        "relative flex h-screen w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marquee-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-marquee-left {
          animation: marquee-left var(--speed) linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right var(--speed) linear infinite;
        }
      `,
        }}
      />
      <div
        className={cn("absolute z-0 flex w-[200vw] flex-col", rowGapClassName)}
        style={rotationStyle}
      >
        {rows.map((rowCards, index) => (
          <MarqueeRow
            key={index}
            animate={animate}
            cardClassName={cardClassName}
            cards={rowCards}
            dimCards={dimCards}
            direction={rowDirections[index] ?? -1}
            itemClassName={itemClassName}
            speed={rowSpeeds[index] ?? baseSpeed}
          />
        ))}
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-1/4 bg-gradient-to-b from-white to-transparent dark:from-neutral-950",
          fadeClassName,
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/4 bg-gradient-to-t from-white to-transparent dark:from-neutral-950",
          fadeClassName,
        )}
      />
    </div>
  );
}

/**
 * Great UI Component
 *
 * Built with React, TypeScript, Tailwind CSS, and Framer Motion.
 * Designed to be accessible, customizable, and production-ready.
 *
 * Website: https://great-ui.com
 * GitHub: https://github.com/Saurabh-2607/GreatUI
 * X (Great UI): https://x.com/GreatUIHQ
 *
 * Released under the MIT License.
 * Contributions, issues, and feature requests are always welcome.
 *
 * Author: Saurabh Sharma
 * X: https://x.com/srbh_s
 */
