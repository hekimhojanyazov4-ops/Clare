import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Aperture, Cpu, Orbit, PackageOpen, ShoppingBag } from "lucide-react";

import ExperienceNav from "../components/ExperienceNav";
import CustomCursor from "../components/CustomCursor";
import ExperienceScene from "../scenes/ExperienceScene";
import useExperienceDirector from "../animations/useExperienceDirector";
import { addToCart, getCategories, getProducts } from "../api";
import { useNotifications } from "../context/NotificationContext";
import { resolveProductImage } from "../utils/productImage";

const features = [
    {
        number: "01",
        icon: Aperture,
        title: "Immersive 3D",
        text: "A living canvas, rendered in real time and shaped around your point of view.",
        spec: "LIGHT / FORM / SPACE",
    },
    {
        number: "02",
        icon: Orbit,
        title: "Real-time motion",
        text: "Every gesture becomes a quiet signal. Every transition has a sense of weight.",
        spec: "INPUT / RESPONSE / FLOW",
    },
    {
        number: "03",
        icon: Cpu,
        title: "Next-gen web",
        text: "The precision of the browser, opened up into something more human.",
        spec: "WEBGL / GPU / DETAIL",
    },
];

export default function CinematicExperience() {
    const rootRef = useRef(null);
    const pointer = useRef({ x: 0, y: 0 });
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [catalogState, setCatalogState] = useState("loading");
    const [activeProductIndex, setActiveProductIndex] = useState(0);
    const { error: showError, success: showSuccess } = useNotifications();
    const motion = useMemo(() => ({
        x: -0.48,
        y: 0.02,
        z: 7.9,
        rotateX: 0.03,
        rotateY: -0.38,
        rotateZ: -0.08,
        scale: 1,
        showcase: 0,
    }), []);
    const compact = typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    useExperienceDirector(rootRef, motion);

    useEffect(() => {
        let active = true;
        Promise.all([getProducts(), getCategories()])
            .then(([productData, categoryData]) => {
                if (!active) return;
                setProducts(Array.isArray(productData) ? productData : []);
                setCategories(Array.isArray(categoryData) ? categoryData : []);
                setCatalogState("ready");
            })
            .catch(() => {
                if (active) setCatalogState("error");
            });

        return () => { active = false; };
    }, []);

    const featuredProduct = products[activeProductIndex] || null;
    const featuredImage = resolveProductImage(featuredProduct);
    const hasDiscount = featuredProduct?.discount_price &&
        Number(featuredProduct.discount_price) < Number(featuredProduct.price);

    async function addFeaturedToCart() {
        if (!featuredProduct) return;
        try {
            await addToCart(featuredProduct.uuid, 1);
            showSuccess(`${featuredProduct.name} was added to your cart.`);
        } catch (error) {
            showError(error?.message || "Unable to add this product to your cart.");
        }
    }

    function updatePointer(event) {
        if (reducedMotion) return;
        pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.current.y = (0.5 - event.clientY / window.innerHeight) * 2;
    }

    return (
        <div className={`cinematic-experience${compact ? " is-compact" : ""}`} ref={rootRef} onPointerMove={updatePointer}>
            <div className="scene-wash" aria-hidden="true" />
            <div className="experience-canvas" aria-hidden="true">
                <Canvas
                    camera={{ position: [0, 0, 7.9], fov: 39, near: 0.1, far: 40 }}
                    dpr={compact ? [1, 1.2] : [1, 1.6]}
                    gl={{ antialias: !compact, alpha: false, powerPreference: "high-performance" }}
                    frameloop="always"
                >
                    <Suspense fallback={null}>
                        <ExperienceScene motion={{ current: motion }} pointer={pointer} compact={compact} reducedMotion={reducedMotion} />
                    </Suspense>
                </Canvas>
            </div>

            <ExperienceNav />
            <CustomCursor />

            <div className="scene-index" aria-hidden="true">
                <span>FIELD STUDY</span>
                <span>NO. 001 — 2026</span>
            </div>

            <section className="experience-section hero-section" id="top" aria-labelledby="hero-title">
                <div className="hero-copy">
                    <span className="eyebrow"><i /> DIGITAL WORLDS, REIMAGINED</span>
                    <h1 id="hero-title"><span>CREATE</span><span>THE</span><span>FUTURE<span className="period">.</span></span></h1>
                    <p className="hero-subtitle">A new dimension of the web.<br />Designed to be felt, not just seen.</p>
                    <a className="button-primary" href="#experience" data-cursor>
                        Enter experience <ArrowUpRight size={16} strokeWidth={1.6} />
                    </a>
                </div>
                <div className="hero-product reveal-up" aria-live="polite">
                    {catalogState === "loading" ? (
                        <div className="catalog-status">CONNECTING TO THE CATALOG</div>
                    ) : catalogState === "error" ? (
                        <div className="catalog-status">CATALOG TEMPORARILY UNAVAILABLE</div>
                    ) : featuredProduct ? (
                        <>
                            <div className="featured-art-frame">
                                <Link to={`/products/${featuredProduct.uuid}/`} aria-label={`View ${featuredProduct.name}`} data-cursor>
                                    {featuredImage ? (
                                        <img src={featuredImage} alt={featuredProduct.name} />
                                    ) : (
                                        <span className="featured-no-image"><PackageOpen size={29} /><span>IMAGE NOT AVAILABLE</span></span>
                                    )}
                                </Link>
                                <span className="featured-frame-index">LIVE / {String(activeProductIndex + 1).padStart(2, "0")}</span>
                                {products.length > 1 && (
                                    <div className="featured-switcher">
                                        <button type="button" aria-label="Previous product" onClick={() => setActiveProductIndex((activeProductIndex - 1 + products.length) % products.length)}><ArrowLeft size={14} /></button>
                                        <button type="button" aria-label="Next product" onClick={() => setActiveProductIndex((activeProductIndex + 1) % products.length)}><ArrowRight size={14} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="featured-product-meta">
                                <div>
                                    <span className="featured-category">{featuredProduct.category?.name || "Uncategorized"}</span>
                                    <Link className="featured-name" to={`/products/${featuredProduct.uuid}/`}>{featuredProduct.name}</Link>
                                    <span className="featured-price">
                                        {hasDiscount && <del>${Number(featuredProduct.price).toFixed(2)}</del>}
                                        ${Number(hasDiscount ? featuredProduct.discount_price : featuredProduct.price).toFixed(2)}
                                        {hasDiscount && <b>SALE</b>}
                                    </span>
                                </div>
                                <button className="featured-add" type="button" onClick={addFeaturedToCart} disabled={Number(featuredProduct.stock) <= 0} aria-label={`Add ${featuredProduct.name} to cart`} data-cursor>
                                    <ShoppingBag size={15} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="catalog-status">NO PRODUCTS ARE AVAILABLE</div>
                    )}
                </div>
                <a className="scroll-prompt" href="#experience" aria-label="Scroll to experience">
                    <span>SCROLL TO EXPLORE</span><span className="scroll-line" /><ArrowDown size={13} />
                </a>
                <div className="hero-side-note" aria-hidden="true">AN EXPERIMENT IN PRESENCE<br />AND PERCEPTION</div>
            </section>

            <section className="experience-section statement-section" id="experience" aria-labelledby="experience-title">
                <div className="section-label reveal-up"><span>01</span> THE EXPERIENCE</div>
                <div className="statement-copy">
                    <h2 id="experience-title">
                        <span className="line-mask"><span className="reveal-line">A new way</span></span>
                        <span className="line-mask"><span className="reveal-line">to <em>feel</em></span></span>
                        <span className="line-mask"><span className="reveal-line">the digital.</span></span>
                    </h2>
                    <p className="reveal-up">Move through a world that responds to you. A study in material, motion and the space between.</p>
                    <span className="orbit-caption">FORM STUDY 001 / CHROMATIC VOID</span>
                </div>
            </section>

            <section className="experience-section technology-section" id="technology" aria-labelledby="technology-title">
                <div className="technology-heading reveal-up">
                    <div className="section-label"><span>02</span> THE TECHNOLOGY</div>
                    <h2 id="technology-title">Built for <em>presence.</em></h2>
                    <p>Engineered with intent. Experienced in the moment.</p>
                </div>
                <div className="technology-grid">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <article className="tech-card" key={feature.number} data-cursor>
                                <div className="card-meta"><span>{feature.number} / 03</span><Icon size={19} strokeWidth={1.2} /></div>
                                <h3>{feature.title}</h3>
                                <p>{feature.text}</p>
                                <div className="card-bottom"><span>{feature.spec}</span><ArrowUpRight size={14} /></div>
                            </article>
                        );
                    })}
                </div>
                <div className="section-footnote">AETHER ENGINE / WEBGL EXPERIENCE / BUILD 001</div>
                <div className="category-index reveal-up" id="categories">
                    <span className="category-index-label">LIVE CATEGORIES</span>
                    {catalogState === "ready" && categories.length ? (
                        <div className="category-index-links">
                            {categories.filter((category) => category.uuid).map((category, index) => (
                                <Link key={category.uuid} to={`/products/?category=${encodeURIComponent(category.uuid)}`} data-cursor>
                                    <span>{String(index + 1).padStart(2, "0")}</span>{category.name}<ArrowUpRight size={13} />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p>{catalogState === "loading" ? "Loading categories..." : "No categories are available yet."}</p>
                    )}
                </div>
            </section>

            <section className="experience-section showcase-section" id="showcase" aria-labelledby="showcase-title">
                <div className="section-label reveal-up"><span>03</span> MATERIAL STUDY</div>
                <div className="showcase-copy">
                    <span className="eyebrow reveal-up">A LIVING OBJECT</span>
                    <h2 id="showcase-title">
                        <span className="line-mask"><span className="reveal-line">Nothing</span></span>
                        <span className="line-mask"><span className="reveal-line">stands <em>still.</em></span></span>
                    </h2>
                    <p className="reveal-up">A second form, shaped by light and the quiet pull of your attention.</p>
                    <a className="text-link reveal-up" href="#about" data-cursor>Explore the thinking <ArrowRight size={15} /></a>
                </div>
                <div className="showcase-coordinate" aria-hidden="true">X 04.81 / Y 09.22<br />MATERIAL / CHROME GLASS</div>
            </section>

            <section className="experience-section about-section" id="about" aria-labelledby="about-title">
                <div className="section-label reveal-up"><span>04</span> THE INTENTION</div>
                <div className="about-copy">
                    <h2 id="about-title">
                        <span className="line-mask"><span className="reveal-line">Technology,</span></span>
                        <span className="line-mask"><span className="reveal-line">with a <em>pulse.</em></span></span>
                    </h2>
                    <div className="about-detail reveal-up">
                        <span className="about-rule" />
                        <p>AETHER is an ongoing exploration of how the next web can make us feel more connected to what we see, and to the people we share it with.</p>
                        <span className="about-signature">A STUDY IN HUMAN / MACHINE</span>
                    </div>
                </div>
            </section>

            <section className="experience-section final-section" id="contact" aria-labelledby="final-title">
                <div className="final-orbit" aria-hidden="true"><span /><span /><span /></div>
                <div className="section-label reveal-up"><span>05</span> YOUR NEXT DIMENSION</div>
                <div className="final-copy">
                    <h2 id="final-title">
                        <span className="line-mask"><span className="reveal-line">Ready to</span></span>
                        <span className="line-mask"><span className="reveal-line">enter the</span></span>
                        <span className="line-mask"><span className="reveal-line">future<span className="period">?</span></span></span>
                    </h2>
                    <a className="button-primary button-large reveal-up" href="mailto:studio@aether.space" data-cursor>
                        Start experience <ArrowUpRight size={18} strokeWidth={1.5} />
                    </a>
                </div>
                <footer className="experience-footer">
                    <a href="#top" className="footer-brand">AETHER<span>/01</span></a>
                    <span>INDEPENDENT DIGITAL WORLDS</span>
                    <a href="mailto:studio@aether.space">LET'S MAKE SOMETHING MATTER <ArrowUpRight size={12} /></a>
                    <span>© 2026 AETHER STUDIO</span>
                </footer>
            </section>
        </div>
    );
}
