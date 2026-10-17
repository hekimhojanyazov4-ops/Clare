import { useEffect } from "react";
import gsap from "gsap";

export default function CustomCursor() {
    useEffect(() => {
        if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

        const cursor = document.querySelector(".custom-cursor");
        const dot = cursor?.querySelector(".cursor-dot");
        if (!cursor || !dot) return undefined;

        const moveX = gsap.quickTo(cursor, "x", { duration: 0.38, ease: "power3.out" });
        const moveY = gsap.quickTo(cursor, "y", { duration: 0.38, ease: "power3.out" });
        const showCursor = () => cursor.classList.add("is-visible");
        const hideCursor = () => cursor.classList.remove("is-visible");
        const handleMove = (event) => {
            moveX(event.clientX);
            moveY(event.clientY);
            showCursor();
        };
        const handleEnter = () => cursor.classList.add("is-active");
        const handleLeave = () => cursor.classList.remove("is-active");
        const interactive = document.querySelectorAll("a, button, [data-cursor]");

        window.addEventListener("pointermove", handleMove, { passive: true });
        window.addEventListener("pointerleave", hideCursor);
        interactive.forEach((element) => {
            element.addEventListener("pointerenter", handleEnter);
            element.addEventListener("pointerleave", handleLeave);
        });

        return () => {
            window.removeEventListener("pointermove", handleMove);
            window.removeEventListener("pointerleave", hideCursor);
            interactive.forEach((element) => {
                element.removeEventListener("pointerenter", handleEnter);
                element.removeEventListener("pointerleave", handleLeave);
            });
            gsap.killTweensOf(cursor);
            gsap.killTweensOf(dot);
        };
    }, []);

    return <div className="custom-cursor" aria-hidden="true"><span className="cursor-dot" /></div>;
}