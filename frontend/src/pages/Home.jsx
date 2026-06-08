import { Link } from "react-router-dom";
import frog      from "../assets/frog.jpg";
import windrises from "../assets/windrises.jpg";

export default function Home() {
  const name = localStorage.getItem("loggedInName");

  return (
    <div className="home-page">
      <section className="hero">
        <img src={frog}      className="floating-frog"      alt="" />
        <img src={windrises} className="floating-windrises" alt="" />
        <p className="eyebrow">Your next movie night starts here</p>
        <h1>Welcome{name ? `, ${name}` : ""} to BlueMuse</h1>
        <p className="hero-text">
          Browse films, check showtimes, and book tickets — all in one place.
        </p>
        <div className="home-actions">
          <Link to="/movies">Browse Movies</Link>
          <Link to="/screenings">See Showtimes</Link>
        </div>
      </section>

      <section className="home-cards">
        <div className="home-card">
          <h3>🎬 Movies</h3>
          <p>See what's playing and get full details on every film.</p>
        </div>
        <div className="home-card">
          <h3>🎭 Showtimes</h3>
          <p>Search by title, date, or time to find the perfect screening.</p>
        </div>
        <div className="home-card">
          <h3>🪑 Theaters</h3>
          <p>Explore our screens — 3D, Dolby Sound, and standard options.</p>
        </div>
        <div className="home-card">
          <h3>🎁 Rewards</h3>
          <p>Earn a free ticket for every 10 movies you watch with us.</p>
        </div>
      </section>
    </div>
  );
}