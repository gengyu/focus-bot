//  import { spawn } from 'child_process';
// import { MCPRequest, MCPResponse, MCPStreamOptions } from '@mcp-connect/core/src/types';
// import { Transport } from '../types';
//
// /**
//  * 命令行传输配置
//  */
// interface CommandTransportConfig {
//   commandPath?: string;
//   commandArgs?: string[];
// }
//
// /**
//  * 命令行传输实现
//  * 通过命令行调用与外部程序通信
//  */
// export class CommandTransport implements Transport {
//   private readonly commandPath: string;
//   private readonly commandArgs: string[];
//
//   constructor(config: CommandTransportConfig) {
//     this.commandPath = config.commandPath || 'node';
//     this.commandArgs = config.commandArgs || [];
//   }
//
//   /**
//    * 直接调用，返回响应
//    */
//   async invokeDirect(request: MCPRequest): Promise<MCPResponse> {
//     return new Promise((resolve) => {
//       try {
//         // 启动子进程
//         const child = spawn(this.commandPath, this.commandArgs, {
//           stdio: ['pipe', 'pipe', 'pipe']
//         });
//
//         let stdout = '';
//         let stderr = '';
//
//         // 收集标准输出
//         child.stdout.on('data', (data) => {
//           stdout += data.toString();
//         });
//
//         // 收集标准错误
//         child.stderr.on('data', (data) => {
//           stderr += data.toString();
//         });
//
//         // 进程结束处理
//         child.on('close', (code) => {
//           if (code === 0 && stdout) {
//             try {
//               const response = JSON.parse(stdout);
//               resolve(response);
//             } catch (error) {
//               resolve({
//                 success: false,
//                 error: 'Failed to parse command output'
//               });
//             }
//           } else {
//             resolve({
//               success: false,
//               error: stderr || `Command exited with code ${code}`
//             });
//           }
//         });
//
//         // 发送请求数据到子进程
//         child.stdin.write(JSON.stringify(request) + '\n');
//         child.stdin.end();
//       } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
//         resolve({
//           success: false,
//           error: errorMessage
//         });
//       }
//     });
//   }
//
//   /**
//    * 流式调用，通过回调处理响应
//    */
//   async invokeStream(request: MCPRequest, options: MCPStreamOptions): Promise<void> {
//     try {
//       // 启动子进程
//       const child = spawn(this.commandPath, this.commandArgs, {
//         stdio: ['pipe', 'pipe', 'pipe']
//       });
//
//       // 处理标准输出
//       child.stdout.on('data', (data) => {
//         try {
//           const lines = data.toString().split('\n').filter(Boolean);
//           for (const line of lines) {
//             const chunk = JSON.parse(line);
//             if (chunk.type === 'data') {
//               options.onData?.(chunk.data);
//             } else if (chunk.type === 'error') {
//               options.onError?.(new Error(chunk.error));
//             } else if (chunk.type === 'end') {
//               options.onComplete?.();
//             }
//           }
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Failed to parse stream data';
//           options.onError?.(error instanceof Error ? error : new Error(errorMessage));
//         }
//       });
//
//       // 处理标准错误
//       child.stderr.on('data', (data) => {
//         options.onError?.(new Error(data.toString()));
//       });
//
//       // 进程结束处理
//       child.on('close', () => {
//         options.onComplete?.();
//       });
//
//       // 发送请求数据到子进程
//       child.stdin.write(JSON.stringify(request) + '\n');
//       child.stdin.end();
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
//       options.onError?.(error instanceof Error ? error : new Error(errorMessage));
//     }
//   }
// }