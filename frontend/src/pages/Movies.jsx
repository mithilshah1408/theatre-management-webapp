import { useEffect, useState } from "react";
import { getMovies } from "../api";

import bpImg      from "../assets/black_panther.png";
import heronImg   from "../assets/boy_heron.png";
import gotgImg    from "../assets/gotg3.jpg";
import duneImg    from "../assets/dune2.jpg";
import howlImg    from "../assets/howls.png";
import totoroImg  from "../assets/totoro.png";
import mononokeImg from "../assets/mononoke.png";
import spiderImg  from "../assets/spider-man.png";

const POSTERS = {
  "Black Panther":                   bpImg,
  "The Boy and the Heron":           heronImg,
  "Guardians of the Galaxy Vol. 3":  gotgImg,
  "Dune: Part Two":                  duneImg,
  "Howl's Moving Castle":            howlImg,
  "My Neighbor Totoro":              totoroImg,
  "Princess Mononoke":               mononokeImg,
  "Spider-Man: No Way Home":         spiderImg,
};

const FALLBACK = "https://placehold.co/300x450?text=No+Poster";

function InfoRow({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <>
      <span className="info-label">{label}</span>
      <span style={{ color: "#3e6784", fontSize: "0.9rem" }}>
        {Array.isArray(value) ? value.join(", ") : value}
      </span>
    </>
  );
}

export default function Movies() {
  const [movies,   setMovies]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getMovies()
      .then(d => { setMovies(d); setSelected(d[0] ?? null); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="movies-page">
      <div className="page">
        <div className="page-header">
          <p className="eyebrow">Now Playing</p>
          <h1>Movies</h1>
          <p>Click a poster to see full details.</p>
        </div>

        {loading && <p className="loading-text">Loading movies…</p>}

        {!loading && (
          <>
            {/* horizontal poster strip */}
            <div className="poster-track">
              {movies.map(m => (
                <div
                  key={m.title}
                  className={`poster-card ${selected?.title === m.title ? "poster-card--active" : ""}`}
                  onClick={() => setSelected(m)}
                >
                  <img src={POSTERS[m.title] ?? FALLBACK} alt={m.title} className="poster-img" />
                  <p className="poster-title">{m.title}</p>
                </div>
              ))}
            </div>

            {/* detail panel */}
            {selected && (
              <div className="movie-info-panel">
                <h2>{selected.title}</h2>
                <div className="movie-info-grid">
                  <InfoRow label="Release"  value={selected.release_date} />
                  <InfoRow label="Runtime"  value={`${selected.runtime} min`} />
                  <InfoRow label="Language" value={selected.original_language} />
                  <InfoRow label="Studio"   value={selected.major_studio ? "Major Studio" : "Independent"} />
                  <InfoRow label="Available in" value={selected.languages} />
                  <InfoRow label="Directed by"  value={selected.directors} />
                  <InfoRow label="Written by"   value={selected.writers} />
                  <InfoRow label="Produced by"  value={selected.producers} />
                  {selected.actors?.length > 0 && (
                    <>
                      <span className="info-label">Cast</span>
                      <span style={{ color: "#3e6784", fontSize: "0.9rem" }}>
                        {selected.actors.map(a => `${a.name} as ${a.character}`).join(" · ")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}