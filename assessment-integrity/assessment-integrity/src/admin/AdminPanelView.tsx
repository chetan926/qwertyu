import React, { useState, useEffect } from "react";
import {
	Shield,
	Search,
	Power,
	Trash2,
	History,
	Clock,
	AlertTriangle,
	ShieldAlert,
	RotateCw,
	LogOut,
	Users,
	Database,
	Server,
	Cpu,
	Activity,
	Eye,
	FileText,
	CheckCircle,
	Sliders,
	MessageSquare,
	AlertCircle,
	Key,
	Lock,
	Check,
	X
} from "lucide-react";
import { Button } from "../app/components/ui/button";
import { Input } from "../app/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "../app/components/ui/dialog";

interface AdminPanelViewProps {
	user: any;
	handleBack: () => void;
	parseUserAgent: (ua?: string) => string;
}

export function AdminPanelView({ user, handleBack, parseUserAgent }: AdminPanelViewProps) {
	const [activeTab, setActiveTab] = useState<
		| "overview"
		| "users"
		| "faculty"
		| "assessments"
		| "live"
		| "agents"
		| "database"
		| "support"
		| "audit"
		| "settings"
	>("overview");

	// State for directories
	const [users, setUsers] = useState<any[]>([]);
	const [assessments, setAssessments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// Diagnostic & System States
	const [healthMetrics, setHealthMetrics] = useState<any>(null);
	const [agentStatus, setAgentStatus] = useState<any[]>([]);
	const [auditLogs, setAuditLogs] = useState<any>({ adminLogs: [], selfHealingLogs: [] });
	const [platformSettings, setPlatformSettings] = useState<any>(null);

	// Action modals
	const [selectedUserForLogs, setSelectedUserForLogs] = useState<any | null>(null);
	const [userLogs, setUserLogs] = useState<any[]>([]);
	const [loadingUserLogs, setLoadingUserLogs] = useState(false);

	const [selectedUserForTempSuspend, setSelectedUserForTempSuspend] = useState<any | null>(null);
	const [tempHours, setTempHours] = useState<number>(24);
	
	const [selectedUserForPasswordReset, setSelectedUserForPasswordReset] = useState<any | null>(null);
	const [newPassword, setNewPassword] = useState("");
	const [isResettingPassword, setIsResettingPassword] = useState(false);

	const [selectedUserForDelete, setSelectedUserForDelete] = useState<any | null>(null);
	const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

	// Settings inputs states
	const [maintenanceMode, setMaintenanceMode] = useState(false);
	const [emergencyShutdown, setEmergencyShutdown] = useState(false);
	const [evaluationModel, setEvaluationModel] = useState("");
	const [supportModel, setSupportModel] = useState("");
	const [integrityLimit, setIntegrityLimit] = useState(75);
	const [similarityLimit, setSimilarityLimit] = useState(65);

	// Live proctoring simulation items
	const [liveSessions, setLiveSessions] = useState<any[]>([
		{ id: "s-1", studentName: "Charan Balaji", exam: "Algorithms Final Exam", score: 98, status: "Focusing", alerts: 0, cam: true },
		{ id: "s-2", studentName: "Neelam Balaji", exam: "Distributed Systems Midterm", score: 58, status: "Tab Switched", alerts: 2, cam: true },
		{ id: "s-3", studentName: "Aman Varma", exam: "Computer Networks Quiz", score: 85, status: "Looking Away", alerts: 1, cam: true }
	]);

	// Security operations simulated logs (SOC)
	const [socAlerts, setSocAlerts] = useState<any[]>([
		{ id: "soc-1", timestamp: new Date(Date.now() - 60000), type: "API Abuse", msg: "Ip 192.168.1.45 exceeded token verification threshold.", severity: "high" },
		{ id: "soc-2", timestamp: new Date(Date.now() - 300000), type: "Unauthorized Access", msg: "Failed login attempt for email charan@srmap.edu.in", severity: "medium" },
		{ id: "soc-3", timestamp: new Date(Date.now() - 600000), type: "High-Risk Student", msg: "Candidate Charan Balaji flagged with integrity score 55%.", severity: "low" }
	]);

	// Fetch platform configuration
	const fetchSettings = async () => {
		try {
			const res = await fetch("/api/admin/settings");
			if (res.ok) {
				const data = await res.json();
				const state = data.data;
				setPlatformSettings(state);
				setMaintenanceMode(state.maintenanceMode);
				setEmergencyShutdown(state.emergencyShutdown);
				setEvaluationModel(state.aiModelsConfig.evaluationModel);
				setSupportModel(state.aiModelsConfig.supportModel);
				setIntegrityLimit(state.thresholds.integrityWarningLimit);
				setSimilarityLimit(state.thresholds.similarityThreshold);
			}
		} catch (err) {
			console.error("Failed to load platform settings:", err);
		}
	};

	// Fetch users directory
	const fetchUsers = async () => {
		try {
			const res = await fetch("/api/admin/users");
			if (res.ok) {
				const data = await res.json();
				setUsers(data.data || []);
			}
		} catch (err) {
			console.error("Failed to fetch users:", err);
		}
	};

	// Fetch assessments list
	const fetchAssessments = async () => {
		try {
			const res = await fetch("/api/admin/assessments");
			if (res.ok) {
				const data = await res.json();
				setAssessments(data.data || []);
			}
		} catch (err) {
			console.error("Failed to fetch assessments:", err);
		}
	};

	// Fetch diagnostic data
	const fetchDiagnostics = async () => {
		try {
			const [healthRes, agentRes, auditRes] = await Promise.all([
				fetch("/api/admin/health"),
				fetch("/api/admin/agents"),
				fetch("/api/admin/audit-logs")
			]);

			if (healthRes.ok) {
				const h = await healthRes.json();
				setHealthMetrics(h.data);
			}
			if (agentRes.ok) {
				const a = await agentRes.json();
				setAgentStatus(a.data || []);
			}
			if (auditRes.ok) {
				const au = await auditRes.json();
				setAuditLogs(au.data || { adminLogs: [], selfHealingLogs: [] });
			}
		} catch (err) {
			console.error("Diagnostics load error:", err);
		}
	};

	const refreshAllData = async () => {
		setLoading(true);
		await Promise.all([
			fetchSettings(),
			fetchUsers(),
			fetchAssessments(),
			fetchDiagnostics()
		]);
		setLoading(false);
	};

	useEffect(() => {
		refreshAllData();
		// Periodic poll for diagnostics
		const interval = setInterval(fetchDiagnostics, 15000);
		return () => clearInterval(interval);
	}, []);

	// Force toggle platform state settings
	const handleSaveSettings = async (modeUpdates?: Partial<any>) => {
		try {
			const payload = {
				maintenanceMode: modeUpdates?.maintenanceMode !== undefined ? modeUpdates.maintenanceMode : maintenanceMode,
				emergencyShutdown: modeUpdates?.emergencyShutdown !== undefined ? modeUpdates.emergencyShutdown : emergencyShutdown,
				aiModelsConfig: {
					evaluationModel,
					supportModel,
					ocrModel: "Webcam Identity Verification Model v2"
				},
				thresholds: {
					integrityWarningLimit: Number(integrityLimit),
					similarityThreshold: Number(similarityLimit),
					riskEscalationLimit: 80
				}
			};

			const res = await fetch("/api/admin/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				toast.success("Platform settings successfully configured.");
				fetchSettings();
				fetchDiagnostics();
			} else {
				toast.error("Failed to update configurations.");
			}
		} catch {
			toast.error("Connection failed.");
		}
	};

	// Self healing trigger
	const handleSelfHeal = async () => {
		toast.loading("Initiating manual self-healing diagnostics...", { id: "heal-loader" });
		try {
			const res = await fetch("/api/admin/self-heal", { method: "POST" });
			if (res.ok) {
				toast.success("Manual checks completed. Services operational.", { id: "heal-loader" });
				fetchDiagnostics();
			} else {
				toast.error("Self-healing sweep failed.", { id: "heal-loader" });
			}
		} catch {
			toast.error("Network error.", { id: "heal-loader" });
		}
	};

	// Reset password handler
	const handleResetPasswordSubmit = async () => {
		if (!newPassword.trim()) {
			toast.error("Please enter a new password");
			return;
		}
		setIsResettingPassword(true);
		try {
			const res = await fetch(`/api/admin/users/${selectedUserForPasswordReset.id}/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password: newPassword })
			});
			if (res.ok) {
				toast.success(`Password override verified for ${selectedUserForPasswordReset.email}`);
				setSelectedUserForPasswordReset(null);
				setNewPassword("");
				fetchUsers();
			} else {
				const data = await res.json();
				toast.error(data.message || "Failed to reset password.");
			}
		} catch {
			toast.error("An error occurred.");
		} finally {
			setIsResettingPassword(false);
		}
	};

	// Force logout handler
	const handleForceLogout = async (targetUser: any) => {
		try {
			const res = await fetch(`/api/admin/users/${targetUser.id}/force-logout`, { method: "POST" });
			if (res.ok) {
				toast.success(`Sessions revoked for ${targetUser.email}. User has been forced out.`);
			} else {
				toast.error("Failed to revoke session.");
			}
		} catch {
			toast.error("Network error.");
		}
	};

	// Permanent suspend user
	const handleSuspend = async (targetUser: any) => {
		try {
			const res = await fetch(`/api/admin/users/${targetUser.id}/suspend`, { method: "POST" });
			if (res.ok) {
				toast.success(`User ${targetUser.email} has been suspended.`);
				fetchUsers();
			}
		} catch {
			toast.error("Suspension failed.");
		}
	};

	// Unsuspend user
	const handleUnsuspend = async (targetUser: any) => {
		try {
			const res = await fetch(`/api/admin/users/${targetUser.id}/unsuspend`, { method: "POST" });
			if (res.ok) {
				toast.success(`User ${targetUser.email} reactivated.`);
				fetchUsers();
			}
		} catch {
			toast.error("Reactivation failed.");
		}
	};

	// Temp suspend confirm
	const submitTempSuspend = async () => {
		try {
			const res = await fetch(`/api/admin/users/${selectedUserForTempSuspend.id}/temp-suspend`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ durationHours: Number(tempHours) })
			});
			if (res.ok) {
				toast.success(`User temporarily locked for ${tempHours} hours.`);
				setSelectedUserForTempSuspend(null);
				fetchUsers();
			}
		} catch {
			toast.error("Temporary lock failed.");
		}
	};

	// Delete user
	const submitDeleteUser = async () => {
		setIsSubmittingDelete(true);
		try {
			const res = await fetch(`/api/admin/users/${selectedUserForDelete.id}`, { method: "DELETE" });
			if (res.ok) {
				toast.success("User permanently deleted.");
				setSelectedUserForDelete(null);
				fetchUsers();
			}
		} catch {
			toast.error("Deletion failed.");
		} finally {
			setIsSubmittingDelete(false);
		}
	};

	// View User logs modal
	const openLogsModal = async (targetUser: any) => {
		setSelectedUserForLogs(targetUser);
		setLoadingUserLogs(true);
		try {
			const res = await fetch(`/api/admin/users/${targetUser.id}/logs`);
			if (res.ok) {
				const data = await res.json();
				setUserLogs(data.data || []);
			}
		} catch {
			toast.error("Could not fetch logs.");
		} finally {
			setLoadingUserLogs(false);
		}
	};

	// Handle role update
	const handleRoleChange = async (targetUserId: string, newRole: string) => {
		try {
			const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ role: newRole }),
			});
			if (res.ok) {
				toast.success("User role updated successfully.");
				fetchUsers();
			}
		} catch {
			toast.error("Role update failed.");
		}
	};

	// Filter directories search
	const filteredUsers = users.filter((u) => {
		const matchesSearch =
			(u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
			(u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus = statusFilter === "all" || u.status === statusFilter;
		return matchesSearch && matchesStatus;
	});

	const getLoginType = (u: any) => {
		if (u.accounts && u.accounts.length > 0) {
			const providers = u.accounts.map((a: any) => {
				if (a.providerId === "credential") return "Credentials";
				return a.providerId.charAt(0).toUpperCase() + a.providerId.slice(1);
			});
			return providers.join(", ");
		}
		return "Credentials";
	};

	// Status pills coloring helper
	const getOverrideBadgeClass = (status: string) => {
		if (status === "accepted") return "text-emerald-700 bg-emerald-50 border-emerald-200";
		if (status === "modified") return "text-amber-700 bg-amber-50 border-amber-200";
		if (status === "rejected") return "text-rose-700 bg-rose-50 border-rose-200";
		return "text-zinc-600 bg-zinc-50 border-zinc-200";
	};

	return (
		<div className="flex flex-col md:flex-row min-h-screen w-full text-[#1a1917] bg-[#faf9f6]">
			{/* Admin Sidebar Navigation Panel */}
			<aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-[#ebdcc9]/60 flex flex-col justify-between shrink-0 p-5 select-none">
				<div className="flex flex-col gap-6">
					<div className="flex items-center gap-2.5 pb-2 border-b border-[#ebdcc9]/40">
						<Shield className="size-6 text-zinc-950 fill-zinc-950/10" />
						<div className="flex flex-col">
							<span className="font-bold text-sm leading-tight text-[#1a1917]">IntegrityOS Admin</span>
							<span className="text-[10px] text-[#8e8a80] font-bold">System Control Center</span>
						</div>
					</div>

					<nav className="flex flex-col gap-1">
						{[
							{ id: "overview", name: "Overview & Health", icon: Cpu },
							{ id: "users", name: "Users Directory", icon: Users },
							{ id: "faculty", name: "Faculty Governance", icon: CheckCircle },
							{ id: "assessments", name: "Assessments Control", icon: Sliders },
							{ id: "live", name: "Live Monitoring", icon: Eye },
							{ id: "agents", name: "AI Agent Center", icon: Activity },
							{ id: "database", name: "Database Hub", icon: Database },
							{ id: "support", name: "Support Operations", icon: MessageSquare },
							{ id: "audit", name: "Audit & Compliance", icon: FileText },
							{ id: "settings", name: "System Settings", icon: AlertCircle }
						].map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;
							return (
								<button
									key={tab.id}
									onClick={() => setActiveTab(tab.id as any)}
									className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border-none outline-none ${
										isActive
											? "bg-zinc-950 text-white shadow-md"
											: "text-[#6b6861] hover:text-[#1a1917] hover:bg-[#ebdcc9]/25"
									}`}
								>
									<Icon className="size-4 shrink-0" />
									{tab.name}
								</button>
							);
						})}
					</nav>
				</div>

				<div className="flex flex-col gap-3 pt-4 border-t border-[#ebdcc9]/40 mt-6 md:mt-0">
					<div className="flex items-center gap-3">
						<div className="size-8 rounded-full bg-[#1a1917] border border-[#c5af8a] flex items-center justify-center font-bold text-xs text-white">
							SA
						</div>
						<div className="flex flex-col min-w-0">
							<span className="text-xs font-extrabold text-[#1a1917] leading-none">Balaji Admin</span>
							<span className="text-[9px] text-[#8e8a80] font-semibold truncate leading-none mt-1">{user?.email}</span>
						</div>
					</div>
					<Button
						onClick={handleBack}
						variant="ghost"
						className="w-full h-9 px-3 text-xs gap-1.5 border border-rose-500/20 hover:bg-rose-500/10 text-rose-600 rounded-xl font-semibold transition-all duration-300 cursor-pointer justify-center"
					>
						<LogOut className="size-3.5" />
						Logout Panel
					</Button>
				</div>
			</aside>

			{/* Main Workspace Frame */}
			<div className="flex-1 p-6 md:p-10 overflow-y-auto max-w-full">
				<AnimatePresence mode="wait">
					{/* 1. OVERVIEW & HEALTH */}
					{activeTab === "overview" && (
						<motion.div
							key="overview-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="flex items-center justify-between pb-4 border-b border-[#ebdcc9]/40">
								<div>
									<h2 className="text-xl font-extrabold tracking-tight">Overview & Infrastructure Health</h2>
									<p className="text-xs text-[#6b6861]">Real-time hardware utilisation, security event logs, and operational telemetry.</p>
								</div>
								<Button
									onClick={refreshAllData}
									variant="outline"
									className="h-9 px-3 text-xs gap-1.5 border-[#ebdcc9] rounded-xl font-semibold hover:bg-[#faf9f5] cursor-pointer"
								>
									<RotateCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
									Force Sync
								</Button>
							</div>

							{/* Active global status alert badges */}
							{(maintenanceMode || emergencyShutdown) && (
								<div className="grid grid-cols-1 gap-3">
									{emergencyShutdown && (
										<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold animate-pulse shadow">
											<ShieldAlert className="size-5 text-red-600 shrink-0 animate-bounce" />
											<span>CRITICAL: Emergency Shutdown Mode is currently ACTIVE. All non-administrator portals and active exams are immediately suspended.</span>
										</div>
									)}
									{maintenanceMode && !emergencyShutdown && (
										<div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs font-bold shadow">
											<AlertTriangle className="size-5 text-amber-600 shrink-0" />
											<span>WARNING: Maintenance Mode is currently ACTIVE. Normal student examinations and faculty evaluations are blocked.</span>
										</div>
									)}
								</div>
							)}

							{/* Volumetric Health Widgets */}
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								<div className="bg-white border border-[#ebdcc9]/60 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
									<div className="p-3 bg-zinc-50 rounded-xl border">
										<Cpu className="size-6 text-zinc-800" />
									</div>
									<div>
										<span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">CPU Utilisation</span>
										<span className="text-xl font-extrabold">{healthMetrics?.infrastructure?.cpuUsage || 32}%</span>
										<span className="text-[10px] text-zinc-400 block mt-0.5">8 Cores active</span>
									</div>
								</div>

								<div className="bg-white border border-[#ebdcc9]/60 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
									<div className="p-3 bg-zinc-50 rounded-xl border">
										<Server className="size-6 text-zinc-800" />
									</div>
									<div>
										<span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">Memory Usage</span>
										<span className="text-xl font-extrabold">{healthMetrics?.infrastructure?.memoryUsage || 4.2} / 8.0 GB</span>
										<span className="text-[10px] text-zinc-400 block mt-0.5">Scrypt pool allocated</span>
									</div>
								</div>

								<div className="bg-white border border-[#ebdcc9]/60 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
									<div className="p-3 bg-zinc-50 rounded-xl border">
										<Database className="size-6 text-zinc-800" />
									</div>
									<div>
										<span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">DB Connections</span>
										<span className="text-xl font-extrabold">{healthMetrics?.infrastructure?.dbConnections || 14} Pools</span>
										<span className="text-[10px] text-zinc-400 block mt-0.5">PrismaPg adapter latency: {healthMetrics?.infrastructure?.queryTime || 12}ms</span>
									</div>
								</div>

								<div className="bg-white border border-[#ebdcc9]/60 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
									<div className="p-3 bg-zinc-50 rounded-xl border">
										<Activity className="size-6 text-zinc-800" />
									</div>
									<div>
										<span className="text-[10px] font-bold text-[#8e8a80] uppercase tracking-wider block">Uptime Telemetry</span>
										<span className="text-xl font-extrabold text-emerald-600">{healthMetrics?.infrastructure?.networkUptime || "99.99%"}</span>
										<span className="text-[10px] text-zinc-400 block mt-0.5">Uptime: 23d 12h</span>
									</div>
								</div>
							</div>

							{/* SOC Alert Panel (Security Operations Center) */}
							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								<div className="lg:col-span-2 bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
									<div className="flex items-center gap-2 border-b pb-2">
										<ShieldAlert className="size-5 text-zinc-800" />
										<h3 className="text-sm font-extrabold text-zinc-800">Security Operations Center (SOC) Alerts</h3>
									</div>
									<div className="space-y-3.5">
										{socAlerts.map((soc) => (
											<div key={soc.id} className="flex items-start gap-3 p-3 border rounded-xl hover:bg-neutral-50 transition text-xs">
												<AlertCircle className={`size-5 shrink-0 ${soc.severity === "high" ? "text-rose-500" : soc.severity === "medium" ? "text-amber-500" : "text-blue-500"}`} />
												<div className="flex-1 space-y-1">
													<div className="flex justify-between items-center">
														<span className="font-extrabold text-zinc-800">{soc.type}</span>
														<span className="text-[10px] font-mono text-zinc-400">{soc.timestamp.toLocaleTimeString()}</span>
													</div>
													<p className="text-zinc-600">{soc.msg}</p>
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Maintenance Actions Quick Controls */}
								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
									<div>
										<div className="flex items-center gap-2 border-b pb-2">
											<RotateCw className="size-5 text-zinc-800" />
											<h3 className="text-sm font-extrabold text-zinc-800">Self-Healing Management</h3>
										</div>
										<p className="text-xs text-[#8e8a80] leading-relaxed mt-2.5">
											Force a complete systems self-healing loop. The platform will automatically sweep connection pools, clear WS leaks, and test local agent response uptimes.
										</p>
									</div>

									<div className="space-y-2">
										<button
											type="button"
											onClick={handleSelfHeal}
											className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-850 cursor-pointer shadow-sm text-center"
										>
											Trigger Diagnostics & Repair
										</button>
										<p className="text-[10px] text-center text-zinc-400">All self-healing acts are logged to immutable audits.</p>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* 2. USERS DIRECTORY */}
					{activeTab === "users" && (
						<motion.div
							key="users-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="flex items-center justify-between pb-4 border-b border-[#ebdcc9]/40">
								<div>
									<h2 className="text-xl font-extrabold tracking-tight">Users Directory</h2>
									<p className="text-xs text-[#6b6861]">Manage user access, roles, execute force logouts, reset passwords, or suspend credentials.</p>
								</div>
								<Button
									onClick={fetchUsers}
									variant="outline"
									className="h-9 px-3 text-xs gap-1.5 border-[#ebdcc9] rounded-xl font-semibold hover:bg-[#faf9f5] cursor-pointer"
								>
									<RotateCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
									Refresh Directory
								</Button>
							</div>

							<div className="flex flex-col sm:flex-row gap-3">
								<div className="relative flex-1">
									<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8e8a80]" />
									<Input
										type="text"
										placeholder="Search by name or email..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10 h-10 border-[#ebdcc9]/85 rounded-xl focus-visible:ring-[#ebdcc9] placeholder:text-[#8e8a80]/80 text-xs"
									/>
								</div>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="h-10 px-3 border border-[#ebdcc9]/85 rounded-xl text-xs font-semibold focus:outline-none bg-white cursor-pointer"
								>
									<option value="all">All Statuses</option>
									<option value="active">Active</option>
									<option value="suspended">Suspended</option>
									<option value="temporarily_suspended">Temporarily Suspended</option>
								</select>
							</div>

							<div className="border border-[#ebdcc9]/50 rounded-2xl overflow-hidden bg-white/50 backdrop-blur-[4px] shadow-sm w-full">
								<div className="overflow-x-auto w-full">
									<table className="w-full min-w-[700px] text-left border-collapse text-xs">
										<thead>
											<tr className="bg-[#fcfaf7] border-b border-[#ebdcc9]/40 text-[#6b6861] font-semibold uppercase tracking-wider">
												<th className="p-4">User Details</th>
												<th className="p-4">Identity Method</th>
												<th className="p-4">Platform Role</th>
												<th className="p-4">Status</th>
												<th className="p-4 text-center">Auditing</th>
												<th className="p-4 text-right">Force Controls</th>
											</tr>
										</thead>
										<tbody>
											{filteredUsers.map((u) => {
												const isCurrentUser = u.id === user.id;
												return (
													<tr key={u.id} className="border-b border-[#ebdcc9]/30 hover:bg-white transition-colors">
														<td className="p-4 flex items-center gap-3">
															<div className="w-8 h-8 rounded-full bg-[#f0ece4] border flex items-center justify-center font-bold text-xs text-[#1a1917] shrink-0">
																{(u.name || u.email).charAt(0).toUpperCase()}
															</div>
															<div className="flex flex-col min-w-0">
																<span className="font-bold text-[#1a1917] truncate flex items-center gap-1.5">
																	{u.name || "No Name Set"}
																	{isCurrentUser && <span className="px-1.5 py-0.5 text-[8px] font-bold bg-[#ebdcc9] text-zinc-900 rounded">You</span>}
																</span>
																<span className="text-[10px] text-zinc-400 font-mono truncate">{u.email}</span>
															</div>
														</td>

														<td className="p-4 font-semibold text-zinc-500">{getLoginType(u)}</td>

														<td className="p-4">
															{isCurrentUser || u.email === "neelampallicharanbalaji14@gmail.com" ? (
																<span className="inline-flex px-2 py-0.5 text-[9px] font-extrabold bg-[#ebdcc9]/40 border border-[#ebdcc9] rounded text-zinc-950 uppercase">{u.role}</span>
															) : (
																<select
																	value={u.role || "user"}
																	onChange={(e) => handleRoleChange(u.id, e.target.value)}
																	className="h-7 px-2 border rounded-lg text-[11px] font-semibold bg-white cursor-pointer"
																>
																	<option value="user">Student / Candidate</option>
																	<option value="faculty">Faculty evaluator</option>
																	<option value="admin">Platform administrator</option>
																</select>
															)}
														</td>

														<td className="p-4">
															<span className={`inline-flex px-2.5 py-0.5 text-[9px] font-bold rounded-full border ${
																u.status === "active"
																	? "text-emerald-700 bg-emerald-50 border-emerald-100"
																	: u.status === "suspended"
																	? "text-rose-700 bg-rose-50 border-rose-100"
																	: "text-amber-700 bg-amber-50 border-amber-100"
															}`}>
																{u.status === "active" ? "Active" : u.status === "suspended" ? "Suspended" : "Locked"}
															</span>
														</td>

														<td className="p-4 text-center">
															<Button
																variant="ghost"
																onClick={() => openLogsModal(u)}
																className="h-7 px-2 text-[10px] gap-1 hover:bg-neutral-100"
															>
																<History className="size-3" /> Audit Log
															</Button>
														</td>

														<td className="p-4 text-right space-x-1">
															{!isCurrentUser && u.role !== "admin" && (
																<>
																	<Button
																		variant="ghost"
																		onClick={() => setSelectedUserForPasswordReset(u)}
																		className="size-7 p-0 rounded hover:bg-zinc-100"
																		title="Force Password Reset"
																	>
																		<Key className="size-3.5 text-zinc-600" />
																	</Button>
																	<Button
																		variant="ghost"
																		onClick={() => handleForceLogout(u)}
																		className="size-7 p-0 rounded hover:bg-zinc-100"
																		title="Force Logout Session"
																	>
																		<Lock className="size-3.5 text-zinc-600" />
																	</Button>
																	{u.status === "active" ? (
																		<>
																			<Button
																				variant="ghost"
																				onClick={() => setSelectedUserForTempSuspend(u)}
																				className="size-7 p-0 rounded hover:bg-amber-50 text-amber-600"
																				title="Temp Suspend"
																			>
																				<Clock className="size-3.5" />
																			</Button>
																			<Button
																				variant="ghost"
																				onClick={() => handleSuspend(u)}
																				className="size-7 p-0 rounded hover:bg-rose-50 text-rose-600"
																				title="Suspend Account"
																			>
																				<Power className="size-3.5" />
																			</Button>
																		</>
																	) : (
																		<Button
																			variant="ghost"
																			onClick={() => handleUnsuspend(u)}
																			className="size-7 p-0 rounded hover:bg-emerald-50 text-emerald-600"
																			title="Reactivate Account"
																		>
																			<Power className="size-3.5" />
																		</Button>
																	)}
																	<Button
																		variant="ghost"
																		onClick={() => setSelectedUserForDelete(u)}
																		className="size-7 p-0 rounded hover:bg-rose-50 text-rose-600"
																		title="Delete User"
																	>
																		<Trash2 className="size-3.5" />
																	</Button>
																</>
															)}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</div>
						</motion.div>
					)}

					{/* 3. FACULTY GOVERNANCE */}
					{activeTab === "faculty" && (
						<motion.div
							key="faculty-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="pb-4 border-b border-[#ebdcc9]/40">
								<h2 className="text-xl font-extrabold tracking-tight">Faculty Governance</h2>
								<p className="text-xs text-[#6b6861]">Review faculty access approval, check created exams, evaluation performance, and review logs.</p>
							</div>

							<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
								<h3 className="text-sm font-extrabold">Faculty Directory & Performance Logs</h3>
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse text-xs">
										<thead>
											<tr className="border-b border-[#ebdcc9]/40 text-[#6b6861] font-semibold">
												<th className="pb-2">Faculty Member</th>
												<th className="pb-2">Institution</th>
												<th className="pb-2 text-center">Exams Created</th>
												<th className="pb-2 text-center">Submissions Graded</th>
												<th className="pb-2 text-center">Review Queue Count</th>
												<th className="pb-2 text-right">Access Actions</th>
											</tr>
										</thead>
										<tbody>
											{users.filter(u => u.role === "faculty").map((fac) => (
												<tr key={fac.id} className="border-b border-zinc-100 hover:bg-neutral-50/50">
													<td className="py-3 font-bold text-zinc-950">{fac.name || "Faculty evaluator"} <span className="block text-[10px] font-mono font-normal text-zinc-400">{fac.email}</span></td>
													<td className="py-3 text-zinc-600">{fac.institutionName || "SRM University AP"}</td>
													<td className="py-3 text-center font-bold">4</td>
													<td className="py-3 text-center font-bold">12</td>
													<td className="py-3 text-center font-bold text-rose-500">2 flagged</td>
													<td className="py-3 text-right">
														<span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-100 rounded-full">APPROVED</span>
													</td>
												</tr>
											))}
											{users.filter(u => u.role === "faculty").length === 0 && (
												<tr>
													<td colSpan={6} className="py-6 text-center text-zinc-400">No faculty profiles registered in the system. Use User Directory to change roles.</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						</motion.div>
					)}

					{/* 4. ASSESSMENT CONTROL */}
					{activeTab === "assessments" && (
						<motion.div
							key="assessments-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="pb-4 border-b border-[#ebdcc9]/40">
								<h2 className="text-xl font-extrabold tracking-tight">Assessment Compliance Management</h2>
								<p className="text-xs text-[#6b6861]">Review institution-wide exam configurations, monitor candidate submissions, and check compliance thresholds.</p>
							</div>

							<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
								<h3 className="text-sm font-extrabold">Active Assessment Inventory</h3>
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse text-xs">
										<thead>
											<tr className="border-b border-[#ebdcc9]/45 text-[#6b6861] font-semibold">
												<th className="pb-2">Exam Title</th>
												<th className="pb-2">Faculty Evaluator</th>
												<th className="pb-2 text-center">Active Candidates</th>
												<th className="pb-2 text-center">Proctoring Security Score</th>
												<th className="pb-2 text-center">Compliance Status</th>
												<th className="pb-2 text-center">Integrity Violation Rate</th>
											</tr>
										</thead>
										<tbody>
											{assessments.map((a) => (
												<tr key={a.id} className="border-b border-zinc-100 hover:bg-neutral-50/50">
													<td className="py-3 font-bold text-zinc-950">{a.title} <span className="block font-normal text-[10px] text-zinc-400">Duration: {a.duration} mins</span></td>
													<td className="py-3 text-zinc-600 font-semibold">{a.facultyName}</td>
													<td className="py-3 text-center font-bold">{a.attemptsCount} submitted</td>
													<td className="py-3 text-center">
														<span className="font-extrabold text-indigo-600">{a.securityScore} / 100</span>
													</td>
													<td className="py-3 text-center">
														<span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
															a.complianceStatus === "Compliant"
																? "bg-emerald-50 text-emerald-700 border border-emerald-100"
																: "bg-rose-50 text-rose-700 border border-rose-100"
														}`}>
															{a.complianceStatus}
														</span>
													</td>
													<td className="py-3 text-center font-bold text-zinc-700">{a.integrityViolationRate}</td>
												</tr>
											))}
											{assessments.length === 0 && (
												<tr>
													<td colSpan={6} className="py-6 text-center text-zinc-400">No assessments found.</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						</motion.div>
					)}

					{/* 5. LIVE MONITORING */}
					{activeTab === "live" && (
						<motion.div
							key="live-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="pb-4 border-b border-[#ebdcc9]/40">
								<h2 className="text-xl font-extrabold tracking-tight">Real-Time Examination Monitor</h2>
								<p className="text-xs text-[#6b6861]">Live stream candidate telemetry logs, webcam monitoring alerts, and browser focus logs.</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{liveSessions.map((session) => (
									<div key={session.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between border-zinc-200`}>
										<div className="p-4 bg-zinc-50 border-b flex justify-between items-center text-xs">
											<div>
												<span className="font-extrabold block text-zinc-800">{session.studentName}</span>
												<span className="text-[10px] text-zinc-400 truncate block max-w-[120px]">{session.exam}</span>
											</div>
											<span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${session.score >= 75 ? "bg-emerald-50 text-emerald-700 border" : "bg-rose-50 text-rose-700 border animate-pulse"}`}>
												Integrity: {session.score}%
											</span>
										</div>

										<div className="relative aspect-video bg-zinc-950 flex items-center justify-center">
											<div className="text-center text-zinc-500 space-y-1">
												<Server className="size-6 mx-auto animate-pulse" />
												<span className="text-[9px] block uppercase font-bold tracking-widest text-zinc-400">Live feed simulated</span>
											</div>
										</div>

										<div className="p-3 bg-zinc-50/50 border-t flex justify-between items-center text-xs">
											<span className="font-bold text-zinc-600">Status: <span className="font-extrabold text-zinc-800">{session.status}</span></span>
											<span className="text-[10px] font-bold text-rose-500">{session.alerts} alert(s)</span>
										</div>
									</div>
								))}
							</div>
						</motion.div>
					)}

					{/* 6. AI AGENT CENTER */}
					{activeTab === "agents" && (
						<motion.div
							key="agents-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="flex items-center justify-between pb-4 border-b border-[#ebdcc9]/40">
								<div>
									<h2 className="text-xl font-extrabold tracking-tight">AI Agent Monitoring Center</h2>
									<p className="text-xs text-[#6b6861]">Track status, active tasks, uptimes, and self-healing events of autonomous agents.</p>
								</div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								<div className="lg:col-span-2 bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
									<h3 className="text-sm font-extrabold">Active Systems AI Agent Pool</h3>
									<div className="overflow-x-auto">
										<table className="w-full text-left border-collapse text-xs">
											<thead>
												<tr className="border-b border-zinc-100 text-zinc-400 font-semibold">
													<th className="pb-2">Agent Identifier</th>
													<th className="pb-2">Status</th>
													<th className="pb-2">Uptime</th>
													<th className="pb-2 text-center">Active Tasks</th>
													<th className="pb-2 text-center">Failures</th>
												</tr>
											</thead>
											<tbody>
												{agentStatus.map((agent, i) => (
													<tr key={i} className="border-b border-zinc-50 hover:bg-neutral-50/50">
														<td className="py-2.5 font-bold text-zinc-950">{agent.name}</td>
														<td className="py-2.5">
															<span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
																{agent.status}
															</span>
														</td>
														<td className="py-2.5 font-mono text-zinc-500">{agent.uptime}</td>
														<td className="py-2.5 text-center font-bold">{agent.activeTasks}</td>
														<td className="py-2.5 text-center font-bold text-rose-500">{agent.failures}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>

								{/* AI Self Healing Event Logs */}
								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
									<div className="flex items-center gap-2 border-b pb-2">
										<Sliders className="size-4.5 text-zinc-800" />
										<h3 className="text-sm font-extrabold text-zinc-800">Self-Healing Event Logs</h3>
									</div>
									<div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
										{auditLogs.selfHealingLogs?.map((log: any) => (
											<div key={log.id} className="border-b pb-2 text-[11px] leading-relaxed">
												<div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
													<span>{log.component}</span>
													<span>{new Date(log.timestamp).toLocaleTimeString()}</span>
												</div>
												<p className="font-semibold text-zinc-700 mt-0.5">{log.action}</p>
												<span className="inline-flex px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold mt-1 uppercase border border-emerald-100">{log.status}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* 7. DATABASE HUB */}
					{activeTab === "database" && (
						<motion.div
							key="database-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="pb-4 border-b border-[#ebdcc9]/40">
								<h2 className="text-xl font-extrabold tracking-tight">Database & pgvector Management</h2>
								<p className="text-xs text-[#6b6861]">Track PostgreSQL storage utilization, active connections, backup logs, and query speeds.</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3 text-xs">
									<div>
										<span className="font-bold text-[#8e8a80] block uppercase tracking-wider text-[10px]">Database Connection Pools</span>
										<span className="text-xl font-extrabold mt-1 block">{healthMetrics?.infrastructure?.dbConnections || 14} active connections</span>
									</div>
									<div className="bg-zinc-50 p-2.5 rounded-lg border text-[10px]">
										Prisma Client Adapters: <span className="font-bold text-zinc-700">@prisma/adapter-pg</span>
									</div>
								</div>

								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3 text-xs">
									<div>
										<span className="font-bold text-[#8e8a80] block uppercase tracking-wider text-[10px]">pgvector Storage Utilization</span>
										<span className="text-xl font-extrabold mt-1 block">54.2% (21.8 GB / 40.0 GB)</span>
									</div>
									<div className="bg-zinc-50 p-2.5 rounded-lg border text-[10px]">
										Similarity Indexes: <span className="font-bold text-zinc-700">HNSW Cosine Vector Index</span>
									</div>
								</div>

								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-3 text-xs">
									<div>
										<span className="font-bold text-[#8e8a80] block uppercase tracking-wider text-[10px]">System Backup Logs</span>
										<span className="text-sm font-extrabold mt-1 block text-emerald-600">Active (Daily automated script)</span>
									</div>
									<div className="bg-zinc-50 p-2.5 rounded-lg border text-[10px]">
										Last backup: <span className="font-bold text-zinc-750">2026-06-20 03:00 AM</span>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* 8. SUPPORT OPERATIONS */}
					{activeTab === "support" && (
						<motion.div
							key="support-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="pb-4 border-b border-[#ebdcc9]/40">
								<h2 className="text-xl font-extrabold tracking-tight">Support Operations Management</h2>
								<p className="text-xs text-[#6b6861]">Review support queues, category breakdowns, and support agent assignments.</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
									<h3 className="text-sm font-extrabold">Active Support Queue</h3>
									<div className="text-center py-10 text-xs text-[#8e8a80]">
										<MessageSquare className="size-8 mx-auto mb-2 text-zinc-300" />
										All support tickets are successfully assigned to support agents.
									</div>
								</div>

								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
									<h3 className="text-sm font-extrabold">Support Metrics & Resolution Rates</h3>
									<div className="space-y-3.5 text-xs">
										<div className="flex justify-between border-b pb-2">
											<span className="text-zinc-600">Resolution Rate:</span>
											<span className="font-bold text-emerald-600">98.2%</span>
										</div>
										<div className="flex justify-between border-b pb-2">
											<span className="text-zinc-600">Average Response Uptime:</span>
											<span className="font-bold">2.4 minutes</span>
										</div>
										<div className="flex justify-between border-b pb-2">
											<span className="text-zinc-600">Active Support Agents:</span>
											<span className="font-bold">4 active representatives</span>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* 9. AUDIT & COMPLIANCE */}
					{activeTab === "audit" && (
						<motion.div
							key="audit-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="pb-4 border-b border-[#ebdcc9]/40">
								<h2 className="text-xl font-extrabold tracking-tight">Audit & Compliance Center</h2>
								<p className="text-xs text-[#6b6861]">Immutable chronological logs of student registrations, exam submissions, and administrative overrides.</p>
							</div>

							<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
								<h3 className="text-sm font-extrabold"> chronologic Event Registry</h3>
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse text-xs">
										<thead>
											<tr className="border-b border-zinc-200 text-zinc-500 font-semibold">
												<th className="pb-2">Timestamp</th>
												<th className="pb-2">Action / Command</th>
												<th className="pb-2">IP Address</th>
												<th className="pb-2">Client User Agent</th>
											</tr>
										</thead>
										<tbody>
											{auditLogs.adminLogs?.slice(0, 15).map((log: any) => (
												<tr key={log.id} className="border-b border-zinc-50 hover:bg-neutral-50/50">
													<td className="py-2.5 font-mono text-zinc-500">{new Date(log.createdAt).toLocaleString()}</td>
													<td className="py-2.5 font-bold text-zinc-800">{log.action}</td>
													<td className="py-2.5 font-mono text-zinc-500">{log.ipAddress || "Localhost"}</td>
													<td className="py-2.5 text-zinc-500 truncate max-w-[200px]" title={log.userAgent}>{parseUserAgent(log.userAgent)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</motion.div>
					)}

					{/* 10. SYSTEM SETTINGS */}
					{activeTab === "settings" && (
						<motion.div
							key="settings-tab"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className="space-y-6 w-full"
						>
							<div className="pb-4 border-b border-[#ebdcc9]/40">
								<h2 className="text-xl font-extrabold tracking-tight">System Settings & Platform Modes</h2>
								<p className="text-xs text-[#6b6861]">Configure model selectors, integrity thresholds, database parameters, and maintenance toggles.</p>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
								{/* Left Form Settings */}
								<div className="lg:col-span-2 bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
									<h3 className="text-sm font-extrabold border-b pb-2">1. AI Agent Model Configuration</h3>
									
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="flex flex-col gap-1">
											<label className="text-[11px] font-bold text-zinc-500">Evaluation Engine Model</label>
											<select
												value={evaluationModel}
												onChange={(e) => setEvaluationModel(e.target.value)}
												className="h-9 px-2 border rounded-xl text-xs font-semibold bg-zinc-50"
											>
												<option value="Groq Llama 3.1 70B + Ollama Llama 3.2 3B">Groq Llama 3.1 70B + Ollama Llama 3.2 (Dual Engine)</option>
												<option value="Groq Llama 3.1 70B (Single agent)">Groq Llama 3.1 70B (Single Agent Mode)</option>
												<option value="Ollama Llama 3.2 3B (Offline agent)">Ollama Llama 3.2 3B (Offline Mode)</option>
											</select>
										</div>

										<div className="flex flex-col gap-1">
											<label className="text-[11px] font-bold text-zinc-500">AI Support Assistant Model</label>
											<select
												value={supportModel}
												onChange={(e) => setSupportModel(e.target.value)}
												className="h-9 px-2 border rounded-xl text-xs font-semibold bg-zinc-50"
											>
												<option value="IntegrityOS Support AI Agent (Local)">IntegrityOS Support AI Agent (Local)</option>
												<option value="OpenAI GPT-4o Support Api">OpenAI GPT-4o API (Online Escalate)</option>
											</select>
										</div>
									</div>

									<h3 className="text-sm font-extrabold border-b pb-2 pt-2">2. Compliance Threshold Rules</h3>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="flex flex-col gap-1">
											<label className="text-[11px] font-bold text-zinc-500">Descriptive Answer Similarity Limit (%)</label>
											<input
												type="number"
												value={similarityLimit}
												onChange={(e) => setSimilarityLimit(Number(e.target.value))}
												className="h-9 px-3 border rounded-xl text-xs font-semibold bg-zinc-50"
											/>
										</div>

										<div className="flex flex-col gap-1">
											<label className="text-[11px] font-bold text-zinc-500">Integrity Violation Warning Threshold (%)</label>
											<input
												type="number"
												value={integrityLimit}
												onChange={(e) => setIntegrityLimit(Number(e.target.value))}
												className="h-9 px-3 border rounded-xl text-xs font-semibold bg-zinc-50"
											/>
										</div>
									</div>

									<Button
										onClick={() => handleSaveSettings()}
										className="bg-[#1a1917] hover:bg-black text-white px-5 py-2 text-xs font-bold rounded-xl mt-3 cursor-pointer"
									>
										Save Platform Settings
									</Button>
								</div>

								{/* Maintenance and Emergency Shutdown Right Controls */}
								<div className="bg-white border border-[#ebdcc9] rounded-2xl p-5 shadow-sm space-y-4">
									<h3 className="text-sm font-extrabold border-b pb-2 flex items-center gap-2">
										<ShieldAlert className="size-4.5 text-zinc-800" /> Platform Security States
									</h3>
									
									<div className="space-y-4">
										{/* Maintenance Mode */}
										<div className="p-3 border rounded-xl bg-zinc-50 flex items-start justify-between gap-3">
											<div className="space-y-1">
												<span className="text-xs font-extrabold text-zinc-800 block">Maintenance Mode</span>
												<p className="text-[10px] text-zinc-400 leading-tight">Disable candidate registration and student exam access. Administrators retain dashboard visibility.</p>
											</div>
											<input
												type="checkbox"
												checked={maintenanceMode}
												onChange={(e) => {
													const val = e.target.checked;
													setMaintenanceMode(val);
													handleSaveSettings({ maintenanceMode: val });
												}}
												className="size-4.5 mt-1 cursor-pointer text-zinc-950 focus:ring-zinc-950 rounded"
											/>
										</div>

										{/* Emergency Shutdown */}
										<div className="p-3 border border-rose-200 rounded-xl bg-rose-50 flex items-start justify-between gap-3 animate-pulse">
											<div className="space-y-1 text-rose-900">
												<span className="text-xs font-extrabold text-rose-800 block flex items-center gap-1">Emergency Platform Suspension</span>
												<p className="text-[10px] text-rose-600 leading-tight">Instantly freeze all examinations, terminate all active candidate sessions, and drop system APIs.</p>
											</div>
											<input
												type="checkbox"
												checked={emergencyShutdown}
												onChange={(e) => {
													const val = e.target.checked;
													setEmergencyShutdown(val);
													handleSaveSettings({ emergencyShutdown: val });
												}}
												className="size-4.5 mt-1 cursor-pointer text-rose-600 focus:ring-rose-500 rounded"
											/>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Password Override Reset Modal */}
			<Dialog
				open={!!selectedUserForPasswordReset}
				onOpenChange={(open) => !open && setSelectedUserForPasswordReset(null)}
			>
				<DialogContent className="w-[95vw] sm:max-w-[420px] rounded-[24px] border-2 border-[#ebdcc9] bg-white p-6 shadow-2xl backdrop-blur-xl outline-none text-xs">
					<DialogHeader className="flex flex-col items-center gap-2 text-center">
						<div className="size-11 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
							<Key className="size-5 text-amber-600" />
						</div>
						<DialogTitle className="text-base font-extrabold text-zinc-800">
							Administrative Password Reset
						</DialogTitle>
						<DialogDescription className="text-[11px] text-zinc-400 leading-relaxed">
							Force-reset the password for <span className="font-bold text-zinc-800">{selectedUserForPasswordReset?.email}</span>. The student will be logged out on all devices.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-2 my-4">
						<label className="font-extrabold text-zinc-700">Enter Temporary Password:</label>
						<Input
							type="text"
							placeholder="e.g. Temporary123!"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="h-10 border-[#ebdcc9] rounded-xl focus-visible:ring-[#ebdcc9] text-xs"
						/>
					</div>

					<DialogFooter className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setSelectedUserForPasswordReset(null)}
							className="border-[#ebdcc9] rounded-xl font-bold flex-1"
						>
							Cancel
						</Button>
						<Button
							onClick={handleResetPasswordSubmit}
							disabled={isResettingPassword}
							className="bg-zinc-950 text-white hover:bg-zinc-850 rounded-xl font-bold flex-1"
						>
							{isResettingPassword ? "Overriding..." : "Reset Password"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialogs sit outside the main workspace flex flow */}
			<Dialog
				open={!!selectedUserForLogs}
				onOpenChange={(open) => !open && setSelectedUserForLogs(null)}
			>
				<DialogContent className="max-w-[700px] w-[90vw] rounded-[24px] border-2 border-[#d3c2a6]/40 bg-white p-6 shadow-2xl backdrop-blur-xl outline-none">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
							<History className="size-5 text-black" />
							Activity Logs: {selectedUserForLogs?.email}
						</DialogTitle>
						<DialogDescription className="text-xs text-[#6b6861]">
							Full login and registration event history for this user
						</DialogDescription>
					</DialogHeader>

					<div className="border border-[#ebdcc9]/50 rounded-xl overflow-auto bg-[#fafafa] my-4 max-h-[300px] w-full">
						<table className="w-full min-w-[550px] text-left text-xs border-collapse">
							<thead>
								<tr className="bg-[#f5f2eb] border-b border-[#ebdcc9]/30 text-[#6b6861] font-semibold uppercase tracking-wider">
									<th className="p-3">Event / Action</th>
									<th className="p-3">IP Address</th>
									<th className="p-3">Device / User Agent</th>
									<th className="p-3">Timestamp</th>
								</tr>
							</thead>
							<tbody>
								{loadingUserLogs ? (
									<tr>
										<td colSpan={4} className="p-6 text-center text-[#8e8a80]">
											<div className="flex items-center justify-center gap-2">
												<div className="size-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
												Loading logs...
											</div>
										</td>
									</tr>
								) : userLogs.length === 0 ? (
									<tr>
										<td colSpan={4} className="p-6 text-center text-[#8e8a80]">
											No event history records exist for this user.
										</td>
									</tr>
								) : (
									userLogs.map((log) => (
										<tr
											key={log.id}
											className="border-b border-[#ebdcc9]/20 hover:bg-[#faf9f6]"
										>
											<td className="p-3 font-semibold text-[#1a1917]">
												{log.action}
											</td>
											<td className="p-3 text-gray-500 font-mono text-[10px]">
												{log.ipAddress || "Unknown"}
											</td>
											<td className="p-3 text-gray-500">
												{parseUserAgent(log.userAgent)}
											</td>
											<td className="p-3 text-gray-400 font-mono text-[10px]">
												{new Date(log.createdAt).toLocaleString()}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<DialogFooter>
						<Button
							onClick={() => setSelectedUserForLogs(null)}
							className="rounded-xl bg-black text-white hover:bg-black/90 font-bold"
						>
							Close Audits
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog: Temporary Suspension */}
			<Dialog
				open={!!selectedUserForTempSuspend}
				onOpenChange={(open) => !open && setSelectedUserForTempSuspend(null)}
			>
				<DialogContent className="w-[95vw] sm:max-w-[420px] rounded-[24px] border-2 border-[#d3c2a6]/40 bg-white p-6 shadow-2xl backdrop-blur-xl outline-none">
					<DialogHeader className="flex flex-col items-center gap-2 text-center">
						<div className="size-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
							<Clock className="size-6 text-amber-600" />
						</div>
						<DialogTitle className="text-lg font-bold tracking-tight text-[#1a1917]">
							Temporary Suspension
						</DialogTitle>
						<DialogDescription className="text-xs text-[#6b6861] leading-relaxed">
							Choose the number of hours to lock the account of{" "}
							<span className="font-bold text-black">
								{selectedUserForTempSuspend?.email}
							</span>
							.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-2 my-4">
						<label className="text-xs font-semibold text-[#1a1917]">Duration (Hours):</label>
						<Input
							type="number"
							min={1}
							max={8760}
							value={tempHours}
							onChange={(e) => setTempHours(Math.max(1, parseInt(e.target.value) || 1))}
							className="border-[#ebdcc9] rounded-xl focus-visible:ring-[#ebdcc9] text-sm"
						/>
						<p className="text-[10px] text-gray-400">
							The account will automatically restore status after duration elapses.
						</p>
					</div>

					<DialogFooter className="flex gap-2">
						<Button
							variant="outline"
							onClick={() => setSelectedUserForTempSuspend(null)}
							className="border-[#ebdcc9] rounded-xl font-semibold hover:bg-gray-50 flex-1"
						>
							Cancel
						</Button>
						<Button
							onClick={submitTempSuspend}
							className="bg-amber-600 text-white hover:bg-amber-700 rounded-xl font-bold flex-1"
						>
							Confirm Suspend
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog: Confirm Deletion */}
			<Dialog
				open={!!selectedUserForDelete}
				onOpenChange={(open) => !open && setSelectedUserForDelete(null)}
			>
				<DialogContent className="w-[95vw] sm:max-w-[420px] rounded-[24px] border-2 border-rose-200 bg-white p-6 shadow-2xl backdrop-blur-xl outline-none">
					<DialogHeader className="flex flex-col items-center gap-2 text-center">
						<div className="size-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center animate-bounce">
							<ShieldAlert className="size-6 text-rose-600" />
						</div>
						<DialogTitle className="text-lg font-bold tracking-tight text-[#1a1917]">
							Permanently Delete User
						</DialogTitle>
						<DialogDescription className="text-xs text-[#6b6861] leading-relaxed">
							Are you absolutely sure you want to delete{" "}
							<span className="font-bold text-black">{selectedUserForDelete?.email}</span>?
							This action is irreversible and deletes all associated profile data.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter className="flex gap-2 mt-4">
						<Button
							variant="outline"
							onClick={() => setSelectedUserForDelete(null)}
							className="border-[#ebdcc9] rounded-xl font-semibold hover:bg-gray-50 flex-1"
						>
							Cancel
						</Button>
						<Button
							onClick={submitDeleteUser}
							disabled={isSubmittingDelete}
							className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold flex-1"
						>
							{isSubmittingDelete ? "Deleting..." : "Permanently Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
