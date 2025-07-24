// Helper methods for Easter Egg pattern analysis and detection

class EasterEggHelpers {
  constructor(minSampleSize = 5) {
    this.minSampleSize = minSampleSize;
  }



  // Find common event type sequences across all cases
  findCommonSequences(events, minOccurrences = null) {
    const minCount = minOccurrences || this.minSampleSize;
    const sequences = new Map();
    const caseEvents = new Map();

    // Group events by case
    events.forEach(event => {
      if (!caseEvents.has(event.TicketId)) {
        caseEvents.set(event.TicketId, []);
      }
      caseEvents.get(event.TicketId).push(event);
    });

    // Find sequences in each case
    caseEvents.forEach(caseEventList => {
      caseEventList.sort((a, b) => new Date(a.Date) - new Date(b.Date));
      
      for (let i = 0; i < caseEventList.length - 1; i++) {
        const from = caseEventList[i].EventType;
        const to = caseEventList[i + 1].EventType;
        const seqKey = `${from}->${to}`;
        
        sequences.set(seqKey, (sequences.get(seqKey) || 0) + 1);
      }
    });

    // Return sequences that occur at least minCount times
    return Array.from(sequences.entries())
      .filter(([seq, count]) => count >= minCount)
      .map(([seq, count]) => {
        const [from, to] = seq.split('->');
        return { from, to, count };
      });
  }

  // Find cases that contain a specific sequence
  findCasesWithSequence(events, sequence) {
    const caseEvents = new Map();
    const matchingCases = new Set();

    // Group events by case
    events.forEach(event => {
      if (!caseEvents.has(event.TicketId)) {
        caseEvents.set(event.TicketId, []);
      }
      caseEvents.get(event.TicketId).push(event);
    });

    // Check each case for the sequence
    caseEvents.forEach((caseEventList, caseId) => {
      // Filter out events with invalid dates and sort
      const validEvents = caseEventList.filter(e => e.Date && !isNaN(new Date(e.Date).getTime()));
      if (validEvents.length < 2) return; // Need at least 2 events for a sequence
      
      validEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));
      
      for (let i = 0; i < validEvents.length - 1; i++) {
        if (validEvents[i].EventType == sequence.from && 
            validEvents[i + 1].EventType == sequence.to) {
          matchingCases.add(caseId);
          break;
        }
      }
    });

    return Array.from(matchingCases);
  }

  // Find cases with rework patterns (backward transitions)
  findReworkCases(events) {
    const caseEvents = new Map();
    const reworkCases = new Set();

    // Group events by case
    events.forEach(event => {
      if (!caseEvents.has(event.TicketId)) {
        caseEvents.set(event.TicketId, []);
      }
      caseEvents.get(event.TicketId).push(event);
    });

    // Check each case for rework patterns
    caseEvents.forEach((caseEventList, caseId) => {
      caseEventList.sort((a, b) => new Date(a.Date) - new Date(b.Date));
      
      for (let i = 0; i < caseEventList.length - 1; i++) {
        const current = caseEventList[i].EventType;
        const next = caseEventList[i + 1].EventType;
        
        // Check for rework patterns (backward transitions)
        const isRework = this.isBackwardTransition(current, next);
        if (isRework) {
          reworkCases.add(caseId);
          break;
        }
      }
    });

    return Array.from(reworkCases);
  }

  // Check if a transition represents rework (backward movement in workflow)
  isBackwardTransition(current, next) {
    // Define workflow progression levels (higher number = more advanced state)
    const stateProgression = {
      'Open': 1,
      'Submitted': 1,
      'To Do': 1,
      'Backlog': 1,
      'Ready for Work': 2,
      'In Progress': 3,
      'Under Review': 4,
      'In Review': 4,
      'Code Review': 4,
      'QE Review': 4,
      'PO Review': 4,
      'Testing': 4,
      'In Testing': 4,
      'Done': 5,
      'Resolved': 5,
      'Closed': 6,
      'Completed': 6
    };

    const currentLevel = stateProgression[current] || 0;
    const nextLevel = stateProgression[next] || 0;

    // Rework occurs when moving from a higher level to a lower level
    // Allow for some flexibility (difference of 2+ levels indicates clear rework)
    return currentLevel > nextLevel && (currentLevel - nextLevel) >= 2;
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

  // Analyze seasonal distribution with streaming
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

  // Utility method to extend case timeline systematically (DB-safe version)
  extendCaseTimeline(caseEvents, multiplier) {
    if (caseEvents.length <= 1) return 0;

    // Sort events by date
    caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    const startTime = new Date(caseEvents[0].Date);
    const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
    
    // Validate input dates
    if (isNaN(startTime.getTime()) || isNaN(originalEndTime.getTime())) {
      return 0; // Skip if original dates are invalid
    }
    
    const originalDuration = originalEndTime - startTime;
    
    // Prevent negative or zero durations
    if (originalDuration <= 0) {
      return 0; // Skip if duration is invalid
    }
    
    // Cap the extension to prevent date overflow (max 1 year extension)
    const maxExtension = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    const safeDuration = Math.min(originalDuration * multiplier, maxExtension);
    const newDuration = safeDuration;

    let eventsModified = 0;
    const minIntervalMs = 60000; // Minimum 1 minute between events to avoid timestamp collisions

    // Redistribute events across extended timeline with safety checks
    caseEvents.forEach((event, idx) => {
      if (idx === 0) return; // Keep start time unchanged

      const progress = idx / (caseEvents.length - 1);
      let newTime = new Date(startTime.getTime() + (newDuration * progress));
      
      // Ensure minimum interval between consecutive events
      if (idx > 1) {
        const previousEventTime = new Date(caseEvents[idx - 1].Date);
        const minNextTime = new Date(previousEventTime.getTime() + minIntervalMs);
        if (newTime < minNextTime) {
          newTime = minNextTime;
        }
      }

      // Ensure we don't exceed reasonable date bounds (stay within 5 years of original)
      const maxAllowedTime = new Date(startTime.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));
      if (newTime > maxAllowedTime) {
        newTime = maxAllowedTime;
      }

      // Validate the date before formatting
      if (isNaN(newTime.getTime())) {
        // Skip this event if date is invalid (silently)
        return; // Continue to next event
      }

      // Format with microseconds to reduce collision probability
      const timestamp = newTime.toISOString().replace('T', ' ').substring(0, 23);
      const microseconds = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      event.Date = `${timestamp}.${microseconds}`;
      eventsModified++;
    });

    return eventsModified;
  }

  // Utility method to compress case timeline systematically (DB-safe version)
  compressCaseTimeline(caseEvents, speedupFactor) {
    if (caseEvents.length <= 1) return 0;

    // Sort events by date
    caseEvents.sort((a, b) => new Date(a.Date) - new Date(b.Date));

    const startTime = new Date(caseEvents[0].Date);
    const originalEndTime = new Date(caseEvents[caseEvents.length - 1].Date);
    
    // Validate input dates
    if (isNaN(startTime.getTime()) || isNaN(originalEndTime.getTime())) {
      return 0; // Skip if original dates are invalid
    }
    
    const originalDuration = originalEndTime - startTime;
    
    // Prevent negative or zero durations
    if (originalDuration <= 0) {
      return 0; // Skip if duration is invalid
    }
    
    const newDuration = originalDuration * speedupFactor; // Compress timeline

    let eventsModified = 0;
    const minIntervalMs = 60000; // Minimum 1 minute between events to avoid timestamp collisions

    // Redistribute events across compressed timeline with safety checks
    caseEvents.forEach((event, idx) => {
      if (idx === 0) return; // Keep start time unchanged

      const progress = idx / (caseEvents.length - 1);
      let newTime = new Date(startTime.getTime() + (newDuration * progress));
      
      // Ensure minimum interval between consecutive events
      if (idx > 1) {
        const previousEventTime = new Date(caseEvents[idx - 1].Date);
        const minNextTime = new Date(previousEventTime.getTime() + minIntervalMs);
        if (newTime < minNextTime) {
          newTime = minNextTime;
        }
      }

      // Validate the date before formatting
      if (isNaN(newTime.getTime())) {
        // Skip this event if date is invalid (silently)
        return; // Continue to next event
      }

      // Format with microseconds to reduce collision probability
      const timestamp = newTime.toISOString().replace('T', ' ').substring(0, 23);
      const microseconds = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      event.Date = `${timestamp}.${microseconds}`;
      eventsModified++;
    });

    return eventsModified;
  }
}

module.exports = { EasterEggHelpers };