import { useEffect, useState } from "react";
import { getPersons, getPerson } from "../api";

export default function Stars() {
  const [persons,  setPersons]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [profLoad, setProfLoad] = useState(false);

  useEffect(() => {
    getPersons()
      .then(d => setPersons(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(p) {
    setSelected(p); setProfLoad(true);
    getPerson(p.name)
      .then(d => setProfile(d))
      .catch(console.error)
      .finally(() => setProfLoad(false));
  }

  function FilmList({ label, items, render }) {
    if (!items?.length) return null;
    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: "#1978b7", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>
          {label}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {items.map((item, i) => (
            <span key={i} style={{ background: "#e2f4ff", border: "1px solid #add5ef", borderRadius: "999px", padding: "3px 12px", color: "#14334c", fontSize: "0.82rem", fontWeight: 600 }}>
              {render(item)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Cast & Crew</p>
        <h1>Stars</h1>
        <p>Directors, writers, producers, and actors.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "20px", alignItems: "start" }}>

        {/* people list */}
        <div className="panel" style={{ padding: "12px" }}>
          {loading && <p className="loading-text" style={{ padding: "20px 0" }}>Loading…</p>}
          {persons.map(p => (
            <div key={p.name} onClick={() => handleSelect(p)}
              style={{
                padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                background: selected?.name === p.name ? "#e2f4ff" : "transparent",
                borderLeft: `3px solid ${selected?.name === p.name ? "#258ccc" : "transparent"}`,
                marginBottom: "2px", transition: "background 0.15s",
              }}
            >
              <div style={{ fontWeight: 700, color: "#14334c", fontSize: "0.9rem" }}>{p.name}</div>
              <div style={{ color: "#7da9c0", fontSize: "0.75rem" }}>{p.birthday}</div>
            </div>
          ))}
        </div>

        {/* profile panel */}
        <div>
          {!selected && (
            <div className="panel" style={{ textAlign: "center", color: "#7da9c0" }}>
              Select a person to view their profile.
            </div>
          )}
          {profLoad && <p className="loading-text">Loading profile…</p>}
          {!profLoad && profile && (
            <div className="panel">
              <p className="eyebrow" style={{ marginBottom: "4px" }}>Profile</p>
              <h2 style={{ color: "#14334c", fontWeight: 800, margin: "0 0 3px", fontSize: "1.3rem" }}>{profile.name}</h2>
              <p style={{ color: "#7da9c0", fontSize: "0.82rem", marginBottom: "14px" }}>Born {profile.birthday}</p>
              {profile.biography && (
                <p style={{ color: "#3e6784", lineHeight: 1.65, marginBottom: "20px", fontSize: "0.9rem" }}>{profile.biography}</p>
              )}
              <FilmList label="Directed"  items={profile.directed}  render={t => t} />
              <FilmList label="Written"   items={profile.written}   render={t => t} />
              <FilmList label="Produced"  items={profile.produced}  render={t => t} />
              <FilmList label="Acting Roles" items={profile.acted_in}
                render={a => <>{a.title} <span style={{ color: "#7da9c0" }}>as {a.character}</span></>} />
              {profile.awards?.length > 0 && (
                <div>
                  <div style={{ color: "#1978b7", fontWeight: 800, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>Awards</div>
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Award</th><th>Year</th><th>Role</th><th>Movie</th></tr></thead>
                      <tbody>
                        {profile.awards.map((a, i) => (
                          <tr key={i}>
                            <td className="td-title">🏆 {a.award}</td>
                            <td>{a.year}</td>
                            <td>{a.role}</td>
                            <td>{a.title}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}