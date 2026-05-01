// features/dashboard/modules/profile/ProfilePage.tsx

import { useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, MapPin, FileText, Lock, Eye, EyeOff,
  CheckCircle, AlertCircle, Loader2, Zap, Shield,
  Activity, Target, Weight, Percent, Bell, Edit3, Save, X,
} from "lucide-react";
import { useAuthStore } from "@/features/Login/store";
import { CustomerDetailView } from "@/features/dashboard/modules/customers/CustomerDetailView";
import { CUSTOMER_GOAL_OPTIONS } from "@/features/dashboard/modules/customers/goalConstants";
import { updateProfile, updatePassword, ProfileApiError, ProfileUpdatePayload } from "./ProfileApi";

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_META: Record<string, { label: string; color: string; bg: string; description: string }> = {
  admin: {
    label:       "Administrator",
    color:       "#FF6432",
    bg:          "rgba(255,100,50,0.12)",
    description: "Full platform access · All branches",
  },
  franchise_setup_client: {
    label:       "Franchise Client",
    color:       "#3b82f6",
    bg:          "rgba(59,130,246,0.12)",
    description: "Franchise setup & project tracking",
  },
  personal_training_client: {
    label:       "Training Client",
    color:       "#22c55e",
    bg:          "rgba(34,197,94,0.12)",
    description: "Personal training & progress tracking",
  },
  training_client: {
    label:       "Training Client",
    color:       "#22c55e",
    bg:          "rgba(34,197,94,0.12)",
    description: "Personal training & progress tracking",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fadeUp = {
  initial:   { opacity: 0, y: 16 },
  animate:   { opacity: 1, y: 0 },
  transition:{ duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

type ToastState = { type: "success" | "error"; message: string } | null;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({
  title, icon: Icon, children, accent = "#FF6432",
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  accent?: string;
}) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{
      background: "rgba(255,255,255,0.03)",
      border:     "1px solid rgba(255,255,255,0.07)",
    }}
  >
    <div
      className="flex items-center gap-3 px-6 py-4"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}18` }}
      >
        <Icon size={16} style={{ color: accent }} />
      </div>
      <h2
        className="text-sm font-bold tracking-widest uppercase"
        style={{ color: "rgba(255,255,255,0.60)", fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {title}
      </h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Field = ({
  label, value, onChange, type = "text", placeholder = "", disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      className="text-[10px] font-bold uppercase tracking-widest"
      style={{ color: "rgba(255,255,255,0.30)" }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        borderRadius: 12,
        padding:      "11px 14px",
        fontSize:     14,
        fontFamily:   "'DM Sans', system-ui, sans-serif",
        color:        disabled ? "rgba(255,255,255,0.25)" : "#fff",
        outline:      "none",
        background:   disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
        border:       "1px solid rgba(255,255,255,0.08)",
        cursor:       disabled ? "not-allowed" : "text",
        transition:   "border-color 0.2s, box-shadow 0.2s",
        width:        "100%",
      }}
      onFocus={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = "rgba(255,160,30,0.40)";
          e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(255,100,50,0.10)";
        }
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.boxShadow   = "none";
      }}
    />
  </div>
);

const NumberField = ({
  label, value, onChange, placeholder = "", unit = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      className="text-[10px] font-bold uppercase tracking-widest"
      style={{ color: "rgba(255,255,255,0.30)" }}
    >
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          borderRadius: 12,
          padding:      unit ? "11px 44px 11px 14px" : "11px 14px",
          fontSize:     14,
          fontFamily:   "'DM Sans', system-ui, sans-serif",
          color:        "#fff",
          outline:      "none",
          background:   "rgba(255,255,255,0.05)",
          border:       "1px solid rgba(255,255,255,0.08)",
          width:        "100%",
          transition:   "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,160,30,0.40)";
          e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(255,100,50,0.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow   = "none";
        }}
      />
      {unit && (
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          {unit}
        </span>
      )}
    </div>
  </div>
);

const SaveButton = ({
  loading, onClick, label = "Save Changes",
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
}) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-150"
    style={{
      background: loading ? "rgba(255,160,30,0.35)" : "linear-gradient(135deg,#FFA01E,#FF6432)",
      color:      "#000",
      border:     "none",
      cursor:     loading ? "not-allowed" : "pointer",
      fontFamily: "'Barlow', sans-serif",
      letterSpacing: "0.06em",
      boxShadow:  loading ? "none" : "0 4px 16px rgba(255,100,50,0.28)",
    }}
  >
    {loading
      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
      : <><Save size={14} /> {label}</>
    }
  </button>
);

/** Must be module-scoped — defining inside PasswordSection creates a new component type each render and remounts inputs (focus loss). */
const PasswordToggleField = ({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>
      {label}
    </label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        style={{
          borderRadius: 12,
          padding:      "11px 44px 11px 14px",
          fontSize:     14,
          fontFamily:   "'DM Sans', system-ui, sans-serif",
          color:        "#fff",
          outline:      "none",
          background:   "rgba(255,255,255,0.05)",
          border:       "1px solid rgba(255,255,255,0.08)",
          width:        "100%",
          transition:   "border-color 0.2s, box-shadow 0.2s",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,160,30,0.40)";
          e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(255,100,50,0.10)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow   = "none";
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: "rgba(255,255,255,0.30)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  </div>
);

// ─── Password Section ─────────────────────────────────────────────────────────

const PasswordSection = ({ onToast }: { onToast: (t: ToastState) => void }) => {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const strength = (() => {
    if (!next) return 0;
    let s = 0;
    if (next.length >= 8)         s++;
    if (/[A-Z]/.test(next))       s++;
    if (/[0-9]/.test(next))       s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"][strength];

  const handleSave = async () => {
    if (!current)              return onToast({ type: "error", message: "Enter your current password." });
    if (next.length < 8)       return onToast({ type: "error", message: "New password must be at least 8 characters." });
    if (next !== confirm)      return onToast({ type: "error", message: "Passwords do not match." });

    try {
      setLoading(true);
      await updatePassword(next);
      onToast({ type: "success", message: "Password updated successfully." });
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      onToast({ type: "error", message: err instanceof ProfileApiError ? err.message : "Password update failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Security" icon={Lock} accent="#a855f7">
      <div className="flex flex-col gap-4">
        <PasswordToggleField label="Current Password" value={current} onChange={setCurrent} show={showCur} onToggle={() => setShowCur((s) => !s)} />
        <PasswordToggleField label="New Password" value={next} onChange={setNext} show={showNew} onToggle={() => setShowNew((s) => !s)} />

        {/* Strength meter */}
        {next && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              {[1,2,3,4].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{ background: i <= strength ? strengthColor : "rgba(255,255,255,0.08)" }}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: strengthColor }}>
              {strengthLabel}
            </span>
          </div>
        )}

        <PasswordToggleField label="Confirm Password" value={confirm} onChange={setConfirm} show={showConf} onToggle={() => setShowConf((s) => !s)} />

        <div className="flex justify-end pt-1">
          <SaveButton loading={loading} onClick={handleSave} label="Update Password" />
        </div>
      </div>
    </SectionCard>
  );
};

/** Isolated from ProfilePage local state so typing in account fields does not re-render the whole Directus customer panel. */
const TrainingProfileCustomerPanel = memo(function TrainingProfileCustomerPanel({ userId }: { userId: string }) {
  const motionTransition = useMemo(() => ({ ...fadeUp.transition, delay: 0.12 }), []);
  return (
    <motion.div {...fadeUp} transition={motionTransition} className="mb-8 max-w-7xl mx-auto w-full text-left">
      <CustomerDetailView customerId={userId} mode="training" compact />
    </motion.div>
  );
});

// ─── Main ProfilePage ─────────────────────────────────────────────────────────

export const ProfilePage = () => {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const role   = user?.dashboard_roles ?? "";
  const meta   = ROLE_META[role] ?? ROLE_META["admin"];
  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean).map((n) => n![0].toUpperCase()).join("").slice(0, 2) || "??";

  const lastAccess = user?.last_access
    ? new Date(user.last_access as string).toLocaleString("en-IN", {
        dateStyle: "medium", timeStyle: "short",
      })
    : "—";

  // ── Info form state ──────────────────────────────────────────────────────
  const [firstName,   setFirstName]   = useState(user?.first_name   ?? "");
  const [lastName,    setLastName]    = useState(user?.last_name    ?? "");
  const [email,       setEmail]       = useState(user?.email        ?? "");
  const [location,    setLocation]    = useState((user?.location as string) ?? "");
  const [title,       setTitle]       = useState((user?.title as string) ?? "");
  const [description, setDescription] = useState((user?.description as string) ?? "");
  const [emailNotif,  setEmailNotif]  = useState((user?.email_notifications as boolean) ?? true);
  const [savingInfo,  setSavingInfo]  = useState(false);

  // ── Fitness state (training/franchise) ───────────────────────────────────
  const [age,           setAge]           = useState(String(user?.age           ?? ""));
  const [goal,          setGoal]          = useState((user?.goal as string)     ?? "");
  const [currentWeight, setCurrentWeight] = useState(String(user?.currentWeight ?? ""));
  const [fatPct,        setFatPct]        = useState(String(user?.fatPercentage ?? ""));
  const [savingFit,     setSavingFit]     = useState(false);

  // ── Toast ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!user) return;
    try {
      setSavingInfo(true);
      const payload: ProfileUpdatePayload = {
        first_name:          firstName.trim(),
        last_name:           lastName.trim(),
        email:               email.trim(),
        location:            location.trim() || null,
        title:               title.trim() || null,
        description:         description.trim() || null,
        email_notifications: emailNotif,
      };
      await updateProfile(user.id, payload);
      setUser({ ...user, ...payload });
      setToast({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      setToast({ type: "error", message: err instanceof ProfileApiError ? err.message : "Update failed." });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveFitness = async () => {
    if (!user) return;
    try {
      setSavingFit(true);
      const payload: ProfileUpdatePayload = {
        age:           age ? Number(age) : null,
        goal:          goal || null,
        currentWeight: currentWeight ? Number(currentWeight) : null,
        fatPercentage: fatPct ? Number(fatPct) : null,
      };
      await updateProfile(user.id, payload);
      setUser({ ...user, ...payload });
      setToast({ type: "success", message: "Fitness profile saved." });
    } catch (err) {
      setToast({ type: "error", message: err instanceof ProfileApiError ? err.message : "Update failed." });
    } finally {
      setSavingFit(false);
    }
  };

  const isTraining  = role === "personal_training_client" || role === "training_client";
  const isTrainingClientRole = role === "training_client";
  const isFranchise = role === "franchise_setup_client";
  const isAdmin     = role === "admin";

  const baseMotionTransition = fadeUp.transition;
  const motionTAccount = useMemo(
    () => ({ ...baseMotionTransition, delay: 0.07 }),
    [baseMotionTransition]
  );
  const motionTMid = useMemo(
    () => ({ ...baseMotionTransition, delay: 0.14 }),
    [baseMotionTransition]
  );
  const motionTPassword = useMemo(
    () => ({ ...baseMotionTransition, delay: 0.21 }),
    [baseMotionTransition]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        .profile-textarea {
          resize: vertical;
          min-height: 80px;
          border-radius: 12px;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'DM Sans', system-ui, sans-serif;
          color: #fff;
          outline: none;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          width: 100%;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .profile-textarea:focus {
          border-color: rgba(255,160,30,0.40);
          box-shadow: 0 0 0 3px rgba(255,100,50,0.10);
        }
        .toggle-track {
          width: 36px; height: 20px; border-radius: 100px;
          transition: background 0.2s;
          position: relative; cursor: pointer; border: none; padding: 0;
          flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute; top: 3px; width: 14px; height: 14px;
          border-radius: 50%; background: #fff;
          transition: left 0.2s;
        }
      `}</style>

      <div
        className="max-w-3xl mx-auto"
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,   scale: 1    }}
              exit={{   opacity: 0, y: -8,   scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-2xl"
              style={{
                background: toast.type === "success" ? "rgba(34,197,94,0.12)"  : "rgba(239,68,68,0.12)",
                border:     toast.type === "success" ? "1px solid rgba(34,197,94,0.28)" : "1px solid rgba(239,68,68,0.28)",
                backdropFilter: "blur(16px)",
              }}
            >
              {toast.type === "success"
                ? <CheckCircle  size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
                : <AlertCircle  size={16} style={{ color: "#f87171", flexShrink: 0 }} />
              }
              <span className="text-sm font-semibold" style={{ color: toast.type === "success" ? "#22c55e" : "#f87171" }}>
                {toast.message}
              </span>
              <button
                onClick={() => setToast(null)}
                style={{ color: "rgba(255,255,255,0.30)", background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 4 }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} className="relative mb-6 rounded-2xl overflow-hidden">
          {/* BG gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${meta.color}18 0%, rgba(9,9,15,0.80) 60%)`,
              borderBottom: `1px solid ${meta.color}22`,
            }}
          />
          {/* Decorative orb */}
          <div
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${meta.color}22 0%, transparent 70%)`,
              filter: "blur(24px)",
            }}
          />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 sm:p-8">
            {/* Avatar */}
            <div
              className="h-20 w-20 shrink-0 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl"
              style={{
                background:  `linear-gradient(135deg, ${meta.color}30, ${meta.color}10)`,
                border:      `2px solid ${meta.color}30`,
                color:        meta.color,
                fontFamily:  "'Barlow Condensed', sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1
                  className="text-2xl font-black tracking-tight"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#fff" }}
                >
                  {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || "—"}
                </h1>
                <span
                  className="text-[11px] font-bold tracking-widest uppercase rounded-full px-2.5 py-1"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  {meta.label}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                {user?.email}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                {meta.description}
              </p>
            </div>

            {/* Stats strip */}
            <div className="flex gap-4 sm:flex-col sm:gap-2 sm:text-right">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.28)" }}>Last seen</p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>{lastAccess}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "rgba(255,255,255,0.28)" }}>Status</p>
                <span
                  className="inline-flex items-center gap-1 text-xs font-bold"
                  style={{ color: "#22c55e" }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Account info ───────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={motionTAccount} className="mb-4">
          <SectionCard title="Account Information" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="First name" />
              <Field label="Last Name"  value={lastName}  onChange={setLastName}  placeholder="Last name"  />
              <Field label="Email"      value={email}     onChange={setEmail}     placeholder="Email address" type="email" />
              <Field label="Job Title"  value={title}     onChange={setTitle}     placeholder="e.g. Head Coach" />
              <Field label="Location"   value={location}  onChange={setLocation}  placeholder="City, Country" />

              {/* Provider (read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>
                  Auth Provider
                </label>
                <div
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Shield size={13} style={{ color: "rgba(255,255,255,0.28)", flexShrink: 0 }} />
                  <span className="text-sm capitalize" style={{ color: "rgba(255,255,255,0.30)" }}>
                    {(user?.provider as string) || "default"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="flex flex-col gap-1.5 mt-4">
              <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>
                Bio
              </label>
              <textarea
                className="profile-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short bio about yourself…"
              />
            </div>

            {/* Email notifications toggle */}
            <div
              className="flex items-center justify-between mt-4 rounded-xl px-4 py-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <Bell size={15} style={{ color: "rgba(255,255,255,0.40)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.70)" }}>Email Notifications</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>Receive updates and alerts by email</p>
                </div>
              </div>
              <button
                className="toggle-track"
                style={{ background: emailNotif ? "#FF6432" : "rgba(255,255,255,0.12)" }}
                onClick={() => setEmailNotif((s) => !s)}
              >
                <div
                  className="toggle-thumb"
                  style={{ left: emailNotif ? 19 : 3 }}
                />
              </button>
            </div>

            <div className="flex justify-end mt-5">
              <SaveButton loading={savingInfo} onClick={handleSaveInfo} />
            </div>
          </SectionCard>
        </motion.div>

        {/* ── Fitness profile — franchise + legacy training role (not training_client) ─ */}
        {(isFranchise || (isTraining && !isTrainingClientRole)) && (
          <motion.div {...fadeUp} transition={motionTMid} className="mb-4">
            <SectionCard title="Fitness Profile" icon={Activity} accent="#22c55e">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NumberField label="Age" value={age} onChange={setAge} placeholder="e.g. 28" unit="yrs" />
                <NumberField label="Current Weight" value={currentWeight} onChange={setCurrentWeight} placeholder="e.g. 75" unit="kg" />
                <NumberField label="Body Fat %" value={fatPct} onChange={setFatPct} placeholder="e.g. 18" unit="%" />

                {/* Goal selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.30)" }}>
                    Primary Goal
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    style={{
                      borderRadius:  12,
                      padding:       "11px 14px",
                      fontSize:      14,
                      fontFamily:    "'DM Sans', system-ui, sans-serif",
                      color:         "#fff",
                      outline:       "none",
                      background:    "rgba(255,255,255,0.05)",
                      border:        "1px solid rgba(164, 157, 157, 0.08)",
                      width:         "100%",
                      cursor:        "pointer",
                      appearance:    "none",
                      WebkitAppearance: "none",
                    }}
                  >
                    <option value="" style={{ background: "#111" }}>Select goal…</option>
                    {CUSTOMER_GOAL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} style={{ background: "#111" }}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Goal pills for quick pick */}
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  Quick select
                </p>
                <div className="flex flex-wrap gap-2">
                  {CUSTOMER_GOAL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setGoal(o.value)}
                      className="text-xs font-semibold rounded-full px-3 py-1.5 transition-all duration-150"
                      style={{
                        background: goal === o.value ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                        border:     `1px solid ${goal === o.value ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.07)"}`,
                        color:      goal === o.value ? "#22c55e" : "rgba(255,255,255,0.40)",
                        cursor:     "pointer",
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-5">
                <SaveButton loading={savingFit} onClick={handleSaveFitness} label="Save Fitness Profile" />
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* ── Training client: read-only customer record (Directus) ─────── */}
        {isTrainingClientRole && user?.id && (
          <TrainingProfileCustomerPanel userId={user.id} />
        )}

        {/* ── Admin-only: platform info ──────────────────────────────────── */}
        {isAdmin && (
          <motion.div {...fadeUp} transition={motionTMid} className="mb-4">
            <SectionCard title="Platform Access" icon={Zap} accent="#FF6432">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Role",      value: "Super Admin"                   },
                  { label: "Provider",  value: (user?.provider as string) ?? "default" },
                  { label: "Super Admin", value: user?.is_super_admin ? "Yes" : "No" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.28)" }}>
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold capitalize" style={{ color: "rgba(255,255,255,0.70)" }}>
                      {String(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* ── Password ───────────────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={motionTPassword} className="mb-8">
          <PasswordSection onToast={setToast} />
        </motion.div>

      </div>
    </>
  );
};