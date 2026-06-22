import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  LogOut,
  Send,
  User,
  Shield,
  Search,
  Sparkles,
  BarChart3,
  Calendar,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import imgAssessmentIntegrityLogo from "../../imports/LoginPortalIntegrityOs/assessment_integrity_logo.png";

interface SupportDashboardViewProps {
  user: any;
  session: any;
  handleLogout: () => void;
}

export function SupportDashboardView({ user, session, handleLogout }: SupportDashboardViewProps) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [analytics, setAnalytics] = useState<any>({
    totalTickets: 0,
    activeChats: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    resolutionRate: 100,
    averageResponseTime: "2.4 minutes",
    csatScore: "4.8 / 5.0",
  });
  const [showLogsPermission, setShowLogsPermission] = useState(false);

  const fetchTicketsAndAnalytics = async () => {
    try {
      // Fetch tickets
      const resTickets = await fetch("/api/support/tickets", {
        headers: { "x-user-id": user.id, "x-user-role": "support" }
      });
      if (resTickets.ok) {
        const data = await resTickets.json();
        setTickets(data.data || []);
      }

      // Fetch analytics
      const resAnalytics = await fetch("/api/support/analytics", {
        headers: { "x-user-id": user.id, "x-user-role": "support" }
      });
      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error("Error fetching support data:", err);
    }
  };

  useEffect(() => {
    fetchTicketsAndAnalytics();
    const interval = setInterval(fetchTicketsAndAnalytics, 4000);
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets, selectedTicket]);

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-role": "support"
        },
        body: JSON.stringify({ content: newMessage })
      });

      if (res.ok) {
        setNewMessage("");
        fetchTicketsAndAnalytics();
      } else {
        toast.error("Failed to send message.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string, details?: string) => {
    try {
      const body: Record<string, any> = { status };
      if (status === "active") {
        body.assignedAgentId = user.id;
        body.assignedAgentName = user.name;
      }
      if (status === "resolved") {
        body.resolutionDetails = details || "Resolved by Support Agent";
      }

      const res = await fetch(`/api/support/tickets/${ticketId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-role": "support"
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(`Ticket marked as ${status}`);
        fetchTicketsAndAnalytics();
        if (selectedTicket && selectedTicket.id === ticketId) {
          const updated = { ...selectedTicket, status, ...body };
          setSelectedTicket(updated);
        }
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EEDC] text-[#1a1917] flex font-sans w-full overflow-x-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#ebdcc9] shrink-0 hidden md:flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-[#ebdcc9]/40">
            <img src={imgAssessmentIntegrityLogo} alt="Logo" className="h-8 w-auto object-contain" />
            <h2 className="text-[18px] font-extrabold tracking-tight text-[#1a1917]">IntegrityOS</h2>
          </div>

          <div className="px-6 pt-6 pb-2">
            <span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider">Support Console</span>
          </div>

          <nav className="px-3 space-y-1">
            {[
              { name: "Overview", icon: BarChart3 },
              { name: "Support Queue", icon: MessageSquare },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.name;
              return (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => setActiveTab(link.name)}
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

        <div className="p-4 border-t border-[#ebdcc9]/40">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#6b6861] hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer border border-transparent hover:border-rose-100"
          >
            <LogOut className="size-4.5 text-[#8e8a80]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#ebdcc9] bg-white/70 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <LifeBuoy className="size-5 text-[#c5af8a] animate-spin-slow" />
            <span className="text-[13.5px] font-bold text-[#1a1917]">Support Hub Console</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-[13.5px] font-bold leading-tight text-[#1a1917]">{user.name}</div>
              <div className="text-[11px] font-semibold text-[#8e8a80] leading-none mt-0.5">Support Representative</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#1a1917] border border-[#c5af8a] text-white flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          {activeTab === "Overview" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Support Overview</h1>
                <p className="text-xs text-[#8e8a80]">Manage user communication queues, resolve technical tickets, and monitor satisfaction rates.</p>
              </div>

              {/* Stats cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-[#8e8a80] uppercase tracking-wider">Active Live Chats</span>
                  <div className="text-3xl font-extrabold mt-1 text-emerald-600">{analytics.activeChats}</div>
                  <span className="text-[11.5px] text-[#6b6760] mt-1.5 block">Conversations in progress</span>
                </div>
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-[#8e8a80] uppercase tracking-wider">Pending Tickets</span>
                  <div className="text-3xl font-extrabold mt-1 text-amber-500">{analytics.pendingTickets}</div>
                  <span className="text-[11.5px] text-[#6b6760] mt-1.5 block">Waiting in triage queue</span>
                </div>
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-[#8e8a80] uppercase tracking-wider">CSAT Score</span>
                  <div className="text-3xl font-extrabold mt-1 text-[#c5af8a]">{analytics.csatScore}</div>
                  <span className="text-[11.5px] text-[#6b6760] mt-1.5 block">Average user rating</span>
                </div>
                <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-[#8e8a80] uppercase tracking-wider">Resolution Rate</span>
                  <div className="text-3xl font-extrabold mt-1 text-zinc-800">{analytics.resolutionRate}%</div>
                  <span className="text-[11.5px] text-[#6b6760] mt-1.5 block">Of total requests resolved</span>
                </div>
              </div>

              {/* Recent tickets quick look */}
              <div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm">
                <h3 className="text-base font-bold mb-4">Active Support Queue</h3>
                {tickets.length === 0 ? (
                  <div className="py-10 text-center text-[#8e8a80]">No active requests in support queue.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[#ebdcc9]/50 text-left text-xs font-bold text-[#8e8a80] uppercase">
                          <th className="pb-3">Ref Code</th>
                          <th className="pb-3">User</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Priority</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebdcc9]/30">
                        {tickets.slice(0, 5).map((ticket) => (
                          <tr key={ticket.id} className="hover:bg-[#FAF6EE]/30 transition-colors text-sm">
                            <td className="py-3.5 font-mono font-bold text-[#1a1917]">{ticket.referenceNumber}</td>
                            <td className="py-3.5 font-semibold">{ticket.studentName}</td>
                            <td className="py-3.5 capitalize">{ticket.category.replace("-", " ")}</td>
                            <td className="py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                ticket.priority === "high"
                                  ? "bg-rose-50 border-rose-100 text-rose-600"
                                  : ticket.priority === "medium"
                                  ? "bg-amber-50 border-amber-100 text-amber-600"
                                  : "bg-emerald-50 border-emerald-100 text-emerald-600"
                              }`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3.5 capitalize">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                ticket.status === "resolved"
                                  ? "bg-zinc-50 border-zinc-100 text-zinc-600"
                                  : ticket.status === "active"
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                  : "bg-amber-50 border-amber-100 text-amber-600 animate-pulse"
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setActiveTab("Support Queue");
                                }}
                                className="text-xs font-bold text-white bg-black hover:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-sm transition"
                              >
                                View Chat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[500px]">
              {/* Left Panel: Tickets List */}
              <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm flex flex-col h-full">
                <div className="mb-4">
                  <h2 className="text-lg font-bold tracking-tight">Triage Tickets</h2>
                  <p className="text-xs text-[#8e8a80] mt-0.5">Select a ticket to review context and chat.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {tickets.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#8e8a80]">No active requests.</div>
                  ) : (
                    tickets.map((t) => {
                      const isSelected = selectedTicket && selectedTicket.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#FAF6EE] border-[#c5af8a]"
                              : "bg-white hover:bg-[#FAF6EE]/40 border-[#ebdcc9]/40"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-mono font-bold text-[#8e8a80]">{t.referenceNumber}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border capitalize ${
                              t.status === "resolved"
                                ? "bg-zinc-50 border-zinc-100 text-zinc-500"
                                : t.status === "active"
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : "bg-amber-50 border-amber-100 text-amber-600 animate-pulse"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-[#1a1917] block truncate">{t.studentName}</span>
                          <span className="text-xs text-[#6b6760] block truncate mt-0.5">{t.description}</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-[10px] bg-[#f0ece4] text-[#6b6760] px-2 py-0.5 rounded-md font-semibold">
                              {t.category.replace("-", " ")}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                              t.priority === "high" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Workspace (2 columns on large screens) */}
              <div className="lg:col-span-2 flex flex-col h-full gap-4">
                {selectedTicket ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 flex-1 gap-4 h-full">
                    {/* Chat Panel (col-span-2) */}
                    <div className="md:col-span-2 bg-white border border-[#ebdcc9] rounded-2xl flex flex-col h-full overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-[#ebdcc9]/40 flex justify-between items-center bg-[#FAF6EE]/30">
                        <div>
                          <span className="text-[11px] font-mono font-bold text-[#8e8a80]">{selectedTicket.referenceNumber}</span>
                          <h3 className="text-sm font-bold text-[#1a1917]">{selectedTicket.studentName}</h3>
                        </div>

                        <div className="flex gap-2">
                          {selectedTicket.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(selectedTicket.id, "active")}
                              className="text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition"
                            >
                              Join Chat
                            </button>
                          )}
                          {selectedTicket.status !== "resolved" && (
                            <button
                              type="button"
                              onClick={() => {
                                const details = prompt("Enter resolution details:");
                                if (details !== null) {
                                  handleUpdateStatus(selectedTicket.id, "resolved", details);
                                }
                              }}
                              className="text-xs font-bold bg-black text-white hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF6EE]/15">
                        <div className="rounded-xl p-3 bg-[#FAF6EE]/40 border border-[#ebdcc9]/30 text-xs leading-relaxed text-[#6b6760]">
                          <span className="font-bold text-[#1a1917] block mb-1">Issue Details:</span>
                          {selectedTicket.description}
                        </div>

                        {selectedTicket.messages?.map((msg: any) => {
                          const isSupport = msg.senderRole === "support";
                          const isAI = msg.senderRole === "ai";
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                                isSupport
                                  ? "ml-auto bg-[#1a1917] text-white"
                                  : isAI
                                  ? "bg-amber-50/80 border border-amber-200 text-amber-800"
                                  : "bg-white border border-[#ebdcc9] text-[#1a1917]"
                              }`}
                            >
                              <span className="font-bold block mb-1">
                                {isAI ? "AI Agent" : msg.senderName}
                              </span>
                              <span>{msg.content}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Message Input */}
                      {selectedTicket.status !== "resolved" && (
                        <div className="p-3 border-t border-[#ebdcc9]/40 flex gap-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Type a message to the user..."
                            className="flex-1 bg-[#FAF6EE] border border-[#ebdcc9]/60 rounded-xl px-4 py-2 text-xs placeholder:text-[#a7a297] text-[#1a1917] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSendMessage}
                            className="bg-[#1a1917] text-white p-2 rounded-xl hover:bg-black transition flex items-center justify-center cursor-pointer"
                          >
                            <Send className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Security Context Panel */}
                    <div className="bg-white border border-[#ebdcc9] rounded-2xl p-4 shadow-sm flex flex-col gap-4 overflow-y-auto">
                      <div>
                        <h4 className="text-xs font-bold text-[#8e8a80] uppercase tracking-wider">User Profile</h4>
                        <div className="mt-2 space-y-1.5 text-xs text-[#1a1917]">
                          <p><span className="text-[#8e8a80]">Name:</span> {selectedTicket.studentName}</p>
                          <p><span className="text-[#8e8a80]">Email:</span> {selectedTicket.email}</p>
                          <p><span className="text-[#8e8a80]">Queue Position:</span> #{selectedTicket.queuePosition || "-"}</p>
                          <p><span className="text-[#8e8a80]">Category:</span> <span className="capitalize">{selectedTicket.category.replace("-", " ")}</span></p>
                        </div>
                      </div>

                      <div className="border-t border-[#ebdcc9]/40 pt-3">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-800">
                          <Shield className="size-4 text-[#c5af8a]" />
                          <span>Role-Based Verification</span>
                        </div>
                        <p className="text-[10.5px] leading-relaxed text-[#8e8a80]">
                          Access to proctoring webcam capture logs, tab-switch alerts, and browser logs is restricted. Review user consent credentials below.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setShowLogsPermission(!showLogsPermission);
                            toast.success("Security authorization cleared.");
                          }}
                          className="w-full mt-3 bg-black hover:bg-zinc-800 text-white text-[11px] font-bold py-2 rounded-xl transition"
                        >
                          {showLogsPermission ? "Revoke System Access" : "Verify Clearances"}
                        </button>
                      </div>

                      {showLogsPermission && (
                        <div className="border-t border-[#ebdcc9]/40 pt-3 space-y-2">
                          <h5 className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="size-3.5 text-amber-500" /> Live Assessment Logs
                          </h5>
                          <div className="p-2.5 rounded-lg bg-[#FAF6EE] border border-[#ebdcc9] text-[10px] font-mono leading-relaxed space-y-1">
                            <p className="text-rose-600">[ALERT] Tab Switch Event: 23:42:01</p>
                            <p className="text-rose-600">[ALERT] No Face Detected: 23:42:15</p>
                            <p className="text-[#8e8a80]">[INFO] Network Ping: 23.4 ms</p>
                            <p className="text-[#8e8a80]">[INFO] Webcam verification: Verified</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-[#ebdcc9] rounded-2xl flex-1 flex flex-col items-center justify-center text-center p-8 text-[#8e8a80] shadow-sm">
                    <LifeBuoy className="size-12 mb-3 text-[#ebdcc9] animate-bounce" />
                    <p className="text-sm font-bold">No Ticket Selected</p>
                    <p className="text-xs max-w-xs mt-1">Choose a ticket from the sidebar queue to read conversation details, assign agents, and respond.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
