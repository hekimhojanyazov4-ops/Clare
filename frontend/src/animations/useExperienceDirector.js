import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function useExperienceDirector(rootRef, motion) {
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

        const context = gsap.context(() => {
            const track = gsap.timeline({
                scrollTrigger: {
                    trigger: root,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.2,
                },
            });

            track
                .to(motion, { x: 0.82, y: 0.06, z: 5.6, rotateX: 0.22, rotateY: 0.4, rotateZ: 0.12, scale: 0.84, duration: 1 })
                .to(motion, { x: -0.72, y: -0.12, z: 6.4, rotateX: -0.16, rotateY: 1.35, rotateZ: -0.18, scale: 0.76, duration: 1 })
                .to(motion, { x: 0.74, y: 0.1, z: 5.1, rotateX: 0.26, rotateY: 2.15, rotateZ: 0.2, scale: 0.9, showcase: 0, duration: 1 })
                .to(motion, { x: -0.86, y: -0.08, z: 6.2, rotateX: -0.2, rotateY: 3.05, rotateZ: -0.13, scale: 0.78, showcase: 1, duration: 1 })
                .to(motion, { x: 0.12, y: 0.18, z: 5.25, rotateX: 0.12, rotateY: 4.05, rotateZ: 0.08, scale: 0.9, showcase: 0, duration: 1 });

            gsap.fromTo(".hero-copy > *", {
                y: 34,
                opacity: 0,
            }, {
                y: 0,
                opacity: 1,
                duration: 1.1,
                stagger: 0.12,
                ease: "power3.out",
                delay: 0.2,
            });

            gsap.utils.toArray(".reveal-up").forEach((element) => {
                gsap.fromTo(element, { y: 36, opacity: 0 }, {
                    y: 0,
                    opacity: 1,
                    duration: 0.9,
                    ease: "power3.out",
                    scrollTrigger: { trigger: element, start: "top 84%", once: true },
                });
            });

            gsap.utils.toArray(".reveal-line").forEach((element, index) => {
                gsap.fromTo(element, { yPercent: 110, opacity: 0 }, {
                    yPercent: 0,
                    opacity: 1,
                    duration: 1,
                    delay: index * 0.08,
                    ease: "power4.out",
                    scrollTrigger: { trigger: element, start: "top 86%", once: true },
                });
            });

            gsap.fromTo(".tech-card", { y: 38, opacity: 0 }, {
                y: 0,
                opacity: 1,
                stagger: 0.13,
                duration: 0.85,
                ease: "power3.out",
                scrollTrigger: { trigger: ".technology-grid", start: "top 82%", once: true },
            });
        }, root);

        return () => context.revert();
    }, [motion, rootRef]);
}