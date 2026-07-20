(() => {
  const installButton = document.getElementById("installButton");
  const offlineStatus = document.getElementById("offlineStatus");
  let deferredPrompt = null;

  function updateOnlineStatus() {
    if (!offlineStatus) return;
    offlineStatus.textContent = navigator.onLine ? "Ready" : "Offline mode";
    offlineStatus.closest(".status-line")?.classList.toggle("warn", !navigator.onLine);
  }
  addEventListener("online", updateOnlineStatus);
  addEventListener("offline", updateOnlineStatus);
  updateOnlineStatus();

  addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    if (installButton) {
      installButton.hidden = false;
      installButton.classList.add("ready");
    }
  });

  installButton?.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installButton.hidden = true;
      return;
    }
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const message = isSafari
      ? "On Safari, use File → Add to Dock to install the planner."
      : "Use your browser menu and choose Install app or Create shortcut.";
    if (typeof toast === "function") toast(message);
    else alert(message);
  });

  addEventListener("appinstalled", () => {
    if (installButton) installButton.hidden = true;
    if (typeof toast === "function") toast("Bedroom Room Planner installed");
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    addEventListener("load", async () => {
      try {
        const previousController = navigator.serviceWorker.controller;
        let reloadingForUpdate = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!previousController || reloadingForUpdate) return;
          reloadingForUpdate = true;
          location.reload();
        });
        const registration = await navigator.serviceWorker.register("./service-worker.js?v=2.01");
        if (offlineStatus) offlineStatus.textContent = "Cached after first visit";
        registration.update().catch(() => {});
      } catch (error) {
        console.warn("Offline cache unavailable", error);
        if (offlineStatus) offlineStatus.textContent = "Unavailable";
      }
    });
  } else if (offlineStatus) {
    offlineStatus.textContent = location.protocol === "file:" ? "Local folder mode" : "Unavailable";
  }
})();
