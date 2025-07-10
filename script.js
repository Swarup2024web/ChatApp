// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC6RGtYZrzEM46FzHUevwARbSlrpB7wsVQ",
  authDomain: "ghostchat-5d3a2.firebaseapp.com",
  projectId: "ghostchat-5d3a2",
  storageBucket: "ghostchat-5d3a2.firebasestorage.app",
  messagingSenderId: "451634414870",
  appId: "1:451634414870:web:3cf196ea7dc28542d9fc37"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get username from localStorage
const username = localStorage.getItem("username") || "Anonymous";
let currentRoom = "general"; // default room

// Display current user and room
document.getElementById("currentUser").innerText = "You: " + username;
document.getElementById("chatHeader").innerText = currentRoom;

// 🔁 Load messages from Firestore
function listenToRoom(roomName) {
  document.getElementById("chatMessages").innerHTML = "";
  currentRoom = roomName;
  document.getElementById("chatHeader").innerText = roomName;

  db.collection("rooms")
    .doc(roomName)
    .collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const msg = change.doc.data();
          const msgDiv = document.createElement("div");
          msgDiv.classList.add("message");
          msgDiv.classList.add(msg.sender === username ? "sent" : "received");
          msgDiv.textContent = `${msg.sender}: ${msg.text}`;
          document.getElementById("chatMessages").appendChild(msgDiv);

          // Scroll to bottom
          const chatBox = document.getElementById("chatMessages");
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      });
    });
}

// 📤 Send message
function sendMessage() {
  const msgInput = document.getElementById("messageInput");
  const text = msgInput.value.trim();
  if (text === "") return;

  db.collection("rooms")
    .doc(currentRoom)
    .collection("messages")
    .add({
      sender: username,
      text: text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

  msgInput.value = "";
}

// 🏠 Join a different room
function joinRoom(roomName) {
  currentRoom = roomName;
  document.getElementById("chatHeader").innerText = roomName;
  listenToRoom(roomName);
}

// 🟢 Start in default room
listenToRoom(currentRoom);
