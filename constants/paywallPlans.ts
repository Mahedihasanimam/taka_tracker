import { BillingCycle, PaywallPlan } from "@/components/onboarding/PaywallCard";

export const PAYWALL_PLANS: Record<BillingCycle, PaywallPlan> = {
  yearly: {
    key: "yearly",
    label: "YEARLY",
    headlinePrice: "$29.99",
    subPrice: "$2.49 / month",
    badge: "SAVE 50%",
    selectedSummary: "$29.99 / year",
    billingNote: "Billed yearly. Cancel anytime.",
  },
  monthly: {
    key: "monthly",
    label: "MONTHLY",
    headlinePrice: "$4.99",
    subPrice: "per month",
    badge: "FLEXIBLE",
    selectedSummary: "$4.99 / month",
    billingNote: "Billed monthly. Cancel anytime.",
  },
};

export const DEFAULT_BILLING_CYCLE: BillingCycle = "yearly";
