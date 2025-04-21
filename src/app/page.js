"use client";

import { useState, useEffect, useCallback } from "react";
import DisplayCampaigns from "../components/DisplayCampaigns";
import { useStateContext } from "../context/StateContext";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);

  const { contract, getCampaigns } = useStateContext();

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setError("Failed to load campaigns. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [getCampaigns]);

  useEffect(() => {
    if (contract) {
      fetchCampaigns();
    }
  }, [contract, fetchCampaigns]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold text-white">All Campaigns</h1>

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1dc071]"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <DisplayCampaigns
          title="All Campaigns"
          isLoading={isLoading}
          campaigns={campaigns}
        />
      )}
    </div>
  );
}
