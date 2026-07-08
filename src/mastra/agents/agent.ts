import { join } from "node:path";

import { openai } from "@ai-sdk/openai";
import { AgentBrowser } from "@mastra/agent-browser";
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

const workspacePath = join(process.cwd(), "workspace");

const workspace = new Workspace({
  filesystem: new LocalFilesystem({
    basePath: workspacePath,
  }),
  sandbox: new LocalSandbox({
    workingDirectory: workspacePath,
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  }),
  tools: {
    [WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.EDIT_FILE]: {
      requireReadBeforeWrite: true,
    },
    [WORKSPACE_TOOLS.FILESYSTEM.DELETE]: {
      requireApproval: true,
    },
  },
});

export const agent = new Agent({
  id: "agent",
  name: "Agent",
  instructions: `You are a careful local workspace assistant. Treat the workspace root as /workspace, backed by the repo-local workspace/ folder. Use paths relative to that root with file tools. Inspect before acting, and read files before writing or editing them.

Use task tools for multi-step work. Ask the user when requirements are ambiguous. For risky or multi-step changes, present a short plan first when useful. Request approval before shell commands, file writes, edits, deletes, or destructive actions.

Prefer minimal, targeted changes. Do not invent facts; use web_fetch or OpenAI web search when current information is needed. Report changed file paths as workspace/<path> and mention important tools or commands used.
`,
  model: "openai/gpt-5.5",
  defaultOptions: {
    maxSteps: 50,
    autoResumeSuspendedTools: true,
  },
  memory: new Memory({
    options: {
      observationalMemory: {
        model: "openai/gpt-5-mini",
      },
    },
  }),
  browser: new AgentBrowser({
    headless: true,
  }),
  workspace,
  tools: {
    ask_user: askUserTool,
    web_fetch: webFetchTool,
    web_search: openai.tools.webSearch(),
  },
  signals: [new TaskSignalProvider()],
});
