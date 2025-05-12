import { RowDataPacket } from 'mysql2'

export interface User extends RowDataPacket {
  id: string
  name: string
  email: string
  password?: string
  created_at?: Date
}

export interface Payload {
  id: string;
  email: string;
  iat: number;
  exp: number
}

export interface FileData {
  filename: string;
  filepath: string;
}

export interface ProyectoMetricas {
  projectName: string;
  ownerEmail: string;
  numFilesTotal: number;
  numHtmlFiles: number;
  numCssFiles: number;
  numJsFiles: number;
  totalSizeMB: number;
  hasIndexHtml: boolean;
  referenciasExternas: number;
  createdAt: string;
}