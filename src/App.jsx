import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Upload,
  MessageCircle,
  CalendarClock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  MoreHorizontal,
  ClipboardList,
  Target,
  Users,
  DollarSign,
} from "lucide-react";

function Card({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Button({
  children,
  className = "",
  variant,
  ...props
}) {
  return (
    <button
      className={className}
      {...props}
    >
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
];

const initialLeads = [
  {
    id: 1,
    businessName: "Amyna Attire",
    category: "Fashion",
    whatsapp: "https://wa.me/2349169392780",
    contactName: "",
    firstMessage:
      "Hi Amyna 👋 saw your new two-piece drop — quick thought: how are you tracking sizes, colors, orders and delivery from DMs?",
    status: "Messaged",
    lastContacted: "2026-05-24",
    nextFollowUp: "2026-05-25",
    offer: "GlyGold fashion store",
    value: 75000,
    closedAmount: 0,
    notes: "Posted new collection. Good fit for fashion storefront + WhatsApp order flow.",
  },
  {
    id: 2,
    businessName: "Egame Kitchen",
    category: "Food / Restaurant",
    whatsapp: "https://wa.me/79526267287",
    contactName: "",
    firstMessage:
      "Hi 👋 your food presentation looks really good. Do you currently take orders mainly through WhatsApp or do customers have a menu link?",
    status: "Interested",
    lastContacted: "2026-05-23",
    nextFollowUp: "2026-05-24",
    offer: "Food ordering website + WhatsApp flow",
    value: 125000,
    closedAmount: 0,
    notes: "Needs structured weekly order system and delivery explanation.",
  },
  {
    id: 3,
    businessName: "Larrit Properties",
    category: "Real Estate",
    whatsapp: "https://wa.me/2340000000000",
    contactName: "",
    firstMessage:
      "Hi 👋 I noticed your property services. GlyGold can help you turn inquiries into a cleaner booking and lead capture flow.",
    status: "Payment Link Sent",
    lastContacted: "2026-05-22",
    nextFollowUp: "2026-05-24",
    offer: "Property inquiry website + lead capture",
    value: 125000,
    closedAmount: 0,
    notes: "Payment link sent. Follow up politely with onboarding checklist.",
  },
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function statusTone(status) {
  if (["Closed Won"].includes(status)) return "bg-emerald-100 text-emerald-700";
  if (["Interested", "Payment Link Sent", "Asked for Demo", "Demo Sent"].includes(status)) return "bg-amber-100 text-amber-700";
  if (["Closed Lost", "Not Interested"].includes(status)) return "bg-rose-100 text-rose-700";
  if (["Follow-up Needed", "No Response"].includes(status)) return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-700";
}

export default function GlyGoldLeadTrackerApp() {
  const [leads, setLeads] = useState(initialLeads);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState(initialLeads[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLead, setNewLead] = useState({
    businessName: "",
    category: "Fashion",
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
  });

  const today = "2026-05-24";

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesQuery = [lead.businessName, lead.category, lead.status, lead.offer, lead.notes]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || lead.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [leads, query, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const totalValue = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    const closedValue = leads.reduce((sum, lead) => sum + Number(lead.closedAmount || 0), 0);
    const dueToday = leads.filter((lead) => lead.nextFollowUp && lead.nextFollowUp <= today && lead.status !== "Closed Won").length;
    const interested = leads.filter((lead) => ["Interested", "Asked for Demo", "Demo Sent", "Payment Link Sent"].includes(lead.status)).length;
    const closed = leads.filter((lead) => lead.status === "Closed Won").length;
    return { totalValue, closedValue, dueToday, interested, closed };
  }, [leads]);

  const updateLeadStatus = (leadId, status) => {
    setLeads((current) => current.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
    if (selectedLead?.id === leadId) setSelectedLead((lead) => ({ ...lead, status }));
  };

  const addLead = () => {
    if (!newLead.businessName.trim()) return;
    const lead = {
      ...newLead,
      id: Date.now(),
      value: Number(newLead.value || 0),
      closedAmount: Number(newLead.closedAmount || 0),
    };
    setLeads((current) => [lead, ...current]);
    setSelectedLead(lead);
    setShowAddForm(false);
    setNewLead({
      businessName: "",
      category: "Fashion",
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
    });
  };

  const exportCsv = () => {
    const headers = ["Business Name", "Category", "WhatsApp", "Status", "Last Contacted", "Next Follow-up", "Offer", "Value", "Notes"];
    const rows = leads.map((lead) => [
      lead.businessName,
      lead.category,
      lead.whatsapp,
      lead.status,
      lead.lastContacted,
      lead.nextFollowUp,
      lead.offer,
      lead.value,
      lead.notes,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glygold-leads.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm text-amber-200">
              <Target className="h-4 w-4" /> GlyGold Outreach Command Center
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Lead Tracker</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Track who you messaged, who replied, who needs follow-up, and how much revenue is in your pipeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setShowAddForm(true)} className="rounded-2xl bg-amber-400 px-5 py-6 font-semibold text-slate-950 hover:bg-amber-300">
              <Plus className="mr-2 h-5 w-5" /> Add Lead
            </Button>
            <Button onClick={exportCsv} variant="outline" className="rounded-2xl border-white/15 bg-white/5 px-5 py-6 text-white hover:bg-white/10">
              <Download className="mr-2 h-5 w-5" /> Export CSV
            </Button>
          </div>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={Users} label="Total Leads" value={leads.length} helper="All prospects saved" />
          <StatCard icon={CalendarClock} label="Due Today" value={stats.dueToday} helper="Follow-ups waiting" urgent={stats.dueToday > 0} />
          <StatCard icon={TrendingUp} label="Interested" value={stats.interested} helper="Warm opportunities" />
          <StatCard icon={CheckCircle2} label="Closed" value={stats.closed} helper="Won deals" />
          <StatCard icon={DollarSign} label="Pipeline" value={formatCurrency(stats.totalValue)} helper="Potential value" />
        </section>

        <main className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <Card className="overflow-hidden rounded-3xl border-white/10 bg-white/[0.04] text-white shadow-xl">
            <CardContent className="p-0">
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Lead Pipeline</h2>
                    <p className="text-sm text-slate-400">Search, filter, and update lead progress quickly.</p>
                  </div>
                  <div className="flex flex-col gap-3 md:flex-row">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search leads..."
                        className="h-11 w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-10 pr-4 text-sm outline-none ring-amber-400/40 focus:ring-2 md:w-64"
                      />
                    </div>
                    <FilterSelect value={statusFilter} onChange={setStatusFilter} options={["All", ...statuses]} />
                    <FilterSelect value={categoryFilter} onChange={setCategoryFilter} options={["All", ...categories]} />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Business</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Next Follow-up</th>
                      <th className="px-5 py-4">Value</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`cursor-pointer transition hover:bg-white/[0.04] ${selectedLead?.id === lead.id ? "bg-amber-400/10" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white">{lead.businessName}</div>
                          <div className="line-clamp-1 max-w-xs text-xs text-slate-400">{lead.offer || "No offer selected"}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{lead.category}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(lead.status)}`}>{lead.status}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{lead.nextFollowUp || "Not set"}</td>
                        <td className="px-5 py-4 font-semibold text-white">{formatCurrency(lead.value)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <a
                              href={lead.whatsapp}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                            <select
                              value={lead.status}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateLeadStatus(lead.id, event.target.value)}
                              className="h-9 rounded-xl border border-white/10 bg-slate-900 px-2 text-xs outline-none"
                            >
                              {statuses.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card className="rounded-3xl border-white/10 bg-white/[0.04] text-white shadow-xl">
              <CardContent className="p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Lead Details</h2>
                    <p className="text-sm text-slate-400">View the current selected prospect.</p>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-slate-400" />
                </div>
                {selectedLead ? (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedLead.businessName}</h3>
                      <p className="text-slate-400">{selectedLead.category}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusTone(selectedLead.status)}`}>{selectedLead.status}</span>
                    <InfoBlock label="First Message" value={selectedLead.firstMessage || "No message saved yet."} />
                    <InfoBlock label="Notes" value={selectedLead.notes || "No notes yet."} />
                    <div className="grid grid-cols-2 gap-3">
                      <MiniInfo label="Last Contacted" value={selectedLead.lastContacted || "Not set"} />
                      <MiniInfo label="Next Follow-up" value={selectedLead.nextFollowUp || "Not set"} />
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="mb-2 text-sm text-slate-400">Potential Deal</div>
                      <div className="text-2xl font-bold text-amber-300">{formatCurrency(selectedLead.value)}</div>
                    </div>
                    <a href={selectedLead.whatsapp} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white hover:bg-emerald-400">
                      <MessageCircle className="mr-2 h-5 w-5" /> Open WhatsApp
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400">Select a lead to view details.</p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/10 bg-white/[0.04] text-white shadow-xl">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <ClipboardList className="h-5 w-5 text-amber-300" />
                  <h2 className="text-lg font-semibold">Today’s Accountability</h2>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <ChecklistItem done label="Add at least 15 new leads" />
                  <ChecklistItem done label="Message 10 qualified businesses" />
                  <ChecklistItem label="Follow up all due leads" urgent={stats.dueToday > 0} />
                  <ChecklistItem label="Update every status before ending the day" />
                </div>
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Add New Lead</h2>
                <p className="text-sm text-slate-400">Save a prospect before or after messaging them.</p>
              </div>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10">
                Close
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput label="Business Name" value={newLead.businessName} onChange={(value) => setNewLead({ ...newLead, businessName: value })} />
              <FormInput label="WhatsApp Link" value={newLead.whatsapp} onChange={(value) => setNewLead({ ...newLead, whatsapp: value })} />
              <FormSelect label="Category" value={newLead.category} options={categories} onChange={(value) => setNewLead({ ...newLead, category: value })} />
              <FormSelect label="Status" value={newLead.status} options={statuses} onChange={(value) => setNewLead({ ...newLead, status: value })} />
              <FormInput label="Last Contacted" type="date" value={newLead.lastContacted} onChange={(value) => setNewLead({ ...newLead, lastContacted: value })} />
              <FormInput label="Next Follow-up" type="date" value={newLead.nextFollowUp} onChange={(value) => setNewLead({ ...newLead, nextFollowUp: value })} />
              <FormInput label="Offer Sent" value={newLead.offer} onChange={(value) => setNewLead({ ...newLead, offer: value })} />
              <FormInput label="Potential Value" type="number" value={newLead.value} onChange={(value) => setNewLead({ ...newLead, value })} />
            </div>
            <div className="mt-4 space-y-4">
              <FormTextarea label="First Message" value={newLead.firstMessage} onChange={(value) => setNewLead({ ...newLead, firstMessage: value })} />
              <FormTextarea label="Notes" value={newLead.notes} onChange={(value) => setNewLead({ ...newLead, notes: value })} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={addLead} className="rounded-2xl bg-amber-400 px-6 py-6 font-semibold text-slate-950 hover:bg-amber-300">
                <Plus className="mr-2 h-5 w-5" /> Save Lead
              </Button>
              <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 px-6 py-6 text-white hover:bg-white/10">
                <Upload className="mr-2 h-5 w-5" /> CSV Upload Coming Next
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, helper, urgent }) {
  return (
    <Card className={`rounded-3xl border-white/10 bg-white/[0.04] text-white shadow-xl ${urgent ? "ring-2 ring-orange-400/50" : ""}`}>
      <CardContent className="p-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Icon className="h-5 w-5 text-amber-300" />
        </div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-1 font-medium text-slate-300">{label}</div>
        <div className="mt-1 text-xs text-slate-500">{helper}</div>
      </CardContent>
    </Card>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-slate-900/80 px-3 text-sm text-white outline-none ring-amber-400/40 focus:ring-2">
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300">{value}</div>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-semibold text-white">{value}</div>
    </div>
  );
}

function ChecklistItem({ label, done, urgent }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
      {done ? <CheckCircle2 className="h-5 w-5 text-emerald-300" /> : urgent ? <AlertCircle className="h-5 w-5 text-orange-300" /> : <div className="h-5 w-5 rounded-full border border-slate-500" />}
      <span className={done ? "text-slate-500 line-through" : "text-slate-300"}>{label}</span>
    </div>
  );
}

function FormInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-white outline-none ring-amber-400/40 focus:ring-2" />
    </label>
  );
}

function FormSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-white outline-none ring-amber-400/40 focus:ring-2">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function FormTextarea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-amber-400/40 focus:ring-2" />
    </label>
  );
}
