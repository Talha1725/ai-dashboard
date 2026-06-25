export class ProfitUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ProfitUploadError";
    this.status = status;
  }
}
