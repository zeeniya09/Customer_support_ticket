export default function Loader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh',
    }}>
      <div style={{
        width: 48, height: 48, border: '4px solid #e2e8f0',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
