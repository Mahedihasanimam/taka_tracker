import { theme } from "@/constants/theme";

type CategoryLike = {
  id?: number | string;
  name: string;
  icon: string;
  color: string;
  type?: string;
};

type ParsedVoiceTransaction = {
  amount: number | null;
  type: "expense" | "income";
  category: CategoryLike | null;
  note: string;
  confidenceLabel: "high" | "medium" | "low";
};

const DEFAULT_FALLBACKS = {
  expense: {
    name: "Other",
    icon: "MoreHorizontal",
    color: theme.colors.categoryOther,
    type: "expense",
  },
  income: {
    name: "Other Income",
    icon: "MoreHorizontal",
    color: theme.colors.categoryOther,
    type: "income",
  },
} satisfies Record<"expense" | "income", CategoryLike>;

const INCOME_KEYWORDS = [
  "income",
  "salary",
  "freelance",
  "business",
  "bonus",
  "investment",
  "refund",
  "received",
  "got paid",
  "earned",
  "payment received",
  "deposit",
  "rental income",
];

const EXPENSE_KEYWORDS = [
  "expense",
  "spent",
  "paid",
  "bought",
  "purchase",
  "cost",
  "rent",
  "bill",
  "uber",
  "food",
  "groceries",
  "shopping",
];

const CATEGORY_ALIASES: Record<string, string[]> = {
  "food & dining": ["food", "dining", "restaurant", "lunch", "dinner", "breakfast", "meal"],
  "groceries": ["grocery", "groceries", "super shop", "market"],
  "transport": ["transport", "bus", "rickshaw", "uber", "taxi", "fare", "commute"],
  "shopping": ["shopping", "cloth", "clothes", "mall", "purchase"],
  "rent": ["rent", "house rent", "flat rent"],
  "utilities": ["utility", "utilities", "electricity", "gas", "water"],
  "bills": ["bill", "bills", "electric bill", "gas bill"],
  "internet": ["internet", "wifi", "broadband"],
  "mobile": ["mobile", "phone", "recharge", "top up"],
  "healthcare": ["doctor", "medicine", "hospital", "health", "healthcare"],
  "education": ["school", "college", "book", "course", "education", "tuition"],
  "entertainment": ["movie", "game", "entertainment", "netflix"],
  "fitness": ["gym", "fitness", "workout"],
  "travel": ["travel", "trip", "flight", "train", "hotel"],
  "salary": ["salary", "paycheck", "wage"],
  "freelance": ["freelance", "client", "project payment"],
  "business": ["business", "sale", "shop income"],
  "bonus": ["bonus", "incentive"],
  "investment": ["investment", "interest", "dividend"],
  "rental income": ["rent received", "rental income", "tenant payment"],
  "refund": ["refund", "cashback", "returned money"],
  "other income": ["income", "received money", "deposit"],
  "other": ["other", "misc", "miscellaneous"],
};

const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const MULTIPLIERS: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseDigitAmount = (normalized: string) => {
  const match = normalized.match(/(?:^|\s)(\d[\d,]*(?:\.\d{1,2})?)(?:\s|$)/);
  if (!match?.[1]) return null;
  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseWordAmount = (normalized: string) => {
  const tokens = normalized.split(" ");
  let total = 0;
  let current = 0;
  let seen = false;

  for (const token of tokens) {
    if (token === "and") continue;
    if (token in SMALL_NUMBERS) {
      current += SMALL_NUMBERS[token];
      seen = true;
      continue;
    }
    if (token in MULTIPLIERS) {
      const multiplier = MULTIPLIERS[token];
      current = current || 1;
      current *= multiplier;
      if (multiplier >= 1000) {
        total += current;
        current = 0;
      }
      seen = true;
      continue;
    }
    if (seen) break;
  }

  const amount = total + current;
  return amount > 0 ? amount : null;
};

const detectType = (normalized: string): "expense" | "income" => {
  const incomeHits = INCOME_KEYWORDS.filter((keyword) =>
    normalized.includes(keyword),
  ).length;
  const expenseHits = EXPENSE_KEYWORDS.filter((keyword) =>
    normalized.includes(keyword),
  ).length;

  if (incomeHits > expenseHits) return "income";
  return "expense";
};

const scoreCategory = (normalized: string, category: CategoryLike) => {
  const categoryName = normalizeText(category.name);
  let score = 0;

  if (normalized.includes(categoryName)) {
    score += 10;
  }

  const tokens = categoryName.split(" ").filter(Boolean);
  for (const token of tokens) {
    if (normalized.includes(token)) score += 2;
  }

  const aliases = CATEGORY_ALIASES[categoryName] || [];
  for (const alias of aliases) {
    if (normalized.includes(alias)) score += 4;
  }

  return score;
};

const pickFallbackCategory = (
  categories: CategoryLike[],
  type: "expense" | "income",
) =>
  categories.find((category) => {
    const name = normalizeText(category.name);
    return name.includes("other");
  }) || DEFAULT_FALLBACKS[type];

const matchCategory = (
  normalized: string,
  type: "expense" | "income",
  categories: CategoryLike[],
) => {
  const scoped = categories.filter(
    (category) => (category.type as "expense" | "income" | undefined) !== undefined
      ? category.type === type
      : true,
  );
  if (!scoped.length) return pickFallbackCategory([], type);

  const ranked = scoped
    .map((category) => ({ category, score: scoreCategory(normalized, category) }))
    .sort((left, right) => right.score - left.score);

  if (ranked[0] && ranked[0].score > 0) {
    return ranked[0].category;
  }

  return pickFallbackCategory(scoped, type);
};

export const parseVoiceTransaction = ({
  transcript,
  expenseCategories,
  incomeCategories,
}: {
  transcript: string;
  expenseCategories: CategoryLike[];
  incomeCategories: CategoryLike[];
}): ParsedVoiceTransaction => {
  const normalized = normalizeText(transcript);
  const type = detectType(normalized);
  const amount = parseDigitAmount(normalized) ?? parseWordAmount(normalized);
  const category =
    type === "income"
      ? matchCategory(normalized, type, incomeCategories)
      : matchCategory(normalized, type, expenseCategories);

  let confidenceLabel: ParsedVoiceTransaction["confidenceLabel"] = "low";
  if (amount && category && normalizeText(category.name) !== "other" && normalizeText(category.name) !== "other income") {
    confidenceLabel = "high";
  } else if (amount) {
    confidenceLabel = "medium";
  }

  return {
    amount,
    type,
    category,
    note: transcript.trim(),
    confidenceLabel,
  };
};
