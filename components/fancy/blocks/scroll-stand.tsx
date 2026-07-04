"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { exampleImages } from "@/utils/demo-images"

import "./scroll-stand.css"

const WORD_PINK = "#F22A72"
const WORD_DARK = "#57524f"

const CARD_START = [
  { rotateX: 58, rotateY: 18, y: 48 },
  { rotateX: 74, rotateY: 5, y: 32 },
  { rotateX: 90, rotateY: 0, y: 18 },
  { rotateX: 74, rotateY: -5, y: 32 },
  { rotateX: 58, rotateY: -18, y: 48 },
] as const

const STANDS = [
  {
    heading: "Websites & Landing pages",
    sub: "Creating high-end and beautiful websites built to perform and convert.",
    images: [0, 1, 2, 3, 4],
  },
  {
    heading: "Brand & Identity",
    sub: "Visual systems that feel intentional, memorable, and unmistakably yours.",
    images: [5, 6, 7, 0, 1],
  },
  {
    heading: "Product & UI",
    sub: "Interfaces crafted with clarity — every screen considered, every interaction refined.",
    images: [2, 3, 4, 5, 6],
  },
] as const

type ScrollStandProps = {
  scrollerRef: React.RefObject<HTMLElement | null>
}

const ScrollStand = ({ scrollerRef }: ScrollStandProps) => {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    const root = rootRef.current
    if (!scroller || !root) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (reducedMotion) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const sections = root.querySelectorAll<HTMLElement>(".scroll-stand-stand")

      sections.forEach((section) => {
        const cards = section.querySelectorAll<HTMLElement>(".scroll-stand-card")
        const cardsWrap = section.querySelector<HTMLElement>(
          ".scroll-stand-cards-wrap",
        )
        const copy = section.querySelector<HTMLElement>(".scroll-stand-copy")
        const words = section.querySelectorAll<HTMLElement>(".scroll-stand-word")

        cards.forEach((card, i) => {
          gsap.set(card, {
            ...CARD_START[i],
            transformOrigin: "50% 100%",
            transformPerspective: 1560,
          })
        })

        if (copy) gsap.set(copy, { y: -10 })
        if (cardsWrap) gsap.set(cardsWrap, { marginTop: "2.5rem" })
        gsap.set(words, { color: WORD_PINK })

        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              scroller,
              start: "top 40%",
              end: "top 0%",
              scrub: 1,
              invalidateOnRefresh: true,
            },
          })
          .to(
            cards,
            {
              rotateX: 0,
              rotateY: 0,
              y: 0,
              ease: "power1.inOut",
              duration: 1,
            },
            0,
          )
          .to(copy, { y: 0 }, 0)
          .to(words, { color: WORD_DARK, stagger: 0.2 }, 0.1)
      })
    }, root)

    const onScroll = () => ScrollTrigger.update()
    scroller.addEventListener("scroll", onScroll, { passive: true })

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("load", refresh)
    window.addEventListener("resize", refresh)
    refresh()

    return () => {
      scroller.removeEventListener("scroll", onScroll)
      window.removeEventListener("load", refresh)
      window.removeEventListener("resize", refresh)
      ctx.revert()
    }
  }, [scrollerRef])

  return (
    <section ref={rootRef} className="scroll-stand" aria-label="Work showcase">
      {STANDS.map((stand, index) => (
        <article
          key={stand.heading}
          className={
            index === STANDS.length - 1
              ? "scroll-stand-stand scroll-stand-stand-last"
              : "scroll-stand-stand"
          }
        >
          <div className="scroll-stand-inner">
            <div className="scroll-stand-copy">
              <h2 className="scroll-stand-heading">
                {stand.heading.split(" ").map((word, i) => (
                  <span key={i} className="scroll-stand-word">
                    {word}{" "}
                  </span>
                ))}
              </h2>
              <p className="scroll-stand-sub">{stand.sub}</p>
            </div>
            <div className="scroll-stand-cards-wrap">
              <div className="scroll-stand-cards-stage">
                {stand.images.map((imageIndex, i) => (
                  <article key={i} className="scroll-stand-card">
                    <img
                      src={exampleImages[imageIndex].url}
                      alt={exampleImages[imageIndex].title}
                      draggable={false}
                    />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

export default ScrollStand
