const bcrypt = require('bcryptjs');

const users = [
    { username: 'manager_maria', password: 'admin123', role: 'admin' },
    { username: 'baker_juan', password: 'staff123', role: 'staff' },
    { username: 'cashier_ana', password: 'user123', role: 'user' }
];
const rounds = 10;

async function generateHashes() {
    console.log('BakeSync Password Hash Generator');
    console.log('=================================\n');
    console.log('Generating bcrypt hashes (rounds=10):\n');

    const insertValues = [];

    for (const user of users) {
        const hash = await bcrypt.hash(user.password, rounds);
        console.log(`${user.username} (${user.password}): ${hash}`);
        insertValues.push(`('${user.username}', '${hash}', '${user.role}')`);
    }

    console.log('\n--- SQL INSERT Statement ---\n');
    console.log('DELETE FROM files;');
    console.log('DELETE FROM users;');
    console.log('INSERT INTO users (username, password_hash, role) VALUES');
    console.log(insertValues.join(',\n') + ';');
    console.log('\n--- End SQL ---\n');
}

generateHashes();
