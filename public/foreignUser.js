const img = document.querySelector(".profile-photo");
const imgDiv = document.querySelector(".editable-photo");
const followBtn = document.getElementById("followBtn");
const interestBtn = document.getElementById("intestBtn");
let foreignUserClicked = localStorage.getItem("forUsClicked");
let mainUser = JSON.parse(localStorage.getItem("mainUser"));
let isFollowing = false;
let followersCount = document.getElementById("followersCount");
let viewersCount = document.getElementById("viewersCount");

img.addEventListener("click", () => {
  [img.className, imgDiv.className] = img.classList.contains("clickedPhoto")
    ? ["profile-photo", "editable-photo"]
    : ["clickedPhoto", ""];
});

let interestState = false;
async function getStatus() {
  const res = await fetch("/getStatus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mainUser: mainUser,
      foreignUser: foreignUserClicked,
    }),
  });
  const data = await res.json();
  interestState = data.state;
}

function updateInterest() {
  if (interestState) {
    interestBtn.style.background = "red";
    interestBtn.style.color = "white";
    interestBtn.innerHTML = "Interested";

    interestBtn.addEventListener("click", () => {
      alert("Interest has already been sent");
    });
    interestBtn.disabled = true;
  } else {
    interestBtn.addEventListener("click", async () => {
      interestState = true;
      updateInterest();
      await fetch("/sendInterest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mainUser: mainUser,
          foreignUser: foreignUserClicked,
        }),
      });
      updateInterest();
    });
  }
}

(async () => {
  await getStatus();
  updateInterest();
})();

async function getFollowStatus() {
  const res = await fetch("/getFollowStatus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: mainUser,
      to: foreignUserClicked,
    }),
  });

  const data = await res.json();
  isFollowing = data.isFollowing;
  updateFollowButton();
}

function updateFollowButton() {
  if (isFollowing) {
    followBtn.style.background = "red";
    followBtn.style.color = "white";
    followBtn.innerText = "Following";
  } else {
    followBtn.style.background = "";
    followBtn.style.color = "";
    followBtn.innerText = "Follow";
  }
}

followBtn.addEventListener("click", async () => {
  isFollowing = !isFollowing;
  updateFollowButton();

  const res = await fetch("/toggleFollow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: mainUser,
      to: foreignUserClicked,
    }),
  });
  const data = await res.json();
  followersCount.innerText = data.followersCount;
});

(async () => {
  await getFollowStatus();
})();

async function incrementView() {
  const res = await fetch("/viewProfile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      viewedUser: foreignUserClicked,
      whoViewed: mainUser,
    }),
  });

  const data = await res.json();
  viewersCount.innerText = data.viewsCount;
}
incrementView();

async function getFollowStatus() {
  const res = await fetch("/getFollowStatus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: mainUser,
      to: foreignUserClicked,
    }),
  });

  const data = await res.json();
  isFollowing = data.isFollowing;
  updateFollowButton();
  followersCount.innerText = data.followersCount;
}
