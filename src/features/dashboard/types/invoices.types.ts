export class InvoicesUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "InvoicesUploadError";
    this.status = status;
  }
}
