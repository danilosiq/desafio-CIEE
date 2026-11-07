import { seedAreas, seedCandidates } from '../../src/infra/database/SeedData';
it('defines exactly 30 distinct areas with names and descriptions', () => {
    expect(seedAreas).toHaveLength(30);
    expect(new Set(seedAreas.map(area => area.name.trim().toLowerCase())).size).toBe(30);
    expect(seedAreas.every(area => area.name.trim() && area.description.trim())).toBe(true);
});
it('defines exactly 60 fictitious candidates with stable, distinct emails', () => {
    expect(seedCandidates).toHaveLength(60);
    expect(new Set(seedCandidates.map(candidate => candidate.email)).size).toBe(60);
    expect(seedCandidates.every(candidate => candidate.fullName.trim() && candidate.email.endsWith('@example.com'))).toBe(true);
});
it('uses an existing seed area for every candidate', () => {
    expect(seedCandidates).toHaveLength(60);
    const names = new Set(seedAreas.map(area => area.name));
    expect(seedCandidates.every(candidate => names.has(candidate.areaOfExpertise!))).toBe(true);
});
