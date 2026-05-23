import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <main className="mx-auto w-full max-w-3xl flex-1 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
