let sendBtn = document.getElementById("SEND-BTN");
let txtInput = document.getElementById("MESSAGE-INPUT");
let userName = document.getElementById("H-USERNAME");
let chat = document.getElementById("chatBody");
let mainSection = document.getElementById("mainSection");
let bottomBar = document.getElementById("BOTTOMBAR");
let userPic = document.getElementById("HEADER-PROFILEPIC");
let info1 = JSON.parse(localStorage.getItem("mainUser"));
let info2 = JSON.parse(localStorage.getItem("chatInfo2"));
let page = io();
userName.innerHTML = "Rick";
let room = "room1";

let ringtone = new Audio("/mediafiles/ring1.mp3");
ringtone.loop = true;

page.emit("join-room", room);

async function markAsRead() {
  await fetch("/markAsRead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mainUser: info1,
      receiver: info2.username,
    }),
  });
}

async function openChat() {
  fetch("/chat/path4", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name1: info1, name2: info2.username }),
  })
    .then((res) => res.json())
    .then((data) => {
      chat.innerHTML = "";

      let received = data.msgReceivedH;
      let sent = data.msgSentH;

      let i = 0,
        j = 0;
      let allMsgs = [];

      while (i < received.length || j < sent.length) {
        if (j < sent.length) {
          allMsgs.push({ ...sent[j], type: "sent" });
          j++;
        }
        if (i < received.length) {
          allMsgs.push({ ...received[i], type: "received" });
          i++;
        }
      }
      let k = 0;
      function showNext() {
        if (k < allMsgs.length) {
          let msg = allMsgs[k];
          let bubble = document.createElement("div");

          if (msg.type === "sent") {
            bubble.className = "SENDER-TEXT";
            bubble.innerHTML = `<span class="msgText">${msg.text}</span>
          <span class="TIME">${msg.time}</span>`;
          } else {
            bubble.className = "RECEPIENT-TEXT";
            bubble.innerHTML = `<span class="msgText">${msg.text}</span>
          <span class="TIME">${msg.time}</span>`;
          }

          chat.appendChild(bubble);

          k++;
          setTimeout(showNext, 20);
        }
      }
      showNext();
    });
  markAsRead();
}
openChat();
if (JSON.parse(localStorage.getItem("chatInfo2")).username == "Admin Control") {
  sendBtn.style.display = "none";
  txtInput.style.display = "none";
  bottomBar.innerHTML = "@Admin Control- 2025: You cannot reply to this chat";
}

userName.innerHTML = info2.username;
userPic.style.background = `url(${info2.profileLink})`;
userPic.style.backgroundSize = "cover";
userPic.addEventListener("click", () => {
  let form = document.createElement("form");
  form.method = "POST";
  form.action = "/user";

  let input = document.createElement("input");
  input.type = "hidden";
  input.name = "username";
  input.value = info2.username;

  form.appendChild(input);
  userPic.appendChild(form);
  form.submit();
});

function send() {
  txtInput.style.height = 20 + "px";
  let text = txtInput.value;
  let time = `${new Date().getHours()}${new Date().getMinutes()}`;
  if (text === "") return;
  let bubble = document.createElement("div");
  bubble.className = "SENDER-TEXT";
  bubble.innerHTML = `<span class="msgText">${text}</span>
          <span class="TIME">${time}</span>`;
  chat.appendChild(bubble);
  txtInput.value = "";

  page.emit("message", {
    from: info1,
    to: info2.username,
    text: text,
  });
}
sendBtn.addEventListener("click", () => {
  send();
});

page.on("serverReply", (data) => {
  if (data.to == info1 && data.from == info2.username) {
    let time = `${new Date().getHours()}${new Date().getMinutes()}`;
    markAsRead();
    let bubble = document.createElement("div");
    bubble.className = "RECEPIENT-TEXT";
    bubble.innerHTML = `<span class="msgText">${data.text}</span>
          <span class="TIME">${time}</span>`;
    chat.appendChild(bubble);
  }
});

txtInput.addEventListener("input", () => {
  if (txtInput.scrollHeight < 95) {
    txtInput.style.height = "auto";
    txtInput.style.height = txtInput.scrollHeight + "px";
  } else {
    txtInput.style.height = 95 + "px";
  }
});

let videoCallBtn = document.getElementById("VIDEO-CALL");
let pc = null;
let localStream = null;
let remoteStream = null;
let pendingOffer = null;

const statusEl = document.getElementById("statusEl");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const toggleCamBtn = document.getElementById("toggleCam");
const toggleMicBtn = document.getElementById("toggleMic");
const hangupBtn = document.getElementById("hangup");

const videoCallPopup = document.getElementById("videoCallPopup");
const acceptCallBtn = document.getElementById("acceptCallBtn");
const declineCallBtn = document.getElementById("declineCallBtn");
const video2Page = document.getElementById("video2Page");
const chatsPage = document.getElementById("CHATS-PAGE");

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

async function ensureLocalStream() {
  try {
    // Stop previous tracks if any
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }

    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.srcObject = localStream;
    localVideo.muted = true; // autoplay works without user interaction
    await localVideo.play();
    console.log("Local stream ready ✅");
    return true;
  } catch (err) {
    console.error("Failed to get local stream:", err);
    statusEl.textContent = "Camera/mic access denied ❌";
    return false;
  }
}

// --- Create peer connection ---
function createPeerConnection() {
  pc = new RTCPeerConnection(ICE_CONFIG);

  pc.ontrack = (e) => {
    if (!remoteStream) remoteStream = new MediaStream();
    e.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
    remoteVideo.srcObject = remoteStream;
    remoteVideo.play().catch(() => {});
    console.log("Remote track received:", e.track.kind);
    statusEl.textContent = "Connected 🎥";
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      console.log("Sending ICE candidate", e.candidate);
      page.emit("ice-candidate", { room, candidate: e.candidate });
    }
  };

  pc.oniceconnectionstatechange = () => {
    if (
      pc.iceConnectionState === "disconnected" ||
      pc.iceConnectionState === "failed"
    ) {
      statusEl.textContent = "Connection lost 🔌";
    }
  };
}

// --- Buttons ---
toggleCamBtn.onclick = () => {
  if (localStream) {
    localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    toggleCamBtn.style.opacity = localStream.getVideoTracks()[0].enabled
      ? "1"
      : "0.5";
  }
};

toggleMicBtn.onclick = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    toggleMicBtn.style.opacity = localStream.getAudioTracks()[0].enabled
      ? "1"
      : "0.5";
  }
};

hangupBtn.onclick = () => {
  if (pc) pc.close();
  pc = null;
  if (localStream) localStream.getTracks().forEach((t) => t.stop());
  if (remoteStream) remoteStream.getTracks().forEach((t) => t.stop());
  localVideo.srcObject = remoteVideo.srcObject = null;
  statusEl.textContent = "Call ended ❌";
  page.emit("user-left", { room });
};

videoCallBtn.addEventListener("click", () => {
  window.location.href = `/videoCall.html?room=${room}&user=${encodeURIComponent(
    document.getElementById("H-USERNAME").innerText || "Guest"
  )}`;
});

// Incoming call: show popup in current page
page.on("video-offer", ({ offer }) => {
  pendingOffer = offer;
  ringtone.currentTime = 0;
  ringtone.play();
  videoCallPopup.style.display = "flex"; // show call popup
  statusEl.textContent = "Incoming call... 📞";
});

// Accept call
acceptCallBtn.addEventListener("click", async () => {
  ringtone.pause();
  videoCallPopup.style.display = "none";
  if (!pendingOffer) return;

  if (!(await ensureLocalStream())) return;

  createPeerConnection();
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  page.emit("video-answer", { room, answer });

  pendingOffer = null;
  // Show the video call div in this browser
  video2Page.style.display = "flex";
  chatsPage.style.display = "none";
  statusEl.textContent = "Connected 🎥";
});

// --- Accept call: create peer connection & answer ---
acceptCallBtn.addEventListener("click", async () => {
  videoCallPopup.style.display = "none";
  ringtone.pause();
  if (!pendingOffer) return;

  if (!(await ensureLocalStream())) return;
  createPeerConnection();
  localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

  await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  page.emit("video-answer", { room, answer });

  pendingOffer = null;
  video2Page.style.display = "flex";
  chatsPage.style.display = "none";
  statusEl.textContent = "Connected 🎥";
});

// --- Decline call ---
declineCallBtn.addEventListener("click", () => {
  videoCallPopup.style.display = "none";
  ringtone.pause();
  pendingOffer = null;
  page.emit("call-declined", { to: info2.username });
  statusEl.textContent = "Call declined ❌";
});

// --- Handle remote answer ---
page.on("video-answer", async ({ answer }) => {
  console.log("Received video-answer:", answer);
  if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  statusEl.textContent = "Connected 🎥";
});

// --- ICE candidates ---
page.on("ice-candidate", async ({ candidate }) => {
  console.log("Received ICE candidate:", candidate);
  if (candidate && pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// --- Caller left or declined ---
page.on("user-left", () => {
  ringtone.pause();
  if (pc) pc.close();
  pc = null;
  statusEl.textContent = "Caller left 👋";
});

page.on("call-declined", () => {
  ringtone.pause();
  if (pc) pc.close();
  pc = null;
  statusEl.textContent = "Call was declined ❌";
});
