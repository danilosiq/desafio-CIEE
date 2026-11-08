export interface PdfTextReader { parse(pdf: Uint8Array): Promise<string>; }
