const { executeSpin } = require('../src/utils/mathEngine');
const { SYMBOLS } = require('../src/utils/symbols');

// Mock setup for Node environment
global.Math.random = Math.random;

function runSimulation(iterations = 100000, gameMode = 'classic', bet = 100) {
  let totalBet = 0;
  let totalWin = 0;
  let spinsCount = 0;
  let freeSpinsCount = 0;

  console.log(`--- Running Simulation: ${gameMode.toUpperCase()} | Iterations: ${iterations} ---`);

  for (let i = 0; i < iterations; i++) {
    totalBet += bet;
    spinsCount++;

    const result = executeSpin(bet, false, 0, gameMode, false, i);
    totalWin += result.totalWin;

    // Handle Free Spins awarded
    if (result.freeSpinsAwarded > 0) {
      let fsRemaining = result.freeSpinsAwarded;
      let fsIndex = 0;
      while (fsRemaining > 0) {
        fsRemaining--;
        freeSpinsCount++;
        const fsResult = executeSpin(bet, true, 0, gameMode, false, fsIndex++);
        totalWin += fsResult.totalWin;
        if (fsResult.freeSpinsAwarded > 0) {
          fsRemaining += fsResult.freeSpinsAwarded;
        }
      }
    }

    if (i % (iterations / 10) === 0 && i > 0) {
      console.log(`Progress: ${(i / iterations * 100).toFixed(0)}% | Current RTP: ${(totalWin / totalBet * 100).toFixed(2)}%`);
    }
  }

  const rtp = (totalWin / totalBet) * 100;
  console.log(`\nFinal Results for ${gameMode.toUpperCase()}:`);
  console.log(`Total Spins: ${spinsCount}`);
  console.log(`Total Free Spins Played: ${freeSpinsCount}`);
  console.log(`Total Bet: ${totalBet.toFixed(2)}`);
  console.log(`Total Win: ${totalWin.toFixed(2)}`);
  console.log(`RTP: ${rtp.toFixed(2)}%`);
  return rtp;
}

// Note: This script needs the mathEngine to be exported in a way Node can read it.
// Since the project is ESM/TS, we might need ts-node or run it via the dev server.
// For now, I'll just output the logic.
