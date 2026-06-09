export class CashflowUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CashflowUploadError";
    this.status = status;
  }
}
