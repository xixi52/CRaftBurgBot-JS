const Command = require("../../structures/Command.js"),
  GifEncoder = require("gif-encoder"),
  Canvas = require("canvas"),
  Discord = require("discord.js"),
  fs = require("fs");

class Verif extends Command {
  constructor(client) {
    super(client, {
      name: "verif",
      dirname: __dirname,
      enabled: true,
      guildOnly: false,
      aliases: [],
      examples: "$verif",
      usage: "verif",
      desc: "Permet de vérifier votre compte Minecraft et de le lier au serveur Discord!",
      memberPermissions: [],
      botPermissions: ["EMBED_LINKS"],
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000,
    });
  }

  async run(message, args, data) {
    let codeSLQ = null;
    const client = this.client;

    await client.db.query(
      `SELECT * FROM \`bot_users\` WHERE userID = '${message.author.id}';`,
      async function (err, result, fields) {
        if (err) throw err;

        const string = JSON.stringify(result);
        const parse = JSON.parse(string);
        const userData = parse[0];

        if (userData) {
          if (userData.verif == 3)
            return message.channel.send("compte déjà vérifié");
          if (userData.verif == 1 || userData.verif == 2) {
            if (args[0]) {
              if (args[0].toLowerCase() === "stop") {
                client.db.query(
                  `UPDATE bot_users SET codeVerif = NULL, verif = 0 WHERE userID = '${message.author.id}';`,
                  function (err, result, fields) {
                    if (err) return;

                    message.channel.send(
                      client.config.emojis.success +
                        " | La procédure de vérification a été annulée, pour la relancer entrez la commande `" +
                        client.config.prefix +
                        "verif`"
                    );
                  }
                );
                return;
              } else {
                return message.channel.send(
                  client.config.emojis.error +
                    " | Une procédure de vérification est déjà en cours pour annuler la procédure veuillez entrer la commande `" +
                    client.config.prefix +
                    "verif stop`"
                );
              }
            } else {
              return message.channel.send(
                client.config.emojis.error +
                  " | Une procédure de vérification est déjà en cours pour annuler la procédure veuillez entrer la commande `" +
                  client.config.prefix +
                  "verif stop`"
              );
            }
          }
        }

        if (userData && userData.codeVerif) {
          codeSLQ = userData.codeVerif;
        }

        let code = null;
        let otherCode = null;

        do {
          const code1 = Math.floor(Math.random() * 9).toString(),
            code2 = Math.floor(Math.random() * 9).toString(),
            code3 = Math.floor(Math.random() * 9).toString(),
            code4 = Math.floor(Math.random() * 9).toString(),
            code5 = Math.floor(Math.random() * 9).toString(),
            code6 = Math.floor(Math.random() * 9).toString();

          code = code1 + code2 + code3 + code4 + code5 + code6;

          await client.db.query(
            `SELECT * FROM \`bot_users\` WHERE codeVerif = '${code}';`,
            async function (err, result, fields) {
              if (err) throw err;

              const string = JSON.stringify(result),
                parse = JSON.parse(string),
                userData = parse[0];

              otherCode = userData;
            }
          );
        } while (code === codeSLQ || otherCode);

        let chars = code.split("");

        client.db.query(
          `UPDATE bot_users SET codeVerif = '${code}', verif = 1 WHERE userID = '${message.author.id}';`,
          function (err, result, fields) {
            if (err) return;
          }
        );

        const gif = new GifEncoder(303, 48),
          // Collect output
          file = require("fs").createWriteStream("verif-" + code + ".gif"),
          // use node-canvas
          canvas = Canvas.createCanvas(303, 48),
          ctx = canvas.getContext("2d");
        gif.pipe(file);
        gif.setRepeat(0);
        gif.setQuality(20);

        // Write out the image into memory
        gif.writeHeader();

        // add frames function
        async function addFrames() {
          gif.setDelay(200);

          for (let i = 0; i < 14; i++) {
            let img = null;
            if (i < 8) {
              img = await Canvas.loadImage(
                "./assets/img/verif/verif" + i + "-min.png"
              );
            } else {
              if (i == 13) gif.setDelay(3000);
              img = await Canvas.loadImage(
                "./assets/img/verif/verif" + i + "_" + chars[i - 8] + "-min.png"
              );
            }
            ctx.drawImage(img, 0, 0, 303, 48);
            const pixels = ctx.getImageData(
              0,
              0,
              224 + 50 * 2,
              411 + 25 * 2
            ).data;
            gif.addFrame(pixels);
          }

          await gif.finish();
        }
        await addFrames();

        let embed1 = new Discord.MessageEmbed()
          .setTitle("Vérification de votre compte Minecraft!")
          .setColor(data.config.embed.color)
          .addField(
            "✅ | Lancement de la procédure",
            "Bonjour " +
              message.author.username +
              "\n\nPour bénéficier de toutes les fonctionnalités de CraftBurg.fr, vous pouvez lier votre compte Discord à votre compte Minecraft. Pour ce faire, suivez les instructions reçues en message privé."
          )
          .setFooter(
            "Demandé par " +
              message.author.username +
              " | CraftBurg.fr | Fondé par xixi52 avec \uD83E\uDDE1",
            message.author.avatarURL()
          );

        await message.channel.send(embed1);

        const attachment = await new Discord.MessageAttachment(
          "verif-" + code + ".gif",
          "verif-" + code + ".gif"
        );

        let embed = new Discord.MessageEmbed()
          .setTitle("Vérification de votre compte Minecraft!")
          .setColor(data.config.embed.color)
          .addField(
            "1️⃣ | Etape 1",
            "Pour lancer la procédure de vérification, rendez-vous sur le serveur Minecraft `play.craftburg.fr`et entrez la commande `/verif " +
              code +
              "`\nVous recevrez ensuite un dernier message privé de ma part pour finaliser la vérification!"
          )
          .setFooter("CraftBurg.fr | Fondé par xixi52 avec 🧡")
          .attachFiles(attachment)
          .setImage("attachment://" + "verif-" + code + ".gif");

        await message.author.send(embed);

        const path = "verif-" + code + ".gif";

        try {
          fs.unlinkSync(path);
          //file removed
        } catch (err) {
          console.error(err);
        }
      }
    );
  }
}

module.exports = Verif;
