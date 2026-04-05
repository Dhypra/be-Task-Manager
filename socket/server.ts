import { Server } from "socket.io";
import http from "http";
const server = http.createServer();


const io = new Server(server, {
  cors: {
    origin: "https://your-frontend.vercel.app",
  },
});

io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected", +socket.id);
  });
});

export default io;
