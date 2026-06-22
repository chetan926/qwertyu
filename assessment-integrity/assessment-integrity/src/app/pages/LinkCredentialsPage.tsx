import React, { useState, useEffect, useRef } from "react";
import StepIndicator from "../components/StepIndicator";
import BuildingIllustration from "../components/BuildingIllustration";
import { toast } from "sonner";
import {
  InstitutionLabelIcon,
  SearchIcon,
  DepartmentIcon,
  IdCardIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "../components/Icons";

interface LinkCredentialsPageProps {
  email: string;
  onBack: () => void;
  onNext: () => void;
  initialRole?: "user" | "faculty";
}

const MOCK_UNIVERSITIES = [
  "SRM University AP",
  "SRM Institute of Science and Technology",
  "Stanford University",
  "Massachusetts Institute of Technology (MIT)",
  "Harvard University",
  "University of California, Berkeley",
  "California Institute of Technology (Caltech)",
  "Indian Institute of Technology (IIT) Madras",
  "Indian Institute of Technology (IIT) Bombay",
  "Indian Institute of Technology (IIT) Delhi",
  "University of Oxford",
  "University of Cambridge",
  "University of Toronto",
  "National University of Singapore (NUS)",
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communications",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Physics & Chemistry",
  "Mathematics & Statistics",
  "Business & Management",
  "Humanities & Social Sciences",
];

export default function LinkCredentialsPage({ email, onBack, onNext, initialRole }: LinkCredentialsPageProps) {
  const [institutionName, setInstitutionName] = useState("");
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const [filteredUnis, setFilteredUnis] = useState<string[]>([]);
  
  const [department, setDepartment] = useState("");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  
  const [academicId, setAcademicId] = useState("");
  const [role, setRole] = useState<"user" | "faculty">(initialRole || "user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uniRef = useRef<HTMLDivElement>(null);
  const deptRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (uniRef.current && !uniRef.current.contains(event.target as Node)) {
        setShowUniSuggestions(false);
      }
      if (deptRef.current && !deptRef.current.contains(event.target as Node)) {
        setShowDeptDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter universities as search input changes
  useEffect(() => {
    if (institutionName.trim() === "") {
      setFilteredUnis(MOCK_UNIVERSITIES.slice(0, 5));
    } else {
      const filtered = MOCK_UNIVERSITIES.filter((uni) =>
        uni.toLowerCase().includes(institutionName.toLowerCase())
      );
      setFilteredUnis(filtered);
    }
  }, [institutionName]);

  const handleNextStep = async () => {
    if (!institutionName.trim()) {
      toast.error("Please specify your Institution Name.");
      return;
    }
    if (!department) {
      toast.error("Please select your Department.");
      return;
    }
    if (!academicId.trim()) {
      toast.error(role === "faculty" ? "Please specify your Faculty ID." : "Please specify your Academic ID.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/authentication/link-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          institutionName: institutionName.trim(),
          department,
          academicId: academicId.trim(),
          role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to link credentials.");
      }

      toast.success("Academic credentials linked successfully!");
      onNext();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestManual = () => {
    toast.success("Verification request submitted! Support will review it within 24 hours.");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fff1d3]">
      {/* Background decorative illustration */}
      <BuildingIllustration />

      {/* Page content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center px-4 pt-16 pb-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[13px] font-medium text-[#605e5b]">IntegrityOS</p>
          <p className="mt-1 text-[13px] text-[#75716a]">
            Step 2: Link your academic credentials
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-[470px] rounded-[28px] bg-[#fffbf2] px-9 pt-8 pb-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)]">
          {/* Step indicator */}
          <StepIndicator activeStep={2} />

          {/* Institution Name */}
          <div className="mt-7 relative" ref={uniRef}>
            <label className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[#605e5b]">
              <InstitutionLabelIcon />
              Institution Name
            </label>
            <div className="flex h-12 items-center gap-2.5 rounded-[12px] border border-[#e4e0d4] bg-[#fafafa] px-4 focus-within:border-[#c5af8a] focus-within:ring-2 focus-within:ring-[#c5af8a]/20 transition-all">
              <SearchIcon />
              <input
                type="text"
                value={institutionName}
                onChange={(e) => {
                  setInstitutionName(e.target.value);
                  setShowUniSuggestions(true);
                }}
                onFocus={() => setShowUniSuggestions(true)}
                placeholder="Search university, college, or school..."
                className="w-full bg-transparent text-[14px] text-[#605e5b] placeholder:text-[#a7a297] focus:outline-none"
              />
            </div>
            
            {showUniSuggestions && filteredUnis.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-[#ebdcc9] bg-[#fffbf2] shadow-lg">
                {filteredUnis.map((uni) => (
                  <button
                    key={uni}
                    type="button"
                    onClick={() => {
                      setInstitutionName(uni);
                      setShowUniSuggestions(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-[13.5px] text-[#605e5b] hover:bg-[#fff1d3] transition-colors"
                  >
                    {uni}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div className="mt-5">
            <label className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[#605e5b]">
              👤 Account Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex h-11 items-center justify-center gap-2 rounded-[12px] border text-sm font-semibold transition-all cursor-pointer ${
                  role === "user"
                    ? "border-[#c5af8a] bg-[#fffcf3] text-[#1a1a1a] shadow-[0_0_12px_rgba(197,175,138,0.15)]"
                    : "border-[#e4e0d4] bg-[#fafafa] text-[#605e5b] hover:bg-[#eae7e2]"
                }`}
              >
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("faculty")}
                className={`flex h-11 items-center justify-center gap-2 rounded-[12px] border text-sm font-semibold transition-all cursor-pointer ${
                  role === "faculty"
                    ? "border-[#c5af8a] bg-[#fffcf3] text-[#1a1a1a] shadow-[0_0_12px_rgba(197,175,138,0.15)]"
                    : "border-[#e4e0d4] bg-[#fafafa] text-[#605e5b] hover:bg-[#eae7e2]"
                }`}
              >
                <span>Faculty</span>
              </button>
            </div>
          </div>

          {/* Department + Academic ID row */}
          <div className="mt-5 grid grid-cols-2 gap-4">
            {/* Department */}
            <div className="relative" ref={deptRef}>
              <label className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[#605e5b]">
                <DepartmentIcon />
                Department
              </label>
              <button
                type="button"
                onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                className="flex h-12 w-full items-center justify-between rounded-[12px] border border-[#e4e0d4] bg-[#fafafa] px-4 text-left text-[14px] text-[#605e5b] hover:bg-[#eae7e2] transition-colors"
              >
                <span className="truncate">{department || "Select department"}</span>
                <ChevronDownIcon />
              </button>

              {showDeptDropdown && (
                <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-[#ebdcc9] bg-[#fffbf2] shadow-lg">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        setDepartment(dept);
                        setShowDeptDropdown(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-[13.5px] text-[#605e5b] hover:bg-[#fff1d3] transition-colors"
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Academic ID */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[#605e5b]">
                <IdCardIcon />
                {role === "faculty" ? "Faculty ID" : "Academic ID/Email"}
              </label>
              <div className="flex h-12 items-center rounded-[12px] border border-[#e4e0d4] bg-[#fafafa] px-4 focus-within:border-[#c5af8a] focus-within:ring-2 focus-within:ring-[#c5af8a]/20 transition-all">
                <input
                  type="text"
                  value={academicId}
                  onChange={(e) => setAcademicId(e.target.value)}
                  placeholder={role === "faculty" ? "FAC-12345" : "STU-12345 or .edu email"}
                  className="w-full bg-transparent text-[14px] text-[#605e5b] placeholder:text-[#a7a297] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Verification banner */}
          <div className="mt-5 rounded-[14px] bg-[#fafcf3] px-4 py-3.5 border border-[#e6eedc]">
            <div className="flex items-start gap-2.5">
              <span className="mt-[1px]">
                <ShieldCheckIcon />
              </span>
              <div>
                <p className="text-[13.5px] font-semibold text-[#24a37a]">
                  Automatic Verification Enabled
                </p>
                <p className="mt-0.5 text-[12.5px] leading-[1.45] text-[#4c8a68]">
                  Connecting your institution enables automated integrity
                  reports and enterprise-level AI toolsets assigned to your
                  academic plan.
                </p>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 text-[14px] font-medium text-[#1a1a1a] hover:opacity-75 transition-opacity"
            >
              <ArrowLeftIcon />
              Back
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="flex h-11 items-center gap-2 rounded-[12px] bg-[#1a1a1a] px-5 text-[14px] font-medium text-white shadow-[0_4px_10px_rgba(0,0,0,0.18)] hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Linking..." : "Next Step"}
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        {/* Below-card footer text */}
        <p className="mt-7 text-center text-[13px] text-[#75716a]">
          Institution not listed?{" "}
          <span 
            onClick={handleRequestManual}
            className="font-medium text-[#1a1a1a] underline underline-offset-2 hover:no-underline cursor-pointer"
          >
            Request manual verification
          </span>
        </p>
      </div>
    </div>
  );
}
