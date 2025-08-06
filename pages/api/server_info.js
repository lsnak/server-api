import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
});

let isReady = false;
let guildCache = null;

async function initClient() {
  if (isReady) return;
  await client.login(process.env.DISCORD_TOKEN);
  client.once('ready', async () => {
    guildCache = await client.guilds.fetch(process.env.GUILD_ID);
    isReady = true;
  });
}

export default async function handler(req, res) {
  if (!isReady) {
    await initClient();
    if (!isReady) {
      return res.status(503).json({ error: 'Server is initializing, please try again later.' });
    }
  }

  try {
    const guild = guildCache;
    const members = await guild.members.fetch();
    const onlineCount = members.filter(
      (member) => member.presence && member.presence.status !== 'offline'
    ).size;
    const owner = await guild.fetchOwner();

    res.status(200).json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ dynamic: true, size: 256 }),
      description: guild.description || null,
      createdAt: guild.createdAt,
      memberCount: members.size,
      onlineCount,
      ownerId: owner.id,
      ownerTag: owner.user.tag,
      boostCount: guild.premiumSubscriptionCount,
      boostLevel: guild.premiumTier,
      roles: guild.roles.cache.map((role) => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position,
      })),
      emojis: guild.emojis.cache.map((emoji) => ({
        id: emoji.id,
        name: emoji.name,
        animated: emoji.animated,
        url: emoji.url,
      })),
      channels: guild.channels.cache.map((channel) => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
      })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch server information.' });
  }
}
