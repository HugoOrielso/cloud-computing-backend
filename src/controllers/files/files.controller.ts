import { Request, Response } from 'express';
import path from 'path';
import { FileData } from '../../types/types';
import { getMetricasPorUsuario, getProjectById, getUserProjects, uploadUserFiles, uploadUserFilesFromLocal } from '../../services/files.service';
import fs from 'fs';
import simpleGit from 'simple-git';
import fse from 'fs-extra';

export async function importarProyectoDesdeGithub(req: Request, res: Response): Promise<void> {
  try {
    const { repoUrl, folder, projectName, uploadedFrom } = req.body;
    const user = req.user;

    if (!user?.email) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!repoUrl || !folder || !projectName || !uploadedFrom) {
      res.status(400).json({ message: 'Faltan datos: repoUrl, folder o projectName' });
      return;
    }

    const tempPath = path.join(__dirname, '..', '..', '..', 'uploads', 'temp', folder);
    const uploadPath = path.join(__dirname, '..', '..', '..', 'uploads', folder);
    await fse.ensureDir(uploadPath);

    // Paso 1: Clonar el repositorio
    const git = simpleGit();
    await git.clone(repoUrl, tempPath);

    // Paso 2: Obtener el último commit desde el directorio clonado
    const gitRepo = simpleGit(tempPath);
    const log = await gitRepo.log();
    const ultimoCommit = log.latest;

    // Paso 3: Copiar archivos válidos
    const allowedExtensions = ['.html', '.css', '.js'];
    const validFiles: { filename: string; filepath: string }[] = [];

    const buscarYCopiarArchivos = (dir: string) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          buscarYCopiarArchivos(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (allowedExtensions.includes(ext)) {
            const dest = path.join(uploadPath, path.basename(item));
            fs.copyFileSync(fullPath, dest);
            validFiles.push({
              filename: path.basename(item),
              filepath: `/uploads/${folder}/${path.basename(item)}`
            });
          }
        }
      }
    };

    buscarYCopiarArchivos(tempPath);
    await fse.remove(tempPath);

    // Paso 4: Guardar todo en la base de datos
    const publicBaseUrl = `/uploads/${folder}`;
    const result = await uploadUserFiles(
      user.email,
      folder,
      validFiles,
      projectName,
      publicBaseUrl,
      uploadedFrom,
      ultimoCommit?.hash,
      ultimoCommit?.message,
      ultimoCommit?.date ? new Date(ultimoCommit.date) : undefined,
      ultimoCommit?.author_name
    );

    res.status(200).json({
      message: 'Proyecto importado correctamente',
      ...result
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Error al importar el proyecto' });
  }
}




export async function uploadFiles(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const files = req.files as Express.Multer.File[];
    const folder = (req as any).uploadFolder;
    const projectName = req.body.projectName;
    const uploadedFrom = req.body.uploadedFrom;

    if (!user?.email) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!files || files.length === 0 || !projectName || !uploadedFrom) {
      res.status(400).json({ message: "Faltan archivos por enviar" });
      return;
    }

    const allowedExtensions = ['.html', '.css', '.js'];
    const allowedMime = [
      'text/html',
      'text/css',
      'application/javascript',
      'application/x-javascript',
      'text/javascript'
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
    const result = await uploadUserFiles(user.email, folder, validFiles, projectName, publicBaseUrl, uploadedFrom)

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
    if (projects.length === 0) {
      res.status(204).json();
      return
    }
    res.status(200).json({ projects });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener los proyectos' });
  }
}

export function reescribirRutasHTML(html: string, basePath: string): string {
  return html
    .replace(/src="\/([^"]+)"/g, `src="${basePath}/$1"`)
    .replace(/href="\/([^"]+)"/g, `href="${basePath}/$1"`);
}


export async function uploadFilesFromLocal(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user;
    const files = req.files as Express.Multer.File[];
    const folder = (req as any).uploadFolder;
    const projectName = req.body.projectName;
    const uploadedFrom = req.body.uploadedFrom;

    if (!user?.email) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!files || files.length === 0 || !projectName || !uploadedFrom) {
      res.status(400).json({ message: "Faltan archivos por enviar" });
      return;
    }

    const allowedExtensions = ['.html', '.css', '.js'];
    const allowedMime = [
      'text/html',
      'text/css',
      'application/javascript',
      'application/x-javascript',
      'text/javascript'
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
    const result = await uploadUserFilesFromLocal(user.email, folder, validFiles, projectName, publicBaseUrl, uploadedFrom)

    res.status(200).json({
      message: 'Archivos subidos y registrados',
      ...result
    });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: 'Ocurrió un error' });
  }
}


export async function getProject(req: Request, res: Response) {
  try {
    const email = req.user?.email;
    const { id } = req.params;

    if (!email) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const projects = await getProjectById(email, id);

    if (projects.length === 0) {
      res.status(204).json();
      return;
    }

    const project = projects[0];
    const folderPath = path.join(__dirname, '..', '..', '..', 'uploads', project.folder_name);

    const allowedExtensions = ['.html', '.css', '.js'];
    const files: { filename: string; extension: string; content: string }[] = [];

    const all = fs.readdirSync(folderPath);
    for (const file of all) {
      const ext = path.extname(file).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        const fullPath = path.join(folderPath, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ filename: file, extension: ext, content });
      }
    }

    res.status(200).json({ project, files });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los proyectos' });
  }
}

export async function getMetricasProyecto(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const metricas = await getMetricasPorUsuario(userId);
    if (metricas.length === 0) {
      res.status(204).json();
      return
    }
    res.status(200).json(metricas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener métricas del usuario' });
  }
}


export async function lookFiles(req: Request, res: Response): Promise<void> {
  try {
    const { folder, filename } = req.params;

    if (!folder || !filename) {
      res.status(400).json({ message: 'Parámetros inválidos' });
      return;
    }

    const filePath = path.join(__dirname, '..', '..', '..', 'uploads', folder, filename);

    const ext = path.extname(filename).toLowerCase();
    if (!['.html', '.css', '.js'].includes(ext)) {
      res.status(403).json({ message: 'Extensión de archivo no permitida' });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'Archivo no encontrado' });
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    res.status(200).json({ filename, content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al leer el archivo' });
  }
}
