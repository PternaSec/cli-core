import fetch from 'node-fetch';

export interface Category {
  name: string;
  path: string;
  url: string;
}

export interface FileInfo {
  path: string;
  relativePath: string;
  downloadUrl: string;
}

export interface ToolInfo {
  name: string;
  category: string;
  files: FileInfo[];
}

const REPO_OWNER = 'PternaSec';
const REPO_NAME = 'scripts';
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json() as any[];
    
    return data
      .filter(item => item.type === 'dir' && !item.name.startsWith('.'))
      .map(item => ({
        name: item.name,
        path: item.path,
        url: item.url
      }));
  } catch (error) {
    return [
      { name: 'Red-Team', path: 'Red-Team', url: '' },
      { name: 'Blue-Team', path: 'Blue-Team', url: '' },
      { name: 'osint', path: 'osint', url: '' }
    ];
  }
}

export async function fetchToolsInCategory(categoryName: string): Promise<ToolInfo[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json() as any;
    
    if (!data.tree) return [];

    const toolsMap = new Map<string, ToolInfo>();

    data.tree.forEach((item: any) => {
      if (item.type === 'blob' && item.path.startsWith(`${categoryName}/`)) {
        // Ejemplo de path: osint/quasar/quasar.sh
        const parts = item.path.split('/');
        
        // Si el archivo está en la raíz de la categoría (ej. osint/script.sh), lo agrupamos como una herramienta suelta
        // Si está en un subdirectorio (ej. osint/quasar/quasar.sh), lo agrupamos bajo "quasar"
        const isRootFile = parts.length === 2;
        const toolName = isRootFile ? parts[1].split('.')[0] : parts[1];
        
        // relativePath será la ruta de guardado local (ej. quasar.sh o quasar/quasar.sh)
        const relativePath = isRootFile ? parts[1] : parts.slice(1).join('/');

        if (!toolsMap.has(toolName)) {
          toolsMap.set(toolName, {
            name: toolName,
            category: categoryName,
            files: []
          });
        }

        toolsMap.get(toolName)!.files.push({
          path: item.path,
          relativePath: relativePath,
          downloadUrl: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${item.path}`
        });
      }
    });

    return Array.from(toolsMap.values());
  } catch (error) {
    return [
      {
        name: 'mock-tool',
        category: categoryName,
        files: [
          { path: `${categoryName}/mock-tool/mock.sh`, relativePath: 'mock-tool/mock.sh', downloadUrl: 'null' }
        ]
      }
    ];
  }
}

export async function searchAllTools(keyword: string): Promise<ToolInfo[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`);
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    
    const data = await res.json() as any;
    if (!data.tree) return [];

    const toolsMap = new Map<string, ToolInfo>();

    data.tree.forEach((item: any) => {
      // Ignoramos archivos ocultos o de raíz que no estén en una categoría
      if (item.type === 'blob' && !item.path.startsWith('.')) {
        const parts = item.path.split('/');
        
        // Asumimos que la estructura es: categoria/herramienta/archivo o categoria/script.sh
        if (parts.length >= 2) {
          const categoryName = parts[0];
          const isRootFile = parts.length === 2;
          const toolName = isRootFile ? parts[1].split('.')[0] : parts[1];
          const relativePath = isRootFile ? parts[1] : parts.slice(1).join('/');

          const mapKey = `${categoryName}/${toolName}`;

          if (!toolsMap.has(mapKey)) {
            toolsMap.set(mapKey, {
              name: toolName,
              category: categoryName,
              files: []
            });
          }

          toolsMap.get(mapKey)!.files.push({
            path: item.path,
            relativePath: relativePath,
            downloadUrl: `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${item.path}`
          });
        }
      }
    });

    const allTools = Array.from(toolsMap.values());
    const lowerKeyword = keyword.toLowerCase();

    // Filtramos si el nombre de la herramienta o la categoría incluye la palabra clave
    return allTools.filter(tool => 
      tool.name.toLowerCase().includes(lowerKeyword) || 
      tool.category.toLowerCase().includes(lowerKeyword)
    );

  } catch (error) {
    return [];
  }
}
