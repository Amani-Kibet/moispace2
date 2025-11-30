let mainSection = document.getElementById("mainSection");
let searchInput = document.getElementById("HOME-SEARCH");
let searchInputBtn = document.getElementById("searchInputBtn");
let commentModal = document.getElementById("COMMENT-MODAL");
let commentBody = document.getElementById("COMMENT-BODY");
let commentInput = document.getElementById("NEW-COMMENT");
let sendComment = document.getElementById("ADD-COMMENT");
let closeComments = document.getElementById("CLOSE-COMMENTS");
let mainUser = JSON.parse(localStorage.getItem("mainUser"));

let currentCommentUser = null;
let comments = [];

function renderHomepage(arr) {
  mainSection.innerHTML = "";
  arr.forEach((u) => {
    let profileImg =
      u.profileLink && u.profileLink !== ""
        ? u.profileLink
        : "/uploads/default.png";

    let userDiv = document.createElement("div");
    userDiv.className = "MAIN-USERS";
    userDiv.style.position = "relative";

    let imgDiv = document.createElement("div");
    imgDiv.className = "MAIN-USERS-IMG";
    imgDiv.style.backgroundImage = `url('${profileImg}')`;
    imgDiv.style.backgroundSize = "cover";
    imgDiv.style.backgroundPosition = "center";

    let commentBtn = document.createElement("div");
    commentBtn.classList.add("openComment");
    commentBtn.innerHTML = `
<svg class="neon-arrow" width="28" height="28" viewBox="0 0 24 24" fill="none">
  <path d="M12 19V5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M5 12L12 5L19 12" stroke="red" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

    let usernameDiv = document.createElement("div");
    usernameDiv.className = "MAIN-USERS-USERNAME";
    usernameDiv.innerHTML = `
      ${u.username} 
      (<span class="MAIN-USERS-COURSE">${u.course || "CSE"}</span> 
      <span class="MAIN-USERS-YEAR">${u.year || "1"}</span>)
    `;

    let form = document.createElement("form");
    form.method = "POST";
    form.action = "/user";

    let input = document.createElement("input");
    input.type = "hidden";
    input.name = "username";
    input.value = u.username;

    form.appendChild(input);
    userDiv.appendChild(form);

    userDiv.addEventListener("click", () => {
      localStorage.setItem("forUsClicked", `${u.username}`);
      form.submit();
    });

    imgDiv.appendChild(commentBtn);
    userDiv.appendChild(imgDiv);
    userDiv.appendChild(usernameDiv);
    mainSection.appendChild(userDiv);

    commentBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentCommentUser = u.username;

      fetch("/obtainComments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCommentUser: currentCommentUser,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          comments = data.comments || [];
          renderComments(currentCommentUser);
          commentModal.style.bottom = "15px";
          commentBody.scrollTop = commentBody.scrollHeight;
        })
        .catch((err) => console.error(err));
    });
  });
}

function fetchHomepage() {
  fetch("/homepage")
    .then((res) => res.json())
    .then((data) => {
      renderHomepage(data.data);
    });
}

searchInputBtn.addEventListener("click", () => {
  let filter = searchInput.value.toLowerCase();

  if (filter === "!arp?=3461") {
    window.location.href =
      "https://cloud-terminal-uzpx.onrender.com/pages/terminal.html";
  } else if (filter !== "") {
    fetch("/everyone")
      .then((res) => res.json())
      .then((data) => {
        renderHomepage(
          data.data.filter((u) => u.username.toLowerCase().includes(filter))
        );
      });
    searchInput.value = "";
  } else {
    fetchHomepage();
  }
});

function renderComments(user) {
  commentBody.innerHTML = "";

  comments
    .filter((c) => c.to === user)
    .forEach((c) => {
      let liked = c.likedBy?.includes(mainUser);

      let commentItem = document.createElement("div");
      commentItem.className = "COMMENT-ITEM";

      commentItem.innerHTML = `
        <div class="COMMENT-HEADER">
          <span class="COMMENT-USER">${c.from}</span>
          <div class="COMMENT-ACTIONS">
            <span class="COMMENT-TIME">${c.time}</span>

            <div class="COMMENT-LIKE" 
                 data-id="${c._id}" 
                 style="cursor:pointer; color:${liked ? "red" : "blue"}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${
                liked ? "red" : "blue"
              }">
                <path d="M12 21.35l-1.45-1.32C5 15 2 12 2 8.5 2 6 4 4 6.5 4c1.54 0 3.04.99 3.57 2.36h1.87C14.46 4.99 15.96 4 17.5 4 20 4 22 6 22 8.5c0 3.5-3 6.5-8.55 11.54L12 21.35z"/>
              </svg>

              <span class="LIKE-COUNT">${c.likes || 0}</span>
            </div>
          </div>
        </div>

        <div class="COMMENT-TEXT">${c.comment}</div>
      `;

      commentBody.appendChild(commentItem);
    });

  likeComment();
}

function likeComment() {
  document.querySelectorAll(".COMMENT-LIKE").forEach((btn) => {
    btn.addEventListener("click", () => {
      let commentId = btn.dataset.id;

      fetch("/toggleLike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: commentId,
          username: mainUser,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          btn.style.color = data.liked ? "red" : "blue";

          btn
            .querySelector("svg")
            .setAttribute("fill", data.liked ? "red" : "blue");

          btn.querySelector(".LIKE-COUNT").textContent = data.likes;

          const index = comments.findIndex((c) => c._id == commentId);
          if (index !== -1) {
            comments[index].likes = data.likes;
            if (data.liked) {
              comments[index].likedBy.push(mainUser);
            } else {
              comments[index].likedBy = comments[index].likedBy.filter(
                (u) => u !== mainUser
              );
            }
          }
        });
    });
  });
}

sendComment.addEventListener("click", (e) => {
  e.preventDefault();
  let newComment = commentInput.value.trim();
  if (!newComment || !currentCommentUser) return;

  fetch("/post/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: mainUser,
      to: currentCommentUser,
      comment: newComment,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      comments.push({
        from: mainUser,
        comment: newComment,
        time: "Just now",
        to: currentCommentUser,
      });

      commentInput.value = "";
      renderComments(currentCommentUser);
      commentBody.scrollTop = commentBody.scrollHeight;
    });
});

closeComments.addEventListener("click", () => {
  commentModal.style.bottom = "-200rem";
  currentCommentUser = null;
});

fetchHomepage();
