"use client";

import { useMemo, useEffect, useCallback } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import EventCard from "@/components/event-card";
import { EventCardProps } from "@/types/event";

type EventMarqueeProps = {
  events: EventCardProps[];
};

const MIN_VISIBLE_CARDS = 6;

export default function EventMarquee({ events }: EventMarqueeProps) {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimationControls();

  const baseSequence = useMemo(() => {
    if (events.length === 0) return [];
    const repeats = Math.max(1, Math.ceil(MIN_VISIBLE_CARDS / events.length));
    return Array.from({ length: repeats }, () => events).flat();
  }, [events]);

  const marqueeItems = useMemo(() => {
    if (baseSequence.length === 0) return [];
    return [...baseSequence, ...baseSequence];
  }, [baseSequence]);

  const baseLength = baseSequence.length;

  const durationSeconds = Math.max(baseLength * 4, 20);

  const startAnimation = useCallback(() => {
    if (prefersReducedMotion || baseLength === 0) return;
    controls.start({
      x: ["0%", "-50%"],
      transition: {
        repeat: Infinity,
        repeatType: "loop",
        duration: durationSeconds,
        ease: "linear",
      },
    });
  }, [controls, durationSeconds, prefersReducedMotion, baseLength]);

  useEffect(() => {
    startAnimation();
    return () => controls.stop();
  }, [controls, startAnimation]);

  if (baseLength === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden py-4">
      <motion.div
        className="flex w-max flex-nowrap gap-6"
        animate={controls}
        initial={false}
        style={prefersReducedMotion ? { x: 0 } : undefined}
      >
        {marqueeItems.map((event, index) => (
          <div key={`${event.id ?? event.eventName}-${index}`} className="w-[280px] flex-shrink-0 sm:w-[320px] lg:w-[360px]">
            <EventCard {...event} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
