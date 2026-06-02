/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx - Killer UI Landing Page
"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  Factory,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Package,
  Wrench,
  BarChart3,
  Zap,
  Award,
  Globe,
  Star,
  ChevronRight,
  Play,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Rocket,
  Lock,
  Headphones,
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-3000"></div>
      </div>

      {/* Navbar */}
      <nav
        className={`fixed top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="group relative flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-xl bg-indigo-400 opacity-20"></div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                  <Factory className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                TextileFlow
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-10">
              {["Features", "Solutions", "Pricing", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="group relative text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex md:items-center md:gap-4">
              {isLoading ? (
                <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
              ) : user ? (
                <Link
                  href="/dashboard"
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
                >
                  <span className="relative z-10">Dashboard</span>
                  <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 group-hover:translate-x-0"></div>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-6 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="group relative overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
                  >
                    <span className="relative z-10">Get Started</span>
                    <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-300 group-hover:translate-x-0"></div>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-xl shadow-2xl md:hidden animate-slideDown">
            <div className="space-y-2 px-4 py-6">
              {["Features", "Solutions", "Pricing", "Contact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <div className="mt-6 flex gap-3 px-4 pt-4">
                {!user && (
                  <>
                    <Link
                      href="/login"
                      className="flex-1 rounded-full border-2 border-indigo-600 py-3 text-center text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/login"
                      className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-center text-sm font-semibold text-white transition hover:scale-105"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
              <div className="relative">
                <div className="mb-8 inline-flex animate-float items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-2 backdrop-blur-sm border border-indigo-200/20">
                  <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    🚀 Powering 500+ Textile Factories
                  </span>
                </div>

                <h1 className="mb-6 text-6xl font-black leading-tight tracking-tight text-slate-900 sm:text-7xl lg:text-8xl">
                  Transform Your{" "}
                  <span className="relative inline-block">
                    <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 blur-2xl opacity-30"></span>
                    <span className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                      Textile Factory
                    </span>
                  </span>
                </h1>

                <p className="mb-10 text-xl text-slate-600 leading-relaxed">
                  Streamline production, inventory, workforce, and quality
                  management in one intelligent platform. Increase efficiency by
                  up to 40% with AI-powered insights.
                </p>

                <div className="mb-12 flex flex-col gap-4 sm:flex-row">
                  {isLoading ? (
                    <div className="h-14 w-44 animate-pulse rounded-full bg-slate-200" />
                  ) : user ? (
                    <Link
                      href="/dashboard"
                      className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-4 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105"
                    >
                      <span className="relative z-10">Go to Dashboard</span>
                      <ArrowRight className="relative z-10 h-5 w-5 transition group-hover:translate-x-1" />
                      <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500 group-hover:translate-x-0"></div>
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-4 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105"
                      >
                        <span className="relative z-10">Start Free Trial</span>
                        <Rocket className="relative z-10 h-5 w-5 transition group-hover:translate-x-1" />
                        <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500 group-hover:translate-x-0"></div>
                      </Link>
                      <Link
                        href="#demo"
                        className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-indigo-200 bg-white/50 px-10 py-4 text-lg font-bold text-indigo-600 backdrop-blur-sm transition-all hover:border-indigo-600 hover:bg-indigo-50"
                      >
                        <Play className="h-5 w-5" />
                        Watch Demo
                      </Link>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      No credit card required
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      14-day free trial
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                      <Lock className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Cancel anytime
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Animated Stats */}
            <div className="relative">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
              <div className="relative grid gap-6 animate-float-slow">
                <div className="grid grid-cols-2 gap-6">
                  <StatCard
                    icon={<TrendingUp className="h-8 w-8" />}
                    value="40%"
                    label="Productivity Increase"
                    color="indigo"
                    delay={0}
                  />
                  <StatCard
                    icon={<Shield className="h-8 w-8" />}
                    value="99.9%"
                    label="Uptime Guarantee"
                    color="green"
                    delay={1}
                  />
                  <StatCard
                    icon={<Clock className="h-8 w-8" />}
                    value="50%"
                    label="Faster Reporting"
                    color="orange"
                    delay={2}
                  />
                  <StatCard
                    icon={<Users className="h-8 w-8" />}
                    value="10k+"
                    label="Active Users"
                    color="purple"
                    delay={3}
                  />
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-8 backdrop-blur-sm border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Award className="h-6 w-6 text-yellow-500" />
                      <span className="font-semibold text-slate-900">
                        Trusted by industry leaders
                      </span>
                    </div>
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 border-2 border-white"
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-slate-600">
                      Rated 4.9/5 by 500+ users
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <div
        id="features"
        className="relative mt-32 bg-gradient-to-b from-white to-slate-50 py-32"
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        ></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 mb-6">
              <Zap className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600">
                Powerful Features
              </span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 sm:text-5xl lg:text-6xl mb-6">
              Everything You Need to
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent block">
                Run Your Factory
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Comprehensive solutions for modern textile manufacturing with
              AI-powered insights
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                index={index}
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"></div>

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="animate-float">
            <Rocket className="mx-auto h-16 w-16 text-white mb-8" />
          </div>
          <h2 className="text-4xl font-black text-white sm:text-5xl lg:text-6xl mb-6">
            Ready to Transform Your Factory?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-indigo-100 mb-10">
            Join hundreds of textile factories that have streamlined their
            operations with TextileFlow. Get started today and see the
            difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user && (
              <>
                <Link
                  href="/login"
                  className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-10 py-4 text-lg font-bold text-indigo-600 shadow-2xl transition-all hover:scale-105 hover:shadow-xl"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-white/30 bg-white/10 px-10 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  Contact Sales
                  <Headphones className="h-5 w-5" />
                </Link>
              </>
            )}
          </div>
          <p className="mt-8 text-sm text-indigo-200">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600">
                  <Factory className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  TextileFlow
                </span>
              </div>
              <p className="text-slate-400 mb-6">
                Smart textile factory management platform for modern
                manufacturing.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: Globe, href: "#" },
                  { icon: Mail, href: "mailto:hello@textileflow.com" },
                  { icon: Phone, href: "tel:+15551234567" },
                ].map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="text-slate-400 transition hover:text-white"
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-white transition"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#demo" className="hover:text-white transition">
                    Demo
                  </Link>
                </li>
                <li>
                  <Link
                    href="#integrations"
                    className="hover:text-white transition"
                  >
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li>
                  <Link href="#about" className="hover:text-white transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#blog" className="hover:text-white transition">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#careers" className="hover:text-white transition">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#press" className="hover:text-white transition">
                    Press Kit
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>hello@textileflow.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>San Francisco, CA</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} TextileFlow. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

// Components
function StatCard({ icon, value, label, color, delay }: any) {
  const colors = {
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };
  const colorClass = colors[color as keyof typeof colors] ?? colors.indigo;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-float-slow`}
      style={{ animationDelay: `${delay * 0.5}s` }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
      ></div>
      <div
        className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${colorClass} p-3 text-white shadow-lg`}
      >
        {icon}
      </div>
      <div
        className={`text-4xl font-black bg-gradient-to-r ${colorClass} bg-clip-text text-transparent mb-2`}
      >
        {value}
      </div>
      <div className="text-sm font-medium text-slate-600">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  index,
  setHoveredCard,
}: any) {
  const colors = {
    indigo: "from-indigo-500 to-indigo-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };
  const colorClass = colors[color as keyof typeof colors] ?? colors.indigo;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-500 hover:shadow-2xl hover:scale-105"
      onMouseEnter={() => setHoveredCard(index)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 transition-opacity duration-500 group-hover:opacity-10`}
      ></div>
      <div
        className={`relative mb-6 inline-flex rounded-xl bg-gradient-to-br ${colorClass} p-3 text-white shadow-lg transition-all duration-500 group-hover:scale-110`}
      >
        {icon}
      </div>
      <h3 className="relative mb-3 text-xl font-bold text-slate-900">
        {title}
      </h3>
      <p className="relative text-slate-600 leading-relaxed">{description}</p>
      <div className="relative mt-4 flex items-center gap-2 text-sm font-semibold text-indigo-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        Learn more <ChevronRight className="h-4 w-4" />
      </div>
    </div>
  );
}

const features = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Workforce Management",
    description:
      "Track attendance, manage shifts, process leaves, and handle payroll with AI-powered scheduling.",
    color: "indigo",
  },
  {
    icon: <Package className="h-6 w-6" />,
    title: "Inventory Control",
    description:
      "Real-time stock tracking, automated reordering, and warehouse optimization with predictive analytics.",
    color: "green",
  },
  {
    icon: <Wrench className="h-6 w-6" />,
    title: "Maintenance",
    description:
      "Schedule preventive maintenance, track repairs, and manage spare parts with IoT integration.",
    color: "orange",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analytics & Reports",
    description:
      "Real-time dashboards and detailed reports with AI-powered insights for data-driven decisions.",
    color: "purple",
  },
];
