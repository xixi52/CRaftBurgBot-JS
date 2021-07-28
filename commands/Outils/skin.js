const Command = require("../../structures/Command.js"),
  request = require("request"),
  fetch = require("node-fetch"),
  Discord = require("discord.js");

const generateEmbed = async (uuid, name, data, m) => {
  try {
    // Fetch data from paladium server
    let res = await fetch(
        "https://api.mojang.com/user/profiles/" + uuid + "/names"
      ),
      body = await res.json();

    let embed = new Discord.MessageEmbed()
      .setAuthor(name, "https://cravatar.eu/avatar/" + name + "/190.png")
      .setTitle("Télécharger le skin de " + name + " !")
      .setURL("https://minotar.net/download/" + name)
      .setThumbnail("https://minotar.net/helm/" + name + "/190.png")
      .setImage(
        "https://minecraftskinstealer.com/api/v1/skin/render/fullbody/" +
          name +
          "/700"
      )
      .addField(
        "Historique des noms d'utilisateur",
        body.map((v) => "• " + v.name).join("\n")
      )
      .setFooter(data.config.embed.footer)
      .setColor(data.config.embed.color)
      .setTimestamp();

    m.channel.send(embed);
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
      memberPermissions: [],
      botPermissions: ["EMBED_LINKS"],
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000,
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
              const string = JSON.stringify(result);
              const parse = JSON.parse(string);
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
                await generateEmbed(uuid, mcName, data, m);
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

          let regex = RegExp(
            /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
          );

          if (regex.test(username)) {
            username = encodeURI(username);
          }

          let user = await client.resolveUser(username, message.guild);
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
                const usersString = JSON.stringify(result);
                const usersParse = JSON.parse(usersString);
                const dataUser = usersParse[0];

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
                          " | Veuillez entrer un pseudo Minecraft, un pseudo Discord, ou lier votre compte Minecraft !\nExemple: `" +
                          client.config.prefix +
                          "minecraft xixi52`"
                      );
                    }
                  );
                } else {
                  if (dataUser.uuid && dataUser.mcName && dataUser.verif == 3) {
                    await generateEmbed(
                      dataUser.uuid,
                      dataUser.mcName,
                      data,
                      m
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
            let name = encodeURI(args[0]),
              nameToUUID = await function (name, cb) {
                let nameArray = [name];
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
                  await generateEmbed(res[0].id, res[0].name, data, m);
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
