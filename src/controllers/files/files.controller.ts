import { Request, Response } from 'express';
import path from 'path';
import { FileData } from '../../types/types';
import { getUserProjects, uploadUserFiles } from '../../services/files.service';

export async function uploadFiles(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const files = req.files as Express.Multer.File[];
    const folder = (req as any).uploadFolder;
    const projectName = req.body.projectName;

    if (!user?.email) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!files || files.length === 0 || !projectName) {
      res.status(400).json({ message: "Faltan archivos por enviar" });
      return;
    }

    const allowedExtensions = ['.html', '.css', '.js'];
    const allowedMime = [
      'text/html',
      'text/css',
      'application/javascript',
      'application/x-javascript'
    ];

    const errors: string[] = [];
    const validFiles: FileData[] = [];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const mime = file.mimetype;

      if (!allowedExtensions.includes(ext) || !allowedMime.includes(mime)) {
        errors.push(`Archivo no permitido: ${file.originalname}`);
        continue;
      }

      const filepath = `/uploads/${folder}/${file.originalname}`;

      validFiles.push({
        filename: file.originalname,
        filepath: filepath,
      });
    }

    if (errors.length > 0) {
      res.status(400).json({ message: 'Algunos archivos no son válidos', errors });
      return;
    }

    const publicBaseUrl = `/uploads/${folder}`;
    const result = await uploadUserFiles(user.email, folder, validFiles, projectName, publicBaseUrl)

    res.status(200).json({
      message: 'Archivos subidos y registrados',
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Ocurrió un error' });
  }
}


export async function listProjects(req: Request, res: Response) {
  try {
    const email = req.user?.email;
    if (!email) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return
    }

    const projects = await getUserProjects(email);
    res.status(200).json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener los proyectos' });
  }
}
