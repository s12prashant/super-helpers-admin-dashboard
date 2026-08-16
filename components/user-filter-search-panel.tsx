"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FilterX, RefreshCcw } from "lucide-react";
import { UserFilterSearchAnalytics } from "@/components/user-filter-search-analytics";
import {
  userFilterSearchPageSizeOptions,
  type UserFilterSearchAnalyticsData,
  type UserFilterSearchListData,
} from "@/lib/user-filter-search";

type UserFilterSearchResponse = {
  status: number;
  message: string;
  data: UserFilterSearchListData;
};

type UserFilterSearchAnalyticsResponse = {
  status: number;
  message: string;
  data: UserFilterSearchAnalyticsData;
};

const initialPagination = { page: 1, pageSize: 25, totalPages: 1, totalItems: 0 };

export function UserFilterSearchPanel({ initialFrom, initialTo }: { initialFrom: string; initialTo: string }) {
  const [data, setData] = useState<UserFilterSearchListData>({
    items: [],
    workCategories: [],
    workTimes: [],
    genders: [],
    pagination: initialPagination,
  });
  const [workCat, setWorkCat] = useState("");
  const [workTime, setWorkTime] = useState("");
  const [gender, setGender] = useState("");
  const [pincode, setPincode] = useState("");
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [compare, setCompare] = useState(true);
  const [pagination, setPagination] = useState(initialPagination);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<UserFilterSearchAnalyticsData | null>(null);
  const [analyticsMessage, setAnalyticsMessage] = useState<string | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (workCat) params.set("workCat", workCat);
    if (workTime) params.set("workTime", workTime);
    if (gender) params.set("gender", gender);
    if (pincode.trim()) params.set("pincode", pincode.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("page", String(pagination.page));
    params.set("pageSize", String(pagination.pageSize));

    return params.toString();
  }, [from, gender, pagination.page, pagination.pageSize, pincode, to, workCat, workTime]);

  const analyticsQueryString = useMemo(() => {
    const params = new URLSearchParams();

    if (workCat) params.set("workCat", workCat);
    if (workTime) params.set("workTime", workTime);
    if (gender) params.set("gender", gender);
    if (pincode.trim()) params.set("pincode", pincode.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("compare", String(compare));

    return params.toString();
  }, [compare, from, gender, pincode, to, workCat, workTime]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    const response = await fetch(`/api/admin/user-filter-search?${queryString}`, { cache: "no-store" });
    const result = (await response.json().catch(() => null)) as UserFilterSearchResponse | null;

    setIsLoading(false);

    if (!response.ok) {
      setMessage(result?.message ?? "Unable to load user filter searches");
      return;
    }

    if (result?.data) {
      setData(result.data);
      setPagination(result.data.pagination);
    }
  }, [queryString]);

  const loadAnalytics = useCallback(async (signal?: AbortSignal) => {
    setIsAnalyticsLoading(true);
    setAnalyticsMessage(null);

    try {
      const response = await fetch(`/api/admin/user-filter-search/analytics?${analyticsQueryString}`, {
        cache: "no-store",
        signal,
      });
      const result = (await response.json().catch(() => null)) as UserFilterSearchAnalyticsResponse | null;

      if (!response.ok) {
        setAnalyticsMessage(result?.message ?? "Unable to load search analytics");
        return;
      }

      if (result?.data) setAnalytics(result.data);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAnalyticsMessage("Unable to load search analytics");
    } finally {
      if (!signal?.aborted) setIsAnalyticsLoading(false);
    }
  }, [analyticsQueryString]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => void loadAnalytics(controller.signal), 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadAnalytics]);

  function resetToFirstPage() {
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function clearFilters() {
    setWorkCat("");
    setWorkTime("");
    setGender("");
    setPincode("");
    setFrom(initialFrom);
    setTo(initialTo);
    resetToFirstPage();
  }

  function selectDateRange(days: number | "month") {
    const today = getTodayInIndia();
    setTo(today);
    setFrom(days === "month" ? `${today.slice(0, 8)}01` : shiftDate(today, -(days - 1)));
    resetToFirstPage();
  }

  function refreshAll() {
    void loadItems();
    void loadAnalytics();
  }

  const hasFilters = Boolean(
    workCat || workTime || gender || pincode || from !== initialFrom || to !== initialTo,
  );

  return (
    <div className="page-stack user-filter-search-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">User activity</p>
          <h1>User Filter Search</h1>
          <p className="page-summary">
            {pagination.totalItems} {pagination.totalItems === 1 ? "search" : "searches"} found
          </p>
        </div>
        <button
          className="secondary-button inline-button"
          type="button"
          onClick={refreshAll}
          disabled={isLoading || isAnalyticsLoading}
        >
          <RefreshCcw size={17} />
          Refresh
        </button>
      </header>

      <section className="user-filter-toolbar" aria-label="User filter search filters">
        <select
          aria-label="Work category"
          value={workCat}
          onChange={(event) => {
            setWorkCat(event.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">All work categories</option>
          {data.workCategories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Work time"
          value={workTime}
          onChange={(event) => {
            setWorkTime(event.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">All work times</option>
          {data.workTimes.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Gender"
          value={gender}
          onChange={(event) => {
            setGender(event.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">All genders</option>
          {data.genders.map((option) => (
            <option key={option} value={option}>
              {formatLabel(option)}
            </option>
          ))}
        </select>

        <input
          aria-label="Pincode"
          inputMode="numeric"
          placeholder="Filter pincode"
          value={pincode}
          onChange={(event) => {
            setPincode(event.target.value.replace(/\D/g, ""));
            resetToFirstPage();
          }}
        />

        <label className="date-field">
          <CalendarDays size={17} />
          <input
            aria-label="Created from"
            type="date"
            max={to}
            value={from}
            onChange={(event) => {
              setFrom(event.target.value || initialFrom);
              resetToFirstPage();
            }}
          />
        </label>

        <label className="date-field">
          <CalendarDays size={17} />
          <input
            aria-label="Created to"
            type="date"
            min={from}
            value={to}
            onChange={(event) => {
              setTo(event.target.value || initialTo);
              resetToFirstPage();
            }}
          />
        </label>

        <button className="secondary-button inline-button" type="button" onClick={clearFilters} disabled={!hasFilters}>
          <FilterX size={17} />
          Clear filters
        </button>
      </section>

      <section className="analytics-controls" aria-label="Search analytics controls">
        <div className="date-presets" aria-label="Quick date ranges">
          <button type="button" onClick={() => selectDateRange(1)}>Today</button>
          <button type="button" onClick={() => selectDateRange(7)}>Last 7 days</button>
          <button type="button" onClick={() => selectDateRange(30)}>Last 30 days</button>
          <button type="button" onClick={() => selectDateRange("month")}>This month</button>
        </div>
        <label className="compare-control">
          <input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} />
          Compare previous period
        </label>
      </section>

      <UserFilterSearchAnalytics
        data={analytics}
        error={analyticsMessage}
        isLoading={isAnalyticsLoading}
      />

      {message ? <p className="form-message">{message}</p> : null}

      <section className="lead-table-wrap">
        <table className="lead-table user-filter-search-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Work Category</th>
              <th>Work Time</th>
              <th>Gender</th>
              <th>Pincode</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6}>Loading user filter searches...</td>
              </tr>
            ) : null}
            {!isLoading && data.items.length === 0 ? (
              <tr>
                <td colSpan={6}>No user filter searches match these filters.</td>
              </tr>
            ) : null}
            {!isLoading
              ? data.items.map((item) => (
                  <tr key={item.id}>
                    <td><strong>#{item.id}</strong></td>
                    <td>{item.workCategory ?? "--"}</td>
                    <td>{item.workTime ?? "--"}</td>
                    <td>{item.gender ? formatLabel(item.gender) : "--"}</td>
                    <td>{item.pincode ?? "--"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </section>

      <div className="pagination-bar" aria-label="User filter search pagination">
        <label>
          Rows
          <select
            value={pagination.pageSize}
            onChange={(event) =>
              setPagination((current) => ({ ...current, page: 1, pageSize: Number(event.target.value) }))
            }
          >
            {userFilterSearchPageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <div className="pagination-actions">
          <button
            aria-label="Previous page"
            className="secondary-button icon-button"
            disabled={pagination.page <= 1 || isLoading}
            type="button"
            onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Next page"
            className="secondary-button icon-button"
            disabled={pagination.page >= pagination.totalPages || isLoading}
            type="button"
            onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTodayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
