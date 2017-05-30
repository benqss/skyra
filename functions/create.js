const RethinkDB = require("./rethinkDB.js");
const GuildManager = require("../utils/guildManager.js");

/* eslint-disable no-use-before-define */
class Create {
  constructor(client) {
    Object.defineProperty(this, "client", { value: client });
  }

  async CreateUser(user) {
    const data = userProfileData(user);
    await RethinkDB.add("users", data);
    this.client.cacheProfiles.set(user, data);
  }

  async CreateMemberScore(member) {
    const data = { id: member.id, score: 0 };
    await RethinkDB.append("localScores", member.guild.id, "scores", data);
    this.client.locals.get(member.guild.id).set(member.id, data);
  }
}

exports.init = async (client) => {
  client.Create = Create;
  client.cacheProfiles = new client.methods.Collection();
  client.locals = new client.methods.Collection();
  const [guild, users, locals, moderation] = await Promise.all([
    RethinkDB.all("guilds"),
    RethinkDB.all("users"),
    RethinkDB.all("localScores"),
    RethinkDB.all("moderation"),
  ]);
  guild.forEach((guildData) => {
    const mutes = this.handleMutes(guildData.id, moderation);
    Object.assign(guildData, { mutes });
    GuildManager.set(guildData.id, guildData);
  });
  users.forEach(userData => client.cacheProfiles.set(userData.id, userData));
  locals.forEach((g) => {
    client.locals.set(g.id, new client.methods.Collection());
    g.scores.forEach(u => client.locals.get(g.id).set(u.id, u));
  });
};

exports.handleMutes = (gID, moderation) => {
  const mod = moderation.find(guild => guild.id === gID);
  if (!mod || !mod.cases) return [];
  return mod.cases.filter(c => c.type === "mute" && c.appeal !== true) || [];
};

const userProfileData = user => ({
  id: user,
  points: 0,
  color: "ff239d",
  money: 0,
  timeDaily: null,
  reputation: 0,
  quote: null,
  banners: {
    theme: "0001",
    level: "1001",
  },
});
