"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Google Sign-In using Google Identity Services (GIS).
 * Renders Google's own button INVISIBLY over our styled button so clicks
 * open Google's popup on the user's tab — no visible redirect through
 * supabase.co. On success we hand the ID token to Supabase via
 * signInWithIdToken (handled by the parent).
 *
 * The parent shares its raw + hashed nonce via `nonce` ref, so the nonce
 * we send to Google matches what Supabase later expects.
 */
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: {
            client_id: string;
            callback: (r: { credential: string }) => void;
            nonce?: string;
            auto_select?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          renderButton: (
            el: HTMLElement,
            opts: {
              type: "standard";
              theme: string;
              size: string;
              text: string;
              shape: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

export default function GoogleButton({
  clientId,
  onCredential,
  nonce,
}: {
  clientId: string;
  onCredential: (idToken: string) => void;
  nonce: RefObject<{ raw: string; hashed: string } | null>;
}) {
  const hiddenRef = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (!clientId) return;
    if (inited.current) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.google?.accounts?.id && nonce.current) {
        clearInterval(timer);
        inited.current = true;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (r) => onCredential(r.credential),
          nonce: nonce.current.hashed,
          auto_select: false,
          use_fedcm_for_prompt: true,
        });
        if (hiddenRef.current) {
          window.google.accounts.id.renderButton(hiddenRef.current, {
            type: "standard",
            theme: "filled_blue",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 360,
          });
        }
      } else if (tries > 50) {
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [clientId, onCredential, nonce]);

  if (!clientId) return null;

  return (
    <div className="relative">
      <button
        type="button"
        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-[#1f2937] font-semibold text-sm border border-black/6 hover:-translate-y-0.5 hover:shadow-elevated hover:bg-white/95 transition-all"
      >
        <GoogleIcon />
        Continue with Google
      </button>
      {/* Google's rendered button — invisible overlay that receives clicks */}
      <div
        ref={hiddenRef}
        className="absolute inset-0 opacity-[0.001] overflow-hidden cursor-pointer"
        aria-hidden
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.8-6.8C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.6-4.9 7.3l7.8 6c4.6-4.2 7-10.4 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.8-6c-2.2 1.5-5 2.3-8.1 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
