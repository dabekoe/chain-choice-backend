const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const votersFile = path.join(__dirname, 'data/voters.json');

// ✅ List of voters to create
const rawVoters = [
  { id: 1, email: 'voter1@example.com', password: 'voter123' },
  { id: 2, email: 'voter2@example.com', password: 'vote456' },
  { id: 3, email: 'voter3@example.com', password: 'password789' }
];

async function hashVoters(voters) {
  const saltRounds = 10;

  const hashedVoters = await Promise.all(
    voters.map(async (voter) => {
      const hashedPassword = await bcrypt.hash(voter.password, saltRounds);
      return {
        id: voter.id,
        email: voter.email,
        password: hashedPassword
      };
    })
  );

  fs.writeFileSync(votersFile, JSON.stringify(hashedVoters, null, 2));
  console.log('Voters with hashed passwords saved to voters.json');
}

hashVoters(rawVoters);
