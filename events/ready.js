const Discord = require("discord.js");
const logs = require("discord-logs");
const c = require("../config.js");

module.exports = class {
  constructor(client) {
    this.client = client;
  }

  async run() {
    const client = this.client;
    logs(client);



    // Logs some informations using the logger file
    client.logger.log(
      `Loading a total of ${client.commands.size} command(s).`,
      "log"
    );

    client.apiVerif(client);

    client.logger.log(`${client.user.tag}, ready to serve CraftBurg`, "ready");

    await client.db.query(
      `SELECT * FROM \`bot_config\` WHERE id = 1;`,
      async function (err, result, fields) {
        if (err) throw err;
        const string = JSON.stringify(result);
        const parse = JSON.parse(string);
        const dbData = parse[0];

        if (dbData.logsChannel) {
          if (client.channels.cache.get(dbData.logsChannel)) {
            client.on("voiceChannelJoin", (member, channel) => {
              const embed = new Discord.MessageEmbed()
                .setAuthor(
                  member.user.tag + " (" + member.user.id + ")",
                  member.user.displayAvatarURL()
                )
                .setColor("#07db31")
                .setFooter(c.embed.footer)
                .addField(
                  `**${member.user.tag}** vient de rejoindre le channel \`${channel.name}\``,
                  `ID du channel : \`${channel.id}\``
                )
                .setTimestamp();
              client.channels.cache.get(dbData.logsChannel).send(embed);
            });

            client.on("voiceChannelLeave", (member, channel) => {
              const embed = new Discord.MessageEmbed()
                .setAuthor(
                  member.user.tag + " (" + member.user.id + ")",
                  member.user.displayAvatarURL()
                )
                .setColor("#d91818")
                .setFooter(c.embed.footer)
                .addField(
                  `**${member.user.tag}** vient de quitté le channel \`${channel.name}\``,
                  `ID du channel : \`${channel.id}\``
                )
                .setTimestamp();
              client.channels.cache.get(dbData.logsChannel).send(embed);
            });

            client.on(
              "voiceChannelSwitch",
              (member, oldChannel, newChannel) => {
                const embed = new Discord.MessageEmbed()
                  .setAuthor(
                    member.user.tag + " (" + member.user.id + ")",
                    member.user.displayAvatarURL()
                  )
                  .setColor("#07db31")
                  .setFooter(c.embed.footer)
                  .addField(
                    `${member.user.tag} vient de changé de channel \`${oldChannel.name}\` => \`${newChannel.name}\``,
                    `ID de l'ancien channel : \`${oldChannel.id}\`\nID du nouveau channel : \`${newChannel.id}\``
                  )
                  .setTimestamp();
                client.channels.cache.get(dbData.logsChannel).send(embed);
              }
            );

            client.on(
              "userUsernameUpdate",
              (user, oldUsername, newUsername) => {
                console.log(" username updated!");
                const embed = new Discord.MessageEmbed()
                  .setAuthor(
                    user.tag + " (" + user.id + ")",
                    user.displayAvatarURL()
                  )
                  .setColor("#07db31")
                  .setFooter(c.embed.footer)
                  .addTitle(
                    `Le surnom de ${user.tag} vient de changé \`${oldUsername}\` => \`${newUsername}\``
                  )
                  .setTimestamp();

                client.channels.cache.get(dbData.logsChannel).send(embed);
              }
            );
          }
        }
      }
    );
  }
};
