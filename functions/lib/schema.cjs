const COLLECTIONS = {
  users: 'users', workspaces: 'workspaces',
  brandProfile: (id) => `workspaces/${id}/brandProfile/main`, socialConnections: (id) => `workspaces/${id}/socialConnections`,
  contentItems: (id) => `workspaces/${id}/contentItems`, publishingJobs: (id) => `workspaces/${id}/publishingJobs`,
  usageCounters: (id) => `workspaces/${id}/usageCounters`, assets: (id) => `workspaces/${id}/assets`, campaigns: (id) => `workspaces/${id}/campaigns`,
  leads: (id) => `workspaces/${id}/leads`, emailContacts: (id) => `workspaces/${id}/emailContacts`, emailCampaigns: (id) => `workspaces/${id}/emailCampaigns`,
  assistantThreads: (id) => `workspaces/${id}/assistantThreads`, members: (id) => `workspaces/${id}/members`, organizations: 'organizations', auditLogs: 'auditLogs',
};
module.exports = COLLECTIONS;
