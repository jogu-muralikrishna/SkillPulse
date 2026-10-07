/**
 * ============================================================================
 * SKILLPULSE ASSISTANT SERVICE — GEMINI FUNCTION CALLING & GROUNDING
 * ============================================================================
 * Model: gemini-3.8-flash (with automatic fallback to gemini-3.5-flash-lite on 503)
 *
 * Rules:
 * 1. Strict tool grounding: Answers strictly derived from tool results.
 * 2. Absolutely no fake numbers, skills, forecasts, locations, or policy facts.
 * 3. When tool returns empty/unavailable data: Explicitly states "data not available".
 * 4. Multi-step function calling loop: Executes requested server-side tools,
 *    returns results as functionResponse, and generates final grounded answer.
 * 5. Machine-readable source metadata and attribution chips.
 * 6. Safe fallback when Gemini is unreachable: Never fabricates substitute data.
 * ============================================================================
 */

import { GoogleGenAI } from '@google/genai';
import {
  ASSISTANT_TOOL_DECLARATIONS,
  ALLOWED_TOOL_NAMES,
  executeAssistantTool,
  ToolSourceMetadata,
  ExecutedToolRecord
} from './assistantTools';
import {
  resolveCanonicalState,
  resolveCanonicalDistrict
} from '../utils/canonicalGeography';
import { MASTER_STATES, MASTER_DISTRICTS } from '../data/masterGeography';

export interface AssistantChatParams {
  message: string;
  state?: string;
  district?: string;
  sector?: string;
  skill?: string;
  period?: string;
}

export interface AssistantSourceCitation {
  endpoint: string;
  source: string;
}

export interface AssistantChatResult {
  answer: string;
  reply: string; // for backwards compatibility with existing UI
  toolCalls: Array<{
    name: string;
    params: Record<string, any>;
    endpoint: string;
    source: string;
  }>;
  sources: AssistantSourceCitation[];
  isFallback?: boolean;
}

const SYSTEM_INSTRUCTION = `You are SkillPulse Assistant, an expert labor market intelligence analyst for the SkillPulse platform.
Your mandate is to provide factual, transparent, and strictly grounded insights on skill demand, worker supply, skill shortages, training capacity, and forecasts in India.

CRITICAL GROUNDING RULES:
1. STRICT TOOL GROUNDING: You MUST answer strictly and exclusively using the verified facts, figures, and calculations returned by the provided tools.
2. ABSOLUTELY NO FAKE DATA: You must NEVER invent or hallucinate:
   - numbers, percentages, or vacancy counts
   - skill names or job roles
   - forecasts, horizons, or projection numbers
   - locations, states, or districts
   - data sources, dates, or quarters
   - policy facts
3. MISSING DATA RULE: When a tool returns no data (e.g. empty lists, 0 observations, or isAvailable = false), you MUST explicitly say: "data not available". Explain clearly why (e.g. insufficient historical data, unrecorded location, or unfiled vacancy returns).
4. EVERY NUMERIC CLAIM MUST BE TRACEABLE: Every single number, count, or metric you mention MUST be directly traceable to the tool result.
5. SOURCE ATTRIBUTION: State the official source(s) and endpoints cited (e.g., National Career Service (NCS), e-Shram, MSDE).
6. Always answer in clear, professional, executive language with structured bullet points where helpful.`;

/**
 * Resolves Gemini client safely from environment variables only.
 */
function getAssistantGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      timeout: 20000 // 20s network timeout
    }
  });
}

/**
 * Executes a deterministic local fallback when Gemini is offline or unreachable.
 * Never invents numbers or fake answers.
 */
async function executeDeterministicFallback(
  params: AssistantChatParams
): Promise<AssistantChatResult> {
  const message = params.message;
  let targetState = params.state ? resolveCanonicalState(params.state) : null;
  let targetDistrict = params.district ? resolveCanonicalDistrict(params.district, targetState?.state_name) : null;

  // Infer mentioned locations from message text
  if (!targetDistrict && !targetState) {
    for (const d of MASTER_DISTRICTS) {
      if (new RegExp(`\\b${d.district_name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(message)) {
        targetDistrict = d;
        targetState = resolveCanonicalState(d.state_id);
        break;
      }
    }
  }

  const queryState = targetState?.state_name || params.state;
  const queryDistrict = targetDistrict?.district_name || params.district;

  const executedTools: ExecutedToolRecord[] = [];
  const sourcesMap = new Map<string, string>();

  // Determine intent based on keywords
  const lower = message.toLowerCase();
  let toolMeta: ToolSourceMetadata | null = null;
  let toolName = 'getDemand';

  if (lower.includes('forecast') || lower.includes('project') || lower.includes('future') || lower.includes('trend')) {
    toolName = 'getForecast';
    toolMeta = await executeAssistantTool('getForecast', {
      skill: params.skill || (lower.includes('python') ? 'Python Development' : ''),
      state: queryState || '',
      district: queryDistrict || ''
    });
  } else if (lower.includes('gap') || lower.includes('shortage') || lower.includes('oversupply')) {
    toolName = 'getGaps';
    toolMeta = await executeAssistantTool('getGaps', {
      state: queryState,
      district: queryDistrict,
      sector: params.sector,
      skill: params.skill
    });
  } else if (lower.includes('simulate') || lower.includes('what-if') || lower.includes('capacity')) {
    toolName = 'simulate';
    toolMeta = await executeAssistantTool('simulate', {
      skill: params.skill || (lower.includes('solar') ? 'Solar PV Installation' : 'Python Development'),
      state: queryState || 'Telangana',
      district: queryDistrict || 'Hyderabad',
      additionalCapacity: 50
    });
  } else if (lower.includes('priority') || lower.includes('rank')) {
    toolName = 'getPriority';
    toolMeta = await executeAssistantTool('getPriority', {
      state: queryState,
      district: queryDistrict
    });
  } else {
    toolName = 'getDemand';
    toolMeta = await executeAssistantTool('getDemand', {
      state: queryState,
      district: queryDistrict,
      sector: params.sector,
      skill: params.skill,
      period: params.period
    });
  }

  executedTools.push({
    name: toolName,
    args: toolMeta.params,
    endpoint: toolMeta.endpoint,
    source: toolMeta.source,
    result: toolMeta
  });
  sourcesMap.set(toolMeta.endpoint, toolMeta.source);

  // Synthesize strictly grounded response
  let answer = '';
  const data = toolMeta.data;

  if (toolName === 'getDemand') {
    if (data.recordCount === 0 || data.totalDemand === 0) {
      answer = `For the requested parameters (${queryDistrict ? queryDistrict + ', ' : ''}${queryState || 'All covered areas'}), data not available in official vacancy filings. (Source: ${toolMeta.source} via ${toolMeta.endpoint}).`;
    } else {
      answer = `Based on verified filings from ${toolMeta.source} (${toolMeta.endpoint}):\n` +
        `• Total Demand: ${data.totalDemand.toLocaleString()} vacancies recorded across ${data.uniqueSkillsCount} skills.\n` +
        (data.latestPeriod ? `• Latest Observation Period: ${data.latestPeriod}.\n` : '') +
        (data.topSkills?.length > 0
          ? `• Top Skills: ${data.topSkills.map((s: any) => `${s.skill} (${s.demand.toLocaleString()} vacancies)`).join(', ')}.\n`
          : '') +
        `\n(Notice: External AI model service encountered a temporary constraint; response was generated directly from verified database records).`;
    }
  } else if (toolName === 'getGaps') {
    if (data.totalAnalyzed === 0) {
      answer = `For this selection, data not available. No comparable skill gap filings are recorded in this jurisdiction. (Source: ${toolMeta.source}).`;
    } else {
      answer = `Based on labor market alignments from ${toolMeta.source} (${toolMeta.endpoint}):\n` +
        `• Comparable Skills Analyzed: ${data.comparableCount} (Shortages: ${data.shortageCount}, Oversupply: ${data.oversupplyCount}, Balanced: ${data.balancedCount}).\n` +
        (data.shortages?.length > 0
          ? `• Identified Shortages: ${data.shortages.map((s: any) => `${s.skill} (+${s.gap})`).join(', ')}.\n`
          : '• No critical shortages detected under current threshold parameters.\n') +
        `\n(Notice: External AI model service encountered a temporary constraint; response was generated directly from verified database records).`;
    }
  } else if (toolName === 'getForecast') {
    if (!data.isAvailable) {
      answer = `Forecast data not available: ${data.reason || 'Insufficient historical observations for statistical forecasting.'} (Source: ${toolMeta.source}).`;
    } else {
      answer = `Based on forward time-series projections from ${toolMeta.source} (${toolMeta.endpoint}):\n` +
        `• Model Used: ${data.modelUsed}${data.heldOutMAPE ? ` (Held-out MAPE: ${data.heldOutMAPE}%)` : ''}.\n` +
        `• Horizon: ${data.horizon}.\n` +
        (data.forecastData?.length > 0
          ? `• Projected Demand: ${data.forecastData.map((f: any) => `${f.period}: ${f.predictedDemand.toLocaleString()} vacancies [95% band: ${f.lowerBound} to ${f.upperBound}]`).join(', ')}.\n`
          : '') +
        `\n(Notice: External AI model service encountered a temporary constraint; response was generated directly from verified database records).`;
    }
  } else {
    answer = `Based on verified records from ${toolMeta.source} (${toolMeta.endpoint}): Current metrics are computed and traceable directly to verified application data.`;
  }

  return {
    answer,
    reply: answer,
    toolCalls: executedTools.map(t => ({
      name: t.name,
      params: t.args,
      endpoint: t.endpoint,
      source: t.source
    })),
    sources: Array.from(sourcesMap.entries()).map(([endpoint, source]) => ({ endpoint, source })),
    isFallback: true
  };
}

/**
 * Main Assistant Chat Entry Point.
 * Executes full Gemini function-calling loop with tool execution.
 */
export async function processAssistantChat(
  params: AssistantChatParams
): Promise<AssistantChatResult> {
  const { message } = params;
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('message string is required in request body.');
  }

  const ai = getAssistantGeminiClient();
  if (!ai) {
    // API key not configured -> safe deterministic fallback
    return executeDeterministicFallback(params);
  }

  // Inject user geographic context if provided
  let promptText = message;
  if (params.district || params.state || params.skill || params.sector || params.period) {
    const contextItems: string[] = [];
    if (params.state) contextItems.push(`Selected State: ${params.state}`);
    if (params.district) contextItems.push(`Selected District: ${params.district}`);
    if (params.skill) contextItems.push(`Selected Skill: ${params.skill}`);
    if (params.sector) contextItems.push(`Selected Sector: ${params.sector}`);
    if (params.period) contextItems.push(`Selected Period: ${params.period}`);
    promptText = `[Context: ${contextItems.join(', ')}]\nUser question: ${message}`;
  }

  const contents: any[] = [
    { role: 'user', parts: [{ text: promptText }] }
  ];

  const executedTools: ExecutedToolRecord[] = [];
  const sourcesMap = new Map<string, string>();

  // Model selection: Primary gemini-3.8-flash, with gemini-3.5-flash-lite on 503
  let modelToUse = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const MAX_TURNS = 5;
  let finalAnswer = '';

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      let response: any = null;

      try {
        response = await ai.models.generateContent({
          model: modelToUse,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: ASSISTANT_TOOL_DECLARATIONS }],
            temperature: 0.1
          }
        });
      } catch (genErr: any) {
        // If gemini-3.8-flash returns 503 UNAVAILABLE or DEADLINE_EXCEEDED, failover to gemini-3.5-flash-lite
        const errMsg = genErr?.message || '';
        if (modelToUse === 'gemini-3.8-flash' && (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('504') || errMsg.includes('DEADLINE'))) {
          modelToUse = 'gemini-3.5-flash-lite';
          response = await ai.models.generateContent({
            model: modelToUse,
            contents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: [{ functionDeclarations: ASSISTANT_TOOL_DECLARATIONS }],
              temperature: 0.1
            }
          });
        } else {
          throw genErr;
        }
      }

      const functionCalls = response.functionCalls;

      // If no more function calls, we have our final grounded response
      if (!functionCalls || functionCalls.length === 0) {
        finalAnswer = response.text || '';
        break;
      }

      // Add model's function-calling turn to history
      if (response.candidates?.[0]?.content) {
        contents.push(response.candidates[0].content);
      }

      // Execute each requested tool
      const functionResponseParts: any[] = [];

      for (const call of functionCalls) {
        const toolName = call.name;
        const toolArgs = call.args || {};

        let toolMeta: ToolSourceMetadata;
        try {
          toolMeta = await executeAssistantTool(toolName, toolArgs);
        } catch (toolErr: any) {
          toolMeta = {
            source: 'Error Handler',
            endpoint: `/api/${toolName}`,
            params: toolArgs,
            data: { error: toolErr?.message || 'Tool execution error', isAvailable: false }
          };
        }

        executedTools.push({
          name: toolName,
          args: toolArgs,
          endpoint: toolMeta.endpoint,
          source: toolMeta.source,
          result: toolMeta
        });
        sourcesMap.set(toolMeta.endpoint, toolMeta.source);

        functionResponseParts.push({
          functionResponse: {
            name: toolName,
            response: toolMeta
          }
        });
      }

      // Append user turn containing all executed tool responses
      contents.push({
        role: 'user',
        parts: functionResponseParts
      });
    }
  } catch (err: any) {
    // If Gemini fails completely, execute safe deterministic fallback without fabricating data
    return executeDeterministicFallback(params);
  }

  // Ensure answer is never empty
  if (!finalAnswer || finalAnswer.trim().length === 0) {
    if (executedTools.length > 0) {
      // Synthesize directly from executed tools if model returned empty text
      const lastTool = executedTools[executedTools.length - 1];
      if (lastTool.result.data?.isAvailable === false || lastTool.result.data?.totalDemand === 0) {
        finalAnswer = `data not available for the requested parameters. (Source: ${lastTool.source} via ${lastTool.endpoint}).`;
      } else {
        finalAnswer = `Retrieved verified data from ${lastTool.source} (${lastTool.endpoint}).`;
      }
    } else {
      finalAnswer = 'data not available for this selection.';
    }
  }

  return {
    answer: finalAnswer,
    reply: finalAnswer,
    toolCalls: executedTools.map(t => ({
      name: t.name,
      params: t.args,
      endpoint: t.endpoint,
      source: t.source
    })),
    sources: Array.from(sourcesMap.entries()).map(([endpoint, source]) => ({ endpoint, source })),
    isFallback: false
  };
}
