/**
 * Gemini Chat Overdrive - Servidor MCP Nativo para Execução SSH e WSL2
 * Permite ao agente Gemini:
 *  1. Conectar via SSH em servidores remotos (root@ip) usando pasta de chaves configurada
 *  2. Executar comandos nativos no WSL2 local (Ubuntu-22.04, Docker, Python, etc.)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const KEYS_DIR = process.env.SSH_KEYS_DIR || path.join(os.homedir(), '.ssh');
const DEFAULT_HOST = process.env.DEFAULT_SSH_HOST || '';
const DEFAULT_USER = process.env.DEFAULT_SSH_USER || os.userInfo().username;
const DEFAULT_KEY = process.env.DEFAULT_SSH_KEY || '';
const DEFAULT_WSL_DISTRO = process.env.DEFAULT_WSL_DISTRO || '';

function resolveKeyPath(keyName) {
  if (!keyName) {
    if (DEFAULT_KEY && fs.existsSync(DEFAULT_KEY)) return DEFAULT_KEY;
    const common = ['chave.pem', 'chave', 'id_ed25519', 'id_rsa'];
    for (const name of common) {
      const p = path.join(KEYS_DIR, name);
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
  if (fs.existsSync(keyName)) return keyName;
  const inDir = path.join(KEYS_DIR, keyName);
  if (fs.existsSync(inDir)) return inDir;
  return null;
}

function parseHostUser(inputHost, inputUser) {
  let host = (inputHost || DEFAULT_HOST).trim();
  let user = (inputUser || DEFAULT_USER).trim();

  if (host.includes('@')) {
    const parts = host.split('@');
    user = parts[0];
    host = parts[1];
  }
  return { host, user };
}

function executeWslCommand({ command, distro = DEFAULT_WSL_DISTRO, user = '', timeout = 60 }) {
  return new Promise((resolve) => {
    const args = distro ? ['-d', distro] : [];
    if (user) {
      args.push('-u', user);
    }
    args.push('bash', '-c', command);

    let stdout = '';
    let stderr = '';
    let timer = null;

    try {
      const proc = spawn('wsl.exe', args, { windowsHide: true });

      if (timeout > 0) {
        timer = setTimeout(() => {
          proc.kill('SIGTERM');
          resolve({
            ok: false,
            exitCode: -1,
            stdout,
            stderr: stderr + `\n[Timeout de ${timeout}s excedido no WSL2]`
          });
        }, timeout * 1000);
      }

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('error', (err) => {
        if (timer) clearTimeout(timer);
        resolve({
          ok: false,
          exitCode: -1,
          stdout,
          stderr: `Erro ao iniciar WSL2: ${err.message}`
        });
      });

      proc.on('close', (code) => {
        if (timer) clearTimeout(timer);
        resolve({
          ok: code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
    } catch (e) {
      if (timer) clearTimeout(timer);
      resolve({
        ok: false,
        exitCode: -1,
        stdout: '',
        stderr: e.message
      });
    }
  });
}

function executeSshCommand({ host, user, port = 22, key, command, timeout = 60 }) {
  return new Promise((resolve) => {
    // Se o host for local ou wsl, executa diretamente no WSL2
    if (host.toLowerCase() === 'wsl' || host.toLowerCase() === 'localhost') {
      return executeWslCommand({ command, timeout }).then(resolve);
    }

    const keyPath = resolveKeyPath(key);
    const args = [
      '-p', String(port),
      '-o', 'StrictHostKeyChecking=accept-new',
      '-o', 'ConnectTimeout=15',
      '-o', 'BatchMode=yes',
    ];

    if (keyPath) {
      args.push('-i', keyPath);
    }

    const target = `${user}@${host}`;
    args.push(target, command);

    let stdout = '';
    let stderr = '';
    let timer = null;

    try {
      const proc = spawn('ssh', args, { windowsHide: true });

      if (timeout > 0) {
        timer = setTimeout(() => {
          proc.kill('SIGTERM');
          resolve({
            ok: false,
            exitCode: -1,
            stdout,
            stderr: stderr + `\n[Timeout de ${timeout}s excedido no SSH]`
          });
        }, timeout * 1000);
      }

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('error', (err) => {
        if (timer) clearTimeout(timer);
        resolve({
          ok: false,
          exitCode: -1,
          stdout,
          stderr: `Falha ao iniciar cliente SSH: ${err.message}`
        });
      });

      proc.on('close', (code) => {
        if (timer) clearTimeout(timer);
        resolve({
          ok: code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
    } catch (e) {
      if (timer) clearTimeout(timer);
      resolve({
        ok: false,
        exitCode: -1,
        stdout: '',
        stderr: e.message
      });
    }
  });
}

const server = new Server(
  {
    name: 'gemini-ssh-wsl-mcp',
    version: '1.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'wsl_exec',
        description: 'Executa comandos Linux bash diretamente dentro do WSL2 (Ubuntu-22.04) no seu PC local. Tem acesso a Docker, Python, Git, Node, compiladores e todo o ambiente Linux local sem precisar de rede ou SSH.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'O comando bash a executar no WSL2 (ex: "docker ps", "uname -a", "python3 script.py", "git status", "ls -la /home/usuario").'
            },
            distro: {
              type: 'string',
              description: 'Distribuição WSL (padrão: "Ubuntu-22.04").'
            },
            user: {
              type: 'string',
              description: 'Usuário do Linux (ex: "usuario" ou "root").'
            },
            timeout: {
              type: 'number',
              description: 'Timeout máximo em segundos (padrão: 60).'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'ssh_connect_and_exec',
        description: 'Conecta via SSH a um servidor remoto (ex: root@192.168.1.100 ou especificando host e usuário) e executa comandos bash com retorno de stdout, stderr e código de saída. Suporta chaves da pasta configurada. Se host="wsl", executa no WSL2 local.',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'Endereço IP ou hostname do servidor remoto (ex: "root@192.168.1.50" ou "192.168.1.50" ou "wsl").'
            },
            command: {
              type: 'string',
              description: 'O comando bash a executar remotamente (ex: "uname -a", "docker ps", "cat /var/log/nginx/error.log", "free -m").'
            },
            user: {
              type: 'string',
              description: 'Usuário SSH (padrão: "root" ou extraído de user@host).'
            },
            key: {
              type: 'string',
              description: 'Nome do arquivo de chave privada na pasta de chaves configurada (ex: "chave.pem", "id_ed25519", "id_rsa").'
            },
            port: {
              type: 'number',
              description: 'Porta SSH (padrão: 22).'
            },
            timeout: {
              type: 'number',
              description: 'Timeout máximo em segundos (padrão: 60).'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'ssh_list_available_keys',
        description: 'Lista todas as chaves privadas e arquivos de credenciais encontrados na pasta de chaves configurada para você escolher qual usar.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'ssh_test_connection',
        description: 'Testa a conectividade e autenticação SSH com um servidor (root@ip) retornando tempo de resposta, uptime e identificação do sistema.',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'Host ou root@ip a ser testado.'
            },
            user: {
              type: 'string',
              description: 'Usuário (padrão "root").'
            },
            key: {
              type: 'string',
              description: 'Nome da chave na pasta de chaves configurada (opcional).'
            },
            port: {
              type: 'number',
              description: 'Porta SSH (padrão: 22).'
            }
          },
          required: ['host']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === 'wsl_exec') {
    const command = args.command;
    if (!command) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Comando WSL2 não informado.' }]
      };
    }
    const res = await executeWslCommand({
      command,
      distro: args.distro || DEFAULT_WSL_DISTRO,
      user: args.user || '',
      timeout: args.timeout || 60
    });
    return {
      isError: !res.ok,
      content: [{
        type: 'text',
        text: JSON.stringify({
          environment: 'WSL2 (Ubuntu-22.04)',
          command,
          exitCode: res.exitCode,
          stdout: res.stdout,
          stderr: res.stderr || null
        }, null, 2)
      }]
    };
  }

  if (name === 'ssh_list_available_keys') {
    try {
      if (!fs.existsSync(KEYS_DIR)) {
        return {
          content: [{ type: 'text', text: `Pasta de chaves não encontrada: ${KEYS_DIR}` }]
        };
      }
      const files = fs.readdirSync(KEYS_DIR);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            keysDirectory: KEYS_DIR,
            availableFiles: files
          }, null, 2)
        }]
      };
    } catch (e) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Erro ao listar chaves: ${e.message}` }]
      };
    }
  }

  if (name === 'ssh_test_connection') {
    const { host, user } = parseHostUser(args.host, args.user);
    if (!host) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Host não informado.' }]
      };
    }

    const res = await executeSshCommand({
      host,
      user,
      port: args.port || 22,
      key: args.key,
      command: 'uname -a && uptime',
      timeout: 15
    });

    return {
      isError: !res.ok,
      content: [{
        type: 'text',
        text: JSON.stringify({
          target: `${user}@${host}`,
          connected: res.ok,
          exitCode: res.exitCode,
          systemInfo: res.stdout,
          error: res.stderr || null
        }, null, 2)
      }]
    };
  }

  if (name === 'ssh_connect_and_exec') {
    const { host, user } = parseHostUser(args.host, args.user);
    const command = args.command;

    if (!host) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Host SSH não informado. Informe no formato "root@ip" ou campo host.' }]
      };
    }
    if (!command) {
      return {
        isError: true,
        content: [{ type: 'text', text: 'Comando não informado.' }]
      };
    }

    const res = await executeSshCommand({
      host,
      user,
      port: args.port || 22,
      key: args.key,
      command,
      timeout: args.timeout || 60
    });

    return {
      isError: !res.ok,
      content: [{
        type: 'text',
        text: JSON.stringify({
          server: `${user}@${host}`,
          command,
          exitCode: res.exitCode,
          stdout: res.stdout,
          stderr: res.stderr || null
        }, null, 2)
      }]
    };
  }

  return {
    isError: true,
    content: [{ type: 'text', text: `Ferramenta desconhecida: ${name}` }]
  };
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

run().catch((e) => {
  console.error('Fatal SSH/WSL MCP error:', e);
  process.exit(1);
});
