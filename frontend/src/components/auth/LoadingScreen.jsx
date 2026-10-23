import { useState, useEffect } from "react";
import "./LoadingScreen.css";

const LOADING_STAGES = [
  {
    image: "/assets/HUMANS-LOAD-BG.png",
    title: "Humans",
    subtitle: "Connecting with humanity...",
    bgColor: "#dbeafe",
    shadowColor: "rgba(191,219,254,1)",
    barFrom: "#38bdf8",
    barTo: "#2563eb",
    barTrack: "rgba(147,197,253,0.5)",
    titleColor: "#1e40af",
    subtitleColor: "#3b82f6",
    percentColor: "#1d4ed8",
    bgSize: "cover",
    bgPosition: "center 35%",
  },
  {
    image: "/assets/ROBOTS-LOAD-BG.png",
    title: "Robots",
    subtitle: "Initializing machine protocols...",
    bgColor: "#fee2e2",
    shadowColor: "rgba(254,226,226,1)",
    barFrom: "#fb7185",
    barTo: "#dc2626",
    barTrack: "rgba(252,165,165,0.5)",
    titleColor: "#991b1b",
    subtitleColor: "#ef4444",
    percentColor: "#b91c1c",
    bgSize: "contain",
    bgPosition: "center center",
  },
  {
    image: "/assets/GRIM-REAPER-LOAD-BG.png",
    title: "System",
    subtitle: "Finalizing configuration...",
    bgColor: "#d1fae5",
    shadowColor: "rgba(209,250,229,1)",
    barFrom: "#34d399",
    barTo: "#059669",
    barTrack: "rgba(110,231,183,0.5)",
    titleColor: "#065f46",
    subtitleColor: "#10b981",
    percentColor: "#047857",
    bgSize: "contain",
    bgPosition: "center center",
  },
];

const LoadingScreen = ({ onComplete, duration = 30000 }) => {
  const [progress, setProgress] = useState(0);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 100 / (duration / 80);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [duration]);

  // Complete callback
  useEffect(() => {
    if (progress >= 100 && onComplete) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, onComplete]);

  const currentStage = progress <= 33.33 ? 0 : progress <= 66.66 ? 1 : 2;
  const stage = LOADING_STAGES[currentStage];
  const roundedProgress = Math.round(progress);

  return (
    <div
      className="loading-screen"
      style={{
        backgroundColor: stage.bgColor,
      }}
    >
      {/* Background-image div — more reliable than img object-fit */}
      <div
        key={currentStage}
        className="loading-bg-image"
        style={{
          backgroundImage: `url(${stage.image})`,
          backgroundSize: stage.bgSize,
          backgroundPosition: stage.bgPosition,
        }}
      />

      {/* Bottom shadow gradient */}
      <div
        className="loading-shadow"
        style={{
          background: `linear-gradient(to top, ${stage.shadowColor} 38%, transparent 100%)`,
        }}
      />

      {/* Bottom UI content */}
      <div className="loading-content">
        <h1 style={{ color: stage.titleColor }}>{stage.title}</h1>

        <p style={{ color: stage.subtitleColor }}>{stage.subtitle}</p>

        {/* Progress row */}
        <div className="loading-progress-row">
          <span style={{ color: stage.subtitleColor }}>Loading</span>
          <span style={{ color: stage.percentColor }}>{roundedProgress}%</span>
        </div>

        {/* Progress bar */}
        <div
          className="loading-bar-track"
          style={{ backgroundColor: stage.barTrack }}
        >
          <div
            className="loading-bar-fill"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to right, ${stage.barFrom}, ${stage.barTo})`,
            }}
          />
        </div>

        {/* Stage dots */}
        <div className="loading-dots">
          {LOADING_STAGES.map((_, i) => (
            <div
              key={i}
              className={`loading-dot ${i === currentStage ? "active" : ""}`}
              style={{
                width: i === currentStage ? 24 : 8,
                backgroundColor:
                  i === currentStage ? stage.barFrom : "rgba(0,0,0,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
