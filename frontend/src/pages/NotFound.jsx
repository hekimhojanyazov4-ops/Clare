import { Link } from "react-router-dom";
import "./CustomerPages.css";

const NotFound = () => (
    <section className="customer-page not-found-page">
        <div className="not-found-content">
            <span>404</span>
            <h1>Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <Link to="/home/">Back to Clare</Link>
        </div>
    </section>
);

export default NotFound;
