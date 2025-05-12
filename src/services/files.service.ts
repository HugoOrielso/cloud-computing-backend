import { FileData } from '../types/types'
import { db } from '../lib/database/connection'
import { v4 as uuidv4 } from 'uuid';
import { analizarProyecto, getAbsoluteUploadPath } from '../utils/utils';
import path from 'path';

export async function uploadUserFiles(
    email: string,
    folderName: string,
    files: FileData[],
    projectName: string,
    publicUrl: string,
    uploadedFrom: string,
    commitHash?: string,
    commitMessage?: string,
    commitDate?: Date,
    commitAuthor?: string
) {
    const [rows]: any[] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (!rows || rows.length === 0) {
        throw new Error(`Usuario con email ${email} no encontrado`);
    }

    const user = rows[0];
    const uploadId = uuidv4();
    const folderPath = getAbsoluteUploadPath(folderName);
    const metricas = analizarProyecto(folderPath, user.email, projectName);

    const insertUploadQuery = `
    INSERT INTO uploads (
      id, folder_name, uploaded_from, user_id, project_name, url,
      num_files_total, num_html_files, num_css_files, num_js_files,
      size_mb, has_index_html, referencias_externas,
      commit_hash, commit_message, commit_date, commit_author
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `;

    const [uploadResult]: any = await db.query(insertUploadQuery, [
        uploadId,
        folderName,
        uploadedFrom,
        user.id,
        projectName,
        publicUrl,
        metricas.numFilesTotal,
        metricas.numHtmlFiles,
        metricas.numCssFiles,
        metricas.numJsFiles,
        metricas.totalSizeMB,
        metricas.hasIndexHtml,
        metricas.referenciasExternas,
        commitHash ?? null,
        commitMessage ?? null,
        commitDate ?? null,
        commitAuthor ?? null
    ]);

    if (!uploadResult || uploadResult.affectedRows === 0) {
        throw new Error('No se pudo registrar la carpeta de subida');
    }

    const insertFilesQuery = `
    INSERT INTO uploaded_files (id, filename, filepath, upload_id)
    VALUES (?, ?, ?, ?);
  `;

    for (const item of files) {
        const fileId = uuidv4();
        const [result]: any = await db.query(insertFilesQuery, [
            fileId,
            item.filename,
            item.filepath,
            uploadId
        ]);

        if (!result || result.affectedRows === 0) {
            throw new Error(`Error al insertar el archivo: ${item.filename}`);
        }
    }

    return {
        uploadId,
        folderName,
        projectName,
        fileCount: files.length,
        url: publicUrl
    };
}


export async function getUserProjects(email: string) {
    // 1. Obtener el ID del usuario
    const [users]: any[] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
        throw new Error(`Usuario con email ${email} no encontrado`);
    }

    const userId = users[0].id;

    // 2. Obtener todos los proyectos del usuario
    const [projects]: any[] = await db.query(`
      SELECT u.id as upload_id, u.project_name, u.folder_name, u.url, u.created_at, uploaded_from
      FROM uploads u
      WHERE u.user_id = ?
      ORDER BY u.created_at DESC
    `, [userId]);

    if (!projects || projects.length === 0) return [];

    // 3. Obtener todos los archivos relacionados
    const uploadIds = projects.map((p: any) => p.upload_id);
    const [files]: any[] = await db.query(`
      SELECT f.id, f.filename, f.filepath, f.upload_id
      FROM uploaded_files f
      WHERE f.upload_id IN (?)
    `, [uploadIds]);

    // 4. Asociar archivos a cada proyecto
    const filesByUpload: Record<string, any[]> = {};
    files.forEach((file: any) => {
        if (!filesByUpload[file.upload_id]) {
            filesByUpload[file.upload_id] = [];
        }
        filesByUpload[file.upload_id].push({
            id: file.id,
            filename: file.filename,
            filepath: file.filepath
        });
    });

    return projects.map((project: any) => ({
        id: project.upload_id,
        project_name: project.project_name,
        uploadedFrom: project.uploaded_from,
        folder_name: project.folder_name,
        url: project.url,
        created_at: project.created_at,
        files: filesByUpload[project.upload_id] || []
    }));
}

export async function uploadUserFilesFromLocal(email: string, folderName: string, files: FileData[], projectName: string,
    publicUrl: string, uploadedFrom: string) {
    const [rows]: any[] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (!rows || rows.length === 0) {
        throw new Error(`Usuario con email ${email} no encontrado`);
    }

    const user = rows[0];
    const uploadId = uuidv4();
    const folderPath = getAbsoluteUploadPath(folderName);
    const metricas = analizarProyecto(folderPath, user.email, projectName);
    const insertUploadQuery = `
  INSERT INTO uploads (id, folder_name, uploaded_from, user_id, project_name, url,
    num_files_total, num_html_files, num_css_files, num_js_files,
    size_mb, has_index_html, referencias_externas)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
       `;

    const [uploadResult]: any = await db.query(insertUploadQuery, [
        uploadId,
        folderName,
        uploadedFrom,
        user.id,
        projectName,
        publicUrl,
        metricas.numFilesTotal,
        metricas.numHtmlFiles,
        metricas.numCssFiles,
        metricas.numJsFiles,
        metricas.totalSizeMB,
        metricas.hasIndexHtml,
        metricas.referenciasExternas,
    ]);

    if (!uploadResult || uploadResult.affectedRows === 0) {
        throw new Error('No se pudo registrar la carpeta de subida');
    }

    const insertFilesQuery = `
         INSERT INTO uploaded_files (id, filename, filepath, upload_id)
         VALUES (?, ?, ?, ?);
       `;

    for (const item of files) {
        const fileId = uuidv4();
        const [result]: any = await db.query(insertFilesQuery, [
            fileId,
            item.filename,
            item.filepath,
            uploadId
        ]);

        if (!result || result.affectedRows === 0) {
            throw new Error(`Error al insertar el archivo: ${item.filename}`);
        }
    }

    return {
        uploadId,
        folderName,
        projectName,
        fileCount: files.length,
        url: publicUrl
    };
}

export async function getProjectById(email: string, id: string) {
    // 1. Obtener el ID del usuario
    const [users]: any[] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
        throw new Error(`Usuario con email ${email} no encontrado`);
    }

    const userId = users[0].id;

    // 2. Obtener todos los proyectos del usuario
    const [projects]: any[] = await db.query(`
      SELECT u.id as upload_id, u.project_name, u.folder_name, u.url, u.created_at, uploaded_from
      FROM uploads u
      WHERE u.user_id = ? AND id = ?
      ORDER BY u.created_at DESC
    `, [userId, id]);

    if (!projects || projects.length === 0) return [];

    // 3. Obtener todos los archivos relacionados
    const uploadIds = projects.map((p: any) => p.upload_id);
    const [files]: any[] = await db.query(`
      SELECT f.id, f.filename, f.filepath, f.upload_id
      FROM uploaded_files f
      WHERE f.upload_id IN (?)
    `, [uploadIds]);

    // 4. Asociar archivos a cada proyecto
    const filesByUpload: Record<string, any[]> = {};
    files.forEach((file: any) => {
        if (!filesByUpload[file.upload_id]) {
            filesByUpload[file.upload_id] = [];
        }
        filesByUpload[file.upload_id].push({
            id: file.id,
            filename: file.filename,
            filepath: file.filepath
        });
    });

    return projects.map((project: any) => ({
        id: project.upload_id,
        project_name: project.project_name,
        uploadedFrom: project.uploaded_from,
        folder_name: project.folder_name,
        url: project.url,
        created_at: project.created_at,
        files: filesByUpload[project.upload_id] || []
    }));
}

export async function getMetricasPorUsuario(userId: string): Promise<any[]> {
    const [rows]: any = await db.query(`
    SELECT 
      id, project_name, folder_name, uploaded_from, url, created_at,
      num_files_total, num_html_files, num_css_files, num_js_files,
      size_mb, has_index_html, referencias_externas, commit_hash, commit_message, commit_date, commit_author
    FROM uploads
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId]);
    return rows as any[];
}


export const FilesService = {
    uploadUserFiles,
    getUserProjects,
    getMetricasPorUsuario
}