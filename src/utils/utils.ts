import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { ProyectoMetricas } from '../types/types';

export function analizarProyecto(uploadPath: string, ownerEmail: string, projectName: string): ProyectoMetricas {
    let numHtml = 0, numCss = 0, numJs = 0, totalSize = 0, referenciasExternas = 0;
    let hasIndexHtml = false;

    const scan = (dir: string) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                scan(fullPath);
            } else {
                totalSize += stats.size;
                const ext = path.extname(item).toLowerCase();

                if (ext === '.html') {
                    numHtml++;
                    if (item.toLowerCase() === 'index.html') {
                        hasIndexHtml = true;

                        const contenido = fs.readFileSync(fullPath, 'utf-8');
                        const $ = cheerio.load(contenido);
                        referenciasExternas += $('link[href^="http"]').length;
                        referenciasExternas += $('script[src^="http"]').length;
                        referenciasExternas += $('img[src^="http"]').length;
                    }
                } else if (ext === '.css') {
                    numCss++;
                } else if (ext === '.js') {
                    numJs++;
                }
            }
        }
    };

    scan(uploadPath);

    return {
        projectName,
        ownerEmail,
        numFilesTotal: numHtml + numCss + numJs,
        numHtmlFiles: numHtml,
        numCssFiles: numCss,
        numJsFiles: numJs,
        totalSizeMB: parseFloat((totalSize / (1024 * 1024)).toFixed(2)),
        hasIndexHtml,
        referenciasExternas,
        createdAt: new Date().toISOString()
    };
}


export function getAbsoluteUploadPath(folder: string) {
  return path.join(__dirname, '..', '..', 'uploads', folder);
}
