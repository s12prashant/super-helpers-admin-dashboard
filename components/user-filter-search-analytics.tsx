"use client";

import type {
  UserFilterSearchAnalyticsData,
  UserFilterSearchBreakdown,
} from "@/lib/user-filter-search";

type Props = {
  data: UserFilterSearchAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
};

export function UserFilterSearchAnalytics({ data, isLoading, error }: Props) {
  if (isLoading && !data) {
    return <section className="analytics-state">Loading search analytics...</section>;
  }

  if (error && !data) {
    return <section className="analytics-state analytics-error">{error}</section>;
  }

  if (!data) return null;

  const { summary, meta } = data;
  const change = summary.percentageChange;

  return (
    <div className="analytics-stack" aria-busy={isLoading}>
      <section className="metric-grid search-metrics" aria-label="Search analytics summary">
        <Metric label="Total searches" value={formatNumber(summary.totalSearches)} />
        <Metric label="Average per day" value={summary.averagePerDay.toFixed(1)} />
        <Metric
          label="Peak day"
          value={summary.peakDay.date ? formatShortDate(summary.peakDay.date) : "--"}
          detail={summary.peakDay.date ? `${formatNumber(summary.peakDay.count)} searches` : "No searches"}
        />
        <Metric label="Active days" value={formatNumber(summary.activeDays)} />
        <Metric
          label="Previous-period change"
          value={change === null ? "--" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
          detail={
            summary.previousPeriodTotal === null
              ? "Comparison off"
              : summary.previousPeriodTotal === 0
                ? "No previous data"
                : `${formatNumber(summary.previousPeriodTotal)} previous searches`
          }
          tone={change === null ? undefined : change >= 0 ? "positive" : "negative"}
        />
      </section>

      {error ? <p className="form-message">Latest analytics refresh failed: {error}</p> : null}

      <section className="analytics-card trend-card">
        <div className="analytics-heading">
          <div>
            <p className="eyebrow">Daily activity</p>
            <h2>Search trend</h2>
          </div>
          <div className="chart-legend" aria-label="Chart legend">
            <span><i className="legend-line current" />Current period</span>
            {meta.compared ? <span><i className="legend-line previous" />Previous period</span> : null}
          </div>
        </div>
        <p className="analytics-period">
          {formatLongDate(meta.from)} – {formatLongDate(meta.to)} · Asia/Kolkata
        </p>
        <DailyTrendChart data={data.dailyTrend} showPrevious={meta.compared} />
      </section>

      <section className="analytics-card analytics-insight" aria-labelledby="search-analysis-title">
        <div>
          <p className="eyebrow">Analysis</p>
          <h2 id="search-analysis-title">What the data shows</h2>
        </div>
        <ul>
          <li>
            This period recorded <strong>{formatNumber(summary.totalSearches)} searches</strong>, averaging{" "}
            <strong>{summary.averagePerDay.toFixed(1)} per day</strong>.
          </li>
          {summary.peakDay.date ? (
            <li>
              The busiest day was <strong>{formatLongDate(summary.peakDay.date)}</strong> with{" "}
              <strong>{formatNumber(summary.peakDay.count)} searches</strong>.
            </li>
          ) : null}
          {change !== null ? (
            <li>
              Search activity <strong>{change >= 0 ? "increased" : "decreased"} by {Math.abs(change).toFixed(1)}%</strong>{" "}
              compared with the previous matching period.
            </li>
          ) : null}
          {data.breakdowns.workCategories[0] ? (
            <li>
              The leading work category was <strong>{data.breakdowns.workCategories[0].label}</strong> with{" "}
              <strong>{formatNumber(data.breakdowns.workCategories[0].count)} selections</strong>.
            </li>
          ) : null}
          {data.breakdowns.pincodes[0] ? (
            <li>
              The most active pincode was <strong>{data.breakdowns.pincodes[0].label}</strong> with{" "}
              <strong>{formatNumber(data.breakdowns.pincodes[0].count)} searches</strong>.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="analytics-grid" aria-label="Search filter breakdowns">
        <BreakdownChart
          title="Work categories"
          subtitle="A multi-category search is counted in each category."
          items={data.breakdowns.workCategories}
        />
        <BreakdownChart title="Work times" items={data.breakdowns.workTimes} />
        <BreakdownChart title="Gender" items={data.breakdowns.genders} formatLabels />
        <BreakdownChart title="Top pincodes" items={data.breakdowns.pincodes} />
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="metric-card search-metric-card">
      <p className="metric-label">{label}</p>
      <p className={`metric-value${tone ? ` metric-${tone}` : ""}`}>{value}</p>
      {detail ? <p className="metric-detail">{detail}</p> : null}
    </div>
  );
}

function DailyTrendChart({
  data,
  showPrevious,
}: {
  data: UserFilterSearchAnalyticsData["dailyTrend"];
  showPrevious: boolean;
}) {
  const width = 900;
  const height = 280;
  const padding = { top: 18, right: 18, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.flatMap((point) => [point.count, ...(showPrevious && point.previousCount !== null ? [point.previousCount] : [])]);
  const maxValue = Math.max(1, ...values);
  const x = (index: number) => padding.left + (data.length <= 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth);
  const y = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;
  const currentPoints = data.map((point, index) => `${x(index)},${y(point.count)}`).join(" ");
  const previousPoints = data
    .map((point, index) => `${x(index)},${y(point.previousCount ?? 0)}`)
    .join(" ");
  const labelIndexes = Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])).filter(
    (index) => index >= 0,
  );

  if (data.length === 0) {
    return <div className="chart-empty">No daily data is available for this range.</div>;
  }

  return (
    <div className="trend-chart-scroll">
      <svg
        className="trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Line chart of daily user filter searches"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const gridY = padding.top + chartHeight * (1 - ratio);
          return (
            <g key={ratio}>
              <line className="chart-grid-line" x1={padding.left} x2={width - padding.right} y1={gridY} y2={gridY} />
              <text className="chart-axis-label" x={padding.left - 10} y={gridY + 4} textAnchor="end">
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          );
        })}

        {showPrevious ? <polyline className="trend-line previous" points={previousPoints} /> : null}
        <polyline className="trend-line current" points={currentPoints} />

        {data.map((point, index) => (
          <circle className="trend-point" cx={x(index)} cy={y(point.count)} key={point.date} r="3.5">
            <title>
              {formatLongDate(point.date)}: {point.count} searches
              {showPrevious ? `; previous period: ${point.previousCount ?? 0}` : ""}
            </title>
          </circle>
        ))}

        {labelIndexes.map((index) => (
          <text className="chart-axis-label" key={index} x={x(index)} y={height - 12} textAnchor="middle">
            {formatShortDate(data[index].date)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function BreakdownChart({
  title,
  subtitle,
  items,
  formatLabels = false,
}: {
  title: string;
  subtitle?: string;
  items: UserFilterSearchBreakdown[];
  formatLabels?: boolean;
}) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <article className="analytics-card breakdown-card">
      <h2>{title}</h2>
      {subtitle ? <p className="breakdown-note">{subtitle}</p> : null}
      {items.length === 0 ? <div className="chart-empty">No data for this range.</div> : null}
      <div className="bar-list">
        {items.map((item) => (
          <div className="bar-item" key={item.id ?? item.label}>
            <div className="bar-label-row">
              <span title={item.label}>{formatLabels ? formatFilterLabel(item.label) : item.label}</span>
              <strong>{formatNumber(item.count)}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span style={{ width: `${(item.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatFilterLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
