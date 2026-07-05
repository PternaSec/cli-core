import { spinner, cancel, select } from '@clack/prompts';
import pc from 'picocolors';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { ToolInfo } from './github-fetcher.js';

export async function processTool(toolInfo: ToolInfo, targetDir: string, action: 'download' | 'execute') {
  const s = spinner();
  
  try {
    const toolPath = path.join(targetDir, toolInfo.name);

    if (!fs.existsSync(toolPath)) {
      try {
        fs.mkdirSync(toolPath, { recursive: true });
      } catch (err: any) {
        throw new Error(`No se pudo crear el directorio de la herramienta en ${toolPath}: ${err.message}`);
      }
    }

    // 2. Download all files
    s.start(`Descargando ${toolInfo.name} (${toolInfo.files.length} archivos)...`);
    
    for (const file of toolInfo.files) {
      // relativePath from github-fetcher might be 'quasar/quasar.sh' or 'quasar.sh' (for root tools)
      // We are saving inside `targetDir/toolName/`. 
      // If the relativePath starts with `toolName/`, we should strip it or just use it.
      // Wait, in github-fetcher: relativePath = isRootFile ? parts[1] : parts.slice(1).join('/') -> 'quasar/quasar.sh'
      // We want to save to `targetDir/toolName/quasar.sh`.
      
      let localRelativePath = file.relativePath;
      if (localRelativePath.startsWith(`${toolInfo.name}/`)) {
        localRelativePath = localRelativePath.substring(toolInfo.name.length + 1);
      }
      
      const fileSavePath = path.join(toolPath, localRelativePath);
      
      // Ensure subdirectories exist (e.g. if relativePath is 'assets/img.png')
      const fileDir = path.dirname(fileSavePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      if (file.downloadUrl && file.downloadUrl !== 'null') {
        const res = await fetch(file.downloadUrl);
        if (!res.ok) throw new Error(`Error descargando ${file.path}: ${res.status}`);
        
        // Use buffer for downloading binary files like images safely
        const content = await res.arrayBuffer();
        fs.writeFileSync(fileSavePath, Buffer.from(content));
      } else {
        fs.writeFileSync(fileSavePath, '#!/bin/bash\necho "Mock Exitoso"\n');
      }
    }
    
    s.stop(`${pc.green('✓')} Descarga completada en ${pc.dim(toolPath)}`);

    // 3. Execution Logic
    if (action === 'execute') {
      
      // Auto-detect entrypoint (Option A)
      let entrypoint = '';
      
      const possibleEntrypoints = [
        'install.sh',
        `${toolInfo.name}.sh`,
        `${toolInfo.name}.py`,
        `${toolInfo.name}.js`,
        'main.py',
        'index.js'
      ];

      for (const candidate of possibleEntrypoints) {
        if (fs.existsSync(path.join(toolPath, candidate))) {
          entrypoint = path.join(toolPath, candidate);
          break;
        }
      }

      // Si no encontró entrada automática, pasamos a Option B (Menú de selección manual)
      if (!entrypoint) {
        console.log(pc.yellow(`\nNo se encontró un archivo de ejecución por defecto (ej. install.sh o ${toolInfo.name}.sh).`));
        
        // Listar archivos ejecutables
        const executables = toolInfo.files
          .filter(f => f.relativePath.endsWith('.sh') || f.relativePath.endsWith('.py') || f.relativePath.endsWith('.js'))
          .map(f => {
             let p = f.relativePath;
             if (p.startsWith(`${toolInfo.name}/`)) p = p.substring(toolInfo.name.length + 1);
             return p;
          });

        if (executables.length === 0) {
          throw new Error('No hay archivos ejecutables (.sh, .py, .js) disponibles en esta herramienta.');
        }

        const manualChoice = await select({
          message: 'Selecciona qué script deseas ejecutar:',
          options: executables.map(e => ({ value: e, label: e }))
        });

        if (!manualChoice) {
          cancel('Operación cancelada.');
          process.exit(0);
        }

        entrypoint = path.join(toolPath, manualChoice as string);
      }

      // Permisos de ejecución
      try {
        fs.chmodSync(entrypoint, '755');
      } catch (err) {}

      // Execute
      console.log(pc.cyan('\n--- INICIANDO EJECUCIÓN ---\n'));
      
      await new Promise<void>((resolve, reject) => {
        const ext = path.extname(entrypoint);
        
        let cmd = entrypoint;
        let args: string[] = [];
        
        if (ext === '.py') {
          cmd = 'python3';
          args = [entrypoint];
        } else if (ext === '.js') {
          cmd = 'node';
          args = [entrypoint];
        } else if (ext === '.sh') {
          cmd = 'bash';
          args = [entrypoint];
        } else {
          cmd = entrypoint;
        }
        
        const child = spawn(cmd, args, { stdio: 'inherit', cwd: toolPath });
        
        child.on('close', (code) => {
          console.log(pc.cyan('\n--- FIN DE LA EJECUCIÓN ---\n'));
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Proceso terminado con código ${code}`));
          }
        });
        
        child.on('error', (err) => {
          reject(err);
        });
      });
    }

  } catch (error: any) {
    s.stop('Error en el proceso');
    cancel(pc.red(error.message));
    process.exit(1);
  }
}
