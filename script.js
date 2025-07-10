// ✅ Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC6RGtYZrzEM46FzHUevwARbSlrpB7wsVQ",
  authDomain: "ghostchat-5d3a2.firebaseapp.com",
  projectId: "ghostchat-5d3a2",
  storageBucket: "ghostchat-5d3a2.firebasestorage.app",
  messagingSenderId: "451634414870",
  appId: "1:451634414870:web:3cf196ea7dc28542d9fc37"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ✅ Global Variables
let username = "";
let currentChatType = "group"; // "group" or "private"
let currentRoom = "general";
let currentPrivateUser = null;
let unsubscribe = null;

// ✅ Handle Login
function enterChat() {
  const input = document.getElementById("usernameInput").value.trim();
  if (!input) return alert("Enter a username");
  username = input;
  localStorage.setItem("username", username);

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");

  document.getElementById("currentUser").innerText = "You: " + username;
  setUserOnline();
  listenToOnlineUsers();
  joinRoom("general");
}

// ✅ Track Online Users
function setUserOnline() {
  db.collection("online_users").doc(username).set({
    online: true,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp()
  });

  window.addEventListener("beforeunload", () => {
    db.collection("online_users").doc(username).delete();
  });
}

// ✅ Display Online Users
function listenToOnlineUsers() {
  const userList = document.getElementById("userList");
  db.collection("online_users").onSnapshot(snapshot => {
    userList.innerHTML = "";
    snapshot.forEach(doc => {
      const user = doc.id;
      if (user !== username) {
        const li = document.createElement("li");
        li.textContent = user;
        li.onclick = () => startPrivateChat(user);
        userList.appendChild(li);
      }
    });
  });
}

// ✅ Switch to Group Chat Room
function joinRoom(roomName) {
  if (unsubscribe) unsubscribe();

  currentChatType = "group";
  currentRoom = roomName;
  currentPrivateUser = null;

  document.getElementById("chatHeader").innerText = "#" + roomName;
  document.getElementById("chatMessages").innerHTML = "";

  unsubscribe = db.collection("rooms").doc(roomName).collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const msg = change.doc.data();
          renderMessage(msg.sender, msg.text);
        }
      });
    });
}

// ✅ Start 1-to-1 Private Chat
function startPrivateChat(otherUser) {
  if (unsubscribe) unsubscribe();

  currentChatType = "private";
  currentPrivateUser = otherUser;

  document.getElementById("chatHeader").innerText = "👤 " + otherUser;
  document.getElementById("chatMessages").innerHTML = "";

  const chatId = getChatId(username, otherUser);

  unsubscribe = db.collection("private_chats").doc(chatId).collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const msg = change.doc.data();
          renderMessage(msg.sender, msg.text);
        }
      });
    });
}

// ✅ Generate Unique Chat ID
function getChatId(u1, u2) {
  return [u1, u2].sort().join("_");
}

// ✅ Send Message (Group or Private)
function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  const message = {
    sender: username,
    text: text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (currentChatType === "group") {
    db.collection("rooms").doc(currentRoom).collection("messages").add(message);
  } else if (currentChatType === "private") {
    const chatId = getChatId(username, currentPrivateUser);
    db.collection("private_chats").doc(chatId).collection("messages").add(message);
  }

  input.value = "";
}

// ✅ Render Message
function renderMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.classList.add(sender === username ? "sent" : "received");
  div.innerText = `${sender}: ${text}`;
  const chatBox = document.getElementById("chatMessages");
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Auto-login if user already in localStorage
window.onload = () => {
  const stored = localStorage.getItem("username");
  if (stored) {
    username = stored;
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("chatScreen").classList.remove("hidden");
    document.getElementById("currentUser").innerText = "You: " + username;
    setUserOnline();
    listenToOnlineUsers();
    joinRoom("general");
  }
};
