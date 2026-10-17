import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

const links = [
    ["Home", "top"],
    ["Experience", "experience"],
    ["Technology", "technology"],
    ["About", "about"],
    ["Contact", "contact"],
];

export default function ExperienceNav() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 48);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav className={`experience-nav${scrolled ? " is-scrolled" : ""}`} aria-label="Main navigation">
            <a className="experience-brand" href="#top" aria-label="Aether home">
                <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
                <span>AETHER<span className="brand-index">/01</span></span>
            </a>
            <div className="nav-links">
                {links.map(([label, id]) => (
                    <a key={id} href={`#${id}`}>{label}</a>
                ))}
            </div>
            <a className="nav-enter" href="#experience" data-cursor>
                Enter <ArrowUpRight size={14} strokeWidth={1.7} />
            </a>
            <a className="nav-mobile-enter" href="#experience" aria-label="Enter experience" data-cursor>
                <ArrowUpRight size={16} />
            </a>
        </nav>
    );
}