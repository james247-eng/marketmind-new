const COLLECTIONS = {
  users: 'users',
  workspaces: 'workspaces',
  brandProfile: (workspaceId) => `workspaces/${workspaceId}/brandProfile/main`,
  socialConnections: (workspaceId) => `workspaces/${workspaceId}/socialConnections`,
  contentItems: (workspaceId) => `workspaces/${workspaceId}/contentItems`,
  publishingJobs: (workspaceId) => `workspaces/${workspaceId}/publishingJobs`,
  usageCounters: (workspaceId) => `workspaces/${workspaceId}/usageCounters`,
  assets: (workspaceId) => `workspaces/${workspaceId}/assets`,
  campaigns: (workspaceId) => `workspaces/${workspaceId}/campaigns`,
  leads: (workspaceId) => `workspaces/${workspaceId}/leads`,
  emailContacts: (workspaceId) => `workspaces/${workspaceId}/emailContacts`,
  emailCampaigns: (workspaceId) => `workspaces/${workspaceId}/emailCampaigns`,
  assistantThreads: (workspaceId) => `workspaces/${workspaceId}/assistantThreads`,
  members: (workspaceId) => `workspaces/${workspaceId}/members`,
  organizations: 'organizations',
  auditLogs: 'auditLogs',
};

export default COLLECTIONS;
