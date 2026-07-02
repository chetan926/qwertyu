import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Shield, 
  ShieldAlert, 
  Clock, 
  History, 
  Laptop, 
  Key, 
  Lock, 
  Settings, 
  Calendar,
  LogOut,
  UserCheck
} from "lucide-react";
import { useProfile, UserProfile } from "../context/ProfileContext";

interface ProfileCenterProps {
  isOpen: boolean;
  onClose: () => void;
  handleLogout: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 180 }
  }
};

export const ProfileCenter: React.FC<ProfileCenterProps> = ({ isOpen, onClose, handleLogout }) => {
  const {
    profile,
    updateProfile,
    changePassword,
    toggle2FA,
    activityHistory,
    activeSessions,
    fetchActivityHistory,
    fetchActiveSessions,
    revokeSession
  } = useProfile();

  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  
  // Student specific fields
  const [rollNumber, setRollNumber] = useState("");
  const [semester, setSemester] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");

  // Faculty specific
  const [subjects, setSubjects] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Initialize edit fields
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phoneNumber || "");
      setBio(profile.bio || "");
      setInstitution(profile.institutionName || "");
      setDepartment(profile.department || "");
      setDesignation(profile.designation || "");
      setRollNumber(profile.rollNumber || "");
      setSemester(profile.semester || "");
      setBranch(profile.branch || "");
      setSection(profile.section || "");
      setSubjects(profile.subjects || "");
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen) {
      fetchActivityHistory();
      fetchActiveSessions();
    }
  }, [isOpen, fetchActivityHistory, fetchActiveSessions]);

  if (!profile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const data: Partial<UserProfile> = {
      name,
      phoneNumber: phone,
      bio,
      institutionName: institution,
      department,
      designation,
      rollNumber,
      semester,
      branch,
      section,
      subjects
    };
    const success = await updateProfile(data);
    setIsSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    setIsChangingPass(true);
    const success = await changePassword(currentPassword, newPassword);
    setIsChangingPass(false);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Force logout triggers on password change success
      handleLogout();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "text-zinc-950 bg-zinc-150 border-zinc-300";
      case "faculty": return "text-indigo-700 bg-indigo-50 border-indigo-200";
      case "support": return "text-[#9a7b4f] bg-[#FAF0DD] border-[#e3d5ba]";
      default: return "text-emerald-700 bg-emerald-50 border-emerald-200";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-45"
          />

          {/* Sliding Side Panel Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 h-screen w-full sm:max-w-[460px] bg-white border-l border-[#ebdcc9] shadow-2xl z-50 flex flex-col overflow-hidden text-xs"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#ebdcc9]/40 flex justify-between items-center bg-[#faf9f6]">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-zinc-900" />
                <h2 className="font-extrabold text-sm text-[#1a1917]">Profile Settings</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-zinc-100 rounded-xl transition cursor-pointer border-none outline-none"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card Hero */}
              <div className="flex flex-col items-center text-center p-5 border border-[#ebdcc9]/40 rounded-2xl bg-zinc-50/50 shadow-sm relative">
                <div className="relative group">
                  <div className="size-20 rounded-full bg-zinc-950 border-2 border-[#ebdcc9] flex items-center justify-center font-bold text-2xl text-white shadow select-none uppercase overflow-hidden">
                    {profile.image ? (
                      <img src={profile.image} alt={profile.name} className="size-full object-cover" />
                    ) : (
                      profile.name.charAt(0)
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 size-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                </div>

                <h3 className="font-extrabold text-sm text-zinc-900 mt-3">{profile.name}</h3>
                <span className="text-[10px] text-[#8e8a80] font-mono select-all mt-0.5">{profile.email}</span>

                <div className="flex gap-1.5 mt-3">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase select-none ${getRoleColor(profile.role)}`}>
                    {profile.role === "user" ? "Student" : profile.role}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 border-emerald-200 select-none">
                    {profile.status}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-[#ebdcc9]/40">
                <button
                  onClick={() => { setActiveTab("info"); setIsEditing(false); }}
                  className={`flex-1 pb-2 text-center font-bold border-b-2 transition ${
                    activeTab === "info"
                      ? "border-zinc-950 text-zinc-950"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  General Profile
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`flex-1 pb-2 text-center font-bold border-b-2 transition ${
                    activeTab === "security"
                      ? "border-zinc-950 text-zinc-950"
                      : "border-transparent text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Security & Activity
                </button>
              </div>

              {/* Tab Content Display */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                {activeTab === "info" ? (
                  /* TAB 1: INFO VIEW / EDIT */
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-extrabold text-[11px] text-[#8e8a80] uppercase tracking-wider">Information details</h4>
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-[10px] font-bold text-zinc-950 underline hover:no-underline cursor-pointer border-none bg-transparent"
                        >
                          Edit Profile Details
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-[10px] font-bold text-zinc-550 hover:underline cursor-pointer border-none bg-transparent"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3.5">
                      {/* Name input */}
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Full Name</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      {/* Phone input */}
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Phone Number</label>
                        <input
                          type="tel"
                          disabled={!isEditing}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      {/* Bio input */}
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Short Bio</label>
                        <textarea
                          disabled={!isEditing}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={2}
                          className="p-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none focus:border-zinc-900 resize-none font-sans"
                          placeholder="Introduce yourself..."
                        />
                      </div>

                      {/* University/Institution */}
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Institution Name</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      {/* Department */}
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Department</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      {/* Designation */}
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Designation</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      {/* Student Specific Fields */}
                      {profile.role === "user" && (
                        <div className="grid grid-cols-2 gap-3 border-t pt-3 border-[#ebdcc9]/30">
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-700">Roll Number / Student ID</label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={rollNumber}
                              onChange={(e) => setRollNumber(e.target.value)}
                              className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-700">Semester</label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={semester}
                              onChange={(e) => setSemester(e.target.value)}
                              className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-700">Branch</label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={branch}
                              onChange={(e) => setBranch(e.target.value)}
                              className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-bold text-zinc-700">Section</label>
                            <input
                              type="text"
                              disabled={!isEditing}
                              value={section}
                              onChange={(e) => setSection(e.target.value)}
                              className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Faculty Specific Fields */}
                      {profile.role === "faculty" && (
                        <div className="flex flex-col gap-1 border-t pt-3 border-[#ebdcc9]/30">
                          <label className="font-bold text-zinc-700">Assigned Subjects</label>
                          <input
                            type="text"
                            disabled={!isEditing}
                            value={subjects}
                            onChange={(e) => setSubjects(e.target.value)}
                            className="h-9 px-3 border border-[#ebdcc9] rounded-xl bg-zinc-50/50 disabled:bg-zinc-50 disabled:opacity-70 focus:outline-none"
                            placeholder="e.g. Algorithms, Distributed Systems"
                          />
                        </div>
                      )}

                      {/* Info Metadata */}
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-2 font-mono">
                        <Calendar className="size-3.5 text-zinc-400" />
                        <span>Joined Platform: {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {isEditing && (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full h-10 mt-4 rounded-xl bg-zinc-950 text-white font-bold hover:bg-zinc-850 active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving details...
                          </>
                        ) : (
                          <>
                            <UserCheck className="size-4" /> Save profile changes
                          </>
                        )}
                      </button>
                    )}
                  </form>
                ) : (
                  /* TAB 2: SECURITY & ACTIVITY */
                  <div className="space-y-6">
                    {/* 2FA Toggle */}
                    <div className="p-4 border border-[#ebdcc9] rounded-2xl bg-zinc-50/30 flex items-start justify-between gap-3 shadow-sm">
                      <div className="space-y-1">
                        <span className="font-extrabold text-zinc-900 block flex items-center gap-1.5">
                          <Shield className="size-4 text-zinc-800" /> Two-Factor Authentication (2FA)
                        </span>
                        <p className="text-[10px] text-zinc-400 leading-tight">Secure your login details by enabling standard secondary verification sweeps.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={profile.twoFactorEnabled}
                        onChange={(e) => toggle2FA(e.target.checked)}
                        className="size-4.5 mt-1 cursor-pointer text-zinc-950 focus:ring-zinc-950 rounded"
                      />
                    </div>

                    {/* Change Password Form */}
                    <form onSubmit={handleChangePassword} className="space-y-3.5 border border-[#ebdcc9] rounded-2xl p-4 bg-zinc-50/20">
                      <h4 className="font-extrabold text-[11px] text-[#8e8a80] uppercase tracking-wider flex items-center gap-2 mb-1">
                        <Key className="size-4 text-zinc-700" /> Update Account Password
                      </h4>

                      {passwordError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-[10px] font-bold">
                          {passwordError}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="h-8.5 px-3 border border-[#ebdcc9] rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-8.5 px-3 border border-[#ebdcc9] rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-8.5 px-3 border border-[#ebdcc9] rounded-lg bg-white focus:outline-none focus:border-zinc-900"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isChangingPass}
                        className="w-full h-9 rounded-lg bg-zinc-950 text-white font-bold hover:bg-zinc-850 cursor-pointer text-center active:scale-[0.985] transition-all flex items-center justify-center gap-1.5"
                      >
                        {isChangingPass ? (
                          <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Lock className="size-3.5" /> Override Password
                          </>
                        )}
                      </button>
                    </form>

                    {/* Active Sessions List */}
                    <div className="space-y-2.5">
                      <h4 className="font-extrabold text-[11px] text-[#8e8a80] uppercase tracking-wider flex items-center gap-2">
                        <Laptop className="size-4 text-zinc-800" /> Active Login Sessions
                      </h4>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {activeSessions.map((s) => (
                          <div key={s.id} className="p-3 border rounded-xl bg-white hover:bg-neutral-50 transition flex justify-between items-center text-[10px] shadow-sm">
                            <div className="space-y-1">
                              <span className="font-bold text-zinc-900 block">{s.ipAddress || "Localhost"}</span>
                              <span className="text-zinc-400 block truncate max-w-[200px]" title={s.userAgent || ""}>
                                {s.userAgent || "Unknown Device"}
                              </span>
                            </div>
                            <button
                              onClick={() => revokeSession(s.id)}
                              className="text-[9.5px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded cursor-pointer"
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                        {activeSessions.length === 0 && (
                          <div className="text-center py-4 text-zinc-400">No session records found.</div>
                        )}
                      </div>
                    </div>

                    {/* Activity Timeline logs */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-[11px] text-[#8e8a80] uppercase tracking-wider flex items-center gap-2">
                        <History className="size-4 text-zinc-800" /> Activity Log History
                      </h4>
                      <div className="border-l border-zinc-200 pl-4 space-y-4 max-h-[160px] overflow-y-auto py-1 pr-1 scrollbar-thin">
                        {activityHistory.map((h) => (
                          <div key={h.id} className="relative space-y-0.5">
                            <span className="absolute -left-[20.5px] top-1 size-2 rounded-full bg-zinc-950 border border-white" />
                            <span className="font-bold text-zinc-800 block capitalize">{h.action.replace("_", " ")}</span>
                            <span className="text-[9px] text-zinc-400 font-mono block">
                              {new Date(h.createdAt).toLocaleString()} &bull; {h.ipAddress || "Local"}
                            </span>
                          </div>
                        ))}
                        {activityHistory.length === 0 && (
                          <div className="text-center py-4 text-zinc-400">No activity history.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer Panel */}
            <div className="p-5 border-t border-[#ebdcc9]/40 bg-[#faf9f6] flex gap-3">
              <button
                onClick={() => { onClose(); handleLogout(); }}
                className="w-full h-10 px-3 text-xs gap-1.5 border border-rose-500/20 hover:bg-rose-500/10 text-rose-600 rounded-xl font-bold transition-all duration-300 cursor-pointer flex items-center justify-center"
              >
                <LogOut className="size-3.5" />
                Sign Out Account
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
