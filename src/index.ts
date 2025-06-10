// Import Express and related types
import express from 'express';
import type { Request, Response } from 'express';
import { json } from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';
import { getConfig } from './server';


// Import the MCP server class from your server.ts file
// Ensure ABAPAdtMcpServer is exported in server.ts (e.g., `export class mcp_abap_adt_server { ... }`)
import { ABAPAdtMcpServer } from './server';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';


// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });


const app = express();
// const PORT = process.env.PORT;
// const PORT = process.env.PORT | 8123; // Define the port you want to listen on
const MCP_PATH = '/mcp'; // Define the path for your MCP endpoint

// Use body-parser middleware to parse JSON requests
app.use(json());


async function startServer() {
  let mcpTransport: StreamableHTTPServerTransport | null = null; // Declare it outside to ensure it's accessible

  try {
    // Create an instance of your MCP server
    const mcpServerInstance = new ABAPAdtMcpServer();

    // Set the PORT
    const PORT = getConfig().port;

    // Create a SINGLE StreamableHTTPServerTransport instance here
    mcpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    // --- CRUCIAL CHANGE HERE ---
    // Connect the MCP server's internal `Server` instance to this `mcpTransport`
    await mcpServerInstance.connectTransport(mcpTransport);

    // This is the crucial part: handling incoming HTTP requests to /mcp
    app.post(MCP_PATH, async (req: Request, res: Response) => {
      if (!mcpTransport) {
        // This should theoretically not happen if startServer runs successfully
        console.error('MCP Transport not initialized.');
        return res.status(500).json({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Server not ready.',
          },
        });
      }

      try {
        // Pass the request to the SAME mcpTransport instance that the MCP server is connected to
        await mcpTransport.handleRequest(req, res, req.body);
      } catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to process MCP request',
            },
          });
        }
      }
    });

    const expressServer = app.listen(PORT, () => {
      console.log(`MCP Server running on http://localhost:${PORT}${MCP_PATH}`);
      console.log('Press Ctrl+C to stop');
    });

    // Graceful shutdown for Express server
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      // Optionally close the Express server gracefully
      if (expressServer) {
        expressServer.close(() => {
          console.log('Express server closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();