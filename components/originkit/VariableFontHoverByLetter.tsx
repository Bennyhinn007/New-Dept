// Weight Hover — Originkit
// Specification: Variable font weight hover by letter with spring stagger physics

import * as React from "react"
import { useEffect, useMemo, useRef } from "react"
const useIsStaticRenderer = () => false
import {
    motion,
    stagger,
    useAnimate,
    type AnimationOptions,
} from "framer-motion"

type StaggerFrom = "first" | "last" | "center" | "random"

export interface VariableFontHoverByLetterProps {
    label: string
    fromWeight?: number
    toWeight?: number
    staggerDuration?: number
    staggerFrom?: StaggerFrom
    fontSize?: number | string
    color?: string
    transition?: AnimationOptions
    onClick?: () => void
    style?: React.CSSProperties
    className?: string
}

const INTER_VARIABLE_FONT_FACE = `
@font-face {
    font-family: "InterVariableFramer";
    src: url("https://rsms.me/inter/font-files/InterVariable.woff2?v=4.0") format("woff2-variations");
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: "InterVariableFramer";
    src: url("https://rsms.me/inter/font-files/InterVariable-Italic.woff2?v=4.0") format("woff2-variations");
    font-weight: 100 900;
    font-style: italic;
    font-display: swap;
}
`

const VARIABLE_FONT_STACK =
    '"InterVariableFramer", "Inter Variable", "Inter", system-ui, sans-serif'

const COMPONENT_DEFAULTS = {
    label: "Department of CSE (IoT and Cybersecurity Including Blockchain Technology)",
    fromWeight: 500,
    toWeight: 900,
    fontSize: "clamp(1.5rem, 3.5vw, 2.75rem)",
    color: "#FBE9D0",
    staggerDuration: 30,
    staggerFrom: "random" as StaggerFrom,
    transition: {
        type: "spring",
        duration: 0.7,
        bounce: 0.2,
    },
}

export default function VariableFontHoverByLetter(props: VariableFontHoverByLetterProps) {
    const mergedProps = { ...COMPONENT_DEFAULTS, ...props }
    const {
        label,
        fromWeight,
        toWeight,
        staggerDuration,
        staggerFrom,
        fontSize,
        color,
        onClick,
        style,
        className,
    } = mergedProps

    const fromSettings = `'wght' ${fromWeight}`
    const toSettings = `'wght' ${toWeight}`

    const staggerSec = Math.max(0, staggerDuration) / 1000

    const isStatic = useIsStaticRenderer()
    const [scope, animate] = useAnimate()

    const shuffledIndices = useMemo(() => {
        if (staggerFrom !== "random") return null
        const len = label ? label.length : 0
        const indices = Array.from({ length: len }, (_, i) => i)
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[indices[i], indices[j]] = [indices[j], indices[i]]
        }
        return indices
    }, [label, staggerFrom])

    const transition: AnimationOptions = useMemo(() => {
        return (
            mergedProps.transition ??
            ({ type: "spring", duration: 0.7 } as AnimationOptions)
        )
    }, [mergedProps.transition])

    const mergeStagger = (base: AnimationOptions): AnimationOptions => {
        if (staggerFrom === "random" && shuffledIndices) {
            const indices = shuffledIndices
            return {
                ...base,
                delay: (i: number) => staggerSec * (indices[i] ?? 0),
            } as AnimationOptions
        }
        return {
            ...base,
            delay: stagger(staggerSec, { from: staggerFrom as any }),
        } as AnimationOptions
    }

    const debouncedHoverStartRef = useRef<(() => void) | null>(null)
    const debouncedHoverEndRef = useRef<(() => void) | null>(null)
    const timerRefs = useRef<{
        startTimer: ReturnType<typeof setTimeout> | null
        startTrailing: boolean
        endTimer: ReturnType<typeof setTimeout> | null
        endTrailing: boolean
    }>({
        startTimer: null,
        startTrailing: false,
        endTimer: null,
        endTrailing: false,
    })

    useEffect(() => {
        if (isStatic) return

        const runStart = () => {
            animate(
                ".letter",
                { fontVariationSettings: toSettings },
                mergeStagger(transition)
            )
        }

        const runEnd = () => {
            animate(
                ".letter",
                { fontVariationSettings: fromSettings },
                mergeStagger(transition)
            )
        }

        const wait = 100
        const t = timerRefs.current

        debouncedHoverStartRef.current = () => {
            if (!t.startTimer) {
                runStart()
                t.startTimer = setTimeout(() => {
                    if (t.startTrailing) runStart()
                    t.startTrailing = false
                    t.startTimer = null
                }, wait)
            } else {
                t.startTrailing = true
            }
        }

        debouncedHoverEndRef.current = () => {
            if (!t.endTimer) {
                runEnd()
                t.endTimer = setTimeout(() => {
                    if (t.endTrailing) runEnd()
                    t.endTrailing = false
                    t.endTimer = null
                }, wait)
            } else {
                t.endTrailing = true
            }
        }

        return () => {
            if (t.startTimer) clearTimeout(t.startTimer)
            if (t.endTimer) clearTimeout(t.endTimer)
            t.startTimer = null
            t.endTimer = null
            t.startTrailing = false
            t.endTrailing = false
        }
    }, [
        isStatic,
        fromSettings,
        toSettings,
        staggerSec,
        staggerFrom,
        shuffledIndices,
        transition,
        animate,
    ])

    const handleHoverStart = () => debouncedHoverStartRef.current?.()
    const handleHoverEnd = () => debouncedHoverEndRef.current?.()

    const srOnlyStyle: React.CSSProperties = {
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
        borderWidth: 0,
    }

    const innerSpanStyle: React.CSSProperties = {
        fontFamily: VARIABLE_FONT_STACK,
        fontSize,
        color,
        display: "inline-block",
        lineHeight: 1.25,
    }

    const letters = label ? label.split("") : []

    const interactive = !isStatic
    const handlers = !interactive
        ? {}
        : {
              onMouseEnter: handleHoverStart,
              onMouseLeave: handleHoverEnd,
              onTouchStart: handleHoverStart,
              onTouchEnd: handleHoverEnd,
              onClick,
          }

    return (
        <div
            className={`variable-font-hover-container ${className || ""}`}
            style={{
                width: "100%",
                display: "inline-flex",
                alignItems: "center",
                cursor: interactive
                    ? onClick
                        ? "pointer"
                        : "default"
                    : undefined,
                ...style,
            }}
            {...handlers}
        >
            <style>{INTER_VARIABLE_FONT_FACE}</style>
            {letters.length === 0 ? null : (
                <span ref={scope} style={innerSpanStyle}>
                    <span style={srOnlyStyle}>{label}</span>
                    {letters.map((letter, i) => (
                        <motion.span
                            key={i}
                            className="letter"
                            aria-hidden
                            style={{
                                display: "inline-block",
                                whiteSpace: "pre",
                                fontVariationSettings: fromSettings,
                            }}
                        >
                            {letter}
                        </motion.span>
                    ))}
                </span>
            )}
        </div>
    )
}

/**
 * Department Portal Pre-configured Exports
 */
export function DepartmentTitleHover(props?: Partial<VariableFontHoverByLetterProps>) {
    return (
        <VariableFontHoverByLetter
            label="Department of CSE (IoT and Cybersecurity Including Blockchain Technology)"
            fromWeight={600}
            toWeight={900}
            color="#FBE9D0"
            staggerDuration={25}
            staggerFrom="random"
            {...props}
        />
    )
}

export function CollegeSubtitleHover(props?: Partial<VariableFontHoverByLetterProps>) {
    return (
        <VariableFontHoverByLetter
            label="Guru Nanak Dev Engineering College, Bidar • NAAC A+ Standard • VTU & AICTE Approved"
            fromWeight={400}
            toWeight={800}
            color="#90AEAD"
            fontSize="clamp(0.9rem, 1.6vw, 1.15rem)"
            staggerDuration={18}
            staggerFrom="random"
            {...props}
        />
    )
}
