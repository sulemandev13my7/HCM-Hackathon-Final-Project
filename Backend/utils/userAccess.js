const canDeactivateUser = (actorId, targetId, targetRole) =>
  actorId.toString() !== targetId.toString() && targetRole !== "admin";

module.exports = { canDeactivateUser };
