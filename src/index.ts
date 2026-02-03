import React, { useEffect } from "react";

/** --- 1. Types --- **/
export interface ReviewPoolUser {
  email: string;
  name?: string;
  userId?: string;
  metadata?: { [key: string]: any };
}

export interface ReviewPoolConfig {
  clientId: string;
  lang?: string;
  init?: ReviewPoolUser;
}

// Extend the Window interface for the browser environment
declare global {
  interface Window {
    reviewpool: {
      identify: (data: ReviewPoolUser) => void;
      unidentify: () => void;
      q?: any[];
      userData?: ReviewPoolUser | null;
    };
  }
}

/** --- 2. Vanilla JS API --- **/
export const reviewpool = {
  identify: (user: ReviewPoolUser) => {
    if (typeof window === "undefined") return;

    // Safety check: ensure global object exists
    if (!window.reviewpool) {
      window.reviewpool = {
        q: [],
        identify: function (data: ReviewPoolUser) {
          this.q?.push(["identify", data]);
        },
        unidentify: function () {
          this.q?.push(["unidentify"]);
        },
      };
    }

    // If script is loaded and queue is processed, call it directly
    if (
      typeof window.reviewpool.identify === "function" &&
      !window.reviewpool.q
    ) {
      window.reviewpool.identify(user);
    } else {
      // Otherwise, push to queue
      window.reviewpool.q = window.reviewpool.q || [];
      window.reviewpool.q.push([
        "identify",
        user,
      ]);
    }
  },

  unidentify: () => {
    if (typeof window === "undefined") return;
    if (!window.reviewpool) return;

    if (
      typeof window.reviewpool.unidentify === "function" &&
      !window.reviewpool.q
    ) {
      window.reviewpool.unidentify();
    } else {
      window.reviewpool.q = window.reviewpool.q || [];
      window.reviewpool.q.push(["unidentify"]);
    }
  },
};

/** --- 3. React Component --- **/
export const ReviewPoolScript: React.FC<ReviewPoolConfig> = ({
  clientId,
  lang = "en",
  init,
}) => {
  //TODO: set this to prod url
  const baseUrl = "http://localhost:3000";
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize the global object to prevent crashes before script loads
    if (!window.reviewpool) {
      window.reviewpool = {
        q: [],
        identify: function (data: ReviewPoolUser) {
          this.q?.push(["identify", data]);
        },
        unidentify: function () {
          this.q?.push(["unidentify"]);
        },
      };
    }

    // initialize user data

    if (init?.email) {
      reviewpool.identify(init);
    }

    if (document.getElementById("reviewpool-widget-script")) return;

    const script = document.createElement("script");
    script.id = "reviewpool-widget-script";
    script.src = `${baseUrl}/widget/pull`;
    script.setAttribute("data-client-id", clientId);
    script.setAttribute("data-language", lang);
    script.crossOrigin = "anonymous";
    script.async = true;

    document.head.appendChild(script);
  }, [clientId, lang, baseUrl]);

  return null;
};
