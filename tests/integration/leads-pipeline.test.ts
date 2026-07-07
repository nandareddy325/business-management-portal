// Integration test — leads pipeline stage transitions
// TODO: implement once test runner is set up
// Covers: New Lead → RNR → Follow-up → Site Visit → Quotation → Won/Lost
// Critical because a bug here silently loses real leads

describe('Leads Pipeline', () => {
  it.todo('should move lead from new to followup stage')
  it.todo('should not allow invalid stage transitions')
  it.todo('should update stage counts correctly after transition')
})
