const Canvas = require("canvas"),
  Discord = require("discord.js");

// Register Cooper font
Canvas.registerFont(`${__dirname}/../assets/fonts/Cooper.ttf`, {
  family: "Cooper",
});
Canvas.registerFont(
  `${__dirname}/../node_modules/discord-canvas/assets/fonts/theboldfont.ttf`,
  { family: "Bold" }
);

const applyText = (canvas, text, defaultFontSize) => {
  const ctx = canvas.getContext("2d");
  do {
    ctx.font = `${(defaultFontSize -= 1)}px Bold`;
  } while (ctx.measureText(text).width > 208);
  return ctx.font;
};

module.exports = async function (channel, badgeIMG, desc, author) {
  let canvas = Canvas.createCanvas(418, 170),
    ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#1d1e21";
  ctx.beginPath();
  const x = 0;
  const y = 0;
  const width = canvas.width;
  const height = canvas.height;
  const radius = 20;
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.clip();
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  let badge = await Canvas.loadImage(
    `${__dirname}/../node_modules/discord-canvas/assets/img/rank/${badgeIMG}.png`
  );
  ctx.drawImage(badge, 40, 40, 90, 90);

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Bold";
  ctx.fillText("Succès déverrouillé", 40 + 90 + 40, 65);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  applyText(canvas, desc, 15);
  ctx.fillText(desc, 40 + 90 + 40 + 104, 120);

  let attachment = new Discord.MessageAttachment(
    canvas.toBuffer(),
    "achievement.png"
  );

  channel.send(
    `🎉 Félicitation ${author} ! Vous venez d'obtenir un succès ! 🎉`,
    attachment
  );
};
