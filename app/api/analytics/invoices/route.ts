import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFilter = searchParams.get("timeFilter") || "current_year";
    const productFilter = searchParams.get("productFilter") || "all";

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
        break;
    }

    // Fetch data from database with filters
    const whereClause = {
      invoiceDate: { gte: startDate, lte: endDate },
      ...(productFilter !== "all"
        ? {
            items: {
              some: {
                product: {
                  category: productFilter,
                },
              },
            },
          }
        : {}),
    };

    const [invoices, invoiceItems, customers, products] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
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
      prisma.invoiceItem.findMany({
        where: {
          invoice: {
            invoiceDate: { gte: startDate, lte: endDate },
          },
          ...(productFilter !== "all"
            ? {
                product: {
                  category: productFilter,
                },
              }
            : {}),
        },
        include: {
          invoice: true,
          product: true,
        },
      }),
      prisma.customer.findMany({
        include: {
          invoices: {
            where: whereClause,
            include: {
              items: true,
            },
          },
        },
      }),
      prisma.product.findMany({
        where: productFilter !== "all" ? { category: productFilter } : {},
      }),
    ]);

    // Process data for analytics
    const analyticsData = {
      quarterlyRevenue: calculateQuarterlyRevenue(invoices, now.getFullYear()),
      topProducts: calculateTopProducts(invoiceItems),
      topCustomers: calculateTopCustomers(customers),
      annualIncome: calculateAnnualIncome(invoices),
      quarterlyInvoices: calculateQuarterlyInvoices(
        invoices,
        now.getFullYear()
      ),
      summary: calculateSummary(invoices, timeFilter),
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
    if (!productMap.has(productName)) {
      productMap.set(productName, {
        product: productName,
        quantity: 0,
        revenue: 0,
      });
    }

    const productData = productMap.get(productName);
    productData.quantity += item.quantity;
    productData.revenue += item.total;
  });

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function calculateTopCustomers(customers: any[]) {
  const customerData = customers
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
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

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
        index > 0
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
    const pending = quarterInvoices.filter(
      (invoice) => invoice.status === "PENDING"
    ).length;
    const overdue = quarterInvoices.filter((invoice) => {
      if (invoice.status === "PENDING") {
        const dueDate = new Date(invoice.dueDate);
        return dueDate < new Date();
      }
      return false;
    }).length;

    quarterlyData.push({
      quarter: `${quarter} ${currentYear}`,
      paid,
      pending: pending - overdue, // Pending but not overdue
      overdue,
    });
  });

  return quarterlyData;
}

function calculateSummary(invoices: any[], timeFilter: string) {
  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.total,
    0
  );
  const totalInvoices = invoices.length;
  const averageOrderValue =
    totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Calculate growth rate (simplified - you might want to compare with previous period)
  let growthRate = 0;
  if (timeFilter === "current_year") {
    // For demo purposes, using a calculated growth rate
    const currentYear = new Date().getFullYear();
    const lastYearInvoices = invoices.filter(
      (invoice) =>
        new Date(invoice.invoiceDate).getFullYear() === currentYear - 1
    );
    const lastYearRevenue = lastYearInvoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0
    );

    if (lastYearRevenue > 0) {
      growthRate = ((totalRevenue - lastYearRevenue) / lastYearRevenue) * 100;
    }
  }

  return {
    totalRevenue,
    totalInvoices,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    growthRate: Math.round(growthRate * 100) / 100,
  };
}
