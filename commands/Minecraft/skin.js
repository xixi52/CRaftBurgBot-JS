const Command = require("../../structures/Command.js"),
  request = require("request"),
  Canvas = require("canvas"),
  fs = require("fs"),
  fetch = require("node-fetch"),
  Discord = require("discord.js"),
  GifEncoder = require("gif-encoder");

const generateEmbed = async (uuid, name, data, m, message) => {
  try {
    // Fetch data from paladium server
    const res = await fetch(
        "https://api.mojang.com/user/profiles/" + uuid + "/names"
      ),
      body = await res.json(),
      gif = new GifEncoder(224 + 50 * 2, 411 + 25 * 2),
      // use node-canvas
      canvas = Canvas.createCanvas(224 + 50 * 2, 411 + 25 * 2),
      ctx = canvas.getContext("2d"),
      // Collect output
      file = require("fs").createWriteStream(m.id + ".gif");
    gif.pipe(file);
    gif.setTransparent(0x242e06);
    gif.setRepeat(0);
    gif.setDelay(150);
    gif.setQuality(20);

    // Write out the image into memory
    gif.writeHeader();

    ctx.textAlign = "center";

    m.edit(data.config.emojis.loading + " | Génération du skin 3D - 0%");

    for (let i = 0; i < 180; i += 10) {
      if (i == 90)
        m.edit(data.config.emojis.loading + " | Génération du skin 3D - 25%");
      if (i == 160)
        m.edit(data.config.emojis.loading + " | Génération du skin 3D - 50%");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const background = await Canvas.loadImage(
        "./assets/img/pixels/background-gif.png"
      );
      ctx.drawImage(
        background,
        224 / 2 - background.width / 2 + 50,
        411 / 2 - background.height / 2 + 25,
        background.width,
        background.height
      );
      const img = await Canvas.loadImage(
        data.config.api.skin3D +
          "?user=" +
          encodeURI(name) +
          "&hr=" +
          i +
          "&aa=true&vrra=20&vrla=-20&vrrl=-20&vrll=20"
      );
      ctx.drawImage(
        img,
        224 / 2 - img.width / 2 + 50,
        411 / 2 - img.height / 2 + 25,
        img.width,
        img.height
      );
      const pixels = ctx.getImageData(0, 0, 224 + 50 * 2, 411 + 25 * 2).data;
      gif.addFrame(pixels);
    }

    for (let i = -180; i < 0; i += 10) {
      if (i == -90)
        m.edit(data.config.emojis.loading + " | Génération du skin 3D - 75%");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const background = await Canvas.loadImage(
        "./assets/img/pixels/background-gif.png"
      );
      ctx.drawImage(
        background,
        224 / 2 - background.width / 2 + 50,
        411 / 2 - background.height / 2 + 25,
        background.width,
        background.height
      );
      const img = await Canvas.loadImage(
        data.config.api.skin3D +
          "?user=" +
          encodeURI(name) +
          "&hr=" +
          i +
          "&aa=true&vrra=20&vrla=-20&vrrl=-20&vrll=20"
      );
      ctx.drawImage(
        img,
        224 / 2 - img.width / 2 + 50,
        411 / 2 - img.height / 2 + 25,
        img.width,
        img.height
      );
      const pixels = ctx.getImageData(0, 0, 224 + 50 * 2, 411 + 25 * 2).data;
      gif.addFrame(pixels);
    }

    // gif.addFrame(pixels); // Write subsequent rgba arrays for more frames
    gif.finish();

    const attachment = await new Discord.MessageAttachment(
      m.id + ".gif",
      m.id + ".gif"
    );

    let embed = new Discord.MessageEmbed()
      .setAuthor(name, "https://minotar.net/helm/" + name + "/190.png")
      .setTitle("Télécharger le skin de " + name + " !")
      .setURL("https://minotar.net/download/" + name)
      .setThumbnail("https://minotar.net/helm/" + name + "/190.png")
      .setImage("attachment://" + m.id + ".gif")
      .attachFiles(attachment)
      .addField(
        "Historique des noms d'utilisateur",
        body.map((v) => "• " + v.name).join("\n")
      )
      .setFooter(
        "Demandé par " +
          message.author.username +
          " | CraftBurg.fr | Fondé par xixi52 avec \uD83E\uDDE1",
        message.author.avatarURL()
      )
      .setColor(data.config.embed.color);

    await m.channel.send(embed);
    const path = m.id + ".gif";

    try {
      fs.unlinkSync(path);
      //file removed
    } catch (err) {
      console.error(err);
    }
    return m.delete();
  } catch (e) {
    return m.edit(data.config.emojis.error + " | Une erreur est survenue...");
  }
};

class Skin extends Command {
  constructor(client) {
    super(client, {
      name: "skin",
      dirname: __dirname,
      enabled: true,
      guildOnly: false,
      aliases: [],
      examples: "$skin xixi52_YT",
      usage: "skin (tag Discord / pseudo Minecraft)",
      desc: "Affiche les informations et le skin d'un compte Minecraft!",
      memberPermissions: [],
      botPermissions: ["EMBED_LINKS"],
      nsfw: false,
      ownerOnly: false,
      cooldown: 40000,
    });
  }

  async run(message, args, data) {
    const e = data.config.emojis;

    let uuid = null,
      mcName = null,
      client = this.client,
      m = await message.channel.send(
        e.loading + " | Collecte des données de Mojang..."
      );

    await client.db.query(
      `SELECT \`mcName\`, \`uuid\`, \`verif\` FROM \`bot_users\` WHERE userID = '${message.author.id}';`,
      async function (err, result, fields) {
        if (err)
          return message.channel.send(
            e.error + " | Une erreur est survenue ! Veuillez réessayer !"
          );
        const string = JSON.stringify(result);
        const parse = JSON.parse(string);
        data.user = parse[0];

        if (!data.user) {
          await client.db.query(
            `INSERT INTO \`bot_users\` (\`userID\`) VALUES ('${message.author.id}');`,
            async function (err, result, fields) {
              if (err)
                return message.channel.send(
                  e.error + " | Une erreur est survenue ! Veuillez réessayer !"
                );
            }
          );
        }

        if (!args[0]) {
          await client.db.query(
            `SELECT \`mcName\`, \`uuid\`, \`verif\` FROM \`bot_users\` WHERE userID = '${message.author.id}';`,
            async function (err, result, fields) {
              if (err)
                return message.channel.send(
                  e.error + " | Une erreur est survenue ! Veuillez réessayer !"
                );
              const string = JSON.stringify(result),
                parse = JSON.parse(string);
              data.user = parse[0];

              if (!data.user) {
                await client.db.query(
                  `INSERT INTO \`bot_users\` (\`userID\`) VALUES ('${message.author.id}');`,
                  async function (err, result, fields) {
                    if (err)
                      return message.channel.send(
                        e.error +
                          " | Une erreur est survenue ! Veuillez réessayer !"
                      );
                    return m.edit(
                      e.error +
                        " | Veuillez entrer un pseudo Minecraft, un pseudo Discord, ou lier votre compte Minecraft !\nExemple: `" +
                        client.config.prefix +
                        "minecraft xixi52_YT`"
                    );
                  }
                );
              } else if (
                data.user.uuid &&
                data.user.mcName &&
                data.user.verif == 3
              ) {
                uuid = data.user.uuid;
                mcName = data.user.mcName;
                await generateEmbed(uuid, mcName, data, m, message);
              } else {
                return m.edit(
                  e.error +
                    " | Veuillez entrer un pseudo Minecraft, un pseudo Discord, ou lier votre compte Minecraft !\nExemple: `" +
                    client.config.prefix +
                    "minecraft xixi52`"
                );
              }
            }
          );
        } else {
          let username = args[0];

          const regex = RegExp(
            /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
          );

          if (regex.test(username)) {
            username = encodeURI(username);
          }

          const user = await client.resolveUser(username, message.guild);
          if (user) {
            // Check if the user is a bot
            if (user.bot) {
              return m.edit(e.error + " | Cet utilisateur est un bot !");
            }

            await client.db.query(
              `SELECT \`mcName\`, \`uuid\`, \`verif\` FROM \`bot_users\` WHERE userID = '${user.id}';`,
              async function (err, result, fields) {
                if (err)
                  return message.channel.send(
                    e.error +
                      " | Une erreur est survenue ! Veuillez réessayer !"
                  );
                const usersString = JSON.stringify(result),
                  usersParse = JSON.parse(usersString),
                  dataUser = usersParse[0];

                if (!dataUser) {
                  await client.db.query(
                    `INSERT INTO \`bot_users\` (\`userID\`) VALUES ('${user.id}');`,
                    async function (err, result, fields) {
                      if (err)
                        return message.channel.send(
                          e.error +
                            " | Une erreur est survenue ! Veuillez réessayer !"
                        );
                      return m.edit(
                        e.error +
                          " | Ce compte Discord n'a pas lié son compte Minecraft !"
                      );
                    }
                  );
                } else {
                  if (dataUser.uuid && dataUser.mcName && dataUser.verif == 3) {
                    await generateEmbed(
                      dataUser.uuid,
                      dataUser.mcName,
                      data,
                      m,
                      message
                    );
                  } else {
                    return m.edit(
                      e.error +
                        " | Ce compte Discord n'a pas lié son compte Minecraft !"
                    );
                  }
                }
              }
            );
          } else {
            const name = encodeURI(args[0]),
              nameToUUID = await function (name, cb) {
                const nameArray = [name];
                request.post(
                  "https://api.mojang.com/profiles/minecraft",
                  { json: true, body: nameArray },
                  function (err, res, body) {
                    cb(null, body);
                  }
                );
              };

            await nameToUUID(name, async function (err, res) {
              if (err) console.log(err);
              else {
                if (res[0]) {
                  if (!res[0].id || !res[0].name)
                    return m.edit(e.error + " | Une erreur est survenue...");
                  await generateEmbed(res[0].id, res[0].name, data, m, message);
                } else {
                  m.edit(e.error + " | Ce compte Minecraft n'existe pas !");
                }
              }
            });
          }
        }
      }
    );
  }
}

module.exports = Skin;
