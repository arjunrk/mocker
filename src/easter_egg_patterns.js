// Pattern implementation methods for Easter Egg Generator
const { faker } = require("@faker-js/faker");

class EasterEggPatterns {
  constructor(easterEggGenerator) {
    this.generator = easterEggGenerator;
    this.helpers = easterEggGenerator.helpers;
    this.minSampleSize = easterEggGenerator.minSampleSize;
  }

  // Pattern 1: Team Bottleneck - Optimized for large datasets
  applyTeamBottleneck(cases, events) {
    const teamCounts = this.generator.dataAnalysis.teams.distribution;
    const eligibleTeams = Object.keys(teamCounts).filter(team => teamCounts[team] >= this.minSampleSize);

    if (eligibleTeams.length === 0) return;

    const bottleneckTeam = eligibleTeams.sort((a, b) => {
      const aSize = teamCounts[a];
      const bSize = teamCounts[b];
      const idealSize = Math.floor(this.generator.dataAnalysis.totalCases / this.generator.dataAnalysis.teams.uniqueCount);
      return Math.abs(aSize - idealSize) - Math.abs(bSize - idealSize);
    })[0];

    const affectedCaseCount = teamCounts[bottleneckTeam];
    const delayMultiplier = faker.number.float({ min: 2.0, max: 4.0 });

    // Find team cases that haven't been modified by other patterns
    const teamCaseIds = new Set();
    for (let i = 0; i < cases.length; i++) {
      if (cases[i].Team === bottleneckTeam && !this.generator.isCaseModified(cases[i]._id)) {
        teamCaseIds.add(cases[i]._id);
      }
    }

    if (teamCaseIds.size < this.minSampleSize) {
      console.log(`   ⚠️  Team bottleneck: Only ${teamCaseIds.size} unmodified cases available for team "${bottleneckTeam}" (need ${this.minSampleSize})`);
      return;
    }

    let casesModified = 0;
    let eventsModified = 0;

    // Group events by case for proper timeline extension
    const caseEventMap = new Map();
    events.forEach(event => {
      if (teamCaseIds.has(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Apply proper timeline extension to each case and mark as modified
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.extendCaseTimeline(caseEvents, delayMultiplier);
        this.generator.markCaseAsModified(caseId);
        casesModified++;
      }
    });

    this.generator.addFinding({
      pattern: "Team Performance Bottleneck",
      description: `Team "${bottleneckTeam}" (${casesModified} cases, ${eventsModified} events) experiences ${delayMultiplier.toFixed(1)}x longer processing times due to systematic delays. This represents ${(casesModified / this.generator.dataAnalysis.totalCases * 100).toFixed(1)}% of all cases.`,
      expectedFindings: [
        `Cases assigned to team "${bottleneckTeam}" have significantly longer cycle times`,
        `Average case duration for "${bottleneckTeam}" is ${delayMultiplier.toFixed(1)} times higher than other teams`,
        `Process mining should identify "${bottleneckTeam}" as a resource bottleneck`,
        `Statistical significance: ${casesModified} cases affected (${(casesModified / this.generator.dataAnalysis.totalCases * 100).toFixed(1)}% of dataset)`
      ],
      actualData: {
        affectedTeam: bottleneckTeam,
        affectedCases: casesModified,
        totalTeams: this.generator.dataAnalysis.teams.uniqueCount,
        delayMultiplier: delayMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 2: Priority Fast Track
  applyPriorityFastTrack(cases, events) {
    // Filter for high priority cases that haven't been modified by other patterns
    const highPriorityCases = cases.filter(c => 
      (c.Priority === 'High' || c.Priority === 'Critical') && 
      !this.generator.isCaseModified(c._id)
    );
    if (highPriorityCases.length === 0) return;

    const fastTrackCaseIds = new Set(highPriorityCases.map(c => c._id));
    const skipStates = ['Under Code Review', 'QE Review', 'PO Review'];
    const skipStateIds = [11, 14, 13]; // Corresponding numeric IDs for the skip states
    const speedupFactor = faker.number.float({ min: 0.4, max: 0.7 });

    const caseEventMap = new Map();
    const eventsToRemove = [];

    // Group events by case and identify events to remove
    events.forEach((event, index) => {
      if (fastTrackCaseIds.has(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push({ event, index });

        // Check if this event should be skipped (using numeric IDs)
        if (skipStateIds.includes(parseInt(event.EventType)) && Math.random() < 0.7) {
          eventsToRemove.push(index);
        }
      }
    });

    // Apply timeline compression to each case and mark as modified
    caseEventMap.forEach((caseEvents, caseId) => {
      // Filter out events that will be removed
      const remainingEvents = caseEvents.filter(item => !eventsToRemove.includes(item.index));
      
      if (remainingEvents.length > 1) {
        const eventList = remainingEvents.map(item => item.event);
        this.helpers.compressCaseTimeline(eventList, speedupFactor);
        this.generator.markCaseAsModified(caseId);
      }
    });

    // Remove events in reverse order to maintain indices
    eventsToRemove.sort((a, b) => b - a).forEach(index => events.splice(index, 1));

    const affectedCases = highPriorityCases.length;
    const eventsRemoved = eventsToRemove.length;
    const timeReduction = ((1 - speedupFactor) * 100).toFixed(0);

    this.generator.addFinding({
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

    const superEfficient = assignees[Math.floor(Math.random() * assignees.length)];
    const speedMultiplier = faker.number.float({ min: 0.4, max: 0.7 });
    
    // Filter for assignee cases that haven't been modified by other patterns
    const efficientCaseIds = cases
      .filter(c => c.Assignee === superEfficient && !this.generator.isCaseModified(c._id))
      .map(c => c._id);

    if (efficientCaseIds.length < this.minSampleSize) {
      console.log(`   ⚠️  Assignee efficiency: Only ${efficientCaseIds.length} unmodified cases available for assignee "${superEfficient}" (need ${this.minSampleSize})`);
      return;
    }

    let casesModified = 0;
    let eventsModified = 0;

    const caseEventMap = new Map();
    events.forEach(event => {
      if (efficientCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.compressCaseTimeline(caseEvents, speedMultiplier);
        this.generator.markCaseAsModified(caseId);
        casesModified++;
      }
    });

    this.generator.addFinding({
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

    const complexComponent = components[Math.floor(Math.random() * components.length)];
    
    // Filter for component cases that haven't been modified by other patterns
    const complexCaseIds = cases
      .filter(c => c.Component === complexComponent && !this.generator.isCaseModified(c._id))
      .map(c => c._id);

    if (complexCaseIds.length < this.minSampleSize) {
      console.log(`   ⚠️  Component complexity: Only ${complexCaseIds.length} unmodified cases available for component "${complexComponent}" (need ${this.minSampleSize})`);
      return;
    }

    const delayMultiplier = faker.number.float({ min: 1.5, max: 2.5 });
    let casesModified = 0;
    let eventsModified = 0;

    const caseEventMap = new Map();
    events.forEach(event => {
      if (complexCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.extendCaseTimeline(caseEvents, delayMultiplier);
        this.generator.markCaseAsModified(caseId);
        casesModified++;
      }
    });

    this.generator.addFinding({
      pattern: "Component Complexity Bottleneck",
      description: `Component "${complexComponent}" cases take ${(delayMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended), indicating higher complexity or technical debt.`,
      expectedFindings: [
        `Cases for component "${complexComponent}" have ${((delayMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Average case duration for "${complexComponent}" is ${delayMultiplier.toFixed(1)}x longer than other components`,
        `Component "${complexComponent}" should appear as a complexity bottleneck in analysis`,
        `Process mining should identify "${complexComponent}" as requiring optimization`,
        `Statistical significance: ${casesModified} cases with extended timelines`
      ],
      actualData: {
        complexComponent: complexComponent,
        affectedCases: casesModified,
        delayMultiplier: delayMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 5: Sequence Bottleneck
  applySequenceBottleneck(cases, events) {
    // Use a flexible approach - start with lower threshold for smaller datasets
    const datasetSize = cases.length;
    let minThreshold = datasetSize > 200 ? 3 : (datasetSize > 50 ? 2 : 1);

    let sequences = this.helpers.findCommonSequences(events, minThreshold);

    // If still no sequences found, use synthetic pattern
    if (sequences.length === 0) {
      console.log(`   ⚠️  Sequence bottleneck: No sequences found with ${minThreshold}+ occurrences, creating synthetic pattern`);
      this.applySyntheticSequencePattern(cases, events);
      return;
    }

    // Select a random sequence and find affected cases
    const bottleneckSequence = sequences[Math.floor(Math.random() * sequences.length)];
    const allAffectedCaseIds = this.helpers.findCasesWithSequence(events, bottleneckSequence);
    
    // Filter for cases that haven't been modified by other patterns
    const affectedCaseIds = this.generator.filterUnmodifiedCases(allAffectedCaseIds);

    // If no unmodified cases match the selected sequence, create a synthetic pattern
    if (affectedCaseIds.length === 0) {
      console.log(`   ⚠️  Sequence bottleneck: No unmodified cases found with sequence "${bottleneckSequence.from} → ${bottleneckSequence.to}", creating synthetic pattern`);
      this.applySyntheticSequencePattern(cases, events);
      return;
    }

    console.log(`   ✅ Sequence bottleneck: Found ${affectedCaseIds.length} unmodified cases with sequence ${bottleneckSequence.from} → ${bottleneckSequence.to}`);

    const delayMultiplier = faker.number.float({ min: 1.4, max: 2.2 });
    let casesModified = 0;
    let eventsModified = 0;

    const caseEventMap = new Map();
    events.forEach(event => {
      if (affectedCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.extendCaseTimeline(caseEvents, delayMultiplier);
        this.generator.markCaseAsModified(caseId);
        casesModified++;
      }
    });

    // Convert numeric IDs to human-readable event type names for documentation
    const fromEventName = this.getEventTypeName(bottleneckSequence.from);
    const toEventName = this.getEventTypeName(bottleneckSequence.to);

    this.generator.addFinding({
      pattern: "Activity Sequence Bottleneck",
      description: `Cases containing the sequence "${fromEventName} → ${toEventName}" take ${(delayMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to workflow inefficiencies.`,
      expectedFindings: [
        `Cases with "${fromEventName} → ${toEventName}" sequence have ${((delayMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Process mining should identify the "${fromEventName} → ${toEventName}" transition as a bottleneck`,
        `Workflow analysis should show systematic delays after "${fromEventName}" activities`,
        `Statistical significance: ${casesModified} cases with extended timelines`,
        `Sequence frequency: ${affectedCaseIds.length} cases contain this problematic sequence`
      ],
      actualData: {
        bottleneckSequence: `${fromEventName} → ${toEventName}`,
        affectedCases: casesModified,
        delayMultiplier: delayMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Pattern 6: Activity Duration Bottleneck
  applyActivityDurationBottleneck(cases, events) {
    // Define bottleneck activities with their numeric IDs and names
    const bottleneckActivities = [
      { id: 14, name: 'QE Review' },
      { id: 13, name: 'PO Review' },
      { id: 11, name: 'Under Code Review' },
      { id: 4, name: 'Bounced' },
      { id: 5, name: 'Blocked' }
    ];

    // Find which activities actually exist in the data
    const existingActivityIds = [...new Set(events.map(e => parseInt(e.EventType)))];
    const availableActivities = bottleneckActivities.filter(activity => 
      existingActivityIds.includes(activity.id)
    );

    if (availableActivities.length === 0) return;

    // Select a random bottleneck activity
    const bottleneckActivity = availableActivities[Math.floor(Math.random() * availableActivities.length)];
    const durationMultiplier = faker.number.float({ min: 1.5, max: 2.5 });

    // Find all cases that contain this activity and haven't been modified
    const allCasesWithActivity = new Set();
    events.forEach(event => {
      if (parseInt(event.EventType) === bottleneckActivity.id) {
        allCasesWithActivity.add(event.TicketId);
      }
    });

    // Filter for unmodified cases
    const casesWithActivity = new Set(
      Array.from(allCasesWithActivity).filter(caseId => !this.generator.isCaseModified(caseId))
    );

    if (casesWithActivity.size < this.minSampleSize) {
      console.log(`   ⚠️  Activity duration bottleneck: Only ${casesWithActivity.size} unmodified cases available with "${bottleneckActivity.name}" activity (need ${this.minSampleSize})`);
      return;
    }

    let casesModified = 0;
    let eventsModified = 0;

    // Use the existing helper method to extend timeline for cases with the bottleneck activity
    const caseEventMap = new Map();
    events.forEach(event => {
      if (casesWithActivity.has(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    // Apply timeline extension to cases containing the bottleneck activity
    caseEventMap.forEach((caseEvents, caseId) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.extendCaseTimeline(caseEvents, durationMultiplier);
        this.generator.markCaseAsModified(caseId);
        casesModified++;
      }
    });

    this.generator.addFinding({
      pattern: "Activity Duration Bottleneck",
      description: `Cases containing "${bottleneckActivity.name}" activity take ${(durationMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended), indicating systematic delays in this activity.`,
      expectedFindings: [
        `Cases with "${bottleneckActivity.name}" activity have ${((durationMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Process mining should identify "${bottleneckActivity.name}" as a duration bottleneck`,
        `Activity-level analysis should show "${bottleneckActivity.name}" takes significantly longer than other activities`,
        `Workflow optimization should focus on "${bottleneckActivity.name}" process improvements`,
        `Statistical significance: ${casesModified} cases with extended "${bottleneckActivity.name}" duration`
      ],
      actualData: {
        bottleneckActivity: bottleneckActivity.name,
        activityId: bottleneckActivity.id,
        affectedCases: casesModified,
        durationMultiplier: durationMultiplier,
        eventsModified: eventsModified,
        totalCasesWithActivity: casesWithActivity.size
      }
    });
  }

  // Pattern 7: Rework Sequence
  applyReworkSequence(cases, events) {
    const reworkCaseIds = this.helpers.findReworkCases(events);
    if (reworkCaseIds.length < this.minSampleSize) {
      console.log(`   ⚠️  Rework sequence: Only ${reworkCaseIds.length} rework cases found, creating synthetic pattern`);
      this.applySyntheticReworkPattern(cases, events);
      return;
    }

    const reworkMultiplier = faker.number.float({ min: 1.5, max: 2.3 });

    let casesModified = 0;
    let eventsModified = 0;

    const caseEventMap = new Map();
    events.forEach(event => {
      if (reworkCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    caseEventMap.forEach((caseEvents) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.extendCaseTimeline(caseEvents, reworkMultiplier);
        casesModified++;
      }
    });

    this.generator.addFinding({
      pattern: "Rework Sequence Impact",
      description: `Cases with rework patterns (Done/Resolved → In Progress) take ${(reworkMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to quality issues and repeated work.`,
      expectedFindings: [
        `Cases with rework patterns have ${((reworkMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Process mining should identify backward transitions as quality issues`,
        `Done → In Progress transitions indicate rework and quality problems`,
        `Resolved → Open transitions show customer dissatisfaction patterns`,
        `Statistical significance: ${casesModified} cases with extended timelines`
      ],
      actualData: {
        affectedCases: casesModified,
        reworkMultiplier: reworkMultiplier,
        eventsModified: eventsModified,
        totalReworkCases: reworkCaseIds.length
      }
    });
  }

  // Placeholder methods for remaining patterns - to be implemented as needed
  applyCustomerImpactEscalation(cases, events) {
    // Implementation would go here
    console.log("Customer Impact Escalation pattern not yet implemented");
  }

  applySprintBoundaryDelay(cases, events) {
    // Implementation would go here
    console.log("Sprint Boundary Delay pattern not yet implemented");
  }

  applyIncidentCorrelation(cases, events) {
    // Implementation would go here
    console.log("Incident Correlation pattern not yet implemented");
  }

  applyEnvironmentDependency(cases, events) {
    // Implementation would go here
    console.log("Environment Dependency pattern not yet implemented");
  }

  applySeasonalWorkload(cases, events) {
    // Implementation would go here
    console.log("Seasonal Workload pattern not yet implemented");
  }

  applyHandoffBottleneck(cases, events) {
    // Implementation would go here
    console.log("Handoff Bottleneck pattern not yet implemented");
  }

  // Helper method for sequence bottleneck when no real sequences are found
  applySyntheticSequencePattern(cases, events) {
    // Create a synthetic sequence pattern by selecting random cases and extending their timeline
    const sampleSize = Math.min(Math.floor(cases.length * 0.1), 20, cases.length); // 10% of cases or max 20, but not more than available
    const selectedCases = [];
    const selectedCaseIds = [];

    // Manually select random cases to avoid potential faker issues
    for (let i = 0; i < sampleSize && i < cases.length; i++) {
      const randomIndex = Math.floor(Math.random() * cases.length);
      if (!selectedCaseIds.includes(cases[randomIndex]._id)) {
        selectedCases.push(cases[randomIndex]);
        selectedCaseIds.push(cases[randomIndex]._id);
      }
    }

    const delayMultiplier = faker.number.float({ min: 1.4, max: 2.2 });
    let casesModified = 0;
    let eventsModified = 0;

    const caseEventMap = new Map();
    events.forEach(event => {
      if (selectedCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    caseEventMap.forEach((caseEvents) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.extendCaseTimeline(caseEvents, delayMultiplier);
        casesModified++;
      }
    });

    // Generate a synthetic sequence name using actual event types from the data
    const actualEventTypes = [...new Set(events.map(e => e.EventType))]
      .filter(t => t && typeof t === 'string' && t.trim() !== '');

    let syntheticFrom, syntheticTo;

    if (actualEventTypes.length < 2) {
      // Fallback: read from vocabulary.json if no events available
      const vocabularyEventTypes = this.getEventTypesFromVocabulary();
      syntheticFrom = vocabularyEventTypes[Math.floor(Math.random() * vocabularyEventTypes.length)];
      const remainingTypes = vocabularyEventTypes.filter(t => t !== syntheticFrom);
      syntheticTo = remainingTypes.length > 0 ? remainingTypes[Math.floor(Math.random() * remainingTypes.length)] : 'Merged';
    } else {
      // Use actual event types from the generated data
      syntheticFrom = actualEventTypes[Math.floor(Math.random() * actualEventTypes.length)];
      const remainingTypes = actualEventTypes.filter(t => t !== syntheticFrom);
      syntheticTo = remainingTypes.length > 0 ? remainingTypes[Math.floor(Math.random() * remainingTypes.length)] : actualEventTypes[0];
    }

    this.generator.addFinding({
      pattern: "Activity Sequence Bottleneck",
      description: `Cases containing workflow transitions similar to "${syntheticFrom} → ${syntheticTo}" take ${(delayMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to workflow inefficiencies.`,
      expectedFindings: [
        `Cases with complex workflow transitions have ${((delayMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Process mining should identify workflow transition bottlenecks`,
        `Workflow analysis should show systematic delays in multi-step processes`,
        `Statistical significance: ${casesModified} cases with extended timelines`,
        `Pattern affects approximately ${(casesModified / cases.length * 100).toFixed(1)}% of all cases`
      ],
      actualData: {
        bottleneckSequence: `${syntheticFrom} → ${syntheticTo} (synthetic)`,
        affectedCases: casesModified,
        delayMultiplier: delayMultiplier,
        eventsModified: eventsModified
      }
    });
  }

  // Helper method to get event types from vocabulary.json as fallback
  getEventTypesFromVocabulary() {
    // Read vocabulary.json and extract EVENT_TYPE keys
    try {
      const fs = require('fs');
      const vocabulary = JSON.parse(fs.readFileSync('vocabulary.json', 'utf8'));
      return Object.keys(vocabulary.EVENT_TYPE || {});
    } catch (error) {
      console.warn('Could not read vocabulary.json, using default event types');
      return ['Submitted', 'In Progress', 'Done', 'Closed']; // Minimal fallback
    }
  }

  // Helper method to convert numeric event type ID to human-readable name
  getEventTypeName(eventTypeId) {
    // Convert to number in case it's passed as string
    const id = parseInt(eventTypeId);
    
    // Create mapping from the processed vocabulary data
    const eventTypeMapping = {
      1: 'Submitted',
      2: 'Deferred', 
      3: 'Backlog',
      4: 'Bounced',
      5: 'Blocked',
      6: 'Ready for Work',
      7: 'In Progress',
      8: 'Pairing',
      9: 'Parked',
      10: 'Paused',
      11: 'Under Code Review',
      12: 'Code Complete',
      13: 'PO Review',
      14: 'QE Review',
      15: 'Ready for Merge',
      16: 'Merged',
      17: 'Incorporated',
      18: 'Duplicated',
      19: 'Abandoned',
      20: 'Invalid'
    };
    
    return eventTypeMapping[id] || `Event ${eventTypeId}`;
  }

  // Helper method for rework sequence when no real rework cases are found
  applySyntheticReworkPattern(cases, events) {
    // Create a synthetic rework pattern by selecting random cases and extending their timeline
    const sampleSize = Math.min(Math.floor(cases.length * 0.08), 15, cases.length); // 8% of cases or max 15, but not more than available
    const selectedCases = [];
    const selectedCaseIds = [];

    // Manually select random cases to avoid potential faker issues
    for (let i = 0; i < sampleSize && i < cases.length; i++) {
      const randomIndex = Math.floor(Math.random() * cases.length);
      if (!selectedCaseIds.includes(cases[randomIndex]._id)) {
        selectedCases.push(cases[randomIndex]);
        selectedCaseIds.push(cases[randomIndex]._id);
      }
    }

    const reworkMultiplier = faker.number.float({ min: 1.5, max: 2.3 });
    let casesModified = 0;
    let eventsModified = 0;

    const caseEventMap = new Map();
    events.forEach(event => {
      if (selectedCaseIds.includes(event.TicketId)) {
        if (!caseEventMap.has(event.TicketId)) {
          caseEventMap.set(event.TicketId, []);
        }
        caseEventMap.get(event.TicketId).push(event);
      }
    });

    caseEventMap.forEach((caseEvents) => {
      if (caseEvents.length > 1) {
        eventsModified += this.helpers.extendCaseTimeline(caseEvents, reworkMultiplier);
        casesModified++;
      }
    });

    this.generator.addFinding({
      pattern: "Rework Sequence Impact",
      description: `Cases with quality issues requiring rework take ${(reworkMultiplier * 100).toFixed(0)}% longer to complete (${casesModified} cases, ${eventsModified} events extended) due to backward transitions and repeated work.`,
      expectedFindings: [
        `Cases with rework patterns have ${((reworkMultiplier - 1) * 100).toFixed(0)}% longer cycle times`,
        `Process mining should identify backward transitions as quality issues`,
        `Rework transitions indicate quality problems and process inefficiencies`,
        `Cases requiring rework show systematic delays throughout the workflow`,
        `Statistical significance: ${casesModified} cases with extended timelines`
      ],
      actualData: {
        affectedCases: casesModified,
        reworkMultiplier: reworkMultiplier,
        eventsModified: eventsModified,
        totalReworkCases: selectedCases.length,
        syntheticPattern: true
      }
    });
  }
}

module.exports = { EasterEggPatterns };