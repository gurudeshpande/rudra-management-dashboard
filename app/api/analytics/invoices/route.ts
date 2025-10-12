import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Define your product categories
const PRODUCT_CATEGORIES = [
  "Mavala",
  "Maharaj",
  "Shastra (Weapons)",
  "Miniature Weapons",
  "Miniatures",
  "Spiritual Statues",
  "Car Dashboard",
  "Frame Collection",
  "Shilekhana (Weapon Vault)",
  "Symbolic & Cultural Artefacts",
  "Sanch",
  "Keychains",
  "Jewellery",
  "Historical Legends",
  "Badges",
  "Taxidermy",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get("timeFilter") || "current_year";
    const category = searchParams.get("category") || "all";
    const customerLimit = searchParams.get("customerLimit") || "10"; // ✅ Add customer limit
    const customerSearch = searchParams.get("customerSearch") || ""; // ✅ Add customer search

    console.log(
      timeFilter,
      "timefilter",
      category,
      "category",
      customerLimit,
      "customerLimit",
      customerSearch,
      "customerSearch"
    );

    // Calculate date ranges based on filter
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeFilter) {
      case "current_quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        break;
      case "last_year":
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case "all_time":
        startDate = new Date(0); // Beginning of time
        break;
      case "current_year":
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    // Build where clause for invoices
    const invoiceWhereClause: any = {
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Build where clause for invoice items
    const invoiceItemWhereClause: any = {
      invoice: {
        invoiceDate: { gte: startDate, lte: endDate },
      },
    };

    // Build where clause for customers
    const customerWhereClause: any = {};

    // ✅ Add customer name search filter
    if (customerSearch.trim()) {
      customerWhereClause.name = {
        contains: customerSearch,
        mode: "insensitive", // Case-insensitive search
      };
    }

    // Add category filter if not "all"
    if (category !== "all") {
      // Convert URL parameter back to proper category name
      const categoryName =
        PRODUCT_CATEGORIES.find(
          (cat) => cat.toLowerCase().replace(/\s+/g, "_") === category
        ) || category;

      invoiceWhereClause.items = {
        some: {
          product: {
            category: categoryName,
          },
        },
      };

      invoiceItemWhereClause.product = {
        category: categoryName,
      };
    }

    // Fetch data from database with filters
    const [invoices, invoiceItems, customers, products] = await Promise.all([
      // Fetch invoices with related data
      prisma.invoice.findMany({
        where: invoiceWhereClause,
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          invoiceDate: "desc",
        },
      }),

      // Fetch invoice items for product analysis
      prisma.invoiceItem.findMany({
        where: invoiceItemWhereClause,
        include: {
          invoice: true,
          product: true,
        },
      }),

      // ✅ Fetch customers with search filter and their invoices
      prisma.customer.findMany({
        where: customerWhereClause, // ✅ Apply customer search filter
        include: {
          invoices: {
            where: invoiceWhereClause,
            include: {
              items: true,
            },
          },
        },
      }),

      // Fetch products for category analysis
      prisma.product.findMany({
        where:
          category !== "all"
            ? {
                category:
                  PRODUCT_CATEGORIES.find(
                    (cat) => cat.toLowerCase().replace(/\s+/g, "_") === category
                  ) || category,
              }
            : {},
      }),
    ]);

    // Process data for analytics
    const analyticsData = {
      quarterlyRevenue: calculateQuarterlyRevenue(invoices, now.getFullYear()),
      topProducts: calculateTopProducts(invoiceItems),
      topCustomers: calculateTopCustomers(
        customers,
        customerLimit,
        customerSearch
      ), // ✅ Pass filters
      annualIncome: calculateAnnualIncome(invoices),
      quarterlyInvoices: calculateQuarterlyInvoices(
        invoices,
        now.getFullYear()
      ),
      summary: calculateSummary(invoices, timeFilter, category),
      availableCategories: PRODUCT_CATEGORIES,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

// Helper functions to process data
function calculateQuarterlyRevenue(invoices: any[], currentYear: number) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const quarterlyData: {
    quarter: string;
    revenue: number;
    invoices: number;
  }[] = [];

  quarters.forEach((quarter, index) => {
    const quarterStart = new Date(currentYear, index * 3, 1);
    const quarterEnd = new Date(currentYear, (index + 1) * 3, 0);

    const quarterInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      return invoiceDate >= quarterStart && invoiceDate <= quarterEnd;
    });

    const revenue = quarterInvoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0
    );
    const invoiceCount = quarterInvoices.length;

    quarterlyData.push({
      quarter: `${quarter} ${currentYear}`,
      revenue,
      invoices: invoiceCount,
    });
  });

  return quarterlyData;
}

function calculateTopProducts(invoiceItems: any[]) {
  const productMap = new Map();

  invoiceItems.forEach((item) => {
    const productName = item.product?.name || item.name;
    const productCategory = item.product?.category || "Uncategorized";

    if (!productMap.has(productName)) {
      productMap.set(productName, {
        product: productName,
        category: productCategory,
        quantity: 0,
        revenue: 0,
      });
    }

    const productData = productMap.get(productName);
    productData.quantity += item.quantity;
    productData.revenue += item.quantity * item.price;
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Show top 10 products
}

// ✅ Updated function with customer filters
function calculateTopCustomers(
  customers: any[],
  customerLimit: string,
  customerSearch: string
) {
  let customerData = customers
    .map((customer) => {
      const totalSpent = customer.invoices.reduce(
        (sum: number, invoice: any) => sum + invoice.total,
        0
      );
      const invoiceCount = customer.invoices.length;

      return {
        customer: customer.name,
        totalSpent,
        invoiceCount,
      };
    })
    .filter((customer) => customer.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent);

  // ✅ Apply limit filter only if not "all" and no search term
  // When searching, we want to see all matching results
  if (customerLimit !== "all" && !customerSearch.trim()) {
    const limit = parseInt(customerLimit);
    if (!isNaN(limit) && limit > 0) {
      customerData = customerData.slice(0, limit);
    }
  }

  // ✅ If there's a search term but no specific limit, show all matching results
  // The frontend will handle further filtering if needed

  return customerData;
}

function calculateAnnualIncome(invoices: any[]) {
  const yearMap = new Map();

  invoices.forEach((invoice) => {
    const year = new Date(invoice.invoiceDate).getFullYear();
    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        revenue: 0,
        invoiceCount: 0,
      });
    }

    const yearData = yearMap.get(year);
    yearData.revenue += invoice.total;
    yearData.invoiceCount += 1;
  });

  const annualData = Array.from(yearMap.values())
    .sort((a, b) => a.year - b.year)
    .map((data, index, array) => {
      const growth =
        index > 0 && array[index - 1].revenue > 0
          ? ((data.revenue - array[index - 1].revenue) /
              array[index - 1].revenue) *
            100
          : 0;

      return {
        ...data,
        growth: Math.round(growth * 100) / 100,
      };
    });

  return annualData;
}

function calculateQuarterlyInvoices(invoices: any[], currentYear: number) {
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const quarterlyData: {
    quarter: string;
    paid: number;
    pending: number;
    overdue: number;
  }[] = [];

  quarters.forEach((quarter, index) => {
    const quarterStart = new Date(currentYear, index * 3, 1);
    const quarterEnd = new Date(currentYear, (index + 1) * 3, 0);

    const quarterInvoices = invoices.filter((invoice) => {
      const invoiceDate = new Date(invoice.invoiceDate);
      return invoiceDate >= quarterStart && invoiceDate <= quarterEnd;
    });

    const paid = quarterInvoices.filter(
      (invoice) => invoice.status === "PAID"
    ).length;

    const unpaid = quarterInvoices.filter(
      (invoice) => invoice.status === "UNPAID"
    ).length;

    const advance = quarterInvoices.filter(
      (invoice) => invoice.status === "ADVANCE"
    ).length;

    // Calculate overdue invoices (unpaid with due date passed)
    const overdue = quarterInvoices.filter((invoice) => {
      if (invoice.status === "UNPAID" || invoice.status === "ADVANCE") {
        const dueDate = new Date(invoice.dueDate);
        return dueDate < new Date();
      }
      return false;
    }).length;

    quarterlyData.push({
      quarter: `${quarter} ${currentYear}`,
      paid,
      pending: unpaid + advance - overdue, // Pending but not overdue
      overdue,
    });
  });

  return quarterlyData;
}

function calculateSummary(
  invoices: any[],
  timeFilter: string,
  category: string
) {
  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0
  );
  const totalInvoices = invoices.length;
  const averageOrderValue =
    totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Calculate growth rate based on time filter
  let growthRate = 0;

  if (timeFilter === "current_year" || timeFilter === "last_year") {
    const currentYear = new Date().getFullYear();
    const comparisonYear =
      timeFilter === "current_year" ? currentYear - 1 : currentYear - 2;

    // This would require additional database queries for accurate comparison
    // For now, using a calculated estimate based on available data
    const comparisonInvoices = invoices.filter(
      (invoice) =>
        new Date(invoice.invoiceDate).getFullYear() === comparisonYear
    );

    const comparisonRevenue = comparisonInvoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0
    );

    if (comparisonRevenue > 0) {
      growthRate =
        ((totalRevenue - comparisonRevenue) / comparisonRevenue) * 100;
    } else if (totalRevenue > 0) {
      growthRate = 100; // 100% growth if no previous data but current data exists
    }
  }

  // Calculate category-specific metrics
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID").length;
  const unpaidInvoices = invoices.filter(
    (inv) => inv.status === "UNPAID"
  ).length;
  const advanceInvoices = invoices.filter(
    (inv) => inv.status === "ADVANCE"
  ).length;

  return {
    totalRevenue,
    totalInvoices,
    averageOrderValue: Math.round(averageOrderValue),
    growthRate: Math.round(growthRate * 100) / 100,
    paidInvoices,
    unpaidInvoices,
    advanceInvoices,
    selectedCategory:
      category === "all"
        ? "All Categories"
        : PRODUCT_CATEGORIES.find(
            (cat) => cat.toLowerCase().replace(/\s+/g, "_") === category
          ) || category,
  };
}
