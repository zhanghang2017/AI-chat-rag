import { app } from "./app";

const port = Number(process.env.PORT || 3001);

// Single process HTTP entrypoint.
app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
