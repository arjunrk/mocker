const { faker } = require("@faker-js/faker");
const { writeFile } = require("./output");
const { config } = require("./config");

class EasterEggGenerator {
  constructor() {
    this.patterns = [];
    this.appliedPatterns = [];
  }

  // Define possible easter egg patterns
  initializePatterns() {
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
  }

  // Randomly select which patterns to apply this run
  selectPatternsForRun() {
    this.appliedPatterns = [];
    
    for (const pattern of this.patterns) {
      if (Math.random() < pattern.probability) {
        this.appliedPatterns.push(pattern);
      }
    }

    // Ensure at least one pattern is always applied
    if (this.appliedPatterns.length === 0) {
      const randomPattern = this.patterns[Math.floor(Math.random() * this.patterns.length)];
      this.appliedPatterns.push(randomPattern);
    }
  }

  // Apply all selected patterns to the data
  applyPatterns(cases, events) {
    console.log(`\nApplying ${this.appliedPatterns.length} easter egg pattern(s)...`);
    
    for (const pattern of this.appliedPatterns) {
      pattern.apply(cases, events);
    }
  }

  // Pattern 1: Team Bottleneck
  applyTeamBottleneck(cases, events) {
    const teams = [...new Set(cases.map(c => c.Team).filter(t => t))];
    if (teams.length < 2) return;

    const bottleneckTeam = faker.helpers.arrayElement(teams);
    const delayMultiplier = faker.number.float({ min: 2.0, max: 4.0 });

    // Add extra delays to events for this team's cases
    const teamCaseIds = cases.filter(c => c.Team === bottleneckTeam).map(c => c._id);
    
    events.forEach(event => {
      if (teamCaseIds.includes(event.TicketId)) {
        const currentDate = new Date(event.Date);
        const extraDays = Math.floor(faker.number.int({ min: 1, max: 5 }) * delayMultiplier);
        currentDate.setDate(currentDate.getDate() + extraDays);
        event.Date = currentDate.toISOString().replace('T', ' ').substring(0, 23);
      }
    });

    this.addFinding({
      pattern: "Team Performance Bottleneck",
      description: `Team "${bottleneckTeam}" has cases that take ${delayMultiplier.toFixed(1)}x longer than average due to systematic delays. This team should show up as a bottleneck in process mining analysis.`,
      expectedFindings: [
        `Cases assigned to team "${bottleneckTeam}" have significantly longer cycle times`,
        `Average case duration for "${bottleneckTeam}" is ${delayMultiplier.toFixed(1)} times higher than other teams`,
        `Process mining should identify "${bottleneckTeam}" as a resource bottleneck`
      ]
    });
  }

  // Pattern 2: Priority Fast Track
  applyPriorityFastTrack(cases, events) {
    const highPriorityCases = cases.filter(c => c.Priority === 'High' || c.Priority === 'Critical');
    if (highPriorityCases.length === 0) return;

    const fastTrackCaseIds = highPriorityCases.map(c => c._id);
    const skipStates = ['Code Review', 'QE Review', 'PO Review'];

    // Remove certain intermediate steps for high priority cases
    const eventsToRemove = [];
    events.forEach((event, index) => {
      if (fastTrackCaseIds.includes(event.TicketId) && skipStates.includes(event.EventType)) {
        if (Math.random() < 0.7) { // 70% chance to skip these steps
          eventsToRemove.push(index);
        }
      }
    });

    // Remove events in reverse order to maintain indices
    eventsToRemove.reverse().forEach(index => events.splice(index, 1));

    this.addFinding({
      pattern: "Priority-Based Fast Track",
      description: `High and Critical priority cases bypass certain review steps (${skipStates.join(', ')}) 70% of the time, resulting in faster completion.`,
      expectedFindings: [
        `High/Critical priority cases have shorter cycle times than Normal/Low priority`,
        `High priority cases frequently skip: ${skipStates.join(', ')}`,
        `Process mining should show different workflow variants for different priorities`,
        `Priority should be identified as a significant factor in process performance`
      ]
    });
  }

  // Pattern 3: Assignee Efficiency
  applyAssigneeEfficiency(cases, events) {
    const assignees = [...new Set(cases.map(c => c.Assignee).filter(a => a))];
    if (assignees.length < 3) return;

    const superEfficient = faker.helpers.arrayElement(assignees);
    const speedMultiplier = faker.number.float({ min: 0.3, max: 0.6 });

    const efficientCaseIds = cases.filter(c => c.Assignee === superEfficient).map(c => c._id);

    // Reduce time between events for this assignee's cases
    events.forEach(event => {
      if (efficientCaseIds.includes(event.TicketId)) {
        const currentDate = new Date(event.Date);
        const reduction = Math.floor(faker.number.int({ min: 1, max: 3 }) * (1 - speedMultiplier));
        currentDate.setDate(currentDate.getDate() - reduction);
        event.Date = currentDate.toISOString().replace('T', ' ').substring(0, 23);
      }
    });

    this.addFinding({
      pattern: "Super Efficient Assignee",
      description: `Assignee "${superEfficient}" processes cases ${(speedMultiplier * 100).toFixed(0)}% faster than average, completing work in ${(speedMultiplier * 100).toFixed(0)}% of normal time.`,
      expectedFindings: [
        `Cases assigned to "${superEfficient}" have significantly shorter cycle times`,
        `"${superEfficient}" should appear as the most efficient resource in performance analysis`,
        `Average case duration for "${superEfficient}" is ${(speedMultiplier * 100).toFixed(0)}% of team average`,
        `Process mining should identify "${superEfficient}" as a high-performing resource`
      ]
    });
  }

  // Pattern 4: Component Complexity
  applyComponentComplexity(cases, events) {
    const components = [...new Set(cases.map(c => c.Component).filter(c => c))];
    if (components.length < 2) return;

    const complexComponent = faker.helpers.arrayElement(components);
    const bounceStates = ['Bounced', 'Blocked', 'Paused'];

    const complexCaseIds = cases.filter(c => c.Component === complexComponent).map(c => c._id);

    // Add extra bounce events for complex component cases
    const newEvents = [];
    complexCaseIds.forEach(caseId => {
      if (Math.random() < 0.6) { // 60% of complex cases get extra bounces
        const bounceCount = faker.number.int({ min: 1, max: 3 });
        const caseEvents = events.filter(e => e.TicketId === caseId).sort((a, b) => new Date(a.Date) - new Date(b.Date));
        
        if (caseEvents.length > 2) {
          const insertPoint = Math.floor(caseEvents.length / 2);
          const baseDate = new Date(caseEvents[insertPoint].Date);
          
          for (let i = 0; i < bounceCount; i++) {
            const bounceEvent = {
              ...caseEvents[insertPoint],
              ID: events.length + newEvents.length + 1,
              _id: events.length + newEvents.length + 1,
              EventType: faker.helpers.arrayElement(bounceStates),
              Date: new Date(baseDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 23)
            };
            newEvents.push(bounceEvent);
          }
        }
      }
    });

    events.push(...newEvents);

    this.addFinding({
      pattern: "Component Complexity Bottleneck",
      description: `Component "${complexComponent}" cases experience 60% more rework with additional ${bounceStates.join('/')} states, indicating higher complexity or technical debt.`,
      expectedFindings: [
        `Cases for component "${complexComponent}" have more rework cycles`,
        `"${complexComponent}" cases frequently transition through: ${bounceStates.join(', ')}`,
        `Higher occurrence of ${bounceStates.join('/')} states for "${complexComponent}"`,
        `Process mining should identify "${complexComponent}" as having more complex workflows`
      ]
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

    // High story point cases get more review cycles
    const reviewStates = ['Code Review', 'PO Review', 'QE Review'];
    const newEvents = [];

    highStoryPointCases.forEach(caseId => {
      if (Math.random() < 0.8) { // 80% of high story point cases
        const caseEvents = events.filter(e => e.TicketId === caseId).sort((a, b) => new Date(a.Date) - new Date(b.Date));
        const extraReviews = faker.number.int({ min: 1, max: 2 });
        
        if (caseEvents.length > 3) {
          const insertPoint = Math.floor(caseEvents.length * 0.7);
          const baseDate = new Date(caseEvents[insertPoint].Date);
          
          for (let i = 0; i < extraReviews; i++) {
            const reviewEvent = {
              ...caseEvents[insertPoint],
              ID: events.length + newEvents.length + 1,
              _id: events.length + newEvents.length + 1,
              EventType: faker.helpers.arrayElement(reviewStates),
              Date: new Date(baseDate.getTime() + (i + 1) * 12 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 23)
            };
            newEvents.push(reviewEvent);
          }
        }
      }
    });

    events.push(...newEvents);

    this.addFinding({
      pattern: "Story Points Complexity Correlation",
      description: `Cases with 8+ story points require 80% more review cycles (${reviewStates.join(', ')}) due to increased complexity and scope.`,
      expectedFindings: [
        `Cases with high story points (8+) have longer cycle times`,
        `Strong correlation between story points and number of review states`,
        `High story point cases frequently cycle through: ${reviewStates.join(', ')}`,
        `Process mining should show story points as a significant complexity factor`
      ]
    });
  }

  // Pattern 7: Customer Impact Escalation
  applyCustomerImpactEscalation(cases, events) {
    const highImpactCases = cases.filter(c => 
      c.CustomerImpact === 'High' || c.CustomerImpact === 'Critical'
    ).map(c => c._id);

    if (highImpactCases.length === 0) return;

    const escalationStates = ['Ready for Work', 'In Progress'];
    const skipStates = ['Backlog', 'Deferred', 'Paused'];

    // Remove delay states and accelerate high impact cases
    const eventsToRemove = [];
    events.forEach((event, index) => {
      if (highImpactCases.includes(event.TicketId) && skipStates.includes(event.EventType)) {
        if (Math.random() < 0.8) { // 80% chance to skip delays
          eventsToRemove.push(index);
        }
      }
    });

    eventsToRemove.reverse().forEach(index => events.splice(index, 1));

    // Accelerate processing times
    events.forEach(event => {
      if (highImpactCases.includes(event.TicketId)) {
        const currentDate = new Date(event.Date);
        const acceleration = faker.number.int({ min: 1, max: 2 });
        currentDate.setDate(currentDate.getDate() - acceleration);
        event.Date = currentDate.toISOString().replace('T', ' ').substring(0, 23);
      }
    });

    this.addFinding({
      pattern: "Customer Impact Escalation",
      description: `High/Critical customer impact cases bypass delay states (${skipStates.join(', ')}) 80% of the time and process 1-2 days faster due to escalation procedures.`,
      expectedFindings: [
        `High customer impact cases have significantly shorter cycle times`,
        `Customer impact cases rarely go through: ${skipStates.join(', ')}`,
        `Strong correlation between customer impact level and processing speed`,
        `Process mining should identify customer impact as a priority factor`
      ]
    });
  }

  // Pattern 8: Sprint Boundary Delay
  applySprintBoundaryDelay(cases, events) {
    const sprintNumbers = [...new Set(cases.map(c => c.Sprint).filter(s => s))];
    if (sprintNumbers.length === 0) return;

    const affectedSprint = faker.helpers.arrayElement(sprintNumbers);
    const sprintCaseIds = cases.filter(c => c.Sprint === affectedSprint).map(c => c._id);

    // Add delays to cases near sprint boundaries (simulate sprint planning overhead)
    events.forEach(event => {
      if (sprintCaseIds.includes(event.TicketId) && 
          ['Ready for Work', 'In Progress', 'Sprint Planning'].includes(event.EventType)) {
        const currentDate = new Date(event.Date);
        const sprintDelay = faker.number.int({ min: 2, max: 5 });
        currentDate.setDate(currentDate.getDate() + sprintDelay);
        event.Date = currentDate.toISOString().replace('T', ' ').substring(0, 23);
      }
    });

    this.addFinding({
      pattern: "Sprint Boundary Delays",
      description: `Cases in sprint "${affectedSprint}" experience 2-5 day delays during sprint transitions due to planning overhead and resource reallocation.`,
      expectedFindings: [
        `Sprint "${affectedSprint}" cases have longer cycle times`,
        `Delays concentrated around sprint planning activities`,
        `Sprint boundary effects visible in temporal analysis`,
        `Process mining should identify sprint-related bottlenecks`
      ]
    });
  }

  // Pattern 9: Incident Correlation
  applyIncidentCorrelation(cases, events) {
    const incidentCases = cases.filter(c => 
      c.Incident === 'Yes' || c.Type === 'Incident'
    ).map(c => c._id);

    if (incidentCases.length === 0) return;

    const urgentStates = ['Hotfix', 'Ready for Production', 'Released'];
    const newEvents = [];

    // Add urgent workflow states for incident cases
    incidentCases.forEach(caseId => {
      if (Math.random() < 0.7) { // 70% of incidents get urgent workflow
        const caseEvents = events.filter(e => e.TicketId === caseId).sort((a, b) => new Date(a.Date) - new Date(b.Date));
        
        if (caseEvents.length > 1) {
          const insertPoint = Math.floor(caseEvents.length * 0.8);
          const baseDate = new Date(caseEvents[insertPoint].Date);
          
          const urgentEvent = {
            ...caseEvents[insertPoint],
            ID: events.length + newEvents.length + 1,
            _id: events.length + newEvents.length + 1,
            EventType: faker.helpers.arrayElement(urgentStates),
            Date: new Date(baseDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 23)
          };
          newEvents.push(urgentEvent);
        }
      }
    });

    events.push(...newEvents);

    this.addFinding({
      pattern: "Incident Response Workflow",
      description: `Incident-related cases follow expedited workflows with 70% including urgent states (${urgentStates.join(', ')}) and compressed timelines.`,
      expectedFindings: [
        `Incident cases have different workflow patterns than regular cases`,
        `Higher frequency of urgent states: ${urgentStates.join(', ')}`,
        `Incident cases show compressed processing times`,
        `Process mining should identify distinct incident response processes`
      ]
    });
  }

  // Pattern 10: Environment Dependency
  applyEnvironmentDependency(cases, events) {
    const prodCases = cases.filter(c => 
      c.CustomerEnvironment === 'Production' || c.CustomerEnvironment === 'Prod'
    ).map(c => c._id);

    if (prodCases.length === 0) return;

    const approvalStates = ['PO Review', 'QE Review', 'UAT', 'Ready for Production'];
    const newEvents = [];

    // Add extra approval steps for production cases
    prodCases.forEach(caseId => {
      if (Math.random() < 0.9) { // 90% of prod cases need extra approvals
        const caseEvents = events.filter(e => e.TicketId === caseId).sort((a, b) => new Date(a.Date) - new Date(b.Date));
        const extraApprovals = faker.number.int({ min: 1, max: 2 });
        
        if (caseEvents.length > 2) {
          const insertPoint = Math.floor(caseEvents.length * 0.6);
          const baseDate = new Date(caseEvents[insertPoint].Date);
          
          for (let i = 0; i < extraApprovals; i++) {
            const approvalEvent = {
              ...caseEvents[insertPoint],
              ID: events.length + newEvents.length + 1,
              _id: events.length + newEvents.length + 1,
              EventType: faker.helpers.arrayElement(approvalStates),
              Date: new Date(baseDate.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 23)
            };
            newEvents.push(approvalEvent);
          }
        }
      }
    });

    events.push(...newEvents);

    this.addFinding({
      pattern: "Production Environment Controls",
      description: `Production environment cases require 90% more approval steps (${approvalStates.join(', ')}) due to change control procedures.`,
      expectedFindings: [
        `Production cases have longer cycle times due to approvals`,
        `Higher frequency of approval states: ${approvalStates.join(', ')}`,
        `Environment type correlates with workflow complexity`,
        `Process mining should identify environment-based process variations`
      ]
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

    // Add delays to seasonal cases due to reduced capacity
    events.forEach(event => {
      if (seasonalCaseIds.includes(event.TicketId)) {
        const currentDate = new Date(event.Date);
        const seasonalDelay = faker.number.int({ min: 3, max: 7 });
        currentDate.setDate(currentDate.getDate() + seasonalDelay);
        event.Date = currentDate.toISOString().replace('T', ' ').substring(0, 23);
      }
    });

    this.addFinding({
      pattern: "Seasonal Workload Impact",
      description: `Cases submitted during holiday season (Nov-Jan) experience 3-7 day delays due to reduced team capacity and vacation schedules.`,
      expectedFindings: [
        `Cases created in Nov-Jan have longer processing times`,
        `Seasonal patterns visible in monthly performance analysis`,
        `Holiday periods show systematic processing delays`,
        `Process mining should identify temporal/seasonal bottlenecks`
      ]
    });
  }

  // Pattern 12: Handoff Bottleneck
  applyHandoffBottleneck(cases, events) {
    const actors = [...new Set(events.map(e => e.Actor).filter(a => a))];
    if (actors.length < 3) return;

    const bottleneckActor = faker.helpers.arrayElement(actors);
    const handoffDelay = faker.number.int({ min: 2, max: 4 });

    // Add delays when work is handed off to the bottleneck actor
    events.forEach(event => {
      if (event.Actor === bottleneckActor) {
        const currentDate = new Date(event.Date);
        currentDate.setDate(currentDate.getDate() + handoffDelay);
        event.Date = currentDate.toISOString().replace('T', ' ').substring(0, 23);
      }
    });

    this.addFinding({
      pattern: "Actor Handoff Bottleneck",
      description: `Work handed off to actor "${bottleneckActor}" experiences ${handoffDelay} day delays, indicating capacity constraints or skill gaps.`,
      expectedFindings: [
        `Events involving actor "${bottleneckActor}" have longer wait times`,
        `Handoff delays concentrated around specific actor`,
        `Actor "${bottleneckActor}" should appear as a resource bottleneck`,
        `Process mining should identify actor-specific performance issues`
      ]
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
    
    await writeFile(`out/easter_eggs/hidden_patterns_${timestamp}.txt`, content);
    console.log(`\n🥚 Easter eggs documented in: out/easter_eggs/hidden_patterns_${timestamp}.txt`);
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