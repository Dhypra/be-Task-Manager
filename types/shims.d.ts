declare module "express" {
  export interface Request {
    params?: any;
    query?: any;
    body?: any;
    headers: any;
    user?: any;
  }

  export interface Response {
    status(code: number): Response;
    json(body: any): Response;
    send(body: any): Response;
    setHeader(name: string, value: string): Response;
  }

  export type NextFunction = () => void;

  const express: any;
  export default express;
}

declare module "cors" {
  const cors: any;
  export default cors;
}

declare module "bcrypt" {
  const bcrypt: any;
  export default bcrypt;
}

declare module "jsonwebtoken" {
  const jsonwebtoken: any;
  export default jsonwebtoken;
}

declare module "pdfkit" {
  const PDFDocument: any;
  export default PDFDocument;
}
