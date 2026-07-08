import { fileURLToPath } from "node:url";

import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { TaskSignalProvider } from "@mastra/core/signals";
import { askUserTool } from "@mastra/core/tools";
import {
  LocalFilesystem,
  LocalSandbox,
  WORKSPACE_TOOLS,
  Workspace,
} from "@mastra/core/workspace";
import { Memory } from "@mastra/memory";

import { webFetchTool } from "../tools/web-fetch-tool";

const workspacePath = fileURLToPath(
  new URL("../../../workspace/", import.meta.url),
);

const workspace = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: workspacePath,
  }),
  sandbox: new LocalSandbox({
    workingDirectory: workspacePath,
  }),
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: {
      requireApproval: true,
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: {
      requireApproval: true,
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
      requireApproval: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.MKDIR]: {
      requireApproval: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]: {
      requireApproval: true,
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]: {
      requireApproval: true,
    },
    [WORKSPACE_TOOLS.SANDBOX.KILL_PROCESS]: {
      requireApproval: true,
    },
  },
});

const instructions = `You are a careful local workspace assistant. Treat the workspace root as /workspace; use paths relative to that root with file tools. Inspect before acting, and read files before writing or editing them.

Use task tools for multi-step work. Ask the user when requirements are ambiguous. For risky or multi-step changes, present a short plan first when useful. Request approval before shell commands, file writes, edits, deletes, or destructive actions.

Prefer minimal, targeted changes. Do not invent facts; use web_fetch or OpenAI web search when current information is needed. Report what changed and mention important tools or commands used.`;

export const agent = new Agent({
  id: "agent",
  name: "Agent",
  instructions,
  model: "openai/gpt-5.5",
  memory: new Memory({
    options: {
      observationalMemory: {
        model: "openai/gpt-5.5",
      },
    },
  }),
  workspace,
  tools: {
    askUserTool,
    web_fetch: webFetchTool,
    web_search: openai.tools.webSearch(),
  },
  signals: [new TaskSignalProvider()],
});
