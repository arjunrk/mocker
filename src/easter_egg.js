const { faker } = require("@faker-js/faker");
const { writeFile } = require("./output");
const { config } = require("./config");
const path = require("path");

class EasterEggGenerator {
  constructor() {
    this.patterns = [];
    this.appliedPatterns = [];
    this.dataAnalysis = {};
    this.minSampleSize = 5; // Minimum cases needed for a pattern to be statistically meaningful
  }

  // Define possible easter egg patterns - easily extensible
  initializePatterns() {
    // Core patterns - always available
    this.patterns = [
      {
        name: "team_bottleneck",
        description: "One team has significantly longer case durations",
        probability: 0.3,
        apply: (cases, events) => this.applyTeamBottleneck(cases, events)
      },
      {
        name: "priority_fast_track",
        description: "High priority cases skip certain steps and complete faster",
        probability: 0.25,
        apply: (cases, events) => this.applyPriorityFastTrack(cases, events)
      },
      {
        name: "assignee_efficiency",
        description: "Specific assignee processes cases much faster than others",
        probability: 0.2,
        apply: (cases, events) => this.applyAssigneeEfficiency(cases, events)
      },
      {
        name: "component_complexity",
        description: "Cases for certain components have more back-and-forth (bouncing)",
        probability: 0.25,
        apply: (cases, events) => this.applyComponentComplexity(cases, events)
      },
      {
        name: "friday_effect",
        description: "Cases submitted on Fridays take longer to start progress",
        probability: 0.15,
        apply: (cases, events) => this.applyFridayEffect(cases, events)
      },
      {
        name: "story_points_correlation",
        description: "Higher story points correlate with specific workflow patterns",
        probability: 0.2,
        apply: (cases, events) => this.applyStoryPointsCorrelation(cases, events)
      },
      {
        name: "customer_impact_escalation",
        description: "High customer impact cases get escalated and bypass normal queues",
        probability: 0.2,
        apply: (cases, events) => this.applyCustomerImpactEscalation(cases, events)
      },
      {
        name: "sprint_boundary_delay",
        description: "Cases near sprint boundaries experience systematic delays",
        probability: 0.18,
        apply: (cases, events) => this.applySprintBoundaryDelay(cases, events)
      },
      {
        name: "incident_correlation",
        description: "Incident-related cases follow different workflow patterns",
        probability: 0.22,
        apply: (cases, events) => this.applyIncidentCorrelation(cases, events)
      },
      {
        name: "environment_dependency",
        description: "Production environment cases require additional approvals",
        probability: 0.19,
        apply: (cases, events) => this.applyEnvironmentDependency(cases, events)
      },
      {
        name: "seasonal_workload",
        description: "Cases created in certain months experience different processing patterns",
        probability: 0.16,
        apply: (cases, events) => this.applySeasonalWorkload(cases, events)
      },
      {
        name: "handoff_bottleneck",
        description: "Specific actor transitions create systematic delays",
        probability: 0.21,
        apply: (cases, events) => this.applyHandoffBottleneck(cases, events)
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

  // Load custom patterns from configuration or external files
  loadCustomPatterns() {
    // This could load from:
    // 1. Configuration files
    // 2. External pattern libraries
    // 3. User-defined pattern files
    // 4. Database of patterns

    const customPatterns = [];

    // Example: Time-based patterns that change based on current date/season
    if (new Date().getMonth() === 11) { // December
      customPatterns.push({
        name: "holiday_slowdown",
        description: "December cases experience delays due to holiday schedules",
        probability: 0.4,
        apply: (cases, events) => this.applyHolidaySlowdown(cases, events)
      });
    }

    // Example: Workload-based patterns that adapt to dataset size
    if (config.NUMBER_OF_CASES > 100000) {
      customPatterns.push({
        name: "scale_bottleneck",
        description: "Large datasets experience different bottleneck patterns",
        probability: 0.3,
        apply: (cases, events) => this.applyScaleBottleneck(cases, events)
      });
    }

    return customPatterns;
  }

  // Analyze the generated data to understand what patterns are feasible
  // Optimized for large datasets with streaming analysis
  analyzeData(cases, events) {
    try {
      console.log(`\n📊 Analyzing ${cases.length} cases and ${events.length} events...`);

      this.dataAnalysis = {
        totalCases: cases.length,
        totalEvents: events.length,

        // Use streaming analysis for large datasets
        teams: this.analyzeAttributeStreaming(cases, 'Team'),
        assignees: this.analyzeAttributeStreaming(cases, 'Assignee'),
        priorities: this.analyzeAttributeStreaming(cases, 'Priority'),
        components: this.analyzeAttributeStreaming(cases, 'Component'),
        sprints: this.analyzeAttributeStreaming(cases, 'Sprint'),
        customerImpacts: this.analyzeAttributeStreaming(cases, 'CustomerImpact'),
        customerEnvironments: this.analyzeAttributeStreaming(cases, 'CustomerEnvironment'),
        incidents: this.analyzeAttributeStreaming(cases, 'Incident'),
        types: this.analyzeAttributeStreaming(cases, 'Type'),
        storyPoints: this.analyzeStoryPointsStreaming(cases),

        // Analyze event patterns with streaming
        actors: this.analyzeAttributeStreaming(events, 'Actor'),
        eventTypes: this.analyzeAttributeStreaming(events, 'EventType'),

        // Analyze temporal patterns with sampling for large datasets
        submissionDays: this.analyzeSubmissionDaysStreaming(events),
        seasonalDistribution: this.analyzeSeasonalDistributionStreaming(events)
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

  // Memory-optimized streaming analysis for large datasets
  analyzeAttributeStreaming(data, attribute) {
    const distribution = {};
    let totalWithValue = 0;

    // Stream through data without creating intermediate arrays
    for (let i = 0; i < data.length; i++) {
      const value = data[i][attribute];
      if (value && value !== '') {
        distribution[value] = (distribution[value] || 0) + 1;
        totalWithValue++;
      }

      // Periodic garbage collection hint for very large datasets
      if (i % 100000 === 0 && global.gc) {
        global.gc();
      }
    }

    const uniqueValues = Object.keys(distribution);
    if (uniqueValues.length === 0) {
      return {
        uniqueCount: 0,
        totalWithValue: 0,
        distribution: {},
        mostCommon: null,
        leastCommon: null,
        largestGroup: 0,
        smallestGroup: 0,
        values: []
      };
    }

    const sortedByCount = uniqueValues.sort((a, b) => distribution[b] - distribution[a]);

    return {
      uniqueCount: uniqueValues.length,
      totalWithValue,
      distribution,
      mostCommon: sortedByCount[0],
      leastCommon: sortedByCount[sortedByCount.length - 1],
      largestGroup: distribution[sortedByCount[0]] || 0,
      smallestGroup: distribution[sortedByCount[sortedByCount.length - 1]] || 0,
      values: uniqueValues
    };
  }



  // Intelligently select patterns based on data analysis
  selectPatternsForRun(cases, events) {
    this.analyzeData(cases, events);
    this.appliedPatterns = [];
    const feasiblePatterns = [];

    // Check each pattern for feasibility
    for (const pattern of this.patterns) {
      const feasibility = this.checkPatternFeasibility(pattern.name);
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
  checkPatternFeasibility(patternName) {
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

      case 'friday_effect':
        if (!this.dataAnalysis.submissionDays.hasFridaySubmissions) {
          return { feasible: false, reason: `Only ${this.dataAnalysis.submissionDays.fridaySubmissions} Friday submissions (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.submissionDays.fridaySubmissions / (this.minSampleSize * 2)),
          reason: `${this.dataAnalysis.submissionDays.fridaySubmissions} Friday submissions available`
        };

      case 'story_points_correlation':
        if (!this.dataAnalysis.storyPoints.hasHighStoryPoints) {
          return { feasible: false, reason: `Only ${this.dataAnalysis.storyPoints.highStoryPointsCount} high story point cases (need ${this.minSampleSize})` };
        }
        return {
          feasible: true,
          score: Math.min(1.0, this.dataAnalysis.storyPoints.highStoryPointsCount / (this.minSampleSize * 2)),
          reason: `${this.dataAnalysis.storyPoints.highStoryPointsCount} high story point cases available`
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

  // Utility method to randomly sample patterns for variety
  randomSample(array, sampleSize) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, sampleSize);
  }

  // Apply all selected patterns to the data - optimized for large datasets
  applyPatterns(cases, events) {
    if (this.appliedPatterns.length === 0) {
      console.log(`\n❌ No easter egg patterns applied - insufficient data diversity`);
      return;
    }

    // Use all selected patterns (already capped to 5 in selectPatternsForRun)
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
  }

  // Pattern 1: Team Bottleneck - Optimized for large datasets
  applyTeamBottleneck(cases, events) {
    // Select team with sufficient cases for statistical significance
    const teamCounts = this.dataAnalysis.teams.distribution;
    const eligibleTeams = Object.keys(teamCounts).filter(team => teamCounts[team] >= this.minSampleSize);

    if (eligibleTeams.length === 0) return;

    // Prefer teams with moderate size (not too small, not too large) for better contrast
    const bottleneckTeam = eligibleTeams.sort((a, b) => {
      const aSize = teamCounts[a];
      const bSize = teamCounts[b];
      const idealSize = Math.floor(this.dataAnalysis.totalCases / this.dataAnalysis.teams.uniqueCount);
      return Math.abs(aSize - idealSize) - Math.abs(bSize - idealSize);
    })[0];

    const affectedCaseCount = teamCounts[bottleneckTeam];
    const delayMultiplier = faker.number.float({ min: 2.0, max: 4.0 });

    // Memory-efficient: Create Set of team case IDs for O(1) lookup
    const teamCaseIds = new Set();
    for (let i = 0; i < cases.length; i++) {
      if (cases[i].Team === bottleneckTeam) {
        teamCaseIds.add(cases[i]._id);
      }
    }

    let eventsModified = 0;

    // Stream through events without creating intermediate arrays
    for (let i = 0; i < events.length; i++) {
      if (teamCaseIds.has(events[i].TicketId)) {
        const currentDate = new Date(events[i].Date);
        const extraDays = Math.floor(faker.number.int({ min: 1, max: 5 }) * delayMultiplier);
        currentDate.setDate(currentDate.getDate() + extraDays);
        events[i].Date = currentDate.toISOString().replace('T', ' ').substring(0, 23);
        eventsModified++;
      }

      // Periodic garbage collection for very large datasets
      if (i % 100000 === 0 && global.gc) {
        global.gc();
      }
    }

    this.addFinding({
      pattern: "Team Performance Bottleneck",
      description: `Team "${bottleneckTeam}" (${affectedCaseCount} cases, ${eventsModified} events) experiences ${delayMultiplier.toFixed(1)}x longer processing times due to systematic delays. This represents ${(affectedCaseCount / this.dataAnalysis.totalCases * 100).toFixed(1)}% of all cases.`,
      expectedFindings: [
        `Cases assigned to team "${bottleneckTeam}" have significantly longer cycle times`,
        `Average case duration for "${bottleneckTeam}" is ${delayMultiplier.toFixed(1)} times higher than other teams`,
        `Process mining should identify "${bottleneckTeam}" as a resource bottleneck`,
        `Statistical significance: ${affectedCaseCount} cases affected (${(affectedCaseCount / this.dataAnalysis.totalCases * 100).toFixed(1)}% of dataset)`
      ],
      actualData: {
        affectedTeam: bottleneckTeam,
        affectedCases: affectedCaseCount,
        totalTeams: this.dataAnalysis.teams.uniqueCount,
        delayMultiplier: delayMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 2: Priority Fast Track - FIXED to actually reduce case duration
  applyPriorityFastTrack(cases, events) {
    const highPriorityCases = cases.filter(c => c.Priority === 'High' || c.Priority === 'Critical');
    if (highPriorityCases.length === 0) return;

    const fastTrackCaseIds = new Set(highPriorityCases.map(c => c._id));
    const skipStates = ['Under Code Review', 'QE Review', 'PO Review'];
    const speedupFactor = faker.number.float({ min: 0.4, max: 0.7 }); // Complete in 40-70% of normal time

    // Step 1: Group events by case for timeline compression
    const caseEventMap = new Map();
    const eventsToRemove = [];

    events.forEach((event, index) => {
      if (fastTrackCaseIds.has(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push({ event, index });

        // Mark some review steps for removal (70% chance)
        if (skipStates.includes(event.EventType) && Math.random() < 0.7) {
          eventsToRemove.push(index);
        }
      }
    });

    // Step 2: ACTUALLY compress timeline for high priority cases
    caseEventMap.forEach((caseEvents, caseId) => {
      // Sort events by date
      caseEvents.sort((a, b) => new Date(a.event.Date) - new Date(b.event.Date));

      if (caseEvents.length > 1) {
        const startTime = new Date(caseEvents[0].event.Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].event.Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * speedupFactor; // Compress timeline

        // Redistribute events across compressed timeline
        caseEvents.forEach((item, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          item.event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
        });
      }
    });

    // Step 3: Remove skipped events (in reverse order to maintain indices)
    eventsToRemove.reverse().forEach(index => events.splice(index, 1));

    const affectedCases = highPriorityCases.length;
    const eventsRemoved = eventsToRemove.length;
    const timeReduction = ((1 - speedupFactor) * 100).toFixed(0);

    this.addFinding({
      pattern: "Priority-Based Fast Track",
      description: `High and Critical priority cases (${affectedCases} cases) complete in ${(speedupFactor * 100).toFixed(0)}% of normal time by compressing timeline and bypassing ${eventsRemoved} review steps (${skipStates.join(', ')}).`,
      expectedFindings: [
        `High/Critical priority cases have ${timeReduction}% shorter cycle times than Normal/Low priority`,
        `High priority cases frequently skip: ${skipStates.join(', ')}`,
        `Process mining should show different workflow variants for different priorities`,
        `Priority should be identified as a significant factor in process performance`,
        `Average case duration for high priority: ${(speedupFactor * 100).toFixed(0)}% of normal cases`,
        `Timeline compression: high priority cases finish ${timeReduction}% faster`
      ],
      actualData: {
        affectedCases,
        eventsRemoved,
        speedupFactor,
        timeReduction: `${timeReduction}%`
      }
    });
  }

  // Pattern 3: Assignee Efficiency
  applyAssigneeEfficiency(cases, events) {
    const assignees = [...new Set(cases.map(c => c.Assignee).filter(a => a))];
    if (assignees.length < 3) return;

    const superEfficient = faker.helpers.arrayElement(assignees);
    const speedMultiplier = faker.number.float({ min: 0.4, max: 0.7 }); // Complete in 40-70% of normal time
    const efficientCaseIds = cases.filter(c => c.Assignee === superEfficient).map(c => c._id);

    // Systematically compress timeline for this assignee's cases
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to compress the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (efficientCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Compress timeline for each efficient assignee case
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * speedMultiplier; // Compress timeline

        // Redistribute events across compressed timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Super Efficient Assignee",
      description: `Assignee "${superEfficient}" processes cases in ${(speedMultiplier * 100).toFixed(0)}% of normal time (${casesModified} cases, ${eventsModified} events compressed), demonstrating superior efficiency.`,
      expectedFindings: [
        `Cases assigned to "${superEfficient}" have ${((1 - speedMultiplier) * 100).toFixed(0)}% shorter cycle times`,
        `Average case duration for "${superEfficient}" is ${speedMultiplier.toFixed(1)}x faster than team average`,
        `"${superEfficient}" should appear as the most efficient resource in performance analysis`,
        `Process mining should identify "${superEfficient}" as a high-performing resource`,
        `Statistical significance: ${casesModified} cases with compressed timelines`
      ],
      actualData: {
        superEfficientAssignee: superEfficient,
        affectedCases: casesModified,
        speedMultiplier: speedMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 4: Component Complexity
  applyComponentComplexity(cases, events) {
    const components = [...new Set(cases.map(c => c.Component).filter(c => c))];
    if (components.length < 2) return;

    const complexComponent = faker.helpers.arrayElement(components);
    const complexCaseIds = cases.filter(c => c.Component === complexComponent).map(c => c._id);

    // Systematically extend the timeline for complex component cases
    const delayMultiplier = faker.number.float({ min: 1.5, max: 2.5 }); // 50-150% longer
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to extend the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (complexCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Extend timeline for each complex component case
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * delayMultiplier;

        // Redistribute events across extended timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Component Complexity Bottleneck",
      description: `Component "${complexComponent}" cases take ${(delayMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended), indicating higher complexity or technical debt.`,
      expectedFindings: [
        `Cases for component "${complexComponent}" have ${((delayMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Average case duration for "${complexComponent}" is ${delayMultiplier.toFixed(1)}x longer than other components`,
        `"${complexComponent}" cases show systematic delays throughout the workflow`,
        `Process mining should identify "${complexComponent}" as having significantly more complex workflows`,
        `Statistical significance: ${casesModified} cases affected with extended timelines`
      ],
      actualData: {
        affectedComponent: complexComponent,
        affectedCases: casesModified,
        delayMultiplier: delayMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 5: Friday Effect
  applyFridayEffect(cases, events) {
    // Find cases submitted on Fridays and delay their first progress
    events.forEach(event => {
      const eventDate = new Date(event.Date);
      if (eventDate.getDay() === 5 && event.EventType === 'Submitted') { // Friday
        // Find the next event for this case and delay it
        const nextEvents = events.filter(e =>
          e.TicketId === event.TicketId &&
          new Date(e.Date) > eventDate
        ).sort((a, b) => new Date(a.Date) - new Date(b.Date));

        if (nextEvents.length > 0) {
          const delay = faker.number.int({ min: 2, max: 4 }); // 2-4 extra days
          nextEvents.forEach(nextEvent => {
            const nextDate = new Date(nextEvent.Date);
            nextDate.setDate(nextDate.getDate() + delay);
            nextEvent.Date = nextDate.toISOString().replace('T', ' ').substring(0, 23);
          });
        }
      }
    });

    this.addFinding({
      pattern: "Friday Submission Effect",
      description: `Cases submitted on Fridays experience 2-4 additional days delay before first progress due to weekend effect and reduced Monday productivity.`,
      expectedFindings: [
        `Cases submitted on Fridays have longer time-to-first-progress`,
        `Weekend submissions show systematic delays in initial processing`,
        `Day-of-week analysis should reveal Friday as the worst day for case submission`,
        `Process mining should identify temporal patterns related to weekdays`
      ]
    });
  }

  // Pattern 6: Story Points Correlation
  applyStoryPointsCorrelation(cases, events) {
    const highStoryPointCases = cases.filter(c =>
      c.StoryPoints && parseInt(c.StoryPoints) >= 8
    ).map(c => c._id);

    if (highStoryPointCases.length === 0) return;

    // Systematically extend timeline for high story point cases
    const complexityMultiplier = faker.number.float({ min: 1.4, max: 2.2 }); // 40-120% longer
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to extend the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (highStoryPointCases.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Extend timeline for each high story point case
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * complexityMultiplier;

        // Redistribute events across extended timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Story Points Complexity Correlation",
      description: `Cases with 8+ story points take ${(complexityMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to increased complexity and scope.`,
      expectedFindings: [
        `Cases with high story points (8+) have ${((complexityMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Average case duration for 8+ story points is ${complexityMultiplier.toFixed(1)}x longer than lower story points`,
        `Strong correlation between story points and processing duration`,
        `Process mining should show story points as a significant complexity factor`,
        `Statistical significance: ${casesModified} cases with extended timelines`
      ],
      actualData: {
        complexityMultiplier: complexityMultiplier,
        affectedCases: casesModified,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 7: Customer Impact Escalation - FIXED to actually reduce case duration
  applyCustomerImpactEscalation(cases, events) {
    const highImpactCases = cases.filter(c =>
      c.CustomerImpact === 'High' || c.CustomerImpact === 'Critical'
    );

    if (highImpactCases.length === 0) return;

    const highImpactCaseIds = new Set(highImpactCases.map(c => c._id));
    const skipStates = ['Backlog', 'Deferred', 'Paused'];
    const escalationSpeedupFactor = faker.number.float({ min: 0.3, max: 0.6 }); // Complete in 30-60% of normal time

    // Step 1: Group events by case for timeline compression
    const caseEventMap = new Map();
    const eventsToRemove = [];

    events.forEach((event, index) => {
      if (highImpactCaseIds.has(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push({ event, index });

        // Mark delay states for removal (80% chance)
        if (skipStates.includes(event.EventType) && Math.random() < 0.8) {
          eventsToRemove.push(index);
        }
      }
    });

    // Step 2: ACTUALLY compress timeline for high impact cases (more aggressive than priority)
    caseEventMap.forEach((caseEvents, caseId) => {
      // Sort events by date
      caseEvents.sort((a, b) => new Date(a.event.Date) - new Date(b.event.Date));

      if (caseEvents.length > 1) {
        const startTime = new Date(caseEvents[0].event.Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].event.Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * escalationSpeedupFactor; // Aggressive compression

        // Redistribute events across compressed timeline
        caseEvents.forEach((item, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          item.event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
        });
      }
    });

    // Step 3: Remove skipped delay states (in reverse order to maintain indices)
    eventsToRemove.reverse().forEach(index => events.splice(index, 1));

    const affectedCases = highImpactCases.length;
    const eventsRemoved = eventsToRemove.length;
    const timeReduction = ((1 - escalationSpeedupFactor) * 100).toFixed(0);

    this.addFinding({
      pattern: "Customer Impact Escalation",
      description: `High/Critical customer impact cases (${affectedCases} cases) complete in ${(escalationSpeedupFactor * 100).toFixed(0)}% of normal time through aggressive timeline compression and bypassing ${eventsRemoved} delay states (${skipStates.join(', ')}).`,
      expectedFindings: [
        `High customer impact cases have ${timeReduction}% shorter cycle times than normal cases`,
        `Customer impact cases rarely go through: ${skipStates.join(', ')}`,
        `Strong correlation between customer impact level and processing speed`,
        `Process mining should identify customer impact as a priority factor`,
        `Average case duration for high impact: ${(escalationSpeedupFactor * 100).toFixed(0)}% of normal cases`,
        `Escalation timeline compression: high impact cases finish ${timeReduction}% faster`
      ],
      actualData: {
        affectedCases,
        eventsRemoved,
        escalationSpeedupFactor,
        timeReduction: `${timeReduction}%`
      }
    });
  }

  // Pattern 8: Sprint Boundary Delay
  applySprintBoundaryDelay(cases, events) {
    const sprintNumbers = [...new Set(cases.map(c => c.Sprint).filter(s => s))];
    if (sprintNumbers.length === 0) return;

    const affectedSprint = faker.helpers.arrayElement(sprintNumbers);
    const sprintCaseIds = cases.filter(c => c.Sprint === affectedSprint).map(c => c._id);

    // Systematically extend timeline for sprint boundary cases
    const delayMultiplier = faker.number.float({ min: 1.3, max: 1.8 }); // 30-80% longer
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to extend the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (sprintCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Extend timeline for each sprint boundary case
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * delayMultiplier;

        // Redistribute events across extended timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Sprint Boundary Delays",
      description: `Cases in sprint "${affectedSprint}" take ${(delayMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to sprint planning overhead and resource reallocation.`,
      expectedFindings: [
        `Sprint "${affectedSprint}" cases have ${((delayMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Average case duration for "${affectedSprint}" is ${delayMultiplier.toFixed(1)}x longer than other sprints`,
        `Sprint boundary effects create systematic delays throughout the workflow`,
        `Process mining should identify sprint-related bottlenecks with measurable impact`,
        `Statistical significance: ${casesModified} cases affected with extended timelines`
      ],
      actualData: {
        affectedSprint: affectedSprint,
        affectedCases: casesModified,
        delayMultiplier: delayMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 9: Incident Correlation
  applyIncidentCorrelation(cases, events) {
    const incidentCases = cases.filter(c =>
      c.Incident === 'Yes' || c.Type === 'Incident'
    ).map(c => c._id);

    if (incidentCases.length === 0) return;

    // Systematically compress timeline for incident cases
    const urgencyMultiplier = faker.number.float({ min: 0.3, max: 0.6 }); // Complete in 30-60% of normal time
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to compress the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (incidentCases.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Compress timeline for each incident case
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * urgencyMultiplier; // Compress timeline

        // Redistribute events across compressed timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Incident Response Workflow",
      description: `Incident-related cases complete in ${(urgencyMultiplier * 100).toFixed(0)}% of normal time (${casesModified} cases, ${eventsModified} events compressed), demonstrating expedited workflow for urgent handling.`,
      expectedFindings: [
        `Incident cases have ${((1 - urgencyMultiplier) * 100).toFixed(0)}% shorter cycle times than regular cases`,
        `Average case duration for incidents is ${urgencyMultiplier.toFixed(1)}x faster than normal cases`,
        `Incident cases show significantly compressed processing times`,
        `Process mining should identify distinct incident response processes with measurable urgency`,
        `Statistical significance: ${casesModified} cases with expedited timelines`
      ],
      actualData: {
        affectedCases: casesModified,
        urgencyMultiplier: urgencyMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 10: Environment Dependency
  applyEnvironmentDependency(cases, events) {
    const prodCases = cases.filter(c =>
      c.CustomerEnvironment === 'Production' || c.CustomerEnvironment === 'Prod'
    ).map(c => c._id);

    if (prodCases.length === 0) return;

    // Systematically extend timeline for production cases
    const approvalMultiplier = faker.number.float({ min: 1.4, max: 2.0 }); // 40-100% longer
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to extend the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (prodCases.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Extend timeline for each production case
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * approvalMultiplier;

        // Redistribute events across extended timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Production Environment Controls",
      description: `Production environment cases take ${(approvalMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to additional approval and change control procedures.`,
      expectedFindings: [
        `Production cases have ${((approvalMultiplier - 1) * 100).toFixed(0)}% longer cycle times than other environments`,
        `Average case duration for production is ${approvalMultiplier.toFixed(1)}x longer than non-production cases`,
        `Production cases show systematic delays throughout the approval workflow`,
        `Process mining should identify environment-based process variations with measurable impact`,
        `Statistical significance: ${casesModified} cases with extended approval timelines`
      ],
      actualData: {
        affectedCases: casesModified,
        approvalMultiplier: approvalMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 11: Seasonal Workload
  applySeasonalWorkload(cases, events) {
    const seasonalMonths = [11, 0, 1]; // Nov, Dec, Jan (holiday season)
    const seasonalCaseIds = [];

    // Identify cases created during seasonal months
    events.forEach(event => {
      if (event.EventType === 'Submitted') {
        const eventDate = new Date(event.Date);
        if (seasonalMonths.includes(eventDate.getMonth())) {
          seasonalCaseIds.push(event.TicketId);
        }
      }
    });

    if (seasonalCaseIds.length === 0) return;

    // Systematically extend timeline for seasonal cases
    const seasonalMultiplier = faker.number.float({ min: 1.4, max: 2.2 }); // 40-120% longer
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to extend the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (seasonalCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Extend timeline for each seasonal case
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * seasonalMultiplier;

        // Redistribute events across extended timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Seasonal Workload Impact",
      description: `Cases submitted during holiday season (Nov-Jan) take ${(seasonalMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to reduced team capacity and vacation schedules.`,
      expectedFindings: [
        `Cases created in Nov-Jan have ${((seasonalMultiplier - 1) * 100).toFixed(0)}% longer processing times`,
        `Average case duration for holiday season is ${seasonalMultiplier.toFixed(1)}x longer than other months`,
        `Seasonal patterns create systematic delays throughout the workflow`,
        `Process mining should identify temporal/seasonal bottlenecks with measurable impact`,
        `Statistical significance: ${casesModified} cases with extended timelines`
      ],
      actualData: {
        affectedCases: casesModified,
        seasonalMultiplier: seasonalMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 12: Handoff Bottleneck
  applyHandoffBottleneck(cases, events) {
    const actors = [...new Set(events.map(e => e.Actor).filter(a => a))];
    if (actors.length < 3) return;

    const bottleneckActor = faker.helpers.arrayElement(actors);

    // Find cases that involve the bottleneck actor
    const bottleneckCaseIds = [...new Set(events
      .filter(e => e.Actor === bottleneckActor)
      .map(e => e.TicketId))];

    if (bottleneckCaseIds.length === 0) return;

    // Systematically extend timeline for cases involving the bottleneck actor
    const handoffMultiplier = faker.number.float({ min: 1.3, max: 1.9 }); // 30-90% longer
    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case to extend the entire case timeline
    const caseEventMap = new Map();
    events.forEach(event => {
      if (bottleneckCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Extend timeline for each case involving the bottleneck actor
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        // Sort events by date
        caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

        const startTime = new Date(caseEvents[0].Date);
        const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
        const originalDuration = originalEndTime - startTime;
        const newDuration = originalDuration * handoffMultiplier;

        // Redistribute events across extended timeline
        caseEvents.forEach((event, idx) => {
          if (idx === 0) return; // Keep start time unchanged

          const progress = idx / (caseEvents.length - 1);
          const newTime = new Date(startTime.getTime() + (newDuration * progress));
          event.Date = newTime.toISOString().replace('T', ' ').substring(0, 23);
          eventsModified++;
        });

        casesModified++;
      }
    });

    this.addFinding({
      pattern: "Actor Handoff Bottleneck",
      description: `Cases involving actor "${bottleneckActor}" take ${(handoffMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended), indicating capacity constraints or skill gaps.`,
      expectedFindings: [
        `Cases involving actor "${bottleneckActor}" have ${((handoffMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Average case duration for "${bottleneckActor}" cases is ${handoffMultiplier.toFixed(1)}x longer than other actors`,
        `Handoff delays create systematic bottlenecks throughout the workflow`,
        `Process mining should identify "${bottleneckActor}" as a resource bottleneck with measurable impact`,
        `Statistical significance: ${casesModified} cases with extended timelines`
      ],
      actualData: {
        bottleneckActor: bottleneckActor,
        affectedCases: casesModified,
        handoffMultiplier: handoffMultiplier,
        eventsModified: eventsModified
      }
    });
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
    console.log(`\n🥚 Easter eggs documented in arjun: ${absolutePath}`);
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

  // Memory-optimized streaming analysis methods for large datasets
  analyzeStoryPointsStreaming(cases) {
    let total = 0;
    let highStoryPointsCount = 0;
    let sum = 0;

    for (let i = 0; i < cases.length; i++) {
      const sp = cases[i].StoryPoints;
      if (sp && !isNaN(parseInt(sp))) {
        const points = parseInt(sp);
        total++;
        sum += points;
        if (points >= 8) {
          highStoryPointsCount++;
        }
      }

      // Periodic garbage collection for very large datasets
      if (i % 100000 === 0 && global.gc) {
        global.gc();
      }
    }

    return {
      total,
      highStoryPointsCount,
      hasHighStoryPoints: highStoryPointsCount >= this.minSampleSize,
      average: total > 0 ? sum / total : 0
    };
  }

  analyzeSubmissionDaysStreaming(events) {
    const dayDistribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let total = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.EventType === 'Submitted') {
        const day = new Date(event.Date).getDay();
        dayDistribution[day]++;
        total++;
      }

      // Periodic garbage collection for very large datasets
      if (i % 100000 === 0 && global.gc) {
        global.gc();
      }
    }

    return {
      total,
      fridaySubmissions: dayDistribution[5],
      hasFridaySubmissions: dayDistribution[5] >= this.minSampleSize,
      distribution: dayDistribution
    };
  }

  analyzeSeasonalDistributionStreaming(events) {
    const seasonalMonths = [11, 0, 1]; // Nov, Dec, Jan
    let seasonalCount = 0;
    let total = 0;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.EventType === 'Submitted') {
        total++;
        const month = new Date(event.Date).getMonth();
        if (seasonalMonths.includes(month)) {
          seasonalCount++;
        }
      }

      // Periodic garbage collection for very large datasets
      if (i % 100000 === 0 && global.gc) {
        global.gc();
      }
    }

    return {
      total,
      seasonalSubmissions: seasonalCount,
      hasSeasonalSubmissions: seasonalCount >= this.minSampleSize
    };
  }

  // Helper to store findings
  addFinding(finding) {
    if (!this.findings) this.findings = [];
    this.findings.push(finding);
  }

}

module.exports = { EasterEggGenerator };