import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export default function MotionCarousel({ items, renderItem, autoPlayMs = 3500 }) {
  const trackRef = useRef(null)
  const [paused, setPaused] = useState(false)
  const dragState = useRef({ dragging: false, startX: 0, startScroll: 0 })

  useEffect(() => {
    if (paused || items.length <= 1) return
    const el = trackRef.current
    if (!el) return
    const id = setInterval(() => {
      if (!el) return
      const card = el.querySelector("[data-card]")
      const step = card ? card.offsetWidth + 16 : 280
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" })
    }, autoPlayMs)
    return () => clearInterval(id)
  }, [paused, items.length, autoPlayMs])

  const onPointerDown = (e) => {
    const el = trackRef.current
    if (!el) return
    dragState.current = { dragging: true, startX: e.clientX, startScroll: el.scrollLeft }
    setPaused(true)
  }
  const onPointerMove = (e) => {
    if (!dragState.current.dragging) return
    const el = trackRef.current
    if (!el) return
    el.scrollLeft = dragState.current.startScroll - (e.clientX - dragState.current.startX)
  }
  const endDrag = () => {
    dragState.current.dragging = false
    setTimeout(() => setPaused(false), 2500)
  }

  const scrollBy = (dir) => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector("[data-card]")
    const step = card ? card.offsetWidth + 16 : 280
    el.scrollBy({ left: dir * step, behavior: "smooth" })
    setPaused(true)
    setTimeout(() => setPaused(false), 2500)
  }

  if (!items || items.length === 0) return null

  return (
    <div className="relative group/carousel">
      <div
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { if (!dragState.current.dragging) setPaused(false) }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 2500)}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {items.map((item, i) => (
          <div key={item.id ?? i} data-card className="snap-start shrink-0 w-[78%] sm:w-[42%] md:w-[31%] select-none">
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <div className="hidden sm:flex justify-end gap-2 mt-4">
          <motion.button
            type="button" aria-label="Precedent" onClick={() => scrollBy(-1)}
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-inkdim hover:text-ink hover:border-tomato transition"
            whileHover={{ scale: 1.15, borderColor: "#C67B5C" }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.button>
          <motion.button
            type="button" aria-label="Suivant" onClick={() => scrollBy(1)}
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-inkdim hover:text-ink hover:border-tomato transition"
            whileHover={{ scale: 1.15, borderColor: "#C67B5C" }}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </motion.button>
        </div>
      )}
    </div>
  )
}
