const Command = require("../../structures/Command.js"),
  Discord = require("discord.js");

class Help extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      dirname: __dirname,
      enabled: true,
      guildOnly: false,
      aliases: ["aide"],
      examples: "$help\n$help verif",
      usage: "help (commande)",
      desc: "Affiche cette page!",
      memberPermissions: [],
      botPermissions: ["EMBED_LINKS"],
      nsfw: false,
      ownerOnly: false,
      cooldown: 5000,
    });
  }

  async run(message, args, data) {
    const e = data.config.emojis;
    // if a command is provided
    if (args[0]) {
      // if the command doesn't exist, error message
      const cmd =
        message.client.commands.get(args[0]) ||
        message.client.commands.get(message.client.aliases.get(args[0]));
      if (!cmd) {
        return message.channel.send(
          e.error + " | Commande " + args[0] + " introuvable !"
        );
      }

      // Replace $ caract with the server prefix
      let examples = cmd.help.examples.replace(/[$]/g, data.config.prefix);

      // Creates the help embed
      let groupEmbed = new Discord.MessageEmbed()
        .setAuthor("Aide : " + cmd.help.name)
        .addField(e.help + "Utilisation :", data.config.prefix + cmd.help.usage)
        .addField(e.search + "Exemples :", examples)
        .addField(e.folder + "Groupe :", cmd.help.category)
        .addField(e.desc + "Description :", cmd.help.desc)
        .addField(
          e.add + "Alias :",
          cmd.conf.aliases.length > 0
            ? cmd.conf.aliases.map((a) => "`" + a + "`").join("\n")
            : "Aucun alias."
        )
        .addField(
          e.crown + "Permissions :",
          cmd.conf.ownerOnly
            ? "`OWNER`"
            : cmd.conf.memberPermissions.length > 0
            ? cmd.conf.memberPermissions.map((a) => "`" + a + "`").join(", ")
            : "`EVERYONE`"
        )
        .setColor(data.config.embed.color)
        .setFooter(
          "Demandé par " +
            message.author.username +
            " | CraftBurg.fr | Fondé par xixi52 avec \uD83E\uDDE1",
          message.author.avatarURL()
        );

      // and send the embed in the current channel
      return message.channel.send(groupEmbed);
    }

    const categories = [];
    const commands = message.client.commands;

    commands.forEach((command) => {
      if (!categories.includes(command.help.category)) {
        if (
          command.help.category === "Owner" &&
          message.author.id !== message.client.config.owner.id
        ) {
          return;
        }
        categories.push(command.help.category);
      }
    });

    let embed = new Discord.MessageEmbed()
      .setDescription(
        "● Pour avoir de l'aide sur une commande tapez `" +
          data.config.prefix +
          "help <commande>` !"
      )
      .setColor(data.config.embed.color)
      .setFooter(
        "Demandé par " +
          message.author.username +
          " | CraftBurg.fr | Fondé par xixi52 avec \uD83E\uDDE1",
        message.author.avatarURL()
      );
    categories.sort().forEach((cat) => {
      let tCommands = commands.filter((cmd) => cmd.help.category === cat);
      embed.addField(
        e.categories[cat.toLowerCase()] +
          " " +
          cat +
          " - (" +
          tCommands.size +
          ")",
        tCommands.map((cmd) => "`" + cmd.help.name + "`").join(", ")
      );
    });
    embed.addField("\u200B", "[Site](https://www.craftburg.fr)");
    embed.setAuthor(
      "CraftBurg.fr | Commandes",
      message.client.user.displayAvatarURL()
    );
    return message.channel.send(embed);
  }
}

module.exports = Help;
