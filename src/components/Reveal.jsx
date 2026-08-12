import { motion } from "framer-motion"

// Presets de variation pour des effets differents selon le contexte
const VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 }
  },
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 }
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  },
  fadeRight: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" }
  }
}

export default function Reveal({ children, delay = 0, className = "", as: Tag = "div", variant = "fadeUp", once = true }) {
  const v = VARIANTS[variant] || VARIANTS.fadeUp

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.15, margin: "-40px" }}
      variants={v}
      transition={{
        duration: 0.7,
        delay: delay / 1000,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={className}
      style={{ willChange: "opacity, transform, filter" }}
    >
      {children}
    </motion.div>
  )
}
