import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import wolfLogo from "@assets/wolf-logo.png";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [location] = useLocation();

  const show = () => {
    setFading(false);
    setVisible(true);
    const fadeTimer = setTimeout(() => setFading(true), 700);
    const hideTimer = setTimeout(() => setVisible(false), 1000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  };

  useEffect(() => {
    return show();
  }, [location]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#050505",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.3s ease",
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid #004d00",
            borderTopColor: "#00ff00",
            animation: "wolf-spin 0.9s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: "#00cc00",
            animation: "wolf-spin 1.4s linear infinite reverse",
          }}
        />
        <img
          src={wolfLogo}
          alt="WolfAPIs"
          style={{
            position: "absolute",
            inset: 16,
            width: 64,
            height: 64,
            objectFit: "contain",
            borderRadius: "50%",
          }}
        />
      </div>

      <div
        style={{
          width: 160,
          height: 3,
          background: "#0a0a0a",
          borderRadius: 9999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, transparent, #00ff00, transparent)",
            animation: "wolf-bar 1s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes wolf-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes wolf-bar {
          0%   { transform: translateX(-160px); width: 160px; }
          50%  { transform: translateX(0px);    width: 160px; }
          100% { transform: translateX(160px);  width: 160px; }
        }
      `}</style>
    </div>
  );
}
