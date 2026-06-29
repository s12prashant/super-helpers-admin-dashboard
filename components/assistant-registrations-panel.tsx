"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, RefreshCcw, UserCheck, Users } from "lucide-react";
import {
  assistantStatuses,
  type AssistantRegistrationItem,
  type AssistantRegistrationSummary,
  type AssistantStatus,
} from "@/lib/assistants";

type AssistantRegistrationsResponse = {
  status: number;
  message: string;
  data: AssistantRegistrationSummary;
};

type AssistantUpdateResponse = {
  status: number;
  message: string;
  data: AssistantRegistrationItem;
};

const statusLabels: Record<AssistantStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  BLOCKED: "Blocked",
};

export function AssistantRegistrationsPanel() {
  const [summary, setSummary] = useState<AssistantRegistrationSummary>({
    totalRegistered: 0,
    allTimeRegistered: 0,
    countsByStatus: [],
    recentAssistants: [],
  });
  const [status, setStatus] = useState<AssistantStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingAssistantId, setUpdatingAssistantId] = useState<number | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (status) {
      params.set("status", status);
    }

    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }

    return params.toString();
  }, [from, status, to]);

  const loadRegistrations = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    const response = await fetch(`/api/admin/assistants/registrations${queryString ? `?${queryString}` : ""}`, {
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as AssistantRegistrationsResponse | null;

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result?.message ?? "Unable to load assistant registrations");
      return;
    }

    setSummary(
      result?.data ?? {
        totalRegistered: 0,
        allTimeRegistered: 0,
        countsByStatus: [],
        recentAssistants: [],
      },
    );
  }, [queryString]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  function countFor(assistantStatus: AssistantStatus) {
    return summary.countsByStatus.find((item) => item.status === assistantStatus)?.count ?? 0;
  }

  async function updateAssistantStatus(id: number, nextStatus: AssistantStatus) {
    setMessage(null);
    setUpdatingAssistantId(id);

    const response = await fetch(`/api/admin/assistants/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    const result = (await response.json().catch(() => null)) as AssistantUpdateResponse | null;

    setUpdatingAssistantId(null);

    if (!response.ok) {
      setMessage(result?.message ?? "Unable to update assistant status");
      return;
    }

    if (result?.data) {
      setSummary((currentSummary) => ({
        ...currentSummary,
        recentAssistants: currentSummary.recentAssistants.map((item) => (item.id === id ? result.data : item)),
      }));
    }

    await loadRegistrations();
  }

  return (
    <div className="page-stack assistant-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Assistant reporting</p>
          <h1>Assistant Registrations</h1>
        </div>
        <button className="secondary-button inline-button" type="button" onClick={loadRegistrations}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </header>

      <section className="metric-grid assistant-metrics" aria-label="Assistant registration metrics">
        <div className="metric-card">
          <div className="metric-icon success">
            <UserCheck size={20} />
          </div>
          <p className="metric-label">Registered in filter</p>
          <p className="metric-value">{summary.totalRegistered}</p>
        </div>
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <p className="metric-label">All-time assistants</p>
          <p className="metric-value">{summary.allTimeRegistered}</p>
        </div>
      </section>

      <section className="lead-toolbar assistant-toolbar" aria-label="Assistant registration filters">
        <label className="date-field">
          <CalendarDays size={17} />
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className="date-field">
          <CalendarDays size={17} />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as AssistantStatus | "")}>
          <option value="">All statuses</option>
          {assistantStatuses.map((assistantStatus) => (
            <option key={assistantStatus} value={assistantStatus}>
              {statusLabels[assistantStatus]}
            </option>
          ))}
        </select>
        <button
          className="secondary-button inline-button"
          type="button"
          onClick={() => {
            setFrom("");
            setTo("");
            setStatus("");
          }}
        >
          <Clock3 size={17} />
          Clear
        </button>
      </section>

      <section className="lead-status-grid" aria-label="Assistant status counts">
        {assistantStatuses.map((assistantStatus) => (
          <button
            className={status === assistantStatus ? "status-tile active" : "status-tile"}
            key={assistantStatus}
            type="button"
            onClick={() => setStatus(status === assistantStatus ? "" : assistantStatus)}
          >
            <span>{statusLabels[assistantStatus]}</span>
            <strong>{countFor(assistantStatus)}</strong>
          </button>
        ))}
      </section>

      {message ? <p className="form-message">{message}</p> : null}

      <section className="lead-table-wrap">
        <table className="lead-table assistant-table">
          <thead>
            <tr>
              <th>Assistant</th>
              <th>Mobile</th>
              <th>Location</th>
              <th>Status</th>
              <th>Registered</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5}>Loading assistant registrations...</td>
              </tr>
            ) : null}
            {!isLoading && summary.recentAssistants.length === 0 ? (
              <tr>
                <td colSpan={5}>No assistants found.</td>
              </tr>
            ) : null}
            {summary.recentAssistants.map((item) => (
              <AssistantRow
                isUpdating={updatingAssistantId === item.id}
                item={item}
                key={item.id}
                onStatusChange={updateAssistantStatus}
              />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function AssistantRow({
  isUpdating,
  item,
  onStatusChange,
}: {
  isUpdating: boolean;
  item: AssistantRegistrationItem;
  onStatusChange: (id: number, status: AssistantStatus) => void;
}) {
  return (
    <tr>
      <td>
        <div className="lead-primary">
          <strong>{item.name || "Unnamed assistant"}</strong>
          <span>{item.id}</span>
        </div>
      </td>
      <td>
        <a className="assistant-phone" href={`tel:${item.mobile}`}>
          {item.mobile}
        </a>
      </td>
      <td>
        <div className="lead-secondary">
          <span>{item.city || "No city"}</span>
          <small>{item.pincode ?? "No pincode"}</small>
        </div>
      </td>
      <td>
        <select
          className="status-select"
          disabled={isUpdating}
          value={item.status}
          onChange={(event) => onStatusChange(item.id, event.target.value as AssistantStatus)}
        >
          {assistantStatuses.map((assistantStatus) => (
            <option key={assistantStatus} value={assistantStatus}>
              {statusLabels[assistantStatus]}
            </option>
          ))}
        </select>
      </td>
      <td>{formatDate(item.created_at)}</td>
    </tr>
  );
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
