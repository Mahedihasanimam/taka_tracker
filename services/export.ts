import { theme } from "@/constants/theme";
import { TransactionRecord } from "@/services/db";
import { CurrencyCode, formatCurrency } from "@/utils/currency";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Share } from "react-native";

type ExportFormat = "csv" | "pdf";
type ExportRange = "7days" | "30days" | "month" | "all";

const sanitizeDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRangeStartDate = (range: ExportRange): Date | null => {
  const now = new Date();

  if (range === "all") return null;
  if (range === "month") return new Date(now.getFullYear(), now.getMonth(), 1);

  const days = range === "7days" ? 7 : 30;
  const date = new Date(now);
  date.setDate(now.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const filterTransactionsByRange = (
  transactions: TransactionRecord[],
  range: ExportRange,
): TransactionRecord[] => {
  const startDate = getRangeStartDate(range);
  if (!startDate) return transactions;

  return transactions.filter((transaction) => {
    const date = sanitizeDate(transaction.date);
    return date ? date >= startDate : false;
  });
};

const formatRangeLabel = (range: ExportRange) => {
  if (range === "7days") return "Last 7 days";
  if (range === "30days") return "Last 30 days";
  if (range === "month") return "This month";
  return "All time";
};

const csvEscape = (value: string | number | null | undefined): string => {
  const raw = value === null || value === undefined ? "" : String(value);
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const buildCsv = (
  transactions: TransactionRecord[],
  includeReceipts: boolean,
  currency: CurrencyCode,
): string => {
  const baseHeaders = ["Date", "Type", "Category", `Amount (${currency})`];
  const headers = includeReceipts ? [...baseHeaders, "Note"] : baseHeaders;

  const rows = transactions.map((transaction) => {
    const values = [
      transaction.date,
      transaction.type,
      transaction.category,
      formatCurrency(Number(transaction.amount || 0), currency),
    ];

    if (includeReceipts) {
      values.push(transaction.note || "");
    }

    return values.map((value) => csvEscape(value)).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
};

const buildPdfHtml = (
  transactions: TransactionRecord[],
  includeReceipts: boolean,
  totalIncome: number,
  totalExpense: number,
  currency: CurrencyCode,
): string => {
  const rows = transactions
    .map((transaction) => {
      const noteCell = includeReceipts
        ? `<td style=\"padding:8px;border-bottom:1px solid ${theme.colors.borderLight};\">${transaction.note || "-"}</td>`
        : "";

      return `
        <tr>
          <td style=\"padding:8px;border-bottom:1px solid ${theme.colors.borderLight};\">${transaction.date}</td>
          <td style=\"padding:8px;border-bottom:1px solid ${theme.colors.borderLight};text-transform:capitalize;\">${transaction.type}</td>
          <td style=\"padding:8px;border-bottom:1px solid ${theme.colors.borderLight};\">${transaction.category}</td>
          <td style=\"padding:8px;border-bottom:1px solid ${theme.colors.borderLight};\">${formatCurrency(Number(transaction.amount || 0), currency)}</td>
          ${noteCell}
        </tr>
      `;
    })
    .join("");

  return `
    <html>
      <body style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:20px;color:${theme.colors.darkSlate};\">
        <h2 style=\"margin:0 0 8px 0;\">MoneyMaster Export</h2>
        <p style=\"margin:0 0 16px 0;color:${theme.colors.mutedText};\">Generated at ${new Date().toLocaleString()}</p>
        <p style=\"margin:0 0 16px 0;color:${theme.colors.mutedText};\">Currency: ${currency}</p>

        <div style=\"display:flex;gap:16px;margin-bottom:16px;\">
          <div style=\"padding:10px 12px;background:${theme.colors.greenSoft};border-radius:10px;\">Total Income: ${formatCurrency(totalIncome, currency)}</div>
          <div style=\"padding:10px 12px;background:${theme.colors.redSoft};border-radius:10px;\">Total Expense: ${formatCurrency(totalExpense, currency)}</div>
        </div>

        <table style=\"width:100%;border-collapse:collapse;font-size:12px;\">
          <thead>
            <tr style=\"background:${theme.colors.lightSlate};text-align:left;\">
              <th style=\"padding:8px;\">Date</th>
              <th style=\"padding:8px;\">Type</th>
              <th style=\"padding:8px;\">Category</th>
              <th style=\"padding:8px;\">Amount (${currency})</th>
              ${includeReceipts ? '<th style=\"padding:8px;\">Note</th>' : ""}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
};

export const exportTransactionsToFile = async ({
  transactions,
  format,
  includeReceipts,
  filenamePrefix,
  currency = "USD",
}: {
  transactions: TransactionRecord[];
  format: ExportFormat;
  includeReceipts: boolean;
  filenamePrefix?: string;
  currency?: CurrencyCode;
}): Promise<{ success: boolean; message: string; uri?: string }> => {
  try {
    const shareAvailable = await Sharing.isAvailableAsync();
    if (!shareAvailable) {
      return {
        success: false,
        message: "Sharing is not available on this device.",
      };
    }

    const safePrefix = filenamePrefix || "MoneyMaster-export";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    if (format === "csv") {
      const csv = buildCsv(transactions, includeReceipts, currency);
      const uri = `${FileSystem.cacheDirectory}${safePrefix}-${timestamp}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(uri, {
        mimeType: "text/csv",
        dialogTitle: "Export CSV",
      });
      return { success: true, message: "CSV export ready.", uri };
    }

    const totals = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "income")
          acc.totalIncome += Number(transaction.amount) || 0;
        if (transaction.type === "expense")
          acc.totalExpense += Number(transaction.amount) || 0;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 },
    );

    const html = buildPdfHtml(
      transactions,
      includeReceipts,
      totals.totalIncome,
      totals.totalExpense,
      currency,
    );

    const { uri } = await Print.printToFileAsync({ html, base64: false });
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Export PDF",
      UTI: "com.adobe.pdf",
    });
    return { success: true, message: "PDF export ready.", uri };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Export failed.",
    };
  }
};

export const shareReportSummary = async ({
  transactions,
  range,
  currency = "USD",
  insight,
}: {
  transactions: TransactionRecord[];
  range: ExportRange;
  currency?: CurrencyCode;
  insight?: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    if (!transactions.length) {
      return {
        success: false,
        message: "No data to share.",
      };
    }

    const totals = transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount) || 0;
        if (transaction.type === "income") acc.totalIncome += amount;
        if (transaction.type === "expense") acc.totalExpense += amount;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 },
    );

    const balance = totals.totalIncome - totals.totalExpense;
    const topCategory = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce<Record<string, number>>((acc, transaction) => {
        const key = transaction.category || "Other";
        acc[key] = (acc[key] || 0) + (Number(transaction.amount) || 0);
        return acc;
      }, {});

    const topExpenseCategory =
      Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0] || null;

    const lines = [
      `My TakaTrack report for ${formatRangeLabel(range)}`,
      `Income: ${formatCurrency(totals.totalIncome, currency)}`,
      `Expense: ${formatCurrency(totals.totalExpense, currency)}`,
      `Net: ${formatCurrency(balance, currency)}`,
      `Transactions: ${transactions.length}`,
    ];

    if (topExpenseCategory) {
      lines.push(
        `Top spend: ${topExpenseCategory[0]} (${formatCurrency(topExpenseCategory[1], currency)})`,
      );
    }

    if (insight) {
      lines.push(`Insight: ${insight}`);
    }

    lines.push("Tracked with TakaTrack");

    await Share.share({
      message: lines.join("\n"),
      title: "Share report",
    });

    return {
      success: true,
      message: "Report summary ready to share.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Share failed.",
    };
  }
};
