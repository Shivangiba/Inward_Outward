const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const token = jwt.sign(
    {
        userId: 23,
        username: 'test@gmail.com',
        role: 'admin',
        teamId: 3,
    },
    JWT_SECRET
);

console.log('Generated token:', token);

const decoded = jwt.verify(token, JWT_SECRET);
console.log('Decoded:', decoded);

let teamId = null;
const rawTeamId = decoded.teamId ?? decoded.TeamID ?? decoded.team_id;

if (rawTeamId !== undefined && rawTeamId !== null) {
    const parsed = parseInt(String(rawTeamId), 10);
    if (!isNaN(parsed)) {
        teamId = parsed;
    }
}
console.log('Parsed teamId:', teamId);
