"use client";

import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const websites = [
  { name: "SNHIP", db: "snhipVisitors" },
  { name: "Toy Locker", db: "toylockerVisitors" },
  { name: "CPMCC", db: "cpmccVisitors" },
  { name: "Loam Depot", db: "loamdepotVisitors" },
];

interface VisitorData {
  ip: string;
  timestamp: number;
  deviceType: string;
  userAgent: string;
}

type DataState = Record<string, VisitorData[]>;

type SelectedWebsitesState = string[];

export default function VisitorDataDashboard() {
  const [data, setData] = useState<DataState>({});
  const [selectedWebsites, setSelectedWebsites] =
    useState<SelectedWebsitesState>([]);
  const [viewBy, setViewBy] = useState<"day" | "hour">("day");

  useEffect(() => {
    async function fetchData() {
      const responses = await Promise.all(
        websites.map(({ db }) =>
          fetch(`/api/visitors?db=${db}`).then((res) => res.json())
        )
      );
      const newData: DataState = websites.reduce((acc, { name }, idx) => {
        acc[name] = responses[idx] as VisitorData[];
        return acc;
      }, {} as DataState);
      setData(newData);
    }
    fetchData();
  }, []);

  const toggleWebsite = (name: string) => {
    setSelectedWebsites((prev) =>
      prev.includes(name) ? prev.filter((w) => w !== name) : [...prev, name]
    );
  };

  const getChartData = (name: string) => {
    const filteredData =
      data[name]?.filter(
        (entry) => entry.userAgent && !entry.userAgent.includes("vercel")
      ) || [];

    const visitsPerPeriod = filteredData.reduce((acc, entry) => {
      const date = new Date(entry.timestamp);
      const key =
        viewBy === "day"
          ? date.toLocaleDateString()
          : `${date.toLocaleDateString()} ${date.getHours()}:00`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(visitsPerPeriod),
      datasets: [
        {
          label: `${name} Visitors`,
          data: Object.values(visitsPerPeriod).map((v) => Math.round(v)),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    };
  };

  const displayedWebsites =
    selectedWebsites.length === 0 ? Object.keys(data) : selectedWebsites;

  return (
    <div className="p-4 max-w-6xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">CPM Websites</h1>
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {websites.map(({ name }) => (
          <label key={name} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedWebsites.includes(name)}
              onChange={() => toggleWebsite(name)}
              className="mr-2"
            />
            {name}
          </label>
        ))}
      </div>
      <div className="mb-4">
        <button
          className={`px-4 py-2 ${
            viewBy === "day" ? "bg-blue-500 text-white" : "bg-gray-300"
          }`}
          onClick={() => setViewBy("day")}
        >
          Per Day
        </button>
        <button
          className={`ml-2 px-4 py-2 ${
            viewBy === "hour" ? "bg-blue-500 text-white" : "bg-gray-300"
          }`}
          onClick={() => setViewBy("hour")}
        >
          Per Hour
        </button>
      </div>
      <div
        className={`grid md:gap-6 ${
          displayedWebsites.length > 1
            ? "md:grid-cols-2 grid-cols-1"
            : "grid-cols-1"
        }`}
      >
        {displayedWebsites.map((site) => (
          <div key={site} className="md:mb-6">
            <h2 className="text-xl font-semibold mb-2">{site}</h2>
            <div
              className={`w-full ${
                displayedWebsites.length === 1 ? "h-96" : "h-64"
              }`}
            >
              <Bar data={getChartData(site)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
