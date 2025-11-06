// contexts/ReturnedItemsContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ReturnedItem {
  id: number;
  rawMaterialId: number;
  rawMaterialName: string;
  quantity: number;
  unit: string;
  userId: string;
  userName: string;
  reason: string;
  returnedAt: string;
  status: "PENDING_REPAIR" | "REPAIRING" | "FINISHED";
  quantityRejected?: number;
  quantityApproved?: number;
  rejectionReason?: string;
}

interface ReturnedItemsContextType {
  returnedItems: ReturnedItem[];
  pendingRepairCount: number;
  showReturnedItemsPopup: boolean;
  setShowReturnedItemsPopup: (show: boolean) => void;
  fetchReturnedItems: () => Promise<void>;
  markAsRepairing: (id: number) => Promise<boolean>;
  markAsFinished: (id: number) => Promise<boolean>;
}

const ReturnedItemsContext = createContext<
  ReturnedItemsContextType | undefined
>(undefined);

export const ReturnedItemsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [returnedItems, setReturnedItems] = useState<ReturnedItem[]>([]);
  const [showReturnedItemsPopup, setShowReturnedItemsPopup] = useState(false);
  const [pendingRepairCount, setPendingRepairCount] = useState(0);

  const fetchReturnedItems = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(
        "/api/raw-material-transfers?status=RETURNED",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Filter only items with status "RETURNED" and map to ReturnedItem format
        const returnedItemsData: ReturnedItem[] = data
          .filter((transfer: any) => transfer.status === "RETURNED")
          .map((transfer: any) => ({
            id: transfer.id,
            rawMaterialId: transfer.rawMaterialId,
            rawMaterialName: transfer.rawMaterial.name,
            quantity: transfer.quantityRejected || transfer.quantityIssued,
            unit: transfer.rawMaterial.unit,
            userId: transfer.userId,
            userName: transfer.user.name,
            reason: transfer.notes || "No reason provided",
            returnedAt: transfer.updatedAt,
            status: "PENDING_REPAIR", // UI status for display
            quantityRejected: transfer.quantityRejected,
            quantityApproved: transfer.quantityApproved,
            rejectionReason: transfer.rejectionReason,
          }));

        setReturnedItems(returnedItemsData);
        setPendingRepairCount(returnedItemsData.length);

        // Show popup if there are new returned items and user hasn't dismissed it
        const hasSeenPopup = localStorage.getItem("hasSeenReturnedItemsPopup");
        if (returnedItemsData.length > 0 && !hasSeenPopup) {
          setShowReturnedItemsPopup(true);
          localStorage.setItem("hasSeenReturnedItemsPopup", "true");
        }
      } else {
        console.error("Failed to fetch returned items:", response.status);
      }
    } catch (error) {
      console.error("Error fetching returned items:", error);
    }
  };

  const markAsRepairing = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/raw-material-transfers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "REPAIRING",
          notes: "Item marked for repair",
        }),
      });

      if (response.ok) {
        await fetchReturnedItems();
        return true;
      } else {
        console.error("Failed to mark as repairing:", response.status);
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start repair");
      }
    } catch (error) {
      console.error("Error marking item as repairing:", error);
      throw error;
    }
  };

  const markAsFinished = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/raw-material-transfers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "FINISHED",
          notes: "Repair completed successfully",
        }),
      });

      if (response.ok) {
        await fetchReturnedItems();
        return true;
      } else {
        console.error("Failed to mark as finished:", response.status);
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to finish repair");
      }
    } catch (error) {
      console.error("Error marking item as finished:", error);
      throw error;
    }
  };

  // Fetch returned items on component mount
  useEffect(() => {
    fetchReturnedItems();

    // Set up interval to check for new returned items every 30 seconds
    const interval = setInterval(fetchReturnedItems, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ReturnedItemsContext.Provider
      value={{
        returnedItems,
        pendingRepairCount,
        showReturnedItemsPopup,
        setShowReturnedItemsPopup,
        fetchReturnedItems,
        markAsRepairing,
        markAsFinished,
      }}
    >
      {children}
    </ReturnedItemsContext.Provider>
  );
};

export const useReturnedItems = () => {
  const context = useContext(ReturnedItemsContext);
  if (context === undefined) {
    throw new Error(
      "useReturnedItems must be used within a ReturnedItemsProvider"
    );
  }
  return context;
};
