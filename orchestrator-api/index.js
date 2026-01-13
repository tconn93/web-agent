const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/agents', (req, res) => {
  const agents = [
    { id: 1, name: 'Agent 1' },
    { id: 2, name: 'Agent 2' },
  ];
  res.json(agents);
});

app.post('/api/agents/:id/deploy', (req, res) => {
  const agentId = req.params.id;
  console.log(`Deploying agent ${agentId}`);
  res.json({ message: `Agent ${agentId} deployment started` });
});


app.listen(port, () => {
  console.log(`Orchestrator API listening at http://localhost:${port}`);
});
