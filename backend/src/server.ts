import app from "./app";
import 'dotenv/config';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const PORT = process.env.PORT || 8081;

console.log('process.env.PORT type:', typeof process.env.PORT, 'value:', process.env.PORT);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
