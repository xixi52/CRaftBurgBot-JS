const c = require("../config.js"),
  e = c.emojis,
  cmdCooldown = {};

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run(message) {
    const client = this.client,
      data = {};

    data.config = c;

    // If the messagr author is a bot
    if (message.author.bot) {
      return;
    }

    // If the member on a guild is invisible or not cached, fetch them.
    if (message.guild && !message.member) {
      await message.guild.members.fetch(message.author.id);
    }

    // Check if the bot was mentionned
    if (message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) {
      return message.channel.send(
        `Bonjour, ${message.author} ! Obtiens la liste des commandes grâce à \`${c.prefix}help\``
      );
    }

    // Gets the prefix
    let prefix = c.prefix;

    if (!message.content.toLowerCase().startsWith(prefix.toLowerCase())) {
      await client.db.query(
        `SELECT * FROM \`bot_users\` WHERE userID = '${message.author.id}';`,
        async function (err, result, fields) {
          if (err) throw err;
          const string = JSON.stringify(result);
          const parse = JSON.parse(string);
          const userData = parse[0];

          if (!userData) {
            await client.db.query(
              `INSERT INTO \`bot_users\` (\`id\`, \`userID\`, \`messages\`) VALUES (NULL, '${message.author.id}', '1');`,
              function (err, result, fields) {
                if (err) throw err;
              }
            );
          } else {
            if(message.channel.type !== "dm") {
              const messages = userData.messages;
              let total = 0;
  
              if (messages) {
                total = Number(messages) + 1;
                let badge = null;
                if (total === 100) badge = "bronze";
                if (total === 1000) badge = "silver";
                if (total === 2500) badge = "gold";
                if (total === 10000) badge = "diamond";
                await client.db.query(
                  `SELECT * FROM \`bot_config\` WHERE id = 1;`,
                  async function (err, result2, fields) {
                    if (err) throw err;
                    const string2 = JSON.stringify(result2);
                    const parse2 = JSON.parse(string2);
                    const configData = parse2[0];
                    const channel = configData.rankChannel;
                    if (channel && badge) {
                      let desc = "Envoyer " + total + " messages !";
                      const channel = client.channels.cache.get(
                        configData.rankChannel
                      );
                      await client.achievement(
                        channel,
                        "bubble_" + badge,
                        desc,
                        message.author
                      );
                    }
                  }
                );
  
                await client.db.query(
                  `UPDATE bot_users SET messages = '${total}' WHERE userID = '${message.author.id}';`,
                  function (err, result, fields) {
                    if (err) return;
                  }
                );
              }
            }
          }
          if (message.channel.type === "dm" && userData.verif == 2) {
            const content = message.content.toLowerCase();
            if (content === "oui verif" || content === "non verif") {
              let verifValue, messageVerif;
              content === "oui verif" ? (verifValue = 3) : (verifValue = 0);
              await client.db.query(
                `UPDATE bot_users SET codeVerif = NULL, verif = '${verifValue}' WHERE userID = '${message.author.id}';`,
                function (err, result, fields) {
                  if (err) return;
                }
              );
              verifValue == 3
                ? (messageVerif =
                    " | Votre compte a été vérifié et lié au compte Minecraft **" +
                    userData.mcName +
                    "** (**" +
                    userData.uuid +
                    "**) avec succès!")
                : (messageVerif =
                    " | La vérification de votre compte a été annulée, pour la reprendre rendez-vous sur le serveur Discord de CraftBurg https://discord.gg/" +
                    c.invite +
                    " et entrez la commande `" +
                    c.prefix +
                    "verif` dans le salon <#" +
                    c.channels.commands +
                    ">");
              message.author.send(c.emojis.success + messageVerif);
            }
          }
        }
      );
      return;
    }

    let args = message.content
      .slice(typeof prefix === "string" ? prefix.length : 0)
      .trim()
      .split(/ +/g);
    let command = args.shift().toLowerCase();
    let cmd =
      client.commands.get(command) ||
      client.commands.get(client.aliases.get(command));

    if (!cmd) {
      await client.db.query(
        `SELECT * FROM \`bot_users\` WHERE userID = '${message.author.id}';`,
        async function (err, result, fields) {
          if (err) throw err;
          const string = JSON.stringify(result);
          const parse = JSON.parse(string);
          const userData = parse[0];

          if (!userData) {
            await client.db.query(
              `INSERT INTO \`bot_users\` (\`id\`, \`userID\`, \`messages\`) VALUES (NULL, '${message.author.id}', '1');`,
              function (err, result, fields) {
                if (err) throw err;
              }
            );
          } else {
            const messages = userData.messages;
            let total = 0;

            if (messages) {
              total = Number(messages);
            }

            await client.db.query(
              `UPDATE bot_users SET messages = '${total + 1}' WHERE userID = '${
                message.author.id
              }';`,
              function (err, result, fields) {
                if (err) return;
              }
            );
          }
        }
      );
      return;
    }
    if (cmd.conf.guildOnly && !message.guild) {
      return message.channel.send(
        `${e.error} | Cette commande est uniquement disponible sur un serveur !`
      );
    }

    if (message.guild) {
      let neededPermission = [];
      if (!cmd.conf.botPermissions.includes("EMBED_LINKS")) {
        cmd.conf.botPermissions.push("EMBED_LINKS");
      }
      cmd.conf.botPermissions.forEach((perm) => {
        if (!message.channel.permissionsFor(message.guild.me).has(perm)) {
          neededPermission.push(perm);
        }
      });
      if (neededPermission.length > 0) {
        let permsList = neededPermission.map((p) => `\`${p}\``).join(", ");
        return message.channel.send(
          `${e.error} | J'ai besoin des permissions suivantes pour effectuer cette commande : \`${permsList}\``
        );
      }
      neededPermission = [];
      cmd.conf.memberPermissions.forEach((perm) => {
        if (!message.channel.permissionsFor(message.member).has(perm)) {
          neededPermission.push(perm);
        }
      });
      if (neededPermission.length > 0 && message.author.id !== c.owner.id) {
        let permsList = neededPermission.map((p) => `\`${p}\``).join(", ");
        return message.channel.send(
          `${e.error} | Vous n'avez pas les permissions nécessaires pour effectuer cette commande (\`${permsList}\`)`
        );
      }
      if (cmd.conf.permission) {
        if (
          !message.member.hasPermission(cmd.conf.permission) &&
          message.author.id !== c.owner.id
        ) {
          return message.channel.send(
            `${e.error} | Vous n'avez pas les permissions nécessaires pour effectuer cette commande (\`${cmd.conf.permission}\`)`
          );
        }
      }

      if (
        !message.channel
          .permissionsFor(message.member)
          .has("MENTION_EVERYONE") &&
        (message.content.includes("@everyone") ||
          message.content.includes("@here"))
      ) {
        return message.channel.send(
          `${e.error} | Vous n'avez pas l'autorisation de mentionner everyone ou here dans les commandes.`
        );
      }

      if (!message.channel.nsfw && cmd.conf.nsfw) {
        return message.channel.send(
          `${e.error} | Vous devez vous rendre dans un salon qui autorise le NSFW pour taper cette commande !`
        );
      }
    }

    if (!cmd.conf.enabled) {
      return message.channel.send(
        `${e.error} | Cette commande est actuellement désactivée !`
      );
    }

    if (cmd.conf.ownerOnly && message.author.id !== client.config.owner.id) {
      return message.channel.send(
        `${e.error} | Seul ${c.owner.name} peut effectuer ces commandes !`
      );
    }

    if (c.maintenance && message.author.id !== client.config.owner.id)
      return message.channel.send(`${e.error} | Je suis est en maintenance !`);

    let uCooldown = cmdCooldown[message.author.id];
    if (!uCooldown) {
      cmdCooldown[message.author.id] = {};
      uCooldown = cmdCooldown[message.author.id];
    }
    let time = uCooldown[cmd.help.name] || 0;
    if (time && time > Date.now()) {
      return message.channel.send(
        `${e.error} | Vous devez attendre **${Math.ceil(
          (time - Date.now()) / 1000
        )}** seconde(s) pour pouvoir de nouveau effectuer cette commande !`
      );
    }
    cmdCooldown[message.author.id][cmd.help.name] =
      Date.now() + cmd.conf.cooldown;

    client.db.query(
      `INSERT INTO \`bot_logs\` (\`id\`, \`guildID\`, \`authorID\`, \`type\`, \`action\`, \`date\`) VALUES (NULL, '${
        message.guild.id
      }', '${message.author.id}', 'cmd', '${cmd.help.name}', '${Date.now()}');`,
      function (err, result, fields) {
        if (err) throw err;
      }
    );

    client.db.query(
      `SELECT * FROM \`bot_users\` WHERE userID = '${message.author.id}';`,
      async function (err, result, fields) {
        if (err) throw err;

        const string = JSON.stringify(result);
        const parse = JSON.parse(string);
        const userData = parse[0];
        if (!userData) {
          await client.db.query(
            `INSERT INTO \`bot_users\` (\`id\`, \`userID\`, \`commandes\`) VALUES (NULL, '${message.author.id}', '1');`,
            function (err, result, fields) {
              if (err) throw err;
            }
          );
        } else {
          const commandes = userData.commandes;
          let total = 0;

          if (userData) {
            total = Number(commandes) + 1;
            let badge = null;
            if (total === 10) badge = "bronze";
            if (total === 100) badge = "silver";
            if (total === 500) badge = "gold";
            if (total === 1000) badge = "diamond";
            await client.db.query(
              `SELECT * FROM \`bot_config\` WHERE id = 1;`,
              async function (err, result2, fields) {
                if (err) throw err;
                const string2 = JSON.stringify(result2);
                const parse2 = JSON.parse(string2);
                const configData = parse2[0];
                const channel = configData.rankChannel;
                if (channel && badge) {
                  let desc = "Utiliser " + total + " fois CraftBurg Bot !";
                  const channel = client.channels.cache.get(
                    configData.rankChannel
                  );
                  await client.achievement(
                    channel,
                    "bot_" + badge,
                    desc,
                    message.author
                  );
                }
              }
            );

            await client.db.query(
              `UPDATE bot_users SET commandes = '${total}' WHERE userID = '${message.author.id}';`,
              function (err, result, fields) {
                if (err) return;
              }
            );
          }
        }
      }
    );

    client.logger.log(
      `${message.author.username} (${message.author.id}) ran command ${cmd.help.name}`,
      "cmd"
    );

    try {
      cmd.run(message, args, data);
    } catch (e) {
      console.error(e);
      return message.channel.send(
        `${e.error} | Une erreur est survenue, veuillez réessayez dans quelques minutes.`
      );
    }
  }
};
