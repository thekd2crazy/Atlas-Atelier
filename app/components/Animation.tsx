"use client";
import { useEffect, useRef } from "react";
import React from "react";

// ------------- Fade In -------------
export function FadeIn({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.style.opacity = "0";
        el.style.transition = "opacity 1s";

        requestAnimationFrame(() => {
            el.style.opacity = "1";
        });
    }, []);

    return <div ref={ref}>{children}</div>;
}


// ------------- Slide In -------------
export function SlideIn({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        element.style.opacity = "0";
        element.style.transform = "translateY(30px)";
        element.style.transition = "all 0.9s ease-out";

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        element.style.opacity = "1";
                        element.style.transform = "translateY(20px)";
                    }
                });
            },
            { threshold: 0.9 }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return <div ref={ref}>{children}</div>;
}


// ------------- Zoom In -------------
export function ZoomIn({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.style.opacity = "0";
        el.style.transform = "scale(0.6)";
        el.style.transition = "all .4s ease";

        requestAnimationFrame(() => {
            el.style.opacity = "1";
            el.style.transform = "scale(1)";
        });
    }, []);

    return <div ref={ref}>{children}</div>;
}


// ------------- Floating -------------
export function Floating({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ref.current?.animate(
            [
                { transform: "translateY(0px)" },
                { transform: "translateY(-12px)" },
                { transform: "translateY(0px)" }
            ],
            {
                duration: 3000,
                iterations: Infinity,
                easing: "ease-in-out",
            }
        );
    }, []);

    return <div ref={ref}>{children}</div>;
}


// ------------- Bounce -------------
export function Bounce({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ref.current?.animate(
            [
                { transform: "translateY(0)" },
                { transform: "translateY(-20px)" },
                { transform: "translateY(0)" }
            ],
            {
                duration: 600,
                iterations: Infinity,
                easing: "ease-in-out",
            }
        );
    }, []);

    return <div ref={ref}>{children}</div>;
}

type AnimatedUnderlineProps = {
    children: React.ReactNode;
    color?: string; // exemple : "bg-amber-500"
};

const AnimatedUnderline: React.FC<AnimatedUnderlineProps> = ({
    children,
    color = "bg-orange-500",
}) => {
    return (
        <span className="relative group cursor-pointer">
            <span>{children}</span>
            <span
                className={`absolute left-0 -bottom-0.5 w-0 h-[2px] ${color} transition-all duration-300 group-hover:w-full`}
            ></span>
        </span>
    );
};

export default AnimatedUnderline;