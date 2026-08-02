"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import PasswordInput from "./PasswordInput";

type Initial = {
  full_name: string;
  phone: string;
  country: string;
  bio: string;
  avatar_url: string | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "success" | "error" | "info"; message: string };

export default function ProfileEditor({
  email,
  initial,
}: {
  email: string;
  initial: Initial;
}) {
  const supabase = createSupabaseBrowser();
  const router = useRouter();

  const [fullName, setFullName] = useState(initial.full_name);
  const [phone, setPhone] = useState(initial.phone);
  const [country, setCountry] = useState(initial.country);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState<Status>({ kind: "idle" });

  const [pw, setPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<Status>({ kind: "idle" });

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (fullName || email).slice(0, 2).toUpperCase();

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (savingProfile) return;
    if (!fullName.trim())
      return setProfileStatus({ kind: "error", message: "Name is required." });

    setSavingProfile(true);
    setProfileStatus({ kind: "info", message: "Saving…" });

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      setSavingProfile(false);
      return setProfileStatus({ kind: "error", message: "Not signed in." });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        country: country.trim(),
        bio: bio.trim(),
      })
      .eq("id", uid);

    setSavingProfile(false);
    if (error) return setProfileStatus({ kind: "error", message: error.message });
    setProfileStatus({ kind: "success", message: "✅ Profile updated." });
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (savingPw) return;
    if (pw.length < 8)
      return setPwStatus({
        kind: "error",
        message: "Password must be at least 8 characters.",
      });
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSavingPw(false);
    if (error) return setPwStatus({ kind: "error", message: error.message });
    setPw("");
    setPwStatus({ kind: "success", message: "✅ Password changed." });
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileStatus({ kind: "error", message: "Image must be under 2MB." });
      return;
    }
    setUploading(true);
    setProfileStatus({ kind: "info", message: "Uploading photo…" });

    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) throw new Error("Not signed in.");

      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (up.error) throw up.error;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = pub.publicUrl;

      const upd = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", uid);
      if (upd.error) throw upd.error;

      setAvatarUrl(url);
      setProfileStatus({ kind: "success", message: "✅ Avatar updated." });
    } catch (err) {
      setProfileStatus({
        kind: "error",
        message: "Upload failed: " + (err instanceof Error ? err.message : String(err)),
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header card */}
      <section className="rounded-2xl border border-white/6 bg-white/[0.03] p-6 flex items-center gap-5 flex-wrap">
        <div className="relative w-20 h-20 shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 bg-gradient-primary grid place-items-center text-dark font-black text-2xl">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={80}
                height={80}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              initials
            )}
          </div>
          <label
            className={`absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card-bg border border-white/10 text-secondary grid place-items-center cursor-pointer hover:bg-secondary hover:text-dark transition-colors ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
            title="Change photo"
          >
            {uploading ? (
              <i className="fas fa-spinner fa-spin text-xs" />
            ) : (
              <i className="fas fa-camera text-xs" />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickAvatar}
              disabled={uploading}
            />
          </label>
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-xl md:text-2xl">
            {fullName || "Your Profile"}
          </h2>
          <p className="text-white/60 text-sm">{email}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] items-start">
        {/* Profile form */}
        <form
          onSubmit={saveProfile}
          className="rounded-2xl border border-white/6 bg-white/[0.03] p-6 space-y-4"
        >
          <h3 className="font-bold text-lg mb-2">Profile</h3>

          <Field label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
              className={inputCls}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              readOnly
              className={`${inputCls} opacity-70 cursor-not-allowed`}
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className={inputCls}
            />
          </Field>

          <Field label="Country">
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              autoComplete="country-name"
              className={inputCls}
            />
          </Field>

          <Field label="Bio">
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A little about you…"
              className={`${inputCls} resize-y`}
            />
          </Field>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary justify-center w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingProfile ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving…
              </>
            ) : (
              "Save Profile"
            )}
          </button>

          <StatusLine status={profileStatus} />
        </form>

        <div className="space-y-6">
          {/* Password change */}
          <form
            onSubmit={changePassword}
            className="rounded-2xl border border-white/6 bg-white/[0.03] p-6 space-y-4"
          >
            <h3 className="font-bold text-lg mb-2">Change Password</h3>
            <Field label="New Password">
              <div className="relative">
                <PasswordInput
                  value={pw}
                  onChange={setPw}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />
              </div>
            </Field>
            <button
              type="submit"
              disabled={savingPw}
              className="w-full py-3 rounded-xl bg-transparent border border-secondary text-secondary font-bold hover:bg-secondary hover:text-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingPw ? (
                <>
                  <i className="fas fa-spinner fa-spin" /> Updating…
                </>
              ) : (
                "Update Password"
              )}
            </button>
            <StatusLine status={pwStatus} />
          </form>

          <div className="rounded-2xl border border-white/6 bg-white/[0.03] p-6">
            <h3 className="font-bold text-lg mb-2">Notifications</h3>
            <p className="text-sm text-white/55">
              You&apos;ll see in-app alerts here as they come in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-secondary/55 focus:ring-4 focus:ring-secondary/15 transition-all";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-white/75 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  const cls =
    status.kind === "error"
      ? "text-danger"
      : status.kind === "success"
        ? "text-profit-green"
        : "text-white/70";
  return <p className={`text-sm ${cls}`}>{status.message}</p>;
}
