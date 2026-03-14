import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

// Match the exact Product interface from your main file
interface Product {
  stock: undefined;
  id: number;
  name: string;
  size: string;
  price: number;
  category: string;
  quantity: number;
}

interface ProductDropdownProps {
  index: number;
  item: any;
  productsData: Product[];
  filteredProducts: (index: number) => Product[];
  handleSearchChange: (index: number, query: string) => void;
  handleDropdownToggle: (index: number, show: boolean) => void;
  handleProductSelect: (index: number, product: Product) => void;
}

const ProductDropdown: React.FC<ProductDropdownProps> = ({
  index,
  item,
  productsData,
  filteredProducts,
  handleSearchChange,
  handleDropdownToggle,
  handleProductSelect,
}) => {
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const inputRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Sync with parent state
  useEffect(() => {
    setIsOpen(item.showDropdown);
  }, [item.showDropdown]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  // Debug: Log when dropdown should open
  console.log("Dropdown state for index", index, ":", {
    isOpen,
    showDropdown: item.showDropdown,
  });

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Input clicked for index", index);
    handleDropdownToggle(index, true);
  };

  const handleInputFocus = () => {
    console.log("Input focused for index", index);
    handleDropdownToggle(index, true);
  };

  // Get filtered products for this index
  const getFilteredProducts = () => {
    try {
      const products = filteredProducts(index);
      console.log("Filtered products for index", index, ":", products.length);
      return products;
    } catch (error) {
      console.error("Error getting filtered products:", error);
      return [];
    }
  };

  return (
    <div className="relative w-full" ref={inputRef}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search product..."
          value={item.searchQuery || ""}
          onChange={(e) => {
            console.log("Search changed for index", index, ":", e.target.value);
            handleSearchChange(index, e.target.value);
          }}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoComplete="off"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <ChevronDown className="h-3 w-3" />
        </div>
      </div>

      {/* Stock Warning */}
      {item.productId &&
        item.quantity > 0 &&
        (() => {
          const selectedProduct = productsData.find(
            (p) => p.id === item.productId,
          );
          if (!selectedProduct) return null;

          const quantity = selectedProduct.quantity;
          const required = item.quantity;

          if (quantity === 0) {
            return (
              <div className="text-[10px] text-red-600 font-medium mt-1">
                Out of Stock
              </div>
            );
          } else if (required > quantity) {
            return (
              <div className="text-[10px] text-orange-600 mt-1">
                Only {quantity} left
              </div>
            );
          } else if (quantity < 10) {
            return (
              <div className="text-[10px] text-blue-600 mt-1">Low Stock</div>
            );
          }
          return null;
        })()}

      {/* Portal Dropdown */}
      {isOpen &&
        createPortal(
          <div
            className="fixed z-[99999] bg-white border border-gray-300 rounded-md shadow-lg"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: "240px",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="Search product..."
                value={item.searchQuery || ""}
                onChange={(e) => {
                  e.stopPropagation();
                  console.log(
                    "Dropdown search changed for index",
                    index,
                    ":",
                    e.target.value,
                  );
                  handleSearchChange(index, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="py-1">
              {getFilteredProducts().length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-gray-500">
                  No products found
                </div>
              ) : (
                getFilteredProducts().map((product) => (
                  <div
                    key={product.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Product selected:", product);
                      handleProductSelect(index, product);
                    }}
                    className={`px-2 py-1.5 text-xs cursor-pointer hover:bg-gray-100 flex justify-between items-center ${
                      item.productId === product.id
                        ? "bg-blue-50 text-blue-700"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium">
                        {product.name} {product.size}
                      </div>
                      <div className="text-xs text-gray-500">
                        ₹{product.price}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`text-xs ${
                          product.quantity === 0
                            ? "text-red-600"
                            : product.quantity < 10
                              ? "text-orange-600"
                              : "text-green-600"
                        }`}
                      >
                        Stock: {product.quantity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ProductDropdown;
