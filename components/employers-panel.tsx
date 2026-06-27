"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, Phone, RefreshCcw, Search, Users } from "lucide-react";
import type { Employer } from "@/lib/employers";

type EmployersResponse = {
  status: number;
  message: string;
  data: Employer[];
  totalCount: number;
  resultCount: number;
};

export function EmployersPanel() {
  const [items, setItems] = useState<Employer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    return params.toString();
  }, [query]);

  const loadEmployers = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    const response = await fetch(`/api/admin/employers${queryString ? `?${queryString}` : ""}`, {
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as EmployersResponse | null;

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result?.message ?? "Unable to load employers");
      return;
    }

    setItems(result?.data ?? []);
    setTotalCount(result?.totalCount ?? 0);
  }, [queryString]);

  useEffect(() => {
    loadEmployers();
  }, [loadEmployers]);

  return (
    <div className="page-stack employers-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">User management</p>
          <h1>Employers</h1>
        </div>
        <button className="secondary-button inline-button" type="button" onClick={loadEmployers}>
          <RefreshCcw size={17} />
          Refresh
        </button>
      </header>

      <section className="metric-grid employers-metrics" aria-label="Employer metrics">
        <div className="metric-card">
          <div className="metric-icon">
            <Users size={20} />
          </div>
          <p className="metric-label">Total employers</p>
          <p className="metric-value">{totalCount}</p>
        </div>
        <div className="metric-card">
          <div className="metric-icon success">
            <Search size={20} />
          </div>
          <p className="metric-label">Visible results</p>
          <p className="metric-value">{items.length}</p>
        </div>
      </section>

      <section className="lead-toolbar employer-toolbar" aria-label="Employer filters">
        <label className="search-field">
          <Search size={17} />
          <input
            placeholder="Search name, mobile, email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      {message ? <p className="form-message">{message}</p> : null}

      <section className="lead-table-wrap">
        <table className="lead-table employer-table">
          <thead>
            <tr>
              <th>Employer</th>
              <th>Contact</th>
              <th>Activity</th>
              <th>Joined</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5}>Loading employers...</td>
              </tr>
            ) : null}
            {!isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={5}>No employers found.</td>
              </tr>
            ) : null}
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="lead-primary">
                    <strong>{item.name || item.email || "Unnamed employer"}</strong>
                    <span>{item.id}</span>
                  </div>
                </td>
                <td>
                  <div className="lead-primary">
                    {item.email ? (
                      <a href={`mailto:${item.email}`}>
                        <Mail size={14} />
                        {item.email}
                      </a>
                    ) : (
                      <span>No email</span>
                    )}
                    {item.mobile ? (
                      <a href={`tel:${item.mobile}`}>
                        <Phone size={14} />
                        {item.mobile}
                      </a>
                    ) : null}
                  </div>
                </td>
                <td>
                  <div className="lead-secondary">
                    <span>{item.contactCount} contacts</span>
                    <small>
                      {item.shortlistCount} shortlisted · {item.reviewCount} reviews · {item.chatCount} chats
                    </small>
                  </div>
                </td>
                <td>{formatDate(item.created_at)}</td>
                <td>{formatDate(item.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
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
