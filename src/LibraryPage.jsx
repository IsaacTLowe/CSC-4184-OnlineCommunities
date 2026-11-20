import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import { api, getMe } from "./api.js";
import { coverUrl, recommend } from "./games.js";
import GameDetail from "./components/GameDetail.jsx";

// /library imports the user's Steam library, then shows recommendations.
// Not logged in, or no Steam account linked yet? /login handles both.
export default function LibraryPage() {
  const [screen, setScreen] = useState("loading"); // "loading" | "recommendations" | "error"
  const [error, setError] = useState("");
  const [importResult, setImportResult] = useState(null);
  const importInFlight = useRef(false);

  useEffect(() => {
    // In dev, React StrictMode runs this effect twice on mount. The ref survives
    // that re-run, so the second pass sees the import already in flight and skips it.
    if (importInFlight.current) return;
    importInFlight.current = true;

    getMe()
      .then((me) => {
        if (!me?.steamId) return (window.location.href = "/login");
        return api("/steam/import", { method: "POST" }).then((result) => {
          setImportResult(result);
          setScreen("recommendations");
        });
      })
      .catch((err) => {
        setError(err.message);
        setScreen("error");
      })
      .finally(() => (importInFlight.current = false));
  }, []);

  return (
    <>
      <Navbar />
      {screen === "recommendations" ? (
        <RecommendationsScreen importResult={importResult} />
      ) : (
        <LoadingScreen error={screen === "error" ? error : ""} />
      )}
    </>
  );
}

function LoadingScreen({ error }) {
  return (
    <main className="library-page" aria-label="Loading game library">
      <div className="library-canvas">
        <Sidebar />

        <section className="loading-panel" aria-live="polite">
          {error ? (
            <>
              <p className="screen-kicker">Couldn't import your Steam library</p>
              <p className="library-error" role="alert">{error}</p>
              <button className="return-library-button" type="button" onClick={() => window.location.reload()}>
                Try Again
              </button>
            </>
          ) : (
            <>
              <p className="screen-kicker">Loading your library from</p>
              <h1>Steam</h1>
              <div className="loading-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="loading-copy">Loading...</p>
            </>
          )}
        </section>

        <BottomPlaceholders />
      </div>
    </main>
  );
}

function RecommendationsScreen({ importResult }) {
  // After a Steam import the server returns the updated user; otherwise fall
  // back to the logged-in user's prefs, then to locally saved prefs.
  const [user, setUser] = useState(importResult?.user ?? null);
  const [selectedGame, setSelectedGame] = useState(null);
  useEffect(() => {
    if (!importResult) getMe().then(setUser);
  }, [importResult]);

  const prefs = user?.prefs ?? JSON.parse(localStorage.getItem("prefs")) ?? ["Combat"];
  const picks = recommend(prefs, user?.ownedAppIds).slice(0, 6);

  return (
    <main className="library-page" aria-label="Game recommendations">
      <div className="library-canvas">
        <Sidebar />

        <section
          className="recommendations-panel"
          aria-labelledby="recommendations-heading"
        >
          <p className="completion-status">Done</p>
          <h1 id="recommendations-heading">You May Like These!</h1>
          {importResult ? (
            <p className="import-summary">
              We looked at your {importResult.analyzed} most-played of {importResult.gameCount} Steam games (
              {Object.entries(importResult.counts)
                .filter(([, n]) => n > 0)
                .map(([cat, n]) => `${cat} ${n}`)
                .join(", ")}
              ). Your top categories: <strong>{prefs.join(", ")}</strong>.
            </p>
          ) : (
            <p className="import-summary">Based on your preferences: <strong>{prefs.join(", ")}</strong>.</p>
          )}
          <div className="recommendation-grid" aria-label="Recommended games">
            {picks.map((game) => (
              <button className="recommendation-card" key={game.appid} type="button" onClick={() => setSelectedGame(game)}>
                <img src={coverUrl(game.appid)} alt={`${game.title} cover art`} loading="lazy" />
                <span>{game.title}</span>
              </button>
            ))}
          </div>
          <GameDetail game={selectedGame} onClose={() => setSelectedGame(null)} />
          <a className="return-library-button no-underline" href="/recommendations">
            See All Recommendations
          </a>
        </section>

        <BottomPlaceholders />
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Library navigation">
      <div className="profile-mark" aria-hidden="true">
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="32" cy="23" r="15" />
          <path d="M12 57c1-13 9-22 20-22s19 9 20 22" />
        </svg>
      </div>

      <div className="sidebar-placeholders" aria-hidden="true">
        <div className="placeholder-row">
          <span />
          <span />
        </div>
        <div className="placeholder-row">
          <span />
          <span />
        </div>
        <div className="placeholder-row">
          <span />
          <span />
        </div>
      </div>
    </aside>
  );
}

function BottomPlaceholders() {
  return (
    <nav className="bottom-placeholders" aria-label="Additional navigation">
      <a
        href="/preferences"
        className="bottom-action flex items-center justify-center text-center no-underline"
      >
        Preferences
      </a>

      <a
        href="/contact"
        className="bottom-action flex items-center justify-center text-center no-underline"
      >
        Contact Us
      </a>
    </nav>
  );
}
