/**
 * ============================================================================
 * SKILLPULSE ASSISTANT TOOLS SPECIFICATION & CANONICAL EXECUTOR
 * ============================================================================
 * Phase 4A: Structured Gemini Function/Tool Calling
 *
 * Tools Registered:
 * 1. getGaps: Labor market skill gap analysis (shortages, balanced, oversupply)
 * 2. getForecast: Statistical & ML demand forecasts with 95% bands & held-out MAPE
 * 3. simulate: What-If vocational training capacity intervention simulation
 * 4. getPriority: Multi-criteria composite skill & district priority rankings
 * 5. getDemand: Verified employer vacancy demand counts & quarterly filings
 * ============================================================================
 */

import { FunctionDeclaration, Type } from '@google/genai';
import { DEMAND_RECORDS } from '../data/demandData';
import {
  calculateSkillGaps,
  forecastSkillDemand,
  simulateCapacityChange,
  calculateSkillPriorities,
  DEFAULT_THRESHOLDS,
  DEFAULT_PRIORITY_WEIGHTS
} from '../utils/analyticsEngine';
import {
  filterByCanonicalGeography,
  matchesCanonicalGeography,
  resolveCanonicalState,
  resolveCanonicalDistrict
} from '../utils/canonicalGeography';

export interface ToolSourceMetadata {
  source: string;
  endpoint: string;
  params: Record<string, any>;
  data: any;
}

export interface ExecutedToolRecord {
  name: string;
  args: Record<string, any>;
  endpoint: string;
  source: string;
  result: ToolSourceMetadata;
}

/**
 * Strict JSON schemas for the five permitted Gemini tools.
 */
export const ASSISTANT_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'getGaps',
    description: 'Retrieve labor market skill gap analysis, identifying shortages, balanced skills, or surpluses based on verified employer vacancy demand and registered worker supply across covered states and districts.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        state: {
          type: Type.STRING,
          description: 'State name (e.g. "Telangana", "Maharashtra", "Karnataka").'
        },
        district: {
          type: Type.STRING,
          description: 'District name (e.g. "Hyderabad", "Pune", "Bengaluru Urban").'
        },
        sector: {
          type: Type.STRING,
          description: 'Industry sector name (e.g. "IT-ITeS & Software", "Automotive & EV").'
        },
        skill: {
          type: Type.STRING,
          description: 'Normalized skill name (e.g. "Python Development", "CNC Machining").'
        },
        period: {
          type: Type.STRING,
          description: 'Quarterly observation period (e.g. "2024-Q3", "2024-Q4").'
        }
      }
    }
  },
  {
    name: 'getForecast',
    description: 'Retrieve statistical time-series and machine learning demand forecasts (Holt-Winters or LightGBM) with 95% empirical prediction bands and held-out MAPE validation metrics for a specific skill in a district.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        skill: {
          type: Type.STRING,
          description: 'Normalized skill name (e.g. "Python Development").'
        },
        state: {
          type: Type.STRING,
          description: 'State name (e.g. "Telangana").'
        },
        district: {
          type: Type.STRING,
          description: 'District name (e.g. "Hyderabad").'
        },
        horizon: {
          type: Type.INTEGER,
          description: 'Forecast horizon in quarters (e.g. 2 for 6 months, 4 for 1 year, 6 for 1.5 years). Default is 4.'
        }
      },
      required: ['skill', 'state', 'district']
    }
  },
  {
    name: 'simulate',
    description: 'Run What-If scenario simulation to calculate the impact of adding vocational training capacity on closing the labor market gap for a specific skill and district.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        skill: {
          type: Type.STRING,
          description: 'Normalized skill name (e.g. "Solar PV Installation").'
        },
        state: {
          type: Type.STRING,
          description: 'State name (e.g. "Maharashtra").'
        },
        district: {
          type: Type.STRING,
          description: 'District name (e.g. "Pune").'
        },
        additionalCapacity: {
          type: Type.NUMBER,
          description: 'Number of additional annual trainee seats to simulate adding (e.g. 50, 100, 200).'
        }
      },
      required: ['skill', 'state', 'district', 'additionalCapacity']
    }
  },
  {
    name: 'getPriority',
    description: 'Retrieve composite district and skill priority ranking scores and classification tiers calculated by multi-criteria weighting.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        state: {
          type: Type.STRING,
          description: 'State name (e.g. "Telangana").'
        },
        district: {
          type: Type.STRING,
          description: 'District name (e.g. "Hyderabad").'
        },
        period: {
          type: Type.STRING,
          description: 'Evaluation quarter period (e.g. "2024-Q3").'
        }
      }
    }
  },
  {
    name: 'getDemand',
    description: 'Retrieve verified employer vacancy demand metrics, job postings counts, top skills, job roles, and quarterly vacancy trends from official National Career Service filings.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        state: {
          type: Type.STRING,
          description: 'State name (e.g. "Telangana", "Maharashtra").'
        },
        district: {
          type: Type.STRING,
          description: 'District name (e.g. "Hyderabad", "Pune").'
        },
        sector: {
          type: Type.STRING,
          description: 'Industry sector (e.g. "IT-ITeS & Software").'
        },
        skill: {
          type: Type.STRING,
          description: 'Skill name (e.g. "Python Development").'
        },
        period: {
          type: Type.STRING,
          description: 'Quarterly period (e.g. "2024-Q3", "2024-Q4").'
        }
      }
    }
  }
];

export const ALLOWED_TOOL_NAMES = new Set([
  'getGaps',
  'getForecast',
  'simulate',
  'getPriority',
  'getDemand'
]);

/**
 * Executes canonical forecast logic matching /api/forecast:
 * 1. Minimum 4 quarters check (returns isAvailable=false if < 4)
 * 2. Attempts Python ML service on port 8001
 * 3. Falls back to OLS baseline if unreachable
 */
export async function executeCanonicalForecast(
  skill: string,
  state: string,
  district: string,
  horizon: number = 4
): Promise<any> {
  const records = DEMAND_RECORDS.filter(
    d => d.normalizedSkill.toLowerCase() === skill.toLowerCase() &&
         matchesCanonicalGeography(d, { state, district })
  ).sort((a, b) => a.period.localeCompare(b.period));

  const n = records.length;
  if (n < 4) {
    return {
      isAvailable: false,
      reason: `Not enough comparable historical demand data is available for this skill and location. Found ${n} observation(s), but statistical time-series forecasting requires a minimum of 4 chronological quarters.`,
      historicalQuarters: n,
      forecastData: []
    };
  }

  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';
  let mlResult: any = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const mlRes = await fetch(`${mlServiceUrl}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        series: records.map(r => ({ period: r.period, value: r.demandCount })),
        horizon
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (mlRes.ok) {
      mlResult = await mlRes.json();
    }
  } catch {
    // Graceful fallback to OLS
  }

  if (mlResult && mlResult.isAvailable) {
    return {
      isAvailable: true,
      modelUsed: mlResult.model,
      heldOutMAPE: mlResult.heldOutMAPE,
      horizon: `${horizon} Quarters`,
      forecastData: mlResult.forecast.map((pt: any, idx: number) => ({
        period: pt.period,
        predictedDemand: Math.round(pt.value),
        lowerBound: Math.round(mlResult.lower95[idx]),
        upperBound: Math.round(mlResult.upper95[idx])
      })),
      validation: mlResult.validation
    };
  }

  // OLS Fallback
  const ols = forecastSkillDemand(skill, state, district, horizon);
  return {
    isAvailable: ols.isAvailable,
    modelUsed: 'OLS (Fallback)',
    horizon: ols.horizon,
    forecastData: ols.forecastData,
    reason: ols.reason,
    validation: { fallback: true, reason: 'Python ML service unavailable. Executed OLS linear baseline.' }
  };
}

/**
 * Canonical tool execution dispatcher with security whitelist validation.
 */
export async function executeAssistantTool(
  toolName: string,
  args: Record<string, any> = {}
): Promise<ToolSourceMetadata> {
  // Security rule: Only permitted tools may execute
  if (!ALLOWED_TOOL_NAMES.has(toolName)) {
    throw new Error(
      `Unknown tool rejected: "${toolName}". Only getGaps, getForecast, simulate, getPriority, getDemand are permitted.`
    );
  }

  const sanitizedArgs: Record<string, any> = {};
  for (const [k, v] of Object.entries(args)) {
    if (v !== undefined && v !== null && v !== '') {
      sanitizedArgs[k] = v;
    }
  }

  switch (toolName) {
    case 'getDemand': {
      const records = filterByCanonicalGeography(DEMAND_RECORDS, {
        state: sanitizedArgs.state,
        district: sanitizedArgs.district
      }).filter(d => {
        if (sanitizedArgs.sector && d.sector.toLowerCase() !== sanitizedArgs.sector.toLowerCase()) return false;
        if (sanitizedArgs.skill && d.normalizedSkill.toLowerCase() !== sanitizedArgs.skill.toLowerCase()) return false;
        if (sanitizedArgs.period && d.period !== sanitizedArgs.period) return false;
        return true;
      });

      const totalDemand = records.reduce((s, d) => s + d.demandCount, 0);
      const uniqueSkills = Array.from(new Set(records.map(d => d.normalizedSkill)));
      const topSkillsMap: Record<string, number> = {};
      records.forEach(d => {
        topSkillsMap[d.normalizedSkill] = (topSkillsMap[d.normalizedSkill] || 0) + d.demandCount;
      });
      const topSkills = Object.entries(topSkillsMap)
        .map(([skill, demand]) => ({ skill, demand }))
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 10);

      const periods = Array.from(new Set(records.map(d => d.period))).sort();

      return {
        source: 'National Career Service (NCS)',
        endpoint: '/api/demand',
        params: sanitizedArgs,
        data: {
          totalDemand,
          recordCount: records.length,
          uniqueSkillsCount: uniqueSkills.length,
          periods,
          latestPeriod: periods.length > 0 ? periods[periods.length - 1] : null,
          topSkills,
          records: records.slice(0, 20).map(r => ({
            skill: r.normalizedSkill,
            district: r.district,
            state: r.state,
            period: r.period,
            demand: r.demandCount,
            sector: r.sector,
            jobRole: r.jobRole
          }))
        }
      };
    }

    case 'getGaps': {
      const gaps = calculateSkillGaps({
        state: sanitizedArgs.state,
        district: sanitizedArgs.district,
        sector: sanitizedArgs.sector,
        skill: sanitizedArgs.skill,
        period: sanitizedArgs.period
      }, DEFAULT_THRESHOLDS);

      const shortages = gaps.filter(g => g.isComparable && g.classification === 'SHORTAGE');
      const oversupply = gaps.filter(g => g.isComparable && g.classification === 'OVERSUPPLY');
      const balanced = gaps.filter(g => g.isComparable && g.classification === 'BALANCED');
      const nonComparable = gaps.filter(g => !g.isComparable);

      return {
        source: 'NCS & e-Shram',
        endpoint: '/api/gaps',
        params: sanitizedArgs,
        data: {
          totalAnalyzed: gaps.length,
          comparableCount: gaps.length - nonComparable.length,
          shortageCount: shortages.length,
          oversupplyCount: oversupply.length,
          balancedCount: balanced.length,
          nonComparableCount: nonComparable.length,
          shortages: shortages.slice(0, 15).map(s => ({
            skill: s.normalizedSkill,
            district: s.district,
            state: s.state,
            sector: s.sector,
            demand: s.demand,
            effectiveSupply: s.effectiveSupply,
            gap: s.gap,
            gapPercentage: s.gapPercentage,
            classification: s.classification
          })),
          gaps: gaps.slice(0, 20).map(g => ({
            skill: g.normalizedSkill,
            district: g.district,
            state: g.state,
            sector: g.sector,
            demand: g.demand,
            effectiveSupply: g.effectiveSupply,
            gap: g.gap,
            gapPercentage: g.gapPercentage,
            classification: g.classification,
            isComparable: g.isComparable
          }))
        }
      };
    }

    case 'getForecast': {
      const skill = sanitizedArgs.skill || '';
      const state = sanitizedArgs.state || '';
      const district = sanitizedArgs.district || '';
      const horizon = sanitizedArgs.horizon ? Number(sanitizedArgs.horizon) : 4;

      if (!skill || !state || !district) {
        return {
          source: 'NCS Vacancy Filings & ML Forecaster',
          endpoint: '/api/forecast',
          params: sanitizedArgs,
          data: {
            isAvailable: false,
            reason: 'skill, state, and district parameters are required for demand forecasting.',
            forecastData: []
          }
        };
      }

      const forecast = await executeCanonicalForecast(skill, state, district, horizon);

      return {
        source: 'NCS Vacancy Filings & ML Forecaster',
        endpoint: '/api/forecast',
        params: sanitizedArgs,
        data: forecast
      };
    }

    case 'simulate': {
      const skill = sanitizedArgs.skill || '';
      const state = sanitizedArgs.state || '';
      const district = sanitizedArgs.district || '';
      const additionalCapacity = Number(sanitizedArgs.additionalCapacity ?? 0);

      if (!skill || !state || !district || isNaN(additionalCapacity)) {
        return {
          source: 'SkillPulse What-If Engine (MSDE & NCS)',
          endpoint: '/api/simulate',
          params: sanitizedArgs,
          data: {
            isAvailable: false,
            reason: 'skill, state, district, and numerical additionalCapacity are required for simulation.'
          }
        };
      }

      const sim = simulateCapacityChange(skill, state, district, additionalCapacity);

      return {
        source: 'SkillPulse What-If Engine (MSDE & NCS)',
        endpoint: '/api/simulate',
        params: sanitizedArgs,
        data: {
          ...sim,
          baselineGap: sim.currentGap,
          newGap: sim.newEstimatedGap
        }
      };
    }

    case 'getPriority': {
      const state = sanitizedArgs.state;
      const district = sanitizedArgs.district;
      const period = sanitizedArgs.period;

      const rankings = calculateSkillPriorities(state, district, DEFAULT_PRIORITY_WEIGHTS, period);

      return {
        source: 'SkillPulse Priority Scoring Engine',
        endpoint: '/api/priority',
        params: sanitizedArgs,
        data: {
          totalRanked: rankings.length,
          topPriorities: rankings.slice(0, 10).map(r => ({
            rank: r.rank,
            skill: r.normalizedSkill,
            sector: r.sector,
            district: r.district,
            state: r.state,
            compositeScore: r.compositeScore,
            classification: r.classification,
            priorityReason: r.priorityReason,
            demandScore: r.demandScore,
            gapScore: r.gapScore
          }))
        }
      };
    }

    default:
      throw new Error(`Unhandled tool: "${toolName}"`);
  }
}
