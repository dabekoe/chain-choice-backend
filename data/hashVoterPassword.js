const bcrypt = require('bcryptjs');

const password = 'voter123'; // change this to your desired password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) throw err;
  console.log('Hashed Password:', hash);
});
