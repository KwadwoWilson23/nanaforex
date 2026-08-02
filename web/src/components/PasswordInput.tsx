"use client";

import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder || "••••••••"}
        required
        className="w-full bg-transparent outline-none text-white placeholder:text-white/30 py-3.5 pl-11 pr-11"
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-white/50 hover:text-secondary rounded-lg transition-colors"
      >
        <i className={`fas ${show ? "fa-eye-slash" : "fa-eye"}`} />
      </button>
    </div>
  );
}
