export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-orange-500" />
        <p className="text-sm text-gray-500">Loading VentureLift...</p>
      </div>
    </div>
  );
}
