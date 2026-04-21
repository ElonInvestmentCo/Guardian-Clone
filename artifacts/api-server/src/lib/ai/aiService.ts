import OpenAI from "openai";

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiStreamChunk {
  content?: string;
  done?: boolean;
}

export interface AiProvider {
  name: string;
  chatStream(messages: AiMessage[]): AsyncIterable<AiStreamChunk>;
  chat(messages: AiMessage[]): Promise<string>;
}

function buildCloudflareProvider(): AiProvider {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error("CLOUDFLARE_API_TOKEN must be set for Cloudflare provider");

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID must be set for Cloudflare provider");

  const client = new OpenAI({
    apiKey: process.env.CLOUDFLARE_API_TOKEN,
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
    defaultHeaders: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    },
  });

  return {
    name: "cloudflare",

    async *chatStream(messages: AiMessage[]): AsyncIterable<AiStreamChunk> {
      const stream = await client.chat.completions.create({
        model: "gpt-5",
        max_tokens: 8192,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield { content };
      }
      yield { done: true };
    },

    async chat(messages: AiMessage[]): Promise<string> {
      const resp = await client.chat.completions.create({
        model: "gpt-5",
        max_tokens: 8192,
        messages,
      });
      return resp.choices[0]?.message?.content ?? "";
    },
  };
}

function buildOpenAiProvider(): AiProvider {
  const client = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });

  return {
    name: "openai",

    async *chatStream(messages: AiMessage[]): AsyncIterable<AiStreamChunk> {
      const stream = await client.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 8192,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield { content };
      }
      yield { done: true };
    },

    async chat(messages: AiMessage[]): Promise<string> {
      const resp = await client.chat.completions.create({
        model: "gpt-4o",
        max_completion_tokens: 8192,
        messages,
      });
      return resp.choices[0]?.message?.content ?? "";
    },
  };
}

function buildGrokProvider(): AiProvider {
  const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY or GROK_API_KEY must be set for Grok provider");

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });

  return {
    name: "grok",

    async *chatStream(messages: AiMessage[]): AsyncIterable<AiStreamChunk> {
      const stream = await client.chat.completions.create({
        model: "grok-3",
        max_tokens: 8192,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield { content };
      }
      yield { done: true };
    },

    async chat(messages: AiMessage[]): Promise<string> {
      const resp = await client.chat.completions.create({
        model: "grok-3",
        max_tokens: 8192,
        messages,
      });
      return resp.choices[0]?.message?.content ?? "";
    },
  };
}

let _provider: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (_provider) return _provider;

  if (process.env.CLOUDFLARE_API_TOKEN) {
    console.log("[AI] Using Cloudflare AI provider (gpt-5)");
    _provider = buildCloudflareProvider();
  } else {
    const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    if (grokKey) {
      console.log("[AI] Using Grok (xAI) provider");
      _provider = buildGrokProvider();
    } else if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
      console.log("[AI] Using OpenAI provider (Replit integration)");
      _provider = buildOpenAiProvider();
    } else {
      throw new Error("No AI provider configured. Set CLOUDFLARE_API_TOKEN for Cloudflare, XAI_API_KEY for Grok, or provision the OpenAI integration.");
    }
  }

  return _provider;
}

export function resetProvider(): void {
  _provider = null;
}
