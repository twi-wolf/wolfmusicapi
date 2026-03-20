import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import wolfLogo from "@assets/wolf-logo.png";

interface LoaderContextType {
  triggerLoader: () => void;
}

const LoaderContext = createContext<LoaderContextType>({ triggerLoader: () => {} });

export function useLoader() {
  return useContext(LoaderContext);
}

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [location] = useLocation();
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runLoader = useCallback(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setFading(false);
    setVisible(true);
    fadeTimerRef.current = setTimeout(() => setFading(true), 1500);
    hideTimerRef.current = setTimeout(() => setVisible(false), 2000);
  }, []);

  useEffect(() => {
    runLoader();
  }, [location]);

  return (
    <LoaderContext.Provider value={{ triggerLoader: runLoader }}>
      {children}
      {visible && (
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
            transition: "opacity 0.5s ease",
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
      )}
    </LoaderContext.Provider>
  );
}
