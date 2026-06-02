/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Factory,
  Users,
  Package,
  Wrench,
  Shield,
  BarChart3,
  Calendar,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { login, loginError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      const redirectTo = searchParams.get("redirect");
      router.push(redirectTo || "/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#1a1a3e] to-[#24243e]">
        {/* Animated orbs */}
        <div
          className="absolute h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            top: "10%",
            left: "-10%",
          }}
        />
        <div
          className="absolute h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * 0.01}px)`,
            bottom: "10%",
            right: "-5%",
          }}
        />
        <div
          className="absolute h-[400px] w-[400px] rounded-full bg-cyan-600/15 blur-[100px] transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * -0.02}px)`,
            top: "40%",
            right: "20%",
          }}
        />
      </div>

      {/* Grid Pattern Overlay - Fixed SVG Data URL */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile: Form on Top */}
        <div className="w-full max-w-md lg:hidden">
          <LoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            isLoading={isLoading}
            loginError={loginError}
            handleSubmit={handleSubmit}
          />
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden w-full max-w-7xl grid-cols-1 gap-12 lg:grid lg:grid-cols-2">
          {/* LEFT SIDE - Features */}
          <div className="flex flex-col justify-center text-white">
            <div className="mb-10">
              <div className="mb-6 inline-flex animate-float items-center gap-3 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 backdrop-blur-sm">
                <Factory className="h-5 w-5 text-purple-400" />
                <span className="text-sm font-medium tracking-wide">
                  Textile Factory Management System
                </span>
              </div>

              <h1 className="mb-6 text-5xl font-bold leading-tight lg:text-6xl xl:text-7xl">
                Smart Textile
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  Factory Platform
                </span>
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-gray-300 lg:text-lg">
                Streamline production, inventory, maintenance, quality
                assurance, workforce management and operational reporting from
                one centralized platform.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="mb-10 grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<Users className="h-6 w-6 text-purple-400" />}
                title="Workforce Management"
                description="Employee attendance, leave requests, shifts, overtime and training."
                gradient="from-purple-500/20 to-transparent"
              />
              <FeatureCard
                icon={<Package className="h-6 w-6 text-green-400" />}
                title="Inventory Control"
                description="Track materials, stock levels, requisitions and warehouse activities."
                gradient="from-green-500/20 to-transparent"
              />
              <FeatureCard
                icon={<Wrench className="h-6 w-6 text-orange-400" />}
                title="Maintenance"
                description="Manage machine maintenance, failures and spare parts."
                gradient="from-orange-500/20 to-transparent"
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6 text-red-400" />}
                title="Quality Assurance"
                description="Quality inspections, audits and process improvement workflows."
                gradient="from-red-500/20 to-transparent"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard value="24/7" label="Monitoring" color="purple" />
              <StatCard value="100%" label="Visibility" color="green" />
              <StatCard
                icon={<BarChart3 className="h-7 w-7 text-cyan-400" />}
                label="Analytics"
                color="cyan"
              />
            </div>
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="flex items-center justify-center">
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              isLoading={isLoading}
              loginError={loginError}
              handleSubmit={handleSubmit}
              formattedDate={formattedDate}
            />
          </div>
        </div>

        {/* Mobile: Features below form */}
        <div className="mt-8 w-full max-w-md lg:hidden">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-300">{formattedDate}</span>
            </div>
            <h2 className="mb-4 text-xl font-bold text-white">
              Smart Textile Factory Platform
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <FeatureCardMobile icon={<Users size={18} />} title="Workforce" />
              <FeatureCardMobile
                icon={<Package size={18} />}
                title="Inventory"
              />
              <FeatureCardMobile
                icon={<Wrench size={18} />}
                title="Maintenance"
              />
              <FeatureCardMobile icon={<Shield size={18} />} title="Quality" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, gradient }: any) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} bg-white/5 p-5 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/20 hover:bg-white/10`}
    >
      <div className="relative z-10">
        <div className="mb-3">{icon}</div>
        <h3 className="mb-2 font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ value, label, icon, color }: any) {
  const colors = {
    purple: "border-purple-500/20 bg-purple-500/10 text-purple-400",
    green: "border-green-500/20 bg-green-500/10 text-green-400",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-400",
  };
  return (
    <div
      className={`rounded-2xl border p-4 text-center backdrop-blur-sm ${colors[color].split(" ")[0]} ${colors[color].split(" ")[1]}`}
    >
      {icon ? (
        <div className="flex justify-center">{icon}</div>
      ) : (
        <div className={`text-2xl font-bold ${colors[color].split(" ")[2]}`}>
          {value}
        </div>
      )}
      <div className="mt-1 text-xs text-gray-400">{label}</div>
    </div>
  );
}

// Mobile Feature Card
function FeatureCardMobile({ icon, title }: any) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-purple-400">{icon}</div>
      <span className="text-sm text-white">{title}</span>
    </div>
  );
}

// Login Form Component
function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  loginError,
  handleSubmit,
  formattedDate,
}: any) {
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 px-6 py-10 text-center sm:px-8">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
              <Factory className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
            <p className="mt-2 text-blue-100">Sign in to continue</p>
            {formattedDate && (
              <div className="mt-3 flex items-center justify-center gap-1 text-xs text-white/70">
                <Calendar size={12} />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@factory.com"
                required
                className="w-full rounded-xl border border-gray-700 bg-slate-900/50 px-4 py-3 text-white outline-none transition-all duration-200 placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-gray-700 bg-slate-900/50 px-4 py-3 pr-12 text-white outline-none transition-all duration-200 placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 py-3.5 font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </span>
            </button>
          </form>

          {loginError && (
            <div className="mt-5 animate-shake rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-400 backdrop-blur-sm">
              {loginError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Textile Factory Management System
          </p>
        </div>
      </div>
    </div>
  );
}
