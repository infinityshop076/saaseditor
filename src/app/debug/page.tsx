export default function DebugPage() {
  const envData = {
    hasClerkKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
    hasPostgres: !!process.env.POSTGRES_URL,
    hasReplicate: !!process.env.REPLICATE_API_TOKEN,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Env</h1>
      <pre>{JSON.stringify(envData, null, 2)}</pre>
      <h2>Keys:</h2>
      <ul>
        {Object.keys(process.env).map(k => (
          <li key={k}>{k}</li>
        ))}
      </ul>
    </div>
  );
}
