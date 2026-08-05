"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, FilterX, RefreshCcw } from "lucide-react";
import {
  userFilterSearchPageSizeOptions,
  type UserFilterSearchListData,
} from "@/lib/user-filter-search";

type UserFilterSearchResponse = {
  status: number;
  message: string;
  data: UserFilterSearchListData;
};

const initialPagination = { page: 1, pageSize: 25, totalPages: 1, totalItems: 0 };

export function UserFilterSearchPanel() {
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pagination, setPagination] = useState(initialPagination);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function resetToFirstPage() {
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function clearFilters() {
    setWorkCat("");
    setWorkTime("");
    setGender("");
    setPincode("");
    setFrom("");
    setTo("");
    resetToFirstPage();
  }

  const hasFilters = Boolean(workCat || workTime || gender || pincode || from || to);

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
        <button className="secondary-button inline-button" type="button" onClick={loadItems} disabled={isLoading}>
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
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              resetToFirstPage();
            }}
          />
        </label>

        <label className="date-field">
          <CalendarDays size={17} />
          <input
            aria-label="Created to"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              resetToFirstPage();
            }}
          />
        </label>

        <button className="secondary-button inline-button" type="button" onClick={clearFilters} disabled={!hasFilters}>
          <FilterX size={17} />
          Clear filters
        </button>
      </section>

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
