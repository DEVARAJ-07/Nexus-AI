const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Socket connection established: ${socket.id}`);

  // Mock socket events for real-time dashboard notification
  socket.on("join-workspace", (workspaceId) => {
    socket.join(workspaceId);
    console.log(`Client ${socket.id} joined room workspace:${workspaceId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket connection closed: ${socket.id}`);
  });
});

// Attach socket reference to app for use in routes
app.set("io", io);

server.listen(env.PORT, () => {
  console.log(`API Server listening on port ${env.PORT}`);
});
