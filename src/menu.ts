import { intro, outro, select, text, spinner, isCancel, cancel, note } from '@clack/prompts';
import pc from 'picocolors';
import figlet from 'figlet';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fetchCategories, fetchToolsInCategory, searchAllTools, ToolInfo } from './github-fetcher.js';
import { processTool } from './executor.js';

function showBanner() {
  console.clear();
  const banner = figlet.textSync('PternaSec', {
    font: 'Slant',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });
  console.log(pc.cyan(banner));
}

export async function startInteractiveMenu() {
  showBanner();
  intro(pc.inverse(pc.bold(pc.cyan(' CLI Engine '))) + pc.dim(' v1.0.0'));

  const s = spinner();
  
  let step = 1;
  let state: any = {
    mode: '',
    category: '',
    tools: [],
    toolInfo: null,
    action: '',
    targetDir: ''
  };

  while (true) {
    try {
      if (step === 1) {
        const mode = await select({
          message: '¿Qué deseas hacer?',
          options: [
            { value: 'explore', label: '📂 Explorar por Categoría' },
            { value: 'search', label: '🔍 Buscar Herramienta por palabra clave' },
            { value: 'exit', label: '❌ Salir' }
          ]
        });

        if (isCancel(mode) || mode === 'exit') {
          cancelExit();
          return;
        }

        state.mode = mode;
        step = 2;
      } 
      
      else if (step === 2) {
        if (state.mode === 'explore') {
          s.start('Cargando categorías de PternaSec...');
          const categories = await fetchCategories();
          s.stop('Categorías cargadas.');

          if (categories.length === 0) {
            console.log(pc.yellow('No se encontraron categorías.'));
            step = 1;
            continue;
          }

          const categoryOptions = categories.map(cat => ({
            value: cat.name,
            label: cat.name
          }));
          categoryOptions.push({ value: 'back', label: '🔙 Volver al Menú Principal' });

          const category = await select({
            message: 'Selecciona un dominio:',
            options: categoryOptions,
          });

          if (isCancel(category) || category === 'back') {
            step = 1;
            continue;
          }

          state.category = category;
          
          s.start(`Buscando herramientas en ${category}...`);
          state.tools = await fetchToolsInCategory(category as string);
          s.stop(`Herramientas listas.`);
          step = 3;

        } else {
          // Búsqueda
          const keyword = await text({
            message: 'Ingresa la palabra clave a buscar (o deja vacío para volver):',
            placeholder: 'ej. exploit, osint, nmap...'
          });

          if (isCancel(keyword) || (keyword as string).trim() === '') {
            step = 1;
            continue;
          }

          s.start(`Buscando "${keyword}"...`);
          state.tools = await searchAllTools(keyword as string);
          s.stop('Búsqueda finalizada.');
          step = 3;
        }
      } 
      
      else if (step === 3) {
        if (state.tools.length === 0) {
          console.log(pc.yellow(`No hay herramientas que coincidan con tu búsqueda.`));
          step = 2;
          continue;
        }

        const toolOptions = state.tools.map((tool: ToolInfo) => ({
          value: tool,
          label: tool.name,
          hint: `[${tool.files.length} archivos]`
        }));
        toolOptions.push({ value: 'back', label: '🔙 Volver atrás' as any });

        const selectedTool = await select({
          message: 'Selecciona la Herramienta:',
          options: toolOptions,
        });

        if (isCancel(selectedTool) || selectedTool === 'back') {
          step = 2;
          continue;
        }

        state.toolInfo = selectedTool as ToolInfo;
        
        // --- Fetch and Display Metadata ---
        const readmeFile = state.toolInfo.files.find((f: any) => f.relativePath.toLowerCase().endsWith('readme.md'));
        if (readmeFile && readmeFile.downloadUrl && readmeFile.downloadUrl !== 'null') {
          s.start(`Obteniendo información de ${state.toolInfo.name}...`);
          try {
            const readmeRes = await fetch(readmeFile.downloadUrl);
            if (readmeRes.ok) {
              const readmeContent = await readmeRes.text();
              const titleMatch = readmeContent.match(/title:\s*"?([^"\n]+)"?/);
              const descMatch = readmeContent.match(/description:\s*"?([^"\n]+)"?/);
              const authorMatch = readmeContent.match(/author:\s*"?([^"\n]+)"?/);
              const severityMatch = readmeContent.match(/severity:\s*"?([^"\n]+)"?/);
              
              const title = titleMatch ? titleMatch[1] : state.toolInfo.name;
              const desc = descMatch ? descMatch[1] : 'Sin descripción disponible.';
              
              let infoText = pc.italic(desc);
              if (authorMatch) infoText += `\n\n${pc.bold('Autor:')} ${authorMatch[1]}`;
              if (severityMatch) infoText += `\n${pc.bold('Severidad:')} ${severityMatch[1]}`;
              
              s.stop('Información cargada.');
              note(infoText, pc.cyan(` Información de ${title} `));
            } else {
              s.stop('Información no disponible.');
            }
          } catch (e) {
            s.stop('No se pudo cargar la descripción.');
          }
        }
        
        step = 4;
      } 
      
      else if (step === 4) {
        const action = await select({
          message: `¿Qué acción deseas realizar con ${pc.bold(state.toolInfo.name)}?`,
          options: [
            { value: 'download', label: '⬇️  Solo Descargar todo el proyecto' },
            { value: 'execute', label: '🚀 Descargar e Instalar/Ejecutar en entorno seguro' },
            { value: 'back', label: '🔙 Elegir otra herramienta' }
          ]
        });

        if (isCancel(action) || action === 'back') {
          step = 3;
          continue;
        }

        state.action = action;
        step = 5;
      } 
      
      else if (step === 5) {
        const defaultDir = path.join(os.homedir(), '.pternasec', 'scripts');
        const currentDir = process.cwd();

        const pathChoice = await select({
          message: `¿Dónde deseas clonar la carpeta de la herramienta?`,
          options: [
            { value: defaultDir, label: `Directorio por defecto (${defaultDir})` },
            { value: currentDir, label: `Directorio actual (${currentDir})` },
            { value: 'custom', label: 'Ingresar ruta personalizada...' },
            { value: 'back', label: '🔙 Volver a opciones de acción' }
          ]
        });

        if (isCancel(pathChoice) || pathChoice === 'back') {
          step = 4;
          continue;
        }

        state.targetDir = pathChoice as string;

        if (pathChoice === 'custom') {
          const customPath = await text({
            message: 'Ingresa la ruta absoluta del directorio base (o deja vacío para cancelar):',
            placeholder: '/home/usuario/Descargas',
            validate(value) {
              if (!value || value.trim().length === 0) return; // Permite cancelar
              let checkPath = value as string;
              if (checkPath.startsWith('~/')) {
                checkPath = path.join(os.homedir(), checkPath.slice(2));
              }
              if (!fs.existsSync(checkPath)) {
                return 'El directorio no existe. Verifica la ruta ingresada.';
              }
            }
          });

          if (isCancel(customPath) || (customPath as string).trim() === '') {
            step = 5;
            continue;
          }
          
          state.targetDir = customPath as string;
          if (state.targetDir.startsWith('~/')) {
            state.targetDir = path.join(os.homedir(), state.targetDir.slice(2));
          }
        }

        // Ejecutar
        await processTool(state.toolInfo, state.targetDir, state.action);
        
        note(pc.green('Operación completada exitosamente. ¿Qué deseas hacer ahora?'), '¡Éxito!');
        
        // Volver al inicio automáticamente
        step = 1;
      }
    } catch (err: any) {
      console.log(pc.red(`\nSe produjo un error: ${err.message}`));
      note('Regresando al menú principal...', 'Recuperación Automática');
      step = 1; // Volvemos al inicio en caso de crash interno
    }
  }
}

function cancelExit() {
  outro(pc.gray('Operación terminada. ¡Mantén tus sistemas seguros!'));
  process.exit(0);
}
