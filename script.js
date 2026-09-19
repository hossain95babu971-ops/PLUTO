import {
  supabase
} from "./supabase.js";


const $ = id =>
  document.getElementById(id);


/* =========================================
   STATE
========================================= */

let currentUser = null;
let currentProfile = null;
let viewedProfileId = null;

let activePostId = null;

let activeChatUser = null;
let activeConversationId = null;

let passwordRecoveryMode = false;

let feedChannel = null;
let messageChannel = null;
let notificationChannel = null;
let presenceChannel = null;

let lastSeenTimer = null;

let selectedAvatarFile = null;
let selectedCoverFile = null;

let userSearchTimer = null;

const onlineUsers =
  new Set();


/* =========================================
   HELPERS
========================================= */

function normalizeUsername(
  value = ""
) {

  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9_]/g, "");

}


function escapeHTML(
  value = ""
) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    String(value);

  return div.innerHTML;

}


function formatTime(value) {

  if (!value) {

    return "Just now";

  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  return date.toLocaleString();

}


function openModal(id) {

  const modal =
    $(id);


  if (modal) {

    modal.classList.add(
      "active"
    );

  }

}


function closeModal(id) {

  const modal =
    $(id);


  if (modal) {

    modal.classList.remove(
      "active"
    );

  }

}


function setAvatar(
  element,
  url
) {

  if (!element) {

    return;

  }


  /*
    Profile avatar-এর camera button
    থাকলে সেটাকে preserve করি।
  */

  const editButton =
    element.querySelector(
      ".avatar-edit"
    );


  element.innerHTML =
    "";


  if (url) {

    const image =
      document.createElement(
        "img"
      );


    image.src =
      url;


    image.alt =
      "Profile picture";


    element.appendChild(
      image
    );

  }

  else {

    const icon =
      document.createElement(
        "i"
      );


    icon.className =
      "fa-solid fa-user";


    element.appendChild(
      icon
    );

  }


  if (editButton) {

    element.appendChild(
      editButton
    );

  }

}


/* =========================================
   MODALS
========================================= */

document
  .querySelectorAll(
    "[data-close]"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        closeModal(
          button.dataset.close
        );

      }
    );

  });


document
  .querySelectorAll(
    ".modal"
  )
  .forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target === modal
        ) {

          modal.classList.remove(
            "active"
          );

        }

      }
    );

  });


/* =========================================
   NAVIGATION
========================================= */

function openPage(id) {

  document
    .querySelectorAll(
      ".page"
    )
    .forEach(page => {

      page.classList.remove(
        "active"
      );

    });


  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(item => {

      item.classList.remove(
        "active"
      );

    });


  const page =
    $(id);


  if (page) {

    page.classList.add(
      "active"
    );

  }


  document
    .querySelector(
      `.nav-item[data-page="${id}"]`
    )
    ?.classList.add(
      "active"
    );


  if (
    id ===
    "messagePage"
  ) {

    loadConversations();

  }


  if (
    id ===
    "notificationPage"
  ) {

    loadNotifications();

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


document
  .querySelectorAll(
    ".nav-item"
  )
  .forEach(button => {

    button.onclick = () => {

      openPage(
        button.dataset.page
      );

    };

  });


document
  .querySelectorAll(
    "[data-page-open]"
  )
  .forEach(button => {

    button.onclick = () => {

      openPage(
        button.dataset.pageOpen
      );


      closeMenu();

    };

  });

/* =========================================
   PHONE BACK BUTTON
========================================= */

let currentPage = "feedPage";

const originalOpenPage = openPage;

openPage = function (id) {

  currentPage = id;

  history.pushState(
    { page: id },
    "",
    "#" + id
  );

  originalOpenPage(id);
};


history.replaceState(
  { page: "feedPage" },
  "",
  "#feedPage"
);


window.addEventListener(
  "popstate",
  () => {

    openPage(
      "feedPage"
    );

  }
);


/* =========================================
   SIDE MENU
========================================= */

function openMenu() {

  $("sideMenu")
    ?.classList.add(
      "active"
    );


  $("overlay")
    ?.classList.add(
      "active"
    );

}


function closeMenu() {

  $("sideMenu")
    ?.classList.remove(
      "active"
    );


  $("overlay")
    ?.classList.remove(
      "active"
    );

}


if ($("menuButton")) {

  $("menuButton").onclick =
    openMenu;

}


if ($("closeMenu")) {

  $("closeMenu").onclick =
    closeMenu;

}


if ($("overlay")) {

  $("overlay").onclick =
    closeMenu;

}


/* =========================================
   AUTH FORM SWITCH
========================================= */

$("showSignup").onclick =
() => {

  $("loginForm")
    .classList.remove(
      "active"
    );


  $("signupForm")
    .classList.add(
      "active"
    );

};


$("showLogin").onclick =
() => {

  $("signupForm")
    .classList.remove(
      "active"
    );


  $("loginForm")
    .classList.add(
      "active"
    );

};


/* =========================================
   SIGN UP
========================================= */

$("signupBtn").onclick =
async () => {

  const button =
    $("signupBtn");


  const name =
    $("signupName")
      .value
      .trim();


  const username =
    normalizeUsername(
      $("signupUsername")
        .value
    );


  const email =
    $("signupEmail")
      .value
      .trim();


  const password =
    $("signupPassword")
      .value;


  if (!name) {

    alert(
      "Enter your name."
    );

    return;

  }


  if (
    username.length < 3
  ) {

    alert(
      "Username must be at least 3 characters."
    );

    return;

  }


  if (!email) {

    alert(
      "Enter your email."
    );

    return;

  }


  if (
    password.length < 6
  ) {

    alert(
      "Password must be at least 6 characters."
    );

    return;

  }


  try {

    button.disabled =
      true;


    button.textContent =
      "Creating...";


    const {
      data: existing,
      error: usernameError
    } =
      await supabase
        .from("profiles")
        .select("id")
        .eq(
          "username",
          username
        )
        .maybeSingle();


    if (usernameError) {

      throw usernameError;

    }


    if (existing) {

      throw new Error(
        "Username already taken."
      );

    }


    const {
      data,
      error
    } =
      await supabase.auth
        .signUp({

          email,

          password,

          options: {

            data: {
              name
            }

          }

        });


    if (error) {

      throw error;

    }


    /*
      Email confirmation OFF থাকলে
      session সঙ্গে সঙ্গে পাওয়া যাবে।
    */

    if (
      data.user &&
      data.session
    ) {

      /*
        Database trigger profile তৈরি করার
        জন্য সামান্য সময় দিচ্ছি।
      */

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            400
          )
      );


      const {
        error: updateError
      } =
        await supabase
          .from("profiles")
          .update({

            name,
            username,
            updated_at:
              new Date()
                .toISOString()

          })
          .eq(
            "id",
            data.user.id
          );


      if (updateError) {

        console.warn(
          "Profile signup update:",
          updateError
        );

      }

    }


    if (!data.session) {

      alert(
        "Account created. Check your email to confirm your account."
      );

    }

  }

  catch (error) {

    console.error(
      "SIGNUP ERROR:",
      error
    );


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Create Account";

  }

};


/* =========================================
   LOGIN
========================================= */

$("loginBtn").onclick =
async () => {

  const email =
    $("loginEmail")
      .value
      .trim();


  const password =
    $("loginPassword")
      .value;


  if (
    !email ||
    !password
  ) {

    alert(
      "Enter your email and password."
    );

    return;

  }


  const button =
    $("loginBtn");


  try {

    button.disabled =
      true;


    button.textContent =
      "Logging in...";


    /*
      Normal login কখনো password
      recovery mode নয়।
    */

    passwordRecoveryMode =
      false;


    closeModal(
      "newPasswordModal"
    );


    const {
      data,
      error
    } =
      await supabase.auth
        .signInWithPassword({

          email,
          password

        });


    if (error) {

      throw error;

    }


    if (data.session) {

      await handleSession(
        data.session
      );

    }

  }

  catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Log In";

  }

};


/* =========================================
   GOOGLE LOGIN
========================================= */

async function googleLogin() {

  const redirectTo =
    `${window.location.origin}${window.location.pathname}`;


  const {
    error
  } =
    await supabase.auth
      .signInWithOAuth({

        provider:
          "google",

        options: {
          redirectTo
        }

      });


  if (error) {

    alert(
      error.message
    );

  }

}


$("googleLoginBtn").onclick =
  googleLogin;


$("googleSignupBtn").onclick =
  googleLogin;


/* =========================================
   LOGOUT
========================================= */

$("logoutButton").onclick =
async () => {

  try {

    await updateMyLastSeen();


    passwordRecoveryMode =
      false;


    closeMenu();


    await supabase.auth
      .signOut();


    await handleSession(
      null
    );

  }

  catch (error) {

    console.error(
      "LOGOUT:",
      error
    );

  }

};


/* =========================================
   CURRENT PROFILE
========================================= */

async function loadCurrentProfile() {

  if (!currentUser) {

    return null;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select("*")
      .eq(
        "id",
        currentUser.id
      )
      .maybeSingle();


  if (error) {

    console.error(
      "PROFILE ERROR:",
      error
    );


    return null;

  }


  if (!data) {

    console.warn(
      "Profile row not found."
    );


    return null;

  }


  currentProfile =
    data;


  $("menuUserName")
    .textContent =
      data.name ||
      "PLUTO User";


  $("menuUserEmail")
    .textContent =
      currentUser.email ||
      "";


  setAvatar(
    $("menuAvatar"),
    data.avatar_url
  );


  setAvatar(
    $("feedAvatar"),
    data.avatar_url
  );


  applyTheme(
    data.theme ||
    "light"
  );


  return data;

}


/* =========================================
   AUTH INITIALIZATION
========================================= */

async function initializeAuth() {

  /*
    Listener আগে register করা হচ্ছে।
  */

  supabase.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {

        console.log(
          "SUPABASE AUTH EVENT:",
          event
        );


        /*
          শুধু genuine recovery event-এ
          New Password modal খুলবে।
        */

        if (
          event ===
          "PASSWORD_RECOVERY"
        ) {

          passwordRecoveryMode =
            true;


          currentUser =
            session?.user ||
            null;


          $("authPage")
            .classList.add(
              "hidden"
            );


          closeModal(
            "forgotPasswordModal"
          );


          openModal(
            "newPasswordModal"
          );


          return;

        }


        /*
          Recovery চলার সময় SIGNED_IN
          event ignore করা হবে।
        */

        if (
          passwordRecoveryMode
        ) {

          return;

        }


        if (
          event ===
          "SIGNED_IN"
        ) {

          setTimeout(
            () => {

              handleSession(
                session
              );

            },
            0
          );


          return;

        }


        if (
          event ===
          "SIGNED_OUT"
        ) {

          setTimeout(
            () => {

              handleSession(
                null
              );

            },
            0
          );

        }

      }
    );


  /*
    Existing session restore।
  */

  const {
    data,
    error
  } =
    await supabase.auth
      .getSession();


  if (error) {

    console.error(
      "SESSION ERROR:",
      error
    );


    $("authPage")
      .classList.remove(
        "hidden"
      );


    return;

  }


  /*
    Recovery link-এর URL হলে initial
    normal session দিয়ে Feed খুলব না।
  */

  const url =
    new URL(
      window.location.href
    );


  const hash =
    window.location.hash;


  const isRecoveryURL =
    url.searchParams.get(
      "type"
    ) === "recovery"

    ||

    hash.includes(
      "type=recovery"
    );


  if (
    !isRecoveryURL
  ) {

    await handleSession(
      data.session
    );

  }

}


/* =========================================
   HANDLE SESSION
========================================= */

async function handleSession(
  session
) {

  if (!session) {

    currentUser =
      null;


    currentProfile =
      null;


    viewedProfileId =
      null;


    closeModal(
      "newPasswordModal"
    );


    $("authPage")
      .classList.remove(
        "hidden"
      );


    if (lastSeenTimer) {

      clearInterval(
        lastSeenTimer
      );


      lastSeenTimer =
        null;

    }


    if (feedChannel) {

      await supabase
        .removeChannel(
          feedChannel
        );


      feedChannel =
        null;

    }


    if (
      notificationChannel
    ) {

      await supabase
        .removeChannel(
          notificationChannel
        );


      notificationChannel =
        null;

    }


    if (messageChannel) {

      await supabase
        .removeChannel(
          messageChannel
        );


      messageChannel =
        null;

    }


    if (presenceChannel) {

      await supabase
        .removeChannel(
          presenceChannel
        );


      presenceChannel =
        null;

    }


    onlineUsers.clear();


    return;

  }


  currentUser =
    session.user;


  await loadCurrentProfile();


  /*
    Recovery session হলে Feed খুলবে না।
  */

  if (
    passwordRecoveryMode
  ) {

    return;

  }


  closeModal(
    "newPasswordModal"
  );


  $("authPage")
    .classList.add(
      "hidden"
    );


  subscribeFeed();

  subscribeNotifications();


  await startPresence();

  await updateMyLastSeen();


  if (lastSeenTimer) {

    clearInterval(
      lastSeenTimer
    );

  }


  lastSeenTimer =
    setInterval(
      updateMyLastSeen,
      60000
    );

}


/* =========================================
   IMAGE COMPRESSION
========================================= */

function canvasToBlob(
  canvas,
  type,
  quality
) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      canvas.toBlob(
        blob => {

          if (blob) {

            resolve(blob);

          }

          else {

            reject(
              new Error(
                "Image compression failed."
              )
            );

          }

        },
        type,
        quality
      );

    }
  );

}


async function compressImage(
  file,
  maxSizeMB = 1,
  maxWidth = 1600,
  maxHeight = 1600
) {

  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    return file;

  }


  if (
    file.type ===
    "image/gif"
  ) {

    return file;

  }


  const image =
    await createImageBitmap(
      file
    );


  let width =
    image.width;


  let height =
    image.height;


  const scale =
    Math.min(
      1,
      maxWidth / width,
      maxHeight / height
    );


  width =
    Math.max(
      1,
      Math.round(
        width * scale
      )
    );


  height =
    Math.max(
      1,
      Math.round(
        height * scale
      )
    );


  const canvas =
    document.createElement(
      "canvas"
    );


  canvas.width =
    width;


  canvas.height =
    height;


  const context =
    canvas.getContext(
      "2d"
    );


  context.drawImage(
    image,
    0,
    0,
    width,
    height
  );


  image.close();


  const targetBytes =
    maxSizeMB *
    1024 *
    1024;


  let quality =
    .85;


  let blob =
    await canvasToBlob(
      canvas,
      "image/webp",
      quality
    );


  while (
    blob.size >
      targetBytes
    &&
    quality > .35
  ) {

    quality -= .1;


    blob =
      await canvasToBlob(
        canvas,
        "image/webp",
        quality
      );

  }


  /*
    Quality কমিয়েও target না হলে
    dimension আরও কমানো হবে।
  */

  if (
    blob.size >
    targetBytes
  ) {

    const smaller =
      document.createElement(
        "canvas"
      );


    const resizeScale =
      Math.min(
        .9,
        Math.sqrt(
          targetBytes /
          blob.size
        ) * .9
      );


    smaller.width =
      Math.max(
        1,
        Math.round(
          width *
          resizeScale
        )
      );


    smaller.height =
      Math.max(
        1,
        Math.round(
          height *
          resizeScale
        )
      );


    const smallContext =
      smaller.getContext(
        "2d"
      );


    smallContext.drawImage(
      canvas,
      0,
      0,
      smaller.width,
      smaller.height
    );


    blob =
      await canvasToBlob(
        smaller,
        "image/webp",
        .75
      );

  }


  return new File(
    [blob],
    "pluto-image.webp",
    {
      type:
        "image/webp",

      lastModified:
        Date.now()
    }
  );

}


/* =========================================
   STORAGE
========================================= */

async function uploadFile(
  file,
  folder
) {

  if (
    !file ||
    !currentUser
  ) {

    return "";

  }


  if (
    file.type.startsWith(
      "image/"
    )
  ) {

    file =
      await compressImage(
        file
      );

  }


  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
    ||
    "bin";


  const path =
    `${currentUser.id}/${folder}/${crypto.randomUUID()}.${extension}`;


  const {
    error
  } =
    await supabase
      .storage
      .from("media")
      .upload(
        path,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type
        }
      );


  if (error) {

    throw error;

  }


  const {
    data
  } =
    supabase
      .storage
      .from("media")
      .getPublicUrl(
        path
      );


  return (
    data.publicUrl ||
    ""
  );

}


function getMediaStoragePath(
  publicUrl
) {

  if (!publicUrl) {

    return null;

  }


  try {

    const url =
      new URL(
        publicUrl
      );


    const marker =
      "/storage/v1/object/public/media/";


    const index =
      url.pathname.indexOf(
        marker
      );


    if (index === -1) {

      return null;

    }


    return decodeURIComponent(
      url.pathname.substring(
        index +
        marker.length
      )
    );

  }

  catch (error) {

    console.warn(
      "Invalid Storage URL:",
      error
    );


    return null;

  }

}


async function deleteOldMedia(
  publicUrl
) {

  const path =
    getMediaStoragePath(
      publicUrl
    );


  if (!path) {

    return false;

  }


  const {
    data,
    error
  } =
    await supabase
      .storage
      .from("media")
      .remove([
        path
      ]);


  if (error) {

    console.error(
      "OLD MEDIA DELETE ERROR:",
      error
    );


    return false;

  }


  console.log(
    "Old media removed:",
    data
  );


  return true;

}


/* =========================================
   PROFILE EDIT MENU
========================================= */

$("editProfileBtn").onclick =
() => {

  if (!currentProfile) {

    return;

  }


  $("editMenuName")
    .textContent =
      currentProfile.name ||
      "";


  $("editMenuUsername")
    .textContent =
      `@${currentProfile.username || ""}`;


  $("editMenuBio")
    .textContent =
      currentProfile.bio ||
      "No bio";


  openModal(
    "editProfileModal"
  );

};


/* =========================================
   EDIT NAME
========================================= */

$("openNameEdit").onclick =
() => {

  $("editNameInput").value =
    currentProfile?.name ||
    "";


  closeModal(
    "editProfileModal"
  );


  openModal(
    "editNameModal"
  );

};


$("saveNameBtn").onclick =
async () => {

  if (
    !currentUser ||
    !currentProfile
  ) {

    return;

  }


  const name =
    $("editNameInput")
      .value
      .trim();


  if (!name) {

    alert(
      "Name cannot be empty."
    );

    return;

  }


  const button =
    $("saveNameBtn");


  try {

    button.disabled =
      true;


    button.textContent =
      "Saving...";


    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({

          name,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          currentUser.id
        );


    if (error) {

      throw error;

    }


    await loadCurrentProfile();


    closeModal(
      "editNameModal"
    );


    await openUserProfile(
      currentUser.id
    );


    await loadFeed();

  }

  catch (error) {

    console.error(error);


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save Name";

  }

};


/* =========================================
   EDIT USERNAME
========================================= */

$("openUsernameEdit").onclick =
() => {

  $("editUsernameInput").value =
    currentProfile?.username ||
    "";


  closeModal(
    "editProfileModal"
  );


  openModal(
    "editUsernameModal"
  );

};


$("saveUsernameBtn").onclick =
async () => {

  if (
    !currentUser ||
    !currentProfile
  ) {

    return;

  }


  const username =
    normalizeUsername(
      $("editUsernameInput")
        .value
    );


  if (
    username.length < 3
  ) {

    alert(
      "Username must be at least 3 characters."
    );

    return;

  }


  const button =
    $("saveUsernameBtn");


  try {

    button.disabled =
      true;


    button.textContent =
      "Saving...";


    const {
      data: existing,
      error: checkError
    } =
      await supabase
        .from("profiles")
        .select("id")
        .eq(
          "username",
          username
        )
        .neq(
          "id",
          currentUser.id
        )
        .maybeSingle();


    if (checkError) {

      throw checkError;

    }


    if (existing) {

      throw new Error(
        "Username already taken."
      );

    }


    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({

          username,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          currentUser.id
        );


    if (error) {

      throw error;

    }


    await loadCurrentProfile();


    closeModal(
      "editUsernameModal"
    );


    await openUserProfile(
      currentUser.id
    );


    await loadFeed();

  }

  catch (error) {

    console.error(error);


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save Username";

  }

};


/* =========================================
   EDIT BIO
========================================= */

function updateBioCounter() {

  const input =
    $("editBioInput");


  const counter =
    $("bioCharacterCount");


  if (
    input &&
    counter
  ) {

    counter.textContent =
      input.value.length;

  }

}


$("openBioEdit").onclick =
() => {

  $("editBioInput").value =
    currentProfile?.bio ||
    "";


  updateBioCounter();


  closeModal(
    "editProfileModal"
  );


  openModal(
    "editBioModal"
  );

};


$("editBioInput").oninput =
  updateBioCounter;


$("saveBioBtn").onclick =
async () => {

  if (
    !currentUser ||
    !currentProfile
  ) {

    return;

  }


  const bio =
    $("editBioInput")
      .value
      .trim();


  const button =
    $("saveBioBtn");


  try {

    button.disabled =
      true;


    button.textContent =
      "Saving...";


    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({

          bio,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          currentUser.id
        );


    if (error) {

      throw error;

    }


    await loadCurrentProfile();


    closeModal(
      "editBioModal"
    );


    await openUserProfile(
      currentUser.id
    );

  }

  catch (error) {

    console.error(error);


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save Bio";

  }

};


/* =========================================
   PHOTO EDITORS
========================================= */

function showPreview(
  element,
  url,
  iconClass
) {

  if (!element) {

    return;

  }


  if (url) {

    element.innerHTML =
      `<img src="${escapeHTML(url)}" alt="">`;

  }

  else {

    element.innerHTML =
      `<i class="${iconClass}"></i>`;

  }

}


function openAvatarEditor() {

  if (!currentProfile) {

    return;

  }


  selectedAvatarFile =
    null;


  $("avatarInput").value =
    "";


  $("saveAvatarBtn")
    .classList.add(
      "hidden"
    );


  showPreview(
    $("avatarPreview"),
    currentProfile.avatar_url,
    "fa-solid fa-user"
  );


  openModal(
    "avatarModal"
  );

}


function openCoverEditor() {

  if (!currentProfile) {

    return;

  }


  selectedCoverFile =
    null;


  $("coverInput").value =
    "";


  $("saveCoverBtn")
    .classList.add(
      "hidden"
    );


  showPreview(
    $("coverPreview"),
    currentProfile.cover_url,
    "fa-solid fa-image"
  );


  openModal(
    "coverModal"
  );

}


$("openAvatarEdit").onclick =
() => {

  closeModal(
    "editProfileModal"
  );


  openAvatarEditor();

};


$("openCoverEdit").onclick =
() => {

  closeModal(
    "editProfileModal"
  );


  openCoverEditor();

};


$("avatarEditButton").onclick =
event => {

  event.stopPropagation();


  if (
    viewedProfileId !==
    currentUser?.id
  ) {

    return;

  }


  openAvatarEditor();

};


$("coverEditButton").onclick =
event => {

  event.stopPropagation();


  if (
    viewedProfileId !==
    currentUser?.id
  ) {

    return;

  }


  openCoverEditor();

};


$("chooseAvatarBtn").onclick =
() => {

  $("avatarInput")
    .click();

};


$("chooseCoverBtn").onclick =
() => {

  $("coverInput")
    .click();

};


$("avatarInput").onchange =
event => {

  const file =
    event.target.files[0];


  if (!file) {

    return;

  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "Choose an image file."
    );


    event.target.value =
      "";


    return;

  }


  selectedAvatarFile =
    file;


  const previewURL =
    URL.createObjectURL(
      file
    );


  showPreview(
    $("avatarPreview"),
    previewURL,
    "fa-solid fa-user"
  );


  $("saveAvatarBtn")
    .classList.remove(
      "hidden"
    );

};


$("coverInput").onchange =
event => {

  const file =
    event.target.files[0];


  if (!file) {

    return;

  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "Choose an image file."
    );


    event.target.value =
      "";


    return;

  }


  selectedCoverFile =
    file;


  const previewURL =
    URL.createObjectURL(
      file
    );


  showPreview(
    $("coverPreview"),
    previewURL,
    "fa-solid fa-image"
  );


  $("saveCoverBtn")
    .classList.remove(
      "hidden"
    );

};


/* =========================================
   SAVE AVATAR
========================================= */

$("saveAvatarBtn").onclick =
async () => {

  if (
    !currentUser ||
    !currentProfile ||
    !selectedAvatarFile
  ) {

    return;

  }


  const button =
    $("saveAvatarBtn");


  const oldURL =
    currentProfile.avatar_url ||
    "";


  let newURL =
    "";


  try {

    button.disabled =
      true;


    button.textContent =
      "Uploading...";


    newURL =
      await uploadFile(
        selectedAvatarFile,
        "avatars"
      );


    if (!newURL) {

      throw new Error(
        "Picture upload failed."
      );

    }


    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({

          avatar_url:
            newURL,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          currentUser.id
        );


    if (error) {

      /*
        DB update fail হলে নতুন
        orphan file remove।
      */

      await deleteOldMedia(
        newURL
      );


      throw error;

    }


    /*
      DB নতুন URL পেয়েছে।
      এখন পুরোনো file remove।
    */

    if (
      oldURL &&
      oldURL !== newURL
    ) {

      await deleteOldMedia(
        oldURL
      );

    }


    selectedAvatarFile =
      null;


    await loadCurrentProfile();


    closeModal(
      "avatarModal"
    );


    await openUserProfile(
      currentUser.id
    );


    await loadFeed();

  }

  catch (error) {

    console.error(
      "AVATAR ERROR:",
      error
    );


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save New Picture";

  }

};


/* =========================================
   SAVE COVER
========================================= */

$("saveCoverBtn").onclick =
async () => {

  if (
    !currentUser ||
    !currentProfile ||
    !selectedCoverFile
  ) {

    return;

  }


  const button =
    $("saveCoverBtn");


  const oldURL =
    currentProfile.cover_url ||
    "";


  let newURL =
    "";


  try {

    button.disabled =
      true;


    button.textContent =
      "Uploading...";


    newURL =
      await uploadFile(
        selectedCoverFile,
        "covers"
      );


    if (!newURL) {

      throw new Error(
        "Cover upload failed."
      );

    }


    const {
      error
    } =
      await supabase
        .from("profiles")
        .update({

          cover_url:
            newURL,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          "id",
          currentUser.id
        );


    if (error) {

      await deleteOldMedia(
        newURL
      );


      throw error;

    }


    if (
      oldURL &&
      oldURL !== newURL
    ) {

      await deleteOldMedia(
        oldURL
      );

    }


    selectedCoverFile =
      null;


    await loadCurrentProfile();


    closeModal(
      "coverModal"
    );


    await openUserProfile(
      currentUser.id
    );

  }

  catch (error) {

    console.error(
      "COVER ERROR:",
      error
    );


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save New Cover";

  }

};


/* =========================================
   PHOTO VIEWER
========================================= */

function viewPhoto(url) {

  if (!url) {

    alert(
      "No picture available."
    );

    return;

  }


  $("photoViewerImage").src =
    url;


  $("photoViewer")
    .classList.add(
      "active"
    );


  document.body.style
    .overflow =
      "hidden";

}


function closePhotoViewer() {

  $("photoViewer")
    .classList.remove(
      "active"
    );


  $("photoViewerImage").src =
    "";


  document.body.style
    .overflow =
      "";

}


$("closePhotoViewer").onclick =
  closePhotoViewer;


$("photoViewer").onclick =
event => {

  if (
    event.target ===
    $("photoViewer")
  ) {

    closePhotoViewer();

  }

};


$("viewAvatarBtn").onclick =
() => {

  viewPhoto(
    currentProfile
      ?.avatar_url
  );

};


$("viewCoverBtn").onclick =
() => {

  viewPhoto(
    currentProfile
      ?.cover_url
  );

};


$("profileAvatar").onclick =
event => {

  if (
    event.target.closest(
      "#avatarEditButton"
    )
  ) {

    return;

  }


  const image =
    $("profileAvatar")
      .querySelector(
        "img"
      );


  if (image) {

    viewPhoto(
      image.src
    );

  }

};


$("profileCover").onclick =
event => {

  if (
    event.target.closest(
      "#coverEditButton"
    )
  ) {

    return;

  }


  const background =
    $("profileCover")
      .style
      .backgroundImage;


  const match =
    background.match(
      /^url\(["']?(.*?)["']?\)$/
    );


  if (
    match &&
    match[1]
  ) {

    viewPhoto(
      match[1]
    );

  }

};


/* =========================================
   CREATE POST
========================================= */

$("openCreatePost").onclick =
() => {

  openModal(
    "postModal"
  );

};


$("profileCreatePost").onclick =
() => {

  openModal(
    "postModal"
  );

};


document
  .querySelectorAll(
    "[data-media-type]"
  )
  .forEach(button => {

    button.onclick =
    () => {

      openModal(
        "postModal"
      );


      $("postMedia")
        .click();

    };

  });


$("postMedia").onchange =
event => {

  const file =
    event.target.files[0];


  $("uploadPreview")
    .textContent =
      file
        ? file.name
        : "";

};


$("publishPost").onclick =
async () => {

  if (!currentUser) {

    return;

  }


  const text =
    $("postText")
      .value
      .trim();


  const file =
    $("postMedia")
      .files[0];


  if (
    !text &&
    !file
  ) {

    alert(
      "Write something or select media."
    );

    return;

  }


  const button =
    $("publishPost");


  try {

    button.disabled =
      true;


    button.textContent =
      "Publishing...";


    let mediaURL =
      "";


    let mediaType =
      "";


    if (file) {

      mediaURL =
        await uploadFile(
          file,
          "posts"
        );


      if (
        file.type.startsWith(
          "image/"
        )
      ) {

        mediaType =
          "image";

      }

      else if (
        file.type.startsWith(
          "video/"
        )
      ) {

        mediaType =
          "video";

      }

      else if (
        file.type.startsWith(
          "audio/"
        )
      ) {

        mediaType =
          "audio";

      }

    }


    const {
      error
    } =
      await supabase
        .from("posts")
        .insert({

          user_id:
            currentUser.id,

          content:
            text,

          media_url:
            mediaURL,

          media_type:
            mediaType

        });


    if (error) {

      throw error;

    }


    $("postText").value =
      "";


    $("postMedia").value =
      "";


    $("uploadPreview")
      .textContent =
        "";


    closeModal(
      "postModal"
    );


    await loadFeed();


    if (
      viewedProfileId ===
      currentUser.id
    ) {

      await loadProfilePosts(
        currentUser.id
      );

    }

  }

  catch (error) {

    console.error(
      "POST ERROR:",
      error
    );


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Publish Post";

  }

};


/* =========================================
   ENRICH POST
========================================= */

async function enrichPost(post) {

  const [
    profileResult,
    likesResult,
    commentsResult
  ] =
    await Promise.all([

      supabase
        .from("profiles")
        .select(
          "id,name,username,avatar_url"
        )
        .eq(
          "id",
          post.user_id
        )
        .maybeSingle(),

      supabase
        .from("likes")
        .select(
          "user_id"
        )
        .eq(
          "post_id",
          post.id
        ),

      supabase
        .from("comments")
        .select("id")
        .eq(
          "post_id",
          post.id
        )

    ]);


  post.profiles =
    profileResult.data || {

      id:
        post.user_id,

      name:
        "PLUTO User",

      username:
        "user",

      avatar_url:
        ""

    };


  post.likes =
    likesResult.data ||
    [];


  post.comments =
    commentsResult.data ||
    [];


  return post;

}


/* =========================================
   FEED
========================================= */

async function loadFeed() {

  if (!currentUser) {

    return;

  }


  const container =
    $("postsContainer");


  container.innerHTML =
    `<div class="empty-state">Loading posts...</div>`;


  try {

    const {
      data: posts,
      error
    } =
      await supabase
        .from("posts")
        .select("*")
        .order(
          "created_at",
          {
            ascending:
              false
          }
        )
        .limit(50);


    if (error) {

      throw error;

    }


    container.innerHTML =
      "";


    if (!posts?.length) {

      container.innerHTML =
        `<div class="empty-state">No posts yet.</div>`;


      renderVideos([]);

      return;

    }


    const enriched =
      await Promise.all(

        posts.map(
          post =>
            enrichPost(
              post
            )
        )

      );


    enriched.forEach(post => {

      container.appendChild(
        createPostElement(
          post
        )
      );

    });


    filterFeed();


    renderVideos(
      enriched
    );

  }

  catch (error) {

    console.error(
      "FEED ERROR:",
      error
    );


    container.innerHTML =
      `<div class="empty-state">Could not load posts.</div>`;

  }

}


/* =========================================
   CREATE POST ELEMENT
========================================= */

function createPostElement(post) {

  const article =
    document.createElement(
      "article"
    );


  article.className =
    "post searchable-post";


  const profile =
    post.profiles || {};


  const avatar =
    profile.avatar_url

      ? `<img src="${escapeHTML(profile.avatar_url)}" alt="">`

      : `<i class="fa-solid fa-user"></i>`;


  let media =
    "";


  if (
    post.media_type ===
      "image"
    &&
    post.media_url
  ) {

    media =
      `<img class="post-media" src="${escapeHTML(post.media_url)}" alt="Post image">`;

  }


  if (
    post.media_type ===
      "video"
    &&
    post.media_url
  ) {

    media =
      `<video class="post-media" src="${escapeHTML(post.media_url)}" controls></video>`;

  }


  if (
    post.media_type ===
      "audio"
    &&
    post.media_url
  ) {

    media =
      `<audio class="post-audio" src="${escapeHTML(post.media_url)}" controls></audio>`;

  }


  const liked =
    post.likes?.some(
      like =>
        like.user_id ===
        currentUser?.id
    );


  article.innerHTML = `

    <div class="post-header">

      <button
        class="post-avatar profile-link"
        type="button"
      >
        ${avatar}
      </button>


      <button
        class="post-person profile-link"
        type="button"
      >

        <strong>
          ${escapeHTML(profile.name || "PLUTO User")}
        </strong>

        <span>
          @${escapeHTML(profile.username || "user")}
          ·
          ${escapeHTML(formatTime(post.created_at))}
        </span>

      </button>

    </div>


    ${
      post.content

        ? `<div class="post-text">${escapeHTML(post.content)}</div>`

        : ""
    }


    ${media}


    <div class="post-actions">

      <button
        class="post-action like-btn"
        type="button"
      >

        <i class="${liked ? "fa-solid" : "fa-regular"} fa-heart"></i>

        <span>
          ${post.likes?.length || 0} Like
        </span>

      </button>


      <button
        class="post-action comment-btn"
        type="button"
      >

        <i class="fa-regular fa-comment"></i>

        <span>
          ${post.comments?.length || 0} Comment
        </span>

      </button>


      <button
        class="post-action share-btn"
        type="button"
      >
        <i class="fa-solid fa-share"></i>
        Share
      </button>

    </div>

  `;


  article
    .querySelectorAll(
      ".profile-link"
    )
    .forEach(button => {

      button.onclick =
      () => {

        openUserProfile(
          post.user_id
        );

      };

    });


  article
    .querySelector(
      ".like-btn"
    )
    .onclick =
    () => {

      toggleLike(
        post.id
      );

    };


  article
    .querySelector(
      ".comment-btn"
    )
    .onclick =
    () => {

      openComments(
        post.id
      );

    };


  article
    .querySelector(
      ".share-btn"
    )
    .onclick =
    () => {

      sharePost(
        post.id
      );

    };


  return article;

}


/* =========================================
   REALTIME FEED
========================================= */

function subscribeFeed() {

  if (!currentUser) {

    return;

  }


  if (feedChannel) {

    supabase.removeChannel(
      feedChannel
    );

  }


  feedChannel =
    supabase
      .channel(
        `pluto-feed-${currentUser.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",

          schema:
            "public",

          table:
            "posts"
        },
        () => {

          loadFeed();

        }
      )
      .subscribe();


  loadFeed();

}


/* =========================================
   LIKE
========================================= */

async function toggleLike(
  postId
) {

  if (!currentUser) {

    return;

  }


  const {
    data,
    error: readError
  } =
    await supabase
      .from("likes")
      .select("user_id")
      .eq(
        "post_id",
        postId
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .maybeSingle();


  if (readError) {

    console.error(
      readError
    );

    return;

  }


  if (data) {

    const {
      error
    } =
      await supabase
        .from("likes")
        .delete()
        .eq(
          "post_id",
          postId
        )
        .eq(
          "user_id",
          currentUser.id
        );


    if (error) {

      console.error(
        error
      );

    }

  }

  else {

    const {
      error
    } =
      await supabase
        .from("likes")
        .insert({

          post_id:
            postId,

          user_id:
            currentUser.id

        });


    if (error) {

      console.error(
        error
      );

    }

  }


  await refreshPostsUI();

}


/* =========================================
   COMMENTS
========================================= */

async function openComments(
  postId
) {

  activePostId =
    postId;


  openModal(
    "commentsModal"
  );


  await loadComments();

}


async function loadComments() {

  if (!activePostId) {

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("comments")
      .select("*")
      .eq(
        "post_id",
        activePostId
      )
      .order(
        "created_at",
        {
          ascending:
            true
        }
      );


  if (error) {

    console.error(
      error
    );

    return;

  }


  const list =
    $("commentsList");


  list.innerHTML =
    "";


  if (!data?.length) {

    list.innerHTML =
      `<div class="empty-state">No comments yet.</div>`;

    return;

  }


  for (
    const comment
    of data
  ) {

    const {
      data: profile
    } =
      await supabase
        .from("profiles")
        .select(
          "name,username"
        )
        .eq(
          "id",
          comment.user_id
        )
        .maybeSingle();


    const div =
      document.createElement(
        "div"
      );


    div.className =
      "comment-item";


    div.innerHTML = `

      <strong>
        ${escapeHTML(profile?.name || "User")}
      </strong>

      <p>
        ${escapeHTML(comment.content)}
      </p>

    `;


    list.appendChild(
      div
    );

  }

}


$("sendComment").onclick =
async () => {

  const text =
    $("commentInput")
      .value
      .trim();


  if (
    !text ||
    !activePostId ||
    !currentUser
  ) {

    return;

  }


  const {
    error
  } =
    await supabase
      .from("comments")
      .insert({

        post_id:
          activePostId,

        user_id:
          currentUser.id,

        content:
          text

      });


  if (error) {

    alert(
      error.message
    );

    return;

  }


  $("commentInput").value =
    "";


  await loadComments();

  await refreshPostsUI();

};


/* =========================================
   SHARE
========================================= */

async function sharePost(id) {

  const url =
    `${location.origin}${location.pathname}?post=${id}`;


  try {

    if (navigator.share) {

      await navigator.share({

        title:
          "PLUTO",

        url

      });

    }

    else {

      await navigator
        .clipboard
        .writeText(
          url
        );


      alert(
        "Post link copied."
      );

    }

  }

  catch (error) {

    console.log(error);

  }

}


/* =========================================
   PROFILE
========================================= */

function resetProfileTabs() {

  document
    .querySelectorAll(
      ".profile-tab"
    )
    .forEach(tab => {

      tab.classList.remove(
        "active"
      );

    });


  document
    .querySelectorAll(
      ".profile-tab-content"
    )
    .forEach(content => {

      content.classList.remove(
        "active"
      );

    });


  document
    .querySelector(
      '[data-profile-tab="profilePosts"]'
    )
    ?.classList.add(
      "active"
    );


  $("profilePosts")
    .classList.add(
      "active"
    );

}


async function openUserProfile(
  userId
) {

  if (
    !currentUser ||
    !userId
  ) {

    return;

  }


  try {

    const {
      data,
      error
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          userId
        )
        .maybeSingle();


    if (error) {

      throw error;

    }


    if (!data) {

      throw new Error(
        "Profile not found."
      );

    }


    viewedProfileId =
      userId;


    $("profileName")
      .textContent =
        data.name ||
        "PLUTO User";


    $("profileUsername")
      .textContent =
        `@${data.username || "user"}`;


    $("profileEmail")
      .textContent =
        userId ===
        currentUser.id

          ? currentUser.email ||
            ""

          : "";


    $("profileBio")
      .textContent =
        data.bio ||
        "Welcome to PLUTO 🚀";


    $("aboutName")
      .textContent =
        data.name ||
        "";


    $("aboutUsername")
      .textContent =
        `@${data.username || "user"}`;


    setAvatar(
      $("profileAvatar"),
      data.avatar_url
    );


    const cover =
      $("profileCover");


    if (data.cover_url) {

      cover.style
        .backgroundImage =
          `url("${data.cover_url}")`;

    }

    else {

      cover.style
        .backgroundImage =
          "";

    }


    const own =
      userId ===
      currentUser.id;


    document
      .querySelectorAll(
        ".own-profile-control"
      )
      .forEach(element => {

        element.classList.toggle(
          "hidden",
          !own
        );

      });


    document
      .querySelectorAll(
        ".other-profile-control"
      )
      .forEach(element => {

        element.classList.toggle(
          "hidden",
          own
        );

      });


    if (!own) {

      $("profileFriendBtn")
        .onclick =
        () => {

          sendFriendRequest(
            userId,
            data
          );

        };


      $("profileMessageBtn")
        .onclick =
        () => {

          openChat(
            userId,
            data
          );

        };

    }


    resetProfileTabs();


    openPage(
      "profilePage"
    );


    await Promise.all([

      loadProfilePosts(
        userId
      ),

      loadFriends(
        userId
      )

    ]);

  }

  catch (error) {

    console.error(
      "PROFILE OPEN ERROR:",
      error
    );


    alert(
      error.message
    );

  }

}


/* =========================================
   PROFILE POSTS
========================================= */

async function loadProfilePosts(
  userId
) {

  const container =
    $("profilePostsContainer");


  if (!container) {

    return;

  }


  container.innerHTML =
    `<div class="empty-state">Loading posts...</div>`;


  try {

    const {
      data: posts,
      error
    } =
      await supabase
        .from("posts")
        .select("*")
        .eq(
          "user_id",
          userId
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        );


    if (error) {

      throw error;

    }


    $("profilePostsCount")
      .textContent =
        posts?.length ||
        0;


    container.innerHTML =
      "";


    if (!posts?.length) {

      container.innerHTML =
        `<div class="empty-state">No posts yet.</div>`;

      return;

    }


    const enriched =
      await Promise.all(

        posts.map(
          post =>
            enrichPost(
              post
            )
        )

      );


    enriched.forEach(post => {

      container.appendChild(
        createPostElement(
          post
        )
      );

    });

  }

  catch (error) {

    console.error(
      "PROFILE POSTS ERROR:",
      error
    );


    container.innerHTML =
      `<div class="empty-state">Could not load profile posts.</div>`;

  }

}


async function refreshPostsUI() {

  await loadFeed();


  if (viewedProfileId) {

    await loadProfilePosts(
      viewedProfileId
    );

  }

}


$("myProfileButton").onclick =
() => {

  if (!currentUser) {

    return;

  }


  closeMenu();


  openUserProfile(
    currentUser.id
  );

};


$("feedAvatar").onclick =
() => {

  if (!currentUser) {

    return;

  }


  openUserProfile(
    currentUser.id
  );

};


$("menuAvatar").onclick =
() => {

  if (!currentUser) {

    return;

  }


  closeMenu();


  openUserProfile(
    currentUser.id
  );

};


document
  .querySelectorAll(
    ".profile-tab"
  )
  .forEach(button => {

    button.onclick =
    () => {

      document
        .querySelectorAll(
          ".profile-tab"
        )
        .forEach(item => {

          item.classList.remove(
            "active"
          );

        });


      document
        .querySelectorAll(
          ".profile-tab-content"
        )
        .forEach(item => {

          item.classList.remove(
            "active"
          );

        });


      button.classList.add(
        "active"
      );


      $(
        button.dataset
          .profileTab
      )
        ?.classList.add(
          "active"
        );

    };

  });


/* =========================================
   USER SEARCH
========================================= */

$("peopleSearch").oninput =
event => {

  clearTimeout(
    userSearchTimer
  );


  const value =
    normalizeUsername(
      event.target.value
    );


  userSearchTimer =
    setTimeout(
      () => {

        searchUsers(
          value
        );

      },
      300
    );

};


async function searchUsers(
  search
) {

  const container =
    $("peopleResults");


  container.innerHTML =
    "";


  if (
    !currentUser ||
    search.length < 2
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select("*")
      .ilike(
        "username",
        `${search}%`
      )
      .neq(
        "id",
        currentUser.id
      )
      .limit(10);


  if (error) {

    console.error(
      "USER SEARCH ERROR:",
      error
    );

    return;

  }


  if (!data?.length) {

    container.innerHTML =
      `<div class="empty-state">No users found.</div>`;

    return;

  }


  data.forEach(profile => {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "person-row";


    row.innerHTML = `

      <button
        class="person-profile"
        type="button"
      >

        <strong>
          ${escapeHTML(profile.name || "PLUTO User")}
        </strong>

        <span>
          @${escapeHTML(profile.username || "user")}
        </span>

      </button>


      <button
        class="primary-btn message-user"
        type="button"
      >
        Message
      </button>

    `;


    row
      .querySelector(
        ".person-profile"
      )
      .onclick =
      () => {

        openUserProfile(
          profile.id
        );

      };


    row
      .querySelector(
        ".message-user"
      )
      .onclick =
      () => {

        openChat(
          profile.id,
          profile
        );

      };


    container.appendChild(
      row
    );

  });

}


/* =========================================
   FRIEND REQUEST
========================================= */

async function sendFriendRequest(
  receiverId,
  profile
) {

  if (
    !currentUser ||
    receiverId ===
      currentUser.id
  ) {

    return;

  }


  try {

    const {
      error
    } =
      await supabase
        .from(
          "friend_requests"
        )
        .insert({

          sender_id:
            currentUser.id,

          receiver_id:
            receiverId

        });


    if (error) {

      if (
        error.code ===
        "23505"
      ) {

        alert(
          "Friend request already sent."
        );

        return;

      }


      throw error;

    }


    const {
      error:
        notificationError
    } =
      await supabase
        .from(
          "notifications"
        )
        .insert({

          user_id:
            receiverId,

          actor_id:
            currentUser.id,

          type:
            "friend_request",

          message:
            `${currentProfile?.name || "A user"} sent you a friend request.`

        });


    if (
      notificationError
    ) {

      console.warn(
        notificationError
      );

    }


    alert(
      `Friend request sent to ${profile.name || "user"}.`
    );

  }

  catch (error) {

    console.error(
      "FRIEND REQUEST:",
      error
    );


    alert(
      error.message
    );

  }

}


/* =========================================
   ACCEPT FRIEND
========================================= */

async function acceptFriend(
  requestId,
  senderId
) {

  const {
    error
  } =
    await supabase.rpc(
      "accept_friend_request",
      {
        request_id:
          requestId
      }
    );


  if (error) {

    alert(
      error.message
    );

    return;

  }


  await supabase
    .from("notifications")
    .insert({

      user_id:
        senderId,

      actor_id:
        currentUser.id,

      type:
        "friend_accept",

      message:
        `${currentProfile?.name || "A user"} accepted your friend request.`

    });


  await loadNotifications();


  if (viewedProfileId) {

    await loadFriends(
      viewedProfileId
    );

  }

}


/* =========================================
   FRIENDS
========================================= */

async function loadFriends(
  userId
) {

  const container =
    $("profileFriendsContainer");


  const {
    data,
    error
  } =
    await supabase
      .from("friends")
      .select(`
        friend_id,
        profiles!friends_friend_id_fkey (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq(
        "user_id",
        userId
      );


  if (error) {

    console.error(
      "FRIENDS ERROR:",
      error
    );


    $("profileFriendsCount")
      .textContent =
        "0";


    container.innerHTML =
      `<div class="empty-state">Friends unavailable.</div>`;


    return;

  }


  $("profileFriendsCount")
    .textContent =
      data?.length ||
      0;


  container.innerHTML =
    "";


  if (!data?.length) {

    container.innerHTML =
      `<div class="empty-state">No friends yet.</div>`;

    return;

  }


  data.forEach(item => {

    const profile =
      item.profiles;


    if (!profile) {

      return;

    }


    const button =
      document.createElement(
        "button"
      );


    button.className =
      "friend-row";


    button.innerHTML = `

      <strong>
        ${escapeHTML(profile.name || "PLUTO User")}
      </strong>

      <span>
        @${escapeHTML(profile.username || "user")}
      </span>

    `;


    button.onclick =
    () => {

      openUserProfile(
        profile.id
      );

    };


    container.appendChild(
      button
    );

  });

}


/* =========================================
   NOTIFICATIONS
========================================= */

async function loadNotifications() {

  if (!currentUser) {

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from(
        "notifications"
      )
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending:
            false
        }
      );


  if (error) {

    console.error(
      "NOTIFICATIONS:",
      error
    );

    return;

  }


  const list =
    $("notificationList");


  list.innerHTML =
    "";


  if (!data?.length) {

    list.innerHTML =
      `<div class="empty-state">No notifications yet.</div>`;

    return;

  }


  for (
    const notification
    of data
  ) {

    const row =
      document.createElement(
        "div"
      );


    row.className =
      "notification-row";


    const text =
      document.createElement(
        "p"
      );


    text.textContent =
      notification.message ||
      "New notification";


    row.appendChild(
      text
    );


    if (
      notification.type ===
      "friend_request"
    ) {

      const {
        data: request
      } =
        await supabase
          .from(
            "friend_requests"
          )
          .select("*")
          .eq(
            "sender_id",
            notification.actor_id
          )
          .eq(
            "receiver_id",
            currentUser.id
          )
          .eq(
            "status",
            "pending"
          )
          .maybeSingle();


      if (request) {

        const button =
          document.createElement(
            "button"
          );


        button.className =
          "primary-btn";


        button.textContent =
          "Accept";


        button.onclick =
        async () => {

          button.disabled =
            true;


          await acceptFriend(
            request.id,
            notification.actor_id
          );


          button.disabled =
            false;

        };


        row.appendChild(
          button
        );

      }

    }


    list.appendChild(
      row
    );

  }

}


function subscribeNotifications() {

  if (!currentUser) {

    return;

  }


  if (
    notificationChannel
  ) {

    supabase.removeChannel(
      notificationChannel
    );

  }


  notificationChannel =
    supabase
      .channel(
        `notifications-${currentUser.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "INSERT",

          schema:
            "public",

          table:
            "notifications",

          filter:
            `user_id=eq.${currentUser.id}`
        },
        () => {

          loadNotifications();

        }
      )
      .subscribe();

}


/* =========================================
   CONVERSATIONS
========================================= */

async function getConversation(
  otherId
) {

  const {
    data: first,
    error: firstError
  } =
    await supabase
      .from(
        "conversations"
      )
      .select("*")
      .eq(
        "user_one",
        currentUser.id
      )
      .eq(
        "user_two",
        otherId
      )
      .maybeSingle();


  if (firstError) {

    throw firstError;

  }


  if (first) {

    return first;

  }


  const {
    data: second,
    error: secondError
  } =
    await supabase
      .from(
        "conversations"
      )
      .select("*")
      .eq(
        "user_one",
        otherId
      )
      .eq(
        "user_two",
        currentUser.id
      )
      .maybeSingle();


  if (secondError) {

    throw secondError;

  }


  if (second) {

    return second;

  }


  const {
    data,
    error
  } =
    await supabase
      .from(
        "conversations"
      )
      .insert({

        user_one:
          currentUser.id,

        user_two:
          otherId

      })
      .select()
      .single();


  if (error) {

    /*
      একই সময়ে দুই client conversation
      create করলে unique conflict হতে পারে।
      Conflict হলে existing conversation
      আবার খুঁজে দেখব।
    */

    if (
      error.code ===
      "23505"
    ) {

      const {
        data: existing
      } =
        await supabase
          .from(
            "conversations"
          )
          .select("*")
          .or(
            `and(user_one.eq.${currentUser.id},user_two.eq.${otherId}),and(user_one.eq.${otherId},user_two.eq.${currentUser.id})`
          )
          .maybeSingle();


      if (existing) {

        return existing;

      }

    }


    throw error;

  }


  return data;

}


/* =========================================
   CHAT
========================================= */

async function openChat(
  userId,
  profile
) {

  if (!currentUser) {

    return;

  }


  try {

    activeChatUser = {

      ...profile,

      id:
        userId

    };


    const conversation =
      await getConversation(
        userId
      );


    activeConversationId =
      conversation.id;


    $("chatUserName")
      .textContent =
        profile.name ||
        "PLUTO User";


    setAvatar(
      $("chatUserAvatar"),
      profile.avatar_url ||
      ""
    );


    $("chatOnlineDot")
      .classList.remove(
        "active"
      );


    $("chatUserStatus")
      .textContent =
        "Checking activity...";


    openPage(
      "messagePage"
    );


    $("chatWindow")
      .classList.remove(
        "hidden"
      );


    await updateChatPresenceUI();

    await loadMessages();

    subscribeMessages();

  }

  catch (error) {

    console.error(
      "CHAT OPEN ERROR:",
      error
    );


    alert(
      error.message
    );

  }

}


async function loadMessages() {

  if (
    !currentUser ||
    !activeConversationId
  ) {

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from("messages")
      .select("*")
      .eq(
        "conversation_id",
        activeConversationId
      )
      .order(
        "created_at",
        {
          ascending:
            true
        }
      );


  if (error) {

    console.error(
      "MESSAGES ERROR:",
      error
    );

    return;

  }


  const container =
    $("chatMessages");


  container.innerHTML =
    "";


  data?.forEach(message => {

    const div =
      document.createElement(
        "div"
      );


    div.className =
      message.sender_id ===
      currentUser.id

        ? "chat-message mine"

        : "chat-message";


    div.textContent =
      message.content;


    container.appendChild(
      div
    );

  });


  container.scrollTop =
    container.scrollHeight;

}


function subscribeMessages() {

  if (
    !currentUser ||
    !activeConversationId
  ) {

    return;

  }


  if (messageChannel) {

    supabase.removeChannel(
      messageChannel
    );

  }


  messageChannel =
    supabase
      .channel(
        `chat-${activeConversationId}-${currentUser.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "INSERT",

          schema:
            "public",

          table:
            "messages",

          filter:
            `conversation_id=eq.${activeConversationId}`
        },
        () => {

          loadMessages();

          loadConversations();

        }
      )
      .subscribe();

}


async function sendMessage() {

  const text =
    $("messageInput")
      .value
      .trim();


  if (
    !text ||
    !activeConversationId ||
    !currentUser
  ) {

    return;

  }


  const {
    error
  } =
    await supabase
      .from("messages")
      .insert({

        conversation_id:
          activeConversationId,

        sender_id:
          currentUser.id,

        content:
          text

      });


  if (error) {

    alert(
      error.message
    );

    return;

  }


  await supabase
    .from("conversations")
    .update({

      updated_at:
        new Date()
          .toISOString()

    })
    .eq(
      "id",
      activeConversationId
    );


  $("messageInput").value =
    "";


  await loadMessages();

}


$("sendMessage").onclick =
  sendMessage;


$("messageInput").onkeydown =
event => {

  if (
    event.key ===
    "Enter"
  ) {

    event.preventDefault();

    sendMessage();

  }

};


$("closeChat").onclick =
() => {

  $("chatWindow")
    .classList.add(
      "hidden"
    );


  if (messageChannel) {

    supabase.removeChannel(
      messageChannel
    );


    messageChannel =
      null;

  }


  activeConversationId =
    null;


  activeChatUser =
    null;

};


/* =========================================
   CONVERSATION LIST
========================================= */

async function loadConversations() {

  if (!currentUser) {

    return;

  }


  const {
    data,
    error
  } =
    await supabase
      .from(
        "conversations"
      )
      .select("*")
      .or(
        `user_one.eq.${currentUser.id},user_two.eq.${currentUser.id}`
      )
      .order(
        "updated_at",
        {
          ascending:
            false
        }
      );


  if (error) {

    console.error(
      "CONVERSATIONS:",
      error
    );

    return;

  }


  const container =
    $("conversationList");


  container.innerHTML =
    "";


  for (
    const conversation
    of data || []
  ) {

    const otherId =
      conversation.user_one ===
      currentUser.id

        ? conversation.user_two

        : conversation.user_one;


    const {
      data: profile
    } =
      await supabase
        .from("profiles")
        .select("*")
        .eq(
          "id",
          otherId
        )
        .maybeSingle();


    if (!profile) {

      continue;

    }


    const {
      data: messages
    } =
      await supabase
        .from("messages")
        .select(
          "content,created_at"
        )
        .eq(
          "conversation_id",
          conversation.id
        )
        .order(
          "created_at",
          {
            ascending:
              false
          }
        )
        .limit(1);


    const lastMessage =
      messages?.[0];


    const button =
      document.createElement(
        "button"
      );


    button.className =
      "conversation-row";


    button.innerHTML = `

      <strong>
        ${escapeHTML(profile.name || "PLUTO User")}
      </strong>

      <span>
        ${escapeHTML(lastMessage?.content || "Open conversation")}
      </span>

    `;


    button.onclick =
    () => {

      openChat(
        profile.id,
        profile
      );

    };


    container.appendChild(
      button
    );

  }


  if (
    !container.children.length
  ) {

    container.innerHTML =
      `<div class="empty-state">No conversations yet.</div>`;

  }

}


/* =========================================
   VIDEO
========================================= */

function renderVideos(posts) {

  const container =
    $("videoContainer");


  if (!container) {

    return;

  }


  const videos =
    posts.filter(
      post =>
        post.media_type ===
        "video"
    );


  container.innerHTML =
    "";


  videos.forEach(post => {

    const video =
      document.createElement(
        "video"
      );


    video.className =
      "stream-video";


    video.src =
      post.media_url;


    video.controls =
      true;


    container.appendChild(
      video
    );

  });

}


/* =========================================
   SEARCH
========================================= */

function filterFeed() {

  const query =
    $("searchInput")
      .value
      .trim()
      .toLowerCase();


  document
    .querySelectorAll(
      "#postsContainer .searchable-post"
    )
    .forEach(post => {

      post.classList.toggle(
        "hidden",

        !post.innerText
          .toLowerCase()
          .includes(query)
      );

    });

}


$("searchInput").oninput =
  filterFeed;


/* =========================================
   THEME
========================================= */

function applyTheme(theme) {

  const dark =
    theme === "dark";


  document.body
    .classList.toggle(
      "dark-mode",
      dark
    );


  $("themeText")
    .textContent =
      dark

        ? "Light Mode"

        : "Dark Mode";

}


$("themeToggle").onclick =
async () => {

  if (
    !currentUser ||
    !currentProfile
  ) {

    return;

  }


  const oldTheme =
    currentProfile.theme ||
    "light";


  const newTheme =
    document.body
      .classList
      .contains(
        "dark-mode"
      )

        ? "light"

        : "dark";


  applyTheme(
    newTheme
  );


  const {
    error
  } =
    await supabase
      .from("profiles")
      .update({

        theme:
          newTheme,

        updated_at:
          new Date()
            .toISOString()

      })
      .eq(
        "id",
        currentUser.id
      );


  if (error) {

    console.error(
      "THEME ERROR:",
      error
    );


    applyTheme(
      oldTheme
    );


    return;

  }


  currentProfile.theme =
    newTheme;

};


/* =========================================
   PRESENCE
========================================= */

async function startPresence() {

  if (!currentUser) {

    return;

  }


  if (presenceChannel) {

    await supabase
      .removeChannel(
        presenceChannel
      );


    presenceChannel =
      null;

  }


  presenceChannel =
    supabase.channel(
      "pluto-online-users",
      {
        config: {

          presence: {

            key:
              currentUser.id

          }

        }
      }
    );


  presenceChannel.on(
    "presence",
    {
      event:
        "sync"
    },
    () => {

      const state =
        presenceChannel
          .presenceState();


      onlineUsers.clear();


      Object.keys(state)
        .forEach(id => {

          onlineUsers.add(
            id
          );

        });


      updateChatPresenceUI();

    }
  );


  presenceChannel.subscribe(
    async status => {

      if (
        status ===
        "SUBSCRIBED"
      ) {

        await presenceChannel
          .track({

            user_id:
              currentUser.id,

            online_at:
              new Date()
                .toISOString()

          });

      }

    }
  );

}


/* =========================================
   LAST SEEN
========================================= */

async function updateMyLastSeen() {

  if (!currentUser) {

    return;

  }


  const {
    error
  } =
    await supabase
      .from("profiles")
      .update({

        last_seen:
          new Date()
            .toISOString()

      })
      .eq(
        "id",
        currentUser.id
      );


  if (error) {

    console.error(
      "LAST SEEN ERROR:",
      error
    );

  }

}


function formatLastSeen(value) {

  if (!value) {

    return "Offline";

  }


  const time =
    new Date(value)
      .getTime();


  if (
    Number.isNaN(time)
  ) {

    return "Offline";

  }


  const difference =
    Math.max(
      0,
      Date.now() -
      time
    );


  const seconds =
    Math.floor(
      difference / 1000
    );


  if (
    seconds < 60
  ) {

    return "Active just now";

  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  if (
    minutes < 60
  ) {

    return `Active ${minutes}m ago`;

  }


  const hours =
    Math.floor(
      minutes / 60
    );


  if (
    hours < 24
  ) {

    return `Active ${hours}h ago`;

  }


  const days =
    Math.floor(
      hours / 24
    );


  if (
    days === 1
  ) {

    return "Active yesterday";

  }


  if (
    days < 7
  ) {

    return `Active ${days}d ago`;

  }


  return (
    "Last active " +
    new Date(value)
      .toLocaleDateString()
  );

}


async function updateChatPresenceUI() {

  if (
    !activeChatUser
  ) {

    return;

  }


  const dot =
    $("chatOnlineDot");


  const status =
    $("chatUserStatus");


  if (
    !dot ||
    !status
  ) {

    return;

  }


  const online =
    onlineUsers.has(
      activeChatUser.id
    );


  if (online) {

    dot.classList.add(
      "active"
    );


    status.textContent =
      "Active now";


    return;

  }


  dot.classList.remove(
    "active"
  );


  const {
    data,
    error
  } =
    await supabase
      .from("profiles")
      .select(
        "last_seen"
      )
      .eq(
        "id",
        activeChatUser.id
      )
      .maybeSingle();


  if (error) {

    status.textContent =
      "Offline";


    return;

  }


  status.textContent =
    formatLastSeen(
      data?.last_seen
    );

}


/* =========================================
   VISIBILITY
========================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState ===
      "visible"
    ) {

      updateMyLastSeen();

    }

  }
);

/* =========================================
   PASSWORD RECOVERY
========================================= */

$("forgotPasswordBtn").onclick =
() => {

  const loginEmail =
    $("loginEmail")
      .value
      .trim();


  $("resetEmail").value =
    loginEmail;


  openModal(
    "forgotPasswordModal"
  );

};


$("sendResetBtn").onclick =
async () => {

  const email =
    $("resetEmail")
      .value
      .trim();


  if (!email) {

    alert(
      "Enter your email address."
    );

    return;

  }


  const button =
    $("sendResetBtn");


  try {

    button.disabled =
      true;


    button.textContent =
      "Sending...";


    const redirectTo =
      `${window.location.origin}${window.location.pathname}`;


    console.log(
      "PLUTO reset URL:",
      redirectTo
    );


    const {
      error
    } =
      await supabase.auth
        .resetPasswordForEmail(
          email,
          {
            redirectTo
          }
        );


    if (error) {

      throw error;

    }


    closeModal(
      "forgotPasswordModal"
    );


    alert(
      "Password reset link sent. Check your Inbox and Spam folder."
    );

  }

  catch (error) {

    console.error(
      "RESET EMAIL ERROR:",
      error
    );


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Send Reset Link";

  }

};


$("saveNewPasswordBtn").onclick =
async () => {

  const password =
    $("newPassword")
      .value;


  const confirmation =
    $("confirmNewPassword")
      .value;


  if (
    !passwordRecoveryMode
  ) {

    alert(
      "Open a new password reset link from your email first."
    );

    return;

  }


  if (
    password.length < 6
  ) {

    alert(
      "Password must be at least 6 characters."
    );

    return;

  }


  if (
    password !==
    confirmation
  ) {

    alert(
      "Passwords do not match."
    );

    return;

  }


  const button =
    $("saveNewPasswordBtn");


  try {

    button.disabled =
      true;


    button.textContent =
      "Saving...";


    const {
      error
    } =
      await supabase.auth
        .updateUser({

          password

        });


    if (error) {

      throw error;

    }


    /*
      Recovery শেষ।
    */

    passwordRecoveryMode =
      false;


    $("newPassword").value =
      "";


    $("confirmNewPassword").value =
      "";


    closeModal(
      "newPasswordModal"
    );


    /*
      User-কে নতুন password দিয়ে
      fresh login করাব।
    */

    await supabase.auth
      .signOut();


    window.history
      .replaceState(

        {},

        document.title,

        window.location.pathname

      );


    currentUser =
      null;


    currentProfile =
      null;


    $("authPage")
      .classList.remove(
        "hidden"
      );


    $("loginForm")
      .classList.add(
        "active"
      );


    $("signupForm")
      .classList.remove(
        "active"
      );


    alert(
      "Password changed successfully. Log in with your new password."
    );

  }

  catch (error) {

    console.error(
      "PASSWORD UPDATE ERROR:",
      error
    );


    alert(
      error.message
    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save New Password";

  }

};



initializeAuth();


/* =========================
   HIANIME
========================= */

const hianimeCard = document.getElementById("hianimeCard");
const openHianimeBtn = document.getElementById("openHianimeBtn");
const closeHianimeBtn = document.getElementById("closeHianimeBtn");

const hianimeViewer = document.getElementById("hianimeViewer");
const hianimeFrame = document.getElementById("hianimeFrame");


function openHianime() {

  hianimeFrame.src = "https://hianime.at/home";

  hianimeViewer.classList.add("active");
}


function closeHianime() {

  hianimeViewer.classList.remove("active");

  hianimeFrame.src = "";
}


if (hianimeCard) {
  hianimeCard.addEventListener("click", openHianime);
}


if (openHianimeBtn) {
  openHianimeBtn.addEventListener("click", function(event) {

    event.stopPropagation();

    openHianime();

  });
}


if (closeHianimeBtn) {
  closeHianimeBtn.addEventListener("click", closeHianime);
}
