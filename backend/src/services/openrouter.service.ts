import axios, { AxiosInstance } from "axios";
import { appConfig } from "../config/app";
import {
  AIActionSuggestion,
  AICheckInSummary,
  EffortLevel,
  GoalStatus,
} from "../types";

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
      refusal?: string;
    };
    index: number;
  }[];
  provider: string;
  model: string;
  object: string;
  created: number;
}

export class OpenRouterService {
  private readonly httpClient: AxiosInstance;
  private readonly defaultModel: string;

  constructor() {
    const { apiKey, baseUrl, model } = appConfig.openrouter;

    this.defaultModel = model;

    if (apiKey) {
      this.httpClient = axios.create({
        baseURL: baseUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      });
    } else {
      this.httpClient = null as any;
    }
  }

  async generateActionSuggestions(
    goalTitle: string,
    goalDescription: string,
    targetValue: number,
    currentValue: number,
    unit: string,
    recentUpdates: Array<{
      new_value: number;
      previous_value: number;
      notes: string;
      created_at: Date;
    }>
  ): Promise<AIActionSuggestion[]> {
    try {
      const systemPrompt = `You are an expert goal achievement coach. Your role is to analyze a user's goal progress and provide specific, actionable suggestions to help them reach their target.

GUIDELINES:
- Provide 3-5 specific, actionable suggestions
- Consider the current progress and recent updates
- Be encouraging but realistic
- Focus on concrete steps the user can take
- Return suggestions as a JSON object following the provided JSON schema strictly

Each suggestion must include:
- title: Specific, actionable step
- rationale: A short explanation of why this step helps
- effort: One of "S", "M", "L" representing small, medium, large effort`;

      const userPrompt = `Goal: ${goalTitle}
Description: ${goalDescription}
Target: ${targetValue} ${unit}
Current Progress: ${currentValue} ${unit}
Progress Percentage: ${Math.round((currentValue / targetValue) * 100)} ${unit}

Recent Updates:
${recentUpdates
  .map(
    (update) =>
      `- ${update.created_at.toDateString()}: ${update.previous_value} → ${
        update.new_value
      } ${unit} ${update.notes ? ` (${update.notes})` : ""}`
  )
  .join("\n")}

Please provide specific action suggestions to help achieve this goal as per the JSON schema.`;

      const content = await this.callOpenRouter(userPrompt, systemPrompt, {
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "action_suggestions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  description: "Array of 3-5 action suggestions",
                  minItems: 3,
                  maxItems: 5,
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      rationale: { type: "string" },
                      effort: { type: "string", enum: ["S", "M", "L"] },
                    },
                    required: ["title", "rationale", "effort"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["suggestions"],
              additionalProperties: false,
            },
          },
        },
      });

      const parsed = JSON.parse(content) as {
        suggestions: AIActionSuggestion[];
      };

      console.log(
        "Generated suggestions:",
        JSON.stringify(parsed.suggestions, null, 2)
      );
      return parsed.suggestions;
    } catch (error) {
      console.error("Error generating action suggestions:", error);
      return this.getFallbackActionSuggestions();
    }
  }

  async generateCheckinSummary(
    goalTitle: string,
    goalDescription: string,
    targetValue: number,
    currentValue: number,
    unit: string,
    lastUpdate?: {
      new_value: number;
      previous_value: number;
      notes: string;
      created_at: Date;
    }
  ): Promise<AICheckInSummary> {
    try {
      const systemPrompt = `You are an expert goal tracking analyst. Your role is to provide insightful, encouraging summaries of goal progress based on recent check-ins.

GUIDELINES:
- Analyze the progress made since the last update
- Highlight achievements and positive momentum
- Provide context about the overall goal progress
- Be encouraging and motivational
- Keep the summary concise but meaningful
- Focus on the journey and progress, not just numbers

Return a JSON object strictly following the provided JSON schema.`;

      const progressPercentage = Math.round((currentValue / targetValue) * 100);
      const delta = lastUpdate ? currentValue - lastUpdate.previous_value : 0;

      const userPrompt = `Goal: ${goalTitle}
Description: ${goalDescription}
Target: ${targetValue} ${unit}
Current Progress: ${currentValue} ${unit} (${progressPercentage} ${unit})

${
  lastUpdate
    ? `Latest Update:\n- Date: ${lastUpdate.created_at.toDateString()}\n- Progress: ${
        lastUpdate.previous_value
      } → ${
        lastUpdate.new_value
      } ${unit}\n- Change: +${delta} ${unit}\n- Notes: ${
        lastUpdate.notes || "No notes provided"
      }`
    : "This is the initial check-in for this goal."
}

Please provide an encouraging summary of the progress made.`;

      const content = await this.callOpenRouter(userPrompt, systemPrompt, {
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "checkin_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                bullets: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key summary points",
                  minItems: 3,
                  maxItems: 5,
                },
                confidence: {
                  type: "integer",
                  minimum: 1,
                  maximum: 5,
                  description: "Confidence level from 1 (low) to 5 (high)",
                },
                risk_tag: {
                  type: "string",
                  enum: ["on_track", "at_risk", "off_track"],
                  description: "Risk assessment tag",
                },
              },
              required: ["bullets", "confidence", "risk_tag"],
              additionalProperties: false,
            },
          },
        },
      });

      const parsed = JSON.parse(content) as AICheckInSummary;
      return parsed;
    } catch (error) {
      console.error("Error generating check-in summary:", error);
      return this.getFallbackCheckinSummary();
    }
  }

  private async callOpenRouter(
    userPrompt: string,
    systemPrompt: string,
    options?: Record<string, unknown>,
    model?: string
  ): Promise<string> {
    if (!this.httpClient) {
      throw new Error("OpenRouter API key not configured");
    }

    try {
      const response = await this.httpClient.post<OpenRouterResponse>(
        "/api/v1/chat/completions",
        {
          model: model || this.defaultModel,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          ...options,
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenRouter");
      }

      return content;
    } catch (error: any) {
      console.error("Error calling OpenRouter:", {
        errorMessage: error.response?.data?.message || error.message,
      });
      throw new Error(`Failed to call OpenRouter: ${error.message}`);
    }
  }

  private getFallbackActionSuggestions(): AIActionSuggestion[] {
    return [
      {
        title: "Break down your goal into smaller, daily milestones",
        rationale: "Smaller steps make progress more manageable",
        effort: EffortLevel.MEDIUM,
      },
      {
        title: "Set up a regular check-in schedule to track your progress",
        rationale: "Consistent tracking improves momentum",
        effort: EffortLevel.SMALL,
      },
      {
        title: "Identify and remove obstacles that might be slowing you down",
        rationale: "Addressing blockers accelerates progress",
        effort: EffortLevel.LARGE,
      },
    ];
  }

  private getFallbackCheckinSummary(): AICheckInSummary {
    return {
      bullets: [
        "Made steady progress on key milestones",
        "Momentum is building—keep going",
        "Focus on consistency to sustain improvement",
      ],
      confidence: 4,
      risk_tag: GoalStatus.ON_TRACK,
    };
  }
}
