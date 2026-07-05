#!/usr/bin/env node
import { Command } from 'commander';
import { startInteractiveMenu } from '../src/menu.js';

const program = new Command();

program
  .name('pternasec')
  .description('PternaSec CLI - Gestor Interactivo de Herramientas de Ciberseguridad')
  .version('1.0.0');

program
  .command('interactive', { isDefault: true })
  .description('Inicia el menú interactivo principal')
  .action(async () => {
    await startInteractiveMenu();
  });

program.parse(process.argv);
