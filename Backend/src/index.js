// here path is first index.js --> DB connection --> app initliazation --> router -->
import {connectDB} from "./db/index.js"
import {app} from "./app.js"
import dotenv from 'dotenv';
import { Server as SocketIOServer } from "socket.io";
import http from "http";



dotenv.config({
    path: './env'
})


// creating a http server
const server = http.createServer(app)
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', "POST"]
    }
});


connectDB()
.then(() => {
    server.listen(process.env.PORT || 3000, () => {
        console.log(`server is listening on port : ${process.env.PORT || 3000}`)
    })
})
.catch((error) => {
    console.error("MongoDB connection failed!  : " + error)
})




const activeRooms = {};

// Helper: pick the socket ID of the member who has been in the room the longest.
// The oldest member is guaranteed to already hold the session key (they received it
// via PKI handshake when they first joined), so they are the safest choice for host.
function getOldestMember(roomId) {
    const users = activeRooms[roomId].users;
    return Object.keys(users).reduce((oldestId, currentId) => {
        return users[currentId].joinedAt < users[oldestId].joinedAt ? currentId : oldestId;
    });
}

io.on('connection', (socket) => {
    // console.log("A user connected");

    socket.on("joinRoom", ({roomId, user, publicKey, isCreating}) => {
        console.log(`[joinRoom] User '${user}' (socket: ${socket.id}) attempting to join room: ${roomId}, isCreating: ${isCreating}`);
        
        if (!activeRooms[roomId]) {
            if (isCreating) {
                console.log(`[joinRoom] Room ${roomId} does not exist. Creating new room with host ${socket.id}`);
                activeRooms[roomId] = { 
                    host: socket.id, 
                    users: {}
                };
            } else {
                console.log(`[joinRoom] Room ${roomId} does not exist and isCreating is false. Rejecting.`);
                socket.emit("room_not_found");
                return;
            }
        }
        
        socket.join(roomId);
        
        if (activeRooms[roomId].host === socket.id) {
            console.log(`[joinRoom] User '${user}' is the host of room ${roomId}`);
            // First user becomes host — record join time
            activeRooms[roomId].users[socket.id] = { user, publicKey, joinedAt: Date.now() };
            socket.emit("you_are_host");
            socket.to(roomId).emit("userJoin", user);
            io.to(roomId).emit("host_update", user);
        } else {
            console.log(`[joinRoom] Room ${roomId} already exists. Host is ${activeRooms[roomId].host}`);
            console.log(`[joinRoom] Room ${roomId} allows direct join. Adding user '${user}'.`);
            // Record join time — used for oldest-member host selection on reassignment
            activeRooms[roomId].users[socket.id] = { user, publicKey, joinedAt: Date.now() };
            // Tell host a new user joined so they can send the session key
            console.log(`[joinRoom] Notifying host ${activeRooms[roomId].host} about new user '${user}'`);
            io.to(activeRooms[roomId].host).emit("newUserJoined", {
                targetSocketId: socket.id,
                publicKey,
                user
            });
            socket.to(roomId).emit("userJoin", user);
            const currentHostUser = activeRooms[roomId].users[activeRooms[roomId].host]?.user;
            if(currentHostUser) io.to(roomId).emit("host_update", currentHostUser);
        }
    });



    socket.on("send_session_key", ({ targetSocketId, encryptedSessionKey }) => {
        console.log(`[send_session_key] Sending session key to ${targetSocketId}`);
        io.to(targetSocketId).emit("receive_session_key", encryptedSessionKey);
    });

    socket.on("send_location", (payload) => {
        const {locationData, roomId} = payload;
        console.log("location data ", locationData)
        socket.to(roomId).emit("receive_location", locationData);
    });

    socket.on("leaveRoom", ({roomId, user}) => {
        console.log(`[leaveRoom] User '${user}' (socket: ${socket.id}) leaving room: ${roomId}`);
        socket.leave(roomId);
        socket.to(roomId).emit("userLeave", user);

        if (activeRooms[roomId]) {
            if (activeRooms[roomId].users[socket.id]) {
                delete activeRooms[roomId].users[socket.id];
                
                // Reassign host if the host leaves.
                // We always pick the OLDEST member (smallest joinedAt) because
                // they've been in the room the longest and are guaranteed to hold
                // the session key from their original PKI handshake.
                if (activeRooms[roomId].host === socket.id) {
                    const remainingUsers = Object.keys(activeRooms[roomId].users);
                    if (remainingUsers.length > 0) {
                        const newHostId = getOldestMember(roomId);
                        activeRooms[roomId].host = newHostId;
                        const newHostUser = activeRooms[roomId].users[newHostId]?.user;
                        console.log(`[leaveRoom] Host left. Reassigned host to oldest member: '${newHostUser}' (${newHostId})`);
                        io.to(newHostId).emit("you_are_host");
                        if(newHostUser) io.to(roomId).emit("host_update", newHostUser);
                    } else {
                        console.log(`[leaveRoom] Room ${roomId} is now empty. Deleting room.`);
                        delete activeRooms[roomId];
                    }
                }
            }
        }
    });

    socket.on("send_message", (payload) => {
        const {roomId, data} = payload;
        socket.to(roomId).emit("receive_message", data);
    });

    socket.on('disconnect', () => {
        console.log(`[disconnect] Socket disconnected: ${socket.id}`);
        // Cleanup activeRooms on disconnect
        for (const roomId in activeRooms) {
            if (activeRooms[roomId].users[socket.id]) {
                const user = activeRooms[roomId].users[socket.id].user;
                console.log(`[disconnect] Removing user '${user}' from room ${roomId}`);
                socket.to(roomId).emit("userLeave", user);
                delete activeRooms[roomId].users[socket.id];
                
                if (activeRooms[roomId].host === socket.id) {
                    const remainingUsers = Object.keys(activeRooms[roomId].users);
                    if (remainingUsers.length > 0) {
                        // Same as leaveRoom: pick oldest member so they definitely have the session key
                        const newHostId = getOldestMember(roomId);
                        activeRooms[roomId].host = newHostId;
                        const newHostUser = activeRooms[roomId].users[newHostId]?.user;
                        console.log(`[disconnect] Host disconnected. Reassigned host to oldest member: '${newHostUser}' (${newHostId})`);
                        io.to(newHostId).emit("you_are_host");
                        if(newHostUser) io.to(roomId).emit("host_update", newHostUser);
                    } else {
                        console.log(`[disconnect] Room ${roomId} is now empty due to disconnect. Deleting room.`);
                        delete activeRooms[roomId];
                    }
                }
            }
        }
    });
});



