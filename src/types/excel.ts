export type ParsedCashflowWeek = {
  label: string;
  amount: number;
};

export type ParsedProfit = {
  netProfit: number;
  grossProfit: number;
  revenue: number;
};

export type ParsedInvoice = {
  customerName: string;
  amount: number;
  dueDate: string;
  invoiceNumber: string;
};
