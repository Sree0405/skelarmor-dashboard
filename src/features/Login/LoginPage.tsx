// features/Login/LoginPage.tsx

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Zap, ArrowRight } from "lucide-react";
import Lightning from "@/components/Lightning";

// ── New auth feature imports (replaces old store + local helper) ──────────────
import { useAuthStore }      from "@/features/Login/store";
import { enforceLoginOrganizationPolicy, login } from "@/features/Login/api";
import { getRoleDestination } from "@/features/Login/utils";

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  { dot: "#FF6432", text: "Real-time client & revenue analytics" },
  { dot: "#3b82f6", text: "Multi-branch franchise management" },
  { dot: "#22c55e", text: "Programme tracking & body metrics" },
  { dot: "#a855f7", text: "Integrated billing & payment alerts" },
];

const STATS = [
  { value: "1,200+", label: "Clients managed" },
  { value: "50+",    label: "Gyms powered" },
  { value: "98%",    label: "Uptime guarantee" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const LoginPage = () => {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const fetchMe  = useAuthStore((s) => s.fetchMe);

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [focused,  setFocused]  = useState<"email" | "password" | null>(null);

  // ── Core login handler ────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }

    let tokenApplied = false;
    try {
      setLoading(true);
      setError("");

      // 1. Authenticate — get tokens only
      const { access_token, refresh_token } = await login(email, password);

      // 2. Persist tokens so fetchMe() can pick them up.
      //    Reset hydrationStatus to "idle" so the deduplication guard inside
      //    fetchMe() doesn't skip the call if the user logged out and is signing
      //    in again within the same session (status would otherwise be "error").
      setToken(access_token, refresh_token);
      tokenApplied = true;

      // 3. Fetch /users/me when user was cleared by setToken — blocking so we have dashboard_roles before navigating.
      await fetchMe();
      const user = useAuthStore.getState().user;
      if (user) {
        await enforceLoginOrganizationPolicy(user);
      }
      const role = user?.dashboard_roles;
      console.log(useAuthStore.getState().user);
      // 4. Resolve destination and navigate
      const destination = getRoleDestination(role);
      navigate(destination);

    } catch (err: unknown) {
      if (tokenApplied) {
        try {
          useAuthStore.persist.clearStorage();
        } catch {
          /* ignore */
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        useAuthStore.setState({
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          hydrationStatus: "idle",
        });
      }
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleLogin(); };

  const submitContent = loading
    ? <><Loader2 size={16} className="sa-spin" /> Signing in…</>
    : <>Sign In <ArrowRight size={15} /></>;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Barlow:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

        input:-webkit-autofill,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(8,10,20,0.95) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
        }

        @keyframes sa-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .sa-float { animation: sa-float 6s ease-in-out infinite; }

        @keyframes sa-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .sa-pulse { animation: sa-pulse 2.2s ease-in-out infinite; }

        @keyframes sa-spin { to { transform: rotate(360deg); } }
        .sa-spin { animation: sa-spin 0.75s linear infinite; }

        .sa-input {
          transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .sa-btn:hover:not(:disabled) {
          filter: brightness(1.1);
          box-shadow: 0 0 32px rgba(255,100,50,0.55) !important;
        }
        .sa-btn:active:not(:disabled) { transform: scale(0.96); }

        .sa-stat:hover {
          background: rgba(255,255,255,0.055) !important;
          border-color: rgba(255,255,255,0.12) !important;
        }
      `}</style>

      <div
        className="relative min-h-screen w-full overflow-hidden flex flex-col lg:flex-row"
        style={{ background: "#05070D", fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >

        {/* Lightning canvas */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <Lightning hue={260} xOffset={0} speed={1} intensity={1} size={1} />
        </div>

        {/* Dark scrim */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1, background: "rgba(0,0,0,0.58)" }}
        />

        {/* Radial glows */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 2,
            background: `
              radial-gradient(circle at 18% 30%, rgba(139,92,246,0.20) 0%, transparent 55%),
              radial-gradient(circle at 82% 72%, rgba(59,130,246,0.14) 0%, transparent 55%)
            `,
          }}
        />

        {/* ══ LEFT — Brand panel ════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex lg:w-[52%] relative flex-col justify-center"
          style={{
            zIndex: 10,
            padding: "56px 64px",
            borderRight: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="sa-float w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{
                background: "linear-gradient(135deg,#FFA01E,#FF6432)",
                boxShadow: "0 12px 36px rgba(255,100,50,0.40)",
              }}
            >
              <Zap size={24} color="#000" fill="#000" />
            </div>

            <h1
              className="leading-none mb-3"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 52,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "0.04em",
              }}
            >
              SKEL
              <span
                style={{
                  background: "linear-gradient(90deg,#FFA01E,#FF6432)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ARMOR
              </span>
            </h1>

            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.44)", lineHeight: 1.65, maxWidth: 280 }}>
              The complete gym intelligence platform — clients, payments,
              programmes, and franchise operations in one command centre.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col gap-3 mb-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
          >
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 rounded-full"
                  style={{ width: 6, height: 6, background: f.dot }}
                />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.50)" }}>{f.text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-3 mb-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
          >
            {STATS.map((s) => (
              <div
                key={s.label}
                className="sa-stat rounded-2xl text-center"
                style={{
                  padding: "14px 10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  transition: "background 0.2s, border-color 0.2s",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 20,
                    fontWeight: 900,
                    background: "linear-gradient(90deg,#FFA01E,#FF6432)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.30)", marginTop: 3 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div
              className="sa-pulse rounded-full flex-shrink-0"
              style={{ width: 6, height: 6, background: "#22c55e" }}
            />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.26)" }}>
              Powered by Directus · SSL Secured · GDPR Ready
            </span>
          </motion.div>
        </div>

        {/* ══ RIGHT — Form panel ════════════════════════════════════════════ */}
        <div
          className="flex-1 flex items-center justify-center relative px-5 sm:px-8 py-12 lg:py-0 pb-28 lg:pb-0"
          style={{ zIndex: 10 }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 52%, rgba(255,100,50,0.04) 0%, transparent 68%)",
              filter: "blur(48px)",
            }}
          />

          <motion.div
            className="w-full relative"
            style={{ maxWidth: 400 }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Mobile brand mark */}
            <div className="lg:hidden flex items-center gap-3 mb-7">
              <div
                className="rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36, height: 36,
                  background: "linear-gradient(135deg,#FFA01E,#FF6432)",
                  boxShadow: "0 6px 18px rgba(255,100,50,0.35)",
                }}
              >
                <Zap size={16} color="#000" fill="#000" />
              </div>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "0.08em",
                }}
              >
                SKELARMOR
              </span>
            </div>

            {/* Desktop heading */}
            <div className="hidden lg:block mb-7">
              <h2
                className="leading-none mb-1.5"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 32,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "0.03em",
                }}
              >
                WELCOME BACK
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)" }}>
                Sign in to your SkelArmor dashboard
              </p>
            </div>

            {/* Mobile heading */}
            <div className="lg:hidden mb-6">
              <h2
                className="leading-none mb-1.5"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "0.03em",
                }}
              >
                SIGN IN
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>
                Enter your credentials to continue
              </p>
            </div>

            {/* ── Glass card ─────────────────────────────────────────────── */}
            <div
              className="flex flex-col gap-5 rounded-2xl"
              style={{
                padding: "28px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(28px)",
                WebkitBackdropFilter: "blur(28px)",
                boxShadow:
                  "0 24px 60px rgba(0,0,0,0.50), 0 0 40px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              {/* Email */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.34)",
                  }}
                >
                  Email Address
                </label>
                <input
                  className="sa-input block w-full"
                  type="email"
                  placeholder="you@skelarmor.in"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={onKey}
                  style={{
                    borderRadius: 12,
                    padding: "13px 16px",
                    fontSize: 14,
                    color: "#fff",
                    outline: "none",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    background: focused === "email" ? "rgba(255,160,30,0.06)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${focused === "email" ? "rgba(255,160,30,0.42)" : "rgba(255,255,255,0.08)"}`,
                    boxShadow: focused === "email" ? "0 0 0 3px rgba(255,100,50,0.10)" : "none",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.34)",
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    tabIndex={-1}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#FFA01E",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    className="sa-input block w-full"
                    type={show ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    onKeyDown={onKey}
                    style={{
                      borderRadius: 12,
                      padding: "13px 48px 13px 16px",
                      fontSize: 14,
                      color: "#fff",
                      outline: "none",
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      background: focused === "password" ? "rgba(255,160,30,0.06)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${focused === "password" ? "rgba(255,160,30,0.42)" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: focused === "password" ? "0 0 0 3px rgba(255,100,50,0.10)" : "none",
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center"
                    style={{
                      color: "rgba(255,255,255,0.32)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-xl px-4 py-3 text-xs font-semibold"
                    style={{
                      background: "rgba(239,68,68,0.10)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#f87171",
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit — desktop */}
              <motion.button
                type="button"
                className="sa-btn hidden lg:flex w-full items-center justify-center gap-2"
                whileTap={{ scale: 0.97 }}
                onClick={handleLogin}
                disabled={loading}
                style={{
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background: loading
                    ? "rgba(255,160,30,0.42)"
                    : "linear-gradient(135deg,#FFA01E,#FF6432)",
                  color: "#000",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(255,100,50,0.30)",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {submitContent}
              </motion.button>
            </div>

            <motion.p
              className="mt-5 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}
            >
              Secure login · SSL encrypted · Powered by Directus
            </motion.p>
          </motion.div>
        </div>

        {/* ══ MOBILE sticky CTA ═════════════════════════════════════════════ */}
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 p-4"
          style={{
            background: "rgba(8,12,20,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            zIndex: 50,
          }}
        >
          <motion.button
            type="button"
            className="sa-btn w-full flex items-center justify-center gap-2"
            whileTap={{ scale: 0.97 }}
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: "15px",
              borderRadius: 13,
              border: "none",
              background: loading
                ? "rgba(255,160,30,0.42)"
                : "linear-gradient(135deg,#FFA01E,#FF6432)",
              color: "#000",
              fontFamily: "'Barlow', sans-serif",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.08em",
              boxShadow: loading ? "none" : "0 8px 22px rgba(255,100,50,0.30)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {submitContent}
          </motion.button>
        </div>

      </div>
    </>
  );
};