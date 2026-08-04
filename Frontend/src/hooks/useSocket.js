// useSocket.js
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import { setMessage, removeMessage, updateGroup, setWaitlist, setIsWaiting, setIsHost, setHostName } from '../features/locationSlice.js';
import { decryptData, setSessionKey, getSessionKey } from '../utils/crypto.js';
import { generateRSAKeyPair, encryptWithPublicKey, decryptWithPrivateKey } from '../utils/asymmetricCrypto.js';

import { SERVER_URL } from '../config.js';
import { popupData, popupVisFunc } from '../features/visibilitySlice.js';

let socketInstance = null;
let staticSocketRef = { current: null };
let myKeysInstance = null;
let listenersAttached = false;

export function useSocket() {
  const dispatch = useDispatch();

  if (!socketInstance) {
    socketInstance = io(SERVER_URL);
    staticSocketRef.current = socketInstance;
  }

  useEffect(() => {
    if (listenersAttached) return;
    listenersAttached = true;

    socketInstance.on('connect', () => {
      // console.log("A User Connected");
    });

    socketInstance.on("receive_location", (encryptedData) => {
      try {
        const data = decryptData(encryptedData); // Decrypt the data
        dispatch(updateGroup(data));
      } catch (error) {
          console.error("Decryption failed:", error); 
      }
    });

    socketInstance.on("receive_message", (encryptedData) => {
      try {
        const data = decryptData(encryptedData);
        console.log(data);
        const msgId = Date.now() + Math.random();
        dispatch(setMessage({ ...data, id: msgId }));
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          dispatch(removeMessage(msgId));
        }, 10000);
        
        dispatch(popupData({ message: `New message from ${data.name}`, color: "blue" }));
        dispatch(popupVisFunc());
        setTimeout(() => {
          dispatch(popupVisFunc());
        }, 3000);
      } catch (error) {
        console.error("Message decryption failed:", error); 
      }
    });

    // PKI Handshake Events
    socketInstance.on("you_are_host", () => {
       // NOTE: We only set the isHost flag here.
       // The AES session key is generated ONCE at group creation time (in GroupSetup.jsx)
       // and must NOT be regenerated here — this event also fires on host reassignment
       // (when the original host leaves), and regenerating would break encryption for
       // all existing members who still hold the original session key.
       console.log("I am the host!");
       dispatch(setIsHost(true));
    });

    socketInstance.on("host_update", (hostName) => {
       dispatch(setHostName(hostName));
    });

    socketInstance.on("newUserJoined", async ({ targetSocketId, publicKey, user }) => {
       console.log(`${user} joined. Encrypting Session Key for them.`);
       const sessionKey = getSessionKey();
       if (sessionKey) {
          const encryptedSessionKey = await encryptWithPublicKey(publicKey, sessionKey);
          socketInstance.emit("send_session_key", { targetSocketId, encryptedSessionKey });
       } else {
          // This should never happen if the host was assigned correctly (oldest member).
          // If it does, the joiner will be stuck without a key — log loudly.
          console.error(
            `[CRITICAL] newUserJoined: I am the host but have NO session key! ` +
            `Cannot send key to ${user} (${targetSocketId}). ` +
            `This means host state was lost. User should rejoin.`
          );
       }
    });

    socketInstance.on("receive_session_key", async (encryptedSessionKey) => {
       console.log("Received Encrypted Session Key. Decrypting...");
       if (myKeysInstance) {
         try {
           const sessionKey = await decryptWithPrivateKey(myKeysInstance.privateKey, encryptedSessionKey);
           setSessionKey(sessionKey);
           console.log("Session Key Decrypted & Set successfully.");
         } catch(e) {
           console.error("Failed to decrypt session key:", e);
         }
       }
    });

  }, [dispatch]);

  const joinRoom = async (roomId, user) => {
    // Generate RSA keys for this session
    if (!myKeysInstance) {
      myKeysInstance = await generateRSAKeyPair();
    }

    socketInstance.emit("joinRoom", {
      roomId, 
      user,
      publicKey: myKeysInstance.publicKeyJwk
    });
  };

  const leaveRoom = (roomId, user) => {
    socketInstance.emit("leaveRoom", {
      roomId, 
      user
    });
    // console.log("leaveRoom function called successfully");
  };



  return {
    joinRoom,
    leaveRoom,
    socketRef: staticSocketRef
  };
}
