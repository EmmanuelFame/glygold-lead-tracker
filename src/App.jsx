import { supabase } from "./lib/supabase";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  ClipboardList,
  Download,
  ExternalLink,
  Filter,
  Flame,
  Gauge,
  LayoutDashboard,
  MessageCircle,
  Moon,
  PhoneCall,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function Button({ children, className = "", ...props }) {
  return (
    <button className={`inline-flex min-h-11 items-center justify-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-55 ${className}`} {...props}>
      {children}
    </button>
  );
}

const statuses = [
  "New Lead",
  "Message Ready",
  "Messaged",
  "Replied",
  "Asked Price",
  "Asked for Demo",
  "Demo Sent",
  "Interested",
  "Payment Link Sent",
  "Closed Won",
  "Follow-up Needed",
  "No Response",
  "Not Interested",
  "Closed Lost",
];

const categories = [
  "Fashion",
  "Food / Restaurant",
  "Real Estate",
  "Beauty / Spa",
  "Retail",
  "Cakes / Pastry",
  "Tailoring",
  "Cleaning Service",
  "Coaching",
  "Artisan Service",
  "Digital Creator",
  "Event Vendor",
];

const radarCategories = [
  "Food / Restaurant",
  "Fashion",
  "Beauty / Spa",
  "Cakes / Pastry",
  "Real Estate",
  "Tailoring",
  "Retail",
  "Event Vendor",
];

const defaultRadarSearch = {
  location: "Lagos, Nigeria",
  category: "Food / Restaurant",
  batchSize: 50,
};

const pipelineColumns = [
  { label: "Prospect", statuses: ["New Lead", "Message Ready"] },
  { label: "Contacted", statuses: ["Messaged", "No Response", "Follow-up Needed"] },
  { label: "Engaged", statuses: ["Replied", "Asked Price", "Asked for Demo"] },
  { label: "Decision", statuses: ["Demo Sent", "Interested", "Payment Link Sent"] },
  { label: "Closed", statuses: ["Closed Won", "Closed Lost", "Not Interested"] },
];

const sourceSites = [
  { name: "GlyGold", url: "https://glygold.com", pitch: "commerce engine, payments, shipping, analytics, conversations" },
  { name: "Leah", url: "https://leah.glygold.com", pitch: "personal storefront proof for creators and sellers" },
  { name: "Egame Kitchen", url: "https://egamekitchen.glygold.com", pitch: "food ordering and kitchen commerce proof" },
  { name: "Priceless Pearl", url: "https://pricelesspearl.glygold.com", pitch: "beauty and retail catalog proof" },
  { name: "J Bright", url: "https://jbright.glygold.com", pitch: "service business storefront proof" },
  { name: "Larrit", url: "https://larrit.com", pitch: "independent merchant site reference" },
];

const messagePlaybooks = [
  {
    title: "Warm WhatsApp opener",
    stage: "New Lead",
    copy:
      "Hi {name}, I saw {business}. GlyGold helps businesses sell online with a storefront, payments, delivery flow, analytics, and customer conversations in one place. Would you like me to send a quick example for your category?",
  },
  {
    title: "Demo follow-up",
    stage: "Asked for Demo",
    copy:
      "Hi {name}, I prepared a GlyGold flow for {business}: product page, order checkout, payment link, delivery tracking, and customer chat. Can I send the demo link now?",
  },
  {
    title: "Payment close",
    stage: "Payment Link Sent",
    copy:
      "Hi {name}, your GlyGold setup can start once payment is complete. After that we can configure catalog, checkout, messages, and launch readiness for {business}.",
  },
  {
    title: "No response rescue",
    stage: "No Response",
    copy:
      "Hi {name}, quick check-in. Should I close this for now, or would an online store with payment, delivery, and customer messaging still help {business} this week?",
  },
];

const stageColors = ["#d89b00", "#0f766e", "#2563eb", "#7c3aed", "#16a34a"];

const emptyLeadForm = {
  businessName: "",
  category: "Retail",
  whatsapp: "",
  contactName: "",
  firstMessage: "",
  status: "New Lead",
  lastContacted: "",
  nextFollowUp: "",
  offer: "",
  value: "",
  closedAmount: "",
  notes: "",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return "Not set";
  return String(value).slice(0, 10);
}

function normalizeDate(value) {
  if (!value || value === "Not set") return null;
  return String(value).slice(0, 10);
}

function daysBetween(dateValue, todayValue) {
  if (!dateValue) return null;
  const date = new Date(`${formatDate(dateValue)}T00:00:00`);
  const today = new Date(`${todayValue}T00:00:00`);
  return Math.round((date - today) / 86400000);
}

function addDays(dateValue, days) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function statusTone(status) {
  if (status === "Closed Won") return "bg-emerald-100 text-emerald-800 ring-emerald-200";
  if (["Interested", "Payment Link Sent", "Asked for Demo", "Demo Sent"].includes(status)) return "bg-amber-100 text-amber-800 ring-amber-200";
  if (["Closed Lost", "Not Interested"].includes(status)) return "bg-rose-100 text-rose-800 ring-rose-200";
  if (["Follow-up Needed", "No Response"].includes(status)) return "bg-orange-100 text-orange-800 ring-orange-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function scoreLead(lead, today) {
  let score = 22;
  if (lead.whatsapp_link) score += 10;
  if (lead.first_message) score += 8;
  if (lead.offer_sent) score += 8;
  if (Number(lead.potential_value || 0) >= 250000) score += 16;
  if (Number(lead.potential_value || 0) >= 750000) score += 10;
  if (["Replied", "Asked Price", "Asked for Demo", "Demo Sent", "Interested", "Payment Link Sent"].includes(lead.status)) score += 24;
  if (lead.status === "Closed Won") score += 30;
  if (["No Response", "Closed Lost", "Not Interested"].includes(lead.status)) score -= 18;

  const dueIn = daysBetween(lead.next_followup_at, today);
  if (dueIn !== null && dueIn <= 0 && !["Closed Won", "Closed Lost", "Not Interested"].includes(lead.status)) score += 14;
  if (!lead.next_followup_at && !["Closed Won", "Closed Lost", "Not Interested"].includes(lead.status)) score -= 6;

  return Math.max(0, Math.min(100, score));
}

function categoryFromCandidate(candidate) {
  const haystack = [
    candidate.category,
    candidate.business_name,
    candidate.search_query,
    ...(candidate.types || []),
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("restaurant") || haystack.includes("food") || haystack.includes("meal")) return "Food / Restaurant";
  if (haystack.includes("cake") || haystack.includes("bakery") || haystack.includes("pastry")) return "Cakes / Pastry";
  if (haystack.includes("beauty") || haystack.includes("salon") || haystack.includes("spa")) return "Beauty / Spa";
  if (haystack.includes("fashion") || haystack.includes("boutique") || haystack.includes("clothing")) return "Fashion";
  if (haystack.includes("tailor")) return "Tailoring";
  if (haystack.includes("real estate") || haystack.includes("property")) return "Real Estate";
  if (haystack.includes("event")) return "Event Vendor";
  return "Retail";
}

function candidateOffer(candidate) {
  const category = categoryFromCandidate(candidate);
  if (category === "Food / Restaurant") return "Food ordering website + WhatsApp commerce bot";
  if (category === "Cakes / Pastry") return "Cake catalog, checkout, delivery zones, and order tracking";
  if (category === "Beauty / Spa") return "Beauty storefront, booking inquiries, products, and customer conversations";
  if (category === "Fashion") return "Fashion store with catalog, cart, checkout, wishlist, and delivery tracking";
  if (category === "Real Estate") return "Property inquiry website, lead capture, conversations, and analytics";
  if (category === "Event Vendor") return "Event service website, quote requests, WhatsApp follow-up, and promo creatives";
  return "GlyGold commerce website, dashboard, WhatsApp bot, analytics, and marketing creatives";
}

function candidateValue(candidate) {
  const score = Number(candidate.score || 0);
  if (score >= 85) return 350000;
  if (score >= 72) return 250000;
  if (score >= 60) return 175000;
  return 125000;
}

function getLeadSignal(lead, today) {
  const score = scoreLead(lead, today);
  const dueIn = daysBetween(lead.next_followup_at, today);
  const isClosed = ["Closed Won", "Closed Lost", "Not Interested"].includes(lead.status);

  if (!isClosed && dueIn !== null && dueIn < 0) return { label: "Overdue", tone: "bg-rose-50 text-rose-700 ring-rose-200", priority: 1 };
  if (!isClosed && dueIn === 0) return { label: "Due today", tone: "bg-orange-50 text-orange-700 ring-orange-200", priority: 2 };
  if (score >= 78) return { label: "Hot", tone: "bg-amber-50 text-amber-700 ring-amber-200", priority: 3 };
  if (["Replied", "Asked Price", "Asked for Demo"].includes(lead.status)) return { label: "Engaged", tone: "bg-cyan-50 text-cyan-700 ring-cyan-200", priority: 4 };
  return { label: "Nurture", tone: "bg-slate-100 text-slate-700 ring-slate-200", priority: 5 };
}

function getWhatsappHref(lead, message) {
  const raw = lead.whatsapp_link || "";
  if (raw.startsWith("http")) {
    return message ? `${raw}${raw.includes("?") ? "&" : "?"}text=${encodeURIComponent(message)}` : raw;
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "#";
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

function personalize(template, lead) {
  return template
    .replaceAll("{business}", lead?.business_name || "your business")
    .replaceAll("{name}", lead?.contact_name || lead?.business_name || "there");
}

export default function GlyGoldLeadTrackerApp() {
  const fileInputRef = useRef(null);
  const [leads, setLeads] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [signalFilter, setSignalFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState(null);
  const [editLead, setEditLead] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState(emptyLeadForm);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [candidateLoading, setCandidateLoading] = useState(true);
  const [radarRunning, setRadarRunning] = useState(false);
  const [promotingCandidateId, setPromotingCandidateId] = useState("");
  const [leadCandidates, setLeadCandidates] = useState([]);
  const [radarForm, setRadarForm] = useState(defaultRadarSearch);
  const [radarMessage, setRadarMessage] = useState("");
  const [phoneOnly, setPhoneOnly] = useState(true);
  const [withoutWebsiteOnly, setWithoutWebsiteOnly] = useState(true);
  const [radarOffset, setRadarOffset] = useState(0);

  const today = new Date().toISOString().slice(0, 10);
  const chartGrid = isDark ? "#334155" : "#e2e8f0";
  const chartText = isDark ? "#cbd5e1" : "#475569";
  const primaryChart = isDark ? "#f4bd18" : "#0f172a";
  const secondaryChart = isDark ? "#38bdf8" : "#d89b00";

  async function fetchLeads() {
    await Promise.resolve();
    setLoading(true);

    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Could not load leads.");
      return;
    }

    setLeads(data || []);
    setSelectedLead(data?.[0] || null);
    setEditLead(data?.[0] ? { ...data[0] } : null);
  }

  async function fetchCandidates() {
    await Promise.resolve();
    setCandidateLoading(true);

    const { data, error } = await supabase
      .from("lead_candidates")
      .select("*")
      .in("status", ["new", "reviewing"])
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(100);

    setCandidateLoading(false);

    if (error) {
      console.info("Lead Radar candidates are not available yet.", error.message);
      setLeadCandidates([]);
      return;
    }

    setLeadCandidates(data || []);
  }

  useEffect(() => {
    queueMicrotask(() => {
      fetchLeads();
      fetchCandidates();
    });
  }, []);

  function selectLead(lead) {
    setSelectedLead(lead);
    setEditLead({ ...lead });
  }

  const enrichedLeads = useMemo(() => {
    return leads.map((lead) => ({
      ...lead,
      leadScore: scoreLead(lead, today),
      signal: getLeadSignal(lead, today),
      dueIn: daysBetween(lead.next_followup_at, today),
    }));
  }, [leads, today]);

  const filteredLeads = useMemo(() => {
    return enrichedLeads
      .filter((lead) => {
        const matchesQuery = [
          lead.business_name,
          lead.category,
          lead.status,
          lead.offer_sent,
          lead.notes,
          lead.first_message,
          lead.contact_name,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());

        return (
          matchesQuery &&
          (statusFilter === "All" || lead.status === statusFilter) &&
          (categoryFilter === "All" || lead.category === categoryFilter) &&
          (signalFilter === "All" || lead.signal.label === signalFilter)
        );
      })
      .sort((a, b) => a.signal.priority - b.signal.priority || b.leadScore - a.leadScore);
  }, [enrichedLeads, query, statusFilter, categoryFilter, signalFilter]);

  const stats = useMemo(() => {
    const totalValue = leads.reduce((sum, lead) => sum + Number(lead.potential_value || 0), 0);
    const closedValue = leads.reduce((sum, lead) => sum + Number(lead.closed_amount || 0), 0);
    const dueToday = enrichedLeads.filter((lead) => lead.dueIn !== null && lead.dueIn <= 0 && !["Closed Won", "Closed Lost", "Not Interested"].includes(lead.status)).length;
    const hot = enrichedLeads.filter((lead) => lead.leadScore >= 78 && !["Closed Won", "Closed Lost", "Not Interested"].includes(lead.status)).length;
    const replied = leads.filter((lead) => ["Replied", "Asked Price", "Asked for Demo", "Demo Sent", "Interested", "Payment Link Sent"].includes(lead.status)).length;
    const closed = leads.filter((lead) => lead.status === "Closed Won").length;
    const conversion = leads.length ? Math.round((closed / leads.length) * 100) : 0;
    const avgScore = enrichedLeads.length ? Math.round(enrichedLeads.reduce((sum, lead) => sum + lead.leadScore, 0) / enrichedLeads.length) : 0;

    return { totalValue, closedValue, dueToday, hot, replied, closed, conversion, avgScore };
  }, [leads, enrichedLeads]);

  const pipelineData = useMemo(() => {
    return pipelineColumns.map((column) => {
      const columnLeads = leads.filter((lead) => column.statuses.includes(lead.status));
      return {
        stage: column.label,
        count: columnLeads.length,
        value: columnLeads.reduce((sum, lead) => sum + Number(lead.potential_value || 0), 0),
      };
    });
  }, [leads]);

  const categoryData = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        leads: leads.filter((lead) => lead.category === category).length,
      }))
      .filter((item) => item.leads > 0)
      .slice(0, 7);
  }, [leads]);

  const commandQueue = useMemo(() => {
    return enrichedLeads
      .filter((lead) => !["Closed Won", "Closed Lost", "Not Interested"].includes(lead.status))
      .sort((a, b) => a.signal.priority - b.signal.priority || b.leadScore - a.leadScore)
      .slice(0, 6);
  }, [enrichedLeads]);

  const visibleCandidates = useMemo(() => {
    return leadCandidates.filter((candidate) => {
      if (phoneOnly && !candidate.phone) return false;
      if (withoutWebsiteOnly && candidate.website_url) return false;
      return true;
    });
  }, [leadCandidates, phoneOnly, withoutWebsiteOnly]);

  async function updateLead(leadId, updates, successMessage = "") {
    setUpdating(true);

    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", leadId)
      .select()
      .single();

    setUpdating(false);

    if (error) {
      console.error(error);
      alert("Update failed.");
      return null;
    }

    setLeads((current) => current.map((lead) => (lead.id === leadId ? data : lead)));
    setSelectedLead(data);
    setEditLead({ ...data });

    if (successMessage) alert(successMessage);
    return data;
  }

  async function updateLeadStatus(leadId, status) {
    const followup = ["Messaged", "Replied", "Asked Price", "Asked for Demo"].includes(status)
      ? { last_contacted_at: today, next_followup_at: addDays(today, 2) }
      : {};

    await updateLead(leadId, { status, ...followup });
  }

  async function saveLeadEdits() {
    if (!editLead?.id) return;

    await updateLead(
      editLead.id,
      {
        business_name: editLead.business_name || "",
        category: editLead.category || "Retail",
        whatsapp_link: editLead.whatsapp_link || "",
        contact_name: editLead.contact_name || "",
        first_message: editLead.first_message || "",
        status: editLead.status || "New Lead",
        offer_sent: editLead.offer_sent || "",
        potential_value: Number(editLead.potential_value || 0),
        closed_amount: Number(editLead.closed_amount || 0),
        notes: editLead.notes || "",
        last_contacted_at: normalizeDate(editLead.last_contacted_at),
        next_followup_at: normalizeDate(editLead.next_followup_at),
      },
      "Lead updated successfully."
    );
  }

  async function deleteLead(leadId) {
    if (!confirm("Delete this lead permanently?")) return;

    const { error } = await supabase.from("leads").delete().eq("id", leadId);

    if (error) {
      console.error(error);
      alert("Delete failed.");
      return;
    }

    const remaining = leads.filter((lead) => lead.id !== leadId);
    setLeads(remaining);
    setSelectedLead(remaining[0] || null);
    setEditLead(remaining[0] ? { ...remaining[0] } : null);
  }

  async function addLead() {
    if (!newLead.businessName.trim()) return;
    setSaving(true);

    const payload = {
      business_name: newLead.businessName,
      category: newLead.category,
      whatsapp_link: newLead.whatsapp,
      contact_name: newLead.contactName,
      first_message: newLead.firstMessage,
      status: newLead.status,
      offer_sent: newLead.offer,
      potential_value: Number(newLead.value || 0),
      closed_amount: Number(newLead.closedAmount || 0),
      notes: newLead.notes,
      last_contacted_at: newLead.lastContacted || null,
      next_followup_at: newLead.nextFollowUp || null,
    };

    const { data, error } = await supabase.from("leads").insert(payload).select().single();
    setSaving(false);

    if (error) {
      console.error(error);
      alert("Failed to save lead.");
      return;
    }

    setLeads((current) => [data, ...current]);
    selectLead(data);
    setShowAddForm(false);
    setNewLead(emptyLeadForm);
  }

  async function runLeadRadar(offset = 0) {
    setRadarRunning(true);
    setRadarMessage("");

    const payload = {
      location: radarForm.location,
      category: radarForm.category,
      batchSize: Number(radarForm.batchSize || 50),
      phoneOnly,
      withoutWebsiteOnly,
      offset,
    };

    try {
      const response = await fetch("/.netlify/functions/generate-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Lead Radar failed.");
      }

      setLeadCandidates(result.candidates || []);
      setRadarOffset(offset + Math.min(Math.max(Number(radarForm.batchSize || 50) * 3, 20), 100));
      setRadarMessage(`${result.provider || "Lead Radar"} generated ${result.inserted || 0} candidates. ${result.skippedWithoutPhone || 0} without public phones and ${result.skippedWithWebsite || 0} with websites were skipped. ${result.duplicates || 0} were already in the radar.`);
    } catch (error) {
      console.error(error);
      setRadarMessage(error.message || "Lead Radar failed. Check Netlify environment variables and Supabase setup.");
    } finally {
      setRadarRunning(false);
    }
  }

  async function promoteCandidate(candidate) {
    setPromotingCandidateId(candidate.id);

    try {
      const response = await fetch("/.netlify/functions/promote-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not promote candidate.");
      }

      const promotedLead = result.lead;
      setLeads((current) => [promotedLead, ...current]);
      selectLead(promotedLead);
      setLeadCandidates((current) => current.filter((item) => item.id !== candidate.id));
      setRadarMessage(`${candidate.business_name} moved into the lead tracker.`);
    } catch (error) {
      console.error(error);
      setRadarMessage(error.message || "Could not promote candidate.");
    } finally {
      setPromotingCandidateId("");
    }
  }

  async function rejectCandidate(candidateId) {
    const { error } = await supabase
      .from("lead_candidates")
      .update({ status: "rejected" })
      .eq("id", candidateId);

    if (error) {
      console.error(error);
      setRadarMessage("Could not reject candidate.");
      return;
    }

    setLeadCandidates((current) => current.filter((candidate) => candidate.id !== candidateId));
  }

  function importCsv(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data || [];
        const payload = rows
          .filter((row) => row["Business Name"] || row.business_name || row.businessName)
          .map((row) => ({
            business_name: row["Business Name"] || row.business_name || row.businessName || "",
            category: row.Category || row.category || "Retail",
            whatsapp_link: row.WhatsApp || row.whatsapp_link || row.whatsapp || "",
            contact_name: row["Contact Name"] || row.contact_name || row.contactName || "",
            first_message: row["First Message"] || row.first_message || row.firstMessage || "",
            status: row.Status || row.status || "New Lead",
            offer_sent: row.Offer || row["Offer Sent"] || row.offer_sent || row.offer || "",
            potential_value: Number(row.Value || row.potential_value || row.value || 0),
            closed_amount: Number(row["Closed Amount"] || row.closed_amount || row.closedAmount || 0),
            notes: row.Notes || row.notes || "",
            last_contacted_at: normalizeDate(row["Last Contacted"] || row.last_contacted_at || row.lastContacted),
            next_followup_at: normalizeDate(row["Next Follow-up"] || row.next_followup_at || row.nextFollowUp),
          }));

        if (!payload.length) {
          setImporting(false);
          event.target.value = "";
          alert("No valid leads found. Use a Business Name column.");
          return;
        }

        const { data, error } = await supabase.from("leads").insert(payload).select();
        setImporting(false);
        event.target.value = "";

        if (error) {
          console.error(error);
          alert("CSV import failed.");
          return;
        }

        setLeads((current) => [...(data || []), ...current]);
        if (data?.[0]) selectLead(data[0]);
        alert(`${data?.length || 0} leads imported successfully.`);
      },
      error: (error) => {
        console.error(error);
        setImporting(false);
        event.target.value = "";
        alert("Could not read CSV file.");
      },
    });
  }

  function exportCsv() {
    const headers = ["Business Name", "Contact Name", "Category", "WhatsApp", "Status", "Lead Score", "Last Contacted", "Next Follow-up", "Offer", "Value", "Closed Amount", "First Message", "Notes"];
    const rows = enrichedLeads.map((lead) => [
      lead.business_name,
      lead.contact_name,
      lead.category,
      lead.whatsapp_link,
      lead.status,
      lead.leadScore,
      formatDate(lead.last_contacted_at),
      formatDate(lead.next_followup_at),
      lead.offer_sent,
      lead.potential_value,
      lead.closed_amount,
      lead.first_message,
      lead.notes,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `glygold-leads-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyMessage(text, title) {
    await navigator.clipboard.writeText(text);
    setCopied(title);
    setTimeout(() => setCopied(""), 1800);
  }

  const selectedScore = selectedLead ? scoreLead(selectedLead, today) : 0;
  const selectedTemplate = messagePlaybooks.find((playbook) => playbook.stage === selectedLead?.status) || messagePlaybooks[0];
  const selectedMessage = selectedLead ? personalize(selectedTemplate.copy, selectedLead) : "";

  return (
    <div className={isDark ? "dark" : ""}>
    <div className="min-h-screen bg-[#f7f4ec] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" />
      <header className="border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-950 text-[#f4bd18] dark:bg-[#f4bd18] dark:text-slate-950">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>GlyGold sales cockpit</span>
                <span className="rounded-full bg-[#f4bd18]/20 px-2 py-0.5 text-slate-800 dark:text-amber-100">{today}</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Lead intelligence and outreach command center</h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Track every prospect, message cadence, follow-up, offer, value, and next best action for selling GlyGold storefronts and commerce workflows.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button
              onClick={() => setIsDark((current) => !current)}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {isDark ? "Light" : "Dark"}
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 dark:bg-[#f4bd18] dark:text-slate-950 dark:hover:bg-amber-300">
              <Plus className="h-4 w-4" /> Add lead
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" /> {importing ? "Importing" : "Upload CSV"}
            </Button>
            <Button onClick={exportCsv} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={fetchLeads} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-3 py-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_390px] lg:px-8">
        <aside className="space-y-4">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle icon={LayoutDashboard} title="Performance" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{leads.length} leads</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Due" value={stats.dueToday} tone={stats.dueToday ? "text-rose-700 dark:text-rose-300" : "text-slate-950 dark:text-slate-100"} />
              <Metric label="Hot" value={stats.hot} tone="text-amber-700 dark:text-amber-300" />
              <Metric label="Won" value={stats.closed} tone="text-emerald-700 dark:text-emerald-300" />
              <Metric label="Conv." value={`${stats.conversion}%`} tone="text-slate-950 dark:text-slate-100" />
            </div>
            <div className="mt-3 rounded-md bg-slate-950 p-3 text-white dark:bg-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Average lead score</span>
                <span>{stats.avgScore}/100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/15">
                <div className="h-2 rounded-full bg-[#f4bd18]" style={{ width: `${stats.avgScore}%` }} />
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={Target} title="GlyGold proof sites" />
            <div className="mt-3 space-y-2">
              {sourceSites.map((site) => (
                <a key={site.url} href={site.url} target="_blank" rel="noreferrer" className="group block rounded-md border border-slate-200 bg-white p-3 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{site.name}</span>
                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100" />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{site.pitch}</p>
                </a>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={ClipboardList} title="Daily operating rhythm" />
            <div className="mt-3 space-y-2">
              <ChecklistItem done={leads.length >= 25} label={`Prospect 25 businesses (${leads.length}/25)`} />
              <ChecklistItem done={leads.filter((lead) => lead.status === "Messaged").length >= 15} label={`Send 15 openers (${leads.filter((lead) => lead.status === "Messaged").length}/15)`} />
              <ChecklistItem done={stats.dueToday === 0} urgent={stats.dueToday > 0} label={`Clear follow-ups (${stats.dueToday} waiting)`} />
              <ChecklistItem done={stats.replied >= 5} label={`Push 5 replies to demo (${stats.replied}/5)`} />
            </div>
          </Panel>
        </aside>

        <section className="space-y-5">
          <Panel className="p-4">
            <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div>
                <SectionTitle icon={Search} title="Lead Radar" />
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Generate a fresh qualified batch, review the best businesses, then approve them into the tracker before you message them.
                </p>

                <div className="mt-4 space-y-3">
                  <FormInput label="City / Market" value={radarForm.location} onChange={(value) => {
                    setRadarOffset(0);
                    setRadarForm({ ...radarForm, location: value });
                  }} />
                  <FormSelect label="Business Category" value={radarForm.category} options={radarCategories} onChange={(value) => {
                    setRadarOffset(0);
                    setRadarForm({ ...radarForm, category: value });
                  }} />

                  <div>
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">Batch size</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[20, 50, 100].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setRadarOffset(0);
                            setRadarForm({ ...radarForm, batchSize: size });
                          }}
                          className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                            Number(radarForm.batchSize) === size
                              ? "border-[#f4bd18] bg-[#f4bd18]/20 text-slate-950 dark:text-amber-100"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                          }`}
                        >
                          {size} leads
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <input
                      type="checkbox"
                      checked={phoneOnly}
                      onChange={(event) => setPhoneOnly(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-emerald-600"
                    />
                    <span>
                      <span className="block font-semibold text-emerald-900 dark:text-emerald-200">Public phone numbers only</span>
                      <span className="mt-1 block leading-5 text-emerald-800 dark:text-emerald-300">
                        Best for manual WhatsApp checks. The provider supplies a phone number, but cannot confirm WhatsApp registration.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                    <input
                      type="checkbox"
                      checked={withoutWebsiteOnly}
                      onChange={(event) => setWithoutWebsiteOnly(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-amber-600"
                    />
                    <span>
                      <span className="block font-semibold text-amber-900 dark:text-amber-100">No website found only</span>
                      <span className="mt-1 block leading-5 text-amber-800 dark:text-amber-200">
                        Prioritizes businesses with a clearer need for a GlyGold storefront and commerce system.
                      </span>
                    </span>
                  </label>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button onClick={() => runLeadRadar(0)} disabled={radarRunning} className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-[#f4bd18] dark:text-slate-950 dark:hover:bg-amber-300">
                      <Sparkles className="h-4 w-4" /> {radarRunning ? "Generating" : "Generate fresh leads"}
                    </Button>
                    <Button onClick={() => runLeadRadar(radarOffset)} disabled={radarRunning || radarOffset === 0} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                      <RefreshCw className="h-4 w-4" /> Search next page
                    </Button>
                  </div>

                  {radarMessage ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
                      {radarMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">Candidate queue</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{visibleCandidates.length} Geoapify businesses waiting for review</p>
                  </div>
                  <div className="rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Approve only the businesses you want to message
                  </div>
                </div>

                <div className="grid max-h-[560px] gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
                  {candidateLoading ? (
                    <CandidateState text="Loading candidate queue..." />
                  ) : visibleCandidates.length === 0 ? (
                    <CandidateState text={phoneOnly && withoutWebsiteOnly ? "No businesses with a public phone and no website were found yet. Try another category or market." : phoneOnly ? "No candidates with public phone numbers found yet. Try another category or market." : withoutWebsiteOnly ? "No candidates without websites found yet. Try another category or market." : "No candidates yet. Generate a fresh Geoapify batch to start."} />
                  ) : (
                    visibleCandidates.map((candidate) => (
                      <div key={candidate.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-slate-950 dark:text-slate-100">{candidate.business_name}</h3>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{candidate.address || candidate.search_location || "Location not returned"}</p>
                          </div>
                          <div className="shrink-0 rounded-md bg-[#f4bd18]/20 px-2.5 py-1 text-sm font-bold text-amber-800 dark:text-amber-100">
                            {candidate.score || 0}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">Geoapify</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{categoryFromCandidate(candidate)}</span>
                          {candidate.phone ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Public phone found</span> : null}
                          {candidate.website_url ? <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">Has website</span> : <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">No website</span>}
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{formatCurrency(candidateValue(candidate))}</span>
                          {candidate.rating ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{candidate.rating} rating</span> : null}
                        </div>

                        <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          {(candidate.score_reasons || []).slice(0, 3).join(" • ") || candidateOffer(candidate)}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {candidate.maps_url ? (
                            <a href={candidate.maps_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
                              <ExternalLink className="h-4 w-4" /> Map
                            </a>
                          ) : null}
                          {candidate.website_url ? (
                            <a href={candidate.website_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
                              <ExternalLink className="h-4 w-4" /> Site
                            </a>
                          ) : null}
                          <Button onClick={() => promoteCandidate(candidate)} disabled={promotingCandidateId === candidate.id} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                            <Plus className="h-4 w-4" /> {promotingCandidateId === candidate.id ? "Approving" : "Approve"}
                          </Button>
                          <Button onClick={() => rejectCandidate(candidate.id)} className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
                            <X className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={Gauge} label="Pipeline value" value={formatCurrency(stats.totalValue)} helper="Open and closed potential" />
            <KpiCard icon={Activity} label="Revenue won" value={formatCurrency(stats.closedValue)} helper="Closed amount recorded" />
            <KpiCard icon={CalendarClock} label="Follow-up pressure" value={stats.dueToday} helper="Due or overdue today" urgent={stats.dueToday > 0} />
            <KpiCard icon={Flame} label="Hot accounts" value={stats.hot} helper="Score 78+ and active" />
          </div>

          <Panel className="p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <SectionTitle icon={Filter} title="Lead pipeline" />
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sorted by urgency, lead score, and current sales signal.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[260px_170px_170px_150px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search lead, notes, offer..."
                    className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-[#f4bd18]/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
                <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["All", ...statuses]} />
                <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={["All", ...categories]} />
                <FilterSelect value={signalFilter} onChange={setSignalFilter} options={["All", "Overdue", "Due today", "Hot", "Engaged", "Nurture"]} />
              </div>
            </div>

            <div className="mt-4 space-y-3 md:hidden">
              {loading ? (
                <div className="rounded-md border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">Loading leads...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="rounded-md border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">No matching leads. Add a prospect or loosen the filters.</div>
              ) : (
                filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => selectLead(lead)}
                    className={`w-full rounded-lg border p-4 text-left shadow-sm transition ${
                      selectedLead?.id === lead.id
                        ? "border-amber-300 bg-amber-50 dark:border-amber-400/60 dark:bg-amber-400/10"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-950 dark:text-slate-100">{lead.business_name}</div>
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{lead.category || "Uncategorized"}{lead.contact_name ? ` • ${lead.contact_name}` : ""}</div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${lead.signal.tone}`}>{lead.signal.label}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{lead.status}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Value</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(lead.potential_value)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Follow-up</div>
                        <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{formatDate(lead.next_followup_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Score</div>
                        <div className="mt-1">
                          <ScoreMeter score={lead.leadScore} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a
                        href={getWhatsappHref(lead, personalize(selectedTemplate.copy, lead))}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                      <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                        Open details
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 hidden overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800 md:block">
              <table className="w-full min-w-[1050px] bg-white text-left text-sm dark:bg-slate-950">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Signal</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Follow-up</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-slate-500">Loading leads...</td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-slate-500">No matching leads. Add a prospect or loosen the filters.</td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => selectLead(lead)}
                        className={`cursor-pointer transition hover:bg-[#fff8e1] dark:hover:bg-slate-900 ${selectedLead?.id === lead.id ? "bg-[#fff2bd] dark:bg-amber-400/10" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-950 dark:text-slate-100">{lead.business_name}</div>
                          <div className="mt-1 flex max-w-sm flex-wrap gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>{lead.category || "Uncategorized"}</span>
                            {lead.contact_name ? <span>• {lead.contact_name}</span> : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${lead.signal.tone}`}>{lead.signal.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.status}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => updateLeadStatus(lead.id, event.target.value)}
                            className={`rounded-full px-3 py-2 text-xs font-semibold outline-none ring-1 ${statusTone(lead.status)}`}
                          >
                            {statuses.map((status) => <option key={status}>{status}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <ScoreMeter score={lead.leadScore} />
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          <div className="font-medium">{formatDate(lead.next_followup_at)}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{lead.dueIn === null ? "No cadence" : lead.dueIn < 0 ? `${Math.abs(lead.dueIn)}d overdue` : lead.dueIn === 0 ? "Today" : `In ${lead.dueIn}d`}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(lead.potential_value)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={getWhatsappHref(lead, personalize(selectedTemplate.copy, lead))}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              aria-label={`Message ${lead.business_name}`}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteLead(lead.id);
                              }}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100"
                              aria-label={`Delete ${lead.business_name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Panel className="p-4">
              <SectionTitle icon={BarChart3} title="Stage velocity" />
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pipelineData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="stage" tick={{ fontSize: 12, fill: chartText }} />
                    <YAxis tick={{ fontSize: 12, fill: chartText }} />
                    <Tooltip formatter={(value, name) => (name === "value" ? formatCurrency(value) : value)} contentStyle={{ background: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f8fafc" : "#0f172a" }} />
                    <Line type="monotone" dataKey="count" name="Leads" stroke={primaryChart} strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="value" name="Value" stroke={secondaryChart} strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel className="p-4">
              <SectionTitle icon={Users} title="Category focus" />
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 8, right: 12, left: 18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: chartText }} allowDecimals={false} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: chartText }} width={96} />
                    <Tooltip contentStyle={{ background: isDark ? "#0f172a" : "#ffffff", borderColor: isDark ? "#334155" : "#e2e8f0", color: isDark ? "#f8fafc" : "#0f172a" }} />
                    <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.category} fill={stageColors[index % stageColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>
        </section>

        <aside className="space-y-5">
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle icon={PhoneCall} title="Next best actions" />
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{commandQueue.length} queued</span>
            </div>
            <div className="mt-3 space-y-2">
              {commandQueue.length === 0 ? (
                <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">No active accounts need attention.</p>
              ) : (
                commandQueue.map((lead) => (
                  <button key={lead.id} onClick={() => selectLead(lead)} className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 text-left hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-600">
                    <div>
                      <div className="text-sm font-semibold">{lead.business_name}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{lead.signal.label} • {lead.status} • {lead.leadScore}/100</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))
              )}
            </div>
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={Send} title="Message studio" />
            {selectedLead ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-md bg-slate-950 p-4 text-white dark:bg-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Selected account</p>
                      <h2 className="mt-1 text-lg font-bold">{selectedLead.business_name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Score</p>
                      <p className="text-2xl font-bold text-[#f4bd18]">{selectedScore}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{selectedTemplate.title}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedTemplate.stage}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">{selectedMessage}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => copyMessage(selectedMessage, selectedTemplate.title)} className="rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <Clipboard className="h-4 w-4" /> {copied ? "Copied" : "Copy"}
                  </Button>
                  <a href={getWhatsappHref(selectedLead, selectedMessage)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </div>

                <div className="space-y-2">
                  {messagePlaybooks.map((playbook) => (
                    <button
                      key={playbook.title}
                      onClick={() => copyMessage(personalize(playbook.copy, selectedLead), playbook.title)}
                      className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 text-left text-sm hover:border-slate-400 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-600"
                    >
                      <span>{playbook.title}</span>
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">Select a lead to generate outreach copy.</p>
            )}
          </Panel>

          <Panel className="p-4">
            <SectionTitle icon={Save} title="Lead control panel" />
            {editLead ? (
              <div className="mt-4 space-y-3">
                <FormInput label="Business Name" value={editLead.business_name || ""} onChange={(value) => setEditLead({ ...editLead, business_name: value })} />
                <FormInput label="Contact Name" value={editLead.contact_name || ""} onChange={(value) => setEditLead({ ...editLead, contact_name: value })} />
                <FormInput label="WhatsApp Link or Phone" value={editLead.whatsapp_link || ""} onChange={(value) => setEditLead({ ...editLead, whatsapp_link: value })} />
                <div className="grid grid-cols-2 gap-3">
                  <FormSelect label="Category" value={editLead.category || "Retail"} options={categories} onChange={(value) => setEditLead({ ...editLead, category: value })} />
                  <FormSelect label="Status" value={editLead.status || "New Lead"} options={statuses} onChange={(value) => setEditLead({ ...editLead, status: value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Last Contacted" type="date" value={formatDate(editLead.last_contacted_at) === "Not set" ? "" : formatDate(editLead.last_contacted_at)} onChange={(value) => setEditLead({ ...editLead, last_contacted_at: value })} />
                  <FormInput label="Next Follow-up" type="date" value={formatDate(editLead.next_followup_at) === "Not set" ? "" : formatDate(editLead.next_followup_at)} onChange={(value) => setEditLead({ ...editLead, next_followup_at: value })} />
                </div>
                <FormInput label="Offer / Package" value={editLead.offer_sent || ""} onChange={(value) => setEditLead({ ...editLead, offer_sent: value })} />
                <div className="grid grid-cols-2 gap-3">
                  <FormInput label="Potential Value" type="number" value={editLead.potential_value || ""} onChange={(value) => setEditLead({ ...editLead, potential_value: value })} />
                  <FormInput label="Closed Amount" type="number" value={editLead.closed_amount || ""} onChange={(value) => setEditLead({ ...editLead, closed_amount: value })} />
                </div>
                <FormTextarea label="First Message" value={editLead.first_message || ""} onChange={(value) => setEditLead({ ...editLead, first_message: value })} />
                <FormTextarea label="Notes" value={editLead.notes || ""} onChange={(value) => setEditLead({ ...editLead, notes: value })} />
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button onClick={saveLeadEdits} disabled={updating} className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-[#f4bd18] dark:text-slate-950 dark:hover:bg-amber-300">
                    <Save className="h-4 w-4" /> {updating ? "Saving" : "Save"}
                  </Button>
                  <Button onClick={() => setEditLead(selectedLead ? { ...selectedLead } : null)} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <X className="h-4 w-4" /> Reset
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">Select a lead to edit pipeline details.</p>
            )}
          </Panel>
        </aside>
      </main>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Add sales lead</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Capture a prospect, prepare the opener, and place them into the cadence.</p>
              </div>
              <Button onClick={() => setShowAddForm(false)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800">
                <X className="h-4 w-4" /> Close
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Business Name" value={newLead.businessName} onChange={(value) => setNewLead({ ...newLead, businessName: value })} />
              <FormInput label="Contact Name" value={newLead.contactName} onChange={(value) => setNewLead({ ...newLead, contactName: value })} />
              <FormInput label="WhatsApp Link or Phone" value={newLead.whatsapp} onChange={(value) => setNewLead({ ...newLead, whatsapp: value })} />
              <FormSelect label="Category" value={newLead.category} options={categories} onChange={(value) => setNewLead({ ...newLead, category: value })} />
              <FormSelect label="Status" value={newLead.status} options={statuses} onChange={(value) => setNewLead({ ...newLead, status: value })} />
              <FormInput label="Offer / Package" value={newLead.offer} onChange={(value) => setNewLead({ ...newLead, offer: value })} />
              <FormInput label="Last Contacted" type="date" value={newLead.lastContacted} onChange={(value) => setNewLead({ ...newLead, lastContacted: value })} />
              <FormInput label="Next Follow-up" type="date" value={newLead.nextFollowUp} onChange={(value) => setNewLead({ ...newLead, nextFollowUp: value })} />
              <FormInput label="Potential Value" type="number" value={newLead.value} onChange={(value) => setNewLead({ ...newLead, value })} />
              <FormInput label="Closed Amount" type="number" value={newLead.closedAmount} onChange={(value) => setNewLead({ ...newLead, closedAmount: value })} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormTextarea label="First Message" value={newLead.firstMessage} onChange={(value) => setNewLead({ ...newLead, firstMessage: value })} />
              <FormTextarea label="Notes" value={newLead.notes} onChange={(value) => setNewLead({ ...newLead, notes: value })} />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={addLead} disabled={saving} className="rounded-md bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-[#f4bd18] dark:text-slate-950 dark:hover:bg-amber-300">
                <Plus className="h-4 w-4" /> {saving ? "Saving" : "Save lead"}
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <Upload className="h-4 w-4" /> {importing ? "Importing" : "Upload CSV"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function Panel({ children, className = "" }) {
  return <section className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 ${className}`}>{children}</section>;
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#f4bd18]/20 text-slate-950">
        {createElement(Icon, { className: "h-4 w-4" })}
      </span>
      <h2 className="text-base font-bold text-slate-950 dark:text-slate-100">{title}</h2>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, helper, urgent }) {
  return (
    <Panel className={`p-4 ${urgent ? "ring-2 ring-rose-200" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helper}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-md ${urgent ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"}`}>
          {createElement(Icon, { className: "h-5 w-5" })}
        </div>
      </div>
    </Panel>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-[#f4bd18]/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}

function ScoreMeter({ score }) {
  const color = score >= 78 ? "bg-amber-500" : score >= 55 ? "bg-cyan-600" : "bg-slate-500";

  return (
    <div className="w-28">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold">{score}</span>
        <span className="text-slate-500 dark:text-slate-400">/100</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ChecklistItem({ label, done, urgent }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : urgent ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-300" />}
      <span className={`text-sm leading-5 ${done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300"}`}>{label}</span>
    </div>
  );
}

function CandidateState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:col-span-2">
      {text}
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-[#f4bd18]/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
    </label>
  );
}

function FormSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-700 focus:ring-2 focus:ring-[#f4bd18]/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function FormTextarea({ label, value, onChange, rows = 5 }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-slate-700 focus:ring-2 focus:ring-[#f4bd18]/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
    </label>
  );
}
