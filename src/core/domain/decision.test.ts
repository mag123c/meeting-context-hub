import { describe, it, expect } from 'vitest';
import { createDecision } from './decision.js';

describe('createDecision', () => {
  it('should create a decision with required fields', () => {
    const decision = createDecision('ctx-1', 'Use REST API');

    expect(decision.id).toBeDefined();
    expect(decision.contextId).toBe('ctx-1');
    expect(decision.content).toBe('Use REST API');
    expect(decision.projectId).toBeNull();
    expect(decision.status).toBe('active');
    expect(decision.supersededBy).toBeNull();
    expect(decision.createdAt).toBeInstanceOf(Date);
    expect(decision.updatedAt).toBeInstanceOf(Date);
    expect(decision.createdAt).toEqual(decision.updatedAt);
  });

  it('should create a decision with projectId', () => {
    const decision = createDecision('ctx-1', 'Use REST API', 'proj-1');

    expect(decision.projectId).toBe('proj-1');
  });

  it('should create a decision with custom status', () => {
    const decision = createDecision('ctx-1', 'Use REST API', null, 'pending');

    expect(decision.status).toBe('pending');
  });

  it('should create a decision with custom createdAt', () => {
    const date = new Date('2024-06-15');
    const decision = createDecision('ctx-1', 'Use REST API', null, 'active', date);

    expect(decision.createdAt).toEqual(date);
    expect(decision.updatedAt).toEqual(date);
  });

  it('should generate unique IDs', () => {
    const d1 = createDecision('ctx-1', 'Decision 1');
    const d2 = createDecision('ctx-1', 'Decision 2');

    expect(d1.id).not.toBe(d2.id);
  });
});
