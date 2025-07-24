const { faker } = require("@faker-js/faker");
const { writeFile } = require("./output");
const { config } = require("./config");
const { EasterEggHelpers } = require("./easter_egg_helpers");
const { EasterEggPatterns } = require("./easter_egg_patterns");
const path = require("path");

class EasterEggGenerator {
  constructor() {
    this.patterns = [];
    this.appliedPatterns = [];
    this.dataAnalysis = {};
    this.minSampleSize = 5; // Minimum cases needed for a pattern to be statistically meaningful
    this.helpers = new EasterEggHelpers(this.minSampleSize);
    this.patternImplementations = new EasterEggPatterns(this);
    this.modifiedCases = new Set(); // Track cases that have been modified to prevent collisions
  }

  // Define possible easter egg patterns - easily extensible
  initializePatterns() {
    // Core patterns - always available
    this.patterns = [
      {
        name: "team_bottleneck",
        description: "One team has significantly longer case durations",
        probability: 0.3,
        apply: (cases, events) => this.patternImplementations.applyTeamBottleneck(cases, events)
      },
      {
        name: "priority_fast_track",
        description: "High priority cases skip certain steps and complete faster",
        probability: 0.25,
        apply: (cases, events) => this.patternImplementations.applyPriorityFastTrack(cases, events)
      },
      {
        name: "assignee_efficiency",
        description: "Specific assignee processes cases much faster than others",
        probability: 0.2,
        apply: (cases, events) => this.patternImplementations.applyAssigneeEfficiency(cases, events)
      },
      {
        name: "component_complexity",
        description: "Cases for certain components have more back-and-forth (bouncing)",
        probability: 0.25,
        apply: (cases, events) => this.patternImplementations.applyComponentComplexity(cases, events)
      },
      {
        name: "sequence_bottleneck",
        description: "Specific activity sequences (A->B) cause systematic delays",
        probability: 0.25,
        apply: (cases, events) => this.patternImplementations.applySequenceBottleneck(cases, events)
      },
      {
        name: "activity_duration_bottleneck",
        description: "Specific activities experience systematic duration delays",
        probability: 0.25,
        apply: (cases, events) => this.patternImplementations.applyActivityDurationBottleneck(cases, events)
      },
      {
        name: "rework_sequence",
        description: "Cases following rework patterns (Done->In Progress) take longer",
        probability: 0.18,
        apply: (cases, events) => this.patternImplementations.applyReworkSequence(cases, events)
      },
      {
        name: "customer_impact_escalation",
        description: "High customer impact cases get escalated and bypass normal queues",
        probability: 0.2,
        apply: (cases, events) => this.patternImplementations.applyCustomerImpactEscalation(cases, events)
      },
      {
        name: "sprint_boundary_delay",
        description: "Cases near sprint boundaries experience systematic delays",
        probability: 0.18,
        apply: (cases, events) => this.patternImplementations.applySprintBoundaryDelay(cases, events)
      },
      {
        name: "incident_correlation",
        description: "Incident-related cases follow different workflow patterns",
        probability: 0.22,
        apply: (cases, events) => this.patternImplementations.applyIncidentCorrelation(cases, events)
      },
      {
        name: "environment_dependency",
        description: "Production environment cases require additional approvals",
        probability: 0.19,
        apply: (cases, events) => this.patternImplementations.applyEnvironmentDependency(cases, events)
      },
      {
        name: "seasonal_workload",
        description: "Cases created in certain months experience different processing patterns",
        probability: 0.16,
        apply: (cases, events) => this.patternImplementations.applySeasonalWorkload(cases, events)
      },
      {
        name: "handoff_bottleneck",
        description: "Specific actor transitions create systematic delays",
        probability: 0.21,
        apply: (cases, events) => this.patternImplementations.applyHandoffBottleneck(cases, events)
      }
    ];

    // Add custom patterns if available
    this.addCustomPatterns();
  }

  // Extensible system for adding custom patterns
  addCustomPatterns() {
    // Check for custom pattern definitions in config or external files
    const customPatterns = this.loadCustomPatterns();

    if (customPatterns && customPatterns.length > 0) {
      console.log(`   📦 Loading ${customPatterns.length} custom pattern(s)`);
      this.patterns.push(...customPatterns);
    }
  }

  // Helper methods for collision prevention
  isCaseModified(caseId) {
    return this.modifiedCases.has(caseId);
  }

  markCaseAsModified(caseId) {
    this.modifiedCases.add(caseId);
  }

  filterUnmodifiedCases(caseIds) {
    return caseIds.filter(caseId => !this.modifiedCases.has(caseId));
  }

  // Load custom patterns from configuration or external files
  loadCustomPatterns() {
    const customPatterns = [];

    // Example: Time-based patterns that change based on current date/season
    if (new Date().getMonth() === 11) { // December
      customPatterns.push({
        name: "holiday_slowdown",
        description: "December cases experience delays due to holiday schedules",
        probability: 0.4,
        apply: (cases, events) => this.patternImplementations.applyHolidaySlowdown(cases, events)
      });
    }

    // Example: Workload-based patterns that adapt to dataset size
    if (config.NUMBER_OF_CASES > 100000) {
      customPatterns.push({
        name: "scale_bottleneck",
        description: "Large datasets experience different bottleneck patterns",
        probability: 0.3,
        apply: (cases, events) => this.patternImplementations.applyScaleBottleneck(cases, events)
      });
    }

    return customPatterns;
  }

  // Analyze the generated data to understand what patterns are feasible
  analyzeData(cases, events) {
    try {
      console.log(`\n📊 Analyzing ${cases.length} cases and ${events.length} events...`);

      this.dataAnalysis = {
        totalCases: cases.length,
        totalEvents: events.length,

        // Use streaming analysis for large datasets
        teams: this.helpers.analyzeAttributeStreaming(cases, 'Team'),
        assignees: this.helpers.analyzeAttributeStreaming(cases, 'Assignee'),
        priorities: this.helpers.analyzeAttributeStreaming(cases, 'Priority'),
        components: this.helpers.analyzeAttributeStreaming(cases, 'Component'),
        sprints: this.helpers.analyzeAttributeStreaming(cases, 'Sprint'),
        customerImpacts: this.helpers.analyzeAttributeStreaming(cases, 'CustomerImpact'),
        customerEnvironments: this.helpers.analyzeAttributeStreaming(cases, 'CustomerEnvironment'),
        incidents: this.helpers.analyzeAttributeStreaming(cases, 'Incident'),
        types: this.helpers.analyzeAttributeStreaming(cases, 'Type'),

        // Analyze event patterns with streaming
        actors: this.helpers.analyzeAttributeStreaming(events, 'Actor'),
        eventTypes: this.helpers.analyzeAttributeStreaming(events, 'EventType'),

        // Analyze temporal patterns with sampling for large datasets
        seasonalDistribution: this.helpers.analyzeSeasonalDistributionStreaming(events)
      };

      console.log(`   ✅ Analysis complete - Cases: ${this.dataAnalysis.totalCases}, Events: ${this.dataAnalysis.totalEvents}`);
      console.log(`   📈 Teams: ${this.dataAnalysis.teams.uniqueCount}, Assignees: ${this.dataAnalysis.assignees.uniqueCount}`);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.error(`❌ Error during data analysis: ${error.message}`);
      this.dataAnalysis = { totalCases: cases.length, totalEvents: events.length };
    }
  }

  // Intelligently select patterns based on data analysis
  selectPatternsForRun(cases, events) {
    this.analyzeData(cases, events);
    this.appliedPatterns = [];
    const feasiblePatterns = [];

    // Check each pattern for feasibility
    for (const pattern of this.patterns) {
      const feasibility = this.checkPatternFeasibility(pattern.name, cases, events);
      if (feasibility.feasible) {
        feasiblePatterns.push({
          ...pattern,
          feasibilityScore: feasibility.score,
          reason: feasibility.reason
        });
      } else {
        console.log(`   ⚠️  Skipping ${pattern.name}: ${feasibility.reason}`);
      }
    }

    if (feasiblePatterns.length === 0) {
      console.log(`   ❌ No patterns are feasible with current data distribution`);
      return;
    }

    // Select up to 5 of the most feasible patterns
    const maxPatternsToSelect = 5;

    // Sort patterns by feasibility score (highest first) and then by probability
    const sortedPatterns = feasiblePatterns.sort((a, b) => {
      // Primary sort: feasibility score (higher is better)
      if (b.feasibilityScore !== a.feasibilityScore) {
        return b.feasibilityScore - a.feasibilityScore;
      }
      // Secondary sort: probability (higher is better)
      return b.probability - a.probability;
    });

    // Select up to maxPatternsToSelect patterns
    this.appliedPatterns = sortedPatterns.slice(0, Math.min(maxPatternsToSelect, sortedPatterns.length));

    console.log(`   ✅ Selected ${this.appliedPatterns.length} feasible pattern(s)`);
  }

  // Check if a pattern is feasible with current data
  checkPatternFeasibility(patternName, cases, events) {
    switch (patternName) {
      case 'team_bottleneck':
        if (this.dataAnalysis.teams.uniqueCount < 2) {
          return { feasible: false, reason: 'Need at least 2 teams' };
        }
        if (this.dataAnalysis.teams.smallestGroup < this.minSampleSize) {
          return { feasible: false, reason: `Smallest team has only ${this.dataAnalysis.teams.smallestGroup} cases (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.teams.smallestGroup / (this.minSampleSize * 2)),
          reason: `${this.dataAnalysis.teams.uniqueCount} teams available`
        };

      case 'priority_fast_track':
        const highPriorityCases = (this.dataAnalysis.priorities.distribution['High'] || 0) +
          (this.dataAnalysis.priorities.distribution['Critical'] || 0);
        if (highPriorityCases < this.minSampleSize) {
          return { feasible: false, reason: `Only ${highPriorityCases} high priority cases (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, highPriorityCases / (this.minSampleSize * 3)),
          reason: `${highPriorityCases} high priority cases available`
        };

      case 'assignee_efficiency':
        if (this.dataAnalysis.assignees.uniqueCount < 3) {
          return { feasible: false, reason: 'Need at least 3 assignees' };
        }
        if (this.dataAnalysis.assignees.smallestGroup < this.minSampleSize) {
          return { feasible: false, reason: `Smallest assignee group has only ${this.dataAnalysis.assignees.smallestGroup} cases` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.assignees.smallestGroup / (this.minSampleSize * 2)),
          reason: `${this.dataAnalysis.assignees.uniqueCount} assignees available`
        };

      case 'component_complexity':
        if (this.dataAnalysis.components.uniqueCount < 2) {
          return { feasible: false, reason: 'Need at least 2 components' };
        }
        if (this.dataAnalysis.components.smallestGroup < this.minSampleSize) {
          return { feasible: false, reason: `Smallest component group has only ${this.dataAnalysis.components.smallestGroup} cases` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.components.smallestGroup / (this.minSampleSize * 2)),
          reason: `${this.dataAnalysis.components.uniqueCount} components available`
        };

      case 'sequence_bottleneck':
        if (this.dataAnalysis.eventTypes.uniqueCount < 3) {
          return { feasible: false, reason: 'Need at least 3 different event types for sequences' };
        }
        if (this.dataAnalysis.totalEvents < this.minSampleSize * 10) {
          return { feasible: false, reason: `Need more events for sequence analysis (have ${this.dataAnalysis.totalEvents})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.eventTypes.uniqueCount / 8),
          reason: `${this.dataAnalysis.eventTypes.uniqueCount} event types available for sequence analysis`
        };

      case 'activity_duration_bottleneck':
        if (this.dataAnalysis.eventTypes.uniqueCount < 3) {
          return { feasible: false, reason: 'Need at least 3 different event types for activity analysis' };
        }
        // Check if we have common bottleneck activities (QE Review, PO Review, etc.)
        const commonBottleneckActivities = [11, 13, 14, 4, 5]; // Under Code Review, PO Review, QE Review, Bounced, Blocked
        const eventTypeIds = events.map(e => parseInt(e.EventType));
        const availableBottleneckActivities = commonBottleneckActivities.filter(id => eventTypeIds.includes(id));
        
        if (availableBottleneckActivities.length === 0) {
          return { feasible: false, reason: 'No common bottleneck activities found in data' };
        }
        
        return {
          feasible: true,
          score: Math.min(1.0, availableBottleneckActivities.length / 3),
          reason: `${availableBottleneckActivities.length} bottleneck activities available for analysis`
        };

      case 'rework_sequence':
        if (this.dataAnalysis.eventTypes.uniqueCount < 2) {
          return { feasible: false, reason: 'Need at least 2 event types for rework detection' };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.totalEvents / (this.minSampleSize * 20)),
          reason: `${this.dataAnalysis.totalEvents} events available for rework pattern analysis`
        };

      case 'customer_impact_escalation':
        const highImpactCases = (this.dataAnalysis.customerImpacts.distribution['High'] || 0) +
          (this.dataAnalysis.customerImpacts.distribution['Critical'] || 0);
        if (highImpactCases < this.minSampleSize) {
          return { feasible: false, reason: `Only ${highImpactCases} high customer impact cases (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, highImpactCases / (this.minSampleSize * 2)),
          reason: `${highImpactCases} high customer impact cases available`
        };

      case 'sprint_boundary_delay':
        if (this.dataAnalysis.sprints.uniqueCount === 0) {
          return { feasible: false, reason: 'No sprint information available' };
        }
        if (this.dataAnalysis.sprints.smallestGroup < this.minSampleSize) {
          return { feasible: false, reason: `Smallest sprint has only ${this.dataAnalysis.sprints.smallestGroup} cases` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.sprints.smallestGroup / (this.minSampleSize * 2)),
          reason: `${this.dataAnalysis.sprints.uniqueCount} sprints available`
        };

      case 'incident_correlation':
        const incidentCases = (this.dataAnalysis.incidents.distribution['Yes'] || 0) +
          (this.dataAnalysis.types.distribution['Incident'] || 0);
        if (incidentCases < this.minSampleSize) {
          return { feasible: false, reason: `Only ${incidentCases} incident cases (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, incidentCases / (this.minSampleSize * 2)),
          reason: `${incidentCases} incident cases available`
        };

      case 'environment_dependency':
        const prodCases = (this.dataAnalysis.customerEnvironments.distribution['Production'] || 0) +
          (this.dataAnalysis.customerEnvironments.distribution['Prod'] || 0);
        if (prodCases < this.minSampleSize) {
          return { feasible: false, reason: `Only ${prodCases} production cases (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, prodCases / (this.minSampleSize * 2)),
          reason: `${prodCases} production cases available`
        };

      case 'seasonal_workload':
        if (!this.dataAnalysis.seasonalDistribution.hasSeasonalSubmissions) {
          return { feasible: false, reason: `Only ${this.dataAnalysis.seasonalDistribution.seasonalSubmissions} seasonal submissions (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.seasonalDistribution.seasonalSubmissions / (this.minSampleSize * 2)),
          reason: `${this.dataAnalysis.seasonalDistribution.seasonalSubmissions} seasonal submissions available`
        };

      case 'handoff_bottleneck':
        if (this.dataAnalysis.actors.uniqueCount < 3) {
          return { feasible: false, reason: 'Need at least 3 actors' };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.actors.uniqueCount / 10),
          reason: `${this.dataAnalysis.actors.uniqueCount} actors available`
        };

      default:
        return { feasible: false, reason: 'Unknown pattern' };
    }
  }

  // Apply all selected patterns to the data - optimized for large datasets
  applyPatterns(cases, events) {
    if (this.appliedPatterns.length === 0) {
      console.log(`\n❌ No easter egg patterns applied - insufficient data diversity`);
      return;
    }

    // Reset modified cases tracking for this run
    this.modifiedCases.clear();

    const patternsToApply = this.appliedPatterns;

    console.log(`\n🎯 Applying ${patternsToApply.length} data-validated easter egg pattern(s)...`);

    if (cases.length > 1000000) {
      console.log(`   ⚡ Large dataset (${cases.length} cases) - applying ${patternsToApply.length} patterns with memory optimization`);
    }

    for (const pattern of patternsToApply) {
      console.log(`   🥚 Applying: ${pattern.name} (feasibility: ${(pattern.feasibilityScore * 100).toFixed(0)}%)`);

      // Force garbage collection before each pattern for large datasets
      if (cases.length > 500000 && global.gc) {
        global.gc();
      }

      pattern.apply(cases, events);
    }

    // Final garbage collection
    if (cases.length > 500000 && global.gc) {
      global.gc();
    }

    console.log(`   📊 Pattern collision prevention: ${this.modifiedCases.size} cases modified (${(this.modifiedCases.size / cases.length * 100).toFixed(1)}% of dataset)`);
  }

  // Helper to store findings
  addFinding(finding) {
    if (!this.findings) this.findings = [];
    this.findings.push(finding);
  }

  // Generate the easter eggs documentation file
  async generateEasterEggsFile() {
    if (!this.findings || this.findings.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const content = this.generateEasterEggsContent();
    const relativePath = `out/easter_eggs/hidden_patterns_${timestamp}.txt`;

    await writeFile(relativePath, content);

    // Show absolute path from root
    const absolutePath = path.resolve(relativePath);
    console.log(`\n🥚 Easter eggs documented in: ${absolutePath}`);
  }

  generateEasterEggsContent() {
    let content = `HIDDEN PATTERNS IN GENERATED DATA
Generated on: ${new Date().toISOString()}
Dataset size: ${config.NUMBER_OF_CASES} cases

This file documents the intentional patterns injected into the mock data for testing your process mining engine.
Your process mining tool should be able to detect these patterns automatically.

===========================================
SUMMARY OF INJECTED PATTERNS
===========================================

`;

    this.findings.forEach((finding, index) => {
      content += `${index + 1}. ${finding.pattern}\n`;
      content += `   ${finding.description}\n\n`;
    });

    content += `
===========================================
DETAILED EXPECTED FINDINGS
===========================================

`;

    this.findings.forEach((finding, index) => {
      content += `PATTERN ${index + 1}: ${finding.pattern.toUpperCase()}\n`;
      content += `${'='.repeat(finding.pattern.length + 12)}\n\n`;
      content += `Description: ${finding.description}\n\n`;
      content += `Your process mining engine should detect:\n`;
      finding.expectedFindings.forEach(expected => {
        content += `  • ${expected}\n`;
      });
      content += `\n`;
    });

    content += `
===========================================
TESTING CHECKLIST
===========================================

Use this checklist to verify your process mining engine:

`;

    this.findings.forEach((finding, index) => {
      content += `□ Pattern ${index + 1} (${finding.pattern}):\n`;
      finding.expectedFindings.forEach(expected => {
        content += `  □ ${expected}\n`;
      });
      content += `\n`;
    });

    content += `
===========================================
NOTES FOR TESTING
===========================================

1. These patterns are randomly selected each run - not all patterns appear in every dataset
2. Pattern strength varies (multipliers, probabilities) to test sensitivity
3. Some patterns may interact with each other, creating compound effects
4. If your process mining tool misses these patterns, investigate:
   - Data preprocessing steps
   - Statistical significance thresholds
   - Filtering criteria
   - Analysis time windows

Happy process mining! 🔍
`;

    return content;
  }
}

module.exports = { EasterEggGenerator };