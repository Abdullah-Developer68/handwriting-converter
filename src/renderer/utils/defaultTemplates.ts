import { SampleTemplate } from '../types';

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'physics-lecture',
    title: 'Physics & Calculus Lecture Notes',
    description: 'Detailed university lecture notes with headings, equations, bullet points, and definitions.',
    category: 'Education',
    recommendedSettings: {
      font: 'Caveat',
      paperType: 'college',
      inkColor: '#1e3a8a',
      fontSize: 20,
      lineHeight: 32,
      jitter: 'subtle',
      showMarginLine: true,
      showHoles: true,
    },
    markdown: `# Physics 201: Classical Mechanics & Energy

**Date:** October 14, 2026  
**Instructor:** Prof. Eleanor Vance  
**Topic:** Conservation of Mechanical Energy & Harmonic Motion

---

## 1. Key Principles

The total mechanical energy in an isolated system remains constant over time when only conservative forces act upon it:

> **Mechanical Energy Theorem:**  
> E_total = Kinetic Energy (K) + Potential Energy (U) = Constant  
> ΔE = ΔK + ΔU = 0

### Kinetic & Gravitational Potential Energy
- **Kinetic Energy:** K = (1/2) * m * v²
- **Gravitational Potential Energy:** U_g = m * g * h
- **Elastic Potential Energy (Spring):** U_s = (1/2) * k * x²

---

## 2. Simple Harmonic Oscillator

Consider a mass *m* attached to an ideal spring with spring constant *k*:

1. **Restoring Force (Hooke's Law):** F = -k * x
2. **Equation of Motion:** d²x/dt² + (k/m) * x = 0
3. **Angular Frequency (ω):** ω = √(k / m)
4. **Period of Oscillation (T):** T = 2π / ω = 2π * √(m / k)

### Observations from Lab:
- Max velocity occurs at the equilibrium position (x = 0).
- Max acceleration occurs at the turning points (x = ±A).
- System demonstrates zero energy dissipation when air resistance is negligible.

---

## 3. Assignment Checklist
- [x] Complete problem set #4 (Questions 1 through 8)
- [x] Verify spring calibration data in Python script
- [ ] Submit lab report on damping coefficients before Friday 5:00 PM
`,
  },
  {
    id: 'executive-meeting',
    title: 'Quarterly Executive Meeting Minutes',
    description: 'Clean business notes with action items, decisions, and strategic goals.',
    category: 'Business',
    recommendedSettings: {
      font: 'Patrick Hand',
      paperType: 'ruled',
      inkColor: '#0f172a',
      fontSize: 18,
      lineHeight: 30,
      jitter: 'none',
      showMarginLine: true,
      showHoles: false,
    },
    markdown: `# Q3 Product Strategy & Roadmap Sync

**Date:** September 22, 2026  
**Attendees:** Sarah (Product), David (Engineering), Maya (Design), Alex (Marketing)

---

## Executive Summary
Discussed release milestones for the mobile redesign, enterprise cloud migration, and key customer satisfaction metrics.

### Key Decisions Made:
- **Scope Lock:** Freezing feature requests for v2.4 by next Tuesday.
- **Infrastructure:** Approved cloud database migration window for late October.
- **Design Review:** Shifted focus to accessibility improvements (WCAG AA).

---

## Action Items & Ownership

| Task | Owner | Priority | Target Date |
| :--- | :---: | :---: | :--- |
| Finalize onboarding wireframes | Maya | High | Oct 2 |
| Load test payments pipeline | David | High | Oct 5 |
| Draft announcement newsletter | Alex | Medium | Oct 8 |
| Final QA regression pass | Sarah | Critical | Oct 12 |

---

## Notes & Open Questions
- What is our fallback plan if payment API latency exceeds 200ms?
- Marketing requested 2 preview demo videos for partner launch.
`,
  },
  {
    id: 'daily-journal',
    title: 'Daily Reflection & Gratitude',
    description: 'Introspective journal entry with thoughts, reflections, and morning routine.',
    category: 'Personal',
    recommendedSettings: {
      font: 'Homemade Apple',
      paperType: 'parchment',
      inkColor: '#172554',
      fontSize: 19,
      lineHeight: 34,
      jitter: 'subtle',
      showMarginLine: false,
      showHoles: false,
    },
    markdown: `# Morning Reflection & Gratitude

**Date:** A crisp autumn morning  
**Mood:** Peaceful & Focused

---

## Three Things I am Grateful For:
1. The quiet golden sunrise streaming through my window.
2. A warm mug of freshly ground dark roast coffee.
3. The clarity that comes after working through a complex challenge.

---

## Daily Thoughts:
*"Simplicity is the prerequisite for reliability."*

Today I want to focus my energy strictly on what matters most. It is easy to get caught up in endless micro-tasks, but deep uninterrupted work is where genuine breakthroughs happen.

### Intentions for Today:
- Walk 30 minutes in nature without checking phone notifications.
- Finish writing chapter 3 of the draft manuscript.
- Call mom in the evening to catch up.
`,
  },
  {
    id: 'creative-recipe',
    title: 'Artisan Sourdough Bread Recipe',
    description: 'Rustic handwritten recipe card with ingredients, steps, and baker tips.',
    category: 'Culinary',
    recommendedSettings: {
      font: 'Indie Flower',
      paperType: 'legal',
      inkColor: '#374151',
      fontSize: 19,
      lineHeight: 32,
      jitter: 'subtle',
      showMarginLine: true,
      showHoles: false,
    },
    markdown: `# Nonna's Artisan Sourdough Boule

**Prep Time:** 24 Hours (fermentation) | **Bake Time:** 45 mins | **Yield:** 1 Loaf

---

## Ingredients:
- **Bread Flour (Unbleached):** 450g
- **Whole Wheat Flour:** 50g
- **Active Sourdough Starter:** 100g (fed 4-6 hrs prior)
- **Filtered Water (lukewarm):** 350g (70% hydration)
- **Fine Sea Salt:** 10g

---

## Method & Step-by-Step:

### 1. Autolyse (1 Hour)
Mix flours and 325g water until no dry pockets remain. Cover with a damp towel and rest for 60 minutes.

### 2. Inoculation & Salt
Add the active starter and remaining 25g water with salt. Pinch and fold until completely incorporated.

### 3. Bulk Fermentation & Stretch-and-Folds
- Perform 4 sets of stretch-and-folds every 30 minutes over 2 hours.
- Let dough rise at room temperature until increased in volume by ~50%.

### 4. Cold Retard & Baking
- Shape into a tight boule and place in a banneton dusted with rice flour.
- Ferment in refrigerator overnight (12 to 16 hours).
- Preheat Dutch oven at 230°C (450°F) for 45 mins.
- Score top with a razor blade and bake covered for 25 mins, then uncovered for 20 mins until deep mahogany brown!
`,
  },
  {
    id: 'engineering-todo',
    title: 'Engineering Sprint & Architecture',
    description: 'Technical notes with code snippets, architecture breakdown, and checklist.',
    category: 'Engineering',
    recommendedSettings: {
      font: 'Architects Daughter',
      paperType: 'grid',
      inkColor: '#111827',
      fontSize: 18,
      lineHeight: 30,
      jitter: 'none',
      showMarginLine: true,
      showHoles: true,
    },
    markdown: `# Microservices Event Bus Architecture

**Project:** Titan Data Pipeline  
**Version:** 3.1.0  
**Lead:** Systems Engineering Team

---

## High-Level Topology

1. **Ingestion Layer:** Edge proxies ingest telemetry payloads over WebSocket.
2. **Buffer Queue:** Apache Kafka cluster partitioned by \`tenant_id\`.
3. **Stream Processor:** Stateless workers parse, validate, and enrich event metadata.
4. **Cold Storage:** Parquet files partitioned by year/month/day in S3.

\`\`\`typescript
interface TelemetryPayload {
  tenantId: string;
  timestamp: number;
  metricName: string;
  value: number;
  tags: Record<string, string>;
}
\`\`\`

---

## Implementation Milestones
- [x] Deploy staging Kafka cluster with 3 brokers
- [x] Implement backpressure throttling on ingestion gateway
- [ ] Benchmark query throughput under 100k events/sec load
- [ ] Configure Prometheus alerting rules for consumer lag > 5000
`,
  },
];
