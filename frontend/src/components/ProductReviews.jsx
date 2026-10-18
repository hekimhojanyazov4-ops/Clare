import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiEdit2, FiStar } from "react-icons/fi";

import {
    createProductReview,
    getProductReviews,
    updateProductReview,
} from "../api";
import { useNotifications } from "../context/NotificationContext";
import { useSitePreferences } from "../context/SitePreferencesContext";
import "./ProductReviews.css";

function readUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function RatingStars({ value, onChange, disabled = false, t }) {
    return (
        <div
            className={`review-stars${onChange ? " review-stars-input" : ""}`}
            role={onChange ? "radiogroup" : undefined}
            aria-label={onChange ? t("Choose a rating from 1 to 5 stars") : `${value} ${t("out of 5 stars")}`}
        >
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= value;
                const Icon = onChange ? "button" : "span";
                const props = onChange
                    ? {
                        type: "button",
                        role: "radio",
                        "aria-checked": value === star,
                        "aria-label": `${star} ${t(star === 1 ? "star" : "stars")}`,
                        disabled,
                        onClick: () => onChange(star),
                        onKeyDown: (event) => {
                            if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                                event.preventDefault();
                                onChange(Math.min(5, star + 1));
                            }
                            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                                event.preventDefault();
                                onChange(Math.max(1, star - 1));
                            }
                        },
                    }
                    : { "aria-hidden": true };

                return (
                    <Icon
                        {...props}
                        key={star}
                        className={`review-star${filled ? " is-filled" : ""}`}
                        style={{ "--star-index": star - 1 }}
                    >
                        <FiStar aria-hidden="true" />
                    </Icon>
                );
            })}
        </div>
    );
}

export default function ProductReviews({ productUuid }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const { error: showError, success: showSuccess } = useNotifications();
    const { t } = useSitePreferences();
    const user = readUser();
    const isAuthenticated = Boolean(localStorage.getItem("access_token"));

    const ownReview = reviews.find((review) => review.user_uuid === user?.uuid);
    const average = useMemo(() => {
        if (!reviews.length) return 0;
        return reviews.reduce((sum, review) => sum + Number(review.ratings), 0) / reviews.length;
    }, [reviews]);

    useEffect(() => {
        let cancelled = false;

        async function loadReviews() {
            setLoading(true);
            setLoadError("");
            try {
                const data = await getProductReviews(productUuid);
                if (!cancelled) setReviews(Array.isArray(data) ? data : []);
            } catch (requestError) {
                if (!cancelled) {
                    setLoadError(requestError?.message || "Unable to load reviews.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadReviews();
        return () => {
            cancelled = true;
        };
    }, [productUuid]);

    function startEditing() {
        setRating(Number(ownReview.ratings));
        setComment(ownReview.comment);
        setFormError("");
        setEditing(true);
    }

    function cancelEditing() {
        setEditing(false);
        setFormError("");
        setRating(0);
        setComment("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setFormError("");

        const cleanComment = comment.trim();
        if (!rating) {
            setFormError(t("Choose a star rating before submitting."));
            return;
        }
        if (!cleanComment) {
            setFormError(t("Write a comment before submitting."));
            return;
        }

        try {
            setSubmitting(true);
            if (ownReview && editing) {
                await updateProductReview(ownReview.uuid, {
                    ratings: rating,
                    comment: cleanComment,
                });
            } else {
                await createProductReview(productUuid, {
                    ratings: rating,
                    comment: cleanComment,
                });
            }

            const updatedReviews = await getProductReviews(productUuid);
            setReviews(Array.isArray(updatedReviews) ? updatedReviews : []);
            setRating(0);
            setComment("");
            setEditing(false);
            showSuccess(ownReview ? "Your review was updated." : "Your review was submitted.");
        } catch (requestError) {
            const message = requestError?.message || "Unable to save your review.";
            setFormError(message);
            showError(message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="product-reviews" aria-labelledby="reviews-title">
            <div className="reviews-heading">
                <div>
                    <p className="reviews-eyebrow">{t("CUSTOMER FEEDBACK")}</p>
                    <h2 id="reviews-title">{t("Reviews")}</h2>
                </div>
                {!loading && (
                    <div className="reviews-summary">
                        <RatingStars value={Math.round(average)} t={t} />
                        <strong>{average ? average.toFixed(1) : "—"}</strong>
                        <span>{reviews.length} {t(reviews.length === 1 ? "review" : "reviews")}</span>
                    </div>
                )}
            </div>

            {isAuthenticated ? (
                ownReview && !editing ? (
                    <div className="own-review-note">
                        <p>{t("You’ve already reviewed this product.")}</p>
                        <button type="button" onClick={startEditing}>
                            <FiEdit2 aria-hidden="true" />
                            {t("Edit your review")}
                        </button>
                    </div>
                ) : (
                    <form className="review-form" onSubmit={handleSubmit}>
                        <h3>{t(ownReview ? "Update your review" : "Write a review")}</h3>
                        <label className="review-rating-label">{t("Your rating")}</label>
                        <RatingStars
                            value={rating}
                            onChange={setRating}
                            disabled={submitting}
                            t={t}
                        />
                        <label htmlFor="review-comment">{t("Your comment")}</label>
                        <textarea
                            id="review-comment"
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            maxLength={2000}
                            rows={4}
                            placeholder={t("What did you think about this product?")}
                            disabled={submitting}
                            required
                        />
                        {formError && <p className="review-form-error" role="alert">{formError}</p>}
                        <div className="review-form-actions">
                            {ownReview && (
                                <button
                                    className="review-cancel"
                                    type="button"
                                    onClick={cancelEditing}
                                    disabled={submitting}
                                >
                                    {t("Cancel")}
                                </button>
                            )}
                            <button className="review-submit" type="submit" disabled={submitting}>
                                {submitting ? t("Saving...") : ownReview ? t("Save changes") : t("Submit review")}
                            </button>
                        </div>
                    </form>
                )
            ) : (
                <p className="review-signin">
                    <Link to="/login/">{t("Sign in")}</Link> {t("to write a review.")}
                </p>
            )}

            <div className="reviews-list" aria-live="polite">
                {loading ? (
                    <p className="reviews-state">{t("Loading reviews...")}</p>
                ) : loadError ? (
                    <p className="reviews-state reviews-state-error" role="alert">{loadError}</p>
                ) : reviews.length ? (
                    reviews.map((review) => (
                        <article className="review-item" key={review.uuid}>
                            <div className="review-item-heading">
                                <div>
                                    <h3>{review.user_name || "Customer"}</h3>
                                    <time dateTime={review.created_at}>
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </time>
                                </div>
                                <RatingStars value={Number(review.ratings)} t={t} />
                            </div>
                            <p>{review.comment}</p>
                        </article>
                    ))
                ) : (
                    <p className="reviews-state">{t("No reviews yet. Be the first to share your experience.")}</p>
                )}
            </div>
        </section>
    );
}
