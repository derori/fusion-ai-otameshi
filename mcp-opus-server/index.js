import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const server = new Server(
  {
    name: "opus-assistant",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Helper to call Claude Opus
 */
async function callOpus(systemPrompt, userPrompt) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    return response.content[0].text;
  } catch (error) {
    return `Error calling Opus: ${error.message}`;
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_opus",
        description: "Ask Claude 3 Opus a general question or give it a task.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The task or question for Opus.",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "write_tests_with_opus",
        description: "Ask Claude 3 Opus to generate test code for the provided source code.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The source code to write tests for.",
            },
            context: {
              type: "string",
              description: "Additional context (e.g., testing framework, specific requirements).",
            },
          },
          required: ["code"],
        },
      },
      {
        name: "refactor_with_opus",
        description: "Ask Claude 3 Opus to refactor or fix the provided code.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The code to refactor or fix.",
            },
            instruction: {
              type: "string",
              description: "Specific instructions for refactoring or fixing.",
            },
          },
          required: ["code", "instruction"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "ask_opus":
      const generalResponse = await callOpus(
        "You are a helpful AI assistant powered by Claude 3 Opus.",
        args.prompt
      );
      return { content: [{ type: "text", text: generalResponse }] };

    case "write_tests_with_opus":
      const testResponse = await callOpus(
        "You are an expert software engineer specializing in writing high-quality unit tests. Provide ONLY the test code without extra explanation unless requested.",
        `Please write tests for the following code:\n\n${args.code}\n\nContext/Requirements: ${args.context || "Standard unit tests"}`
      );
      return { content: [{ type: "text", text: testResponse }] };

    case "refactor_with_opus":
      const refactorResponse = await callOpus(
        "You are an expert software engineer specializing in code refactoring and bug fixing. Provide the improved code and a brief summary of changes.",
        `Please refactor/fix this code based on these instructions: ${args.instruction}\n\nCode:\n${args.code}`
      );
      return { content: [{ type: "text", text: refactorResponse }] };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server using Stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Opus MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
