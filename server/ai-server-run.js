import app from './ai-server.js';

const port = process.env.AI_SERVER_PORT || 4001;
app.listen(port, () => console.log(`AI proxy server listening on port ${port}`));
