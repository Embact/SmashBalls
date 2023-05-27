const canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
let autoClick = false;
let gameStart = false;
let enemyTimeOut;
let gamename = document.querySelector(".gamename");
let scoreClass = document.querySelector(".score");
let healthClass = document.querySelector(".health");
let abilityClass = document.querySelector(".ability");
let startScreen = document.querySelector(".startScreen");
let pauseScreen = document.querySelector(".pauseScreen");
let click = false;
let mouseX = 0;
let mouseY = 0;

window.addEventListener("mousemove", (e) => {
   mouseX = e.clientX;
   mouseY = e.clientY;
});

window.addEventListener("touchmove", (e) => {
   // Check if the touch event has at least one touch
   if (e.touches.length > 0) {
      mouseX = e.touches[0].clientX;
      mouseY = e.touches[0].clientY;
   }
});

// Background Class
class Background {
   constructor() {
      this.img = new Image();
      this.img.src = "./pattern.png";
      this.patternWidth = 200;
      this.patternHeight = 200;
      this.patternCols = Math.ceil(canvas.width / this.patternWidth);
      this.patternRows = Math.ceil(canvas.height / this.patternHeight);
   }

   draw() {
      for (let col = 0; col < this.patternCols; col++) {
         for (let row = 0; row < this.patternRows; row++) {
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(this.img, col * this.patternWidth, row * this.patternHeight, this.patternWidth, this.patternHeight);
         }
      }
   }
}
// Player Class
class Player {
   #score = 0;
   #scoreX = 0;
   constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.radius = 20;
      this.minSize = this.radius;
      this.maxSize = 50;
      this.#score = 0;
      this.#scoreX = 1;
      this.totalkills = 0;
      this.totalBullets = 0;
      this.ability = 0;
      this.recharge = true;
      this.shootTimer = 0;
      this.delayDuration = 30; // Delay duration in frames (adjust as needed)
   }

   updateAbilityBar() {
      gsap.to("#abilitybar", {
         width: `${player.ability}%`,
      });
   }

   updateHealthBar(radius = this.radius) {
      let currentHealth = ((radius - this.minSize) / (this.maxSize - this.minSize)) * 100;
      if (currentHealth > 100) {
         currentHealth = 100;
      } else if (currentHealth < 0) {
         currentHealth = 0;
      }
      gsap.to("#healthbar", {
         background:
            100 - currentHealth > 50 && 100 - currentHealth <= 100
               ? "#2bd170"
               : 100 - currentHealth > 25 && 100 - currentHealth <= 50
               ? "#efa023"
               : "#d35f5f",
         duration: 0.8, // Adjust the duration as needed
      });
      gsap.to("#healthbar", {
         width: `${100 - (radius == 0 ? 100 : currentHealth)}%`,
         duration: 0.5, // Adjust the duration as needed
      });
   }

   addScore(score) {
      this.score + score <= 0 ? (this.score = 0) : (this.score += score);
      this.changeUI();
   }

   changeUI() {
      gsap.to("#score", {
         textContent: this.score,
         snap: { textContent: 1 },
         duration: 0.5, // Adjust the duration as needed
      });
   }

   get score() {
      return this.#score;
   }
   set score(score) {
      if (score - this.#score <= 500) this.#score = score;
   }
   get scoreX() {
      return this.#scoreX;
   }

   update() {
      // Add event listener for shooting
      if (this.ability >= 100 && this.recharge === true) {
         this.ability = 100;
         this.recharge = false;
         this.delayDuration = 15;
         this.#scoreX = 2;
      }
      // Check Click For Fire
      this.shootTimer++;
      if (click) {
         if (this.shootTimer >= this.delayDuration) {
            this.shootTimer = 0;
            shootProjectile(mouseX, mouseY, this.recharge);
         }
      }
      // Reduce the Ability To Zero
      if (this.recharge === false) {
         if (this.ability <= 0) {
            this.ability = 0;
            this.delayDuration = 30;
            this.#scoreX = 1;
            this.recharge = true;
         } else {
            this.ability -= 0.05;
            this.updateAbilityBar();
         }
      }
   }

   draw() {
      ctx.save();
      ctx.beginPath();
      if (this.recharge == false) {
         ctx.shadowColor = "#ffe100";
         ctx.shadowBlur = this.ability / 5;
      }
      ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = "#ffe100";
      ctx.lineWidth = (this.radius * 50) / 100;
      ctx.stroke();
      ctx.fill();
      ctx.closePath();
      ctx.restore();
   }
}
//  Projectile Class
class Projectile {
   constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
   }

   update() {
      this.draw();
      this.x = this.x + this.velocity.x;
      this.y = this.y + this.velocity.y;
   }

   draw() {
      ctx.save();
      ctx.beginPath();
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
      ctx.restore();
   }
}
//  Enemy Class
class Enemy {
   constructor(x, y, radius, color, velocity) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
   }

   update() {
      this.draw();
      // this.radius <= this.maxRadius && (this.radius += 0.05);
      const randomSpeed = Math.random() * (2 - 1) + 1;
      this.x = this.x + this.velocity.x * randomSpeed;
      this.y = this.y + this.velocity.y * randomSpeed;
   }

   draw() {
      const distanceFromCenter = Math.sqrt(Math.pow(this.x - canvas.width / 2, 2) + Math.pow(this.y - canvas.height / 2, 2));

      //  Draw Line
      let getDest = Math.hypot(this.x - canvas.width / 2, this.y - canvas.height / 2);
      if (getDest < 300) {
         ctx.save();
         ctx.beginPath();
         ctx.moveTo(this.x, this.y);
         ctx.lineTo(canvas.width / 2, canvas.height / 2);
         ctx.setLineDash([this.radius, this.radius / 2, 4]);
         ctx.strokeStyle = this.color;
         ctx.stroke();
         ctx.closePath();
         ctx.restore();
      }

      // Draw Body
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.lineCap = "round";
      ctx.setLineDash([2, 3, 16]);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
      // Enemy Eyes
      const degToRad = (deg) => (deg * Math.PI) / 180;

      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius - 5, Math.PI * 2, false);
      ctx.fillStyle = "white";
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 40;
      ctx.shadowOffsetX = this.radius * (this.velocity.x / 10);
      ctx.shadowOffsetY = this.radius * (this.velocity.y / 10);
      ctx.fill();
      ctx.closePath();
      ctx.restore();
   }
}
//  Particle Class
class Particle {
   constructor(x, y, radius, color, velocity, friction = 0.99) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
      this.alpha = 1;
      this.friction = friction;
   }

   update() {
      this.draw();
      // this.radius <= this.maxRadius && (this.radius += 0.05);
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      this.x = this.x + this.velocity.x;
      this.y = this.y + this.velocity.y;
      this.alpha -= 0.005;
   }

   draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.closePath();
      ctx.restore();
   }
}
//  Particle Class
class ExpParticle {
   constructor(x, y, radius, enemyRadius, color, velocity, friction = 0.99) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
      this.velocity = velocity;
      this.friction = friction;
      this.enemyRadius = enemyRadius;
   }

   update() {
      this.draw();
      // this.radius <= this.maxRadius && (this.radius += 0.05);
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      this.x = this.x + this.velocity.x;
      this.y = this.y + this.velocity.y;
   }

   draw() {
      ctx.save();
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
   }
}
//  Score Class
class Score {
   constructor(x, y, text, color, size, velocity, friction = 0.99) {
      this.x = x;
      this.y = y;
      this.text = text;
      this.color = color;
      this.size = size;
      this.velocity = velocity;
      this.friction = friction;
      this.alpha = 1;
   }

   update() {
      this.draw();
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      this.x = this.x + this.velocity.x;
      this.y = this.y + this.velocity.y;
      this.alpha -= 0.01;
   }

   draw() {
      ctx.font = `bold ${this.size}px arial`;
      ctx.fillStyle = this.color;
      ctx.fillText(this.text, this.x, this.y);
   }
}

// Build Player
const x = canvas.width / 2;
const y = canvas.height / 2;
let player = new Player(x, y, "white");

let projectiles = [];
let enemies = [];
let particles = [];
let expParticles = [];
let scoreList = [];

function spawnEnemies() {
   const radius = Math.random() * (40 - 10) + 10;
   let x;
   let y;
   if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
      // y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
   } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
   }

   const color = colorGenerator();

   const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
   const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
   };
   gameStart && enemies.push(new Enemy(x, y, radius, color, velocity));
}

let bg = new Background();

let animationID;
function animate() {
   /////////////////////////////////
   player.update();
   /////////////////////////////////
   animationID = requestAnimationFrame(animate);

   bg.draw();
   // ctx.globalCompositeOperation = "destination-over";
   // bg.draw();
   // ctx.fillStyle = `rgba(29,32,41,0.10)`;
   // ctx.globalCompositeOperation = "source-over";
   // ctx.fillRect(0, 0, canvas.width, canvas.height);

   /////////////////////////////////
   // Draw Particles
   particles.forEach((particle, index) => {
      if (particle.alpha <= 0.01) {
         particles.splice(index, 1);
      }
      particle.update();
   });
   /////////////////////////////////
   // Draw ExpParticles
   expParticles.forEach((expParticle, index) => {
      // Get Distance Between ExpParticles And Player
      const dist = Math.hypot(player.x - expParticle.x, player.y - expParticle.y);
      if (dist - expParticle.radius - player.radius < 1) {
         if (player.recharge) {
            player.ability = player.ability < 100 ? player.ability + expParticle.enemyRadius / 2 : 100;
            gsap.to("#abilitybar", {
               width: `${player.ability}%`,
            });
         }
         // Incr
         gsap.to(player, {
            radius: player.radius > player.minSize ? player.radius - 1 : player.radius < player.minSize ? player.minSize : player.radius,
         });
         // Increase Health
         player.updateHealthBar();
         // Remove Particle
         expParticles.splice(index, 1);
      }
      expParticle.update();
   });
   /////////////////////////////////
   // Draw Score
   scoreList.forEach((score, index) => {
      if (score.alpha <= 0.01) {
         scoreList.splice(index, 1);
      }
      score.update();
   });
   /////////////////////////////////
   // Draw Projectile
   projectiles.forEach((projectile, index) => {
      projectile.update();
      // Remove from Edges Of Screen
      if (
         projectile.x + projectile.radius < 0 ||
         projectile.x - projectile.radius > canvas.width ||
         projectile.y + projectile.radius < 0 ||
         projectile.y - projectile.radius > canvas.height
      ) {
         setTimeout(() => {
            projectiles.splice(index, 1);
         }, 0);
      }
   });
   ///////////////////////////////////////////////////////////////////
   // Enimes Area
   enemies.forEach((enemy, index) => {
      enemy.update();
      // Get Distance between Player and Enemy
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist - enemy.radius - player.radius < 1) {
         // Set Timeout to Remove the Flashing Effect
         setTimeout(() => {
            // If Player Radius Equal Max Size => Explosion
            if (player.radius <= player.maxSize) {
               // Score
               const calcScore = parseInt(Math.random() * (150 - 40) + 40 + enemy.radius / 2) * player.scoreX;
               scoreList.push(
                  new Score(
                     enemy.x,
                     enemy.y,
                     `${calcScore}-`,
                     "#e84747",
                     16,
                     {
                        x: 0,
                        y: -2,
                     },
                     0.95
                  )
               );
               player.addScore(-calcScore);
               gsap.to(player, {
                  radius: player.radius > 0 && player.radius + enemy.radius / 5,
               });
               setTimeout(() => {
                  player.updateHealthBar();
               }, 100);
               // Create Explostions When Enemy Hit PLayer
               for (let i = 0; i < enemy.radius * 2; i++) {
                  particles.push(
                     new Particle(enemy.x, enemy.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 5),
                        y: (Math.random() - 0.5) * (Math.random() * 5),
                     })
                  );
               }
               // remove enemy
               enemies.splice(index, 1);
            } else {
               // Create Explostions When Enemy Hit PLayer
               for (let i = 0; i < player.radius * 2; i++) {
                  particles.push(
                     new Particle(
                        player.x,
                        player.y,
                        Math.random() * 2,
                        player.color,
                        {
                           x: (Math.random() - 0.5) * (Math.random() * 8),
                           y: (Math.random() - 0.5) * (Math.random() * 8),
                        },
                        0.998
                     )
                  );
               }
               setTimeout(() => {
                  // Destroy Player
                  player.radius = 0;
               }, 100);
               setTimeout(() => {
                  gameStart = false;
                  // Destroy All Enemies And Add Particles For Every One
                  enemies.forEach((enemy, index) => {
                     for (let i = 0; i < enemy.radius * 2; i++) {
                        particles.push(
                           new Particle(enemy.x, enemy.y, Math.random() * 2, enemy.color, {
                              x: (Math.random() - 0.5) * (Math.random() * 5),
                              y: (Math.random() - 0.5) * (Math.random() * 5),
                           })
                        );
                     }
                     enemies.splice(index, 1);
                  });
               }, 800);
               setTimeout(() => {
                  // Freeze The Game
                  gameOver();
               }, 1300);
            }
         }, 0);
      }
      ///////////////////////////////////////////////////////////////////
      // Bullets Area
      projectiles.forEach((projectile, projectileIndex) => {
         // Math.hypot => Get Space Betwee Two Points
         const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
         // When Projectile Touch Enemy
         if (dist - enemy.radius - projectile.radius < 1) {
            // Create Explostions
            for (let i = 0; i < enemy.radius * 2; i++) {
               // Particles
               particles.push(
                  new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                     x: (Math.random() - 0.5) * (Math.random() * 5),
                     y: (Math.random() - 0.5) * (Math.random() * 5),
                  })
               );
            }
            // Check Enemy Size
            if (enemy.radius - 10 > 8) {
               // enemy.radius -= 10;
               gsap.to(enemy, {
                  radius: enemy.radius - 10,
               });
               // Score
               const calcScore = parseInt(Math.random() * (50 - 10) + 10 + enemy.radius / 2) * player.scoreX;
               scoreList.push(
                  new Score(
                     enemy.x,
                     enemy.y,
                     `${calcScore}+`,
                     "#ffe100",
                     14,
                     {
                        x: 0,
                        y: -2,
                     },
                     0.95
                  )
               );
               // Update Score
               player.addScore(calcScore);
               setTimeout(() => {
                  projectiles.splice(projectileIndex, 1);
               }, 0);
            } else {
               // ExpParticle
               const expParticleAngle = Math.atan2(canvas.height / 2 - enemy.y, canvas.width / 2 - enemy.x);
               // Math.cos && Math.sin => Take Angle to get cos and sin
               const expParticleVelocity = {
                  x: Math.cos(expParticleAngle) * 7,
                  y: Math.sin(expParticleAngle) * 7,
               };
               expParticles.push(new ExpParticle(enemy.x, enemy.y, 4, enemy.radius, "#ffe100", expParticleVelocity, 0.994));
               // Update Kills Counter
               player.totalkills += 1;
               // Score
               const calcScore = parseInt(Math.random() * (250 - 80) + 80 + enemy.radius / 2) * player.scoreX;
               scoreList.push(
                  new Score(
                     enemy.x,
                     enemy.y,
                     `${calcScore}+`,
                     "#ffe100",
                     16,
                     {
                        x: 0,
                        y: -2,
                     },
                     0.95
                  )
               );
               player.addScore(calcScore);
               // Set Timeout to Remove the Flashing Effect
               setTimeout(() => {
                  enemies.splice(index, 1);
                  projectiles.splice(projectileIndex, 1);
               }, 0);
            }
         }
      });
   });
   /////////////////////////////////
   player.draw();
}

const returnedData = {
   name: localStorage.getItem("__player_High_Score"),
   score: parseInt(localStorage.getItem("__player_High_Score")),
   index: -1,
};
let updated = false;
function gameOver() {
   if (updated == false) {
      gameStart = false;
      click = false;
      // Check If User in Leaderboard
      checkPlayer();
      if (localStorage.getItem("__player_High_Score") < player.score) {
         localStorage.setItem("__player_High_Score", player.score);
      }

      // let leaderItem = document.querySelector(".leaderItem");
      let highScore = document.querySelector(".highScore span:first-child");
      highScore.innerText = numberWithCommas(localStorage.getItem("__player_High_Score"));
      let ttlScore = document.querySelector(".leaderItem.ttlScore span:last-child");
      ttlScore.innerText = numberWithCommas(player.score);
      let ttlKills = document.querySelector(".leaderItem.ttlKills span:last-child");
      ttlKills.innerText = numberWithCommas(player.totalkills);
      let ttlBullets = document.querySelector(".leaderItem.ttlBullets span:last-child");
      ttlBullets.innerText = numberWithCommas(player.totalBullets);
      // numberWithCommas
      pauseScreen.style.display = "block";
      // startScreen.style.display = "block";
      gamename.style.display = "block";
      scoreClass.style.display = "none";
      healthClass.style.display = "none";
      abilityClass.style.display = "none";
      abilityClass.style.display = "none";
      gsap.to("#abilitybar", {
         width: `0%`,
      });
   }
   updated = true;
   clearInterval(enemyTimeOut);
   cancelAnimationFrame(animationID);
}
document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("continueGame").addEventListener("click", () => {
   pauseScreen.style.display = "none";
   startScreen.style.display = "block";
});
function checkPlayer() {
   // Check For Local storage
   if (localStorage.getItem("__player_name") == null) {
      changeName();
   } else {
      document.getElementById("playerName").value = localStorage.getItem("__player_name");
   }

   if (localStorage.getItem("__player_id") == null) {
      localStorage.setItem("__player_id", randomID());
   }

   if (localStorage.getItem("__player_High_Score") == null) {
      localStorage.setItem("__player_High_Score", 0);
   }
}
checkPlayer();

function changeName() {
   localStorage.setItem("__player_name", document.getElementById("playerName").value.slice(0, 10));
}

function randomID() {
   return Math.floor(Math.random() * 1000000000);
}

function startGame() {
   updated = updated && false;
   // Clear canvas
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   if (localStorage.getItem("__player_name") != document.getElementById("playerName").value) {
      changeName();
   }
   // Reset variables
   projectiles = [];
   particles = [];
   expParticles = [];
   scoreList = [];
   enemies = [];
   player = new Player(x, y, "white");
   player.updateHealthBar();

   // Clear existing enemies
   clearInterval(enemyTimeOut);

   // Reset enemy spawn timeout
   enemyTimeOut = setInterval(spawnEnemies, 800);

   // Reset game flags and UI
   startScreen.style.display = "none";
   gamename.style.display = "none";
   scoreClass.style.display = "block";
   healthClass.style.display = "block";
   abilityClass.style.display = "block";

   // Reset score
   gsap.to("#score", {
      textContent: 0,
      snap: { textContent: 1 },
      duration: 0.2,
   });
   // Start Game
   gameStart = true;
   // Start animation loop
   animate();
}
function shootProjectile(x, y, recharge) {
   const angle = Math.atan2(y - canvas.height / 2, x - canvas.width / 2);
   const velocity = {
      x: Math.cos(angle) * 5,
      y: Math.sin(angle) * 5,
   };
   // Update BUllets
   player.totalBullets += 1;

   // console.log(player.totalkills, player.totalBullets);
   projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, !recharge ? "#ffe100" : "white", velocity));
}
// Click Events
window.addEventListener("mousedown", (e) => {
   click = true;
});
window.addEventListener("mouseup", (e) => {
   click = false;
});
window.addEventListener("keydown", (e) => {
   if (e.code == "Space") {
      click = true;
   }
});

window.addEventListener("keyup", (e) => {
   click = false;
});
window.addEventListener("touchstart", (e) => {
   click = true;
});
window.addEventListener("touchend", (e) => {
   click = false;
});
// Initial setup
function colorGenerator() {
   return `hsl(${Math.random() * 360},80%,50%)`;
}
// Show Leaderboard
const leaderboard = document.querySelector(".leaderboard .items");
const icons = ["🏆", "🥇", "🥈", "🥉", "🔸"];
// Load Commas Between Numbers
document.querySelectorAll(".item > div:last-child").forEach((e) => {
   e.setAttribute("data-score", e.innerText);
   e.innerText = numberWithCommas(e.innerText);
});
// Slice Player Name
document.querySelectorAll(".item > div span:last-child").forEach((e) => {
   if (e.innerText.length > 10) {
      e.innerText = e.innerText.slice(0, 10) + "...";
   } else {
      e.innerText = e.innerText;
   }
});

function numberWithCommas(x) {
   return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
