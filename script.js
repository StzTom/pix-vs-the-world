const MIGRATION_VERSION = "2";

const savedMigration =
  localStorage.getItem(
    "pix_migration_version"
  );

if(savedMigration !== MIGRATION_VERSION){

  localStorage.setItem(
    "pix_migration_version",
    MIGRATION_VERSION
  );

}


const SUPABASE_URL = "https://tijjbqrjeagbeepfjtbf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpampicXJqZWFnYmVlcGZqdGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTAwNzQsImV4cCI6MjA5MzU2NjA3NH0.gnkTBKQkxHXdzQikzBRvpIXDJvfWsaHt5BMeB0zJgqw";

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let playerId =
  localStorage.getItem(
    "pix_player_id"
  );

if(!playerId){

  if(
    window.crypto
    &&
    crypto.randomUUID
  ){

    playerId =
      crypto.randomUUID();

  }
  else{

    playerId =
      Date.now().toString()
      +
      Math.random()
      .toString(36)
      .substring(2);

  }

  localStorage.setItem(
    "pix_player_id",
    playerId
  );

}

let gameEnded = false;

let rewardClaimed = false;

let lastPixState = "";

let activeBonus = null;

let bonusEndsAt = null;

let clickMultiplier = 1;

let dailyClicks = 0;

let dailyGoal = 10000;

let currentReward = "";

let communityNames = [];

let localClicks = null;

if(localClicks === 10){

  addFeedMessage(
    "Vous commencez à résister à Pix."
  );

}

if(localClicks === 100){

  addFeedMessage(
    "Vous avez atteint 100 clics."
  );

}

if(localClicks === 500){

  addFeedMessage(
    "Pix commence à vous remarquer."
  );

}

const feed =
  document.getElementById("liveFeed");

function addFeedMessage(message){

  const div =
    document.createElement("div");

  div.classList.add("feedMessage");

  div.innerText = message;

  feed.prepend(div);

  // max 3 messages

while(feed.children.length > 3){

  feed.removeChild(feed.lastChild);

}
}

function updateContribution(){

  let pseudo =
    localStorage.getItem(
      "pix_pseudo"
    );

  if(!pseudo){
    pseudo = "Anonyme";
  }

  const clicks =
    localClicks ?? "...";

  document.getElementById(
    "contribution"
  ).innerText =
    "Contribution de "
    + pseudo +
    " : "
    + clicks +
    " clics";

}

// =========================
// LOAD GAME
// =========================

async function loadDailyObjective(){

const { data: updatedClicks, error } =
  await client.rpc(
    "increment_player_clicks",
    {
      player_uuid: playerId,
      click_value: clickMultiplier
    }
  );

console.log(
  "PLAYER ID:",
  playerId
);

console.log(
  "UPDATED CLICKS:",
  updatedClicks
);

console.log(
  "RPC ERROR:",
  error
);

  if(
    activeBonus ===
    "BOOST X2 — 1H"
  ){
    clickMultiplier = 2;
  }

  if(
    activeBonus ===
    "BOOST X3 — 15MIN"
  ){
    clickMultiplier = 3;
  }

  if(
    activeBonus ===
    "RAGE DU MONDE — 10MIN"
  ){
    clickMultiplier = 2;
  }

  // affichage progression

  const displayClicks =
    Math.min(
      dailyClicks,
      dailyGoal
    );

  document.getElementById(
    "dailyProgress"
  ).innerText =
    displayClicks +
    " / " +
    dailyGoal;

  const rewardElement =
    document.getElementById(
      "dailyReward"
    );

  if(activeBonus){

    rewardElement.classList.add(
      "completed"
    );

  }
  else{

    rewardElement.classList.remove(
      "completed"
    );

  }

if(!activeBonus){

  if(rewardClaimed){

    rewardElement.innerText =
      "RÉCOMPENSE TERMINÉE";

  }
  else{

    rewardElement.innerText =
      "RÉCOMPENSE : " +
      currentReward;

  }

}

}

async function loadGame() {

  const { data } = await client
    .from("global_score")
    .select("*")
    .eq("id",1)
    .single();

  if(!data) return;

  // scores

  let world = data.world_score;
  let pix = data.pix_score;

  document.getElementById("world").innerText = world;
  document.getElementById("pix").innerText = pix;

  // domination

  let total = world + pix;

  if(total > 0){

    let percent =
      Math.floor((world / total) * 100);

    document.getElementById("worldPercent")
  .innerText = percent + "%";

document.getElementById("pixPercent")
  .innerText = (100 - percent) + "%";

    document.getElementById("bar")
      .style.width = percent + "%";

    // couleur barre

    const bar =
  document.getElementById("bar");

if(percent >= 70){

  bar.style.background =
    "linear-gradient(90deg,#00ff88,#00ffd5)";

  bar.style.boxShadow =
    `
    0 0 20px rgba(0,255,136,0.8),
    0 0 40px rgba(0,255,136,0.45)
    `;

}
else if(percent >= 40){

  bar.style.background =
    "linear-gradient(90deg,#ffb347,#ff7043)";

  bar.style.boxShadow =
    `
    0 0 20px rgba(255,140,0,0.8),
    0 0 40px rgba(255,90,0,0.45)
    `;

}
else{

  bar.style.background =
    "linear-gradient(90deg,#ff3b3b,#ff003c)";

  bar.style.boxShadow =
    `
    0 0 20px rgba(255,0,60,0.8),
    0 0 40px rgba(255,0,0,0.45)
    `;

}

  }

  // état Pix

 let pixText =
  document.getElementById("pixState").innerText;

 if(lastPixState !== data.pix_state){

  lastPixState = data.pix_state;

  switch(data.pix_state){

    case "calm":

      pixText = "Pix est calme";

      addFeedMessage(
        "Pix observe silencieusement le monde..."
      );

      break;

    case "pressure":

      pixText = "Pix est sous pression";

      addFeedMessage(
        "Pix commence à réagir."
      );

      break;

    case "rage":

      pixText = "Pix est en rage";

      addFeedMessage(
        "Pix entre en rage."
      );

      break;

    case "ultimate":

      pixText = "Pix atteint sa forme ultime";

      addFeedMessage(
        "Pix devient incontrôlable."
      );

      break;

  }

}

  document.getElementById("pixState")
    .innerText = pixText;


  // timer

  updateTimer(data.game_ends_at);

  // victoire / défaite

  if(data.game_status !== "running"){

    gameEnded = true;

    pixel.style.display = "none";
    if(data.game_status === "world_win"){

      document.getElementById("gameMessage")
        .innerText =
        "Pix a été battu… mais il reviendra… plus fort.";

    }
    else{

      document.getElementById("gameMessage")
        .innerText =
        "Vous n’étiez pas prêts.";

    }

  }

}

async function loadPlayerClicks(){

  const { data } =
    await client
      .from("players")
      .select("total_clicks")
      .eq("id", playerId)
      .maybeSingle();
      
  console.log(
  "LOADED PLAYER CLICKS:",
  data
);

  if(data){

    localClicks =
      data.total_clicks || 0;

    updateContribution();

  }

}
// =========================
// TIMER
// =========================

function updateTimer(endDate){

  let end =
    new Date(endDate).getTime();

  let now =
    new Date().getTime();

  let distance =
    end - now;

const timer =
  document.getElementById("timer");

  if(distance < 0){
    distance = 0;
  }

  let days =
    Math.floor(distance / (1000*60*60*24));

  let hours =
    Math.floor((distance % (1000*60*60*24))
    / (1000*60*60));

  let minutes =
    Math.floor((distance % (1000*60*60))
    / (1000*60));

  let seconds =
    Math.floor((distance % (1000*60))
    / 1000);

    if(distance <= 3600000){

  timer.style.color = "#ff4444";

  timer.style.textShadow =
    `
    0 0 12px rgba(255,50,50,0.9),
    0 0 30px rgba(255,0,0,0.7),
    0 0 60px rgba(255,0,0,0.45)
    `;

  timer.style.animation =
    "timerDanger 0.7s infinite";

}
else if(distance <= 21600000){

  timer.style.color = "#ff9f43";

  timer.style.textShadow =
    `
    0 0 10px rgba(255,170,0,0.8),
    0 0 25px rgba(255,120,0,0.5)
    `;

  timer.style.animation =
    "timerPulse 1.4s infinite";

}
else{

  timer.style.color = "#ff9f43";

  timer.style.textShadow =
    `
    0 0 10px rgba(255,140,0,0.7),
    0 0 24px rgba(255,90,0,0.45)
    `;

  timer.style.animation =
    "timerPulse 2.5s infinite";

}

  document.getElementById("timer")
    .innerText =
    days+"j "+
    hours+"h "+
    minutes+"m "+
    seconds+"s";

}

 async function updateBonusTimer(){

  const rewardElement =
    document.getElementById(
      "dailyReward"
    );

  // aucun bonus

  if(
    !activeBonus
    ||
    !bonusEndsAt
  ){

    return;

  }

  const end =
    new Date(
      bonusEndsAt
    ).getTime();

  const now =
    new Date().getTime();

  let distance =
    end - now;

  // bonus terminé

  if(distance <= 0){

rewardElement.innerText =
  "RÉCOMPENSE TERMINÉE";

  activeBonus = null;

  bonusEndsAt = null;

  clickMultiplier = 1;

rewardElement.innerText = "RÉCOMPENSE TERMINÉE";    

  return;

}

  const hours =
    Math.floor(
      distance / (1000*60*60)
    );

  const minutes =
    Math.floor(
      (distance % (1000*60*60))
      / (1000*60)
    );

  const seconds =
    Math.floor(
      (distance % (1000*60))
      / 1000
    );

  const formattedTime =
    String(hours).padStart(2,"0")
    + "h" +
    String(minutes).padStart(2,"0")
    + "m" +
    String(seconds).padStart(2,"0")
    + "s";

  rewardElement.innerText =
    "RÉCOMPENSE : "
    + activeBonus.replace(
      / — .*/,
      ""
    )
    + " "
    + formattedTime;

}

let heat = 0;

let overheated = false;

const pixel =
  document.getElementById("pixel");


async function migrateLocalClicks(){

const alreadyMigrated =
  localStorage.getItem(
    "pix_clicks_migrated"
  );

if(alreadyMigrated){
  return;
}

  const localStoredClicks =
    parseInt(
      localStorage.getItem(
        "pix_clicks"
      )
    ) || 0;

  if(localStoredClicks <= 0){
    return;
  }

  await client.rpc(
    "increment_player_clicks",
    {

      player_uuid: playerId,

      click_value: localStoredClicks

    }
  );

  localStorage.removeItem(
    "pix_clicks"
  );

  localStorage.setItem(
  "pix_clicks_migrated",
  "true"
);

}  

async function clickPixel(){

  if(!playerPseudo){

  overlay.style.display = "flex";

  return;

}

  if(gameEnded) return;

  // animation choc

  pixel.classList.add("hit");
  
  document.body.style.transform =
  "translateX(2px)";

setTimeout(() => {

  document.body.style.transform =
    "translateX(0px)";

},40);

  setTimeout(() => {
    pixel.classList.remove("hit");
  },80);

  // chauffe

if(
  activeBonus !==
  "RAGE DU MONDE — 10MIN"
){

  heat += 3;

}

  if(heat >= 50){

  document.body.style.transform =
    `translateX(${Math.random()*4-2}px)`;

}
else{

  document.body.style.transform =
    "translateX(0px)";

}

  // glow chaleur

pixel.style.boxShadow =
  `
  0 0 ${20 + heat}px rgba(255,80,80,0.9),
  0 0 ${40 + heat}px rgba(255,0,0,0.4)
  `;

pixel.style.filter =
  `brightness(${1 + heat/120})`;

if(heat >= 70){

  pixel.classList.add("hot");
  pixel.classList.add("overheat");

}
else{

  pixel.classList.remove("overheat");
  pixel.classList.remove("hot");

}

  // backend
localClicks += clickMultiplier;

updateContribution();
  
const { data, error } =
  await client.rpc(
    "process_click",
    {
      click_amount:
        clickMultiplier,

      vulnerable_pix:
        vulnerablePix
    }
  );

console.log(
  "PROCESS CLICK:",
  data
);

console.log(
  "PROCESS ERROR:",
  error
);

  await client.rpc(
    "increment_player_clicks",
    {

      player_uuid: playerId,

      click_value: clickMultiplier

    }
  );

if(updatedClicks !== null){

  localClicks = updatedClicks;

  updateContribution();

}

const vulnerablePix =
  activeBonus ===
  "PIX VULNÉRABLE — 30MIN";

const { data } =
  await client.rpc(
    "process_click",
    {

      click_amount:
        clickMultiplier,

      vulnerable_pix:
        vulnerablePix

    }
  );

// sync instant frontend

if(data && data.length > 0){

  const clickData = data[0];

  document.getElementById("world")
    .innerText =
    clickData.returned_world_score;

  document.getElementById("pix")
    .innerText =
    clickData.returned_pix_score;

  dailyClicks =
    clickData.returned_daily_clicks;

  activeBonus =
    clickData.returned_active_bonus;

  bonusEndsAt =
    clickData.returned_bonus_ends_at;

  rewardClaimed =
    clickData.returned_reward_claimed;

}

await loadDailyObjective();
await loadGame();

}

// refroidissement naturel

setInterval(() => {

if(heat >= 70){

  heat -= 4;

}
else if(heat >= 40){

  heat -= 2;

}
else{

  heat -= 1;
  if(heat < 0){
  heat = 0;
}

}


  // glow dynamique

if(heat <= 0){

  pixel.style.boxShadow =
    `
    0 0 20px #00ffe1,
    0 0 40px rgba(0,255,225,0.5)
    `;

}
else{

  pixel.style.boxShadow =
    `
    0 0 ${20 + heat}px rgba(255,80,80,0.9),
    0 0 ${40 + heat}px rgba(255,0,0,0.35)
    `;

}
  // luminosité dynamique

  pixel.style.filter =
    `brightness(${1 + heat/120})`;

  // body shake

  if(heat >= 50){

    document.body.style.transform =
      `translateX(${Math.random()*4-2}px)`;

  }
  else{

    document.body.style.transform =
      "translateX(0px)";

  }

  // états visuels

  if(heat >= 70){

    pixel.classList.add("overheat");
    pixel.classList.add("hot");

  }
  else{

    pixel.classList.remove("overheat");
    pixel.classList.remove("hot");

  }

},100);

// event

pixel.addEventListener("click",clickPixel);

// refresh live

setInterval(loadGame,1000);

setInterval(
  loadDailyObjective,
  3000
);

let playerPseudo =
  localStorage.getItem("pix_pseudo");

  const returnMessages = [

  playerPseudo +
  " s'est remis à l'attaque de Pix.",

  "Pix tremble en voyant " +
  playerPseudo +
  " revenir.",

  playerPseudo +
  " revient participer à l'effort de guerre."

];

// overlay pseudo

const overlay =
  document.getElementById("pseudoOverlay");

const startBtn =
  document.getElementById("startBtn");


if(playerPseudo){

  overlay.style.display = "none";

  const randomMessage =
    returnMessages[
      Math.floor(
        Math.random() *
        returnMessages.length
      )
    ];

  addFeedMessage(randomMessage);

}

startBtn.addEventListener("click", async () => {

  const input =
    document.getElementById("pseudoInput");

  let pseudo =
    input.value.trim();
pseudo =
  pseudo.replace(/[^a-zA-Z0-9_-]/g,"");
  
  if(pseudo.length < 3){

    alert("Pseudo invalide."); 
   
    return;}
  
  const { data: existingPseudo } = 
    
    await client .from("players") 
    
    .select("id") 
    
    .eq("pseudo", pseudo) 
    .neq("id", playerId) 
    .maybeSingle();
  
  if(existingPseudo){ 
    
    alert( "Pseudo déjà utilisé." ); 
   
   return;}

  localStorage.setItem(
    "pix_pseudo",
    pseudo
  );

  const oldPseudo = playerPseudo;

  playerPseudo = pseudo;

await client
  .from("players")
  .upsert({

    id: playerId,

    pseudo: playerPseudo,

    total_clicks: localClicks,

    updated_at:
      new Date().toISOString()

  },
  {
    onConflict:"id"
  });

overlay.style.display = "none";

updateContribution();

if(
  oldPseudo
  &&
  oldPseudo !== pseudo
){

  addFeedMessage(
    oldPseudo +
    " est devenu " +
    pseudo +
    "."
  );

}
else{

  addFeedMessage(
    pseudo +
    " a rejoint nos rangs."
  );

}

});

async function syncPlayerData(){

  const pseudo =
    localStorage.getItem(
      "pix_pseudo"
    );

  if(!pseudo){
    return;
  }

const clicks = 0;

  const { data: existingPlayer } =
    await client
      .from("players")
      .select("id")
      .eq("id", playerId)
      .maybeSingle();

  if(existingPlayer){
    return;
  }

  await client
    .from("players")
    .upsert({

      id: playerId,

      pseudo: pseudo,

      total_clicks: clicks,

      updated_at:
        new Date().toISOString()

    });

  addFeedMessage(
    pseudo +
    " rejoint le classement."
  );

}

async function loadCommunityNames(){

  const { data } = await client
    .from("players")
    .select("pseudo")
    .limit(20);

  if(data){

    communityNames =
      data.map(player => player.pseudo);

  }

}

let lastCommunityPseudo = "";
let lastCommunityAction = "";

const communityActions = [

  "attaque Pix sans relâche.",
  "fait trembler Pix.",
  "résiste encore.",
  "harcèle Pix.",
  "refuse d'abandonner.",
  "pousse Pix dans ses retranchements.",
  "ne se laisse pas faire par Pix.",
  "continue de cliquer malgré la douleur.",
  "ne cède pas face à Pix.",

  "affaiblit Pix coup après coup.",
  "participe à l'effort de guerre.",
  "fait reculer Pix.",
  "gagne du terrain contre Pix.",
  "continue le combat.",
  "frappe Pix sans hésitation.",
  "attaque encore et encore.",
  "fait pression sur Pix.",
  "maintient Pix sous tension.",
  "s'acharne sur Pix.",

  "est un héros du Monde.",
  "est un fléau pour Pix.",
  "est un adversaire redoutable pour Pix.",
  "est un pilier de la résistance.",
  "est un combattant infatigable.",
  "est un véritable guerrier du Monde.",
  "est un cauchemar vivant pour Pix.",
  "est une menace grandissante pour Pix.",

  "vient de lancer une attaque.",
  "refuse de laisser Pix gagner.",
  "reste mobilisé contre Pix.",
  "continue la résistance.",
  "surveille les mouvements de Pix.",
  "prépare une nouvelle offensive.",
  "attaque Pix avec violence.",
  "fait vaciller Pix.",

  "commence à énerver Pix.",
  "donne du fil à retordre à Pix.",
  "fait perdre patience à Pix.",
  "n'a aucune pitié pour Pix.",
  "ne ralentit toujours pas.",

  "semble inarrêtable.",
  "est toujours dans la bataille.",
  "revient au front.",
  "mène une offensive contre Pix.",
  "continue l'assaut.",

  // rares / humoristiques

  "attaque Pix avec une énergie inquiétante.",
  "a probablement trop de temps libre.",
  "semble déterminé à détruire Pix.",
  "n'a clairement pas peur de Pix.",
  "vient encore de cliquer.",
  "refuse littéralement de s'arrêter.",
  "commence à faire peur à Pix.",
  "est devenu une obsession pour Pix."

];

const globalMessages = [

  "Le Monde contre-attaque.",
  "Pix perd du terrain.",
  "La résistance s'organise.",
  "Le Monde refuse d'abandonner.",
  "Pix commence à vaciller.",
  "Une vague d'attaques frappe Pix.",
  "Le Monde intensifie l'assaut.",
  "Pix subit une pression constante.",
  "Les combattants du Monde restent mobilisés.",
  "Pix semble perturbé."

];

const rareMessages = [

  "Pix semble observer silencieusement le Monde.",
  "Une anomalie entoure Pix.",
  "Le Monde retient son souffle.",
  "Pix devient momentanément instable.",
  "Quelque chose change autour de Pix...",
  "Une présence étrange traverse le Monde.",
  "Pix semble perdre le contrôle.",
  "Le combat atteint un nouveau niveau."

];

async function loadLeaderboard(){

 const { data } = await client
  .from("players")
  .select("pseudo,total_clicks")
  .not("pseudo","is",null)
  .order(
    "total_clicks",
    { ascending:false }
  )
  .limit(10);

  if(!data) return;

  const container =
    document.getElementById(
      "leaderboardContent"
    );

  container.innerHTML = "";

  data.forEach((player,index) => {

    container.innerHTML += `

      <div class="leaderboardPlayer">

        <div>

          <span class="leaderboardRank">
            #${index + 1}
          </span>

          ${player.pseudo}

        </div>

        <div class="leaderboardClicks">

          ${player.total_clicks} clics

        </div>

      </div>

    `;

  });

}

function launchCommunityFeed(){

  const randomChance =
    Math.random();

  // =====================
  // MESSAGES RARES
  // =====================

  if(randomChance <= 0.08){

    const rareMessage =
      rareMessages[
        Math.floor(
          Math.random() *
          rareMessages.length
        )
      ];

    addFeedMessage(
      rareMessage
    );

  }

  // =====================
  // MESSAGES GLOBAUX
  // =====================

  else if(randomChance <= 0.30){

    const globalMessage =
      globalMessages[
        Math.floor(
          Math.random() *
          globalMessages.length
        )
      ];

    addFeedMessage(
      globalMessage
    );

  }

  // =====================
  // MESSAGES JOUEURS
  // =====================

  else{

    if(communityNames.length > 0){

      let pseudo = "";
      let action = "";

      do{

        pseudo =
          communityNames[
            Math.floor(
              Math.random() *
              communityNames.length
            )
          ];

      } while(
        pseudo === lastCommunityPseudo
        &&
        communityNames.length > 1
      );

      do{

        action =
          communityActions[
            Math.floor(
              Math.random() *
              communityActions.length
            )
          ];

      } while(
        action === lastCommunityAction
        &&
        communityActions.length > 1
      );

      lastCommunityPseudo = pseudo;
      lastCommunityAction = action;

      addFeedMessage(
        pseudo + " " + action
      );

    }

  }

  // délai aléatoire

  const nextDelay =
    Math.floor(
      Math.random() * 6000
    ) + 5000;

  setTimeout(
    launchCommunityFeed,
    nextDelay
  );

}


launchCommunityFeed();

setInterval(loadCommunityNames,10000);

setInterval(
  updateBonusTimer,
  1000
);

async function initGame(){

  await loadPlayerClicks();

  await syncPlayerData();

  await migrateLocalClicks();

  await loadDailyObjective();

  await loadGame();

  await loadLeaderboard();

  updateContribution();

}

initGame();

setInterval(
  loadLeaderboard,
  5000
);

const GAME_VERSION = "1.1.3";

const savedVersion =
  localStorage.getItem(
    "pix_game_version"
  );

if(savedVersion !== GAME_VERSION){

  localStorage.setItem(
    "pix_game_version",
    GAME_VERSION
  );

  window.location.href =
    window.location.pathname 
    "?v=" +
    GAME_VERSION;

}