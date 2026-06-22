import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Video,
  ShieldAlert,
  Sparkles,
  History,
  HelpCircle,
  BookOpen,
  Search,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter,
  Users,
  Send,
  LifeBuoy,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";
import imgAssessmentIntegrityLogo from "../../imports/LoginPortalIntegrityOs/assessment_integrity_logo.png";

interface DashboardViewProps {
  user: any;
  session: any;
  clientInfo: { ip: string; userAgent: string } | null;
  handleLogout: () => void;
  parseUserAgent: (ua?: string) => string;
  onStartAssessment: (id: string) => void;
}

// Chart Data (Velocity Chart)
const WEEKLY_DATA = [
  { name: "Wk 1", score: 82 },
  { name: "Wk 2", score: 85 },
  { name: "Wk 3", score: 88 },
  { name: "Wk 4", score: 92 },
  { name: "Wk 5", score: 98, isCurrent: true },
  { name: "Wk 6", score: 94 },
];

const MONTHLY_DATA = [
  { name: "Jan", score: 80 },
  { name: "Feb", score: 84 },
  { name: "Mar", score: 86 },
  { name: "Apr", score: 90 },
  { name: "May", score: 94, isCurrent: true },
  { name: "Jun", score: 92 },
];

// Radar Profile Data
const RADAR_DATA = [
  { subject: "Focus", A: 90 },
  { subject: "Integrity", A: 98 },
  { subject: "Collaboration", A: 85 },
  { subject: "Consistency", A: 92 },
  { subject: "Accuracy", A: 88 },
  { subject: "Participation", A: 80 },
];

// Upcoming countdown helper
function useCountdown(initialHours: number, initialMinutes: number, initialSeconds: number) {
  const [time, setTime] = useState({
    hours: initialHours,
    minutes: initialMinutes,
    seconds: initialSeconds,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) {
          seconds--;
        } else {
          seconds = 59;
          if (minutes > 0) {
            minutes--;
          } else {
            minutes = 59;
            if (hours > 0) {
              hours--;
            } else {
              // Reset to simulate continuous count
              hours = 2;
              minutes = 45;
              seconds = 12;
            }
          }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return time;
}

export function DashboardView({
  user,
  session,
  clientInfo,
  handleLogout,
  parseUserAgent,
  onStartAssessment,
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly">("weekly");
  const [showHistoryFilter, setShowHistoryFilter] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("All Assessments");
  const [expandHistory, setExpandHistory] = useState(false);
  const [dbAssessments, setDbAssessments] = useState<any[]>([]);
  const [selectedAttemptDetails, setSelectedAttemptDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadAttemptDetails = async (attemptId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/assessments/attempts/${attemptId}`, {
        headers: {
          "x-user-id": user.id,
          "x-user-role": "user"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAttemptDetails(data.data);
      }
    } catch (err) {
      console.error("Failed to load attempt details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if ((activeTab === "Integrity Reports" || activeTab === "AI Insights") && dbAssessments.length > 0) {
      const completed = dbAssessments.filter(ass => ass.attemptStatus === "graded" || ass.attemptStatus === "submitted" || ass.attemptStatus === "Faculty Review Required");
      if (completed.length > 0) {
        // If we don't have a selected attempt details yet, or the current selected is not in the list, load the first one
        if (!selectedAttemptDetails || !completed.some(c => c.attemptId === selectedAttemptDetails.id)) {
          loadAttemptDetails(completed[0].attemptId);
        }
      }
    }
  }, [activeTab, dbAssessments]);

  useEffect(() => {
    const fetchStudentAssessments = async () => {
      try {
        const res = await fetch("/api/assessments", {
          headers: { "x-user-id": user.id, "x-user-role": "user" }
        });
        if (res.ok) {
          const data = await res.json();
          setDbAssessments(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load assessments:", err);
      }
    };
    fetchStudentAssessments();
  }, [user.id]);

  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [activeSupportTicket, setActiveSupportTicket] = useState<any | null>(null);
  const [ticketCategory, setTicketCategory] = useState("technical");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [supportMessage, setSupportMessage] = useState("");

  const fetchStudentTickets = async () => {
    try {
      const res = await fetch("/api/support/tickets", {
        headers: { "x-user-id": user.id, "x-user-role": "user" }
      });
      if (res.ok) {
        const data = await res.json();
        setSupportTickets(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch student support tickets:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "Support") {
      fetchStudentTickets();
      const interval = setInterval(fetchStudentTickets, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, user.id]);

  useEffect(() => {
    if (activeSupportTicket) {
      const updated = supportTickets.find(t => t.id === activeSupportTicket.id);
      if (updated) {
        setActiveSupportTicket(updated);
      }
    }
  }, [supportTickets, activeSupportTicket]);

  const handleSubmitTicket = async () => {
    if (!ticketDescription.trim()) {
      toast.error("Please describe your issue.");
      return;
    }

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-role": "user"
        },
        body: JSON.stringify({
          category: ticketCategory,
          description: ticketDescription,
          priority: ticketPriority
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Support ticket submitted! AI Support is analyzing your issue.");
        setTicketDescription("");
        fetchStudentTickets();
        setActiveSupportTicket(data.data);
      } else {
        toast.error("Failed to submit support ticket.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleSendSupportMessage = async () => {
    if (!activeSupportTicket || !supportMessage.trim()) return;

    try {
      const res = await fetch(`/api/support/tickets/${activeSupportTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-role": "user"
        },
        body: JSON.stringify({ content: supportMessage })
      });

      if (res.ok) {
        setSupportMessage("");
        fetchStudentTickets();
      } else {
        toast.error("Failed to send message.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  // Countdown timer: 2 hours, 45 mins, 12 secs
  const countdown = useCountdown(2, 45, 12);

  const formattedHours = String(countdown.hours).padStart(2, "0");
  const formattedMinutes = String(countdown.minutes).padStart(2, "0");
  const formattedSeconds = String(countdown.seconds).padStart(2, "0");

  const sidebarLinks = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Live Sessions", icon: Video },
    { name: "Integrity Reports", icon: ShieldAlert },
    { name: "AI Insights", icon: Sparkles },
    { name: "History", icon: History },
    { name: "Support", icon: HelpCircle },
    { name: "Documentation", icon: BookOpen },
  ];

  const chartData = chartPeriod === "weekly" ? WEEKLY_DATA : MONTHLY_DATA;

  const academicHistory = [
    { name: "Data Structures Quiz 3", date: "Jun 18, 2026", status: "Secure", score: "92/100" },
    { name: "Database Systems Midterm", date: "Jun 14, 2026", status: "Secure", score: "88/100" },
    { name: "Operating Systems Lab 2", date: "Jun 08, 2026", status: "Secure", score: "95/100" },
    ...(expandHistory
      ? [
          { name: "Computer Networks Assignment 1", date: "May 28, 2026", status: "Secure", score: "90/100" },
          { name: "Discrete Mathematics Quiz 2", date: "May 15, 2026", status: "Secure", score: "85/100" },
        ]
      : []),
  ];

  const handlePrecheck = () => {
    toast.success("System pre-check passed! Webcam, screen-sharing, and environment logs are verified.");
  };

  return (
    <div className="min-h-screen bg-[#F5EEDC] text-[#1a1917] flex font-sans w-full overflow-x-hidden">
      {/* Sidebar Panel */}
      <aside className="w-[260px] bg-white border-r border-[#ebdcc9] shrink-0 hidden md:flex flex-col justify-between select-none">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#ebdcc9]/40">
            <img
              src={imgAssessmentIntegrityLogo}
              alt="IntegrityOS Logo"
              className="h-8 w-auto object-contain"
            />
            <h2 className="text-[18px] font-extrabold tracking-tight text-[#1a1917]">
              IntegrityOS
            </h2>
          </div>

          {/* Sidebar Section Title */}
          <div className="px-6 pt-6 pb-2">
            <span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider">
              Student Workspace
            </span>
          </div>

          {/* Links list */}
          <nav className="px-3 space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.name;
              return (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => {
                    setActiveTab(link.name);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#F5EEDC] text-[#1a1917] font-semibold"
                      : "text-[#6b6760] hover:bg-[#FAF6EE] hover:text-[#1a1917]"
                  }`}
                >
                  <Icon className={`size-4.5 shrink-0 ${isActive ? "text-[#1a1917]" : "text-[#8e8a80]"}`} />
                  {link.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Area - Logout button */}
        <div className="p-4 border-t border-[#ebdcc9]/40">
          <Button
            variant="ghost"
            onClick={() => {
              toast.promise(
                new Promise((resolve) => setTimeout(resolve, 800)),
                {
                  loading: "Logging out...",
                  success: () => {
                    handleLogout();
                    return "Logged out successfully";
                  },
                  error: "Logout failed",
                }
              );
            }}
            className="w-full justify-start gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#6b6760] hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="size-4.5 text-[#8e8a80] group-hover:text-rose-600" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Section */}
        <header className="h-16 border-b border-[#ebdcc9] bg-white/70 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
          {/* Header Left - Search Input */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 size-4 text-[#8e8a80] pointer-events-none" />
              <input
                type="text"
                placeholder="Search assessments, logs, or metrics..."
                className="w-full bg-[#FAF6EE] border border-[#ebdcc9]/60 rounded-xl py-2 pl-10 pr-4 text-[13.5px] placeholder:text-[#a7a297] text-[#1a1917] focus:outline-none focus:border-[#c5af8a] focus:ring-1 focus:ring-[#c5af8a] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Action Buttons */}
            <button
              type="button"
              onClick={() => toast.info("No new alerts.")}
              className="p-2 rounded-xl text-[#6b6760] hover:bg-[#FAF6EE] hover:text-[#1a1917] transition-colors relative cursor-pointer"
            >
              <Bell className="size-5" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-500" />
            </button>
            <button
              type="button"
              onClick={() => toast.info("Settings console for this portal is disabled.")}
              className="p-2 rounded-xl text-[#6b6760] hover:bg-[#FAF6EE] hover:text-[#1a1917] transition-colors cursor-pointer"
            >
              <Settings className="size-5" />
            </button>

            {/* Profile Avatar Widget */}
            <div className="flex items-center gap-3 border-l border-[#ebdcc9] pl-4">
              <div className="text-right hidden sm:block">
                <div className="text-[13.5px] font-bold leading-tight text-[#1a1917]">
                  {user.name || "Student"}
                </div>
                <div className="text-[11px] font-semibold text-[#8e8a80] leading-none mt-0.5">
                  Level 2 Scholar
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#1a1917] border border-[#c5af8a] text-white flex items-center justify-center font-bold text-sm select-none">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {activeTab === "Live Sessions" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Live Secure Sessions</h2>
                <p className="text-xs text-[#8e8a80]">Active proctored exams assigned to your profile at {user.institutionName || "SRM University AP"}.</p>
              </div>

              {/* Institution Assessments */}
              <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)]">
                <div>
                  <h3 className="text-base font-bold text-[#1a1917]">Institution Assessments</h3>
                  <p className="text-xs text-[#8e8a80]">Assessments assigned to your profile at {user.institutionName || "Unlinked University"}</p>
                </div>
                <div className="mt-4 space-y-3">
                  {dbAssessments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8e8a80] border border-dashed rounded-xl">
                      No active assessments available for your institution at this moment.
                    </div>
                  ) : (
                    dbAssessments.map((ass) => {
                      return (
                        <div key={ass.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#FAF6EE]/55 border border-[#ebdcc9]/40 gap-4">
                          <div>
                            <span className="text-sm font-bold text-[#1a1917] block">{ass.title}</span>
                            <span className="text-xs text-[#8e8a80] mt-0.5 block">
                              Duration: {ass.duration} mins • {ass.questionsCount} Questions • Faculty: {ass.facultyName}
                            </span>
                          </div>

                          <div>
                            {ass.attemptStatus === "not_started" && (
                              <button
                                type="button"
                                onClick={() => onStartAssessment(ass.id)}
                                className="bg-[#1a1917] text-white hover:bg-black px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                              >
                                Start Secure Exam
                              </button>
                            )}
                            {ass.attemptStatus === "started" && (
                              <button
                                type="button"
                                onClick={() => onStartAssessment(ass.id)}
                                className="bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer animate-pulse"
                              >
                                Resume Exam
                              </button>
                            )}
                            {ass.attemptStatus === "submitted" && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                Submitted for Evaluation
                              </span>
                            )}
                            {ass.attemptStatus === "graded" && (
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                  Score: {ass.attemptScore} pts
                                </span>
                                <span className="block text-[9px] text-[#8e8a80] mt-1 font-semibold">Integrity Index: {ass.attemptIntegrity}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "Overview" ? (
            <>
              {/* Top Row Grid of 4 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Integrity Score */}
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#8e8a80] uppercase tracking-wider">Integrity Score</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Excellent</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#1a1917]">98</span>
                      <span className="text-sm font-medium text-[#8e8a80]">/100</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-[#FAF6EE] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "98%" }} />
                    </div>
                    <span className="text-[11.5px] text-[#6b6760] mt-2 block">Top 5% of your class cohort</span>
                  </div>
                </div>

                {/* Card 2: Academic GPA */}
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#8e8a80] uppercase tracking-wider">Academic GPA</span>
                      <span className="text-[11px] font-bold text-[#c5af8a] bg-[#fffbf2] px-2 py-0.5 rounded-full border border-[#ebdcc9]">Scholar</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#1a1917]">3.85</span>
                      <span className="text-sm font-medium text-[#8e8a80]">/4.0</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-[#FAF6EE] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#c5af8a] h-full rounded-full" style={{ width: "96.2%" }} />
                    </div>
                    <span className="text-[11.5px] text-[#6b6760] mt-2 block">Ranked in Top 10% of department</span>
                  </div>
                </div>

                {/* Card 3: Attendance */}
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#8e8a80] uppercase tracking-wider">Attendance Rate</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Consistent</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#1a1917]">94.2%</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-[#FAF6EE] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "94.2%" }} />
                    </div>
                    <span className="text-[11.5px] text-[#6b6760] mt-2 block">28/30 Live session sign-ins</span>
                  </div>
                </div>

                {/* Card 4: Completion */}
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold text-[#8e8a80] uppercase tracking-wider">Course Modules</span>
                      <span className="text-[11px] font-bold text-[#6b6760] bg-[#FAF6EE] px-2 py-0.5 rounded-full border border-[#ebdcc9]">On Track</span>
                    </div>
                    <div className="mt-2.5 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#1a1917]">88%</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-[#FAF6EE] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: "88%" }} />
                    </div>
                    <span className="text-[11.5px] text-[#6b6760] mt-2 block">12/14 Core syllabus items complete</span>
                  </div>
                </div>
              </div>

              {/* Main workspace layout grid (split 2:1 column structure) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* COLUMN 1 & 2: LEFT BLOCK (Main metrics & lists) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Institution Assessments */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)]">
                    <div>
                      <h3 className="text-base font-bold text-[#1a1917]">Institution Assessments</h3>
                      <p className="text-xs text-[#8e8a80]">Assessments assigned to your profile at {user.institutionName || "Unlinked University"}</p>
                    </div>
                    <div className="mt-4 space-y-3">
                      {dbAssessments.length === 0 ? (
                        <div className="py-6 text-center text-xs text-[#8e8a80] border border-dashed rounded-xl">
                          No active assessments available for your institution at this moment.
                        </div>
                      ) : (
                        dbAssessments.map((ass) => {
                          return (
                            <div key={ass.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#FAF6EE]/55 border border-[#ebdcc9]/40 gap-4">
                              <div>
                                <span className="text-sm font-bold text-[#1a1917] block">{ass.title}</span>
                                <span className="text-xs text-[#8e8a80] mt-0.5 block">
                                  Duration: {ass.duration} mins • {ass.questionsCount} Questions • Faculty: {ass.facultyName}
                                </span>
                              </div>

                              <div>
                                {ass.attemptStatus === "not_started" && (
                                  <button
                                    type="button"
                                    onClick={() => onStartAssessment(ass.id)}
                                    className="bg-[#1a1917] text-white hover:bg-black px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                                  >
                                    Start Secure Exam
                                  </button>
                                )}
                                {ass.attemptStatus === "started" && (
                                  <button
                                    type="button"
                                    onClick={() => onStartAssessment(ass.id)}
                                    className="bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer animate-pulse"
                                  >
                                    Resume Exam
                                  </button>
                                )}
                                {ass.attemptStatus === "submitted" && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                                    Submitted for Evaluation
                                  </span>
                                )}
                                {ass.attemptStatus === "graded" && (
                                  <div className="text-right">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                      Score: {ass.attemptScore} pts
                                    </span>
                                    <span className="block text-[9px] text-[#8e8a80] mt-1 font-semibold">Integrity Index: {ass.attemptIntegrity}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Performance Velocity BarChart Card */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)]">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-bold text-[#1a1917]">Performance Velocity</h3>
                        <p className="text-xs text-[#8e8a80]">Academic activity and check ratings over time</p>
                      </div>

                      {/* Period Toggle Switch */}
                      <div className="bg-[#FAF6EE] border border-[#ebdcc9]/50 rounded-xl p-1 flex">
                        <button
                          type="button"
                          onClick={() => setChartPeriod("weekly")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            chartPeriod === "weekly"
                              ? "bg-white text-[#1a1917] shadow-sm"
                              : "text-[#8e8a80] hover:text-[#1a1917]"
                          }`}
                        >
                          Weekly
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartPeriod("monthly")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            chartPeriod === "monthly"
                              ? "bg-white text-[#1a1917] shadow-sm"
                              : "text-[#8e8a80] hover:text-[#1a1917]"
                          }`}
                        >
                          Monthly
                        </button>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <XAxis
                            dataKey="name"
                            stroke="#8e8a80"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#8e8a80"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            cursor={{ fill: "#FAF6EE", opacity: 0.5 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-white border border-[#ebdcc9] rounded-xl p-3 shadow-md">
                                    <p className="text-xs font-bold text-[#1a1917]">{payload[0].payload.name}</p>
                                    <p className="text-sm font-extrabold text-[#c5af8a] mt-0.5">
                                      Score: {payload[0].value}%
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="score" radius={[5, 5, 0, 0]} barSize={36}>
                            {chartData.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isCurrent ? "#1a1917" : "#c5af8a"}
                                opacity={entry.isCurrent ? 1.0 : 0.45}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Academic Assessment History Table Card */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)]">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-base font-bold text-[#1a1917]">Academic History</h3>
                        <p className="text-xs text-[#8e8a80]">Historical record of verified exam sessions</p>
                      </div>

                      {/* Dropdown Filters */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowHistoryFilter(!showHistoryFilter)}
                          className="flex items-center gap-2 bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl px-3.5 py-1.5 text-xs font-semibold text-[#6b6760] hover:text-[#1a1917] hover:bg-[#eae6db] transition-colors cursor-pointer"
                        >
                          <Filter className="size-3.5" />
                          <span>{historyFilter}</span>
                          <ChevronDown className="size-3.5" />
                        </button>

                        {showHistoryFilter && (
                          <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-[#ebdcc9] bg-[#fffbf2] shadow-lg z-10">
                            {["All Assessments", "Quizzes Only", "Exams Only"].map((filter) => (
                              <button
                                type="button"
                                onClick={() => {
                                  setHistoryFilter(filter);
                                  setShowHistoryFilter(false);
                                  toast.info(`Filtered history list by: ${filter}`);
                                }}
                                className="w-full px-4 py-2 text-left text-xs text-[#6b6760] hover:bg-[#F5EEDC] hover:text-[#1a1917] transition-colors font-medium first:rounded-t-xl last:rounded-b-xl"
                              >
                                {filter}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Table implementation */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[#ebdcc9]/50 text-left">
                            <th className="pb-3 text-xs font-bold text-[#8e8a80] uppercase tracking-wider">Assessment</th>
                            <th className="pb-3 text-xs font-bold text-[#8e8a80] uppercase tracking-wider">Date</th>
                            <th className="pb-3 text-xs font-bold text-[#8e8a80] uppercase tracking-wider">Integrity</th>
                            <th className="pb-3 text-xs font-bold text-[#8e8a80] uppercase tracking-wider text-right">Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ebdcc9]/30">
                          {academicHistory.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-[#FAF6EE]/30 transition-colors">
                              <td className="py-3.5 text-sm font-bold text-[#1a1917]">{item.name}</td>
                              <td className="py-3.5 text-xs text-[#6b6760]">{item.date}</td>
                              <td className="py-3.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                  <ShieldCheck className="size-3" />
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-sm font-extrabold text-[#1a1917] text-right">{item.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Expand controls */}
                    <div className="mt-4 pt-3 border-t border-[#ebdcc9]/30 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setExpandHistory(!expandHistory)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#c5af8a] hover:text-[#1a1917] transition-colors cursor-pointer"
                      >
                        <span>{expandHistory ? "Collapse History" : "Expand Full History"}</span>
                        <ChevronRight className={`size-4 transition-transform duration-300 ${expandHistory ? "rotate-90" : ""}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUMN 3: RIGHT PANEL (Sidebar actions & notifications) */}
                <div className="space-y-6">
                  {/* Skill Radar Profile card */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)]">
                    <div>
                      <h3 className="text-base font-bold text-[#1a1917]">Radar Profile</h3>
                      <p className="text-xs text-[#8e8a80]">Biometric & behavioral category metrics</p>
                    </div>
                    <div className="h-56 w-full mt-3 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={RADAR_DATA}>
                          <PolarGrid stroke="#ebdcc9" />
                          <PolarAngleAxis dataKey="subject" stroke="#8e8a80" fontSize={11} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#ebdcc9" tick={false} />
                          <Radar
                            name="Student Metrics"
                            dataKey="A"
                            stroke="#c5af8a"
                            fill="#c5af8a"
                            fillOpacity={0.25}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Integrity Copilot Card */}
                  <div className="bg-[#FAF6EE] border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="size-4 text-[#c5af8a]" />
                          <span className="text-xs font-bold text-[#1a1917]">Integrity Copilot</span>
                        </div>
                        {/* Active green status indicator */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-700">Active</span>
                        </div>
                      </div>
                      <p className="text-[12.5px] leading-relaxed text-[#6b6760] mt-3">
                        AI verification Shield has validated your student credentials. Identity checking is running in the background. No anomalies detected.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#ebdcc9]/40 flex justify-end">
                      <button
                        type="button"
                        onClick={() => toast.info("Copilot analyzes webcam logs, page focus, and device metrics to shield examinations.")}
                        className="text-xs font-bold text-[#1a1917] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
                      >
                        <span>Learn Why</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Upcoming Assessment countdown timer Card */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)]">
                    <div>
                      <span className="text-[10px] font-bold text-[#c5af8a] uppercase tracking-wider">Next Up</span>
                      <h3 className="text-base font-bold text-[#1a1917] mt-0.5">Algorithms Midterm</h3>
                      <p className="text-xs text-[#8e8a80] mt-0.5">Prof. Robert Chen • CSE-302</p>
                    </div>

                    {/* Countdown display */}
                    <div className="mt-5 flex items-center justify-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl size-12 flex items-center justify-center text-[18px] font-extrabold text-[#1a1917] font-mono">
                          {formattedHours}
                        </div>
                        <span className="text-[10px] font-bold text-[#8e8a80] mt-1 uppercase">Hrs</span>
                      </div>
                      <span className="text-xl font-bold text-[#ebdcc9] mb-4">:</span>
                      <div className="flex flex-col items-center">
                        <div className="bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl size-12 flex items-center justify-center text-[18px] font-extrabold text-[#1a1917] font-mono">
                          {formattedMinutes}
                        </div>
                        <span className="text-[10px] font-bold text-[#8e8a80] mt-1 uppercase">Min</span>
                      </div>
                      <span className="text-xl font-bold text-[#ebdcc9] mb-4">:</span>
                      <div className="flex flex-col items-center">
                        <div className="bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl size-12 flex items-center justify-center text-[18px] font-extrabold text-[#1a1917] font-mono">
                          {formattedSeconds}
                        </div>
                        <span className="text-[10px] font-bold text-[#8e8a80] mt-1 uppercase">Sec</span>
                      </div>
                    </div>

                    {/* System check / Pre-check Button */}
                    <button
                      type="button"
                      onClick={handlePrecheck}
                      className="w-full mt-6 bg-[#1a1917] text-white hover:bg-black py-2.5 rounded-xl text-xs font-semibold shadow-[0_4px_10px_rgba(26,26,26,0.18)] hover:shadow-[0_6px_16px_rgba(26,26,26,0.24)] transition-all cursor-pointer"
                    >
                      System Precheck
                    </button>
                  </div>

                  {/* Live Groups status list widget */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-[0_4px_20px_rgba(142,126,98,0.04)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-bold text-[#1a1917]">Live Groups</h3>
                        <p className="text-xs text-[#8e8a80]">Online student circles in your cohort</p>
                      </div>
                      <Users className="size-4.5 text-[#8e8a80]" />
                    </div>

                    <div className="space-y-3">
                      {/* Circle 1 */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6EE]/55 border border-[#ebdcc9]/40">
                        <div className="flex items-center gap-2">
                          {/* pulsing dot */}
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-[#1a1917]">Algo-Wizards</span>
                        </div>
                        <span className="text-[10.5px] font-bold text-[#8e8a80]">8 Online</span>
                      </div>

                      {/* Circle 2 */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6EE]/55 border border-[#ebdcc9]/40">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-[#1a1917]">Ethics Debate Circle</span>
                        </div>
                        <span className="text-[10.5px] font-bold text-[#8e8a80]">5 Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === "Support" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Support Center Hub</h2>
                <p className="text-xs text-[#8e8a80]">Get real-time AI assistance, connect with a support representative, or manage your active tickets.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Ticket Triage / Chat Workspace */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {activeSupportTicket ? (
                    <div className="bg-white border border-[#ebdcc9] rounded-2xl flex flex-col h-[520px] overflow-hidden shadow-sm">
                      {/* Header */}
                      <div className="p-4 border-b border-[#ebdcc9]/40 flex justify-between items-center bg-[#FAF6EE]/30">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-[#8e8a80]">{activeSupportTicket.referenceNumber}</span>
                          <h3 className="text-sm font-bold text-[#1a1917]">Support Assistant Chat</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                            activeSupportTicket.status === "resolved"
                              ? "bg-zinc-50 border-zinc-200 text-zinc-500"
                              : activeSupportTicket.status === "active"
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse"
                              : "bg-amber-50 border-amber-100 text-amber-600"
                          }`}>
                            {activeSupportTicket.status}
                          </span>
                        </div>
                      </div>

                      {/* Queue Status / Live Triage */}
                      {activeSupportTicket.status !== "resolved" && (
                        <div className="p-3 border-b border-[#ebdcc9]/30 bg-amber-50/50 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                            <span>Connecting to Support Queue...</span>
                            <span>Queue Position: #{activeSupportTicket.queuePosition || 1}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#8e8a80] font-semibold">
                            <span>Estimated Wait Time: {activeSupportTicket.estimatedWait || 3} mins</span>
                            <span>Assigned: {activeSupportTicket.assignedAgentName || "Waiting for representative"}</span>
                          </div>
                          {/* Pulsing connection bar */}
                          <div className="w-full bg-[#FAF6EE] h-1.5 rounded-full overflow-hidden mt-1 border border-[#ebdcc9]/20">
                            <div className="bg-amber-500 h-full rounded-full animate-pulse" style={{ width: activeSupportTicket.assignedAgentId ? "100%" : "35%" }} />
                          </div>
                        </div>
                      )}

                      {/* Messages Area */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF6EE]/15">
                        <div className="rounded-xl p-3 bg-[#FAF6EE]/50 border border-[#ebdcc9]/30 text-xs text-[#6b6760] leading-relaxed">
                          <span className="font-bold text-[#1a1917] block mb-1">Your Submission Summary:</span>
                          {activeSupportTicket.description}
                        </div>

                        {activeSupportTicket.messages?.map((msg: any) => {
                          const isMe = msg.senderId === user.id;
                          const isAI = msg.senderRole === "ai";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                                isMe
                                  ? "ml-auto bg-[#1a1917] text-white"
                                  : isAI
                                  ? "bg-amber-50/80 border border-amber-200 text-amber-800"
                                  : "bg-white border border-[#ebdcc9] text-[#1a1917]"
                              }`}
                            >
                              <span className="font-bold block mb-1">
                                {isAI ? "AI Assistant" : msg.senderName}
                              </span>
                              <span>{msg.content}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Send input */}
                      {activeSupportTicket.status !== "resolved" && (
                        <div className="p-3 border-t border-[#ebdcc9]/40 flex gap-2">
                          <input
                            type="text"
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendSupportMessage()}
                            placeholder="Type a message or response details..."
                            className="flex-1 bg-[#FAF6EE] border border-[#ebdcc9]/60 rounded-xl px-4 py-2 text-xs placeholder:text-[#a7a297] text-[#1a1917] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSendSupportMessage}
                            className="bg-[#1a1917] text-white p-2 rounded-xl hover:bg-black transition flex items-center justify-center cursor-pointer"
                          >
                            <Send className="size-4" />
                          </button>
                        </div>
                      )}

                      {activeSupportTicket.status === "resolved" && (
                        <div className="p-4 bg-zinc-50 border-t border-[#ebdcc9]/40 text-center flex flex-col items-center justify-center gap-2">
                          <span className="text-xs font-bold text-zinc-600">This conversation has been resolved.</span>
                          <button
                            type="button"
                            onClick={() => setActiveSupportTicket(null)}
                            className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition cursor-pointer"
                          >
                            File New Ticket
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Ticket Submission Form */
                    <div className="bg-white border border-[#ebdcc9] rounded-2xl p-6 shadow-[0_4px_20px_rgba(142,126,98,0.04)] space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-[#1a1917]">Submit Support Request</h3>
                        <p className="text-xs text-[#8e8a80] mt-0.5">Please fill out details to raise a support ticket and connect to our triage queue.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#6b6760]">Support Category</label>
                          <select
                            value={ticketCategory}
                            onChange={(e) => setTicketCategory(e.target.value)}
                            className="h-10 bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl px-3 text-xs outline-none focus:ring-1 focus:ring-[#c5af8a]"
                          >
                            <option value="technical">Technical Assistance</option>
                            <option value="assessment">Assessment Assistance</option>
                            <option value="account-recovery">Account Recovery</option>
                            <option value="integrity-clarifications">Integrity Report Clarification</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#6b6760]">Priority Level</label>
                          <select
                            value={ticketPriority}
                            onChange={(e) => setTicketPriority(e.target.value)}
                            className="h-10 bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl px-3 text-xs outline-none focus:ring-1 focus:ring-[#c5af8a]"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority (Exam Blocker)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-[#6b6760]">Describe your Issue</label>
                          <textarea
                            value={ticketDescription}
                            onChange={(e) => setTicketDescription(e.target.value)}
                            rows={4}
                            placeholder="Explain the technical issue or exam obstacle you've encountered..."
                            className="bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl p-3 text-xs outline-none focus:ring-1 focus:ring-[#c5af8a] placeholder:text-[#a7a297]"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSubmitTicket}
                          className="w-full bg-[#1a1917] text-white hover:bg-black py-2.5 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                        >
                          Submit Support Ticket & Connect AI
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Support Ticket History Tracker */}
                <div className="space-y-4">
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#1a1917]">Ticket Tracker</h4>
                      <p className="text-[11px] text-[#8e8a80] mt-0.5">Manage and track live ticket status and responses.</p>
                    </div>

                    <div className="space-y-2 mt-2">
                      {supportTickets.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#8e8a80] border border-dashed rounded-xl">
                          No historical support tickets filed.
                        </div>
                      ) : (
                        supportTickets.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveSupportTicket(t)}
                            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#FAF6EE]/55 border border-[#ebdcc9]/40 hover:bg-[#FAF6EE] transition cursor-pointer text-left"
                          >
                            <div>
                              <span className="text-[10px] font-mono text-[#8e8a80] block">{t.referenceNumber}</span>
                              <span className="text-xs font-bold text-[#1a1917] truncate max-w-[140px] block mt-0.5 capitalize">{t.category.replace("-", " ")}</span>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                              t.status === "resolved"
                                ? "bg-zinc-50 border-zinc-200 text-zinc-500"
                                : t.status === "active"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600 animate-pulse"
                                : "bg-amber-50 border-amber-100 text-amber-600"
                            }`}>
                              {t.status}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {activeSupportTicket && (
                    <button
                      type="button"
                      onClick={() => setActiveSupportTicket(null)}
                      className="w-full bg-[#FAF6EE] hover:bg-[#eae6db] text-[#1a1917] border border-[#ebdcc9] py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Create Another Ticket
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "Integrity Reports" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Integrity & Environment Reports</h2>
                <p className="text-xs text-[#8e8a80]">Detailed log of security scans, validation telemetry, and flags registered during exams.</p>
              </div>

              {dbAssessments.filter(ass => ass.attemptStatus === "graded" || ass.attemptStatus === "submitted" || ass.attemptStatus === "Faculty Review Required").length === 0 ? (
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-10 text-center text-sm text-[#8e8a80] border-dashed">
                  No completed proctored exams found for your profile. Complete an exam to view your integrity records.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Selector */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm h-fit">
                    <h3 className="text-xs font-bold text-[#8e8a80] uppercase tracking-wider mb-3">Completed Sessions</h3>
                    <div className="space-y-2">
                      {dbAssessments
                        .filter(ass => ass.attemptStatus === "graded" || ass.attemptStatus === "submitted" || ass.attemptStatus === "Faculty Review Required")
                        .map((ass) => {
                          const isSelected = selectedAttemptDetails && selectedAttemptDetails.id === ass.attemptId;
                          return (
                            <button
                              key={ass.id}
                              type="button"
                              onClick={() => loadAttemptDetails(ass.attemptId)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#FAF6EE] border-[#c5af8a]"
                                  : "bg-white hover:bg-[#FAF6EE]/40 border-[#ebdcc9]/40"
                              }`}
                            >
                              <span className="text-xs font-bold text-[#1a1917] block truncate">{ass.title}</span>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                                  ass.attemptStatus === "graded"
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                    : "bg-amber-50 border-amber-100 text-amber-600"
                                }`}>
                                  {ass.attemptStatus === "Faculty Review Required" ? "Under Review" : ass.attemptStatus}
                                </span>
                                <span className="text-[10px] text-[#8e8a80] font-semibold">Score: {ass.attemptScore !== null ? `${ass.attemptScore} pts` : "Pending"}</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Column: Detailed Report */}
                  <div className="lg:col-span-2 space-y-6">
                    {loadingDetails ? (
                      <div className="bg-white border border-[#ebdcc9] rounded-2xl p-10 text-center text-sm text-[#8e8a80]">
                        Loading detailed proctor reports...
                      </div>
                    ) : selectedAttemptDetails ? (
                      <div className="space-y-6">
                        {/* Summary Header */}
                        <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs text-[#8e8a80]">Security Telemetry For:</span>
                              <h3 className="text-lg font-bold text-[#1a1917] mt-0.5">{selectedAttemptDetails.assessment?.title}</h3>
                              <p className="text-xs text-[#8e8a80] mt-1">Submitted at: {selectedAttemptDetails.submittedAt ? new Date(selectedAttemptDetails.submittedAt).toLocaleString() : "N/A"}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
                              selectedAttemptDetails.status === "graded"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-amber-50 border-amber-200 text-amber-700"
                            }`}>
                              {selectedAttemptDetails.status === "Faculty Review Required" ? "Review Pending" : selectedAttemptDetails.status}
                            </span>
                          </div>
                        </div>

                        {/* KPI Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm text-center">
                            <span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">Integrity Index</span>
                            <span className={`text-2xl font-extrabold block mt-1 ${
                              selectedAttemptDetails.integrityScore >= 90
                                ? "text-emerald-600"
                                : selectedAttemptDetails.integrityScore >= 75
                                ? "text-amber-500"
                                : "text-rose-600"
                            }`}>
                              {selectedAttemptDetails.integrityScore}%
                            </span>
                          </div>
                          <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm text-center">
                            <span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">Logged Flags</span>
                            <span className="text-2xl font-extrabold block mt-1 text-[#1a1917]">
                              {selectedAttemptDetails.violations?.length || 0} Alert(s)
                            </span>
                          </div>
                          <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm text-center">
                            <span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">Biometrics Clearance</span>
                            <span className="text-xs font-bold block mt-2 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              Identity Cleared
                            </span>
                          </div>
                          <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm text-center">
                            <span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">Proctor Quality</span>
                            <span className="text-xs font-bold block mt-2 text-[#c5af8a] bg-[#fffbf2] px-2 py-0.5 rounded-full border border-[#ebdcc9]">
                              High Security
                            </span>
                          </div>
                        </div>

                        {/* Violations Log Timeline */}
                        <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2 text-zinc-800">
                            <ShieldAlert className="size-4 text-zinc-700" />
                            <span>Chronological Anomaly Log</span>
                          </h3>
                          {(!selectedAttemptDetails.violations || selectedAttemptDetails.violations.length === 0) ? (
                            <div className="py-6 text-center text-xs text-emerald-600 font-semibold bg-emerald-50/50 border border-emerald-100 rounded-xl">
                              ✔ No security anomalies logged during this session. Excellent focus compliance.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {selectedAttemptDetails.violations.map((v: any, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50/65 transition text-xs">
                                  <div className="mt-0.5">
                                    {v.severity === "high" ? (
                                      <span className="flex size-2.5 rounded-full bg-rose-500 animate-pulse" />
                                    ) : v.severity === "medium" ? (
                                      <span className="flex size-2.5 rounded-full bg-amber-500" />
                                    ) : (
                                      <span className="flex size-2.5 rounded-full bg-blue-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold text-[#1a1917] capitalize">{v.type.replace("-", " ")}</span>
                                      <span className="text-[10px] text-zinc-400 font-mono">{new Date(v.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-zinc-600 leading-relaxed">{v.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Environment Configurations */}
                        <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-3">
                          <h3 className="text-sm font-bold border-b pb-2 text-zinc-800">Active Proctor Configs</h3>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF6EE]/40 border border-[#ebdcc9]/20">
                              <span className="text-zinc-500 font-medium">Webcam Shield</span>
                              <span className="font-bold text-emerald-600">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF6EE]/40 border border-[#ebdcc9]/20">
                              <span className="text-zinc-500 font-medium">Browser Lockdown</span>
                              <span className="font-bold text-emerald-600">Locked</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF6EE]/40 border border-[#ebdcc9]/20">
                              <span className="text-zinc-500 font-medium">Gaze Tracking</span>
                              <span className="font-bold text-emerald-600">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#FAF6EE]/40 border border-[#ebdcc9]/20">
                              <span className="text-zinc-500 font-medium">Tab Switch Guard</span>
                              <span className="font-bold text-emerald-600">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-[#ebdcc9] rounded-2xl p-10 text-center text-sm text-[#8e8a80]">
                        Select a completed exam from the sidebar to load proctor reports.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "AI Insights" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">AI Grading & Feedback Insights</h2>
                <p className="text-xs text-[#8e8a80]">Review question-by-question evaluations, grading confidence scores, and detailed AI feedback.</p>
              </div>

              {dbAssessments.filter(ass => ass.attemptStatus === "graded" || ass.attemptStatus === "submitted" || ass.attemptStatus === "Faculty Review Required").length === 0 ? (
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-10 text-center text-sm text-[#8e8a80] border-dashed">
                  No completed proctored exams found for your profile. Complete an exam to view AI evaluations.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Selector */}
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm h-fit">
                    <h3 className="text-xs font-bold text-[#8e8a80] uppercase tracking-wider mb-3">Completed Sessions</h3>
                    <div className="space-y-2">
                      {dbAssessments
                        .filter(ass => ass.attemptStatus === "graded" || ass.attemptStatus === "submitted" || ass.attemptStatus === "Faculty Review Required")
                        .map((ass) => {
                          const isSelected = selectedAttemptDetails && selectedAttemptDetails.id === ass.attemptId;
                          return (
                            <button
                              key={ass.id}
                              type="button"
                              onClick={() => loadAttemptDetails(ass.attemptId)}
                              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#FAF6EE] border-[#c5af8a]"
                                  : "bg-white hover:bg-[#FAF6EE]/40 border-[#ebdcc9]/40"
                              }`}
                            >
                              <span className="text-xs font-bold text-[#1a1917] block truncate">{ass.title}</span>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                                  ass.attemptStatus === "graded"
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                    : "bg-amber-50 border-amber-100 text-amber-600"
                                }`}>
                                  {ass.attemptStatus === "Faculty Review Required" ? "Under Review" : ass.attemptStatus}
                                </span>
                                <span className="text-[10px] text-[#8e8a80] font-semibold">Score: {ass.attemptScore !== null ? `${ass.attemptScore} pts` : "Pending"}</span>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Column: Detailed AI Insights */}
                  <div className="lg:col-span-2 space-y-6">
                    {loadingDetails ? (
                      <div className="bg-white border border-[#ebdcc9] rounded-2xl p-10 text-center text-sm text-[#8e8a80]">
                        Loading AI evaluation reports...
                      </div>
                    ) : selectedAttemptDetails ? (
                      <div className="space-y-6">
                        {/* Summary Header */}
                        <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                          <div>
                            <span className="text-xs text-[#8e8a80]">AI Evaluation Details:</span>
                            <h3 className="text-lg font-bold text-[#1a1917] mt-0.5">{selectedAttemptDetails.assessment?.title}</h3>
                            <p className="text-xs text-[#8e8a80] mt-1">Status: <span className="font-semibold text-emerald-600 capitalize">{selectedAttemptDetails.status}</span></p>
                          </div>
                          {selectedAttemptDetails.score !== null && (
                            <div className="bg-[#FAF6EE] border border-[#ebdcc9] rounded-xl px-5 py-3 text-center sm:text-right">
                              <span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">Final Mark</span>
                              <span className="text-xl font-extrabold text-[#1a1917]">{selectedAttemptDetails.score} pts</span>
                            </div>
                          )}
                        </div>

                        {/* Questions list */}
                        {(!selectedAttemptDetails.answers || selectedAttemptDetails.answers.length === 0) ? (
                          <div className="bg-white border border-[#ebdcc9] rounded-2xl p-6 text-center text-xs text-[#8e8a80]">
                            No answer logs found for this attempt.
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {selectedAttemptDetails.answers.map((a: any, idx: number) => {
                              let aiEvalDetails = null;
                              if (a.aiEvaluation) {
                                try {
                                  aiEvalDetails = JSON.parse(a.aiEvaluation);
                                } catch (e) {}
                              }
                              return (
                                <div key={a.id} className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
                                  <div className="flex justify-between items-start border-b pb-3">
                                    <div className="flex items-center gap-2.5">
                                      <span className="size-6 bg-zinc-950 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                        Q{idx + 1}
                                      </span>
                                      <span className="text-xs font-semibold text-zinc-500 capitalize">Type: {a.question?.type}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-xs font-bold text-emerald-600">
                                        Grade: {a.manualGrade !== null ? a.manualGrade : (a.aiGrade || 0)} / {a.question?.points || 0} pts
                                      </span>
                                      {a.overrideStatus !== "none" && (
                                        <span className="block text-[8px] font-bold text-amber-600 bg-amber-50 px-1 rounded border border-amber-100 mt-0.5">
                                          Faculty Override
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="text-xs font-bold text-[#8e8a80] block">Question Text:</span>
                                    <p className="text-sm font-semibold text-[#1a1917] bg-neutral-50/50 p-3 rounded-xl border border-neutral-100">{a.question?.text}</p>
                                  </div>

                                  <div className="space-y-1.5">
                                    <span className="text-xs font-bold text-[#8e8a80] block">Your Response:</span>
                                    <pre className="text-xs bg-[#FAF6EE]/55 border border-[#ebdcc9]/40 rounded-xl p-3 font-mono text-[#1a1917] whitespace-pre-wrap">{a.response}</pre>
                                  </div>

                                  {a.question?.correctAnswer && (
                                    <div className="space-y-1.5">
                                      <span className="text-xs font-bold text-[#8e8a80] block">Reference Answer:</span>
                                      <p className="text-xs text-zinc-600 bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-3">{a.question.correctAnswer}</p>
                                    </div>
                                  )}

                                  {/* AI evaluation metrics */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                    {a.aiConfidence !== null && (
                                      <div className="p-3 bg-neutral-50 rounded-xl border text-xs">
                                        <span className="text-[#8e8a80] font-semibold block">AI Grading Confidence</span>
                                        <span className="text-sm font-bold text-[#1a1917] mt-1 block">{(a.aiConfidence * 100).toFixed(0)}% Reliability</span>
                                      </div>
                                    )}
                                    {aiEvalDetails && (
                                      <div className="p-3 bg-neutral-50 rounded-xl border text-xs">
                                        <span className="text-[#8e8a80] font-semibold block">Evaluation Reasoning</span>
                                        <span className="text-[11px] text-zinc-600 mt-1 block leading-relaxed">{aiEvalDetails.reasoning || "Matched criteria standards."}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Faculty comments */}
                                  {a.feedback && (
                                    <div className="bg-[#FAF6EE] border border-[#c5af8a]/40 rounded-xl p-3.5 text-xs text-[#1a1917] leading-relaxed">
                                      <span className="font-bold block mb-1">Faculty Evaluator Feedback:</span>
                                      "{a.feedback}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white border border-[#ebdcc9] rounded-2xl p-10 text-center text-sm text-[#8e8a80]">
                        Select a completed exam from the sidebar to view evaluation insights.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "History" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Exam Verification History</h2>
                <p className="text-xs text-[#8e8a80]">Historical ledger of proctored assessment sessions and verified scorecards.</p>
              </div>

              <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm">
                {dbAssessments.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#8e8a80] border border-dashed rounded-xl">
                    No proctored exam history recorded.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebdcc9]/50 text-left text-xs font-bold text-[#8e8a80] uppercase">
                          <th className="pb-3">Assessment Title</th>
                          <th className="pb-3">Session Status</th>
                          <th className="pb-3">Duration</th>
                          <th className="pb-3">Integrity Score</th>
                          <th className="pb-3">Final Score</th>
                          <th className="pb-3 text-right">Reports</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebdcc9]/30">
                        {dbAssessments.map((ass) => (
                          <tr key={ass.id} className="hover:bg-[#FAF6EE]/30 transition-colors text-sm">
                            <td className="py-4 font-bold text-[#1a1917]">{ass.title}</td>
                            <td className="py-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                ass.attemptStatus === "graded"
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                  : ass.attemptStatus === "Faculty Review Required"
                                  ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse"
                                  : ass.attemptStatus === "started"
                                  ? "bg-amber-50 border-amber-100 text-amber-600"
                                  : "bg-zinc-50 border-zinc-100 text-zinc-500"
                              }`}>
                                {ass.attemptStatus === "Faculty Review Required" ? "Under Review" : ass.attemptStatus.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-4 text-xs font-semibold text-zinc-500">{ass.duration} mins</td>
                            <td className="py-4 font-bold">
                              {ass.attemptIntegrity !== null ? (
                                <span className={ass.attemptIntegrity >= 90 ? "text-emerald-600" : "text-amber-600"}>
                                  {ass.attemptIntegrity}%
                                </span>
                              ) : (
                                <span className="text-zinc-400">-</span>
                              )}
                            </td>
                            <td className="py-4 font-extrabold text-[#1a1917]">
                              {ass.attemptScore !== null ? `${ass.attemptScore} pts` : <span className="text-zinc-400 font-normal">Pending</span>}
                            </td>
                            <td className="py-4 text-right">
                              {ass.attemptId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    loadAttemptDetails(ass.attemptId);
                                    setActiveTab("Integrity Reports");
                                  }}
                                  className="text-xs font-bold text-[#c5af8a] hover:text-black hover:underline cursor-pointer bg-transparent border-none"
                                >
                                  View Audit Log
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "Documentation" ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Honor Code & Platform Documentation</h2>
                <p className="text-xs text-[#8e8a80]">Review proctoring rules, integrity tracking explanations, and false-flag appeal guidelines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-zinc-800">1. Proctoring System Checks</h3>
                  <div className="space-y-2.5 text-xs text-zinc-650">
                    <p className="leading-relaxed">
                      <strong className="text-zinc-800">Window Focus / Tab-Switch Detection:</strong>
                      <br />
                      The browser environment runs in an isolated tab session. Switching tabs, opening browser developer tools, or minimizing the active exam window records immediate validation alarms.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-zinc-800">Gaze landmarks mapping:</strong>
                      <br />
                      Webcam gaze tracking tracks face orientation vector checks. Continuous gaze deviations from monitor layout boundaries for more than 5 seconds are logged.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-zinc-800">2. Autonomous AI Evaluations</h3>
                  <div className="space-y-2.5 text-xs text-zinc-650">
                    <p className="leading-relaxed">
                      <strong className="text-zinc-800">Semantic Matching:</strong>
                      <br />
                      For descriptive and coding answers, response embeddings are compared against reference answers for content validation.
                    </p>
                    <p className="leading-relaxed">
                      <strong className="text-zinc-800">Faculty Overrides:</strong>
                      <br />
                      Instructors review flagged responses or low-confidence AI grades. In case of anomalies, instructors override ratings manually, which updates immutable logs.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-sm font-extrabold text-zinc-800">3. Student Appeals & Clearances</h3>
                  <div className="space-y-2 text-xs text-zinc-650">
                    <p className="leading-relaxed">
                      If you receive a focus check warning due to hardware calibration anomalies (e.g. ultra-wide layouts), please raise a support ticket under the <strong className="text-zinc-800">Support Center</strong> tab.
                    </p>
                    <p className="leading-relaxed">
                      Our live support representatives can review proctor feeds and coordinate clearance updates directly with your faculty evaluator.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-800">4. Privacy Guarantee</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed mt-2">
                      IntegrityOS compiles validation tracking only during active examination windows. No video, audio, or desktop stream feeds are stored beyond validation completion times. All biometric data remains completely role-permission controlled.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success("Honor code acknowledgement cleared.")}
                    className="w-full bg-zinc-950 text-white hover:bg-black py-2 rounded-xl text-xs font-semibold mt-4 transition cursor-pointer"
                  >
                    Acknowledge Guidelines
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#ebdcc9] rounded-2xl p-10 text-center text-sm text-[#8e8a80] shadow-sm">
              <span className="text-lg font-bold block mb-2">{activeTab}</span>
              This section is a visual simulation layout for testing proctor dashboards.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
