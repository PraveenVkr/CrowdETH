"use client";

import React, { createContext, useContext } from "react";
import {
  useAddress,
  useContract,
  useContractWrite,
  useConnect,
  metamaskWallet,
} from "@thirdweb-dev/react";
import { ethers } from "ethers";

const StateContext = createContext();

export const StateContextProvider = ({ children }) => {
  const { contract } = useContract(address);
  console.log("Contract status:", contract ? "initialized" : "not initialized");

  const address = useAddress();
  const connect = useConnect();

  const connectWithMetamask = async () => {
    try {
      const wallet = await connect(metamaskWallet());
      console.log("Connected:", wallet);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  };

  const { mutateAsync: createCampaign } = useContractWrite(
    contract,
    "createCampaign"
  );
  const { mutateAsync: donateToCampaign } = useContractWrite(
    contract,
    "donateToCampaign"
  );
  const { mutateAsync: claimFunds } = useContractWrite(contract, "claimFunds");
  const { mutateAsync: claimRefund } = useContractWrite(
    contract,
    "claimRefund"
  );
  const { mutateAsync: updateCampaignState } = useContractWrite(
    contract,
    "updateCampaignState"
  );

  const publishCampaign = async (form) => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      if (!address) throw new Error("Wallet not connected");

      console.log("Publishing campaign with form data:", form);

      const data = await createCampaign({
        args: [
          address,
          form.title,
          form.description,
          ethers.utils.parseEther(form.target),
          new Date(form.deadline).getTime(),
          form.image,
        ],
      });

      console.log("Campaign created successfully", data);
      return data;
    } catch (error) {
      console.error("Failed to create campaign", error);
      throw error;
    }
  };

  const getCampaigns = async () => {
    try {
      const campaigns = await contract.call("getCampaigns");
      const parsedCampaigns = campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(
          campaign.amountCollected.toString()
        ),
        image: campaign.image,
        donators: campaign.donators,
        donations: campaign.donations,
        claimed: campaign.claimed,
        state: ["Active", "Successful", "Failed"][campaign.state],
        pId: i,
      }));

      return parsedCampaigns;
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
      return [];
    }
  };

  const getCampaign = async (pId) => {
    try {
      const campaign = await contract.call("getCampaign", [pId]);

      return {
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(
          campaign.amountCollected.toString()
        ),
        image: campaign.image,
        claimed: campaign.claimed,
        state: ["Active", "Successful", "Failed"][campaign.state],
        pId,
      };
    } catch (error) {
      console.error(`Failed to fetch campaign with ID ${pId}`, error);
      throw error;
    }
  };

  const getUserCampaigns = async () => {
    try {
      const all = await getCampaigns();
      return all.filter((campaign) => campaign.owner === address);
    } catch (error) {
      console.error("Failed to fetch user campaigns", error);
      return [];
    }
  };

  const getActiveCampaignsCount = async (userAddress) => {
    try {
      const count = await contract.call("getActiveCampaignsCount", [
        userAddress || address,
      ]);
      return count.toNumber();
    } catch (error) {
      console.error("Failed to get active campaigns count", error);
      return 0;
    }
  };

  const donate = async (pId, amount) => {
    try {
      const data = await donateToCampaign({
        args: [pId],
        overrides: {
          value: ethers.utils.parseEther(amount),
        },
      });

      console.log("Donation successful", data);
      return data;
    } catch (error) {
      console.error("Donation failed", error);
      throw error;
    }
  };

  const getDonations = async (pId) => {
    try {
      const donations = await contract.call("getDonators", [pId]);
      const numberOfDonations = donations[0].length;

      const parsedDonations = [];
      for (let i = 0; i < numberOfDonations; i++) {
        parsedDonations.push({
          donator: donations[0][i],
          donation: ethers.utils.formatEther(donations[1][i].toString()),
        });
      }

      return parsedDonations;
    } catch (error) {
      console.error(`Failed to fetch donations for campaign ${pId}`, error);
      return [];
    }
  };

  const claimCampaignFunds = async (pId) => {
    try {
      const data = await claimFunds({ args: [pId] });
      console.log("Funds claimed successfully", data);
      return data;
    } catch (error) {
      console.error("Failed to claim funds", error);
      throw error;
    }
  };

  const claimCampaignRefund = async (pId) => {
    try {
      const data = await claimRefund({ args: [pId] });
      console.log("Refund claimed successfully", data);
      return data;
    } catch (error) {
      console.error("Failed to claim refund", error);
      throw error;
    }
  };

  const updateCampaignStateStatus = async (pId) => {
    try {
      const data = await updateCampaignState({ args: [pId] });
      console.log("Campaign state updated", data);
      return data;
    } catch (error) {
      console.error("Failed to update campaign state", error);
      throw error;
    }
  };

  const hasClaimedRefund = async (pId, userAddress) => {
    try {
      const claimed = await contract.call("refundClaimed", [
        pId,
        userAddress || address,
      ]);
      return claimed;
    } catch (error) {
      console.error("Failed to check refund status", error);
      return false;
    }
  };

  const getDonationByUser = async (pId, userAddress) => {
    try {
      const amount = await contract.call("fundsByDonator", [
        pId,
        userAddress || address,
      ]);
      return ethers.utils.formatEther(amount.toString());
    } catch (error) {
      console.error("Failed to get donation amount", error);
      return "0";
    }
  };

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect: connectWithMetamask,
        createCampaign: publishCampaign, // Added this alias for backwards compatibility
        publishCampaign, // Exposed the actual function name
        getCampaigns,
        getCampaign,
        getUserCampaigns,
        donate,
        getDonations,
        getDonationByUser,
        claimCampaignFunds,
        claimCampaignRefund,
        updateCampaignStateStatus,
        getActiveCampaignsCount,
        hasClaimedRefund,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
