
const $ = id => document.getElementById(id);

const defaults = {
  pet: "cat",
  name: "Mochi",
  breed: "default",
  theme: "pink",
  coins: 100,
  hunger: 80,
  happiness: 85,
  energy: 90,
  health: 100,
  inventory: [],
  accessory: "",
  lastGift: ""
};

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem("mypetworld-save"));
    if (saved && typeof saved === "object") {
      return { ...defaults, ...saved };
    }
  } catch {}
  return { ...defaults };
}

let game = loadGame();

for (const key of ["coins", "hunger", "happiness", "energy", "health"]) {
  const n = Number(game[key]);
  game[key] = Number.isFinite(n)
    ? Math.max(0, Math.min(key === "coins" ? 999999 : 100, n))
    : defaults[key];
}

if (!["cat", "dog"].includes(game.pet)) game.pet = "cat";
if (!["default", "orange", "white", "gray"].includes(game.breed)) game.breed = "default";
if (!["pink", "lavender", "garden"].includes(game.theme)) game.theme = "pink";
if (typeof game.name !== "string") game.name = defaults.name;
if (!Array.isArray(game.inventory)) game.inventory = [];

const breeds = {
  cat: {
    default: "🐱", orange: "🐈", white: "🐈‍⬜", gray: "🐱"
  },
  dog: {
    default: "🐶", orange: "🐕", white: "🐩", gray: "🐕‍🦺"
  }
};

const accessoryPrices = {
  "🎀": 10,
  "🧢": 15,
  "💐": 20,
  "💎": 25
};

function save() {
  try {
    localStorage.setItem("mypetworld-save", JSON.stringify(game));
  } catch {}
}

function say(message) {
  $("speech").textContent = message;
  $("message").textContent = message;
}

function render() {
  $("coins").textContent = game.coins;
  $("pet").textContent = breeds[game.pet][game.breed];
  $("petName").textContent = game.name;
  $("nameInput").value = game.name;
  $("breed").value = game.breed;
  $("roomTheme").value = game.theme;
  $("room").className = "room " + (game.theme === "pink" ? "" : game.theme);

  $("wornAccessory").textContent = game.accessory;

  const average = (game.hunger + game.happiness + game.energy) / 3;
  let mood = "💕 Feeling happy!";

  if (game.health < 30) mood = "💗 Needs some care";
  else if (game.hunger < 30) mood = "🍓 Feeling hungry";
  else if (game.energy < 25) mood = "😴 Feeling sleepy";
  else if (game.happiness < 30) mood = "🥺 Needs some love";
  else if (average > 80) mood = "✨ Super happy!";

  $("mood").textContent = mood;

  ["hunger", "happiness", "energy", "health"].forEach(key => {
    const value = Math.round(game[key]);
    $(key + "Text").textContent = value + "%";
    $(key + "Bar").style.width = value + "%";
  });

  document.querySelectorAll(".pet-choice").forEach(button => {
    button.classList.toggle("selected", button.dataset.pet === game.pet);
  });

  $("inventory").textContent = game.inventory.length
    ? "Your goodies: " + game.inventory.join(", ")
    : "Your goodies: none yet";

  save();
}

document.querySelectorAll(".pet-choice").forEach(button => {
  button.addEventListener("click", () => {
    game.pet = button.dataset.pet;
    game.breed = "default";
    game.name = game.pet === "cat" ? "Mochi" : "Biscuit";
    say(game.pet === "cat"
      ? "Meow! Let's have a cozy day! 🐱"
      : "Woof! You're my favourite human! 🐶");
    render();
  });
});

$("breed").addEventListener("change", event => {
  game.breed = event.target.value;
  say("A new look for your bestie! ✨");
  render();
});

$("roomTheme").addEventListener("change", event => {
  game.theme = event.target.value;
  say("Welcome to your freshly decorated room! 🏡");
  render();
});

$("nameBtn").addEventListener("click", () => {
  const name = $("nameInput").value.trim();

  if (!name) {
    say("Please enter a cute name first! 💗");
    return;
  }

  game.name = name.slice(0, 16);
  say("Awww! " + game.name + " loves their new name! 💕");
  render();
});

$("nameInput").addEventListener("keydown", event => {
  if (event.key === "Enter") $("nameBtn").click();
});

function care(action) {
  if (action === "feed") {
    if (game.hunger >= 100) return say("I'm already full! Thank you 💗");
    game.hunger = Math.min(100, game.hunger + 25);
    game.happiness = Math.min(100, game.happiness + 5);
    game.health = Math.min(100, game.health + 3);
    say("Yummy! That was delicious! 🍓");
  }

  if (action === "play") {
    if (game.energy < 15) return say("I'm sleepy. Let me rest first! 😴");
    game.happiness = Math.min(100, game.happiness + 20);
    game.energy = Math.max(0, game.energy - 15);
    game.hunger = Math.max(0, game.hunger - 8);
    say(game.pet === "cat"
      ? "Meow! I love chasing yarn! 🧶"
      : "Woof! Throw the ball again! 🎾");
  }

  if (action === "sleep") {
    game.energy = Math.min(100, game.energy + 30);
    game.health = Math.min(100, game.health + 5);
    say("Zzz... sweet dreams, little bestie! 💤");
  }

  if (action === "bath") {
    game.happiness = Math.min(100, game.happiness + 8);
    say("All clean and fluffy! 🫧");
  }

  game.coins += 5;
  render();
}

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => care(button.dataset.action));
});

function buyItem(item, cost) {
  if (game.inventory.includes(item)) {
    return say("You already have this item! 💕");
  }

  if (game.coins < cost) {
    return say("Not enough coins! Care for your pet to earn more 🪙");
  }

  game.coins -= cost;
  game.inventory.push(item);
  say("Yay! You unlocked " + item + "! 🎁");
  render();
}

$("treatBtn").addEventListener("click", () => buyItem("Special treat 🍪", 15));
$("toyBtn").addEventListener("click", () => buyItem("Cute toy 🧸", 25));

document.querySelectorAll("[data-accessory]").forEach(button => {
  button.addEventListener("click", () => {
    const item = button.dataset.accessory;
    const cost = accessoryPrices[item];

    if (game.inventory.includes(item)) {
      game.accessory = item;
      $("accessoryMessage").textContent = "Accessory equipped! 💕";
      render();
      return;
    }

    if (game.coins < cost) {
      $("accessoryMessage").textContent = "Not enough coins yet! 🪙";
      return;
    }

    game.coins -= cost;
    game.inventory.push(item);
    game.accessory = item;
    $("accessoryMessage").textContent = "Looking adorable! ✨";
    render();
  });
});

$("removeAccessory").addEventListener("click", () => {
  game.accessory = "";
  $("accessoryMessage").textContent = "Your pet is looking natural! 🐾";
  render();
});

$("dailyGift").addEventListener("click", () => {
  const today = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, "0"),
    String(new Date().getDate()).padStart(2, "0")
  ].join("-");

  if (game.lastGift === today) {
    $("accessoryMessage").textContent = "You already claimed today's gift! 💗";
    return;
  }

  game.coins += 30;
  game.lastGift = today;
  $("accessoryMessage").textContent = "Yay! You got 30 bonus coins! 🎁";
  render();
});

// Needs gradually decrease while the game is open.
setInterval(() => {
  game.hunger = Math.max(0, game.hunger - 1);
  game.energy = Math.max(0, game.energy - 0.5);

  if (game.hunger < 15 || game.energy < 10) {
    game.health = Math.max(0, game.health - 1);
  } else {
    game.health = Math.min(100, game.health + 0.25);
  }

  render();
}, 60000);

render();

const furnitureItems = document.querySelectorAll(".furniture");

function renderFurniture() {
  const container = document.getElementById("roomDecorations");
  if (!container) return;

  container.replaceChildren();

  const owned = game.inventory.filter(item =>
    ["🛏️", "🧸", "🌷", "🏠"].includes(item)
  );

  owned.forEach(item => {
    const decoration = document.createElement("span");
    decoration.textContent = item;
    decoration.title = "Your room decoration";
    container.appendChild(decoration);
  });
}

furnitureItems.forEach(button => {
  button.addEventListener("click", () => {
    const item = button.dataset.furniture;
    const price = Number(button.dataset.price);

    if (game.inventory.includes(item)) {
      document.getElementById("furnitureMessage").textContent =
        "You already own this decoration! 💗";
      return;
    }

    if (game.coins < price) {
      document.getElementById("furnitureMessage").textContent =
        "Not enough coins! Care for your pet to earn more 🪙";
      return;
    }

    game.coins -= price;
    game.inventory.push(item);

    document.getElementById("furnitureMessage").textContent =
      item + " Added to your pet's home! 🏡";

    render();
    renderFurniture();
  });
});

renderFurniture();

