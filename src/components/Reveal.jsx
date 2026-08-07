import { useEffect, useRef } from "react"

export default function Reveal({ children, delay = 0, className = "", as: Tag = "div", style }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.transitionDelay = `${delay}ms`
            el.classList.add("in", "in-view")
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </Tag>
  )
}
