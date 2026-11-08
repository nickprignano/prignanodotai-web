import assert from "node:assert/strict";
import { test } from "node:test";
import { liveGames, parseGames } from "./games.ts";

const game = { id: "pinball", name: "Pinball", url: "https://pinball.prignano.ai", description: "Flippers.", status: "live" };

test("only live games are shown, in file order", () => {
  const games = parseGames([
    game,
    { id: "chess", name: "Chess", url: "https://chess.prignano.ai", description: "Chess.", status: "hidden" },
    { id: "flappy", name: "Flappy", description: "Flap.", status: "hidden" },
    { id: "tetra", name: "Tetra", url: "https://tetra.prignano.ai", description: "Blocks.", status: "live" },
  ]);
  assert.deepEqual(liveGames(games).map((g) => g.id), ["pinball", "tetra"]);
});

test("a hidden game needs no url, and an empty image means line art", () => {
  const [g] = parseGames([{ id: "flappy", name: "Flappy", url: "", image: "", description: "Flap.", status: "hidden" }]);
  assert.equal(g.url, null);
  assert.equal(g.image, null);
});

test("rejects bad entries with the entry and field named", () => {
  assert.throws(() => parseGames({}), /must be a list/);
  assert.throws(() => parseGames([{ ...game, url: "" }]), /entry 1: "url" is required when "status" is live/);
  assert.throws(() => parseGames([{ ...game, url: "javascript:alert(1)" }]), /"url" must start with https/);
  assert.throws(() => parseGames([{ ...game, status: "soon" }]), /"status" must be one of: live, hidden/);
  assert.throws(() => parseGames([{ ...game, status: undefined }]), /"status" is required/);
  assert.throws(() => parseGames([game, game]), /entry 2: "id" "pinball" is used twice/);
  assert.throws(() => parseGames([{ ...game, image: "pinball.png" }]), /"image" must start/);
  assert.throws(() => parseGames([{ ...game, name: "" }]), /"name" is required/);
});
