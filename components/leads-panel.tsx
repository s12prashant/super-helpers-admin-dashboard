"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Plus, RefreshCcw, Search } from "lucide-react";
import { leadStatuses, type LeadStatus, type SuperHelperLead } from "@/lib/leads";

type LeadResponse = {
  status: number;
  message: string;
  data: SuperHelperLead[];
  counts: Array<{ status: LeadStatus; count: number }>;
  statuses: LeadStatus[];
};

const emptyForm = {
  name: "",
  phoneNumber: "",
  serviceInterest: "",
  source: "WhatsApp",
  notes: "",
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: "New",
  WHATSAPP_SENT: "WhatsApp sent",
  REPLIED: "Replied",
  CALL_TRIED: "Call tried",
  AGREED_TO_REGISTER: "Agreed",
  REGISTERED: "Registered",
  NOT_INTERESTED: "Not interested",
  NOT_REACHABLE: "Not reachable",
  WRONG_NUMBER: "Wrong number",
};

export function LeadsPanel() {
  const [items, setItems] = useState<SuperHelperLead[]>([]);
  const [counts, setCounts] = useState<LeadResponse["counts"]>([]);
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (status) {
      params.set("status", status);
    }

    if (query.trim()) {
      params.set("q", query.trim());
    }

    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }

    return params.toString();
  }, [from, query, status, to]);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    const response = await fetch(`/api/admin/leads${queryString ? `?${queryString}` : ""}`, {
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result?.message ?? "Unable to load leads");
      return;
    }

    setItems(result.data ?? []);
    setCounts(result.counts ?? []);
  }, [queryString]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  async function createLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const response = await fetch("/api/admin/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });
    const result = await response.json().catch(() => null);

    setIsSaving(false);

    if (!response.ok) {
      setMessage(result?.message ?? "Unable to create lead");
      return;
    }

    setForm(emptyForm);
    setMessage("Lead created");
    await loadLeads();
  }

  async function updateLead(id: number, data: Record<string, unknown>) {
    setMessage(null);

    const response = await fetch(`/api/admin/leads/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(result?.message ?? "Unable to update lead");
      return;
    }

    setItems((currentItems) => currentItems.map((item) => (item.id === id ? result.data : item)));
    await loadLeads();
  }

  function countFor(leadStatus: LeadStatus) {
    return counts.find((item) => item.status === leadStatus)?.count ?? 0;
  }

  const totalCount = counts.reduce((total, item) => total + item.count, 0);

  return (
    <div className="page-stack leads-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">WhatsApp operations</p>
          <h1>SuperHelper Leads</h1>
        </div>
        <button className="secondary-button inline-button" type="button" onClick={loadLeads}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </header>

      <section className="lead-status-grid" aria-label="Lead status counts">
        <button
          className={status === "" ? "status-tile active" : "status-tile"}
          type="button"
          onClick={() => setStatus("")}
        >
          <span>Total leads</span>
          <strong>{totalCount}</strong>
        </button>
        {leadStatuses.map((leadStatus) => (
          <button
            className={status === leadStatus ? "status-tile active" : "status-tile"}
            key={leadStatus}
            type="button"
            onClick={() => setStatus(status === leadStatus ? "" : leadStatus)}
          >
            <span>{statusLabels[leadStatus]}</span>
            <strong>{countFor(leadStatus)}</strong>
          </button>
        ))}
      </section>

      <section className="lead-toolbar" aria-label="Lead filters">
        <label className="search-field">
          <Search size={17} />
          <input
            placeholder="Search name, phone, service, source"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | "")}>
          <option value="">All statuses</option>
          {leadStatuses.map((leadStatus) => (
            <option key={leadStatus} value={leadStatus}>
              {statusLabels[leadStatus]}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </section>

      <form className="lead-create-form" onSubmit={createLead}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          placeholder="Phone number"
          required
          value={form.phoneNumber}
          onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
        />
        <input
          placeholder="Service interest"
          value={form.serviceInterest}
          onChange={(event) => setForm({ ...form, serviceInterest: event.target.value })}
        />
        <input
          placeholder="Source"
          value={form.source}
          onChange={(event) => setForm({ ...form, source: event.target.value })}
        />
        <input
          placeholder="Notes"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />
        <button className="primary-button inline-button" disabled={isSaving} type="submit">
          <Plus size={17} />
          {isSaving ? "Adding..." : "Add lead"}
        </button>
      </form>

      {message ? <p className="form-message">{message}</p> : null}

      <section className="lead-table-wrap">
        <table className="lead-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Interest</th>
              <th>Status</th>
              <th>Contact</th>
              <th>Notes</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading leads...</td>
              </tr>
            ) : null}
            {!isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={6}>No leads found.</td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="lead-primary">
                    <strong>{item.name || "Unnamed lead"}</strong>
                    <span>{item.phone_number}</span>
                    <a href={whatsAppUrl(item.phone_number)} rel="noreferrer" target="_blank">
                      <ExternalLink size={14} />
                      WhatsApp
                    </a>
                  </div>
                </td>
                <td>
                  <div className="lead-secondary">
                    <span>{item.service_interest || "--"}</span>
                    <small>{item.source || "No source"}</small>
                  </div>
                </td>
                <td>
                  <select
                    value={item.status}
                    onChange={(event) => updateLead(item.id, { status: event.target.value })}
                  >
                    {leadStatuses.map((leadStatus) => (
                      <option key={leadStatus} value={leadStatus}>
                        {statusLabels[leadStatus]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="lead-actions">
                    <button
                      type="button"
                      onClick={() =>
                        updateLead(item.id, {
                          status: "WHATSAPP_SENT",
                          lastContactedAt: new Date().toISOString(),
                        })
                      }
                    >
                      Sent
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateLead(item.id, {
                          status: "REPLIED",
                          replyReceivedAt: new Date().toISOString(),
                        })
                      }
                    >
                      Replied
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateLead(item.id, {
                          status: "AGREED_TO_REGISTER",
                          agreedAt: new Date().toISOString(),
                        })
                      }
                    >
                      Agreed
                    </button>
                  </div>
                </td>
                <td>
                  <textarea
                    defaultValue={item.notes ?? ""}
                    onBlur={(event) => updateLead(item.id, { notes: event.target.value })}
                    placeholder="Add notes"
                  />
                </td>
                <td>{formatDate(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function whatsAppUrl(phoneNumber: string) {
  const normalized = phoneNumber.replace(/[^\d]/g, "");
  return `https://wa.me/${normalized}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
