import React, { useEffect, useRef } from "react";

/** --- 1. Types --- **/
export interface ReviewPoolUser {
  name?: string;
  email: string;
  userId?: string;
  image?: string;
  metadata?: Record<string, any>;
}

export interface ReviewPoolConfig {
  clientId: string;
  lang?: string;
  init?: ReviewPoolUser;
  baseUrl?: string;
}

interface ReviewPoolGlobal {
  q: Array<[string, any]>;
  userData?: ReviewPoolUser | null;
  identify: (data: ReviewPoolUser) => void;
  unidentify: () => void;
}

declare global {
  interface Window {
    reviewpool: ReviewPoolGlobal;
  }
}

/** --- 2. Helper Logic --- **/
const pushCommand = (method: string, payload?: any) => {
  if (typeof window === "undefined") return;

  window.reviewpool = window.reviewpool || { q: [] };

  if (window.reviewpool.q) {

    // construct payload
    const newPayload = {
      widgetId: payload
    }
    window.reviewpool.q.push([method, payload]);
  } else {
    const fn = (window.reviewpool as any)[method];
    if (typeof fn === "function") fn(payload);
  }
};

export const reviewpool = {
  identify: (user: ReviewPoolUser) => pushCommand("identify", user),
  unidentify: () => pushCommand("unidentify"),
};

/** --- 3. The React Component --- **/
export const ReviewPoolScript: React.FC<ReviewPoolConfig> = ({
  clientId,
  lang = "en",
  init,
  baseUrl = "https://app.ideadope.com", // Set your production default here
}) => {
  // Use a ref to ensure we only send the initial identify ONCE per mount
  const hasIdentified = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initial Identity Capture (Guarded by Ref)
    if (init?.email && !hasIdentified.current) {
      reviewpool.identify(init);
      hasIdentified.current = true;
    }

    // 2. Prevent duplicate script injection
    if (document.getElementById("reviewpool-widget-script")) return;

    const script = document.createElement("script");
    script.id = "reviewpool-widget-script";
    // Pointing to your pull route
    script.src = `${baseUrl}/widget/pull?clientId=${clientId}`;
    script.async = true;

    // These data attributes are read by your widget.js init() function
    script.dataset.clientId = clientId;
    script.dataset.language = lang;
    script.dataset.baseUrl = baseUrl;

    document.head.appendChild(script);
  }, [clientId, lang, baseUrl]); // Removed 'init' to prevent re-triggers

  return null;
};
