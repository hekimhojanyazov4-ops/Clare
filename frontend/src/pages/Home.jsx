import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    FiChevronLeft,
    FiChevronRight,
    FiCreditCard,
    FiPause,
    FiPlay,
    FiRotateCcw,
    FiTruck,
} from "react-icons/fi";

import { getProducts } from "../api";
import { resolveProductImage } from "../utils/productImage";
import HERO_IMAGE from "../assets/clare-fashion-hero.jpg";
import "./Home.css";

/* ------------------------------------------------------------------
   Content
   Only one image asset exists today, so slides and tiles reuse
   HERO_IMAGE with different crops and shapes. Swap the `image` fields
   for your own photos whenever you have them.
------------------------------------------------------------------ */

const SLIDE_DURATION = 6500;

const HERO_SLIDES = [
    {
        id: "coat",
        theme: "blush",
        shape: "rect",
        label: "New season collection",
        lines: ["The Purl Coat", "Cardigan"],
        description:
            "Discover timeless style and effortless comfort with our latest fashion collection.",
        cta: "Shop now",
        to: "/products/",
        image: HERO_IMAGE,
        position: "center 36%",
        alt: "Model wearing the Purl Coat Cardigan",
    },
    {
        id: "edit",
        theme: "dark",
        shape: "arch",
        label: "The autumn edit",
        lines: ["Dress the", "part."],
        outlineLine: 1,
        description:
            "Layered textures, warm neutrals and silhouettes that move from desk to dinner.",
        cta: "Explore the edit",
        to: "/products/",
        image: HERO_IMAGE,
        position: "center 18%",
        alt: "Model in layered autumn knitwear",
    },
    {
        id: "sale",
        theme: "cream",
        shape: "circle",
        label: "Limited time",
        lines: ["Up to 40% off", "your essentials"],
        description:
            "Our most-loved basics at their best prices. Offer ends when stock runs out.",
        cta: "Shop the sale",
        to: "/products/",
        image: HERO_IMAGE,
        position: "center 58%",
        alt: "Model wearing a seasonal essential",
    },
];

const MARQUEE_ITEMS = [
    "Free shipping over $100",
    "New arrivals every week",
    "30-day easy returns",
    "Secure online payment",
    "Made to last",
];

const BENEFITS = [
    { title: "Free Shipping", description: "When ordering over $100", Icon: FiTruck },
    { title: "Easy Returns", description: "Get a return within 30 days", Icon: FiRotateCcw },
    { title: "Secure Payment", description: "100% secure online payment", Icon: FiCreditCard },
];

const CATEGORIES = [
    { name: "Women", note: "New season knitwear and outerwear", tone: "photo" },
    { name: "Men", note: "Tailored everyday basics", tone: "sand" },
    { name: "Accessories", note: "The finishing touches", tone: "ink" },
    { name: "Sale", note: "Up to 40% off selected styles", tone: "amber" },
];

const STATS = [
    { end: 120, suffix: "K+", label: "Customers dressed since 2019" },
    { end: 98, suffix: "%", label: "Say they would order again" },
    { end: 40, suffix: "+", label: "Countries we ship to" },
];

const TESTIMONIALS = [
    {
        quote: "The cardigan fits like it was made for me, and the wool still looks new after a full winter.",
        name: "Amelia R.",
        detail: "Bought the Purl Coat Cardigan",
    },
    {
        quote: "My order arrived in two days and the return process took one email. That is rare.",
        name: "Daniel K.",
        detail: "Verified buyer",
    },
    {
        quote: "Finally a shop where the photos match the real colors. I have reordered three times.",
        name: "Sofia M.",
        detail: "Repeat customer",
    },
];

/* ------------------------------------------------------------------
   Scroll reveal (vanilla IntersectionObserver)

   Any element with data-reveal="left | right | bottom" starts hidden and
   tilted in 3D (see Home.css). When it scrolls into view the observer adds
   `.is-revealed` and it animates into place. After the animation the
   data-reveal attribute is removed, so the element goes back to its normal
   styles (hover effects, transitions) untouched.
------------------------------------------------------------------ */

const REVEAL_CYCLE = ["left", "bottom", "right"];

const TILE_REVEAL = [
    ["left", 0],
    ["right", 120],
    ["right", 240],
    ["bottom", 120],
];

// Spread onto any element: <div {...rv("left", 150)}>
const rv = (direction, delay = 0) => ({
    "data-reveal": direction,
    style: { "--rd": `${delay}ms` },
});

const canReveal = () =>
    typeof window !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useScrollReveal(rootRef, enabled) {
    useEffect(() => {
        const root = rootRef.current;
        if (!root || !enabled) return undefined;

        const timers = new Set();
        const seen = new WeakSet();

        const finish = (el) => {
            el.removeAttribute("data-reveal");
            el.classList.remove("is-revealed");
            el.style.removeProperty("--rd");
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const el = entry.target;
                    observer.unobserve(el);
                    el.classList.add("is-revealed");

                    const delay = parseFloat(el.style.getPropertyValue("--rd")) || 0;
                    const timer = setTimeout(() => finish(el), delay + 1200);
                    timers.add(timer);
                });
            },
            { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
        );

        const watch = (node) => {
            if (node.nodeType !== 1) return;

            if (node.matches("[data-reveal]") && !seen.has(node)) {
                seen.add(node);
                observer.observe(node);
            }

            node.querySelectorAll("[data-reveal]").forEach((child) => {
                if (seen.has(child)) return;
                seen.add(child);
                observer.observe(child);
            });
        };

        watch(root);

        // Catch elements rendered later (e.g. products loaded from the API)
        const mutations = new MutationObserver((list) => {
            list.forEach((m) => m.addedNodes.forEach(watch));
        });
        mutations.observe(root, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutations.disconnect();
            timers.forEach(clearTimeout);
        };
    }, [rootRef, enabled]);
}

/* ------------------------------------------------------------------
   Small helpers
------------------------------------------------------------------ */

const formatPrice = (value) => `$${Number(value).toFixed(2)}`;

const CountUp = ({ end, suffix = "", duration = 1800 }) => {
    const ref = useRef(null);
    const [value, setValue] = useState(0);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion || !("IntersectionObserver" in window)) {
            setValue(end);
            return undefined;
        }

        let frame;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            const start = performance.now();
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                setValue(Math.round(end * (1 - Math.pow(1 - progress, 3))));
                if (progress < 1) frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        }, { threshold: 0.5 });

        observer.observe(node);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [end, duration]);

    return <span ref={ref}>{value}{suffix}</span>;
};

/* ------------------------------------------------------------------
   Hero carousel
------------------------------------------------------------------ */

const HeroCarousel = () => {
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [engaged, setEngaged] = useState(false); // hover or keyboard focus inside
    const total = HERO_SLIDES.length;
    const running = !paused && !engaged;

    const goNext = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
    const goPrev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);

    return (
        <section
            className="hero-carousel"
            data-theme={HERO_SLIDES[index].theme}
            aria-roledescription="carousel"
            aria-label="Featured collections"
            onMouseEnter={() => setEngaged(true)}
            onMouseLeave={() => setEngaged(false)}
            onFocus={() => setEngaged(true)}
            onBlur={() => setEngaged(false)}
        >
            <div className="hero-track" aria-live={running ? "off" : "polite"}>
                {HERO_SLIDES.map((slide, i) => {
                    const active = i === index;
                    return (
                        <article
                            key={slide.id}
                            className={`hero-slide${active ? " is-active" : ""}`}
                            data-theme={slide.theme}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`${i + 1} of ${total}`}
                            aria-hidden={!active}
                        >
                            <div className="hero-copy">
                                <p className="hero-label rise" style={{ "--d": "100ms" }}>
                                    {slide.label}
                                </p>

                                {i === 0 ? (
                                    <h1 className="hero-title">{renderLines(slide)}</h1>
                                ) : (
                                    <h2 className="hero-title">{renderLines(slide)}</h2>
                                )}

                                <p className="hero-description rise" style={{ "--d": "650ms" }}>
                                    {slide.description}
                                </p>

                                <Link
                                    to={slide.to}
                                    className="hero-cta rise"
                                    style={{ "--d": "800ms" }}
                                    tabIndex={active ? 0 : -1}
                                >
                                    {slide.cta}
                                </Link>
                            </div>

                            <div className="hero-visual" data-shape={slide.shape}>
                                <div className="hero-frame">
                                    <img
                                        className="hero-image"
                                        src={slide.image}
                                        alt={slide.alt}
                                        style={{ objectPosition: slide.position }}
                                        fetchPriority={i === 0 ? "high" : "auto"}
                                        loading={i === 0 ? "eager" : "lazy"}
                                    />
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="hero-controls">
                <div className="hero-indicators">
                    {HERO_SLIDES.map((slide, i) => (
                        <button
                            key={slide.id}
                            type="button"
                            className={`hero-indicator${i === index ? " is-active" : ""}`}
                            onClick={() => setIndex(i)}
                            aria-label={`Show slide ${i + 1}: ${slide.label}`}
                            aria-current={i === index}
                        >
                            <span className="hero-indicator-track">
                                <span
                                    key={i === index ? `on-${index}` : `off-${i}`}
                                    className="hero-indicator-fill"
                                    style={{
                                        animationDuration: `${SLIDE_DURATION}ms`,
                                        animationPlayState: running ? "running" : "paused",
                                    }}
                                    onAnimationEnd={i === index ? goNext : undefined}
                                />
                            </span>
                        </button>
                    ))}
                </div>

                <div className="hero-buttons">
                    <span className="hero-counter" aria-hidden="true">
                        {index + 1} / {total}
                    </span>
                    <button type="button" onClick={goPrev} aria-label="Previous slide">
                        <FiChevronLeft aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaused((p) => !p)}
                        aria-label={paused ? "Play slideshow" : "Pause slideshow"}
                    >
                        {paused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
                    </button>
                    <button type="button" onClick={goNext} aria-label="Next slide">
                        <FiChevronRight aria-hidden="true" />
                    </button>
                </div>
            </div>
        </section>
    );
};

function renderLines(slide) {
    return slide.lines.map((line, n) => (
        <span className="line" key={line}>
            <span
                className={slide.outlineLine === n ? "outline" : undefined}
                style={{ "--i": n }}
            >
                {line}
            </span>
        </span>
    ));
}

/* ------------------------------------------------------------------
   Marquee
------------------------------------------------------------------ */

const Marquee = () => (
    <section className="marquee" aria-label="Store highlights">
        <div className="marquee-track">
            {[0, 1].map((copy) => (
                <ul className="marquee-group" key={copy} aria-hidden={copy === 1}>
                    {MARQUEE_ITEMS.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ))}
        </div>
    </section>
);

/* ------------------------------------------------------------------
   Category banners
------------------------------------------------------------------ */

const CategoryBanners = () => (
    <section className="home-section" aria-labelledby="categories-title">
        <div className="section-head">
            <h2 id="categories-title" {...rv("left")}>Shop by category</h2>
            <Link to="/products/" className="text-link" {...rv("right", 150)}>
                View all products
            </Link>
        </div>

        <div className="cat-grid">
            {CATEGORIES.map(({ name, note, tone }, i) => {
                const [direction, delay] = TILE_REVEAL[i % TILE_REVEAL.length];

                return (
                    <Link
                        key={name}
                        to={`/products/?search=${encodeURIComponent(name)}`}
                        className={`cat-tile cat-${tone}`}
                        {...rv(direction, delay)}
                    >
                        {tone === "photo" && (
                            <img className="cat-photo" src={HERO_IMAGE} alt="" loading="lazy" />
                        )}
                        <span className="cat-watermark" aria-hidden="true">{name}</span>
                        <span className="cat-copy">
                            <strong>{name}</strong>
                            <span>{note}</span>
                        </span>
                    </Link>
                );
            })}
        </div>
    </section>
);

/* ------------------------------------------------------------------
   Product carousel (live data)
------------------------------------------------------------------ */

const ProductCarousel = () => {
    const trackRef = useRef(null);
    const [products, setProducts] = useState([]);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        let active = true;
        getProducts()
            .then((data) => {
                if (!active) return;
                const list = Array.isArray(data) ? data : data?.results || [];
                setProducts(list.slice(0, 12));
                setStatus("ready");
            })
            .catch(() => active && setStatus("error"));
        return () => {
            active = false;
        };
    }, []);

    const scrollTrack = (direction) => {
        const track = trackRef.current;
        if (!track) return;
        const card = track.querySelector(".product-card");
        const step = card ? card.offsetWidth + 18 : 280;
        track.scrollBy({ left: direction * step * 2, behavior: "smooth" });
    };

    // Hide the whole section if products can't load or none exist
    if (status === "error" || (status === "ready" && !products.length)) return null;

    return (
        <section className="home-section" aria-labelledby="products-title">
            <div className="section-head">
                <h2 id="products-title" {...rv("left")}>New arrivals</h2>
                <div className="rail-buttons" {...rv("right", 150)}>
                    <button type="button" onClick={() => scrollTrack(-1)} aria-label="Scroll products left">
                        <FiChevronLeft aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => scrollTrack(1)} aria-label="Scroll products right">
                        <FiChevronRight aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div className="product-track" ref={trackRef} tabIndex={0} aria-label="New arrivals list">
                {status === "loading"
                    ? Array.from({ length: 5 }, (_, n) => (
                        <div className="product-card is-skeleton" key={n} aria-hidden="true">
                            <div className="product-thumb" />
                            <span />
                            <span />
                        </div>
                    ))
                    : products.map((product, n) => {
                        const price = Number(product.price);
                        const sale = Number(product.discount_price);
                        const onSale = sale > 0 && sale < price;
                        const percent = onSale ? Math.round((1 - sale / price) * 100) : 0;

                        return (
                            <Link
                                key={product.uuid}
                                className="product-card"
                                to={`/products/?search=${encodeURIComponent(product.name)}`}
                                {...rv("bottom", Math.min(n, 5) * 90)}
                            >
                                <div className="product-thumb">
                                    <img src={resolveProductImage(product)} alt={product.name} loading="lazy" />
                                    {onSale && <span className="product-badge">-{percent}%</span>}
                                </div>
                                <h3>{product.name}</h3>
                                <p>
                                    <strong>{formatPrice(onSale ? sale : price)}</strong>
                                    {onSale && <s>{formatPrice(price)}</s>}
                                </p>
                            </Link>
                        );
                    })}
            </div>
        </section>
    );
};

/* ------------------------------------------------------------------
   Editorial banner with animated stats
------------------------------------------------------------------ */

const Editorial = () => (
    <section className="editorial" aria-labelledby="editorial-title">
        <div className="editorial-top">
            <h2 id="editorial-title" {...rv("left")}>
                <span>Designed</span>
                <span>to be</span>
                <span className="outline">worn.</span>
            </h2>
            <div className="editorial-side" {...rv("right", 150)}>
                <p>
                    Every piece starts with fabric we would want to wear ourselves. Natural fibres, honest
                    construction and cuts that stay in your wardrobe for years, not weeks.
                </p>
                <Link to="/products/" className="hero-cta">Browse the collection</Link>
            </div>
        </div>

        <dl className="editorial-stats">
            {STATS.map(({ end, suffix, label }, i) => (
                <div key={label} {...rv(REVEAL_CYCLE[i % REVEAL_CYCLE.length], i * 120)}>
                    <dt><CountUp end={end} suffix={suffix} /></dt>
                    <dd>{label}</dd>
                </div>
            ))}
        </dl>
    </section>
);

/* ------------------------------------------------------------------
   Testimonials carousel
------------------------------------------------------------------ */

const Testimonials = () => {
    const [index, setIndex] = useState(0);
    const [engaged, setEngaged] = useState(false);

    useEffect(() => {
        if (engaged) return undefined;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
        const timer = setTimeout(() => setIndex((i) => (i + 1) % TESTIMONIALS.length), 7000);
        return () => clearTimeout(timer);
    }, [index, engaged]);

    return (
        <section
            className="testimonials"
            aria-roledescription="carousel"
            aria-label="Customer reviews"
            onMouseEnter={() => setEngaged(true)}
            onMouseLeave={() => setEngaged(false)}
            onFocus={() => setEngaged(true)}
            onBlur={() => setEngaged(false)}
            {...rv("bottom")}
        >
            <div className="testimonial-stage">
                {TESTIMONIALS.map((item, i) => (
                    <figure
                        key={item.name}
                        className={`testimonial${i === index ? " is-active" : ""}`}
                        aria-hidden={i !== index}
                    >
                        <blockquote>{item.quote}</blockquote>
                        <figcaption>
                            <strong>{item.name}</strong>
                            <span>{item.detail}</span>
                        </figcaption>
                    </figure>
                ))}
            </div>

            <div className="testimonial-dots">
                {TESTIMONIALS.map((item, i) => (
                    <button
                        key={item.name}
                        type="button"
                        className={i === index ? "is-active" : undefined}
                        onClick={() => setIndex(i)}
                        aria-label={`Show review from ${item.name}`}
                        aria-current={i === index}
                    />
                ))}
            </div>
        </section>
    );
};

/* ------------------------------------------------------------------
   Newsletter banner
   Note: not connected to a backend yet. It only shows a confirmation.
------------------------------------------------------------------ */

const Newsletter = () => {
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!email.trim()) return;
        setDone(true);
    };

    return (
        <section className="newsletter" aria-labelledby="newsletter-title">
            <div className="newsletter-inner">
                <h2 id="newsletter-title" {...rv("left")}>Get 10% off your first order</h2>
                <p {...rv("left", 120)}>
                    Join the list for early access to new collections. One email a week, unsubscribe any time.
                </p>

                {done ? (
                    <p className="newsletter-done" role="status" {...rv("bottom")}>
                        Thanks. Check your inbox to confirm your email address.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} {...rv("bottom", 240)}>
                        <label className="visually-hidden" htmlFor="newsletter-email">Email address</label>
                        <input
                            id="newsletter-email"
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                        />
                        <button type="submit">Sign me up</button>
                    </form>
                )}
            </div>
        </section>
    );
};

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------ */

const Home = () => {
    const rootRef = useRef(null);

    // Hidden start state only applies when the observer can actually run,
    // so content is never stuck invisible.
    const [reveal] = useState(canReveal);
    useScrollReveal(rootRef, reveal);

    return (
        <main ref={rootRef} className={`home-page${reveal ? " reveal-ready" : ""}`}>
            <HeroCarousel />
            <Marquee />

            <section className="benefits" aria-label="Store benefits">
                <div className="benefits-inner">
                    {BENEFITS.map(({ title, description, Icon }, i) => (
                        <article
                            className="benefit-item"
                            key={title}
                            {...rv(REVEAL_CYCLE[i % REVEAL_CYCLE.length], i * 120)}
                        >
                            <Icon className="benefit-icon" aria-hidden="true" />
                            <div className="benefit-copy">
                                <h2>{title}</h2>
                                <p>{description}</p>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            <CategoryBanners />
            <ProductCarousel />
            <Editorial />
            <Testimonials />
            <Newsletter />
        </main>
    );
};

export default Home;