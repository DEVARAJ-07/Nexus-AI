// Shared in-memory documents store
const mockDocuments = [
  { id: "log-1", name: "startnode_missing_script.log", fileUrl: "/uploads/mock-1.log", status: "READY", createdAt: new Date() },
  { id: "log-2", name: "typescript_type_error.log", fileUrl: "/uploads/mock-2.log", status: "READY", createdAt: new Date() },
  { id: "log-3", name: "supabase_pool_timeout.log", fileUrl: "/uploads/mock-3.log", status: "READY", createdAt: new Date() }
];

module.exports = mockDocuments;
