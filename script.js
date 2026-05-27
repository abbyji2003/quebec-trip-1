const stops = [
  {
    title: "Fontaine de Tourny",
    meta: "09:30 · 从省议会大厦前开始，步行进入老城。",
    query: "Fontaine de Tourny, Quebec City",
    lat: 46.8087,
    lng: -71.2142,
  },
  {
    title: "La Bûche",
    meta: "10:20 · 魁北克风 brunch，适合把早餐和午餐合并。",
    query: "La Buche, Quebec City",
    lat: 46.8111,
    lng: -71.2128,
  },
  {
    title: "Pierre-Dugua-De-Mons Terrace",
    meta: "11:35 · 观景台和草坪连在一起，适合拍全景。",
    query: "Pierre-Dugua-De-Mons Terrace, Quebec City",
    lat: 46.8089,
    lng: -71.2076,
  },
  {
    title: "Château Frontenac",
    meta: "12:40 · 沿达费林平台走到芳堤娜城堡。",
    query: "Fairmont Le Chateau Frontenac, Quebec City",
    lat: 46.8119,
    lng: -71.2062,
  },
  {
    title: "Maison Smith Place Royale",
    meta: "14:15 · 下城咖啡、甜点和街景休息点。",
    query: "Maison Smith Place Royale, Quebec City",
    lat: 46.8134,
    lng: -71.2027,
  },
  {
    title: "Rue du Petit-Champlain + Red Door",
    meta: "15:05 · 小尚普兰街区，红门、石墙、橱窗和坡道。",
    query: "Rue du Petit Champlain red door, Quebec City",
    lat: 46.8124,
    lng: -71.2020,
  },
  {
    title: "Délices Érable & Cie",
    meta: "16:00 · 枫糖、枫糖冰淇淋和伴手礼。",
    query: "Delices Erable & Cie, Quebec City",
    lat: 46.8125,
    lng: -71.2050,
  },
  {
    title: "Escalier Casse-Cou",
    meta: "17:05 · 从告白台阶慢慢回到上城。",
    query: "Escalier Casse-Cou, Quebec City",
    lat: 46.8131,
    lng: -71.2037,
  },
  {
    title: "La Boutique de Noël de Québec",
    meta: "18:10 · 圣诞礼品店和傍晚散步作为一天结尾。",
    query: "La Boutique de Noel de Quebec",
    lat: 46.8133,
    lng: -71.2076,
  },
];

const tripDate = document.querySelector("#tripDate");
const countdownText = document.querySelector("#countdownText");
const mapTitle = document.querySelector("#mapTitle");
const mapMeta = document.querySelector("#mapMeta");
const liveMap = document.querySelector("#liveMap");
const startRouteButton = document.querySelector("#startRouteButton");
const musicToggle = document.querySelector("#musicToggle");
const destinationButtons = [...document.querySelectorAll("[data-map-stop]")];
const planItems = [...document.querySelectorAll(".plan-item[data-route-index]")];
let currentPosition = null;
let activeStopIndex = 0;

function updateCountdown() {
  const savedDate = localStorage.getItem("quebec-trip-date");
  if (savedDate && !tripDate.value) tripDate.value = savedDate;

  if (!tripDate.value) {
    countdownText.textContent = "Pick a date";
    return;
  }

  const target = new Date(`${tripDate.value}T09:30:00`);
  const days = Math.ceil((target - new Date()) / 86400000);
  countdownText.textContent = days > 0 ? `${days} days` : days === 0 ? "Today" : "Memory mode";
  localStorage.setItem("quebec-trip-date", tripDate.value);
}

tripDate.addEventListener("change", updateCountdown);
updateCountdown();
setInterval(updateCountdown, 60000);

function distanceInMeters(a, b) {
  const earthRadius = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function embeddedMapUrl(stop) {
  const destination = encodeURIComponent(stop.query);

  if (currentPosition) {
    const origin = `${currentPosition.lat},${currentPosition.lng}`;
    return `https://maps.google.com/maps?output=embed&saddr=${origin}&daddr=${destination}&dirflg=w`;
  }

  return `https://maps.google.com/maps?output=embed&q=${destination}`;
}

function updateNearestArea() {
  if (!currentPosition) return;

  stops
    .map((stop) => ({
      stop,
      distance: distanceInMeters(currentPosition, stop),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function setActiveStop(index) {
  activeStopIndex = index;
  const stop = stops[index];
  mapTitle.textContent = stop.title;
  mapMeta.textContent = stop.meta;
  liveMap.src = embeddedMapUrl(stop);

  destinationButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.mapStop) === index);
  });

  planItems.forEach((item) => {
    item.classList.toggle("active", Number(item.dataset.routeIndex) === index);
  });
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      updateNearestArea();
      setActiveStop(activeStopIndex);
    },
    () => {},
    {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 12000,
    }
  );
}

destinationButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveStop(Number(button.dataset.mapStop)));
});

planItems.forEach((item) => {
  const go = () => setActiveStop(Number(item.dataset.routeIndex));
  item.addEventListener("click", go);
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") go();
  });
});

startRouteButton.addEventListener("click", () => {
  setActiveStop(0);
  document.querySelector("#plan").scrollIntoView({ behavior: "smooth", block: "start" });
});
setActiveStop(0);
requestLocation();

const bgm = document.querySelector("#bgm");

async function playBgm() {
  if (!bgm) return;
  bgm.volume = 0.42;

  try {
    await bgm.play();
  } catch {
    const resume = () => {
      bgm.play();
      document.removeEventListener("pointerdown", resume);
      document.removeEventListener("keydown", resume);
      document.removeEventListener("touchstart", resume);
    };
    document.addEventListener("pointerdown", resume, { once: true });
    document.addEventListener("keydown", resume, { once: true });
    document.addEventListener("touchstart", resume, { once: true });
  }
}

playBgm();

musicToggle.addEventListener("click", async () => {
  if (!bgm) return;

  if (bgm.paused) {
    await bgm.play();
    musicToggle.textContent = "BGM on";
  } else {
    bgm.pause();
    musicToggle.textContent = "BGM off";
  }
});
