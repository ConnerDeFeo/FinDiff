export type User = {
    email: string;
    premium: boolean;
    nextBillingDate?: string;
    cancelAtPeriodEnd?: boolean;
}